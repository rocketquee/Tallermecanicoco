"""Schemas del catalogo de proveedores (PRV-01, PRV-02, PRV-09).

El listado lo consumen las pantallas de Proveedores y de Refacciones. Las
altas y ediciones estan reservadas al Administrador (PRV-01). ``activo =
false`` es la baja logica (SEG-07): un proveedor con compras o refacciones
nunca se borra fisicamente.
"""

from datetime import datetime
from typing import Literal, Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)

Moneda = Literal["EUR", "GBP", "MXN", "USD"]


class ProveedorOut(BaseModel):
    """Proveedor con los datos que muestra la tabla del frontend."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    pais: str
    contacto: Optional[str] = None
    telefono: Optional[str] = None
    correo: Optional[str] = None
    tiempo_entrega_dias: Optional[int] = None
    moneda: Moneda
    activo: bool
    created_at: datetime
    updated_at: datetime


class ProveedorCreateIn(BaseModel):
    """Alta de un proveedor (PRV-01, PRV-02, PRV-09).

    ``tiempo_entrega_dias`` alimenta la fecha estimada de llegada de las
    compras (PRV-02). Los datos de contacto son opcionales porque hay
    proveedores que solo se manejan por tienda en linea.
    """

    nombre: str = Field(..., min_length=1, max_length=150)
    pais: str = Field(..., min_length=1, max_length=60)
    contacto: Optional[str] = Field(None, max_length=150)
    telefono: Optional[str] = Field(None, max_length=30)
    correo: Optional[str] = Field(None, max_length=150)
    tiempo_entrega_dias: Optional[int] = Field(
        None,
        ge=0,
        le=365,
        description="Dias que tarda la entrega; se usa para la fecha estimada",
    )
    moneda: Moneda = Field(
        "MXN", description="Moneda en la que cotiza el proveedor"
    )

    @field_validator(
        "nombre", "pais", "contacto", "telefono", "correo", mode="before"
    )
    @classmethod
    def _limpiar_texto(cls, valor: object) -> object:
        if isinstance(valor, str):
            valor = " ".join(valor.split())
            return valor or None
        return valor


class ProveedorUpdateIn(BaseModel):
    """Actualizacion parcial; ``activo = false`` es la baja logica (SEG-07)."""

    nombre: Optional[str] = Field(None, min_length=1, max_length=150)
    pais: Optional[str] = Field(None, min_length=1, max_length=60)
    contacto: Optional[str] = Field(None, max_length=150)
    telefono: Optional[str] = Field(None, max_length=30)
    correo: Optional[str] = Field(None, max_length=150)
    tiempo_entrega_dias: Optional[int] = Field(None, ge=0, le=365)
    moneda: Optional[Moneda] = None
    activo: Optional[bool] = Field(
        None, description="Borrado logico (SEG-07)"
    )

    @field_validator(
        "nombre", "pais", "contacto", "telefono", "correo", mode="before"
    )
    @classmethod
    def _limpiar_texto(cls, valor: object) -> object:
        if isinstance(valor, str):
            valor = " ".join(valor.split())
            return valor or None
        return valor

    @model_validator(mode="after")
    def _rechazar_nulos_obligatorios(self) -> "ProveedorUpdateIn":
        """Un ``null`` explicito en una columna NOT NULL daria un 500."""
        obligatorios = ("nombre", "pais", "moneda", "activo")
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
