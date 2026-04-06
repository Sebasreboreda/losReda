const dotenv = require('dotenv');
dotenv.config({ quiet: true });

const { Clase, Raza, Subclase, ClaseNivel, SubclaseNivel, RazaNivel } = require('../models');
const { guardarNiveles } = require('../services/apiService');

const apiController = {};
const BASE_URL = process.env.DND_API_BASE_URL ? process.env.DND_API_BASE_URL : 'https://www.dnd5eapi.co';
const API_2014 = BASE_URL + '/api/2014'; 
const CANTIDAD_CLASES_DND = 12;
const CANTIDAD_RAZAS_DND = 9;

function sinTimestamps(obj) {
  const { createdAt, updatedAt, ...rest } = obj;
  return rest;
}

async function getCatalogoMaps() { 
  const [clasesRes, razasRes] = await Promise.all([ 
    fetch(API_2014 + '/classes'), 
    fetch(API_2014 + '/races') 
  ]); 
 
  if (!clasesRes.ok) { throw new Error('No se pudo obtener catalogo de clases'); } 
  if (!razasRes.ok) { throw new Error('No se pudo obtener catalogo de razas'); } 
 
  const clasesData = await clasesRes.json(); 
  const razasData = await razasRes.json(); 
 
  const classes = Array.isArray(clasesData.results) ? clasesData.results : []; 
  const races = Array.isArray(razasData.results) ? razasData.results : []; 
 
  const clasesMap = new Map(); 
  const razasMap = new Map(); 
 
  classes.forEach((item) => { clasesMap.set(item.index, item.url); }); 
  races.forEach((item) => { razasMap.set(item.index, item.url); }); 
 
  return { clasesMap, razasMap }; 
} 

apiController.clasesApi = async (req, res) => { 
  try { 
    const maps = await getCatalogoMaps(); 
    const clasesDetalladas = []; 
 
    for (const entry of maps.clasesMap.entries()) { 
      const index = entry[0]; 
      const detailUrl = API_2014 + '/classes/' + index; 
      const detailRes = await fetch(detailUrl); 
      if (!detailRes.ok) { continue; } 
      const detailData = await detailRes.json(); 
      clasesDetalladas.push(detailData); 
    } 
 
    return res.json({ ok: true, total: clasesDetalladas.length, clases: clasesDetalladas }); 
  } catch (error) { 
    console.error(error); 
    return res.status(500).json({ ok: false, message: 'Fallo al obtener detalle de clases' }); 
  } 
}; 
 
apiController.razasApi = async (req, res) => { 
  try { 
    const maps = await getCatalogoMaps(); 
    const razasDetalladas = []; 
 
    for (const entry of maps.razasMap.entries()) { 
      const index = entry[0]; 
      const detailUrl = API_2014 + '/races/' + index; 
      const detailRes = await fetch(detailUrl); 
      if (!detailRes.ok) { continue; } 
      const detailData = await detailRes.json(); 
      razasDetalladas.push(detailData); 
    } 
 
    return res.json({ ok: true, total: razasDetalladas.length, razas: razasDetalladas }); 
  } catch (error) { 
    console.error(error); 
    return res.status(500).json({ ok: false, message: 'Fallo al obtener detalle de razas' }); 
  } 
}; 

apiController.subclasesApi = async function (req, res) {
  try {
    const clase = typeof req.query.clase === 'string' ? req.query.clase.trim().toLowerCase() : '';

    if (clase) {
      const classUrl = API_2014 + '/classes/' + encodeURIComponent(clase);
      const classRes = await fetch(classUrl);
      if (!classRes.ok) {
        return res.status(404).json({ ok: false, message: 'Clase no encontrada' });
      }
      const classData = await classRes.json();
      const subclases = Array.isArray(classData.subclasses) ? classData.subclasses : [];
      return res.json({ ok: true, clase: classData.index ? classData.index : clase, total: subclases.length, subclases });
    }

    const listRes = await fetch(API_2014 + '/subclasses');
    if (!listRes.ok) { throw new Error('No se pudo obtener catalogo de subclases'); }
    const listData = await listRes.json();
    const subclases = Array.isArray(listData.results) ? listData.results : [];
    return res.json({ ok: true, total: subclases.length, subclases });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, message: 'Fallo al obtener detalle de subclases' });
  }
};

apiController.subclasesDetalleApi = async function (req, res) {
  try {
    const clase = typeof req.query.clase === 'string' ? req.query.clase.trim().toLowerCase() : '';
    let indicesSubclases = [];

    if (clase) {
      const classUrl = API_2014 + '/classes/' + encodeURIComponent(clase);
      const classRes = await fetch(classUrl);
      if (!classRes.ok) {
        return res.status(404).json({ ok: false, message: 'Clase no encontrada' });
      }
      const classData = await classRes.json();
      const subclases = Array.isArray(classData.subclasses) ? classData.subclasses : [];
      indicesSubclases = subclases.map((s) => s.index).filter(Boolean);
    } else {
      const listRes = await fetch(API_2014 + '/subclasses');
      if (!listRes.ok) { throw new Error('No se pudo obtener catalogo de subclases'); }
      const listData = await listRes.json();
      const results = Array.isArray(listData.results) ? listData.results : [];
      indicesSubclases = results.map((r) => r.index).filter(Boolean);
    }

    const subclasesDetalladas = [];
    for (const index of indicesSubclases) {
      const detailUrl = API_2014 + '/subclasses/' + encodeURIComponent(index);
      const detailRes = await fetch(detailUrl);
      if (!detailRes.ok) { continue; }
      const detailData = await detailRes.json();
      subclasesDetalladas.push(detailData);
    }

    const payload = clase
      ? { ok: true, clase, total: subclasesDetalladas.length, subclases: subclasesDetalladas }
      : { ok: true, total: subclasesDetalladas.length, subclases: subclasesDetalladas };

    return res.json(payload);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, message: 'Fallo al obtener detalle de subclases' });
  }
};

apiController.guardarClases = async (req, res) => {
  try {
    const total = await Clase.count();
    if (total >= CANTIDAD_CLASES_DND) {
      const clases = await Clase.findAll({
        order: [['id', 'ASC']],
        attributes: { exclude: ['createdAt', 'updatedAt'] }
      });
      return res.json({
        ok: true,
        message: 'Las clases ya están en la base de datos',
        total,
        sincronizado: false,
        clases: clases.map((c) => sinTimestamps(c.toJSON()))
      });
    }

    const maps = await getCatalogoMaps();
    let creadas = 0;
    const errores = [];

    for (const entry of maps.clasesMap.entries()) {
      const index = entry[0];
      try {
        const detailUrl = API_2014 + '/classes/' + index;
        const detailRes = await fetch(detailUrl);
        if (!detailRes.ok) {
          errores.push({ index, error: 'API no respondió ok' });
          continue;
        }

        const data = await detailRes.json();
        const [, created] = await Clase.findOrCreate({
          where: { slug: data.index || index },
          defaults: {
            nombre: data.name || '',
            slug: data.index || index,
            dado_vida: data.hit_die || null,
            descripcion: null,
            tirada_salvacion: data.saving_throws && data.saving_throws.length > 0 ? data.saving_throws : null,
            lanzamiento_hechizo: data.spellcasting || null,
            competencia: {
              proficiencies: data.proficiencies || []
            }
          }
        });
        if (created) creadas++;
      } catch (err) {
        errores.push({ index, error: err.message });
      }
    }

    const clases = await Clase.findAll({
      order: [['id', 'ASC']],
      attributes: { exclude: ['createdAt', 'updatedAt'] }
    });

    return res.json({
      ok: true,
      message: 'Clases guardadas correctamente',
      total: creadas,
      sincronizado: true,
      clases: clases.map((c) => sinTimestamps(c.toJSON())),
      ...(errores.length > 0 && { errores })
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      message: 'Fallo al guardar las clases',
      error: error.message
    });
  }
};
 
apiController.guardarRazas = async (req, res) => {
  try {
    const total = await Raza.count();
    if (total >= CANTIDAD_RAZAS_DND) {
      const razas = await Raza.findAll({
        order: [['id', 'ASC']],
        attributes: { exclude: ['createdAt', 'updatedAt'] }
      });
      return res.json({
        ok: true,
        message: 'Las razas ya están en la base de datos',
        total,
        sincronizado: false,
        razas: razas.map((r) => sinTimestamps(r.toJSON()))
      });
    }

    const maps = await getCatalogoMaps();
    let creadas = 0;
    const errores = [];

    for (const entry of maps.razasMap.entries()) {
      const index = entry[0];
      try {
        const detailUrl = API_2014 + '/races/' + index;
        const detailRes = await fetch(detailUrl);
        if (!detailRes.ok) {
          errores.push({ index, error: 'API no respondió ok' });
          continue;
        }

        const data = await detailRes.json();
        const [, created] = await Raza.findOrCreate({
          where: { slug: data.index || index },
          defaults: {
            nombre: data.name || '',
            slug: data.index || index,
            velocidad: data.speed || null,
            bonuses: data.ability_bonuses || null,
            tamano: data.size || null,
            tamano_desc: data.size_description || null,
            idiomas: data.languages || null,
            lenguaje_desc: data.language_desc || null,
            traits: data.traits || null,
            edad: data.age || null,
            alineamiento: data.alignment || null,
            descripcion: null
          }
        });
        if (created) creadas++;
      } catch (err) {
        errores.push({ index, error: err.message });
      }
    }

    const razas = await Raza.findAll({
      order: [['id', 'ASC']],
      attributes: { exclude: ['createdAt', 'updatedAt'] }
    });

    return res.json({
      ok: true,
      message: 'Razas guardadas correctamente',
      total: creadas,
      sincronizado: true,
      razas: razas.map((r) => sinTimestamps(r.toJSON())),
      ...(errores.length > 0 && { errores })
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      message: 'Fallo al guardar las razas',
      error: error.message
    });
  }
};

apiController.subclasesApi = async function (req, res) {
  try {
    const clase = typeof req.query.clase === 'string' ? req.query.clase.trim().toLowerCase() : '';
    let indicesSubclases = [];

    if (clase) {
      const classUrl = API_2014 + '/classes/' + encodeURIComponent(clase);
      const classRes = await fetch(classUrl);
      if (!classRes.ok) {
        return res.status(404).json({ ok: false, message: 'Clase no encontrada' });
      }
      const classData = await classRes.json();
      const subclases = Array.isArray(classData.subclasses) ? classData.subclasses : [];
      indicesSubclases = subclases.map((s) => s.index).filter(Boolean);
    } else {
      const listRes = await fetch(API_2014 + '/subclasses');
      if (!listRes.ok) { throw new Error('No se pudo obtener catalogo de subclases'); }
      const listData = await listRes.json();
      const results = Array.isArray(listData.results) ? listData.results : [];
      indicesSubclases = results.map((r) => r.index).filter(Boolean);
    }

    const subclasesDetalladas = [];
    for (const index of indicesSubclases) {
      const detailUrl = API_2014 + '/subclasses/' + encodeURIComponent(index);
      const detailRes = await fetch(detailUrl);
      if (!detailRes.ok) { continue; }
      const detailData = await detailRes.json();
      subclasesDetalladas.push(detailData);
    }

    const payload = clase
      ? { ok: true, clase, total: subclasesDetalladas.length, subclases: subclasesDetalladas }
      : { ok: true, total: subclasesDetalladas.length, subclases: subclasesDetalladas };

    return res.json(payload);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, message: 'Fallo al obtener detalle de subclases' });
  }
};

apiController.guardarNiveles = async (req, res) => {
  try {
    await guardarNiveles();

    const [totalClaseNiveles, totalSubclaseNiveles, totalRazaNiveles] = await Promise.all([
      ClaseNivel.count(),
      SubclaseNivel.count(),
      RazaNivel.count()
    ]);

    return res.json({
      ok: true,
      message: 'Niveles y modificadores guardados correctamente',
      totalClaseNiveles,
      totalSubclaseNiveles,
      totalRazaNiveles
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      message: 'Fallo al guardar niveles y modificadores',
      error: error.message
    });
  }
};

module.exports = apiController;