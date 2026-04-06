const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PersonajeCompetencia = sequelize.define("PersonajeCompetencia", {

    competente: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },

    experto: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },

    PersonajeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Personaje', key: 'id' }
    },

    CompetenciaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Competencia', key: 'id' }
    }

},{
    tableName: "PersonajeCompetencia",
    freezeTableName: true,
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ["PersonajeId", "CompetenciaId"]
        }
    ]
});

module.exports = PersonajeCompetencia;