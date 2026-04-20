const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const InventarioPersonaje = sequelize.define('InventarioPersonaje', {
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: { min: 0 }
  },
  equipado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  datos: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'InventarioPersonaje',
  freezeTableName: true,
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['PersonajeId', 'ObjetoId']
    }
  ]
});

module.exports = InventarioPersonaje;