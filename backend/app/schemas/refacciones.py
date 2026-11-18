"""Schemas del catalogo de refacciones (INV-01 a INV-05).

* El endpoint de consulta se usa desde el modal del mecanico para elegir las
  piezas que consumio. Por eso no expone precios: el rol Mecanico no puede ver
  importes (SEG-18) y el backend resuelve el precio de venta al registrar el
  consumo.
* La vista de Inventario (Administrador y Recepcion) reutiliza el mismo
  listado, pero incluye ``stock_minimo`` para senalar las piezas bajo el umbral.
* ``EntradaInventarioIn`` alimenta el alta de existencias ("Surtir inventario").
  Cada entrada deja un movimiento y un asiento en la bitacora.
"""

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class RefaccionDisponibleOut(BaseModel):
    """Refaccion activa que el mecanico puede seleccionar o surtir."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    marca: Optional[str] = None
    stock_actual: int
    stock_minimo: int
    es_especial: bool
    activo: bool


class EntradaInventarioIn(BaseModel):
    """Cuerpo para aumentar las existencias de una refaccion (INV-02, INV-05).

    ``cantidad`` son piezas nuevas que se suman a ``stock_actual``. El
    ``motivo`` es opcional; si se omite se registra una entrada manual.
    """

    cantidad: int = Field(
        ...,
        ge=1,
        le=9999,
        description="Piezas que se agregan al stock actual",
    )
    motivo: Optional[str] = Field(
        None,
        max_length=255,
        description="Motivo de la entrada (compra, devolucion, ajuste...)",
    )

    @field_validator("motivo", mode="before")
    @classmethod
    def _limpiar_motivo(cls, valor: object) -> object:
        if isinstance(valor, str):
            valor = " ".join(valor.split())
            return valor or None
        return valor
