/**
 * Cliente HTTP unico de la aplicacion.
 *
 * baseURL '/api/v1' aprovecha el proxy de Vite en desarrollo:
 *   navegador -> /api/v1/login -> Vite -> http://127.0.0.1:8000/api/v1/login
 * En produccion, el servidor web debe redirigir /api al backend o habilitar CORS.
 */

import axios from 'axios'
import { cerrarSesion, obtenerToken } from './sesion'

const api = axios.create({
  baseURL: '/api/v1',
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
