import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Boton } from '../../components/ui/Boton'
import { CampoSelect } from '../../components/formularios/CampoSelect'
import { CampoTexto } from '../../components/formularios/CampoTexto'
import { clasesBoton } from '../../components/ui/estilosBoton'
import { EncabezadoPagina } from '../../components/ui/EncabezadoPagina'
import { Panel, PanelCabecera } from '../../components/ui/Panel'
import { useAuth } from '../../context/useAuth'
import { listarClientes } from '../../services/clientes'
import { mensajeDeError } from '../../services/errores'
import { crearVehiculo } from '../../services/vehiculos'
import type { Cliente } from '../../types/clientes'

const ANIO_ACTUAL = new Date().getFullYear()

export function NuevoVehiculo() {
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const puedeGestionar =
    usuario?.rol === 'Administrador' || usuario?.rol === 'Recepcion'

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [cargandoClientes, setCargandoClientes] = useState(true)
  const [errorClientes, setErrorClientes] = useState<string | null>(null)
  const [recargaClientes, setRecargaClientes] = useState(0)

  const [clienteId, setClienteId] = useState('')
  const [placas, setPlacas] = useState('')
  const [vin, setVin] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [anio, setAnio] = useState(String(ANIO_ACTUAL))
  const [color, setColor] = useState('')
  const [kilometraje, setKilometraje] = useState('')
  const [valor, setValor] = useState('')

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let vigente = true
    setCargandoClientes(true)
    setErrorClientes(null)

    listarClientes({ limit: 200 })
      .then((datos) => {
        if (vigente) {
          setClientes(datos)
        }
      })
      .catch((fallo: unknown) => {
        if (!vigente) {
          return
        }
        setClientes([])
        setErrorClientes(
          mensajeDeError(fallo, 'No se pudo cargar el directorio de clientes.'),
        )
      })
      .finally(() => {
        if (vigente) {
          setCargandoClientes(false)
        }
      })

    return () => {
      vigente = false
    }
  }, [recargaClientes])

  if (!puedeGestionar) {
    return <Navigate to="/vehiculos" replace />
  }

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

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setError(null)

    const errorValidacion = validar()
    if (errorValidacion) {
      setError(errorValidacion)
      return
    }

    setGuardando(true)
    try {
      await crearVehiculo({
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
      navegar('/vehiculos', {
        replace: true,
        state: { mensaje: 'Vehículo registrado correctamente.' },
      })
    } catch (fallo) {
      setError(mensajeDeError(fallo, 'No se pudo registrar el vehículo.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <EncabezadoPagina
        etiqueta="Flota del taller"
        titulo="Nuevo vehículo"
        descripcion="Registra una unidad y asígnala al cliente que será su dueño."
        acciones={
          <Link to="/vehiculos" className={clasesBoton('secundario')}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a vehículos
          </Link>
        }
      />

      {errorClientes && (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-panel border border-negative/30 bg-negative/10 px-4 py-3.5 text-[12px] text-negative sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{errorClientes}</p>
          <button
            type="button"
            onClick={() => setRecargaClientes((valorActual) => valorActual + 1)}
            className="rounded-panel border border-negative/30 px-3 py-2 font-medium transition hover:border-negative/60"
          >
            Reintentar
          </button>
        </div>
      )}

      {error && !errorClientes && (
        <div
          role="alert"
          className="rounded-panel border border-negative/30 bg-negative/10 px-4 py-3.5 text-[12px] text-negative"
        >
          {error}
        </div>
      )}

      <form onSubmit={enviar}>
        <Panel>
          <PanelCabecera
            titulo="Datos de la unidad"
            descripcion="Los campos marcados con * son obligatorios."
          />

          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
            <div className="sm:col-span-2">
              <CampoSelect
                id="vehiculo-cliente"
                etiqueta="Cliente dueño *"
                value={clienteId}
                onChange={(evento) => setClienteId(evento.target.value)}
                disabled={cargandoClientes || guardando}
              >
                <option value="">
                  {cargandoClientes
                    ? 'Cargando clientes…'
                    : 'Selecciona un cliente'}
                </option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre} · {cliente.categoria}
                  </option>
                ))}
              </CampoSelect>
            </div>

            <CampoTexto
              id="vehiculo-placas"
              etiqueta="Placas *"
              value={placas}
              onChange={(evento) => setPlacas(evento.target.value)}
              placeholder="Ej. PPG-009-I"
              maxLength={20}
              autoComplete="off"
              disabled={guardando}
            />

            <CampoTexto
              id="vehiculo-vin"
              etiqueta="VIN"
              value={vin}
              onChange={(evento) => setVin(evento.target.value)}
              placeholder="Número de serie de 17 caracteres"
              maxLength={50}
              autoComplete="off"
              disabled={guardando}
            />

            <CampoTexto
              id="vehiculo-marca"
              etiqueta="Marca *"
              value={marca}
              onChange={(evento) => setMarca(evento.target.value)}
              placeholder="Ej. Audi"
              maxLength={50}
              disabled={guardando}
            />

            <CampoTexto
              id="vehiculo-modelo"
              etiqueta="Modelo *"
              value={modelo}
              onChange={(evento) => setModelo(evento.target.value)}
              placeholder="Ej. RS5 Sportback"
              maxLength={50}
              disabled={guardando}
            />

            <CampoTexto
              id="vehiculo-anio"
              etiqueta="Año *"
              type="number"
              min={1900}
              max={ANIO_ACTUAL + 1}
              value={anio}
              onChange={(evento) => setAnio(evento.target.value)}
              disabled={guardando}
            />

            <CampoTexto
              id="vehiculo-color"
              etiqueta="Color"
              value={color}
              onChange={(evento) => setColor(evento.target.value)}
              placeholder="Ej. Gris"
              maxLength={30}
              disabled={guardando}
            />

            <CampoTexto
              id="vehiculo-kilometraje"
              etiqueta="Kilometraje de entrada"
              type="number"
              min={0}
              step={1}
              value={kilometraje}
              onChange={(evento) => setKilometraje(evento.target.value)}
              placeholder="Ej. 18500"
              disabled={guardando}
            />

            <CampoTexto
              id="vehiculo-valor"
              etiqueta="Valor aproximado (MXN)"
              type="number"
              min={0}
              step="0.01"
              value={valor}
              onChange={(evento) => setValor(evento.target.value)}
              placeholder="Ej. 980000"
              disabled={guardando}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-line px-4 py-4 sm:flex-row sm:justify-end sm:px-5">
            <Link to="/vehiculos" className={clasesBoton('secundario')}>
              Cancelar
            </Link>
            <Boton
              type="submit"
              disabled={guardando || cargandoClientes || Boolean(errorClientes)}
            >
              {guardando ? 'Registrando…' : 'Registrar vehículo'}
            </Boton>
          </div>
        </Panel>
      </form>
    </div>
  )
}
