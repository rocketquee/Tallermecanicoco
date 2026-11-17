"""Demo del Bloque 6: usuario, bitacora, historial y N:M de mecanicos.

Todo ocurre dentro de una transaccion que termina en ``rollback``: no deja
nada en la base. Ejecutar con:

    cd /d E:\\Tallermecanico\\backend
    .venv\\Scripts\\python.exe scripts\\demo_bloque6.py
"""

import sys
from pathlib import Path

from sqlalchemy import func, select, update
from sqlalchemy.exc import DBAPIError

# Permite ejecutar el script directamente (python scripts\demo_bloque6.py)
# agregando la raiz del backend al sys.path.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import SessionLocal
from app.models import (
    Bitacora,
    HistorialEtapa,
    Mecanico,
    OrdenMecanico,
    OrdenServicio,
    Usuario,
)


def conteos(s) -> str:
    partes = []
    for modelo in (Usuario, Bitacora, HistorialEtapa, OrdenMecanico):
        n = s.scalar(select(func.count()).select_from(modelo))
        partes.append(f"{modelo.__tablename__}={n}")
    return " | ".join(partes)


with SessionLocal() as s:
    print("antes      :", conteos(s))

    # 1) Usuario de recepcion
    usuario = Usuario(
        nombre="Ana Torres",
        correo="ana.torres@ppg.mx",
        password_hash="$scrypt$hash_de_prueba",
        rol="Recepcion",
    )
    s.add(usuario)
    s.flush()
    print("usuario    :", usuario)

    # 2) Bitacora y cambio de etapa, ambos apuntando al usuario
    asiento = Bitacora(
        usuario=usuario,
        tabla_afectada="ordenes_servicio",
        registro_id=1,
        accion="Actualizacion",
        detalle="Diagnostico -> Reparacion",
    )
    etapa = HistorialEtapa(
        orden_id=1,
        etapa_anterior="Diagnostico",
        etapa_nueva="Reparacion",
        usuario=usuario,
    )
    s.add_all([asiento, etapa])
    s.flush()
    print("bitacora   :", asiento)
    print("historial  :", etapa)

    # 3) Mecanico nuevo asignado a la orden 1 (N:M)
    orden = s.get(OrdenServicio, 1)
    nuevo_mecanico = Mecanico(nombre="Jorge Salas", especialidad="Suspension")
    orden.asignaciones.append(OrdenMecanico(mecanico=nuevo_mecanico))
    s.flush()
    s.expire_all()
    orden = s.get(OrdenServicio, 1)
    print("asignacion :", orden.asignaciones[-1])
    print("orden.mecanicos:", orden.mecanicos)
    print("mecanico.ordenes_participa:", nuevo_mecanico.ordenes_participa)

    # 4) La bitacora es inmutable: UPDATE rechazado por trigger
    try:
        s.execute(update(Bitacora).where(Bitacora.id == asiento.id).values(detalle="mutado"))
        print("inmutables : NO se rechazo (MAL)")
    except DBAPIError as exc:
        mensaje = exc.orig.args[1] if len(exc.orig.args) > 1 else str(exc.orig)
        print("inmutable  : rechazado ->", type(exc).__name__, "|", mensaje)

    s.rollback()
    print("despues    :", conteos(s), "(rollback: nada guardado)")
