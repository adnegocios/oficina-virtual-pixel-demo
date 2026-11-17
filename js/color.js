// Utilidades de color para derivar sombras y luces a partir de un color base (#rrggbb).

export function hexARgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbAHex(r, g, b) {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

/** Oscurece multiplicando cada canal por f (0..1). */
export function oscurecer(hex, f = 0.75) {
  const [r, g, b] = hexARgb(hex);
  return rgbAHex(r * f, g * f, b * f);
}

/** Aclara mezclando con blanco en proporción f (0..1). */
export function aclarar(hex, f = 0.3) {
  const [r, g, b] = hexARgb(hex);
  return rgbAHex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f);
}
