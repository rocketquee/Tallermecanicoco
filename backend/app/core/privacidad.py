"""Reglas de visibilidad por rol (SEG-17, SEG-18).

SEG-17: un cliente ``confidencial`` solo debe mostrar placas y trabajo
asignado al rol Mecanico.
SEG-18: el rol Mecanico no ve precios.

Estas funciones se aplican en la capa de serializacion, no en SQL, para no
duplicar consultas: se arma el schema completo y se enmascaran los campos.
Nunca se devuelve el objeto ORM directo cuando el usuario es Mecanico.

El filtro de "un mecanico solo ve sus ordenes" vive en el router de Ordenes
(consulta SQL), porque afecta que filas se devuelven; aqui solo se decide que
campos se enmascaran.
"""

from decimal import Decimal

from app.models import Cliente, OrdenServicio, Usuario, Vehiculo
from app.schemas.clientes import ClienteConVehiculos, ClienteOut
from app.schemas.ordenes import (
    ClienteOrdenOut,
    DetalleOrdenOut,
    OrdenDetalleOut,
    OrdenOut,
    VehiculoOrdenOut,
)
from app.schemas.vehiculos import VehiculoOut

ROL_MECANICO = "Mecanico"
ETIQUETA_CONFIDENCIAL = "Cliente confidencial"

# Datos personales y fiscales que se ocultan a un mecanico cuando el cliente
# es confidencial (SEG-17, SEG-19).
CAMPOS_PRIVADOS = (
    "telefono1",
    "telefono2",
    "correo",
    "direccion",
    "nombre_asistente",
    "notas",
    "rfc",
    "razon_social",
    "regimen_fiscal",
    "codigo_postal",
)


def _enmascarar_identidad(datos: ClienteOut) -> ClienteOut:
    cambios: dict[str, object] = {campo: None for campo in CAMPOS_PRIVADOS}
    cambios["nombre"] = ETIQUETA_CONFIDENCIAL
    return datos.model_copy(update=cambios)


def cliente_visible(cliente: Cliente, usuario: Usuario) -> ClienteOut:
    """Cliente listo para responder segun el rol de quien consulta."""
    datos = ClienteOut.model_validate(cliente)
    if usuario.rol != ROL_MECANICO:
        return datos

    # SEG-18: el mecanico no ve descuentos ni condiciones de pago.
    datos = datos.model_copy(
        update={
            "descuento_mano_obra": Decimal("0.00"),
            "permite_pagos_parciales": False,
        }
    )
    if cliente.confidencial:
        datos = _enmascarar_identidad(datos)
    return datos


def ficha_visible(
    cliente: Cliente, usuario: Usuario
) -> ClienteConVehiculos:
    """Ficha con vehiculos, enmascarada si el rol es Mecanico.

    Las placas, marca, modelo y año se conservan porque son necesarios para
    trabajar; el valor del vehiculo (dato economico) se oculta siempre.
    """
    ficha = ClienteConVehiculos.model_validate(cliente)
    if usuario.rol != ROL_MECANICO:
        return ficha

    cambios: dict[str, object] = {
        "vehiculos": [
            vehiculo.model_copy(update={"valor_aproximado": None})
            for vehiculo in ficha.vehiculos
        ],
        "descuento_mano_obra": Decimal("0.00"),
        "permite_pagos_parciales": False,
    }
    if cliente.confidencial:
        cambios.update({campo: None for campo in CAMPOS_PRIVADOS})
        cambios["nombre"] = ETIQUETA_CONFIDENCIAL
    return ficha.model_copy(update=cambios)


def vehiculo_visible(vehiculo: Vehiculo, usuario: Usuario) -> VehiculoOut:
    """Vehiculo listo para responder segun el rol.

    Las placas, VIN, marca, modelo y kilometraje se conservan porque son
    necesarios para trabajar; el valor estimado es un dato economico y el
    Mecanico nunca lo ve (SEG-18).
    """
    datos = VehiculoOut.model_validate(vehiculo)
    if usuario.rol == ROL_MECANICO:
        datos = datos.model_copy(update={"valor_aproximado": None})
    return datos


def orden_visible(orden: OrdenServicio, usuario: Usuario) -> OrdenOut:
    """Orden lista para responder segun el rol (SEG-17, SEG-18).

    El Mecanico conserva placas, etapa y trabajo asignado, pero:
      * ``total`` se devuelve como ``null`` (no ve precios);
      * si el cliente es ``confidencial``, ``cliente_nombre`` se sustituye
        por la etiqueta generica.

    ``cliente``, ``vehiculo`` y ``mecanico`` deben estar cargados o la sesion
    debe seguir abierta para que se resuelvan al acceder.
    """
    es_mecanico = usuario.rol == ROL_MECANICO
    datos = OrdenOut(
        id=orden.id,
        estado=orden.estado,
        falla_reportada=orden.falla_reportada,
        diagnostico=orden.diagnostico,
        cliente_id=orden.cliente_id,
        cliente_nombre=(
            ETIQUETA_CONFIDENCIAL
            if es_mecanico and orden.cliente.confidencial
            else orden.cliente.nombre
        ),
        vehiculo_id=orden.vehiculo_id,
        vehiculo_placas=orden.vehiculo.placas,
        vehiculo_marca=orden.vehiculo.marca,
        vehiculo_modelo=orden.vehiculo.modelo,
        mecanico_id=orden.mecanico_id,
        mecanico_nombre=orden.mecanico.nombre if orden.mecanico else None,
        total=orden.total,
        created_at=orden.created_at,
        updated_at=orden.updated_at,
        activo=orden.activo,
    )
    if es_mecanico:
        datos = datos.model_copy(update={"total": None})
    return datos


def orden_detalle_visible(
    orden: OrdenServicio, usuario: Usuario
) -> OrdenDetalleOut:
    """Vista completa de la orden con las mismas reglas de privacidad.

    * SEG-18: el Mecanico ve conceptos y cantidades, pero ningun importe
      (``precio_unitario``, ``importe`` ni totales).
    * SEG-17: si el cliente es confidencial, se sustituye su nombre y se
      ocultan telefono, correo y RFC.

    ``cliente``, ``vehiculo``, ``mecanico`` y ``detalles`` (con su servicio o
    refaccion) deben venir cargados desde el router.
    """
    es_mecanico = usuario.rol == ROL_MECANICO
    cliente = orden.cliente
    ocultar_cliente = es_mecanico and cliente.confidencial

    lineas = [
        DetalleOrdenOut(
            id=linea.id,
            tipo="Servicio" if linea.servicio_id else "Refaccion",
            descripcion=(
                linea.servicio.nombre
                if linea.servicio is not None
                else (
                    linea.refaccion.nombre
                    if linea.refaccion is not None
                    else "Concepto sin catalogo"
                )
            ),
            cantidad=linea.cantidad,
            precio_unitario=None if es_mecanico else linea.precio_unitario,
            importe=(
                None
                if es_mecanico
                else (linea.precio_unitario * linea.cantidad)
            ),
        )
        for linea in orden.detalles
        if linea.activo
    ]

    return OrdenDetalleOut(
        id=orden.id,
        estado=orden.estado,
        falla_reportada=orden.falla_reportada,
        diagnostico=orden.diagnostico,
        cliente=ClienteOrdenOut(
            id=cliente.id,
            nombre=(
                ETIQUETA_CONFIDENCIAL if ocultar_cliente else cliente.nombre
            ),
            telefono1=None if ocultar_cliente else cliente.telefono1,
            correo=None if ocultar_cliente else cliente.correo,
            rfc=None if ocultar_cliente else cliente.rfc,
            categoria=str(cliente.categoria),
            confidencial=cliente.confidencial,
        ),
        vehiculo=VehiculoOrdenOut(
            id=orden.vehiculo.id,
            placas=orden.vehiculo.placas,
            vin=orden.vehiculo.vin,
            marca=orden.vehiculo.marca,
            modelo=orden.vehiculo.modelo,
            anio=orden.vehiculo.anio,
            color=orden.vehiculo.color,
            kilometraje_entrada=orden.vehiculo.kilometraje_entrada,
        ),
        mecanico_id=orden.mecanico_id,
        mecanico_nombre=orden.mecanico.nombre if orden.mecanico else None,
        total_piezas=None if es_mecanico else orden.total_piezas,
        total_mano_obra=None if es_mecanico else orden.total_mano_obra,
        subtotal=None if es_mecanico else orden.subtotal,
        iva=None if es_mecanico else orden.iva,
        total=None if es_mecanico else orden.total,
        detalles=lineas,
        created_at=orden.created_at,
        updated_at=orden.updated_at,
        activo=orden.activo,
    )
