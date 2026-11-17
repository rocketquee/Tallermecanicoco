"""Endpoints de autenticacion (SEG-01, SEG-15).

Dos formas de iniciar sesion, mismo resultado:

* ``POST /api/v1/login`` — JSON ``{"correo": ..., "password": ...}``. Es el
  que usara el frontend.
* ``POST /api/v1/login/token`` — formulario OAuth2 (``username`` = correo).
  Es el que consume el boton **Authorize** de Swagger.

Ambos devuelven ``access_token``, ``token_type``, ``expires_in`` y los datos
publicos del usuario. El ``password_hash`` nunca sale de la BD.

Nota de seguridad: no se distingue "correo no existe" de "contraseña
incorrecta" (mismo 401 y mismo costo de scrypt) para no permitir enumeracion
de cuentas. Falta agregar rate limiting cuando haya infraestructura de proxy.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import UsuarioActual
from app.core.security import HASH_FICTICIO, crear_token_acceso, verify_password
from app.models import Usuario
from app.schemas.auth import LoginRequest, TokenOut, UsuarioSesion

router = APIRouter(tags=["Autenticacion"])

_CREDENCIALES_INVALIDAS = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Correo o contraseña incorrectos",
    headers={"WWW-Authenticate": "Bearer"},
)


def _autenticar(db: Session, correo: str, password: str) -> TokenOut:
    """Valida credenciales y emite el token, o lanza 401/403."""
    correo = correo.strip().lower()
    usuario = db.scalar(select(Usuario).where(Usuario.correo == correo))

    if usuario is None:
        # Se verifica contra un hash ficticio para igualar el tiempo de
        # respuesta y no revelar que correos estan registrados.
        verify_password(password, HASH_FICTICIO)
        raise _CREDENCIALES_INVALIDAS

    if not verify_password(password, usuario.password_hash):
        raise _CREDENCIALES_INVALIDAS

    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta esta dada de baja; contacta al administrador",
        )

    token, vigencia = crear_token_acceso(
        usuario_id=usuario.id, correo=usuario.correo, rol=usuario.rol
    )
    return TokenOut(
        access_token=token,
        expires_in=vigencia,
        usuario=UsuarioSesion.model_validate(usuario),
    )


@router.post(
    "/login",
    response_model=TokenOut,
    summary="Iniciar sesion (JSON)",
    description="Credenciales en JSON; devuelve un JWT Bearer.",
)
def iniciar_sesion(
    payload: LoginRequest, db: Session = Depends(get_db)
) -> TokenOut:
    return _autenticar(db, payload.correo, payload.password)


@router.post(
    "/login/token",
    response_model=TokenOut,
    summary="Iniciar sesion (formulario OAuth2)",
    description=(
        "Variante que usa el boton **Authorize** de Swagger. "
        "En `username` va el correo y en `password` la contraseña."
    ),
)
def iniciar_sesion_form(
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
) -> TokenOut:
    return _autenticar(db, form.username, form.password)


@router.get(
    "/login/me",
    response_model=UsuarioSesion,
    summary="Usuario del token",
    description="Devuelve el usuario autenticado; util para depurar el login.",
)
def usuario_actual(usuario: UsuarioActual) -> Usuario:
    return usuario
