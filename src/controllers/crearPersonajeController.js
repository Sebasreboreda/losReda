const { Personaje, Clase, Raza, Subraza, Atributo, PersonajeClase } = require('../models');
const { listarImagenesPersonaje } = require('../utils/personajeImages');
const { obtenerPuntosVida, calcularCA } = require('../services/personajeService');
const { obtenerMapaTraducciones, aplicarTraduccionesEnLista } = require('../services/traduccionService');

const IMAGEN_POR_DEFECTO = '/images/personajesDefecto/imagenPorDefecto.avif';

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

async function cargarContextoCreacion() {
  const imagenesDisponibles = await listarImagenesPersonaje();
  const clasesDb = await Clase.findAll({
    order: [['nombre', 'ASC']],
    attributes: { exclude: ['createdAt', 'updatedAt'] }
  });
  const razasDb = await Raza.findAll({
    order: [['nombre', 'ASC']],
    attributes: { exclude: ['createdAt', 'updatedAt'] }
  });
  const subrazas = await Subraza.findAll({
    order: [['nombre', 'ASC']],
    attributes: ['nombre', 'slug', 'RazaId']
  });
  const [traduccionesClases, traduccionesRazas, traduccionesSubrazas] = await Promise.all([
    obtenerMapaTraducciones({ entidad: 'Clase', campos: ['nombre'], slugs: clasesDb.map((c) => c.slug) }),
    obtenerMapaTraducciones({ entidad: 'Raza', campos: ['nombre'], slugs: razasDb.map((r) => r.slug) }),
    obtenerMapaTraducciones({ entidad: 'Subraza', campos: ['nombre'], slugs: subrazas.map((s) => s.slug) })
  ]);
  aplicarTraduccionesEnLista(clasesDb, traduccionesClases, ['nombre']);
  aplicarTraduccionesEnLista(razasDb, traduccionesRazas, ['nombre']);
  aplicarTraduccionesEnLista(subrazas, traduccionesSubrazas, ['nombre']);

  const clases = clasesDb.map((clase) => {
    const data = clase.toJSON();
    return {
      ...data,
      imagenUrl: obtenerRutaImagenCatalogo('/images/imagenesClase', data.nombre)
    };
  });
  const razas = razasDb.map((raza) => {
    const data = raza.toJSON();
    return {
      ...data,
      imagenUrl: obtenerRutaImagenCatalogo('/images/imagenesRaza', data.nombre)
    };
  });

  const atributos = [
    { nombre: 'Fuerza', campo: 'fuerza' },
    { nombre: 'Destreza', campo: 'destreza' },
    { nombre: 'Constitución', campo: 'constitucion' },
    { nombre: 'Inteligencia', campo: 'inteligencia' },
    { nombre: 'Sabiduría', campo: 'sabiduria' },
    { nombre: 'Carisma', campo: 'carisma' }
  ];

  return { imagenesDisponibles, clases, razas, subrazas, atributos };
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
    return res.render('crearPersonaje2', { title: 'Crear personaje · Paso 2', ...ctx });
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