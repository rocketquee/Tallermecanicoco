"""Modelo de la tabla autorizaciones (AUT-01 a AUT-08).

Refleja exactamente el DDL de sql/05_finanzas.sql.

Nota sobre el usuario que autoriza: en este esquema ``aprobado_por`` es
VARCHAR(150) y NO una FK a ``usuarios``. Es una desnormalizacion consciente
del DDL (igual que ``compras.aprobado_por`` y ``movimientos_inventario.usuario``):
guarda el nombre del administrador y la fecha para dejar constancia (AUT-05).
Las FK reales a ``usuarios`` aparecen en el Bloque 6 (``bitacora`` y
``historial_etapas``), que es donde se audita cada accion.
"""

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Numeric,
    String,
    func,
    text,
)
from sqlalchemy.dialects.mysql import INTEGER
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.ordenes_servicio import OrdenServicio


class Autorizacion(Base):
    """Autorización del administrador por monto alto, saldo o reautorización."""

    __tablename__ = "autorizaciones"
    __table_args__ = (
        Index("idx_autorizaciones_orden", "orden_id"),
        Index("idx_autorizaciones_tipo", "tipo"),
        Index("idx_autorizaciones_estado", "aprobado"),
        {
            "mysql_engine": "InnoDB",
            "mysql_charset": "utf8mb4",
            "mysql_collate": "utf8mb4_unicode_ci",
            "comment": "Autorizaciones del administrador por monto y por saldo pendiente (AUT-01 a AUT-08)",
        },
    )

    id: Mapped[int] = mapped_column(
        INTEGER(unsigned=True), primary_key=True, autoincrement=True
    )
    orden_id: Mapped[int] = mapped_column(
        INTEGER(unsigned=True),
        ForeignKey(
            "ordenes_servicio.id",
            name="fk_autorizaciones_orden",
            ondelete="RESTRICT",
            onupdate="CASCADE",
        ),
        nullable=False,
    )
    tipo: Mapped[str] = mapped_column(
        Enum(
            "Monto_Alto",
            "Saldo_Pendiente",
            "Reautorizacion",
            name="tipo_autorizacion",
        ),
        nullable=False,
    )
    monto_orden: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    aprobado: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("0")
    )
    aprobado_por: Mapped[str | None] = mapped_column(String(150))
    fecha_aprobacion: Mapped[datetime | None] = mapped_column(DateTime)
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

    orden: Mapped["OrdenServicio"] = relationship(back_populates="autorizaciones")

    def __repr__(self) -> str:
        return (
            f"<Autorizacion id={self.id} orden_id={self.orden_id} "
            f"tipo={self.tipo!r} aprobado={self.aprobado} monto={self.monto_orden}>"
        )
