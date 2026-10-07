// Rellena el HTML con los datos editables de urbecan-web/data/ (panel Decap CMS en /admin/):
// promociones/<idioma>/*.json y equipo/<idioma>/*.json (una entrada por archivo) y textos/<página>.json ({ es: {…}, en: {…} }).
// Sustituye el contenido entre <!--cms:tipo:clave--> y <!--/cms--> en cada página, según el idioma de la página
// (carpeta /en/… → inglés; el resto → español). También genera el selector de idioma, las etiquetas hreflang y sitemap.xml.
// Es idempotente: se puede ejecutar en local (node scripts/build.mjs) y en Netlify.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const SITE = new URL('../urbecan-web/', import.meta.url).pathname;
const DATA = join(SITE, 'data');
const DOMINIO = 'https://www.urbecan.com';

// ── Idiomas. El primero es el principal (sin prefijo en la URL); el resto van en /<código>/.
// Para añadir uno: ver «Idiomas» en CLAUDE.md.
const IDIOMAS = {
  es: {
    etiqueta: 'ES', nombre: 'Español', aria: 'Idioma', version: 'Versión en español',
    estados: {}, tipos: {}, desde: 'Desde', precios: {},
    solicitar: 'Solicitar información', verProyecto: 'Ver proyecto', vendida: 'Vendida',
    fotoAnt: 'Foto anterior', fotoSig: 'Foto siguiente', foto: 'foto',
    meInteresa: (n) => `Me interesa ${n}.`,
  },
  en: {
    etiqueta: 'EN', nombre: 'English', aria: 'Language', version: 'English version',
    // Los valores de estado y tipo se guardan en español (campos «duplicate» del panel); aquí su traducción
    estados: { 'En comercialización': 'On sale', 'Últimas unidades': 'Last units', 'Próximamente': 'Coming soon', 'Vendida': 'Sold' },
    tipos: { viviendas: 'homes', apartamentos: 'apartments', villas: 'villas', 'dúplex': 'duplexes', 'áticos': 'penthouses', locales: 'commercial units' },
    desde: 'From', precios: { consultar: 'Price on request' },
    solicitar: 'Request information', verProyecto: 'View project', vendida: 'Sold',
    fotoAnt: 'Previous photo', fotoSig: 'Next photo', foto: 'photo',
    meInteresa: (n) => `I am interested in ${n}.`,
  },
};
const PRINCIPAL = Object.keys(IDIOMAS)[0];
const prefijo = (l) => (l === PRINCIPAL ? '' : `/${l}`);

// ── Páginas equivalentes entre idiomas (selector de idioma, hreflang y sitemap).
// Las páginas que no están aquí (legales, 404) solo existen en español: el selector lleva al inicio de cada idioma.
const RUTAS = [
  { es: '/', en: '/en/' },
  { es: '/nosotros/', en: '/en/about/' },
  { es: '/particulares/', en: '/en/buyers/' },
  { es: '/profesionales/', en: '/en/professionals/' },
  { es: '/contacto/', en: '/en/contact/' },
  { es: '/gracias/', en: '/en/thanks/', sitemap: false },
];
const CONTACTO = RUTAS.find((r) => r.es === '/contacto/');

const readJSON = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));
const jsons = (dir) => (existsSync(join(DATA, dir)) ? readdirSync(join(DATA, dir)).filter((f) => f.endsWith('.json')).sort() : []);
const porOrden = (a, b) => (a.orden ?? 999) - (b.orden ?? 999) || String(a.nombre).localeCompare(String(b.nombre), 'es');
// Las entradas del idioma principal mandan; la traducción se superpone (si falta, se usa el texto principal)
const carpeta = (dir, l) => jsons(join(dir, PRINCIPAL))
  .map((f) => {
    const base = readJSON(join(dir, PRINCIPAL, f));
    const trad = l !== PRINCIPAL && existsSync(join(DATA, dir, l, f)) ? readJSON(join(dir, l, f)) : {};
    return { ...base, ...Object.fromEntries(Object.entries(trad).filter(([, v]) => v !== '' && v != null)) };
  })
  .sort(porOrden);

const textosDe = (l) => Object.fromEntries(jsons('textos').map((f) => {
  const t = readJSON(join('textos', f));
  return [f.replace(/\.json$/, ''), { ...t[PRINCIPAL], ...t[l] }];
}));
const datos = Object.fromEntries(Object.keys(IDIOMAS).map((l) => [l, { textos: textosDe(l), promociones: carpeta('promociones', l), equipo: carpeta('equipo', l) }]));

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Formato sencillo para el panel: *texto* → cursiva/destacado, [texto] → segundo tono, salto de línea → <br>
const fmt = (s) => esc(String(s ?? '').trim())
  .replace(/\*([^*]+)\*/g, '<em>$1</em>')
  .replace(/\[([^\]]+)\]/g, '<span>$1</span>')
  .replace(/\r?\n/g, '<br>');

const texto = (d, clave) => {
  const v = clave.split('.').reduce((o, k) => o?.[k], d.textos);
  if (v === undefined) throw new Error(`Falta el texto "${clave}" en data/textos/`);
  return v;
};

// «Desde 245.000 €» → <span>Desde</span><strong>245.000 €</strong>; cualquier otro texto («Consultar») va entero en <strong>
const precio = (t, ui) => {
  const s = String(t).trim();
  const m = s.match(/^(desde)\s+(.+)$/i);
  return m ? `<span>${esc(ui.desde)}</span><strong>${esc(m[2])}</strong>` : `<strong>${esc(ui.precios[s.toLowerCase()] ?? s)}</strong>`;
};
const fotos = (p) => [p.image, ...(p.galeria || [])].filter(Boolean);

const promoActiva = (p, ui, l) => {
  const imgs = fotos(p);
  const slides = imgs.map((src, i) => `<div class="ps-slide"><img src="${esc(src)}" alt="${esc(p.nombre)}${imgs.length > 1 ? `, ${ui.foto} ${i + 1}` : ''}" loading="lazy"></div>`).join('');
  const ctrl = imgs.length > 1
    ? `<div class="ps-ctrl"><button type="button" class="ps-prev" aria-label="${ui.fotoAnt}">←</button><span class="ps-count">1 / ${imgs.length}</span><button type="button" class="ps-next" aria-label="${ui.fotoSig}">→</button></div>`
    : '';
  const meta = String(p.precio ?? '').trim() ? `<div class="promo-meta">${precio(p.precio, ui)}</div>` : '';
  const ext = p.enlace ? `<a class="textlink" href="${esc(p.enlace)}" target="_blank" rel="noopener">${ui.verProyecto} <span class="arr">↗</span></a>` : '';
  const msg = ui.meInteresa(`${p.nombre}${p.municipio ? ` (${p.municipio})` : ''}`);
  // data-ask: valor del formulario (siempre en español, así llega a info@urbecan.com)
  return `<article class="promo-card"><div class="promo-slider"><div class="ps-track">${slides}</div><span class="promo-state">${esc(ui.estados[p.estado] ?? p.estado)}</span>${ctrl}</div>`
    + `<div class="promo-info"><span class="label">${esc(p.municipio)}</span><h3>${esc(p.nombre)}</h3>${p.descripcion ? `<p>${esc(p.descripcion)}</p>` : ''}${meta}`
    + `<a class="textlink" href="${CONTACTO[l]}" data-ask="Comprar" data-msg="${esc(msg)}">${ui.solicitar} <span class="arr">→</span></a>${ext}</div></article>`;
};

const promoVendida = (p, ui) => {
  const lugar = [p.municipio, p.anio].filter(Boolean).join(' · ');
  const tipo = p.tipo || 'viviendas';
  const unidades = p.viviendas ? `<p>${esc(p.viviendas)} ${esc(ui.tipos[tipo] ?? tipo)}</p>` : '';
  return `<article class="sold-item"><div class="sold-img"><img src="${esc(p.image)}" alt="${esc(p.nombre)}" loading="lazy"><span class="promo-state">${ui.vendida}</span></div>`
    + `<span class="label">${esc(lugar)}</span><h3>${esc(p.nombre)}</h3>${unidades}</article>`;
};

const persona = (m) => `<figure><div class="tp"><img src="${esc(m.image)}" alt="${esc(m.nombre)}" loading="lazy"></div><figcaption><strong>${esc(m.nombre)}</strong><span>${esc(m.cargo)}</span></figcaption></figure>`;

// ── Idioma de cada página: /en/… → en; el resto → idioma principal
const urlDe = (file) => '/' + relative(SITE, file).replace(/index\.html$/, '');
const idiomaDe = (url) => Object.keys(IDIOMAS).find((l) => l !== PRINCIPAL && url.startsWith(`/${l}/`)) ?? PRINCIPAL;
const rutaDe = (url) => RUTAS.find((r) => Object.values(r).includes(url));

// Página equivalente en otro idioma (o su inicio si no la hay)
const equivalente = (url, c) => rutaDe(url)?.[c] ?? `${prefijo(c)}/`;
// Cabecera de escritorio: un enlace a cada uno de los otros idiomas («EN» en español, «ES» en inglés)
const otroIdioma = (url, l) => Object.entries(IDIOMAS).filter(([c]) => c !== l)
  .map(([c, i]) => `<a class="nav-lang-link" href="${equivalente(url, c)}" lang="${c}" hreflang="${c}" aria-label="${i.version}">${i.etiqueta}</a>`).join('');
// Selector completo «ES · EN» (menú móvil y pie)
const selector = (url, l) => {
  const enlaces = Object.entries(IDIOMAS).map(([c, i]) => {
    const href = equivalente(url, c);
    return c === l
      ? `<a href="${href}" lang="${c}" hreflang="${c}" aria-current="true" title="${i.nombre}">${i.etiqueta}</a>`
      : `<a href="${href}" lang="${c}" hreflang="${c}" title="${i.nombre}">${i.etiqueta}</a>`;
  });
  return `<div class="nav-lang" role="group" aria-label="${IDIOMAS[l].aria}">${enlaces.join('<span aria-hidden="true">·</span>')}</div>`;
};
// <link rel="alternate" hreflang> entre versiones (x-default = idioma principal)
const alternos = (r) => [...Object.keys(IDIOMAS).filter((c) => r[c]).map((c) => [c, r[c]]), ['x-default', r[PRINCIPAL]]];
const hreflang = (url) => {
  const r = rutaDe(url);
  return r ? alternos(r).map(([c, h]) => `<link rel="alternate" hreflang="${c}" href="${DOMINIO}${h}">`).join('') : '';
};

const bloques = {
  t: (d, ui, l, clave) => fmt(texto(d, clave)),
  nota: (d, ui, l, clave) => (String(texto(d, clave)).trim() ? `<span class="rv-note">${fmt(texto(d, clave))}</span>` : ''),
  'promos-activas': (d, ui, l) => d.promociones.filter((p) => p.estado !== 'Vendida').map((p) => promoActiva(p, ui, l)).join(''),
  'promos-vendidas': (d, ui) => d.promociones.filter((p) => p.estado === 'Vendida').map((p) => promoVendida(p, ui)).join(''),
  equipo: (d) => d.equipo.map(persona).join(''),
  idiomas: (d, ui, l, clave, url) => selector(url, l),
  idioma: (d, ui, l, clave, url) => otroIdioma(url, l),
  hreflang: (d, ui, l, clave, url) => hreflang(url),
};

const MARCA = /<!--cms:([\w-]+)(?::([\w.]+))?-->[\s\S]*?<!--\/cms-->/g;

const paginas = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  if (statSync(p).isDirectory()) return ['data', 'assets', 'admin'].includes(f) ? [] : paginas(p);
  return f.endsWith('.html') ? [p] : [];
});

const escribir = (file, nuevo) => {
  if (existsSync(file) && readFileSync(file, 'utf8') === nuevo) return 0;
  writeFileSync(file, nuevo);
  console.log('actualizado', relative(SITE, file));
  return 1;
};

let cambios = 0;
for (const file of paginas(SITE)) {
  const url = urlDe(file);
  const l = idiomaDe(url);
  const html = readFileSync(file, 'utf8');
  const lang = html.match(/<html lang="([\w-]+)"/)?.[1];
  if (lang !== l) throw new Error(`${relative(SITE, file)}: <html lang="${lang}"> no coincide con el idioma de la carpeta (${l})`);
  const nuevo = html.replace(MARCA, (_, tipo, clave) => {
    if (!bloques[tipo]) throw new Error(`Bloque desconocido "${tipo}" en ${relative(SITE, file)}`);
    return `<!--cms:${tipo}${clave ? ':' + clave : ''}-->${bloques[tipo](datos[l], IDIOMAS[l], l, clave, url)}<!--/cms-->`;
  });
  cambios += escribir(file, nuevo);
}

// sitemap.xml con todas las versiones y sus alternativas
const urls = RUTAS.filter((r) => r.sitemap !== false).flatMap((r) => Object.keys(IDIOMAS).filter((c) => r[c]).map((c) =>
  `  <url><loc>${DOMINIO}${r[c]}</loc>${alternos(r).map(([h, u]) => `<xhtml:link rel="alternate" hreflang="${h}" href="${DOMINIO}${u}"/>`).join('')}</url>`));
cambios += escribir(join(SITE, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generado por scripts/build.mjs (no editar a mano) -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`);
console.log(`Build terminado: ${cambios} archivo(s) actualizado(s).`);
