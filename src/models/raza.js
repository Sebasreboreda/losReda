const { DataTypes } = require('sequelize');  
const sequelize = require('../config/db'); 
 
const Raza = sequelize.define('Raza', { 
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
  velocidad: { 
    type: DataTypes.INTEGER 
  }, 
  tamano: { 
    type: DataTypes.STRING 

  }, 
  tamano_desc: { 
    type: DataTypes.STRING 

  }, 
  idiomas: { 
    type: DataTypes.JSON 

  }, 
  traits: { 
    type: DataTypes.JSON 

  }, 
  edad: { 
    type: DataTypes.TEXT 

  }, 
  alineamiento: { 
    type: DataTypes.TEXT 

  }, 
  lenguaje_desc: { 
    type: DataTypes.TEXT 

  } 
}, { 
  tableName: 'Raza', 
  freezeTableName: true,
    timestamps: false
}); 
 
module.exports = Raza;
