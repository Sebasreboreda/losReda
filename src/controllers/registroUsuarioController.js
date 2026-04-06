const bcrypt = require('bcryptjs');
const { Usuario } = require('../models');

exports.renderRegistro = async (req, res) => {
    if (req.session?.user) {
        return res.redirect('/');
    }
    return res.render('crearCuenta', { title: 'Registro', error: null, errorCorreo: null, errorNombre: null, errorContraseña: null });
};

exports.crearCuenta = async (req, res) => {
    const errores = {
            error: null,
            errorCorreo: null,
            errorNombre: null,
            errorContraseña: null
        };
    const correoInput = typeof req.body.correo;
    const nombreInput = typeof req.body.nombre;
    try {
        const correo = typeof req.body.correo === 'string' ? req.body.correo.trim().toLowerCase() : '';
        const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim().toLowerCase() : '';
        const correoInput = typeof req.body.correo;
        const nombreInput = typeof req.body.nombre;
        const contrasena = typeof req.body.contrasena === 'string' ? req.body.contrasena : '';
        const verificarContrasena = typeof req.body.verificar_contrasena === 'string' ? req.body.verificar_contrasena : '';

        const errores = {
            error: null,
            errorCorreo: null,
            errorNombre: null,
            errorContraseña: null
        };

        if (!correo || !contrasena || !verificarContrasena) {
            errores.error = 'Datos incompletos';
        }

        if (contrasena !== verificarContrasena) {
            errores.errorContraseña = 'Las contraseñas no coinciden';
        }

        const existeCorreo = await Usuario.findOne({ where: { correo } });
        if (existeCorreo) {
            errores.errorCorreo = 'Ese correo ya está registrado';
        }

        const existeNombre = await Usuario.findOne({ where: { nombre } });
        if (existeNombre) {
            errores.errorNombre = 'Ese nombre ya está en uso';
        }

        const hayErrores = errores.error || errores.errorCorreo || errores.errorNombre || errores.errorContraseña;
        if (hayErrores) {
            return res.status(400).render('crearCuenta', { title: 'Registro', ...errores, nombre: nombreInput, correo: correoInput });
        }

        const passwordHash = await bcrypt.hash(contrasena, 10);

        const usuarioCreado = await Usuario.create({
            nombre,
            correo,
            contrasena: passwordHash
        });

        req.session.user = {
            id: usuarioCreado.id,
            nombre: usuarioCreado.nombre,
            correo: usuarioCreado.correo
        };

        return res.redirect('/');
    } catch (error) {
        console.error(error);
        return res.status(500).render('crearCuenta', { title: 'Registro', error: 'Error al crear la cuenta', ...errores, nombre: nombreInput, correo: correoInput });
    }
};