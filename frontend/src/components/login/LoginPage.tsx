import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { BrandPanel, MobileBrand } from './BrandPanel'
import { LoginForm } from './LoginForm'

export function LoginPage() {
  const { isAuthenticated, isLoading, sessionError } = useAuth()

  if (isLoading) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-surface text-[12px] text-muted">
        Verificando sesión…
      </main>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <main className="min-h-svh bg-surface p-0 text-foreground lg:h-svh lg:min-h-0 lg:p-4">
      <div className="grid min-h-svh lg:h-full lg:min-h-0 lg:grid-cols-[55%_45%]">
        <BrandPanel />

        <section className="flex min-w-0 items-center justify-center px-5 py-10 sm:px-8 lg:px-10">
          <div className="w-full max-w-[380px]">
            <MobileBrand />
            <header className="mb-7">
              <h2 className="text-[23px] leading-tight font-semibold tracking-tight text-foreground">
                Iniciar sesión
              </h2>
              <p className="mt-2 text-[13px] text-muted">
                Ingresa con tu cuenta del taller.
              </p>
            </header>

            {sessionError ? (
              <p
                role="alert"
                className="mb-4 rounded-panel border border-negative/25 bg-negative/10 px-3.5 py-3 text-[12px] text-negative"
              >
                {sessionError}
              </p>
            ) : null}
            <LoginForm />

            <p className="mt-6 text-center text-[10px] leading-4 text-faint">
              Acceso restringido a personal autorizado. Toda la actividad queda
              registrada.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
