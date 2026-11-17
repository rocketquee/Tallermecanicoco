"""Endpoints basicos de ordenes de servicio (ORD-01 a ORD-09).

Cubre listar, crear y avanzar etapa, que es lo que necesita el tablero de
bahias del mecanico. El detalle de piezas y mano de obra, los pagos, las
autorizaciones y las cancelaciones llegan en modulos posteriores.

Reglas aplicadas al crear
-------------------------
* Estado inicial ``Recibido``; el cliente no elige la etapa.
* El vehiculo debe existir, estar vigente y pertenecer al cliente indicado.
* Si se asigna responsable, ``orden_mecanicos`` se llena tambien (ADR-003).
* Se inserta el asiento de apertura en ``historial_etapas`` (ORD-06).
* Se registra la creacion en ``bitacora`` (SEG-06).
* Totales en 0.00; los calculara el backend cuando exista el detalle.

Privacidad
----------
* El Mecanico solo lista las ordenes donde es responsable o participa
  (``orden_mecanicos`` activo).
* En la respuesta, ``total`` es ``null`` para el Mecanico (SEG-18) y el nombre
  de un cliente confidencial se sustituye por "Cliente confidencial"
  (SEG-17); las placas y la etapa se conservan.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import Select, false, or_, select
from sqlalchemy.exc import SQLAlchemyError
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
    OrdenMecanico,
    OrdenServicio,
    Usuario,
    Vehiculo,
)
from app.schemas.ordenes import (
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
        OrdenMecanico.activo.is_(True),
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
        stmt = stmt.where(OrdenServicio.activo.is_(True))
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
    stmt = (
        _consulta_base()
        .where(OrdenServicio.id == orden_id)
        .options(
            selectinload(OrdenServicio.detalles).selectinload(
                DetalleOrden.servicio
            ),
            selectinload(OrdenServicio.detalles).selectinload(
                DetalleOrden.refaccion
            ),
        )
    )
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
        "(Recibido -> Diagnostico -> Reparacion -> Listo). Solo Administrador "
        "y Mecanico; el Mecanico solo puede avanzar sus propias ordenes. "
        "Cada cambio queda en `historial_etapas` y en `bitacora` (ORD-04, ORD-06)."
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
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo actualizar la etapa de la orden",
        ) from exc

    db.refresh(orden)
    return orden_visible(orden, usuario)
