// Rellena el HTML con los datos editables de urbecan-web/data/ (panel Decap CMS en /admin/):
// promociones/*.json y equipo/*.json (una entrada por archivo) y textos/<página>.json.
// Sustituye el contenido entre <!--cms:tipo:clave--> y <!--/cms--> en cada página.
// Es idempotente: se puede ejecutar en local (node scripts/build.mjs) y en Netlify.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SITE = new URL('../urbecan-web/', import.meta.url).pathname;
const DATA = join(SITE, 'data');
const readJSON = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));
const jsons = (dir) => readdirSync(join(DATA, dir)).filter((f) => f.endsWith('.json')).sort();
const porOrden = (a, b) => (a.orden ?? 999) - (b.orden ?? 999) || String(a.nombre).localeCompare(String(b.nombre), 'es');
const carpeta = (dir) => jsons(dir).map((f) => readJSON(join(dir, f))).sort(porOrden);

const textos = Object.fromEntries(jsons('textos').map((f) => [f.replace(/\.json$/, ''), readJSON(join('textos', f))]));
const promociones = carpeta('promociones');
const equipo = carpeta('equipo');

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Formato sencillo para el panel: *texto* → cursiva/destacado, [texto] → segundo tono, salto de línea → <br>
const fmt = (s) => esc(String(s ?? '').trim())
  .replace(/\*([^*]+)\*/g, '<em>$1</em>')
  .replace(/\[([^\]]+)\]/g, '<span>$1</span>')
  .replace(/\r?\n/g, '<br>');

const texto = (clave) => {
  const v = clave.split('.').reduce((o, k) => o?.[k], textos);
  if (v === undefined) throw new Error(`Falta el texto "${clave}" en data/textos/`);
  return v;
};

// «Desde 245.000 €» → <span>Desde</span><strong>245.000 €</strong>; cualquier otro texto («Consultar») va entero en <strong>
const precio = (t) => {
  const m = String(t).trim().match(/^(desde)\s+(.+)$/i);
  return m ? `<span>${esc(m[1])}</span><strong>${esc(m[2])}</strong>` : `<strong>${esc(String(t).trim())}</strong>`;
};
const fotos = (p) => [p.image, ...(p.galeria || [])].filter(Boolean);

const promoActiva = (p) => {
  const imgs = fotos(p);
  const slides = imgs.map((src, i) => `<div class="ps-slide"><img src="${esc(src)}" alt="${esc(p.nombre)}${imgs.length > 1 ? `, foto ${i + 1}` : ''}" loading="lazy"></div>`).join('');
  const ctrl = imgs.length > 1
    ? `<div class="ps-ctrl"><button type="button" class="ps-prev" aria-label="Foto anterior">←</button><span class="ps-count">1 / ${imgs.length}</span><button type="button" class="ps-next" aria-label="Foto siguiente">→</button></div>`
    : '';
  const meta = String(p.precio ?? '').trim() ? `<div class="promo-meta">${precio(p.precio)}</div>` : '';
  const ext = p.enlace ? `<a class="textlink" href="${esc(p.enlace)}" target="_blank" rel="noopener">Ver proyecto <span class="arr">↗</span></a>` : '';
  const msg = `Me interesa ${p.nombre}${p.municipio ? ` (${p.municipio})` : ''}.`;
  return `<article class="promo-card"><div class="promo-slider"><div class="ps-track">${slides}</div><span class="promo-state">${esc(p.estado)}</span>${ctrl}</div>`
    + `<div class="promo-info"><span class="label">${esc(p.municipio)}</span><h3>${esc(p.nombre)}</h3>${p.descripcion ? `<p>${esc(p.descripcion)}</p>` : ''}${meta}`
    + `<a class="textlink" href="/contacto/" data-ask="Comprar" data-msg="${esc(msg)}">Solicitar información <span class="arr">→</span></a>${ext}</div></article>`;
};

const promoVendida = (p) => {
  const lugar = [p.municipio, p.anio].filter(Boolean).join(' · ');
  const unidades = p.viviendas ? `<p>${esc(p.viviendas)} ${esc(p.tipo || 'viviendas')}</p>` : '';
  return `<article class="sold-item"><div class="sold-img"><img src="${esc(p.image)}" alt="${esc(p.nombre)}" loading="lazy"><span class="promo-state">Vendida</span></div>`
    + `<span class="label">${esc(lugar)}</span><h3>${esc(p.nombre)}</h3>${unidades}</article>`;
};

const persona = (m) => `<figure><div class="tp"><img src="${esc(m.image)}" alt="${esc(m.nombre)}" loading="lazy"></div><figcaption><strong>${esc(m.nombre)}</strong><span>${esc(m.cargo)}</span></figcaption></figure>`;

const bloques = {
  t: (clave) => fmt(texto(clave)),
  nota: (clave) => (String(texto(clave)).trim() ? `<span class="rv-note">${fmt(texto(clave))}</span>` : ''),
  'promos-activas': () => promociones.filter((p) => p.estado !== 'Vendida').map(promoActiva).join(''),
  'promos-vendidas': () => promociones.filter((p) => p.estado === 'Vendida').map(promoVendida).join(''),
  equipo: () => equipo.map(persona).join(''),
};

const MARCA = /<!--cms:([\w-]+)(?::([\w.]+))?-->[\s\S]*?<!--\/cms-->/g;

const paginas = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  if (statSync(p).isDirectory()) return ['data', 'assets', 'admin'].includes(f) ? [] : paginas(p);
  return f.endsWith('.html') ? [p] : [];
});

let cambios = 0;
for (const file of paginas(SITE)) {
  const html = readFileSync(file, 'utf8');
  const nuevo = html.replace(MARCA, (_, tipo, clave) => {
    if (!bloques[tipo]) throw new Error(`Bloque desconocido "${tipo}" en ${relative(SITE, file)}`);
    return `<!--cms:${tipo}${clave ? ':' + clave : ''}-->${bloques[tipo](clave)}<!--/cms-->`;
  });
  if (nuevo !== html) {
    writeFileSync(file, nuevo);
    cambios++;
    console.log('actualizado', relative(SITE, file));
  }
}
console.log(`Build terminado: ${cambios} página(s) actualizada(s).`);
