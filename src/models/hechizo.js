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
    slug: {
        type: DataTypes.STRING,
        unique: true
    },
},{
    tableName: "Hechizo",
    freezeTableName: true,
    timestamps: false
});

module.exports = Hechizo;