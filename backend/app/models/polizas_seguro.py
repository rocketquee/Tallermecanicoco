"""Modelo de la tabla polizas_seguro (VEH-04, VEH-05).

Refleja exactamente el DDL de sql/02_vehiculos.sql.
"""

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.vehiculos import Vehiculo


class PolizaSeguro(Base):
    """Póliza de seguro del vehículo; vigencia_fin dispara la alerta de 30 días.

    Un vehículo acumula una póliza por año: el índice de vehiculo_id NO es
    UNIQUE a propósito, para conservar el historial (VEH-04, VEH-05).
    """

    __tablename__ = "polizas_seguro"
    __table_args__ = (
        Index("idx_polizas_vehiculo", "vehiculo_id"),
        Index("idx_polizas_vigencia_fin", "vigencia_fin"),
        {
            "comment": "Pólizas de seguro de los vehículos (VEH-04, VEH-05)",
        },
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    vehiculo_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "vehiculos.id",
            name="fk_polizas_vehiculo",
            ondelete="RESTRICT",
            onupdate="CASCADE",
        ),
        nullable=False,
    )
    aseguradora: Mapped[str] = mapped_column(String(100), nullable=False)
    numero_poliza: Mapped[str] = mapped_column(String(50), nullable=False)
    vigencia_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    vigencia_fin: Mapped[date] = mapped_column(Date, nullable=False)
    cobertura: Mapped[str | None] = mapped_column(Text)
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

    vehiculo: Mapped["Vehiculo"] = relationship(back_populates="polizas")

    def __repr__(self) -> str:
        return (
            f"<PolizaSeguro id={self.id} aseguradora={self.aseguradora!r} "
            f"vigencia={self.vigencia_inicio}..{self.vigencia_fin}>"
        )
