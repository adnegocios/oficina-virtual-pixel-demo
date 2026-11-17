// Punto de entrada de la página: carga la configuración, arranca la oficina,
// se conecta al flujo de eventos (SSE) y maneja el modo demo.
//
// Parámetros de URL:
//   ?demo=1     arranca el modo demo automáticamente
//   ?envivo=0   no se conecta al servidor de eventos (solo demo)
//   ?token=…    token de acceso cuando el servidor está en la red local

import { Oficina } from './oficina.js';
import { Panel } from './panel.js';
import { Demo } from './demo.js';

const params = new URLSearchParams(location.search);
const token = params.get('token') || '';
const sufijoToken = token ? `?token=${encodeURIComponent(token)}` : '';

const lienzo = document.getElementById('lienzo');
const contenedor = document.getElementById('escena');
const conexion = document.getElementById('conexion');
const botonDemo = document.getElementById('boton-demo');

function ponerConexion(clase, texto) {
  conexion.className = `conexion ${clase}`;
  conexion.textContent = texto;
}

// Valores por defecto para la versión estática (sin servidor que valide la configuración)
const APARIENCIA_DEFECTO = {
  ropa: '#4a6fa5', pantalon: '#2f3545', piel: '#e0ac69', pelo: '#3b2a1f',
  peinado: 'corto', accesorio: 'ninguno', acento: '#e74c3c', objeto: 'ninguno',
};

function normalizarConfig(c) {
  return {
    oficina: { nombre: String(c.oficina?.nombre || 'OFICINA').slice(0, 16) },
    agentePrincipal: c.agentePrincipal ?? null,
    agentes: (c.agentes || []).map((a) => ({
      id: a.id,
      nombre: String(a.nombre || a.id).slice(0, 16),
      rol: String(a.rol || ''),
      alias: Array.isArray(a.alias) ? a.alias : [],
      escritorio: { x: a.escritorio.x, y: a.escritorio.y, tipo: a.escritorio.tipo === 'gerente' ? 'gerente' : 'normal' },
      apariencia: { ...APARIENCIA_DEFECTO, ...(a.apariencia || {}) },
    })),
  };
}

/**
 * Con servidor: GET api/config. Sin servidor (por ejemplo en GitHub Pages):
 * lee agents.config.json junto a la página y funciona solo en modo demo.
 */
async function cargarConfig() {
  try {
    const r = await fetch(`api/config${sufijoToken}`);
    if (r.status === 401) throw Object.assign(new Error('Falta el token de acceso (?token=…)'), { definitivo: true });
    if (r.ok && (r.headers.get('content-type') || '').includes('json')) return { config: await r.json(), estatico: false };
  } catch (e) {
    if (e.definitivo) throw e;
  }
  const r = await fetch('agents.config.json');
  if (!r.ok) throw new Error('No se encontró la configuración de agentes');
  return { config: normalizarConfig(await r.json()), estatico: true };
}

async function iniciar() {
  let config;
  let estatico;
  try {
    ({ config, estatico } = await cargarConfig());
  } catch (e) {
    ponerConexion('error', `✕ ${e.message}`);
    return;
  }
  document.getElementById('nombre-oficina').textContent = config.oficina.nombre;

  const oficina = new Oficina(lienzo, config);
  const ajustar = () => oficina.ajustarEscala(contenedor.clientWidth - 16, contenedor.clientHeight - 16);
  new ResizeObserver(ajustar).observe(contenedor);
  ajustar();
  oficina.iniciar();

  const panel = new Panel(oficina);

  // Un evento (real o de demo) → animación + línea en el panel
  const procesar = (ev) => {
    const texto = oficina.describir(ev);
    oficina.aplicar(ev);
    if (texto) panel.agregarActividad(texto, oficina.agenteDe(ev), ev.ts, ev.demo);
  };

  // ----- modo demo
  const demo = new Demo(oficina, procesar, () => panel.agregarSeparador('— Cierre mensual (demo) —'));
  const actualizarBoton = () => {
    botonDemo.textContent = demo.activo ? '■ Detener demo' : '▶ Modo demo';
    botonDemo.setAttribute('aria-pressed', String(demo.activo));
  };
  botonDemo.addEventListener('click', () => {
    if (demo.activo) demo.detener();
    else demo.iniciar();
    actualizarBoton();
  });
  if (params.get('demo') === '1' || estatico) demo.iniciar();
  actualizarBoton();

  // ----- eventos en vivo
  if (estatico) {
    ponerConexion('demo', '● Demo en línea (sin servidor)');
    return;
  }
  if (params.get('envivo') === '0') {
    ponerConexion('demo', '● Solo demo');
    return;
  }
  const fuente = new EventSource(`eventos${sufijoToken}`);
  fuente.addEventListener('open', () => ponerConexion('ok', '● En vivo'));
  fuente.addEventListener('error', () => ponerConexion('caido', '● Reconectando…'));
  fuente.addEventListener('estado', (e) => {
    const datos = JSON.parse(e.data);
    oficina.aplicarContadores(datos.contadores);
    // Historial reciente: solo texto, sin animaciones ni contar de nuevo
    for (const ev of datos.recientes || []) {
      const texto = oficina.describir(ev);
      if (texto) panel.agregarActividad(texto, oficina.agenteDe(ev), ev.ts);
    }
  });
  fuente.addEventListener('evento', (e) => procesar(JSON.parse(e.data)));
}

iniciar();
