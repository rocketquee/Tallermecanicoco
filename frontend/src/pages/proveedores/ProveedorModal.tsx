import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  AlertTriangle,
  Building2,
  LoaderCircle,
  Save,
  X,
} from 'lucide-react'
import { Boton } from '../../components/ui/Boton'
import { CampoSelect } from '../../components/formularios/CampoSelect'
import { CampoTexto } from '../../components/formularios/CampoTexto'
import { mensajeDeError } from '../../services/errores'
import {
  actualizarProveedor,
  crearProveedor,
} from '../../services/proveedores'
import { MONEDAS } from '../../types/proveedores'
import type { Moneda, Proveedor } from '../../types/proveedores'

interface Props {
  /** Si viene, el modal edita; si no, da de alta un proveedor nuevo. */
  proveedor?: Proveedor
  onCerrar: () => void
  onGuardado: (mensaje: string) => void
}

/**
 * Alta y edición de proveedores (PRV-01, PRV-02). El tiempo de entrega se usa
 * para estimar la llegada de las compras, así que se captura en días.
 */
export function ProveedorModal({ proveedor, onCerrar, onGuardado }: Props) {
  const editando = Boolean(proveedor)

  const [nombre, setNombre] = useState(proveedor?.nombre ?? '')
  const [pais, setPais] = useState(proveedor?.pais ?? 'México')
  const [contacto, setContacto] = useState(proveedor?.contacto ?? '')
  const [telefono, setTelefono] = useState(proveedor?.telefono ?? '')
  const [correo, setCorreo] = useState(proveedor?.correo ?? '')
  const [dias, setDias] = useState(
    proveedor?.tiempo_entrega_dias === null ||
      proveedor?.tiempo_entrega_dias === undefined
      ? ''
      : String(proveedor.tiempo_entrega_dias),
  )
  const [moneda, setMoneda] = useState<Moneda>(proveedor?.moneda ?? 'MXN')

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    if (!nombre.trim()) {
      return 'El nombre del proveedor es obligatorio.'
    }
    if (!pais.trim()) {
      return 'El país del proveedor es obligatorio.'
    }
    if (dias.trim()) {
      const numero = Number(dias)
      if (!Number.isInteger(numero) || numero < 0 || numero > 365) {
        return 'Los días de entrega deben ser un entero entre 0 y 365.'
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

    const payload = {
      nombre: nombre.trim(),
      pais: pais.trim(),
      contacto: contacto.trim() || null,
      telefono: telefono.trim() || null,
      correo: correo.trim() || null,
      tiempo_entrega_dias: dias.trim() ? Number(dias) : null,
      moneda,
    }

    setGuardando(true)
    try {
      if (proveedor) {
        const actualizado = await actualizarProveedor(proveedor.id, payload)
        onGuardado(`Proveedor ${actualizado.nombre} actualizado.`)
      } else {
        const creado = await crearProveedor(payload)
        onGuardado(`Proveedor ${creado.nombre} registrado.`)
      }
    } catch (fallo) {
      setError(
        mensajeDeError(
          fallo,
          editando
            ? 'No se pudo actualizar el proveedor.'
            : 'No se pudo registrar el proveedor.',
        ),
      )
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Cerrar formulario de proveedor"
        onClick={onCerrar}
        disabled={guardando}
        className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-[2px] animate-[fundido-entrada_160ms_ease-out] disabled:cursor-not-allowed"
      />

      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-proveedor"
        onSubmit={alGuardar}
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-panel border border-line bg-panel shadow-2xl animate-[panel-entrada_180ms_ease-out] sm:rounded-panel"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-medium tracking-[0.16em] text-faint uppercase">
              Abastecimiento
            </p>
            <h2
              id="titulo-proveedor"
              className="mt-1 text-[18px] font-semibold tracking-tight text-foreground"
            >
              {editando ? 'Editar proveedor' : 'Nuevo proveedor'}
            </h2>
            <p className="mt-1 text-[11px] text-faint">
              Los campos marcados con * son obligatorios.
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
            <Building2
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              strokeWidth={1.8}
            />
            <p>
              El alta y la edición quedan en la bitácora. Los días de entrega
              alimentan la fecha estimada de llegada de las compras (PRV-02).
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <CampoTexto
                id="proveedor-nombre"
                etiqueta="Nombre o razón social *"
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
                maxLength={150}
                placeholder="Ej. SAFE Refacciones"
                autoComplete="off"
                disabled={guardando}
                autoFocus
              />
            </div>

            <CampoTexto
              id="proveedor-pais"
              etiqueta="País *"
              value={pais}
              onChange={(evento) => setPais(evento.target.value)}
              maxLength={60}
              placeholder="Ej. México"
              autoComplete="off"
              disabled={guardando}
            />

            <CampoSelect
              id="proveedor-moneda"
              etiqueta="Moneda"
              value={moneda}
              onChange={(evento) => setMoneda(evento.target.value as Moneda)}
              disabled={guardando}
            >
              {MONEDAS.map((opcion) => (
                <option key={opcion.valor} value={opcion.valor}>
                  {opcion.etiqueta}
                </option>
              ))}
            </CampoSelect>

            <CampoTexto
              id="proveedor-contacto"
              etiqueta="Persona de contacto"
              value={contacto}
              onChange={(evento) => setContacto(evento.target.value)}
              maxLength={150}
              placeholder="Ej. Área de ventas"
              autoComplete="off"
              disabled={guardando}
            />

            <CampoTexto
              id="proveedor-telefono"
              etiqueta="Teléfono"
              type="tel"
              value={telefono}
              onChange={(evento) => setTelefono(evento.target.value)}
              maxLength={30}
              placeholder="Ej. 55 1234 5678"
              autoComplete="off"
              disabled={guardando}
            />

            <CampoTexto
              id="proveedor-correo"
              etiqueta="Correo"
              type="email"
              value={correo}
              onChange={(evento) => setCorreo(evento.target.value)}
              maxLength={150}
              placeholder="Ej. ventas@proveedor.mx"
              autoComplete="off"
              disabled={guardando}
            />

            <CampoTexto
              id="proveedor-dias"
              etiqueta="Días de entrega"
              type="number"
              min={0}
              max={365}
              step={1}
              value={dias}
              onChange={(evento) => setDias(evento.target.value)}
              placeholder="Ej. 3"
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
            {guardando
              ? 'Guardando…'
              : editando
                ? 'Guardar cambios'
                : 'Registrar proveedor'}
          </Boton>
        </footer>
      </form>
    </div>
  )
}
