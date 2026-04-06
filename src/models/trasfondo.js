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
    }
},{
    tableName: "Trasfondo",
    freezeTableName: true,
    timestamps: false
});

module.exports = Trasfondo;