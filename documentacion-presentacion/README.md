# Documentación de presentación — Apex Elite Motorsport

Carpeta con los diagramas visuales del proyecto en formato **HTML independiente**.
Están pensados para presentaciones, juntas con el cliente o para compartir la
carpeta por correo/USB sin depender de la aplicación React.

## Contenido

| Archivo | Qué muestra |
|---|---|
| `arquitectura.html` | Flujo Usuario → Frontend (React) → Backend (FastAPI) → Base de Datos (MySQL), con los protocolos HTTPS, REST/JSON y SQL. Incluye el recorrido de una petición y las reglas de comunicación. |
| `diagrama-er.html` | Diagrama Entidad-Relación de las 21 tablas, dibujado con **Mermaid** desde un CDN. Muestra PK, FK y las 24 relaciones. |
| `README.md` | Este documento. |

## Cómo abrirlos

1. Entra a la carpeta `documentacion-presentacion/` desde el explorador de archivos.
2. Haz **doble clic** en `arquitectura.html` o `diagrama-er.html`.
3. El archivo se abre en tu navegador predeterminado (Chrome, Edge, Firefox, etc.).

No hace falta instalar nada, ejecutar `npm` ni levantar el backend. También
puedes arrastrar el archivo a una pestaña del navegador o usar clic derecho →
**Abrir con** → tu navegador favorito.

## Requisitos

- **`arquitectura.html`**: funciona 100 % sin conexión. Todo el CSS y los iconos
  están embebidos en el archivo.
- **`diagrama-er.html`**: necesita **conexión a internet** la primera vez, porque
  Mermaid se carga desde `cdn.jsdelivr.net`. Si no hay red, el archivo muestra un
  aviso en lugar del diagrama. El resto de la página (encabezado, leyenda y
  botones) sigue funcionando.

## Controles del diagrama E-R

- **Arrastrar**: mueve el diagrama dentro del lienzo.
- **Rueda del ratón**: acerca y aleja.
- **Botones `+` / `−`**: zoom con incrementos fijos.
- **Centrar**: vuelve a encuadrar las 21 tablas.
- **Descargar SVG**: guarda el diagrama como imagen vectorial, útil para
  insertarlo en PowerPoint, Keynote, Google Slides o Word.

## Para presentar

- Pulsa **F11** para pantalla completa y oculta la barra del navegador.
- En `diagrama-er.html` puedes acercar una tabla concreta y arrastrarla al centro
  mientras explicas.
- Ambos archivos incluyen estilos de impresión: con **Ctrl + P** puedes guardar
  un PDF con fondo oscuro (activa “Gráficos de fondo” en el diálogo de impresión).

## Cómo actualizar los diagramas

- **Arquitectura**: edita directamente el HTML; cada capa es un `<article
  class="capa">` y los conectores están entre ellas.
- **E-R**: el código Mermaid vive en el bloque `<pre id="fuente">` al final de
  `diagrama-er.html`. Si cambia el esquema, actualiza ese bloque y también
  `docs/erd.md` y los scripts de `sql/` para que las tres fuentes coincidan.

## Relación con el resto del proyecto

Estos diagramas son independientes: no se importan desde React ni consumen la
API. La aplicación principal ya no incluye la vista interactiva de
documentación ni las librerías `@xyflow/react` / `html-to-image`; esa
funcionalidad vive únicamente aquí, en archivos que se abren con doble clic.
