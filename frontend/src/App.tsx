import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { RutaPorRol } from './components/layout/RutaPorRol'
import { RutaProtegida } from './components/layout/RutaProtegida'
import { AuthProvider } from './context/AuthContext'
import { Dashboard } from './pages/dashboard/Dashboard'
import { Login } from './pages/login/Login'
import { ModuloProximamente } from './pages/sistema/ModuloProximamente'
import { NoEncontrada } from './pages/sistema/NoEncontrada'
import { ClienteDetalle } from './pages/clientes/ClienteDetalle'
import { ListaClientes } from './pages/clientes/ListaClientes'
import { NuevoCliente } from './pages/clientes/NuevoCliente'
import { Configuracion } from './pages/configuracion/Configuracion'
import { Inventario } from './pages/inventario/Inventario'
import { DetalleOrden } from './pages/ordenes/DetalleOrden'
import { NuevaOrden } from './pages/ordenes/NuevaOrden'
import { OrdenesServicio } from './pages/ordenes/OrdenesServicio'
import { Autorizaciones } from './pages/autorizaciones/Autorizaciones'
import { Pagos } from './pages/pagos/Pagos'
import { Proveedores } from './pages/proveedores/Proveedores'
import { NuevoVehiculo } from './pages/vehiculos/NuevoVehiculo'
import { Vehiculos } from './pages/vehiculos/Vehiculos'
import type { RolUsuario } from './types/auth'

/**
 * Módulos que todavía no tienen pantalla propia. Todos comparten la misma
 * vista vacía para conservar el fondo, la tipografía y los tokens del panel.
 * `roles` replica los permisos del menú lateral para que la ruta no quede
 * accesible escribiendo la URL a mano.
 */
const MODULOS_EN_CONSTRUCCION: ReadonlyArray<{
  ruta: string
  titulo: string
  descripcion: string
  roles: RolUsuario[]
}> = [
  {
    ruta: '/facturacion',
    titulo: 'Facturación',
    descripcion: 'Comprobantes fiscales, datos del emisor y cancelaciones.',
    roles: ['Administrador'],
  },
  {
    ruta: '/reportes',
    titulo: 'Reportes',
    descripcion:
      'Indicadores del taller, carga de trabajo y desempeño por mecánico.',
    roles: ['Administrador'],
  },
]

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<RutaProtegida />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />

              <Route path="/clientes" element={<ListaClientes />} />
              <Route path="/clientes/nuevo" element={<NuevoCliente />} />
              <Route path="/clientes/:id" element={<ClienteDetalle />} />
              <Route path="/vehiculos" element={<Vehiculos />} />
              <Route path="/vehiculos/nuevo" element={<NuevoVehiculo />} />
              <Route path="/ordenes" element={<OrdenesServicio />} />
              <Route path="/ordenes/:id" element={<DetalleOrden />} />

              {/* Rutas que solo puede abrir Administración o Recepción. */}
              <Route element={<RutaPorRol roles={['Administrador', 'Recepcion']} />}>
                <Route path="/inventario" element={<Inventario />} />
                <Route path="/ordenes/nuevo" element={<NuevaOrden />} />
                <Route path="/proveedores" element={<Proveedores />} />
                <Route path="/autorizaciones" element={<Autorizaciones />} />
              </Route>

              {/* Rutas exclusivas del Administrador. */}
              <Route element={<RutaPorRol roles={['Administrador']} />}>
                <Route path="/pagos" element={<Pagos />} />
                <Route path="/configuracion" element={<Configuracion />} />
              </Route>

              {MODULOS_EN_CONSTRUCCION.map(
                ({ ruta, titulo, descripcion, roles }) => (
                  <Route key={ruta} element={<RutaPorRol roles={roles} />}>
                    <Route
                      path={ruta}
                      element={
                        <ModuloProximamente
                          titulo={titulo}
                          descripcion={descripcion}
                        />
                      }
                    />
                  </Route>
                ),
              )}

              <Route path="*" element={<NoEncontrada />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
