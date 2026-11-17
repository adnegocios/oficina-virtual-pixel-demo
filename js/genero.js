// Concordancia de género en los textos que la oficina genera sobre cada agente.
// El género viene del campo "genero" de agents.config.json: masculino, femenino o neutro.
// Con "neutro" (o sin el campo) se usan frases sin marca de género.

/** Elige la variante del texto según el género del agente. */
export function segunGenero(genero, variantes) {
  if (genero === 'masculino') return variantes.masculino;
  if (genero === 'femenino') return variantes.femenino;
  return variantes.neutro;
}

/** Estado del panel cuando el agente terminó: "Listo" / "Lista" / "Terminó". */
export function textoListo(genero) {
  return segunGenero(genero, { masculino: 'Listo', femenino: 'Lista', neutro: 'Terminó' });
}

/** Frase del registro de actividad al terminar una tarea. */
export function fraseTermino(genero, que = 'su tarea') {
  return segunGenero(genero, {
    masculino: `terminó ${que}, está listo ✓`,
    femenino: `terminó ${que}, está lista ✓`,
    neutro: `terminó ${que} ✓`,
  });
}
