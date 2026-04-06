const fs = require('fs');
const path = require('path');

// Bases antiguas pueden tener tabla Traduccion huérfana: DROP TABLE Traduccion; si ya no se usa.

const rutaJson = path.join(__dirname, '../data/traducciones.es.json');
const itemsRaw = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

if (!Array.isArray(itemsRaw)) {
  throw new Error('El archivo de traducciones debe contener un array');
}

const TRADUCCIONES_ROWS = [];
for (const item of itemsRaw) {
  if (
    !item?.entidad ||
    !item?.slug ||
    !item?.campo ||
    !item?.idioma ||
    item?.texto === undefined ||
    item?.texto === null ||
    item.texto === ''
  ) {
    continue;
  }
  TRADUCCIONES_ROWS.push({
    entidad: item.entidad,
    slug: item.slug,
    campo: item.campo,
    idioma: item.idioma,
    texto: item.texto
  });
}

async function obtenerMapaTraducciones({ entidad, idioma = 'es', campos = ['nombre'], slugs = [] }) {
  if (!entidad || !Array.isArray(campos) || campos.length === 0) {
    return new Map();
  }

  const mapa = new Map();
  const campoSet = new Set(campos);
  const slugSet = Array.isArray(slugs) && slugs.length > 0 ? new Set(slugs.filter(Boolean)) : null;

  for (const row of TRADUCCIONES_ROWS) {
    if (row.entidad !== entidad || row.idioma !== idioma) continue;
    if (!campoSet.has(row.campo)) continue;
    if (slugSet && !slugSet.has(row.slug)) continue;
    mapa.set(`${row.slug}:${row.campo}`, row.texto);
  }

  return mapa;
}

function aplicarTraduccionesEnLista(lista, mapa, campos = ['nombre']) {
  for (const item of lista || []) {
    const slug = item?.slug;
    if (!slug) continue;
    for (const campo of campos) {
      const traduccion = mapa.get(`${slug}:${campo}`);
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
