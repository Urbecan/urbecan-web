# Urbecan — web

Web estática (HTML + CSS + JS, sin framework) de Urbecan Inmobiliaria (URBECAN INVEST S.L.U., La Orotava, Tenerife).

## Estructura
- `urbecan-web/` → carpeta publicada (netlify.toml en la raíz: `publish = "urbecan-web"`)
  - `index.html` inicio · `nosotros/` · `particulares/` · `profesionales/` · `contacto/`
  - `aviso-legal/` `privacidad/` `cookies/` `gracias/` · `404.html`
  - `en/` versión en inglés: `en/` · `en/about/` · `en/buyers/` · `en/professionals/` · `en/contact/` · `en/thanks/` · `en/404.html` (ver «Idiomas»)
  - `assets/css/styles.css` · `assets/js/main.js` · `assets/img/*.jpg` · logos en `assets/`
- Cabecera y pie están repetidos en cada página: si cambias uno, cámbialo en todas (también en las de `en/`, con el texto en inglés).
- Rutas absolutas (`/assets/...`, `/nosotros/`). Para probar en local: `npx serve urbecan-web`.

## Panel de edición (Decap CMS + DecapBridge)
- Panel en `urbecan-web/admin/` → urbecan.com/admin. Decap CMS por CDN (versión fijada en `admin/index.html`).
  - `admin/config.yml`: colecciones. `admin/urbecan.css`: estilo Urbecan (selecciona componentes por nombre, p. ej. `[class*="-GridCard-card"]`; revisar si se actualiza Decap). `admin/urbecan.js`: completa la traducción al español y arranca Decap (`CMS_MANUAL_INIT`).
  - Las entradas se ven en filas (miniatura + etiqueta + nombre + flecha). Internamente es la vista «cuadrícula» de Decap, la única que muestra foto: `admin/index.html` la fuerza y `urbecan.css` la pinta como filas y oculta el selector lista/cuadrícula. La foto sale del campo `image` (Decap solo la detecta con ese nombre). El `summary` va en dos líneas y la primera se pinta como etiqueta pequeña (`::first-line`).
- Login del cliente con email y contraseña (o Google/Microsoft) vía DecapBridge (decapbridge.com, backend `git-gateway`, `auth_type: pkce`), sin cuenta de GitHub. Si el token de GitHub se revoca, crear otro (Contents read/write en `Urbecan/urbecan-web`) y pegarlo en el sitio de DecapBridge.
- Datos en `urbecan-web/data/`:
  - `promociones/<idioma>/*.json` y `equipo/<idioma>/*.json`: una entrada por archivo y por idioma (`es/`, `en/`; mismo nombre de archivo), ordenadas por `orden`. Promociones: estado «Vendida» → bloque de vendidas; `precio` es texto libre («Desde 245.000 €» se pinta como etiqueta + cifra). Si no hay ninguna en venta, el bloque «Promociones activas» se oculta solo (CSS `:has`).
  - `textos/<página>.json`: titulares y párrafos de inicio, nosotros, particulares y profesionales, con un bloque por idioma: `{ "es": {…}, "en": {…} }`.
  - Fotos de promociones y equipo: `assets/img/uploads/` (lo que se ve en «Medios»). El resto de fotos de la web (portada, secciones) siguen en `assets/img/` y no se editan desde el panel.
- Miniaturas: con DecapBridge, Decap no consigue la vista previa de las fotos de `uploads` y cae a la ruta interna del repo (`urbecan-web/…`), que sale en blanco. `admin/urbecan.js` repinta las miniaturas con la ruta pública (`/assets/img/uploads/…`). En local no pasa (usa `decap-server`).
- Cabecera del panel sin iconos ni menú «Añadir rápido»; la ventana «Medios» también lleva estilo Urbecan (se abre fuera de `#nc-root`, prefijo `html body`).
- `node scripts/build.mjs` vuelca los datos al HTML entre marcadores `<!--cms:tipo:clave-->…<!--/cms-->` (no editar a mano ese contenido; editar el JSON). Idempotente; Netlify lo ejecuta en cada deploy.
- Formato en textos: `*texto*` → `<em>`, `[texto]` → `<span>` (segundo tono), salto de línea → `<br>`.
- Probar el panel en local sin login: `npx decap-server` (raíz del repo) + servir `urbecan-web` en localhost → /admin/ (`local_backend: true`). Ejecutar el build antes de probar la web si cambian los JSON.

## Idiomas (español + inglés)
- Español es el idioma principal (URLs sin prefijo); inglés vive en `/en/` con slugs propios. Equivalencias en `RUTAS` de `scripts/build.mjs`: `/`↔`/en/`, `/nosotros/`↔`/en/about/`, `/particulares/`↔`/en/buyers/`, `/profesionales/`↔`/en/professionals/`, `/contacto/`↔`/en/contact/`, `/gracias/`↔`/en/thanks/`. Legales solo en español (desde las páginas en inglés se enlazan con `hreflang="es"`). 404 en los dos idiomas: Netlify sirve `/en/404.html` para lo que no exista bajo `/en/` (regla en `netlify.toml`) y `/404.html` para el resto.
- Las páginas `en/` son HTML propio (mismo diseño, textos traducidos a mano). `<html lang>` debe coincidir con la carpeta: el build falla si no.
- El build genera según el idioma de la carpeta de cada página:
  - `<!--cms:idioma-->` → en la cabecera de escritorio, un solo enlace al otro idioma («EN» en español, «ES» en inglés; aria-label «English version» / «Versión en español»), justo antes del icono de Instagram y con su mismo tamaño y color (`.nav-lang-link`). Por encima de 1150px la línea separadora que iba delante del icono pasa delante del enlace; por debajo el icono se oculta (ya era así) y el enlace sigue visible.
  - `<!--cms:idiomas-->` → selector completo «ES · EN» (`.nav-lang`) en el menú móvil (oculto en escritorio) y en el pie, bajo las redes.
  - Ambos llevan a la página equivalente; si no la hay, al inicio de cada idioma.
  - `<!--cms:hreflang-->` → `<link rel="alternate" hreflang>` es/en/x-default (x-default = español).
  - `sitemap.xml` completo con alternativas `xhtml:link` (no editarlo a mano).
  - Precios: en el panel se escriben en español («Desde 245.000 €»); el build los formatea según el idioma con `Intl.NumberFormat` (`formatoNumero` en `IDIOMAS`): «Desde 245.000 €» / «From €245,000». Si el precio no es una cifra («Consultar», «245.000 € + IGIC») sale tal cual (o con la traducción de `precios`).
  - Promociones y equipo: textos de la ficha en el idioma de la página; etiquetas fijas (estado, tipo, «Desde», botones) traducidas en `IDIOMAS` de `build.mjs`. Si falta la traducción de una ficha o un texto, se usa el español.
- Formulario en inglés: mismo form `contacto` y mismos campos (Netlify los junta); los valores de «tipo» se envían en español, el asunto lleva «(versión en inglés)» y redirige a `/en/thanks/`. Textos de `main.js` sin idioma fijo (el botón usa `data-sending`).
- Decap: `i18n` global `multiple_folders` (es, en; principal es). Promociones y Equipo con `i18n: true`; Textos con `structure: single_file` (Decap no admite otra estructura en colecciones de archivos). Campos `i18n: true` = se traducen (nombre de promoción, descripción, cargo, textos); `i18n: duplicate` = se copian del español al guardar (fotos, municipio, año, viviendas, tipo, estado, precio, enlace, orden, nombre de persona). «Más fotos» (lista) va sin `i18n` porque Decap no admite `duplicate` en listas: se edita solo en español y la web usa esas fotos en todos los idiomas.

### Añadir un idioma nuevo (ejemplo: alemán `de`)
1. `scripts/build.mjs`: añadir `de` a `IDIOMAS` (copiar el bloque `en` y traducir etiquetas, estados y tipos) y una columna `de: '/de/…/'` en cada fila de `RUTAS`.
2. Páginas: copiar `urbecan-web/en/` a `urbecan-web/de/` con las carpetas renombradas a los slugs de `RUTAS`; cambiar `<html lang="de">`, `og:locale`, title/description/canonical/og:url, textos de cabecera, pie, cookies y WhatsApp, enlaces internos (`/de/…`), `action` del formulario y `data-sending`. No tocar lo que hay entre marcadores `<!--cms:…-->`.
3. Datos: crear `data/promociones/de/` y `data/equipo/de/` (copias de `en/` traducidas) y añadir un bloque `"de": {…}` a cada `data/textos/*.json`.
4. `admin/config.yml`: añadir `de` a `i18n.locales`.
5. `node scripts/build.mjs` (regenera selector, hreflang y sitemap en todas las páginas) y revisar en local (`npx serve urbecan-web`).

## Publicación
- GitHub: `Urbecan/urbecan-web` (público, rama `main`).
- Netlify despliega solo en cada push → https://urbecan.netlify.app
- Provisional: oculta a Google (`robots.txt` Disallow + `<meta name="robots" content="noindex,nofollow">` en cada página). Quitar al lanzar en urbecan.com y añadir `Sitemap:` a robots.txt.

## Contacto real
WhatsApp 656 61 15 00 · Tel. 922 08 07 17 / 922 32 63 48 · info@urbecan.com · Avda. Mayorazgo de Franchy 11, Local 4, 38300 La Orotava · L–V 9:00–14:00 y 16:30–19:30 · Instagram @urbecan
Propiedades: enlaces a https://diverso.casafaricrm.com/ (Casafari). Diverso (centro de negocios): https://diversoempresas.com

## Diseño
- Menú hamburguesa por debajo de 981px (`@media(max-width:980px)` en los bloques de `.nav`, `.mobile-toggle`, `.nav-close`, `.nav-extra`, `menu-open`): la cabecera en español no cabe con aire por debajo de ese ancho. El resto del diseño móvil sigue en 690px. En el menú las opciones largas parten en dos líneas.
Fuentes: Manrope (titulares) + DM Sans (texto). Colores: navy #08295d, ink #142235, arena #c4b18a, papel #f5f3ec, fondo #e8e5dc. No cambiar el diseño sin pedirlo.

## Pendiente (en orden)
1. Panel de edición con Decap CMS en `/admin/` (login email + contraseña vía DecapBridge, sin GitHub). Hecho en el repo (ver «Panel de edición»). Falta:
   - ~~Crear el sitio en decapbridge.com~~ → hecho (sitio «Urbecan», auth PKCE, token GitHub sin caducidad solo con Contents de `urbecan-web`; bloque `backend` ya en `admin/config.yml`).
   - Invitar usuarios por email desde DecapBridge (plan gratuito: 3 sitios, 10 colaboradores) y probar login en urbecan.netlify.app/admin/.
   - Al lanzar: cambiar `site_url`/`display_url` de `admin/config.yml` y la «Decap CMS login URL» en DecapBridge a https://www.urbecan.com/admin/.
2. Formulario de contacto real con Netlify Forms (form `contacto` en `contacto/index.html`, honeypot, redirige a `/gracias/`). Hecho en el repo. Falta en Netlify: activar «Form detection» y añadir aviso por email a info@urbecan.com (Forms → Notifications).
3. ~~Sustituir fotos de ejemplo por las nuevas del norte y el histórico real de promociones vendidas.~~ → hecho (equipo real de 6 personas, 1 promoción en venta y 12 vendidas). Pendientes de añadir desde el panel:
   - Urbanización Los Trazos (La Orotava): falta año y nº de viviendas (la foto ya está en `uploads/promo-urbanizacion-los-trazos.jpg`).
   - Apartamentos Hotel Radisson (Puerto de la Cruz, 2025, 32 apartamentos): falta foto.
4. Textos legales definitivos y datos fiscales (pendientes del cliente).
5. Lanzamiento: dominio urbecan.com (ahora en Inmovilla; no tocar DNS sin confirmar dónde está el correo), quitar noindex, enviar sitemap a Search Console.

## Checklist de lanzamiento

### Funcionamiento
- [ ] Formulario de contacto real con Netlify Forms: avisos a info@urbecan.com y redirección a /gracias/
- [ ] Panel Decap CMS en /admin con login por email (DecapBridge) y usuarios del equipo creados
- [ ] Pruebas en móvil, tablet y escritorio (Safari, Chrome, Firefox)

### Correo y dominio (no tocar DNS sin confirmación)
- [ ] Confirmar con Inmovilla dónde están el dominio urbecan.com y el correo
- [ ] Migrar el correo antes de cambiar el dominio, si hace falta
- [ ] Conectar urbecan.com a Netlify (www y sin www, HTTPS)
- [ ] Redirecciones 301 de las URLs de la web antigua a las nuevas (archivo `_redirects`)

### Google y visibilidad
- [ ] Quitar el noindex (robots.txt y meta robots) y añadir `Sitemap:` a robots.txt
- [ ] Alta en Google Search Console y envío de sitemap.xml
- [ ] Actualizar la ficha de Google Business con la web nueva
- [ ] Analítica (decidir con el cliente: GA4 o una alternativa sin cookies)

### Detalles
- [x] Favicon y apple-touch-icon (`favicon.ico`, `favicon.svg`, `apple-touch-icon.png` en la raíz de urbecan-web; enlazados en cada página)
- [ ] Imagen para compartir (og:image 1200×630) en todas las páginas
- [ ] Aviso de cookies ajustado a lo que se use de verdad
- [ ] Textos legales y datos fiscales definitivos
- [x] Sustituir fotos de ejemplo e histórico real de promociones vendidas

### Entrega
- [ ] Transferir GitHub (organización Urbecan) y Netlify a info@urbecan.com
- [ ] Guía corta de uso del panel para el cliente (PDF o página en /admin)
