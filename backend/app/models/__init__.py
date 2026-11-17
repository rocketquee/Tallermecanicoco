"""Modelos SQLAlchemy de AutoPulse Elite.

Importar los modelos aqui garantiza que queden registrados en ``Base.metadata``.
Eso es necesario para que Alembic los detecte y para que las relaciones entre
bloques resuelvan sin errores (los nombres entre comillas se resuelven cuando
se configuran los mappers, no al importar).

Bloque 1: catalogos base (clientes, mecanicos, proveedores, servicios).
Bloque 2: vehiculos y polizas_seguro.
Bloque 3: inventario y compras (refacciones, compras, detalle_compra,
          movimientos_inventario).
Bloque 4: ordenes de servicio (ordenes_servicio, detalle_orden, fotos_vehiculo).
Bloque 5: finanzas (pagos, facturas, autorizaciones).
Bloque 6: seguridad y cierre (usuarios, bitacora, orden_mecanicos,
          historial_etapas, parametros).
"""

from app.models.autorizaciones import Autorizacion
from app.models.bitacora import Bitacora
from app.models.clientes import Cliente
from app.models.compras import Compra
from app.models.detalle_compra import DetalleCompra
from app.models.detalle_orden import DetalleOrden
from app.models.facturas import Factura
from app.models.fotos_vehiculo import FotoVehiculo
from app.models.historial_etapas import HistorialEtapa
from app.models.mecanicos import Mecanico
from app.models.movimientos_inventario import MovimientoInventario
from app.models.orden_mecanicos import OrdenMecanico
from app.models.ordenes_servicio import OrdenServicio
from app.models.pagos import Pago
from app.models.parametros import Parametro
from app.models.polizas_seguro import PolizaSeguro
from app.models.proveedores import Proveedor
from app.models.refacciones import Refaccion
from app.models.servicios import Servicio
from app.models.usuarios import Usuario
from app.models.vehiculos import Vehiculo

__all__ = [
    "Autorizacion",
    "Bitacora",
    "Cliente",
    "Compra",
    "DetalleCompra",
    "DetalleOrden",
    "Factura",
    "FotoVehiculo",
    "HistorialEtapa",
    "Mecanico",
    "MovimientoInventario",
    "OrdenMecanico",
    "OrdenServicio",
    "Pago",
    "Parametro",
    "PolizaSeguro",
    "Proveedor",
    "Refaccion",
    "Servicio",
    "Usuario",
    "Vehiculo",
]
