"""Schemas de autorizaciones por monto (AUT-01 a AUT-08).

Regla del taller: toda orden cuyo total supere ``MONTO_AUTORIZACION``
($250,000 por omision) requiere que el Administrador la apruebe antes de
continuar (AUT-01, AUT-03).

La tabla ``autorizaciones`` solo guarda ``aprobado`` (0/1), por lo que el
estado se deriva asi:

* ``Pendiente``: no hay registro, o lo hay sin ``fecha_aprobacion``.
* ``Aprobada``: ``aprobado = 1``.
* ``Rechazada``: ``aprobado = 0`` con ``fecha_aprobacion`` registrada.

El motivo del rechazo no tiene columna propia: se guarda en la bitacora, que
es el registro inmutable de la decision (SEG-06).
"""

from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

from app.schemas.ordenes import EstadoOrden

TipoAutorizacion = Literal["Monto_Alto", "Saldo_Pendiente", "Reautorizacion"]
EstadoAutorizacion = Literal["Pendiente", "Aprobada", "Rechazada"]


class AutorizacionResolverIn(BaseModel):
    """Cuerpo de ``POST /autorizaciones/orden/{orden_id}/resolver``.

    ``motivo`` es opcional pero se recomienda en los rechazos: queda escrito
    en la bitacora junto con el usuario y la fecha (AUT-05).
    """

    aprobado: bool = Field(
        ..., description="true autoriza la orden; false la rechaza"
    )
    motivo: Optional[str] = Field(
        None,
        max_length=500,
        description="Comentario del Administrador; se guarda en la bitacora",
    )

    @field_validator("motivo", mode="before")
    @classmethod
    def _limpiar_motivo(cls, valor: object) -> object:
        if isinstance(valor, str):
            valor = " ".join(valor.split())
            return valor or None
        return valor


class AutorizacionOrdenOut(BaseModel):
    """Orden que requiere autorizacion, con el estado de su solicitud."""

    orden_id: int
    estado_orden: EstadoOrden
    cliente_nombre: str
    vehiculo_placas: str
    vehiculo_descripcion: str
    total: Decimal
    saldo: Decimal
    estado: EstadoAutorizacion
    autorizacion_id: Optional[int] = None
    tipo: Optional[TipoAutorizacion] = None
    solicitada_en: Optional[datetime] = None
    aprobado_por: Optional[str] = None
    fecha_resolucion: Optional[datetime] = None
    requiere_autorizacion: bool


class AutorizacionesOut(BaseModel):
    """Listado con el umbral vigente para que el frontend lo muestre."""

    monto_umbral: Decimal
    total: int
    items: list[AutorizacionOrdenOut] = Field(default_factory=list)
