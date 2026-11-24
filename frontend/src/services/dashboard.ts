import api from './api'

export interface ValorCustodia {
  /** La API lo entrega como texto para no perder centavos. */
  valor: string
  moneda: string
  fuente: string
}

/**
 * Valor de los autos en custodia, calculado por la función SQL
 * `fn_valor_en_custodia()` y expuesto por `GET /dashboard/valor-custodia`.
 */
export async function obtenerValorCustodia(): Promise<ValorCustodia> {
  const { data } = await api.get<ValorCustodia>('/dashboard/valor-custodia')
  return data
}
