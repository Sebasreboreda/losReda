const { Personaje, Usuario, Clase, Subclase, Raza, Subraza, PersonajeClase } = require('../models');
const { obtenerMapaTraducciones } = require('../services/traduccionService');

function slugsUnicos(personajes, getter) {
  const set = new Set();
  for (const p of personajes || []) {
    const slug = getter(p);
    if (slug) set.add(slug);
  }
  return [...set];
}

function aplicarTraduccionesNombresCatalogo(personajes, mapas) {
  const { mapaClase, mapaSubclase, mapaRaza, mapaSubraza } = mapas;
  for (const p of personajes || []) {
    for (const fila of p.PersonajeClases || []) {
      if (fila.Clase?.slug) {
        const trClase = mapaClase.get(`${fila.Clase.slug}:nombre`);
        if (trClase) fila.Clase.nombre = trClase;
      }
      if (fila.Subclase?.slug) {
        const trSub = mapaSubclase.get(`${fila.Subclase.slug}:nombre`);
        if (trSub) fila.Subclase.nombre = trSub;
      }
    }
    if (p.Raza?.slug) {
      const tr = mapaRaza.get(`${p.Raza.slug}:nombre`);
      if (tr) p.Raza.nombre = tr;
    }
    if (p.Subraza?.slug) {
      const tr = mapaSubraza.get(`${p.Subraza.slug}:nombre`);
      if (tr) p.Subraza.nombre = tr;
    }
  }
}

exports.renderHome = async (req, res) => {
  const mensajes = req.session?.mensajes || null;
  if (req.session?.mensajes) {
    delete req.session.mensajes;
  }

  const user = req.session?.user || null;
  let personajes = [];
  let usuarios = [];

  try {
    const includeCatalogo = [
      { model: PersonajeClase, as: 'PersonajeClases', include: [{ model: Clase }, { model: Subclase }] },
      { model: Raza },
      { model: Subraza }
    ];
    if (user) {
      personajes = await Personaje.findAll({
        where: { UsuarioId: user.id },
        include: includeCatalogo,
        order: [['id', 'ASC']]
      });
    } else { // Sin sesión: Muestra los personajes para la visualizacion general
      personajes = await Personaje.findAll({
        include: includeCatalogo,
        order: [['id', 'ASC']]
      });
    }

    const idioma = 'es';
    const sClase = slugsUnicos(
      personajes.flatMap((p) => p.PersonajeClases || []),
      (f) => f.Clase?.slug
    );
    const sSubclase = slugsUnicos(
      personajes.flatMap((p) => p.PersonajeClases || []),
      (f) => f.Subclase?.slug
    );
    const sRaza = slugsUnicos(personajes, (p) => p.Raza?.slug);
    const sSubraza = slugsUnicos(personajes, (p) => p.Subraza?.slug);

    const [mapaClase, mapaSubclase, mapaRaza, mapaSubraza] = await Promise.all([
      sClase.length
        ? obtenerMapaTraducciones({ entidad: 'Clase', campos: ['nombre'], slugs: sClase, idioma })
        : Promise.resolve(new Map()),
      sSubclase.length
        ? obtenerMapaTraducciones({ entidad: 'Subclase', campos: ['nombre'], slugs: sSubclase, idioma })
        : Promise.resolve(new Map()),
      sRaza.length
        ? obtenerMapaTraducciones({ entidad: 'Raza', campos: ['nombre'], slugs: sRaza, idioma })
        : Promise.resolve(new Map()),
      sSubraza.length
        ? obtenerMapaTraducciones({ entidad: 'Subraza', campos: ['nombre'], slugs: sSubraza, idioma })
        : Promise.resolve(new Map())
    ]);
    aplicarTraduccionesNombresCatalogo(personajes, {
      mapaClase,
      mapaSubclase,
      mapaRaza,
      mapaSubraza
    });
  } catch (error) {
    console.error(error);
  }

  try {//Muestra la lista de usuarios, para ver si se guardan correctamente
    usuarios = await Usuario.findAll({
      order: [['id', 'ASC']]
    });
  } catch (error) {
    console.error(error);
  }

  return res.render('home', {
    title: 'Inicio',
    personajes,
    usuarios,
    mensajes
  });
};
