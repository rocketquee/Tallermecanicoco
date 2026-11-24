"""Endpoints del tablero (REP-01, VEH-07, SEG-18).

El valor en custodia no se calcula en Python ni en el navegador: lo resuelve
la funcion SQL ``fn_valor_en_custodia()`` creada en
``sql/11_procedimientos_funciones.sql``. Asi el tablero y cualquier cliente
de la base consultan exactamente la misma cifra.
"""

from decimal import Decimal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, requiere_roles

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
    dependencies=[Depends(get_current_user)],
)


class ValorCustodiaOut(BaseModel):
    """Resultado de ``fn_valor_en_custodia()`` listo para el frontend."""

    valor: Decimal = Field(
        ...,
        description="Suma del valor aproximado de los vehiculos en custodia",
    )
    moneda: str = Field("MXN", description="Moneda de los valores del taller")
    fuente: str = Field(
        "fn_valor_en_custodia",
        description="Rutina SQL que produjo el dato",
    )


@router.get(
    "/valor-custodia",
    response_model=ValorCustodiaOut,
    summary="Valor de los vehiculos en custodia",
    description=(
        "Ejecuta `fn_valor_en_custodia()` en MySQL y devuelve la suma del "
        "valor aproximado de los autos con una orden vigente que aun no se "
        "entrega. Solo Administrador: es un dato economico (SEG-18)."
    ),
    dependencies=[Depends(requiere_roles("Administrador"))],
)
def valor_custodia(db: Session = Depends(get_db)) -> ValorCustodiaOut:
    valor = db.execute(text("SELECT fn_valor_en_custodia()")).scalar_one()
    return ValorCustodiaOut(valor=valor)
