# agent/brain.py — Cerebro del agente: conexión con GPT (OpenAI) + tool-calling

"""
A diferencia de una sola llamada con un system prompt estático, agendar/
confirmar/reagendar citas requiere que el modelo pueda ejecutar acciones
reales en varios pasos (buscar paciente, consultar disponibilidad, crear
la cita...). Por eso este archivo implementa el loop de tool-calling de
OpenAI: se le ofrecen las funciones de agent/tools.py, y mientras el
modelo pida usarlas, se ejecutan y se le regresa el resultado, hasta que
responde solo texto para el paciente.
"""

import os
import json
import yaml
import asyncio
import logging
from datetime import datetime
from zoneinfo import ZoneInfo
from openai import AsyncOpenAI
from dotenv import load_dotenv

from agent.biodental_client import cliente_biodental, ErrorBiodentalAPI
from agent.tools import (
    TOOLS_SCHEMA,
    ejecutar_tool,
    buscar_o_identificar_paciente,
    listar_doctores_disponibles,
    listar_servicios,
)

load_dotenv()
logger = logging.getLogger("agentkit")

# Clientes de OpenAI ya construidos, por api_key — evita reconstruir el
# cliente en cada mensaje cuando la clave no cambió entre turnos.
_openai_clients: dict[str, AsyncOpenAI] = {}

ZONA_HORARIA = os.getenv("ZONA_HORARIA", "America/Mexico_City")

DIAS_ES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]

# Límite de vueltas del loop de tool-calling por mensaje, para no quedar
# atrapado si el modelo insiste en llamar herramientas indefinidamente.
MAX_TURNOS_TOOLS = 8

# Cuántos turnos previos (mensajes de usuario+asistente, no llamadas a
# herramientas) se reenvían como historial en cada llamada a OpenAI. Cada
# mensaje adicional es texto que se vuelve a mandar completo en TODAS las
# llamadas del turno actual — mantenerlo bajo ayuda tanto al costo como al
# límite de tokens por minuto de la cuenta.
HISTORIAL_LIMITE = int(os.getenv("HISTORIAL_LIMITE", "12"))


def cargar_config_prompts() -> dict:
    """Lee toda la configuración desde config/prompts.yaml."""
    try:
        with open("config/prompts.yaml", "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}
    except FileNotFoundError:
        logger.error("config/prompts.yaml no encontrado")
        return {}


def cargar_system_prompt() -> str:
    config = cargar_config_prompts()
    return config.get("system_prompt", "Eres un asistente útil. Responde en español.")


def obtener_mensaje_error() -> str:
    config = cargar_config_prompts()
    return config.get(
        "error_message",
        "Lo siento, estoy teniendo problemas técnicos. Por favor intenta de nuevo en unos minutos.",
    )


def obtener_mensaje_fallback() -> str:
    config = cargar_config_prompts()
    return config.get("fallback_message", "Disculpa, no entendí tu mensaje. ¿Podrías reformularlo?")


async def _resolver_openai() -> tuple[AsyncOpenAI, str]:
    """
    Resuelve con qué API key y modelo de OpenAI trabajar. Única fuente de
    verdad: la configuración que el admin guardó desde Integraciones en la
    app (Perfil > Administración > Asistente de WhatsApp con IA), ya
    probada contra OpenAI en el momento de guardarla. Sin fallback a
    variables de entorno locales — si no está registrada ahí (o Biodental
    no responde), el agente no funciona en vez de operar en silencio con
    una clave vieja/local que nadie está vigilando.
    """
    config = await cliente_biodental.obtener_configuracion_runtime()
    api_key = config.get("openai_api_key")
    modelo = config.get("openai_model") or "gpt-4.1"

    if not api_key:
        raise RuntimeError(
            "No hay API Key de OpenAI configurada — agrégala en la app, en "
            "Perfil > Administración > Integraciones > Asistente de WhatsApp con IA."
        )

    openai_client = _openai_clients.get(api_key)
    if openai_client is None:
        openai_client = AsyncOpenAI(api_key=api_key)
        _openai_clients[api_key] = openai_client

    return openai_client, modelo


async def _precargar_contexto(telefono: str) -> str:
    """
    Resuelve en Python (llamadas HTTP normales, sin gastar una vuelta de
    OpenAI cada una) lo que antes el modelo tenía que pedir con 3
    herramientas separadas — quién es el paciente, qué doctores hay y qué
    servicios existen — y lo devuelve como bloque de contexto compacto
    para el system prompt. cliente_biodental ya cachea doctores/servicios
    unos minutos, así que esto no le pega a la API en cada mensaje.
    """
    paciente, doctores, servicios = await asyncio.gather(
        buscar_o_identificar_paciente(telefono),
        listar_doctores_disponibles(),
        listar_servicios(),
    )

    return (
        "\n\n## Contexto ya resuelto (NO uses ninguna herramienta para volver a"
        " obtener esto, ya lo tienes aquí)\n"
        f"Identidad del paciente (por su teléfono): {json.dumps(paciente, ensure_ascii=False)}\n"
        f"Doctores del consultorio: {json.dumps(doctores.get('doctores', []), ensure_ascii=False)}\n"
        f"Servicios/tratamientos: {json.dumps(servicios.get('servicios', []), ensure_ascii=False)}"
    )


async def generar_respuesta(mensaje: str, historial: list[dict], telefono: str) -> str:
    """
    Genera una respuesta usando GPT, ejecutando las herramientas que el
    modelo necesite (buscar paciente, agendar, confirmar, reagendar...).

    Args:
        mensaje: el mensaje nuevo del paciente
        historial: turnos anteriores [{"role": "user"/"assistant", "content": "..."}]
        telefono: número de WhatsApp del paciente (para identificarlo en Biodental
                   sin que tenga que dictarlo)

    Returns:
        La respuesta final en texto para enviar por WhatsApp
    """
    if not mensaje or len(mensaje.strip()) < 1:
        return obtener_mensaje_fallback()

    ahora = datetime.now(ZoneInfo(ZONA_HORARIA))
    fecha_hoy = ahora.strftime("%Y-%m-%d")
    dia_semana_hoy = DIAS_ES[ahora.weekday()]

    try:
        contexto_precargado, (openai_client, modelo) = await asyncio.gather(
            _precargar_contexto(telefono),
            _resolver_openai(),
        )
    except (RuntimeError, ErrorBiodentalAPI) as e:
        logger.error("No se pudo preparar la respuesta: %s", getattr(e, "mensaje", str(e)))
        return obtener_mensaje_error()

    system_prompt = (
        cargar_system_prompt()
        + f"\n\nHoy es {dia_semana_hoy} {fecha_hoy} (hora de México). Usa esta fecha, no la que"
        + " creas recordar, para calcular \"mañana\", \"el próximo lunes\", etc. — SIEMPRE pasa"
        + " fechas en formato YYYY-MM-DD a las herramientas."
        + f"\n\nEl número de WhatsApp de quien te escribe es: {telefono}"
        + contexto_precargado
    )

    # Recorte defensivo: sin importar cuánto traiga `historial` de memory.py,
    # solo se reenvían los últimos HISTORIAL_LIMITE turnos — cada uno se
    # vuelve a mandar completo en TODAS las llamadas a OpenAI de este turno.
    historial_recortado = historial[-HISTORIAL_LIMITE:] if historial else []

    mensajes = [{"role": "system", "content": system_prompt}]
    mensajes += [{"role": m["role"], "content": m["content"]} for m in historial_recortado]
    mensajes.append({"role": "user", "content": mensaje})

    try:
        for _ in range(MAX_TURNOS_TOOLS):
            response = await openai_client.chat.completions.create(
                model=modelo,
                messages=mensajes,
                tools=TOOLS_SCHEMA,
                max_tokens=1024,
            )
            choice = response.choices[0]
            logger.info(
                "GPT (%s in / %s out)",
                response.usage.prompt_tokens,
                response.usage.completion_tokens,
            )

            if choice.finish_reason != "tool_calls" or not choice.message.tool_calls:
                return choice.message.content or obtener_mensaje_fallback()

            # El modelo pidió usar una o más herramientas: ejecutarlas y
            # devolverle el resultado antes de pedirle la siguiente respuesta.
            mensajes.append(choice.message.model_dump(exclude_unset=True))

            for tool_call in choice.message.tool_calls:
                nombre = tool_call.function.name
                try:
                    argumentos = json.loads(tool_call.function.arguments or "{}")
                except json.JSONDecodeError:
                    argumentos = {}

                logger.info("Tool call: %s(%s)", nombre, argumentos)
                resultado = await ejecutar_tool(nombre, argumentos)

                mensajes.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(resultado, ensure_ascii=False),
                })

        # Se agotaron los turnos de herramientas sin una respuesta final
        logger.warning("Se alcanzó MAX_TURNOS_TOOLS sin respuesta final del modelo")
        return obtener_mensaje_error()

    except Exception as e:
        logger.error("Error GPT/OpenAI API: %s", e)
        return obtener_mensaje_error()
