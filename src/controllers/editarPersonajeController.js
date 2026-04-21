const { Personaje, Clase, Subclase, Raza, Subraza, Atributo, PersonajeClase } = require('../models');
const { listarImagenesPersonaje } = require('../utils/personajeImages');
const { obtenerPuntosVida, calcularCA } = require('../services/personajeService');
const { obtenerMapaTraducciones, aplicarTraduccionesEnLista } = require('../services/traduccionService');

exports.renderEditar = async (req, res) => {
  try {
    const { id } = req.params;
    const personaje = await Personaje.findByPk(id, {
      include: [
        { model: Atributo },
        { model: PersonajeClase, as: 'PersonajeClases', include: [{ model: Clase }, { model: Subclase }] },
        { model: Raza },
        { model: Subraza }
      ]
    });

    if (!personaje) {
      return res.status(404).send('Personaje no encontrado');
    }

    const imagenesDisponibles = await listarImagenesPersonaje();

    const clases = await Clase.findAll({
      order: [['nombre', 'ASC']],
      attributes: { exclude: ['createdAt', 'updatedAt'] }
    });

    const razas = await Raza.findAll({
      order: [['nombre', 'ASC']],
      attributes: { exclude: ['createdAt', 'updatedAt'] }
    });
    const subrazas = await Subraza.findAll({
      order: [['nombre', 'ASC']],
      attributes: ['id', 'nombre', 'slug', 'RazaId']
    });
    const [traduccionesClases, traduccionesRazas, traduccionesSubrazas] = await Promise.all([
      obtenerMapaTraducciones({ entidad: 'Clase', campos: ['nombre'], slugs: clases.map((c) => c.slug) }),
      obtenerMapaTraducciones({ entidad: 'Raza', campos: ['nombre'], slugs: razas.map((r) => r.slug) }),
      obtenerMapaTraducciones({ entidad: 'Subraza', campos: ['nombre'], slugs: subrazas.map((s) => s.slug) })
    ]);
    aplicarTraduccionesEnLista(clases, traduccionesClases, ['nombre']);
    aplicarTraduccionesEnLista(razas, traduccionesRazas, ['nombre']);
    aplicarTraduccionesEnLista(subrazas, traduccionesSubrazas, ['nombre']);

    const atributos = [
      { nombre: 'Fuerza', campo: 'fuerza' },
      { nombre: 'Destreza', campo: 'destreza' },
      { nombre: 'Constitución', campo: 'constitucion' },
      { nombre: 'Inteligencia', campo: 'inteligencia' },
      { nombre: 'Sabiduría', campo: 'sabiduria' },
      { nombre: 'Carisma', campo: 'carisma' }
    ];

    return res.render('editarPersonaje', {
      title: 'Editar personaje',
      personaje,
      imagenesDisponibles,
      atributos,
      clases,
      razas,
      subrazas
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error al cargar el personaje');
  }
};

exports.editarPersonaje = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.session.user) {
      req.session.mensajes = req.session.mensajes || {};
      req.session.mensajes.mensajeSesion = 'Debes iniciar sesión para editar un personaje.';
      return res.redirect('/');
    }

    const idUsuario = req.session.user.id;
    const claseId = Number(req.body.clase) || null;
    const razaId = Number(req.body.raza) || null;
    const subrazaId = Number(req.body.subraza) || null;

    if (!claseId || !razaId) {
      req.session.mensajes = req.session.mensajes || {};
      req.session.mensajes.mensajeSesion = 'Debes seleccionar una clase y una raza válidas.';
      return res.redirect('/');
    }

    if (subrazaId) {
      const subraza = await Subraza.findOne({ where: { id: subrazaId, RazaId: razaId } });
      if (!subraza) {
        req.session.mensajes = req.session.mensajes || {};
        req.session.mensajes.mensajeSesion = 'La subraza seleccionada no pertenece a la raza elegida.';
        return res.redirect('/');
      }
    }

    const claseSeleccionada = await Clase.findByPk(claseId, { attributes: ['id', 'dado_vida'] });
    if (!claseSeleccionada) {
      req.session.mensajes = req.session.mensajes || {};
      req.session.mensajes.mensajeSesion = 'La clase seleccionada no existe.';
      return res.redirect('/');
    }

    const nivelTotal = Number(req.body.nivel) || 1;
    const vida = obtenerPuntosVida(nivelTotal, claseSeleccionada.dado_vida, Number(req.body.constitucion) || 8);

    const [modificado] = await Personaje.update(
      {
        nombre: req.body.nombre,
        nivelPersonaje: nivelTotal,
        imagen: req.body.imagen,
        RazaId: razaId,
        SubrazaId: subrazaId,
        vida_max: vida,
        vida_actual: vida,
        clase_armadura: calcularCA("sin armadura", 0, Number(req.body.destreza) || 8, 0, 0)
      },
      { where: { id, UsuarioId: idUsuario } }
    );

    if (modificado === 0) {
      req.session.mensajes = req.session.mensajes || {};
      req.session.mensajes.mensajeError = 'Error al editar el personaje.';
      return res.redirect('/');
    }

    await PersonajeClase.destroy({ where: { PersonajeId: id } });
    await PersonajeClase.create({
      PersonajeId: id,
      ClaseId: claseId,
      SubclaseId: null,
      nivel: nivelTotal,
      orden: 1
    });

    await Atributo.update(
      {
        fuerza: Number(req.body.fuerza) || 8,
        destreza: Number(req.body.destreza) || 8,
        constitucion: Number(req.body.constitucion) || 8,
        inteligencia: Number(req.body.inteligencia) || 8,
        sabiduria: Number(req.body.sabiduria) || 8,
        carisma: Number(req.body.carisma) || 8
      },
      { where: { PersonajeId: id } }
    );

    return res.redirect('/');
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error al editar el personaje');
  }
};
