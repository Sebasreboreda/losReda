const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Clase = sequelize.define("Clase", {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    dado_vida: {
        type: DataTypes.INTEGER
    },
    descripcion: {
        type: DataTypes.TEXT
    },
    tirada_salvacion: {
        type: DataTypes.JSON,
        comment: 'Los 2 atributos con ventaja en tiradas de salvación (ej. [{index:"str",name:"STR"},{index:"con",name:"CON"}])'
    },
    lanzamiento_hechizo: {
        type: DataTypes.JSON
    },
    competencia: {
        type: DataTypes.JSON
    },

}, {
    tableName: "Clase",
    freezeTableName: true,
    timestamps: false
});

module.exports = Clase;