"""Endpoints de clientes (CLI-01 a CLI-06).

Autenticacion y privacidad:

* Todo el router exige ``Authorization: Bearer <token>`` (``get_current_user``).
* Crear y actualizar estan limitados a Administrador y Recepcion; un Mecanico
  recibe 403 (SEG-02, SEG-03).
* Al listar y consultar, ``app.core.privacidad`` enmascara los datos segun el
  rol: un Mecanico nunca ve descuentos, condiciones de pago ni el valor de los
  vehiculos, y si el cliente es ``confidencial`` solo ve la etiqueta
  "Cliente confidencial" y las placas (SEG-17, SEG-18).

Convenciones:

* Prefijo ``/api/v1`` aplicado en ``main.py``; aqui solo va ``/clientes``.
* Borrado logico: no hay DELETE. Se apaga con ``PUT {"activo": false}`` (SEG-07).
* PostgreSQL distingue mayusculas en ``LIKE``; las busquedas usan ``ILIKE``
  para mantener el comportamiento insensible a mayusculas del sistema anterior
  (los acentos si se distinguen).
* Los errores de validacion los responde FastAPI con 422 antes de llegar a la
  BD. Un ``cliente_id`` inexistente lo rechaza la FK de PostgreSQL.
"""

from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import UsuarioActual, get_current_user, requiere_roles
from app.core.privacidad import cliente_visible, ficha_visible
from app.models import Cliente, Vehiculo
from app.schemas.clientes import (
    CategoriaCliente,
    ClienteConVehiculos,
    ClienteCreate,
    ClienteOut,
    ClienteUpdate,
)

router = APIRouter(
    prefix="/clientes",
    tags=["Clientes"],
    dependencies=[Depends(get_current_user)],
)


def _cliente_o_404(
    db: Session, cliente_id: int, *, con_vehiculos: bool = False
) -> Cliente:
    """Busca un cliente por id o lanza 404."""
    stmt = select(Cliente).where(Cliente.id == cliente_id)
    if con_vehiculos:
        # Solo vehiculos vigentes; el historial queda en la BD (SEG-07).
        stmt = stmt.options(
            selectinload(Cliente.vehiculos.and_(Vehiculo.activo.is_(True)))
        )
    cliente = db.scalar(stmt)
    if cliente is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente {cliente_id} no encontrado",
        )
    return cliente


def _guardar(db: Session) -> None:
    """Commit con rollback ante cualquier error de la BD."""
    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo guardar el cliente en la base de datos",
        ) from exc


@router.get(
    "",
    response_model=list[ClienteOut],
    summary="Listar clientes",
    description=(
        "Listado paginado con busqueda por nombre, correo o telefono. "
        "Si el usuario es Mecanico, los clientes confidenciales salen "
        "enmascarados y sin datos de precio."
    ),
)
def listar_clientes(
    usuario: UsuarioActual,
    db: Session = Depends(get_db),
    q: Annotated[
        str | None,
        Query(
            min_length=1,
            max_length=150,
            description="Busca en nombre, correo, telefono1 y telefono2",
        ),
    ] = None,
    categoria: Annotated[
        CategoriaCliente | None,
        Query(description="Filtra por categoria: Regular o VIP"),
    ] = None,
    incluir_inactivos: Annotated[
        bool, Query(description="Incluye clientes con activo = 0")
    ] = False,
    skip: Annotated[int, Query(ge=0, description="Registros a saltar")] = 0,
    limit: Annotated[
        int, Query(ge=1, le=200, description="Maximo de registros")
    ] = 50,
) -> list[Cliente]:
    stmt = select(Cliente)
    if not incluir_inactivos:
        stmt = stmt.where(Cliente.activo.is_(True))
    if categoria is not None:
        stmt = stmt.where(Cliente.categoria == categoria)
    if q:
        patron = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Cliente.nombre.ilike(patron),
                Cliente.correo.ilike(patron),
                Cliente.telefono1.ilike(patron),
                Cliente.telefono2.ilike(patron),
            )
        )
    stmt = stmt.order_by(Cliente.nombre, Cliente.id).offset(skip).limit(limit)
    return [cliente_visible(cliente, usuario) for cliente in db.scalars(stmt)]


@router.get(
    "/{cliente_id}",
    response_model=ClienteConVehiculos,
    summary="Obtener un cliente",
    description=(
        "Ficha del cliente con sus vehiculos vigentes. Para el rol Mecanico "
        "se ocultan precios y, si el cliente es confidencial, sus datos "
        "personales (SEG-17)."
    ),
)
def obtener_cliente(
    cliente_id: int, usuario: UsuarioActual, db: Session = Depends(get_db)
) -> ClienteConVehiculos:
    cliente = _cliente_o_404(db, cliente_id, con_vehiculos=True)
    return ficha_visible(cliente, usuario)


@router.post(
    "",
    response_model=ClienteOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear cliente",
    description=(
        "Alta de cliente (solo Administrador y Recepcion). Si la categoria es "
        "VIP y no se envia `descuento_mano_obra`, se aplica 10% (CLI-03)."
    ),
    dependencies=[Depends(requiere_roles("Administrador", "Recepcion"))],
)
def crear_cliente(
    payload: ClienteCreate,
    response: Response,
    db: Session = Depends(get_db),
) -> Cliente:
    cliente = Cliente(**payload.model_dump())
    db.add(cliente)
    _guardar(db)
    db.refresh(cliente)
    response.headers["Location"] = (
        f"{settings.API_V1_PREFIX}/clientes/{cliente.id}"
    )
    return cliente


@router.put(
    "/{cliente_id}",
    response_model=ClienteOut,
    summary="Actualizar cliente",
    description=(
        "Actualizacion parcial: solo se aplican los campos enviados "
        "(`exclude_unset`). Enviar `null` limpia un campo opcional. "
        "Al pasar de Regular a VIP sin enviar descuento se aplica 10%. "
        "Solo Administrador y Recepcion."
    ),
    dependencies=[Depends(requiere_roles("Administrador", "Recepcion"))],
)
def actualizar_cliente(
    cliente_id: int,
    payload: ClienteUpdate,
    db: Session = Depends(get_db),
) -> Cliente:
    datos = payload.model_dump(exclude_unset=True)
    if not datos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Envia al menos un campo para actualizar",
        )

    cliente = _cliente_o_404(db, cliente_id)
    categoria_anterior = cliente.categoria
    for campo, valor in datos.items():
        setattr(cliente, campo, valor)

    # CLI-03: Regular -> VIP sin descuento explicito se queda con el 10%.
    if (
        categoria_anterior != "VIP"
        and datos.get("categoria") == "VIP"
        and "descuento_mano_obra" not in datos
    ):
        cliente.descuento_mano_obra = Decimal("10.00")

    _guardar(db)
    db.refresh(cliente)
    return cliente
