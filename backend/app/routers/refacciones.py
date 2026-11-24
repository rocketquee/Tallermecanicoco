"""Endpoints del catalogo de refacciones (INV-01 a INV-05).

* ``GET /refacciones``: consulta usada por el modal de avance del mecanico y por
  la vista de Inventario. No devuelve precios (SEG-18) pero si ``stock_minimo``
  para marcar las piezas bajo el umbral.
* ``POST /refacciones``: alta de una pieza del catalogo. Solo Administrador y
  Recepcion. Si nace con existencias, deja un movimiento ``Entrada``.
* ``PUT /refacciones/{id}``: actualizacion parcial. ``activo = false`` es la
  baja logica (SEG-07); nunca se borra fisicamente. Los ajustes de stock
  dejan un movimiento ``Ajuste``.
* ``POST /refacciones/{id}/entrada``: "Surtir inventario". Solo Administrador y
  Recepcion. Suma piezas, deja un movimiento ``Entrada`` (INV-02, INV-05) y un
  asiento en la bitacora (SEG-06), todo en una sola transaccion.

Convenciones:

* Prefijo ``/api/v1`` aplicado en ``main.py``; aqui solo va ``/refacciones``.
* El mecanico recibe 403 al intentar surtir o editar; su vista solo lista
  catalogo.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import UsuarioActual, get_current_user, requiere_roles
from app.models import (
    Bitacora,
    MovimientoInventario,
    Proveedor,
    Refaccion,
)
from app.schemas.refacciones import (
    EntradaInventarioIn,
    RefaccionCreateIn,
    RefaccionDisponibleOut,
    RefaccionUpdateIn,
)

router = APIRouter(
    prefix="/refacciones",
    tags=["Refacciones"],
    dependencies=[Depends(get_current_user)],
)

_TABLA = "refacciones"


def _refaccion_o_404(db: Session, refaccion_id: int) -> Refaccion:
    """Busca una refaccion por id o lanza 404."""
    refaccion = db.get(Refaccion, refaccion_id)
    if refaccion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Refaccion {refaccion_id} no encontrada",
        )
    return refaccion


def _proveedor_activo(db: Session, proveedor_id: int) -> None:
    """Valida que el proveedor exista y siga vigente."""
    proveedor = db.get(Proveedor, proveedor_id)
    if proveedor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Proveedor {proveedor_id} no encontrado",
        )
    if not proveedor.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El proveedor {proveedor_id} esta dado de baja",
        )


def _guardar(db: Session, mensaje: str) -> None:
    """Commit con rollback ante cualquier error de la BD."""
    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=mensaje,
        ) from exc


@router.get(
    "",
    response_model=list[RefaccionDisponibleOut],
    summary="Listar refacciones",
    description=(
        "Catalogo vigente. Por defecto solo devuelve refacciones con "
        "existencia; la vista de Inventario pide `disponibles=false` para ver "
        "tambien las agotadas. No incluye precios (SEG-18)."
    ),
)
def listar_refacciones(
    db: Session = Depends(get_db),
    busqueda: Annotated[
        str | None,
        Query(max_length=100, description="Filtra por nombre o marca"),
    ] = None,
    disponibles: Annotated[
        bool, Query(description="Solo refacciones con stock_actual > 0")
    ] = True,
    limit: Annotated[
        int, Query(ge=1, le=200, description="Maximo de registros")
    ] = 100,
) -> list[RefaccionDisponibleOut]:
    stmt = select(Refaccion).where(Refaccion.activo == 1)
    if disponibles:
        stmt = stmt.where(Refaccion.stock_actual > 0)
    if busqueda:
        texto = f"%{busqueda.strip()}%"
        stmt = stmt.where(
            or_(Refaccion.nombre.like(texto), Refaccion.marca.like(texto))
        )
    stmt = stmt.order_by(Refaccion.nombre.asc(), Refaccion.id.asc()).limit(limit)
    return list(db.scalars(stmt))


@router.post(
    "/{refaccion_id}/entrada",
    response_model=RefaccionDisponibleOut,
    summary="Surtir inventario",
    description=(
        "Suma existencias a una refaccion (Administrador y Recepcion). "
        "Bloquea la fila para no perder entradas concurrentes, registra el "
        "movimiento de Entrada y deja el asiento en la bitacora."
    ),
    dependencies=[Depends(requiere_roles("Administrador", "Recepcion"))],
)
def surtir_inventario(
    refaccion_id: int,
    payload: EntradaInventarioIn,
    usuario: UsuarioActual,
    db: Session = Depends(get_db),
) -> Refaccion:
    refaccion = db.scalars(
        select(Refaccion)
        .where(Refaccion.id == refaccion_id)
        .with_for_update()
    ).first()
    if refaccion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Refaccion {refaccion_id} no encontrada",
        )
    if not refaccion.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La refaccion {refaccion_id} esta dada de baja",
        )

    stock_anterior = refaccion.stock_actual
    refaccion.stock_actual = stock_anterior + payload.cantidad
    motivo = payload.motivo or "Entrada manual de inventario"

    db.add(
        MovimientoInventario(
            refaccion_id=refaccion.id,
            tipo="Entrada",
            cantidad=payload.cantidad,
            motivo=motivo,
            usuario=usuario.nombre,
        )
    )
    db.add(
        Bitacora(
            usuario_id=usuario.id,
            tabla_afectada=_TABLA,
            registro_id=refaccion.id,
            accion="Actualizacion",
            detalle=(
                f"Refaccion {refaccion.id} ({refaccion.nombre}): entrada de "
                f"{payload.cantidad} pieza(s), stock {stock_anterior} -> "
                f"{refaccion.stock_actual}. Motivo: {motivo}"
            ),
        )
    )

    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo surtir el inventario en la base de datos",
        ) from exc

    db.refresh(refaccion)
    return refaccion


@router.post(
    "",
    response_model=RefaccionDisponibleOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear refaccion",
    description=(
        "Alta de una pieza del catalogo (Administrador y Recepcion). Si nace "
        "con existencias se registra un movimiento de Entrada y el alta queda "
        "en la bitacora."
    ),
    dependencies=[Depends(requiere_roles("Administrador", "Recepcion"))],
)
def crear_refaccion(
    payload: RefaccionCreateIn,
    response: Response,
    usuario: UsuarioActual,
    db: Session = Depends(get_db),
) -> Refaccion:
    if payload.proveedor_id is not None:
        _proveedor_activo(db, payload.proveedor_id)

    refaccion = Refaccion(**payload.model_dump())
    db.add(refaccion)
    try:
        db.flush()
        if refaccion.stock_actual > 0:
            db.add(
                MovimientoInventario(
                    refaccion_id=refaccion.id,
                    tipo="Entrada",
                    cantidad=refaccion.stock_actual,
                    motivo="Stock inicial al dar de alta la refaccion",
                    usuario=usuario.nombre,
                )
            )
        db.add(
            Bitacora(
                usuario_id=usuario.id,
                tabla_afectada=_TABLA,
                registro_id=refaccion.id,
                accion="Creacion",
                detalle=(
                    f"Refaccion {refaccion.id} ({refaccion.nombre}) creada "
                    f"con stock inicial {refaccion.stock_actual}"
                ),
            )
        )
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo crear la refaccion en la base de datos",
        ) from exc

    db.refresh(refaccion)
    response.headers["Location"] = (
        f"{settings.API_V1_PREFIX}/refacciones/{refaccion.id}"
    )
    return refaccion


@router.put(
    "/{refaccion_id}",
    response_model=RefaccionDisponibleOut,
    summary="Actualizar o dar de baja una refaccion",
    description=(
        "Actualizacion parcial. Enviar `activo = false` es la baja logica "
        "(SEG-07): la pieza deja de aparecer en el catalogo pero conserva su "
        "historial. Un cambio manual de `stock_actual` deja un movimiento de "
        "Ajuste. Solo Administrador y Recepcion."
    ),
    dependencies=[Depends(requiere_roles("Administrador", "Recepcion"))],
)
def actualizar_refaccion(
    refaccion_id: int,
    payload: RefaccionUpdateIn,
    usuario: UsuarioActual,
    db: Session = Depends(get_db),
) -> Refaccion:
    datos = payload.model_dump(exclude_unset=True)
    if not datos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Envia al menos un campo para actualizar",
        )

    refaccion = _refaccion_o_404(db, refaccion_id)
    if datos.get("proveedor_id") is not None:
        _proveedor_activo(db, datos["proveedor_id"])

    stock_anterior = refaccion.stock_actual
    for campo, valor in datos.items():
        setattr(refaccion, campo, valor)

    if (
        "stock_actual" in datos
        and refaccion.stock_actual != stock_anterior
    ):
        db.add(
            MovimientoInventario(
                refaccion_id=refaccion.id,
                tipo="Ajuste",
                cantidad=abs(refaccion.stock_actual - stock_anterior),
                motivo=(
                    "Ajuste manual de stock: "
                    f"{stock_anterior} -> {refaccion.stock_actual}"
                ),
                usuario=usuario.nombre,
            )
        )

    if datos.get("activo") is False:
        cambio = "baja logica"
    elif datos.get("activo") is True:
        cambio = "reactivacion"
    else:
        cambio = "actualizacion de datos"

    db.add(
        Bitacora(
            usuario_id=usuario.id,
            tabla_afectada=_TABLA,
            registro_id=refaccion.id,
            accion="Actualizacion",
            detalle=(
                f"Refaccion {refaccion.id} ({refaccion.nombre}): {cambio}. "
                f"Campos: {', '.join(sorted(datos))}"
            ),
        )
    )

    _guardar(db, "No se pudo actualizar la refaccion en la base de datos")
    db.refresh(refaccion)
    return refaccion
