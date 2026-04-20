const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Objeto = sequelize.define('Objeto', {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  tipo: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'otro'
  },
  descripcion: {
    type: DataTypes.TEXT
  },
  estadisticas: {
    type: DataTypes.JSON
  }
}, {
  tableName: 'Objeto',
  freezeTableName: true,
  timestamps: false
});

module.exports = Objeto;