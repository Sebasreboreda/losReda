const { Personaje, Atributo, Clase, Subclase, Raza, Subraza, Trasfondo, Usuario, Competencia, PersonajeClase } = require('../models');
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
        { model: PersonajeClase, as: 'PersonajeClases', include: [{ model: Clase }, { model: Subclase }] },
        { model: Raza },
        { model: Subraza },
        { model: Trasfondo },
        { model: Usuario },
        { model: Competencia, through: { attributes: ['competente', 'experto'] } }
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

    const habilidadesCatalogo = await Competencia.findAll({
      where: { tipo: 'habilidad' },
      order: [['nombre', 'ASC']]
    });

    const competenciasDelPersonaje = personaje.Competencia || personaje.Competencias || [];

    const fichaDnd = ensamblarHabilidadesSalvacionesYSensos({
      atributos: personaje.Atributo,
      nivel: Number(personaje.nivelPersonaje) || 1,
      tiradaSalvacion: clasePrincipal?.tirada_salvacion,
      habilidadesCatalogo,
      competenciasPersonaje: competenciasDelPersonaje
    });

    const slugsHab = fichaDnd.habilidades.map((h) => h.slug).filter(Boolean);
    if (slugsHab.length > 0) {
      const mapaNombresHabilidadEs = await obtenerMapaTraducciones({
        entidad: 'Competencia',
        campos: ['nombre'],
        slugs: slugsHab,
        idioma: 'es'
      });
      for (const h of fichaDnd.habilidades) {
        const tr = mapaNombresHabilidadEs.get(`${h.slug}:nombre`);
        if (tr) h.nombre = tr;
      }
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
      fichaDnd
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
