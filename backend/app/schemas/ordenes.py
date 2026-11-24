"""Schemas de ordenes de servicio (ORD-01 a ORD-13).

El POST crea el encabezado de la orden. El detalle de piezas y mano de obra se
captura con ``POST /ordenes/{id}/registrar-avance``; los totales los calcula el
backend a partir de ese detalle, nunca el frontend (SEG-18). Pagos y
autorizaciones llegan en modulos posteriores.
"""

from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

EstadoOrden = Literal[
    "Recibido",
    "Diagnostico",
    "Reparacion",
    "Listo",
    "Entregado",
    "Cancelado",
]


class OrdenCreate(BaseModel):
    """Alta de una orden en estado Recibido."""

    cliente_id: int = Field(..., gt=0, description="Dueño del vehiculo")
    vehiculo_id: int = Field(..., gt=0, description="Vehiculo que ingresa")
    mecanico_id: Optional[int] = Field(
        None,
        gt=0,
        description=(
            "Responsable principal (ORD-09). Si se envia, tambien se registra "
            "en orden_mecanicos (ADR-003)"
        ),
    )
    falla_reportada: Optional[str] = Field(
        None,
        max_length=2000,
        description="Falla o motivo de ingreso reportado por el cliente",
    )

    @field_validator("falla_reportada", mode="before")
    @classmethod
    def _limpiar_falla(cls, valor: object) -> object:
        if isinstance(valor, str):
            valor = " ".join(valor.split())
            return valor or None
        return valor


class OrdenOut(BaseModel):
    """Orden con los datos que necesita el frontend para listar y abrir.

    ``total`` es ``null`` para el rol Mecanico (SEG-18) y ``cliente_nombre``
    se sustituye por "Cliente confidencial" cuando aplica SEG-17.
    """

    id: int
    estado: EstadoOrden
    falla_reportada: Optional[str] = None
    diagnostico: Optional[str] = None
    cliente_id: int
    cliente_nombre: str
    vehiculo_id: int
    vehiculo_placas: str
    vehiculo_marca: str
    vehiculo_modelo: str
    mecanico_id: Optional[int] = None
    mecanico_nombre: Optional[str] = None
    total: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime
    activo: bool


class ClienteOrdenOut(BaseModel):
    """Datos del cliente que se imprimen en el detalle de la orden.

    Si el cliente es confidencial y quien consulta es Mecanico, el nombre se
    sustituye y los datos de contacto quedan en ``None`` (SEG-17).
    """

    id: int
    nombre: str
    telefono1: Optional[str] = None
    correo: Optional[str] = None
    rfc: Optional[str] = None
    categoria: str
    confidencial: bool


class VehiculoOrdenOut(BaseModel):
    """Datos tecnicos del vehiculo para el encabezado y la ficha."""

    id: int
    placas: str
    vin: Optional[str] = None
    marca: str
    modelo: str
    anio: int
    color: Optional[str] = None
    kilometraje_entrada: Optional[int] = None


class DetalleOrdenOut(BaseModel):
    """Linea de la orden: mano de obra o refaccion (ORD-10, INV-02).

    Para el rol Mecanico, ``precio_unitario`` e ``importe`` son ``None``
    porque no puede ver importes (SEG-18).
    """

    id: int
    tipo: Literal["Servicio", "Refaccion"]
    descripcion: str
    cantidad: int
    precio_unitario: Optional[Decimal] = None
    importe: Optional[Decimal] = None


class OrdenDetalleOut(BaseModel):
    """Vista completa de una orden: cliente, vehiculo, conceptos y totales."""

    id: int
    estado: EstadoOrden
    falla_reportada: Optional[str] = None
    diagnostico: Optional[str] = None
    cliente: ClienteOrdenOut
    vehiculo: VehiculoOrdenOut
    mecanico_id: Optional[int] = None
    mecanico_nombre: Optional[str] = None
    total_piezas: Optional[Decimal] = None
    total_mano_obra: Optional[Decimal] = None
    subtotal: Optional[Decimal] = None
    iva: Optional[Decimal] = None
    total: Optional[Decimal] = None
    detalles: list[DetalleOrdenOut] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    activo: bool


class RefaccionUsadaIn(BaseModel):
    """Refaccion que el mecanico consumio en la orden (INV-02, ORD-10).

    El frontend solo envia id y cantidad. El precio unitario lo resuelve el
    backend desde el catalogo, porque el rol Mecanico no puede ver importes
    (SEG-18).
    """

    refaccion_id: int = Field(..., gt=0)
    cantidad: int = Field(..., ge=1, le=999)


class ServicioUsadoIn(BaseModel):
    """Servicio de mano de obra realizado en la orden (ORD-10).

    El frontend solo envia id y cantidad. El precio se resuelve en el backend
    desde ``servicios.precio_mano_obra`` porque el rol Mecanico no puede ver
    importes (SEG-18).
    """

    servicio_id: int = Field(..., gt=0)
    cantidad: int = Field(
        1,
        ge=1,
        le=99,
        description="Veces que se aplico el servicio en esta visita",
    )


class AvanceMecanicoIn(BaseModel):
    """Cuerpo del reporte de avance del mecanico (ORD-04, ORD-10).

    * ``diagnostico``: texto libre con hallazgos y notas del trabajo.
    * ``etapa_nueva``: etapa destino; si se omite, la orden conserva la actual.
    * ``refacciones``: piezas consumidas; cada una genera una linea en
      ``detalle_orden`` y una salida de inventario (INV-02, INV-05).
    * ``servicios``: mano de obra realizada; cada una genera una linea en
      ``detalle_orden`` con el precio del catalogo.

    Al menos uno de los cuatro campos debe traer un cambio; el router lo
    valida.
    """

    diagnostico: Optional[str] = Field(
        None,
        max_length=4000,
        description="Diagnostico o notas del mecanico",
    )
    etapa_nueva: Optional[EstadoOrden] = Field(
        None,
        description=(
            "Etapa destino. El Mecanico solo puede avanzar; el Administrador "
            "puede corregir hacia atras (ORD-04, ORD-05)"
        ),
    )
    refacciones: list[RefaccionUsadaIn] = Field(
        default_factory=list,
        max_length=50,
        description="Refacciones usadas en esta visita",
    )
    servicios: list[ServicioUsadoIn] = Field(
        default_factory=list,
        max_length=50,
        description="Mano de obra realizada en esta visita",
    )

    @field_validator("diagnostico", mode="before")
    @classmethod
    def _limpiar_diagnostico(cls, valor: object) -> object:
        if isinstance(valor, str):
            valor = valor.replace("\r\n", "\n").strip()
            return valor or None
        return valor

    @field_validator("refacciones")
    @classmethod
    def _sin_refacciones_repetidas(
        cls, valor: list[RefaccionUsadaIn]
    ) -> list[RefaccionUsadaIn]:
        ids = [linea.refaccion_id for linea in valor]
        if len(ids) != len(set(ids)):
            raise ValueError(
                "Cada refaccion debe aparecer una sola vez en el avance"
            )
        return valor

    @field_validator("servicios")
    @classmethod
    def _sin_servicios_repetidos(
        cls, valor: list[ServicioUsadoIn]
    ) -> list[ServicioUsadoIn]:
        ids = [linea.servicio_id for linea in valor]
        if len(ids) != len(set(ids)):
            raise ValueError(
                "Cada servicio debe aparecer una sola vez en el avance"
            )
        return valor
