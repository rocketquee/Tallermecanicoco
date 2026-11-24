# AutoPulse Elite

Sistema web de gestión para **Pizarro Performance Garage**, un taller especializado en autos de lujo. Concentra clientes VIP, vehículos, órdenes de servicio, inventario, usuarios y bitácora en un solo lugar, con permisos por rol y trazabilidad completa. La operación actual vive en libretas y Excel; este sistema la ordena y protege la discreción de clientes que son figuras públicas.

> **Estado:** núcleo operativo funcional de punta a punta. La base de datos MySQL 8.x (21 tablas), la API con FastAPI + JWT y el frontend con React + TypeScript están implementados para clientes, vehículos, órdenes, inventario, usuarios y proveedores/compras. Los módulos de pagos, facturación, autorizaciones y reportes se construirán en la siguiente fase. El detalle de lo que falta está en [`docs/pendientes.md`](docs/pendientes.md).

## Contenido

- [Stack tecnológico](#stack-tecnológico)
- [Funcionalidad disponible](#funcionalidad-disponible)
- [Pendientes del sistema](#pendientes-del-sistema)
- [Requisitos previos](#requisitos-previos)
- [Levantar el proyecto desde cero](#levantar-el-proyecto-desde-cero)
- [Usuarios de prueba](#usuarios-de-prueba)
- [Rutas del frontend y permisos](#rutas-del-frontend-y-permisos)
- [Endpoints de la API](#endpoints-de-la-api)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Solución de problemas](#solución-de-problemas)
- [Documentación](#documentación)
- [Equipo y licencia](#equipo-y-licencia)

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Base de datos | MySQL 8.x, InnoDB, `utf8mb4` |
| Backend | Python 3.10+ · FastAPI · SQLAlchemy 2.x · Pydantic v2 · Uvicorn |
| Autenticación | JWT (HS256) con roles: Administrador, Recepción y Mecánico |
| Frontend | React 19 · TypeScript · Vite · Tailwind CSS 4 |
| Gráficas | Recharts (disponible para reportes) |
| Documentación | Markdown y Mermaid |

Convenciones de base de datos: nombres en español y `snake_case`, dinero en `DECIMAL(12,2)`, estados con `ENUM`, fechas con `DATETIME` y llaves foráneas con `ON DELETE RESTRICT` para que nada se borre físicamente. Las tablas de bitácora son inmutables y están protegidas con triggers.

## Funcionalidad disponible

### Implementado

- **Autenticación y roles.** Login con correo y contraseña, token JWT y menú distinto por rol. El backend valida cada endpoint; el frontend además protege las rutas por rol.
- **Clientes.** Alta, edición, búsqueda, categoría VIP/Regular, clientes confidenciales, datos fiscales y condiciones comerciales. El rol Mecánico recibe los clientes confidenciales enmascarados.
- **Vehículos.** Alta, edición y consulta por placas, VIN, marca o modelo, con kilometraje de entrada y valor aproximado. El valor se oculta al rol Mecánico.
- **Órdenes de servicio.** Alta de orden en estado `Recibido`, tablero por bahías, detalle con conceptos y totales, avance de etapa desde el detalle y registro de avance del mecánico con mano de obra y consumo de refacciones. Los totales (piezas + mano de obra con descuento VIP + IVA) los calcula siempre el backend.
- **Inventario.** Catálogo con existencias, alerta de stock bajo, alta de refacciones, baja lógica, surtido con movimiento y asiento en bitácora.
- **Usuarios.** Listado y restablecimiento de contraseña, exclusivo del Administrador.
- **Proveedores y compras.** Directorio con país, contacto, moneda y días de entrega; alta y edición de proveedores; órdenes de compra con folio, estado, fecha estimada de llegada y totales en la moneda del proveedor y en MXN. Las compras nacen en `Borrador` y quedan auditadas.
- **Panel principal.** Indicadores reales: autos en taller, órdenes por etapa, listas para entrega, clientes, valor en custodia (solo Administrador), refacciones por reponer, pendientes y últimas órdenes.
- **Trazabilidad.** Bitácora de operaciones e historial de etapas por orden.

### Pendiente para siguientes fases

- Pagos, anticipos, saldos y autorizaciones por monto.
- Facturación CFDI 4.0 y timbrado con PAC.
- Recepción de compras que incremente el inventario automáticamente.
- Reportes exportables a Excel y PDF.
- Fotos del vehículo y pólizas de seguro.
- Seguridad a nivel de fila (SEG-19) y auditoría de lecturas confidenciales (SEG-20).

## Pendientes del sistema

El listado completo, con identificadores (PEN-01 a PEN-39), evidencia en el código, impacto,
prioridad y criterio de aceptación, vive en **[`docs/pendientes.md`](docs/pendientes.md)**.

Los cuatro módulos que hoy muestran “Próximamente” son:

| Ruta | Módulo | Qué falta |
|---|---|---|
| `/pagos` | Pagos | Anticipos, parcialidades y saldo |
| `/facturacion` | Facturación | CFDI 4.0 y timbrado |
| `/autorizaciones` | Autorizaciones | Aprobación por monto |
| `/reportes` | Reportes | Indicadores y exportación |

En los módulos ya construidos falta, entre lo más importante, **asignar o cambiar mecánico**,
**cancelar una orden con motivo**, la **administración de usuarios**, la **consulta de bitácora**
y las **pruebas automatizadas**.

## Requisitos previos

| Herramienta | Versión recomendada | Para qué |
|---|---|---|
| MySQL Server | 8.0 o superior | Base de datos |
| Python | 3.10 o superior | API |
| Node.js | 22 o superior | Frontend (Vite 8) |
| npm | 10 o superior | Dependencias del frontend |
| Git | cualquiera reciente | Clonar el repositorio |

En Windows, agrega `mysql`, `python` y `npm` al `PATH` para poder ejecutar los comandos desde la terminal.

## Levantar el proyecto desde cero

### 1. Clonar el repositorio

```bash
git clone https://github.com/<usuario>/AutoPulse-Elite.git
cd AutoPulse-Elite
```

### 2. Crear la base de datos

```bash
mysql -u root -p -e "CREATE DATABASE autopulse_elite CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 3. Ejecutar los scripts SQL en orden

Los scripts están en `sql/` y son idempotentes en el orden indicado. Se importan con `utf8mb4` para conservar los acentos.

**PowerShell (Windows).** El operador `<` no existe en PowerShell, así que se usa el comando `source` del cliente `mysql`:

```powershell
# Ejecutar desde la raíz del repositorio (E:\Tallermecanico)
mysql -u root -p --default-character-set=utf8mb4 autopulse_elite -e "source sql/01_catalogos.sql"
mysql -u root -p --default-character-set=utf8mb4 autopulse_elite -e "source sql/02_vehiculos.sql"
mysql -u root -p --default-character-set=utf8mb4 autopulse_elite -e "source sql/03_inventario.sql"
mysql -u root -p --default-character-set=utf8mb4 autopulse_elite -e "source sql/04_ordenes.sql"
mysql -u root -p --default-character-set=utf8mb4 autopulse_elite -e "source sql/05_finanzas.sql"
mysql -u root -p --default-character-set=utf8mb4 autopulse_elite -e "source sql/06_seguridad.sql"
mysql -u root -p --default-character-set=utf8mb4 autopulse_elite -e "source sql/09_avance_mecanico.sql"

# Datos de ejemplo (solo desarrollo)
mysql -u root -p --default-character-set=utf8mb4 autopulse_elite -e "source sql/07_datos_prueba.sql"
mysql -u root -p --default-character-set=utf8mb4 autopulse_elite -e "source sql/08_datos_prueba_extra.sql"
mysql -u root -p --default-character-set=utf8mb4 autopulse_elite -e "source sql/10_proveedores_demo.sql"

# Procedimiento y función almacenados
mysql -u root -p --default-character-set=utf8mb4 autopulse_elite -e "source sql/11_procedimientos_funciones.sql"
```

**CMD.** La redirección clásica también funciona (una línea por script):

```bat
mysql -u root -p --default-character-set=utf8mb4 autopulse_elite < sql\01_catalogos.sql
```

> Si el cliente `mysql` no está en el `PATH`, usa la ruta completa, por ejemplo
> `"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"`. Si el servicio no está corriendo,
> inícialo con `Get-Service *mysql*` y `Start-Service <nombre-del-servicio>`.

Verifica que se hayan creado las 21 tablas y las rutinas del bloque 11:

```bash
mysql -u root -p -e "USE autopulse_elite; SHOW TABLES;"
mysql -u root -p -e "USE autopulse_elite; SHOW PROCEDURE STATUS WHERE Db = 'autopulse_elite';"
mysql -u root -p -e "USE autopulse_elite; SHOW FUNCTION STATUS WHERE Db = 'autopulse_elite';"
mysql -u root -p -e "USE autopulse_elite; CALL sp_calcular_total_orden(4);"
mysql -u root -p -e "USE autopulse_elite; SELECT fn_valor_en_custodia();"
```

### 4. Configurar y arrancar el backend

```powershell
cd E:\Tallermecanico\backend

# Crear el entorno virtual (solo la primera vez)
python -m venv .venv

# Windows (PowerShell). Si la política de ejecución lo bloquea:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1

# Windows (CMD)
# .venv\Scripts\activate.bat

# Linux / macOS
# source .venv/bin/activate

# Instalar dependencias
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

# Crear el archivo de configuración
Copy-Item .env.example .env      # Windows (PowerShell)
# cp .env.example .env           # Linux / macOS
```

Edita `backend/.env` con tus datos reales:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=TU_CONTRASENA
DB_NAME=autopulse_elite
JWT_SECRET_KEY=una_clave_larga_y_aleatoria
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=480
```

Arranca la API (con el entorno virtual activo y desde `backend`):

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Comprueba que responde y que ve la base de datos:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/salud
```

- API: <http://127.0.0.1:8000/>
- Salud: <http://127.0.0.1:8000/api/v1/salud>
- Swagger: <http://127.0.0.1:8000/docs>

La respuesta de `/api/v1/salud` debe incluir `"estado": "ok"` y `"tablas": 21`.

### 5. Arrancar el frontend

En **otra terminal** (deja la API corriendo), desde la raíz del proyecto:

```powershell
cd E:\Tallermecanico\frontend
npm install
npm run dev
```

Abre <http://localhost:5173>. Vite redirige las peticiones `/api` a `http://127.0.0.1:8000`, así que el backend debe estar corriendo.

Para verificar que el frontend compila y pasa el linter:

```powershell
npm run build     # tsc -b + vite build
npm run lint      # ESLint
npm run preview   # sirve dist/ localmente (opcional)
```

> Requisitos del frontend: Node.js 22 o superior y npm 10 o superior. Si `npm run dev` muestra
> `ECONNREFUSED` o `502`, el backend no está escuchando en el puerto 8000.

## Usuarios de prueba

El script `sql/07_datos_prueba.sql` crea tres usuarios. Todos usan la misma contraseña:

**Contraseña:** `AutoPulse2026!`

| Correo | Nombre | Rol | Qué puede ver |
|---|---|---|---|
| `gabriel@pizarrogarage.mx` | Gabriel Pizarro | Administrador | Todo, incluidos importes y configuración |
| `ana.torres@pizarrogarage.mx` | Ana Torres | Recepción | Clientes, vehículos, órdenes e inventario; sin configuración |
| `luis.ramirez@pizarrogarage.mx` | Luis Ramírez | Mecánico | Solo sus órdenes, placas y trabajo; sin precios ni clientes confidenciales |

> En producción, cambia estas contraseñas desde **Configuración → Usuarios → Restablecer contraseña**.

## Rutas del frontend y permisos

| Ruta | Pantalla | Administrador | Recepción | Mecánico |
|---|---|:---:|:---:|:---:|
| `/login` | Inicio de sesión | ✓ | ✓ | ✓ |
| `/dashboard` | Panel principal | ✓ | ✓ | ✓ |
| `/clientes` | Directorio de clientes | ✓ | ✓ | ✓ |
| `/clientes/nuevo` | Alta de cliente | ✓ | ✓ | — |
| `/clientes/:id` | Expediente del cliente | ✓ | ✓ | ✓ |
| `/vehiculos` | Vehículos | ✓ | ✓ | ✓ |
| `/vehiculos/nuevo` | Alta de vehículo | ✓ | ✓ | — |
| `/ordenes` | Órdenes / tablero de bahías | ✓ | ✓ | ✓ |
| `/ordenes/nuevo` | Nueva orden | ✓ | ✓ | — |
| `/ordenes/:id` | Detalle de la orden | ✓ | ✓ | ✓ |
| `/inventario` | Inventario | ✓ | ✓ | — |
| `/proveedores` | Proveedores y compras | ✓ | ✓ | — |
| `/configuracion` | Usuarios y contraseñas | ✓ | — | — |
| `/autorizaciones` | Próximamente | ✓ | ✓ | — |
| `/pagos`, `/facturacion`, `/reportes` | Próximamente | ✓ | — | — |

Las rutas inexistentes muestran una pantalla **404** en lugar de redirigir en silencio. Las rutas sin permiso redirigen al panel principal; el backend vuelve a validar el rol en cada petición.

## Endpoints de la API

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/v1/login` | Login con JSON `{correo, password}` |
| `POST` | `/api/v1/login/token` | Login OAuth2 para el botón *Authorize* de Swagger |
| `GET` | `/api/v1/login/me` | Usuario de la sesión actual |
| `GET` | `/api/v1/salud` | Estado de la API y de MySQL |
| `GET` | `/api/v1/dashboard/valor-custodia` | Valor en custodia calculado por `fn_valor_en_custodia()` (Administrador) |
| `GET/POST` | `/api/v1/clientes` | Listar y crear clientes |
| `GET/PUT` | `/api/v1/clientes/{id}` | Consultar y editar cliente |
| `GET/POST` | `/api/v1/vehiculos` | Listar y crear vehículos |
| `GET/PUT` | `/api/v1/vehiculos/{id}` | Detalle y edición de vehículo |
| `GET/POST` | `/api/v1/ordenes` | Listar y crear órdenes |
| `GET` | `/api/v1/ordenes/{id}` | Detalle con conceptos y totales |
| `POST` | `/api/v1/ordenes/{id}/avanzar-etapa` | Avance lineal de etapa y recálculo de totales |
| `POST` | `/api/v1/ordenes/{id}/registrar-avance` | Diagnóstico, mano de obra, refacciones y nueva etapa |
| `GET` | `/api/v1/refacciones` | Catálogo de refacciones |
| `POST` | `/api/v1/refacciones` | Alta de refacción (Administrador y Recepción) |
| `PUT` | `/api/v1/refacciones/{id}` | Edición y baja lógica (`activo = false`) |
| `POST` | `/api/v1/refacciones/{id}/entrada` | Surtir inventario |
| `GET` | `/api/v1/servicios` | Catálogo de mano de obra (sin precios) |
| `GET` | `/api/v1/usuarios` | Listar usuarios (Administrador) |
| `POST` | `/api/v1/usuarios/{id}/restablecer-password` | Restablecer contraseña (Administrador) |
| `GET/POST` | `/api/v1/proveedores` | Listar y crear proveedores (altas: Administrador) |
| `GET/PUT` | `/api/v1/proveedores/{id}` | Consultar y editar proveedor |
| `GET/POST` | `/api/v1/compras` | Listar compras y registrar una (Administrador) |
| `GET` | `/api/v1/compras/{id}` | Detalle de la compra con sus líneas |

La documentación interactiva con esquemas completos está en `/docs` y el contrato OpenAPI en `/openapi.json`.

## Estructura del proyecto

```text
AutoPulse-Elite/
├── AGENTS.md                       # Reglas del proyecto
├── README.md                       # Este archivo
├── docs/                           # Documentación consolidada de la práctica
│   ├── reporte-practica.md         # Reporte técnico (portada, requisitos, BD, roles, capturas)
│   ├── reporte-practica.pdf        # Reporte imprimible para entrega
│   ├── reporte-final.html          # El mismo reporte con diseño de impresión
│   ├── reporte-final.pdf           # Versión A4 lista para entregar
│   ├── pendientes.md               # Auditoría: qué falta para el 100 % funcional
│   ├── diagrama-er-interactivo.html # Diagrama E-R navegable con descarga PNG
│   ├── vendor/mermaid.min.js       # Copia local de Mermaid (diagrama sin internet)
│   ├── requisitos.md
│   ├── requisitos-actualizados.md
│   ├── contexto-tecnico.md
│   ├── erd.md
│   ├── decisiones-tecnicas.md
│   └── indice.md
├── documentacion-tecnica/          # Versión extendida de referencia
│   ├── reporte-practica.md
│   └── guia-capturas.md            # Guion detallado de las 47 capturas
├── documentacion-presentacion/     # Diagramas HTML para presentaciones
├── scripts/                        # Utilidades de documentación
│   └── generar-pdf.py              # Markdown -> PDF
├── sql/
│   ├── 01_catalogos.sql
│   ├── 02_vehiculos.sql
│   ├── 03_inventario.sql
│   ├── 04_ordenes.sql
│   ├── 05_finanzas.sql
│   ├── 06_seguridad.sql
│   ├── 07_datos_prueba.sql
│   ├── 08_datos_prueba_extra.sql
│   ├── 09_avance_mecanico.sql
│   ├── 10_proveedores_demo.sql
│   └── 11_procedimientos_funciones.sql
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI, arranque y registro de routers
│   │   ├── core/                   # Configuración, BD, JWT, dependencias y privacidad
│   │   ├── models/                 # Un archivo por tabla (21 modelos SQLAlchemy)
│   │   ├── schemas/                # Un archivo por módulo (Pydantic)
│   │   ├── routers/                # Un archivo por módulo funcional
│   │   └── services/               # Reservada para extraer la lógica de negocio
│   ├── tests/                      # Pruebas automatizadas (pendiente)
│   ├── scripts/                    # Utilidades de datos
│   ├── storage/fotos/              # Fotos subidas (contenido no versionado)
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── layout/             # Layout, Sidebar y guardas de ruta
    │   │   ├── ui/                 # Botón, panel, encabezado, badges y estilos
    │   │   ├── formularios/        # Campos de texto, select, checkbox y área
    │   │   ├── clientes/           # Componentes del expediente del cliente
    │   │   ├── login/              # Pantalla y formulario de acceso
    │   │   └── dashboard/          # Encabezado del panel principal
    │   ├── pages/
    │   │   ├── login/              # Inicio de sesión
    │   │   ├── dashboard/          # Panel principal
    │   │   ├── clientes/           # Lista, alta y expediente
    │   │   ├── vehiculos/          # Lista, alta y edición
    │   │   ├── ordenes/            # Lista, alta, detalle, tablero y avance
    │   │   ├── inventario/         # Catálogo, alta, baja y surtido
    │   │   ├── configuracion/      # Usuarios y contraseñas
    │   │   └── sistema/            # 404 y módulos “Próximamente”
    │   ├── context/                # Sesión y autenticación
    │   ├── lib/                    # Formato, roles y reglas del taller
    │   ├── services/               # Llamadas a la API (Axios)
    │   └── types/                  # Tipos TypeScript
    ├── package.json
    └── vite.config.ts
```

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Access denied for user ...` | Credenciales incorrectas en `.env` | Revisa `DB_USER` y `DB_PASSWORD`; prueba el mismo usuario con `mysql -u ... -p` |
| La API arranca pero `/salud` falla | MySQL detenido o base inexistente | Inicia el servicio de MySQL y confirma que `autopulse_elite` existe |
| La pantalla queda en `Verificando sesión…` | Backend caído o token vencido | Levanta `uvicorn`, cierra sesión y vuelve a entrar |
| `502` o `ECONNREFUSED` en el navegador | Vite no encuentra la API en el puerto 8000 | Arranca el backend antes que el frontend |
| Acentos rotos al importar SQL | Cliente MySQL con otra codificación | Usa `--default-character-set=utf8mb4` |
| `npm run build` falla por variables sin usar | `noUnusedLocals` está activo | Elimina imports o variables que no se usen |
| Contraseña olvidada | No hay recuperación por correo | Un Administrador la restablece desde Configuración |

## Documentación

- [`docs/reporte-practica.md`](docs/reporte-practica.md) — reporte consolidado: objetivos,
  requisitos, stack, desarrollo de la base, roles, triggers, transacciones y guion de capturas.
- [`docs/reporte-final.html`](docs/reporte-final.html) — el mismo reporte con diseño de
  impresión: portada, índice paginado, texto justificado y tablas contenidas. Se abre con doble
  clic en el navegador.
- [`docs/reporte-final.pdf`](docs/reporte-final.pdf) — versión imprimible en A4, con numeración
  de páginas, lista para entregar.
- [`docs/reporte-practica.pdf`](docs/reporte-practica.pdf) — la misma versión lista para entregar,
  con portada, índice y numeración de páginas.
- [`scripts/generar-pdf.py`](scripts/generar-pdf.py) — regenera el PDF desde el Markdown
  (`python scripts/generar-pdf.py`).
- [`docs/diagrama-er-interactivo.html`](docs/diagrama-er-interactivo.html) — diagrama E-R
  navegable con las 21 tablas, panel de atributos y descarga en PNG (abrir en el navegador).
- [`docs/requisitos.md`](docs/requisitos.md) — requisitos originales del taller.
- [`docs/requisitos-actualizados.md`](docs/requisitos-actualizados.md) — requisitos ajustados
  durante el análisis.
- [`docs/erd.md`](docs/erd.md) — diagrama entidad-relación en Mermaid (21 tablas).
- [`docs/decisiones-tecnicas.md`](docs/decisiones-tecnicas.md) — decisiones de arquitectura (ADR).
- [`docs/indice.md`](docs/indice.md) — índice de toda la documentación y de los scripts SQL.
- [`docs/contexto-tecnico.md`](docs/contexto-tecnico.md) — contexto y restricciones del proyecto.
- [`documentacion-tecnica/reporte-practica.md`](documentacion-tecnica/reporte-practica.md) —
  versión extendida del reporte.
- [`documentacion-tecnica/guia-capturas.md`](documentacion-tecnica/guia-capturas.md) — paso a
  paso detallado de las 47 capturas que demuestran el sistema.

Para obtener el PDF desde el HTML: abre `docs/reporte-final.html`, pulsa `Ctrl + P`, elige
**Guardar como PDF**, tamaño **A4**, márgenes **Predeterminados** y activa **Gráficos de fondo**.

## Equipo y licencia

- **Jonnatan Martinez Aquino** — Diseño de base de datos y desarrollo.

Este proyecto se distribuye bajo la licencia **MIT**.
