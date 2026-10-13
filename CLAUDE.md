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

## Instagram (portada)
- Cuenta: @inmobiliaria_urbecan (instagram.com/urbecan/ no es la suya). Feed de Behold (behold.so, plan gratis) con ID `JqGRM7KmABKZcjXVf3uE` (constante `BEHOLD` en `scripts/build.mjs`); el mismo ID sirve como widget y como JSON (`https://feeds.behold.so/<ID>`).
- El build lee el JSON una vez y pinta las 6 últimas publicaciones en `.ig-grid` (`index.html` y `en/index.html`, marcador `<!--cms:instagram-->`) con el diseño de la web: enlace a cada publicación, foto de behold.pictures (`sizes.small`/`medium`; las URL de Instagram caducan) y, al pasar el ratón, la primera línea del pie sin emojis (si va en mayúsculas, en minúsculas salvo los lugares de `LUGARES`). Si el feed no responde, se deja lo que había.
- No usar el widget de Behold (`<behold-widget>` + script): cada visita gasta una de las 1.200 vistas al mes del plan gratis y trae su propio diseño. Plan gratis: 6 publicaciones, Behold actualiza el feed una vez al día.
- Para que la web se actualice sola hace falta volver a publicar a diario: en la rama `webempresa`, `publicar.yml` lleva un `schedule` diario (GitHub solo ejecuta los `schedule` de la rama principal, así que empieza al fusionar el PR #1). En Netlify no hay publicación diaria: se actualiza con cada push.

## Idiomas (español + inglés)
- Español es el idioma principal (URLs sin prefijo); inglés vive en `/en/` con slugs propios. Equivalencias en `RUTAS` de `scripts/build.mjs`: `/`↔`/en/`, `/nosotros/`↔`/en/about/`, `/particulares/`↔`/en/buyers/`, `/profesionales/`↔`/en/professionals/`, `/contacto/`↔`/en/contact/`, `/gracias/`↔`/en/thanks/`. Legales solo en español (desde las páginas en inglés se enlazan con `hreflang="es"`). 404 en los dos idiomas: Netlify sirve `/en/404.html` para lo que no exista bajo `/en/` (regla en `netlify.toml`) y `/404.html` para el resto.
- Las páginas `en/` son HTML propio (mismo diseño, textos traducidos a mano). `<html lang>` debe coincidir con la carpeta: el build falla si no.
- El build genera según el idioma de la carpeta de cada página:
  - `<!--cms:idioma-->` → en la cabecera de escritorio, un solo enlace al otro idioma («EN» en español, «ES» en inglés; aria-label «English version» / «Versión en español»), justo antes del icono de Instagram y con su mismo tamaño y color (`.nav-lang-link`). Por encima de 1150px la línea separadora que iba delante del icono pasa delante del enlace; por debajo el icono se oculta (ya era así) y el enlace sigue visible.
  - `<!--cms:idiomas-->` → selector completo «ES · EN» (`.nav-lang`) en el menú móvil (oculto en escritorio) y en el pie, bajo las redes.
  - Ambos llevan a la página equivalente; si no la hay, al inicio de cada idioma.
  - `<!--cms:instagram-->` → las casillas de `.ig-grid` en la portada (ver «Instagram»).
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
WhatsApp 656 61 15 00 · Tel. 922 08 07 17 / 922 32 63 48 · info@urbecan.com · Avda. Mayorazgo de Franchy 11, Local 4, 38300 La Orotava · L–V 9:00–14:00 y 16:30–19:30 · Instagram @inmobiliaria_urbecan
Propiedades: enlaces a https://diverso.casafaricrm.com/ (Casafari). Diverso (centro de negocios): https://diversoempresas.com

## Diseño
- Menú hamburguesa por debajo de 981px (`@media(max-width:980px)` en los bloques de `.nav`, `.mobile-toggle`, `.nav-close`, `.nav-extra`, `menu-open`): la cabecera en español no cabe con aire por debajo de ese ancho. El resto del diseño móvil sigue en 690px. En el menú las opciones largas parten en dos líneas.
Fuentes: Manrope (titulares) + DM Sans (texto). Colores: navy #08295d, ink #142235, arena #c4b18a, papel #f5f3ec, fondo #e8e5dc. No cambiar el diseño sin pedirlo.

## Estado y pendiente (actualizado 13/10/2026)

### Situación
- **Lanzamiento en urbecan.com el viernes 16/10/2026**, con web, dominio y correo en **Webempresa**.
- Netlify dejó de publicar el 12/10/2026: el equipo se quedó sin créditos del plan gratuito (300/mes, 15 por publicación, el tráfico también gasta). urbecan.netlify.app sigue mostrando la versión del 9/10 y los despliegues salen como «Skipped». Por eso se cambia a Webempresa.
- **La migración está en la rama `webempresa`, PR https://github.com/Urbecan/urbecan-web/pull/1**: GitHub Actions + FTPS, formulario en PHP, `.htaccess`, documentación y «Plan de lanzamiento en Webempresa». No fusionar hasta tener Webempresa contratado, el buzón info@urbecan.com y los secretos de FTP en GitHub. Hasta entonces, «Publicación» y el checklist de `main` siguen describiendo Netlify.
- Los cambios de contenido (fotos, textos) van a `main`. Antes de fusionar, comprobar que el PR sigue sin conflictos.
- Subir cambios: desde la terminal, `git push` da 403 (la cuenta V-Figueroa no tiene permiso en el repo); se sube con «Push origin» en GitHub Desktop.
- Dominio: ya está el código para trasladar urbecan.com desde Inmovilla. El traslado se pide al contratar Webempresa y puede tardar días; si no ha terminado el viernes, apuntar el DNS desde el proveedor actual.

### Pedido al cliente (12/10/2026) y respuestas (13/10/2026)
1. Contratar el hosting en Webempresa y pasarnos el acceso. **Pendiente.**
2. Datos legales de URBECAN INVEST S.L.U. **Hecho:** CIF, domicilio y Registro Mercantil ya están en `aviso-legal/` y `privacidad/`.
3. Código de verificación de Google Business (llega al móvil del cliente). **Pendiente:** el cliente no reconoce el número al que Google manda el código; hay que aclarárselo. No escribir el número aquí.
4. Instagram. **Hecho:** feed de Behold conectado (ver «Instagram»). La cuenta es @inmobiliaria_urbecan. El cliente nos pasó por WhatsApp la contraseña de Instagram: no guardarla en ningún sitio y recomendarle cambiarla.
5. Reseñas en Google de clientes reales. **Pospuesto:** el cliente prefiere ocultar la sección por ahora (ya oculta, ver «Pendiente nuestro»).
6. Emails de quienes van a usar el panel. **Pendiente:** el cliente propone un único Gmail nuevo de Urbecan, con la contraseña compartida entre las dos personas que editarán la web. Falta que nos pase la dirección.
7. Fotos de la oficina o del equipo. **Sin fecha:** no hay fachada que fotografiar (Urbecan está dentro de Diverso, con un cartel pequeño) ni foto del equipo junto; el cliente quiere organizar una sesión más adelante.
8. Los Trazos y Antonia María. **Hecho:** Urbanización Los Trazos (La Orotava, 2016, 6 adosados, vendida) y Residencial Antonia María a 305.000 €.

### Pendiente nuestro
- **Reseñas de la portada (`.rv-track` en `index.html` y `en/index.html`, fijas en el HTML, no en el panel):** las 5 actuales (Carmen R., Daniel y Sara, Miguel Á. H., Promociones del Norte, Laura P.) son de ejemplo y no se pueden publicar. No poner reseñas inventadas.
  - **Oculta desde el 13/10/2026** (`<div class="reviews" hidden>`), de acuerdo con el cliente. Las secciones siguientes se renumeraron: «05 / Actualidad» y «06 / Empecemos» (en inglés «05 / News», «06 / Let’s begin»). Para volver a mostrarla: quitar `hidden` y devolverlas a 06 y 07.
  - Decidido: 3 reseñas reales de 4–5★, fijas, con la fecha como mes y año, y «Ver todas en Google» con el enlace «Compartir perfil» de la ficha (ahora apunta a una búsqueda genérica de Maps).
  - La ficha aún tiene pocas reseñas: no enlazarla todavía.
  - Descartados: Trustindex (gratis solo con su plugin de WordPress; en webs normales el widget gratis dura 7 días; plan Single 65 $/año) y Places API de Google (pide Google Cloud con facturación; máx. 5 reseñas por consulta; no se pueden guardar).
- **Panel:** con DecapBridge gratis solo invita el dueño de la cuenta (nosotros), hasta 10 personas por web. El rol de administrador para que invite el cliente es de pago (9 $/mes o 199 $ en pago único). Falta decidir entre: invitar nosotros, pasar la cuenta al cliente en la entrega o plan de pago. Con el Gmail único que propone el cliente (punto 6) basta invitar esa dirección; lo recomendable sería una invitación por persona (gratis hasta 10), así nadie comparte contraseña. El sitio de DecapBridge ya está creado (sitio «Urbecan», auth PKCE, token GitHub sin caducidad solo con Contents de `urbecan-web`).
- **Cookies:** el aviso dice que hay cookies de terceros (analítica, reseñas, redes) y la web no usa ninguna. Ajustar el aviso y `cookies/` a lo real; decidir con el cliente si quiere analítica.
- **Otros:** og:image 1200×630 (ahora no hay), redirecciones 301 de las URLs de la web antigua de Inmovilla, guía corta del panel, pruebas en móvil, tablet y escritorio. En `aviso-legal/`, `privacidad/` y `cookies/` sigue la nota «Texto de ejemplo para la maqueta…»: quitarla cuando el asesor del cliente revise los textos.
- **Formulario PHP (rama `webempresa`):** probado en local solo con Apache (sin PHP en el Mac). Probar en Webempresa un envío en cada idioma.
- **Tras fusionar el PR #1: borrar un dato privado del historial de GitHub.** El 12/10/2026 se subió a `main` en `CLAUDE.md` (commit `4f9a191`) el móvil del cliente para la verificación de Google Business, y el repo es público. La versión actual ya no lo tiene, pero sigue en el historial. No volver a escribir el número en este archivo.
  - Reescribir el historial de todas las ramas con `git filter-repo --replace-text` y subir con «Force push» desde GitHub Desktop (la terminal no tiene permiso de escritura).
  - Avisar antes: cambian los identificadores de los commits y cualquier otro clon tendrá que volver a clonarse.
  - Para que GitHub borre también sus copias en caché, pedirlo a GitHub Support.

### Fotos
- Hechas el 12/10/2026, en español e inglés:
  - Inicio «Vender»: `vender-calle-balcones.jpg` (recuerda a la Avenida Marítima de Santa Cruz de La Palma).
  - Profesionales: `promotores-villas-piscina.jpg`.
  - Particulares «Comprar»: `comprar-costa-norte.jpg`. «Invertir»: `invertir-obra-nueva.jpg` (versión que mandó el usuario, sin retocar).
  - Contacto: `contacto-calle-balcones.jpg`.
- Retoques de color: muy suaves. El usuario rechazó un retoque dorado fuerte porque las fotos «se ven viejas».
- Cabecera de Particulares: el fondo de «Comprar» sube hasta la mitad de la foto, sin franja clara ni línea (CSS al final de `styles.css`).
- Por sustituir con fotos del norte:
  - Portada del inicio (`foto-01`).
  - Cabecera de Nosotros (`foto-04`).
  - «Nuestra mirada» grande (`foto-05`) y pequeña (`foto-03`).
  - `foto-01` y `foto-05` son casi la misma imagen. «Encontrar» y «Promocionar» del inicio siguen con `foto-02` y `foto-04`.
- No subir a Google Business las fotos decorativas (son imágenes generadas, no fotos reales del negocio).

### Google Business
- Descripción preparada (704 de 750 caracteres). Antes de usar la frase de las 300 viviendas, confirmar con el cliente que esas 13 promociones las comercializó Urbecan (las vendidas de la web suman 328 viviendas):
  > Urbecan es una inmobiliaria en La Orotava que acompaña desde 2003 a quienes quieren comprar, vender o invertir en una vivienda en el norte de Tenerife: La Orotava, Puerto de la Cruz, Los Realejos, La Laguna, Tacoronte, Icod de los Vinos y alrededores. Para particulares: búsqueda de vivienda, valoración y venta de tu propiedad, visitas, financiación y acompañamiento hasta la firma en notaría. Para promotores: comercialización de obra nueva con estrategia, marketing y seguimiento de cada promoción. Hemos comercializado más de 300 viviendas en 13 promociones del norte de la isla. Trato cercano y un equipo propio de asesoría inmobiliaria, procesos notariales, administración y gestión patrimonial.
- Categoría principal: Agencia inmobiliaria; secundaria: Consultor inmobiliario. El teléfono público debería ser el de la web (922 08 07 17).
- Logo cuadrado con margen para la ficha: `urbecan-logo-google.png` (1080×1080), en la carpeta de entrega `Downloads/entrega-web 3/urbecan-web/google-business/`. Se genera a partir de `favicon.svg`.

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
- [ ] Textos legales revisados por el asesor del cliente (datos fiscales ya puestos)
- [x] Sustituir fotos de ejemplo e histórico real de promociones vendidas

### Entrega
- [ ] Transferir GitHub (organización Urbecan) y Netlify a info@urbecan.com
- [ ] Guía corta de uso del panel para el cliente (PDF o página en /admin)
