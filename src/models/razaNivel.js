const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RazaNivel = sequelize.define('RazaNivel', {
  nivel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  modificadores: {
    type: DataTypes.JSON
  },
  rasgos: {
    type: DataTypes.JSON
  },
  velocidad: {
    type: DataTypes.INTEGER
  },
  idiomas: {
    type: DataTypes.JSON
  },
  RazaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Raza', key: 'id' }
  }
}, {
  tableName: 'RazaNivel',
  freezeTableName: true,
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['RazaId', 'nivel']
    }
  ]
});

module.exports = RazaNivel;

