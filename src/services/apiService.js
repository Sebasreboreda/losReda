require('dotenv').config({ quiet: true });
const {
  Clase,
  Raza,
  Subraza,
  Subclase,
  Trasfondo,
  ClaseNivel,
  SubclaseNivel,
  RazaNivel,
  Competencia
} = require('../models');

const BASE_URL = process.env.DND_API_BASE_URL || 'https://www.dnd5eapi.co';
const API_2014 = BASE_URL + '/api/2014';
const CANTIDAD_CLASES_DND = 12;
const CANTIDAD_RAZAS_DND = 9;
const CANTIDAD_SUBCLASES_MIN = 1;
const CANTIDAD_CLASE_NIVELES_MIN = 20;
const CANTIDAD_TRASFONDOS_MIN = 6;
const CANTIDAD_HABILIDADES_DND = 18;

/** ability_score.index de la API 2014 → clave Atributo del modelo (español). */
const INDICE_HABILIDAD_API_A_ATRIBUTO = {
  str: 'fuerza',
  dex: 'destreza',
  con: 'constitucion',
  int: 'inteligencia',
  wis: 'sabiduria',
  cha: 'carisma'
};

/* Descripciones en inglés de las clases porque la API pública no devuelve el catálogo completo */
const CLASES_DESCRIPCION_EN = {
  barbarian: 'A fierce warrior who channels primal rage in battle.',
  bard: 'An inspiring performer and spellcaster who weaves magic through art and music.',
  cleric: 'A divine spellcaster who serves a deity and wields sacred power.',
  druid: 'A guardian of nature who commands primal magic and can shapechange.',
  fighter: 'A master of martial combat, skilled with weapons and armor.',
  monk: 'A disciplined martial artist who harnesses ki for extraordinary feats.',
  paladin: 'A holy warrior bound by an oath, combining martial skill and divine magic.',
  ranger: 'A wilderness hunter and tracker with martial prowess and natural magic.',
  rogue: 'A stealthy and precise operative skilled in agility, tricks, and tactics.',
  sorcerer: 'A spellcaster whose magic comes from an innate supernatural bloodline.',
  warlock: 'A wielder of arcane power granted through a pact with an otherworldly patron.',
  wizard: 'A scholarly spellcaster who learns and prepares spells through study.'
};

/* Descripciones en inglés de las razas porque la API pública no devuelve el catálogo completo */
const RAZAS_DESCRIPCION_EN = {
  dragonborn: 'Draconic humanoids with proud heritage, breath weapons, and elemental resilience.',
  dwarf: 'Stout and resilient people known for endurance, craftsmanship, and tradition.',
  elf: 'Graceful, long-lived folk with keen senses and deep magical affinity.',
  gnome: 'Curious and clever small folk known for creativity, wit, and invention.',
  'half-elf': 'Versatile people of mixed heritage who bridge human and elven worlds.',
  'half-orc': 'Powerful and determined folk with great strength and fierce resolve.',
  halfling: 'Small, nimble, and fortunate adventurers known for bravery and charm.',
  human: 'Adaptable and ambitious people with broad talents and diverse cultures.',
  tiefling: 'People with infernal ancestry, marked by unusual features and innate magic.'
};

/* Descripciones en inglés de las subrazas porque la API pública no devuelve el catálogo completo */
const SUBRAZAS_MANUALES = [
  {
    slug: 'mountain-dwarf',
    nombre: 'Mountain Dwarf',
    razaSlug: 'dwarf',
    descripcion: 'A hardy dwarven subrace with strong martial tradition.',
    bonuses: [{ ability_score: { index: 'str', name: 'STR' }, bonus: 2 }]
  },
  {
    slug: 'wood-elf',
    nombre: 'Wood Elf',
    razaSlug: 'elf',
    descripcion: 'An agile elf with a deep bond to nature.',
    bonuses: [{ ability_score: { index: 'wis', name: 'WIS' }, bonus: 1 }]
  },
  {
    slug: 'eladrin-elf',
    nombre: 'Eladrin Elf',
    razaSlug: 'elf',
    descripcion: 'An elven lineage tied to the Feywild.',
    bonuses: [{ ability_score: { index: 'int', name: 'INT' }, bonus: 1 }]
  },
  {
    slug: 'forest-gnome',
    nombre: 'Forest Gnome',
    razaSlug: 'gnome',
    descripcion: 'A quiet gnome subrace closely connected to forests.',
    bonuses: [{ ability_score: { index: 'dex', name: 'DEX' }, bonus: 1 }]
  },
  {
    slug: 'stout-halfling',
    nombre: 'Stout Halfling',
    razaSlug: 'halfling',
    descripcion: 'A resilient halfling subrace known for toughness.',
    bonuses: [{ ability_score: { index: 'con', name: 'CON' }, bonus: 1 }]
  },
  {
    slug: 'human-standard',
    nombre: 'Human',
    razaSlug: 'human',
    descripcion: 'Standard human with balanced ability improvements.',
    bonuses: [
      { ability_score: { index: 'str', name: 'STR' }, bonus: 1 },
      { ability_score: { index: 'dex', name: 'DEX' }, bonus: 1 },
      { ability_score: { index: 'con', name: 'CON' }, bonus: 1 },
      { ability_score: { index: 'int', name: 'INT' }, bonus: 1 },
      { ability_score: { index: 'wis', name: 'WIS' }, bonus: 1 },
      { ability_score: { index: 'cha', name: 'CHA' }, bonus: 1 }
    ]
  },
  {
    slug: 'variant-human',
    nombre: 'Variant Human',
    razaSlug: 'human',
    descripcion: 'Human variant with more flexible starting choices.',
    bonuses: [{ ability_score: { index: 'choice', name: 'Choice' }, bonus: 1 }, { ability_score: { index: 'choice', name: 'Choice' }, bonus: 1 }]
  }
];

/* Descripciones en inglés de los trasfondos porque la API pública no devuelve el catálogo completo */
const TRASFONDOS_MANUALES = [
  { slug: 'charlatan', nombre: 'Charlatan', descripcion: 'Enganador profesional, habilidoso con el disfraz y el fraude.' },
  { slug: 'criminal', nombre: 'Criminal', descripcion: 'Acostumbrado al mundo del delito y los bajos fondos.' },
  { slug: 'entertainer', nombre: 'Entertainer', descripcion: 'Artista que vive de sus actuaciones y su carisma.' },
  { slug: 'folk-hero', nombre: 'Folk Hero', descripcion: 'Persona comun convertida en simbolo para su comunidad.' },
  { slug: 'guild-artisan', nombre: 'Guild Artisan', descripcion: 'Artesano especializado con conexion a su gremio.' },
  { slug: 'hermit', nombre: 'Hermit', descripcion: 'Recluido que ha pasado anos aislado del mundo.' },
  { slug: 'noble', nombre: 'Noble', descripcion: 'Miembro de familia influyente con educacion privilegiada.' },
  { slug: 'outlander', nombre: 'Outlander', descripcion: 'Superviviente habituado a vivir lejos de la civilizacion.' },
  { slug: 'sage', nombre: 'Sage', descripcion: 'Erudito que ha dedicado su vida al conocimiento.' },
  { slug: 'sailor', nombre: 'Sailor', descripcion: 'Marinero con experiencia en viajes y tormentas.' },
  { slug: 'soldier', nombre: 'Soldier', descripcion: 'Veterano de campana con disciplina militar.' },
  { slug: 'urchin', nombre: 'Urchin', descripcion: 'Criado en calles duras, experto en sobrevivir con poco.' }
];

function buildApiUrl(urlOrPath) {
  if (!urlOrPath) return '';
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) return urlOrPath;
  return BASE_URL + urlOrPath;
}

async function guardarFallbackManual() {
  // Datos cargados manualmente porque la API publica no devuelve el catalogo completo de subrazas/trasfondos de forma estable.
  const razas = await Raza.findAll({ attributes: ['id', 'slug'] });
  const razaPorSlug = new Map(razas.map((r) => [r.slug, r.id]));

  await guardarDescripcionesBaseEn();

  for (const subrazaManual of SUBRAZAS_MANUALES) {
    const razaId = razaPorSlug.get(subrazaManual.razaSlug);
    if (!razaId) continue;

    const [subraza] = await Subraza.findOrCreate({
      where: { slug: subrazaManual.slug },
      defaults: {
        nombre: subrazaManual.nombre,
        slug: subrazaManual.slug,
        descripcion: subrazaManual.descripcion,
        bonuses: subrazaManual.bonuses || null,
        rasgos: null,
        idiomas: null,
        RazaId: razaId
      }
    });

    await subraza.update({
      nombre: subrazaManual.nombre,
      descripcion: subrazaManual.descripcion,
      bonuses: subrazaManual.bonuses || null,
      RazaId: razaId
    });
  }

  for (const trasfondoManual of TRASFONDOS_MANUALES) {
    await Trasfondo.findOrCreate({
      where: { slug: trasfondoManual.slug },
      defaults: {
        nombre: trasfondoManual.nombre,
        slug: trasfondoManual.slug,
        descripcion: trasfondoManual.descripcion
      }
    });
  }
}

async function guardarDescripcionesBaseEn() {
  for (const [slug, descripcion] of Object.entries(CLASES_DESCRIPCION_EN)) {
    await Clase.update({ descripcion }, { where: { slug } });
  }
  await guardarDescripcionesRazasEn();
}

async function guardarDescripcionesRazasEn() {
  for (const [slug, descripcion] of Object.entries(RAZAS_DESCRIPCION_EN)) {
    await Raza.update({ descripcion }, { where: { slug } });
  }
}

async function getCatalogoMaps() {
  const [clasesRes, razasRes] = await Promise.all([
    fetch(API_2014 + '/classes'),
    fetch(API_2014 + '/races')
  ]);

  if (!clasesRes.ok) {
    throw new Error('No se pudo obtener catalogo de clases');
  }
  if (!razasRes.ok) {
    throw new Error('No se pudo obtener catalogo de razas');
  }

  const clasesData = await clasesRes.json();
  const razasData = await razasRes.json();

  const classes = Array.isArray(clasesData.results) ? clasesData.results : [];
  const races = Array.isArray(razasData.results) ? razasData.results : [];

  const clasesMap = new Map();
  const razasMap = new Map();

  classes.forEach((item) => clasesMap.set(item.index, item.url));
  races.forEach((item) => razasMap.set(item.index, item.url));

  return { clasesMap, razasMap };
}

async function guardarClases() {
  const total = await Clase.count();
  if (total >= CANTIDAD_CLASES_DND) return;

  const { clasesMap } = await getCatalogoMaps();

  for (const [index] of clasesMap) {
    try {
      const detailRes = await fetch(API_2014 + '/classes/' + index);
      if (!detailRes.ok) continue;

      const data = await detailRes.json();
      await Clase.findOrCreate({
        where: { slug: data.index || index },
        defaults: {
          nombre: data.name || '',
          slug: data.index || index,
          dado_vida: data.hit_die || null,
          descripcion: null,
          tirada_salvacion: Array.isArray(data.saving_throws) && data.saving_throws.length > 0 ? data.saving_throws : null,
          lanzamiento_hechizo: data.spellcasting || null,
          competencia: { proficiencies: data.proficiencies || [] }
        }
      });
    } catch (err) {
      console.error('guardarClases error', index, err.message);
    }
  }
}

async function guardarRazas() {
  const total = await Raza.count();
  if (total >= CANTIDAD_RAZAS_DND) return;

  const { razasMap } = await getCatalogoMaps();

  for (const [index] of razasMap) {
    try {
      const detailRes = await fetch(API_2014 + '/races/' + index);
      if (!detailRes.ok) continue;

      const data = await detailRes.json();
      await Raza.findOrCreate({
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
    } catch (err) {
      console.error('guardarRazas error', index, err.message);
    }
  }
}

async function guardarSubclases() {
  const total = await Subclase.count();
  if (total >= CANTIDAD_SUBCLASES_MIN) return;

  const listRes = await fetch(API_2014 + '/subclasses');
  if (!listRes.ok) {
    throw new Error('No se pudo obtener catalogo de subclases');
  }

  const listData = await listRes.json();
  const indices = (listData.results || []).map((r) => r.index).filter(Boolean);

  for (const index of indices) {
    try {
      const detailRes = await fetch(API_2014 + '/subclasses/' + encodeURIComponent(index));
      if (!detailRes.ok) continue;

      const data = await detailRes.json();
      const clase = data.class?.index ? await Clase.findOne({ where: { slug: data.class.index } }) : null;
      if (!clase) continue;

      await Subclase.findOrCreate({
        where: { slug: data.index || index },
        defaults: {
          nombre: data.name || '',
          slug: data.index || index,
          descripcion: Array.isArray(data.desc) ? data.desc.join('\n\n') : null,
          tipo_subclase: data.subclass_flavor || null,
          ClaseId: clase.id
        }
      });
    } catch (err) {
      console.error('guardarSubclases error', index, err.message);
    }
  }
}

async function guardarSubrazas() {
  const razas = await Raza.findAll({ attributes: ['id', 'slug'] });

  for (const raza of razas) {
    try {
      const detailRes = await fetch(API_2014 + '/races/' + encodeURIComponent(raza.slug));
      if (!detailRes.ok) continue;

      const detailData = await detailRes.json();
      const subraces = Array.isArray(detailData.subraces) ? detailData.subraces : [];

      for (const subraceRef of subraces) {
        const slugBase = subraceRef.index || null;
        if (!slugBase) continue;

        const [subraza] = await Subraza.findOrCreate({
          where: { slug: slugBase },
          defaults: {
            nombre: subraceRef.name || slugBase,
            slug: slugBase,
            descripcion: null,
            bonuses: null,
            rasgos: null,
            idiomas: null,
            RazaId: raza.id
          }
        });

        const subraceUrl = buildApiUrl(subraceRef.url);
        if (!subraceUrl) continue;

        const subraceRes = await fetch(subraceUrl);
        if (!subraceRes.ok) continue;

        const subraceData = await subraceRes.json();
        await subraza.update({
          nombre: subraceData.name || subraceRef.name || subraza.nombre,
          descripcion: Array.isArray(subraceData.desc) ? subraceData.desc.join('\n\n') : subraza.descripcion,
          bonuses: subraceData.ability_bonuses || subraza.bonuses,
          rasgos: subraceData.racial_traits || subraza.rasgos,
          idiomas: subraceData.languages || subraza.idiomas,
          RazaId: raza.id
        });
      }
    } catch (err) {
      console.error('guardarSubrazas error', raza.slug, err.message);
    }
  }

  await guardarFallbackManual();
}

async function guardarTrasfondos() {
  const total = await Trasfondo.count();
  if (total >= CANTIDAD_TRASFONDOS_MIN) {
    await guardarFallbackManual();
    return;
  }

  const listRes = await fetch(API_2014 + '/backgrounds');
  if (!listRes.ok) {
    throw new Error('No se pudo obtener catalogo de trasfondos');
  }

  const listData = await listRes.json();
  const fondos = Array.isArray(listData.results) ? listData.results : [];

  for (const fondo of fondos) {
    try {
      const detailRes = await fetch(API_2014 + '/backgrounds/' + encodeURIComponent(fondo.index));
      if (!detailRes.ok) continue;

      const detailData = await detailRes.json();
      await Trasfondo.findOrCreate({
        where: { slug: detailData.index || fondo.index },
        defaults: {
          nombre: detailData.name || fondo.name || '',
          slug: detailData.index || fondo.index,
          descripcion: Array.isArray(detailData.desc) ? detailData.desc.join('\n\n') : null
        }
      });
    } catch (err) {
      console.error('guardarTrasfondos error', fondo.index, err.message);
    }
  }

  await guardarFallbackManual();
}

async function guardarClaseNiveles() {
  const total = await ClaseNivel.count();
  if (total >= CANTIDAD_CLASE_NIVELES_MIN) return;

  const clases = await Clase.findAll({ attributes: ['id', 'slug'] });

  for (const clase of clases) {
    try {
      const levelsRes = await fetch(API_2014 + '/classes/' + encodeURIComponent(clase.slug) + '/levels');
      if (!levelsRes.ok) continue;

      const levelsData = await levelsRes.json();
      const levels = Array.isArray(levelsData) ? levelsData : [];

      for (const nivelData of levels) {
        const nivel = Number(nivelData.level) || null;
        if (!nivel) continue;

        await ClaseNivel.findOrCreate({
          where: { ClaseId: clase.id, nivel },
          defaults: {
            nivel,
            bonus_competencia: nivelData.prof_bonus || null,
            mejora_puntuacion: nivelData.ability_score_bonuses || null,
            rasgos: nivelData.features || null,
            lanzamiento_hechizo: nivelData.spellcasting || null,
            ClaseId: clase.id
          }
        });
      }
    } catch (err) {
      console.error('guardarClaseNiveles error', clase.slug, err.message);
    }
  }
}

async function guardarSubclaseNiveles() {
  const subclases = await Subclase.findAll({ attributes: ['id', 'slug'] });

  for (const subclase of subclases) {
    try {
      const levelsRes = await fetch(API_2014 + '/subclasses/' + encodeURIComponent(subclase.slug) + '/levels');
      if (!levelsRes.ok) continue;

      const levelsData = await levelsRes.json();
      const levels = Array.isArray(levelsData) ? levelsData : [];

      for (const nivelData of levels) {
        const nivel = Number(nivelData.level) || null;
        if (!nivel) continue;

        await SubclaseNivel.findOrCreate({
          where: { SubclaseId: subclase.id, nivel },
          defaults: {
            nivel,
            rasgos: nivelData.features || null,
            lanzamiento_hechizo: nivelData.spellcasting || null,
            SubclaseId: subclase.id
          }
        });
      }
    } catch (err) {
      console.error('guardarSubclaseNiveles error', subclase.slug, err.message);
    }
  }
}

async function guardarRazaNiveles() {
  const razas = await Raza.findAll({ attributes: ['id', 'slug', 'bonuses', 'traits', 'velocidad', 'idiomas'] });

  for (const raza of razas) {
    try {
      const detailRes = await fetch(API_2014 + '/races/' + encodeURIComponent(raza.slug));
      let detailData = null;
      if (detailRes.ok) {
        detailData = await detailRes.json();
      }

      await RazaNivel.findOrCreate({
        where: { RazaId: raza.id, nivel: 1 },
        defaults: {
          nivel: 1,
          modificadores: detailData?.ability_bonuses || raza.bonuses || null,
          rasgos: detailData?.traits || raza.traits || null,
          velocidad: detailData?.speed || raza.velocidad || null,
          idiomas: detailData?.languages || raza.idiomas || null,
          RazaId: raza.id
        }
      });
    } catch (err) {
      console.error('guardarRazaNiveles error', raza.slug, err.message);
    }
  }
}

async function guardarNiveles() {
  await guardarClaseNiveles();
  await guardarSubclaseNiveles();
  await guardarRazaNiveles();
}

/**
 * Rellena habilidades D&D desde la API solo si faltan en BD (mismo criterio que clases/razas).
 */
async function guardarHabilidadesDnd() {
  const total = await Competencia.count({ where: { tipo: 'habilidad' } });
  if (total >= CANTIDAD_HABILIDADES_DND) return;

  const listRes = await fetch(`${API_2014}/skills`);
  if (!listRes.ok) {
    throw new Error(`No se pudo obtener el listado de habilidades (HTTP ${listRes.status})`);
  }
  const listData = await listRes.json();
  const results = Array.isArray(listData.results) ? listData.results : [];
  if (results.length === 0) {
    throw new Error('Listado de habilidades vacío');
  }

  const details = await Promise.all(
    results.map(async (ref) => {
      const index = ref && ref.index;
      if (!index) return null;
      const url = ref.url ? buildApiUrl(ref.url) : `${API_2014}/skills/${encodeURIComponent(index)}`;
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    })
  );

  let guardadas = 0;
  for (const data of details) {
    if (!data || !data.index) continue;
    const abiRaw = data.ability_score && data.ability_score.index;
    const atributo = abiRaw
      ? INDICE_HABILIDAD_API_A_ATRIBUTO[String(abiRaw).toLowerCase()]
      : null;
    if (!atributo) {
      console.warn('guardarHabilidadesDnd: habilidad sin atributo mapeable', data.index, abiRaw);
      continue;
    }
    const nombre = data.name || data.index;
    const slug = data.index;
    const [comp] = await Competencia.findOrCreate({
      where: { slug },
      defaults: {
        nombre,
        slug,
        tipo: 'habilidad',
        atributo
      }
    });
    await comp.update({
      nombre,
      tipo: 'habilidad',
      atributo
    });
    guardadas += 1;
  }

  if (guardadas === 0) {
    throw new Error('No se pudo guardar ninguna habilidad (fallos al obtener detalle o atributos)');
  }
  if (guardadas < results.length) {
    console.warn(
      `guardarHabilidadesDnd: guardadas ${guardadas} de ${results.length} habilidades del listado`
    );
  }
}

async function guardarCatalogo() {
  await guardarClases();
  await guardarRazas();
  await guardarSubrazas();
  await guardarSubclases();
  await guardarTrasfondos();
  await guardarNiveles();
  await guardarHabilidadesDnd();
}

module.exports = {
  guardarClases,
  guardarRazas,
  guardarSubrazas,
  guardarSubclases,
  guardarTrasfondos,
  guardarFallbackManual,
  guardarDescripcionesBaseEn,
  guardarDescripcionesRazasEn,
  guardarClaseNiveles,
  guardarSubclaseNiveles,
  guardarRazaNiveles,
  guardarNiveles,
  guardarHabilidadesDnd,
  guardarCatalogo
};