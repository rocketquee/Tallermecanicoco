"""Schemas de ordenes de servicio (ORD-01 a ORD-13).

En esta fase el POST solo crea el encabezado de la orden: el detalle de piezas
y mano de obra, los totales, pagos y autorizaciones llegan en modulos
posteriores. Los totales quedan en 0.00 y los calcula el backend cuando exista
el detalle, nunca el frontend.
"""

from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

EstadoOrden = Literal[
    "Recibido",
    "Diagnostico",
    "Reparacion",
    "Listo",
    "Entregado",
    "Cancelado",
]


class OrdenCreate(BaseModel):
    """Alta de una orden en estado Recibido."""

    cliente_id: int = Field(..., gt=0, description="Dueño del vehiculo")
    vehiculo_id: int = Field(..., gt=0, description="Vehiculo que ingresa")
    mecanico_id: Optional[int] = Field(
        None,
        gt=0,
        description=(
            "Responsable principal (ORD-09). Si se envia, tambien se registra "
            "en orden_mecanicos (ADR-003)"
        ),
    )
    falla_reportada: Optional[str] = Field(
        None,
        max_length=2000,
        description="Falla o motivo de ingreso reportado por el cliente",
    )

    @field_validator("falla_reportada", mode="before")
    @classmethod
    def _limpiar_falla(cls, valor: object) -> object:
        if isinstance(valor, str):
            valor = " ".join(valor.split())
            return valor or None
        return valor


class OrdenOut(BaseModel):
    """Orden con los datos que necesita el frontend para listar y abrir.

    ``total`` es ``null`` para el rol Mecanico (SEG-18) y ``cliente_nombre``
    se sustituye por "Cliente confidencial" cuando aplica SEG-17.
    """

    id: int
    estado: EstadoOrden
    falla_reportada: Optional[str] = None
    cliente_id: int
    cliente_nombre: str
    vehiculo_id: int
    vehiculo_placas: str
    vehiculo_marca: str
    vehiculo_modelo: str
    mecanico_id: Optional[int] = None
    mecanico_nombre: Optional[str] = None
    total: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime
    activo: bool


class ClienteOrdenOut(BaseModel):
    """Datos del cliente que se imprimen en el detalle de la orden.

    Si el cliente es confidencial y quien consulta es Mecanico, el nombre se
    sustituye y los datos de contacto quedan en ``None`` (SEG-17).
    """

    id: int
    nombre: str
    telefono1: Optional[str] = None
    correo: Optional[str] = None
    rfc: Optional[str] = None
    categoria: str
    confidencial: bool


class VehiculoOrdenOut(BaseModel):
    """Datos tecnicos del vehiculo para el encabezado y la ficha."""

    id: int
    placas: str
    vin: Optional[str] = None
    marca: str
    modelo: str
    anio: int
    color: Optional[str] = None
    kilometraje_entrada: Optional[int] = None


class DetalleOrdenOut(BaseModel):
    """Linea de la orden: mano de obra o refaccion (ORD-10, INV-02).

    Para el rol Mecanico, ``precio_unitario`` e ``importe`` son ``None``
    porque no puede ver importes (SEG-18).
    """

    id: int
    tipo: Literal["Servicio", "Refaccion"]
    descripcion: str
    cantidad: int
    precio_unitario: Optional[Decimal] = None
    importe: Optional[Decimal] = None


class OrdenDetalleOut(BaseModel):
    """Vista completa de una orden: cliente, vehiculo, conceptos y totales."""

    id: int
    estado: EstadoOrden
    falla_reportada: Optional[str] = None
    cliente: ClienteOrdenOut
    vehiculo: VehiculoOrdenOut
    mecanico_id: Optional[int] = None
    mecanico_nombre: Optional[str] = None
    total_piezas: Optional[Decimal] = None
    total_mano_obra: Optional[Decimal] = None
    subtotal: Optional[Decimal] = None
    iva: Optional[Decimal] = None
    total: Optional[Decimal] = None
    detalles: list[DetalleOrdenOut] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    activo: bool
