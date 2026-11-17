"""Modelo de la tabla historial_etapas (ORD-06).

Refleja exactamente el DDL de sql/06_seguridad.sql.

TABLA INMUTABLE (ADR-006), igual que ``bitacora``:
  * Solo ``created_at``; sin ``updated_at`` ni ``activo``.
  * Triggers en MySQL: ``trg_historial_etapas_bu`` (UPDATE) y
    ``trg_historial_etapas_bd`` (DELETE), con ``SIGNAL SQLSTATE '45000'``.

``etapa_anterior`` es NULL solo en el asiento de apertura de la orden.
``usuario_id`` es lo que permite auditar quién movió la etapa y validar que
solo el administrador pueda retroceder (ORD-04, ORD-05).
"""

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Index, text
from sqlalchemy.dialects.mysql import INTEGER
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.ordenes_servicio import OrdenServicio
    from app.models.usuarios import Usuario


class HistorialEtapa(Base):
    """Cambio de etapa de una orden, con el usuario que lo provocó."""

    __tablename__ = "historial_etapas"
    __table_args__ = (
        Index("idx_historial_orden", "orden_id"),
        Index("idx_historial_fecha", "created_at"),
        Index("idx_historial_usuario", "usuario_id"),
        {
            "mysql_engine": "InnoDB",
            "mysql_charset": "utf8mb4",
            "mysql_collate": "utf8mb4_unicode_ci",
            "comment": "Historial inmutable de cambios de etapa por orden (ORD-06)",
        },
    )

    id: Mapped[int] = mapped_column(
        INTEGER(unsigned=True), primary_key=True, autoincrement=True
    )
    orden_id: Mapped[int] = mapped_column(
        INTEGER(unsigned=True),
        ForeignKey(
            "ordenes_servicio.id",
            name="fk_historial_orden",
            ondelete="RESTRICT",
            onupdate="CASCADE",
        ),
        nullable=False,
    )
    etapa_anterior: Mapped[str | None] = mapped_column(
        Enum(
            "Recibido",
            "Diagnostico",
            "Reparacion",
            "Listo",
            "Entregado",
            "Cancelado",
            name="etapa_orden_historial",
        )
    )
    etapa_nueva: Mapped[str] = mapped_column(
        Enum(
            "Recibido",
            "Diagnostico",
            "Reparacion",
            "Listo",
            "Entregado",
            "Cancelado",
            name="etapa_orden_historial",
        ),
        nullable=False,
    )
    usuario_id: Mapped[int] = mapped_column(
        INTEGER(unsigned=True),
        ForeignKey(
            "usuarios.id",
            name="fk_historial_usuario",
            ondelete="RESTRICT",
            onupdate="CASCADE",
        ),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )

    orden: Mapped["OrdenServicio"] = relationship(back_populates="historial")
    usuario: Mapped["Usuario"] = relationship(back_populates="historial_etapas")

    def __repr__(self) -> str:
        return (
            f"<HistorialEtapa id={self.id} orden_id={self.orden_id} "
            f"{self.etapa_anterior!r} -> {self.etapa_nueva!r}>"
        )
