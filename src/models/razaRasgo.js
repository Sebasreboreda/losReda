const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RazaRasgo = sequelize.define('RazaRasgo', {
  RazaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Raza', key: 'id' }
  },
  RasgoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Rasgo', key: 'id' }
  }
}, {
  tableName: 'RazaRasgo',
  freezeTableName: true,
  timestamps: false,
  indexes: [{ unique: true, fields: ['RazaId', 'RasgoId'] }]
});

module.exports = RazaRasgo;