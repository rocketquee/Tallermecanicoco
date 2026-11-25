"""Calculo de saldos por orden de servicio (PAG-01, PAG-05).

El saldo no se guarda en la base: se deriva del total de la orden menos los
pagos vigentes. Centralizarlo aqui evita que el router de pagos y el de
autorizaciones reporten cifras distintas para la misma orden.

Reglas aplicadas
----------------
* ``ordenes_servicio.total`` ya incluye IVA (lo calcula
  ``sp_calcular_total_orden`` o ``_recalcular_totales``), asi que el saldo es
  la diferencia simple contra lo cobrado.
* Solo cuentan los pagos con ``activo = 1``; el borrado logico los excluye.
* El saldo nunca se reporta en negativo: si por un ajuste de la orden el
  cliente pago de mas, el pendiente queda en 0.00 y el sobrante se ve en el
  historial de pagos.
"""

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import OrdenServicio, Pago

CERO = Decimal("0.00")


@dataclass(frozen=True)
class SaldoOrden:
    """Total, cobrado y pendiente de una orden (PAG-05)."""

    total: Decimal
    pagado: Decimal
    numero_pagos: int
    ultimo_pago: datetime | None

    @property
    def saldo(self) -> Decimal:
        """Pendiente por cobrar, nunca negativo."""
        pendiente = self.total - self.pagado
        return pendiente if pendiente > CERO else CERO

    @property
    def liquidado(self) -> bool:
        """La orden ya no tiene saldo pendiente."""
        return self.saldo <= CERO


def saldos_por_orden(
    db: Session, ordenes: list[OrdenServicio]
) -> dict[int, SaldoOrden]:
    """Saldo de varias ordenes en una sola consulta agrupada.

    Se usa en los listados para no lanzar una consulta por fila.
    """
    if not ordenes:
        return {}

    ids = [orden.id for orden in ordenes]
    filas = db.execute(
        select(
            Pago.orden_id,
            func.coalesce(func.sum(Pago.monto), 0),
            func.count(Pago.id),
            func.max(Pago.created_at),
        )
        .where(Pago.orden_id.in_(ids), Pago.activo == 1)
        .group_by(Pago.orden_id)
    ).all()

    acumulado = {
        orden_id: (Decimal(pagado), int(numero), ultimo)
        for orden_id, pagado, numero, ultimo in filas
    }

    resultado: dict[int, SaldoOrden] = {}
    for orden in ordenes:
        pagado, numero, ultimo = acumulado.get(orden.id, (CERO, 0, None))
        resultado[orden.id] = SaldoOrden(
            total=Decimal(orden.total),
            pagado=pagado,
            numero_pagos=numero,
            ultimo_pago=ultimo,
        )
    return resultado


def saldo_de_orden(db: Session, orden: OrdenServicio) -> SaldoOrden:
    """Saldo de una sola orden (detalle y registro de pagos)."""
    return saldos_por_orden(db, [orden])[orden.id]
