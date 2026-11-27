"""Modelo de la tabla movimientos_inventario (INV-02, INV-05).

Refleja exactamente el DDL de sql/03_inventario.sql.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.refacciones import Refaccion


class MovimientoInventario(Base):
    """Entrada, salida o ajuste de existencias; deja trazabilidad (INV-02, INV-05)."""

    __tablename__ = "movimientos_inventario"
    __table_args__ = (
        Index("idx_movimientos_refaccion", "refaccion_id"),
        Index("idx_movimientos_tipo", "tipo"),
        Index("idx_movimientos_fecha", "created_at"),
        {
            "comment": "Trazabilidad de entradas, salidas y ajustes de inventario (INV-02, INV-05)",
        },
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    refaccion_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "refacciones.id",
            name="fk_movimientos_refaccion",
            ondelete="RESTRICT",
            onupdate="CASCADE",
        ),
        nullable=False,
    )
    tipo: Mapped[str] = mapped_column(
        Enum("Entrada", "Salida", "Ajuste", name="tipo_movimiento"),
        nullable=False,
    )
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    motivo: Mapped[str | None] = mapped_column(String(255))
    usuario: Mapped[str | None] = mapped_column(String(150))
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

    refaccion: Mapped["Refaccion"] = relationship(back_populates="movimientos")

    def __repr__(self) -> str:
        return (
            f"<MovimientoInventario id={self.id} tipo={self.tipo!r} "
            f"cantidad={self.cantidad} refaccion_id={self.refaccion_id}>"
        )
