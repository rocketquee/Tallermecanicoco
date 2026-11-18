# AutoPulse Elite

Sistema web de gestión para **Pizarro Performance Garage**, un taller especializado en autos de lujo. Reúne clientes VIP, vehículos, órdenes de servicio, inventario, compras internacionales, pagos y datos de facturación CFDI 4.0 en un solo lugar, accesible desde computadora, tablet y celular. Hoy la operación se lleva en una libreta y Excel; AutoPulse Elite busca eliminar la dispersión de información y dar trazabilidad completa en un negocio donde la discreción con figuras públicas es crítica.

> **Nota:** la base de datos (21 tablas) y el backend inicial con FastAPI ya están implementados. El frontend con React es la siguiente fase. La API incluye autenticación JWT, clientes, vehículos y órdenes de servicio.

## Características principales

Los códigos entre paréntesis remiten al requisito correspondiente en [`docs/requisitos.md`](docs/requisitos.md) y [`docs/requisitos-actualizados.md`](docs/requisitos-actualizados.md).

### Clientes

- **Registro:** nombre, dos teléfonos, correo, dirección y nombre del asistente o chofer del cliente (CLI-01). Búsqueda por nombre del dueño en menos de 3 segundos (CLI-05) e historial de órdenes, pagos y saldo por cliente (CLI-06).
- **Clientes VIP (hoy unos 15):** se marcan y desmarcan desde el sistema (CLI-02) y reciben prioridad en la fila de órdenes, 10% de descuento automático en mano de obra, auto de cortesía y recogida a domicilio (CLI-03). El administrador es el responsable de su atención (CLI-04).
- **Préstamo de auto de cortesía:** el auto se registra como activo del taller y cada préstamo guarda a quién se prestó, fecha y hora, kilometraje de salida y de regreso, y una revisión de rayones (CLI-07).
- **Recogida a domicilio:** la orden lleva notas con la dirección y los datos de recogida para el chofer (CLI-08).
- **Clientes confidenciales:** pueden marcarse como confidenciales (SEG-17). En sus órdenes el mecánico ve solo placas y el trabajo asignado, nunca el nombre del dueño (SEG-18); la restricción se aplica por fila en la base de datos (SEG-19) y queda registro de quién consultó el expediente (SEG-20).

### Vehículos

- **Expediente:** placas, número de serie, marca, modelo, año, color, kilometraje de entrada y valor aproximado (VEH-01), asociado a su dueño (VEH-02), con búsqueda por placas en menos de 3 segundos (VEH-06).
- **Póliza de seguro:** aseguradora, número, vigencia y cobertura (VEH-04), con aviso al administrador 30 días antes del vencimiento (VEH-05).
- **Fotos del estado:** hasta 30 por auto, de máximo 10 MB cada una, clasificadas en ingreso, proceso y entrega, con fecha y hora automáticas y firma de conformidad en las de entrega (VEH-03). Se almacenan en un servidor de archivos aparte, no en la base de datos (VEH-08).
- **Valor en custodia:** cálculo en cualquier momento del valor total de los autos que están dentro del taller (VEH-07).

### Órdenes de servicio

- **Apertura y etapas:** orden al llegar el auto con dueño, placas, número de serie y falla reportada (ORD-01), en cuatro etapas: recibido, diagnóstico, reparación y listo (ORD-02), con un tablero único de todos los autos en el taller y su etapa (ORD-03).
- **Responsabilidades por rol:** recepción solo registra la llegada; el mecánico avanza de diagnóstico a reparación y a listo; solo el administrador puede regresar una orden a una etapa anterior (ORD-04, ORD-05).
- **Asignación y trabajo:** uno o más mecánicos por orden (ORD-09), con registro de las piezas usadas y la mano de obra (ORD-10).
- **Alertas de retraso:** aviso al administrador y al mecánico si una orden lleva más de 5 días sin cambiar de etapa (ORD-06), excluyendo las que están "esperando pieza en camino" (ORD-07), más un listado de órdenes con retraso (ORD-12).
- **Prioridad VIP:** la fila de trabajo da prioridad a las órdenes de clientes VIP (ORD-13).
- **Bitácora:** registro de quién hizo cada trabajo y a qué hora (ORD-08).
- **Cancelación:** solo el administrador, con motivo obligatorio y registro del usuario, sin borrar la orden (ORD-11).

### Inventario

- **Tornillería y consumibles:** catálogo con existencias (INV-01), descuento automático de cada pieza al asignarla a una orden (INV-02) y alerta cuando quedan 2 unidades o menos (INV-03).
- **Piezas especiales por marca:** se tratan como compras ligadas a una orden, sin existencias en inventario (INV-04).
- **Ajustes manuales:** solo el administrador, con motivo y registro en bitácora (INV-05).

### Proveedores y compras

- **Proveedores de Italia, Alemania e Inglaterra:** registrados con país y contacto (PRV-01) y con su tiempo de entrega calculado, hoy de 2 a 8 semanas (PRV-02).
- **Pedidos:** cada uno con su estado y fecha estimada de llegada (PRV-03), lista de pendientes con su fecha (PRV-04) y registro de quién lo solicitó y para qué orden (PRV-05).
- **Órdenes de compra:** borrador automático con las piezas faltantes (PRV-06) que no puede enviarse sin la aprobación del administrador ni sin el anticipo del 50% registrado, cuando aplique (PRV-07). Incluye el listado de piezas que hay que pedir esta semana (PRV-08).
- **Moneda y tipo de cambio:** cada compra guarda moneda original (EUR o GBP), costo en esa moneda, tipo de cambio del día y equivalente en pesos (PRV-09); esos costos y tipos de cambio quedan ocultos para mecánicos y recepción (PRV-10).

### Pagos

- **Cálculo del total:** piezas + mano de obra + IVA 16%, con desglose visible para el cliente (PAG-01); el descuento VIP de 10% aplica solo a la mano de obra (PAG-02). El cobro es siempre en pesos mexicanos (PAG-07).
- **Anticipos y pagos en partes:** anticipo del 50% obligatorio cuando el subtotal de piezas supera un umbral configurable —propuesta: $20,000 a $30,000 MXN— y el resto al entregar (PAG-03). El umbral de "piezas caras" es un parámetro configurable (PAG-06) y los pagos en partes solo se permiten a clientes marcados como de confianza (PAG-04).
- **Saldos:** cuánto ha pagado y cuánto debe cada cliente y cada orden (PAG-05).

### Facturación

- **Cierre y factura:** cierre de la orden y generación de la factura con un solo botón (FAC-01), bloqueado si hay saldo pendiente salvo que el administrador haya autorizado entregar con saldo (FAC-02). La factura incluye logotipo del taller, datos fiscales, número de orden y desglose de piezas, mano de obra e IVA en formato CFDI 4.0 (FAC-03).
- **Datos para timbrar:** el sistema genera el paquete completo de CFDI 4.0 (régimen fiscal, uso de CFDI, código postal y demás datos obligatorios); en esta fase el contador o el taller lo manda a timbrar con un PAC (FAC-05). La integración directa con el PAC queda como fase futura, a definir con el contador (FAC-06).
- **Facturas emitidas:** no se pueden editar; su cancelación exige motivo y usuario (FAC-04).

### Autorizaciones

- **Umbral de monto:** toda orden cuyo total con IVA supere $250,000 MXN requiere autorización del administrador, sin aplicar por pieza suelta (AUT-01). La compra de piezas y el inicio del trabajo quedan bloqueados hasta que la orden esté autorizada (AUT-02) y solo el administrador puede autorizar, sin delegar (AUT-03).
- **Tolerancia:** si una orden ya autorizada sube más allá de una tolerancia configurable (5% o 10%), se congelan compras y trabajo hasta una nueva autorización (AUT-07, AUT-08). El valor exacto está por definir con el cliente: su ejemplo ($300,000 a $320,000) es un aumento de 6.7%, así que solo se cumple con una tolerancia de 5% o menos.
- **Entrega con saldo:** el administrador puede autorizar la entrega con saldo pendiente (AUT-04).
- **Registro y consulta:** cada autorización se guarda con usuario, fecha, hora y monto (AUT-05), y las órdenes que esperan autorización se consultan también desde el celular (AUT-06).

### Reportes

- **Panel matutino:** autos por etapa, piezas que llegan esta semana y órdenes que esperan autorización (REP-01).
- **Cobranza:** reporte semanal de lo facturado y lo pendiente de cobro (REP-02).
- **Mecánicos:** ingresos generados y carga de trabajo por mecánico, para repartir bonos (REP-03).
- **Aseguradora:** reporte de valor en custodia (REP-04).
- **Margen por orden:** costo real en pesos (con tipo de cambio) contra precio cobrado (REP-07).
- **Exportación:** reportes en Excel y PDF (REP-05). Los reportes pueden entregarse hasta un mes después del arranque (REP-06).

### Seguridad y trazabilidad

- **Autenticación y roles:** acceso individual para 5 usuarios —1 administrador, 3 mecánicos y 1 de recepción— (SEG-01, SEG-14) con permisos por rol y por cliente (SEG-05).
- **Restricciones por rol:** los mecánicos no ven precios de cobro ni ganancias (SEG-02); recepción no ve finanzas ni lo que gana cada mecánico (SEG-03); el administrador tiene acceso total (SEG-04); costos de compra y tipos de cambio quedan ocultos para mecánicos y recepción (PRV-10).
- **Auditoría:** bitácora inmutable de altas, cambios, cancelaciones y autorizaciones (SEG-06) y borrado lógico, nada se elimina físicamente (SEG-07).
- **Respaldos:** automático diario, con pérdida máxima aceptable de 1 día de datos (SEG-08), y copia guardada fuera del taller (SEG-09).
- **Cifrado:** datos cifrados en tránsito y en reposo (SEG-15).
- **Rendimiento:** toda orden o resultado de búsqueda se muestra en 2 a 3 segundos como máximo (SEG-10), dimensionado para 5 usuarios, unos 8 ingresos por semana y 10 autos simultáneos (SEG-14).
- **Dispositivos:** tableta con botones grandes para mecánicos, apta para manos sucias (SEG-11); computadora para recepción y celular para el administrador, solo consulta (SEG-12).
- **Captura:** no pedir dos veces el mismo dato (SEG-13).

## Stack tecnológico

### Base de datos (fase actual)

| Componente | Tecnología |
|---|---|
| Motor | MySQL 8.x (InnoDB, `utf8mb4`) |
| Cliente principal | MySQL Workbench |
| Alternativas | DBeaver, OpenNavicat (diseño E-R asistido por IA) |
| Diagramas | Mermaid (ERD en Markdown) |

Convenciones: nombres en español y `snake_case`, dinero en `DECIMAL(12,2)`, estados con `ENUM`, fechas con `DATETIME` y llaves foráneas con `ON UPDATE CASCADE` / `ON DELETE RESTRICT`.

### Backend (fase futura)

- **Python 3.10+** con **FastAPI** y **Uvicorn**
- **SQLAlchemy 2.x** como ORM y **Alembic** para migraciones
- **Pydantic v2** para validación
- **JWT con roles** (Administrador, Recepción, Mecánico)

### Frontend (fase futura)

- **React 18+** con **TypeScript** y **Vite**
- **Tailwind CSS** + **shadcn/ui** para la interfaz
- **TanStack Query** para datos del servidor
- **React Hook Form + Zod** para formularios
- **Recharts** para reportes
- **PWA** para instalar el sitio en el celular del administrador
- Interfaz de tablet para mecánicos, con botones grandes aptos para manos sucias

### Almacenamiento y despliegue (fase futura)

- Fotos fuera de la base de datos: sistema de archivos local en desarrollo y almacenamiento S3-compatible (MinIO o Cloudflare R2) en producción.
- Backend en Railway o Render; frontend en Vercel o Netlify; MySQL en Aiven o PlanetScale; CI/CD con GitHub Actions.

## Requisitos previos

- **MySQL 8.x** (obligatorio para la fase actual).
- **Git** para clonar el repositorio.
- **Python 3.10+** y **Node.js** (solo necesarios cuando se implementen el backend y el frontend).

## Instalación y ejecución

### Fase actual: base de datos y backend inicial

El esquema está terminado: 21 tablas en MySQL 8.x (InnoDB, `utf8mb4_unicode_ci`). La API
ya expone autenticación, clientes, vehículos, órdenes de servicio, el catálogo de
refacciones, el reporte de avance del mecánico, el surtido de inventario y la
administración de usuarios.

```bash
# 1. Clonar el repositorio
git clone https://github.com/<usuario>/AutoPulse-Elite.git
cd AutoPulse-Elite

# 2. Crear la base de datos
mysql -u root -p -e "CREATE DATABASE autopulse_elite CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. Ejecutar los bloques SQL en orden
mysql -u root -p autopulse_elite < sql/01_catalogos.sql
mysql -u root -p autopulse_elite < sql/02_vehiculos.sql
mysql -u root -p autopulse_elite < sql/03_inventario.sql
mysql -u root -p autopulse_elite < sql/04_ordenes.sql
mysql -u root -p autopulse_elite < sql/05_finanzas.sql
mysql -u root -p autopulse_elite < sql/06_seguridad.sql
mysql -u root -p autopulse_elite < sql/09_avance_mecanico.sql

# 4. Opcional: datos de ejemplo para desarrollo
mysql -u root -p autopulse_elite < sql/07_datos_prueba.sql
mysql -u root -p autopulse_elite < sql/08_datos_prueba_extra.sql
```

El detalle de tablas y relaciones está en [docs/erd.md](docs/erd.md) y el avance en la sección [Estado del proyecto](#estado-del-proyecto).

> **Configuración local:** copia `opencode.example.json` a `opencode.json` y coloca tus credenciales de MySQL. `opencode.json` está en `.gitignore` para que ninguna contraseña llegue a GitHub.

### Backend

```bash
cd backend
python -m venv .venv

# Windows (CMD)
.venv\Scripts\activate.bat
# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env       # Windows: configurar MySQL y JWT_SECRET_KEY
cp .env.example .env         # Linux / macOS
uvicorn app.main:app --reload
```

La documentación interactiva queda en `http://127.0.0.1:8000/docs`. Las tablas se crean
con los scripts `sql/01` a `sql/09`; Alembic queda pendiente para cuando se necesiten
migraciones versionadas.

### Fase futura: frontend

```bash
cd frontend
npm install
npm run dev
```

## Estructura del proyecto

```
AutoPulse-Elite/
├── AGENTS.md                  # Reglas del proyecto para OpenCode
├── README.md                  # Este archivo
├── .gitignore
├── opencode.example.json      # Plantilla de configuración local (MCP MySQL)
├── documentacion-presentacion/ # Diagramas HTML independientes para presentaciones
│   ├── arquitectura.html      # Usuario → React → FastAPI → MySQL
│   ├── diagrama-er.html       # 21 tablas con Mermaid (CDN)
│   └── README.md
├── docs/
│   ├── indice.md              # Índice de documentación
│   ├── requisitos.md          # Requisitos originales
│   ├── requisitos-actualizados.md
│   ├── contexto-tecnico.md    # Stack y decisiones técnicas
│   ├── erd.md                 # Diagrama E-R en Mermaid (21 tablas)
│   └── decisiones-tecnicas.md # ADRs (Architecture Decision Records)
├── sql/
│   ├── 01_catalogos.sql       # clientes, mecanicos, proveedores, servicios
│   ├── 02_vehiculos.sql       # vehiculos, polizas_seguro
│   ├── 03_inventario.sql      # refacciones, compras, detalle_compra, movimientos_inventario
│   ├── 04_ordenes.sql         # ordenes_servicio, detalle_orden, fotos_vehiculo
│   ├── 05_finanzas.sql        # pagos, facturas, autorizaciones
│   ├── 06_seguridad.sql       # usuarios, bitacora, orden_mecanicos, historial_etapas, parametros
│   ├── 07_datos_prueba.sql    # seeds base para desarrollo
│   ├── 08_datos_prueba_extra.sql # clientes, vehículos, servicios y órdenes de ejemplo
│   └── 09_avance_mecanico.sql # columna diagnostico para el reporte de avance
├── backend/                   # API Python + FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routers/
│   │   ├── services/
│   │   └── core/              # config, seguridad, sesión de BD
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
```

- **`docs/`**: requisitos, contexto técnico, diagrama E-R y registro de decisiones.
- **`documentacion-presentacion/`**: diagramas visuales en HTML que se abren con
  doble clic, sin servidor, para presentaciones.
- **`sql/`**: scripts divididos por bloques, en el orden en que deben ejecutarse.
- **`backend/`**: API REST con FastAPI, modelos SQLAlchemy y módulos de autenticación, clientes, vehículos y órdenes.
- **`frontend/`**: aplicación React con TypeScript, empaquetada con Vite (fase futura).

> Hoy existen `AGENTS.md`, `README.md`, `docs/` completo, los scripts `sql/01` a `sql/07` y el backend inicial. La carpeta `frontend/` se creará al iniciar esa fase.

## Decisiones técnicas clave

1. **Aplicación web, no de escritorio.** El administrador consulta desde su celular, el mecánico usa una tablet en el taller y recepción trabaja desde computadora, sin instalar nada. La PWA permite "instalar" el sitio en el celular del administrador.
2. **MySQL en lugar de PostgreSQL.** Es más ligero para desarrollo local, tiene soporte en proveedores gratuitos (Aiven, PlanetScale) y es suficiente para el volumen previsto: 5 usuarios, unos 8 ingresos por semana y hasta 10 autos simultáneos.
3. **Python + FastAPI en lugar de Node.js o Java.** Permite prototipar rápido la lógica de negocio (IVA, autorizaciones, márgenes con tipo de cambio) y genera documentación OpenAPI automática.
4. **React + TypeScript en lugar de Vue o Angular.** Mayor ecosistema de componentes y mejor soporte para PWA; TypeScript reduce errores al conectar con la API.
5. **Fotos fuera de la base de datos.** Se guardan en almacenamiento de objetos y la BD solo conserva la ruta y metadatos: 30 fotos de 10 MB por auto y 8 autos por semana equivaldrían a cerca de 2.4 GB semanales dentro de MySQL.
6. **Borrado lógico.** Las llaves foráneas usan `ON DELETE RESTRICT`: nada se elimina físicamente, lo que preserva la trazabilidad y la auditoría exigida por el negocio.
7. **CFDI 4.0 sin timbrado en esta fase.** El sistema genera el paquete de datos completo para timbrar (régimen fiscal, uso de CFDI, código postal y demás obligatorios); el contador o el taller lo envía a un PAC. La integración directa con un PAC queda como fase futura.

## Alcance del primer entregable

El criterio de aceptación del primer día es cubrir el ciclo básico: registrar cliente (CLI-01) y auto (VEH-01), abrir una orden y moverla por sus etapas (ORD-01 a ORD-05), descontar piezas (INV-02), calcular el total con IVA (PAG-01) y generar la factura con los datos CFDI 4.0 listos para timbrar (FAC-01 a FAC-03). El timbrado con PAC queda fuera de este alcance, salvo que se decida integrarlo desde el inicio. Los reportes (REP-06) pueden entregarse hasta un mes después del arranque.

## Estado del proyecto

**Fase actual: backend inicial completado (autenticación, clientes, vehículos y órdenes). Siguiente: frontend con React.**

- [x] Levantamiento de requisitos (originales y actualizados).
- [x] Contexto técnico y definición del stack.
- [x] Diseño de la base de datos por bloques (21 tablas).
- [x] Diagrama E-R en Mermaid ([docs/erd.md](docs/erd.md)).
- [x] Backend inicial: login JWT, roles, privacidad, clientes, vehículos y órdenes.
- [x] Inventario: catálogo, descuento por consumo y surtido con bitácora.
- [x] Administración de usuarios y restablecimiento de contraseña (solo Admin).
- [x] Frontend operativo: panel, clientes, vehículos, órdenes, inventario y configuración.
- [ ] Módulos restantes del backend (proveedores, pagos, facturas, autorizaciones, reportes).
- [ ] Integración directa con PAC para timbrar (fase futura).
- [ ] Migración de los datos actuales de la libreta y Excel (SEG-16).

## Equipo

- Jonnatan Martinez Aquino — Diseño de base de datos y desarrollo.

## Licencia

Este proyecto se distribuye bajo la licencia **MIT**.
