# agent/biodental_client.py — Cliente de la API real de Biodental

"""
El agente no tiene base de datos propia de pacientes/citas: todo lo real
vive en el backend de Biodental (Node/Express + MySQL). Este cliente se
autentica como una cuenta de servicio (rol "recepcionista", sin privilegios
de administrador) y llama exactamente los mismos endpoints que usa el
frontend de staff — mismas reglas de disponibilidad, mismos conflictos de
horario, misma validación.

La cuenta de servicio se crea una sola vez en la base de datos (no hay
endpoint para crearla desde aquí); sus credenciales viven en .env
(BIODENTAL_AGENT_EMAIL / BIODENTAL_AGENT_PASSWORD).
"""

import os
import time
import asyncio
import logging
import httpx
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("agentkit")

# TTL del caché en memoria de doctores/servicios: son datos que casi no
# cambian (el consultorio los edita desde la app, no varían por mensaje),
# así que no vale la pena pedirlos de nuevo a la API en cada turno de cada
# conversación — mucho menos gastar una llamada a OpenAI para eso.
CACHE_TTL_SEGUNDOS = int(os.getenv("BIODENTAL_CACHE_TTL", "300"))


class ErrorBiodentalAPI(Exception):
    """Error controlado devuelto por la API de Biodental (400/404/409/etc)."""

    def __init__(self, mensaje: str, status_code: int = 500, code: str | None = None):
        super().__init__(mensaje)
        self.mensaje = mensaje
        self.status_code = status_code
        self.code = code


class ClienteBiodental:
    """Cliente HTTP hacia la API de Biodental, con login y reintento automático."""

    def __init__(self):
        self.base_url = os.getenv("BIODENTAL_API_URL", "http://localhost:8081/api").rstrip("/")
        self.email = os.getenv("BIODENTAL_AGENT_EMAIL")
        self.password = os.getenv("BIODENTAL_AGENT_PASSWORD")
        self._token: str | None = None
        self._cache: dict[str, tuple[float, object]] = {}
        # brain.py dispara buscar_paciente/listar_doctores/listar_servicios
        # en paralelo (asyncio.gather) en cada mensaje — sin este lock, las
        # 3 verían self._token en None a la vez y cada una haría su propio
        # login innecesario.
        self._login_lock = asyncio.Lock()

    def _cache_get(self, clave: str):
        entrada = self._cache.get(clave)
        if not entrada:
            return None
        expira_en, valor = entrada
        if time.monotonic() > expira_en:
            del self._cache[clave]
            return None
        return valor

    def _cache_set(self, clave: str, valor):
        self._cache[clave] = (time.monotonic() + CACHE_TTL_SEGUNDOS, valor)

    async def _login(self) -> str:
        if not self.email or not self.password:
            raise ErrorBiodentalAPI(
                "BIODENTAL_AGENT_EMAIL / BIODENTAL_AGENT_PASSWORD no configurados en .env", 500
            )

        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                f"{self.base_url}/auth/login",
                json={"email": self.email, "password": self.password},
            )

        if r.status_code != 200:
            detalle = self._extraer_mensaje(r)
            raise ErrorBiodentalAPI(f"No se pudo autenticar con Biodental: {detalle}", r.status_code)

        data = r.json()
        token = data.get("data", {}).get("token") or data.get("token")
        if not token:
            raise ErrorBiodentalAPI("Login a Biodental no devolvió token", 500)

        self._token = token
        return token

    @staticmethod
    def _extraer_mensaje(r: httpx.Response) -> str:
        try:
            data = r.json()
            return data.get("message") or f"HTTP {r.status_code}"
        except Exception:
            return f"HTTP {r.status_code}"

    async def _request(self, method: str, path: str, reintentando: bool = False, **kwargs) -> dict:
        if not self._token:
            async with self._login_lock:
                if not self._token:  # otra tarea ya pudo haber logueado mientras esperábamos el lock
                    await self._login()

        headers = {"Authorization": f"Bearer {self._token}"}

        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.request(method, f"{self.base_url}{path}", headers=headers, **kwargs)

        # Token expirado/revocado: reloguear una sola vez y reintentar
        if r.status_code == 401 and not reintentando:
            logger.info("Token de Biodental expirado, reautenticando…")
            self._token = None
            await self._login()
            return await self._request(method, path, reintentando=True, **kwargs)

        if r.status_code >= 400:
            try:
                data = r.json()
            except Exception:
                data = {}
            raise ErrorBiodentalAPI(
                data.get("message", self._extraer_mensaje(r)),
                r.status_code,
                data.get("code"),
            )

        return r.json() if r.content else {}

    # ── Pacientes ────────────────────────────────────────────────────

    async def buscar_paciente_por_telefono(self, telefono: str) -> dict | None:
        data = await self._request("GET", "/pacientes", params={"telefono": telefono})
        pacientes = data.get("data", {}).get("pacientes", [])
        return pacientes[0] if pacientes else None

    async def crear_paciente(
        self, nombre: str, apellidos: str, telefono: str, email: str, fecha_nacimiento: str
    ) -> dict:
        data = await self._request(
            "POST",
            "/pacientes",
            json={
                "nombre": nombre,
                "apellidos": apellidos,
                "telefono": telefono,
                "email": email,
                "fecha_nacimiento": fecha_nacimiento,
            },
        )
        return data.get("data", {})

    # ── Configuración en vivo (Perfil > Integraciones en la app) ──────

    async def obtener_configuracion_runtime(self) -> dict:
        """
        Trae la configuración que el admin capturó desde Integraciones en
        la app (API key de OpenAI, credenciales de YCloud, secreto de
        webhook) — así el agente no depende de tener todo hardcodeado en
        su propio .env y el admin puede rotar claves sin tocar el server
        del bot. Se cachea igual que doctores/servicios.
        """
        cacheado = self._cache_get("config_runtime")
        if cacheado is not None:
            return cacheado

        data = await self._request("GET", "/consultorio/asistente-whatsapp/credenciales")
        config = data.get("data", {})
        self._cache_set("config_runtime", config)
        return config

    # ── Doctores y servicios ────────────────────────────────────────

    async def listar_doctores(self) -> list[dict]:
        cacheado = self._cache_get("doctores")
        if cacheado is not None:
            return cacheado

        data = await self._request("GET", "/usuarios/doctores")
        doctores = data.get("data", {}).get("doctores", [])
        self._cache_set("doctores", doctores)
        return doctores

    async def listar_servicios(self) -> list[dict]:
        cacheado = self._cache_get("servicios")
        if cacheado is not None:
            return cacheado

        data = await self._request("GET", "/servicios", params={"activo": "true"})
        servicios = data.get("data", {}).get("servicios", [])
        self._cache_set("servicios", servicios)
        return servicios

    # ── Disponibilidad ───────────────────────────────────────────────

    async def consultar_disponibilidad(self, doctor_uuid: str, fecha: str) -> dict:
        # Nota: la ruta real es /horarios/disponibilidad/:doctor_uuid (el
        # comentario JSDoc de horariosController.js dice lo contrario y
        # está desactualizado respecto a routes/horarios.js).
        data = await self._request("GET", f"/horarios/disponibilidad/{doctor_uuid}", params={"fecha": fecha})
        return data.get("data", {})

    # ── Citas ─────────────────────────────────────────────────────────

    async def listar_citas_paciente(self, paciente_uuid: str) -> list[dict]:
        data = await self._request("GET", "/citas", params={"paciente_id": paciente_uuid})
        return data.get("data", {}).get("citas", [])

    async def crear_cita(
        self,
        paciente_uuid: str,
        doctor_uuid: str,
        fecha: str,
        hora_inicio: str,
        motivo: str | None = None,
        permitir_fuera_horario: bool = False,
        servicio_uuid: str | None = None,
    ) -> dict:
        body = {
            "paciente_uuid": paciente_uuid,
            "doctor_uuid": doctor_uuid,
            "fecha": fecha,
            "hora_inicio": hora_inicio,
            "tipo": "primera_vez",
        }
        if motivo:
            body["motivo"] = motivo
        if permitir_fuera_horario:
            body["permitir_fuera_horario"] = True
        if servicio_uuid:
            body["servicios_uuids"] = [servicio_uuid]

        data = await self._request("POST", "/citas", json=body)
        return data.get("data", {})

    async def actualizar_cita(self, cita_uuid: str, cambios: dict) -> dict:
        data = await self._request("PUT", f"/citas/{cita_uuid}", json=cambios)
        return data.get("data", {})


# Instancia compartida — reutiliza el token entre mensajes/turnos
cliente_biodental = ClienteBiodental()
