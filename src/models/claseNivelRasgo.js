const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ClaseNivelRasgo = sequelize.define('ClaseNivelRasgo', {
  ClaseNivelId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'ClaseNivel', key: 'id' }
  },
  RasgoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Rasgo', key: 'id' }
  }
}, {
  tableName: 'ClaseNivelRasgo',
  freezeTableName: true,
  timestamps: false,
  indexes: [{ unique: true, fields: ['ClaseNivelId', 'RasgoId'] }]
});

module.exports = ClaseNivelRasgo;