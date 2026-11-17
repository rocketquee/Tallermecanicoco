"""Modelo de la tabla refacciones (INV-01 a INV-05).

Refleja exactamente el DDL de sql/03_inventario.sql.
"""

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    func,
    text,
)
from sqlalchemy.dialects.mysql import INTEGER
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.detalle_compra import DetalleCompra
    from app.models.detalle_orden import DetalleOrden
    from app.models.movimientos_inventario import MovimientoInventario
    from app.models.proveedores import Proveedor


class Refaccion(Base):
    """Refacción o consumible con existencias; las especiales no llevan stock."""

    __tablename__ = "refacciones"
    __table_args__ = (
        Index("idx_refacciones_proveedor", "proveedor_id"),
        Index("idx_refacciones_nombre", "nombre"),
        Index("idx_refacciones_stock", "stock_actual", "stock_minimo"),
        Index("idx_refacciones_especial", "es_especial"),
        {
            "mysql_engine": "InnoDB",
            "mysql_charset": "utf8mb4",
            "mysql_collate": "utf8mb4_unicode_ci",
            "comment": "Catálogo de refacciones y consumibles con existencias (INV-01 a INV-05)",
        },
    )

    id: Mapped[int] = mapped_column(
        INTEGER(unsigned=True), primary_key=True, autoincrement=True
    )
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    marca: Mapped[str | None] = mapped_column(String(50))
    es_especial: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("0")
    )
    stock_actual: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("0")
    )
    stock_minimo: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("2")
    )
    precio_costo: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    precio_venta: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    proveedor_id: Mapped[int | None] = mapped_column(
        INTEGER(unsigned=True),
        ForeignKey(
            "proveedores.id",
            name="fk_refacciones_proveedor",
            ondelete="RESTRICT",
            onupdate="CASCADE",
        ),
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

    proveedor: Mapped[Optional["Proveedor"]] = relationship(
        back_populates="refacciones"
    )
    detalles: Mapped[list["DetalleCompra"]] = relationship(
        back_populates="refaccion"
    )
    detalles_orden: Mapped[list["DetalleOrden"]] = relationship(
        back_populates="refaccion"
    )
    movimientos: Mapped[list["MovimientoInventario"]] = relationship(
        back_populates="refaccion"
    )

    def __repr__(self) -> str:
        return (
            f"<Refaccion id={self.id} nombre={self.nombre!r} "
            f"stock={self.stock_actual}/{self.stock_minimo} especial={self.es_especial}>"
        )
