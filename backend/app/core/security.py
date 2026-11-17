"""Hash de contraseñas y tokens JWT de AutoPulse Elite (SEG-01, SEG-15).

Contraseñas
-----------
El seed guarda ``scrypt$N$r$p$salt_b64$hash_b64`` (ADR-004). ``hashlib.scrypt``
es nativo de Python/OpenSSL, asi que no hace falta ``passlib`` ni ``bcrypt``.
La verificacion compara en tiempo constante con ``hmac.compare_digest``.

Cuando se decida migrar a bcrypt/argon2 (ADR-004), basta con agregar un
verificador por prefijo en ``verify_password`` y rehashear en el login: el
formato actual ya es autocontenido y no requiere columnas nuevas.

JWT
---
HS256 con ``JWT_SECRET_KEY`` del ``.env``. El token lleva ``sub`` (id del
usuario), ``correo``, ``rol``, ``iat`` y ``exp``. El rol dentro del token es
solo informativo: ``get_current_user`` recarga el usuario de la BD para que un
cambio de rol o una baja surtan efecto de inmediato, sin esperar a que expire
el token.
"""

import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt

from app.core.config import settings

# --- Contraseñas (scrypt, mismo formato que el seed) ---
_ESQUEMA = "scrypt"
_N = 16384
_R = 8
_P = 1
_DKLEN = 64
_SALT_BYTES = 16


class TokenInvalido(Exception):
    """El token no se pudo decodificar: firma, formato o expiracion."""


def _b64(datos: bytes) -> str:
    return base64.b64encode(datos).decode("ascii")


def _b64_inv(texto: str) -> bytes:
    return base64.b64decode(texto.encode("ascii"), validate=True)


def hash_password(password: str) -> str:
    """Genera un hash autocontenido ``scrypt$N$r$p$salt$hash``."""
    salt = secrets.token_bytes(_SALT_BYTES)
    derivada = hashlib.scrypt(
        password.encode("utf-8"), salt=salt, n=_N, r=_R, p=_P, dklen=_DKLEN
    )
    return f"{_ESQUEMA}${_N}${_R}${_P}${_b64(salt)}${_b64(derivada)}"


def verify_password(password: str, hash_guardado: str) -> bool:
    """Compara la contraseña con el hash almacenado en tiempo constante.

    Devuelve ``False`` (nunca lanza) si el formato es desconocido: asi un hash
    corrupto o de otro esquema no tumba el endpoint de login.
    """
    try:
        esquema, n, r, p, salt_b64, hash_b64 = hash_guardado.split("$")
        if esquema != _ESQUEMA:
            return False
        salt = _b64_inv(salt_b64)
        esperado = _b64_inv(hash_b64)
        calculado = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=int(n),
            r=int(r),
            p=int(p),
            dklen=len(esperado),
        )
    except (AttributeError, ValueError, TypeError):
        return False
    return hmac.compare_digest(calculado, esperado)


# Hash de relleno: si el correo no existe, se verifica igual contra este hash
# para que el tiempo de respuesta no delate que usuarios estan dados de alta.
HASH_FICTICIO = hash_password("autopulse-timing-dummy")


# --- JWT ---
def _secreto() -> str:
    return settings.JWT_SECRET_KEY.get_secret_value()


def _validar_configuracion() -> None:
    if (
        settings.APP_ENV.lower() not in {"development", "dev", "testing", "test"}
        and _secreto() == "cambiar-en-produccion"
    ):
        raise RuntimeError(
            "JWT_SECRET_KEY sigue con el valor de ejemplo; define uno real "
            "antes de arrancar fuera de desarrollo."
        )


_validar_configuracion()


def crear_token_acceso(
    *, usuario_id: int, correo: str, rol: str
) -> tuple[str, int]:
    """Devuelve ``(token, segundos_de_vigencia)``."""
    emitido = datetime.now(timezone.utc)
    expira = emitido + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    payload: dict[str, Any] = {
        "sub": str(usuario_id),
        "correo": correo,
        "rol": rol,
        "tipo": "access",
        "iat": emitido,
        "exp": expira,
    }
    token = jwt.encode(
        payload, _secreto(), algorithm=settings.JWT_ALGORITHM
    )
    vigencia = int((expira - emitido).total_seconds())
    return token, vigencia


def decodificar_token(token: str) -> dict[str, Any]:
    """Valida firma, expiracion y claims minimos del token."""
    try:
        payload = jwt.decode(
            token,
            _secreto(),
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["exp", "sub"]},
        )
    except jwt.PyJWTError as exc:
        raise TokenInvalido(str(exc)) from exc
    if payload.get("tipo") != "access":
        raise TokenInvalido("tipo de token no valido")
    return payload
