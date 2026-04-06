const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PersonajeHechizo = sequelize.define("PersonajeHechizo", {

    PersonajeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Personaje', key: 'id' }
    },

    HechizoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Hechizo', key: 'id' }
    }

},{
    tableName: "PersonajeHechizo",
    freezeTableName: true,
    timestamps: false,
    indexes: [
  {
    unique: true,
    fields: ["PersonajeId", "HechizoId"]
  }
]
});

module.exports = PersonajeHechizo;