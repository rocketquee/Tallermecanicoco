"""Modelo de la tabla mecanicos (ORD-09, REP-03, SEG-01).

Refleja exactamente el DDL de sql/01_catalogos.sql.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Index, Integer, String, Text, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.orden_mecanicos import OrdenMecanico
    from app.models.ordenes_servicio import OrdenServicio
    from app.models.usuarios import Usuario


class Mecanico(Base):
    """Mecánico del taller; se asigna a órdenes y se usa para calcular bonos."""

    __tablename__ = "mecanicos"
    __table_args__ = (
        Index("idx_mecanicos_nombre", "nombre"),
        {
            "comment": "Catálogo de mecánicos del taller (ORD-09, REP-03, SEG-01)",
        },
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    telefono: Mapped[str | None] = mapped_column(String(20))
    correo: Mapped[str | None] = mapped_column(String(150))
    especialidad: Mapped[str | None] = mapped_column(String(100))
    notas: Mapped[str | None] = mapped_column(Text)
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

    ordenes: Mapped[list["OrdenServicio"]] = relationship(back_populates="mecanico")

    # Bloque 6: asignaciones N:M (objeto de asociacion con borrado logico).
    asignaciones: Mapped[list["OrdenMecanico"]] = relationship(
        back_populates="mecanico"
    )
    # Vista de solo lectura: ordenes en las que participa y sigue vigente.
    ordenes_participa: Mapped[list["OrdenServicio"]] = relationship(
        secondary="orden_mecanicos",
        primaryjoin="Mecanico.id == orden_mecanicos.c.mecanico_id",
        secondaryjoin=(
            "and_(OrdenServicio.id == orden_mecanicos.c.orden_id, "
            "orden_mecanicos.c.activo.is_(True))"
        ),
        viewonly=True,
    )
    # Un mecanico puede tener (o no) un usuario de acceso al sistema.
    usuarios: Mapped[list["Usuario"]] = relationship(back_populates="mecanico")

    def __repr__(self) -> str:
        return f"<Mecanico id={self.id} nombre={self.nombre!r}>"
