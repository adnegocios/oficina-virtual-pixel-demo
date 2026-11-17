// Modo demo: reproduce el guion de cierre mensual en bucle, sin servidor de eventos ni Claude Code.

import { ESCENARIO, DURACION } from './demo-escenario.js';

export class Demo {
  /**
   * @param {Oficina} oficina
   * @param {(ev) => void} emitir     recibe cada evento falso (igual que uno real)
   * @param {() => void} alEmpezar    se llama al inicio de cada ciclo
   */
  constructor(oficina, emitir, alEmpezar = () => {}) {
    this.oficina = oficina;
    this.emitir = emitir;
    this.alEmpezar = alEmpezar;
    this.temporizadores = [];
    this.activo = false;
  }

  iniciar() {
    if (this.activo) return;
    this.activo = true;
    this.ciclo();
  }

  detener() {
    this.activo = false;
    for (const t of this.temporizadores) clearTimeout(t);
    this.temporizadores = [];
    this.oficina.finReunion();
  }

  programar(ms, fn) {
    this.temporizadores.push(setTimeout(fn, ms));
  }

  ciclo() {
    this.temporizadores = [];
    this.oficina.reiniciar();
    this.alEmpezar();
    for (const paso of ESCENARIO) this.programar(paso.t * 1000, () => this.ejecutar(paso));
    this.programar(DURACION * 1000, () => {
      if (this.activo) this.ciclo();
    });
  }

  ejecutar(paso) {
    if (paso.accion === 'reunion') return this.oficina.reunion();
    if (paso.accion === 'fin-reunion') return this.oficina.finReunion();
    const ev = {
      evento: paso.evento,
      agente: paso.agente,
      herramienta: paso.herramienta,
      etiqueta: paso.etiqueta,
      ts: Date.now(),
      demo: true,
    };
    this.emitir(ev);
    // Simula el PostToolUse correspondiente
    if (ev.evento === 'PreToolUse') {
      this.programar(1500, () => this.emitir({ ...ev, evento: 'PostToolUse', ts: Date.now() }));
    }
  }
}
