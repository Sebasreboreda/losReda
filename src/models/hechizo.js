const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Hechizo = sequelize.define("Hechizo", {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nivel: {
        type: DataTypes.INTEGER
    },
    escuela: {
        type: DataTypes.STRING
    },
    descripcion: {
        type: DataTypes.TEXT
    },
    descripcion_nivel_superior: {
        type: DataTypes.TEXT
    },
    slug: {
        type: DataTypes.STRING,
        unique: true
    },
    rango: {
        type: DataTypes.STRING
    },
    componentes: {
        type: DataTypes.JSON
    },
    material: {
        type: DataTypes.TEXT
    },
    ritual: {
        type: DataTypes.BOOLEAN
    },
    duracion: {
        type: DataTypes.STRING
    },
    concentracion: {
        type: DataTypes.BOOLEAN
    },
    tiempo_lanzamiento: {
        type: DataTypes.STRING
    },
    tipo_ataque: {
        type: DataTypes.STRING
    },
    dano: {
        type: DataTypes.JSON
    },
    dificultad: {
        type: DataTypes.JSON
    },
    area_efecto: {
        type: DataTypes.JSON
    },
    clases: {
        type: DataTypes.JSON
    },
    subclases: {
        type: DataTypes.JSON
    },
},{
    tableName: "Hechizo",
    freezeTableName: true,
    timestamps: false
});

module.exports = Hechizo;