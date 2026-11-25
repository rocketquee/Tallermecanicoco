"""Schemas de cobranza: pagos, saldos y tablero de cuentas por cobrar.

PAG-03: todo cobro se registra con tipo (anticipo, parcialidad o liquidacion),
monto en MXN, forma de pago y referencia opcional.
PAG-05: el saldo de la orden se calcula en el backend
(``app.services.finanzas``); el frontend nunca lo envia (SEG-18).
PAG-07: el cobro es siempre en pesos mexicanos.
"""

from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

from app.schemas.ordenes import EstadoOrden

TipoPago = Literal["Anticipo", "Parcialidad", "Liquidacion"]
MetodoPago = Literal["Efectivo", "Transferencia", "Tarjeta"]


class PagoCreateIn(BaseModel):
    """Cuerpo de ``POST /pagos``: un anticipo, parcialidad o liquidacion.

    El monto lo captura el Administrador, pero el backend lo valida contra el
    saldo real de la orden antes de guardarlo.
    """

    orden_id: int = Field(..., gt=0, description="Orden que se esta cobrando")
    tipo: TipoPago = Field(
        ...,
        description=(
            "Anticipo en el primer cobro, Parcialidad en los siguientes y "
            "Liquidacion cuando cubre el saldo completo (PAG-03)"
        ),
    )
    monto: Decimal = Field(
        ...,
        gt=0,
        max_digits=12,
        decimal_places=2,
        description="Monto entregado en pesos mexicanos (PAG-07)",
    )
    metodo_pago: MetodoPago = Field(
        "Transferencia", description="Forma de pago utilizada (PAG-03)"
    )
    referencia: Optional[str] = Field(
        None,
        max_length=100,
        description="Folio o numero de transferencia (PAG-03)",
    )

    @field_validator("referencia", mode="before")
    @classmethod
    def _limpiar_referencia(cls, valor: object) -> object:
        if isinstance(valor, str):
            valor = " ".join(valor.split())
            return valor or None
        return valor


class PagoOut(BaseModel):
    """Pago registrado, listo para el historial de la orden."""

    id: int
    orden_id: int
    tipo: TipoPago
    monto: Decimal
    metodo_pago: MetodoPago
    referencia: Optional[str] = None
    created_at: datetime


class SaldoOrdenOut(BaseModel):
    """Resumen de cobranza de una orden (PAG-05)."""

    orden_id: int
    total: Decimal
    pagado: Decimal
    saldo: Decimal
    liquidado: bool
    numero_pagos: int
    ultimo_pago: Optional[datetime] = None


class PagoRegistradoOut(BaseModel):
    """Respuesta de ``POST /pagos``: el pago y el saldo que queda."""

    pago: PagoOut
    resumen: SaldoOrdenOut


class PagoOrdenOut(BaseModel):
    """Historial de pagos de una orden con su saldo vigente."""

    orden_id: int
    estado: EstadoOrden
    cliente_nombre: str
    vehiculo_placas: str
    pagos: list[PagoOut] = Field(default_factory=list)
    resumen: SaldoOrdenOut


class CobranzaOut(BaseModel):
    """Fila del tablero de cuentas por cobrar (una orden por renglon)."""

    orden_id: int
    estado: EstadoOrden
    cliente_id: int
    cliente_nombre: str
    vehiculo_placas: str
    vehiculo_descripcion: str
    total: Decimal
    pagado: Decimal
    saldo: Decimal
    numero_pagos: int
    ultimo_pago: Optional[datetime] = None
    created_at: datetime
