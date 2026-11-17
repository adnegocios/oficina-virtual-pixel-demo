// Un agente de la oficina: estado, animación, caminatas y dibujo.

import { spritePersona, SPR_OY } from './sprites.js';
import { dibujarEscritorio, dibujarBurbuja, marcaCheck, puntoEntrega } from './escena.js';
import { dibujarTexto, anchoTexto } from './fuente.js';

const VELOCIDAD = 46; // píxeles por segundo
const DURACION_ACTIVIDAD = 6; // segundos sin eventos antes de volver a "idle"
const DURACION_GESTO = 3; // segundos del gesto de "listo"

export const TEXTO_ESTADO = {
  idle: 'Disponible',
  escribiendo: 'Escribiendo',
  leyendo: 'Leyendo',
  web: 'Buscando en la web',
  esperando: 'Esperando al usuario',
  listo: 'Terminó',
};

export class Agente {
  constructor(cfg, malla) {
    this.cfg = cfg;
    this.id = cfg.id;
    this.nombre = cfg.nombre;
    this.rol = cfg.rol;
    this.color = cfg.apariencia.ropa;
    this.ap = { ...cfg.apariencia, id: cfg.id };
    this.malla = malla;
    this.esGerente = cfg.escritorio.tipo === 'gerente';
    this.medioAncho = this.esGerente ? 32 : 20;
    // Punto donde se sienta (centro de la silla, en píxeles lógicos)
    this.asiento = { x: cfg.escritorio.x * 16 + 8, y: cfg.escritorio.y * 16 + 8 };
    this.fase = Math.random() * 10; // desfase para que no respiren todos a la vez
    this.reiniciar();
  }

  /** Vuelve al estado inicial (sentado, sin tareas). */
  reiniciar() {
    this.x = this.asiento.x;
    this.y = this.asiento.y;
    this.sentado = true;
    this.dir = 'abajo';
    this.estado = 'idle';
    this.estadoHasta = Infinity;
    this.gestoHasta = 0;
    this.activo = false; // tiene una tarea en curso (monitor encendido)
    this.check = false; // terminó su última tarea
    this.enReunion = false;
    this.cola = [];
    this.ruta = null;
    this.dirFinal = null;
    this.alLlegar = null;
    this.lleva = false;
    this.pila = 0;
    this.avisoHasta = 0;
    this.esperaHasta = 0;
    this.distancia = 0;
    this.tareas = 0;
    this.acciones = 0;
  }

  // ------------------------------------------------------------ estados

  ponerEstado(estado, ahora, duracion = DURACION_ACTIVIDAD) {
    this.estado = estado;
    this.estadoHasta = ahora + duracion;
    this.check = false;
  }

  /** Acortar el estado actual (PostToolUse: la herramienta ya terminó). */
  acortarEstado(ahora, segundos = 2.5) {
    if (this.estado !== 'esperando') this.estadoHasta = Math.min(this.estadoHasta, ahora + segundos);
  }

  terminar(ahora) {
    this.estado = 'listo';
    this.gestoHasta = ahora + DURACION_GESTO;
    this.estadoHasta = ahora + DURACION_GESTO;
    this.check = true;
    this.activo = false;
  }

  textoEstado() {
    if (!this.sentado) {
      if (this.lleva) return 'Entregando documento';
      return this.enReunion ? 'En reunión' : 'Caminando';
    }
    return TEXTO_ESTADO[this.estado] || this.estado;
  }

  /** Clave corta del estado para estilos del panel. */
  claveEstado() {
    if (!this.sentado) return this.enReunion && !this.ruta ? 'reunion' : 'caminando';
    return this.estado;
  }

  // ------------------------------------------------------------ acciones (cola)

  /** Toma un documento, camina al escritorio de 'destino', lo deja y vuelve. */
  entregarA(destino) {
    if (!destino || destino === this) return;
    this.cola.push(
      { tipo: 'tomar' },
      { tipo: 'ir', punto: () => puntoEntrega(this.malla, destino) },
      { tipo: 'soltar', destino },
      { tipo: 'volver' }
    );
  }

  irA(punto) {
    this.enReunion = true;
    this.desfaseEtiqueta = punto.desfase || 0;
    this.cola.push({ tipo: 'ir', punto: () => punto });
  }

  volverAlPuesto() {
    this.cola.push({ tipo: 'volver' });
  }

  recibirDocumento(ahora) {
    this.pila = Math.min(this.pila + 1, 5);
    this.avisoHasta = ahora + 1.8;
  }

  // ------------------------------------------------------------ actualización

  actualizar(dt, ahora) {
    if (this.estado !== 'idle' && ahora > this.estadoHasta) this.estado = 'idle';
    if (this.ruta) {
      this.avanzar(dt);
      return;
    }
    if (ahora < this.esperaHasta) return;
    const accion = this.cola.shift();
    if (!accion) return;
    switch (accion.tipo) {
      case 'tomar':
        this.lleva = true;
        this.esperaHasta = ahora + 0.3;
        break;
      case 'ir': {
        const p = accion.punto();
        this.caminarHacia(p, p.dir);
        break;
      }
      case 'soltar':
        this.lleva = false;
        accion.destino.recibirDocumento(ahora);
        this.esperaHasta = ahora + 0.5;
        break;
      case 'volver':
        this.caminarHacia(this.asiento, 'abajo', () => {
          this.sentado = true;
          this.enReunion = false;
        });
        break;
      default:
        break;
    }
  }

  caminarHacia(punto, dirFinal, alLlegar = null) {
    this.sentado = false;
    this.ruta = this.malla.ruta({ x: this.x, y: this.y }, punto);
    this.dirFinal = dirFinal || null;
    this.alLlegar = alLlegar;
  }

  avanzar(dt) {
    let paso = VELOCIDAD * dt;
    while (paso > 0 && this.ruta && this.ruta.length) {
      const objetivo = this.ruta[0];
      const dx = objetivo.x - this.x;
      const dy = objetivo.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < 0.01) {
        this.ruta.shift();
        continue;
      }
      if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? 'lado' : 'izquierda';
      else this.dir = dy > 0 ? 'abajo' : 'arriba';
      const m = Math.min(paso, d);
      this.x += (dx / d) * m;
      this.y += (dy / d) * m;
      this.distancia += m;
      paso -= m;
      if (m >= d) {
        this.x = objetivo.x;
        this.y = objetivo.y;
        this.ruta.shift();
      }
    }
    if (this.ruta && this.ruta.length === 0) {
      this.ruta = null;
      if (this.dirFinal) this.dir = this.dirFinal;
      const f = this.alLlegar;
      this.alLlegar = null;
      if (f) f();
    }
  }

  // ------------------------------------------------------------ dibujo

  /** Pose del personaje sentado según su estado. */
  poseSentado(t) {
    const parpadea = (t + this.fase) % 4.2 < 0.13;
    const base = { modo: 'sentado', brazos: 'reposo', dir: 'abajo', cuadro: 0, ojos: parpadea ? 'cerrados' : 'abiertos', mirada: 'frente', doc: false };
    switch (this.estado) {
      case 'escribiendo':
        return { ...base, brazos: 'teclear', cuadro: Math.floor(t * 8) % 2 };
      case 'leyendo':
        return { ...base, brazos: 'leer', mirada: 'abajo', cuadro: Math.floor(t * 1.2) % 2 };
      case 'web':
        return { ...base, brazos: 'raton', mirada: 'lado', cuadro: Math.floor(t * 2.5) % 2 };
      case 'esperando':
        return { ...base, brazos: 'rascar', cuadro: Math.floor(t * 2) % 2 };
      case 'listo':
        return t < this.gestoHasta ? { ...base, brazos: 'levantar', cuadro: Math.floor(t * 4) % 2 } : base;
      default:
        return base;
    }
  }

  /** Escritorio + persona sentada (si lo está). */
  dibujarPuesto(g, t) {
    dibujarEscritorio(g, this, t);
    if (!this.sentado) return;
    const pose = this.poseSentado(t);
    // Respiración leve en reposo: el cuerpo baja 1 px de vez en cuando
    const respira = this.estado === 'idle' && Math.sin((t + this.fase) * 2.2) > 0.55 ? 1 : 0;
    const spr = spritePersona(this.ap, pose);
    const alto = SPR_OY + 14; // solo hasta la cintura: el escritorio tapa lo demás
    g.drawImage(spr, 0, 0, spr.width, alto, this.asiento.x - 8, this.asiento.y - 13 + respira, spr.width, alto);
  }

  /** Persona de pie (caminando o en la sala de reuniones). */
  dibujarDePie(g, t) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    g.fillStyle = 'rgba(0,0,0,0.22)';
    g.fillRect(x - 5, y - 1, 10, 2);
    const cuadro = this.ruta ? Math.floor(this.distancia / 5) % 4 : 0;
    const parpadea = (t + this.fase) % 4.2 < 0.13;
    const dir = this.dir === 'izquierda' ? 'lado' : this.dir;
    const spr = spritePersona(this.ap, {
      modo: 'pie',
      brazos: '-',
      dir,
      cuadro,
      ojos: parpadea ? 'cerrados' : 'abiertos',
      mirada: 'frente',
      doc: this.lleva,
    });
    const arriba = y - (SPR_OY + 18);
    if (this.dir === 'izquierda') {
      g.save();
      g.scale(-1, 1);
      g.drawImage(spr, -(x + 8), arriba);
      g.restore();
    } else {
      g.drawImage(spr, x - 8, arriba);
    }
  }

  /** Nombre encima de la cabeza, más globos de "?", "!" o check. */
  dibujarEtiqueta(g, t) {
    const cx = this.sentado ? this.asiento.x : Math.round(this.x);
    const quieto = !this.sentado && !this.ruta && this.enReunion;
    const y = this.sentado ? this.asiento.y - 20 : Math.round(this.y) - 29 + (quieto ? this.desfaseEtiqueta || 0 : 0);
    const texto = this.nombre;
    const w = anchoTexto(texto);
    const x0 = cx - Math.round(w / 2) - 2;
    g.fillStyle = 'rgba(18,16,28,0.8)';
    g.fillRect(x0 - 2, y - 1, w + 6, 7);
    g.fillStyle = this.color;
    g.fillRect(x0 - 2, y - 1, 2, 7);
    dibujarTexto(g, texto, x0 + 2, y, '#ffffff');
    if (this.check && this.sentado && this.estado !== 'listo') {
      g.fillStyle = '#3fae5a';
      g.fillRect(x0 + w + 5, y - 1, 7, 7);
      marcaCheck(g, x0 + w + 6, y + 1, '#ffffff');
    }
    if (this.estado === 'esperando') dibujarBurbuja(g, cx, y - 2, '?', t);
    else if (t < this.avisoHasta) dibujarBurbuja(g, cx, y - 2, '!', t);
    else if (this.estado === 'listo' && t < this.gestoHasta) dibujarBurbuja(g, cx, y - 2, 'ok', t);
  }
}
