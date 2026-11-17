import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // La carga inicial de datos se hace con useEffect + servicios Axios.
      // Sin una libreria de data fetching, el estado de carga se activa dentro
      // del efecto; la regla del compilador es demasiado estricta para eso.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
