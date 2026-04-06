/**
 * Modificador de característica D&D 5e: (puntuación − 10) / 2, redondeado hacia abajo.
 * Equivale a truncar la división hacia −∞ (no hacia cero).
 */
function calcularModificadorEstadistica(estadistica) {
  const n = Number(estadistica);
  if (!Number.isFinite(n)) return 0;
  return Math.floor((n - 10) / 2);
}

function formatearModificadorEstadistica(mod) {
  const m = Number(mod);
  if (!Number.isFinite(m)) return '+0';
  if (m >= 0) return `+${m}`;
  return String(m);
}

/** Bonificación por competencia D&D 5e según nivel. */
function calcularProficiencyBonus(nivel) {
  const n = Number(nivel);
  if (!Number.isFinite(n)) return 2;
  return 2 + Math.floor((n - 1) / 4);
}

/** Iniciativa: modificador de Destreza + bonificación por competencia (regla de esta app). */
function calcularIniciativa(destreza, nivel) {
  return calcularModificadorEstadistica(destreza) + calcularProficiencyBonus(nivel);
}

//Los valores del dado de vida, se gestionan mediante estructuras en memoria en lugar de consultas a la base de datos, ya que se trata de información estática.
function obtenerPuntosVida(nivel, claseId, constitucion){

const dadosVida = {
    1: 12, // Barbaro
    2: 8,  // Bardo
    3: 8,  // Clerigo
    4: 8,  // Druida
    5: 10, // Guerrero
    6: 6,  // Hechicero
    7: 8,  // Monje
    8: 8,  // Paladin
    9: 8,  // Explorador
    10: 8, // Picaro
    11: 8, // Brujo
    12: 6  // Mago
};

const dadoVida = dadosVida[claseId] || 8; // Valor por defecto si no se encuentra la clase
const modificadorConstitucion = calcularModificadorEstadistica(constitucion);

let puntosVida = dadoVida + modificadorConstitucion; // Vida en nivel 1

puntosVida += (nivel - 1) * (Math.floor(dadoVida / 2) + 1 + modificadorConstitucion); // Vida adicional por niveles superiores

return puntosVida;
}

function calcularCA(tipo, armaduraBase, destreza, escudo, bonus = []) {
  const bonoEscudo = Number(escudo) || 0;
  const listaBonos = Array.isArray(bonus) ? bonus : [];
  const bonoExtra = listaBonos.reduce((total=0, b) => total + (Number(b?.valor) || 0), 0);
  const destrezaBase = Number(destreza) || 8;
  const modDestreza = Math.floor((destrezaBase - 10) / 2);
  const base = 0;

  switch (tipo.toLowerCase()) {
    case "sin":
    case "sin armadura":
      return 10 + modDestreza + bonoEscudo + bonoExtra;

    case "ligera":
    base = Number(armaduraBase) || 12;
      return base + modDestreza + bonoEscudo + bonoExtra;

    case "media":
    base = Number(armaduraBase) || 14;
      return base + Math.min(modDestreza, 2) + bonoEscudo + bonoExtra;

    case "pesada":
    base = Number(armaduraBase) || 16;
      return base + bonoEscudo + bonoExtra;

    default:
      throw new Error(`Tipo de armadura no válido: ${tipo}`);
  }
}

/** Índices de salvación (API / PHB) → clave Atributo */
const INDICE_SALVACION_A_ATRIBUTO = {
  str: 'fuerza',
  dex: 'destreza',
  con: 'constitucion',
  int: 'inteligencia',
  wis: 'sabiduria',
  cha: 'carisma'
};

const CLAVES_ATRIBUTO_ORDEN = ['fuerza', 'destreza', 'constitucion', 'inteligencia', 'sabiduria', 'carisma'];

const ETIQUETA_ATRIBUTO = {
  fuerza: 'Fuerza',
  destreza: 'Destreza',
  constitucion: 'Constitución',
  inteligencia: 'Inteligencia',
  sabiduria: 'Sabiduría',
  carisma: 'Carisma'
};

/**
 * Bonificador a una tirada de habilidad: mod característica + competencia (+ doble si experto).
 */
function calcularBonusHabilidad(modAtributo, proficiencyBonus, competente, experto) {
  const mod = Number(modAtributo);
  const m = Number.isFinite(mod) ? mod : 0;
  const pb = Number(proficiencyBonus);
  const p = Number.isFinite(pb) ? pb : 0;
  if (experto) return m + 2 * p;
  if (competente) return m + p;
  return m;
}

function salvacionProficienteParaAtributo(atributoKey, tiradaSalvacion) {
  if (!Array.isArray(tiradaSalvacion)) return false;
  for (const t of tiradaSalvacion) {
    const raw = t && (t.index ?? t.ability_index ?? t.ability?.index ?? '');
    const idx = String(raw).toLowerCase();
    if (INDICE_SALVACION_A_ATRIBUTO[idx] === atributoKey) return true;
  }
  return false;
}

function calcularBonusSalvacion(atributoKey, atributosRecord, nivel, tiradaSalvacion) {
  const mod = calcularModificadorEstadistica(atributosRecord?.[atributoKey]);
  const pb = calcularProficiencyBonus(nivel);
  if (salvacionProficienteParaAtributo(atributoKey, tiradaSalvacion)) return mod + pb;
  return mod;
}

function calcularSalvacionesPersonaje(atributosRecord, nivel, tiradaSalvacion) {
  return CLAVES_ATRIBUTO_ORDEN.map((clave) => ({
    clave,
    etiqueta: ETIQUETA_ATRIBUTO[clave],
    proficiente: salvacionProficienteParaAtributo(clave, tiradaSalvacion),
    bonus: calcularBonusSalvacion(clave, atributosRecord, nivel, tiradaSalvacion)
  }));
}

/** Sensos pasivos D&D 5e: 10 + bonificador de la habilidad (Percepción, Investigación, Perspicacia). */
function calcularSensosPasivosDesdeBonosHabilidad(bonosPorSlug) {
  const b = (slug) => (Number.isFinite(bonosPorSlug[slug]) ? bonosPorSlug[slug] : 0);
  return {
    percepcion: 10 + b('perception'),
    investigacion: 10 + b('investigation'),
    perspicacia: 10 + b('insight')
  };
}

/**
 * @param {object} params
 * @param {object|null} params.atributos — fila Atributo (fuerza, destreza, …)
 * @param {number} params.nivel
 * @param {Array|null} params.tiradaSalvacion — JSON clase (saving throws)
 * @param {Array} params.habilidadesCatalogo — Competencia tipo habilidad
 * @param {Array} params.competenciasPersonaje — instancias con PersonajeCompetencia + datos skill
 */
function ensamblarHabilidadesSalvacionesYSensos({
  atributos,
  nivel,
  tiradaSalvacion,
  habilidadesCatalogo,
  competenciasPersonaje
}) {
  const pb = calcularProficiencyBonus(nivel);
  const modOf = (k) => calcularModificadorEstadistica(atributos?.[k]);

  const profPorSlug = new Map();
  for (const fila of competenciasPersonaje || []) {
    const c = fila.Competencia || fila;
    if (!c || String(c.tipo) !== 'habilidad' || !c.slug) continue;
    const junction = fila.PersonajeCompetencia || fila.personajeCompetencia || {};
    const competente = junction.competente !== false && junction.competente !== 0;
    const experto = !!junction.experto;
    profPorSlug.set(c.slug, { competente, experto });
  }

  const habilidades = (habilidadesCatalogo || []).map((skill) => {
    const row = typeof skill.get === 'function' ? skill.get({ plain: true }) : skill;
    const p = profPorSlug.get(row.slug) || { competente: false, experto: false };
    const mod = modOf(row.atributo);
    const bonus = calcularBonusHabilidad(mod, pb, p.competente, p.experto);
    return {
      slug: row.slug,
      nombre: row.nombre,
      atributo: row.atributo,
      competente: p.competente,
      experto: p.experto,
      bonus
    };
  });

  const bonosPorSlug = Object.fromEntries(habilidades.map((h) => [h.slug, h.bonus]));
  const salvaciones = calcularSalvacionesPersonaje(atributos, nivel, tiradaSalvacion);
  const sensosPasivos = calcularSensosPasivosDesdeBonosHabilidad(bonosPorSlug);

  return { habilidades, salvaciones, sensosPasivos };
}

module.exports = {
  obtenerPuntosVida,
  calcularCA,
  calcularModificadorEstadistica,
  formatearModificadorEstadistica,
  calcularProficiencyBonus,
  calcularIniciativa,
  INDICE_SALVACION_A_ATRIBUTO,
  calcularBonusHabilidad,
  salvacionProficienteParaAtributo,
  calcularBonusSalvacion,
  calcularSalvacionesPersonaje,
  calcularSensosPasivosDesdeBonosHabilidad,
  ensamblarHabilidadesSalvacionesYSensos
};