require('dotenv').config({ quiet: true });
const { DataTypes } = require('sequelize');
const {
  Clase,
  Raza,
  Subraza,
  Subclase,
  Trasfondo,
  Feat,
  Hechizo,
  ClaseNivel,
  SubclaseNivel,
  RazaNivel,
  Competencia,
  ClaseCompetencia,
  Rasgo,
  RazaRasgo,
  SubrazaRasgo,
  SubclaseRasgo,
  ClaseNivelRasgo
} = require('../models');

const BASE_URL = process.env.DND_API_BASE_URL || 'https://www.dnd5eapi.co';
const API_2014 = BASE_URL + '/api/2014';
const CANTIDAD_CLASES_DND = 12;
const CANTIDAD_RAZAS_DND = 9;
const CANTIDAD_SUBCLASES_MIN = 1;
const CANTIDAD_CLASE_NIVELES_MIN = 20;
const CANTIDAD_TRASFONDOS_MIN = 12;
const CANTIDAD_HECHIZOS_MIN = 300;
const CANTIDAD_FEATS_MIN = 1;
const CANTIDAD_HABILIDADES_DND = 18;
const CANTIDAD_RASGOS_DND_MIN = 20;
const CANTIDAD_RAZA_RASGO_MIN = 27;
const CANTIDAD_SUBRAZA_RASGO_MIN = 14;
const CANTIDAD_SUBCLASE_RASGO_MIN = 48;
const CANTIDAD_IDIOMAS_MIN = 16;
const CANTIDAD_CLASE_COMPETENCIA_MIN = 24;
const CANTIDAD_CLASES_CON_PROFICIENCY_CHOICES_MIN = 12;
const FEATS_SLUGS_ESPERADOS_FIJOS = ['grappler'];

function parsearJSONSafe(valor, fallback = null) {
  if (valor == null) return fallback;
  if (typeof valor === 'string') {
    const s = valor.trim();
    if (!s) return fallback;
    try {
      return JSON.parse(s);
    } catch {
      return fallback;
    }
  }
  return valor;
}

const TIEFLING_RAZA_NIVELES_EXTRA = [
  {
    nivel: 3,
    rasgos: [
      { index: 'hellish-rebuke', name: 'Hellish Rebuke', url: '/api/2014/spells/hellish-rebuke' }
    ]
  },
  {
    nivel: 5,
    rasgos: [
      { index: 'darkness', name: 'Darkness', url: '/api/2014/spells/darkness' }
    ]
  }
];

const IDIOMAS_COMUNES = [
  'Common',
  'Dwarvish',
  'Elvish',
  'Giant',
  'Gnomish',
  'Goblin',
  'Halfling',
  'Orc'
];

const IDIOMAS_EXOTICOS = [
  'Abyssal',
  'Celestial',
  'Draconic',
  'Deep Speech',
  'Infernal',
  'Primordial',
  'Sylvan',
  'Undercommon'
];

const TRASFONDOS_JSON_SEED = [
  {
    name: 'Acolyte',
    skill_proficiencies: { fixed: ['Insight', 'Religion'], choose: 0 },
    languages: { fixed: [], choose: 2 },
    tool_proficiencies: [],
    description: 'You have spent your life in the service of a temple to a specific god or pantheon of gods. You act as an intermediary between the realm of the holy and the mortal world, performing sacred rites and offering sacrifices in order to conduct worshipers into the presence of the divine. You are not necessarily a cleric-performing sacred rites is not the same thing as channeling divine power.\n\nChoose a god, a pantheon of gods, or some other quasi-divine being from among those listed in Appendix B or those specified by your DM, and work with your DM to detail the nature of your religious service. Were you a lesser functionary in a temple, raised from childhood to assist the priests in the sacred rites? Or were you a high priest who suddenly experienced a calling to serve in a different way? Perhaps you were the leader of a small cult outside of any established temple structure, or even an occult group that served a fiendish master that you now deny.',
    feature: {
      name: 'Shelter of the Faithful',
      description: 'As an acolyte, you command the respect of those who share your faith, and you can perform the religious ceremonies of your deity. You and your adventuring companions can expect to receive free healing and care at a temple, shrine, or other established presence of your faith, though you must provide any material components needed for spells. Those who share your religion will support you (but only you) at a modest lifestyle.\n\nYou might also have ties to a specific temple dedicated to your chosen deity or pantheon, and you have a residence there. This could be the temple where you used to serve, if you remain on good terms with it, or a temple where you have found a new home. While near your temple, you can call upon the priests for assistance, provided the assistance you ask for is not hazardous and you remain in good standing with your temple.'
    }
  },
  {
    name: 'Criminal (Spy)',
    skill_proficiencies: { fixed: ['Deception', 'Stealth'], choose: 0 },
    languages: { fixed: [], choose: 0 },
    tool_proficiencies: ["Thieves' Tools", 'Gaming Set'],
    description: 'You are an experienced criminal with a history of breaking the law. You have spent a lot of time among other criminals and still have contacts within the criminal underworld. You\'re far closer than most people to the world of murder, theft, and violence that pervades the underbelly of civilization, and you have survived up to this point by flouting the rules and regulations of society.\n\nYou might have been a pickpocket, a smuggler, or a burglar. Perhaps you were a spy, working as a double agent or informer. Whatever your past, you have learned how to navigate the shadows and deal with dangerous people.',
    feature: {
      name: 'Criminal Contact',
      description: 'You have a reliable and trustworthy contact who acts as your liaison to a network of other criminals. You know how to get messages to and from your contact, even over great distances; specifically, you know the local messengers, corrupt caravan masters, and seedy sailors who can deliver messages for you.'
    }
  },
  {
    name: 'Folk Hero',
    skill_proficiencies: { fixed: ['Animal Handling', 'Survival'], choose: 0 },
    languages: { fixed: [], choose: 0 },
    tool_proficiencies: ["Artisan's Tools (choose 1)", 'Vehicles (land)'],
    description: 'You come from a humble social rank, but you are destined for so much more. Already the people of your home village regard you as their champion, and your destiny calls you to stand against the tyrants and monsters that threaten the common folk.\n\nPerhaps you stood up to a tyrant\'s agents, protected your village from a marauding horde, or saved a child from a terrible fate. Whatever the reason, you have earned the respect of the common people, and they look to you as a symbol of hope.',
    feature: {
      name: 'Rustic Hospitality',
      description: 'Since you come from the ranks of the common folk, you fit in among them with ease. You can find a place to hide, rest, or recuperate among other commoners, unless you have shown yourself to be a danger to them. They will shield you from the law or anyone else searching for you, though they will not risk their lives for you.'
    }
  },
  {
    name: 'Noble',
    skill_proficiencies: { fixed: ['History', 'Persuasion'], choose: 0 },
    languages: { fixed: [], choose: 1 },
    tool_proficiencies: ['Gaming Set'],
    description: 'You understand wealth, power, and privilege. You carry a noble title, and your family owns land, collects taxes, and wields significant political influence. You might be a pampered aristocrat unfamiliar with work or discomfort, a former merchant just elevated to the nobility, or a disinherited scoundrel with a disproportionate sense of entitlement.\n\nOr you could be an honest, hard-working landowner who cares deeply about the people who live and work on your land, keenly aware of your responsibility to them.\n\nWork with your DM to come up with an appropriate title and determine how much authority that title carries. A noble title doesn\'t stand on its own-it\'s connected to an entire family, and whatever title you hold might be the best way to think of your whole family as well. Is your family old and established, or was your title granted only recently? How much influence do they wield, and what kind of reputation do they have?\n\nWhat\'s your position in the family? Are you the heir to the head of the family? Have you already inherited the title? How do you feel about that responsibility? Or are you so far down the line of inheritance that no one cares what you do, as long as you don\'t embarrass the family? How does the head of your family feel about your adventuring career? Are you in your family\'s good graces, or shunned by the rest of your family?\n\nDoes your family have a coat of arms? An insignia you might wear on a signet ring? Particular colors you wear all the time? An animal you regard as a symbol of your line or even a spiritual member of the family?\n\nThese details help establish your family and your place in the world.',
    feature: {
      name: 'Position of Privilege',
      description: 'Thanks to your noble birth, people are inclined to think the best of you. You are welcome in high society, and people assume you have the right to be wherever you are. The common folk make every effort to accommodate you and avoid your displeasure, and other people of high birth treat you as a member of the same social sphere. You can secure an audience with a local noble if you need to.'
    }
  },
  {
    name: 'Sage',
    skill_proficiencies: { fixed: ['Arcana', 'History'], choose: 0 },
    languages: { fixed: [], choose: 2 },
    tool_proficiencies: [],
    description: 'You spent years learning the lore of the multiverse. You scoured manuscripts, studied scrolls, and listened to the greatest experts on the subjects that interest you. Your efforts have made you a master in your fields of study.\n\nA sage typically studies in a library, university, or temple, or with a private tutor. You might be a scholar, a researcher, or a historian. Your specialty might be arcane lore, history, religion, or any other field of knowledge.',
    feature: {
      name: 'Researcher',
      description: 'When you attempt to learn or recall a piece of lore, if you do not know that information, you often know where and from whom you can obtain it. Usually, this information comes from a library, scriptorium, university, or a sage or other learned person or creature. Your DM might rule that the knowledge you seek is secreted away in an almost inaccessible place, or that it simply cannot be found. Unearthing the deepest secrets of the multiverse can require an adventure or even a whole campaign.'
    }
  },
  {
    name: 'Soldier',
    skill_proficiencies: { fixed: ['Athletics', 'Intimidation'], choose: 0 },
    languages: { fixed: [], choose: 0 },
    tool_proficiencies: ['Gaming Set', 'Vehicles (land)'],
    description: 'War has been your life for as long as you care to remember. You trained as a youth, studied the use of weapons and armor, learned basic survival techniques, and practiced discipline. You might have been part of a standing army, a mercenary company, or a local militia.\n\nYou have experienced the chaos of battle, the fear of death, and the camaraderie of soldiers fighting side by side. You have learned how to survive in harsh conditions and how to follow orders under pressure.',
    feature: {
      name: 'Military Rank',
      description: 'You have a military rank from your career as a soldier. Soldiers loyal to your former military organization still recognize your authority and influence, and they defer to you if they are of a lower rank. You can invoke your rank to exert influence over other soldiers and requisition simple equipment or horses for temporary use. You can also usually gain access to friendly military encampments and fortresses where your rank is recognized.'
    }
  },
  {
    name: 'Haunted One',
    skill_proficiencies: { fixed: [], choose: 2, options: ['Arcana', 'Investigation', 'Religion', 'Survival'] },
    languages: { fixed: [], choose: 0 },
    tool_proficiencies: ["Choose 1: Disguise Kit or Poisoner's Kit"],
    description: 'You are haunted by something so terrible that you dare not speak of it. You\'ve tried to bury it and run away from it, to no avail. Whatever this thing is that haunts you can\'t be slain with a sword or banished with a spell. It might come to you in dreams, or manifest in the waking world in ways you cannot ignore.\n\nThe burden has taken its toll, isolating you from most people and making you wary of forming close relationships. You are driven to confront the darkness that haunts you, even if it means putting yourself in danger.',
    feature: {
      name: 'Heart of Darkness',
      description: 'Those who look into your eyes can see that you have faced unimaginable horror and that you are no stranger to darkness. Though they might fear you, commoners will extend you every courtesy and do their utmost to help you. Unless you have shown yourself to be a danger to them, they will even take up arms to fight alongside you, should you find yourself facing an enemy alone.'
    }
  }
];

/** ability_score.index de la API 2014 → clave Atributo del modelo (español). */
const INDICE_HABILIDAD_API_A_ATRIBUTO = {
  str: 'fuerza',
  dex: 'destreza',
  con: 'constitucion',
  int: 'inteligencia',
  wis: 'sabiduria',
  cha: 'carisma'
};

/* Descripciones en inglés de las clases porque la API pública no devuelve el catálogo completo */
const CLASES_DESCRIPCION_EN = {
  barbarian: 'A fierce warrior who channels primal rage in battle.',
  bard: 'An inspiring performer and spellcaster who weaves magic through art and music.',
  cleric: 'A divine spellcaster who serves a deity and wields sacred power.',
  druid: 'A guardian of nature who commands primal magic and can shapechange.',
  fighter: 'A master of martial combat, skilled with weapons and armor.',
  monk: 'A disciplined martial artist who harnesses ki for extraordinary feats.',
  paladin: 'A holy warrior bound by an oath, combining martial skill and divine magic.',
  ranger: 'A wilderness hunter and tracker with martial prowess and natural magic.',
  rogue: 'A stealthy and precise operative skilled in agility, tricks, and tactics.',
  sorcerer: 'A spellcaster whose magic comes from an innate supernatural bloodline.',
  warlock: 'A wielder of arcane power granted through a pact with an otherworldly patron.',
  wizard: 'A scholarly spellcaster who learns and prepares spells through study.'
};

/* Descripciones en inglés de las razas porque la API pública no devuelve el catálogo completo */
const RAZAS_DESCRIPCION_EN = {
  dragonborn: 'Draconic humanoids with proud heritage, breath weapons, and elemental resilience.',
  dwarf: 'Stout and resilient people known for endurance, craftsmanship, and tradition.',
  elf: 'Graceful, long-lived folk with keen senses and deep magical affinity.',
  gnome: 'Curious and clever small folk known for creativity, wit, and invention.',
  'half-elf': 'Versatile people of mixed heritage who bridge human and elven worlds.',
  'half-orc': 'Powerful and determined folk with great strength and fierce resolve.',
  halfling: 'Small, nimble, and fortunate adventurers known for bravery and charm.',
  human: 'Adaptable and ambitious people with broad talents and diverse cultures.',
  tiefling: 'People with infernal ancestry, marked by unusual features and innate magic.'
};

/* Descripciones en inglés de las subrazas porque la API pública no devuelve el catálogo completo */
const SUBRAZAS_MANUALES = [
  {
    slug: 'mountain-dwarf',
    nombre: 'Mountain Dwarf',
    razaSlug: 'dwarf',
    descripcion: 'A hardy dwarven subrace with strong martial tradition.',
    bonuses: [{ ability_score: { index: 'str', name: 'STR' }, bonus: 2 }],
    rasgos: [{ index: 'dwarven-armor-training', name: 'Dwarven Armor Training' }]
  },
  {
    slug: 'wood-elf',
    nombre: 'Wood Elf',
    razaSlug: 'elf',
    descripcion: 'An agile elf with a deep bond to nature.',
    bonuses: [{ ability_score: { index: 'wis', name: 'WIS' }, bonus: 1 }],
    rasgos: [
      { index: 'fleet-of-foot', name: 'Fleet of Foot' },
      { index: 'mask-of-the-wild', name: 'Mask of the Wild' }
    ]
  },
  {
    slug: 'eladrin-elf',
    nombre: 'Eladrin Elf',
    razaSlug: 'elf',
    descripcion: 'An elven lineage tied to the Feywild.',
    bonuses: [{ ability_score: { index: 'int', name: 'INT' }, bonus: 1 }],
    rasgos: [{ index: 'fey-step', name: 'Fey Step' }]
  },
  {
    slug: 'forest-gnome',
    nombre: 'Forest Gnome',
    razaSlug: 'gnome',
    descripcion: 'A quiet gnome subrace closely connected to forests.',
    bonuses: [{ ability_score: { index: 'dex', name: 'DEX' }, bonus: 1 }],
    rasgos: [{ index: 'speak-with-small-beasts', name: 'Speak with Small Beasts' }]
  },
  {
    slug: 'stout-halfling',
    nombre: 'Stout Halfling',
    razaSlug: 'halfling',
    descripcion: 'A resilient halfling subrace known for toughness.',
    bonuses: [{ ability_score: { index: 'con', name: 'CON' }, bonus: 1 }],
    rasgos: [{ index: 'stout-resilience', name: 'Stout Resilience' }]
  },
  {
    slug: 'human-standard',
    nombre: 'Human',
    razaSlug: 'human',
    descripcion: 'Standard human with balanced ability improvements.',
    bonuses: [
      { ability_score: { index: 'str', name: 'STR' }, bonus: 1 },
      { ability_score: { index: 'dex', name: 'DEX' }, bonus: 1 },
      { ability_score: { index: 'con', name: 'CON' }, bonus: 1 },
      { ability_score: { index: 'int', name: 'INT' }, bonus: 1 },
      { ability_score: { index: 'wis', name: 'WIS' }, bonus: 1 },
      { ability_score: { index: 'cha', name: 'CHA' }, bonus: 1 }
    ]
  },
  {
    slug: 'variant-human',
    nombre: 'Variant Human',
    razaSlug: 'human',
    descripcion: 'Human variant with more flexible starting choices.',
    bonuses: [{ ability_score: { index: 'choice', name: 'Choice' }, bonus: 1 }, { ability_score: { index: 'choice', name: 'Choice' }, bonus: 1 }],
    rasgos: [{ index: 'skill-versatility', name: 'Skill Versatility' }]
  }
];

function buildApiUrl(urlOrPath) {
  if (!urlOrPath) return '';
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) return urlOrPath;
  return BASE_URL + urlOrPath;
}

function slugDesdeNombreTrasfondo(nombre = '') {
  return String(nombre || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function slugDesdeNombre(nombre = '') {
  return String(nombre || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function asegurarColumnasTrasfondo() {
  const qi = Trasfondo.sequelize.getQueryInterface();
  const tabla = await qi.describeTable('Trasfondo');
  const columnas = [
    ['competencias', { type: DataTypes.JSON, allowNull: true }],
    ['idiomas_opciones', { type: DataTypes.JSON, allowNull: true }],
    ['rasgo', { type: DataTypes.JSON, allowNull: true }]
  ];
  for (const [nombre, definicion] of columnas) {
    if (!tabla[nombre]) {
      await qi.addColumn('Trasfondo', nombre, definicion);
    }
  }
}

async function asegurarColumnasHechizo() {
  const qi = Hechizo.sequelize.getQueryInterface();
  const tabla = await qi.describeTable('Hechizo');
  const columnas = [
    ['descripcion_nivel_superior', { type: DataTypes.TEXT, allowNull: true }],
    ['rango', { type: DataTypes.STRING, allowNull: true }],
    ['componentes', { type: DataTypes.JSON, allowNull: true }],
    ['material', { type: DataTypes.TEXT, allowNull: true }],
    ['ritual', { type: DataTypes.BOOLEAN, allowNull: true }],
    ['duracion', { type: DataTypes.STRING, allowNull: true }],
    ['concentracion', { type: DataTypes.BOOLEAN, allowNull: true }],
    ['tiempo_lanzamiento', { type: DataTypes.STRING, allowNull: true }],
    ['tipo_ataque', { type: DataTypes.STRING, allowNull: true }],
    ['dano', { type: DataTypes.JSON, allowNull: true }],
    ['dificultad', { type: DataTypes.JSON, allowNull: true }],
    ['area_efecto', { type: DataTypes.JSON, allowNull: true }],
    ['clases', { type: DataTypes.JSON, allowNull: true }],
    ['subclases', { type: DataTypes.JSON, allowNull: true }]
  ];
  for (const [nombre, definicion] of columnas) {
    if (!tabla[nombre]) {
      await qi.addColumn('Hechizo', nombre, definicion);
    }
  }
}

async function asegurarColumnaCategoriaCompetencia() {
  const qi = Competencia.sequelize.getQueryInterface();
  const tabla = await qi.describeTable('Competencia');
  if (!tabla.categoria) {
    await qi.addColumn('Competencia', 'categoria', {
      type: DataTypes.STRING,
      allowNull: true
    });
  }
}

async function guardarFallbackManual() {
  // Datos cargados manualmente para completar subrazas cuando la API es inestable.
  const razas = await Raza.findAll({ attributes: ['id', 'slug'] });
  const razaPorSlug = new Map(razas.map((r) => [r.slug, r.id]));

  await guardarDescripcionesBaseEn();

  for (const subrazaManual of SUBRAZAS_MANUALES) {
    const razaId = razaPorSlug.get(subrazaManual.razaSlug);
    if (!razaId) continue;

    const [subraza] = await Subraza.findOrCreate({
      where: { slug: subrazaManual.slug },
      defaults: {
        nombre: subrazaManual.nombre,
        slug: subrazaManual.slug,
        descripcion: subrazaManual.descripcion,
        bonuses: subrazaManual.bonuses || null,
        rasgos: subrazaManual.rasgos || null,
        idiomas: null,
        RazaId: razaId
      }
    });

    await subraza.update({
      nombre: subrazaManual.nombre,
      descripcion: subrazaManual.descripcion,
      bonuses: subrazaManual.bonuses || null,
      rasgos: subrazaManual.rasgos || subraza.rasgos || null,
      RazaId: razaId
    });

    if (Array.isArray(subrazaManual.rasgos) && subrazaManual.rasgos.length > 0) {
      await enlazarRasgosSubraza(subraza, subrazaManual.rasgos);
    }
  }

}

async function guardarTrasfondosDesdeJsonSeed() {
  for (const item of TRASFONDOS_JSON_SEED) {
    const nombre = String(item?.name || '').trim();
    const slug = slugDesdeNombreTrasfondo(nombre);
    if (!nombre || !slug) continue;
    const [trasfondo] = await Trasfondo.findOrCreate({
      where: { slug },
      defaults: {
        nombre,
        slug,
        descripcion: item?.description || null,
        competencias: {
          skills: item?.skill_proficiencies || { fixed: [], choose: 0 },
          tools: Array.isArray(item?.tool_proficiencies) ? item.tool_proficiencies : []
        },
        idiomas_opciones: item?.languages || { fixed: [], choose: 0 },
        rasgo: item?.feature || null
      }
    });
    await trasfondo.update({
      nombre,
      descripcion: item?.description || trasfondo.descripcion || null,
      competencias: {
        skills: item?.skill_proficiencies || { fixed: [], choose: 0 },
        tools: Array.isArray(item?.tool_proficiencies) ? item.tool_proficiencies : []
      },
      idiomas_opciones: item?.languages || trasfondo.idiomas_opciones || { fixed: [], choose: 0 },
      rasgo: item?.feature || trasfondo.rasgo || null
    });
  }
}

async function guardarDescripcionesBaseEn() {
  for (const [slug, descripcion] of Object.entries(CLASES_DESCRIPCION_EN)) {
    await Clase.update({ descripcion }, { where: { slug } });
  }
  await guardarDescripcionesRazasEn();
}

async function guardarDescripcionesRazasEn() {
  for (const [slug, descripcion] of Object.entries(RAZAS_DESCRIPCION_EN)) {
    await Raza.update({ descripcion }, { where: { slug } });
  }
}

async function getCatalogoMaps() {
  const [clasesRes, razasRes] = await Promise.all([
    fetch(API_2014 + '/classes'),
    fetch(API_2014 + '/races')
  ]);

  if (!clasesRes.ok) {
    throw new Error('No se pudo obtener catalogo de clases');
  }
  if (!razasRes.ok) {
    throw new Error('No se pudo obtener catalogo de razas');
  }

  const clasesData = await clasesRes.json();
  const razasData = await razasRes.json();

  const classes = Array.isArray(clasesData.results) ? clasesData.results : [];
  const races = Array.isArray(razasData.results) ? razasData.results : [];

  const clasesMap = new Map();
  const razasMap = new Map();

  classes.forEach((item) => clasesMap.set(item.index, item.url));
  races.forEach((item) => razasMap.set(item.index, item.url));

  return { clasesMap, razasMap };
}

async function guardarClases() {
  const total = await Clase.count();
  if (total >= CANTIDAD_CLASES_DND) return;

  const { clasesMap } = await getCatalogoMaps();

  for (const [index] of clasesMap) {
    try {
      const detailRes = await fetch(API_2014 + '/classes/' + index);
      if (!detailRes.ok) continue;

      const data = await detailRes.json();
      const slug = data.index || index;
      const competenciasFijas = Array.isArray(data.proficiencies) ? data.proficiencies : [];
      const proficiencyChoices = Array.isArray(data.proficiency_choices) ? data.proficiency_choices : [];
      const competenciaPayload = { proficiencies: competenciasFijas };
      const existente = await Clase.findOne({ where: { slug } });
      if (!existente) {
        await Clase.create({
          nombre: data.name || '',
          slug,
          dado_vida: data.hit_die || null,
          descripcion: null,
          tirada_salvacion: Array.isArray(data.saving_throws) && data.saving_throws.length > 0 ? data.saving_throws : null,
          lanzamiento_hechizo: data.spellcasting || null,
          competencia: competenciaPayload,
          proficiency_choices: proficiencyChoices
        });
      } else {
        await existente.update({
          dado_vida: data.hit_die || existente.dado_vida || null,
          tirada_salvacion: Array.isArray(data.saving_throws) && data.saving_throws.length > 0 ? data.saving_throws : (existente.tirada_salvacion || null),
          lanzamiento_hechizo: data.spellcasting || existente.lanzamiento_hechizo || null,
          competencia: competenciaPayload,
          proficiency_choices: proficiencyChoices
        });
      }
    } catch (err) {
      console.error('guardarClases error', index, err.message);
    }
  }
}

async function completarEleccionesCompetenciasClaseDesdeApi() {
  const totalConChoices = await Clase.count({
    where: {
      proficiency_choices: {
        [require('sequelize').Op.not]: null
      }
    }
  });
  if (totalConChoices >= CANTIDAD_CLASES_CON_PROFICIENCY_CHOICES_MIN) return;

  const clases = await Clase.findAll({ attributes: ['id', 'slug', 'competencia', 'proficiency_choices'] });
  for (const clase of clases) {
    const choicesCampo = Array.isArray(clase?.proficiency_choices)
      ? clase.proficiency_choices
      : parsearJSONSafe(clase?.proficiency_choices, []);
    if (Array.isArray(choicesCampo) && choicesCampo.length > 0) continue;
    const comp = clase?.competencia && typeof clase.competencia === 'object'
      ? clase.competencia
      : parsearJSONSafe(clase?.competencia, {});
    const tieneChoices = Array.isArray(comp?.proficiency_choices) && comp.proficiency_choices.length > 0;
    if (tieneChoices) {
      await clase.update({ proficiency_choices: comp.proficiency_choices });
      continue;
    }
    try {
      const detailRes = await fetch(API_2014 + '/classes/' + encodeURIComponent(clase.slug));
      if (!detailRes.ok) continue;
      const data = await detailRes.json();
      const competenciasFijas = Array.isArray(data.proficiencies) ? data.proficiencies : (Array.isArray(comp?.proficiencies) ? comp.proficiencies : []);
      const choices = Array.isArray(data.proficiency_choices) ? data.proficiency_choices : [];
      await clase.update({
        competencia: { proficiencies: competenciasFijas },
        proficiency_choices: choices
      });
    } catch (err) {
      console.error('completarEleccionesCompetenciasClaseDesdeApi error', clase.slug, err.message);
    }
  }
}

async function guardarRazas() {
  const total = await Raza.count();
  if (total >= CANTIDAD_RAZAS_DND) return;

  const { razasMap } = await getCatalogoMaps();

  for (const [index] of razasMap) {
    try {
      const detailRes = await fetch(API_2014 + '/races/' + index);
      if (!detailRes.ok) continue;

      const data = await detailRes.json();
      const [raza] = await Raza.findOrCreate({
        where: { slug: data.index || index },
        defaults: {
          nombre: data.name || '',
          slug: data.index || index,
          velocidad: data.speed || null,
          bonuses: data.ability_bonuses || null,
          tamano: data.size || null,
          tamano_desc: data.size_description || null,
          idiomas: data.languages || null,
          lenguaje_desc: data.language_desc || null,
          traits: data.traits || null,
          edad: data.age || null,
          alineamiento: data.alignment || null,
          descripcion: null
        }
      });

      await enlazarRasgosRaza(raza, data.traits);
    } catch (err) {
      console.error('guardarRazas error', index, err.message);
    }
  }
}

function normalizarListaRasgos(valor) {
  if (!valor) return [];
  if (Array.isArray(valor)) return valor;
  if (typeof valor === 'string') {
    const s = valor.trim();
    if (!s) return [];
    if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
      try {
        const parsed = JSON.parse(s);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
  }
  return [];
}

function normalizarListaCompetenciasClase(valor) {
  if (!valor) return [];
  let data = valor;
  if (typeof data === 'string') {
    const s = data.trim();
    if (!s) return [];
    if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
      try {
        data = JSON.parse(s);
      } catch {
        return [];
      }
    } else {
      return [];
    }
  }
  const lista = Array.isArray(data?.proficiencies) ? data.proficiencies : [];
  return lista.filter(Boolean);
}

function inferirTipoCompetencia(ref = {}) {
  const index = String(ref?.index || '').toLowerCase();
  const nombre = String(ref?.name || '').toLowerCase();
  const texto = `${index} ${nombre}`;

  if (texto.includes('skill') || texto.includes('habilidad')) return 'habilidad';
  if (texto.includes('armor') || texto.includes('armour') || texto.includes('armadura')) return 'armadura';
  if (texto.includes('weapon') || texto.includes('weapons') || texto.includes('arma')) return 'arma';
  if (
    texto.includes('tool') ||
    texto.includes('tools') ||
    texto.includes('kit') ||
    texto.includes('instrument') ||
    texto.includes('gaming') ||
    texto.includes('vehicle') ||
    texto.includes('vehicles') ||
    texto.includes('herramienta')
  ) {
    return 'herramienta';
  }
  return 'habilidad';
}

async function rellenarClaseCompetenciaDesdeBd() {
  const totalRelaciones = await ClaseCompetencia.count();
  if (totalRelaciones >= CANTIDAD_CLASE_COMPETENCIA_MIN) return;

  const clases = await Clase.findAll({ attributes: ['id', 'competencia'] });
  for (const clase of clases) {
    const refs = normalizarListaCompetenciasClase(clase.competencia);
    if (!refs.length) continue;

    for (const ref of refs) {
      const nombre = String(ref?.name || '').trim();
      const slug = String(ref?.index || '').trim() || slugDesdeNombre(nombre);
      if (!slug || !nombre) continue;

      const tipo = inferirTipoCompetencia(ref);
      const [competencia] = await Competencia.findOrCreate({
        where: { slug },
        defaults: {
          nombre,
          slug,
          tipo,
          atributo: null,
          categoria: null
        }
      });

      if (!competencia.tipo || String(competencia.tipo).trim() === '') {
        await competencia.update({ tipo });
      }

      await ClaseCompetencia.findOrCreate({
        where: {
          ClaseId: clase.id,
          CompetenciaId: competencia.id
        },
        defaults: {
          ClaseId: clase.id,
          CompetenciaId: competencia.id
        }
      });
    }
  }
}

async function rellenarRazaRasgoDesdeBd() {
  const totalRelaciones = await RazaRasgo.count();
  if (totalRelaciones >= CANTIDAD_RAZA_RASGO_MIN) return;

  const razas = await Raza.findAll({ attributes: ['id', 'traits'] });
  for (const raza of razas) {
    const refs = normalizarListaRasgos(raza.traits);
    if (!refs.length) continue;
    await enlazarRasgosRaza(raza, refs);
  }
}

async function rellenarSubrazaRasgoDesdeBd() {
  const totalRelaciones = await SubrazaRasgo.count();
  if (totalRelaciones >= CANTIDAD_SUBRAZA_RASGO_MIN) return;

  const subrazas = await Subraza.findAll({ attributes: ['id', 'rasgos'] });
  for (const subraza of subrazas) {
    const refs = normalizarListaRasgos(subraza.rasgos);
    if (!refs.length) continue;
    await enlazarRasgosSubraza(subraza, refs);
  }
}

async function rellenarSubclaseRasgoDesdeBd() {
  const totalRelaciones = await SubclaseRasgo.count();
  if (totalRelaciones >= CANTIDAD_SUBCLASE_RASGO_MIN) return;

  const subclases = await Subclase.findAll({ attributes: ['id', 'slug'] });
  const niveles = await SubclaseNivel.findAll({ attributes: ['SubclaseId', 'rasgos'] });
  const refsPorSubclaseId = new Map();
  niveles.forEach((fila) => {
    const subclaseId = Number(fila?.SubclaseId) || 0;
    if (!subclaseId) return;
    const refs = normalizarListaRasgos(fila?.rasgos);
    if (!refs.length) return;
    if (!refsPorSubclaseId.has(subclaseId)) refsPorSubclaseId.set(subclaseId, []);
    refsPorSubclaseId.get(subclaseId).push(...refs);
  });

  for (const subclase of subclases) {
    const refs = Array.isArray(refsPorSubclaseId.get(Number(subclase.id))) ? refsPorSubclaseId.get(Number(subclase.id)) : [];
    for (const ref of refs) {
      const rasgo = await upsertRasgoDesdeRef(ref);
      if (!rasgo) continue;
      await SubclaseRasgo.findOrCreate({
        where: { SubclaseId: subclase.id, RasgoId: rasgo.id },
        defaults: { SubclaseId: subclase.id, RasgoId: rasgo.id }
      });
    }
  }
}

async function guardarSubclases() {
  const total = await Subclase.count();
  if (total >= CANTIDAD_SUBCLASES_MIN) return;

  const listRes = await fetch(API_2014 + '/subclasses');
  if (!listRes.ok) {
    throw new Error('No se pudo obtener catalogo de subclases');
  }

  const listData = await listRes.json();
  const indices = (listData.results || []).map((r) => r.index).filter(Boolean);

  for (const index of indices) {
    try {
      const detailRes = await fetch(API_2014 + '/subclasses/' + encodeURIComponent(index));
      if (!detailRes.ok) continue;

      const data = await detailRes.json();
      const clase = data.class?.index ? await Clase.findOne({ where: { slug: data.class.index } }) : null;
      if (!clase) continue;

      await Subclase.findOrCreate({
        where: { slug: data.index || index },
        defaults: {
          nombre: data.name || '',
          slug: data.index || index,
          descripcion: Array.isArray(data.desc) ? data.desc.join('\n\n') : null,
          tipo_subclase: data.subclass_flavor || null,
          ClaseId: clase.id
        }
      });
    } catch (err) {
      console.error('guardarSubclases error', index, err.message);
    }
  }
}

async function guardarSubclaseRasgosDesdeApi() {
  const totalRelaciones = await SubclaseRasgo.count();
  if (totalRelaciones >= CANTIDAD_SUBCLASE_RASGO_MIN) return;

  const subclases = await Subclase.findAll({ attributes: ['id', 'slug'] });
  for (const subclase of subclases) {
    try {
      const detailRes = await fetch(API_2014 + '/subclasses/' + encodeURIComponent(subclase.slug));
      if (!detailRes.ok) continue;
      const detailData = await detailRes.json();
      const refs = Array.isArray(detailData?.subclass_features) ? detailData.subclass_features : [];
      for (const ref of refs) {
        const rasgo = await upsertRasgoDesdeRef(ref);
        if (!rasgo) continue;
        await SubclaseRasgo.findOrCreate({
          where: { SubclaseId: subclase.id, RasgoId: rasgo.id },
          defaults: { SubclaseId: subclase.id, RasgoId: rasgo.id }
        });
      }
    } catch (err) {
      console.error('guardarSubclaseRasgosDesdeApi error', subclase.slug, err.message);
    }
  }
}

async function guardarSubrazas() {
  const razas = await Raza.findAll({ attributes: ['id', 'slug'] });

  for (const raza of razas) {
    try {
      const detailRes = await fetch(API_2014 + '/races/' + encodeURIComponent(raza.slug));
      if (!detailRes.ok) continue;

      const detailData = await detailRes.json();
      const subraces = Array.isArray(detailData.subraces) ? detailData.subraces : [];

      for (const subraceRef of subraces) {
        const slugBase = subraceRef.index || null;
        if (!slugBase) continue;

        const [subraza] = await Subraza.findOrCreate({
          where: { slug: slugBase },
          defaults: {
            nombre: subraceRef.name || slugBase,
            slug: slugBase,
            descripcion: null,
            bonuses: null,
            rasgos: null,
            idiomas: null,
            RazaId: raza.id
          }
        });

        const subraceUrl = buildApiUrl(subraceRef.url);
        if (!subraceUrl) continue;

        const subraceRes = await fetch(subraceUrl);
        if (!subraceRes.ok) continue;

        const subraceData = await subraceRes.json();
        await subraza.update({
          nombre: subraceData.name || subraceRef.name || subraza.nombre,
          descripcion: Array.isArray(subraceData.desc) ? subraceData.desc.join('\n\n') : subraza.descripcion,
          bonuses: subraceData.ability_bonuses || subraza.bonuses,
          rasgos: subraceData.racial_traits || subraza.rasgos,
          idiomas: subraceData.languages || subraza.idiomas,
          RazaId: raza.id
        });

        await enlazarRasgosSubraza(subraza, subraceData.racial_traits);
      }
    } catch (err) {
      console.error('guardarSubrazas error', raza.slug, err.message);
    }
  }

  await guardarFallbackManual();
}

async function guardarTrasfondos() {
  await asegurarColumnasTrasfondo();
  const total = await Trasfondo.count();
  if (total >= CANTIDAD_TRASFONDOS_MIN) return;
  await guardarTrasfondosDesdeJsonSeed();
}

async function guardarHechizos() {
  await asegurarColumnasHechizo();
  const total = await Hechizo.count();
  if (total >= CANTIDAD_HECHIZOS_MIN) return;

  const listRes = await fetch(`${API_2014}/spells`);
  if (!listRes.ok) {
    throw new Error('No se pudo obtener catalogo de hechizos');
  }
  const listData = await listRes.json();
  const hechizos = Array.isArray(listData.results) ? listData.results : [];

  for (const ref of hechizos) {
    const slug = String(ref?.index || '').trim();
    if (!slug) continue;
    try {
      const detailRes = await fetch(`${API_2014}/spells/${encodeURIComponent(slug)}`);
      if (!detailRes.ok) continue;
      const data = await detailRes.json();
      const [hechizo] = await Hechizo.findOrCreate({
        where: { slug: data.index || slug },
        defaults: {
          nombre: data.name || ref.name || slug,
          slug: data.index || slug,
          nivel: Number(data.level) || 0,
          escuela: data?.school?.name || null,
          descripcion: Array.isArray(data.desc) ? data.desc.join('\n\n') : null,
          descripcion_nivel_superior: Array.isArray(data.higher_level) ? data.higher_level.join('\n\n') : null,
          rango: data.range || null,
          componentes: Array.isArray(data.components) ? data.components : null,
          material: data.material || null,
          ritual: typeof data.ritual === 'boolean' ? data.ritual : null,
          duracion: data.duration || null,
          concentracion: typeof data.concentration === 'boolean' ? data.concentration : null,
          tiempo_lanzamiento: data.casting_time || null,
          tipo_ataque: data.attack_type || null,
          dano: data.damage || null,
          dificultad: data.dc || null,
          area_efecto: data.area_of_effect || null,
          clases: Array.isArray(data.classes) ? data.classes : null,
          subclases: Array.isArray(data.subclasses) ? data.subclasses : null
        }
      });
      await hechizo.update({
        nombre: data.name || ref.name || hechizo.nombre,
        nivel: Number(data.level) || 0,
        escuela: data?.school?.name || hechizo.escuela || null,
        descripcion: Array.isArray(data.desc) ? data.desc.join('\n\n') : hechizo.descripcion,
        descripcion_nivel_superior: Array.isArray(data.higher_level) ? data.higher_level.join('\n\n') : (hechizo.descripcion_nivel_superior || null),
        rango: data.range || hechizo.rango || null,
        componentes: Array.isArray(data.components) ? data.components : (hechizo.componentes || null),
        material: data.material || hechizo.material || null,
        ritual: typeof data.ritual === 'boolean' ? data.ritual : hechizo.ritual,
        duracion: data.duration || hechizo.duracion || null,
        concentracion: typeof data.concentration === 'boolean' ? data.concentration : hechizo.concentracion,
        tiempo_lanzamiento: data.casting_time || hechizo.tiempo_lanzamiento || null,
        tipo_ataque: data.attack_type || hechizo.tipo_ataque || null,
        dano: data.damage || hechizo.dano || null,
        dificultad: data.dc || hechizo.dificultad || null,
        area_efecto: data.area_of_effect || hechizo.area_efecto || null,
        clases: Array.isArray(data.classes) ? data.classes : (hechizo.clases || null),
        subclases: Array.isArray(data.subclasses) ? data.subclasses : (hechizo.subclases || null)
      });
    } catch (err) {
      console.error('guardarHechizos error', slug, err.message);
    }
  }

  const totalTrasApi = await Trasfondo.count();
  if (totalTrasApi < CANTIDAD_TRASFONDOS_MIN) {
    await guardarTrasfondosDesdeJsonSeed();
  }
}

async function guardarFeats() {
  const total = await Feat.count();
  if (total >= CANTIDAD_FEATS_MIN) return;

  const slugs = Array.isArray(FEATS_SLUGS_ESPERADOS_FIJOS) ? FEATS_SLUGS_ESPERADOS_FIJOS : [];
  if (!slugs.length) return;

  for (const slug of slugs) {
    try {
      const detailRes = await fetch(`${API_2014}/feats/${encodeURIComponent(slug)}`);
      if (!detailRes.ok) continue;
      const data = await detailRes.json();

      const descripcion = Array.isArray(data?.desc) ? data.desc.join('\n\n') : null;
      const bonuses = {
        prerequisites: Array.isArray(data?.prerequisites) ? data.prerequisites : [],
        ability_bonuses: Array.isArray(data?.ability_bonuses) ? data.ability_bonuses : []
      };

      const slugFinal = String(data?.index || slug).trim();
      const [feat] = await Feat.findOrCreate({
        where: { slug: slugFinal },
        defaults: {
          nombre: data?.name || slugFinal,
          descripcion,
          bonuses,
          slug: slugFinal
        }
      });

      await feat.update({
        nombre: data?.name || feat.nombre,
        descripcion: descripcion || feat.descripcion || null,
        bonuses
      });
    } catch (err) {
      console.error('guardarFeats error', slug, err.message);
    }
  }
}

async function guardarClaseNiveles() {
  const total = await ClaseNivel.count();
  if (total >= CANTIDAD_CLASE_NIVELES_MIN) return;

  const clases = await Clase.findAll({ attributes: ['id', 'slug'] });

  for (const clase of clases) {
    try {
      const levelsRes = await fetch(API_2014 + '/classes/' + encodeURIComponent(clase.slug) + '/levels');
      if (!levelsRes.ok) continue;

      const levelsData = await levelsRes.json();
      const levels = Array.isArray(levelsData) ? levelsData : [];

      for (const nivelData of levels) {
        const nivel = Number(nivelData.level) || null;
        if (!nivel) continue;

        const [filaNivel] = await ClaseNivel.findOrCreate({
          where: { ClaseId: clase.id, nivel },
          defaults: {
            nivel,
            bonus_competencia: nivelData.prof_bonus || null,
            lanzamiento_hechizo: nivelData.spellcasting || null,
            ClaseId: clase.id
          }
        });

        await filaNivel.update({
          bonus_competencia: nivelData.prof_bonus || null,
          lanzamiento_hechizo: nivelData.spellcasting || null
        });

        await enlazarRasgosClaseNivel(filaNivel, nivelData.features);
      }
    } catch (err) {
      console.error('guardarClaseNiveles error', clase.slug, err.message);
    }
  }
}

async function guardarSubclaseNiveles() {
  const subclases = await Subclase.findAll({ attributes: ['id', 'slug'] });

  for (const subclase of subclases) {
    try {
      const levelsRes = await fetch(API_2014 + '/subclasses/' + encodeURIComponent(subclase.slug) + '/levels');
      if (!levelsRes.ok) continue;

      const levelsData = await levelsRes.json();
      const levels = Array.isArray(levelsData) ? levelsData : [];

      for (const nivelData of levels) {
        const nivel = Number(nivelData.level) || null;
        if (!nivel) continue;

        await SubclaseNivel.findOrCreate({
          where: { SubclaseId: subclase.id, nivel },
          defaults: {
            nivel,
            rasgos: nivelData.features || null,
            lanzamiento_hechizo: nivelData.spellcasting || null,
            SubclaseId: subclase.id
          }
        });
      }
    } catch (err) {
      console.error('guardarSubclaseNiveles error', subclase.slug, err.message);
    }
  }
}

async function guardarRazaNiveles() {
  const razas = await Raza.findAll({ attributes: ['id', 'slug', 'bonuses', 'traits', 'velocidad', 'idiomas'] });

  for (const raza of razas) {
    try {
      const detailRes = await fetch(API_2014 + '/races/' + encodeURIComponent(raza.slug));
      let detailData = null;
      if (detailRes.ok) {
        detailData = await detailRes.json();
      }

      const payload = {
        nivel: 1,
        modificadores: detailData?.ability_bonuses || raza.bonuses || null,
        rasgos: detailData?.traits || raza.traits || null,
        velocidad: detailData?.speed || raza.velocidad || null,
        idiomas: detailData?.languages || raza.idiomas || null,
        RazaId: raza.id
      };
      const [fila, creada] = await RazaNivel.findOrCreate({
        where: { RazaId: raza.id, nivel: 1 },
        defaults: payload
      });
      if (!creada) {
        await fila.update(payload);
      }

      if (String(raza.slug || '').trim() === 'tiefling') {
        for (const extra of TIEFLING_RAZA_NIVELES_EXTRA) {
          const nivelExtra = Math.max(1, Number(extra.nivel) || 1);
          const payloadExtra = {
            nivel: nivelExtra,
            modificadores: null,
            rasgos: Array.isArray(extra.rasgos) ? extra.rasgos : [],
            velocidad: detailData?.speed || raza.velocidad || null,
            idiomas: null,
            RazaId: raza.id
          };
          const [filaExtra, creadaExtra] = await RazaNivel.findOrCreate({
            where: { RazaId: raza.id, nivel: nivelExtra },
            defaults: payloadExtra
          });
          if (!creadaExtra) {
            const actuales = Array.isArray(filaExtra.rasgos) ? filaExtra.rasgos : [];
            const merged = [...actuales];
            for (const ref of payloadExtra.rasgos) {
              const idx = String(ref?.index || '').trim();
              if (!idx) continue;
              if (!merged.some((m) => String(m?.index || '').trim() === idx)) {
                merged.push(ref);
              }
            }
            await filaExtra.update({
              rasgos: merged,
              velocidad: payloadExtra.velocidad
            });
          }
        }
      }
    } catch (err) {
      console.error('guardarRazaNiveles error', raza.slug, err.message);
    }
  }
}

async function guardarNiveles() {
  await guardarClaseNiveles();
  await guardarSubclaseNiveles();
  await guardarRazaNiveles();
}

function extraerDescripcionTexto(desc) {
  if (!desc) return null;
  if (Array.isArray(desc)) return desc.join('\n\n');
  if (typeof desc === 'string') return desc;
  return null;
}

function extraerModificadoresRasgo(data, rasgoSlug = '') {
  if (!data || typeof data !== 'object') return null;
  const traitSpecific = data.trait_specific || null;
  if (traitSpecific) return traitSpecific;

  const slug = String(rasgoSlug || data.index || '').trim().toLowerCase();
  // Fallback manual para rasgos cuyo trait_specific no llega en API.
  if (slug === 'primal-champion') {
    return {
      ability_bonuses: [
        { ability_score: { index: 'str', name: 'STR' }, bonus: 4, max: 24 },
        { ability_score: { index: 'con', name: 'CON' }, bonus: 4, max: 24 }
      ]
    };
  }
  return null;
}

async function upsertRasgoDesdeRef(ref) {
  if (!ref || !ref.index) return null;
  const slug = ref.index;
  const nombre = ref.name || slug;
  const url_api = buildApiUrl(ref.url || `${API_2014}/traits/${encodeURIComponent(slug)}`);

  const [rasgo] = await Rasgo.findOrCreate({
    where: { slug },
    defaults: { nombre, slug, url_api }
  });

  if (url_api) {
    try {
      const detailRes = await fetch(url_api);
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        await rasgo.update({
          nombre: detailData.name || nombre,
          descripcion: extraerDescripcionTexto(detailData.desc),
          modificadores: extraerModificadoresRasgo(detailData, slug),
          url_api
        });
      }
    } catch (err) {
      console.warn('upsertRasgoDesdeRef error', slug, err.message);
    }
  }

  return rasgo;
}

async function enlazarRasgosRaza(raza, rasgosRef) {
  const refs = Array.isArray(rasgosRef) ? rasgosRef : [];
  for (const ref of refs) {
    const rasgo = await upsertRasgoDesdeRef(ref);
    if (!rasgo) continue;
    await RazaRasgo.findOrCreate({
      where: { RazaId: raza.id, RasgoId: rasgo.id },
      defaults: { RazaId: raza.id, RasgoId: rasgo.id }
    });
  }
}

async function enlazarRasgosSubraza(subraza, rasgosRef) {
  const refs = Array.isArray(rasgosRef) ? rasgosRef : [];
  for (const ref of refs) {
    const rasgo = await upsertRasgoDesdeRef(ref);
    if (!rasgo) continue;
    await SubrazaRasgo.findOrCreate({
      where: { SubrazaId: subraza.id, RasgoId: rasgo.id },
      defaults: { SubrazaId: subraza.id, RasgoId: rasgo.id }
    });
  }
}

async function enlazarRasgosClaseNivel(claseNivel, rasgosRef) {
  const refs = Array.isArray(rasgosRef) ? rasgosRef : [];
  for (const ref of refs) {
    const rasgo = await upsertRasgoDesdeRef(ref);
    if (!rasgo) continue;
    await ClaseNivelRasgo.findOrCreate({
      where: { ClaseNivelId: claseNivel.id, RasgoId: rasgo.id },
      defaults: { ClaseNivelId: claseNivel.id, RasgoId: rasgo.id }
    });
  }
}

async function guardarRasgosDnd() {
  const total = await Rasgo.count();
  if (total >= CANTIDAD_RASGOS_DND_MIN) return;

  const listRes = await fetch(`${API_2014}/traits`);
  if (!listRes.ok) {
    throw new Error(`No se pudo obtener el listado de rasgos (HTTP ${listRes.status})`);
  }
  const listData = await listRes.json();
  const results = Array.isArray(listData.results) ? listData.results : [];

  for (const ref of results) {
    await upsertRasgoDesdeRef(ref);
  }
}

/**
 * Rellena habilidades D&D desde la API solo si faltan en BD (mismo criterio que clases/razas).
 */
async function guardarHabilidadesDnd() {
  const total = await Competencia.count({ where: { tipo: 'habilidad' } });
  if (total >= CANTIDAD_HABILIDADES_DND) return;

  const listRes = await fetch(`${API_2014}/skills`);
  if (!listRes.ok) {
    throw new Error(`No se pudo obtener el listado de habilidades (HTTP ${listRes.status})`);
  }
  const listData = await listRes.json();
  const results = Array.isArray(listData.results) ? listData.results : [];
  if (results.length === 0) {
    throw new Error('Listado de habilidades vacío');
  }

  const details = await Promise.all(
    results.map(async (ref) => {
      const index = ref && ref.index;
      if (!index) return null;
      const url = ref.url ? buildApiUrl(ref.url) : `${API_2014}/skills/${encodeURIComponent(index)}`;
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    })
  );

  let guardadas = 0;
  for (const data of details) {
    if (!data || !data.index) continue;
    const abiRaw = data.ability_score && data.ability_score.index;
    const atributo = abiRaw
      ? INDICE_HABILIDAD_API_A_ATRIBUTO[String(abiRaw).toLowerCase()]
      : null;
    if (!atributo) {
      console.warn('guardarHabilidadesDnd: habilidad sin atributo mapeable', data.index, abiRaw);
      continue;
    }
    const nombre = data.name || data.index;
    const slug = data.index;
    const [comp] = await Competencia.findOrCreate({
      where: { slug },
      defaults: {
        nombre,
        slug,
        tipo: 'habilidad',
        atributo
      }
    });
    await comp.update({
      nombre,
      tipo: 'habilidad',
      atributo
    });
    guardadas += 1;
  }

  if (guardadas === 0) {
    throw new Error('No se pudo guardar ninguna habilidad (fallos al obtener detalle o atributos)');
  }
  if (guardadas < results.length) {
    console.warn(
      `guardarHabilidadesDnd: guardadas ${guardadas} de ${results.length} habilidades del listado`
    );
  }
}

async function guardarIdiomasCompetencia() {
  await asegurarColumnaCategoriaCompetencia();

  const idiomas = [
    ...IDIOMAS_COMUNES.map((nombre) => ({ nombre, categoria: 'comun' })),
    ...IDIOMAS_EXOTICOS.map((nombre) => ({ nombre, categoria: 'exotico' }))
  ];

  const slugsEsperados = idiomas.map((item) => slugDesdeNombre(item.nombre)).filter(Boolean);
  const existentes = await Competencia.findAll({
    where: { tipo: 'idioma', slug: slugsEsperados },
    attributes: ['id', 'slug', 'nombre', 'tipo', 'categoria', 'atributo']
  });
  const existentePorSlug = new Map(existentes.map((fila) => [String(fila.slug || '').trim(), fila]));

  // Si ya están todos y completos, no tocar BD.
  const catalogoCompleto =
    existentes.length >= CANTIDAD_IDIOMAS_MIN &&
    idiomas.every((item) => {
      const slug = slugDesdeNombre(item.nombre);
      const fila = existentePorSlug.get(slug);
      return !!fila &&
        String(fila.tipo || '') === 'idioma' &&
        String(fila.nombre || '') === item.nombre &&
        String(fila.categoria || '') === item.categoria;
    });
  if (catalogoCompleto) return;

  for (const item of idiomas) {
    const slug = slugDesdeNombre(item.nombre);
    if (!slug) continue;
    const filaExistente = existentePorSlug.get(slug);

    if (!filaExistente) {
      await Competencia.create({
        nombre: item.nombre,
        slug,
        tipo: 'idioma',
        atributo: null,
        categoria: item.categoria
      });
      continue;
    }

    const requiereUpdate =
      String(filaExistente.tipo || '') !== 'idioma' ||
      String(filaExistente.nombre || '') !== item.nombre ||
      String(filaExistente.categoria || '') !== item.categoria ||
      filaExistente.atributo != null;

    if (requiereUpdate) {
      await filaExistente.update({
        nombre: item.nombre,
        tipo: 'idioma',
        atributo: null,
        categoria: item.categoria
      });
    }
  }
}

async function guardarCatalogo() {
  await guardarClases();
  await completarEleccionesCompetenciasClaseDesdeApi();
  await rellenarClaseCompetenciaDesdeBd();
  await guardarRazas();
  await rellenarRazaRasgoDesdeBd();
  await guardarSubrazas();
  await rellenarSubrazaRasgoDesdeBd();
  await guardarSubclases();
  await guardarSubclaseRasgosDesdeApi();
  await guardarTrasfondos();
  await guardarHechizos();
  await guardarFeats();
  await guardarNiveles();
  await guardarHabilidadesDnd();
  await guardarIdiomasCompetencia();
  await guardarRasgosDnd();
}

module.exports = {
  guardarClases,
  guardarRazas,
  guardarSubrazas,
  guardarSubclases,
  guardarTrasfondos,
  guardarHechizos,
  guardarFeats,
  guardarFallbackManual,
  guardarDescripcionesBaseEn,
  guardarDescripcionesRazasEn,
  guardarClaseNiveles,
  guardarSubclaseNiveles,
  guardarRazaNiveles,
  guardarNiveles,
  guardarHabilidadesDnd,
  guardarIdiomasCompetencia,
  completarEleccionesCompetenciasClaseDesdeApi,
  rellenarClaseCompetenciaDesdeBd,
  guardarRasgosDnd,
  rellenarRazaRasgoDesdeBd,
  rellenarSubrazaRasgoDesdeBd,
  guardarSubclaseRasgosDesdeApi,
  rellenarSubclaseRasgoDesdeBd,
  guardarCatalogo
};