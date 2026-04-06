const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SubclaseNivel = sequelize.define('SubclaseNivel', {
  nivel: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  rasgos: {
    type: DataTypes.JSON
  },
  lanzamiento_hechizo: {
    type: DataTypes.JSON
  },
  SubclaseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Subclase', key: 'id' }
  }
}, {
  tableName: 'SubclaseNivel',
  freezeTableName: true,
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['SubclaseId', 'nivel']
    }
  ]
});

module.exports = SubclaseNivel;

