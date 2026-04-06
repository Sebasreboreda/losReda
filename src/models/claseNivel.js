const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ClaseNivel = sequelize.define('ClaseNivel', {
  nivel: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  bonus_competencia: {
    type: DataTypes.INTEGER
  },
  mejora_puntuacion: {
    type: DataTypes.INTEGER
  },
  rasgos: {
    type: DataTypes.JSON
  },
  lanzamiento_hechizo: {
    type: DataTypes.JSON
  },
  ClaseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Clase', key: 'id' }
  }
}, {
  tableName: 'ClaseNivel',
  freezeTableName: true,
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['ClaseId', 'nivel']
    }
  ]
});

module.exports = ClaseNivel;

