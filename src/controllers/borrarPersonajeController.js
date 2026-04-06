const { Personaje } = require('../models');

exports.borrarPersonaje = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.session.user) {
            req.session.mensajes = req.session.mensajes || {};
            req.session.mensajes.mensajeSesion = 'Debes iniciar sesión para eliminar un personaje.';
            return res.redirect('/');
        }

        const idUsuario = req.session.user.id;

        await Personaje.destroy({
            where: { id, UsuarioId: idUsuario }
        });
        return res.redirect('/');
    }
    catch (error) {
        console.error(error);
        return res.status(500).send('Error al borrar el personaje');
    }
}