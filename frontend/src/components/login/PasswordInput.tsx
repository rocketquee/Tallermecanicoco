import { Eye, EyeOff, Lock } from 'lucide-react'
import { useState } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

export function PasswordInput({ value, onChange, error, disabled }: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label
        htmlFor="password"
        className="mb-2 block text-[12px] font-medium text-muted"
      >
        Contraseña
      </label>
      <div
        className={`flex min-h-[52px] items-center rounded-panel border bg-[#111111] transition focus-within:border-[#555555] ${
          error ? 'border-negative/50' : 'border-[#333333]'
        }`}
      >
        <Lock
          aria-hidden="true"
          className="ml-3.5 h-4 w-4 shrink-0 text-faint"
          strokeWidth={1.7}
        />
        <input
          id="password"
          name="password"
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="current-password"
          disabled={disabled}
          aria-label="Contraseña"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'password-error' : undefined}
          className="h-[52px] min-w-0 flex-1 bg-transparent px-3 text-[13px] text-foreground outline-none placeholder:text-faint disabled:opacity-60"
        />
        <button
          type="button"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          disabled={disabled}
          onClick={() => setVisible((actual) => !actual)}
          className="mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-panel text-faint transition hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-line-strong disabled:opacity-50"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" strokeWidth={1.7} />
          ) : (
            <Eye className="h-4 w-4" strokeWidth={1.7} />
          )}
        </button>
      </div>
      {error ? (
        <p id="password-error" className="mt-1.5 text-[11px] text-negative">
          {error}
        </p>
      ) : null}
    </div>
  )
}
