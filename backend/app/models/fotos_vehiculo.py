"""Modelo de la tabla fotos_vehiculo (VEH-03, VEH-08).

Refleja exactamente el DDL de sql/04_ordenes.sql.

Las imagenes NO se guardan en la base: aqui solo vive la ruta o URL
(``url_foto``) y los metadatos. Los archivos van al filesystem local en
desarrollo (``UPLOAD_DIR``) y a un S3-compatible en produccion.

Limites de aplicacion, no de esquema: 30 fotos por auto y 10 MB por archivo.
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
    from app.models.ordenes_servicio import OrdenServicio


class FotoVehiculo(Base):
    """Foto del estado del vehículo (ingreso, proceso o entrega)."""

    __tablename__ = "fotos_vehiculo"
    __table_args__ = (
        Index("idx_fotos_orden", "orden_id"),
        Index("idx_fotos_etapa", "etapa"),
        {
            "comment": "Fotos del estado del vehículo por orden, almacenadas fuera de la BD (VEH-03, VEH-08)",
        },
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    orden_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "ordenes_servicio.id",
            name="fk_fotos_orden",
            ondelete="RESTRICT",
            onupdate="CASCADE",
        ),
        nullable=False,
    )
    url_foto: Mapped[str] = mapped_column(String(500), nullable=False)
    etapa: Mapped[str] = mapped_column(
        Enum("Ingreso", "Proceso", "Entrega", name="etapa_foto"),
        nullable=False,
    )
    firma_conformidad: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
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

    orden: Mapped["OrdenServicio"] = relationship(back_populates="fotos")

    def __repr__(self) -> str:
        return (
            f"<FotoVehiculo id={self.id} etapa={self.etapa!r} "
            f"orden_id={self.orden_id} firma={self.firma_conformidad}>"
        )
