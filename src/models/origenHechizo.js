const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const OrigenHechizo = sequelize.define('OrigenHechizo', {
  origen_tipo: {
    type: DataTypes.ENUM('clase', 'raza', 'subraza'),
    allowNull: false
  },
  nivel_minimo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: { min: 1, max: 20 }
  },
  HechizoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Hechizo', key: 'id' }
  },
  ClaseId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Clase', key: 'id' }
  },
  RazaId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Raza', key: 'id' }
  },
  SubrazaId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Subraza', key: 'id' }
  }
}, {
  tableName: 'OrigenHechizo',
  freezeTableName: true,
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['HechizoId', 'origen_tipo', 'ClaseId', 'RazaId', 'SubrazaId']
    }
  ]
});

module.exports = OrigenHechizo;