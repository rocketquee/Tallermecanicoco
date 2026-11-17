"""Conexion a MySQL y sesiones de SQLAlchemy 2.x."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

# La URL se arma desde las variables DB_* para que la contrasena se escape
# sola y exista una unica fuente de verdad: DB_PASSWORD.
# Por eso NO se usa DATABASE_URL escrita a mano en el .env: si cambias la
# contrasena en un solo lugar, todo el sistema queda consistente.
DATABASE_URL = URL.create(
    drivername=f"mysql+{settings.DB_DRIVER}",
    username=settings.DB_USER,
    password=settings.DB_PASSWORD.get_secret_value(),
    host=settings.DB_HOST,
    port=settings.DB_PORT,
    database=settings.DB_NAME,
    query={"charset": "utf8mb4"},
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # descarta conexiones muertas antes de usarlas
    pool_recycle=3600,   # MySQL cierra conexiones ociosas a las 8 horas
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
