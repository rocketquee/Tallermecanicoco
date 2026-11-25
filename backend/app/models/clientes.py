from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Index,
    Numeric,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.dialects.mysql import INTEGER
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    # Solo para el chequeo de tipos; el mapper resuelve "Vehiculo" por nombre.
    from app.models.ordenes_servicio import OrdenServicio
    from app.models.vehiculos import Vehiculo


class Cliente(Base):
    """Cliente del taller; puede ser VIP y confidencial a la vez."""

    __tablename__ = "clientes"
    __table_args__ = (
        Index("idx_clientes_nombre", "nombre"),
        Index("idx_clientes_categoria", "categoria"),
        Index("idx_clientes_confidencial", "confidencial"),
        {
            "mysql_engine": "InnoDB",
            "mysql_charset": "utf8mb4",
            "mysql_collate": "utf8mb4_unicode_ci",
            "comment": "Clientes del taller, incluidos VIP y confidenciales (CLI-01 a CLI-06)",
        },
    )

    id: Mapped[int] = mapped_column(
        INTEGER(unsigned=True), primary_key=True, autoincrement=True
    )
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    telefono1: Mapped[str | None] = mapped_column(String(20))
    telefono2: Mapped[str | None] = mapped_column(String(20))
    correo: Mapped[str | None] = mapped_column(String(150))
    direccion: Mapped[str | None] = mapped_column(String(255))
    nombre_asistente: Mapped[str | None] = mapped_column(String(150))
    categoria: Mapped[str] = mapped_column(
        Enum("Regular", "VIP", name="categoria_cliente"),
        nullable=False,
        server_default="Regular",
    )
    descuento_mano_obra: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False, server_default=text("0.00")
    )
    permite_pagos_parciales: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("0")
    )
    confidencial: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("0")
    )
    notas: Mapped[str | None] = mapped_column(Text)
    rfc: Mapped[str | None] = mapped_column(String(20))
    razon_social: Mapped[str | None] = mapped_column(String(200))
    regimen_fiscal: Mapped[str | None] = mapped_column(String(100))
    codigo_postal: Mapped[str | None] = mapped_column(String(10))
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

    # 1 cliente -> N vehículos
    vehiculos: Mapped[list["Vehiculo"]] = relationship(back_populates="cliente")
    # 1 cliente -> N órdenes de servicio
    ordenes: Mapped[list["OrdenServicio"]] = relationship(back_populates="cliente")

    def __repr__(self) -> str:
        return (
            f"<Cliente id={self.id} nombre={self.nombre!r} "
            f"categoria={self.categoria!r} confidencial={self.confidencial}>"
        )
