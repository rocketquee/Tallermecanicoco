# CONTEXTO TÉCNICO COMPLETO DEL PROYECTO AUTOPULSE ELITE

## Tipo de aplicación
Sitio web (aplicación web), NO app de escritorio. Accesible desde navegador.
- Mecánicos: tablet dentro del taller (interfaz con botones grandes).
- Recepción: computadora de escritorio.
- Administrador: computadora y celular (consulta y autorizaciones).

## Stack tecnológico definitivo

### Base de Datos (fase actual)
- **Motor:** MySQL 8.x (InnoDB, utf8mb4).
- **Cliente visual para desarrollo:** MySQL Workbench (ejecutar SQL, ver tablas, 
  revisar relaciones gráficamente).
- **Cliente visual alternativo:** DBeaver (gratuito, multiplataforma).
- **Gestor visual con IA (opcional):** OpenNavicat (para diseñar diagramas E-R 
  con asistencia de IA y explorar el esquema).
- **Convenciones SQL:** 
  - Nombres de tablas y columnas en español, en snake_case (ej: `ordenes_servicio`, 
    `fecha_apertura`).
  - Dinero: `DECIMAL(12,2)`. 
  - Estados: `ENUM`. 
  - Fechas: `DATETIME`.
  - Llaves foráneas con `ON UPDATE CASCADE` y `ON DELETE RESTRICT` (borrado lógico, 
    nada se elimina físicamente).
  - Motor InnoDB obligatorio para soportar transacciones y FKs.

### Backend (fase futura, ya decidido)
- **Lenguaje:** Python 3.10+.
- **Framework:** FastAPI (moderno, rápido, ideal para APIs REST y futura integración 
  con IA).
- **ORM:** SQLAlchemy 2.x.
- **Validación:** Pydantic v2.
- **Autenticación:** JWT con roles (Admin, Recepción, Mecánico).
- **Servidor:** Uvicorn.
- **Migraciones:** Alembic (para versionar cambios al esquema).

### Frontend (fase futura, ya decidido)
- **Lenguaje:** TypeScript.
- **Framework:** React 18+.
- **Build tool:** Vite.
- **Estilos:** Tailwind CSS (para interfaces limpias y responsivas).
- **Componentes:** shadcn/ui (tablas, modales, formularios accesibles).
- **Estado:** React Query (TanStack Query) para datos del servidor.
- **Formularios:** React Hook Form + Zod.
- **Gráficos (reportes):** Recharts.
- **PWA:** Sí, para que el administrador pueda "instalar" el sitio en su celular 
  como si fuera app, sin desarrollar una app nativa.

### Almacenamiento de archivos (fotos de vehículos)
- Las fotos NO se guardan en la base de datos (requisito VEH-08).
- Se almacenan en un servidor de archivos aparte (filesystem local en desarrollo, 
  S3-compatible en producción como MinIO o Cloudflare R2).
- La base de datos solo guarda la ruta/URL y metadatos (fecha, clasificación: 
  ingreso/proceso/entrega, firma de conformidad).
- Límite: hasta 30 fotos por auto, máximo 10 MB cada una.

### Herramientas de desarrollo
- **Editor/IDE con IA:** OpenCode (asistente de código en terminal).
- **Control de versiones:** Git + GitHub.
- **Documentación:** Markdown (README.md, docs/).
- **Diagramas:** Mermaid (para ERD en Markdown, compatible con GitHub) y 
  OpenNavicat para diagramas visuales interactivos.
- **Pruebas de API (fase futura):** Postman o Thunder Client (extensión de VS Code).

### Despliegue (fase futura, aún no implementado)
- **Backend:** Railway o Render (soporte para Python/FastAPI y MySQL).
- **Frontend:** Vercel o Netlify.
- **Base de datos en producción:** Aiven (MySQL gratuito permanente, 1 GB) o 
  PlanetScale (MySQL compatible, plan gratuito).
- **Almacenamiento de fotos:** Cloudflare R2 o MinIO.
- **CI/CD:** GitHub Actions (lint, tests, deploy automático).

## Estructura de carpetas del repositorio

AutoPulse-Elite/
├── AGENTS.md                  # Reglas del proyecto para OpenCode
├── README.md                  # Este archivo
├── .gitignore
├── docs/
│   ├── indice.md              # Índice de documentación
│   ├── requisitos.md          # Requisitos originales
│   ├── requisitos-actualizados.md
│   ├── erd.md                 # Diagrama E-R en Mermaid (fase futura)
│   └── decisiones-tecnicas.md # ADRs (Architecture Decision Records)
├── sql/
│   ├── 01_catalogos.sql       # clientes, mecanicos, proveedores, servicios
│   ├── 02_vehiculos.sql       # vehiculos, polizas_seguro
│   ├── 03_inventario.sql      # refacciones, compras, detalle_compra
│   ├── 04_ordenes.sql         # ordenes_servicio, detalle_orden
│   ├── 05_finanzas.sql        # pagos, facturas, autorizaciones
│   ├── 06_seguridad.sql       # usuarios, roles, bitacora
│   └── 07_datos_prueba.sql    # seeds para desarrollo
├── backend/                   # (fase futura) Python + FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routers/
│   │   ├── services/
│   │   └── core/              # config, seguridad, DB session
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
└── frontend/                  # (fase futura) React + TypeScript
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── hooks/
    │   ├── services/          # llamadas a la API
    │   ├── types/
    │   └── App.tsx
    ├── public/
    ├── package.json
    ├── vite.config.ts
    └── tailwind.config.js

## Decisiones técnicas clave (para incluir en el README)

1. **¿Por qué sitio web y no app de escritorio?**
   Porque el administrador necesita revisar desde su celular, el mecánico desde 
   una tablet y recepción desde computadora, sin instalar nada. Un solo código 
   para todos. Con PWA, el admin puede "instalarlo" en su celular.

2. **¿Por qué MySQL y no PostgreSQL?**
   MySQL es más ligero para desarrollo local, tiene excelente soporte en todos 
   los proveedores gratuitos (Aiven, PlanetScale) y es el estándar en la mayoría 
   de tutoriales y documentación. Para el volumen del taller (5 usuarios, 8 autos/
   semana) es más que suficiente.

3. **¿Por qué Python/FastAPI y no Node.js o Java?**
   Python es el lenguaje más rápido para prototipar lógica de negocio compleja 
   (cálculo de IVA, autorizaciones, márgenes con tipo de cambio). FastAPI genera 
   documentación OpenAPI automática, lo que facilita la integración con React.

4. **¿Por qué React y no Vue o Angular?**
   React es el estándar de la industria, con mayor ecosistema de componentes 
   (shadcn/ui) y mejor soporte para PWA. TypeScript evita errores al conectar 
   con la API.

5. **¿Por qué las fotos van fuera de la base de datos?**
   Porque 30 fotos × 10 MB × 8 autos/semana = ~2.4 GB/semana. Meter eso en MySQL 
   haría la base de datos lentísima y los respaldos enormes. Se guardan en 
   almacenamiento de objetos y la BD solo guarda la URL.

6. **¿Por qué OpenNavicat y no solo MySQL Workbench?**
   OpenNavicat añade asistencia de IA para diseñar el E-R y generar consultas 
   en lenguaje natural. MySQL Workbench sigue siendo el cliente principal para 
   ejecutar SQL, pero OpenNavicat complementa la fase de diseño visual.