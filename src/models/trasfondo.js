const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Trasfondo = sequelize.define("Trasfondo", {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING,
        unique: true
    },
    descripcion: {
        type: DataTypes.TEXT
    },
    competencias: {
        type: DataTypes.JSON,
        allowNull: true
    },
    idiomas_opciones: {
        type: DataTypes.JSON,
        allowNull: true
    },
    rasgo: {
        type: DataTypes.JSON,
        allowNull: true
    }
},{
    tableName: "Trasfondo",
    freezeTableName: true,
    timestamps: false
});

module.exports = Trasfondo;