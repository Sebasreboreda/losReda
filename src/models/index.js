const Personaje = require('./personaje');
const Clase = require('./clase');
const Subclase = require('./subclase');
const Raza = require('./raza');
const Subraza = require('./subraza');
const Trasfondo = require('./trasfondo');
const Atributo = require('./atributo');
const Feat = require('./feat');
const Hechizo = require('./hechizo');
const OrigenHechizo = require('./origenHechizo');
const Competencia = require('./competencia');
const Usuario = require('./usuario');
const ClaseNivel = require('./claseNivel');
const SubclaseNivel = require('./subclaseNivel');
const RazaNivel = require('./razaNivel');
const Rasgo = require('./rasgo');
const Objeto = require('./objeto');
const ClaseNivelRasgo = require('./claseNivelRasgo');
const ClaseCompetencia = require('./claseCompetencia');
const PersonajeFeat = require('./personajeFeat');
const PersonajeHechizo = require('./personajeHechizo');
const PersonajeCompetencia = require('./personajeCompetencia');
const PersonajeClase = require('./personajeClase');
const InventarioPersonaje = require('./inventarioPersonaje');
const RazaRasgo = require('./razaRasgo');
const SubrazaRasgo = require('./subrazaRasgo');
const SubclaseRasgo = require('./subclaseRasgo');

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

Hechizo.hasMany(OrigenHechizo, { foreignKey: 'HechizoId', as: 'Origenes' });
OrigenHechizo.belongsTo(Hechizo, { foreignKey: 'HechizoId' });
Clase.hasMany(OrigenHechizo, { foreignKey: 'ClaseId', as: 'OrigenesHechizo' });
OrigenHechizo.belongsTo(Clase, { foreignKey: 'ClaseId' });
Raza.hasMany(OrigenHechizo, { foreignKey: 'RazaId', as: 'OrigenesHechizo' });
OrigenHechizo.belongsTo(Raza, { foreignKey: 'RazaId' });
Subraza.hasMany(OrigenHechizo, { foreignKey: 'SubrazaId', as: 'OrigenesHechizo' });
OrigenHechizo.belongsTo(Subraza, { foreignKey: 'SubrazaId' });

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

Personaje.belongsToMany(Objeto, { through: InventarioPersonaje, as: 'Objetos', foreignKey: 'PersonajeId', otherKey: 'ObjetoId' });
Objeto.belongsToMany(Personaje, { through: InventarioPersonaje, as: 'Personajes', foreignKey: 'ObjetoId', otherKey: 'PersonajeId' });
Personaje.hasMany(InventarioPersonaje, { foreignKey: 'PersonajeId', as: 'Inventario' });
InventarioPersonaje.belongsTo(Personaje, { foreignKey: 'PersonajeId' });
Objeto.hasMany(InventarioPersonaje, { foreignKey: 'ObjetoId' });
InventarioPersonaje.belongsTo(Objeto, { foreignKey: 'ObjetoId', as: 'Objeto' });

Raza.belongsToMany(Rasgo, { through: RazaRasgo, as: 'Rasgos', foreignKey: 'RazaId', otherKey: 'RasgoId' });
Rasgo.belongsToMany(Raza, { through: RazaRasgo, as: 'Razas', foreignKey: 'RasgoId', otherKey: 'RazaId' });

Subraza.belongsToMany(Rasgo, { through: SubrazaRasgo, as: 'Rasgos', foreignKey: 'SubrazaId', otherKey: 'RasgoId' });
Rasgo.belongsToMany(Subraza, { through: SubrazaRasgo, as: 'Subrazas', foreignKey: 'RasgoId', otherKey: 'SubrazaId' });

Subclase.belongsToMany(Rasgo, { through: SubclaseRasgo, as: 'Rasgos', foreignKey: 'SubclaseId', otherKey: 'RasgoId' });
Rasgo.belongsToMany(Subclase, { through: SubclaseRasgo, as: 'Subclases', foreignKey: 'RasgoId', otherKey: 'SubclaseId' });

ClaseNivel.belongsToMany(Rasgo, { through: ClaseNivelRasgo, as: 'Rasgos', foreignKey: 'ClaseNivelId', otherKey: 'RasgoId' });
Rasgo.belongsToMany(ClaseNivel, { through: ClaseNivelRasgo, as: 'NivelesClase', foreignKey: 'RasgoId', otherKey: 'ClaseNivelId' });

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
  OrigenHechizo,
  Competencia,
  Usuario,
  ClaseNivel,
  SubclaseNivel,
  RazaNivel,
  Rasgo,
  Objeto,
  ClaseNivelRasgo,
  ClaseCompetencia,
  PersonajeFeat,
  PersonajeHechizo,
  PersonajeCompetencia,
  PersonajeClase,
  InventarioPersonaje,
  RazaRasgo,
  SubrazaRasgo,
  SubclaseRasgo
};