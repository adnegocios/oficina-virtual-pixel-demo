// Escena de la oficina: fondo estático, decoración animada, muebles y rutas de caminata.
// Todo se dibuja en coordenadas lógicas de 384×240 píxeles (24×15 baldosas de 16 px).

import { dibujarTexto, anchoTexto } from './fuente.js';

export const ANCHO = 384;
export const ALTO = 240;
export const BALDOSA = 16;
const CELDA = 4; // resolución de la malla de caminata

// Sala de reuniones (esquina superior derecha) y su puerta en la pared izquierda
export const SALA = { x: 256, y: 32, ancho: 128, alto: 112, puertaY1: 80, puertaY2: 106 };
export const MESA = { x: 292, y: 72, ancho: 56, alto: 28 };
// 'desfase' sube el nombre de los asientos centrales para que no se encimen
export const ASIENTOS_REUNION = [
  { x: 298, y: 66, dir: 'abajo' },
  { x: 320, y: 66, dir: 'abajo', desfase: -8 },
  { x: 342, y: 66, dir: 'abajo' },
  { x: 298, y: 118, dir: 'arriba' },
  { x: 320, y: 118, dir: 'arriba', desfase: -8 },
  { x: 342, y: 118, dir: 'arriba' },
  { x: 278, y: 88, dir: 'lado' },
  { x: 364, y: 88, dir: 'izquierda' },
];

// Muebles fijos que bloquean el paso (x, y, ancho, alto)
const MUEBLES = [
  { x: 6, y: 34, ancho: 32, alto: 22 }, // archivadores
  { x: 236, y: 40, ancho: 12, alto: 14 }, // planta
  { x: 6, y: 222, ancho: 12, alto: 14 }, // planta
  { x: 300, y: 154, ancho: 44, alto: 12 }, // barra de café
  { x: 264, y: 156, ancho: 12, alto: 16 }, // dispensador de agua
  { x: 358, y: 156, ancho: 20, alto: 14 }, // impresora
  { x: 288, y: 212, ancho: 60, alto: 18 }, // sofá
  { x: 366, y: 220, ancho: 12, alto: 14 }, // planta
];

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

// ====================================================================== fondo

/** Dibuja una sola vez todo lo que no se mueve y lo guarda en un lienzo. */
export function dibujarFondo(config) {
  const lienzo = document.createElement('canvas');
  lienzo.width = ANCHO;
  lienzo.height = ALTO;
  const g = lienzo.getContext('2d');
  const r = (x, y, w, h, col) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };

  // Piso de madera (zona abierta)
  for (let y = 32; y < ALTO; y += 8) {
    const fila = (y - 32) / 8;
    r(0, y, SALA.x, 8, fila % 2 ? '#c69f69' : '#caa470');
    r(0, y + 7, SALA.x, 1, '#b08955');
    for (let x = (fila % 3) * 16; x < SALA.x; x += 48) r(x, y, 1, 7, '#a98150');
  }
  // Alfombra de la sala de reuniones
  r(SALA.x, SALA.y, SALA.ancho, SALA.alto, '#3f6e74');
  for (let y = SALA.y; y < SALA.y + SALA.alto; y += 8) {
    for (let x = SALA.x; x < ANCHO; x += 8) if (((x + y) / 8) % 2) r(x + 3, y + 3, 2, 2, '#487c82');
  }
  // Baldosas de la zona de descanso
  for (let y = 152; y < ALTO; y += 16) {
    for (let x = SALA.x; x < ANCHO; x += 16) {
      r(x, y, 16, 16, ((x + y) / 16) % 2 ? '#ddd5c3' : '#d2c9b5');
      r(x, y, 16, 1, '#c4bba6');
      r(x, y, 1, 16, '#c4bba6');
    }
  }

  // Pared superior
  r(0, 0, ANCHO, 28, '#e8d8bb');
  r(0, 0, ANCHO, 3, '#b8996c');
  r(0, 25, ANCHO, 3, '#dccaa8');
  r(0, 28, ANCHO, 4, '#8c6a46');
  g.fillStyle = 'rgba(60,40,20,0.18)';
  g.fillRect(0, 32, ANCHO, 2);

  ventana(g, 8, 5, 40, 18);
  ventana(g, 264, 5, 32, 18);
  ventana(g, 344, 5, 32, 18);

  // Calendario con el mes actual (el día 10 marcado: verificación final del cierre)
  r(60, 6, 20, 18, '#fbfaf5');
  r(60, 6, 20, 5, '#c0392b');
  dibujarTexto(g, MESES[new Date().getMonth()], 64, 6, '#ffffff');
  for (let fy = 0; fy < 4; fy++) for (let fx = 0; fx < 6; fx++) r(62 + fx * 3, 13 + fy * 3, 1, 1, '#6b6b6b');
  r(64, 15, 3, 3, '#e74c3c');
  r(65, 16, 1, 1, '#fbfaf5');

  // Placa con el nombre de la oficina
  const nombre = config.oficina.nombre;
  const anchoPlaca = Math.max(40, anchoTexto(nombre) + 10);
  const xPlaca = 216 - Math.round(anchoPlaca / 2);
  r(xPlaca, 8, anchoPlaca, 14, '#3a2a1c');
  r(xPlaca + 1, 9, anchoPlaca - 2, 12, '#5a4128');
  dibujarTexto(g, nombre, xPlaca + Math.round((anchoPlaca - anchoTexto(nombre)) / 2), 12, '#f2c14e');

  // Letrero de la sala
  r(300, 7, 40, 17, '#2f4f54');
  dibujarTexto(g, 'SALA DE', 320 - Math.round(anchoTexto('SALA DE') / 2), 9, '#f3e9d2');
  dibujarTexto(g, 'REUNIONES', 320 - Math.round(anchoTexto('REUNIONES') / 2), 16, '#f3e9d2');

  // Pared izquierda de la sala (vista desde arriba) con puerta
  r(SALA.x, 32, 6, SALA.puertaY1 - 32, '#b8996c');
  r(SALA.x, SALA.puertaY2, 6, 140 - SALA.puertaY2, '#b8996c');
  g.fillStyle = 'rgba(0,0,0,0.15)';
  g.fillRect(SALA.x + 6, 32, 2, SALA.puertaY1 - 32);
  g.fillRect(SALA.x + 6, SALA.puertaY2, 2, 140 - SALA.puertaY2);
  r(SALA.x - 1, SALA.puertaY1 - 2, 8, 2, '#6e5236');
  r(SALA.x - 1, SALA.puertaY2, 8, 2, '#6e5236');
  // Pared inferior de la sala: tapa + vidrio
  r(SALA.x, 140, ANCHO - SALA.x, 4, '#b8996c');
  r(SALA.x, 144, ANCHO - SALA.x, 8, '#9fcfe0');
  for (let x = SALA.x + 4; x < ANCHO; x += 14) r(x, 145, 1, 6, '#d8f0f8');
  r(SALA.x, 151, ANCHO - SALA.x, 1, '#6e5236');

  // Mesa de reuniones y sillas
  for (const a of ASIENTOS_REUNION.slice(0, 6)) {
    const y = a.dir === 'abajo' ? 62 : 104;
    r(a.x - 5, y, 10, 6, '#5b4a7a');
    r(a.x - 5, y, 10, 1, '#7a689c');
  }
  g.fillStyle = 'rgba(0,0,0,0.2)';
  g.fillRect(MESA.x + 2, MESA.y + MESA.alto, MESA.ancho, 3);
  r(MESA.x, MESA.y, MESA.ancho, 22, '#8a5a34');
  r(MESA.x, MESA.y, MESA.ancho, 2, '#a8703f');
  r(MESA.x, MESA.y + 22, MESA.ancho, 6, '#6b4426');
  r(300, 78, 11, 7, '#9aa3ad'); // laptop
  r(301, 79, 9, 4, '#3b5b7a');
  r(330, 79, 8, 6, '#f3efe2'); // papeles
  r(331, 81, 5, 1, '#8a93a6');
  r(318, 76, 4, 4, '#4ea65a'); // florero
  r(319, 80, 2, 3, '#d9d2c3');

  // Zona de descanso
  r(300, 154, 44, 4, '#9c7a55'); // barra de café
  r(300, 158, 44, 8, '#7a5c3e');
  r(304, 148, 10, 8, '#30343c'); // cafetera
  r(306, 150, 6, 2, '#e74c3c');
  r(320, 151, 3, 3, '#ffffff');
  r(326, 151, 3, 3, '#f2c14e');
  r(266, 160, 10, 12, '#e9eef2'); // dispensador de agua
  r(267, 151, 8, 9, '#7ec8e8');
  r(268, 152, 2, 6, '#bfe6f5');
  r(268, 165, 6, 1, '#9aa3ad');
  r(360, 158, 18, 12, '#d5d8dc'); // impresora
  r(360, 156, 18, 4, '#eef0f2');
  r(363, 153, 12, 3, '#ffffff');
  r(372, 162, 4, 2, '#3fae5a');
  r(290, 212, 56, 6, '#a2453b'); // sofá
  r(290, 218, 56, 8, '#c2564a');
  r(288, 214, 4, 14, '#8e3a32');
  r(344, 214, 4, 14, '#8e3a32');
  r(317, 218, 1, 8, '#a2453b');
  // Alfombra de entrada
  r(296, 232, 48, 8, '#6d4c41');
  r(297, 233, 46, 6, '#7d5a4d');
  dibujarTexto(g, 'BIENVENIDOS', 320 - Math.round(anchoTexto('BIENVENIDOS') / 2), 234, '#d7b98e');

  // Archivadores
  archivador(g, 6, 34);
  archivador(g, 23, 34);
  // Plantas
  planta(g, 237, 40);
  planta(g, 7, 222);
  planta(g, 367, 220);
  planta(g, 262, 34);

  return lienzo;
}

function ventana(g, x, y, w, h) {
  const r = (a, b, c, d, col) => {
    g.fillStyle = col;
    g.fillRect(a, b, c, d);
  };
  r(x, y, w, h, '#7b5a3a');
  r(x + 2, y + 2, w - 4, h - 4, '#9ed8f5');
  r(x + 2, y + 2 + Math.floor((h - 4) * 0.55), w - 4, Math.ceil((h - 4) * 0.45), '#c4ecff');
  // Volcán nevado lejano (silueta genérica)
  g.save();
  g.beginPath();
  g.rect(x + 2, y + 2, w - 4, h - 4);
  g.clip();
  const pico = x + Math.round(w * 0.62);
  for (let fy = y + 7; fy < y + h - 2; fy++) {
    const mitad = Math.round((fy - (y + 7)) * 1.7);
    r(pico - mitad, fy, mitad * 2 + 1, 1, '#6f8fa6');
  }
  r(pico - 1, y + 7, 3, 1, '#ffffff');
  r(pico - 2, y + 8, 5, 1, '#ffffff');
  r(x + 2, y + h - 4, w - 4, 2, '#5f8a5a');
  g.restore();
  r(x + Math.floor(w / 2) - 1, y, 2, h, '#7b5a3a');
  r(x - 1, y + h, w + 2, 2, '#a8835a');
}

function archivador(g, x, y) {
  const r = (a, b, c, d, col) => {
    g.fillStyle = col;
    g.fillRect(a, b, c, d);
  };
  r(x, y, 15, 22, '#8d99a6');
  r(x, y, 15, 3, '#b3bdc8');
  for (let i = 0; i < 3; i++) {
    r(x + 1, y + 4 + i * 6, 13, 5, '#9eaab6');
    r(x + 6, y + 6 + i * 6, 3, 1, '#4b5560');
  }
  g.fillStyle = 'rgba(0,0,0,0.18)';
  g.fillRect(x + 1, y + 22, 15, 2);
}

function planta(g, x, y) {
  const r = (a, b, c, d, col) => {
    g.fillStyle = col;
    g.fillRect(a, b, c, d);
  };
  r(x + 1, y + 7, 8, 6, '#b5562f');
  r(x, y + 6, 10, 2, '#cf6a3c');
  r(x + 2, y + 1, 6, 6, '#3f8f4a');
  r(x, y + 3, 4, 4, '#4ea65a');
  r(x + 6, y + 2, 4, 4, '#4ea65a');
  r(x + 3, y - 1, 3, 3, '#5cbf68');
}

// ====================================================================== decoración animada

/** Reloj de pared con la hora real y pizarra con el avance del cierre. */
export function dibujarDecoracion(g, agentes) {
  // Reloj
  const cx = 100;
  const cy = 14;
  for (let y = -7; y <= 7; y++) {
    for (let x = -7; x <= 7; x++) {
      const d = Math.hypot(x, y);
      if (d <= 7.4) {
        g.fillStyle = d > 6.2 ? '#5a4128' : '#fbfaf5';
        g.fillRect(cx + x, cy + y, 1, 1);
      }
    }
  }
  const ahora = new Date();
  const min = ahora.getMinutes() + ahora.getSeconds() / 60;
  const hora = (ahora.getHours() % 12) + min / 60;
  linea(g, cx, cy, (min / 60) * Math.PI * 2, 5, '#2b2b2b');
  linea(g, cx, cy, (hora / 12) * Math.PI * 2, 3, '#c0392b');

  // Pizarra: una casilla por agente, se marca cuando terminó al menos una tarea
  g.fillStyle = '#9aa3ad';
  g.fillRect(118, 4, 56, 22);
  g.fillStyle = '#fbfcfd';
  g.fillRect(120, 6, 52, 18);
  dibujarTexto(g, 'CIERRE', 122, 8, '#2a6fb0');
  const n = Math.min(agentes.length, 7);
  for (let i = 0; i < n; i++) {
    const x = 122 + i * 7;
    const hecho = agentes[i].tareas > 0;
    g.fillStyle = hecho ? '#3fae5a' : '#c9ced6';
    g.fillRect(x, 16, 5, 5);
    if (!hecho) {
      g.fillStyle = '#fbfcfd';
      g.fillRect(x + 1, 17, 3, 3);
    }
  }
  g.fillStyle = '#7d868f';
  g.fillRect(124, 26, 44, 1);
}

function linea(g, cx, cy, angulo, largo, color) {
  g.fillStyle = color;
  for (let i = 0; i <= largo; i++) {
    g.fillRect(Math.round(cx + Math.sin(angulo) * i), Math.round(cy - Math.cos(angulo) * i), 1, 1);
  }
}

// ====================================================================== muebles por agente

/** Silla, escritorio, monitor, objeto personal y pila de documentos de un agente. */
export function dibujarEscritorio(g, ag, t) {
  const r = (x, y, w, h, col) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };
  const sx = ag.asiento.x;
  const sy = ag.asiento.y;
  const m = ag.medioAncho;
  const x0 = sx - m;

  // Silla (respaldo detrás de la persona; asiento visible si está vacía)
  r(sx - 7, sy - 8, 14, 10, '#3b3f58');
  r(sx - 7, sy - 8, 14, 1, '#565b7a');
  if (!ag.sentado) r(sx - 6, sy - 1, 12, 3, '#2c2f44');

  // Sombra, cubierta y frente del escritorio
  g.fillStyle = 'rgba(0,0,0,0.18)';
  g.fillRect(x0 + 2, sy + 18, m * 2, 3);
  r(x0, sy + 2, m * 2, 10, ag.esGerente ? '#8a5530' : '#a8713f');
  r(x0, sy + 2, m * 2, 1, ag.esGerente ? '#a86a3e' : '#c28a52');
  r(x0, sy + 12, m * 2, 6, ag.esGerente ? '#64391d' : '#7a4f2a');
  r(x0, sy + 17, m * 2, 1, '#4f3018');
  if (ag.esGerente) {
    const anchoPlaca = anchoTexto('GERENCIA') + 6;
    r(sx - Math.round(anchoPlaca / 2), sy + 12, anchoPlaca, 7, '#c9a24a');
    dibujarTexto(g, 'GERENCIA', sx - Math.round(anchoTexto('GERENCIA') / 2), sy + 13, '#3a2a1c');
  } else {
    r(sx - 6, sy + 14, 12, 1, '#5e3c1f');
  }

  // Monitor (a la izquierda) con la pantalla según el estado
  const mx = x0 + 1;
  r(mx + 4, sy + 3, 5, 2, '#555a66');
  r(mx, sy - 6, 13, 10, '#2c2f3a');
  pantalla(g, mx + 1, sy - 5, ag, t);
  // Teclado
  r(sx - 5, sy + 4, 11, 3, '#d9d9df');
  for (let i = 0; i < 5; i++) r(sx - 4 + i * 2, sy + 5, 1, 1, '#9aa0ad');
  // Pila de documentos recibidos (delante del monitor)
  for (let i = 0; i < Math.min(ag.pila, 5); i++) {
    r(mx + 1, sy + 8 - i * 2, 9, 3, '#f3efe2');
    r(mx + 1, sy + 10 - i * 2, 9, 1, '#cfc8b4');
  }
  // Objeto personal (a la derecha)
  objeto(g, ag.ap.objeto, x0 + m * 2 - 12, sy - 4, t);
}

function pantalla(g, x, y, ag, t) {
  const r = (a, b, c, d, col) => {
    g.fillStyle = col;
    g.fillRect(a, b, c, d);
  };
  const w = 11;
  const h = 7;
  let modo = ag.estado;
  if (!ag.sentado) modo = 'apagado';
  else if (modo === 'idle' && !ag.activo) modo = ag.check ? 'listo' : 'apagado';
  switch (modo) {
    case 'escribiendo':
      r(x, y, w, h, '#162a40');
      for (let i = 0; i < 3; i++) {
        const largo = (Math.floor(t * 6 + i * 3) % 8) + 1;
        r(x + 1, y + 1 + i * 2, largo, 1, i % 2 ? '#7fe0a0' : '#ffd479');
      }
      break;
    case 'leyendo': {
      r(x, y, w, h, '#f2f2ea');
      const des = Math.floor(t * 2) % 2;
      for (let i = 0; i < 3; i++) r(x + 1, y + 1 + i * 2 + des, i % 2 ? 6 : 8, 1, '#6b7280');
      break;
    }
    case 'web':
      r(x, y, w, h, '#eaf4ff');
      r(x + 2, y + 1, 3, 5, '#3b82c4');
      r(x + 1, y + 2, 5, 3, '#3b82c4');
      r(x + 2, y + 2, 2, 1, '#3fae5a');
      r(x + 3, y + 4, 2, 1, '#3fae5a');
      r(x + 7, y + 3, 3, 1, '#bcd0e0');
      r(x + 7, y + 3, Math.floor(t * 3) % 4, 1, '#3b82c4');
      break;
    case 'esperando':
      r(x, y, w, h, '#3a3320');
      dibujarTexto(g, '?', x + 4, y + 1, '#ffd479');
      break;
    case 'listo':
      r(x, y, w, h, '#1f4d33');
      marcaCheck(g, x + 3, y + 1, '#7fe0a0');
      break;
    case 'idle':
      r(x, y, w, h, '#2e5f8f');
      if (Math.floor(t * 2) % 2) r(x + 2, y + 2, 1, 3, '#cfe8ff');
      break;
    default:
      r(x, y, w, h, '#1c2230');
      r(x + 1, y + 1, 2, 1, '#2c3445');
  }
}

/** Marca de verificación de 5×4 píxeles. */
export function marcaCheck(g, x, y, color) {
  g.fillStyle = color;
  g.fillRect(x + 4, y, 1, 1);
  g.fillRect(x + 3, y + 1, 1, 1);
  g.fillRect(x, y + 2, 1, 1);
  g.fillRect(x + 2, y + 2, 1, 1);
  g.fillRect(x + 1, y + 3, 1, 1);
}

function objeto(g, tipo, x, y, t) {
  const r = (a, b, c, d, col) => {
    g.fillStyle = col;
    g.fillRect(a, b, c, d);
  };
  switch (tipo) {
    case 'lampara':
      r(x + 5, y + 9, 5, 2, '#333333');
      r(x + 6, y + 3, 1, 6, '#555555');
      r(x + 3, y + 1, 6, 3, '#e2b13c');
      g.fillStyle = 'rgba(255,230,140,0.45)';
      g.fillRect(x + 2, y + 4, 8, 2);
      break;
    case 'taza':
      r(x + 3, y + 6, 4, 5, '#f2f2f2');
      r(x + 7, y + 7, 1, 2, '#f2f2f2');
      r(x + 3, y + 6, 4, 1, '#6b3e26');
      g.fillStyle = 'rgba(255,255,255,0.7)';
      g.fillRect(x + 4 + (Math.floor(t * 2) % 2), y + 2, 1, 3);
      break;
    case 'grafico':
      r(x + 1, y + 1, 10, 10, '#ffffff');
      r(x + 1, y + 10, 10, 1, '#9aa3ad');
      r(x + 2, y + 7, 2, 3, '#e74c3c');
      r(x + 5, y + 5, 2, 5, '#f1c40f');
      r(x + 8, y + 3, 2, 7, '#3fae5a');
      break;
    case 'calculadora':
      r(x + 2, y + 3, 8, 9, '#3d4350');
      r(x + 3, y + 4, 6, 2, '#a8d5a2');
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) r(x + 3 + i * 2, y + 7 + j * 2, 1, 1, '#dddddd');
      break;
    case 'monedas':
      r(x + 2, y + 6, 4, 5, '#d4a017');
      r(x + 2, y + 6, 4, 1, '#f4c430');
      r(x + 2, y + 8, 4, 1, '#f4c430');
      r(x + 6, y + 8, 4, 3, '#d4a017');
      r(x + 6, y + 8, 4, 1, '#f4c430');
      break;
    case 'carpetas':
      r(x + 1, y + 2, 3, 9, '#2e86de');
      r(x + 4, y + 2, 3, 9, '#e67e22');
      r(x + 7, y + 3, 3, 8, '#27ae60');
      r(x + 2, y + 4, 1, 2, '#ffffff');
      r(x + 5, y + 4, 1, 2, '#ffffff');
      r(x + 8, y + 5, 1, 2, '#ffffff');
      break;
    case 'planta':
      planta(g, x + 1, y + 1);
      break;
    default:
      break;
  }
}

// ====================================================================== burbujas

/** Globo de diálogo sobre un personaje. tipo: '?' (esperando), '!' (recibió algo) o 'ok'. */
export function dibujarBurbuja(g, cx, base, tipo, t) {
  const y = base - 11 + Math.round(Math.sin(t * 4));
  const x = cx - 5;
  const fondo = tipo === 'ok' ? '#3fae5a' : tipo === '!' ? '#ffd479' : '#fdfdf8';
  g.fillStyle = '#1a1420';
  g.fillRect(x, y - 1, 11, 11);
  g.fillRect(x - 1, y, 13, 9);
  g.fillStyle = fondo;
  g.fillRect(x, y, 11, 9);
  g.fillRect(cx - 1, y + 9, 3, 1);
  g.fillStyle = '#1a1420';
  g.fillRect(cx - 1, y + 10, 3, 1);
  g.fillRect(cx, y + 11, 1, 1);
  if (tipo === 'ok') marcaCheck(g, cx - 2, y + 3, '#ffffff');
  else dibujarTexto(g, tipo, tipo === '!' ? cx : cx - 1, y + 2, '#1a1420');
}

// ====================================================================== caminata

/** Malla de celdas libres/ocupadas y búsqueda de rutas con pocas vueltas. */
export class Malla {
  constructor(agentes) {
    this.cols = ANCHO / CELDA;
    this.filas = ALTO / CELDA;
    this.bloq = new Uint8Array(this.cols * this.filas);
    const b = (x, y, w, h) => this.bloquear(x, y, w, h);
    b(0, 0, ANCHO, 36); // pared superior
    b(0, 0, 4, ALTO); // bordes
    b(ANCHO - 4, 0, 4, ALTO);
    b(0, ALTO - 3, ANCHO, 3);
    b(SALA.x, 32, 6, SALA.puertaY1 - 32); // pared de la sala (con hueco de puerta)
    b(SALA.x, SALA.puertaY2, 6, 140 - SALA.puertaY2);
    b(SALA.x, 140, ANCHO - SALA.x, 12);
    b(MESA.x, MESA.y, MESA.ancho, MESA.alto);
    for (const m of MUEBLES) b(m.x, m.y, m.ancho, m.alto);
    for (const a of agentes) b(a.asiento.x - a.medioAncho, a.asiento.y + 5, a.medioAncho * 2, 13);
  }

  bloquear(x, y, w, h) {
    // Se infla el rectángulo para que el cuerpo (no solo los pies) no lo atraviese
    const x1 = Math.max(0, Math.floor((x - 5) / CELDA));
    const y1 = Math.max(0, Math.floor((y - 1) / CELDA));
    const x2 = Math.min(this.cols, Math.ceil((x + w + 5) / CELDA));
    const y2 = Math.min(this.filas, Math.ceil((y + h + 1) / CELDA));
    for (let cy = y1; cy < y2; cy++) for (let cx = x1; cx < x2; cx++) this.bloq[cy * this.cols + cx] = 1;
  }

  libre(x, y) {
    const cx = Math.floor(x / CELDA);
    const cy = Math.floor(y / CELDA);
    if (cx < 0 || cy < 0 || cx >= this.cols || cy >= this.filas) return false;
    return !this.bloq[cy * this.cols + cx];
  }

  /** Celda libre más cercana (búsqueda en anillos). */
  celdaLibre(x, y) {
    const cx0 = Math.floor(x / CELDA);
    const cy0 = Math.floor(y / CELDA);
    for (let radio = 0; radio < 12; radio++) {
      for (let dy = -radio; dy <= radio; dy++) {
        for (let dx = -radio; dx <= radio; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== radio) continue;
          const cx = cx0 + dx;
          const cy = cy0 + dy;
          if (cx < 0 || cy < 0 || cx >= this.cols || cy >= this.filas) continue;
          if (!this.bloq[cy * this.cols + cx]) return cy * this.cols + cx;
        }
      }
    }
    return cy0 * this.cols + cx0;
  }

  /**
   * Ruta de 'desde' a 'hasta' (en píxeles). Dijkstra sobre (celda, dirección)
   * con penalización por giro, para que el personaje camine en tramos rectos.
   */
  ruta(desde, hasta) {
    const n = this.cols * this.filas;
    const inicio = this.celdaLibre(desde.x, desde.y);
    const fin = this.celdaLibre(hasta.x, hasta.y);
    const costo = new Float32Array(n * 4).fill(Infinity);
    const previo = new Int32Array(n * 4).fill(-1);
    const cola = new Monticulo();
    for (let d = 0; d < 4; d++) {
      costo[inicio * 4 + d] = 0;
      cola.meter(0, inicio * 4 + d);
    }
    const DX = [1, -1, 0, 0];
    const DY = [0, 0, 1, -1];
    let llegada = -1;
    while (cola.tamano) {
      const [c, estado] = cola.sacar();
      if (c > costo[estado]) continue;
      const celda = estado >> 2;
      const dir = estado & 3;
      if (celda === fin) {
        llegada = estado;
        break;
      }
      const cx = celda % this.cols;
      const cy = (celda / this.cols) | 0;
      for (let d = 0; d < 4; d++) {
        const nx = cx + DX[d];
        const ny = cy + DY[d];
        if (nx < 0 || ny < 0 || nx >= this.cols || ny >= this.filas) continue;
        const vecina = ny * this.cols + nx;
        if (this.bloq[vecina] && vecina !== fin) continue;
        const nc = c + 1 + (d === dir ? 0 : 4);
        const ne = vecina * 4 + d;
        if (nc < costo[ne]) {
          costo[ne] = nc;
          previo[ne] = estado;
          cola.meter(nc, ne);
        }
      }
    }
    if (llegada < 0) return [{ x: hasta.x, y: hasta.y }];

    // Reconstruir y quedarse solo con las esquinas
    const celdas = [];
    for (let e = llegada; e >= 0; e = previo[e]) celdas.push(e >> 2);
    celdas.reverse();
    const centro = (celda) => ({
      x: (celda % this.cols) * CELDA + CELDA / 2,
      y: ((celda / this.cols) | 0) * CELDA + CELDA / 2,
    });
    const puntos = [];
    for (let i = 1; i < celdas.length - 1; i++) {
      const a = centro(celdas[i - 1]);
      const b = centro(celdas[i]);
      const c = centro(celdas[i + 1]);
      if (Math.sign(b.x - a.x) !== Math.sign(c.x - b.x) || Math.sign(b.y - a.y) !== Math.sign(c.y - b.y)) puntos.push(b);
    }
    puntos.push({ x: hasta.x, y: hasta.y });
    return puntos;
  }
}

/** Montículo binario mínimo para la búsqueda de rutas. */
class Monticulo {
  constructor() {
    this.datos = [];
  }
  get tamano() {
    return this.datos.length;
  }
  meter(prioridad, valor) {
    const d = this.datos;
    d.push([prioridad, valor]);
    let i = d.length - 1;
    while (i > 0) {
      const padre = (i - 1) >> 1;
      if (d[padre][0] <= d[i][0]) break;
      [d[padre], d[i]] = [d[i], d[padre]];
      i = padre;
    }
  }
  sacar() {
    const d = this.datos;
    const tope = d[0];
    const ultimo = d.pop();
    if (d.length) {
      d[0] = ultimo;
      let i = 0;
      for (;;) {
        const izq = i * 2 + 1;
        const der = izq + 1;
        let menor = i;
        if (izq < d.length && d[izq][0] < d[menor][0]) menor = izq;
        if (der < d.length && d[der][0] < d[menor][0]) menor = der;
        if (menor === i) break;
        [d[menor], d[i]] = [d[i], d[menor]];
        i = menor;
      }
    }
    return tope;
  }
}

/** Punto junto al escritorio de 'ag' donde otro agente deja un documento. */
export function puntoEntrega(malla, ag) {
  const { x, y } = ag.asiento;
  const m = ag.medioAncho;
  const opciones = [
    { x: x + m + 10, y: y + 8, dir: 'izquierda' },
    { x: x - m - 10, y: y + 8, dir: 'lado' },
    { x, y: y + 26, dir: 'arriba' },
  ];
  return opciones.find((p) => malla.libre(p.x, p.y)) || opciones[0];
}
