const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Atributo = sequelize.define("Atributo", {
    fuerza: {
        type: DataTypes.INTEGER,
        defaultValue: 8
    },
    destreza: {
        type: DataTypes.INTEGER,
        defaultValue: 8
    },
    constitucion: {
        type: DataTypes.INTEGER,
        defaultValue: 8
    },
    inteligencia: {
        type: DataTypes.INTEGER,
        defaultValue: 8
    },
    sabiduria: {
        type: DataTypes.INTEGER,
        defaultValue: 8
    },
    carisma: {
        type: DataTypes.INTEGER,
        defaultValue: 8
    },
    PersonajeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Personaje', key: 'id' }
    }
},{
    tableName: "Atributo",
    freezeTableName: true,
    timestamps: false
});

module.exports = Atributo;