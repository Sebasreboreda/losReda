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
  Atributo,
  Usuario,
  ClaseNivel,
  SubclaseNivel,
  RazaNivel,
  PersonajeClase
} = require('./models');
const { guardarCatalogo, guardarNiveles, guardarHabilidadesDnd } = require('./services/apiService');
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
const PORT = Number.parseInt(process.env.PORT, 10) || 4000;
const isDevelopment = process.env.NODE_ENV !== 'production';
const CANTIDAD_SUBRAZAS_MIN = 8;
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
  const [totalClases, totalRazas, totalSubrazas, totalSubclases, totalTrasfondos, totalClaseNiveles, totalSubclaseNiveles, totalRazaNiveles] = await Promise.all([
    Clase.count(),
    Raza.count(),
    Subraza.count(),
    Subclase.count(),
    Trasfondo.count(),
    ClaseNivel.count(),
    SubclaseNivel.count(),
    RazaNivel.count()
  ]);

  const catalogoBaseCompleto =
    totalClases > 0 &&
    totalRazas > 0 &&
    totalSubrazas >= CANTIDAD_SUBRAZAS_MIN &&
    totalSubclases > 0 &&
    totalTrasfondos > 0;
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

  const total = await Personaje.count();
  if (total > 0) return;

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

    const personaje = await Personaje.create({
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
    });

    for (const fila of clasesResueltas) {
      await PersonajeClase.create({
        PersonajeId: personaje.id,
        ClaseId: fila.claseId,
        SubclaseId: fila.subclaseId,
        nivel: fila.nivel,
        orden: fila.orden
      });
    }

    await Atributo.create({
      PersonajeId: personaje.id,
      fuerza: seed.atributos.fuerza,
      destreza: seed.atributos.destreza,
      constitucion: seed.atributos.constitucion,
      inteligencia: seed.atributos.inteligencia,
      sabiduria: seed.atributos.sabiduria,
      carisma: seed.atributos.carisma
    });
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
 
async function startServer() { 
  try { 
    await sequelize.authenticate(); 
    await sequelize.sync({ force: isDevelopment && RECREAR_BD_AL_INICIAR });
    await guardarHabilidadesDnd().catch((err) => {
      console.warn('No se pudieron cargar habilidades D&D:', err.message);
    });
    await seedUsuariosPrueba();
    await seedPersonajesPrueba();
    app.listen(PORT, () => { 
      console.log('Servidor corriendo en http://localhost:' + PORT); 
    }); 
  } catch (error) { 
    console.error('Error iniciando servidor:', error); 
  } 
} 
 
startServer();
