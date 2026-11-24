"""Schemas de ordenes de compra (PRV-03 a PRV-09).

Una compra nace en estado ``Borrador``: PRV-07 impide enviarla sin la
aprobacion del Administrador. El precio unitario se toma de
``refacciones.precio_costo`` cuando el cliente no lo envia, porque el modal
de "Registrar compra" solo pide proveedor, refaccion y cantidad.

El total en MXN se calcula con el tipo de cambio cuando el proveedor cotiza
en otra moneda (PRV-09). Para proveedores MXN el tipo de cambio es 1.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, Field

EstadoCompra = Literal[
    "Borrador",
    "Aprobada",
    "Enviada",
    "Recibida",
    "Cancelada",
]
Moneda = Literal["EUR", "GBP", "MXN", "USD"]


class DetalleCompraOut(BaseModel):
    """Linea de la compra: pieza, cantidad e importe en moneda original."""

    id: int
    refaccion_id: int
    refaccion_nombre: str
    cantidad: int
    precio_unitario_moneda: Decimal
    importe: Decimal


class CompraOut(BaseModel):
    """Compra con el proveedor y sus lineas, lista para la tabla."""

    id: int
    proveedor_id: int
    proveedor_nombre: str
    fecha_pedido: datetime
    fecha_estimada_llegada: Optional[date] = None
    estado: EstadoCompra
    moneda_original: Moneda
    tipo_cambio: Optional[Decimal] = None
    total_moneda_original: Optional[Decimal] = None
    total_mxn: Optional[Decimal] = None
    orden_id: Optional[int] = None
    solicitado_por: Optional[str] = None
    aprobado_por: Optional[str] = None
    activo: bool
    detalles: list[DetalleCompraOut] = Field(default_factory=list)


class CompraCreateIn(BaseModel):
    """Cuerpo del modal "Registrar compra" (PRV-03, PRV-05, PRV-09).

    * ``precio_unitario_moneda``: si se omite, se usa el costo del catalogo.
    * ``tipo_cambio``: obligatorio si el proveedor no cotiza en MXN.
    * ``orden_id``: orden de servicio que motivo la compra (PRV-05).
    * ``fecha_estimada_llegada``: si se omite, se calcula con el tiempo de
      entrega del proveedor (PRV-02).
    """

    proveedor_id: int = Field(..., gt=0)
    refaccion_id: int = Field(..., gt=0)
    cantidad: int = Field(..., ge=1, le=9999)
    precio_unitario_moneda: Optional[Decimal] = Field(
        None,
        ge=0,
        max_digits=12,
        decimal_places=2,
        description="Si se omite, se usa refacciones.precio_costo",
    )
    tipo_cambio: Optional[Decimal] = Field(
        None,
        gt=0,
        max_digits=10,
        decimal_places=4,
        description="Obligatorio cuando el proveedor no cotiza en MXN",
    )
    orden_id: Optional[int] = Field(
        None, gt=0, description="Orden de servicio que motiva la compra"
    )
    fecha_estimada_llegada: Optional[date] = None
