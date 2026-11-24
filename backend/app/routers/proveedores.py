"""Endpoints del catalogo de proveedores (PRV-01, PRV-02, PRV-09).

* ``GET /proveedores``: listado paginado con busqueda. Lo usan la pantalla de
  Proveedores y el formulario de Refacciones para elegir el proveedor
  habitual.
* ``GET /proveedores/{id}``: ficha para el modal de edicion.
* ``POST /proveedores``: alta. Solo Administrador.
* ``PUT /proveedores/{id}``: actualizacion parcial. Solo Administrador.
  ``activo = false`` es la baja logica (SEG-07); nunca se hace DELETE porque
  las compras y refacciones apuntan a este registro con ``ON DELETE
  RESTRICT``.

Cada alta y cada edicion deja asiento en ``bitacora`` (SEG-06).
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import UsuarioActual, get_current_user, requiere_roles
from app.models import Bitacora, Proveedor
from app.schemas.proveedores import (
    ProveedorCreateIn,
    ProveedorOut,
    ProveedorUpdateIn,
)

router = APIRouter(
    prefix="/proveedores",
    tags=["Proveedores"],
    dependencies=[Depends(get_current_user)],
)

_TABLA = "proveedores"


def _proveedor_o_404(db: Session, proveedor_id: int) -> Proveedor:
    """Busca un proveedor por id o lanza 404."""
    proveedor = db.get(Proveedor, proveedor_id)
    if proveedor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Proveedor {proveedor_id} no encontrado",
        )
    return proveedor


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
    response_model=list[ProveedorOut],
    summary="Listar proveedores",
    description=(
        "Catalogo vigente ordenado por nombre. Busca en nombre, pais, "
        "contacto y correo. `incluir_inactivos=true` muestra las bajas "
        "logicas (SEG-07)."
    ),
)
def listar_proveedores(
    db: Session = Depends(get_db),
    q: Annotated[
        str | None,
        Query(
            min_length=1,
            max_length=150,
            description="Busca en nombre, pais, contacto o correo",
        ),
    ] = None,
    incluir_inactivos: Annotated[
        bool, Query(description="Incluye proveedores con activo = 0")
    ] = False,
    skip: Annotated[int, Query(ge=0, description="Registros a saltar")] = 0,
    limit: Annotated[
        int, Query(ge=1, le=200, description="Maximo de registros")
    ] = 50,
) -> list[Proveedor]:
    stmt = select(Proveedor)
    if not incluir_inactivos:
        stmt = stmt.where(Proveedor.activo == 1)
    if q:
        patron = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Proveedor.nombre.like(patron),
                Proveedor.pais.like(patron),
                Proveedor.contacto.like(patron),
                Proveedor.correo.like(patron),
            )
        )
    stmt = (
        stmt.order_by(Proveedor.nombre.asc(), Proveedor.id.asc())
        .offset(skip)
        .limit(limit)
    )
    return list(db.scalars(stmt))


@router.get(
    "/{proveedor_id}",
    response_model=ProveedorOut,
    summary="Detalle del proveedor",
    description="Ficha completa de un proveedor, incluida una baja logica.",
)
def obtener_proveedor(
    proveedor_id: int,
    db: Session = Depends(get_db),
) -> Proveedor:
    return _proveedor_o_404(db, proveedor_id)


@router.post(
    "",
    response_model=ProveedorOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear proveedor",
    description=(
        "Alta de un proveedor (PRV-01). Solo Administrador. El alta queda "
        "en la bitacora (SEG-06)."
    ),
    dependencies=[Depends(requiere_roles("Administrador"))],
)
def crear_proveedor(
    payload: ProveedorCreateIn,
    response: Response,
    usuario: UsuarioActual,
    db: Session = Depends(get_db),
) -> Proveedor:
    proveedor = Proveedor(**payload.model_dump())
    db.add(proveedor)
    try:
        db.flush()
        db.add(
            Bitacora(
                usuario_id=usuario.id,
                tabla_afectada=_TABLA,
                registro_id=proveedor.id,
                accion="Creacion",
                detalle=(
                    f"Proveedor {proveedor.id} ({proveedor.nombre}, "
                    f"{proveedor.pais}) creado con moneda "
                    f"{proveedor.moneda} y entrega en "
                    f"{proveedor.tiempo_entrega_dias} dia(s)"
                ),
            )
        )
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo crear el proveedor en la base de datos",
        ) from exc

    db.refresh(proveedor)
    response.headers["Location"] = (
        f"{settings.API_V1_PREFIX}/proveedores/{proveedor.id}"
    )
    return proveedor


@router.put(
    "/{proveedor_id}",
    response_model=ProveedorOut,
    summary="Actualizar o dar de baja un proveedor",
    description=(
        "Actualizacion parcial. Enviar `activo = false` es la baja logica "
        "(SEG-07): el proveedor deja de aparecer en el catalogo pero "
        "conserva su historial de compras. Solo Administrador."
    ),
    dependencies=[Depends(requiere_roles("Administrador"))],
)
def actualizar_proveedor(
    proveedor_id: int,
    payload: ProveedorUpdateIn,
    usuario: UsuarioActual,
    db: Session = Depends(get_db),
) -> Proveedor:
    datos = payload.model_dump(exclude_unset=True)
    if not datos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Envia al menos un campo para actualizar",
        )

    proveedor = _proveedor_o_404(db, proveedor_id)
    for campo, valor in datos.items():
        setattr(proveedor, campo, valor)

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
            registro_id=proveedor.id,
            accion="Actualizacion",
            detalle=(
                f"Proveedor {proveedor.id} ({proveedor.nombre}): {cambio}. "
                f"Campos: {', '.join(sorted(datos))}"
            ),
        )
    )

    _guardar(
        db, "No se pudo actualizar el proveedor en la base de datos"
    )
    db.refresh(proveedor)
    return proveedor
