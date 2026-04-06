const fs = require('fs/promises');
const path = require('path');

const ALLOWED_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif']);
const SUBCARPETA_DEFECTO = 'personajesDefecto';

function publicImagesDir() {
  return path.join(__dirname, '..', 'public', 'images');
}

/**
 * Lista imágenes para selección de personaje:
 * - solo /images/personajesDefecto/* (retratos por defecto)
 */
async function listarImagenesPersonaje() {
  const imagesRoot = publicImagesDir();
  const defectoDir = path.join(imagesRoot, SUBCARPETA_DEFECTO);
  const out = [];

  const addFile = (urlPath, file) => {
    if (!ALLOWED_EXT.has(path.extname(file).toLowerCase())) return;
    out.push({
      url: urlPath + file,
      nombre: path.parse(file).name
    });
  };

  try {
    const defectoFiles = await fs.readdir(defectoDir);
    defectoFiles.forEach((file) => addFile(`/images/${SUBCARPETA_DEFECTO}/`, file));
  } catch {
    // carpeta aún no existe
  }

  out.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  return out;
}

/** Ruta por defecto si no hay imagen (retrato genérico) */
const IMAGEN_POR_DEFECTO_URL = `/images/${SUBCARPETA_DEFECTO}/imagenPorDefecto.avif`;

module.exports = {
  listarImagenesPersonaje,
  IMAGEN_POR_DEFECTO_URL,
  SUBCARPETA_DEFECTO
};
