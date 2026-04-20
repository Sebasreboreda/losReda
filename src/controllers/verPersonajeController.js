const { Personaje, Atributo, Clase, Subclase, Raza, Subraza, Trasfondo, Usuario, Competencia, PersonajeClase, Objeto } = require('../models');
const { Op } = require('sequelize');
const { obtenerMapaTraducciones } = require('../services/traduccionService');
const {
  calcularModificadorEstadistica,
  formatearModificadorEstadistica,
  calcularProficiencyBonus,
  calcularIniciativa,
  ensamblarHabilidadesSalvacionesYSensos
} = require('../services/personajeService');
const { IMAGEN_POR_DEFECTO_URL } = require('../utils/personajeImages');

exports.renderVer = async (req, res) => {
  try {
    const { id } = req.params;

    const mensajes = req.session?.mensajes || null;
    if (req.session?.mensajes) {
      delete req.session.mensajes;
    }

    const personaje = await Personaje.findByPk(id, {
      include: [
        { model: Atributo },
        {
          model: PersonajeClase,
          as: 'PersonajeClases',
          include: [
            { model: Clase, include: [{ model: Competencia, through: { attributes: [] } }] },
            { model: Subclase }
          ]
        },
        { model: Raza },
        { model: Subraza },
        { model: Trasfondo },
        { model: Usuario },
        { model: Competencia, through: { attributes: ['competente', 'experto'] } },
        { model: Objeto, as: 'Objetos', through: { attributes: ['cantidad', 'equipado'] } }
      ]
    });

    if (!personaje) {
      return res.status(404).send('Personaje no encontrado');
    }

    const totalSubrazasDeRaza = personaje.RazaId
      ? await Subraza.count({ where: { RazaId: personaje.RazaId } })
      : 0;
    const mostrarSubraza = totalSubrazasDeRaza > 0;

    const filasClase = (personaje.PersonajeClases || []).slice().sort((a, b) => (a.orden || 0) - (b.orden || 0));
    const clasePrincipal = filasClase[0]?.Clase || null;

    const slugsClase = [...new Set(filasClase.map((f) => f.Clase?.slug).filter(Boolean))];
    const slugsSubclase = [...new Set(filasClase.map((f) => f.Subclase?.slug).filter(Boolean))];

    const traducciones = await Promise.all([
      slugsClase.length ? obtenerMapaTraducciones({ entidad: 'Clase', campos: ['nombre', 'descripcion'], slugs: slugsClase }) : new Map(),
      slugsSubclase.length ? obtenerMapaTraducciones({ entidad: 'Subclase', campos: ['nombre', 'descripcion'], slugs: slugsSubclase }) : new Map(),
      personaje.Raza?.slug ? obtenerMapaTraducciones({ entidad: 'Raza', campos: ['nombre', 'descripcion'], slugs: [personaje.Raza.slug] }) : new Map(),
      personaje.Subraza?.slug ? obtenerMapaTraducciones({ entidad: 'Subraza', campos: ['nombre', 'descripcion'], slugs: [personaje.Subraza.slug] }) : new Map(),
      personaje.Trasfondo?.slug ? obtenerMapaTraducciones({ entidad: 'Trasfondo', campos: ['nombre', 'descripcion'], slugs: [personaje.Trasfondo.slug] }) : new Map()
    ]);
    const [mapaClase, mapaSubclase, mapaRaza, mapaSubraza, mapaTrasfondo] = traducciones;

    for (const fila of filasClase) {
      if (fila.Clase?.slug) {
        fila.Clase.nombre = mapaClase.get(`${fila.Clase.slug}:nombre`) || fila.Clase.nombre;
        fila.Clase.descripcion = mapaClase.get(`${fila.Clase.slug}:descripcion`) || fila.Clase.descripcion;
      }
      if (fila.Subclase?.slug) {
        fila.Subclase.nombre = mapaSubclase.get(`${fila.Subclase.slug}:nombre`) || fila.Subclase.nombre;
        fila.Subclase.descripcion = mapaSubclase.get(`${fila.Subclase.slug}:descripcion`) || fila.Subclase.descripcion;
      }
    }
    if (personaje.Raza?.slug) {
      personaje.Raza.nombre = mapaRaza.get(`${personaje.Raza.slug}:nombre`) || personaje.Raza.nombre;
      personaje.Raza.descripcion = mapaRaza.get(`${personaje.Raza.slug}:descripcion`) || personaje.Raza.descripcion;
    }
    if (personaje.Subraza?.slug) {
      personaje.Subraza.nombre = mapaSubraza.get(`${personaje.Subraza.slug}:nombre`) || personaje.Subraza.nombre;
      personaje.Subraza.descripcion = mapaSubraza.get(`${personaje.Subraza.slug}:descripcion`) || personaje.Subraza.descripcion;
    }
    if (personaje.Trasfondo?.slug) {
      personaje.Trasfondo.nombre = mapaTrasfondo.get(`${personaje.Trasfondo.slug}:nombre`) || personaje.Trasfondo.nombre;
      personaje.Trasfondo.descripcion = mapaTrasfondo.get(`${personaje.Trasfondo.slug}:descripcion`) || personaje.Trasfondo.descripcion;
    }

    const ATRIBUTOS_HABILIDAD_VALIDOS = ['fuerza', 'destreza', 'constitucion', 'inteligencia', 'sabiduria', 'carisma'];
    const habilidadesCatalogo = await Competencia.findAll({
      where: {
        tipo: 'habilidad',
        atributo: { [Op.in]: ATRIBUTOS_HABILIDAD_VALIDOS }
      },
      order: [['nombre', 'ASC']]
    });

    const competenciasDelPersonajeRaw = Array.isArray(personaje.Competencia || personaje.Competencias)
      ? (personaje.Competencia || personaje.Competencias)
      : [];
    const competenciasDesdeClase = filasClase
      .flatMap((fila) => Array.isArray(fila?.Clase?.Competencia) ? fila.Clase.Competencia : [])
      .filter(Boolean);
    const parsearJsonSeguro = (valor, fallback) => {
      if (valor == null) return fallback;
      if (typeof valor === 'string') {
        try {
          return JSON.parse(valor);
        } catch (_) {
          return fallback;
        }
      }
      return valor;
    };
    const normalizarRef = (item, tipoForzado = null) => {
      if (!item) return null;
      if (typeof item === 'string') {
        const txt = item.trim();
        if (!txt) return null;
        return { slug: '', nombre: txt, tipo: tipoForzado || '' };
      }
      const slug = String(item.index || item.slug || '').trim();
      const nombre = String(item.name || item.nombre || slug || '').trim();
      if (!slug && !nombre) return null;
      return { slug, nombre, tipo: tipoForzado || String(item.tipo || '').trim() };
    };
    const esTextoDeEleccion = (txt) => {
      const t = String(txt || '').toLowerCase();
      return t.includes('choose ') || t.includes('a elegir') || t.includes('elige ') || t.includes('(choose');
    };
    const competenciasDesdeClaseLegacy = filasClase.flatMap((fila) => {
      const legacy = parsearJsonSeguro(fila?.Clase?.competencia, {});
      const refs = Array.isArray(legacy?.proficiencies) ? legacy.proficiencies : [];
      return refs.map((r) => normalizarRef(r)).filter(Boolean);
    });
    const idiomasDesdeRaza = (() => {
      const data = parsearJsonSeguro(personaje?.Raza?.idiomas, []);
      const lista = Array.isArray(data) ? data : [];
      return lista.map((i) => normalizarRef(i, 'idioma')).filter(Boolean);
    })();
    const herramientasDesdeTrasfondo = (() => {
      const data = parsearJsonSeguro(personaje?.Trasfondo?.competencias, {});
      const tools = Array.isArray(data?.tools || data?.tool_proficiencies)
        ? (data.tools || data.tool_proficiencies)
        : [];
      return tools
        .map((t) => normalizarRef(t, 'herramienta'))
        .filter((t) => t && !esTextoDeEleccion(t.nombre));
    })();
    const mapaCompetencias = new Map();
    for (const comp of [
      ...competenciasDelPersonajeRaw,
      ...competenciasDesdeClase,
      ...competenciasDesdeClaseLegacy,
      ...idiomasDesdeRaza,
      ...herramientasDesdeTrasfondo
    ]) {
      const plain = typeof comp?.toJSON === 'function' ? comp.toJSON() : comp;
      const key = String(plain?.slug || plain?.nombre || '').trim().toLowerCase();
      if (!key) continue;
      if (!mapaCompetencias.has(key)) mapaCompetencias.set(key, plain);
    }
    const competenciasDelPersonaje = Array.from(mapaCompetencias.values());

    function inferirTipoCompetenciaVisual(comp) {
      const tipoRaw = String(comp?.tipo || '').trim().toLowerCase();
      if (tipoRaw) {
        if (['habilidad', 'skill', 'skills'].includes(tipoRaw)) return 'habilidad';
        if (['arma', 'weapon', 'weapons'].includes(tipoRaw)) return 'arma';
        if (['armadura', 'armor', 'armour'].includes(tipoRaw)) return 'armadura';
        if (['idioma', 'language', 'languages'].includes(tipoRaw)) return 'idioma';
        if (['herramienta', 'tool', 'tools', 'instrument', 'instruments'].includes(tipoRaw)) return 'herramienta';
      }
      const texto = `${String(comp?.slug || '').toLowerCase()} ${String(comp?.nombre || '').toLowerCase()}`;
      if (texto.includes('armor') || texto.includes('armour') || texto.includes('shield')) return 'armadura';
      if (texto.includes('weapon')) return 'arma';
      if (texto.includes('language') || texto.includes('idioma')) return 'idioma';
      if (texto.includes('tool') || texto.includes('tools') || texto.includes('kit') || texto.includes('instrument') || texto.includes('gaming set')) return 'herramienta';
      return 'herramienta';
    }

    const fichaDnd = ensamblarHabilidadesSalvacionesYSensos({
      atributos: personaje.Atributo,
      nivel: Number(personaje.nivelPersonaje) || 1,
      tiradaSalvacion: clasePrincipal?.tirada_salvacion,
      habilidadesCatalogo,
      competenciasPersonaje: competenciasDelPersonaje
    });

    const slugsHab = fichaDnd.habilidades.map((h) => h.slug).filter(Boolean);
    const slugsComp = competenciasDelPersonaje.map((c) => String(c?.slug || '').trim()).filter(Boolean);
    const slugsCompetenciaTrad = Array.from(new Set([...slugsHab, ...slugsComp]));
    let mapaNombresCompetenciaEs = new Map();
    if (slugsCompetenciaTrad.length > 0) {
      mapaNombresCompetenciaEs = await obtenerMapaTraducciones({
        entidad: 'Competencia',
        campos: ['nombre'],
        slugs: slugsCompetenciaTrad,
        idioma: 'es'
      });
      for (const h of fichaDnd.habilidades) {
        const tr = mapaNombresCompetenciaEs.get(`${h.slug}:nombre`);
        if (tr) h.nombre = tr;
      }
    }

    const competenciasVisual = competenciasDelPersonaje.map((c) => {
      const plain = typeof c?.toJSON === 'function' ? c.toJSON() : c;
      const slug = String(plain?.slug || '').trim();
      const nombreTrad = slug ? mapaNombresCompetenciaEs.get(`${slug}:nombre`) : null;
      return {
        ...plain,
        slug,
        nombre: String(nombreTrad || plain?.nombre || slug || '').trim(),
        tipoVisual: inferirTipoCompetenciaVisual(plain)
      };
    });

    function textoCompetencia(comp) {
      return `${String(comp?.slug || '').toLowerCase()} ${String(comp?.nombre || '').toLowerCase()}`;
    }
    function esEscudo(comp) {
      const t = textoCompetencia(comp);
      return t.includes('shield') || t.includes('escudo');
    }
    function esTodasLasArmaduras(comp) {
      const t = textoCompetencia(comp);
      return t.includes('all-armor') || t.includes('all armor') || t.includes('todas las armaduras');
    }
    function nombresExpandido(comp) {
      const t = textoCompetencia(comp);
      if (comp?.tipoVisual !== 'armadura') return [String(comp?.nombre || '').trim()].filter(Boolean);
      if (esTodasLasArmaduras(comp)) return ['Armadura ligera', 'Armadura media', 'Armadura pesada'];
      if (t.includes('light-armor') || t.includes('light armor') || t.includes('armadura ligera')) return ['Armadura ligera'];
      if (t.includes('medium-armor') || t.includes('medium armor') || t.includes('armadura media')) return ['Armadura media'];
      if (t.includes('heavy-armor') || t.includes('heavy armor') || t.includes('armadura pesada')) return ['Armadura pesada'];
      if (esEscudo(comp)) return ['Escudo'];
      return [String(comp?.nombre || '').trim()].filter(Boolean);
    }
    function ordenarConPrioridad(lista, prioridad) {
      const idx = new Map(prioridad.map((v, i) => [v, i]));
      return [...lista].sort((a, b) => {
        const ia = idx.has(a) ? idx.get(a) : Number.MAX_SAFE_INTEGER;
        const ib = idx.has(b) ? idx.get(b) : Number.MAX_SAFE_INTEGER;
        if (ia !== ib) return ia - ib;
        return String(a).localeCompare(String(b), 'es');
      });
    }
    const grupos = {
      armadura: new Set(),
      arma: new Set(),
      idioma: new Set(),
      herramienta: new Set()
    };
    let tieneEscudo = false;
    for (const comp of competenciasVisual) {
      if (!comp || comp.tipoVisual === 'habilidad') continue;
      const tipo = ['armadura', 'arma', 'idioma', 'herramienta'].includes(comp.tipoVisual) ? comp.tipoVisual : 'herramienta';
      const nombres = nombresExpandido(comp);
      nombres.forEach((n) => grupos[tipo].add(n));
      if (tipo === 'armadura' && (esEscudo(comp) || esTodasLasArmaduras(comp))) tieneEscudo = true;
    }
    const listaArmaduras = ordenarConPrioridad(
      [...grupos.armadura].filter((n) => n !== 'Escudo'),
      ['Armadura ligera', 'Armadura media', 'Armadura pesada']
    );
    const listaArmas = ordenarConPrioridad(grupos.arma, []);
    const listaIdiomas = ordenarConPrioridad(grupos.idioma, []);
    const listaHerramientas = ordenarConPrioridad(grupos.herramienta, []);

    const competenciasAgrupadas = {
      armadura: listaArmaduras.length ? listaArmaduras.join(', ') : 'Sin competencias de armadura',
      escudo: tieneEscudo,
      arma: listaArmas.length ? listaArmas.join(', ') : 'Sin competencias de arma',
      idioma: listaIdiomas.length ? listaIdiomas.join(', ') : 'Sin competencias de idioma',
      herramienta: listaHerramientas.length ? listaHerramientas.join(', ') : 'Sin competencias de herramientas'
    };

    // Etiquetas que antes iban hardcodeadas dentro del EJS.
    const slugsTextosDirectos = [
      'fuerza',
      'destreza',
      'constitucion',
      'inteligencia',
      'sabiduria',
      'carisma',
      'fuerza_abrev',
      'destreza_abrev',
      'constitucion_abrev',
      'inteligencia_abrev',
      'sabiduria_abrev',
      'carisma_abrev',
      'raza_nombre',
      'raza_slug',
      'raza_tamano',
      'raza_velocidad',
      'subraza_nombre',
      'subraza_slug',
      'subraza_descripcion'
    ];

    const traduccionesTextosDirectos = await obtenerMapaTraducciones({
      entidad: 'TextoDirecto',
      campos: ['nombre'],
      slugs: slugsTextosDirectos,
      idioma: 'es'
    });

    const textosDirectos = {};
    for (const [key, value] of traduccionesTextosDirectos.entries()) {
      const [slug] = String(key || '').split(':');
      if (!slug) continue;
      textosDirectos[slug] = value;
    }

    const user = req.session?.user || null;
    const puedeEditarVida =
      !!user &&
      personaje.UsuarioId != null &&
      Number(personaje.UsuarioId) === Number(user.id);

    return res.render('verPersonaje', {
      title: personaje.nombre,
      personaje,
      mostrarSubraza,
      mensajes,
      puedeEditarVida,
      calcularModificadorEstadistica,
      formatearModificadorEstadistica,
      calcularProficiencyBonus,
      calcularIniciativa,
      imagenPorDefectoUrl: IMAGEN_POR_DEFECTO_URL,
      fichaDnd,
      competenciasVisual,
      competenciasAgrupadas,
      textosDirectos
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error al cargar el personaje');
  }
};

exports.actualizarVidaActual = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.session.user) {
      req.session.mensajes = req.session.mensajes || {};
      req.session.mensajes.mensajeSesion = 'Debes iniciar sesión para modificar la vida del personaje.';
      return res.redirect(`/personajes/${id}`);
    }

    const usuarioId = req.session.user.id;
    const personaje = await Personaje.findOne({
      where: { id, UsuarioId: usuarioId }
    });
    if (!personaje) {
      req.session.mensajes = req.session.mensajes || {};
      req.session.mensajes.mensajeSesion = 'No puedes modificar la vida de este personaje.';
      return res.redirect(`/personajes/${id}`);
    }

    const raw = req.body.vida_actual;
    if (raw === '' || raw == null) {
      return res.redirect(`/personajes/${id}`);
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      return res.redirect(`/personajes/${id}`);
    }

    const vida_max = personaje.vida_max;
    if (vida_max == null || !Number.isFinite(Number(vida_max)) || Number(vida_max) < 1) {
      return res.redirect(`/personajes/${id}`);
    }

    const vmax = Math.floor(Number(vida_max));
    let vida_actual = Math.floor(n);
    if (vida_actual < 0) vida_actual = 0;
    if (vida_actual > vmax) vida_actual = vmax;

    await personaje.update({ vida_actual });
    return res.redirect(`/personajes/${id}`);
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error al actualizar la vida');
  }
};
