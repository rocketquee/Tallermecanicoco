"""Modelo de la tabla detalle_orden (ORD-10, INV-02).

Refleja exactamente el DDL de sql/04_ordenes.sql.

REGLA DE NEGOCIO (ADR-005): cada línea es O mano de obra O refacción, nunca
las dos y nunca ninguna. Se conservan dos triggers (en PostgreSQL también
podría usarse un CHECK, pero así la regla y los nombres quedan iguales):

    trg_detalle_orden_bi  -> BEFORE INSERT ON detalle_orden
    trg_detalle_orden_bu  -> BEFORE UPDATE ON detalle_orden

Ambos lanzan ``RAISE EXCEPTION`` con ``ERRCODE = 'P0001'`` y el mensaje:
    'detalle_orden: debe indicar servicio_id o refaccion_id, pero no ambos'

Consecuencias para la aplicacion:
  * El error llega como ``sqlalchemy.exc.DBAPIError`` (SQLSTATE P0001), con el
    mensaje en ``orig.diag.message_primary``. El router lo traduce a un 422.
  * En los schemas de Pydantic se valida el XOR (exactamente uno de los dos)
    ANTES de tocar la BD, para dar un mensaje claro y no depender del trigger.
"""

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.ordenes_servicio import OrdenServicio
    from app.models.refacciones import Refaccion
    from app.models.servicios import Servicio


class DetalleOrden(Base):
    """Línea de la orden: servicio (mano de obra) XOR refacción (pieza)."""

    __tablename__ = "detalle_orden"
    __table_args__ = (
        Index("idx_detalle_orden_orden", "orden_id"),
        Index("idx_detalle_orden_servicio", "servicio_id"),
        Index("idx_detalle_orden_refaccion", "refaccion_id"),
        {
            "comment": "Detalle de piezas y mano de obra por orden (ORD-10, INV-02)",
        },
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    orden_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "ordenes_servicio.id",
            name="fk_detalle_orden_orden",
            ondelete="RESTRICT",
            onupdate="CASCADE",
        ),
        nullable=False,
    )
    # Excluyente con refaccion_id: lo valida el trigger (ver docstring).
    servicio_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey(
            "servicios.id",
            name="fk_detalle_orden_servicio",
            ondelete="RESTRICT",
            onupdate="CASCADE",
        ),
    )
    # Excluyente con servicio_id: lo valida el trigger (ver docstring).
    refaccion_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey(
            "refacciones.id",
            name="fk_detalle_orden_refaccion",
            ondelete="RESTRICT",
            onupdate="CASCADE",
        ),
    )
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    precio_unitario: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
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

    orden: Mapped["OrdenServicio"] = relationship(back_populates="detalles")
    servicio: Mapped[Optional["Servicio"]] = relationship(
        back_populates="detalles_orden"
    )
    refaccion: Mapped[Optional["Refaccion"]] = relationship(
        back_populates="detalles_orden"
    )

    def __repr__(self) -> str:
        tipo = "servicio" if self.servicio_id else "refaccion"
        ref = self.servicio_id or self.refaccion_id
        return (
            f"<DetalleOrden id={self.id} orden_id={self.orden_id} "
            f"{tipo}={ref} cantidad={self.cantidad} precio={self.precio_unitario}>"
        )
