/**
 * Cliente HTTP unico de la aplicacion.
 *
 * La URL base se toma de VITE_API_URL, que se define en un .env local o en
 * las variables del servicio de Railway. Si no existe, se usa
 * http://localhost:8000 como respaldo para desarrollo.
 *
 * El backend expone sus rutas bajo /api/v1, por eso ese prefijo se agrega aqui
 * y NO debe incluirse dentro de VITE_API_URL.
 *
 * En desarrollo tambien existe el proxy de Vite (vite.config.ts), pero ya no
 * es necesario: las peticiones pueden ir directo al backend.
 */

import axios from 'axios'
import { cerrarSesion, obtenerToken } from './sesion'

// Se quita una posible barra final para no generar URLs con doble "/".
const API_ORIGIN = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(
  /\/+$/,
  '',
)

const api = axios.create({
  baseURL: `${API_ORIGIN}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Adjunta el JWT a cada peticion si existe una sesion guardada.
api.interceptors.request.use((config) => {
  const token = obtenerToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Si el token expiro o dejo de ser valido, se limpia la sesion y se vuelve al
// login. El login se excluye porque un 401 ahi significa credenciales
// incorrectas, no una sesion vencida.
api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const esLogin = error.config?.url?.includes('/login')
    if (error.response?.status === 401 && !esLogin) {
      cerrarSesion()
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)

export default api
