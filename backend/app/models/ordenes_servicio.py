"""Modelo de la tabla ordenes_servicio (ORD-01 a ORD-13).

Refleja exactamente el DDL de sql/04_ordenes.sql.
"""

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Numeric,
    Text,
    func,
    text,
)
from sqlalchemy.dialects.mysql import INTEGER
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.autorizaciones import Autorizacion
    from app.models.clientes import Cliente
    from app.models.compras import Compra
    from app.models.detalle_orden import DetalleOrden
    from app.models.facturas import Factura
    from app.models.fotos_vehiculo import FotoVehiculo
    from app.models.historial_etapas import HistorialEtapa
    from app.models.mecanicos import Mecanico
    from app.models.orden_mecanicos import OrdenMecanico
    from app.models.pagos import Pago
    from app.models.vehiculos import Vehiculo


class OrdenServicio(Base):
    """Orden de servicio: cuatro etapas, totales y bandera de autorización.

    ``mecanico_id`` es el responsable principal (ORD-09). Los demás mecánicos
    que participan viven en ``orden_mecanicos`` (Bloque 6) y el historial de
    cambios de etapa en ``historial_etapas``, que es donde se registra el
    usuario que movió la orden (ORD-04, ORD-05, ORD-08).
    """

    __tablename__ = "ordenes_servicio"
    __table_args__ = (
        Index("idx_ordenes_cliente", "cliente_id"),
        Index("idx_ordenes_vehiculo", "vehiculo_id"),
        Index("idx_ordenes_mecanico", "mecanico_id"),
        Index("idx_ordenes_estado", "estado"),
        Index("idx_ordenes_fecha", "created_at"),
        Index("idx_ordenes_requiere_autorizacion", "requiere_autorizacion"),
        {
            "mysql_engine": "InnoDB",
            "mysql_charset": "utf8mb4",
            "mysql_collate": "utf8mb4_unicode_ci",
            "comment": "Órdenes de servicio con sus cuatro etapas y totales (ORD-01 a ORD-13)",
        },
    )

    id: Mapped[int] = mapped_column(
        INTEGER(unsigned=True), primary_key=True, autoincrement=True
    )
    cliente_id: Mapped[int] = mapped_column(
        INTEGER(unsigned=True),
        ForeignKey(
            "clientes.id",
            name="fk_ordenes_cliente",
            ondelete="RESTRICT",
            onupdate="CASCADE",
        ),
        nullable=False,
    )
    vehiculo_id: Mapped[int] = mapped_column(
        INTEGER(unsigned=True),
        ForeignKey(
            "vehiculos.id",
            name="fk_ordenes_vehiculo",
            ondelete="RESTRICT",
            onupdate="CASCADE",
        ),
        nullable=False,
    )
    mecanico_id: Mapped[int | None] = mapped_column(
        INTEGER(unsigned=True),
        ForeignKey(
            "mecanicos.id",
            name="fk_ordenes_mecanico",
            ondelete="RESTRICT",
            onupdate="CASCADE",
        ),
    )
    estado: Mapped[str] = mapped_column(
        Enum(
            "Recibido",
            "Diagnostico",
            "Reparacion",
            "Listo",
            "Entregado",
            "Cancelado",
            name="estado_orden",
        ),
        nullable=False,
        server_default="Recibido",
    )
    falla_reportada: Mapped[str | None] = mapped_column(Text)
    total_piezas: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, server_default=text("0.00")
    )
    total_mano_obra: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, server_default=text("0.00")
    )
    subtotal: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, server_default=text("0.00")
    )
    iva: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, server_default=text("0.00")
    )
    total: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, server_default=text("0.00")
    )
    requiere_autorizacion: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("0")
    )
    motivo_cancelacion: Mapped[str | None] = mapped_column(Text)
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

    cliente: Mapped["Cliente"] = relationship(back_populates="ordenes")
    vehiculo: Mapped["Vehiculo"] = relationship(back_populates="ordenes")
    mecanico: Mapped[Optional["Mecanico"]] = relationship(back_populates="ordenes")
    detalles: Mapped[list["DetalleOrden"]] = relationship(back_populates="orden")
    compras: Mapped[list["Compra"]] = relationship(back_populates="orden")
    fotos: Mapped[list["FotoVehiculo"]] = relationship(back_populates="orden")

    # Bloque 5: finanzas
    pagos: Mapped[list["Pago"]] = relationship(back_populates="orden")
    facturas: Mapped[list["Factura"]] = relationship(back_populates="orden")
    autorizaciones: Mapped[list["Autorizacion"]] = relationship(
        back_populates="orden"
    )

    # Bloque 6: seguridad y multi-mecanico
    # Asociacion con columnas propias (created_at, updated_at, activo).
    asignaciones: Mapped[list["OrdenMecanico"]] = relationship(
        back_populates="orden"
    )
    # Vista de solo lectura: los mecanicos vigentes de la orden. Filtra
    # activo = 1 para que una desasignacion logica no siga apareciendo.
    mecanicos: Mapped[list["Mecanico"]] = relationship(
        secondary="orden_mecanicos",
        primaryjoin="OrdenServicio.id == orden_mecanicos.c.orden_id",
        secondaryjoin=(
            "and_(Mecanico.id == orden_mecanicos.c.mecanico_id, "
            "orden_mecanicos.c.activo == 1)"
        ),
        viewonly=True,
    )
    # Historial inmutable de cambios de etapa (ORD-06).
    historial: Mapped[list["HistorialEtapa"]] = relationship(
        back_populates="orden"
    )

    def __repr__(self) -> str:
        return (
            f"<OrdenServicio id={self.id} estado={self.estado!r} "
            f"vehiculo_id={self.vehiculo_id} total={self.total}>"
        )
