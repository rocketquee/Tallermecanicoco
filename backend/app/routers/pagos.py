"""Endpoints de cobranza: pagos, saldos y cuentas por cobrar (PAG-01 a PAG-07).

* ``GET /pagos/cobranza``: una fila por orden con total, cobrado y saldo. Es la
  tabla de la pantalla de Pagos.
* ``GET /pagos/orden/{orden_id}``: historial de pagos de una orden con su
  resumen de saldo.
* ``GET /pagos/orden/{orden_id}/saldo``: solo el saldo pendiente (PAG-05).
* ``POST /pagos``: registra un anticipo, una parcialidad o la liquidacion.

Todo el modulo es exclusivo del Administrador: son importes y formas de pago
del cliente (SEG-02). El monto lo captura el usuario, pero el backend lo
compara contra el saldo real antes de guardarlo y nunca confia en el frontend
para los totales (SEG-18).

Reglas de captura (PAG-03, PAG-04)
----------------------------------
* La orden debe existir, estar vigente, no estar cancelada y tener importe.
* No se puede cobrar mas que el saldo pendiente.
* ``Anticipo`` solo en el primer cobro; despues se usa ``Parcialidad``.
* ``Liquidacion`` debe cubrir exactamente el saldo restante.
"""

from decimal import ROUND_HALF_UP, Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import UsuarioActual, requiere_roles
from app.models import Bitacora, OrdenServicio, Pago
from app.schemas.ordenes import EstadoOrden
from app.schemas.pagos import (
    CobranzaOut,
    PagoCreateIn,
    PagoOrdenOut,
    PagoOut,
    PagoRegistradoOut,
    SaldoOrdenOut,
)
from app.services.finanzas import (
    SaldoOrden,
    saldo_de_orden,
    saldos_por_orden,
)

router = APIRouter(
    prefix="/pagos",
    tags=["Pagos"],
    dependencies=[Depends(requiere_roles("Administrador"))],
)

_TABLA = "pagos"
_CENTAVO = Decimal("0.01")


def _dinero(valor: Decimal) -> Decimal:
    """Redondea a centavos con el criterio contable habitual."""
    return valor.quantize(_CENTAVO, rounding=ROUND_HALF_UP)


def _saldo_out(orden_id: int, saldo: SaldoOrden) -> SaldoOrdenOut:
    """Traduce el resultado del servicio de finanzas al schema de salida."""
    return SaldoOrdenOut(
        orden_id=orden_id,
        total=saldo.total,
        pagado=saldo.pagado,
        saldo=saldo.saldo,
        liquidado=saldo.liquidado,
        numero_pagos=saldo.numero_pagos,
        ultimo_pago=saldo.ultimo_pago,
    )


def _pago_out(pago: Pago) -> PagoOut:
    """Convierte un pago del ORM al schema de salida."""
    return PagoOut(
        id=pago.id,
        orden_id=pago.orden_id,
        tipo=pago.tipo,
        monto=pago.monto,
        metodo_pago=pago.metodo_pago,
        referencia=pago.referencia,
        created_at=pago.created_at,
    )


def _consulta_orden():
    """Orden con cliente y vehiculo cargados (evita consultas por fila)."""
    return select(OrdenServicio).options(
        selectinload(OrdenServicio.cliente),
        selectinload(OrdenServicio.vehiculo),
    )


def _orden_o_404(db: Session, orden_id: int) -> OrdenServicio:
    """Busca una orden por id o lanza 404."""
    orden = db.scalars(_consulta_orden().where(OrdenServicio.id == orden_id)).first()
    if orden is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Orden {orden_id} no encontrada",
        )
    return orden


def _cobranza_out(orden: OrdenServicio, saldo: SaldoOrden) -> CobranzaOut:
    """Fila del tablero de cuentas por cobrar."""
    return CobranzaOut(
        orden_id=orden.id,
        estado=orden.estado,
        cliente_id=orden.cliente_id,
        cliente_nombre=orden.cliente.nombre,
        vehiculo_placas=orden.vehiculo.placas,
        vehiculo_descripcion=(
            f"{orden.vehiculo.marca} {orden.vehiculo.modelo} {orden.vehiculo.anio}"
        ),
        total=saldo.total,
        pagado=saldo.pagado,
        saldo=saldo.saldo,
        numero_pagos=saldo.numero_pagos,
        ultimo_pago=saldo.ultimo_pago,
        created_at=orden.created_at,
    )


@router.get(
    "/cobranza",
    response_model=list[CobranzaOut],
    summary="Cuentas por cobrar",
    description=(
        "Ordenes con su total, lo cobrado y el saldo pendiente, de la mas "
        "reciente a la mas antigua. `solo_con_saldo` oculta las ya "
        "liquidadas. Solo Administrador."
    ),
)
def listar_cobranza(
    db: Session = Depends(get_db),
    estado: Annotated[
        EstadoOrden | None, Query(description="Filtra por etapa de la orden")
    ] = None,
    solo_con_saldo: Annotated[
        bool, Query(description="Oculta las ordenes ya liquidadas")
    ] = False,
    incluir_inactivos: Annotated[
        bool, Query(description="Incluye ordenes con activo = 0")
    ] = False,
    skip: Annotated[int, Query(ge=0, description="Registros a saltar")] = 0,
    limit: Annotated[
        int, Query(ge=1, le=200, description="Maximo de registros")
    ] = 100,
) -> list[CobranzaOut]:
    stmt = _consulta_orden()
    if not incluir_inactivos:
        stmt = stmt.where(OrdenServicio.activo.is_(True))
    if estado is not None:
        stmt = stmt.where(OrdenServicio.estado == estado)
    stmt = (
        stmt.order_by(OrdenServicio.created_at.desc(), OrdenServicio.id.desc())
        .offset(skip)
        .limit(limit)
    )

    ordenes = list(db.scalars(stmt))
    saldos = saldos_por_orden(db, ordenes)
    filas = [_cobranza_out(orden, saldos[orden.id]) for orden in ordenes]
    if solo_con_saldo:
        filas = [fila for fila in filas if fila.saldo > 0]
    return filas


@router.get(
    "/orden/{orden_id}",
    response_model=PagoOrdenOut,
    summary="Pagos de una orden",
    description=(
        "Historial de pagos vigentes de la orden (del mas antiguo al mas "
        "reciente) con el total, lo cobrado y el saldo. Solo Administrador."
    ),
)
def listar_pagos_orden(
    orden_id: int,
    db: Session = Depends(get_db),
) -> PagoOrdenOut:
    orden = _orden_o_404(db, orden_id)
    pagos = db.scalars(
        select(Pago)
        .where(Pago.orden_id == orden.id, Pago.activo.is_(True))
        .order_by(Pago.created_at.asc(), Pago.id.asc())
    ).all()
    saldo = saldo_de_orden(db, orden)

    return PagoOrdenOut(
        orden_id=orden.id,
        estado=orden.estado,
        cliente_nombre=orden.cliente.nombre,
        vehiculo_placas=orden.vehiculo.placas,
        pagos=[_pago_out(pago) for pago in pagos],
        resumen=_saldo_out(orden.id, saldo),
    )


@router.get(
    "/orden/{orden_id}/saldo",
    response_model=SaldoOrdenOut,
    summary="Saldo pendiente de la orden",
    description=(
        "Total de la orden menos los pagos vigentes (PAG-05). El saldo nunca "
        "se reporta en negativo. Solo Administrador."
    ),
)
def consultar_saldo(
    orden_id: int,
    db: Session = Depends(get_db),
) -> SaldoOrdenOut:
    orden = _orden_o_404(db, orden_id)
    return _saldo_out(orden.id, saldo_de_orden(db, orden))


@router.post(
    "",
    response_model=PagoRegistradoOut,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar pago",
    description=(
        "Registra un anticipo, una parcialidad o la liquidacion de una orden. "
        "Valida el saldo real antes de guardar, deja asiento en la bitacora y "
        "devuelve el saldo que queda (PAG-03, PAG-05). Solo Administrador."
    ),
)
def registrar_pago(
    payload: PagoCreateIn,
    response: Response,
    usuario: UsuarioActual,
    db: Session = Depends(get_db),
) -> PagoRegistradoOut:
    # El bloqueo de la fila serializa dos cobros simultaneos sobre la misma
    # orden: el segundo espera y valida contra el saldo ya actualizado.
    orden = db.scalars(
        select(OrdenServicio)
        .where(OrdenServicio.id == payload.orden_id)
        .with_for_update()
    ).first()
    if orden is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Orden {payload.orden_id} no encontrada",
        )
    if not orden.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La orden {orden.id} esta dada de baja",
        )
    if orden.estado == "Cancelado":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La orden {orden.id} esta cancelada y no admite pagos",
        )

    saldo = saldo_de_orden(db, orden)
    if saldo.total <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"La orden {orden.id} aun no tiene importe: registra el avance "
                "del mecanico antes de cobrar"
            ),
        )
    if saldo.liquidado:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"La orden {orden.id} ya esta liquidada",
        )

    monto = _dinero(payload.monto)
    if monto > saldo.saldo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"El monto {monto} MXN supera el saldo pendiente "
                f"{saldo.saldo} MXN de la orden {orden.id}"
            ),
        )

    if payload.tipo == "Anticipo" and saldo.numero_pagos > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "El anticipo solo aplica al primer cobro; para los siguientes "
                "usa el tipo Parcialidad"
            ),
        )
    if payload.tipo == "Liquidacion" and monto != saldo.saldo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"La liquidacion debe cubrir el saldo completo ({saldo.saldo} "
                f"MXN); se recibieron {monto} MXN"
            ),
        )

    pago = Pago(
        orden_id=orden.id,
        tipo=payload.tipo,
        monto=monto,
        metodo_pago=payload.metodo_pago,
        referencia=payload.referencia,
    )
    db.add(pago)

    try:
        db.flush()
        restante = _dinero(saldo.saldo - monto)
        db.add(
            Bitacora(
                usuario_id=usuario.id,
                tabla_afectada=_TABLA,
                registro_id=pago.id,
                accion="Creacion",
                detalle=(
                    f"Pago {pago.id} ({pago.tipo}) de {monto} MXN por "
                    f"{pago.metodo_pago} en la orden {orden.id}. "
                    f"Saldo restante: {restante} MXN"
                    + (f". Referencia: {pago.referencia}" if pago.referencia else "")
                ),
            )
        )
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo registrar el pago en la base de datos",
        ) from exc

    db.refresh(pago)
    response.headers["Location"] = (
        f"{settings.API_V1_PREFIX}/pagos/orden/{orden.id}"
    )
    return PagoRegistradoOut(
        pago=_pago_out(pago),
        resumen=_saldo_out(orden.id, saldo_de_orden(db, orden)),
    )
