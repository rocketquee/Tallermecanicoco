"""Endpoints de vehiculos (VEH-01 a VEH-08).

Autenticacion y privacidad:

* Todo el router exige ``Authorization: Bearer <token>`` (``get_current_user``).
* Crear y actualizar estan limitados a Administrador y Recepcion; un Mecanico
  recibe 403 (SEG-02, SEG-03).
* El Mecanico puede consultar placas, VIN, marca, modelo y kilometraje, pero
  ``valor_aproximado`` siempre sale ``null`` (SEG-18).

Convenciones:

* Prefijo ``/api/v1`` aplicado en ``main.py``; aqui solo va ``/vehiculos``.
* Borrado logico: no hay DELETE. Se apaga con ``PUT {"activo": false}`` (SEG-07).
* No se puede registrar un vehiculo a nombre de un cliente dado de baja.
* MySQL usa ``utf8mb4_unicode_ci``; ``LIKE`` ya es insensible a mayusculas y
  acentos.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import UsuarioActual, get_current_user, requiere_roles
from app.core.privacidad import vehiculo_visible
from app.models import Cliente, Vehiculo
from app.schemas.vehiculos import VehiculoCreate, VehiculoOut, VehiculoUpdate

router = APIRouter(
    prefix="/vehiculos",
    tags=["Vehiculos"],
    dependencies=[Depends(get_current_user)],
)


def _cliente_activo(db: Session, cliente_id: int) -> Cliente:
    """Valida que el dueño exista y siga vigente."""
    cliente = db.get(Cliente, cliente_id)
    if cliente is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente {cliente_id} no encontrado",
        )
    if not cliente.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El cliente {cliente_id} esta dado de baja",
        )
    return cliente


def _vehiculo_o_404(db: Session, vehiculo_id: int) -> Vehiculo:
    """Busca un vehiculo por id o lanza 404."""
    vehiculo = db.get(Vehiculo, vehiculo_id)
    if vehiculo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehiculo {vehiculo_id} no encontrado",
        )
    return vehiculo


def _guardar(db: Session) -> None:
    """Commit con rollback ante cualquier error de la BD."""
    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo guardar el vehiculo en la base de datos",
        ) from exc


@router.get(
    "",
    response_model=list[VehiculoOut],
    summary="Listar vehiculos",
    description=(
        "Listado paginado con filtro por cliente y busqueda por placas, VIN, "
        "marca o modelo. Si el usuario es Mecanico, `valor_aproximado` sale "
        "en `null`."
    ),
)
def listar_vehiculos(
    usuario: UsuarioActual,
    db: Session = Depends(get_db),
    cliente_id: Annotated[
        int | None, Query(gt=0, description="Filtra los vehiculos de un cliente")
    ] = None,
    q: Annotated[
        str | None,
        Query(
            min_length=1,
            max_length=50,
            description="Busca en placas, VIN, marca y modelo",
        ),
    ] = None,
    incluir_inactivos: Annotated[
        bool, Query(description="Incluye vehiculos con activo = 0")
    ] = False,
    skip: Annotated[int, Query(ge=0, description="Registros a saltar")] = 0,
    limit: Annotated[
        int, Query(ge=1, le=200, description="Maximo de registros")
    ] = 50,
) -> list[VehiculoOut]:
    stmt = select(Vehiculo)
    if not incluir_inactivos:
        stmt = stmt.where(Vehiculo.activo == 1)
    if cliente_id is not None:
        stmt = stmt.where(Vehiculo.cliente_id == cliente_id)
    if q:
        patron = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Vehiculo.placas.like(patron),
                Vehiculo.vin.like(patron),
                Vehiculo.marca.like(patron),
                Vehiculo.modelo.like(patron),
            )
        )
    stmt = stmt.order_by(Vehiculo.placas, Vehiculo.id).offset(skip).limit(limit)
    return [vehiculo_visible(vehiculo, usuario) for vehiculo in db.scalars(stmt)]


@router.get(
    "/{vehiculo_id}",
    response_model=VehiculoOut,
    summary="Obtener un vehiculo",
    description=(
        "Ficha del vehiculo. Para el rol Mecanico el valor estimado siempre "
        "sale en `null` (SEG-18)."
    ),
)
def obtener_vehiculo(
    vehiculo_id: int, usuario: UsuarioActual, db: Session = Depends(get_db)
) -> VehiculoOut:
    return vehiculo_visible(_vehiculo_o_404(db, vehiculo_id), usuario)


@router.post(
    "",
    response_model=VehiculoOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear vehiculo",
    description=(
        "Alta de vehiculo asociada a un cliente vigente. "
        "Solo Administrador y Recepcion."
    ),
    dependencies=[Depends(requiere_roles("Administrador", "Recepcion"))],
)
def crear_vehiculo(
    payload: VehiculoCreate,
    response: Response,
    db: Session = Depends(get_db),
) -> Vehiculo:
    _cliente_activo(db, payload.cliente_id)
    vehiculo = Vehiculo(**payload.model_dump())
    db.add(vehiculo)
    _guardar(db)
    db.refresh(vehiculo)
    response.headers["Location"] = (
        f"{settings.API_V1_PREFIX}/vehiculos/{vehiculo.id}"
    )
    return vehiculo


@router.put(
    "/{vehiculo_id}",
    response_model=VehiculoOut,
    summary="Actualizar vehiculo",
    description=(
        "Actualizacion parcial: solo se aplican los campos enviados "
        "(`exclude_unset`). Enviar `null` limpia un campo opcional. "
        "Cambiar `cliente_id` exige que el nuevo dueño este vigente. "
        "Solo Administrador y Recepcion."
    ),
    dependencies=[Depends(requiere_roles("Administrador", "Recepcion"))],
)
def actualizar_vehiculo(
    vehiculo_id: int,
    payload: VehiculoUpdate,
    db: Session = Depends(get_db),
) -> Vehiculo:
    datos = payload.model_dump(exclude_unset=True)
    if not datos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Envia al menos un campo para actualizar",
        )

    vehiculo = _vehiculo_o_404(db, vehiculo_id)
    if "cliente_id" in datos:
        _cliente_activo(db, datos["cliente_id"])

    for campo, valor in datos.items():
        setattr(vehiculo, campo, valor)

    _guardar(db)
    db.refresh(vehiculo)
    return vehiculo
