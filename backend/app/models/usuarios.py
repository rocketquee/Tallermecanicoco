"""Modelo de la tabla usuarios (SEG-01 a SEG-04).

Refleja exactamente el DDL de sql/06_seguridad.sql.

Seguridad:
  * ``password_hash`` guarda SIEMPRE un hash, nunca texto plano (SEG-15).
    Los datos de prueba usan ``scrypt$N$r$p$salt$hash`` (ADR-004) y
    ``app.core.security`` verifica ese mismo formato, sin passlib.
  * ``correo`` es UNIQUE: es el identificador de autenticacion.
  * ``rol`` define los permisos: Administrador (todo), Recepcion (sin
    finanzas), Mecanico (solo placas y trabajo, sin precios ni nombres
    confidenciales).
"""

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    String,
    func,
    text,
)
from sqlalchemy.dialects.mysql import INTEGER
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.bitacora import Bitacora
    from app.models.historial_etapas import HistorialEtapa
    from app.models.mecanicos import Mecanico


class Usuario(Base):
    """Usuario del sistema con rol y, opcionalmente, vínculo a un mecánico."""

    __tablename__ = "usuarios"
    __table_args__ = (
        Index("uq_usuarios_correo", "correo", unique=True),
        Index("idx_usuarios_rol", "rol"),
        Index("idx_usuarios_mecanico", "mecanico_id"),
        {
            "mysql_engine": "InnoDB",
            "mysql_charset": "utf8mb4",
            "mysql_collate": "utf8mb4_unicode_ci",
            "comment": "Usuarios del sistema con roles Administrador, Recepcion y Mecanico (SEG-01 a SEG-04)",
        },
    )

    id: Mapped[int] = mapped_column(
        INTEGER(unsigned=True), primary_key=True, autoincrement=True
    )
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    correo: Mapped[str] = mapped_column(String(150), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    rol: Mapped[str] = mapped_column(
        Enum("Administrador", "Recepcion", "Mecanico", name="rol_usuario"),
        nullable=False,
    )
    mecanico_id: Mapped[int | None] = mapped_column(
        INTEGER(unsigned=True),
        ForeignKey(
            "mecanicos.id",
            name="fk_usuarios_mecanico",
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

    mecanico: Mapped[Optional["Mecanico"]] = relationship(back_populates="usuarios")
    bitacora: Mapped[list["Bitacora"]] = relationship(back_populates="usuario")
    historial_etapas: Mapped[list["HistorialEtapa"]] = relationship(
        back_populates="usuario"
    )

    def __repr__(self) -> str:
        return (
            f"<Usuario id={self.id} correo={self.correo!r} rol={self.rol!r} "
            f"mecanico_id={self.mecanico_id}>"
        )
