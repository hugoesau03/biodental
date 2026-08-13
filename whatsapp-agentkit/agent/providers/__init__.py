# agent/providers/__init__.py — Factory de proveedores

"""
Selecciona el proveedor de WhatsApp según la variable WHATSAPP_PROVIDER en .env.
"""

import os
from agent.providers.base import ProveedorWhatsApp


def obtener_proveedor() -> ProveedorWhatsApp:
    """Retorna el proveedor de WhatsApp configurado en .env."""
    proveedor = os.getenv("WHATSAPP_PROVIDER", "").lower()

    if not proveedor:
        raise ValueError("WHATSAPP_PROVIDER no configurado en .env. Usa: ycloud")

    if proveedor == "ycloud":
        from agent.providers.ycloud import ProveedorYCloud
        return ProveedorYCloud()
    else:
        raise ValueError(f"Proveedor no soportado: {proveedor}. Usa: ycloud")
