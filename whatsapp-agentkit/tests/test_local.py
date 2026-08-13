# tests/test_local.py — Simulador de chat en terminal

"""
Prueba tu agente sin necesitar WhatsApp real.
Simula una conversación en la terminal, usando GPT + las herramientas
reales contra la API de Biodental (BIODENTAL_API_URL en .env).
"""

import asyncio
import logging
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Sin esto, los logs de agent/brain.py y agent/tools.py (incluidas las
# llamadas a herramientas) no se ven en este script — solo main.py
# configura logging por su cuenta.
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))

from agent.brain import generar_respuesta
from agent.memory import inicializar_db, guardar_mensaje, obtener_historial, limpiar_historial

# Número de prueba — usa uno realista de 10 dígitos si quieres probar el
# flujo completo de registro de paciente nuevo con datos ficticios.
TELEFONO_TEST = os.getenv("TEST_TELEFONO", "5215555550000")


async def main():
    await inicializar_db()

    print()
    print("=" * 55)
    print("   Bio Dental — Asistente de WhatsApp — Test Local")
    print("=" * 55)
    print()
    print(f"  Simulando conversación desde: {TELEFONO_TEST}")
    print("  Comandos especiales:")
    print("    'limpiar'  — borra el historial")
    print("    'salir'    — termina el test")
    print()
    print("-" * 55)
    print()

    while True:
        try:
            mensaje = input("Tu: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\nTest finalizado.")
            break

        if not mensaje:
            continue

        if mensaje.lower() == "salir":
            print("\nTest finalizado.")
            break

        if mensaje.lower() == "limpiar":
            await limpiar_historial(TELEFONO_TEST)
            print("[Historial borrado]\n")
            continue

        historial = await obtener_historial(TELEFONO_TEST)

        print("\nAgente: ", end="", flush=True)
        respuesta = await generar_respuesta(mensaje, historial, TELEFONO_TEST)
        print(respuesta)
        print()

        await guardar_mensaje(TELEFONO_TEST, "user", mensaje)
        await guardar_mensaje(TELEFONO_TEST, "assistant", respuesta)


if __name__ == "__main__":
    asyncio.run(main())
