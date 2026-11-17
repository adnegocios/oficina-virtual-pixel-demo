// Sprites de personajes generados en código (diseño original, sin assets externos).
//
// Cada personaje se dibuja píxel a píxel con rectángulos sobre un lienzo de 16×24,
// a partir de su "apariencia" (colores, peinado y accesorio de agents.config.json).
// Luego se le agrega un contorno oscuro automático y se guarda en caché.

import { oscurecer, aclarar } from './color.js';

export const SPR_ANCHO = 16;
export const SPR_ALTO = 24;
const OX = 2; // margen izquierdo dentro del lienzo
const OY = 3; // margen superior (deja sitio para el brazo levantado)
export const SPR_OY = OY;
const CONTORNO = [26, 20, 32];
const PAPEL = '#f3efe2';
const OJOS = '#241a1f';

const cache = new Map();

/**
 * Devuelve un lienzo con el personaje en la pose pedida.
 * @param {object} ap  apariencia (+ id para la caché)
 * @param {object} o   { modo:'sentado'|'pie', brazos, dir:'abajo'|'arriba'|'lado', cuadro, ojos, mirada, doc }
 */
export function spritePersona(ap, o) {
  const clave = `${ap.id}|${o.modo}|${o.brazos}|${o.dir}|${o.cuadro}|${o.ojos}|${o.mirada}|${o.doc}`;
  const enCache = cache.get(clave);
  if (enCache) return enCache;

  const lienzo = document.createElement('canvas');
  lienzo.width = SPR_ANCHO;
  lienzo.height = SPR_ALTO;
  const g = lienzo.getContext('2d');
  const p = (x, y, w, h, col) => {
    g.fillStyle = col;
    g.fillRect(OX + x, OY + y, w, h);
  };
  const c = paleta(ap);

  if (o.modo === 'sentado') dibujarSentado(p, c, ap, o);
  else if (o.dir === 'arriba') dibujarEspalda(p, c, ap, o);
  else if (o.dir === 'lado') dibujarPerfil(p, c, ap, o);
  else dibujarFrente(p, c, ap, o);

  contornear(g);
  cache.set(clave, lienzo);
  return lienzo;
}

function paleta(ap) {
  return {
    piel: ap.piel,
    pielSombra: oscurecer(ap.piel, 0.82),
    boca: oscurecer(ap.piel, 0.68),
    pelo: ap.pelo,
    peloBrillo: aclarar(ap.pelo, 0.28),
    ropa: ap.ropa,
    ropaSombra: oscurecer(ap.ropa, 0.72),
    ropaLuz: aclarar(ap.ropa, 0.22),
    pantalon: ap.pantalon,
    pantalonSombra: oscurecer(ap.pantalon, 0.75),
    zapatos: '#2b2522',
    acento: ap.acento,
    acentoSombra: oscurecer(ap.acento, 0.7),
    acentoLuz: aclarar(ap.acento, 0.3),
  };
}

// ---------------------------------------------------------------- cabeza

function cabezaFrente(p, c, ap, o) {
  const pein = ap.peinado;
  // Pelo (parte superior)
  if (pein === 'rizado') {
    p(2, 0, 8, 1, c.pelo);
    p(1, 1, 10, 3, c.pelo);
    p(1, 4, 1, 3, c.pelo);
    p(10, 4, 1, 3, c.pelo);
    p(3, 1, 2, 1, c.peloBrillo);
    p(7, 2, 2, 1, c.peloBrillo);
  } else if (pein === 'rapado') {
    p(3, 1, 6, 2, c.pelo);
  } else {
    p(3, 0, 6, 1, c.pelo);
    p(2, 1, 8, 2, c.pelo);
    p(4, 1, 2, 1, c.peloBrillo);
  }
  // Cara y orejas
  p(3, 3, 6, 4, c.piel);
  p(3, 6, 1, 1, c.pielSombra);
  p(8, 6, 1, 1, c.pielSombra);
  p(2, 4, 1, 2, c.piel);
  p(9, 4, 1, 2, c.piel);
  // Pelo de los lados según peinado
  if (pein === 'corto' || pein === 'cola') {
    p(2, 3, 1, 1, c.pelo);
    p(9, 3, 1, 1, c.pelo);
    p(3, 3, 2, 1, c.pelo); // flequillo
  }
  if (pein === 'cola') {
    p(10, 2, 1, 1, c.pelo);
    p(10, 3, 1, 4, c.pelo);
  }
  if (pein === 'largo') {
    p(2, 3, 1, 7, c.pelo);
    p(9, 3, 1, 7, c.pelo);
    p(1, 4, 1, 5, c.pelo);
    p(10, 4, 1, 5, c.pelo);
    p(3, 3, 3, 1, c.pelo);
  }
  // Ojos (parpadeo y dirección de la mirada)
  const oy = o.mirada === 'abajo' ? 5 : 4;
  const dx = o.mirada === 'lado' ? -1 : o.mirada === 'abajo' && o.cuadro === 1 ? 1 : 0;
  if (o.ojos === 'cerrados') {
    p(4, 5, 1, 1, c.pielSombra);
    p(7, 5, 1, 1, c.pielSombra);
  } else {
    p(4 + dx, oy, 1, 1, OJOS);
    p(7 + dx, oy, 1, 1, OJOS);
  }
  p(5, 6, 2, 1, c.boca);
  p(5, 7, 2, 1, c.pielSombra); // cuello
  accesorioCabezaFrente(p, c, ap);
}

function accesorioCabezaFrente(p, c, ap) {
  switch (ap.accesorio) {
    case 'lentes':
      p(3, 4, 6, 1, '#1d1b2a');
      p(4, 4, 1, 1, '#a8d8ff');
      p(7, 4, 1, 1, '#a8d8ff');
      break;
    case 'audifonos':
      p(2, 0, 8, 1, c.acentoSombra);
      p(1, 3, 2, 3, c.acento);
      p(9, 3, 2, 3, c.acento);
      p(3, 6, 1, 1, '#3a3a3a');
      break;
    case 'visera':
      p(2, 2, 8, 1, c.acento);
      p(1, 3, 10, 1, c.acentoSombra);
      break;
    case 'gorra':
      p(2, 0, 8, 3, c.acento);
      p(3, 0, 3, 1, c.acentoLuz);
      p(2, 3, 8, 1, c.acentoSombra);
      break;
    case 'lazo':
      p(8, 0, 3, 2, c.acento);
      p(9, 0, 1, 2, c.acentoSombra);
      break;
    default:
      break;
  }
}

function accesorioTorsoFrente(p, c, ap) {
  switch (ap.accesorio) {
    case 'corbata':
      p(4, 8, 4, 1, '#f1efe8');
      p(4, 9, 1, 3, c.ropaSombra);
      p(7, 9, 1, 3, c.ropaSombra);
      p(5, 9, 2, 1, c.acentoSombra);
      p(5, 10, 2, 3, c.acento);
      break;
    case 'bufanda':
      p(3, 7, 6, 2, c.acento);
      p(7, 9, 2, 3, c.acentoSombra);
      break;
    default:
      p(4, 8, 4, 1, c.ropaLuz); // cuello de la prenda
      break;
  }
}

// ---------------------------------------------------------------- sentado

function dibujarSentado(p, c, ap, o) {
  cabezaFrente(p, c, ap, o);
  // Torso (solo hasta la fila 13: el escritorio tapa el resto)
  p(2, 8, 8, 6, c.ropa);
  p(2, 8, 8, 1, c.ropaLuz);
  accesorioTorsoFrente(p, c, ap);

  const f = o.cuadro % 2;
  switch (o.brazos) {
    case 'teclear':
      p(1, 8, 1, 3, c.ropa);
      p(10, 8, 1, 3, c.ropa);
      p(1, 11, 2, 1, c.ropaSombra);
      p(9, 11, 2, 1, c.ropaSombra);
      p(3, f ? 12 : 13, 2, 1, c.piel);
      p(7, f ? 13 : 12, 2, 1, c.piel);
      break;
    case 'raton':
      p(1, 8, 1, 4, c.ropa);
      p(2, 12, 2, 1, c.piel);
      p(10, 8, 1, 4, c.ropa);
      p(10 + f, 12, 2, 1, c.piel);
      break;
    case 'leer':
      p(1, 8, 1, 3, c.ropa);
      p(10, 8, 1, 3, c.ropa);
      p(3, 9 + f, 6, 5 - f, PAPEL);
      p(4, 10 + f, 4, 1, '#8a93a6');
      p(4, 12 + f, 3, 1, '#8a93a6');
      p(2, 10 + f, 1, 2, c.piel);
      p(9, 10 + f, 1, 2, c.piel);
      break;
    case 'rascar':
      p(1, 8, 1, 4, c.ropa);
      p(1, 12, 2, 1, c.piel);
      p(10, 5, 1, 4, c.ropa);
      p(9, 3 + f, 2, 2, c.piel);
      break;
    case 'levantar':
      p(1, 8, 1, 4, c.ropa);
      p(1, 12, 2, 1, c.piel);
      p(10, 3 + f, 2, 6 - f, c.ropa);
      p(10, 1 + f, 2, 2, c.piel);
      break;
    default: // reposo
      p(1, 8, 1, 4, c.ropa);
      p(10, 8, 1, 4, c.ropa);
      p(1, 12, 2, 1, c.piel);
      p(9, 12, 2, 1, c.piel);
      break;
  }
}

// ---------------------------------------------------------------- de pie

function piernasFrente(p, c, cuadro) {
  const subeIzq = cuadro === 1 ? 1 : 0;
  const subeDer = cuadro === 3 ? 1 : 0;
  p(3, 14, 3, 4 - subeIzq, c.pantalon);
  p(6, 14, 3, 4 - subeDer, c.pantalonSombra);
  p(3, 18 - subeIzq, 3, 1, c.zapatos);
  p(6, 18 - subeDer, 3, 1, c.zapatos);
}

function dibujarFrente(p, c, ap, o) {
  cabezaFrente(p, c, ap, o);
  p(2, 8, 8, 6, c.ropa);
  p(2, 8, 8, 1, c.ropaLuz);
  p(2, 13, 8, 1, c.ropaSombra);
  accesorioTorsoFrente(p, c, ap);
  if (o.doc) {
    p(1, 8, 1, 4, c.ropa);
    p(10, 8, 1, 4, c.ropa);
    p(3, 11, 6, 4, PAPEL);
    p(7, 11, 2, 1, '#d8d2c0');
    p(4, 13, 3, 1, '#8a93a6');
    p(2, 12, 1, 2, c.piel);
    p(9, 12, 1, 2, c.piel);
  } else {
    const a = o.cuadro === 1 ? 1 : 0;
    const b = o.cuadro === 3 ? 1 : 0;
    p(1, 8, 1, 5 - a, c.ropa);
    p(10, 8, 1, 5 - b, c.ropa);
    p(1, 13 - a, 1, 1, c.piel);
    p(10, 13 - b, 1, 1, c.piel);
  }
  piernasFrente(p, c, o.cuadro);
}

function dibujarEspalda(p, c, ap, o) {
  const pein = ap.peinado;
  if (pein === 'rapado') {
    p(3, 1, 6, 6, c.pelo);
    p(2, 3, 1, 3, c.piel);
    p(9, 3, 1, 3, c.piel);
  } else {
    p(3, 0, 6, 1, c.pelo);
    p(2, 1, 8, 6, c.pelo);
    if (pein === 'rizado') p(1, 1, 10, 5, c.pelo);
    if (pein === 'largo') p(2, 7, 8, 3, c.pelo);
    if (pein === 'cola') p(5, 7, 2, 3, c.pelo);
  }
  p(5, 7, 2, 1, c.pielSombra);
  switch (ap.accesorio) {
    case 'gorra':
      p(2, 0, 8, 3, c.acento);
      break;
    case 'visera':
      p(2, 2, 8, 1, c.acento);
      break;
    case 'audifonos':
      p(2, 0, 8, 1, c.acentoSombra);
      p(1, 3, 1, 3, c.acento);
      p(10, 3, 1, 3, c.acento);
      break;
    case 'lazo':
      p(4, 1, 4, 2, c.acento);
      break;
    default:
      break;
  }
  p(2, 8, 8, 6, c.ropa);
  p(2, 13, 8, 1, c.ropaSombra);
  if (pein === 'largo') p(3, 8, 6, 2, c.pelo);
  const a = o.cuadro === 1 ? 1 : 0;
  const b = o.cuadro === 3 ? 1 : 0;
  p(1, 8, 1, 5 - b, c.ropa);
  p(10, 8, 1, 5 - a, c.ropa);
  p(1, 13 - b, 1, 1, c.piel);
  p(10, 13 - a, 1, 1, c.piel);
  piernasFrente(p, c, o.cuadro);
}

function dibujarPerfil(p, c, ap, o) {
  const pein = ap.peinado;
  // Cabeza mirando a la derecha
  p(3, 3, 6, 4, c.piel);
  if (pein === 'rizado') {
    p(1, 0, 8, 3, c.pelo);
    p(1, 3, 4, 4, c.pelo);
  } else if (pein === 'rapado') {
    p(3, 1, 6, 2, c.pelo);
    p(3, 3, 1, 2, c.pelo);
  } else {
    p(3, 0, 6, 1, c.pelo);
    p(2, 1, 7, 2, c.pelo);
    p(2, 3, 3, 3, c.pelo);
    if (pein === 'largo') p(1, 3, 3, 7, c.pelo);
    if (pein === 'cola') {
      p(1, 2, 1, 1, c.pelo);
      p(0, 3, 2, 3, c.pelo);
    }
  }
  p(5, 4, 1, 2, c.pielSombra); // oreja
  p(7, 4, 1, 1, OJOS);
  p(9, 5, 1, 1, c.piel); // nariz
  p(7, 6, 2, 1, c.boca);
  p(5, 7, 2, 1, c.pielSombra);
  switch (ap.accesorio) {
    case 'gorra':
      p(2, 0, 7, 3, c.acento);
      p(8, 2, 3, 1, c.acentoSombra);
      break;
    case 'visera':
      p(3, 2, 6, 1, c.acento);
      p(8, 3, 3, 1, c.acentoSombra);
      break;
    case 'lentes':
      p(6, 4, 3, 1, '#1d1b2a');
      p(7, 4, 1, 1, '#a8d8ff');
      break;
    case 'audifonos':
      p(4, 0, 2, 3, c.acentoSombra);
      p(4, 3, 2, 3, c.acento);
      break;
    case 'lazo':
      p(1, 1, 2, 2, c.acento);
      break;
    default:
      break;
  }
  // Cuerpo
  p(3, 8, 6, 6, c.ropa);
  p(3, 8, 6, 1, c.ropaLuz);
  p(3, 13, 6, 1, c.ropaSombra);
  if (ap.accesorio === 'corbata') p(8, 9, 1, 3, c.acento);
  if (ap.accesorio === 'bufanda') p(3, 7, 6, 2, c.acento);
  if (o.doc) {
    p(5, 8, 2, 4, c.ropaSombra);
    p(7, 11, 2, 1, c.piel);
    p(8, 9, 3, 5, PAPEL);
  } else if (o.cuadro === 1) {
    p(6, 9, 2, 4, c.ropaSombra);
    p(7, 13, 2, 1, c.piel);
  } else if (o.cuadro === 3) {
    p(3, 9, 2, 4, c.ropaSombra);
    p(2, 13, 2, 1, c.piel);
  } else {
    p(5, 8, 2, 5, c.ropaSombra);
    p(5, 13, 2, 1, c.piel);
  }
  // Piernas
  if (o.cuadro === 1 || o.cuadro === 3) {
    const adelante = o.cuadro === 1 ? c.pantalon : c.pantalonSombra;
    const atras = o.cuadro === 1 ? c.pantalonSombra : c.pantalon;
    p(3, 14, 2, 4, atras);
    p(6, 14, 3, 4, adelante);
    p(2, 18, 3, 1, c.zapatos);
    p(7, 18, 3, 1, c.zapatos);
  } else {
    p(4, 14, 4, 4, c.pantalon);
    p(4, 18, 5, 1, c.zapatos);
  }
}

// ---------------------------------------------------------------- contorno

/** Agrega un contorno oscuro de 1 px alrededor de todo lo dibujado. */
function contornear(g) {
  const img = g.getImageData(0, 0, SPR_ANCHO, SPR_ALTO);
  const d = img.data;
  const salida = new Uint8ClampedArray(d);
  const opaco = (x, y) => x >= 0 && y >= 0 && x < SPR_ANCHO && y < SPR_ALTO && d[(y * SPR_ANCHO + x) * 4 + 3] > 0;
  for (let y = 0; y < SPR_ALTO; y++) {
    for (let x = 0; x < SPR_ANCHO; x++) {
      const i = (y * SPR_ANCHO + x) * 4;
      if (d[i + 3] > 0) continue;
      if (opaco(x - 1, y) || opaco(x + 1, y) || opaco(x, y - 1) || opaco(x, y + 1)) {
        salida[i] = CONTORNO[0];
        salida[i + 1] = CONTORNO[1];
        salida[i + 2] = CONTORNO[2];
        salida[i + 3] = 255;
      }
    }
  }
  img.data.set(salida);
  g.putImageData(img, 0, 0);
}
