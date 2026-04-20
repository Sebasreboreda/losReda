const { Personaje, Clase, ClaseNivel, RazaNivel, Raza, Subraza, Trasfondo, Competencia, Rasgo, Atributo, PersonajeClase, Feat, Subclase, SubclaseNivel } = require('../models');
const { listarImagenesPersonaje } = require('../utils/personajeImages');
const { obtenerPuntosVida, calcularCA } = require('../services/personajeService');
const { obtenerMapaTraducciones, aplicarTraduccionesEnLista } = require('../services/traduccionService');

const IMAGEN_POR_DEFECTO = '/images/personajesDefecto/imagenPorDefecto.avif';

function parsearJsonFlexible(valor, fallback) {
  if (valor == null) return fallback;
  if (typeof valor === 'string') {
    const s = valor.trim();
    if (!s) return fallback;
    if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
      try {
        return JSON.parse(s);
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
  return valor;
}

function refsRasgoDesdeValor(valor) {
  const lista = parsearJsonFlexible(valor, []);
  return Array.isArray(lista) ? lista : [];
}

function normalizarNombreArchivo(nombre = '') {
  return String(nombre)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function obtenerRutaImagenCatalogo(basePath, nombre) {
  const nombreArchivo = normalizarNombreArchivo(nombre);
  return nombreArchivo ? `${basePath}/${nombreArchivo}.png` : IMAGEN_POR_DEFECTO;
}

function mapaTraduccionesAObjeto(mapa) {
  const salida = {};
  for (const [key, value] of mapa.entries()) {
    const [slug] = String(key || '').split(':');
    if (!slug) continue;
    salida[slug] = value;
  }
  return salida;
}

async function cargarContextoCreacion() {
  const imagenesDisponibles = await listarImagenesPersonaje();
  const clasesDb = await Clase.findAll({
    order: [['nombre', 'ASC']],
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    include: [
      {
        model: Competencia,
        attributes: ['id', 'nombre', 'slug', 'tipo', 'atributo', 'categoria'],
        through: { attributes: [] }
      }
    ]
  });
  const claseIds = clasesDb.map((c) => c.id);
  const claseNivelesNivel1 = claseIds.length
    ? await ClaseNivel.findAll({
        where: { ClaseId: claseIds, nivel: 1 },
        attributes: ['ClaseId'],
        include: [
          {
            model: Rasgo,
            as: 'Rasgos',
            attributes: ['id', 'nombre', 'slug', 'descripcion', 'modificadores'],
            through: { attributes: [] }
          }
        ]
      })
    : [];
  const razasDb = await Raza.findAll({
    order: [['nombre', 'ASC']],
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    include: [
      {
        model: Rasgo,
        as: 'Rasgos',
        attributes: ['id', 'nombre', 'slug', 'descripcion', 'modificadores'],
        through: { attributes: [] }
      }
    ]
  });
  const subrazas = await Subraza.findAll({
    order: [['nombre', 'ASC']],
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    include: [
      {
        model: Rasgo,
        as: 'Rasgos',
        attributes: ['id', 'nombre', 'slug', 'descripcion', 'modificadores'],
        through: { attributes: [] }
      }
    ]
  });
  const trasfondosDb = await Trasfondo.findAll({
    order: [['nombre', 'ASC']],
    attributes: { exclude: ['createdAt', 'updatedAt'] }
  });
  const idiomasDb = await Competencia.findAll({
    where: { tipo: 'idioma' },
    attributes: ['nombre', 'slug', 'categoria'],
    order: [['categoria', 'ASC'], ['nombre', 'ASC']]
  });
  const [traduccionesClases, traduccionesRazas, traduccionesSubrazas, traduccionesTrasfondos, traduccionesIdiomas, traduccionesTextosDirectos] = await Promise.all([
    obtenerMapaTraducciones({ entidad: 'Clase', campos: ['nombre', 'descripcion', 'lanzamiento_hechizo'], slugs: clasesDb.map((c) => c.slug) }),
    obtenerMapaTraducciones({ entidad: 'Raza', campos: ['nombre', 'descripcion', 'edad', 'alineamiento', 'lenguaje_desc', 'tamano', 'tamano_desc', 'idiomas', 'traits'], slugs: razasDb.map((r) => r.slug) }),
    obtenerMapaTraducciones({ entidad: 'Subraza', campos: ['nombre', 'descripcion', 'rasgos'], slugs: subrazas.map((s) => s.slug) }),
    obtenerMapaTraducciones({ entidad: 'Trasfondo', campos: ['nombre', 'descripcion', 'competencias', 'idiomas_opciones', 'rasgo'], slugs: trasfondosDb.map((t) => t.slug) }),
    obtenerMapaTraducciones({ entidad: 'Competencia', campos: ['nombre'], slugs: idiomasDb.map((i) => i.slug) }),
    obtenerMapaTraducciones({ entidad: 'TextoDirecto', campos: ['nombre'] })
  ]);
  aplicarTraduccionesEnLista(clasesDb, traduccionesClases, ['nombre', 'descripcion', 'lanzamiento_hechizo']);
  aplicarTraduccionesEnLista(razasDb, traduccionesRazas, ['nombre', 'descripcion', 'edad', 'alineamiento', 'lenguaje_desc', 'tamano', 'tamano_desc', 'idiomas', 'traits']);
  aplicarTraduccionesEnLista(subrazas, traduccionesSubrazas, ['nombre', 'descripcion', 'rasgos']);
  aplicarTraduccionesEnLista(trasfondosDb, traduccionesTrasfondos, ['nombre', 'descripcion', 'competencias', 'idiomas_opciones', 'rasgo']);
  aplicarTraduccionesEnLista(idiomasDb, traduccionesIdiomas, ['nombre']);
  const slugsRasgosClaseNivel1 = Array.from(new Set(
    claseNivelesNivel1.flatMap((fila) => {
      const rasgos = Array.isArray(fila?.Rasgos) ? fila.Rasgos : [];
      return rasgos.map((rasgo) => String(rasgo?.slug || '').trim()).filter(Boolean);
    })
  ));
  const traduccionesRasgosClase = await obtenerMapaTraducciones({
    entidad: 'Rasgo',
    campos: ['nombre', 'descripcion'],
    slugs: slugsRasgosClaseNivel1
  });
  const rasgosNivel1PorClaseId = new Map();
  claseNivelesNivel1.forEach((fila) => {
    const rasgos = (Array.isArray(fila?.Rasgos) ? fila.Rasgos : [])
      .map((rasgo) => {
        const data = typeof rasgo?.toJSON === 'function' ? rasgo.toJSON() : rasgo;
        const slug = String(data?.slug || '').trim();
        if (slug.toLowerCase().startsWith('spellcasting-') || slug.toLowerCase() === 'pact-magic') {
          return null;
        }
        return {
          slug,
          nombre: traduccionesRasgosClase.get(`${slug}:nombre`) || String(data?.nombre || slug).trim(),
          descripcion: traduccionesRasgosClase.get(`${slug}:descripcion`) || String(data?.descripcion || '').trim()
        };
      })
      .filter(Boolean);
    rasgosNivel1PorClaseId.set(fila.ClaseId, rasgos);
  });

  const clases = clasesDb.map((clase) => {
    const data = clase.toJSON();
    const competenciasClase = Array.isArray(data.Competencia) ? data.Competencia : [];
    let proficiencies = competenciasClase.map((comp) => ({
      index: comp?.slug || '',
      name: comp?.nombre || comp?.slug || '',
      tipo: comp?.tipo || null,
      atributo: comp?.atributo || null,
      categoria: comp?.categoria || null
    }));
    if (!proficiencies.length) {
      const legacy = parsearJsonFlexible(data.competencia, {});
      proficiencies = Array.isArray(legacy?.proficiencies) ? legacy.proficiencies : [];
    }
    return {
      ...data,
      // Fuente principal: tabla intermedia ClaseCompetencia.
      competencia: { proficiencies },
      rasgosNivel1: rasgosNivel1PorClaseId.get(data.id) || [],
      imagenUrl: obtenerRutaImagenCatalogo('/images/imagenesClase', data.nombre)
    };
  }).sort((a, b) => String(a?.nombre || '').localeCompare(String(b?.nombre || ''), 'es'));
  const razas = razasDb.map((raza) => {
    const data = raza.toJSON();
    let traitsRefs = data.traits;
    if (typeof traitsRefs === 'string') {
      const s = traitsRefs.trim();
      if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
        try {
          traitsRefs = JSON.parse(s);
        } catch {
          traitsRefs = [];
        }
      }
    }
    const traitSlugs = Array.isArray(traitsRefs)
      ? traitsRefs
          .map((t) => String(t?.index || '').trim())
          .filter(Boolean)
      : [];
    const rasgosFallback = traitSlugs.map((slug) => ({ slug }));
    return {
      ...data,
      rasgosDetalle: Array.isArray(data.Rasgos) && data.Rasgos.length ? data.Rasgos : rasgosFallback,
      imagenUrl: obtenerRutaImagenCatalogo('/images/imagenesRaza', data.nombre)
    };
  }).sort((a, b) => String(a?.nombre || '').localeCompare(String(b?.nombre || ''), 'es'));

  const subrazasJson = subrazas.map((subraza) => {
    const data = subraza.toJSON();
    let rasgosRefs = data.rasgos;
    if (typeof rasgosRefs === 'string') {
      const s = rasgosRefs.trim();
      if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
        try {
          rasgosRefs = JSON.parse(s);
        } catch {
          rasgosRefs = [];
        }
      }
    }
    const rasgoSlugs = Array.isArray(rasgosRefs)
      ? rasgosRefs
          .map((t) => String(t?.index || '').trim())
          .filter(Boolean)
      : [];
    const rasgosFallback = rasgoSlugs.map((slug) => ({ slug }));
    return {
      ...data,
      rasgosDetalle: Array.isArray(data.Rasgos) && data.Rasgos.length ? data.Rasgos : rasgosFallback
    };
  }).sort((a, b) => String(a?.nombre || '').localeCompare(String(b?.nombre || ''), 'es'));

  const rasgosPorSlug = new Map();
  const slugsRasgosPendientes = new Set();
  razas.forEach((raza) => {
    const rasgos = Array.isArray(raza.rasgosDetalle) ? raza.rasgosDetalle : [];
    rasgos.forEach((rasgo) => {
      if (rasgo?.slug) slugsRasgosPendientes.add(rasgo.slug);
    });
  });
  subrazasJson.forEach((subraza) => {
    const rasgos = Array.isArray(subraza.rasgosDetalle) ? subraza.rasgosDetalle : [];
    rasgos.forEach((rasgo) => {
      if (rasgo?.slug) slugsRasgosPendientes.add(rasgo.slug);
    });
  });
  if (slugsRasgosPendientes.size) {
    const slugsRasgos = Array.from(slugsRasgosPendientes);
    const [rasgosDb, traduccionesRasgos] = await Promise.all([
      Rasgo.findAll({
        where: { slug: slugsRasgos },
        attributes: ['id', 'nombre', 'slug', 'descripcion', 'modificadores']
      }),
      obtenerMapaTraducciones({
        entidad: 'Rasgo',
        campos: ['nombre', 'descripcion'],
        slugs: slugsRasgos
      })
    ]);
    aplicarTraduccionesEnLista(rasgosDb, traduccionesRasgos, ['nombre', 'descripcion']);
    rasgosDb.forEach((rasgo) => {
      rasgosPorSlug.set(rasgo.slug, rasgo.toJSON());
    });
  }
  razas.forEach((raza) => {
    const rasgos = Array.isArray(raza.rasgosDetalle) ? raza.rasgosDetalle : [];
    raza.rasgosDetalle = rasgos.map((rasgo) => {
      if (!rasgo?.slug) return rasgo;
      return rasgosPorSlug.get(rasgo.slug) || rasgo;
    });
  });

  subrazasJson.forEach((subraza) => {
    const rasgos = Array.isArray(subraza.rasgosDetalle) ? subraza.rasgosDetalle : [];
    subraza.rasgosDetalle = rasgos.map((rasgo) => {
      if (!rasgo?.slug) return rasgo;
      return rasgosPorSlug.get(rasgo.slug) || rasgo;
    });
  });

  const atributos = [
    { nombre: 'Fuerza', campo: 'fuerza' },
    { nombre: 'Destreza', campo: 'destreza' },
    { nombre: 'Constitución', campo: 'constitucion' },
    { nombre: 'Inteligencia', campo: 'inteligencia' },
    { nombre: 'Sabiduría', campo: 'sabiduria' },
    { nombre: 'Carisma', campo: 'carisma' }
  ];

  const trasfondos = trasfondosDb.map((trasfondo) => trasfondo.toJSON());
  const idiomasCatalogo = idiomasDb.map((idioma) => idioma.toJSON());
  const textosDirectos = mapaTraduccionesAObjeto(traduccionesTextosDirectos);
  return { imagenesDisponibles, clases, razas, subrazas: subrazasJson, trasfondos, idiomasCatalogo, atributos, textosDirectos };
}

exports.renderCrear = async (req, res) => {
  try {
    const ctx = await cargarContextoCreacion();
    return res.render('oldCrearPersonaje', { title: 'Crear personaje', ...ctx });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error al cargar el formulario de creación');
  }
};

exports.renderCrearPaso1 = async (req, res) => {
  try {
    const ctx = await cargarContextoCreacion();
    return res.render('crearPersonaje1', { title: 'Crear personaje · Paso 1', ...ctx });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error al cargar el paso 1');
  }
};

exports.renderCrearPaso2 = async (req, res) => {
  try {
    const ctx = await cargarContextoCreacion();
    const [claseNivelesDb, razaNivelesDb, featsDb, subclasesDb, subclaseNivelesDb] = await Promise.all([
      ClaseNivel.findAll({
        attributes: ['ClaseId', 'nivel', 'bonus_competencia', 'lanzamiento_hechizo'],
        include: [
          {
            model: Rasgo,
            as: 'Rasgos',
            attributes: ['slug', 'nombre', 'descripcion', 'modificadores'],
            through: { attributes: [] }
          }
        ],
        order: [['ClaseId', 'ASC'], ['nivel', 'ASC']]
      }),
      RazaNivel.findAll({
        attributes: ['RazaId', 'nivel', 'modificadores', 'rasgos', 'velocidad', 'idiomas'],
        order: [['RazaId', 'ASC'], ['nivel', 'ASC']]
      }),
      Feat.findAll({
        attributes: ['slug', 'nombre', 'descripcion', 'bonuses']
      }),
      Subclase.findAll({
        attributes: ['id', 'slug', 'nombre', 'descripcion', 'tipo_subclase', 'ClaseId']
      }),
      SubclaseNivel.findAll({
        attributes: ['SubclaseId', 'nivel', 'rasgos', 'lanzamiento_hechizo'],
        order: [['SubclaseId', 'ASC'], ['nivel', 'ASC']]
      })
    ]);

    const slugsRasgoClase = new Set(
      claseNivelesDb.flatMap((fila) => {
        const rasgos = Array.isArray(fila?.Rasgos) ? fila.Rasgos : [];
        return rasgos.map((rasgo) => String(rasgo?.slug || '').trim()).filter(Boolean);
      })
    );

    const slugsRasgoRacial = new Set();
    razaNivelesDb.forEach((fila) => {
      refsRasgoDesdeValor(fila.rasgos).forEach((ref) => {
        const slug = String(ref?.index || '').trim();
        if (slug) slugsRasgoRacial.add(slug);
      });
    });
    (ctx.razas || []).forEach((raza) => {
      const rasgos = Array.isArray(raza?.rasgosDetalle) ? raza.rasgosDetalle : [];
      rasgos.forEach((rasgo) => {
        const slug = String(rasgo?.slug || '').trim();
        if (slug) slugsRasgoRacial.add(slug);
      });
    });
    (ctx.subrazas || []).forEach((subraza) => {
      const rasgos = Array.isArray(subraza?.rasgosDetalle) ? subraza.rasgosDetalle : [];
      rasgos.forEach((rasgo) => {
        const slug = String(rasgo?.slug || '').trim();
        if (slug) slugsRasgoRacial.add(slug);
      });
    });

    const slugsRasgoSubclase = new Set();
    subclaseNivelesDb.forEach((fila) => {
      refsRasgoDesdeValor(fila.rasgos).forEach((ref) => {
        const slug = String(ref?.index || '').trim();
        if (slug) slugsRasgoSubclase.add(slug);
      });
    });

    const slugsRasgoBase = Array.from(new Set([...slugsRasgoClase, ...slugsRasgoRacial, ...slugsRasgoSubclase]));
    const [rasgosBaseDb, traduccionesRasgoBase] = await Promise.all([
      slugsRasgoBase.length
        ? Rasgo.findAll({
            where: { slug: slugsRasgoBase },
            attributes: ['slug', 'nombre', 'descripcion', 'modificadores']
          })
        : [],
      obtenerMapaTraducciones({
        entidad: 'Rasgo',
        campos: ['nombre', 'descripcion'],
        slugs: slugsRasgoBase
      })
    ]);
    const rasgosBasePorSlug = new Map();
    (rasgosBaseDb || []).forEach((rasgo) => {
      const data = typeof rasgo?.toJSON === 'function' ? rasgo.toJSON() : rasgo;
      const slug = String(data?.slug || '').trim();
      if (!slug) return;
      const nombreRasgo = traduccionesRasgoBase.get(`${slug}:nombre`) || data?.nombre || '';
      const descripcionRasgo = traduccionesRasgoBase.get(`${slug}:descripcion`) || data?.descripcion || '';
      rasgosBasePorSlug.set(slug, {
        ...data,
        nombre: nombreRasgo || '',
        descripcion: descripcionRasgo || ''
      });
    });

    const claseNiveles = claseNivelesDb.map((fila) => {
      const json = fila.toJSON();
      const rasgosTraducidos = (Array.isArray(json.Rasgos) ? json.Rasgos : []).map((rasgo) => {
        const slug = String(rasgo?.slug || '').trim();
        const nombreApi = String(rasgo?.nombre || '').trim();
        const descripcionApi = String(rasgo?.descripcion || '').trim();
        const rasgoBase = rasgosBasePorSlug.get(slug);
        const nombreTrad = traduccionesRasgoBase.get(`${slug}:nombre`);
        const descripcionTrad = traduccionesRasgoBase.get(`${slug}:descripcion`);
        return {
          index: slug,
          name: String(rasgoBase?.nombre || nombreTrad || nombreApi || slug).trim(),
          descripcion: String(rasgoBase?.descripcion || descripcionTrad || descripcionApi || '').trim(),
          modificadores: rasgo?.modificadores ?? rasgoBase?.modificadores ?? null
        };
      });
      return {
        ...json,
        rasgos: rasgosTraducidos
      };
    });

    const razaNiveles = razaNivelesDb.map((fila) => {
      const json = fila.toJSON();
      return {
        ...json,
        modificadores: parsearJsonFlexible(json.modificadores, json.modificadores),
        rasgos: Array.isArray(parsearJsonFlexible(json.rasgos, [])) ? parsearJsonFlexible(json.rasgos, []) : [],
        idiomas: parsearJsonFlexible(json.idiomas, json.idiomas)
      };
    });

    const mapaRasgoRacial = {};
    Array.from(slugsRasgoRacial).forEach((slug) => {
      const rasgoBase = rasgosBasePorSlug.get(slug);
      const nombreTrad = traduccionesRasgoBase.get(`${slug}:nombre`);
      const descripcionTrad = traduccionesRasgoBase.get(`${slug}:descripcion`);
      mapaRasgoRacial[slug] = {
        nombre: String(rasgoBase?.nombre || nombreTrad || '').trim(),
        descripcion: String(rasgoBase?.descripcion || descripcionTrad || '').trim()
      };
    });

    const slugsSubclases = (Array.isArray(subclasesDb) ? subclasesDb : [])
      .map((s) => String(s?.slug || '').trim())
      .filter(Boolean);
    const traduccionesSubclases = await obtenerMapaTraducciones({
      entidad: 'Subclase',
      campos: ['nombre', 'descripcion', 'tipo_subclase'],
      slugs: slugsSubclases
    });
    const subclases = (Array.isArray(subclasesDb) ? subclasesDb : [])
      .map((s) => {
        const json = typeof s?.toJSON === 'function' ? s.toJSON() : (s || {});
        const slug = String(json?.slug || '').trim();
        return {
          ...json,
          slug,
          nombre: String(traduccionesSubclases.get(`${slug}:nombre`) || json?.nombre || slug).trim(),
          descripcion: String(traduccionesSubclases.get(`${slug}:descripcion`) || json?.descripcion || '').trim(),
          tipo_subclase: String(traduccionesSubclases.get(`${slug}:tipo_subclase`) || json?.tipo_subclase || '').trim()
        };
      })
      .filter((s) => s.slug);

    const subclaseNiveles = (Array.isArray(subclaseNivelesDb) ? subclaseNivelesDb : [])
      .map((fila) => {
        const json = typeof fila?.toJSON === 'function' ? fila.toJSON() : (fila || {});
        const rasgosRaw = refsRasgoDesdeValor(json.rasgos);
        const rasgos = rasgosRaw.map((rasgoRef) => {
          const slug = String(rasgoRef?.index || '').trim();
          const rasgoBase = rasgosBasePorSlug.get(slug);
          const nombreTrad = traduccionesRasgoBase.get(`${slug}:nombre`);
          const descripcionTrad = traduccionesRasgoBase.get(`${slug}:descripcion`);
          return {
            index: slug,
            name: String(rasgoBase?.nombre || nombreTrad || rasgoRef?.name || slug).trim(),
            descripcion: String(rasgoBase?.descripcion || descripcionTrad || '').trim()
          };
        }).filter((r) => r.index || r.name);
        return {
          ...json,
          rasgos,
          lanzamiento_hechizo: parsearJsonFlexible(json.lanzamiento_hechizo, json.lanzamiento_hechizo)
        };
      });

    const slugsFeats = (Array.isArray(featsDb) ? featsDb : [])
      .map((f) => String(f?.slug || '').trim())
      .filter(Boolean);
    const traduccionesFeats = await obtenerMapaTraducciones({
      entidad: 'Feat',
      campos: ['nombre', 'descripcion'],
      slugs: slugsFeats
    });

    const featsCatalogo = (Array.isArray(featsDb) ? featsDb : [])
      .map((f) => {
        const json = typeof f?.toJSON === 'function' ? f.toJSON() : (f || {});
        const bonuses = json?.bonuses || null;
        const slug = String(json?.slug || '').trim();
        const nombreTrad = traduccionesFeats.get(`${slug}:nombre`);
        const descripcionTrad = traduccionesFeats.get(`${slug}:descripcion`);
        return {
          slug,
          nombre: String(nombreTrad || json?.nombre || slug).trim(),
          descripcion: typeof (descripcionTrad || json?.descripcion) === 'string' ? (descripcionTrad || json?.descripcion) : null,
          bonuses,
          ability_bonuses: bonuses && typeof bonuses === 'object' ? bonuses.ability_bonuses || null : null
        };
      })
      .filter((f) => f.slug);

    return res.render('crearPersonaje2', {
      title: 'Crear personaje · Paso 2',
      ...ctx,
      claseNiveles,
      subclases,
      subclaseNiveles,
      razaNiveles,
      mapaRasgoRacial,
      featsCatalogo
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error al cargar el paso 2');
  }
};

exports.renderCrearPaso3 = async (req, res) => {
  try {
    const ctx = await cargarContextoCreacion();
    return res.render('crearPersonaje3', { title: 'Crear personaje · Paso 3', ...ctx });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error al cargar el paso 3');
  }
};

exports.renderCrearPaso4 = async (req, res) => {
  try {
    const ctx = await cargarContextoCreacion();
    const subclasesDb = await Subclase.findAll({
      order: [['nombre', 'ASC']],
      attributes: ['id', 'ClaseId', 'slug', 'nombre', 'descripcion', 'tipo_subclase']
    });
    const traduccionesSubclases = await obtenerMapaTraducciones({
      entidad: 'Subclase',
      campos: ['nombre', 'descripcion', 'tipo_subclase'],
      slugs: subclasesDb.map((s) => s.slug)
    });
    aplicarTraduccionesEnLista(subclasesDb, traduccionesSubclases, ['nombre', 'descripcion', 'tipo_subclase']);
    const subclases = subclasesDb.map((s) => (typeof s.toJSON === 'function' ? s.toJSON() : s));

    const competenciasDb = await Competencia.findAll({
      attributes: ['slug', 'nombre', 'tipo', 'categoria'],
      order: [['nombre', 'ASC']]
    });
    const traduccionesCompetencias = await obtenerMapaTraducciones({
      entidad: 'Competencia',
      campos: ['nombre'],
      slugs: competenciasDb.map((c) => c.slug).filter(Boolean)
    });
    aplicarTraduccionesEnLista(competenciasDb, traduccionesCompetencias, ['nombre']);
    const competenciasCatalogo = competenciasDb.map((c) => (typeof c.toJSON === 'function' ? c.toJSON() : c));

    return res.render('crearPersonaje4', { title: 'Crear personaje · Paso 4', ...ctx, subclases, competenciasCatalogo });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error al cargar el paso 4');
  }
};

exports.finalizarCrearPaso3 = (req, res) => {
  if (!req.session.user) {
    req.session.mensajes = req.session.mensajes || {};
    req.session.mensajes.mensajeSesion = 'Debes iniciar sesión para crear un personaje.';
  }
  return res.redirect('/');
};

exports.crearPersonaje = async (req, res) => {
  try {
    const slugClase = typeof req.body.clase === 'string' ? req.body.clase.trim() : '';
    const slugRaza = typeof req.body.raza === 'string' ? req.body.raza.trim() : '';
    const slugSubraza = typeof req.body.subraza === 'string' ? req.body.subraza.trim() : '';

    const clase = slugClase ? await Clase.findOne({ where: { slug: slugClase } }) : null;
    const raza = slugRaza ? await Raza.findOne({ where: { slug: slugRaza } }) : null;

    if (!clase) {
      return res.status(400).send('Debes seleccionar una clase');
    }

    if (!raza) {
      return res.status(400).send('Debes seleccionar una raza');
    }

    const totalSubrazasDeRaza = await Subraza.count({ where: { RazaId: raza.id } });
    let subraza = null;
    if (totalSubrazasDeRaza > 0 && !slugSubraza) {
      return res.status(400).send('Debes seleccionar una subraza para la raza elegida');
    }
    if (slugSubraza) {
      subraza = await Subraza.findOne({
        where: {
          slug: slugSubraza,
          RazaId: raza.id
        }
      });
      if (!subraza) {
        return res.status(400).send('La subraza seleccionada no pertenece a la raza elegida');
      }
    }

    if (!req.session.user) {
      req.session.mensajes = req.session.mensajes || {};
      req.session.mensajes.mensajeSesion = 'Debes iniciar sesión para crear un personaje.';
      return res.redirect('/');
    }

    const usuarioId = req.session.user.id;
    const nivelTotal = Number(req.body.nivel) || 1;
    const vida = obtenerPuntosVida(nivelTotal, clase.id, Number(req.body.constitucion) || 8);
    const CA = calcularCA("sin armadura", 0, Number(req.body.destreza) || 8, 0 , 0);

    const personaje = await Personaje.create({
      nombre: req.body.nombre,
      nivelPersonaje: nivelTotal,
      imagen: req.body.imagen,
      ascendencia_draconida: typeof req.body.ascendencia_draconida === 'string' ? req.body.ascendencia_draconida.trim() : null,
      RazaId: raza.id,
      SubrazaId: subraza?.id || null,
      UsuarioId: usuarioId || null,
      vida_max: vida, 
      vida_actual: vida,
      clase_armadura: CA
    });

    await PersonajeClase.create({
      PersonajeId: personaje.id,
      ClaseId: clase.id,
      SubclaseId: null,
      nivel: nivelTotal,
      orden: 1
    });

    await Atributo.create({
      PersonajeId: personaje.id,
      fuerza: Number(req.body.fuerza) || 8,
      destreza: Number(req.body.destreza) || 8,
      constitucion: Number(req.body.constitucion) || 8,
      inteligencia: Number(req.body.inteligencia) || 8,
      sabiduria: Number(req.body.sabiduria) || 8,
      carisma: Number(req.body.carisma) || 8
    });

    return res.redirect('/');
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error al crear el personaje');
  }
};