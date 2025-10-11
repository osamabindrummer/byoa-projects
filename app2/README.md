# Sitio estático con Markdown

Este proyecto genera un sitio web estático con landing page, blog y páginas informativas usando solo HTML, CSS y un script sencillo en Node.js. El contenido se escribe en Markdown y se procesa en HTML sin frameworks pesados.

## Requisitos

- Node.js 18 o superior

## Comandos disponibles

```bash
npm install # no instala dependencias, solo prepara el lock si lo necesitas
npm run build
```

El comando `npm run build` limpia la carpeta `dist/`, copia los archivos de `public/` y convierte todos los Markdown en HTML listo para publicar.

## Estructura

- `content/pages/` – páginas estáticas (`index`, `about`, `faq`, `contact`, etc.).
- `content/blog/` – posts del blog, nombrados por archivo (`mi-post.md` → `mi-post.html`).
- `public/` – activos estáticos como CSS, imágenes o fuentes.
- `templates/base.html` – plantilla HTML usada para todas las páginas.
- `src/build.js` – script que arma el sitio en `dist/`.

## Crear una nueva página

1. Añade un archivo Markdown en `content/pages/` con front matter:
   ```markdown
   ---
   title: Mi página
   layout: page
   ---
   # Título visible

   Contenido en Markdown.
   ```
2. Ejecuta `npm run build`. Obtendrás `dist/mi-pagina.html`.

## Crear un nuevo post del blog

1. Añade un archivo en `content/blog/`:
   ```markdown
   ---
   title: Lanza el producto
   date: 2024-05-20
   layout: post
   ---
   # Encabezado principal

   Tu texto aquí.
   ```
2. Ejecuta `npm run build`. El post aparecerá en `dist/blog/` y en el índice del blog.

## Formularios y suscripción

- **ConvertKit/Substack**: Las plantillas incluyen un formulario con la URL `https://app.convertkit.com/forms/<tu-form-id>/subscriptions`. Sustituye `<tu-form-id>` por el ID real de tu formulario. Si prefieres Substack u otro proveedor, cambia la URL y los campos en los formularios dentro de `content/pages/index.md` y `src/build.js`.
- **Contacto**: El formulario de contacto usa [FormSubmit](https://formsubmit.co). Reemplaza `your@email.com` en `content/pages/contact.md` con tu correo o ajusta la acción según el servicio que quieras usar.

## Personalización

- Modifica estilos en `public/assets/styles.css`.
- Ajusta la navegación editando `templates/base.html`.
- Si necesitas más campos en el front matter, extiende la función `parseFrontMatter` en `src/build.js`.

## Publicar

El resultado compilado vive en `dist/`. Puedes desplegarlo en cualquier hosting estático como GitHub Pages, Netlify o Vercel subiendo la carpeta resultante.

