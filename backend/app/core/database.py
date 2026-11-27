"""Conexion a PostgreSQL y sesiones de SQLAlchemy 2.x."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

# La URL se arma desde las variables DB_* para que la contrasena se escape
# sola y exista una unica fuente de verdad: DB_PASSWORD.
# Por eso NO se usa DATABASE_URL escrita a mano en el .env: si cambias la
# contrasena en un solo lugar, todo el sistema queda consistente.
# sslmode solo se agrega si esta definido (Aiven lo exige en la nube).
_query: dict[str, str] = {}
if settings.DB_SSLMODE:
    _query["sslmode"] = settings.DB_SSLMODE

DATABASE_URL = URL.create(
    drivername=f"postgresql+{settings.DB_DRIVER}",
    username=settings.DB_USER,
    password=settings.DB_PASSWORD.get_secret_value(),
    host=settings.DB_HOST,
    port=settings.DB_PORT,
    database=settings.DB_NAME,
    query=_query,
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # descarta conexiones muertas antes de usarlas
    pool_recycle=3600,   # evita conexiones ociosas cerradas por el proxy de la nube
    echo=settings.DB_ECHO,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base declarativa de todos los modelos de app/models."""


def get_db() -> Generator[Session, None, None]:
    """Dependencia de FastAPI: una sesion por peticion, cerrada al final."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
