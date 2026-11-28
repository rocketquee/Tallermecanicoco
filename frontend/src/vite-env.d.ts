/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origen del backend, por ejemplo https://mi-backend.up.railway.app */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
