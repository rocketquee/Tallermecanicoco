"""Endpoints del catalogo de refacciones (INV-01 a INV-05).

* ``GET /refacciones``: consulta usada por el modal de avance del mecanico y por
  la vista de Inventario. No devuelve precios (SEG-18) pero si ``stock_minimo``
  para marcar las piezas bajo el umbral.
* ``POST /refacciones/{id}/entrada``: "Surtir inventario". Solo Administrador y
  Recepcion. Suma piezas, deja un movimiento ``Entrada`` (INV-02, INV-05) y un
  asiento en la bitacora (SEG-06), todo en una sola transaccion.

Convenciones:

* Prefijo ``/api/v1`` aplicado en ``main.py``; aqui solo va ``/refacciones``.
* El mecanico recibe 403 al intentar surtir; su vista solo lista catalogo.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import UsuarioActual, get_current_user, requiere_roles
from app.models import Bitacora, MovimientoInventario, Refaccion
from app.schemas.refacciones import EntradaInventarioIn, RefaccionDisponibleOut

router = APIRouter(
    prefix="/refacciones",
    tags=["Refacciones"],
    dependencies=[Depends(get_current_user)],
)

_TABLA = "refacciones"


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
    stmt = select(Refaccion).where(Refaccion.activo.is_(True))
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
