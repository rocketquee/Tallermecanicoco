"""Modelo de la tabla servicios (ORD-10).

Refleja exactamente el DDL de sql/01_catalogos.sql.
"""

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Index, Numeric, String, Text, func, text
from sqlalchemy.dialects.mysql import INTEGER
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.detalle_orden import DetalleOrden


class Servicio(Base):
    """Servicio de mano de obra con precio base antes de descuento VIP e IVA."""

    __tablename__ = "servicios"
    __table_args__ = (
        Index("idx_servicios_nombre", "nombre"),
        {
            "mysql_engine": "InnoDB",
            "mysql_charset": "utf8mb4",
            "mysql_collate": "utf8mb4_unicode_ci",
            "comment": "Catálogo de servicios y mano de obra (ORD-10)",
        },
    )

    id: Mapped[int] = mapped_column(
        INTEGER(unsigned=True), primary_key=True, autoincrement=True
    )
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text)
    precio_mano_obra: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, server_default=text("0.00")
    )
    duracion_estimada_horas: Mapped[Decimal | None] = mapped_column(Numeric(4, 1))
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

    detalles_orden: Mapped[list["DetalleOrden"]] = relationship(
        back_populates="servicio"
    )

    def __repr__(self) -> str:
        return f"<Servicio id={self.id} nombre={self.nombre!r} precio={self.precio_mano_obra}>"
