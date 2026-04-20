const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SubrazaRasgo = sequelize.define('SubrazaRasgo', {
  SubrazaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Subraza', key: 'id' }
  },
  RasgoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Rasgo', key: 'id' }
  }
}, {
  tableName: 'SubrazaRasgo',
  freezeTableName: true,
  timestamps: false,
  indexes: [{ unique: true, fields: ['SubrazaId', 'RasgoId'] }]
});

module.exports = SubrazaRasgo;