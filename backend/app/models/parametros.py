"""Modelo de la tabla parametros (AUT-08, PAG-06).

Refleja exactamente el DDL de sql/06_seguridad.sql.

ADR-007: las reglas de negocio configurables viven en la BD, no en el codigo,
para que el administrador las ajuste sin redesplegar. ``clave`` es UNIQUE.

``valor`` es VARCHAR(100): la aplicacion debe validar y convertir el tipo
(``"cinco"`` no lo valida la base de datos). Valores iniciales del seed:
  * tolerancia_reautorizacion = 5    (AUT-08, porcentaje)
  * umbral_piezas_caras       = 25000 (PAG-06, MXN)
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Index, Integer, String, Text, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Parametro(Base):
    """Parámetro de negocio clave/valor, editable desde la aplicación."""

    __tablename__ = "parametros"
    __table_args__ = (
        Index("uq_parametros_clave", "clave", unique=True),
        {
            "comment": "Parámetros configurables de tolerancia y umbrales (AUT-08, PAG-06)",
        },
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    clave: Mapped[str] = mapped_column(String(50), nullable=False)
    valor: Mapped[str] = mapped_column(String(100), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(Text)
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

    def __repr__(self) -> str:
        return f"<Parametro id={self.id} clave={self.clave!r} valor={self.valor!r}>"
