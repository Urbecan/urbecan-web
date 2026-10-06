// Rellena el HTML con los datos editables de urbecan-web/data/*.json (panel Decap CMS en /admin/).
// Sustituye el contenido entre <!--cms:tipo:clave--> y <!--/cms--> en cada página.
// Es idempotente: se puede ejecutar en local (node scripts/build.mjs) y en Netlify.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SITE = new URL('../urbecan-web/', import.meta.url).pathname;
const readJSON = (f) => JSON.parse(readFileSync(join(SITE, 'data', f), 'utf8'));

const textos = readJSON('textos.json');
const promociones = readJSON('promociones.json').promociones || [];
const equipo = readJSON('equipo.json').equipo || [];

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Formato sencillo para el panel: *texto* → cursiva/destacado, [texto] → segundo tono, salto de línea → <br>
const fmt = (s) => esc(String(s ?? '').trim())
  .replace(/\*([^*]+)\*/g, '<em>$1</em>')
  .replace(/\[([^\]]+)\]/g, '<span>$1</span>')
  .replace(/\r?\n/g, '<br>');

const texto = (clave) => {
  const v = clave.split('.').reduce((o, k) => o?.[k], textos);
  if (v === undefined) throw new Error(`Falta el texto "${clave}" en data/textos.json`);
  return v;
};

const precio = (n) => Number(n).toLocaleString('es-ES', { useGrouping: 'always' }) + ' €';
const fotos = (p) => [p.foto, ...(p.galeria || [])].filter(Boolean);

const promoActiva = (p) => {
  const imgs = fotos(p);
  const slides = imgs.map((src, i) => `<div class="ps-slide"><img src="${esc(src)}" alt="${esc(p.nombre)}${imgs.length > 1 ? `, foto ${i + 1}` : ''}" loading="lazy"></div>`).join('');
  const ctrl = imgs.length > 1
    ? `<div class="ps-ctrl"><button type="button" class="ps-prev" aria-label="Foto anterior">←</button><span class="ps-count">1 / ${imgs.length}</span><button type="button" class="ps-next" aria-label="Foto siguiente">→</button></div>`
    : '';
  const meta = p.precio ? `<div class="promo-meta"><span>Desde</span><strong>${precio(p.precio)}</strong></div>` : '';
  const ext = p.enlace ? `<a class="textlink" href="${esc(p.enlace)}" target="_blank" rel="noopener">Ver proyecto <span class="arr">↗</span></a>` : '';
  const msg = `Me interesa ${p.nombre}${p.municipio ? ` (${p.municipio})` : ''}.`;
  return `<article class="promo-card"><div class="promo-slider"><div class="ps-track">${slides}</div><span class="promo-state">${esc(p.estado)}</span>${ctrl}</div>`
    + `<div class="promo-info"><span class="label">${esc(p.municipio)}</span><h3>${esc(p.nombre)}</h3>${p.descripcion ? `<p>${esc(p.descripcion)}</p>` : ''}${meta}`
    + `<a class="textlink" href="/contacto/" data-ask="Comprar" data-msg="${esc(msg)}">Solicitar información <span class="arr">→</span></a>${ext}</div></article>`;
};

const promoVendida = (p) => {
  const lugar = [p.municipio, p.anio].filter(Boolean).join(' · ');
  const unidades = p.viviendas ? `<p>${esc(p.viviendas)} ${esc(p.tipo || 'viviendas')}</p>` : '';
  return `<article class="sold-item"><div class="sold-img"><img src="${esc(p.foto)}" alt="${esc(p.nombre)}" loading="lazy"><span class="promo-state">Vendida</span></div>`
    + `<span class="label">${esc(lugar)}</span><h3>${esc(p.nombre)}</h3>${unidades}</article>`;
};

const persona = (m) => `<figure><div class="tp"><img src="${esc(m.foto)}" alt="${esc(m.nombre)}" loading="lazy"></div><figcaption><strong>${esc(m.nombre)}</strong><span>${esc(m.cargo)}</span></figcaption></figure>`;

const bloques = {
  t: (clave) => fmt(texto(clave)),
  nota: (clave) => (String(texto(clave)).trim() ? `<span class="rv-note">${fmt(texto(clave))}</span>` : ''),
  'promos-activas': () => promociones.filter((p) => p.estado !== 'Vendida').map(promoActiva).join(''),
  'promos-vendidas': () => promociones.filter((p) => p.estado === 'Vendida').map(promoVendida).join(''),
  equipo: () => [...equipo].sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99)).map(persona).join(''),
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
