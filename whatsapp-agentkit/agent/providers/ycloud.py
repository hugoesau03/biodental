# agent/providers/ycloud.py — Adaptador para YCloud (WhatsApp Business API)

"""
Proveedor de WhatsApp usando YCloud — el mismo proveedor que ya usa el
backend de Biodental (backend/controllers/whatsappController.js) para
enviar confirmaciones y recordatorios de citas. Este adaptador reutiliza
el mismo endpoint de envío y añade el lado que el backend de Node nunca
implementó: recibir y validar mensajes entrantes.

Toda la configuración (API key, número emisor, secreto de webhook) se lee
en tiempo real de la app de Biodental — ver _config_efectiva() más abajo.

Documentación de referencia:
- Envío:  https://docs.ycloud.com/reference/whatsapp-send-a-message
- Webhooks: https://docs.ycloud.com/reference/webhook-events-payloads
- Firma:  header "YCloud-Signature: t=<timestamp>,s=<hmac-sha256>"
          calculada sobre "{timestamp}.{cuerpo_crudo}" con el secreto del
          endpoint de webhook.
"""

import hmac
import hashlib
import logging
import time
import httpx
from fastapi import Request
from agent.providers.base import ProveedorWhatsApp, MensajeEntrante
from agent.biodental_client import cliente_biodental

logger = logging.getLogger("agentkit")

YCLOUD_SEND_URL = "https://api.ycloud.com/v2/whatsapp/messages/sendDirectly"

# Margen de tolerancia para la marca de tiempo de la firma, evita aceptar
# webhooks reproducidos (replay) mucho más tarde.
TOLERANCIA_TIMESTAMP_SEGUNDOS = 5 * 60


class ProveedorYCloud(ProveedorWhatsApp):
    """Proveedor de WhatsApp usando YCloud."""

    async def _config_efectiva(self) -> dict:
        """
        Config de YCloud: única fuente de verdad es la app de Biodental
        (Perfil > Administración > Integraciones > WhatsApp (YCloud)), ya
        probada contra YCloud al guardarla. Sin fallback local — si
        Biodental no responde o el admin no la configuró ahí, no hay nada
        que usar y las funciones de abajo se niegan a operar con datos
        vacíos, en vez de arrancar con una clave vieja sin que nadie se dé cuenta.
        """
        try:
            config = await cliente_biodental.obtener_configuracion_runtime()
        except Exception as e:
            logger.error("No se pudo obtener la configuración de YCloud desde Biodental: %s", e)
            config = {}

        return {
            "api_key": config.get("ycloud_api_key") or "",
            "numero_emisor": config.get("ycloud_whatsapp_from") or "",
            "webhook_secret": config.get("ycloud_webhook_secret") or "",
            "prefijo_pais": config.get("prefijo_pais") or "+52",
        }

    def _normalizar_telefono(self, telefono: str, prefijo_pais: str) -> str:
        """Normaliza a formato E.164, igual que el backend de Biodental."""
        solo_digitos = "".join(c for c in str(telefono or "") if c.isdigit())
        if not solo_digitos:
            return telefono
        if str(telefono).strip().startswith("+"):
            return f"+{solo_digitos}"
        if len(solo_digitos) == 10:
            return f"{prefijo_pais}{solo_digitos}"
        return f"+{solo_digitos}"

    def _verificar_firma(self, cuerpo_crudo: bytes, header_firma: str | None, webhook_secret: str | None) -> bool:
        """Valida el header YCloud-Signature contra el cuerpo crudo del request."""
        if not webhook_secret:
            logger.warning("Secreto de webhook de YCloud no configurado en la app — se acepta el webhook sin verificar firma")
            return True

        if not header_firma:
            logger.warning("Webhook de YCloud sin header de firma")
            return False

        partes = dict(
            p.split("=", 1) for p in header_firma.split(",") if "=" in p
        )
        timestamp = partes.get("t")
        firma_recibida = partes.get("s")
        if not timestamp or not firma_recibida:
            logger.warning("Header YCloud-Signature con formato inesperado: %s", header_firma)
            return False

        try:
            if abs(time.time() - int(timestamp)) > TOLERANCIA_TIMESTAMP_SEGUNDOS:
                logger.warning("Webhook de YCloud con timestamp fuera de rango (posible replay)")
                return False
        except ValueError:
            return False

        mensaje_firmado = f"{timestamp}.{cuerpo_crudo.decode('utf-8')}".encode("utf-8")
        firma_calculada = hmac.new(
            webhook_secret.encode("utf-8"), mensaje_firmado, hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(firma_calculada, firma_recibida)

    async def parsear_webhook(self, request: Request) -> list[MensajeEntrante]:
        """Valida la firma y extrae mensajes de texto entrantes del payload de YCloud."""
        cuerpo_crudo = await request.body()
        config = await self._config_efectiva()

        if not self._verificar_firma(cuerpo_crudo, request.headers.get("YCloud-Signature"), config["webhook_secret"]):
            logger.error("Firma de webhook de YCloud inválida — mensaje descartado")
            return []

        try:
            body = await request.json()
        except Exception:
            logger.error("Webhook de YCloud con JSON inválido")
            return []

        # Solo nos interesan los mensajes entrantes de texto. YCloud también
        # manda eventos de actualización de estado (entregado/leído) y otros
        # tipos de mensaje (imagen, audio, ubicación) que este agente ignora
        # por ahora.
        if body.get("type") != "whatsapp.inbound_message.received":
            return []

        msg = body.get("whatsappInboundMessage", {})
        if msg.get("type") != "text":
            logger.info("Mensaje entrante de tipo no soportado (%s), se ignora", msg.get("type"))
            return []

        texto = msg.get("text", {}).get("body", "")
        telefono = msg.get("from", "")
        mensaje_id = msg.get("id", "")

        if not texto or not telefono:
            return []

        return [MensajeEntrante(
            telefono=telefono,
            texto=texto,
            mensaje_id=mensaje_id,
            es_propio=False,
        )]

    async def enviar_mensaje(self, telefono: str, mensaje: str) -> bool:
        """Envía un mensaje de texto libre vía YCloud (dentro de la ventana de 24h)."""
        config = await self._config_efectiva()
        if not config["api_key"] or not config["numero_emisor"]:
            logger.warning("YCloud no está configurado en la app (Integraciones) — no se puede enviar")
            return False

        payload = {
            "from": config["numero_emisor"],
            "to": self._normalizar_telefono(telefono, config["prefijo_pais"]),
            "type": "text",
            "text": {"body": mensaje},
        }
        headers = {
            "Content-Type": "application/json",
            "X-API-Key": config["api_key"],
        }

        async with httpx.AsyncClient() as client:
            r = await client.post(YCLOUD_SEND_URL, json=payload, headers=headers, timeout=15)
            if r.status_code >= 300:
                logger.error("Error YCloud: %s — %s", r.status_code, r.text)
            return r.status_code < 300
