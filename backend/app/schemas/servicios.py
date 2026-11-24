"""Schemas del catalogo de servicios de mano de obra (ORD-10).

El listado se usa en el modal de avance del mecanico para elegir el trabajo
realizado. Igual que con las refacciones, no se exponen precios: el backend
resuelve ``servicios.precio_mano_obra`` al registrar el avance (SEG-18).
"""

from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ServicioDisponibleOut(BaseModel):
    """Servicio vigente que el mecanico puede cargar a una orden."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    descripcion: Optional[str] = None
    duracion_estimada_horas: Optional[Decimal] = None
    activo: bool
