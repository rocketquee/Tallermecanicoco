# Guía de capturas de pantalla

Esta guía indica **qué pantallas capturar, en qué orden y con qué usuario** para demostrar que AutoPulse Elite funciona de punta a punta. Está pensada para entregar evidencias de la práctica sin tener que improvisar durante la presentación.

> **Consejo:** haz las capturas con el navegador a 100 % de zoom, en una ventana de 1440 × 900 px. Así todas las imágenes conservan el mismo tamaño y se leen bien en el reporte.

---

## 0. Preparación (antes de capturar)

1. Levanta MySQL, el backend y el frontend siguiendo el [`README.md`](../README.md).
2. Confirma que la API responde en <http://127.0.0.1:8000/api/v1/salud> y que reporta **21 tablas**.
3. Carga los datos de ejemplo (si aún no lo hiciste):

   ```bash
   mysql -u root -p --default-character-set=utf8mb4 autopulse_elite < sql/07_datos_prueba.sql
   mysql -u root -p --default-character-set=utf8mb4 autopulse_elite < sql/08_datos_prueba_extra.sql
   ```

4. Abre <http://localhost:5173> en una ventana de incógnito para empezar sin sesión.
5. Guarda las imágenes en `documentacion-tecnica/capturas/` con el nombre sugerido de cada paso.

**Usuarios disponibles** (contraseña `AutoPulse2026!`):

| Usuario | Correo | Rol |
|---|---|---|
| Gabriel Pizarro | `gabriel@pizarrogarage.mx` | Administrador |
| Ana Torres | `ana.torres@pizarrogarage.mx` | Recepción |
| Luis Ramírez | `luis.ramirez@pizarrogarage.mx` | Mecánico |

**Datos de ejemplo que verás:**

| Orden | Cliente | Vehículo | Etapa |
|---|---|---|---|
| ORD-0001 | Rodrigo Salgado (VIP) | Porsche 911 Carrera S · PPG-001-A | Recibido |
| ORD-0002 | Alejandra Ríos (VIP) | Audi Q5 · PPG-004-D | Recibido |
| ORD-0003 | Héctor Mendoza | Volkswagen Golf GTI · PPG-005-E | Diagnóstico |
| ORD-0004 | Sofía Vargas (VIP) | Lexus RX 350 · PPG-006-F | Reparación |
| ORD-0005 | Javier Ortega | Ford Mustang GT · PPG-007-G | Listo |
| ORD-0006 | Valeria Núñez | Toyota Corolla · PPG-008-H | Entregado |

> **Cliente confidencial:** Mariana Cortés (`PPG-002-B`, Mercedes-Benz E 300) existe en el directorio pero no tiene orden propia en los datos de ejemplo. Al entrar como Mecánico aparecerá enmascarada en la lista de clientes.

---

## 1. Login

**Objetivo:** demostrar que el sistema arranca y exige autenticación.

1. Abre `http://localhost:5173`. El sistema debe redirigir a `/login`.
2. Captura la pantalla completa con el formulario vacío.
3. Escribe `gabriel@pizarrogarage.mx` y la contraseña `AutoPulse2026!` **sin enviar** el formulario.
4. Captura de nuevo mostrando los campos llenos y el botón de mostrar/ocultar contraseña.

| Archivo sugerido | Qué demuestra |
|---|---|
| `01-login.png` | Pantalla de acceso y diseño general |
| `02-login-credenciales.png` | Captura de correo y contraseña con el botón de visibilidad |

**Opcional:** escribe una contraseña incorrecta y captura el mensaje de error (`03-login-error.png`); prueba que el sistema no revela si el correo existe.

---

## 2. Panel principal como Administrador

1. Inicia sesión con **Gabriel Pizarro**.
2. Espera a que carguen los indicadores.
3. Captura el panel completo: saludo con fecha real, indicadores, botones de acción, órdenes por etapa, "Requiere atención" y últimas órdenes.
4. Pasa el cursor sobre el menú de la cuenta (esquina superior derecha) y captura las opciones **Configuración** y **Cerrar sesión**.

| Archivo sugerido | Qué demuestra |
|---|---|
| `04-dashboard-admin.png` | Panel con datos reales: autos en taller, listas para entrega, clientes, valor en custodia y stock bajo |
| `05-dashboard-menu-cuenta.png` | Menú de sesión y acceso a Configuración solo para Administrador |

**Puntos que debes señalar en la captura:**

- "Autos en taller" cuenta las órdenes en Recibido, Diagnóstico y Reparación.
- "Valor en custodia" solo aparece para el Administrador.
- "Requiere atención" se calcula con las órdenes de más de 5 días y el inventario en el mínimo.
- El botón **Actualizar** vuelve a consultar la API.

---

## 3. Clientes

1. Entra a **Clientes** desde el menú lateral.
2. Captura la tabla con los 8 clientes de ejemplo, sus etiquetas VIP/Regular y el botón **Nuevo cliente**.
3. En el buscador escribe `Alejandra` y captura el resultado filtrado.
4. Limpia el filtro y usa el selector de categoría **VIP**; captura la lista filtrada.
5. Abre el expediente de **Alejandra Ríos** y captura:
   - datos de contacto,
   - etiqueta VIP y descuento de mano de obra,
   - vehículo Audi Q5 con kilometraje y valor aproximado.

| Archivo sugerido | Qué demuestra |
|---|---|
| `06-clientes-lista.png` | Directorio completo con categorías |
| `07-clientes-busqueda.png` | Búsqueda por nombre en tiempo real |
| `08-clientes-filtro-vip.png` | Filtro por categoría VIP |
| `09-cliente-detalle.png` | Expediente con contacto, categoría VIP y vehículos |

6. Pulsa **Nuevo cliente**, llena el formulario con datos ficticios (por ejemplo "Prueba Captura"), elige categoría **VIP** y captura el formulario completo antes de guardar.
7. Guarda y captura la pantalla de éxito o el expediente recién creado.

| Archivo sugerido | Qué demuestra |
|---|---|
| `10-nuevo-cliente.png` | Formulario de alta con validaciones y propuesta de descuento VIP |
| `11-cliente-creado.png` | Alta exitosa y navegación al expediente |

> Si no quieres dejar datos de prueba, elimina el cliente después con `DELETE` lógico desde MySQL; el sistema no borra físicamente.

---

## 4. Vehículos

1. Entra a **Vehículos**.
2. Captura la tabla con placas, marca, modelo, dueño y año.
3. Usa la búsqueda con `PPG-004` y captura el resultado.
4. Pulsa **Nuevo vehículo**, selecciona un cliente, llena los datos y captura el formulario completo.

| Archivo sugerido | Qué demuestra |
|---|---|
| `12-vehiculos-lista.png` | Catálogo de vehículos con placas y dueño |
| `13-vehiculos-busqueda.png` | Búsqueda por placas |
| `14-nuevo-vehiculo.png` | Alta de vehículo asociada a un cliente |

**Opcional:** abre el detalle de un vehículo desde el expediente del cliente para mostrar la relación cliente → vehículo.

---

## 5. Órdenes de servicio (Administrador)

1. Entra a **Órdenes de servicio**.
2. Captura la tabla con las seis órdenes, sus etapas, responsables y totales.
3. Filtra por etapa **Listo** y captura el resultado (debe quedar ORD-0005).
4. Limpia los filtros.
5. Pulsa **Nueva orden** y captura el formulario.
6. Selecciona el cliente **Sofía Vargas**; el selector de vehículo debe mostrar solo el Lexus RX 350.
7. Selecciona el vehículo, escribe una falla y captura el formulario completo con la ficha de la unidad.
8. Pulsa **Registrar orden** y captura el detalle de la orden recién creada en estado **Recibido**.

| Archivo sugerido | Qué demuestra |
|---|---|
| `15-ordenes-lista.png` | Tablero de órdenes con etapas y totales |
| `16-ordenes-filtro-etapa.png` | Filtro por etapa |
| `17-nueva-orden.png` | Formulario de alta con cliente y vehículo dependientes |
| `18-orden-creada.png` | Orden nueva en estado Recibido |

---

## 6. Detalle e impresión de una orden

1. Abre **ORD-0004** (Lexus RX 350 de Sofía Vargas).
2. Captura la parte superior: etapa, fechas, responsable y datos del cliente y del vehículo.
3. Desplázate y captura:
   - el diagnóstico (si existe),
   - la tabla de servicios y refacciones con cantidades, precios e importes,
   - el panel de totales con subtotal, IVA y total.
4. Pulsa **Imprimir Orden** y captura la vista previa de impresión del navegador.

| Archivo sugerido | Qué demuestra |
|---|---|
| `19-orden-detalle.png` | Detalle completo con cliente, vehículo y conceptos |
| `20-orden-totales.png` | Cálculo de subtotal, IVA 16 % y total |
| `21-orden-impresion.png` | Documento imprimible de la orden |

**Dato verificable:** ORD-0004 es de una clienta VIP, así que los precios de mano de obra ya incluyen el 10 % de descuento. Subtotal $2,430.00 + IVA $388.80 = **$2,818.80**.

---

## 7. Inventario

1. Entra a **Inventario**.
2. Captura la tabla con existencias, stock mínimo y la alerta visual de las refacciones en el mínimo.
3. Localiza **Kit de tornillería M12 inoxidable**.
4. Pulsa **Surtir** (o el botón de entrada de inventario) y captura el modal.
5. Registra una entrada de 5 piezas y captura el mensaje de éxito y la nueva existencia.

| Archivo sugerido | Qué demuestra |
|---|---|
| `22-inventario.png` | Catálogo con existencias y alerta de stock bajo |
| `23-inventario-surtir.png` | Modal de entrada de inventario |
| `24-inventario-actualizado.png` | Existencia actualizada y movimiento registrado |

---

## 8. Configuración y usuarios (solo Administrador)

1. Entra a **Configuración** desde el menú de la cuenta o el menú lateral.
2. Captura la lista de usuarios con sus roles y estados.
3. Pulsa **Restablecer contraseña** en el usuario de Recepción y captura el modal.
4. **No confirmes** el cambio si no quieres modificar la contraseña de prueba; si lo haces, anota la nueva contraseña.

| Archivo sugerido | Qué demuestra |
|---|---|
| `25-configuracion-usuarios.png` | Administración de usuarios visible solo para el Administrador |
| `26-restablecer-password.png` | Modal de restablecimiento de contraseña |

---

## 9. Panel como Recepción

1. Cierra sesión e inicia con **Ana Torres** (`ana.torres@pizarrogarage.mx`).
2. Captura el panel. Debe mostrar los mismos indicadores operativos, pero **sin "Valor en custodia"**.
3. Abre el menú lateral y captura que **no aparece Configuración** y que Inventario sí está disponible.
4. Entra a **Órdenes → Nueva orden** y captura que Recepción sí puede crear órdenes.

| Archivo sugerido | Qué demuestra |
|---|---|
| `27-dashboard-recepcion.png` | Panel sin información financiera |
| `28-menu-recepcion.png` | Menú restringido por rol |
| `29-recepcion-nueva-orden.png` | Recepción puede registrar órdenes |

### 9.1. Ruta protegida (prueba clave)

1. Estando como Recepción, escribe directamente en la barra de direcciones: `http://localhost:5173/configuracion`.
2. El sistema debe regresar al panel principal (`/dashboard`).
3. Captura la pantalla resultante y asegúrate de que se vea la URL en la barra del navegador.

| Archivo sugerido | Qué demuestra |
|---|---|
| `30-ruta-protegida.png` | La ruta de Administrador no es accesible escribiendo la URL |

---

## 10. Experiencia del Mecánico

1. Cierra sesión e inicia con **Luis Ramírez**.
2. Entra a **Órdenes de servicio**. El mecánico ve el **tablero de bahías**, no la tabla administrativa.
3. Captura el tablero con sus órdenes (ORD-0001 y ORD-0006) y el botón **Registrar Avance**.
4. Pulsa **Registrar Avance** en ORD-0001 y captura el modal completo: diagnóstico, etapa siguiente, catálogo de refacciones y botón de guardar.
5. Cierra el modal sin guardar.
6. Abre el detalle de ORD-0001 y captura:
   - la orden sin columnas de precios (aparece "No visible"),
   - la ausencia de totales en dinero,
   - los botones disponibles.
7. Entra a **Clientes** y captura la lista. El cliente confidencial **Mariana Cortés** debe aparecer enmascarado como **"Cliente confidencial"** y sin datos de contacto.

| Archivo sugerido | Qué demuestra |
|---|---|
| `31-tablero-mecanico.png` | Vista de bahías exclusiva del mecánico |
| `32-registrar-avance.png` | Registro de diagnóstico, etapa y refacciones |
| `33-orden-mecanico-sin-precios.png` | SEG-18: el mecánico no ve importes |
| `34-clientes-confidenciales.png` | SEG-17/SEG-18: cliente confidencial enmascarado |

---

## 11. 404 y cierre de sesión

1. Con cualquier usuario, escribe una ruta inexistente: `http://localhost:5173/no-existe`.
2. Captura la pantalla **404** con el botón **Volver a Principal**.
3. Pulsa **Cerrar sesión** y captura el regreso al Login.

| Archivo sugerido | Qué demuestra |
|---|---|
| `35-404.png` | Manejo correcto de rutas inexistentes |
| `36-logout.png` | Cierre de sesión y regreso al Login |

---

## 12. API y base de datos (evidencia técnica)

### 12.1. Salud de la API

1. Abre <http://127.0.0.1:8000/api/v1/salud>.
2. Captura la respuesta JSON con `"estado": "ok"`, la versión de MySQL y `"tablas": 21`.

**Archivo:** `37-api-salud.png`.

### 12.2. Swagger

1. Abre <http://127.0.0.1:8000/docs>.
2. Captura la lista de módulos: Autenticación, Clientes, Vehículos, Órdenes, Refacciones y Usuarios.
3. Pulsa **Authorize**, inicia sesión con un usuario y captura el candado activo.
4. Expande `GET /api/v1/clientes`, pulsa **Try it out → Execute** y captura la respuesta 200 con datos.

**Archivos:** `38-swagger-modulos.png`, `39-swagger-autorizado.png`, `40-swagger-clientes.png`.

### 12.3. Bloqueo del backend por rol

1. En Swagger, autorízate con el usuario **Mecánico**.
2. Ejecuta `GET /api/v1/usuarios`.
3. Captura la respuesta **403 Forbidden**.

**Archivo:** `41-swagger-403.png`.

> Esta captura es la prueba más fuerte de que la seguridad no depende solo del frontend: el backend rechaza la operación aunque se llame directamente a la API.

### 12.4. Base de datos

1. Abre MySQL Workbench (o tu cliente favorito).
2. Ejecuta `SHOW TABLES;` y captura las 21 tablas.
3. Ejecuta `SELECT id, estado, cliente_id, vehiculo_id, total FROM ordenes_servicio;` y captura las órdenes.
4. Ejecuta `SELECT * FROM bitacora ORDER BY id DESC LIMIT 10;` y captura los movimientos recientes.

**Archivos:** `42-bd-tablas.png`, `43-bd-ordenes.png`, `44-bd-bitacora.png`.

---

## 13. Vista móvil (opcional pero recomendada)

1. Abre las herramientas de desarrollo del navegador (`F12`).
2. Activa el modo dispositivo (por ejemplo iPhone 14 o 390 × 844 px).
3. Inicia sesión como Administrador y captura:
   - el panel con el botón de menú,
   - el menú lateral desplegado,
   - la tabla de órdenes con desplazamiento horizontal.

| Archivo sugerido | Qué demuestra |
|---|---|
| `45-movil-dashboard.png` | Panel adaptable |
| `46-movil-menu.png` | Menú lateral funcional en móvil |
| `47-movil-ordenes.png` | Tabla usable en pantalla pequeña |

---

## 14. Lista de verificación final

Antes de cerrar la entrega, confirma que tienes capturas de:

- [ ] Login y error de credenciales.
- [ ] Panel de Administrador con datos reales.
- [ ] Clientes: lista, búsqueda, filtro VIP, detalle y alta.
- [ ] Vehículos: lista, búsqueda y alta.
- [ ] Órdenes: lista, filtro por etapa, alta y detalle con totales.
- [ ] Impresión de una orden.
- [ ] Inventario: lista, surtido y existencia actualizada.
- [ ] Configuración y restablecimiento de contraseña.
- [ ] Panel y menú de Recepción sin finanzas.
- [ ] Ruta `/configuracion` bloqueada para Recepción.
- [ ] Tablero de bahías del Mecánico.
- [ ] Modal de registrar avance.
- [ ] Orden del mecánico sin precios.
- [ ] Cliente confidencial enmascarado.
- [ ] Pantalla 404 y cierre de sesión.
- [ ] API de salud, Swagger autorizado y 403 del backend.
- [ ] Tablas, órdenes y bitácora en MySQL.

Con estas evidencias queda demostrado el ciclo completo: **autenticación → clientes → vehículos → orden → avance → inventario → auditoría**, además de las restricciones por rol en frontend y backend.
