"""Schemas de autenticacion (SEG-01 a SEG-04)."""

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

RolUsuario = Literal["Administrador", "Recepcion", "Mecanico"]


class LoginRequest(BaseModel):
    """Credenciales para ``POST /api/v1/login``.

    No se valida el formato del correo aqui a proposito: un correo mal escrito
    debe responder 401 credenciales invalidas, no 422, para no dar pistas sobre
    que cuentas existen.
    """

    correo: str = Field(
        ...,
        min_length=3,
        max_length=150,
        examples=["gabriel@pizarrogarage.mx"],
    )
    password: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="Contraseña en claro; viaja por HTTPS y nunca se registra",
    )


class UsuarioSesion(BaseModel):
    """Datos publicos del usuario autenticado (sin password_hash)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    correo: str
    rol: RolUsuario
    mecanico_id: Optional[int] = None
    activo: bool


class TokenOut(BaseModel):
    """Respuesta del login, compatible con el flujo OAuth2 password."""

    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int = Field(
        ..., description="Segundos de vigencia del token"
    )
    usuario: UsuarioSesion
