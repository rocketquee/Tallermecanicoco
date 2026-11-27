"""Modelo de la tabla orden_mecanicos (ORD-09).

Refleja exactamente el DDL de sql/06_seguridad.sql.

Tabla puente N:M entre ordenes_servicio y mecanicos. Tiene columnas propias
(created_at, updated_at, activo), asi que se modela como objeto de asociacion
(``OrdenMecanico``) y no como simple ``secondary``:

  * El alta/baja se hace aqui, con borrado logico (``activo = FALSE``), porque
    el borrado fisico esta prohibido (SEG-07).
  * ``UNIQUE (orden_id, mecanico_id)`` impide asignar dos veces al mismo
    mecanico a la misma orden.
  * Para leer comodamente existen las vistas ``OrdenServicio.mecanicos`` y
    ``Mecanico.ordenes_participa`` (solo lectura, filtran activo = TRUE).

Regla de aplicacion (ADR-003): si se asigna el mecanico responsable en
``ordenes_servicio.mecanico_id``, hay que insertarlo tambien aqui.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.mecanicos import Mecanico
    from app.models.ordenes_servicio import OrdenServicio


class OrdenMecanico(Base):
    """Asignación de un mecánico a una orden (con borrado lógico)."""

    __tablename__ = "orden_mecanicos"
    __table_args__ = (
        Index("uq_orden_mecanicos", "orden_id", "mecanico_id", unique=True),
        Index("idx_orden_mecanicos_mecanico", "mecanico_id"),
        {
            "comment": "Asignación de uno o más mecánicos por orden (ORD-09)",
        },
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    orden_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "ordenes_servicio.id",
            name="fk_orden_mecanicos_orden",
            ondelete="RESTRICT",
            onupdate="CASCADE",
        ),
        nullable=False,
    )
    mecanico_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "mecanicos.id",
            name="fk_orden_mecanicos_mecanico",
            ondelete="RESTRICT",
            onupdate="CASCADE",
        ),
        nullable=False,
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

    orden: Mapped["OrdenServicio"] = relationship(back_populates="asignaciones")
    mecanico: Mapped["Mecanico"] = relationship(back_populates="asignaciones")

    def __repr__(self) -> str:
        return (
            f"<OrdenMecanico id={self.id} orden_id={self.orden_id} "
            f"mecanico_id={self.mecanico_id} activo={self.activo}>"
        )
