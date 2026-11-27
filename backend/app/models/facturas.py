"""Modelo de la tabla facturas (FAC-01 a FAC-05).

Refleja exactamente el DDL de sql/05_finanzas.sql.

Dos indices UNIQUE conviven con el borrado logico:
  * ``uq_facturas_numero`` -> numero_factura
  * ``uq_facturas_uuid``   -> uuid_cfdi
PostgreSQL, igual que MySQL, permite varios NULL en un indice UNIQUE
(NULLS DISTINCT por omision), asi que una factura en Borrador (sin folio ni
UUID todavia) no choca con las demas.

CFDI 4.0: en esta fase el sistema genera los datos y el PAC timbra; la columna
``uuid_cfdi`` queda NULL hasta que el contador o el taller la timbra (FAC-05).
Una factura emitida no se edita ni se borra: se cancela con motivo (FAC-04).
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
    Integer,
    Numeric,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.ordenes_servicio import OrdenServicio


class Factura(Base):
    """Factura CFDI 4.0 de una orden, lista para timbrar con el PAC."""

    __tablename__ = "facturas"
    __table_args__ = (
        Index("uq_facturas_numero", "numero_factura", unique=True),
        Index("uq_facturas_uuid", "uuid_cfdi", unique=True),
        Index("idx_facturas_orden", "orden_id"),
        Index("idx_facturas_estado", "estado"),
        {
            "comment": "Facturas CFDI 4.0 listas para timbrar por orden (FAC-01 a FAC-05)",
        },
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    orden_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "ordenes_servicio.id",
            name="fk_facturas_orden",
            ondelete="RESTRICT",
            onupdate="CASCADE",
        ),
        nullable=False,
    )
    numero_factura: Mapped[str | None] = mapped_column(String(50))
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    iva: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    estado: Mapped[str] = mapped_column(
        Enum("Borrador", "Timbrada", "Cancelada", name="estado_factura"),
        nullable=False,
        server_default="Borrador",
    )
    uuid_cfdi: Mapped[str | None] = mapped_column(String(100))
    uso_cfdi: Mapped[str | None] = mapped_column(String(10))
    forma_pago: Mapped[str | None] = mapped_column(String(10))
    metodo_pago: Mapped[str | None] = mapped_column(String(10))
    motivo_cancelacion: Mapped[str | None] = mapped_column(Text)
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
        Boolean, nullable=False, server_default=text("true")
    )

    orden: Mapped["OrdenServicio"] = relationship(back_populates="facturas")

    def __repr__(self) -> str:
        return (
            f"<Factura id={self.id} orden_id={self.orden_id} "
            f"estado={self.estado!r} total={self.total} uuid={self.uuid_cfdi!r}>"
        )
