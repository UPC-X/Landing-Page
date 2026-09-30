# UPC-X · Landing Page

Landing informativa de UPC-X, el marketplace para estudiantes UPC verificados de RichStudent. Se publica con GitHub Pages desde la rama `main`: <https://upc-x.github.io/Landing-Page/>.

Diseño en Figma: [UPC-X · Landing Page](https://www.figma.com/design/tBrjbqyscC9ipYJxQLYy12/UPC-X-Landing-Page) (wireframes, mock-ups y estilos para escritorio y navegador móvil).

## Estructura

| Ruta | Contenido |
|---|---|
| `index.html` | Landing en español (es-419): inicio, problema, características, cómo funciona, testimonios, preguntas frecuentes y contacto, llamado a la acción y footer. |
| `terminos.html` | Términos y condiciones, política de privacidad y normas de la comunidad, en español e inglés. |
| `css/styles.css` | Tokens de color y tipografía del informe (sección 4.1) y estilos responsive (1100 px y 760 px). |
| `js/i18n.js` | Textos en inglés y mensajes dinámicos en ambos idiomas. |
| `js/main.js` | Selector de idioma, menú móvil, destinos de los llamados a la acción y validación del formulario de contacto. |
| `assets/` | Foto del hero, capturas de la app, imagen social y favicon. |

## Idioma

El idioma se elige en este orden: parámetro `?lang=es|en`, la última elección del visitante (`localStorage`), el idioma del navegador y, por último, inglés. El HTML está escrito en español y `js/i18n.js` aporta la versión en inglés.

## Probar en local

Abre `index.html` en el navegador o sirve la carpeta con cualquier servidor estático, por ejemplo `npx serve .`. Revisa la página a 1440 px y a 390 px de ancho.

## Publicar

1. Integra los cambios en `main` mediante un Pull Request.
2. GitHub Pages publica `main` desde la raíz (`/`).
3. Comprueba el resultado en <https://upc-x.github.io/Landing-Page/>.
