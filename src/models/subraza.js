const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Subraza = sequelize.define('Subraza', {
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
  bonuses: {
    type: DataTypes.JSON
  },
  rasgos: {
    type: DataTypes.JSON
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
  tableName: 'Subraza',
  freezeTableName: true,
  timestamps: false
});

module.exports = Subraza;

