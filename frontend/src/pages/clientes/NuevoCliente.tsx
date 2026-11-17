import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { FormularioCliente } from '../../components/clientes/FormularioCliente'
import { crearCliente } from '../../services/clientes'
import { mensajeDeError } from '../../services/errores'
import { obtenerUsuario } from '../../services/sesion'
import type { ClientePayload } from '../../types/clientes'

export function NuevoCliente() {
  const navegar = useNavigate()
  const usuario = obtenerUsuario()
  const puedeGestionar =
    usuario?.rol === 'Administrador' || usuario?.rol === 'Recepcion'

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // El backend tambien responde 403; esto evita mostrar el formulario de mas.
  if (!puedeGestionar) {
    return <Navigate to="/clientes" replace />
  }

  async function guardar(payload: ClientePayload) {
    setGuardando(true)
    setError(null)
    try {
      const creado = await crearCliente(payload)
      navegar(`/clientes/${creado.id}`, {
        replace: true,
        state: { mensaje: 'Cliente creado correctamente.' },
      })
    } catch (fallo) {
      setError(mensajeDeError(fallo, 'No se pudo crear el cliente.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-5">
      <Link
        to="/clientes"
        className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-foreground"
      >
        <span aria-hidden="true">←</span> Volver a clientes
      </Link>

      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-faint uppercase">
          Directorio · Alta
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
          Nuevo cliente
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Captura los datos de contacto y las condiciones comerciales. Los
          vehículos se registran después desde el módulo correspondiente.
        </p>
      </div>

      <div className="rounded-panel border border-line bg-panel px-4 py-3.5 text-sm leading-6 text-muted">
        <strong className="font-semibold text-foreground">Tip:</strong> si
        eliges la categoría VIP, el descuento de mano de obra se propone en 10%
        (CLI-03). Puedes ajustarlo antes de guardar.
      </div>

      <FormularioCliente
        modo="crear"
        guardando={guardando}
        error={error}
        onGuardar={guardar}
        onCancelar={() => navegar('/clientes')}
      />
    </div>
  )
}
