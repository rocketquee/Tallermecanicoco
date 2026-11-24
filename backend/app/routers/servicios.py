"""Endpoints del catalogo de servicios de mano de obra (ORD-10).

* ``GET /servicios``: catalogo vigente para que el mecanico elija el trabajo
  realizado al registrar su avance. No devuelve precios (SEG-18); el backend
  toma ``precio_mano_obra`` al insertar la linea en ``detalle_orden``.

Convenciones:

* Prefijo ``/api/v1`` aplicado en ``main.py``; aqui solo va ``/servicios``.
* Cualquier rol autenticado puede consultar el catalogo.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import Servicio
from app.schemas.servicios import ServicioDisponibleOut

router = APIRouter(
    prefix="/servicios",
    tags=["Servicios"],
    dependencies=[Depends(get_current_user)],
)


@router.get(
    "",
    response_model=list[ServicioDisponibleOut],
    summary="Listar servicios",
    description=(
        "Catalogo de mano de obra vigente, con busqueda por nombre o "
        "descripcion. No incluye precios (SEG-18)."
    ),
)
def listar_servicios(
    db: Session = Depends(get_db),
    busqueda: Annotated[
        str | None,
        Query(max_length=100, description="Filtra por nombre o descripcion"),
    ] = None,
    limit: Annotated[
        int, Query(ge=1, le=200, description="Maximo de registros")
    ] = 100,
) -> list[Servicio]:
    stmt = select(Servicio).where(Servicio.activo == 1)
    if busqueda:
        texto = f"%{busqueda.strip()}%"
        stmt = stmt.where(
            or_(Servicio.nombre.like(texto), Servicio.descripcion.like(texto))
        )
    stmt = stmt.order_by(Servicio.nombre.asc(), Servicio.id.asc()).limit(limit)
    return list(db.scalars(stmt))
