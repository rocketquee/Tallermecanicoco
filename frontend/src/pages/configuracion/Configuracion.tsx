import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { KeyRound, RefreshCw, ShieldCheck, X } from 'lucide-react'
import { Boton } from '../../components/ui/Boton'
import { CampoTexto } from '../../components/formularios/CampoTexto'
import { clasesBoton } from '../../components/ui/estilosBoton'
import { EncabezadoPagina } from '../../components/ui/EncabezadoPagina'
import { EstadoTabla } from '../../components/ui/EstadoTabla'
import { Panel, PanelCabecera } from '../../components/ui/Panel'
import { useAuth } from '../../context/useAuth'
import { etiquetaRol } from '../../lib/roles'
import { mensajeDeError } from '../../services/errores'
import { listarUsuarios, restablecerPassword } from '../../services/usuarios'
import type { RolUsuario } from '../../types/auth'
import type { UsuarioSistema } from '../../types/usuarios'

const ESTILO_ROL: Record<RolUsuario, string> = {
  Administrador:
    'border-line-strong bg-white/[0.07] text-foreground',
  Recepcion: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  Mecanico: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
}

function EtiquetaRol({ rol }: { rol: RolUsuario }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${ESTILO_ROL[rol]}`}
    >
      {etiquetaRol(rol)}
    </span>
  )
}

function EtiquetaActivo({ activo }: { activo: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${
        activo
          ? 'border-positive/30 bg-positive/10 text-positive'
          : 'border-line bg-white/[0.03] text-faint'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          activo ? 'bg-positive' : 'bg-faint'
        }`}
      />
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .map((parte) => parte[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Configuracion() {
  const { usuario } = useAuth()
  const esAdministrador = usuario?.rol === 'Administrador'

  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recarga, setRecarga] = useState(0)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const [seleccionado, setSeleccionado] = useState<UsuarioSistema | null>(null)
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorModal, setErrorModal] = useState<string | null>(null)

  useEffect(() => {
    if (!esAdministrador) {
      return
    }

    let vigente = true
    setCargando(true)
    setError(null)

    listarUsuarios()
      .then((datos) => {
        if (vigente) {
          setUsuarios(datos)
        }
      })
      .catch((fallo: unknown) => {
        if (!vigente) {
          return
        }
        setUsuarios([])
        setError(
          mensajeDeError(fallo, 'No se pudieron cargar los usuarios.'),
        )
      })
      .finally(() => {
        if (vigente) {
          setCargando(false)
        }
      })

    return () => {
      vigente = false
    }
  }, [esAdministrador, recarga])

  if (!esAdministrador) {
    return <Navigate to="/dashboard" replace />
  }

  function abrirModal(usuarioSeleccionado: UsuarioSistema) {
    setSeleccionado(usuarioSeleccionado)
    setPassword('')
    setConfirmar('')
    setErrorModal(null)
  }

  function cerrarModal() {
    setSeleccionado(null)
    setPassword('')
    setConfirmar('')
    setErrorModal(null)
    setGuardando(false)
  }

  async function guardarPassword(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!seleccionado) {
      return
    }
    if (password.length < 8) {
      setErrorModal('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirmar) {
      setErrorModal('Las contraseñas no coinciden.')
      return
    }

    setGuardando(true)
    setErrorModal(null)
    try {
      await restablecerPassword(seleccionado.id, password)
      setMensaje(
        `Contraseña de ${seleccionado.nombre} actualizada correctamente.`,
      )
      cerrarModal()
    } catch (fallo) {
      setErrorModal(
        mensajeDeError(fallo, 'No se pudo restablecer la contraseña.'),
      )
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <EncabezadoPagina
        etiqueta="Seguridad del sistema"
        titulo="Configuración"
        descripcion="Administra las cuentas del taller y restablece contraseñas cuando sea necesario."
        acciones={
          <Boton
            variante="secundario"
            onClick={() => setRecarga((valor) => valor + 1)}
            disabled={cargando}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </Boton>
        }
      />

      <div className="flex gap-3 rounded-panel border border-line bg-white/[0.02] px-4 py-3.5 text-[12px] leading-6 text-muted">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
        <p>
          <strong className="font-semibold text-foreground">
            Acceso exclusivo del Administrador.
          </strong>{' '}
          El resto de los roles no puede ver ni modificar las cuentas del
          sistema.
        </p>
      </div>

      {mensaje && (
        <div
          role="status"
          className="flex items-start justify-between gap-4 rounded-panel border border-positive/30 bg-positive/10 px-4 py-3.5 text-[12px] leading-5 text-foreground"
        >
          <p>{mensaje}</p>
          <button
            type="button"
            onClick={() => setMensaje(null)}
            aria-label="Cerrar aviso"
            className="rounded-md px-1.5 text-lg leading-none text-positive/70 transition hover:text-positive"
          >
            ×
          </button>
        </div>
      )}

      <Panel>
        <PanelCabecera
          titulo="Usuarios del sistema"
          descripcion="Cuentas con acceso al panel y su rol asignado."
          extra={
            <span className="self-start rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-muted tabular-nums sm:self-auto">
              {cargando ? 'Cargando…' : `${usuarios.length} usuarios`}
            </span>
          }
        />

        <EstadoTabla
          cargando={cargando}
          error={error}
          vacio={usuarios.length === 0}
          tituloVacio="Sin usuarios registrados"
          detalleVacio="No hay cuentas para mostrar en este momento."
          onReintentar={() => setRecarga((valor) => valor + 1)}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead className="bg-white/[0.02] text-[10px] tracking-[0.14em] text-faint uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium sm:px-5">
                    Usuario
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Correo
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Rol
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Estado
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right font-medium sm:px-5"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {usuarios.map((usuarioSistema) => (
                  <tr
                    key={usuarioSistema.id}
                    className="transition hover:bg-white/[0.025]"
                  >
                    <td className="px-4 py-4 sm:px-5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-white/[0.04] text-[10px] font-semibold text-foreground">
                          {iniciales(usuarioSistema.nombre)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {usuarioSistema.nombre}
                          </p>
                          {usuarioSistema.id === usuario?.id && (
                            <p className="text-[10px] text-faint">Tu cuenta</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-muted">
                      {usuarioSistema.correo}
                    </td>

                    <td className="px-4 py-4">
                      <EtiquetaRol rol={usuarioSistema.rol} />
                    </td>

                    <td className="px-4 py-4">
                      <EtiquetaActivo activo={usuarioSistema.activo} />
                    </td>

                    <td className="px-4 py-4 text-right sm:px-5">
                      <Boton
                        variante="secundario"
                        className="px-3 py-1.5 text-[11px]"
                        onClick={() => abrirModal(usuarioSistema)}
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        Restablecer contraseña
                      </Boton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </EstadoTabla>

        {!cargando && !error && usuarios.length > 0 && (
          <p className="border-t border-line px-4 py-3 text-[11px] text-faint sm:px-5">
            Las contraseñas nuevas se guardan cifradas con scrypt y no se
            muestran después de guardarlas.
          </p>
        )}
      </Panel>

      {seleccionado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-restablecer-password"
        >
          <div className="w-full max-w-md rounded-panel border border-line bg-panel shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-medium tracking-[0.14em] text-faint uppercase">
                  Seguridad de la cuenta
                </p>
                <h2
                  id="titulo-restablecer-password"
                  className="mt-1 text-[15px] font-semibold tracking-tight text-foreground"
                >
                  Restablecer contraseña
                </h2>
                <p className="mt-0.5 truncate text-[11px] text-faint">
                  {seleccionado.nombre} · {seleccionado.correo}
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarModal}
                aria-label="Cerrar"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-panel text-faint transition hover:bg-white/[0.04] hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="space-y-4 px-5 py-5" onSubmit={guardarPassword}>
              {errorModal && (
                <div
                  role="alert"
                  className="rounded-panel border border-negative/30 bg-negative/10 px-3.5 py-3 text-[12px] text-negative"
                >
                  {errorModal}
                </div>
              )}

              <CampoTexto
                id="nueva-password"
                etiqueta="Nueva contraseña"
                type="password"
                value={password}
                onChange={(evento) => setPassword(evento.target.value)}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                placeholder="Mínimo 8 caracteres"
                disabled={guardando}
              />

              <CampoTexto
                id="confirmar-password"
                etiqueta="Confirmar contraseña"
                type="password"
                value={confirmar}
                onChange={(evento) => setConfirmar(evento.target.value)}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                placeholder="Repite la contraseña"
                disabled={guardando}
              />

              <p className="text-[11px] leading-5 text-faint">
                La contraseña se guarda cifrada. El usuario deberá usarla en su
                próximo inicio de sesión.
              </p>

              <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando}
                  className={clasesBoton('secundario')}
                >
                  Cancelar
                </button>
                <Boton type="submit" disabled={guardando}>
                  {guardando ? 'Guardando…' : 'Guardar contraseña'}
                </Boton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
