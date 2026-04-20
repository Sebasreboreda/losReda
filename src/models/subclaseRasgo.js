const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SubclaseRasgo = sequelize.define('SubclaseRasgo', {
  SubclaseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Subclase', key: 'id' }
  },
  RasgoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Rasgo', key: 'id' }
  }
}, {
  tableName: 'SubclaseRasgo',
  freezeTableName: true,
  timestamps: false,
  indexes: [{ unique: true, fields: ['SubclaseId', 'RasgoId'] }]
});

module.exports = SubclaseRasgo;