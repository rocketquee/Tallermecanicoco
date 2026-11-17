import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RutaProtegida } from './components/RutaProtegida'
import { AuthProvider } from './context/AuthContext'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { ModuloProximamente } from './pages/ModuloProximamente'
import { ClienteDetalle } from './pages/clientes/ClienteDetalle'
import { ListaClientes } from './pages/clientes/ListaClientes'
import { NuevoCliente } from './pages/clientes/NuevoCliente'
import { Configuracion } from './pages/configuracion/Configuracion'
import { DetalleOrden } from './pages/ordenes/DetalleOrden'
import { OrdenesServicio } from './pages/ordenes/OrdenesServicio'
import { NuevoVehiculo } from './pages/vehiculos/NuevoVehiculo'
import { Vehiculos } from './pages/vehiculos/Vehiculos'

/**
 * Módulos que todavía no tienen pantalla propia. Todos comparten la misma
 * vista vacía para conservar el fondo, la tipografía y los tokens del panel.
 */
const MODULOS_EN_CONSTRUCCION = [
  {
    ruta: '/inventario',
    titulo: 'Inventario',
    descripcion:
      'Piezas, tornillería y consumibles con existencias y puntos de reorden.',
  },
  {
    ruta: '/proveedores',
    titulo: 'Proveedores y compras',
    descripcion:
      'Directorio de proveedores y órdenes de compra con fechas de entrega.',
  },
  {
    ruta: '/pagos',
    titulo: 'Pagos',
    descripcion:
      'Cobranza, anticipos y saldos pendientes por orden de servicio.',
  },
  {
    ruta: '/facturacion',
    titulo: 'Facturación',
    descripcion: 'Comprobantes fiscales, datos del emisor y cancelaciones.',
  },
  {
    ruta: '/autorizaciones',
    titulo: 'Autorizaciones',
    descripcion:
      'Órdenes que superan el monto autorizado y requieren aprobación.',
  },
  {
    ruta: '/reportes',
    titulo: 'Reportes',
    descripcion:
      'Indicadores del taller, carga de trabajo y desempeño por mecánico.',
  },
] as const

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
              <Route path="/configuracion" element={<Configuracion />} />

              {MODULOS_EN_CONSTRUCCION.map(({ ruta, titulo, descripcion }) => (
                <Route
                  key={ruta}
                  path={ruta}
                  element={
                    <ModuloProximamente
                      titulo={titulo}
                      descripcion={descripcion}
                    />
                  }
                />
              ))}
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
