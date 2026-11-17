// Panel lateral: tarjetas por agente (estado y contadores) y registro de actividad reciente.
// Todo el texto se inserta con textContent (nunca innerHTML) para evitar inyección.

const MAX_ACTIVIDAD = 80;

export class Panel {
  constructor(oficina) {
    this.oficina = oficina;
    this.listaAgentes = document.getElementById('lista-agentes');
    this.listaActividad = document.getElementById('lista-actividad');
    this.vacio = document.getElementById('actividad-vacia');
    this.filas = new Map();
    this.construir();
    setInterval(() => this.refrescar(), 300);
  }

  construir() {
    for (const a of this.oficina.agentes) {
      const li = document.createElement('li');
      li.className = 'agente';
      li.style.setProperty('--color-agente', a.color);

      const chip = el('span', 'chip');
      const datos = el('div', 'datos');
      datos.append(el('strong', 'nombre', a.nombre), el('span', 'rol', a.rol));
      const estado = el('span', 'estado');
      const cuentas = el('div', 'cuentas');
      const tareas = el('span', 'cuenta');
      const acciones = el('span', 'cuenta');
      tareas.title = 'Tareas terminadas';
      acciones.title = 'Herramientas usadas';
      cuentas.append(tareas, acciones);

      li.append(chip, datos, estado, cuentas);
      this.listaAgentes.append(li);
      this.filas.set(a.id, { li, estado, tareas, acciones });
    }
    this.refrescar();
  }

  refrescar() {
    for (const a of this.oficina.agentes) {
      const f = this.filas.get(a.id);
      const clave = a.claveEstado();
      if (f.li.dataset.estado !== clave) f.li.dataset.estado = clave;
      const texto = a.textoEstado();
      if (f.estado.textContent !== texto) f.estado.textContent = texto;
      const t = `✓ ${a.tareas}`;
      const h = `⚒ ${a.acciones}`;
      if (f.tareas.textContent !== t) f.tareas.textContent = t;
      if (f.acciones.textContent !== h) f.acciones.textContent = h;
    }
  }

  agregarActividad(texto, agente, ts = Date.now(), esDemo = false) {
    if (this.vacio) this.vacio.hidden = true;
    const li = el('li', 'item');
    if (agente) li.style.setProperty('--color-agente', agente.color);
    else li.classList.add('sin-agente');
    const hora = el('time', 'hora', new Date(ts).toLocaleTimeString('es-EC', { hour12: false }));
    const cuerpo = el('span', 'texto', texto);
    li.append(hora, cuerpo);
    if (esDemo) li.append(el('span', 'etiqueta-demo', 'demo'));
    this.listaActividad.prepend(li);
    while (this.listaActividad.children.length > MAX_ACTIVIDAD) this.listaActividad.lastElementChild.remove();
  }

  agregarSeparador(texto) {
    if (this.vacio) this.vacio.hidden = true;
    this.listaActividad.prepend(el('li', 'separador', texto));
  }
}

function el(etiqueta, clase, texto) {
  const e = document.createElement(etiqueta);
  if (clase) e.className = clase;
  if (texto !== undefined) e.textContent = texto;
  return e;
}
