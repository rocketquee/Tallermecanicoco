import axios from 'axios'
import { LoaderCircle, Mail } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { obtenerFechaBloqueo, guardarIntentoFallido, limpiarIntentos } from '../../lib/intentos-login'
import { PasswordInput } from './PasswordInput'

interface ErroresFormulario {
  correo?: string
  password?: string
}

interface EstadoRuta {
  from?: string
}

function esCorreoValido(correo: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
}

function formatoTiempo(milisegundos: number): string {
  const segundos = Math.max(0, Math.ceil(milisegundos / 1000))
  const minutos = Math.floor(segundos / 60)
  return `${String(minutos).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`
}

export function LoginForm() {
  const { login } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const correoRef = useRef<HTMLInputElement>(null)
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [mantenerSesion, setMantenerSesion] = useState(false)
  const [errores, setErrores] = useState<ErroresFormulario>({})
  const [errorAcceso, setErrorAcceso] = useState('')
  const [cargando, setCargando] = useState(false)
  const [bloqueadoHasta, setBloqueadoHasta] = useState(obtenerFechaBloqueo)
  const [ahora, setAhora] = useState(0)
  const bloqueado = bloqueadoHasta > ahora

  useEffect(() => {
    correoRef.current?.focus()
    setAhora(Date.now())
  }, [])

  useEffect(() => {
    if (!bloqueado) {
      return
    }

    const intervalo = window.setInterval(() => setAhora(Date.now()), 1000)
    return () => window.clearInterval(intervalo)
  }, [bloqueado])

  useEffect(() => {
    if (bloqueadoHasta && !bloqueado) {
      limpiarIntentos()
      setBloqueadoHasta(0)
    }
  }, [bloqueado, bloqueadoHasta])

  function validar(): boolean {
    const nuevosErrores: ErroresFormulario = {}
    if (!esCorreoValido(correo.trim())) {
      nuevosErrores.correo = 'Ingresa un correo electrónico válido.'
    }
    if (!password) {
      nuevosErrores.password = 'La contraseña es obligatoria.'
    }
    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErrorAcceso('')

    if (bloqueado) {
      setErrorAcceso(
        'Demasiados intentos. Intenta de nuevo en 15 minutos.',
      )
      return
    }
    if (!validar()) {
      return
    }

    setCargando(true)
    try {
      await login(correo.trim().toLowerCase(), password, mantenerSesion)
      limpiarIntentos()
      const destino =
        (ubicacion.state as EstadoRuta | null)?.from ?? '/dashboard'
      navegar(destino, { replace: true })
    } catch (fallo) {
      if (
        axios.isAxiosError(fallo) &&
        (fallo.response?.status === 401 || fallo.response?.status === 403)
      ) {
        const estadoIntentos = guardarIntentoFallido()
        if (estadoIntentos.bloqueadoHasta) {
          setBloqueadoHasta(estadoIntentos.bloqueadoHasta)
          setAhora(Date.now())
          setErrorAcceso(
            'Demasiados intentos. Intenta de nuevo en 15 minutos.',
          )
        } else {
          setErrorAcceso('Correo o contraseña incorrectos.')
        }
      } else {
        setErrorAcceso(
          'No fue posible iniciar sesión. Intenta de nuevo o contacta al administrador.',
        )
      }
    } finally {
      setCargando(false)
    }
  }

  function cambiarCorreo(valor: string) {
    setCorreo(valor)
    setErrores((actuales) => ({ ...actuales, correo: undefined }))
    setErrorAcceso('')
  }

  function cambiarPassword(valor: string) {
    setPassword(valor)
    setErrores((actuales) => ({ ...actuales, password: undefined }))
    setErrorAcceso('')
  }

  return (
    <form className="space-y-5" noValidate onSubmit={enviar}>
      <div>
        <label
          htmlFor="correo"
          className="mb-2 block text-[12px] font-medium text-muted"
        >
          Correo electrónico
        </label>
        <div
          className={`flex min-h-[52px] items-center rounded-panel border bg-[#111111] transition focus-within:border-[#555555] ${
            errores.correo ? 'border-negative/50' : 'border-[#333333]'
          }`}
        >
          <Mail
            aria-hidden="true"
            className="ml-3.5 h-4 w-4 shrink-0 text-faint"
            strokeWidth={1.7}
          />
          <input
            ref={correoRef}
            id="correo"
            name="correo"
            type="email"
            value={correo}
            onChange={(event) => cambiarCorreo(event.target.value)}
            autoComplete="username"
            placeholder="nombre@pizarroperformance.mx"
            disabled={cargando || bloqueado}
            aria-label="Correo electrónico"
            aria-invalid={Boolean(errores.correo)}
            aria-describedby={errores.correo ? 'correo-error' : undefined}
            className="h-[52px] min-w-0 flex-1 bg-transparent px-3 text-[13px] text-foreground outline-none placeholder:text-faint disabled:opacity-60"
          />
        </div>
        {errores.correo ? (
          <p id="correo-error" className="mt-1.5 text-[11px] text-negative">
            {errores.correo}
          </p>
        ) : null}
      </div>

      <PasswordInput
        value={password}
        onChange={cambiarPassword}
        error={errores.password}
        disabled={cargando || bloqueado}
      />

      <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[12px] text-muted">
        <input
          type="checkbox"
          checked={mantenerSesion}
          onChange={(event) => setMantenerSesion(event.target.checked)}
          disabled={cargando || bloqueado}
          className="h-4 w-4 shrink-0 accent-white"
        />
        Mantener sesión iniciada en este equipo
      </label>

      {errorAcceso ? (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-panel border border-negative/25 bg-negative/10 px-3.5 py-3 text-[12px] text-negative"
        >
          <p>{errorAcceso}</p>
          {bloqueado ? (
            <p className="mt-1 text-[11px]">
              Tiempo restante: {formatoTiempo(bloqueadoHasta - ahora)}
            </p>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={cargando || bloqueado}
        aria-busy={cargando}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-panel bg-foreground px-4 text-[14px] font-semibold text-surface transition hover:bg-white active:bg-white/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong disabled:cursor-not-allowed disabled:opacity-55"
      >
        {cargando ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            Validando acceso…
          </>
        ) : (
          'Entrar'
        )}
      </button>

      <p className="min-h-11 text-center">
        <button
          type="button"
          onClick={() =>
            setErrorAcceso(
              'Pide a tu administrador que restablezca tu contraseña.',
            )
          }
          className="min-h-11 px-2 text-[11px] text-muted underline decoration-white/20 underline-offset-4 transition hover:text-foreground"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </p>
    </form>
  )
}
