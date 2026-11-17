import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Boton } from '../Boton'
import { CampoAreaTexto } from '../CampoAreaTexto'
import { CampoCheckbox } from '../CampoCheckbox'
import { CampoSelect } from '../CampoSelect'
import { CampoTexto } from '../CampoTexto'
import type {
  CategoriaCliente,
  Cliente,
  ClientePayload,
} from '../../types/clientes'

interface Props {
  cliente?: Cliente
  modo: 'crear' | 'editar'
  guardando?: boolean
  error?: string | null
  onGuardar: (payload: ClientePayload) => void | Promise<void>
  onCancelar: () => void
}

interface EstadoFormulario {
  nombre: string
  telefono1: string
  telefono2: string
  correo: string
  direccion: string
  nombreAsistente: string
  categoria: CategoriaCliente
  descuento: string
  permitePagosParciales: boolean
  confidencial: boolean
  activo: boolean
  notas: string
  rfc: string
  razonSocial: string
  regimenFiscal: string
  codigoPostal: string
}

function texto(valor: string | null | undefined): string {
  return valor ?? ''
}

function descuentoInicial(valor: string | null | undefined): string {
  const numero = Number(valor)
  return Number.isFinite(numero) ? String(numero) : '0'
}

function estadoInicial(cliente?: Cliente): EstadoFormulario {
  return {
    nombre: texto(cliente?.nombre),
    telefono1: texto(cliente?.telefono1),
    telefono2: texto(cliente?.telefono2),
    correo: texto(cliente?.correo),
    direccion: texto(cliente?.direccion),
    nombreAsistente: texto(cliente?.nombre_asistente),
    categoria: cliente?.categoria ?? 'Regular',
    descuento: descuentoInicial(cliente?.descuento_mano_obra),
    permitePagosParciales: cliente?.permite_pagos_parciales ?? false,
    confidencial: cliente?.confidencial ?? false,
    activo: cliente?.activo ?? true,
    notas: texto(cliente?.notas),
    rfc: texto(cliente?.rfc),
    razonSocial: texto(cliente?.razon_social),
    regimenFiscal: texto(cliente?.regimen_fiscal),
    codigoPostal: texto(cliente?.codigo_postal),
  }
}

/** Cadena vacia se convierte en null, como espera el backend. */
function opcional(valor: string): string | null {
  const limpio = valor.trim()
  return limpio ? limpio : null
}

function Seccion({
  titulo,
  descripcion,
  children,
}: {
  titulo: string
  descripcion?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-panel border border-line bg-panel p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-foreground">{titulo}</h2>
        {descripcion && (
          <p className="mt-1 text-xs leading-5 text-faint">{descripcion}</p>
        )}
      </div>
      {children}
    </section>
  )
}

/**
 * Formulario compartido por "Nuevo cliente" y la edicion de la ficha.
 * El backend es la fuente de verdad de las validaciones; aqui solo se evitan
 * los errores mas obvios antes de enviar.
 */
export function FormularioCliente({
  cliente,
  modo,
  guardando = false,
  error = null,
  onGuardar,
  onCancelar,
}: Props) {
  const [form, setForm] = useState<EstadoFormulario>(() =>
    estadoInicial(cliente),
  )
  const [errorLocal, setErrorLocal] = useState<string | null>(null)

  function cambiar<K extends keyof EstadoFormulario>(
    campo: K,
    valor: EstadoFormulario[K],
  ) {
    setForm((previo) => ({ ...previo, [campo]: valor }))
  }

  function cambiarCategoria(categoria: CategoriaCliente) {
    setForm((previo) => {
      const actual = Number(previo.descuento.replace(',', '.'))
      const sinDescuento =
        !previo.descuento.trim() || !Number.isFinite(actual) || actual <= 0
      return {
        ...previo,
        categoria,
        // CLI-03: un VIP nuevo arranca con 10% de descuento en mano de obra.
        descuento: categoria === 'VIP' && sinDescuento ? '10' : previo.descuento,
      }
    })
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    const nombre = form.nombre.trim()
    if (!nombre) {
      setErrorLocal('El nombre del cliente es obligatorio.')
      return
    }

    const descuento = Number(form.descuento.replace(',', '.'))
    if (!Number.isFinite(descuento) || descuento < 0 || descuento > 100) {
      setErrorLocal('El descuento debe ser un número entre 0 y 100.')
      return
    }

    setErrorLocal(null)

    const payload: ClientePayload = {
      nombre,
      telefono1: opcional(form.telefono1),
      telefono2: opcional(form.telefono2),
      correo: opcional(form.correo)?.toLowerCase() ?? null,
      direccion: opcional(form.direccion),
      nombre_asistente: opcional(form.nombreAsistente),
      categoria: form.categoria,
      descuento_mano_obra: Math.round(descuento * 100) / 100,
      permite_pagos_parciales: form.permitePagosParciales,
      confidencial: form.confidencial,
      notas: opcional(form.notas),
      rfc: opcional(form.rfc)?.toUpperCase() ?? null,
      razon_social: opcional(form.razonSocial),
      regimen_fiscal: opcional(form.regimenFiscal),
      codigo_postal: opcional(form.codigoPostal),
    }

    if (modo === 'editar') {
      payload.activo = form.activo
    }

    void onGuardar(payload)
  }

  const mensajeError = errorLocal ?? error

  return (
    <form onSubmit={enviar} className="space-y-5">
      <fieldset disabled={guardando} className="space-y-5">
        <Seccion
          titulo="Datos de contacto"
          descripcion="Información para localizar al cliente y coordinar la entrega del vehículo."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <CampoTexto
                id="cliente-nombre"
                etiqueta="Nombre completo *"
                value={form.nombre}
                onChange={(evento) => cambiar('nombre', evento.target.value)}
                placeholder="Ej. Rodrigo Salgado"
                maxLength={150}
                autoComplete="name"
                required
              />
            </div>

            <CampoTexto
              id="cliente-telefono1"
              etiqueta="Teléfono principal"
              type="tel"
              value={form.telefono1}
              onChange={(evento) => cambiar('telefono1', evento.target.value)}
              placeholder="555-123-4567"
              maxLength={20}
              autoComplete="tel"
            />

            <CampoTexto
              id="cliente-telefono2"
              etiqueta="Teléfono alterno"
              type="tel"
              value={form.telefono2}
              onChange={(evento) => cambiar('telefono2', evento.target.value)}
              placeholder="Opcional"
              maxLength={20}
            />

            <CampoTexto
              id="cliente-correo"
              etiqueta="Correo"
              type="email"
              value={form.correo}
              onChange={(evento) => cambiar('correo', evento.target.value)}
              placeholder="cliente@correo.mx"
              maxLength={150}
              autoComplete="email"
            />

            <CampoTexto
              id="cliente-asistente"
              etiqueta="Asistente o chofer"
              value={form.nombreAsistente}
              onChange={(evento) =>
                cambiar('nombreAsistente', evento.target.value)
              }
              placeholder="Quién recibe o entrega el auto"
              maxLength={150}
            />

            <div className="sm:col-span-2">
              <CampoTexto
                id="cliente-direccion"
                etiqueta="Dirección"
                value={form.direccion}
                onChange={(evento) => cambiar('direccion', evento.target.value)}
                placeholder="Calle, número, colonia, ciudad"
                maxLength={255}
                autoComplete="street-address"
              />
            </div>
          </div>
        </Seccion>

        <Seccion
          titulo="Clasificación y pagos"
          descripcion="La categoría VIP aplica descuento únicamente sobre mano de obra (CLI-03)."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoSelect
              id="cliente-categoria"
              etiqueta="Categoría"
              value={form.categoria}
              onChange={(evento) =>
                cambiarCategoria(evento.target.value as CategoriaCliente)
              }
            >
              <option value="Regular">Regular</option>
              <option value="VIP">VIP</option>
            </CampoSelect>

            <CampoTexto
              id="cliente-descuento"
              etiqueta="Descuento mano de obra (%)"
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={form.descuento}
              onChange={(evento) => cambiar('descuento', evento.target.value)}
              placeholder="0"
            />

            <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
              <CampoCheckbox
                id="cliente-pagos-parciales"
                etiqueta="Permite pagos parciales"
                descripcion="Autoriza anticipos y parcialidades (PAG-04)."
                checked={form.permitePagosParciales}
                onChange={(evento) =>
                  cambiar('permitePagosParciales', evento.target.checked)
                }
              />

              <CampoCheckbox
                id="cliente-confidencial"
                etiqueta="Cliente confidencial"
                descripcion="El rol Mecánico solo verá placas y el trabajo asignado (SEG-17)."
                checked={form.confidencial}
                onChange={(evento) =>
                  cambiar('confidencial', evento.target.checked)
                }
              />
            </div>

            {modo === 'editar' && (
              <div className="sm:col-span-2">
                <CampoCheckbox
                  id="cliente-activo"
                  etiqueta="Cliente activo"
                  descripcion="Desactívalo para dar de baja lógica sin borrar el historial (SEG-07)."
                  checked={form.activo}
                  onChange={(evento) =>
                    cambiar('activo', evento.target.checked)
                  }
                />
              </div>
            )}
          </div>
        </Seccion>

        <Seccion
          titulo="Datos fiscales"
          descripcion="Opcionales. Se usan para facturación CFDI 4.0 (FAC-05)."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoTexto
              id="cliente-rfc"
              etiqueta="RFC"
              value={form.rfc}
              onChange={(evento) => cambiar('rfc', evento.target.value)}
              placeholder="XAXX010101000"
              maxLength={13}
              pattern="[A-Za-zÑñ&]{3,4}[0-9]{6}[A-Za-z0-9]{3}"
              title="RFC de 12 o 13 caracteres con formato mexicano"
              className="uppercase"
            />

            <CampoTexto
              id="cliente-codigo-postal"
              etiqueta="Código postal"
              inputMode="numeric"
              value={form.codigoPostal}
              onChange={(evento) =>
                cambiar('codigoPostal', evento.target.value)
              }
              placeholder="11560"
              maxLength={5}
              pattern="[0-9]{5}"
              title="El código postal debe tener 5 dígitos"
            />

            <div className="sm:col-span-2">
              <CampoTexto
                id="cliente-razon-social"
                etiqueta="Razón social"
                value={form.razonSocial}
                onChange={(evento) =>
                  cambiar('razonSocial', evento.target.value)
                }
                placeholder="Nombre fiscal de la empresa"
                maxLength={200}
              />
            </div>

            <div className="sm:col-span-2">
              <CampoTexto
                id="cliente-regimen-fiscal"
                etiqueta="Régimen fiscal"
                value={form.regimenFiscal}
                onChange={(evento) =>
                  cambiar('regimenFiscal', evento.target.value)
                }
                placeholder="Ej. 612 Personas físicas con actividad empresarial"
                maxLength={100}
              />
            </div>
          </div>
        </Seccion>

        <Seccion
          titulo="Notas internas"
          descripcion="Solo visibles para Administrador y Recepción."
        >
          <CampoAreaTexto
            id="cliente-notas"
            etiqueta="Notas de atención"
            rows={4}
            value={form.notas}
            onChange={(evento) => cambiar('notas', evento.target.value)}
            placeholder="Preferencias, acuerdos especiales, historial relevante…"
          />
        </Seccion>
      </fieldset>

      {mensajeError && (
        <p
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {mensajeError}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-faint">
          Los campos con * son obligatorios. El backend valida RFC, correo y
          código postal.
        </p>
        <div className="flex gap-3">
          <Boton
            variante="secundario"
            onClick={onCancelar}
            disabled={guardando}
          >
            Cancelar
          </Boton>
          <Boton type="submit" disabled={guardando} aria-busy={guardando}>
            {guardando
              ? 'Guardando…'
              : modo === 'crear'
                ? 'Crear cliente'
                : 'Guardar cambios'}
          </Boton>
        </div>
      </div>
    </form>
  )
}
