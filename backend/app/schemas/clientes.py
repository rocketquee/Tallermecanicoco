import re
from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.vehiculos import VehiculoOut

CategoriaCliente = Literal["Regular", "VIP"]

_CORREO_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$")
_RFC_RE = re.compile(r"^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$")
_CODIGO_POSTAL_RE = re.compile(r"^\d{5}$")


class ClienteCampos(BaseModel):
    """Columnas del cliente, sin validadores (base de entrada y salida)."""

    nombre: str = Field(
        ..., min_length=1, max_length=150, examples=["Rodrigo Salgado"]
    )
    telefono1: Optional[str] = Field(None, max_length=20, examples=["555-123-4567"])
    telefono2: Optional[str] = Field(None, max_length=20)
    correo: Optional[str] = Field(None, max_length=150, examples=["cliente@correo.mx"])
    direccion: Optional[str] = Field(None, max_length=255)
    nombre_asistente: Optional[str] = Field(
        None, max_length=150, description="Asistente o chofer del cliente"
    )
    categoria: CategoriaCliente = Field(
        "Regular", description="VIP recibe prioridad y descuento en mano de obra"
    )
    descuento_mano_obra: Decimal = Field(
        Decimal("0.00"),
        ge=0,
        le=100,
        max_digits=5,
        decimal_places=2,
        description="Porcentaje de descuento solo sobre mano de obra (CLI-03)",
    )
    permite_pagos_parciales: bool = Field(
        False, description="Autoriza anticipos y parcialidades (PAG-04)"
    )
    confidencial: bool = Field(
        False, description="Oculta los datos personales al rol Mecanico (SEG-17)"
    )
    notas: Optional[str] = Field(None, description="Notas internas de atencion")
    rfc: Optional[str] = Field(None, max_length=20, examples=["XAXX010101000"])
    razon_social: Optional[str] = Field(None, max_length=200)
    regimen_fiscal: Optional[str] = Field(None, max_length=100)
    codigo_postal: Optional[str] = Field(None, max_length=10, examples=["11560"])


class ClienteBase(ClienteCampos):
    """Entrada: normaliza textos y valida formato de correo, RFC y CP."""

    @field_validator("nombre", "nombre_asistente", "razon_social", mode="before")
    @classmethod
    def _texto_obligatorio(cls, valor: object) -> object:
        if isinstance(valor, str):
            valor = " ".join(valor.split())
            if not valor:
                raise ValueError("no puede estar vacio")
        return valor

    @field_validator(
        "telefono1",
        "telefono2",
        "correo",
        "direccion",
        "notas",
        "rfc",
        "regimen_fiscal",
        "codigo_postal",
        mode="before",
    )
    @classmethod
    def _texto_opcional(cls, valor: object) -> object:
        """Recorta espacios y convierte cadena vacia en NULL."""
        if isinstance(valor, str):
            valor = valor.strip()
            return valor or None
        return valor

    @field_validator("correo")
    @classmethod
    def _validar_correo(cls, valor: Optional[str]) -> Optional[str]:
        if valor is not None and not _CORREO_RE.match(valor):
            raise ValueError("correo invalido")
        return valor.lower() if valor else valor

    @field_validator("rfc")
    @classmethod
    def _validar_rfc(cls, valor: Optional[str]) -> Optional[str]:
        if valor is None:
            return valor
        valor = valor.upper()
        if not _RFC_RE.match(valor):
            raise ValueError("RFC invalido: se esperan 12 o 13 caracteres")
        return valor

    @field_validator("codigo_postal")
    @classmethod
    def _validar_codigo_postal(cls, valor: Optional[str]) -> Optional[str]:
        if valor is not None and not _CODIGO_POSTAL_RE.match(valor):
            raise ValueError("codigo_postal debe tener 5 digitos")
        return valor


class ClienteCreate(ClienteBase):
    """Alta de cliente.

    CLI-03: si la categoria es VIP y no se envia el descuento, se aplica 10%.
    Si se envia un descuento explicito (aunque sea 0), se respeta.
    """

    @model_validator(mode="after")
    def _descuento_vip_por_defecto(self) -> "ClienteCreate":
        if (
            self.categoria == "VIP"
            and "descuento_mano_obra" not in self.model_fields_set
        ):
            self.descuento_mano_obra = Decimal("10.00")
        return self


class ClienteUpdate(ClienteBase):
    """Actualizacion parcial: solo se aplican los campos enviados.

    Enviar ``null`` en un campo opcional lo limpia en la BD; omitirlo lo deja
    intacto (el router usa ``exclude_unset``). ``activo`` permite reactivar o
    dar de baja logicamente (SEG-07).
    """

    nombre: Optional[str] = Field(None, min_length=1, max_length=150)  # type: ignore[assignment]
    telefono1: Optional[str] = Field(None, max_length=20)
    telefono2: Optional[str] = Field(None, max_length=20)
    correo: Optional[str] = Field(None, max_length=150)
    direccion: Optional[str] = Field(None, max_length=255)
    nombre_asistente: Optional[str] = Field(None, max_length=150)
    categoria: Optional[CategoriaCliente] = None  # type: ignore[assignment]
    descuento_mano_obra: Optional[Decimal] = Field(  # type: ignore[assignment]
        None, ge=0, le=100, max_digits=5, decimal_places=2
    )
    permite_pagos_parciales: Optional[bool] = None  # type: ignore[assignment]
    confidencial: Optional[bool] = None  # type: ignore[assignment]
    notas: Optional[str] = None
    rfc: Optional[str] = Field(None, max_length=20)
    razon_social: Optional[str] = Field(None, max_length=200)
    regimen_fiscal: Optional[str] = Field(None, max_length=100)
    codigo_postal: Optional[str] = Field(None, max_length=10)
    activo: Optional[bool] = Field(None, description="Borrado logico (SEG-07)")

    @model_validator(mode="after")
    def _rechazar_nulos_obligatorios(self) -> "ClienteUpdate":
        """Un ``null`` explicito en una columna NOT NULL daria un 500."""
        obligatorios = (
            "nombre",
            "categoria",
            "descuento_mano_obra",
            "permite_pagos_parciales",
            "confidencial",
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


class ClienteOut(ClienteCampos):
    """Cliente tal como se devuelve en listados y altas."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    activo: bool


class ClienteConVehiculos(ClienteOut):
    """Ficha completa: cliente con sus vehiculos vigentes (VEH-01)."""

    vehiculos: list[VehiculoOut] = Field(default_factory=list)
