"""Schemas Pydantic para vehiculos (VEH-01 a VEH-08).

Se usan tanto en el modulo de vehiculos como anidados en la ficha del cliente.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

# Un vehiculo clasico puede ser de 1900 en adelante; se admite un año
# modelo por delante del actual porque las agencias los venden asi.
ANIO_MINIMO = 1900
ANIO_MAXIMO = date.today().year + 1


class VehiculoCampos(BaseModel):
    """Columnas del vehiculo, sin validadores (base de entrada y salida)."""

    cliente_id: int = Field(..., gt=0, description="Dueño del vehiculo")
    placas: str = Field(..., min_length=4, max_length=20, examples=["PPG-001-A"])
    vin: Optional[str] = Field(
        None,
        max_length=50,
        description="Numero de serie; el estandar es de 17 caracteres (VEH-01)",
    )
    marca: str = Field(..., min_length=1, max_length=50, examples=["Porsche"])
    modelo: str = Field(..., min_length=1, max_length=50, examples=["911 Carrera"])
    anio: int = Field(..., ge=ANIO_MINIMO, le=ANIO_MAXIMO, examples=[2021])
    color: Optional[str] = Field(None, max_length=30)
    kilometraje_entrada: Optional[int] = Field(
        None, ge=0, description="Kilometraje al ingresar al taller (VEH-02)"
    )
    valor_aproximado: Optional[Decimal] = Field(
        None,
        ge=0,
        max_digits=12,
        decimal_places=2,
        description="Valor estimado para la custodia del vehiculo",
    )


class VehiculoBase(VehiculoCampos):
    """Entrada: normaliza placas, VIN y textos antes de tocar la BD."""

    @field_validator("placas", "vin", mode="before")
    @classmethod
    def _normalizar_identificadores(cls, valor: object) -> object:
        """Quita espacios y pasa a mayusculas placas y VIN."""
        if isinstance(valor, str):
            valor = valor.strip().upper()
            return valor or None
        return valor

    @field_validator("marca", "modelo", "color", mode="before")
    @classmethod
    def _limpiar_texto(cls, valor: object) -> object:
        if isinstance(valor, str):
            valor = " ".join(valor.split())
            return valor or None
        return valor


class VehiculoCreate(VehiculoBase):
    """Alta de vehiculo: ``cliente_id`` debe existir (lo valida la FK)."""


class VehiculoUpdate(VehiculoBase):
    """Actualizacion parcial: solo se aplican los campos enviados."""

    cliente_id: Optional[int] = Field(None, gt=0)  # type: ignore[assignment]
    placas: Optional[str] = Field(None, min_length=4, max_length=20)  # type: ignore[assignment]
    vin: Optional[str] = Field(None, max_length=50)
    marca: Optional[str] = Field(None, min_length=1, max_length=50)  # type: ignore[assignment]
    modelo: Optional[str] = Field(None, min_length=1, max_length=50)  # type: ignore[assignment]
    anio: Optional[int] = Field(None, ge=ANIO_MINIMO, le=ANIO_MAXIMO)  # type: ignore[assignment]
    color: Optional[str] = Field(None, max_length=30)
    kilometraje_entrada: Optional[int] = Field(None, ge=0)
    valor_aproximado: Optional[Decimal] = Field(
        None, ge=0, max_digits=12, decimal_places=2
    )
    activo: Optional[bool] = Field(None, description="Borrado logico (SEG-07)")

    @model_validator(mode="after")
    def _rechazar_nulos_obligatorios(self) -> "VehiculoUpdate":
        """Un ``null`` explicito en una columna NOT NULL daria un 500."""
        obligatorios = ("cliente_id", "placas", "marca", "modelo", "anio", "activo")
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


class VehiculoOut(VehiculoCampos):
    """Vehiculo tal como se devuelve al frontend (sin revalidar la entrada)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    activo: bool
