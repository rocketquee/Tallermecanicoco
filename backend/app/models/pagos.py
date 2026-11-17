"""Modelo de la tabla pagos (PAG-03 a PAG-07, CLI-06).

Refleja exactamente el DDL de sql/05_finanzas.sql.

El cobro es siempre en pesos mexicanos (PAG-07). Los anticipos, parcialidades
y liquidaciones se distinguen por ``tipo``, no por columnas distintas.
"""

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Numeric,
    String,
    func,
    text,
)
from sqlalchemy.dialects.mysql import INTEGER
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.ordenes_servicio import OrdenServicio


class Pago(Base):
    """Pago aplicado a una orden: anticipo, parcialidad o liquidación."""

    __tablename__ = "pagos"
    __table_args__ = (
        Index("idx_pagos_orden", "orden_id"),
        Index("idx_pagos_tipo", "tipo"),
        Index("idx_pagos_fecha", "created_at"),
        {
            "mysql_engine": "InnoDB",
            "mysql_charset": "utf8mb4",
            "mysql_collate": "utf8mb4_unicode_ci",
            "comment": "Anticipos, parcialidades y liquidaciones por orden (PAG-03 a PAG-05, PAG-07)",
        },
    )

    id: Mapped[int] = mapped_column(
        INTEGER(unsigned=True), primary_key=True, autoincrement=True
    )
    orden_id: Mapped[int] = mapped_column(
        INTEGER(unsigned=True),
        ForeignKey(
            "ordenes_servicio.id",
            name="fk_pagos_orden",
            ondelete="RESTRICT",
            onupdate="CASCADE",
        ),
        nullable=False,
    )
    tipo: Mapped[str] = mapped_column(
        Enum("Anticipo", "Parcialidad", "Liquidacion", name="tipo_pago"),
        nullable=False,
    )
    monto: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    metodo_pago: Mapped[str] = mapped_column(
        Enum("Efectivo", "Transferencia", "Tarjeta", name="metodo_pago"),
        nullable=False,
        server_default="Transferencia",
    )
    referencia: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
        onupdate=func.now(),
    )
    activo: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("1")
    )

    orden: Mapped["OrdenServicio"] = relationship(back_populates="pagos")

    def __repr__(self) -> str:
        return (
            f"<Pago id={self.id} orden_id={self.orden_id} tipo={self.tipo!r} "
            f"monto={self.monto} metodo={self.metodo_pago!r}>"
        )
