const { DataTypes } = require('sequelize');  
const sequelize = require('../config/db'); 
 
const ClaseCompetencia = sequelize.define('ClaseCompetencia', {
  ClaseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Clase', key: 'id' }
  },
  CompetenciaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Competencia', key: 'id' }
  }
}, { 
  tableName: 'ClaseCompetencia', 
  freezeTableName: true, 
  timestamps: false
}); 
 
module.exports = ClaseCompetencia;
