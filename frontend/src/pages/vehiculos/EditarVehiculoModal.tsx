import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  AlertTriangle,
  Car,
  LoaderCircle,
  Save,
  X,
} from 'lucide-react'
import { Boton } from '../../components/ui/Boton'
import { CampoSelect } from '../../components/formularios/CampoSelect'
import { CampoTexto } from '../../components/formularios/CampoTexto'
import { mensajeDeError } from '../../services/errores'
import { actualizarVehiculo } from '../../services/vehiculos'
import type { Cliente } from '../../types/clientes'
import type { Vehiculo } from '../../types/vehiculos'

const ANIO_ACTUAL = new Date().getFullYear()

interface Props {
  vehiculo: Vehiculo
  clientes: Cliente[]
  onCerrar: () => void
  onGuardado: (mensaje: string) => void
}

/**
 * Modal para corregir los datos de una unidad ya registrada. Usa el PUT
 * parcial del backend: solo viaja lo que el usuario confirma al guardar.
 */
export function EditarVehiculoModal({
  vehiculo,
  clientes,
  onCerrar,
  onGuardado,
}: Props) {
  const [clienteId, setClienteId] = useState(String(vehiculo.cliente_id))
  const [placas, setPlacas] = useState(vehiculo.placas)
  const [vin, setVin] = useState(vehiculo.vin ?? '')
  const [marca, setMarca] = useState(vehiculo.marca)
  const [modelo, setModelo] = useState(vehiculo.modelo)
  const [anio, setAnio] = useState(String(vehiculo.anio))
  const [color, setColor] = useState(vehiculo.color ?? '')
  const [kilometraje, setKilometraje] = useState(
    vehiculo.kilometraje_entrada === null
      ? ''
      : String(vehiculo.kilometraje_entrada),
  )
  const [valor, setValor] = useState(vehiculo.valor_aproximado ?? '')

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Si el directorio de clientes no trae al dueño actual (por ejemplo, un
  // cliente dado de baja), se conserva una opción para no perder la relación.
  const duenoEnLista = clientes.some(
    (cliente) => cliente.id === vehiculo.cliente_id,
  )

  // Bloquea el scroll del fondo y permite cerrar con Escape.
  useEffect(() => {
    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape' && !guardando) {
        onCerrar()
      }
    }

    document.addEventListener('keydown', alPresionarTecla)
    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', alPresionarTecla)
      document.body.style.overflow = overflowPrevio
    }
  }, [guardando, onCerrar])

  function validar(): string | null {
    if (!clienteId) {
      return 'Selecciona el cliente dueño del vehículo.'
    }
    if (placas.trim().length < 4) {
      return 'Las placas deben tener al menos 4 caracteres.'
    }
    if (!marca.trim()) {
      return 'La marca es obligatoria.'
    }
    if (!modelo.trim()) {
      return 'El modelo es obligatorio.'
    }

    const anioNumero = Number(anio)
    if (
      !Number.isInteger(anioNumero) ||
      anioNumero < 1900 ||
      anioNumero > ANIO_ACTUAL + 1
    ) {
      return `El año debe estar entre 1900 y ${ANIO_ACTUAL + 1}.`
    }

    if (kilometraje.trim()) {
      const km = Number(kilometraje)
      if (!Number.isInteger(km) || km < 0) {
        return 'El kilometraje debe ser un número entero mayor o igual a 0.'
      }
    }

    if (valor.trim()) {
      const monto = Number(valor)
      if (!Number.isFinite(monto) || monto < 0) {
        return 'El valor aproximado debe ser un número mayor o igual a 0.'
      }
    }

    return null
  }

  async function alGuardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setError(null)

    const errorValidacion = validar()
    if (errorValidacion) {
      setError(errorValidacion)
      return
    }

    setGuardando(true)
    try {
      const actualizado = await actualizarVehiculo(vehiculo.id, {
        cliente_id: Number(clienteId),
        placas: placas.trim().toUpperCase(),
        vin: vin.trim() ? vin.trim().toUpperCase() : null,
        marca: marca.trim(),
        modelo: modelo.trim(),
        anio: Number(anio),
        color: color.trim() || null,
        kilometraje_entrada: kilometraje.trim() ? Number(kilometraje) : null,
        valor_aproximado: valor.trim() ? Number(valor) : null,
      })
      onGuardado(
        `Vehículo ${actualizado.placas} actualizado correctamente.`,
      )
    } catch (fallo) {
      setError(mensajeDeError(fallo, 'No se pudo actualizar el vehículo.'))
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Cerrar edición de vehículo"
        onClick={onCerrar}
        disabled={guardando}
        className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-[2px] animate-[fundido-entrada_160ms_ease-out] disabled:cursor-not-allowed"
      />

      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-editar-vehiculo"
        onSubmit={alGuardar}
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-panel border border-line bg-panel shadow-2xl animate-[panel-entrada_180ms_ease-out] sm:rounded-panel"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-medium tracking-[0.16em] text-faint uppercase">
              Editar vehículo
            </p>
            <h2
              id="titulo-editar-vehiculo"
              className="mt-1 text-[18px] font-semibold tracking-tight text-foreground"
            >
              {vehiculo.marca} {vehiculo.modelo}
            </h2>
            <p className="mt-1 font-mono text-[11px] tracking-wider text-faint">
              {vehiculo.placas}
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-panel text-faint transition hover:bg-white/[0.04] hover:text-foreground disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div className="flex items-start gap-2 rounded-panel border border-sky-400/20 bg-sky-400/5 px-3.5 py-3 text-[11px] leading-5 text-sky-100">
            <Car className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
            <p>
              Los cambios quedan en la bitácora del sistema. Deja vacío un
              campo opcional para borrar su valor.
            </p>
          </div>

          <CampoSelect
            id="editar-vehiculo-cliente"
            etiqueta="Cliente dueño *"
            value={clienteId}
            onChange={(evento) => setClienteId(evento.target.value)}
            disabled={guardando}
          >
            <option value="">Selecciona un cliente</option>
            {!duenoEnLista && (
              <option value={vehiculo.cliente_id}>
                Cliente actual (#{vehiculo.cliente_id})
              </option>
            )}
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre} · {cliente.categoria}
                {cliente.activo ? '' : ' · Inactivo'}
              </option>
            ))}
          </CampoSelect>

          <div className="grid gap-4 sm:grid-cols-2">
            <CampoTexto
              id="editar-vehiculo-placas"
              etiqueta="Placas *"
              value={placas}
              onChange={(evento) => setPlacas(evento.target.value)}
              maxLength={20}
              autoComplete="off"
              disabled={guardando}
            />

            <CampoTexto
              id="editar-vehiculo-vin"
              etiqueta="VIN"
              value={vin}
              onChange={(evento) => setVin(evento.target.value)}
              maxLength={50}
              autoComplete="off"
              disabled={guardando}
            />

            <CampoTexto
              id="editar-vehiculo-marca"
              etiqueta="Marca *"
              value={marca}
              onChange={(evento) => setMarca(evento.target.value)}
              maxLength={50}
              disabled={guardando}
            />

            <CampoTexto
              id="editar-vehiculo-modelo"
              etiqueta="Modelo *"
              value={modelo}
              onChange={(evento) => setModelo(evento.target.value)}
              maxLength={50}
              disabled={guardando}
            />

            <CampoTexto
              id="editar-vehiculo-anio"
              etiqueta="Año *"
              type="number"
              min={1900}
              max={ANIO_ACTUAL + 1}
              value={anio}
              onChange={(evento) => setAnio(evento.target.value)}
              disabled={guardando}
            />

            <CampoTexto
              id="editar-vehiculo-color"
              etiqueta="Color"
              value={color}
              onChange={(evento) => setColor(evento.target.value)}
              maxLength={30}
              disabled={guardando}
            />

            <CampoTexto
              id="editar-vehiculo-kilometraje"
              etiqueta="Kilometraje de entrada"
              type="number"
              min={0}
              step={1}
              value={kilometraje}
              onChange={(evento) => setKilometraje(evento.target.value)}
              disabled={guardando}
            />

            <CampoTexto
              id="editar-vehiculo-valor"
              etiqueta="Valor aproximado (MXN)"
              type="number"
              min={0}
              step="0.01"
              value={valor}
              onChange={(evento) => setValor(evento.target.value)}
              disabled={guardando}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-panel border border-negative/30 bg-negative/10 px-3.5 py-3 text-[12px] leading-5 text-negative"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end">
          <Boton
            variante="secundario"
            onClick={onCerrar}
            disabled={guardando}
            type="button"
          >
            Cancelar
          </Boton>
          <Boton type="submit" disabled={guardando}>
            {guardando ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </Boton>
        </footer>
      </form>
    </div>
  )
}
