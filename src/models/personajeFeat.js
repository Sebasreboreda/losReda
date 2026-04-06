const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PersonajeFeat = sequelize.define("PersonajeFeat", {

    PersonajeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Personaje', key: 'id' }
    },

    FeatId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Feat', key: 'id' }
    }

},{
    tableName: "PersonajeFeat",
    freezeTableName: true,
    timestamps: false,
    indexes: [
  {
    unique: true,
    fields: ["PersonajeId", "FeatId"]
  }
]
});


module.exports = PersonajeFeat;