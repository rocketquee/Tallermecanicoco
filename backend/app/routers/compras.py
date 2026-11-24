"""Endpoints de ordenes de compra a proveedores (PRV-03 a PRV-09).

* ``GET /compras``: listado de compras con proveedor, fecha, estado y total.
  Solo Administrador: los importes son informacion financiera y Recepcion no
  debe verlos (SEG-02).
* ``GET /compras/{id}``: detalle con las lineas de piezas.
* ``POST /compras``: registra una compra en estado ``Borrador``. Solo
  Administrador. El total se calcula en el backend; el frontend nunca envia
  importes (SEG-18).

La compra nace en ``Borrador`` a proposito: PRV-07 impide enviarla sin la
aprobacion del Administrador. El flujo Aprobada -> Enviada -> Recibida (con
entrada de inventario) queda para el siguiente bloque.
"""

from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import UsuarioActual, requiere_roles
from app.models import (
    Bitacora,
    Compra,
    DetalleCompra,
    OrdenServicio,
    Proveedor,
    Refaccion,
)
from app.schemas.compras import (
    CompraCreateIn,
    CompraOut,
    DetalleCompraOut,
    EstadoCompra,
)

router = APIRouter(
    prefix="/compras",
    tags=["Compras"],
    dependencies=[Depends(requiere_roles("Administrador"))],
)

_TABLA = "compras"
_CENTAVO = Decimal("0.01")


def _consulta_base():
    """Compra con proveedor y lineas (con su refaccion) ya cargados."""
    return select(Compra).options(
        selectinload(Compra.proveedor),
        selectinload(Compra.detalles).selectinload(DetalleCompra.refaccion),
    )


def _compra_o_404(db: Session, compra_id: int) -> Compra:
    """Busca una compra por id o lanza 404."""
    compra = db.scalars(
        _consulta_base().where(Compra.id == compra_id)
    ).first()
    if compra is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Compra {compra_id} no encontrada",
        )
    return compra


def _detalle_out(detalle: DetalleCompra) -> DetalleCompraOut:
    """Convierte una linea del ORM al schema de salida."""
    importe = (
        detalle.precio_unitario_moneda * detalle.cantidad
    ).quantize(_CENTAVO, rounding=ROUND_HALF_UP)
    return DetalleCompraOut(
        id=detalle.id,
        refaccion_id=detalle.refaccion_id,
        refaccion_nombre=detalle.refaccion.nombre,
        cantidad=detalle.cantidad,
        precio_unitario_moneda=detalle.precio_unitario_moneda,
        importe=importe,
    )


def _compra_out(compra: Compra) -> CompraOut:
    """Convierte una compra del ORM al schema de salida."""
    return CompraOut(
        id=compra.id,
        proveedor_id=compra.proveedor_id,
        proveedor_nombre=compra.proveedor.nombre,
        fecha_pedido=compra.fecha_pedido,
        fecha_estimada_llegada=compra.fecha_estimada_llegada,
        estado=compra.estado,
        moneda_original=compra.moneda_original,
        tipo_cambio=compra.tipo_cambio,
        total_moneda_original=compra.total_moneda_original,
        total_mxn=compra.total_mxn,
        orden_id=compra.orden_id,
        solicitado_por=compra.solicitado_por,
        aprobado_por=compra.aprobado_por,
        activo=compra.activo,
        detalles=[_detalle_out(detalle) for detalle in compra.detalles],
    )


@router.get(
    "",
    response_model=list[CompraOut],
    summary="Listar compras",
    description=(
        "Compras registradas, de la mas reciente a la mas antigua. Se puede "
        "filtrar por estado y proveedor. Solo Administrador."
    ),
)
def listar_compras(
    db: Session = Depends(get_db),
    estado: Annotated[
        EstadoCompra | None,
        Query(description="Filtra por estado de la compra"),
    ] = None,
    proveedor_id: Annotated[
        int | None, Query(gt=0, description="Filtra por proveedor")
    ] = None,
    incluir_inactivos: Annotated[
        bool, Query(description="Incluye compras con activo = 0")
    ] = False,
    skip: Annotated[int, Query(ge=0, description="Registros a saltar")] = 0,
    limit: Annotated[
        int, Query(ge=1, le=200, description="Maximo de registros")
    ] = 50,
) -> list[CompraOut]:
    stmt = _consulta_base()
    if not incluir_inactivos:
        stmt = stmt.where(Compra.activo == 1)
    if estado is not None:
        stmt = stmt.where(Compra.estado == estado)
    if proveedor_id is not None:
        stmt = stmt.where(Compra.proveedor_id == proveedor_id)
    stmt = (
        stmt.order_by(Compra.fecha_pedido.desc(), Compra.id.desc())
        .offset(skip)
        .limit(limit)
    )
    return [_compra_out(compra) for compra in db.scalars(stmt)]


@router.get(
    "/{compra_id}",
    response_model=CompraOut,
    summary="Detalle de la compra",
    description="Compra con proveedor, estado, totales y lineas de piezas.",
)
def obtener_compra(
    compra_id: int,
    db: Session = Depends(get_db),
) -> CompraOut:
    return _compra_out(_compra_o_404(db, compra_id))


@router.post(
    "",
    response_model=CompraOut,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar compra",
    description=(
        "Registra una compra en estado `Borrador` (PRV-03). Valida que el "
        "proveedor y la refaccion esten vigentes, calcula totales en la "
        "moneda del proveedor y en MXN, estima la llegada con el tiempo de "
        "entrega (PRV-02, PRV-09) y deja asiento en la bitacora. Solo "
        "Administrador."
    ),
)
def crear_compra(
    payload: CompraCreateIn,
    response: Response,
    usuario: UsuarioActual,
    db: Session = Depends(get_db),
) -> CompraOut:
    proveedor = db.get(Proveedor, payload.proveedor_id)
    if proveedor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Proveedor {payload.proveedor_id} no encontrado",
        )
    if not proveedor.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El proveedor {proveedor.id} esta dado de baja",
        )

    refaccion = db.get(Refaccion, payload.refaccion_id)
    if refaccion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Refaccion {payload.refaccion_id} no encontrada",
        )
    if not refaccion.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La refaccion {refaccion.id} esta dada de baja",
        )

    orden: OrdenServicio | None = None
    if payload.orden_id is not None:
        orden = db.get(OrdenServicio, payload.orden_id)
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

    # PRV-09: la compra se guarda en la moneda del proveedor. Si no es MXN,
    # el tipo de cambio es obligatorio para poder reportar el equivalente.
    if proveedor.moneda == "MXN":
        tipo_cambio = Decimal("1")
    else:
        if payload.tipo_cambio is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"El proveedor cotiza en {proveedor.moneda}; envia "
                    "tipo_cambio para calcular el total en MXN"
                ),
            )
        tipo_cambio = payload.tipo_cambio

    precio = payload.precio_unitario_moneda
    if precio is None:
        # El modal solo pide proveedor, refaccion y cantidad: se usa el costo
        # del catalogo como precio de referencia.
        precio = refaccion.precio_costo

    total_original = (precio * payload.cantidad).quantize(
        _CENTAVO, rounding=ROUND_HALF_UP
    )
    total_mxn = (total_original * tipo_cambio).quantize(
        _CENTAVO, rounding=ROUND_HALF_UP
    )

    fecha_estimada = payload.fecha_estimada_llegada
    if fecha_estimada is None and proveedor.tiempo_entrega_dias is not None:
        fecha_estimada = date.today() + timedelta(
            days=proveedor.tiempo_entrega_dias
        )

    compra = Compra(
        proveedor_id=proveedor.id,
        orden_id=orden.id if orden is not None else None,
        estado="Borrador",
        moneda_original=proveedor.moneda,
        tipo_cambio=tipo_cambio,
        total_moneda_original=total_original,
        total_mxn=total_mxn,
        solicitado_por=usuario.nombre,
        fecha_estimada_llegada=fecha_estimada,
    )
    db.add(compra)

    try:
        db.flush()
        db.add(
            DetalleCompra(
                compra_id=compra.id,
                refaccion_id=refaccion.id,
                cantidad=payload.cantidad,
                precio_unitario_moneda=precio,
            )
        )
        db.add(
            Bitacora(
                usuario_id=usuario.id,
                tabla_afectada=_TABLA,
                registro_id=compra.id,
                accion="Creacion",
                detalle=(
                    f"Compra {compra.id} registrada en Borrador: "
                    f"{payload.cantidad} x {refaccion.nombre} a "
                    f"{proveedor.nombre}. Total: {total_original} "
                    f"{proveedor.moneda} ({total_mxn} MXN)"
                ),
            )
        )
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo registrar la compra en la base de datos",
        ) from exc

    db.refresh(compra)
    response.headers["Location"] = (
        f"{settings.API_V1_PREFIX}/compras/{compra.id}"
    )
    return _compra_out(compra)
