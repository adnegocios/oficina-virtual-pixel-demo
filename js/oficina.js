// La oficina completa: traduce eventos de Claude Code en animaciones y dibuja cada cuadro.

import { ANCHO, ALTO, ASIENTOS_REUNION, Malla, dibujarFondo, dibujarDecoracion } from './escena.js';
import { Agente } from './agentes.js';
import { fraseTermino } from './genero.js';

const ESCRIBIR = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit', 'Bash', 'PowerShell']);
const LEER = new Set(['Read', 'Grep', 'Glob', 'LS', 'NotebookRead']);
const WEB = new Set(['WebFetch', 'WebSearch']);
export const ENTREGA = new Set(['Agent', 'Task', 'SendMessage']);
const ESPERA = new Set(['permission_prompt', 'idle_prompt', 'elicitation_dialog']);

const VERBOS = {
  Edit: 'editando',
  MultiEdit: 'editando',
  NotebookEdit: 'editando',
  Write: 'escribiendo',
  Bash: 'ejecutando',
  PowerShell: 'ejecutando',
  Read: 'leyendo',
  NotebookRead: 'leyendo',
  Grep: 'buscando en',
  Glob: 'listando',
  LS: 'listando',
  WebFetch: 'consultando',
  WebSearch: 'buscando en la web',
};

/** Qué animación corresponde a cada herramienta. */
export function categoriaHerramienta(herramienta) {
  if (!herramienta) return 'escribiendo';
  if (ESCRIBIR.has(herramienta)) return 'escribiendo';
  if (LEER.has(herramienta)) return 'leyendo';
  if (WEB.has(herramienta) || /^mcp__.*(browser|chrome|playwright|puppeteer|navegador)/i.test(herramienta)) return 'web';
  return 'escribiendo';
}

export class Oficina {
  constructor(lienzo, config) {
    this.lienzo = lienzo;
    this.g = lienzo.getContext('2d');
    this.config = config;
    this.escala = 1;
    this.tiempo = performance.now() / 1000;

    // La malla necesita conocer los escritorios: se crea con datos mínimos de cada agente
    const puestos = config.agentes.map((a) => ({
      asiento: { x: a.escritorio.x * 16 + 8, y: a.escritorio.y * 16 + 8 },
      medioAncho: a.escritorio.tipo === 'gerente' ? 32 : 20,
    }));
    this.malla = new Malla(puestos);
    this.agentes = config.agentes.map((a) => new Agente(a, this.malla));
    this.porId = new Map(this.agentes.map((a) => [a.id, a]));
    this.indice = new Map();
    for (const a of config.agentes) {
      for (const n of [a.id, ...(a.alias || [])]) this.indice.set(n.toLowerCase(), a.id);
    }
    this.fondo = dibujarFondo(config);
  }

  // ------------------------------------------------------------ identificación

  /** id configurado a partir de un nombre (id, alias o "plugin:nombre"). */
  resolver(nombre) {
    if (!nombre) return null;
    const n = String(nombre).toLowerCase();
    if (this.indice.has(n)) return this.indice.get(n);
    const pos = n.lastIndexOf(':');
    if (pos >= 0 && this.indice.has(n.slice(pos + 1))) return this.indice.get(n.slice(pos + 1));
    return null;
  }

  /**
   * Agente dueño de un evento. Sin agent_type el evento viene de la sesión
   * principal, que se representa con "agentePrincipal" (si está configurado).
   */
  agenteDe(ev) {
    const id = ev.agente ? this.resolver(ev.agente) : this.config.agentePrincipal;
    return id ? this.porId.get(id) || null : null;
  }

  destinoDe(ev) {
    const id = this.resolver(ev.destino || ev.etiqueta);
    return id ? this.porId.get(id) || null : null;
  }

  // ------------------------------------------------------------ eventos

  /** Texto corto para el panel de actividad (o null si no vale la pena mostrarlo). */
  describir(ev) {
    const ag = this.agenteDe(ev);
    const quien = ag ? ag.nombre : ev.agente || 'Sesión principal';
    const et = ev.etiqueta ? ` ${ev.etiqueta}` : '';
    switch (ev.evento) {
      case 'PreToolUse':
        if (ENTREGA.has(ev.herramienta)) {
          const d = this.destinoDe(ev);
          const verbo = ev.herramienta === 'SendMessage' ? 'entrega trabajo a' : 'delega tarea a';
          return `${quien}: ${verbo} ${d ? d.nombre : ev.etiqueta || 'otro agente'}`;
        }
        return `${quien}: ${VERBOS[ev.herramienta] || `usando ${ev.herramienta || 'herramienta'}`}${et}`;
      case 'PostToolUseFailure':
        return `${quien}: falló ${ev.herramienta || 'una herramienta'}`;
      case 'SubagentStart':
        return `${quien}: empezó una tarea`;
      case 'SubagentStop':
        return `${quien}: ${fraseTermino(ag?.genero)}`;
      case 'Notification':
        if (ev.etiqueta === 'permission_prompt') return `${quien}: espera tu permiso`;
        if (ev.etiqueta === 'idle_prompt') return `${quien}: espera tu respuesta`;
        if (ev.etiqueta === 'elicitation_dialog') return `${quien}: necesita un dato tuyo`;
        return `${quien}: aviso (${ev.etiqueta || 'general'})`;
      case 'PermissionRequest':
        return `${quien}: pide permiso para ${ev.herramienta || 'una acción'}`;
      case 'UserPromptSubmit':
        return ag ? `Usuario: nueva instrucción para ${ag.nombre}` : 'Usuario: nueva instrucción';
      case 'Stop':
        return `${quien}: ${fraseTermino(ag?.genero, 'de responder')}`;
      case 'SessionStart':
        return 'Sesión de Claude Code iniciada';
      case 'SessionEnd':
        return 'Sesión de Claude Code cerrada';
      default:
        return null;
    }
  }

  /** Aplica el efecto visual de un evento. contar=false para no sumar contadores. */
  aplicar(ev, { contar = true } = {}) {
    const ahora = this.tiempo;
    const ag = this.agenteDe(ev);
    if (!ag) return;
    switch (ev.evento) {
      case 'PreToolUse':
        if (contar) ag.acciones += 1;
        ag.activo = true;
        if (ENTREGA.has(ev.herramienta)) {
          const d = this.destinoDe(ev);
          if (d && d !== ag) ag.entregarA(d);
          ag.ponerEstado('escribiendo', ahora, 2);
        } else {
          ag.ponerEstado(categoriaHerramienta(ev.herramienta), ahora);
        }
        break;
      case 'PostToolUse':
      case 'PostToolUseFailure':
        ag.acortarEstado(ahora);
        break;
      case 'SubagentStart':
        ag.activo = true;
        ag.ponerEstado('leyendo', ahora, 2.5);
        break;
      case 'SubagentStop':
      case 'Stop':
        if (contar) ag.tareas += 1;
        ag.terminar(ahora);
        break;
      case 'Notification':
        if (ESPERA.has(ev.etiqueta)) ag.ponerEstado('esperando', ahora, 300);
        break;
      case 'PermissionRequest':
        ag.ponerEstado('esperando', ahora, 300);
        break;
      case 'UserPromptSubmit':
        ag.activo = true;
        ag.ponerEstado('leyendo', ahora, 3);
        break;
      default:
        break;
    }
  }

  /** Contadores que manda el servidor al conectarse. */
  aplicarContadores(contadores) {
    for (const [id, c] of Object.entries(contadores || {})) {
      const ag = this.porId.get(id);
      if (ag) {
        ag.tareas = c.tareas;
        ag.acciones = c.acciones;
      }
    }
  }

  // ------------------------------------------------------------ escenas especiales (demo)

  reunion() {
    this.agentes.forEach((a, i) => a.irA(ASIENTOS_REUNION[i % ASIENTOS_REUNION.length]));
  }

  finReunion() {
    for (const a of this.agentes) if (a.enReunion) a.volverAlPuesto();
  }

  reiniciar() {
    for (const a of this.agentes) a.reiniciar();
  }

  // ------------------------------------------------------------ dibujo

  /**
   * Ajusta el tamaño al espacio disponible.
   * Se dibuja a una escala entera (píxeles exactos) y el navegador la lleva al tamaño
   * final con image-rendering: pixelated. Si el tamaño ideal está cerca de un entero
   * se usa el entero, que es lo más nítido.
   */
  ajustarEscala(anchoDisponible, altoDisponible) {
    let ajuste = Math.min(anchoDisponible / ANCHO, altoDisponible / ALTO);
    if (ajuste >= 1 && ajuste - Math.floor(ajuste) < 0.2) ajuste = Math.floor(ajuste);
    ajuste = Math.max(0.5, ajuste);
    const s = Math.min(6, Math.max(1, Math.ceil(ajuste)));
    this.escala = s;
    this.lienzo.width = ANCHO * s;
    this.lienzo.height = ALTO * s;
    this.lienzo.style.width = `${Math.round(ANCHO * ajuste)}px`;
    this.lienzo.style.height = `${Math.round(ALTO * ajuste)}px`;
  }

  iniciar() {
    const cuadro = (ms) => {
      const t = ms / 1000;
      const dt = Math.min(0.05, Math.max(0, t - this.tiempo));
      this.tiempo = t;
      this.actualizar(dt, t);
      this.dibujar(t);
      requestAnimationFrame(cuadro);
    };
    requestAnimationFrame(cuadro);
  }

  actualizar(dt, t) {
    for (const a of this.agentes) a.actualizar(dt, t);
  }

  dibujar(t) {
    const g = this.g;
    g.setTransform(this.escala, 0, 0, this.escala, 0, 0);
    g.imageSmoothingEnabled = false;
    g.drawImage(this.fondo, 0, 0);
    dibujarDecoracion(g, this.agentes);

    // Ordenar por profundidad (y de la base) para que lo de abajo tape lo de arriba
    const capas = [];
    for (const a of this.agentes) {
      capas.push({ y: a.asiento.y + 18, dibujar: () => a.dibujarPuesto(g, t) });
      if (!a.sentado) capas.push({ y: a.y, dibujar: () => a.dibujarDePie(g, t) });
    }
    capas.sort((p, q) => p.y - q.y);
    for (const c of capas) c.dibujar();
    for (const a of this.agentes) a.dibujarEtiqueta(g, t);
  }
}
