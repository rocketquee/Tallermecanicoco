"""Endpoints basicos de ordenes de servicio (ORD-01 a ORD-10).

Cubre listar, crear, avanzar etapa y registrar el avance del mecanico
(diagnostico, mano de obra, refacciones usadas y cambio de etapa). Los pagos,
las autorizaciones y las cancelaciones llegan en modulos posteriores.

Reglas aplicadas al crear
-------------------------
* Estado inicial ``Recibido``; el cliente no elige la etapa.
* El vehiculo debe existir, estar vigente y pertenecer al cliente indicado.
* Si se asigna responsable, ``orden_mecanicos`` se llena tambien (ADR-003).
* Se inserta el asiento de apertura en ``historial_etapas`` (ORD-06).
* Se registra la creacion en ``bitacora`` (SEG-06).
* Totales en 0.00 al crear; ``registrar-avance`` y ``avanzar-etapa`` los
  recalculan a partir del detalle vigente (mano de obra + refacciones + IVA).

Privacidad
----------
* El Mecanico solo lista las ordenes donde es responsable o participa
  (``orden_mecanicos`` activo).
* En la respuesta, ``total`` es ``null`` para el Mecanico (SEG-18) y el nombre
  de un cliente confidencial se sustituye por "Cliente confidencial"
  (SEG-17); las placas y la etapa se conservan.
"""

from decimal import ROUND_HALF_UP, Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import Select, false, or_, select
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import UsuarioActual, get_current_user, requiere_roles
from app.core.privacidad import ROL_MECANICO, orden_detalle_visible, orden_visible
from app.models import (
    Bitacora,
    Cliente,
    DetalleOrden,
    HistorialEtapa,
    Mecanico,
    MovimientoInventario,
    OrdenMecanico,
    OrdenServicio,
    Refaccion,
    Servicio,
    Usuario,
    Vehiculo,
)
from app.schemas.ordenes import (
    AvanceMecanicoIn,
    EstadoOrden,
    OrdenCreate,
    OrdenDetalleOut,
    OrdenOut,
)

router = APIRouter(
    prefix="/ordenes",
    tags=["Ordenes"],
    dependencies=[Depends(get_current_user)],
)

_TABLA = "ordenes_servicio"

# Flujo lineal del taller (ORD-04). ``Listo``, ``Entregado`` y ``Cancelado``
# ya no avanzan: el primero espera la entrega y los otros son estados finales.
_SIGUIENTE_ETAPA: dict[str, str | None] = {
    "Recibido": "Diagnostico",
    "Diagnostico": "Reparacion",
    "Reparacion": "Listo",
    "Listo": None,
    "Entregado": None,
    "Cancelado": None,
}

# Etapas que forman el flujo de taller. El mecanico solo puede moverse hacia
# adelante dentro de esta lista; el administrador puede corregir hacia atras
# (ORD-04, ORD-05). ``Entregado`` y ``Cancelado`` tienen sus propios flujos.
_FLUJO_TALLER: tuple[str, ...] = ("Recibido", "Diagnostico", "Reparacion", "Listo")
_ETAPAS_FINALES = frozenset({"Entregado", "Cancelado"})
_CENTAVO = Decimal("0.01")
_TASA_IVA = Decimal("0.16")


def _consulta_detalle() -> Select[tuple[OrdenServicio]]:
    """Orden con todo lo necesario para responder ``OrdenDetalleOut``."""
    return _consulta_base().options(
        selectinload(OrdenServicio.detalles).selectinload(DetalleOrden.servicio),
        selectinload(OrdenServicio.detalles).selectinload(DetalleOrden.refaccion),
    )


def _indice_etapa(estado: str) -> int | None:
    """Posicion de la etapa dentro del flujo de taller (``None`` si es final)."""
    try:
        return _FLUJO_TALLER.index(estado)
    except ValueError:
        return None


def _dinero(valor: Decimal) -> Decimal:
    """Redondea a centavos con el criterio contable habitual."""
    return valor.quantize(_CENTAVO, rounding=ROUND_HALF_UP)


def _recalcular_totales(db: Session, orden: OrdenServicio) -> None:
    """Recalcula los totales de la orden a partir de su detalle vigente.

    * ``total_piezas``: suma de las lineas de refaccion.
    * ``total_mano_obra``: suma de servicios con el descuento VIP del cliente.
    * ``subtotal``, ``iva`` y ``total``.

    El backend es la unica fuente de verdad de los importes; el frontend nunca
    los envia (SEG-18).
    """
    lineas = db.scalars(
        select(DetalleOrden).where(
            DetalleOrden.orden_id == orden.id,
            DetalleOrden.activo == 1,
        )
    ).all()

    piezas = Decimal("0.00")
    mano_obra = Decimal("0.00")
    for linea in lineas:
        importe = linea.precio_unitario * linea.cantidad
        if linea.refaccion_id is not None:
            piezas += importe
        elif linea.servicio_id is not None:
            mano_obra += importe

    descuento = Decimal(orden.cliente.descuento_mano_obra or 0)
    if descuento < 0:
        descuento = Decimal("0")
    elif descuento > 100:
        descuento = Decimal("100")
    factor_descuento = (Decimal("100") - descuento) / Decimal("100")

    orden.total_piezas = _dinero(piezas)
    orden.total_mano_obra = _dinero(mano_obra * factor_descuento)
    orden.subtotal = _dinero(orden.total_piezas + orden.total_mano_obra)
    orden.iva = _dinero(orden.subtotal * _TASA_IVA)
    orden.total = _dinero(orden.subtotal + orden.iva)


def _consulta_base() -> Select[tuple[OrdenServicio]]:
    """Ordenes con cliente, vehiculo y responsable ya cargados."""
    return select(OrdenServicio).options(
        selectinload(OrdenServicio.cliente),
        selectinload(OrdenServicio.vehiculo),
        selectinload(OrdenServicio.mecanico),
    )


def _solo_sus_ordenes(
    stmt: Select[tuple[OrdenServicio]], usuario: Usuario
) -> Select[tuple[OrdenServicio]]:
    """Restringe la consulta a las ordenes del mecanico autenticado.

    Se consideran tanto las que tiene como responsable principal
    (``mecanico_id``) como las que tiene asignadas en ``orden_mecanicos``.
    """
    if usuario.rol != ROL_MECANICO:
        return stmt
    if usuario.mecanico_id is None:
        # Usuario Mecanico sin ficha vinculada: no debe ver ninguna orden.
        return stmt.where(false())

    asignadas = select(OrdenMecanico.orden_id).where(
        OrdenMecanico.mecanico_id == usuario.mecanico_id,
        OrdenMecanico.activo == 1,
    )
    return stmt.where(
        or_(
            OrdenServicio.mecanico_id == usuario.mecanico_id,
            OrdenServicio.id.in_(asignadas),
        )
    )


def _cliente_activo(db: Session, cliente_id: int) -> Cliente:
    cliente = db.get(Cliente, cliente_id)
    if cliente is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente {cliente_id} no encontrado",
        )
    if not cliente.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El cliente {cliente_id} esta dado de baja",
        )
    return cliente


def _vehiculo_activo(db: Session, vehiculo_id: int) -> Vehiculo:
    vehiculo = db.get(Vehiculo, vehiculo_id)
    if vehiculo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehiculo {vehiculo_id} no encontrado",
        )
    if not vehiculo.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El vehiculo {vehiculo_id} esta dado de baja",
        )
    return vehiculo


def _mecanico_activo(db: Session, mecanico_id: int) -> Mecanico:
    mecanico = db.get(Mecanico, mecanico_id)
    if mecanico is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mecanico {mecanico_id} no encontrado",
        )
    if not mecanico.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El mecanico {mecanico_id} esta dado de baja",
        )
    return mecanico


@router.get(
    "",
    response_model=list[OrdenOut],
    summary="Listar ordenes",
    description=(
        "Listado paginado y filtrable. Un Mecanico solo ve sus ordenes "
        "(responsable o participante activo), sin totales y con el cliente "
        "confidencial enmascarado."
    ),
)
def listar_ordenes(
    usuario: UsuarioActual,
    db: Session = Depends(get_db),
    estado: Annotated[
        EstadoOrden | None, Query(description="Filtra por etapa de la orden")
    ] = None,
    cliente_id: Annotated[
        int | None, Query(gt=0, description="Filtra por cliente")
    ] = None,
    mecanico_id: Annotated[
        int | None, Query(gt=0, description="Filtra por mecanico responsable")
    ] = None,
    incluir_inactivos: Annotated[
        bool, Query(description="Incluye ordenes con activo = 0")
    ] = False,
    skip: Annotated[int, Query(ge=0, description="Registros a saltar")] = 0,
    limit: Annotated[
        int, Query(ge=1, le=200, description="Maximo de registros")
    ] = 50,
) -> list[OrdenOut]:
    stmt = _consulta_base()
    if not incluir_inactivos:
        stmt = stmt.where(OrdenServicio.activo == 1)
    if estado is not None:
        stmt = stmt.where(OrdenServicio.estado == estado)
    if cliente_id is not None:
        stmt = stmt.where(OrdenServicio.cliente_id == cliente_id)
    if mecanico_id is not None:
        stmt = stmt.where(OrdenServicio.mecanico_id == mecanico_id)

    stmt = _solo_sus_ordenes(stmt, usuario)
    stmt = (
        stmt.order_by(OrdenServicio.created_at.desc(), OrdenServicio.id.desc())
        .offset(skip)
        .limit(limit)
    )
    return [orden_visible(orden, usuario) for orden in db.scalars(stmt)]


@router.get(
    "/{orden_id}",
    response_model=OrdenDetalleOut,
    summary="Detalle de la orden",
    description=(
        "Devuelve la orden completa: cliente, vehiculo, conceptos de mano de "
        "obra y refacciones, y totales. El Mecanico solo puede abrir sus "
        "ordenes y no recibe importes (SEG-18)."
    ),
)
def obtener_orden(
    orden_id: int,
    usuario: UsuarioActual,
    db: Session = Depends(get_db),
) -> OrdenDetalleOut:
    stmt = _consulta_detalle().where(OrdenServicio.id == orden_id)
    orden = db.scalars(_solo_sus_ordenes(stmt, usuario)).first()
    if orden is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Orden {orden_id} no encontrada",
        )
    return orden_detalle_visible(orden, usuario)


@router.post(
    "",
    response_model=OrdenOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear orden",
    description=(
        "Abre una orden en estado `Recibido`. Valida cliente, vehiculo y "
        "mecanico; registra la asignacion, la apertura del historial y el "
        "asiento de bitacora. Solo Administrador y Recepcion."
    ),
    dependencies=[Depends(requiere_roles("Administrador", "Recepcion"))],
)
def crear_orden(
    payload: OrdenCreate,
    response: Response,
    usuario: UsuarioActual,
    db: Session = Depends(get_db),
) -> OrdenOut:
    cliente = _cliente_activo(db, payload.cliente_id)
    vehiculo = _vehiculo_activo(db, payload.vehiculo_id)
    if vehiculo.cliente_id != cliente.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"El vehiculo {vehiculo.id} pertenece al cliente "
                f"{vehiculo.cliente_id}, no al {cliente.id}"
            ),
        )

    mecanico = (
        _mecanico_activo(db, payload.mecanico_id)
        if payload.mecanico_id is not None
        else None
    )

    orden = OrdenServicio(
        cliente_id=cliente.id,
        vehiculo_id=vehiculo.id,
        mecanico_id=mecanico.id if mecanico else None,
        estado="Recibido",
        falla_reportada=payload.falla_reportada,
    )
    db.add(orden)
    try:
        # El id hace falta para las tablas hijas, asi que se fuerza el INSERT
        # dentro de la misma transaccion antes de agregarlas.
        db.flush()
        db.add(
            HistorialEtapa(
                orden_id=orden.id,
                etapa_anterior=None,
                etapa_nueva="Recibido",
                usuario_id=usuario.id,
            )
        )
        if mecanico is not None:
            # ADR-003: el responsable tambien queda en la tabla puente.
            db.add(
                OrdenMecanico(orden_id=orden.id, mecanico_id=mecanico.id)
            )
        db.add(
            Bitacora(
                usuario_id=usuario.id,
                tabla_afectada=_TABLA,
                registro_id=orden.id,
                accion="Creacion",
                detalle=f"Orden {orden.id} creada en estado Recibido",
            )
        )
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo crear la orden en la base de datos",
        ) from exc

    db.refresh(orden)
    response.headers["Location"] = (
        f"{settings.API_V1_PREFIX}/ordenes/{orden.id}"
    )
    return orden_visible(orden, usuario)


@router.post(
    "/{orden_id}/avanzar-etapa",
    response_model=OrdenOut,
    summary="Avanzar etapa",
    description=(
        "Mueve la orden a la siguiente etapa del flujo "
        "(Recibido -> Diagnostico -> Reparacion -> Listo) y recalcula los "
        "totales con el detalle vigente (piezas + mano de obra + IVA). Solo "
        "Administrador y Mecanico; el Mecanico solo puede avanzar sus propias "
        "ordenes. Cada cambio queda en `historial_etapas` y en `bitacora` "
        "(ORD-04, ORD-06)."
    ),
    dependencies=[Depends(requiere_roles("Administrador", "Mecanico"))],
)
def avanzar_etapa(
    orden_id: int,
    usuario: UsuarioActual,
    db: Session = Depends(get_db),
) -> OrdenOut:
    orden = db.scalars(
        _solo_sus_ordenes(
            _consulta_base().where(OrdenServicio.id == orden_id), usuario
        )
    ).first()
    if orden is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Orden {orden_id} no encontrada",
        )
    if not orden.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La orden {orden_id} esta dada de baja",
        )

    etapa_anterior = orden.estado
    etapa_nueva = _SIGUIENTE_ETAPA.get(etapa_anterior)
    if etapa_nueva is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"La orden {orden_id} ya esta en la etapa {etapa_anterior} "
                "y no tiene una siguiente"
            ),
        )

    orden.estado = etapa_nueva
    db.add(
        HistorialEtapa(
            orden_id=orden.id,
            etapa_anterior=etapa_anterior,
            etapa_nueva=etapa_nueva,
            usuario_id=usuario.id,
        )
    )
    db.add(
        Bitacora(
            usuario_id=usuario.id,
            tabla_afectada=_TABLA,
            registro_id=orden.id,
            accion="Actualizacion",
            detalle=(
                f"Orden {orden.id} avanzada de {etapa_anterior} "
                f"a {etapa_nueva}"
            ),
        )
    )

    try:
        # Los totales se recalculan con el detalle vigente para que el cambio
        # de etapa nunca deje importes desfasados (ORD-10).
        _recalcular_totales(db, orden)
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo actualizar la etapa de la orden",
        ) from exc

    db.refresh(orden)
    return orden_visible(orden, usuario)


@router.post(
    "/{orden_id}/registrar-avance",
    response_model=OrdenDetalleOut,
    summary="Registrar avance del mecanico",
    description=(
        "Guarda el diagnostico/notas, la mano de obra realizada, las "
        "refacciones usadas y, si se indica, la nueva etapa. Todo ocurre en "
        "una sola transaccion: los servicios y las piezas se insertan en "
        "`detalle_orden`, las piezas descuentan inventario (INV-02, INV-05), "
        "se recalculan piezas + mano de obra + IVA y se deja asiento en "
        "`historial_etapas` y `bitacora` (ORD-04, ORD-06, ORD-10). El "
        "Mecanico solo puede avanzar sus propias ordenes; el Administrador "
        "puede corregir hacia atras."
    ),
    dependencies=[Depends(requiere_roles("Administrador", "Mecanico"))],
)
def registrar_avance(
    orden_id: int,
    payload: AvanceMecanicoIn,
    usuario: UsuarioActual,
    db: Session = Depends(get_db),
) -> OrdenDetalleOut:
    orden = db.scalars(
        _solo_sus_ordenes(
            _consulta_base().where(OrdenServicio.id == orden_id), usuario
        )
    ).first()
    if orden is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Orden {orden_id} no encontrada",
        )
    if not orden.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La orden {orden_id} esta dada de baja",
        )

    etapa_anterior = orden.estado
    etapa_nueva = payload.etapa_nueva

    if etapa_nueva in _ETAPAS_FINALES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"La etapa {etapa_nueva} se registra desde su propio flujo, "
                "no desde el avance del mecanico"
            ),
        )
    if etapa_anterior in _ETAPAS_FINALES and etapa_nueva is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"La orden esta en la etapa final {etapa_anterior}; "
                "no se puede mover desde este reporte"
            ),
        )
    if etapa_nueva == etapa_anterior:
        etapa_nueva = None

    if etapa_nueva is not None and usuario.rol == ROL_MECANICO:
        actual = _indice_etapa(etapa_anterior)
        destino = _indice_etapa(etapa_nueva)
        if actual is None or destino is None or destino <= actual:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "El Mecanico solo puede avanzar la orden a una etapa "
                    "posterior del flujo del taller"
                ),
            )

    cambio_diagnostico = (
        payload.diagnostico is not None
        and payload.diagnostico != orden.diagnostico
    )
    if (
        not cambio_diagnostico
        and etapa_nueva is None
        and not payload.refacciones
        and not payload.servicios
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El avance no tiene cambios que registrar",
        )

    # Se recorren y bloquean las refacciones antes de tocar la orden para que
    # dos mecanicos no puedan dejar el stock en negativo. Se ordenan por id
    # para que las transacciones tomen los locks siempre en el mismo orden.
    refacciones: list[tuple[int, Refaccion]] = []
    for item in sorted(payload.refacciones, key=lambda linea: linea.refaccion_id):
        refaccion = db.scalars(
            select(Refaccion)
            .where(Refaccion.id == item.refaccion_id)
            .with_for_update()
        ).first()
        if refaccion is None or not refaccion.activo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"La refaccion {item.refaccion_id} no existe o esta dada "
                    "de baja"
                ),
            )
        if refaccion.stock_actual < item.cantidad:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Stock insuficiente de '{refaccion.nombre}': disponible "
                    f"{refaccion.stock_actual}, solicitado {item.cantidad}"
                ),
            )
        refacciones.append((item.cantidad, refaccion))

    # La mano de obra no mueve inventario, pero el servicio debe existir y
    # estar vigente. Se ordena por id para que la respuesta y la bitacora
    # sean deterministas.
    servicios: list[tuple[int, Servicio]] = []
    for item in sorted(payload.servicios, key=lambda linea: linea.servicio_id):
        servicio = db.get(Servicio, item.servicio_id)
        if servicio is None or not servicio.activo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"El servicio {item.servicio_id} no existe o esta dado "
                    "de baja"
                ),
            )
        servicios.append((item.cantidad, servicio))

    try:
        if cambio_diagnostico:
            orden.diagnostico = payload.diagnostico

        if etapa_nueva is not None:
            orden.estado = etapa_nueva
            db.add(
                HistorialEtapa(
                    orden_id=orden.id,
                    etapa_anterior=etapa_anterior,
                    etapa_nueva=etapa_nueva,
                    usuario_id=usuario.id,
                )
            )

        # Mano de obra: una linea por servicio con el precio del catalogo.
        for cantidad, servicio in servicios:
            db.add(
                DetalleOrden(
                    orden_id=orden.id,
                    servicio_id=servicio.id,
                    cantidad=cantidad,
                    # El precio lo pone el backend; el mecanico nunca lo ve.
                    precio_unitario=servicio.precio_mano_obra,
                )
            )

        for cantidad, refaccion in refacciones:
            db.add(
                DetalleOrden(
                    orden_id=orden.id,
                    refaccion_id=refaccion.id,
                    cantidad=cantidad,
                    # El precio lo pone el backend; el mecanico nunca lo ve.
                    precio_unitario=refaccion.precio_venta,
                )
            )
            refaccion.stock_actual -= cantidad
            db.add(
                MovimientoInventario(
                    refaccion_id=refaccion.id,
                    tipo="Salida",
                    cantidad=cantidad,
                    motivo=f"Refaccion usada en la orden {orden.id}",
                    usuario=usuario.nombre,
                )
            )

        db.flush()
        _recalcular_totales(db, orden)

        cambios: list[str] = []
        if etapa_nueva is not None:
            cambios.append(f"etapa {etapa_anterior} -> {etapa_nueva}")
        if cambio_diagnostico:
            cambios.append("diagnostico actualizado")
            if payload.diagnostico:
                cambios.append(f"nuevo diagnostico: {payload.diagnostico}")
        if servicios:
            total_aplicaciones = sum(cantidad for cantidad, _ in servicios)
            cambios.append(
                f"{len(servicios)} servicio(s) de mano de obra, "
                f"{total_aplicaciones} aplicacion(es)"
            )
        if refacciones:
            total_unidades = sum(cantidad for cantidad, _ in refacciones)
            cambios.append(
                f"{len(refacciones)} refaccion(es), {total_unidades} pieza(s)"
            )

        db.add(
            Bitacora(
                usuario_id=usuario.id,
                tabla_afectada=_TABLA,
                registro_id=orden.id,
                accion="Actualizacion",
                detalle=f"Orden {orden.id}: " + "; ".join(cambios),
            )
        )
        db.commit()
    except OperationalError as exc:
        db.rollback()
        original = getattr(exc, "orig", None)
        if original is not None and getattr(original, "args", None):
            if original.args[0] == 1644 and len(original.args) > 1:
                # Regla de negocio lanzada por un trigger (p. ej. XOR del
                # detalle_orden): se responde como error de validacion.
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=str(original.args[1]),
                ) from exc
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo registrar el avance de la orden",
        ) from exc
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo registrar el avance de la orden",
        ) from exc

    detalle = db.scalars(
        _solo_sus_ordenes(
            _consulta_detalle().where(OrdenServicio.id == orden_id), usuario
        ).execution_options(populate_existing=True)
    ).first()
    if detalle is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="La orden se guardo, pero no se pudo recargar",
        )
    return orden_detalle_visible(detalle, usuario)
