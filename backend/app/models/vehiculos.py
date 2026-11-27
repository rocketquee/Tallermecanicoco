"""Modelo de la tabla vehiculos (VEH-01 a VEH-08).

Refleja exactamente el DDL de sql/02_vehiculos.sql.
"""

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    # Solo para el chequeo de tipos: importar aqui evita el ciclo
    # clientes.py <-> vehiculos.py en tiempo de ejecucion.
    from app.models.clientes import Cliente
    from app.models.ordenes_servicio import OrdenServicio
    from app.models.polizas_seguro import PolizaSeguro


class Vehiculo(Base):
    """Vehículo de un cliente; guarda placas, VIN y valor para custodia."""

    __tablename__ = "vehiculos"
    __table_args__ = (
        Index("idx_vehiculos_cliente", "cliente_id"),
        Index("idx_vehiculos_placas", "placas"),
        Index("idx_vehiculos_vin", "vin"),
        {
            "comment": "Vehículos registrados de clientes (VEH-01 a VEH-08)",
        },
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    cliente_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "clientes.id",
            name="fk_vehiculos_cliente",
            ondelete="RESTRICT",
            onupdate="CASCADE",
        ),
        nullable=False,
    )
    placas: Mapped[str] = mapped_column(String(20), nullable=False)
    vin: Mapped[str | None] = mapped_column(String(50))
    marca: Mapped[str] = mapped_column(String(50), nullable=False)
    modelo: Mapped[str] = mapped_column(String(50), nullable=False)
    anio: Mapped[int] = mapped_column(Integer, nullable=False)
    color: Mapped[str | None] = mapped_column(String(30))
    kilometraje_entrada: Mapped[int | None] = mapped_column(Integer)
    valor_aproximado: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
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

    # N vehículos -> 1 cliente
    cliente: Mapped["Cliente"] = relationship(back_populates="vehiculos")

    # 1 vehículo -> N pólizas (historial por año).
    # La alerta de 30 días (VEH-05) buscará la de vigencia_fin más reciente.
    polizas: Mapped[list["PolizaSeguro"]] = relationship(back_populates="vehiculo")
    ordenes: Mapped[list["OrdenServicio"]] = relationship(back_populates="vehiculo")

    def __repr__(self) -> str:
        return (
            f"<Vehiculo id={self.id} placas={self.placas!r} "
            f"{self.marca} {self.modelo} {self.anio} cliente_id={self.cliente_id}>"
        )
