const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Feat = sequelize.define("Feat", {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT
    }, // Solo para SRD / contenido legal
    bonuses: {
        type: DataTypes.JSON,
        allowNull: true
    }, // Para almacenar bonificaciones específicas, como "+1 a ataque"
    slug: {
        type: DataTypes.STRING,
        unique: true
    }
},{
    tableName: "Feat",
    freezeTableName: true,
    timestamps: false
});

module.exports = Feat;