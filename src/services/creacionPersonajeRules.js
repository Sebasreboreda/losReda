const CREACION_PERSONAJE_RULES = {
  atributos: {
    scoreOrder: [8, 10, 12, 13, 14, 15],
    attrMin: 8,
    attrMax: 15,
    pointBuyTotal: 27,
    pointBuyCost: {
      8: 0,
      9: 1,
      10: 2,
      11: 3,
      12: 4,
      13: 5,
      14: 7,
      15: 9
    },
    atributosValidos: ['fuerza', 'destreza', 'constitucion', 'inteligencia', 'sabiduria', 'carisma']
  }
};

module.exports = {
  CREACION_PERSONAJE_RULES
};
