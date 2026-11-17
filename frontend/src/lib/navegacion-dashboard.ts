import {
  BarChart3,
  Boxes,
  CarFront,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { RolUsuario } from '../types/auth'

export interface ItemNavegacion {
  etiqueta: string
  ruta: string
  icono: LucideIcon
  roles: RolUsuario[]
}

const TODOS: RolUsuario[] = ['Administrador', 'Recepcion', 'Mecanico']

/**
 * Fuente única de verdad para el menú y los permisos de navegación.
 * Los roles financieros solo incluyen al Administrador.
 */
export const NAVEGACION_DASHBOARD: ItemNavegacion[] = [
  {
    etiqueta: 'Principal',
    ruta: '/dashboard',
    icono: LayoutDashboard,
    roles: TODOS,
  },
  {
    etiqueta: 'Órdenes de servicio',
    ruta: '/ordenes',
    icono: ClipboardList,
    roles: TODOS,
  },
  {
    etiqueta: 'Clientes',
    ruta: '/clientes',
    icono: Users,
    roles: TODOS,
  },
  {
    etiqueta: 'Vehículos',
    ruta: '/vehiculos',
    icono: CarFront,
    roles: TODOS,
  },
  {
    etiqueta: 'Inventario',
    ruta: '/inventario',
    icono: Boxes,
    roles: TODOS,
  },
  {
    etiqueta: 'Proveedores y compras',
    ruta: '/proveedores',
    icono: ShoppingCart,
    roles: ['Administrador', 'Recepcion'],
  },
  {
    etiqueta: 'Pagos',
    ruta: '/pagos',
    icono: CreditCard,
    roles: ['Administrador'],
  },
  {
    etiqueta: 'Facturación',
    ruta: '/facturacion',
    icono: FileText,
    roles: ['Administrador'],
  },
  {
    etiqueta: 'Autorizaciones',
    ruta: '/autorizaciones',
    icono: ShieldCheck,
    roles: ['Administrador', 'Recepcion'],
  },
  {
    etiqueta: 'Reportes',
    ruta: '/reportes',
    icono: BarChart3,
    roles: ['Administrador'],
  },
  {
    etiqueta: 'Configuración',
    ruta: '/configuracion',
    icono: Settings,
    roles: ['Administrador'],
  },
]

export function navegacionParaRol(rol?: RolUsuario): ItemNavegacion[] {
  const rolActivo: RolUsuario = rol ?? 'Recepcion'
  return NAVEGACION_DASHBOARD.filter((item) => item.roles.includes(rolActivo))
}
