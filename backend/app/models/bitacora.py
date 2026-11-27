"""Modelo de la tabla bitacora (SEG-06, SEG-20).

Refleja exactamente el DDL de sql/06_seguridad.sql.

TABLA INMUTABLE (ADR-006). Por eso:
  * Solo tiene ``created_at``: NO tiene ``updated_at`` ni ``activo``.
  * Dos triggers bloquean cualquier alteracion en MySQL:
        trg_bitacora_bu  -> BEFORE UPDATE
        trg_bitacora_bd  -> BEFORE DELETE
    Ambos lanzan ``SIGNAL SQLSTATE '45000'`` y llegan a Python como
    ``sqlalchemy.exc.OperationalError`` (MySQL 1644), igual que el trigger de
    detalle_orden. No es un error de integridad, es una regla del negocio.
  * ``TRUNCATE`` si esta permitido (limpieza de desarrollo); en produccion el
    permiso debe quedar restringido al DBA.

Si hay un asiento mal capturado no se corrige: se inserta uno nuevo que lo
explique, como en una bitacora real.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.usuarios import Usuario


class Bitacora(Base):
    """Asiento de auditoría: qué se hizo, sobre qué registro y quién lo hizo."""

    __tablename__ = "bitacora"
    __table_args__ = (
        Index("idx_bitacora_usuario", "usuario_id"),
        Index("idx_bitacora_registro", "tabla_afectada", "registro_id"),
        Index("idx_bitacora_fecha", "created_at"),
        Index("idx_bitacora_accion", "accion"),
        {
            "comment": "Bitácora de auditoría inmutable de altas, cambios, cancelaciones y autorizaciones (SEG-06)",
        },
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    usuario_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "usuarios.id",
            name="fk_bitacora_usuario",
            ondelete="RESTRICT",
            onupdate="CASCADE",
        ),
        nullable=False,
    )
    tabla_afectada: Mapped[str] = mapped_column(String(100), nullable=False)
    registro_id: Mapped[int] = mapped_column(
        Integer, nullable=False
    )
    accion: Mapped[str] = mapped_column(
        Enum(
            "Creacion",
            "Actualizacion",
            "Cancelacion",
            "Autorizacion",
            "Consulta_Confidencial",
            name="accion_bitacora",
        ),
        nullable=False,
    )
    detalle: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )

    usuario: Mapped["Usuario"] = relationship(back_populates="bitacora")

    def __repr__(self) -> str:
        return (
            f"<Bitacora id={self.id} accion={self.accion!r} "
            f"{self.tabla_afectada}#{self.registro_id} usuario_id={self.usuario_id}>"
        )
