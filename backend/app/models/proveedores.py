"""Modelo de la tabla proveedores (PRV-01, PRV-02, PRV-09).

Refleja exactamente el DDL de sql/01_catalogos.sql.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, Index, Integer, String, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.compras import Compra
    from app.models.refacciones import Refaccion


class Proveedor(Base):
    """Proveedor internacional de refacciones (Italia, Alemania, Inglaterra...)."""

    __tablename__ = "proveedores"
    __table_args__ = (
        Index("idx_proveedores_nombre", "nombre"),
        Index("idx_proveedores_pais", "pais"),
        {
            "comment": "Proveedores internacionales de refacciones (PRV-01, PRV-02, PRV-09)",
        },
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    pais: Mapped[str] = mapped_column(String(60), nullable=False)
    contacto: Mapped[str | None] = mapped_column(String(150))
    telefono: Mapped[str | None] = mapped_column(String(30))
    correo: Mapped[str | None] = mapped_column(String(150))
    tiempo_entrega_dias: Mapped[int | None] = mapped_column(Integer)
    moneda: Mapped[str] = mapped_column(
        Enum("EUR", "GBP", "MXN", "USD", name="moneda_proveedor"),
        nullable=False,
        server_default="MXN",
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
        Boolean, nullable=False, server_default=text("true")
    )

    # 1 proveedor -> N refacciones y N compras
    refacciones: Mapped[list["Refaccion"]] = relationship(
        back_populates="proveedor"
    )
    compras: Mapped[list["Compra"]] = relationship(back_populates="proveedor")

    def __repr__(self) -> str:
        return f"<Proveedor id={self.id} nombre={self.nombre!r} pais={self.pais!r}>"
