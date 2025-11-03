# Guía de buenas prácticas para `byoa-projects`

Este repositorio reúne múltiples apps creadas durante el curso Build Your Own Apps. Mantén la misma disciplina que ya se observa en los proyectos existentes.

## Organización general
- Cada app vive en su carpeta (`app1`, `app2`, …) con sus propios assets y documentación. Evita mezclar recursos entre proyectos y añade nuevos directorios siguiendo ese patrón.
- Mantén la documentación en español y actualiza `README.md` o los archivos locales de cada app cuando agregues nuevas secciones.
- Prefiere nombres descriptivos en español para variables, clases CSS, atributos `aria` y textos visibles.
- Antes de publicar cambios, verifica que los enlaces públicos (por ejemplo `https://osamabindrummer.github.io/byoa-projects/appX/...`) sigan funcionando o documenta si cambian.

## HTML y accesibilidad
- Usa etiquetas semánticas (`main`, `section`, `header`, `footer`, etc.) y estructura jerárquica correcta de encabezados como en `app1/index.html` y las plantillas de `app2`.
- Añade atributos de accesibilidad cuando aporten contexto (`aria-label`, `aria-live`, `role="img"`, `aria-hidden="true"`) y usa clases utilitarias tipo `sr-only` para contenido visualmente oculto pero accesible.
- Mantén los textos y atributos en español para coherencia con la audiencia principal.

## CSS
- Centraliza colores, tipografías y sombras en variables CSS dentro de `:root`, igual que en `app1/styles.css` y `app2/public/assets/styles.css`.
- Soporta modo oscuro usando `@media (prefers-color-scheme: dark)` y animaciones de transición suaves entre temas.
- Aplica layout responsive con `display: grid`/`flex` y `@media (min-width: …)` breakpoints en lugar de medidas fijas.
- Evita frameworks pesados; la estética se resuelve con CSS nativo, sombras suaves y bordes redondeados amplios.

## JavaScript del front-end
- Mantén el estado en objetos inmutables por defecto (`const state = { … }`) y expón funciones puras que lo actualicen mediante utilidades como `updateDisplay`, `renderFocusLog`, etc.
- Usa `const`/`let` y funciones flecha o funciones declaradas; evita variables globales implícitas.
- Aplica early returns para flujos de control y validaciones (`if (!element) return;`).
- Gestiona efectos visuales (p. ej. confeti) encapsulados en módulos/objetos específicos para que puedan reiniciarse limpiamente.

## Scripts de Node (generador estático)
- Usa `fs/promises` con `async/await`, divide el código en funciones pequeñas (`ensureDir`, `buildPages`, `buildPosts`, …) y favorece nombres autoexplicativos.
- Evita dependencias innecesarias: el generador usa solo `marked`; mantén el footprint ligero.
- Implementa helpers reutilizables para formato de fechas, excerpts y front matter en lugar de duplicar lógica.
- Cuando copies archivos o leas directorios, respeta la estructura (`content/`, `templates/`, `public/`, `dist/`) y limpia `dist/` antes de regenerar el sitio.

## Estándar de commits
- Redacta mensajes de commit en español y en imperativo breve (ej. "Añade soporte para modo enfoque").
- Incluye contexto suficiente cuando afectes a varias apps; especifica qué carpeta se modifica.

Seguir estas pautas mantendrá el código consistente y fácil de extender a medida que se agreguen nuevas aplicaciones.
