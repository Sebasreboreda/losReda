const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Subclase = sequelize.define("Subclase", {
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
    tipo_subclase: {
        type: DataTypes.STRING,
        comment: 'subclass_flavor de la API: ej. Martial Archetype, Arcane Tradition'
    },
    ClaseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Clase', key: 'id' }
}
},{
    tableName: "Subclase",
    freezeTableName: true,
    timestamps: false
});

module.exports = Subclase;
