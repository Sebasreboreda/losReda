const fs = require('fs');
const path = require('path');

// Bases antiguas pueden tener tabla Traduccion huérfana: DROP TABLE Traduccion; si ya no se usa.

const rutaJson = path.join(__dirname, '../data/traducciones.es.json');
let CACHE_MTIME_MS = 0;
let TRADUCCIONES_ROWS = [];

function slugsAlternativos(entidad, slug) {
  const base = String(slug || '').trim();
  if (!base) return [];
  const alternativos = [base];
  if (entidad === 'Rasgo' && base.startsWith('draconic-ancestry-')) {
    alternativos.push('draconic-ancestry');
  }
  return alternativos;
}

function construirRows(itemsRaw) {
  const rows = [];
  for (const item of itemsRaw) {
    if (!item?.entidad || !item?.slug || !item?.idioma) continue;

    if (item.campos && typeof item.campos === 'object' && !Array.isArray(item.campos)) {
      for (const [campo, texto] of Object.entries(item.campos)) {
        if (!campo || texto === undefined || texto === null || texto === '') continue;
        rows.push({
          entidad: item.entidad,
          slug: item.slug,
          campo,
          idioma: item.idioma,
          texto
        });
      }
      continue;
    }

    if (!item?.campo || item?.texto === undefined || item?.texto === null || item.texto === '') continue;
    rows.push({
      entidad: item.entidad,
      slug: item.slug,
      campo: item.campo,
      idioma: item.idioma,
      texto: item.texto
    });
  }
  return rows;
}

function asegurarCacheTraducciones() {
  const stats = fs.statSync(rutaJson);
  if (stats.mtimeMs === CACHE_MTIME_MS && TRADUCCIONES_ROWS.length) return;

  const itemsRaw = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));
  if (!Array.isArray(itemsRaw)) {
    throw new Error('El archivo de traducciones debe contener un array');
  }
  TRADUCCIONES_ROWS = construirRows(itemsRaw);
  CACHE_MTIME_MS = stats.mtimeMs;
}

async function obtenerMapaTraducciones({ entidad, idioma = 'es', campos = ['nombre'], slugs = [] }) {
  asegurarCacheTraducciones();

  if (!entidad || !Array.isArray(campos) || campos.length === 0) {
    return new Map();
  }

  const mapa = new Map();
  const campoSet = new Set(campos);
  const slugSet = Array.isArray(slugs) && slugs.length > 0 ? new Set(slugs.filter(Boolean)) : null;
  const slugSetExpandido = slugSet
    ? new Set(
        Array.from(slugSet).flatMap((slug) => slugsAlternativos(entidad, slug))
      )
    : null;

  for (const row of TRADUCCIONES_ROWS) {
    if (row.entidad !== entidad || row.idioma !== idioma) continue;
    if (!campoSet.has(row.campo)) continue;
    if (slugSetExpandido && !slugSetExpandido.has(row.slug)) continue;
    mapa.set(`${row.slug}:${row.campo}`, row.texto);
  }

  return mapa;
}

function aplicarTraduccionesEnLista(lista, mapa, campos = ['nombre']) {
  for (const item of lista || []) {
    const slug = item?.slug;
    if (!slug) continue;
    for (const campo of campos) {
      const keys = [slug];
      if (String(slug).startsWith('draconic-ancestry-')) {
        keys.push('draconic-ancestry');
      }
      const traduccion = keys
        .map((k) => mapa.get(`${k}:${campo}`))
        .find(Boolean);
      if (!traduccion) continue;
      if (typeof item.setDataValue === 'function') {
        item.setDataValue(campo, traduccion);
      } else {
        item[campo] = traduccion;
      }
    }
  }
}

module.exports = {
  obtenerMapaTraducciones,
  aplicarTraduccionesEnLista
};
