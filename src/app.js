const fs = require('fs');
const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const sequelize = require('./config/db');
const borrarRoutes = require('./routes/borrarPersonajeRoutes');
const crearRoutes = require('./routes/crearPersonajeRoutes');
const editarRoutes = require('./routes/editarPersonajeRoutes');
const homeRoutes = require('./routes/homeRoutes');
const verRoutes = require('./routes/verRoutes');
const apiRoutes = require('./routes/apiRoutes');
const authRoutes = require('./routes/authRoutes');
const registroUsuarioRoutes = require('./routes/registroUsuario');
const {
  Personaje,
  Clase,
  Subclase,
  Raza,
  Subraza,
  Trasfondo,
  Feat,
  Hechizo,
  Atributo,
  Usuario,
  ClaseNivel,
  SubclaseNivel,
  RazaNivel,
  ClaseCompetencia,
  RazaRasgo,
  SubrazaRasgo,
  SubclaseRasgo,
  PersonajeClase,
  Objeto,
  InventarioPersonaje
} = require('./models');
const { guardarCatalogo, guardarNiveles, guardarHabilidadesDnd, guardarIdiomasCompetencia, guardarRasgosDnd, guardarTrasfondos, guardarHechizos, guardarFeats, completarEleccionesCompetenciasClaseDesdeApi, rellenarClaseCompetenciaDesdeBd, rellenarRazaRasgoDesdeBd, rellenarSubrazaRasgoDesdeBd, guardarSubclaseRasgosDesdeApi, rellenarSubclaseRasgoDesdeBd } = require('./services/apiService');
const { obtenerPuntosVida, calcularCA } = require('./services/personajeService');

dotenv.config({ quiet: true });

const SITE_LOGO_FILES = [
  ['logo.png', 'image/png'],
  ['logo.svg', 'image/svg+xml'],
  ['logo.webp', 'image/webp'],
  ['logo.jpg', 'image/jpeg'],
  ['logo.jpeg', 'image/jpeg'],
  ['logo.avif', 'image/avif'],
  ['logo.gif', 'image/gif']
];

function resolveSiteLogo() {
  const imagesDir = path.join(__dirname, 'public', 'images');
  const dirs = [imagesDir, path.join(imagesDir, 'personajesDefecto')];
  for (const dir of dirs) {
    for (const [file, mime] of SITE_LOGO_FILES) {
      const full = path.join(dir, file);
      if (fs.existsSync(full)) {
        const rel = path.relative(imagesDir, full).split(path.sep).join('/');
        return { url: '/images/' + rel, type: mime };
      }
    }
  }
  return { url: null, type: null };
}

const siteLogoAsset = resolveSiteLogo();

const app = express();
const PORT = process.env.PORT;
const isDevelopment = process.env.NODE_ENV !== 'production';
const CANTIDAD_SUBRAZAS_MIN = 8;
const CANTIDAD_FEATS_MIN = 1;
const CANTIDAD_CLASE_COMPETENCIA_MIN = 24;
const CANTIDAD_SUBCLASE_RASGO_MIN = 48;
const RECREAR_BD_AL_INICIAR = String(process.env.FORCE_DB_RESET || '').toLowerCase() === 'true';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Estáticos (CSS, imágenes, etc.): carpeta src/public — no la public/ de la raíz del repo
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  res.locals.user = req.session?.user || null;
  res.locals.siteLogoUrl = siteLogoAsset.url;
  res.locals.siteLogoType = siteLogoAsset.type;
  // Mostrar un mensaje puntual tras el login (y limpiarlo para que no se repita)
  res.locals.welcomeMessage = req.session?.welcomeMessage || null;
  if (req.session?.welcomeMessage) {
    delete req.session.welcomeMessage;
  }
  next();
});

app.use('/', homeRoutes);
app.use('/', registroUsuarioRoutes);
app.use('/auth', authRoutes);
app.use('/personajes', borrarRoutes);
app.use('/personajes', crearRoutes);
app.use('/personajes', editarRoutes);
app.use('/personajes', verRoutes);
app.use('/api', apiRoutes);

async function asegurarCatalogoInicial() {
  const [totalClases, totalRazas, totalSubrazas, totalSubclases, totalTrasfondos, totalHechizos, totalFeats, totalClaseNiveles, totalSubclaseNiveles, totalRazaNiveles] = await Promise.all([
    Clase.count(),
    Raza.count(),
    Subraza.count(),
    Subclase.count(),
    Trasfondo.count(),
    Hechizo.count(),
    Feat.count(),
    ClaseNivel.count(),
    SubclaseNivel.count(),
    RazaNivel.count()
  ]);

  const catalogoBaseCompleto =
    totalClases > 0 &&
    totalRazas > 0 &&
    totalSubrazas >= CANTIDAD_SUBRAZAS_MIN &&
    totalSubclases > 0 &&
    totalTrasfondos > 0 &&
    totalHechizos > 0 &&
    totalFeats >= CANTIDAD_FEATS_MIN;
  const catalogoNivelesCompleto = totalClaseNiveles > 0 && totalSubclaseNiveles > 0 && totalRazaNiveles > 0;

  if (!catalogoBaseCompleto) {
    await guardarCatalogo().catch((err) => {
      console.warn('guardarCatalogo falló (puede que no haya conexión):', err.message);
    });
    return;
  }

  if (!catalogoNivelesCompleto) {
    await guardarNiveles().catch((err) => {
      console.warn('guardarNiveles falló (puede que no haya conexión):', err.message);
    });
  }
}

async function seedPersonajesPrueba() {
  await asegurarCatalogoInicial();
  const TOTAL_PERSONAJES_SEED = 4;
  const totalExistentes = await Personaje.count();
  if (totalExistentes >= TOTAL_PERSONAJES_SEED) return;

  const usuario1 = await Usuario.findOne({ where: { correo: 'usuario1@tfg.local' } });
  const usuario2 = await Usuario.findOne({ where: { correo: 'usuario2@tfg.local' } });
  const claseDefault = await Clase.findOne({ where: { slug: 'fighter' } }) || await Clase.findOne({ order: [['id', 'ASC']] });
  const razaDefault = await Raza.findOne({ where: { slug: 'human' } }) || await Raza.findOne({ order: [['id', 'ASC']] });
  const trasfondoDefault = await Trasfondo.findOne({ where: { slug: 'soldier' } }) || await Trasfondo.findOne({ order: [['id', 'ASC']] });

  if (!claseDefault || !razaDefault) {
    console.warn('Seed omitido: faltan clase o raza base');
    return;
  }

  const seeds = [
    {
      nombre: 'Kael Draven',
      usuarioId: usuario1?.id || null,
      imagen: '/images/personajesDefecto/humanoHombre.jpg',
      clases: [
        { claseSlug: 'fighter', subclaseSlug: 'champion', nivel: 5, orden: 1 }
      ],
      razaSlug: 'human',
      subrazaSlug: 'variant-human',
      trasfondoSlug: 'soldier',
      alineamiento: 'Neutral good',
      atributos: { fuerza: 15, destreza: 12, constitucion: 14, inteligencia: 10, sabiduria: 11, carisma: 13 }
    },
    {
      nombre: 'Lia Moonwhisper',
      usuarioId: usuario2?.id || null,
      imagen: '/images/personajesDefecto/humanoMujer.jpg',
      // Ejemplo multiclase: maga 2 / guerrera 1
      clases: [
        { claseSlug: 'wizard', subclaseSlug: 'evocation', nivel: 2, orden: 1 },
        { claseSlug: 'fighter', subclaseSlug: null, nivel: 1, orden: 2 }
      ],
      razaSlug: 'elf',
      subrazaSlug: 'high-elf',
      trasfondoSlug: 'sage',
      alineamiento: 'Chaotic good',
      atributos: { fuerza: 8, destreza: 14, constitucion: 12, inteligencia: 15, sabiduria: 13, carisma: 10 }
    },
    {
      nombre: 'Brom Ironroot',
      usuarioId: usuario1?.id || null,
      imagen: '/images/personajesDefecto/enanoHombre.jpg',
      clases: [
        { claseSlug: 'cleric', subclaseSlug: 'life', nivel: 4, orden: 1 }
      ],
      razaSlug: 'dwarf',
      subrazaSlug: 'hill-dwarf',
      trasfondoSlug: 'acolyte',
      alineamiento: 'Lawful good',
      atributos: { fuerza: 13, destreza: 10, constitucion: 15, inteligencia: 8, sabiduria: 14, carisma: 12 }
    },
    {
      nombre: 'Seraphine Vale',
      usuarioId: usuario2?.id || null,
      imagen: '/images/personajesDefecto/humanoMujer.jpg',
      clases: [
        { claseSlug: 'rogue', subclaseSlug: 'thief', nivel: 3, orden: 1 }
      ],
      razaSlug: 'halfling',
      subrazaSlug: 'lightfoot-halfling',
      trasfondoSlug: 'criminal',
      alineamiento: 'Chaotic neutral',
      atributos: { fuerza: 9, destreza: 16, constitucion: 12, inteligencia: 13, sabiduria: 11, carisma: 14 }
    }
  ];

  for (const seed of seeds) {
    const clasesResueltas = [];
    for (const fila of seed.clases) {
      const clase = await Clase.findOne({ where: { slug: fila.claseSlug } }) || claseDefault;
      const subclase =
        fila.subclaseSlug
          ? await Subclase.findOne({ where: { slug: fila.subclaseSlug } })
          : await Subclase.findOne({ where: { ClaseId: clase.id } });
      if (!clase) continue;
      clasesResueltas.push({
        claseId: clase.id,
        subclaseId: subclase?.id || null,
        nivel: fila.nivel,
        orden: fila.orden
      });
    }

    if (clasesResueltas.length === 0) {
      continue;
    }

    const nivelPersonaje = clasesResueltas.reduce((acc, fila) => acc + (Number(fila.nivel) || 0), 0);

    const raza = await Raza.findOne({ where: { slug: seed.razaSlug } }) || razaDefault;
    const subraza = await Subraza.findOne({ where: { slug: seed.subrazaSlug, RazaId: raza.id } }) || await Subraza.findOne({ where: { RazaId: raza.id } });
    const trasfondo = await Trasfondo.findOne({ where: { slug: seed.trasfondoSlug } }) || trasfondoDefault;

    // Para el seed usamos la primera clase como referencia de dado de vida
    const clasePrincipalId = clasesResueltas[0].claseId;
    const vida = obtenerPuntosVida(nivelPersonaje, clasePrincipalId, seed.atributos.constitucion);
    const ca = calcularCA('sin armadura', 0, seed.atributos.destreza, 0, 0);

    const [personaje] = await Personaje.findOrCreate({
      where: { nombre: seed.nombre },
      defaults: {
        nombre: seed.nombre,
        nivelPersonaje,
        alineamiento: seed.alineamiento,
        vida_actual: vida,
        vida_max: vida,
        clase_armadura: ca,
        imagen: seed.imagen,
        RazaId: raza.id,
        SubrazaId: subraza?.id || null,
        TrasfondoId: trasfondo?.id || null,
        UsuarioId: seed.usuarioId
      }
    });

    await personaje.update({
      nivelPersonaje,
      alineamiento: seed.alineamiento,
      vida_actual: vida,
      vida_max: vida,
      clase_armadura: ca,
      imagen: seed.imagen,
      RazaId: raza.id,
      SubrazaId: subraza?.id || null,
      TrasfondoId: trasfondo?.id || null,
      UsuarioId: seed.usuarioId
    });

    await PersonajeClase.destroy({ where: { PersonajeId: personaje.id } });
    for (const fila of clasesResueltas) {
      await PersonajeClase.create({
        PersonajeId: personaje.id,
        ClaseId: fila.claseId,
        SubclaseId: fila.subclaseId,
        nivel: fila.nivel,
        orden: fila.orden
      });
    }

    const [atributos] = await Atributo.findOrCreate({
      where: { PersonajeId: personaje.id },
      defaults: {
        PersonajeId: personaje.id,
        fuerza: seed.atributos.fuerza,
        destreza: seed.atributos.destreza,
        constitucion: seed.atributos.constitucion,
        inteligencia: seed.atributos.inteligencia,
        sabiduria: seed.atributos.sabiduria,
        carisma: seed.atributos.carisma
      }
    });
    await atributos.update({
      fuerza: seed.atributos.fuerza,
      destreza: seed.atributos.destreza,
      constitucion: seed.atributos.constitucion,
      inteligencia: seed.atributos.inteligencia,
      sabiduria: seed.atributos.sabiduria,
      carisma: seed.atributos.carisma
    });

    // Inventario base de ejemplo para validar UI y relaciones.
    const objetosBase = [
      { nombre: 'Espada larga', slug: 'espada-larga', tipo: 'arma', estadisticas: { dano: '1d8 cortante' } },
      { nombre: 'Armadura de cuero', slug: 'armadura-cuero', tipo: 'armadura', estadisticas: { ca_base: 11 } },
      { nombre: 'Poción de curación', slug: 'pocion-curacion', tipo: 'consumible', estadisticas: { cura: '2d4+2' } }
    ];
    for (const item of objetosBase) {
      const [obj] = await Objeto.findOrCreate({
        where: { slug: item.slug },
        defaults: item
      });
      await InventarioPersonaje.findOrCreate({
        where: { PersonajeId: personaje.id, ObjetoId: obj.id },
        defaults: {
          PersonajeId: personaje.id,
          ObjetoId: obj.id,
          cantidad: item.tipo === 'consumible' ? 2 : 1,
          equipado: item.tipo === 'arma' || item.tipo === 'armadura'
        }
      });
    }
  }
} 

async function seedUsuariosPrueba() {
  const total = await Usuario.count();
  if (total > 0) return;

  const passwordHash = await bcrypt.hash('1234', 10);
  await Usuario.bulkCreate([
    { nombre: 'Usuario1', correo: 'usuario1@tfg.local', contrasena: passwordHash },
    { nombre: 'Usuario2', correo: 'usuario2@tfg.local', contrasena: passwordHash }
  ]);
}

async function asegurarFkPersonajeClaseHaciaSubclase() {
  const [rows] = await sequelize.query("SELECT sql FROM sqlite_master WHERE type='table' AND name='PersonajeClase'");
  const ddl = Array.isArray(rows) && rows[0] ? String(rows[0].sql || '') : '';
  if (!ddl) return;
  if (!/REFERENCES\s+`?Multiclase`?/i.test(ddl)) return;

  await sequelize.query('PRAGMA foreign_keys = OFF');
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS PersonajeClase_tmp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        PersonajeId INTEGER NOT NULL REFERENCES Personaje(id) ON DELETE CASCADE,
        ClaseId INTEGER NOT NULL REFERENCES Clase(id),
        SubclaseId INTEGER REFERENCES Subclase(id),
        nivel INTEGER NOT NULL DEFAULT 1,
        orden INTEGER NOT NULL DEFAULT 1,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      )
    `);
    await sequelize.query(`
      INSERT INTO PersonajeClase_tmp (id, PersonajeId, ClaseId, SubclaseId, nivel, orden, createdAt, updatedAt)
      SELECT id, PersonajeId, ClaseId, SubclaseId, nivel, orden, createdAt, updatedAt
      FROM PersonajeClase
    `);
    await sequelize.query('DROP TABLE PersonajeClase');
    await sequelize.query('ALTER TABLE PersonajeClase_tmp RENAME TO PersonajeClase');
    await sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS personaje_clase_personaje_id_clase_id ON PersonajeClase (PersonajeId, ClaseId)');
  } finally {
    await sequelize.query('PRAGMA foreign_keys = ON');
  }
}

function esErrorSqliteCorrupto(error) {
  const code = error?.original?.code || error?.parent?.code || error?.code || '';
  const message = String(error?.original?.message || error?.parent?.message || error?.message || '');
  return code === 'SQLITE_CORRUPT' || /SQLITE_CORRUPT/i.test(message);
}

function obtenerRutaDatabaseSqlite() {
  const storage = sequelize?.options?.storage;
  return typeof storage === 'string' && storage.trim() ? storage : null;
}

async function respaldarBaseCorrupta() {
  const dbPath = obtenerRutaDatabaseSqlite();
  if (!dbPath || !fs.existsSync(dbPath)) return null;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = dbPath + `.corrupt-${timestamp}.bak`;
  await fs.promises.rename(dbPath, backupPath);
  return backupPath;
}

async function startServer(permiteRecuperacion = true) { 
  try { 
    await sequelize.authenticate(); 
    const qi = sequelize.getQueryInterface();
    // Renombres de tablas legacy antes de sync para conservar datos.
    const tablasPreviasRaw = await qi.showAllTables();
    const tablasPrevias = (tablasPreviasRaw || []).map((t) => (typeof t === 'string' ? t : t?.tableName)).filter(Boolean);
    if (tablasPrevias.includes('Multiclase') && !tablasPrevias.includes('Subclase')) {
      await qi.renameTable('Multiclase', 'Subclase');
    }
    if (tablasPrevias.includes('MulticlaseNivel') && !tablasPrevias.includes('SubclaseNivel')) {
      await qi.renameTable('MulticlaseNivel', 'SubclaseNivel');
    }
    if (tablasPrevias.includes('PersonajeObjeto') && !tablasPrevias.includes('InventarioPersonaje')) {
      await qi.renameTable('PersonajeObjeto', 'InventarioPersonaje');
    }
    await sequelize.sync({ force: isDevelopment && RECREAR_BD_AL_INICIAR });
    const tablasRaw = await qi.showAllTables();
    const tablas = (tablasRaw || []).map((t) => (typeof t === 'string' ? t : t?.tableName)).filter(Boolean);
    if (tablas.includes('InventarioPersonaje')) {
      const tablaInventarioPersonaje = await qi.describeTable('InventarioPersonaje');
      if (!tablaInventarioPersonaje.datos) {
        await qi.addColumn('InventarioPersonaje', 'datos', {
          type: require('sequelize').DataTypes.JSON,
          allowNull: true
        });
      }
    }
    if (tablas.includes('PersonajeObjeto') && !tablas.includes('InventarioPersonaje')) {
      const tablaInventarioPersonaje = await qi.describeTable('PersonajeObjeto');
      if (!tablaInventarioPersonaje.datos) {
        await qi.addColumn('PersonajeObjeto', 'datos', {
        type: require('sequelize').DataTypes.JSON,
        allowNull: true
      });
    }
    }
    if (tablas.includes('Personaje')) {
      const tablaPersonaje = await qi.describeTable('Personaje');
      if (!tablaPersonaje.ascendencia_draconida) {
        await qi.addColumn('Personaje', 'ascendencia_draconida', {
          type: require('sequelize').DataTypes.STRING,
          allowNull: true
        });
      }
    }
    if (tablas.includes('Clase')) {
      const tablaClase = await qi.describeTable('Clase');
      if (!tablaClase.proficiency_choices) {
        await qi.addColumn('Clase', 'proficiency_choices', {
          type: require('sequelize').DataTypes.JSON,
          allowNull: true
        });
      }
    }
    await asegurarFkPersonajeClaseHaciaSubclase();
    await guardarTrasfondos().catch((err) => {
      console.warn('No se pudieron completar trasfondos desde API:', err.message);
    });
    await guardarHechizos().catch((err) => {
      console.warn('No se pudieron completar hechizos desde API:', err.message);
    });
    await guardarFeats().catch((err) => {
      console.warn('No se pudieron completar feats desde API:', err.message);
    });
    await guardarHabilidadesDnd().catch((err) => {
      console.warn('No se pudieron cargar habilidades D&D:', err.message);
    });
    await guardarIdiomasCompetencia().catch((err) => {
      console.warn('No se pudieron cargar idiomas de competencia:', err.message);
    });
    await completarEleccionesCompetenciasClaseDesdeApi().catch((err) => {
      console.warn('No se pudieron completar elecciones de competencias de clase:', err.message);
    });
    const totalClaseCompetencia = await ClaseCompetencia.count();
    if (totalClaseCompetencia < CANTIDAD_CLASE_COMPETENCIA_MIN) {
      await rellenarClaseCompetenciaDesdeBd().catch((err) => {
        console.warn('No se pudieron enlazar clase-competencia desde BD:', err.message);
      });
    }
    await guardarRasgosDnd().catch((err) => {
      console.warn('No se pudieron cargar rasgos D&D:', err.message);
    });
    const totalRazaRasgo = await RazaRasgo.count();
    if (totalRazaRasgo < 27) {
      await rellenarRazaRasgoDesdeBd().catch((err) => {
        console.warn('No se pudieron enlazar raza-rasgo desde BD:', err.message);
      });
    }
    const totalSubrazaRasgo = await SubrazaRasgo.count();
    if (totalSubrazaRasgo < 14) {
      await rellenarSubrazaRasgoDesdeBd().catch((err) => {
        console.warn('No se pudieron enlazar subraza-rasgo desde BD:', err.message);
      });
    }
    const totalSubclaseRasgo = await SubclaseRasgo.count();
    if (totalSubclaseRasgo < CANTIDAD_SUBCLASE_RASGO_MIN) {
      await guardarSubclaseRasgosDesdeApi().catch((err) => {
        console.warn('No se pudieron enlazar subclase-rasgo desde API:', err.message);
      });
      await rellenarSubclaseRasgoDesdeBd().catch((err) => {
        console.warn('No se pudieron enlazar subclase-rasgo desde BD:', err.message);
      });
    }
    await seedUsuariosPrueba();
    await seedPersonajesPrueba();
    app.listen(PORT, () => { 
      console.log('Servidor corriendo en http://localhost:' + PORT); 
    }); 
  } catch (error) { 
    if (permiteRecuperacion && esErrorSqliteCorrupto(error)) {
      try {
        await sequelize.close().catch(() => {});
        const backupPath = await respaldarBaseCorrupta();
        if (backupPath) {
          console.warn('Se detectó una base SQLite corrupta. Backup creado en:', backupPath);
        } else {
          console.warn('Se detectó una base SQLite corrupta. No se encontró archivo para respaldar.');
        }
        console.warn('Reintentando inicio con una base nueva...');
        return startServer(false);
      } catch (recoveryError) {
        console.error('Falló la recuperación automática de la base SQLite:', recoveryError);
      }
    }
    console.error('Error iniciando servidor:', error); 
  } 
} 
 
startServer();
