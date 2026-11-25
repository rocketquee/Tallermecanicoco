# Frontend — Apex Elite Motorsport

Aplicación web del taller **Apex Elite Motorsport**, construida con
React 19, TypeScript, Vite y Tailwind CSS 4.

La instalación completa (base de datos, API y frontend) y los usuarios de
prueba están documentados en el [README principal](../README.md).

## Comandos

```powershell
npm install      # instalar dependencias
npm run dev      # servidor de desarrollo en http://localhost:5173
npm run build    # tsc -b + vite build
npm run lint     # ESLint
npm run preview  # servir dist/ localmente
```

El backend debe estar corriendo en `http://127.0.0.1:8000`: Vite redirige
las peticiones `/api` hacia ese puerto (ver `vite.config.ts`).

## Organización de `src/`

| Carpeta | Contenido |
|---|---|
| `components/layout/` | Layout, barra lateral y guardas de ruta |
| `components/ui/` | Botón, panel, encabezado, badges y estilos compartidos |
| `components/formularios/` | Campos de texto, select, checkbox y área de texto |
| `components/clientes/` | Componentes del expediente del cliente |
| `components/login/` | Pantalla y formulario de acceso |
| `components/dashboard/` | Encabezado del panel principal |
| `pages/` | Una subcarpeta por módulo (clientes, vehículos, órdenes…) |
| `services/` | Llamadas a la API con Axios |
| `types/` | Tipos TypeScript compartidos |
| `lib/` | Formato, roles y reglas del taller |
| `context/` | Sesión y autenticación |
