"""Dependencias de autenticacion y autorizacion por rol.

``OAuth2PasswordBearer`` apunta a ``/api/v1/login/token`` porque es el endpoint
que consume el boton **Authorize** de Swagger (envia ``username`` y ``password``
como formulario). El endpoint JSON ``/api/v1/login`` existe ademas para el
frontend, que manda ``{"correo": ..., "password": ...}``.
"""

from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import TokenInvalido, decodificar_token
from app.models import Usuario

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/login/token",
    description=(
        "En el boton Authorize: username = correo, password = contraseña. "
        "Swagger llama a /api/v1/login/token y guarda el JWT."
    ),
)

_CREDENCIALES_INVALIDAS = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Token invalido o expirado",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> Usuario:
    """Valida el JWT y devuelve el usuario vigente.

    Se recarga el usuario desde la BD a proposito: si lo dieron de baja o le
    cambiaron el rol, el cambio aplica en la siguiente peticion aunque el
    token siga vigente.
    """
    try:
        payload = decodificar_token(token)
    except TokenInvalido as exc:
        raise _CREDENCIALES_INVALIDAS from exc

    try:
        usuario_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError) as exc:
        raise _CREDENCIALES_INVALIDAS from exc

    usuario = db.get(Usuario, usuario_id)
    if usuario is None or not usuario.activo:
        raise _CREDENCIALES_INVALIDAS
    return usuario


# Alias corto para usar en las firmas de los routers.
UsuarioActual = Annotated[Usuario, Depends(get_current_user)]


def requiere_roles(*roles: str) -> Callable[..., Usuario]:
    """Fabrica de dependencias para restringir un endpoint por rol.

    Uso:
        @router.post("", dependencies=[Depends(requiere_roles("Administrador"))])

    Responde 403 (autenticado pero sin permiso), no 401.
    """

    def _verificar(usuario: UsuarioActual) -> Usuario:
        if usuario.rol not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Tu rol no tiene permiso para esta operacion "
                    f"(se requiere: {', '.join(roles)})"
                ),
            )
        return usuario

    return _verificar
