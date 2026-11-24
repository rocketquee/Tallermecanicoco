"""Capa de servicios de la API (reservada).

Hoy la logica de negocio vive en los routers por modulo:

* ``app/routers/ordenes.py``  -> totales, etapas y consumo de refacciones.
* ``app/routers/clientes.py`` -> validacion de RFC y reglas de privacidad.
* ``app/routers/auth.py``     -> autenticacion y bitacora de accesos.

Esta carpeta existe para extraer esas funciones cuando se agreguen pruebas
automatizadas (``backend/tests``), de modo que los routers queden como una
capa delgada de HTTP. No borrar: es parte de la estructura acordada.
"""
