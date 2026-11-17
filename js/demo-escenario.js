// Guion del modo demo: un cierre mensual completo con eventos falsos.
// Los eventos tienen el mismo formato que envía el hook (evento, agente, herramienta, etiqueta).
// agente: null = sesión principal (se dibuja como "agentePrincipal", por defecto Jack G).
// Se usa en el navegador (demo.js) y en Node (scripts/demo-servidor.js).

const J = null; // sesión principal → Jack G (Gerente Financiero)
const TONY = 'tony-a-descarga-archivo';
const JULY = 'july-r-reportes';
const SANDY = 'sandy-c-contador';
const BETO = 'beto-i-impuestos';
const MARTHA = 'martha-t-tesoreria';
const JACK = 'jack-g-gerente-financiero';

const pre = (t, agente, herramienta, etiqueta) => ({ t, evento: 'PreToolUse', agente, herramienta, etiqueta });
const ev = (t, evento, agente, etiqueta = '') => ({ t, evento, agente, herramienta: null, etiqueta });

export const ESCENARIO = [
  ev(0, 'UserPromptSubmit', J),
  { t: 0.5, accion: 'reunion' },
  { t: 12, accion: 'fin-reunion' },

  // Jack reparte el trabajo y Tony descarga del SRI
  pre(19, J, 'Agent', TONY),
  ev(21, 'SubagentStart', TONY),
  pre(22, TONY, 'WebFetch', 'srienlinea.sri.gob.ec'),
  pre(25, J, 'Agent', MARTHA),
  pre(25.5, TONY, 'Bash', 'node'),
  ev(27, 'SubagentStart', MARTHA),
  pre(28, TONY, 'Write', 'recibidos_octubre.zip'),
  pre(28.5, MARTHA, 'Read', 'extracto_bancario.csv'),
  pre(31, TONY, 'Write', 'emitidos_octubre.zip'),
  ev(31.5, 'Notification', MARTHA, 'permission_prompt'),
  pre(34, TONY, 'Edit', 'indice_archivo.xlsx'),
  pre(36, TONY, 'SendMessage', JULY),
  pre(37, J, 'Agent', SANDY),
  pre(38, MARTHA, 'Edit', 'conciliacion_octubre.xlsx'),
  ev(39, 'SubagentStop', TONY),

  // July verifica el archivo; Sandy registra; Martha concilia
  ev(40, 'SubagentStart', JULY),
  pre(41, JULY, 'Read', 'recibidos_octubre.zip'),
  pre(41.5, MARTHA, 'Bash', 'python'),
  ev(42, 'SubagentStart', SANDY),
  pre(43, SANDY, 'Read', 'indice_archivo.xlsx'),
  pre(44, JULY, 'Grep', 'comprobantes'),
  pre(45, MARTHA, 'Write', 'conciliacion_octubre.xlsx'),
  pre(46, SANDY, 'Edit', 'libro_diario.xlsx'),
  pre(47, JULY, 'Write', 'control_documentos.xlsx'),
  ev(48, 'SubagentStop', MARTHA),
  pre(49, MARTHA, 'SendMessage', SANDY),
  pre(49.5, SANDY, 'Bash', 'python'),
  pre(51, JULY, 'SendMessage', SANDY),
  pre(53, SANDY, 'Write', 'balance_general_octubre.xlsx'),
  pre(54, JULY, 'Write', 'dashboard_gerencia.html'),
  pre(56, SANDY, 'Write', 'estado_resultados_octubre.xlsx'),
  pre(57, JULY, 'Edit', 'dashboard_gerencia.html'),
  ev(59, 'SubagentStop', SANDY),

  // Beto prepara declaraciones
  pre(60, SANDY, 'SendMessage', BETO),
  pre(60.5, J, 'Agent', BETO),
  ev(61, 'SubagentStop', JULY),
  pre(62, JULY, 'SendMessage', JACK),
  ev(63, 'SubagentStart', BETO),
  pre(64, BETO, 'Read', 'balance_general_octubre.xlsx'),
  pre(66, BETO, 'WebSearch', 'búsqueda web'),
  pre(68, BETO, 'WebFetch', 'www.sri.gob.ec'),
  { t: 70, evento: 'PermissionRequest', agente: BETO, herramienta: 'Write', etiqueta: 'formulario_104_iva.xlsx' },
  pre(74, BETO, 'Write', 'formulario_104_iva.xlsx'),
  pre(76, BETO, 'Write', 'formulario_103_retenciones.xlsx'),
  ev(78, 'SubagentStop', BETO),
  pre(79, BETO, 'SendMessage', JACK),

  // Jack revisa todo y cierra
  pre(82, J, 'Read', 'dashboard_gerencia.html'),
  pre(84, J, 'Read', 'balance_general_octubre.xlsx'),
  pre(86, J, 'Grep', 'declaraciones'),
  pre(88, J, 'Edit', 'resumen_cierre_octubre.md'),
  ev(91, 'Stop', J),
  { t: 93, accion: 'reunion' },
  ev(96, 'Notification', J, 'idle_prompt'),
  { t: 106, accion: 'fin-reunion' },
];

/** Duración total de un ciclo de demo (segundos). */
export const DURACION = 114;
