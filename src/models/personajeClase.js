const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

/** Niveles por clase en multiclase D&D 5e (una fila por clase en el personaje). */
const PersonajeClase = sequelize.define('PersonajeClase', {
  PersonajeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Personaje', key: 'id' },
    onDelete: 'CASCADE'
  },
  ClaseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Clase', key: 'id' }
  },
  SubclaseId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Subclase', key: 'id' }
  },
  nivel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: { min: 1 }
  },
  orden: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: { min: 1 }
  }
}, {
  tableName: 'PersonajeClase',
  freezeTableName: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['PersonajeId', 'ClaseId']
    }
  ]
});

module.exports = PersonajeClase;
