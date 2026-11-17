"""Modelo de la tabla detalle_compra (PRV-03, PRV-09).

Refleja exactamente el DDL de sql/03_inventario.sql.
"""

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    func,
    text,
)
from sqlalchemy.dialects.mysql import INTEGER
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.compras import Compra
    from app.models.refacciones import Refaccion


class DetalleCompra(Base):
    """Línea de una orden de compra: refacción, cantidad y precio en la moneda original."""

    __tablename__ = "detalle_compra"
    __table_args__ = (
        Index("idx_detalle_compra_compra", "compra_id"),
        Index("idx_detalle_compra_refaccion", "refaccion_id"),
        {
            "mysql_engine": "InnoDB",
            "mysql_charset": "utf8mb4",
            "mysql_collate": "utf8mb4_unicode_ci",
            "comment": "Detalle de piezas por orden de compra (tabla puente compras-refacciones)",
        },
    )

    id: Mapped[int] = mapped_column(
        INTEGER(unsigned=True), primary_key=True, autoincrement=True
    )
    compra_id: Mapped[int] = mapped_column(
        INTEGER(unsigned=True),
        ForeignKey(
            "compras.id",
            name="fk_detalle_compra_compra",
            ondelete="RESTRICT",
            onupdate="CASCADE",
        ),
        nullable=False,
    )
    refaccion_id: Mapped[int] = mapped_column(
        INTEGER(unsigned=True),
        ForeignKey(
            "refacciones.id",
            name="fk_detalle_compra_refaccion",
            ondelete="RESTRICT",
            onupdate="CASCADE",
        ),
        nullable=False,
    )
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    precio_unitario_moneda: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False
    )
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

    compra: Mapped["Compra"] = relationship(back_populates="detalles")
    refaccion: Mapped["Refaccion"] = relationship(back_populates="detalles")

    def __repr__(self) -> str:
        return (
            f"<DetalleCompra id={self.id} compra_id={self.compra_id} "
            f"refaccion_id={self.refaccion_id} cantidad={self.cantidad}>"
        )
