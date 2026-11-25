"""Endpoints de autorizaciones por monto (AUT-01 a AUT-08).

Regla del taller (AUT-01): toda orden cuyo total supere
``settings.MONTO_AUTORIZACION`` ($250,000 por omision) requiere la aprobacion
del Administrador. La bandera ``ordenes_servicio.requiere_autorizacion``
tambien se toma en cuenta, porque puede marcarse por otras causas (AUT-02,
AUT-07).

* ``GET /autorizaciones``: ordenes que requieren autorizacion, con el estado
  de su solicitud (Pendiente, Aprobada o Rechazada). Lo pueden consultar
  Administrador y Recepcion; Recepcion solo lee.
* ``POST /autorizaciones/orden/{orden_id}/resolver``: el Administrador aprueba
  o rechaza. Si la orden no tenia solicitud registrada, se crea en ese
  momento con el monto vigente (AUT-05).

Solo el Administrador resuelve (AUT-03, AUT-06). Cada decision deja asiento
en ``bitacora`` con la accion ``Autorizacion``, el usuario y el motivo
(SEG-06). Al aprobar se apaga ``requiere_autorizacion``; al rechazar se
mantiene encendida para que la orden siga bloqueada.
"""

from datetime import datetime
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import UsuarioActual, get_current_user, requiere_roles
from app.models import Autorizacion, Bitacora, OrdenServicio
from app.schemas.autorizaciones import (
    AutorizacionOrdenOut,
    AutorizacionResolverIn,
    AutorizacionesOut,
    EstadoAutorizacion,
    TipoAutorizacion,
)
from app.services.finanzas import SaldoOrden, saldo_de_orden, saldos_por_orden

router = APIRouter(
    prefix="/autorizaciones",
    tags=["Autorizaciones"],
    dependencies=[Depends(get_current_user)],
)

_TABLA = "autorizaciones"
_UMBRAL: Decimal = Decimal(settings.MONTO_AUTORIZACION)


def _consulta_orden():
    """Orden con cliente y vehiculo cargados (evita consultas por fila)."""
    return select(OrdenServicio).options(
        selectinload(OrdenServicio.cliente),
        selectinload(OrdenServicio.vehiculo),
    )


def _estado_solicitud(autorizacion: Autorizacion | None) -> EstadoAutorizacion:
    """Deriva el estado a partir del booleano ``aprobado`` (AUT-05).

    ``aprobado = 0`` con ``fecha_aprobacion`` significa rechazo; sin fecha,
    sigue pendiente.
    """
    if autorizacion is None:
        return "Pendiente"
    if autorizacion.aprobado:
        return "Aprobada"
    if autorizacion.fecha_aprobacion is not None:
        return "Rechazada"
    return "Pendiente"


def _autorizacion_out(
    orden: OrdenServicio,
    autorizacion: Autorizacion | None,
    saldo: SaldoOrden,
) -> AutorizacionOrdenOut:
    """Fila de la tabla de autorizaciones."""
    return AutorizacionOrdenOut(
        orden_id=orden.id,
        estado_orden=orden.estado,
        cliente_nombre=orden.cliente.nombre,
        vehiculo_placas=orden.vehiculo.placas,
        vehiculo_descripcion=(
            f"{orden.vehiculo.marca} {orden.vehiculo.modelo} {orden.vehiculo.anio}"
        ),
        total=saldo.total,
        saldo=saldo.saldo,
        estado=_estado_solicitud(autorizacion),
        autorizacion_id=autorizacion.id if autorizacion else None,
        tipo=(
            autorizacion.tipo  # type: ignore[arg-type]
            if autorizacion is not None
            else None
        ),
        solicitada_en=autorizacion.created_at if autorizacion else None,
        aprobado_por=autorizacion.aprobado_por if autorizacion else None,
        fecha_resolucion=autorizacion.fecha_aprobacion if autorizacion else None,
        requiere_autorizacion=bool(orden.requiere_autorizacion),
    )


def _ultimas_autorizaciones(
    db: Session, ordenes: list[OrdenServicio]
) -> dict[int, Autorizacion]:
    """Ultima autorizacion vigente de cada orden, en una sola consulta."""
    if not ordenes:
        return {}

    filas = db.scalars(
        select(Autorizacion)
        .where(
            Autorizacion.orden_id.in_([orden.id for orden in ordenes]),
            Autorizacion.activo == 1,
        )
        .order_by(Autorizacion.id.asc())
    ).all()

    ultimas: dict[int, Autorizacion] = {}
    for autorizacion in filas:
        ultimas[autorizacion.orden_id] = autorizacion
    return ultimas


@router.get(
    "",
    response_model=AutorizacionesOut,
    summary="Ordenes que requieren autorizacion",
    description=(
        "Ordenes cuyo total supera el umbral configurado (o que tienen la "
        "bandera `requiere_autorizacion`) con el estado de su solicitud. "
        "Incluye el umbral vigente para mostrarlo en pantalla. Administrador "
        "y Recepcion; Recepcion solo consulta."
    ),
    dependencies=[Depends(requiere_roles("Administrador", "Recepcion"))],
)
def listar_autorizaciones(
    db: Session = Depends(get_db),
    estado: Annotated[
        EstadoAutorizacion | None,
        Query(description="Filtra por estado de la solicitud"),
    ] = None,
    limit: Annotated[
        int, Query(ge=1, le=200, description="Maximo de ordenes a revisar")
    ] = 100,
) -> AutorizacionesOut:
    ordenes = list(
        db.scalars(
            _consulta_orden()
            .where(
                OrdenServicio.activo == 1,
                OrdenServicio.estado != "Cancelado",
                or_(
                    OrdenServicio.total >= _UMBRAL,
                    OrdenServicio.requiere_autorizacion == 1,
                ),
            )
            .order_by(OrdenServicio.total.desc(), OrdenServicio.id.desc())
            .limit(limit)
        )
    )

    ultimas = _ultimas_autorizaciones(db, ordenes)
    saldos = saldos_por_orden(db, ordenes)
    items = [
        _autorizacion_out(orden, ultimas.get(orden.id), saldos[orden.id])
        for orden in ordenes
    ]
    if estado is not None:
        items = [item for item in items if item.estado == estado]

    return AutorizacionesOut(
        monto_umbral=_UMBRAL,
        total=len(items),
        items=items,
    )


@router.post(
    "/orden/{orden_id}/resolver",
    response_model=AutorizacionOrdenOut,
    summary="Aprobar o rechazar una autorizacion",
    description=(
        "El Administrador autoriza o rechaza una orden que supera el umbral "
        "(AUT-03). Crea la solicitud si no existia, guarda quien resolvio y "
        "cuando, y deja asiento en la bitacora. Al aprobar se apaga la "
        "bandera `requiere_autorizacion`; al rechazar se conserva."
    ),
    dependencies=[Depends(requiere_roles("Administrador"))],
)
def resolver_autorizacion(
    orden_id: int,
    payload: AutorizacionResolverIn,
    usuario: UsuarioActual,
    db: Session = Depends(get_db),
) -> AutorizacionOrdenOut:
    orden = db.scalars(
        _consulta_orden()
        .where(OrdenServicio.id == orden_id)
        .with_for_update()
    ).first()
    if orden is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Orden {orden_id} no encontrada",
        )
    if not orden.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La orden {orden.id} esta dada de baja",
        )
    if orden.estado == "Cancelado":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La orden {orden.id} esta cancelada",
        )
    if orden.total < _UMBRAL and not orden.requiere_autorizacion:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"La orden {orden.id} no requiere autorizacion: su total "
                f"({orden.total} MXN) no supera el umbral de {_UMBRAL} MXN"
            ),
        )

    autorizacion = db.scalars(
        select(Autorizacion)
        .where(
            Autorizacion.orden_id == orden.id,
            Autorizacion.activo == 1,
        )
        .order_by(Autorizacion.id.desc())
    ).first()

    if autorizacion is not None and autorizacion.fecha_aprobacion is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"La orden {orden.id} ya fue resuelta por "
                f"{autorizacion.aprobado_por or 'un administrador'}; si el "
                "monto cambio, registra una reautorizacion"
            ),
        )

    # El tipo depende de por que requiere autorizacion: monto alto, saldo o
    # una reautorizacion sobre una solicitud previa sin resolver.
    tipo: TipoAutorizacion
    if orden.total >= _UMBRAL:
        tipo = "Monto_Alto"
    elif autorizacion is not None:
        tipo = "Reautorizacion"
    else:
        tipo = "Saldo_Pendiente"

    if autorizacion is None:
        autorizacion = Autorizacion(
            orden_id=orden.id,
            tipo=tipo,
            monto_orden=orden.total,
        )
        db.add(autorizacion)
    else:
        autorizacion.tipo = tipo
        autorizacion.monto_orden = orden.total

    autorizacion.aprobado = payload.aprobado
    autorizacion.aprobado_por = usuario.nombre
    autorizacion.fecha_aprobacion = datetime.now()
    orden.requiere_autorizacion = not payload.aprobado

    decision = "APROBADA" if payload.aprobado else "RECHAZADA"

    try:
        db.flush()
        db.add(
            Bitacora(
                usuario_id=usuario.id,
                tabla_afectada=_TABLA,
                registro_id=autorizacion.id,
                accion="Autorizacion",
                detalle=(
                    f"Orden {orden.id} {decision} por {usuario.nombre}. "
                    f"Monto: {orden.total} MXN (umbral {_UMBRAL} MXN)"
                    + (f". Motivo: {payload.motivo}" if payload.motivo else "")
                ),
            )
        )
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo guardar la autorizacion",
        ) from exc

    db.refresh(autorizacion)
    return _autorizacion_out(
        orden, autorizacion, saldo_de_orden(db, orden)
    )
