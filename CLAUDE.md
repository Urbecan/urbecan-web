# Urbecan — web

Web estática (HTML + CSS + JS, sin framework) de Urbecan Inmobiliaria (URBECAN INVEST S.L.U., La Orotava, Tenerife).

## Estructura
- `urbecan-web/` → carpeta publicada (se sube tal cual a Webempresa; ver «Publicación»)
  - `index.html` inicio · `nosotros/` · `particulares/` · `profesionales/` · `contacto/`
  - `aviso-legal/` `privacidad/` `cookies/` `gracias/` · `404.html`
  - `en/` versión en inglés: `en/` · `en/about/` · `en/buyers/` · `en/professionals/` · `en/contact/` · `en/thanks/` · `en/404.html` (ver «Idiomas»)
  - `assets/css/styles.css` · `assets/js/main.js` · `assets/img/*.jpg` · logos en `assets/`
  - `.htaccess` (más `en/.htaccess` y `admin/.htaccess`) · `contacto/enviar.php` (formulario). Ver «Publicación».
- Cabecera y pie están repetidos en cada página: si cambias uno, cámbialo en todas (también en las de `en/`, con el texto en inglés).
- Rutas absolutas (`/assets/...`, `/nosotros/`). Para probar en local: `npx serve urbecan-web` (sin `.htaccess` ni formulario, que necesitan Apache y PHP). Si un cambio de CSS no se ve, recargar forzando (Cmd+Shift+R): el navegador guarda la hoja de estilos (ver «Caché del CSS» en «Pendiente nuestro»).

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
- `node scripts/build.mjs` vuelca los datos al HTML entre marcadores `<!--cms:tipo:clave-->…<!--/cms-->` (no editar a mano ese contenido; editar el JSON). Idempotente; GitHub Actions lo ejecuta antes de cada publicación.
- Formato en textos: `*texto*` → `<em>`, `[texto]` → `<span>` (segundo tono), salto de línea → `<br>`.
- Probar el panel en local sin login: `npx decap-server` (raíz del repo) + servir `urbecan-web` en localhost → /admin/ (`local_backend: true`). Ejecutar el build antes de probar la web si cambian los JSON.

## Instagram (portada)
- Cuenta: @inmobiliaria_urbecan (instagram.com/urbecan/ no es la suya). Feed de Behold (behold.so, plan gratis) con ID `JqGRM7KmABKZcjXVf3uE` (constante `BEHOLD` en `scripts/build.mjs`); el mismo ID sirve como widget y como JSON (`https://feeds.behold.so/<ID>`).
- El build lee el JSON una vez y pinta las últimas publicaciones en `.ig-grid` (`index.html` y `en/index.html`, el marcador `<!--cms:instagram-->` envuelve el `div`) con el diseño de la web: enlace a cada publicación, foto de behold.pictures (`sizes.small`/`medium`; las URL de Instagram caducan) y, al pasar el ratón, la primera línea del pie sin emojis (si va en mayúsculas, en minúsculas salvo los lugares de `LUGARES`). Si el feed no responde, se deja lo que había.
- No usar el widget de Behold (`<behold-widget>` + script): cada visita gasta una de las 1.200 vistas al mes del plan gratis y trae su propio diseño. Plan gratis: hasta 6 publicaciones, Behold actualiza el feed una vez al día.
- Cuántas publicaciones y en cuántas columnas se decide en Behold (ajustes del widget: número de publicaciones y de columnas; ahora 4 y 4). El build los lee (`numColumns` de `widgetSettings`) y los pasa a `.ig-grid` como `--ig-col`, `--ig-col-t` y `--ig-col-m`. Por debajo de 1050px, 5 o 6 columnas pasan a 3; en móvil, 4 o más pasan a la mitad (4 → 2×2). Para que no queden huecos, poner en Behold tantas publicaciones como columnas.
- La web se actualiza sola porque `publicar.yml` también se ejecuta cada día (ver «Publicación»): el build vuelve a leer el feed y, si hay publicaciones nuevas, sube la portada. GitHub solo ejecuta los `schedule` de la rama principal: empieza a funcionar al fusionar el PR #1.

## Idiomas (español + inglés)
- Español es el idioma principal (URLs sin prefijo); inglés vive en `/en/` con slugs propios. Equivalencias en `RUTAS` de `scripts/build.mjs`: `/`↔`/en/`, `/nosotros/`↔`/en/about/`, `/particulares/`↔`/en/buyers/`, `/profesionales/`↔`/en/professionals/`, `/contacto/`↔`/en/contact/`, `/gracias/`↔`/en/thanks/`. Legales solo en español (desde las páginas en inglés se enlazan con `hreflang="es"`). 404 en los dos idiomas: `/en/404.html` para lo que no exista bajo `/en/` (`en/.htaccess`) y `/404.html` para el resto (`.htaccess`).
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
- Formulario en inglés: mismos campos y mismo script (`/contacto/enviar.php`, campo oculto `idioma` = `en`); los valores de «tipo» se envían en español, el asunto lleva «(versión en inglés)» y redirige a `/en/thanks/`. Textos de `main.js` sin idioma fijo (el botón usa `data-sending`).
- Decap: `i18n` global `multiple_folders` (es, en; principal es). Promociones y Equipo con `i18n: true`; Textos con `structure: single_file` (Decap no admite otra estructura en colecciones de archivos). Campos `i18n: true` = se traducen (nombre de promoción, descripción, cargo, textos); `i18n: duplicate` = se copian del español al guardar (fotos, municipio, año, viviendas, tipo, estado, precio, enlace, orden, nombre de persona). «Más fotos» (lista) va sin `i18n` porque Decap no admite `duplicate` en listas: se edita solo en español y la web usa esas fotos en todos los idiomas.

### Añadir un idioma nuevo (ejemplo: alemán `de`)
1. `scripts/build.mjs`: añadir `de` a `IDIOMAS` (copiar el bloque `en` y traducir etiquetas, estados y tipos) y una columna `de: '/de/…/'` en cada fila de `RUTAS`.
2. Páginas: copiar `urbecan-web/en/` a `urbecan-web/de/` con las carpetas renombradas a los slugs de `RUTAS`; cambiar `<html lang="de">`, `og:locale`, title/description/canonical/og:url, textos de cabecera, pie, cookies y WhatsApp, enlaces internos (`/de/…`), `action` del formulario y `data-sending`. No tocar lo que hay entre marcadores `<!--cms:…-->`.
3. Datos: crear `data/promociones/de/` y `data/equipo/de/` (copias de `en/` traducidas) y añadir un bloque `"de": {…}` a cada `data/textos/*.json`.
4. `admin/config.yml`: añadir `de` a `i18n.locales`.
5. `node scripts/build.mjs` (regenera selector, hreflang y sitemap en todas las páginas) y revisar en local (`npx serve urbecan-web`).

## Publicación
- GitHub: `Urbecan/urbecan-web` (público, rama `main`). Es donde vive la web: código, textos, fotos y todo lo que se guarda desde el panel. El hosting solo recibe una copia.
- Hosting: Webempresa (web, dominio y correo). `.github/workflows/publicar.yml` (GitHub Actions) se ejecuta en cada push a `main`, también los del panel: `node scripts/build.mjs` y sube `urbecan-web/` por FTPS. Solo sube lo cambiado y guarda la lista en `.ftp-deploy-sync-state.json` en el servidor (el `.htaccess` lo bloquea, pero en Webempresa se sirve igual: ver «nginx» abajo). Tarda ~1 min.
  - Secretos en GitHub (Settings → Secrets and variables → Actions): `FTP_SERVIDOR`, `FTP_USUARIO`, `FTP_CONTRASENA` y, si la cuenta FTP no entra directamente en la carpeta de la web, `FTP_CARPETA` (terminada en `/`, p. ej. `public_html/`).
  - También se ejecuta cada día a las 6:00 UTC (`schedule`) para traer las publicaciones nuevas de Instagram; si nada ha cambiado, no sube nada. GitHub pausa los `schedule` de un repo público tras 60 días sin commits: si pasa, reactivarlo en Actions («Enable workflow»).
  - Republicar sin cambios: Actions → «Publicar en Webempresa» → Run workflow. No subir archivos a mano por cPanel: la publicación no los conoce.
- `.htaccess`: urbecan.com y http → https://www.urbecan.com (solo con ese dominio: en una dirección temporal no redirige), HTML con `Cache-Control: no-cache` (lo guardado en el panel se ve en cuanto se publica), sin listados de carpetas.
- nginx de Webempresa (comprobado el 22/10/2026): sirve directamente `.css`, `.js`, `.json`, `.txt` y las fotos, sin pasar por el `.htaccess`, con `Cache-Control: max-age=31536000` (1 año). Solo el HTML y el XML pasan por Apache. Por eso `.ftp-deploy-sync-state.json` se descarga aunque el `.htaccess` lo bloquee (solo lista nombres de archivo y hashes, ya públicos en el repo) y un CSS cambiado puede no verse (ver «Caché del CSS»).
- Formulario: `contacto/enviar.php` (PHP 7.4+, `mail()` del hosting) → aviso a info@urbecan.com con Reply-To del visitante. Honeypot `bot-field` y descarte de mensajes con más de 3 enlaces (a los bots se les manda a «gracias» sin enviar). Redirige a `/gracias/` o `/en/thanks/`. El remitente es info@urbecan.com y su buzón debe estar en Webempresa (si no, los avisos pueden ir a spam).
- Hasta octubre de 2026 se publicaba en Netlify (https://urbecan.netlify.app). Se cambió porque el plan gratuito (300 créditos/mes, 15 por publicación, el tráfico también gasta) pausó los despliegues y no da para que el cliente edite a diario. Tras el lanzamiento, borrar el sitio de Netlify.
- Google: la web solo se deja indexar en www.urbecan.com. El `.htaccess` añade `X-Robots-Tag: noindex, nofollow` en cualquier otra dirección (la temporal de Webempresa, pruebas), según el host (`SetEnvIfNoCase Host` + `Header … env=`). Así, al lanzar no hay que tocar nada: en cuanto el dominio apunte a Webempresa, Google puede indexarla. `robots.txt` deja pasar y lleva el `Sitemap:`. Siempre con `<meta name="robots" content="noindex,nofollow">`: `gracias/`, `en/thanks/`, los 404 y `admin/` (que además lleva la cabecera en `admin/.htaccess`). Comprobado en Webempresa el 22/10/2026: la dirección temporal y `admin/` llevan la cabecera; www.urbecan.com no.

## Contacto real
WhatsApp 656 61 15 00 · Tel. 922 08 07 17 / 922 32 63 48 · info@urbecan.com · Avda. Mayorazgo de Franchy 11, Local 4, 38300 La Orotava · L–V 9:00–14:30 y 15:00–19:00 · Instagram @inmobiliaria_urbecan
Propiedades: enlaces a https://diverso.casafaricrm.com/ (Casafari). Diverso (centro de negocios): https://diversoempresas.com

## Diseño
- Menú hamburguesa por debajo de 981px (`@media(max-width:980px)` en los bloques de `.nav`, `.mobile-toggle`, `.nav-close`, `.nav-extra`, `menu-open`): la cabecera en español no cabe con aire por debajo de ese ancho. El resto del diseño móvil sigue en 690px. En el menú las opciones largas parten en dos líneas.
Fuentes: Manrope (titulares) + DM Sans (texto). Colores: navy #08295d, ink #142235, arena #c4b18a, papel #f5f3ec, fondo #e8e5dc. No cambiar el diseño sin pedirlo.

## Estado y pendiente (actualizado 22/10/2026)

### Situación
- **Lanzada en https://www.urbecan.com el 22/10/2026**, con web, dominio y correo en **Webempresa** (panel «WePanel»). Comprobado ese día: http y sin www → https://www.urbecan.com, páginas en los dos idiomas, 404 en los dos idiomas, sin `X-Robots-Tag` en www.
  - Certificado Let's Encrypt de `urbecan.com` y `*.urbecan.com` (vale también para `mail.` y `webmail.`): WePanel → Seguridad → SSL/TLS → «Solicitar un certificado gratuito». Se renueva solo cada 3 meses mientras el dominio apunte a Webempresa. El área de cliente («Gestionar certificados») solo vende certificados de pago.
- **La web se publica en Webempresa** (PR #1 fusionado el 14/10/2026). Cada push a `main` la sube por FTPS en 1–2 min. También se ve en la dirección temporal del hosting (sale en WePanel; oculta a Google, ver «Publicación»).
  - La carpeta de urbecan.com es `public_html/urbecan.com/` y la cuenta FTP de la publicación entra directamente en ella (no hace falta `FTP_CARPETA`).
  - La dirección temporal muestra `public_html`, no `public_html/urbecan.com/`. Para que se vea la web, hay un `.htaccess` puesto a mano en `public_html` (fuera del repo) que reescribe ese host a `/urbecan.com/`. **Borrarlo en cuanto la «Decap CMS login URL» apunte a www.urbecan.com** (hasta entonces el panel entra por la dirección temporal), junto con `public_html/urbecan.com/prueba.txt`.
  - WePanel → Seguridad → **Seguridad FTP** solo deja entrar por FTP desde España. La cuenta de la publicación está en su lista blanca porque GitHub Actions entra desde EE. UU. (sin eso, la publicación falla con «530 Login authentication failed»). Si se crea otra cuenta FTP para publicar, añadirla también.
- Netlify ya no se usa (se quedó sin créditos el 12/10/2026). Se puede borrar el sitio: la «Decap CMS login URL» de DecapBridge ya apunta a la dirección temporal (ver «Panel» en «Pendiente nuestro»).
- Subir cambios: desde la terminal, `git push` da 403 (la cuenta V-Figueroa no tiene permiso en el repo); se sube con «Push origin» en GitHub Desktop.
- **Dominio:** urbecan.com está registrado en **Webempresa** desde el 21/10/2026 (antes en Dinahosting, en la cuenta que gestiona Inmovilla). Nameservers `ns7021.webempresa.eu` y `ns7022.webempresa.eu` desde el 22/10/2026. Se cambian en el área de cliente de Webempresa, no en WePanel: Dominios → urbecan.com → «Cambiar los nameservers del dominio». La zona DNS se edita en WePanel.
  - Al terminar el traslado, Dinahosting borró la zona y el dominio siguió apuntando a sus nameservers: la web y el correo estuvieron caídos (SERVFAIL) hasta el cambio del 22/10/2026. Los .com guardan los nameservers hasta 48 h, así que algunas redes tardaron en ver el cambio.
  - Correo: configurar cada Outlook con la «Guía de correo» (octubre de 2026): POP en `cp7066.webempresa.eu`, entrada 995 y salida 465 con SSL, sin dejar copia en el servidor; webmail en `https://cp7066.webempresa.eu:2443/login/webmail/`. Falta confirmar que está hecho en todos los ordenadores.
  - El correo antiguo no está en el servidor: lo descargaban por POP a Outlook. No hay que migrarlo; solo hacer la copia `.pst` de cada Outlook. Más adelante, con espacio ilimitado, conviene pasar a IMAP.
  - Zona DNS en Webempresa revisada: MX, DKIM y DMARC bien; el SPF incluye `include:externo.inmovilla.com` porque Inmovilla envía correo como @urbecan.com.

### Pedido al cliente (12/10/2026) y respuestas (13/10/2026)
1. Contratar el hosting en Webempresa y pasarnos el acceso. **Hecho (14/10/2026):** hosting contratado y buzones creados (los 6 de siempre y 2 nuevos; la lista no se escribe aquí).
2. Datos legales de URBECAN INVEST S.L.U. **Hecho:** CIF, domicilio y Registro Mercantil ya están en `aviso-legal/` y `privacidad/`.
3. Código de verificación de Google Business (llega al móvil del cliente). **Pendiente:** el cliente no reconoce el número al que Google manda el código; hay que aclarárselo. No escribir el número aquí.
4. Instagram. **Hecho:** feed de Behold conectado (ver «Instagram»). La cuenta es @inmobiliaria_urbecan. El cliente nos pasó por WhatsApp la contraseña de Instagram: no guardarla en ningún sitio y recomendarle cambiarla.
5. Reseñas en Google de clientes reales. **Pospuesto:** el cliente prefiere ocultar la sección por ahora (ya oculta, ver «Pendiente nuestro»).
6. Emails de quienes van a usar el panel. **Hecho:** uno solo, un Gmail nuevo de Urbecan con la contraseña compartida entre las dos personas que editarán la web. La dirección no se escribe aquí porque el repo es público: la tiene el usuario y, tras invitarla, sale en los usuarios del sitio en DecapBridge.
7. Fotos de la oficina o del equipo. **Sin fecha:** no hay fachada que fotografiar (Urbecan está dentro de Diverso, con un cartel pequeño) ni foto del equipo junto; el cliente quiere organizar una sesión más adelante.
8. Los Trazos y Antonia María. **Hecho:** Urbanización Los Trazos (La Orotava, 2016, 6 adosados, vendida) y Residencial Antonia María a 305.000 €. Falta confirmar si ese precio es «desde» (hay adosados de 3 y 4 dormitorios); si lo es, poner «Desde 305.000 €» en el panel.

### Pendiente nuestro
- **Reseñas de la portada (`.rv-track` en `index.html` y `en/index.html`, fijas en el HTML, no en el panel):** las 5 actuales (Carmen R., Daniel y Sara, Miguel Á. H., Promociones del Norte, Laura P.) son de ejemplo y no se pueden publicar. No poner reseñas inventadas.
  - **Oculta desde el 13/10/2026** (`<div class="reviews" hidden>`), de acuerdo con el cliente. Las secciones siguientes se renumeraron: «05 / Actualidad» y «06 / Empecemos» (en inglés «05 / News», «06 / Let’s begin»). Para volver a mostrarla: quitar `hidden` y devolverlas a 06 y 07.
  - Decidido: 3 reseñas reales de 4–5★, fijas, con la fecha como mes y año, y «Ver todas en Google» con el enlace «Compartir perfil» de la ficha (ahora apunta a una búsqueda genérica de Maps).
  - La ficha aún tiene pocas reseñas: no enlazarla todavía.
  - Descartados: Trustindex (gratis solo con su plugin de WordPress; en webs normales el widget gratis dura 7 días; plan Single 65 $/año) y Places API de Google (pide Google Cloud con facturación; máx. 5 reseñas por consulta; no se pueden guardar).
- **Panel:** con DecapBridge gratis solo invita el dueño de la cuenta (nosotros), hasta 10 personas por web. El rol de administrador para que invite el cliente es de pago (9 $/mes o 199 $ en pago único). Decidido: invitamos nosotros a un único usuario, el Gmail de Urbecan (punto 6), con el plan gratis. **Invitado el 19/10/2026**, sin esperar al lanzamiento (lo guardado en el panel se publica en Webempresa desde el 14/10/2026). La «Decap CMS login URL» es `https://<dirección temporal>/admin/` (tiene que ser https: el login PKCE no funciona en http). También hay una invitación antigua a info@urbecan.com sin aceptar. Propiedad del sitio: DecapBridge → Settings → «Transfer ownership», solo a un colaborador que ya exista; el dueño anterior pasa a colaborador y ya no puede cambiar ajustes ni invitar. Desde el 22/10/2026 lo que guarden se ve en www.urbecan.com. **Falta cambiar la URL a https://www.urbecan.com/admin/** y avisarles (mismo usuario y contraseña); mientras tanto la dirección temporal sigue sirviendo, mientras exista el `.htaccess` puesto a mano en `public_html`. Lo guardan directamente en `main`: antes de trabajar en local, «Fetch origin» / «Pull» en GitHub Desktop. Al aceptar, que creen una contraseña de DecapBridge y no usen «Continuar con Google»: así las dos personas comparten solo esa contraseña y Google no les pide códigos al entrar en el Gmail desde otro ordenador. Después, probar con ellos un cambio pequeño desde el panel. El sitio de DecapBridge ya está creado (sitio «Urbecan», auth PKCE, token GitHub sin caducidad solo con Contents de `urbecan-web`).
- **Caché del CSS (propuesto, falta que el usuario decida; más urgente desde el lanzamiento):** `styles.css` y `main.js` se enlazan sin versión y en Webempresa nginx los sirve con caché de 1 año sin revalidar (ver «Publicación»). Tras un cambio de estilos, quien ya visitó la web puede verla con el HTML nuevo y el CSS viejo durante meses (pasó en local el 13/10/2026 con la cuadrícula de Instagram). Propuesta: que el build añada `?v=<hash del archivo>` a esos enlaces en todas las páginas.
- **Cookies (14/10/2026):** la web no usa cookies. Las fotos de Instagram llegan de behold.pictures y las fuentes de Google Fonts, sin cookies; Search Console tampoco pone. Por eso se quitó el aviso de cookies de todas las páginas (y su código en `main.js`) y `cookies/` explica eso. Los estilos `.cookie` siguen en `styles.css` por si vuelve. **Volver a poner el aviso («Aceptar / Rechazar», sin cargar nada hasta que acepten) y actualizar `cookies/` si se añade algo que ponga cookies:**
  - Google Analytics (el cliente lo quiere más adelante, ahora no).
  - Un mapa de Google incrustado o un widget de reseñas (Trustindex, Elfsight…).
  - Un simple enlace a la ficha de Google Business o a Maps no pone cookies y no cambia nada.
- **Otros:** og:image 1200×630 (ahora no hay), redirecciones 301 de las URLs de la web antigua de Inmovilla (desde el 22/10/2026 dan 404), guía corta del panel, pruebas en móvil, tablet y escritorio.
- **Formulario PHP:** probado en local solo con Apache (sin PHP en el Mac). Probar en www.urbecan.com un envío en cada idioma (el aviso llega al buzón de info@ en Webempresa).
- **Gestión patrimonial (14/10/2026):** bloque «Alquila tu vivienda» en Particulares (`.rent-block`, `#alquilar` / `#rent` en inglés), con acceso «Alquilar ↓» arriba y opción «Alquilar» en el formulario. Texto pasado por Coré Socas; sin cifra en el adelanto de reparaciones (lo pidió el cliente). El párrafo se edita en el panel (Textos → Particulares); titular y lista van fijos en el HTML.
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
- Por sustituir con fotos del norte (formato):
  - Portada del inicio `.hero-photo` (`foto-01`, 16:9).
  - «Nuestra mirada» grande `.who-big` (`foto-04`, la panorámica que era la cabecera de Nosotros; se recorta a 3:2) y pequeña `.who-small` (`foto-03`, 4:5).
  - «Encontrar» y «Promocionar» del inicio siguen con `foto-02` y `foto-04` (esta se repite en Nosotros). `foto-05` ya no se usa (era casi igual que `foto-01`).
- Nosotros (16/10/2026): la cabecera es el equipo y va sin foto: titular «Personas detrás de cada decisión» (`nosotros.equipo_titulo`) y entradilla del equipo (`equipo_intro`), después Diverso, las fichas y los valores. «Más que una inmobiliaria» (`nosotros.titulo` y `texto`) pasa a titular de sección (`.who-head`) encima de las fotos de «Nuestra mirada». El usuario no quiere foto en esa cabecera; si hay foto real del grupo, va en `figure.team-photo` (oculta).
- No subir a Google Business las fotos decorativas (son imágenes generadas, no fotos reales del negocio).

### Google Business
- Descripción preparada (704 de 750 caracteres). Antes de usar la frase de las 300 viviendas, confirmar con el cliente que esas 13 promociones las comercializó Urbecan (las vendidas de la web suman 328 viviendas):
  > Urbecan es una inmobiliaria en La Orotava que acompaña desde 2003 a quienes quieren comprar, vender o invertir en una vivienda en el norte de Tenerife: La Orotava, Puerto de la Cruz, Los Realejos, La Laguna, Tacoronte, Icod de los Vinos y alrededores. Para particulares: búsqueda de vivienda, valoración y venta de tu propiedad, visitas, financiación y acompañamiento hasta la firma en notaría. Para promotores: comercialización de obra nueva con estrategia, marketing y seguimiento de cada promoción. Hemos comercializado más de 300 viviendas en 13 promociones del norte de la isla. Trato cercano y un equipo propio de asesoría inmobiliaria, procesos notariales, administración y gestión patrimonial.
- Categoría principal: Agencia inmobiliaria; secundaria: Consultor inmobiliario. El teléfono público debería ser el de la web (922 08 07 17).
- Logo cuadrado con margen para la ficha: `urbecan-logo-google.png` (1080×1080), en la carpeta de entrega `Downloads/entrega-web 3/urbecan-web/google-business/`. Se genera a partir de `favicon.svg`.

## Plan de lanzamiento en Webempresa
1. ✅ Contratar Webempresa con urbecan.com como dominio principal, sin tocar todavía el DNS.
2. ✅ En WePanel: crear los mismos buzones que hay hoy (al menos info@urbecan.com) y una cuenta FTP limitada a la carpeta de la web.
3. ✅ En GitHub, poner los secretos de FTP (ver «Publicación») y la cuenta FTP en la lista blanca de «Seguridad FTP».
4. ✅ Fusionar la rama `webempresa` en `main` y hacer push. Comprobar en Actions que la publicación termina en verde.
5. Probar en la dirección temporal de Webempresa (o con el archivo hosts): páginas y fotos, 404 en los dos idiomas, formulario en los dos idiomas (el aviso llega al buzón de Webempresa) y una edición desde el panel que salga publicada ~1 min después.
6. ✅ (22/10/2026) Nameservers de urbecan.com a Webempresa: web y correo pasaron a la vez. Falta: configurar cada Outlook y comprobar envío y recepción de correo.
7. ✅ (22/10/2026) Certificado SSL (Let's Encrypt) para urbecan.com y `*.urbecan.com`; todo redirige a https://www.urbecan.com.
8. ✅ Automático (19/10/2026): el `.htaccess` solo oculta a Google lo que no sea www.urbecan.com y `robots.txt` ya lleva el `Sitemap:` (ver «Publicación»). Comprobado el 22/10/2026: www.urbecan.com no lleva `X-Robots-Tag`.
9. DecapBridge: «Decap CMS login URL» → https://www.urbecan.com/admin/ y probar el login. Si aún no está invitado, invitar al Gmail de Urbecan (único usuario del panel, ver «Pedido al cliente») y comprobar con el cliente que entra.
10. Search Console (enviar sitemap), Google Business, borrar el sitio de Netlify. (El registro del dominio ya está en Webempresa desde el 21/10/2026.)

## Checklist de lanzamiento

### Funcionamiento
- [ ] Formulario de contacto (PHP en Webempresa): avisos a info@urbecan.com y redirección a /gracias/ y /en/thanks/
- [x] Publicación automática desde GitHub a Webempresa (Actions en verde; falta probar un cambio desde el panel)
- [ ] Panel Decap CMS en /admin con login por email (DecapBridge) y el Gmail de Urbecan invitado
- [ ] Pruebas en móvil, tablet y escritorio (Safari, Chrome, Firefox)

### Correo y dominio (no tocar DNS sin confirmación)
- [x] Confirmar con Inmovilla dónde están el dominio urbecan.com y el correo
- [ ] Crear los buzones en Webempresa (hecho) y configurar cada Outlook (falta confirmar)
- [x] Apuntar urbecan.com a Webempresa (www y sin www, HTTPS) — 22/10/2026
- [ ] Redirecciones 301 de las URLs de la web antigua a las nuevas (en `.htaccess`)

### Google y visibilidad
- [x] Quitar el noindex y añadir `Sitemap:` a robots.txt (automático según el host; comprobar con `curl -sI` al lanzar)
- [ ] Alta en Google Search Console y envío de sitemap.xml
- [ ] Actualizar la ficha de Google Business con la web nueva
- [ ] Analítica: más adelante (decidido el 14/10/2026). Si es GA4, volver a poner el aviso de cookies (ver «Cookies»)

### Detalles
- [x] Favicon y apple-touch-icon (`favicon.ico`, `favicon.svg`, `apple-touch-icon.png` en la raíz de urbecan-web; enlazados en cada página)
- [ ] Imagen para compartir (og:image 1200×630) en todas las páginas
- [x] Aviso de cookies ajustado a lo que se use de verdad (sin aviso: la web no usa cookies; ver «Cookies»)
- [x] Textos legales con los datos de URBECAN INVEST S.L.U. y sin la nota de ejemplo
- [x] Sustituir fotos de ejemplo e histórico real de promociones vendidas

### Entrega
- [ ] Transferir GitHub (organización Urbecan) a info@urbecan.com y dejar Webempresa a nombre del cliente
- [ ] Guía corta de uso del panel para el cliente (PDF o página en /admin)
