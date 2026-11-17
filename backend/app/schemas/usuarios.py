"""Schemas de administracion de usuarios (SEG-01, SEG-02).

Solo el Administrador consume estos endpoints. ``password_hash`` nunca sale
de la base de datos; el restablecimiento recibe la contraseña en claro por
HTTPS y el backend la guarda ya cifrada con scrypt.
"""

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

RolUsuario = Literal["Administrador", "Recepcion", "Mecanico"]


class UsuarioAdminOut(BaseModel):
    """Usuario visible en la pantalla de Configuracion."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    correo: str
    rol: RolUsuario
    mecanico_id: Optional[int] = None
    activo: bool


class RestablecerPasswordIn(BaseModel):
    """Nueva contraseña definida por el administrador."""

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Contraseña nueva; se guarda cifrada con scrypt",
    )
