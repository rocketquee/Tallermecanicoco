/** Estilos compartidos del boton, separados para no romper Fast Refresh. */

export type VarianteBoton = 'primario' | 'secundario' | 'fantasma' | 'peligro'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-panel px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60'

const VARIANTES: Record<VarianteBoton, string> = {
  primario:
    'bg-foreground text-surface hover:bg-white focus-visible:ring-line-strong',
  secundario:
    'border border-line bg-white/[0.02] text-muted hover:border-line-strong hover:text-foreground focus-visible:ring-line-strong',
  fantasma:
    'text-muted hover:bg-white/[0.05] hover:text-foreground focus-visible:ring-line-strong',
  peligro:
    'border border-negative/40 bg-negative/10 text-negative hover:bg-negative/15 focus-visible:ring-negative',
}

/** Clases del boton, utiles cuando se necesita aplicar el estilo a un Link. */
export function clasesBoton(
  variante: VarianteBoton = 'primario',
  className = '',
): string {
  return `${BASE} ${VARIANTES[variante]} ${className}`.trim()
}
