"""Modelo de la tabla compras (PRV-03 a PRV-09).

Refleja exactamente el DDL de sql/03_inventario.sql.

Nota: ``orden_id`` apunta a ``ordenes_servicio.id``. La tabla se crea en el
Bloque 4 (sql/04_ordenes.sql), que agrega la restriccion con
``ALTER TABLE compras ADD CONSTRAINT fk_compras_orden ...``; aqui ya se declara
la ForeignKey y la relacion porque el modelo OrdenServicio existe.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Boolean,
    Date,
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
    from app.models.detalle_compra import DetalleCompra
    from app.models.ordenes_servicio import OrdenServicio
    from app.models.proveedores import Proveedor


class Compra(Base):
    """Orden de compra a un proveedor internacional, con moneda y tipo de cambio."""

    __tablename__ = "compras"
    __table_args__ = (
        Index("idx_compras_proveedor", "proveedor_id"),
        Index("idx_compras_orden", "orden_id"),
        Index("idx_compras_estado", "estado"),
        Index("idx_compras_fecha_estimada", "fecha_estimada_llegada"),
        {
            "mysql_engine": "InnoDB",
            "mysql_charset": "utf8mb4",
            "mysql_collate": "utf8mb4_unicode_ci",
            "comment": "Órdenes de compra a proveedores internacionales (PRV-03 a PRV-09)",
        },
    )

    id: Mapped[int] = mapped_column(
        INTEGER(unsigned=True), primary_key=True, autoincrement=True
    )
    proveedor_id: Mapped[int] = mapped_column(
        INTEGER(unsigned=True),
        ForeignKey(
            "proveedores.id",
            name="fk_compras_proveedor",
            ondelete="RESTRICT",
            onupdate="CASCADE",
        ),
        nullable=False,
    )
    # Orden de servicio que motivo la compra (PRV-05).
    orden_id: Mapped[int | None] = mapped_column(
        INTEGER(unsigned=True),
        ForeignKey(
            "ordenes_servicio.id",
            name="fk_compras_orden",
            ondelete="RESTRICT",
            onupdate="CASCADE",
        ),
    )
    fecha_pedido: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    fecha_estimada_llegada: Mapped[date | None] = mapped_column(Date)
    estado: Mapped[str] = mapped_column(
        Enum(
            "Borrador",
            "Aprobada",
            "Enviada",
            "Recibida",
            "Cancelada",
            name="estado_compra",
        ),
        nullable=False,
        server_default="Borrador",
    )
    moneda_original: Mapped[str] = mapped_column(
        Enum("EUR", "GBP", "MXN", "USD", name="moneda_compra"),
        nullable=False,
    )
    tipo_cambio: Mapped[Decimal | None] = mapped_column(Numeric(10, 4))
    total_moneda_original: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    total_mxn: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    solicitado_por: Mapped[str | None] = mapped_column(String(150))
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

    proveedor: Mapped["Proveedor"] = relationship(back_populates="compras")
    detalles: Mapped[list["DetalleCompra"]] = relationship(back_populates="compra")
    orden: Mapped[Optional["OrdenServicio"]] = relationship(back_populates="compras")

    def __repr__(self) -> str:
        return (
            f"<Compra id={self.id} proveedor_id={self.proveedor_id} "
            f"estado={self.estado!r} moneda={self.moneda_original!r}>"
        )
