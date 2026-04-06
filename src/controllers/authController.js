const bcrypt = require('bcryptjs');
const { Usuario } = require('../models');

exports.renderLogin = async (req, res) => {
  if (req.session?.user) {
    return res.redirect('/');
  }
  return res.render('login', { title: 'Iniciar sesión', error: null });
};

exports.login = async (req, res) => {
  try {
    const correo = typeof req.body.correo === 'string' ? req.body.correo.trim().toLowerCase() : '';
    const contrasena = typeof req.body.contrasena === 'string' ? req.body.contrasena : '';

    if (!correo || !contrasena) {
      return res.status(400).render('login', { title: 'Iniciar sesión', error: 'Correo y contraseña son obligatorios' });
    }

    const usuario = await Usuario.findOne({ where: { correo } });
    if (!usuario) {
      return res.status(401).render('login', { title: 'Iniciar sesión', error: 'Credenciales incorrectas' });
    }

    const ok = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!ok) {
      return res.status(401).render('login', { title: 'Iniciar sesión', error: 'Credenciales incorrectas' });
    }

    req.session.user = {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo
    };
    
    req.session.mensajes = req.session.mensajes || {};
    req.session.mensajes.mensajeBienvenida = `Bienvenido/a ${usuario.nombre}`;

    return res.redirect('/');
  } catch (error) {
    console.error(error);
    return res.status(500).render('login', { title: 'Iniciar sesión', error: 'Error al iniciar sesión' });
  }
};

exports.logout = async (req, res) => {
  try {
    req.session.destroy(() => {
      res.redirect('/');
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error al cerrar sesión');
  }
};