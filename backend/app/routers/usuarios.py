"""Endpoints de administracion de usuarios (SEG-01, SEG-02, SEG-15).

* Listar usuarios: solo Administrador.
* Restablecer contraseña: solo Administrador; el cambio queda en bitacora.
* El hash de la contraseña nunca se devuelve ni se registra en texto plano.

Convenciones del resto de la API:
* Prefijo ``/api/v1`` aplicado en ``main.py``; aqui solo va ``/usuarios``.
* Los errores de permisos responden 403; los recursos inexistentes, 404.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import UsuarioActual, get_current_user, requiere_roles
from app.core.security import hash_password
from app.models import Bitacora, Usuario
from app.schemas.usuarios import RestablecerPasswordIn, UsuarioAdminOut

router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"],
    dependencies=[Depends(get_current_user)],
)

_TABLA = "usuarios"


@router.get(
    "",
    response_model=list[UsuarioAdminOut],
    summary="Listar usuarios",
    description=(
        "Devuelve los usuarios del sistema para la pantalla de Configuracion. "
        "Solo Administrador."
    ),
    dependencies=[Depends(requiere_roles("Administrador"))],
)
def listar_usuarios(db: Session = Depends(get_db)) -> list[Usuario]:
    return list(db.scalars(select(Usuario).order_by(Usuario.id)))


@router.post(
    "/{usuario_id}/restablecer-password",
    response_model=UsuarioAdminOut,
    summary="Restablecer contraseña",
    description=(
        "Define una contraseña nueva para el usuario indicado. "
        "Solo Administrador; el evento queda registrado en la bitacora."
    ),
    dependencies=[Depends(requiere_roles("Administrador"))],
)
def restablecer_password(
    usuario_id: int,
    payload: RestablecerPasswordIn,
    admin: UsuarioActual,
    db: Session = Depends(get_db),
) -> Usuario:
    usuario = db.get(Usuario, usuario_id)
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario {usuario_id} no encontrado",
        )

    usuario.password_hash = hash_password(payload.password)
    db.add(
        Bitacora(
            usuario_id=admin.id,
            tabla_afectada=_TABLA,
            registro_id=usuario.id,
            accion="Actualizacion",
            detalle=(
                f"Contraseña restablecida para {usuario.correo} "
                f"por el administrador {admin.correo}"
            ),
        )
    )

    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo restablecer la contraseña en la base de datos",
        ) from exc

    db.refresh(usuario)
    return usuario
