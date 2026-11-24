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

from decimal import Decimal
from typing import Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)


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


class RefaccionCreateIn(BaseModel):
    """Alta de una refaccion del catalogo (INV-01).

    ``stock_actual`` puede nacer en cero: la pieza existe pero se surte
    despues. Si nace con piezas, el router registra un movimiento de Entrada
    para que el inventario tenga trazabilidad desde el primer dia.
    """

    nombre: str = Field(..., min_length=1, max_length=150)
    marca: Optional[str] = Field(None, max_length=50)
    es_especial: bool = Field(
        False, description="Pieza sobre pedido: no se maneja por stock"
    )
    stock_actual: int = Field(0, ge=0, le=999999)
    stock_minimo: int = Field(2, ge=0, le=999999)
    precio_costo: Decimal = Field(..., ge=0, max_digits=12, decimal_places=2)
    precio_venta: Decimal = Field(..., ge=0, max_digits=12, decimal_places=2)
    proveedor_id: Optional[int] = Field(None, gt=0)

    @field_validator("nombre", "marca", mode="before")
    @classmethod
    def _limpiar_texto(cls, valor: object) -> object:
        if isinstance(valor, str):
            valor = " ".join(valor.split())
            return valor or None
        return valor


class RefaccionUpdateIn(BaseModel):
    """Actualizacion parcial; ``activo = false`` es la baja logica (SEG-07)."""

    nombre: Optional[str] = Field(None, min_length=1, max_length=150)
    marca: Optional[str] = Field(None, max_length=50)
    es_especial: Optional[bool] = None
    stock_actual: Optional[int] = Field(None, ge=0, le=999999)
    stock_minimo: Optional[int] = Field(None, ge=0, le=999999)
    precio_costo: Optional[Decimal] = Field(
        None, ge=0, max_digits=12, decimal_places=2
    )
    precio_venta: Optional[Decimal] = Field(
        None, ge=0, max_digits=12, decimal_places=2
    )
    proveedor_id: Optional[int] = Field(None, gt=0)
    activo: Optional[bool] = Field(None, description="Borrado logico (SEG-07)")

    @field_validator("nombre", "marca", mode="before")
    @classmethod
    def _limpiar_texto(cls, valor: object) -> object:
        if isinstance(valor, str):
            valor = " ".join(valor.split())
            return valor or None
        return valor

    @model_validator(mode="after")
    def _rechazar_nulos_obligatorios(self) -> "RefaccionUpdateIn":
        """Un ``null`` explicito en una columna NOT NULL daria un 500."""
        obligatorios = (
            "nombre",
            "es_especial",
            "stock_actual",
            "stock_minimo",
            "precio_costo",
            "precio_venta",
            "activo",
        )
        nulos = [
            campo
            for campo in obligatorios
            if campo in self.model_fields_set and getattr(self, campo) is None
        ]
        if nulos:
            raise ValueError(
                f"estos campos no admiten null: {', '.join(nulos)}"
            )
        return self


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
