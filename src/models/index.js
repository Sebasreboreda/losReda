const Personaje = require('./personaje');
const Clase = require('./clase');
const Subclase = require('./subclase');
const Raza = require('./raza');
const Subraza = require('./subraza');
const Trasfondo = require('./trasfondo');
const Atributo = require('./atributo');
const Feat = require('./feat');
const Hechizo = require('./hechizo');
const Competencia = require('./competencia');
const Usuario = require('./usuario');
const ClaseNivel = require('./claseNivel');
const SubclaseNivel = require('./subclaseNivel');
const RazaNivel = require('./razaNivel');
const ClaseCompetencia = require('./claseCompetencia');
const PersonajeFeat = require('./personajeFeat');
const PersonajeHechizo = require('./personajeHechizo');
const PersonajeCompetencia = require('./personajeCompetencia');
const PersonajeClase = require('./personajeClase');

Personaje.belongsTo(Raza);
Raza.hasMany(Personaje);

Subraza.belongsTo(Raza);
Raza.hasMany(Subraza);

Personaje.belongsTo(Subraza);
Subraza.hasMany(Personaje);

Personaje.belongsTo(Trasfondo);
Trasfondo.hasMany(Personaje);

Personaje.hasOne(Atributo);
Atributo.belongsTo(Personaje);

Personaje.belongsToMany(Feat, { through: PersonajeFeat });
Feat.belongsToMany(Personaje, { through: PersonajeFeat });

Personaje.belongsToMany(Hechizo, { through: PersonajeHechizo });
Hechizo.belongsToMany(Personaje, { through: PersonajeHechizo });

Personaje.belongsToMany(Competencia, { through: PersonajeCompetencia, foreignKey: 'PersonajeId', otherKey: 'CompetenciaId' });
Competencia.belongsToMany(Personaje, { through: PersonajeCompetencia, foreignKey: 'CompetenciaId', otherKey: 'PersonajeId' });

Personaje.hasMany(PersonajeClase, { foreignKey: 'PersonajeId', as: 'PersonajeClases' });
PersonajeClase.belongsTo(Personaje, { foreignKey: 'PersonajeId' });

Clase.hasMany(PersonajeClase, { foreignKey: 'ClaseId', as: 'FilasPersonaje' });
PersonajeClase.belongsTo(Clase, { foreignKey: 'ClaseId' });

Subclase.hasMany(PersonajeClase, { foreignKey: 'SubclaseId', as: 'FilasPersonaje' });
PersonajeClase.belongsTo(Subclase, { foreignKey: 'SubclaseId' });

Clase.belongsToMany(Competencia, { through: ClaseCompetencia, foreignKey: 'ClaseId', otherKey: 'CompetenciaId' });
Competencia.belongsToMany(Clase, { through: ClaseCompetencia, foreignKey: 'CompetenciaId', otherKey: 'ClaseId' });

Subclase.belongsTo(Clase);
Clase.hasMany(Subclase);

Clase.hasMany(ClaseNivel);
ClaseNivel.belongsTo(Clase);

Subclase.hasMany(SubclaseNivel);
SubclaseNivel.belongsTo(Subclase);

Raza.hasMany(RazaNivel);
RazaNivel.belongsTo(Raza);

Usuario.hasMany(Personaje);
Personaje.belongsTo(Usuario);

module.exports = {
  Personaje,
  Clase,
  Subclase,
  Raza,
  Subraza,
  Trasfondo,
  Atributo,
  Feat,
  Hechizo,
  Competencia,
  Usuario,
  ClaseNivel,
  SubclaseNivel,
  RazaNivel,
  ClaseCompetencia,
  PersonajeFeat,
  PersonajeHechizo,
  PersonajeCompetencia,
  PersonajeClase
};
