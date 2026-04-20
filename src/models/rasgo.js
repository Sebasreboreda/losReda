const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Rasgo = sequelize.define('Rasgo', {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  descripcion: {
    type: DataTypes.TEXT
  },
  modificadores: {
    type: DataTypes.JSON
  },
  url_api: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'Rasgo',
  freezeTableName: true,
  timestamps: false
});

module.exports = Rasgo;