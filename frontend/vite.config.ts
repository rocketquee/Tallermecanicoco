import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // El proxy SOLO aplica a `npm run dev`. En produccion (Railway) el frontend
  // llama directamente a VITE_API_URL y no depende de este bloque.
  server: {
    proxy: {
      // Todo lo que empiece con /api se manda al backend FastAPI local.
      // El backend ya expone sus rutas bajo /api/v1, asi que no se reescribe.
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
