"""Configuracion central del backend de Apex Elite Motorsport.

Lee las variables del archivo .env y las expone como un objeto tipado.
Si una variable obligatoria falta o tiene un tipo invalido, la aplicacion
falla al arrancar en lugar de fallar a mitad de una peticion.
"""

from decimal import Decimal
from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

# E:\Tallermecanico\backend  (este archivo vive en backend\app\core\)
BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Variables de entorno validadas con Pydantic v2."""

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # --- Aplicacion ---
    APP_NAME: str = "Apex Elite Motorsport"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # --- CORS ---
    # "*" permite cualquier origen. En produccion conviene restringir a la URL
    # del frontend en Vercel; se aceptan varias separadas por coma:
    #   CORS_ORIGINS=https://miapp.vercel.app,https://miapp-git-main.vercel.app
    CORS_ORIGINS: str = "*"

    # --- Base de datos PostgreSQL (Aiven) ---
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "postgres"
    DB_PASSWORD: SecretStr = SecretStr("")
    DB_NAME: str = "autopulse_elite"
    # Driver de SQLAlchemy. psycopg2 se usa como "postgresql+psycopg2".
    DB_DRIVER: str = "psycopg2"
    # Aiven exige SSL: en la nube usa "require" (o "verify-full" con CA).
    # Localmente se puede dejar vacio para no forzar SSL.
    DB_SSLMODE: str = ""
    DB_ECHO: bool = False

    # --- Seguridad / JWT ---
    JWT_SECRET_KEY: SecretStr = SecretStr("cambiar-en-produccion")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # --- Finanzas (AUT-01) ---
    # Toda orden que supere este monto requiere autorizacion del Administrador
    # antes de continuar. Vive en la configuracion (no en el codigo del router)
    # para poder ajustarla por ambiente sin redesplegar.
    MONTO_AUTORIZACION: Decimal = Decimal("250000.00")

    # --- Fotos de vehiculos (VEH-03, VEH-08) ---
    UPLOAD_DIR: Path = Path("storage/fotos")
    MAX_FOTO_MB: int = 10
    MAX_FOTOS_POR_VEHICULO: int = 30

    @property
    def cors_origins(self) -> list[str]:
        """Lista de origenes permitidos a partir de CORS_ORIGINS."""
        bruto = self.CORS_ORIGINS.strip()
        if not bruto or bruto == "*":
            return ["*"]
        return [origen.strip().rstrip("/") for origen in bruto.split(",") if origen.strip()]

    @property
    def upload_path(self) -> Path:
        """Ruta absoluta de las fotos, resuelta dentro de la carpeta backend."""
        if self.UPLOAD_DIR.is_absolute():
            return self.UPLOAD_DIR
        return (BASE_DIR / self.UPLOAD_DIR).resolve()


@lru_cache
def get_settings() -> Settings:
    """Devuelve una sola instancia de Settings por proceso."""
    return Settings()


# Acceso directo: from app.core.config import settings
settings = get_settings()
