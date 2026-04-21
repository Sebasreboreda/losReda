(function () {
  function normalizarAtributo(raw) {
    const key = String(raw || '').trim().toLowerCase();
    const mapa = {
      str: 'fuerza',
      strength: 'fuerza',
      fuerza: 'fuerza',
      dex: 'destreza',
      dexterity: 'destreza',
      destreza: 'destreza',
      con: 'constitucion',
      constitution: 'constitucion',
      constitucion: 'constitucion',
      int: 'inteligencia',
      intelligence: 'inteligencia',
      inteligencia: 'inteligencia',
      wis: 'sabiduria',
      wisdom: 'sabiduria',
      sabiduria: 'sabiduria',
      cha: 'carisma',
      charisma: 'carisma',
      carisma: 'carisma'
    };
    return mapa[key] || '';
  }

  function calcularModificador(valor) {
    const n = Number(valor);
    if (!Number.isFinite(n)) return 0;
    return Math.floor((n - 10) / 2);
  }

  function calcularProficiencyBonus(nivel) {
    const n = Math.max(1, Number(nivel) || 1);
    return 2 + Math.floor((n - 1) / 4);
  }

  window.CrearPersonajeRules = {
    normalizarAtributo,
    calcularModificador,
    calcularProficiencyBonus
  };
})();
