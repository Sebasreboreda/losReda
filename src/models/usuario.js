const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Usuario = sequelize.define("Usuario", {

    id:{
        type: DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    nombre:{
        type: DataTypes.STRING,
        allowNull:false,
        unique:true
    },
    correo:{
        type: DataTypes.STRING,
        allowNull:false,
        unique:true
    },
    contrasena:{
        type: DataTypes.STRING,
        allowNull:false
    }

},{
    tableName: "Usuario",
    freezeTableName: true,
    timestamps: true
});

module.exports = Usuario;