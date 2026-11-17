"""Punto de entrada de la API de AutoPulse Elite."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import engine, get_db
from app.routers import auth, clientes, ordenes, usuarios, vehiculos


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Avisa al arrancar si MySQL no responde (no impide levantar la API)."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"[startup] Conexion a MySQL OK -> {settings.DB_NAME}")
    except Exception as exc:
        print(f"[startup] ADVERTENCIA: sin conexion a MySQL -> {exc}")
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description="API de gestion para Pizarro Performance Garage.",
    lifespan=lifespan,
)

# Modulos de la API. Cada router define su prefijo corto (/clientes) y aqui
# se le antepone /api/v1.
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(clientes.router, prefix=settings.API_V1_PREFIX)
app.include_router(vehiculos.router, prefix=settings.API_V1_PREFIX)
app.include_router(ordenes.router, prefix=settings.API_V1_PREFIX)
app.include_router(usuarios.router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["inicio"])
def raiz() -> dict[str, str]:
    """Datos basicos de la API y atajos utiles."""
    return {
        "app": settings.APP_NAME,
        "ambiente": settings.APP_ENV,
        "docs": "/docs",
        "salud": f"{settings.API_V1_PREFIX}/salud",
        "login": f"{settings.API_V1_PREFIX}/login",
        "clientes": f"{settings.API_V1_PREFIX}/clientes",
        "vehiculos": f"{settings.API_V1_PREFIX}/vehiculos",
        "ordenes": f"{settings.API_V1_PREFIX}/ordenes",
        "usuarios": f"{settings.API_V1_PREFIX}/usuarios",
    }


@app.get(f"{settings.API_V1_PREFIX}/salud", tags=["inicio"])
def salud(db: Session = Depends(get_db)) -> dict[str, object]:
    """Comprueba API y base de datos en una sola llamada."""
    version_mysql = db.execute(text("SELECT VERSION()")).scalar_one()
    tablas = db.execute(
        text(
            "SELECT COUNT(*) FROM information_schema.tables "
            "WHERE table_schema = DATABASE()"
        )
    ).scalar_one()
    return {
        "estado": "ok",
        "mysql": version_mysql,
        "base_de_datos": settings.DB_NAME,
        "tablas": tablas,
    }
