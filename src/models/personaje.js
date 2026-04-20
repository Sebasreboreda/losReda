const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Personaje = sequelize.define('Personaje', {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nivelPersonaje: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    validate: { min: 1, max: 20 }
  }, 
  alineamiento: {
    type: DataTypes.STRING
  },
  vida_actual: {
    type: DataTypes.INTEGER
  },
  vida_max: {
    type: DataTypes.INTEGER
  },
  clase_armadura: {
    type: DataTypes.INTEGER
  },
  imagen: {
    type: DataTypes.STRING,
    defaultValue: '/images/personajesDefecto/imagenPorDefecto.avif'
  },
  ascendencia_draconida: {
    type: DataTypes.STRING,
    allowNull: true
  },
  RazaId: {
    type: DataTypes.INTEGER,
    references: { model: 'Raza', key: 'id' }
  },
  SubrazaId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Subraza', key: 'id' }
  },
  TrasfondoId: {
    type: DataTypes.INTEGER,
    references: { model: 'Trasfondo', key: 'id' }
  },
  UsuarioId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Usuario', key: 'id' }
  }
}, {
  tableName: 'Personaje',
  freezeTableName: true,
  timestamps: true,
  scopes: {
    completo: {
      include: [
        {
          association: 'PersonajeClases',
          include: [{ association: 'Clase' }, { association: 'Subclase' }]
        },
        'Raza',
        'Trasfondo',
        'Atributo',
        'Feats',
        'Hechizos',
        'Competencia',
        'Objetos'
      ]
    }
  }
});

module.exports = Personaje;