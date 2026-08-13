# agent/tools.py — Herramientas del agente: agendar, confirmar, reagendar

"""
Funciones que el modelo puede invocar (tool-calling) para hacer cosas
reales contra la API de Biodental. Cada función:
  - Recibe argumentos ya validados por el schema de OpenAI (ver TOOLS_SCHEMA).
  - Llama a `cliente_biodental` (agent/biodental_client.py).
  - Traduce errores de la API (400/404/409) a un texto en español que el
    modelo pueda reformular para el paciente, en vez de dejar pasar un
    stacktrace o un JSON crudo.

brain.py importa `TOOLS_SCHEMA` (para mandarlo a la API de OpenAI) y
`ejecutar_tool` (para correr la función correspondiente cuando el modelo
pide usarla).
"""

import logging
import re
from agent.biodental_client import cliente_biodental, ErrorBiodentalAPI

logger = logging.getLogger("agentkit")

_UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.IGNORECASE)


def _error(mensaje: str) -> dict:
    return {"error": mensaje}


def _validar_uuid(valor: str, campo: str, como_obtenerlo: str) -> str | None:
    """
    Defensa contra uuids inventados por el modelo (p. ej. 'ana-martinez-uuid'
    en vez del uuid real). Si no tiene forma de uuid, no se llama a la API
    — se le dice al modelo exactamente cómo obtener el valor correcto, en
    vez de dejar que llegue un 404 confuso desde el backend.
    """
    if not valor or not _UUID_RE.match(str(valor)):
        return f"El {campo} '{valor}' no es válido — parece inventado. {como_obtenerlo}"
    return None


async def buscar_o_identificar_paciente(telefono: str) -> dict:
    """Busca si el número de WhatsApp ya pertenece a un paciente registrado."""
    try:
        paciente = await cliente_biodental.buscar_paciente_por_telefono(telefono)
    except ErrorBiodentalAPI as e:
        return _error(f"No pude consultar el registro de pacientes: {e.mensaje}")

    if not paciente:
        return {"encontrado": False}

    return {
        "encontrado": True,
        "paciente_uuid": paciente["uuid"],
        "nombre": paciente["nombre"],
        "apellidos": paciente.get("apellidos", ""),
    }


async def registrar_paciente_nuevo(
    nombre: str, apellidos: str, telefono: str, email: str, fecha_nacimiento: str
) -> dict:
    """
    Crea un paciente nuevo. Biodental exige nombre, teléfono, correo y
    fecha de nacimiento (YYYY-MM-DD) — pide esos datos ANTES de llamar esta
    función si no los tienes todos.
    """
    try:
        paciente = await cliente_biodental.crear_paciente(
            nombre, apellidos, telefono, email, fecha_nacimiento
        )
    except ErrorBiodentalAPI as e:
        return _error(f"No pude registrar al paciente: {e.mensaje}")

    return {"paciente_uuid": paciente.get("uuid"), "registrado": True}


async def listar_doctores_disponibles() -> dict:
    """Lista los doctores del consultorio con su especialidad."""
    try:
        doctores = await cliente_biodental.listar_doctores()
    except ErrorBiodentalAPI as e:
        return _error(f"No pude consultar los doctores: {e.mensaje}")

    return {
        "doctores": [
            {
                "doctor_uuid": d["uuid"],
                "nombre": f"{d['nombre']} {d.get('apellidos', '')}".strip(),
                "especialidad": d.get("especialidad") or "Odontología general",
            }
            for d in doctores
        ]
    }


async def listar_servicios() -> dict:
    """
    Lista los servicios/tratamientos del consultorio con precio aproximado.
    Cada uno trae `agendable`: solo los que tienen agendable=true pueden
    reservarse por este medio (lo configura el consultorio desde la app).
    Para los que no, contesta la pregunta (precio, duración) pero si el
    paciente quiere agendar justo ese, explica que ese tratamiento requiere
    valoración/autorización directa del doctor — ofrece agendar una
    "Consulta de valoración" en su lugar, o sugiere llamar al consultorio.
    """
    try:
        servicios = await cliente_biodental.listar_servicios()
    except ErrorBiodentalAPI as e:
        return _error(f"No pude consultar los servicios: {e.mensaje}")

    return {
        "servicios": [
            {
                "servicio_uuid": s["uuid"],
                "nombre": s["nombre"],
                "precio": float(s["precio"]) if s.get("precio") is not None else None,
                "duracion_minutos": s.get("duracion_minutos"),
                "agendable": bool(s.get("agendable_bot")),
            }
            for s in servicios
        ]
    }


async def _servicio_default_agendable() -> dict | None:
    """
    Si agendar_cita no recibe un servicio_uuid explícito, se usa como
    "cita de revisión" por default el primer servicio agendable cuyo
    nombre suene a valoración/revisión; si no hay ninguno así mismo pero
    sí hay servicios agendables, se usa el primero. Si no hay ninguno
    agendable configurado, no hay default (la cita queda sin servicio
    asociado, como antes de tener esta función).
    """
    try:
        servicios = await cliente_biodental.listar_servicios()
    except ErrorBiodentalAPI:
        return None

    agendables = [s for s in servicios if s.get("agendable_bot")]
    if not agendables:
        return None

    for palabra in ("valoraci", "revisi"):
        for s in agendables:
            if palabra in s["nombre"].lower():
                return s

    return agendables[0]


async def consultar_disponibilidad(doctor_uuid: str, fecha: str) -> dict:
    """
    Consulta los horarios libres de un doctor en una fecha (YYYY-MM-DD).
    Úsala antes de agendar o reagendar para ofrecer horarios reales.
    """
    error_uuid = _validar_uuid(
        doctor_uuid, "doctor_uuid", "Usa el doctor_uuid exacto del listado de doctores del contexto de arriba."
    )
    if error_uuid:
        return _error(error_uuid)

    try:
        disponibilidad = await cliente_biodental.consultar_disponibilidad(doctor_uuid, fecha)
    except ErrorBiodentalAPI as e:
        return _error(f"No pude consultar la disponibilidad: {e.mensaje}")

    if not disponibilidad.get("disponible", True) and "slots" not in disponibilidad:
        return {"disponible": False, "mensaje": disponibilidad.get("mensaje", "No disponible")}

    slots_libres = [s["hora"] for s in disponibilidad.get("slots", []) if s.get("disponible")]
    return {"disponible": True, "horas_libres": slots_libres}


async def agendar_cita(
    paciente_uuid: str,
    doctor_uuid: str,
    fecha: str,
    hora_inicio: str,
    motivo: str = "",
    confirmar_fuera_de_horario: bool = False,
    servicio_uuid: str = "",
) -> dict:
    """
    Crea la cita. Si el horario está fuera del horario laboral del doctor,
    la API responde con una advertencia en vez de crearla: cuéntasela al
    paciente y solo vuelve a llamar esta función con
    confirmar_fuera_de_horario=True si el paciente insiste explícitamente.

    servicio_uuid debe ser uno de los que listar_servicios marcó como
    agendable=true (pídeselo con esa función, no lo inventes). Si el
    paciente no supo decir qué necesita, deja este campo vacío: se agenda
    automáticamente como consulta de valoración/revisión por default.
    """
    error_uuid = (
        _validar_uuid(paciente_uuid, "paciente_uuid", "Usa el paciente_uuid exacto del contexto del paciente que te dieron arriba.")
        or _validar_uuid(doctor_uuid, "doctor_uuid", "Usa el doctor_uuid exacto del listado de doctores del contexto de arriba.")
    )
    if error_uuid:
        return _error(error_uuid)

    if servicio_uuid:
        error_servicio = _validar_uuid(
            servicio_uuid, "servicio_uuid", "Usa el servicio_uuid exacto del listado de servicios del contexto de arriba."
        )
        if error_servicio:
            return _error(error_servicio)
    else:
        default = await _servicio_default_agendable()
        if default:
            servicio_uuid = default["uuid"]

    try:
        cita = await cliente_biodental.crear_cita(
            paciente_uuid, doctor_uuid, fecha, hora_inicio, motivo or None,
            confirmar_fuera_de_horario, servicio_uuid or None,
        )
    except ErrorBiodentalAPI as e:
        if e.code == "FUERA_HORARIO":
            return {
                "creada": False,
                "requiere_confirmacion": True,
                "mensaje": e.mensaje,
            }
        return _error(f"No se pudo agendar la cita: {e.mensaje}")

    return {
        "creada": True,
        "cita_uuid": cita.get("uuid"),
        "fecha": cita.get("fecha"),
        "hora_inicio": cita.get("hora_inicio"),
    }


async def listar_mis_citas(paciente_uuid: str) -> dict:
    """Lista las citas (pasadas y futuras) de un paciente, para confirmar o reagendar."""
    error_uuid = _validar_uuid(
        paciente_uuid, "paciente_uuid", "Usa el paciente_uuid exacto del contexto del paciente que te dieron arriba."
    )
    if error_uuid:
        return _error(error_uuid)

    try:
        citas = await cliente_biodental.listar_citas_paciente(paciente_uuid)
    except ErrorBiodentalAPI as e:
        return _error(f"No pude consultar las citas: {e.mensaje}")

    return {
        "citas": [
            {
                "cita_uuid": c["uuid"],
                "fecha": c["fecha"],
                "hora_inicio": str(c["hora_inicio"])[:5],
                "estado": c["estado"],
                "doctor": f"{c.get('doctor_nombre', '')} {c.get('doctor_apellidos', '')}".strip(),
            }
            for c in citas
            if c["estado"] not in ("cancelada", "completada", "no_asistio")
        ]
    }


async def confirmar_cita(cita_uuid: str) -> dict:
    """Marca una cita como confirmada por el paciente."""
    error_uuid = _validar_uuid(cita_uuid, "cita_uuid", "Usa listar_mis_citas para obtener el cita_uuid real, no lo inventes.")
    if error_uuid:
        return _error(error_uuid)

    try:
        await cliente_biodental.actualizar_cita(cita_uuid, {"estado": "confirmada"})
    except ErrorBiodentalAPI as e:
        return _error(f"No pude confirmar la cita: {e.mensaje}")

    return {"confirmada": True}


async def reagendar_cita(
    cita_uuid: str, nueva_fecha: str, nueva_hora: str, confirmar_fuera_de_horario: bool = False
) -> dict:
    """
    Cambia la fecha/hora de una cita existente. Igual que al agendar: si
    cae fuera del horario laboral, la API avisa en vez de mover la cita —
    confirma con el paciente antes de reintentar con
    confirmar_fuera_de_horario=True.
    """
    error_uuid = _validar_uuid(cita_uuid, "cita_uuid", "Usa listar_mis_citas para obtener el cita_uuid real, no lo inventes.")
    if error_uuid:
        return _error(error_uuid)

    cambios = {"fecha": nueva_fecha, "hora_inicio": nueva_hora}
    if confirmar_fuera_de_horario:
        cambios["permitir_fuera_horario"] = True

    try:
        await cliente_biodental.actualizar_cita(cita_uuid, cambios)
    except ErrorBiodentalAPI as e:
        if e.code == "FUERA_HORARIO":
            return {"reagendada": False, "requiere_confirmacion": True, "mensaje": e.mensaje}
        return _error(f"No se pudo reagendar la cita: {e.mensaje}")

    return {"reagendada": True, "nueva_fecha": nueva_fecha, "nueva_hora": nueva_hora}


async def cancelar_cita(cita_uuid: str) -> dict:
    """Cancela una cita a petición del paciente."""
    error_uuid = _validar_uuid(cita_uuid, "cita_uuid", "Usa listar_mis_citas para obtener el cita_uuid real, no lo inventes.")
    if error_uuid:
        return _error(error_uuid)

    try:
        await cliente_biodental.actualizar_cita(cita_uuid, {"estado": "cancelada"})
    except ErrorBiodentalAPI as e:
        return _error(f"No pude cancelar la cita: {e.mensaje}")

    return {"cancelada": True}


# ════════════════════════════════════════════════════════════════════
# Registro de funciones + schema para la API de OpenAI (tool-calling)
#
# `buscar_o_identificar_paciente`, `listar_doctores_disponibles` y
# `listar_servicios` YA NO se ofrecen aquí como tools que el modelo pueda
# invocar: son datos que casi no cambian turno a turno (identidad del
# paciente por su teléfono, catálogo de doctores/servicios), así que
# brain.py los precarga en Python (una llamada HTTP normal, sin gastar
# una vuelta completa de ida y vuelta con OpenAI) y se los da al modelo
# ya resueltos dentro del system prompt. Antes, el modelo tenía que
# "pedirle permiso" a una herramienta para cada uno de esos tres datos —
# eso significaba 3 llamadas extra a la API de OpenAI en casi cada turno,
# cada una reenviando otra vez todo el historial acumulado. Las funciones
# siguen existiendo abajo porque brain.py las importa directamente para
# ese prefetch — solo dejaron de ser "tools" que el modelo puede pedir.
# ════════════════════════════════════════════════════════════════════

FUNCIONES = {
    "registrar_paciente_nuevo": registrar_paciente_nuevo,
    "consultar_disponibilidad": consultar_disponibilidad,
    "agendar_cita": agendar_cita,
    "listar_mis_citas": listar_mis_citas,
    "confirmar_cita": confirmar_cita,
    "reagendar_cita": reagendar_cita,
    "cancelar_cita": cancelar_cita,
}

TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "registrar_paciente_nuevo",
            "description": "Registra a un paciente nuevo. Úsala solo después de haber pedido y confirmado nombre completo, correo y fecha de nacimiento.",
            "parameters": {
                "type": "object",
                "properties": {
                    "nombre": {"type": "string"},
                    "apellidos": {"type": "string"},
                    "telefono": {"type": "string"},
                    "email": {"type": "string"},
                    "fecha_nacimiento": {"type": "string", "description": "Formato YYYY-MM-DD"},
                },
                "required": ["nombre", "apellidos", "telefono", "email", "fecha_nacimiento"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "consultar_disponibilidad",
            "description": "Consulta las horas libres de un doctor en una fecha concreta. Úsala antes de ofrecer o agendar un horario.",
            "parameters": {
                "type": "object",
                "properties": {
                    "doctor_uuid": {"type": "string"},
                    "fecha": {"type": "string", "description": "Formato YYYY-MM-DD"},
                },
                "required": ["doctor_uuid", "fecha"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "agendar_cita",
            "description": "Crea una cita nueva para el paciente. Confirma fecha, hora y doctor con el paciente en lenguaje natural antes de llamarla.",
            "parameters": {
                "type": "object",
                "properties": {
                    "paciente_uuid": {"type": "string"},
                    "doctor_uuid": {"type": "string"},
                    "fecha": {"type": "string", "description": "Formato YYYY-MM-DD"},
                    "hora_inicio": {"type": "string", "description": "Formato HH:MM"},
                    "motivo": {"type": "string", "description": "Motivo de la consulta, breve"},
                    "servicio_uuid": {
                        "type": "string",
                        "description": "uuid de un servicio marcado agendable=true por listar_servicios. Déjalo vacío si el paciente no supo decir qué necesita — se usa automáticamente una consulta de valoración/revisión por default.",
                    },
                    "confirmar_fuera_de_horario": {
                        "type": "boolean",
                        "description": "Solo True si el paciente ya confirmó explícitamente agendar fuera del horario laboral normal.",
                    },
                },
                "required": ["paciente_uuid", "doctor_uuid", "fecha", "hora_inicio"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "listar_mis_citas",
            "description": "Lista las citas próximas de un paciente. Úsala antes de confirmar, reagendar o cancelar, para saber a cuál se refiere.",
            "parameters": {
                "type": "object",
                "properties": {"paciente_uuid": {"type": "string"}},
                "required": ["paciente_uuid"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "confirmar_cita",
            "description": "Marca una cita existente como confirmada por el paciente.",
            "parameters": {
                "type": "object",
                "properties": {"cita_uuid": {"type": "string"}},
                "required": ["cita_uuid"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "reagendar_cita",
            "description": "Cambia la fecha/hora de una cita existente a una nueva. Confirma la nueva fecha/hora con el paciente antes de llamarla.",
            "parameters": {
                "type": "object",
                "properties": {
                    "cita_uuid": {"type": "string"},
                    "nueva_fecha": {"type": "string", "description": "Formato YYYY-MM-DD"},
                    "nueva_hora": {"type": "string", "description": "Formato HH:MM"},
                    "confirmar_fuera_de_horario": {"type": "boolean"},
                },
                "required": ["cita_uuid", "nueva_fecha", "nueva_hora"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "cancelar_cita",
            "description": "Cancela una cita existente a petición explícita del paciente.",
            "parameters": {
                "type": "object",
                "properties": {"cita_uuid": {"type": "string"}},
                "required": ["cita_uuid"],
            },
        },
    },
]


async def ejecutar_tool(nombre: str, argumentos: dict) -> dict:
    """Ejecuta la función solicitada por el modelo. Nunca lanza — cualquier error se devuelve como texto."""
    funcion = FUNCIONES.get(nombre)
    if not funcion:
        return _error(f"Herramienta desconocida: {nombre}")

    try:
        return await funcion(**argumentos)
    except TypeError as e:
        logger.error("Argumentos inválidos para %s: %s", nombre, e)
        return _error(f"Argumentos inválidos para {nombre}")
    except Exception as e:
        logger.exception("Error inesperado ejecutando %s", nombre)
        return _error(f"Error inesperado: {e}")
