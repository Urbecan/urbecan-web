# Urbecan — web

Web estática (HTML + CSS + JS, sin framework) de Urbecan Inmobiliaria (URBECAN INVEST S.L.U., La Orotava, Tenerife).

## Estructura
- `urbecan-web/` → carpeta publicada (netlify.toml en la raíz: `publish = "urbecan-web"`)
  - `index.html` inicio · `nosotros/` · `particulares/` · `profesionales/` · `contacto/`
  - `aviso-legal/` `privacidad/` `cookies/` `gracias/` · `404.html`
  - `assets/css/styles.css` · `assets/js/main.js` · `assets/img/*.jpg` · logos en `assets/`
- Cabecera y pie están repetidos en cada página: si cambias uno, cámbialo en todas.
- Rutas absolutas (`/assets/...`, `/nosotros/`). Para probar en local: `npx serve urbecan-web`.

## Panel de edición (Decap CMS + DecapBridge)
- Panel en `urbecan-web/admin/` → urbecan.com/admin. Decap CMS (CDN, versión fijada en `admin/index.html`) con logo de Urbecan e interfaz en español. Config: `admin/config.yml` (promociones, equipo y textos principales). Fotos subidas → `urbecan-web/assets/img/uploads/`.
- Login del cliente con email y contraseña vía DecapBridge (decapbridge.com, backend `git-gateway`), sin cuenta de GitHub. Los usuarios se invitan desde el panel de DecapBridge.
- Datos en `urbecan-web/data/*.json` (raíz siempre objeto: `{"promociones": [...]}`, `{"equipo": [...]}`; Decap no admite listas en la raíz). `node scripts/build.mjs` los vuelca al HTML entre marcadores `<!--cms:tipo:clave-->…<!--/cms-->` (no editar a mano ese contenido; editar el JSON). Idempotente; Netlify lo ejecuta en cada deploy.
- Formato en textos: `*texto*` → `<em>`, `[texto]` → `<span>` (segundo tono), salto de línea → `<br>`.
- Probar el panel en local sin login: `npx decap-server` (raíz del repo) + servir `urbecan-web` en localhost → /admin/ (`local_backend: true`). Ejecutar el build antes de probar la web si cambian los JSON.

## Publicación
- GitHub: `Urbecan/urbecan-web` (público, rama `main`).
- Netlify despliega solo en cada push → https://urbecan.netlify.app
- Provisional: oculta a Google (`robots.txt` Disallow + `<meta name="robots" content="noindex,nofollow">` en cada página). Quitar al lanzar en urbecan.com y añadir `Sitemap:` a robots.txt.

## Contacto real
WhatsApp 656 61 15 00 · Tel. 922 08 07 17 / 922 32 63 48 · info@urbecan.com · Avda. Mayorazgo de Franchy 11, Local 4, 38300 La Orotava · L–V 9:00–14:00 y 16:30–19:30 · Instagram @urbecan
Propiedades: enlaces a https://diverso.casafaricrm.com/ (Casafari). Diverso (centro de negocios): https://diversoempresas.com

## Diseño
Fuentes: Manrope (titulares) + DM Sans (texto). Colores: navy #08295d, ink #142235, arena #c4b18a, papel #f5f3ec, fondo #e8e5dc. No cambiar el diseño sin pedirlo.

## Pendiente (en orden)
1. Panel de edición con Decap CMS en `/admin/` (login email + contraseña vía DecapBridge, sin GitHub). Hecho en el repo (ver «Panel de edición»). Falta:
   - Crear el sitio en decapbridge.com (repo `Urbecan/urbecan-web`, rama `main`, token de GitHub con permiso de lectura/escritura en Contents) y pegar el bloque `backend` que genera en `admin/config.yml` (ahora tiene `ID_DEL_SITIO` de marcador).
   - Invitar al cliente por email desde DecapBridge (plan gratuito: 3 sitios, 10 colaboradores).
   - Al lanzar: cambiar `site_url`/`display_url` de `admin/config.yml` a https://www.urbecan.com.
2. Formulario de contacto real (Netlify Forms: `data-netlify="true"`, redirigir a `/gracias/`). Ahora es simulado.
3. Sustituir fotos de ejemplo por las nuevas del norte y el histórico real de promociones vendidas.
4. Textos legales definitivos y datos fiscales (pendientes del cliente).
5. Lanzamiento: dominio urbecan.com (ahora en Inmovilla; no tocar DNS sin confirmar dónde está el correo), quitar noindex, enviar sitemap a Search Console.
