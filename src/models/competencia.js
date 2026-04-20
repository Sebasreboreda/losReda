const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Competencia = sequelize.define("Competencia", {

    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },

    slug: {
        type: DataTypes.STRING,
        unique: true
    },

    tipo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    /*
    tipos posibles:
    habilidad
    arma
    armadura
    herramienta
    idioma
    */

    atributo: {
        type: DataTypes.STRING
    },

    categoria: {
        type: DataTypes.STRING
    }
    /*
    Solo para habilidades:
    Fuerza
    Destreza
    Inteligencia
    Sabiduria
    Carisma
    */

},{
    tableName: "Competencia",
    freezeTableName: true,
    timestamps: false
});

module.exports = Competencia;