const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const evcInput = $('#evcInput');
const libraryList = $('#libraryList');
const canvas = $('#canvas');
const wiresSvg = $('#wires');
const viewport = $('#viewport');
const workspace = $('#workspace');
const statusEl = $('#status');
const inspectorContent = $('#inspectorContent');
const inspector = $('#inspector');
const selectModeBtn = $('#selectMode');
const panModeBtn = $('#panMode');
const wireModeBtn = $('#wireMode');
const editWireModeBtn = $('#editWireMode');
const deleteWireModeBtn = $('#deleteWireMode');
const addNodeBtn = $('#addNodeBtn');
const delNodeBtn = $('#delNodeBtn');
const deleteBtn = $('#deleteBtn');
const clearWiresBtn = $('#clearWires');
const thicknessInputs = $$('input[name="wireThickness"]');
const wireGaugeSelect = $('#wireGaugeSelect');
const wireColorPicker = $('#wireColorPicker');
const wireColorSelect = $('#wireColorSelect');
const wireTerminalSelect = $('#wireTerminalSelect');
const terminalColorSelect = $('#terminalColorSelect');
const applyWireStyleBtn = $('#applyWireStyleBtn');
const snapToggleBtn = $('#snapToggleBtn');
const wireFreeBtn = $('#wireFreeBtn');
const wireOrthoBtn = $('#wireOrthoBtn');
const saveProjectBtn = $('#saveProjectBtn');
const openProjectBtn = $('#openProjectBtn');
const projectInput = $('#projectInput');
const zoomInBtn = $('#zoomInBtn');
const zoomOutBtn = $('#zoomOutBtn');
const zoomResetBtn = $('#zoomResetBtn');
const libraryBtn = $('#libraryBtn');
const libraryDrawer = $('#libraryDrawer');
const closeLibraryBtn = $('#closeLibraryBtn');
const drawerBackdrop = $('#drawerBackdrop');
const libraryCount = $('#libraryCount');
const pxPerMmInput = $('#pxPerMmInput');
const applyScaleBtn = $('#applyScaleBtn');
const unitToggleBtn = $('#unitToggleBtn');
const boardBackground = $('#boardBackground');
const boardWidthMmInput = $('#boardWidthMmInput');
const boardHeightMmInput = $('#boardHeightMmInput');
const applyBoardBtn = $('#applyBoardBtn');
const fitBoardBtn = $('#fitBoardBtn');
const exportPdfBtn = $('#exportPdfBtn');
const exportSvgBtn = $('#exportSvgBtn');
const exportBomBtn = $('#exportBomBtn');
const autoLabelWiresBtn = $('#autoLabelWiresBtn');
const toggleWireLabelsBtn = $('#toggleWireLabelsBtn');
const autoEndpointLabelsBtn = $('#autoEndpointLabelsBtn');
const autoDeviceRefsBtn = $('#autoDeviceRefsBtn');

const LIBRARY_DB_NAME = 'eduvolt_component_library';
const LIBRARY_DB_VERSION = 1;
const LIBRARY_STORE = 'components';
const SCALE_SETTINGS_KEY = 'eduvolt_scale_settings';
const BOARD_SETTINGS_KEY = 'eduvolt_board_settings';

const COMPONENT_SIZE = {
  target: 90,
  min: 60,
  max: 100,
  canvasMin: 20,
  canvasMax: 1000
};

// Tamaños recomendados por tipo de componente.
// La imagen original solo sirve para detectar su proporción; el tamaño visual inicial
// lo controla la app para que una imagen nueva no aparezca gigante ni diminuta.
const SIZE_PRESETS = {
  generic: { mode: 'fit', target: 90, min: 55, max: 100 },
  contactor: { mode: 'fit', target: 88, min: 60, max: 100 },
  relay: { mode: 'fit', target: 78, min: 55, max: 90 },
  thermal: { mode: 'fit', target: 88, min: 60, max: 100 },
  guardamotor: { mode: 'fit', target: 88, min: 60, max: 100 },
  motor: { mode: 'fit', target: 95, min: 70, max: 110 },
  pilot: { mode: 'fit', target: 70, min: 55, max: 85 },
  pushbutton: { mode: 'fit', target: 72, min: 55, max: 88 },
  breaker: { mode: 'fit', target: 86, min: 60, max: 98 },
  supply: { mode: 'fit', target: 96, min: 70, max: 110 },
  socket: { mode: 'fit', target: 82, min: 60, max: 96 },

  // Elementos largos: se controla el lado mayor, pero siempre se mantiene la proporción real.
  rail: { mode: 'fit', target: 210, min: 130, max: 250 },
  duct: { mode: 'fit', target: 220, min: 140, max: 260 },
  bar: { mode: 'fit', target: 190, min: 120, max: 230 }
};

// Calibres reales para cables. El valor 'thickness' se mantiene por compatibilidad,
// pero el nuevo campo principal es 'gauge'. El grosor visual se calcula aqui.
const WIRE_GAUGES = {
  '0.5mm2': { label: '0.5 mm2', stroke: 2 },
  '1mm2': { label: '1 mm2', stroke: 3 },
  '1.5mm2': { label: '1.5 mm2', stroke: 4 },
  '2.5mm2': { label: '2.5 mm2', stroke: 5 },
  '4mm2': { label: '4 mm2', stroke: 7 },
  'awg18': { label: '#18 AWG', stroke: 2 },
  'awg16': { label: '#16 AWG', stroke: 3 },
  'awg14': { label: '#14 AWG', stroke: 4 },
  'awg12': { label: '#12 AWG', stroke: 6 }
};

function normalizeWireGauge(value, fallbackThickness = 'thin') {
  if (value && WIRE_GAUGES[value]) return value;
  if (fallbackThickness === 'thick') return '4mm2';
  return '1mm2';
}

function getWireStroke(wireOrGauge) {
  const gauge = typeof wireOrGauge === 'string'
    ? normalizeWireGauge(wireOrGauge)
    : normalizeWireGauge(wireOrGauge?.gauge, wireOrGauge?.thickness);
  return WIRE_GAUGES[gauge]?.stroke || 3;
}

function getWireGaugeLabel(gauge) {
  return WIRE_GAUGES[normalizeWireGauge(gauge)]?.label || '1 mm2';
}


function getComponentDisplayNameById(componentId) {
  const el = document.querySelector(`.component[data-id="${componentId}"]`);
  if (!el) return componentId || '';
  return el.dataset.ref || el.dataset.name || state.libraryMap.get(el.dataset.typeId)?.name || el.dataset.typeId || componentId;
}

function getPortLabel(ref) {
  const port = findPort(ref);
  if (!port) return ref?.port || '';
  return port.title || port.dataset.port || ref?.port || '';
}

function getWireAutoLabel(wire, index = 0) {
  if (wire?.label && String(wire.label).trim()) return String(wire.label).trim();
  return 'W' + String(index + 1).padStart(2, '0');
}

function cleanTagText(value, fallback = '') {
  const text = String(value || fallback || '').trim();
  return text.replace(/\s+/g, '').replace(/[:;]/g, '-');
}

function getWireNumberTag(wire, index = null) {
  const i = index ?? state.wires.findIndex(item => item.id === wire?.id);
  const label = getWireAutoLabel(wire, i >= 0 ? i : 0);
  const match = String(label).match(/\d+/);
  if (match) return String(parseInt(match[0], 10));
  return cleanTagText(label, '1');
}

function getDeviceTagById(componentId) {
  const el = document.querySelector(`.component[data-id="${componentId}"]`);
  if (!el) return cleanTagText(componentId, 'DEV');
  const ref = cleanTagText(el.dataset.ref || '');
  if (ref) return ref;
  const name = cleanTagText(el.dataset.name || state.libraryMap.get(el.dataset.typeId)?.name || el.dataset.typeId || componentId, 'DEV');
  return name.length > 10 ? name.slice(0, 10) : name;
}

function getTerminalTag(ref) {
  const raw = getPortLabel(ref) || ref?.port || '';
  const first = String(raw).trim().split(/\s+/)[0] || raw;
  return cleanTagText(first, 'X');
}

function getWireEndpointText(wire, side) {
  const ref = side === 'from' ? wire.from : wire.to;
  const number = getWireNumberTag(wire);
  const device = getDeviceTagById(ref?.componentId);
  const port = getTerminalTag(ref);
  return `${number}-${device}-${port}`;
}

function midpointAlongPolyline(points) {
  if (!points || points.length < 2) return null;
  let total = 0;
  const segments = [];
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    segments.push({ a, b, length });
    total += length;
  }
  let target = total / 2;
  for (const seg of segments) {
    if (target <= seg.length) {
      const t = seg.length ? target / seg.length : 0;
      return { x: seg.a.x + (seg.b.x - seg.a.x) * t, y: seg.a.y + (seg.b.y - seg.a.y) * t };
    }
    target -= seg.length;
  }
  const last = points[points.length - 1];
  return { x: last.x, y: last.y };
}

function makeSvgTextLabel(text, x, y, options = {}) {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('class', options.className || 'wire-label');
  group.style.pointerEvents = 'none';
  if (typeof options.rotate === 'number') group.setAttribute('transform', `rotate(${options.rotate} ${x} ${y})`);
  const paddingX = options.paddingX ?? 4;
  const paddingY = options.paddingY ?? 2;
  const fontSize = options.fontSize ?? 10;
  const approxWidth = Math.max(18, String(text).length * fontSize * 0.58 + paddingX * 2);
  const height = fontSize + paddingY * 2 + 2;
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', String(x - approxWidth / 2));
  rect.setAttribute('y', String(y - height / 2));
  rect.setAttribute('width', String(approxWidth));
  rect.setAttribute('height', String(height));
  rect.setAttribute('rx', '2');
  rect.setAttribute('fill', options.fill || '#ffffff');
  rect.setAttribute('stroke', options.stroke || '#94a3b8');
  rect.setAttribute('stroke-width', String(options.strokeWidth ?? 0.6));
  rect.setAttribute('opacity', String(options.opacity ?? 0.95));
  rect.setAttribute('vector-effect', 'non-scaling-stroke');
  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', String(x));
  label.setAttribute('y', String(y + fontSize * 0.35));
  label.setAttribute('text-anchor', 'middle');
  label.setAttribute('font-family', 'Arial, sans-serif');
  label.setAttribute('font-size', String(fontSize));
  label.setAttribute('font-weight', options.bold ? '700' : '600');
  label.setAttribute('fill', options.textColor || '#111827');
  label.textContent = text;
  group.appendChild(rect);
  group.appendChild(label);
  return group;
}

function buildSvgLabel(text, x, y, options = {}) {
  const paddingX = options.paddingX ?? 4;
  const paddingY = options.paddingY ?? 2;
  const fontSize = options.fontSize ?? 10;
  const approxWidth = Math.max(18, String(text).length * fontSize * 0.58 + paddingX * 2);
  const height = fontSize + paddingY * 2 + 2;
  const transform = typeof options.rotate === 'number' ? ` transform="rotate(${options.rotate} ${x} ${y})"` : '';
  return `<g class="${xmlEscape(options.className || 'wire-label')}"${transform}><rect x="${x - approxWidth / 2}" y="${y - height / 2}" width="${approxWidth}" height="${height}" rx="2" fill="${xmlEscape(options.fill || '#ffffff')}" stroke="${xmlEscape(options.stroke || '#94a3b8')}" stroke-width="${options.strokeWidth ?? 0.6}" opacity="${options.opacity ?? 0.95}" vector-effect="non-scaling-stroke"/><text x="${x}" y="${y + fontSize * 0.35}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="${options.bold ? 700 : 600}" fill="${xmlEscape(options.textColor || '#111827')}">${xmlEscape(text)}</text></g>`;
}

function normalizeWireLabels() {
  state.wires.forEach((wire, index) => {
    if (!wire.label || !String(wire.label).trim()) wire.label = 'W' + String(index + 1).padStart(2, '0');
  });
}

function autoNumberWires() {
  if (!state.wires.length) {
    setStatus('No hay cables para etiquetar', 'warning');
    return;
  }
  recordHistory();
  state.wires.forEach((wire, index) => {
    wire.label = 'W' + String(index + 1).padStart(2, '0');
    wire.fromLabel = getWireEndpointText(wire, 'from');
    wire.toLabel = getWireEndpointText(wire, 'to');
    wire.showLabel = true;
    wire.showEndpointLabels = true;
    if (!Number.isFinite(Number(wire.endpointLabelOffset))) wire.endpointLabelOffset = state.defaultEndpointLabelOffset;
  });
  state.showWireLabels = true;
  if (toggleWireLabelsBtn) toggleWireLabelsBtn.textContent = 'Etiquetas ON';
  drawWires();
  if (state.selectedWireId) showWireInspector(state.selectedWireId);
  setStatus('Cables numerados automáticamente', 'success');
}

function setWireLabelsVisible(visible) {
  state.showWireLabels = !!visible;
  if (toggleWireLabelsBtn) {
    toggleWireLabelsBtn.classList.toggle('active', state.showWireLabels);
    toggleWireLabelsBtn.textContent = state.showWireLabels ? 'Etiquetas ON' : 'Etiquetas OFF';
  }
  drawWires();
}

function autoEndpointLabels() {
  if (!state.wires.length) {
    setStatus('No hay cables para rotular', 'warning');
    return;
  }
  recordHistory();
  state.wires.forEach(wire => {
    wire.fromLabel = getWireEndpointText(wire, 'from');
    wire.toLabel = getWireEndpointText(wire, 'to');
    wire.showEndpointLabels = true;
    if (!Number.isFinite(Number(wire.endpointLabelOffset))) wire.endpointLabelOffset = state.defaultEndpointLabelOffset;
  });
  state.showWireLabels = true;
  setWireLabelsVisible(true);
  drawWires();
  if (state.selectedWireId) showWireInspector(state.selectedWireId);
  setStatus('Rotulado de extremos generado', 'success');
}

const WIRE_TERMINALS = {
  none: { label: 'Sin terminal' },
  dot: { label: 'Punto / borne' },
  ring: { label: 'Ojal' },
  ferrule: { label: 'Puntera / férula visible' },
  fork: { label: 'Horquilla' }
};

const WIRE_COLOR_PRESETS = {
  '#ffffff': 'Blanco', '#2563eb': 'Azul', '#111827': 'Negro', '#ef4444': 'Rojo',
  '#8b5a2b': 'Marrón', '#38bdf8': 'Celeste', '#6b7280': 'Plomo', 'green-yellow': 'Verde/Amarillo tierra'
};
const TERMINAL_COLOR_PRESETS = {
  '#8b5a2b': 'Marrón', '#6b7280': 'Plomo', '#111827': 'Negro', '#2563eb': 'Azul',
  '#ef4444': 'Rojo', '#facc15': 'Amarillo', '#f97316': 'Naranja'
};
function normalizeWireColor(value) { return value || '#2563eb'; }
function wireStrokeColor(value) { return value === 'green-yellow' ? '#16a34a' : normalizeWireColor(value); }
function normalizeTerminalColor(value) { return value && TERMINAL_COLOR_PRESETS[value] ? value : '#2563eb'; }
function colorOptions(options, selected) { return Object.entries(options).map(([value,label]) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${label}</option>`).join(''); }
function syncWireColorControls(color) {
  if (!wireColorSelect) return;
  const value = normalizeWireColor(color);
  wireColorSelect.value = WIRE_COLOR_PRESETS[value] ? value : 'custom';
  if (wireColorPicker && value !== 'green-yellow') wireColorPicker.value = /^#[0-9a-f]{6}$/i.test(value) ? value : '#2563eb';
}


function normalizeWireTerminal(value) {
  return value && WIRE_TERMINALS[value] ? value : 'dot';
}

function getWireTerminalLabel(value) {
  return WIRE_TERMINALS[normalizeWireTerminal(value)]?.label || 'Punto / borne';
}

// Medidas visuales de terminales. La puntera/ferula ya no usa un ancho fijo:
// se calcula proporcional al grosor del cable para que no se vea demasiado gorda
// cuando el cable es delgado.
function getTerminalMetrics(wire) {
  const stroke = getWireStroke(wire);
  const gauge = normalizeWireGauge(wire?.gauge, wire?.thickness);
  const isLargeFerrule = gauge === '4mm2' || gauge === 'awg12';
  return {
    stroke,
    // Terminal tipo puntera/ferula con aspecto mas tecnico:
    // - bordes rectos: rx = 0
    // - contorno fino para no ensuciar el plano
    // - para 4 mm2 y #12 AWG se reduce un poco el largo visible, pero se conserva mas ancho
    ferruleLength: isLargeFerrule ? Math.max(11, stroke * 2.0) : Math.max(10, stroke * 2.35),
    ferruleWidth: isLargeFerrule ? Math.max(stroke * 1.12, 5.9) : Math.max(stroke * 1.08, 3.8),
    ferruleRx: 0,
    ferruleStrokeWidth: 0.65,
    dotRadius: Math.max(3.2, stroke * 0.85),
    ringRadius: Math.max(4.2, stroke * 1.05),
    forkWidth: Math.max(5, stroke * 1.35)
  };
}


addNodeBtn?.addEventListener('click', () => {
  if (!state.selectedWireId) {
    setStatus('Selecciona un cable primero', 'warning');
    return;
  }
  const wire = state.wires.find(w => w.id === state.selectedWireId);
  if (!wire) return;
  const points = getWirePoints(wire);
  if (!points || points.length < 2) return;
  const a = points[1] || points[0];
  const b = points[points.length - 2] || points[points.length - 1];
  const center = { x: Math.round((a.x + b.x) / 2), y: Math.round((a.y + b.y) / 2) };
  createNodeOnSelectedWire(center);
});

delNodeBtn?.addEventListener('click', () => {
  deleteSelectedNode();
});

let selectedNodeIndex = null;

const state = {
  mode: 'select',
  selected: { type: null, id: null },
  selectedComponents: new Set(),
  componentId: 0,
  wireId: 0,
  maxLayer: 0,
  pendingPort: null,
  currentWireThickness: 'thin',
  currentWireGauge: '1mm2',
  currentWireColor: '#2563eb',
  previewMousePoint: null,
  selectedWireId: null,
  draggingNode: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  panState: null,
  pinchState: null,
  suppressWorkspaceClick: false,
  dragContext: null,
  labelDragContext: null,
  resizeContext: null,
  spacePressed: false,
  wires: [],
  library: [],
  libraryMap: new Map(),
  pendingWaypoints: [],
  undoStack: [],
  redoStack: [],
  maxHistory: 50,
  wireDrawFrame: null,
  viewportFrame: null,
  pendingViewportTransform: false,
  lastZoomStatusAt: 0,
  snapEnabled: true,
  snapGrid: 24,
  snapThreshold: 7,
  currentWireRouteMode: 'free',
  currentWireTerminal: 'ferrule',
  currentTerminalColor: '#2563eb',
  guideX: null,
  guideY: null,
  pxPerMm: 2,
  showRealUnits: true,
  boardWidthMm: 800,
  boardHeightMm: 1200,
  showWireLabels: true,
  showEndpointLabels: true,
  defaultEndpointLabelOffset: 30,
  inspectorOpenSections: {}
};

function getInspectorSectionKey(detail) {
  const summary = detail?.querySelector('summary');
  return (summary?.textContent || '').trim();
}

function rememberInspectorOpenSections() {
  if (!inspectorContent) return;
  const remembered = { ...(state.inspectorOpenSections || {}) };
  inspectorContent.querySelectorAll('details.inspector-section').forEach(detail => {
    const key = getInspectorSectionKey(detail);
    if (key) remembered[key] = detail.open;
  });
  state.inspectorOpenSections = remembered;
}

function restoreInspectorOpenSections() {
  if (!inspectorContent || !state.inspectorOpenSections) return;
  inspectorContent.querySelectorAll('details.inspector-section').forEach(detail => {
    const key = getInspectorSectionKey(detail);
    if (key && Object.prototype.hasOwnProperty.call(state.inspectorOpenSections, key)) {
      detail.open = !!state.inspectorOpenSections[key];
    }
    detail.addEventListener('toggle', () => {
      const sectionKey = getInspectorSectionKey(detail);
      if (!sectionKey) return;
      state.inspectorOpenSections = state.inspectorOpenSections || {};
      state.inspectorOpenSections[sectionKey] = detail.open;
    });
  });
}

function keepInspectorSectionState(action) {
  rememberInspectorOpenSections();
  const result = action?.();
  restoreInspectorOpenSections();
  return result;
}

function pxToMm(px) {
  return Math.round((Number(px) || 0) / Math.max(state.pxPerMm || 1, 0.1) * 10) / 10;
}

function mmToPx(mm) {
  return Math.round((Number(mm) || 0) * Math.max(state.pxPerMm || 1, 0.1));
}

function formatUnit(px) {
  return state.showRealUnits ? `${pxToMm(px)} mm` : `${Math.round(px)} px`;
}

function getDisplayValueFromPx(px) {
  return state.showRealUnits ? pxToMm(px) : Math.round(px);
}

function getPxValueFromDisplay(value) {
  return state.showRealUnits ? mmToPx(value) : Math.round(Number(value) || 0);
}

function saveScaleSettings() {
  try {
    localStorage.setItem(SCALE_SETTINGS_KEY, JSON.stringify({ pxPerMm: state.pxPerMm, showRealUnits: state.showRealUnits, showWireLabels: state.showWireLabels }));
  } catch (_) {}
}

function loadScaleSettings() {
  try {
    const raw = localStorage.getItem(SCALE_SETTINGS_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Number(saved.pxPerMm) > 0) state.pxPerMm = clamp(Number(saved.pxPerMm), 0.2, 20);
    if (typeof saved.showRealUnits === 'boolean') state.showRealUnits = saved.showRealUnits;
    if (typeof saved.showWireLabels === 'boolean') state.showWireLabels = saved.showWireLabels;
  } catch (_) {}
}

function syncScaleControls() {
  if (pxPerMmInput) pxPerMmInput.value = String(state.pxPerMm);
  if (unitToggleBtn) {
    unitToggleBtn.textContent = state.showRealUnits ? 'Medidas: mm' : 'Medidas: px';
    unitToggleBtn.classList.toggle('active', state.showRealUnits);
  }
}


function saveBoardSettings() {
  try {
    localStorage.setItem(BOARD_SETTINGS_KEY, JSON.stringify({
      boardWidthMm: state.boardWidthMm,
      boardHeightMm: state.boardHeightMm
    }));
  } catch (_) {}
}

function loadBoardSettings() {
  try {
    const raw = localStorage.getItem(BOARD_SETTINGS_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Number(saved.boardWidthMm) > 0) state.boardWidthMm = clamp(Number(saved.boardWidthMm), 100, 3000);
    if (Number(saved.boardHeightMm) > 0) state.boardHeightMm = clamp(Number(saved.boardHeightMm), 100, 3000);
  } catch (_) {}
}

function syncBoardControls() {
  if (boardWidthMmInput) boardWidthMmInput.value = String(Math.round(state.boardWidthMm));
  if (boardHeightMmInput) boardHeightMmInput.value = String(Math.round(state.boardHeightMm));
}

function applyBoardSize(options = {}) {
  const widthMm = clamp(Number(state.boardWidthMm) || 800, 100, 3000);
  const heightMm = clamp(Number(state.boardHeightMm) || 1200, 100, 3000);
  state.boardWidthMm = widthMm;
  state.boardHeightMm = heightMm;

  const widthPx = Math.max(200, mmToPx(widthMm));
  const heightPx = Math.max(200, mmToPx(heightMm));
  viewport.style.width = `${widthPx}px`;
  viewport.style.height = `${heightPx}px`;
  canvas.style.width = `${widthPx}px`;
  canvas.style.height = `${heightPx}px`;
  wiresSvg.setAttribute('width', widthPx);
  wiresSvg.setAttribute('height', heightPx);
  wiresSvg.setAttribute('viewBox', `0 0 ${widthPx} ${heightPx}`);

  if (boardBackground) {
    boardBackground.style.width = `${widthPx}px`;
    boardBackground.style.height = `${heightPx}px`;
    const gridPx = Math.max(8, mmToPx(10));
    boardBackground.style.backgroundSize = `${gridPx}px ${gridPx}px, ${gridPx}px ${gridPx}px, 100% 100%`;
    boardBackground.dataset.size = `Tablero ${widthMm} mm x ${heightMm} mm`;
  }

  syncBoardControls();
  if (!options.skipSave) saveBoardSettings();
  drawWires();
}

function setBoardFromInputs() {
  state.boardWidthMm = clamp(Number(boardWidthMmInput?.value) || state.boardWidthMm || 800, 100, 3000);
  state.boardHeightMm = clamp(Number(boardHeightMmInput?.value) || state.boardHeightMm || 1200, 100, 3000);
  applyBoardSize();
  setStatus(`Tablero aplicado: ${state.boardWidthMm} mm x ${state.boardHeightMm} mm`, 'success');
}

function fitBoardToScreen() {
  const boardW = mmToPx(state.boardWidthMm || 800);
  const boardH = mmToPx(state.boardHeightMm || 1200);
  const rect = workspace.getBoundingClientRect();
  const margin = 70;
  const availableW = Math.max(120, rect.width - margin);
  const availableH = Math.max(120, rect.height - margin);
  state.zoom = clamp(Math.min(availableW / Math.max(boardW, 1), availableH / Math.max(boardH, 1)), 0.08, 2.5);
  state.panX = Math.round((rect.width - boardW * state.zoom) / 2);
  state.panY = Math.round((rect.height - boardH * state.zoom) / 2);
  updateViewportTransform();
  setStatus('Tablero ajustado a pantalla', 'success');
}

function setStatus(text, type = 'info') {
  statusEl.textContent = text;
  statusEl.classList.remove('is-warning', 'is-success');
  if (type === 'warning') statusEl.classList.add('is-warning');
  if (type === 'success') statusEl.classList.add('is-success');
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getSelectedComponent() {
  return $('.component.selected');
}

function getSelectedComponents() {
  return [...state.selectedComponents]
    .map(id => document.querySelector(`.component[data-id="${id}"]`))
    .filter(Boolean);
}


function getComponentLayer(el) {
  return parseInt(el?.dataset.layer || el?.style.zIndex || '1', 10) || 1;
}

function syncMaxLayerFromDom() {
  state.maxLayer = Math.max(0, ...$$('.component').map(getComponentLayer));
}

function applyComponentLayer(el, layer) {
  const safeLayer = Math.max(1, parseInt(layer, 10) || 1);
  el.dataset.layer = String(safeLayer);
  el.style.zIndex = String(safeLayer);
  state.maxLayer = Math.max(state.maxLayer || 0, safeLayer);
}

function getLayerSortedComponents() {
  return $$('.component').sort((a, b) => getComponentLayer(a) - getComponentLayer(b));
}

function changeSelectedLayer(action) {
  const selected = getSelectedComponents();
  if (!selected.length) {
    setStatus('Selecciona un componente para ordenar capas', 'warning');
    return;
  }
  recordHistory();
  syncMaxLayerFromDom();
  const selectedSet = new Set(selected);
  const ordered = getLayerSortedComponents();

  if (action === 'front') {
    selected.forEach(el => applyComponentLayer(el, ++state.maxLayer));
    setStatus('Componente traído al frente', 'success');
  } else if (action === 'back') {
    selected.forEach(el => applyComponentLayer(el, 1));
    ordered.filter(el => !selectedSet.has(el)).forEach((el, index) => applyComponentLayer(el, index + 2));
    setStatus('Componente enviado al fondo', 'success');
  } else if (action === 'up') {
    ordered.forEach((el, index) => applyComponentLayer(el, index + 1));
    selected.forEach(el => {
      const currentLayer = getComponentLayer(el);
      const candidate = ordered.find(other => !selectedSet.has(other) && getComponentLayer(other) === currentLayer + 1);
      if (!candidate) return;
      applyComponentLayer(candidate, currentLayer);
      applyComponentLayer(el, currentLayer + 1);
    });
    syncMaxLayerFromDom();
    setStatus('Componente subido una capa', 'success');
  } else if (action === 'down') {
    ordered.forEach((el, index) => applyComponentLayer(el, index + 1));
    selected.forEach(el => {
      const currentLayer = getComponentLayer(el);
      const candidate = [...ordered].reverse().find(other => !selectedSet.has(other) && getComponentLayer(other) === currentLayer - 1);
      if (!candidate) return;
      applyComponentLayer(candidate, currentLayer);
      applyComponentLayer(el, currentLayer - 1);
    });
    syncMaxLayerFromDom();
    setStatus('Componente bajado una capa', 'success');
  }

  const active = selected[selected.length - 1];
  if (active) showComponentInspector(active);
}

function renderInspectorEmpty(message = 'Selecciona un componente o un cable') {
  inspectorContent.innerHTML = `<p class="muted">${message}</p>`;
}

function syncSelectionState(type = null, id = null) {
  state.selected.type = type;
  state.selected.id = id;
}

function clearSelection() {
  $$('.component').forEach(component => component.classList.remove('selected'));
  state.selectedComponents.clear();
  state.selectedWireId = null;
  selectedNodeIndex = null;
  state.selectedComponents.clear();
  syncSelectionState(null, null);
  renderInspectorEmpty();
  drawWires();
}

function selectComponent(el, additive = false) {
  if (!additive) {
    $$('.component').forEach(component => component.classList.remove('selected'));
    state.selectedComponents.clear();
  }

  state.selectedWireId = null;
  selectedNodeIndex = null;

  if (additive && state.selectedComponents.has(el.dataset.id)) {
    el.classList.remove('selected');
    state.selectedComponents.delete(el.dataset.id);
    if (!state.selectedComponents.size) {
      syncSelectionState(null, null);
      renderInspectorEmpty();
    } else {
      const last = getSelectedComponents().at(-1);
      syncSelectionState('component', last?.dataset.id || null);
      if (last) showComponentInspector(last);
    }
    drawWires();
    return;
  }

  el.classList.add('selected');
  state.selectedComponents.add(el.dataset.id);
  syncSelectionState('component', el.dataset.id);
  showComponentInspector(el);
  drawWires();
}


function getComponentTags(el) {
  return {
    nameTag: $('.component-name-tag', el),
    refTag: $('.component-ref-tag', el)
  };
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function classifyDevicePrefix(defOrEl) {
  const source = defOrEl?.dataset
    ? `${defOrEl.dataset.ref || ''} ${defOrEl.dataset.name || ''} ${state.libraryMap.get(defOrEl.dataset.typeId)?.name || ''} ${defOrEl.dataset.typeId || ''}`
    : `${defOrEl?.name || ''} ${defOrEl?.category || ''} ${defOrEl?.id || ''}`;
  const t = normalizeText(source);
  if (/contactor|km\b|sneider|schneider/.test(t)) return 'KM';
  if (/rele termico|rel[eé] termico|termico.*rele|rt\b/.test(t)) return 'RT';
  if (/rele|relay/.test(t)) return 'R';
  if (/guardamotor|motor guard/.test(t)) return 'GM';
  if (/itm|interruptor|breaker|termomagnetico|termomagn[eé]tico/.test(t)) return 'ITM';
  if (/bornera|borne|terminal block/.test(t)) return 'X';
  if (/riel|din/.test(t)) return 'RD';
  if (/canaleta|ducto|duct/.test(t)) return 'CAN';
  return 'D';
}

function getNextDeviceRef(prefix) {
  const used = new Set($$('.component').map(el => String(el.dataset.ref || '').trim().toUpperCase()));
  let i = 1;
  while (used.has(`${prefix}${i}`)) i += 1;
  return `${prefix}${i}`;
}

function autoNumberDeviceRefs() {
  recordHistory();
  const counters = {};
  getLayerSortedComponents().forEach(el => {
    const prefix = classifyDevicePrefix(el);
    counters[prefix] = (counters[prefix] || 0) + 1;
    el.dataset.ref = `${prefix}${counters[prefix]}`;
    updateComponentVisualMeta(el);
  });
  drawWires();
  const selected = getSelectedComponent();
  if (selected) showComponentInspector(selected);
  setStatus('Dispositivos numerados automáticamente', 'success');
}

function startComponentLabelDrag(event, el, tagType) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  selectComponent(el, event.shiftKey);
  if (el.dataset.labelLocked === 'true') {
    setStatus('Etiqueta de dispositivo bloqueada', 'warning');
    return;
  }
  recordHistory();
  state.labelDragContext = {
    el,
    tagType,
    startX: event.clientX,
    startY: event.clientY,
    startOffsetX: Number(el.dataset.labelOffsetX || 0),
    startOffsetY: Number(el.dataset.labelOffsetY || 0),
    moved: false
  };
}

function applyComponentLabelPosition(el) {
  if (!el) return;
  const { nameTag, refTag } = getComponentTags(el);
  const offsetX = Number(el.dataset.labelOffsetX || 0);
  const offsetY = Number(el.dataset.labelOffsetY || 0);
  const rotation = parseInt(el.dataset.rotation || '0', 10) || 0;
  const transform = `translateX(-50%) translate(${offsetX}px, ${offsetY}px) rotate(${-rotation}deg)`;
  if (nameTag) {
    nameTag.style.left = '50%';
    nameTag.style.top = '-24px';
    nameTag.style.transform = transform;
    nameTag.style.transformOrigin = 'center center';
    nameTag.classList.toggle('label-locked', el.dataset.labelLocked === 'true');
  }
  if (refTag) {
    refTag.style.left = '50%';
    refTag.style.bottom = '-24px';
    refTag.style.transform = transform;
    refTag.style.transformOrigin = 'center center';
    refTag.classList.toggle('label-locked', el.dataset.labelLocked === 'true');
  }
}


function refreshComponentTerminalVisuals(el) {
  if (!el) return;
  const rotation = parseInt(el.dataset.rotation || '0', 10) || 0;

  $$('.port', el).forEach(port => {
    const nx = parseFloat(port.dataset.nx || '0.5');
    const ny = parseFloat(port.dataset.ny || '0.5');
    port.style.left = `${nx * 100}%`;
    port.style.top = `${ny * 100}%`;
    port.style.transform = 'translate(-50%, -50%)';
  });

  $$('.label', el).forEach(label => {
    const port = $(`.port[data-port="${label.dataset.labelFor}"]`, el);
    if (!port) return;

    const baseDirection = label.dataset.baseDirection || port.dataset.direction || 'top';
    const rotatedDirection = rotateDirection(baseDirection, rotation);
    const offset = getLabelOffset(rotatedDirection);

    const nx = parseFloat(port.dataset.nx || '0.5');
    const ny = parseFloat(port.dataset.ny || '0.5');

    label.style.left = `calc(${nx * 100}% + ${offset.x}px)`;
    label.style.top = `calc(${ny * 100}% + ${offset.y}px)`;
    label.style.transform = `translate(-50%, -50%) rotate(${-rotation}deg)`;
    label.style.transformOrigin = 'center center';
  });

  applyComponentLabelPosition(el);
}

function getComponentTextMode(el) {
  if (!el) return 'both';
  if (el.dataset.textMode) return el.dataset.textMode;
  return (el.dataset.showName || 'true') === 'true' ? 'both' : 'none';
}

function updateComponentVisualMeta(el) {
  if (!el) return;
  const { nameTag, refTag } = getComponentTags(el);
  if (nameTag) nameTag.textContent = el.dataset.name || '';
  if (refTag) refTag.textContent = el.dataset.ref || '';
  if (nameTag) nameTag.title = 'Arrastra para mover la etiqueta de nombre';
  if (refTag) refTag.title = 'Arrastra para mover la etiqueta / referencia';
  applyComponentLabelPosition(el);
  const textMode = getComponentTextMode(el);
  el.dataset.textMode = textMode;
  el.dataset.showName = textMode === 'none' ? 'false' : 'true';
  el.classList.toggle('hide-name', textMode === 'none');
  el.classList.toggle('show-text-name', textMode === 'name');
  el.classList.toggle('show-text-ref', textMode === 'ref');
  el.classList.toggle('show-text-both', textMode === 'both');
  el.classList.toggle('locked', (el.dataset.locked || 'false') === 'true');
  applyRotation(el);
  refreshComponentTerminalVisuals(el);
}

function applyRotation(el) {
  const rotation = parseInt(el?.dataset?.rotation || '0', 10) || 0;
  el.style.transform = `rotate(${rotation}deg)`;
}



function buildSmartRoutePoints(startLead, endLead, startDirection, endDirection) {
  const points = [];
  const isHorizontalA = startDirection === 'left' || startDirection === 'right';
  const isHorizontalB = endDirection === 'left' || endDirection === 'right';
  const isVerticalA = startDirection === 'top' || startDirection === 'bottom';
  const isVerticalB = endDirection === 'top' || endDirection === 'bottom';

  if (isVerticalA && isVerticalB) {
    const sameBottom = startDirection === 'bottom' && endDirection === 'bottom';
    const lift = 14;
    const busY = sameBottom
      ? Math.max(startLead.y, endLead.y) + lift
      : Math.min(startLead.y, endLead.y) - lift;
    pushPoint(points, { x: startLead.x, y: busY });
    pushPoint(points, { x: endLead.x, y: busY });
    return points;
  }

  if (isHorizontalA && isHorizontalB) {
    const sameRight = startDirection === 'right' && endDirection === 'right';
    const lift = 14;
    const busX = sameRight
      ? Math.max(startLead.x, endLead.x) + lift
      : Math.min(startLead.x, endLead.x) - lift;
    pushPoint(points, { x: busX, y: startLead.y });
    pushPoint(points, { x: busX, y: endLead.y });
    return points;
  }

  const horizontal = isHorizontalA || isHorizontalB;
  if (horizontal) {
    const midX = Math.round((startLead.x + endLead.x) / 2);
    pushPoint(points, { x: midX, y: startLead.y });
    pushPoint(points, { x: midX, y: endLead.y });
  } else {
    const midY = Math.round((startLead.y + endLead.y) / 2);
    pushPoint(points, { x: startLead.x, y: midY });
    pushPoint(points, { x: endLead.x, y: midY });
  }

  return points;
}

function rebuildWire(wire) {
  const fromPort = findPort(wire.from);
  const toPort = findPort(wire.to);
  if (!fromPort || !toPort) return;

  const startGeometry = getPortGeometry(fromPort);
  const endGeometry = getPortGeometry(toPort);
  if (!startGeometry || !endGeometry) return;

  const lead = 26;
  const startLead = offsetPoint({ x: startGeometry.x, y: startGeometry.y }, startGeometry.direction, lead);
  const endLead = offsetPoint({ x: endGeometry.x, y: endGeometry.y }, endGeometry.direction, lead);

  const points = [];
  const sameVertical = ['top', 'bottom'].includes(startGeometry.direction) && ['top', 'bottom'].includes(endGeometry.direction);
  const sameHorizontal = ['left', 'right'].includes(startGeometry.direction) && ['left', 'right'].includes(endGeometry.direction);

  if (sameVertical) {
    const midY = Math.round((startLead.y + endLead.y) / 2);
    pushPoint(points, { x: startLead.x, y: midY });
    pushPoint(points, { x: endLead.x, y: midY });
  } else if (sameHorizontal) {
    const midX = Math.round((startLead.x + endLead.x) / 2);
    pushPoint(points, { x: midX, y: startLead.y });
    pushPoint(points, { x: midX, y: endLead.y });
  } else {
    const goHorizontalFirst = Math.abs(startLead.x - endLead.x) >= Math.abs(startLead.y - endLead.y);
    if (goHorizontalFirst) {
      pushPoint(points, { x: endLead.x, y: startLead.y });
    } else {
      pushPoint(points, { x: startLead.x, y: endLead.y });
    }
  }

  wire.waypoints = points;
}

function rotateComponent(el, angle = 90) {
  let current = parseInt(el.dataset.rotation || "0", 10);
  current = (current + angle) % 360;

  el.dataset.rotation = current;
  el.style.transform = `rotate(${current}deg)`;
  updateComponentVisualMeta(el);

  const compId = el.dataset.id;

  const orderedWires = [
    ...state.wires.filter(w => w.id !== state.selectedWireId),
    ...state.wires.filter(w => w.id === state.selectedWireId)
  ];

  orderedWires.forEach(wire => {
    if (wire.from.componentId === compId || wire.to.componentId === compId) {
      rebuildWire(wire);
    }
  });

  drawWires();
  saveState();
  setStatus("Componente rotado y cables reajustados", "success");
}

function duplicateComponent(el) {
  if (!el) return null;
  const def = state.libraryMap.get(el.dataset.typeId);
  if (!def) {
    setStatus('No se pudo duplicar el componente', 'warning');
    return null;
  }

  recordHistory();
  const clone = addComponent(def, {
    x: (parseFloat(el.style.left) || 0) + 24,
    y: (parseFloat(el.style.top) || 0) + 24,
    name: el.dataset.name || '',
    ref: undefined,
    labelOffsetX: el.dataset.labelOffsetX || 0,
    labelOffsetY: el.dataset.labelOffsetY || 0,
    labelLocked: el.dataset.labelLocked || 'false',
    rotation: el.dataset.rotation || '0',
    locked: el.dataset.locked || 'false',
    showName: el.dataset.showName || 'true',
    textMode: getComponentTextMode(el),
    width: parseFloat(el.style.width) || undefined,
    height: parseFloat(el.style.height) || undefined,
    skipHistory: true,
    skipSelection: true
  });

  clearSelection();
  selectComponent(clone);
  setStatus('Componente duplicado', 'success');
  return clone;
}

function showComponentInspector(el) {
  rememberInspectorOpenSections();
  if (!el) {
    renderInspectorEmpty();
    return;
  }
  const x = parseInt(el.style.left, 10) || 0;
  const y = parseInt(el.style.top, 10) || 0;
  const w = Math.round(parseFloat(el.style.width) || el.offsetWidth || COMPONENT_SIZE.target);
  const h = Math.round(parseFloat(el.style.height) || el.offsetHeight || COMPONENT_SIZE.target);
  const selectedCount = state.selectedComponents.size;
  inspectorContent.innerHTML = `
    <div class="inspector-meta">ID: ${el.dataset.id} · Tipo: ${el.dataset.typeId || 'N/D'} · Capa: ${getComponentLayer(el)}${selectedCount > 1 ? ` · Multi-selección: ${selectedCount}` : ''}</div>

    <details class="inspector-section" open>
      <summary>General</summary>
      <div class="inspector-section-body">
        <div class="inspector-group">
          <label for="propName">Nombre</label>
          <input id="propName" value="${el.dataset.name || ''}">
        </div>
        <div class="inspector-group">
          <label for="propRef">Referencia</label>
          <input id="propRef" value="${el.dataset.ref || ''}" placeholder="Ej. K1, M1, Q1">
        </div>
        <div class="inspector-group">
          <label for="propTextMode">Mostrar texto del dispositivo</label>
          <select id="propTextMode">
            <option value="both" ${getComponentTextMode(el) === 'both' ? 'selected' : ''}>Nombre + etiqueta</option>
            <option value="name" ${getComponentTextMode(el) === 'name' ? 'selected' : ''}>Solo nombre</option>
            <option value="ref" ${getComponentTextMode(el) === 'ref' ? 'selected' : ''}>Solo etiqueta</option>
            <option value="none" ${getComponentTextMode(el) === 'none' ? 'selected' : ''}>Ocultar texto</option>
          </select>
        </div>
        <div class="inspector-check"><input id="propLocked" type="checkbox" ${(el.dataset.locked || 'false') === 'true' ? 'checked' : ''}> Bloquear componente</div>
      </div>
    </details>

    <details class="inspector-section" open>
      <summary>Posición y tamaño</summary>
      <div class="inspector-section-body">
        <div class="inspector-row">
          <div class="inspector-group">
            <label for="propX">X (${state.showRealUnits ? 'mm' : 'px'})</label>
            <input id="propX" type="number" step="0.1" value="${getDisplayValueFromPx(x)}">
          </div>
          <div class="inspector-group">
            <label for="propY">Y (${state.showRealUnits ? 'mm' : 'px'})</label>
            <input id="propY" type="number" step="0.1" value="${getDisplayValueFromPx(y)}">
          </div>
        </div>
        <div class="inspector-row">
          <div class="inspector-group">
            <label for="propWidth">Ancho (${state.showRealUnits ? 'mm' : 'px'})</label>
            <input id="propWidth" type="number" min="1" max="2000" step="0.1" value="${getDisplayValueFromPx(w)}">
          </div>
          <div class="inspector-group">
            <label for="propHeight">Alto (${state.showRealUnits ? 'mm' : 'px'})</label>
            <input id="propHeight" type="number" min="1" max="2000" step="0.1" value="${getDisplayValueFromPx(h)}">
          </div>
        </div>
        <div class="inspector-check"><input id="propKeepRatio" type="checkbox" checked> Mantener proporción</div>
        <div class="inspector-group">
          <label for="propScale">Escala proporcional</label>
          <input id="propScale" type="range" min="25" max="300" step="5" value="100">
          <div class="inspector-scale-row">
            <button id="scaleDownBtn" type="button">-10%</button>
            <span id="propScaleValue">100%</span>
            <button id="scaleUpBtn" type="button">+10%</button>
          </div>
        </div>
        <button id="resetRecommendedSizeBtn" type="button">Restaurar tamaño recomendado</button>
      </div>
    </details>

    <details class="inspector-section">
      <summary>Etiqueta del dispositivo</summary>
      <div class="inspector-section-body">
        <div class="inspector-check"><input id="propLabelLocked" type="checkbox" ${(el.dataset.labelLocked || 'false') === 'true' ? 'checked' : ''}> Bloquear etiqueta</div>
        <div class="inspector-row">
          <div class="inspector-group">
            <label for="propLabelOffsetX">Etiqueta X (${state.showRealUnits ? 'mm' : 'px'})</label>
            <input id="propLabelOffsetX" type="number" step="0.1" value="${getDisplayValueFromPx(Number(el.dataset.labelOffsetX || 0))}">
          </div>
          <div class="inspector-group">
            <label for="propLabelOffsetY">Etiqueta Y (${state.showRealUnits ? 'mm' : 'px'})</label>
            <input id="propLabelOffsetY" type="number" step="0.1" value="${getDisplayValueFromPx(Number(el.dataset.labelOffsetY || 0))}">
          </div>
        </div>
        <div class="inspector-row">
          <button id="autoRefSelectedBtn" type="button">Auto nombre</button>
          <button id="resetLabelPosBtn" type="button">Centrar etiqueta</button>
        </div>
      </div>
    </details>

    <details class="inspector-section">
      <summary>Capas y acciones</summary>
      <div class="inspector-section-body">
        <div class="inspector-row">
          <div class="inspector-group">
            <label for="propRotation">Rotación</label>
            <select id="propRotation">
              <option value="0" ${(el.dataset.rotation || '0') === '0' ? 'selected' : ''}>0°</option>
              <option value="90" ${(el.dataset.rotation || '0') === '90' ? 'selected' : ''}>90°</option>
              <option value="180" ${(el.dataset.rotation || '0') === '180' ? 'selected' : ''}>180°</option>
              <option value="270" ${(el.dataset.rotation || '0') === '270' ? 'selected' : ''}>270°</option>
            </select>
          </div>
          <div class="inspector-group">
            <label>&nbsp;</label>
            <button id="rotateBtn" type="button">Rotar 90°</button>
          </div>
        </div>
        <div class="inspector-row">
          <button id="layerFrontBtn" type="button">Traer al frente</button>
          <button id="layerBackBtn" type="button">Enviar al fondo</button>
        </div>
        <div class="inspector-row">
          <button id="layerUpBtn" type="button">Subir capa</button>
          <button id="layerDownBtn" type="button">Bajar capa</button>
        </div>
        <button id="duplicateBtn" type="button">Duplicar</button>
      </div>
    </details>

    <div class="inspector-footer">
      <button id="applyProps" type="button">Aplicar propiedades</button>
      <button id="closeInspectorBtn" type="button" class="inspector-secondary-button">Cerrar panel</button>
    </div>
  `
  restoreInspectorOpenSections();
  $('#rotateBtn', inspectorContent).addEventListener('click', () => keepInspectorSectionState(() => rotateComponent(el, 90)));
  $('#duplicateBtn', inspectorContent).addEventListener('click', () => keepInspectorSectionState(() => duplicateComponent(el)));
  $('#layerFrontBtn', inspectorContent).addEventListener('click', () => keepInspectorSectionState(() => changeSelectedLayer('front')));
  $('#layerBackBtn', inspectorContent).addEventListener('click', () => keepInspectorSectionState(() => changeSelectedLayer('back')));
  $('#layerUpBtn', inspectorContent).addEventListener('click', () => keepInspectorSectionState(() => changeSelectedLayer('up')));
  $('#layerDownBtn', inspectorContent).addEventListener('click', () => keepInspectorSectionState(() => changeSelectedLayer('down')));
  $('#autoRefSelectedBtn', inspectorContent)?.addEventListener('click', () => {
    recordHistory();
    const prefix = classifyDevicePrefix(el);
    el.dataset.ref = getNextDeviceRef(prefix);
    updateComponentVisualMeta(el);
    showComponentInspector(el);
    setStatus('Nombre automático aplicado', 'success');
  });
  $('#resetLabelPosBtn', inspectorContent)?.addEventListener('click', () => {
    recordHistory();
    el.dataset.labelOffsetX = '0';
    el.dataset.labelOffsetY = '0';
    updateComponentVisualMeta(el);
    showComponentInspector(el);
    setStatus('Etiqueta centrada', 'success');
  });
  const defForSizing = state.library.find(item => item.id === el.dataset.typeId);
  const recommendedSize = defForSizing ? getRecommendedDisplaySize(defForSizing) : { width: w, height: h };
  const aspect = Number(el.dataset.aspect) || (recommendedSize.width / Math.max(recommendedSize.height, 1)) || (w / Math.max(h, 1)) || 1;
  const widthInput = $('#propWidth', inspectorContent);
  const heightInput = $('#propHeight', inspectorContent);
  const keepRatioInput = $('#propKeepRatio', inspectorContent);
  const scaleInput = $('#propScale', inspectorContent);
  const scaleValue = $('#propScaleValue', inspectorContent);

  function syncScaleFromSize() {
    const currentW = getPxValueFromDisplay(widthInput.value) || w;
    const percent = Math.round((currentW / Math.max(recommendedSize.width, 1)) * 100);
    scaleInput.value = String(clamp(percent, 25, 300));
    scaleValue.textContent = `${scaleInput.value}%`;
  }

  function setSizeInputs(size) {
    widthInput.value = String(getDisplayValueFromPx(size.width));
    heightInput.value = String(getDisplayValueFromPx(size.height));
    syncScaleFromSize();
  }

  widthInput.addEventListener('input', () => {
    if (!keepRatioInput.checked) return syncScaleFromSize();
    const size = proportionalSizeByWidth(getPxValueFromDisplay(widthInput.value), aspect);
    heightInput.value = String(getDisplayValueFromPx(size.height));
    syncScaleFromSize();
  });

  heightInput.addEventListener('input', () => {
    if (!keepRatioInput.checked) return syncScaleFromSize();
    const size = proportionalSizeByHeight(getPxValueFromDisplay(heightInput.value), aspect);
    widthInput.value = String(getDisplayValueFromPx(size.width));
    syncScaleFromSize();
  });

  scaleInput.addEventListener('input', () => {
    const factor = (Number(scaleInput.value) || 100) / 100;
    setSizeInputs({
      width: recommendedSize.width * factor,
      height: recommendedSize.height * factor
    });
  });

  $('#scaleDownBtn', inspectorContent).addEventListener('click', () => {
    scaleInput.value = String(clamp((Number(scaleInput.value) || 100) - 10, 25, 300));
    scaleInput.dispatchEvent(new Event('input'));
  });

  $('#scaleUpBtn', inspectorContent).addEventListener('click', () => {
    scaleInput.value = String(clamp((Number(scaleInput.value) || 100) + 10, 25, 300));
    scaleInput.dispatchEvent(new Event('input'));
  });

  syncScaleFromSize();

  $('#resetRecommendedSizeBtn', inspectorContent).addEventListener('click', () => {
    const def = state.library.find(item => item.id === el.dataset.typeId);
    if (!def) return;
    recordHistory();
    const size = getRecommendedDisplaySize(def);
    el.dataset.aspect = String(getImageAspect(def));
    el.style.width = `${size.width}px`;
    el.style.height = `${size.height}px`;
    updateComponentVisualMeta(el);
    drawWires();
    showComponentInspector(el);
    setStatus('Tamaño recomendado restaurado', 'success');
  });

  $('#applyProps', inspectorContent).addEventListener('click', () => {
    recordHistory();
    el.dataset.name = $('#propName', inspectorContent).value.trim();
    el.dataset.ref = $('#propRef', inspectorContent).value.trim();
    el.dataset.rotation = $('#propRotation', inspectorContent).value;
    el.dataset.locked = $('#propLocked', inspectorContent).checked ? 'true' : 'false';
    el.dataset.textMode = $('#propTextMode', inspectorContent)?.value || 'both';
    el.dataset.showName = el.dataset.textMode === 'none' ? 'false' : 'true';
    el.dataset.labelLocked = $('#propLabelLocked', inspectorContent).checked ? 'true' : 'false';
    el.dataset.labelOffsetX = String(getPxValueFromDisplay($('#propLabelOffsetX', inspectorContent).value) || 0);
    el.dataset.labelOffsetY = String(getPxValueFromDisplay($('#propLabelOffsetY', inspectorContent).value) || 0);
    el.style.left = `${snapCoordinate(getPxValueFromDisplay($('#propX', inspectorContent).value) || 0)}px`;
    el.style.top = `${snapCoordinate(getPxValueFromDisplay($('#propY', inspectorContent).value) || 0)}px`;
    const nextW = clamp(getPxValueFromDisplay($('#propWidth', inspectorContent).value) || COMPONENT_SIZE.target, 20, 1000);
    const nextH = clamp(getPxValueFromDisplay($('#propHeight', inspectorContent).value) || COMPONENT_SIZE.target, 20, 1000);
    const keepRatio = $('#propKeepRatio', inspectorContent).checked;
    const nextSize = keepRatio ? proportionalSizeByWidth(nextW, Number(el.dataset.aspect) || 1) : { width: nextW, height: nextH };
    el.style.width = `${nextSize.width}px`;
    el.style.height = `${nextSize.height}px`;
    updateComponentVisualMeta(el);
    drawWires();
    showComponentInspector(el);
    setStatus('Propiedades del componente actualizadas', 'success');
  });
}


function activateWireEditing(wireId) {
  state.selectedWireId = wireId;
  state.mode = 'edit-wire';
  if (typeof syncModeButtons === 'function') syncModeButtons();
  if (typeof syncSelectionState === 'function') syncSelectionState('wire', wireId);
  selectedNodeIndex = null;
}
function showWireInspector(id) {
  rememberInspectorOpenSections();
  const wire = state.wires.find(item => item.id === id);
  if (!wire) {
    renderInspectorEmpty('Cable no encontrado');
    return;
  }
  inspectorContent.innerHTML = `
    <div class="inspector-meta">Cable: ${wire.id}</div>

    <details class="inspector-section" open>
      <summary>Cable</summary>
      <div class="inspector-section-body">
        <div class="inspector-group">
          <label for="wireColorProp">Color</label>
          <select id="wireColorProp">${colorOptions(WIRE_COLOR_PRESETS, wire.color || '#2563eb')}<option value="custom" ${WIRE_COLOR_PRESETS[wire.color || '#2563eb'] ? '' : 'selected'}>Personalizado</option></select>
          <input id="wireColorCustomProp" type="color" value="${/^#[0-9a-f]{6}$/i.test(wire.color || '') ? wire.color : '#2563eb'}">
        </div>
        <div class="inspector-group">
          <label for="wireGaugeProp">Calibre / grosor</label>
          <select id="wireGaugeProp">
            ${Object.entries(WIRE_GAUGES).map(([value, config]) => `<option value="${value}" ${normalizeWireGauge(wire.gauge, wire.thickness) === value ? 'selected' : ''}>${config.label}</option>`).join('')}
          </select>
        </div>
        <div class="inspector-group">
          <label for="wireRouteProp">Forma del cable</label>
          <select id="wireRouteProp">
            <option value="free" ${(wire.routeMode || 'orthogonal') === 'free' ? 'selected' : ''}>Libre</option>
            <option value="orthogonal" ${(wire.routeMode || 'orthogonal') === 'orthogonal' ? 'selected' : ''}>90° / ortogonal</option>
          </select>
        </div>
      </div>
    </details>

    <details class="inspector-section" open>
      <summary>Terminales</summary>
      <div class="inspector-section-body">
        <div class="inspector-group">
          <label for="wireTerminalProp">Terminales en puntas</label>
          <select id="wireTerminalProp">
            ${Object.entries(WIRE_TERMINALS).map(([value, config]) => `<option value="${value}" ${normalizeWireTerminal(wire.terminalType) === value ? 'selected' : ''}>${config.label}</option>`).join('')}
          </select>
        </div>
        <div class="inspector-group">
          <label for="wireTerminalColorProp">Color del terminal</label>
          <select id="wireTerminalColorProp">${colorOptions(TERMINAL_COLOR_PRESETS, normalizeTerminalColor(wire.terminalColor))}</select>
        </div>
      </div>
    </details>

    <details class="inspector-section" open>
      <summary>Etiquetas</summary>
      <div class="inspector-section-body">
        <div class="inspector-group">
          <label for="wireLabelProp">Etiqueta del cable</label>
          <input id="wireLabelProp" type="text" value="${xmlEscape(getWireAutoLabel(wire, state.wires.findIndex(item => item.id === wire.id)))}" placeholder="Ej: W01, L1, F1">
        </div>
        <label class="check-row"><input id="wireShowLabelProp" type="checkbox" ${wire.showLabel === false ? '' : 'checked'}> Mostrar etiqueta principal</label>
        <label class="check-row"><input id="wireShowEndpointLabelsProp" type="checkbox" ${wire.showEndpointLabels === false ? '' : 'checked'}> Mostrar rotulado en extremos</label>
        <div class="inspector-group">
          <label for="wireEndpointOffsetProp">Separación rotulado / terminal</label>
          <input id="wireEndpointOffsetProp" type="number" min="0" max="80" step="1" value="${getWireEndpointLabelOffset(wire)}">
          <div class="hint">Aumenta este valor para desplazar la etiqueta sobre el cable y no tapar la férula.</div>
        </div>
        <div class="inspector-group">
          <label for="wireFromLabelProp">Rotulado origen</label>
          <input id="wireFromLabelProp" type="text" value="${xmlEscape(wire.fromLabel || getWireEndpointText(wire, 'from'))}" placeholder="Ej: 2-KM1-13">
        </div>
        <div class="inspector-group">
          <label for="wireToLabelProp">Rotulado destino</label>
          <input id="wireToLabelProp" type="text" value="${xmlEscape(wire.toLabel || getWireEndpointText(wire, 'to'))}" placeholder="Ej: 2-KM1-14">
        </div>
        <button id="autoWireEndpointProps" type="button">Generar rotulado automático</button>
      </div>
    </details>

    <div class="inspector-footer">
      <button id="applyWireProps" type="button">Aplicar al cable</button>
      <button id="closeInspectorBtn" type="button" class="inspector-secondary-button">Cerrar panel</button>
    </div>
  `
  restoreInspectorOpenSections();
  $('#autoWireEndpointProps', inspectorContent)?.addEventListener('click', () => {
    $('#wireFromLabelProp', inspectorContent).value = getWireEndpointText(wire, 'from');
    $('#wireToLabelProp', inspectorContent).value = getWireEndpointText(wire, 'to');
    $('#wireShowEndpointLabelsProp', inspectorContent).checked = true;
  });

  $('#applyWireProps', inspectorContent).addEventListener('click', () => {
    recordHistory();
    const chosenWireColor = $('#wireColorProp', inspectorContent).value;
    wire.color = chosenWireColor === 'custom' ? $('#wireColorCustomProp', inspectorContent).value : chosenWireColor;
    wire.gauge = $('#wireGaugeProp', inspectorContent).value;
    wire.thickness = getWireStroke(wire) >= 5 ? 'thick' : 'thin';
    wire.routeMode = $('#wireRouteProp', inspectorContent).value === 'orthogonal' ? 'orthogonal' : 'free';
    wire.terminalType = normalizeWireTerminal($('#wireTerminalProp', inspectorContent).value);
    wire.terminalColor = normalizeTerminalColor($('#wireTerminalColorProp', inspectorContent).value);
    wire.label = ($('#wireLabelProp', inspectorContent)?.value || '').trim() || getWireAutoLabel(wire, state.wires.findIndex(item => item.id === wire.id));
    wire.showLabel = $('#wireShowLabelProp', inspectorContent)?.checked !== false;
    wire.showEndpointLabels = $('#wireShowEndpointLabelsProp', inspectorContent)?.checked !== false;
    wire.endpointLabelOffset = Math.max(0, Math.min(80, Number($('#wireEndpointOffsetProp', inspectorContent)?.value || state.defaultEndpointLabelOffset)));
    wire.fromLabel = ($('#wireFromLabelProp', inspectorContent)?.value || '').trim() || getWireEndpointText(wire, 'from');
    wire.toLabel = ($('#wireToLabelProp', inspectorContent)?.value || '').trim() || getWireEndpointText(wire, 'to');
    state.currentWireColor = wire.color;
    state.currentWireGauge = wire.gauge;
    state.currentWireThickness = wire.thickness;
    state.currentWireRouteMode = wire.routeMode;
    state.currentWireTerminal = normalizeWireTerminal(wire.terminalType);
    state.currentTerminalColor = normalizeTerminalColor(wire.terminalColor);
    wireFreeBtn?.classList.toggle('active', state.currentWireRouteMode === 'free');
    wireOrthoBtn?.classList.toggle('active', state.currentWireRouteMode === 'orthogonal');
    syncWireColorControls(wire.color);
    if (wireGaugeSelect) wireGaugeSelect.value = wire.gauge;
    if (wireTerminalSelect) wireTerminalSelect.value = state.currentWireTerminal;
    if (terminalColorSelect) terminalColorSelect.value = state.currentTerminalColor;
      state.currentTerminalColor = normalizeTerminalColor(wire.terminalColor);
      if (terminalColorSelect) terminalColorSelect.value = state.currentTerminalColor;
    if (terminalColorSelect) terminalColorSelect.value = state.currentTerminalColor;
    const matching = document.querySelector(`input[name="wireThickness"][value="${wire.thickness}"]`);
    if (matching) matching.checked = true;
    drawWires();
    showWireInspector(id);
    setStatus('Cable actualizado', 'success');
  });
}

function applyViewportTransformNow() {
  viewport.style.transform = `translate3d(${state.panX}px, ${state.panY}px, 0) scale(${state.zoom})`;
  zoomResetBtn.textContent = Math.round(state.zoom * 100) + '%';
}

function updateViewportTransform() {
  if (state.viewportFrame) return;
  state.viewportFrame = requestAnimationFrame(() => {
    state.viewportFrame = null;
    applyViewportTransformNow();
  });
}

function requestDrawWires() {
  if (state.wireDrawFrame) return;
  state.wireDrawFrame = requestAnimationFrame(() => {
    state.wireDrawFrame = null;
    drawWires();
  });
}

function getWorkspacePoint(event) {
  const rect = workspace.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left - state.panX) / state.zoom,
    y: (event.clientY - rect.top - state.panY) / state.zoom
  };
}

function snapCoordinate(value, grid = state.snapGrid, threshold = state.snapThreshold) {
  if (!state.snapEnabled) return value;
  const snapped = Math.round(value / grid) * grid;
  return Math.abs(snapped - value) <= threshold ? snapped : value;
}

function snapPoint(point) {
  return {
    x: snapCoordinate(point.x),
    y: snapCoordinate(point.y)
  };
}

function ensureAlignmentGuides() {
  let vertical = $('#guideVertical');
  let horizontal = $('#guideHorizontal');
  if (!vertical) {
    vertical = document.createElement('div');
    vertical.id = 'guideVertical';
    vertical.className = 'alignment-guide vertical';
    viewport.appendChild(vertical);
  }
  if (!horizontal) {
    horizontal = document.createElement('div');
    horizontal.id = 'guideHorizontal';
    horizontal.className = 'alignment-guide horizontal';
    viewport.appendChild(horizontal);
  }
  return { vertical, horizontal };
}

function hideAlignmentGuides() {
  const vertical = $('#guideVertical');
  const horizontal = $('#guideHorizontal');
  if (vertical) vertical.style.display = 'none';
  if (horizontal) horizontal.style.display = 'none';
}

function applySmartSnapToComponent(item, proposedX, proposedY) {
  if (!state.snapEnabled || !item?.el) return { x: proposedX, y: proposedY };
  const threshold = state.snapThreshold;
  const w = parseFloat(item.el.style.width) || item.el.offsetWidth || 0;
  const h = parseFloat(item.el.style.height) || item.el.offsetHeight || 0;
  const movingIds = new Set((state.dragContext?.origins || []).map(origin => origin.el.dataset.id));
  const candidatesX = [];
  const candidatesY = [];
  $$('.component').forEach(other => {
    if (!other || other === item.el || movingIds.has(other.dataset.id)) return;
    const ox = parseFloat(other.style.left) || 0;
    const oy = parseFloat(other.style.top) || 0;
    const ow = parseFloat(other.style.width) || other.offsetWidth || 0;
    const oh = parseFloat(other.style.height) || other.offsetHeight || 0;
    candidatesX.push(ox, ox + ow / 2, ox + ow);
    candidatesY.push(oy, oy + oh / 2, oy + oh);
  });

  let x = snapCoordinate(proposedX);
  let y = snapCoordinate(proposedY);
  let guideX = null;
  let guideY = null;
  const myXs = [
    { value: proposedX, offset: 0 },
    { value: proposedX + w / 2, offset: w / 2 },
    { value: proposedX + w, offset: w }
  ];
  const myYs = [
    { value: proposedY, offset: 0 },
    { value: proposedY + h / 2, offset: h / 2 },
    { value: proposedY + h, offset: h }
  ];

  for (const mine of myXs) {
    for (const candidate of candidatesX) {
      if (Math.abs(mine.value - candidate) <= threshold) {
        x = candidate - mine.offset;
        guideX = candidate;
        break;
      }
    }
    if (guideX != null) break;
  }
  for (const mine of myYs) {
    for (const candidate of candidatesY) {
      if (Math.abs(mine.value - candidate) <= threshold) {
        y = candidate - mine.offset;
        guideY = candidate;
        break;
      }
    }
    if (guideY != null) break;
  }

  state.guideX = guideX;
  state.guideY = guideY;
  const guides = ensureAlignmentGuides();
  if (guideX != null) {
    guides.vertical.style.left = `${guideX}px`;
    guides.vertical.style.display = 'block';
  } else {
    guides.vertical.style.display = 'none';
  }
  if (guideY != null) {
    guides.horizontal.style.top = `${guideY}px`;
    guides.horizontal.style.display = 'block';
  } else {
    guides.horizontal.style.display = 'none';
  }
  return { x, y };
}

function setSnapEnabled(enabled) {
  state.snapEnabled = !!enabled;
  snapToggleBtn?.classList.toggle('active', state.snapEnabled);
  if (snapToggleBtn) snapToggleBtn.textContent = state.snapEnabled ? 'Snap ON' : 'Snap OFF';
  hideAlignmentGuides();
  setStatus(state.snapEnabled ? 'Snap inteligente activado' : 'Movimiento libre activado', 'success');
}

function setWireRouteMode(mode) {
  state.currentWireRouteMode = mode === 'orthogonal' ? 'orthogonal' : 'free';
  wireFreeBtn?.classList.toggle('active', state.currentWireRouteMode === 'free');
  wireOrthoBtn?.classList.toggle('active', state.currentWireRouteMode === 'orthogonal');
  setStatus(state.currentWireRouteMode === 'free' ? 'Cable libre activado' : 'Cable 90° activado', 'success');
}

function center(port) {
  const geometry = getPortGeometry(port);
  if (geometry) return { x: geometry.x, y: geometry.y };

  const r = port.getBoundingClientRect();
  const v = viewport.getBoundingClientRect();
  return {
    x: (r.left - v.left + r.width / 2) / state.zoom,
    y: (r.top - v.top + r.height / 2) / state.zoom
  };
}

function getPortRef(port) {
  const component = port.closest('.component');
  return { componentId: component.dataset.id, port: port.dataset.port };
}

function findPort(ref) {
  const component = document.querySelector(`[data-id="${ref.componentId}"]`);
  return component ? component.querySelector(`[data-port="${ref.port}"]`) : null;
}

function clearPendingWire() {
  if (state.pendingPort) state.pendingPort.classList.remove('pending');
  state.pendingPort = null;
  state.pendingWaypoints.length = 0;
  state.previewMousePoint = null;
}

function getPendingLastPoint() {
  if (state.pendingWaypoints.length) return state.pendingWaypoints[state.pendingWaypoints.length - 1];
  return state.pendingPort ? center(state.pendingPort) : null;
}

function buildSmoothCadPath(points){
  if(!points || points.length < 2) return '';

  let d = `M ${points[0].x} ${points[0].y}`;

  for(let i=1;i<points.length;i++){
    const prev = points[i-1];
    const curr = points[i];
    const next = points[i+1];

    if(!next){
      d += ` L ${curr.x} ${curr.y}`;
      continue;
    }

    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;

    const len1 = Math.hypot(dx1,dy1);
    const len2 = Math.hypot(dx2,dy2);

    if(len1 < 1 || len2 < 1){
      d += ` L ${curr.x} ${curr.y}`;
      continue;
    }

    const ux1 = dx1 / len1;
    const uy1 = dy1 / len1;
    const ux2 = dx2 / len2;
    const uy2 = dy2 / len2;

    const sameDir = Math.abs(ux1 - ux2) < 0.01 && Math.abs(uy1 - uy2) < 0.01;
    const oppositeDir = Math.abs(ux1 + ux2) < 0.01 && Math.abs(uy1 + uy2) < 0.01;
    if(sameDir || oppositeDir){
      d += ` L ${curr.x} ${curr.y}`;
      continue;
    }

    const geometryRadius = Math.min(len1 / 2, len2 / 2, 12);
    const r = Math.max(5, geometryRadius);

    const p1 = {
      x: curr.x - (dx1 / len1) * r,
      y: curr.y - (dy1 / len1) * r
    };

    const p2 = {
      x: curr.x + (dx2 / len2) * r,
      y: curr.y + (dy2 / len2) * r
    };

    d += ` L ${p1.x} ${p1.y}`;
    d += ` Q ${curr.x} ${curr.y} ${p2.x} ${p2.y}`;
  }

  return d;
}


function computeParallelAutoOffset(wire) {
  if (!wire || (Array.isArray(wire.waypoints) && wire.waypoints.length)) return 0;

  const fromPort = findPort(wire.from);
  const toPort = findPort(wire.to);
  if (!fromPort || !toPort) return 0;

  const startGeometry = getPortGeometry(fromPort);
  const endGeometry = getPortGeometry(toPort);
  if (!startGeometry || !endGeometry) return 0;

  const sameVertical = ['top', 'bottom'].includes(startGeometry.direction) && ['top', 'bottom'].includes(endGeometry.direction);
  const sameHorizontal = ['left', 'right'].includes(startGeometry.direction) && ['left', 'right'].includes(endGeometry.direction);
  if (!sameVertical && !sameHorizontal) return 0;

  const peers = state.wires.filter(other => {
    if (!other || other.id === wire.id) return false;
    if (Array.isArray(other.waypoints) && other.waypoints.length) return false;

    const otherFrom = findPort(other.from);
    const otherTo = findPort(other.to);
    if (!otherFrom || !otherTo) return false;

    const otherStart = getPortGeometry(otherFrom);
    const otherEnd = getPortGeometry(otherTo);
    if (!otherStart || !otherEnd) return false;

    const otherSameVertical = ['top', 'bottom'].includes(otherStart.direction) && ['top', 'bottom'].includes(otherEnd.direction);
    const otherSameHorizontal = ['left', 'right'].includes(otherStart.direction) && ['left', 'right'].includes(otherEnd.direction);

    if (sameVertical !== otherSameVertical || sameHorizontal !== otherSameHorizontal) return false;

    if (sameVertical) {
      return Math.abs(otherStart.y - startGeometry.y) < 120 && Math.abs(otherEnd.y - endGeometry.y) < 120;
    }
    return Math.abs(otherStart.x - startGeometry.x) < 120 && Math.abs(otherEnd.x - endGeometry.x) < 120;
  });

  const group = [wire, ...peers];
  group.sort((a, b) => {
    const aFrom = findPort(a.from), aTo = findPort(a.to);
    const bFrom = findPort(b.from), bTo = findPort(b.to);
    if (!aFrom || !aTo || !bFrom || !bTo) return 0;

    const aStart = getPortGeometry(aFrom), aEnd = getPortGeometry(aTo);
    const bStart = getPortGeometry(bFrom), bEnd = getPortGeometry(bTo);
    if (!aStart || !aEnd || !bStart || !bEnd) return 0;

    if (sameVertical) return Math.min(aStart.x, aEnd.x) - Math.min(bStart.x, bEnd.x);
    return Math.min(aStart.y, aEnd.y) - Math.min(bStart.y, bEnd.y);
  });

  const spacing = 14;
  const index = group.findIndex(item => item.id === wire.id);
  return (index - (group.length - 1) / 2) * spacing;
}

function applyParallelOffsetToRoute(points, wire, axis) {
  const offset = computeParallelAutoOffset(wire);
  if (!offset) return points;

  return points.map(point => {
    if (axis === 'y') return { x: point.x, y: point.y + offset };
    if (axis === 'x') return { x: point.x + offset, y: point.y };
    return { x: point.x, y: point.y };
  });
}

function getWirePoints(wire) {
  const fromPort = findPort(wire.from);
  const toPort = findPort(wire.to);
  if (!fromPort || !toPort) return null;

  const startGeometry = getPortGeometry(fromPort);
  const endGeometry = getPortGeometry(toPort);
  if (!startGeometry || !endGeometry) return null;

  const start = { x: startGeometry.x, y: startGeometry.y };
  const end = { x: endGeometry.x, y: endGeometry.y };
  const startLead = offsetPoint(start, startGeometry.direction, 24);
  const endLead = offsetPoint(end, endGeometry.direction, 24);
  const waypoints = (wire.waypoints || []).map(point => ({ x: point.x, y: point.y }));
  const points = [];

  pushPoint(points, start);
  pushPoint(points, startLead);

  if (waypoints.length) {
    const routeMode = wire.routeMode || 'orthogonal';
    waypoints.forEach(point => {
      if (routeMode === 'free') pushPoint(points, point);
      else pushOrthogonal(points, point);
    });
    if (routeMode === 'free') pushPoint(points, endLead);
    else pushOrthogonal(points, endLead);
  } else {
    let autoRoute = buildSmartRoutePoints(
      startLead,
      endLead,
      startGeometry.direction,
      endGeometry.direction
    );

    const sameVertical = ['top', 'bottom'].includes(startGeometry.direction) && ['top', 'bottom'].includes(endGeometry.direction);
    const sameHorizontal = ['left', 'right'].includes(startGeometry.direction) && ['left', 'right'].includes(endGeometry.direction);

    if (sameVertical) {
      autoRoute = applyParallelOffsetToRoute(autoRoute, wire, 'y');
    } else if (sameHorizontal) {
      autoRoute = applyParallelOffsetToRoute(autoRoute, wire, 'x');
    }

    autoRoute.forEach(point => pushOrthogonal(points, point));
    pushOrthogonal(points, endLead);
  }

  pushPoint(points, end);
  return points;
}

function captureState() {
  return {
    components: $$('.component').map(el => ({
      id: el.dataset.id,
      typeId: el.dataset.typeId,
      x: parseFloat(el.style.left) || 0,
      y: parseFloat(el.style.top) || 0,
      width: Math.round(parseFloat(el.style.width) || el.offsetWidth || COMPONENT_SIZE.target),
      height: Math.round(parseFloat(el.style.height) || el.offsetHeight || COMPONENT_SIZE.target),
      name: el.dataset.name || '',
      ref: el.dataset.ref || '',
      labelOffsetX: Number(el.dataset.labelOffsetX || 0),
      labelOffsetY: Number(el.dataset.labelOffsetY || 0),
      labelLocked: el.dataset.labelLocked || 'false',
      rotation: el.dataset.rotation || '0',
      locked: el.dataset.locked || 'false',
      showName: el.dataset.showName || 'true',
      textMode: getComponentTextMode(el),
      layer: getComponentLayer(el)
    })),
    wires: JSON.parse(JSON.stringify(state.wires)),
    view: { zoom: state.zoom, panX: state.panX, panY: state.panY },
    counters: { componentId: state.componentId, wireId: state.wireId, maxLayer: state.maxLayer }
  };
}

function recordHistory() {
  state.undoStack.push(captureState());
  if (state.undoStack.length > state.maxHistory) state.undoStack.shift();
  state.redoStack.length = 0;
}

function restoreState(snapshot) {
  clearPendingWire();
  state.selectedWireId = null;
  selectedNodeIndex = null;
  state.selectedComponents.clear();
  syncSelectionState(null, null);
  renderInspectorEmpty();
  canvas.innerHTML = '';
  state.wires.length = 0;
  state.componentId = snapshot.counters?.componentId || 0;
  state.wireId = snapshot.counters?.wireId || 0;
  state.maxLayer = snapshot.counters?.maxLayer || 0;
  state.zoom = snapshot.view?.zoom || 1;
  state.panX = snapshot.view?.panX || 0;
  state.panY = snapshot.view?.panY || 0;
  updateViewportTransform();

  (snapshot.components || []).forEach(component => {
    const def = state.libraryMap.get(component.typeId);
    if (def) addComponent(component.typeId ? def : null, {
      instanceId: component.id,
      x: component.x,
      y: component.y,
      width: component.width,
      height: component.height,
      name: component.name,
      ref: component.ref,
      labelOffsetX: component.labelOffsetX || 0,
      labelOffsetY: component.labelOffsetY || 0,
      labelLocked: component.labelLocked || 'false',
      rotation: component.rotation,
      locked: component.locked,
      showName: component.showName,
      textMode: component.textMode,
      layer: component.layer,
      skipHistory: true,
      skipSelection: true
    });
  });

  (snapshot.wires || []).forEach(wire => state.wires.push({
    id: wire.id,
    from: wire.from,
    to: wire.to,
    thickness: wire.thickness || 'thin',
    gauge: normalizeWireGauge(wire.gauge, wire.thickness),
    color: normalizeWireColor(wire.color),
    waypoints: (wire.waypoints || []).map(point => ({ x: point.x, y: point.y })),
    routeMode: wire.routeMode || 'orthogonal',
    terminalType: normalizeWireTerminal(wire.terminalType),
    terminalColor: normalizeTerminalColor(wire.terminalColor),
    label: wire.label || '',
    showLabel: wire.showLabel !== false,
    showEndpointLabels: wire.showEndpointLabels !== false,
    fromLabel: wire.fromLabel || getWireEndpointText(wire, 'from'),
    toLabel: wire.toLabel || getWireEndpointText(wire, 'to'),
    endpointLabelOffset: Number.isFinite(Number(wire.endpointLabelOffset)) ? Number(wire.endpointLabelOffset) : state.defaultEndpointLabelOffset
  }));

  drawWires();
}

function undo() {
  if (!state.undoStack.length) {
    setStatus('No hay cambios para deshacer', 'warning');
    return;
  }
  state.redoStack.push(captureState());
  restoreState(state.undoStack.pop());
  setStatus('Deshacer', 'success');
}

function redo() {
  if (!state.redoStack.length) {
    setStatus('No hay cambios para rehacer', 'warning');
    return;
  }
  state.undoStack.push(captureState());
  restoreState(state.redoStack.pop());
  setStatus('Rehacer', 'success');
}

function changeZoom(factor, clientX = null, clientY = null) {
  const rect = workspace.getBoundingClientRect();
  const mouseX = clientX === null ? rect.width / 2 : clientX - rect.left;
  const mouseY = clientY === null ? rect.height / 2 : clientY - rect.top;
  const worldX = (mouseX - state.panX) / state.zoom;
  const worldY = (mouseY - state.panY) / state.zoom;

  const nextZoom = clamp(state.zoom * factor, 0.4, 3);
  if (Math.abs(nextZoom - state.zoom) < 0.001) return;
  state.zoom = nextZoom;
  state.panX = mouseX - worldX * state.zoom;
  state.panY = mouseY - worldY * state.zoom;
  updateViewportTransform();

  const now = performance.now();
  if (now - state.lastZoomStatusAt > 120) {
    state.lastZoomStatusAt = now;
    setStatus('Zoom ' + Math.round(state.zoom * 100) + '%');
  }
}

function isPanBlockedTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest('.component') ||
    target.closest('.wire-node') ||
    target.closest('.inspector') ||
    target.closest('.library-drawer') ||
    target.closest('.top-toolbar') ||
    target.closest('button') ||
    target.closest('input') ||
    target.closest('select') ||
    target.closest('textarea') ||
    target.closest('path')
  );
}

function isWorkspaceBackgroundTarget(target) {
  if (!(target instanceof Element)) return false;
  if (isPanBlockedTarget(target)) return false;
  return target === workspace || target === viewport || target === canvas || target === wires || target.id === 'wires';
}

function canStartPan(event) {
  if (isPanBlockedTarget(event.target)) return false;
  if (event.button === 1 || state.spacePressed) return true;
  // Pan normal: click izquierdo sostenido sobre un espacio vacío del tablero.
  return event.button === 0 && (state.mode === 'select' || state.mode === 'pan') && isWorkspaceBackgroundTarget(event.target);
}

function startPan(event, source = 'mouse') {
  state.panState = {
    startX: event.clientX,
    startY: event.clientY,
    lastX: event.clientX,
    lastY: event.clientY,
    moved: false,
    source
  };
}

function updatePan(clientX, clientY) {
  if (!state.panState) return;
  const dx0 = clientX - state.panState.startX;
  const dy0 = clientY - state.panState.startY;
  if (!state.panState.moved && Math.hypot(dx0, dy0) > 4) {
    state.panState.moved = true;
    workspace.classList.add('panning');
  }
  if (state.panState.moved) {
    state.panX += clientX - state.panState.lastX;
    state.panY += clientY - state.panState.lastY;
    state.panState.lastX = clientX;
    state.panState.lastY = clientY;
    updateViewportTransform();
  }
}

function endPan() {
  if (!state.panState) return;
  if (state.panState.moved) {
    state.suppressWorkspaceClick = true;
    setTimeout(() => { state.suppressWorkspaceClick = false; }, 80);
  }
  workspace.classList.remove('panning');
  state.panState = null;
}

function touchDistance(touches) {
  const a = touches[0];
  const b = touches[1];
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

function touchCenter(touches) {
  const a = touches[0];
  const b = touches[1];
  return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
}

function startPinchZoom(event) {
  const center = touchCenter(event.touches);
  const rect = workspace.getBoundingClientRect();
  const localX = center.x - rect.left;
  const localY = center.y - rect.top;
  state.pinchState = {
    distance: Math.max(1, touchDistance(event.touches)),
    startZoom: state.zoom,
    worldX: (localX - state.panX) / state.zoom,
    worldY: (localY - state.panY) / state.zoom
  };
}

function updatePinchZoom(event) {
  if (!state.pinchState || event.touches.length < 2) return;
  const center = touchCenter(event.touches);
  const rect = workspace.getBoundingClientRect();
  const localX = center.x - rect.left;
  const localY = center.y - rect.top;
  const factor = touchDistance(event.touches) / Math.max(state.pinchState.distance, 1);
  state.zoom = clamp(state.pinchState.startZoom * factor, 0.25, 3.5);
  state.panX = localX - state.pinchState.worldX * state.zoom;
  state.panY = localY - state.pinchState.worldY * state.zoom;
  updateViewportTransform();
}

function setMode(newMode) {
  state.mode = newMode;
  selectModeBtn.classList.toggle('active', state.mode === 'select');
  panModeBtn?.classList.toggle('active', state.mode === 'pan');
  wireModeBtn.classList.toggle('active', state.mode === 'wire');
  editWireModeBtn.classList.toggle('active', state.mode === 'edit-wire');
  deleteWireModeBtn.classList.toggle('active', state.mode === 'delete-wire');
  deleteBtn.classList.toggle('danger', true);
  workspace.classList.toggle('connect-mode', state.mode === 'wire');
  workspace.classList.toggle('pan-mode', state.mode === 'pan');

  if (state.mode !== 'wire') clearPendingWire();
  if (state.mode !== 'select') {
    $$('.component').forEach(component => component.classList.remove('selected'));
    state.selectedComponents.clear();
    if (state.selected?.type === 'component') {
      syncSelectionState(null, null);
      renderInspectorEmpty();
    }
  }

  drawWires();
  const labelMap = {
    select: 'mover',
    wire: 'conectar',
    'edit-wire': 'editar cable',
    'delete-wire': 'borrar cable'
  };
  setStatus('Modo: ' + labelMap[state.mode]);
}


function normalizeLibraryComponent(component) {
  if (!component || !component.id) return null;
  return {
    id: component.id,
    fileName: component.fileName || component.id,
    name: component.name || component.fileName || component.id,
    width: Number(component.width) || 120,
    height: Number(component.height) || 120,
    category: component.category || 'General',
    image: component.image || '',
    terminals: Array.isArray(component.terminals) ? component.terminals : []
  };
}

function upsertLibraryComponent(component, { render = true, persist = false } = {}) {
  const normalized = normalizeLibraryComponent(component);
  if (!normalized) return null;
  state.libraryMap.set(normalized.id, normalized);
  const existingIndex = state.library.findIndex(item => item.id === normalized.id);
  if (existingIndex >= 0) state.library[existingIndex] = normalized;
  else state.library.push(normalized);
  if (render) renderLibrary();
  if (persist) persistLibraryComponent(normalized);
  return normalized;
}

function openLibraryDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB no disponible'));
      return;
    }
    const request = indexedDB.open(LIBRARY_DB_NAME, LIBRARY_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(LIBRARY_STORE)) {
        db.createObjectStore(LIBRARY_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function persistLibraryComponent(component) {
  try {
    const db = await openLibraryDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(LIBRARY_STORE, 'readwrite');
      tx.objectStore(LIBRARY_STORE).put(component);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (error) {
    console.warn('No se pudo guardar la biblioteca local:', error);
    setStatus('Componente cargado, pero no se pudo persistir localmente', 'warning');
  }
}

async function restorePersistentLibrary() {
  try {
    const db = await openLibraryDB();
    const components = await new Promise((resolve, reject) => {
      const tx = db.transaction(LIBRARY_STORE, 'readonly');
      const request = tx.objectStore(LIBRARY_STORE).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    db.close();
    components.forEach(component => upsertLibraryComponent(component, { render: false, persist: false }));
    renderLibrary();
    if (components.length) setStatus(`Biblioteca restaurada: ${components.length} componente(s)`, 'success');
  } catch (error) {
    console.warn('No se pudo restaurar la biblioteca local:', error);
    renderLibrary();
  }
}

function getEmbeddedProjectLibrary(data) {
  if (Array.isArray(data?.embeddedLibrary)) return data.embeddedLibrary;
  if (Array.isArray(data?.libraryFull)) return data.libraryFull;
  return [];
}

async function importEmbeddedLibrary(data) {
  const embedded = getEmbeddedProjectLibrary(data);
  let imported = 0;
  embedded.forEach(component => {
    if (upsertLibraryComponent(component, { render: false, persist: true })) imported += 1;
  });
  if (imported) renderLibrary();
  return imported;
}

async function handleFiles(event) {
  const files = [...event.target.files];
  for (const file of files) {
    await loadEvcFile(file, false);
  }
  renderLibrary();
  event.target.value = '';
}

async function loadEvcFile(file, rerender = true) {
  try {
    const zip = await JSZip.loadAsync(file);
    const manifest = zip.file('component.json');
    const imageFile = zip.file('original.png') || zip.file('preview.png');

    if (!manifest || !imageFile) throw new Error('Archivo EVC incompleto');

    const json = JSON.parse(await manifest.async('string'));
    const base64 = await imageFile.async('base64');
    const id = json.id || file.name;
    const component = {
      id,
      fileName: file.name,
      name: json.name || file.name,
      width: json.graphics?.size?.width || 120,
      height: json.graphics?.size?.height || 120,
      category: json.category || 'General',
      image: 'data:image/png;base64,' + base64,
      terminals: Array.isArray(json.terminals) ? json.terminals : []
    };

    upsertLibraryComponent(component, { render: rerender, persist: true });
  } catch (error) {
    console.error(error);
    alert('No se pudo leer ' + file.name + '. Verifica que contenga component.json y una imagen válida.');
  }
}

function getFamilyKey(def) {
  const text = `${def.name || ''} ${def.category || ''}`.toLowerCase();
  if (text.includes('contactor')) return 'contactor';
  if (text.includes('relé térmico') || text.includes('rele termico') || text.includes('térmico') || text.includes('termico')) return 'thermal';
  if (text.includes('relé') || text.includes('rele') || text.includes('relay')) return 'relay';
  if (text.includes('guardamotor')) return 'guardamotor';
  if (text.includes('motor')) return 'motor';
  if (text.includes('piloto') || text.includes('led') || text.includes('foco')) return 'pilot';
  if (text.includes('pulsador') || text.includes('emergencia') || text.includes('parada')) return 'pushbutton';
  if (text.includes('barra')) return 'bar';
  if (text.includes('riel') || text.includes('din rail') || text.includes('rail din')) return 'rail';
  if (text.includes('canaleta') || text.includes('ducto') || text.includes('canal')) return 'duct';
  if (text.includes('power supply') || text.includes('fuente')) return 'supply';
  if (text.includes('itm') || text.includes('id ')) return 'breaker';
  if (text.includes('tomacorriente')) return 'socket';
  return 'generic';
}

function fitInsideBox(sourceW, sourceH, boxW, boxH) {
  const safeW = Number(sourceW) > 0 ? Number(sourceW) : COMPONENT_SIZE.target;
  const safeH = Number(sourceH) > 0 ? Number(sourceH) : COMPONENT_SIZE.target;
  const scale = Math.min(boxW / safeW, boxH / safeH);
  return {
    width: safeW * scale,
    height: safeH * scale
  };
}

function getImageAspect(def) {
  const w = Number(def?.width) || COMPONENT_SIZE.target;
  const h = Number(def?.height) || COMPONENT_SIZE.target;
  return w > 0 && h > 0 ? w / h : 1;
}

function proportionalSizeByWidth(width, aspect) {
  const safeAspect = Number(aspect) > 0 ? Number(aspect) : 1;
  const w = clamp(Math.round(Number(width) || COMPONENT_SIZE.target), COMPONENT_SIZE.canvasMin, COMPONENT_SIZE.canvasMax);
  const h = clamp(Math.round(w / safeAspect), COMPONENT_SIZE.canvasMin, COMPONENT_SIZE.canvasMax);
  return { width: w, height: h };
}

function proportionalSizeByHeight(height, aspect) {
  const safeAspect = Number(aspect) > 0 ? Number(aspect) : 1;
  const h = clamp(Math.round(Number(height) || COMPONENT_SIZE.target), COMPONENT_SIZE.canvasMin, COMPONENT_SIZE.canvasMax);
  const w = clamp(Math.round(h * safeAspect), COMPONENT_SIZE.canvasMin, COMPONENT_SIZE.canvasMax);
  return { width: w, height: h };
}

function getRecommendedDisplaySize(def) {
  const sourceW = Number(def?.width) || COMPONENT_SIZE.target;
  const sourceH = Number(def?.height) || COMPONENT_SIZE.target;
  const longestSide = Math.max(sourceW, sourceH) || COMPONENT_SIZE.target;
  const family = getFamilyKey(def || {});
  const preset = SIZE_PRESETS[family] || SIZE_PRESETS.generic;

  // Siempre escalamos por un solo factor. Así se mantiene la relación de aspecto
  // y ninguna imagen queda deformada aunque el archivo original sea grande o pequeño.
  const targetSide = clamp(preset.target || COMPONENT_SIZE.target, preset.min || COMPONENT_SIZE.min, preset.max || COMPONENT_SIZE.max);
  const scale = targetSide / longestSide;
  return {
    width: Math.round(clamp(sourceW * scale, COMPONENT_SIZE.canvasMin, COMPONENT_SIZE.canvasMax)),
    height: Math.round(clamp(sourceH * scale, COMPONENT_SIZE.canvasMin, COMPONENT_SIZE.canvasMax))
  };
}

function computeDisplaySize(def, savedSize = null) {
  // Si el proyecto guardado o el usuario ya tiene tamaño, se respeta siempre.
  const savedW = Number(savedSize?.width);
  const savedH = Number(savedSize?.height);
  if (savedW > 0 && savedH > 0) {
    return {
      width: Math.round(clamp(savedW, COMPONENT_SIZE.canvasMin, COMPONENT_SIZE.canvasMax)),
      height: Math.round(clamp(savedH, COMPONENT_SIZE.canvasMin, COMPONENT_SIZE.canvasMax))
    };
  }

  // Tamaño inicial recomendado por tipo. Evita depender demasiado del tamaño real
  // de la imagen subida y mantiene la proporción sin deformar.
  return getRecommendedDisplaySize(def);
}

function updateLibraryCount() {
  if (libraryCount) libraryCount.textContent = String(state.library.length);
}

function openLibraryDrawer() {
  libraryDrawer?.classList.add('open');
  drawerBackdrop?.classList.add('open');
}

function closeLibraryDrawer() {
  libraryDrawer?.classList.remove('open');
  drawerBackdrop?.classList.remove('open');
}

function getVisibleWorkspaceCenterPoint() {
  const rect = workspace.getBoundingClientRect();
  const clientX = rect.left + rect.width / 2;
  const clientY = rect.top + rect.height / 2;
  return snapPoint({
    x: (clientX - rect.left - state.panX) / state.zoom,
    y: (clientY - rect.top - state.panY) / state.zoom
  });
}

function insertComponentFromLibrary(componentOrTypeId) {
  const component = typeof componentOrTypeId === 'string'
    ? state.libraryMap.get(componentOrTypeId)
    : componentOrTypeId;

  if (!component) {
    setStatus('No se encontro el componente en la biblioteca', 'error');
    return;
  }

  try {
    // Insertar siempre en el centro visible del tablero.
    // Esto evita que el componente se cree fuera de la vista cuando hay zoom/paneo/tablero grande.
    const point = getVisibleWorkspaceCenterPoint();
    const size = computeDisplaySize(component);
    const created = addComponent(component, {
      x: Math.max(0, point.x - size.width / 2),
      y: Math.max(0, point.y - size.height / 2)
    });

    if (created) {
      closeLibraryDrawer();
      selectComponent(created);
      drawWires();
      setStatus('Componente insertado desde biblioteca', 'success');
    } else {
      setStatus('No se pudo insertar el componente', 'error');
    }
  } catch (error) {
    console.error('Error insertando componente:', error);
    setStatus('Error insertando componente. Revisa la consola.', 'error');
  }
}

function renderLibrary() {
  libraryList.innerHTML = '';
  updateLibraryCount();
  state.library.forEach(component => {
    const div = document.createElement('div');
    div.className = 'library-item';
    div.draggable = true;
    div.dataset.typeId = component.id;
    div.innerHTML = `
      <img src="${component.image}" alt="${component.name}">
      <strong>${component.name}</strong>
      <small>${component.category} · ${component.terminals.length} bornes</small>
      <button type="button" data-action="insert-library" data-type-id="${component.id}">Insertar</button>
    `;
    const insertBtn = $('button[data-action="insert-library"]', div);
    insertBtn.addEventListener('pointerdown', event => event.stopPropagation());
    insertBtn.addEventListener('mousedown', event => event.stopPropagation());
    insertBtn.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      insertComponentFromLibrary(component.id);
    });
    div.addEventListener('dragstart', event => {
      event.dataTransfer.setData('text/plain', component.id);
      event.dataTransfer.effectAllowed = 'copy';
    });
    libraryList.appendChild(div);
  });
}

function getLabelOffset(direction) {
  switch (direction) {
    case 'top': return { x: -10, y: -22 };
    case 'bottom': return { x: -10, y: 12 };
    case 'left': return { x: -28, y: -8 };
    case 'right': return { x: 12, y: -8 };
    default: return { x: -10, y: -22 };
  }
}


function rotateNormalizedPoint(nx, ny, rotation, width = 1, height = 1) {
  const angle = ((((parseInt(rotation || '0', 10) || 0) % 360) + 360) % 360) * Math.PI / 180;
  const x = nx * width;
  const y = ny * height;
  const cx = width / 2;
  const cy = height / 2;
  const dx = x - cx;
  const dy = y - cy;
  const rx = dx * Math.cos(angle) - dy * Math.sin(angle);
  const ry = dx * Math.sin(angle) + dy * Math.cos(angle);
  return {
    x: cx + rx,
    y: cy + ry
  };
}

function rotateDirection(direction, rotation) {
  const dirs = ['top', 'right', 'bottom', 'left'];
  const current = dirs.indexOf(String(direction || 'top').toLowerCase());
  const turns = ((((parseInt(rotation || '0', 10) || 0) % 360) + 360) % 360) / 90;
  return dirs[(current + turns + 4) % 4] || 'top';
}

function getPortGeometry(port) {
  const component = port?.closest('.component');
  if (!component) return null;

  const portRect = port.getBoundingClientRect();
  const viewportRect = viewport.getBoundingClientRect();
  const rotation = parseInt(component.dataset.rotation || '0', 10) || 0;

  return {
    component,
    x: (portRect.left - viewportRect.left + portRect.width / 2) / state.zoom,
    y: (portRect.top - viewportRect.top + portRect.height / 2) / state.zoom,
    direction: rotateDirection(port.dataset.direction || 'top', rotation)
  };
}

function offsetPoint(point, direction, distance = 18) {
  if (!point) return null;
  switch (direction) {
    case 'top': return { x: point.x, y: point.y - distance };
    case 'bottom': return { x: point.x, y: point.y + distance };
    case 'left': return { x: point.x - distance, y: point.y };
    case 'right': return { x: point.x + distance, y: point.y };
    default: return { x: point.x, y: point.y };
  }
}

function pushPoint(points, point) {
  if (!point) return;
  const last = points[points.length - 1];
  if (!last || last.x !== point.x || last.y !== point.y) points.push(point);
}

function pushOrthogonal(points, target) {
  if (!target) return;
  const last = points[points.length - 1];
  if (!last) {
    points.push(target);
    return;
  }
  if (last.x !== target.x && last.y !== target.y) {
    const dx = Math.abs(target.x - last.x);
    const dy = Math.abs(target.y - last.y);
    pushPoint(points, dx >= dy ? { x: target.x, y: last.y } : { x: last.x, y: target.y });
  }
  pushPoint(points, target);
}

function addComponent(def, options = {}) {
  if (!def) return;
  if (!options.skipHistory) recordHistory();

  const numericId = ++state.componentId;
  const id = options.instanceId || ('cmp_' + numericId);
  const el = document.createElement('div');
  el.className = 'component';
  el.dataset.id = id;
  el.dataset.typeId = def.id;
  el.style.left = (options.x ?? 200) + 'px';
  el.style.top = (options.y ?? 150) + 'px';

  const size = computeDisplaySize(def, { width: options.width, height: options.height });
  el.style.width = size.width + 'px';
  el.style.height = size.height + 'px';
  el.dataset.aspect = String(getImageAspect(def));

  el.dataset.name = options.name ?? def.name ?? '';
  el.dataset.ref = options.ref ?? getNextDeviceRef(classifyDevicePrefix(def));
  el.dataset.labelOffsetX = String(options.labelOffsetX ?? 0);
  el.dataset.labelOffsetY = String(options.labelOffsetY ?? 0);
  el.dataset.labelLocked = options.labelLocked ?? 'false';
  el.dataset.rotation = options.rotation ?? '0';
  el.dataset.locked = options.locked ?? 'false';
  el.dataset.textMode = options.textMode ?? ((options.showName ?? 'true') === 'true' ? 'both' : 'none');
  el.dataset.showName = el.dataset.textMode === 'none' ? 'false' : 'true';
  applyComponentLayer(el, options.layer ?? ++state.maxLayer);

  const img = document.createElement('img');
  img.src = def.image;
  img.alt = def.name;
  el.appendChild(img);

  const nameTag = document.createElement('div');
  nameTag.className = 'component-name-tag';
  nameTag.addEventListener('mousedown', event => startComponentLabelDrag(event, el, 'name'));
  el.appendChild(nameTag);

  const refTag = document.createElement('div');
  refTag.className = 'component-ref-tag';
  refTag.addEventListener('mousedown', event => startComponentLabelDrag(event, el, 'ref'));
  el.appendChild(refTag);

  const resizeHandle = document.createElement('div');
  resizeHandle.className = 'resize-handle';
  resizeHandle.title = 'Arrastra para escalar proporcionalmente';
  resizeHandle.addEventListener('mousedown', event => startComponentResize(event, el));
  el.appendChild(resizeHandle);

  def.terminals.forEach(terminal => {
    const x = terminal.nx ?? terminal.position?.nx ?? 0.5;
    const y = terminal.ny ?? terminal.position?.ny ?? 0.5;
    const direction = String(terminal.direction ?? terminal.position?.direction ?? 'top').toLowerCase();

    const port = document.createElement('div');
    port.className = 'port';
    port.dataset.port = terminal.id;
    port.dataset.signal = terminal.signal || 'Control';
    port.dataset.nx = String(x);
    port.dataset.ny = String(y);
    port.dataset.direction = direction;
    port.style.left = `${x * 100}%`;
    port.style.top = `${y * 100}%`;
    port.style.transform = 'translate(-50%, -50%)';
    port.title = terminal.label || terminal.id;
    port.addEventListener('click', event => {
      event.stopPropagation();
      if (state.mode !== 'wire') return;
      connectPort(port);
    });
    el.appendChild(port);

    const label = document.createElement('div');
    label.className = 'label';
    label.dataset.labelFor = terminal.id;
    label.dataset.baseDirection = direction;
    label.innerText = terminal.label || terminal.id;
    const offset = getLabelOffset(direction);
    label.style.left = `calc(${x * 100}% + ${offset.x}px)`;
    label.style.top = `calc(${y * 100}% + ${offset.y}px)`;
    el.appendChild(label);
  });

  el.addEventListener('mousedown', event => {
    if (event.button !== 0) return;
    if (state.mode === 'delete-wire') return;
    if (event.target.closest('.port') || event.target.closest('.resize-handle') || event.target.closest('.component-name-tag') || event.target.closest('.component-ref-tag')) return;
    selectComponent(el, event.shiftKey);
    if (el.dataset.locked === 'true') {
      setStatus('Componente bloqueado', 'warning');
      return;
    }
    startComponentDrag(event, el);
  });

  canvas.appendChild(el);
  updateComponentVisualMeta(el);
  if (!options.skipSelection) selectComponent(el);

  const match = id.match(/(\d+)$/);
  if (match) state.componentId = Math.max(state.componentId, Number(match[1]));
  drawWires();
  return el;
}


function startComponentResize(event, el) {
  if (event.button !== 0) return;
  if (el.dataset.locked === 'true') {
    setStatus('Componente bloqueado', 'warning');
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  recordHistory();
  selectComponent(el, event.shiftKey);
  const startW = parseFloat(el.style.width) || el.offsetWidth || COMPONENT_SIZE.target;
  const startH = parseFloat(el.style.height) || el.offsetHeight || COMPONENT_SIZE.target;
  state.resizeContext = {
    el,
    startX: event.clientX,
    startY: event.clientY,
    startW,
    startH,
    aspect: Number(el.dataset.aspect) || (startW / Math.max(startH, 1)) || 1
  };
}

function startComponentDrag(event, el) {
  const dragTargets = getSelectedComponents().length ? getSelectedComponents() : [el];
  state.dragContext = {
    el,
    startX: event.clientX,
    startY: event.clientY,
    origins: dragTargets.map(target => ({
      el: target,
      x: parseFloat(target.style.left) || 0,
      y: parseFloat(target.style.top) || 0
    })),
    moved: false,
    snapshotSaved: false
  };
}

function connectPort(port) {
  if (!state.pendingPort) {
    state.pendingPort = port;
    state.pendingPort.classList.add('pending');
    state.pendingWaypoints.length = 0;
    state.previewMousePoint = null;
    setStatus('Conectando desde ' + port.dataset.port + '. Haz clic en el tablero para crear quiebres.');
    drawWires();
    return;
  }

  if (state.pendingPort === port) {
    clearPendingWire();
    drawWires();
    setStatus('Conexión cancelada', 'warning');
    return;
  }

  recordHistory();
  state.wireId += 1;
  const id = 'wire_' + state.wireId;
  const newWire = {
    id,
    from: getPortRef(state.pendingPort),
    to: getPortRef(port),
    thickness: state.currentWireThickness,
    gauge: normalizeWireGauge(state.currentWireGauge, state.currentWireThickness),
    color: state.currentWireColor,
    waypoints: state.pendingWaypoints.map(point => ({ x: point.x, y: point.y })),
    routeMode: state.currentWireRouteMode,
    terminalType: normalizeWireTerminal(state.currentWireTerminal),
    terminalColor: normalizeTerminalColor(state.currentTerminalColor),
    label: 'W' + String(state.wireId).padStart(2, '0'),
    showLabel: true,
    showEndpointLabels: true,
    endpointLabelOffset: state.defaultEndpointLabelOffset,
    fromLabel: '',
    toLabel: ''
  };
  newWire.fromLabel = getWireEndpointText(newWire, 'from');
  newWire.toLabel = getWireEndpointText(newWire, 'to');
  state.wires.push(newWire);

  state.selectedWireId = id;
  selectedNodeIndex = null;
  syncSelectionState('wire', id);
  clearPendingWire();
  drawWires();
  showWireInspector(id);
  setStatus('Conexión creada', 'success');
}

function addWaypoint(point) {
  const lastPoint = getPendingLastPoint();
  let nextPoint = snapPoint(point);
  if (state.currentWireRouteMode === 'orthogonal' && lastPoint) {
    const dx = Math.abs(nextPoint.x - lastPoint.x);
    const dy = Math.abs(nextPoint.y - lastPoint.y);
    nextPoint = dx >= dy ? { x: nextPoint.x, y: lastPoint.y } : { x: lastPoint.x, y: nextPoint.y };
  }
  state.pendingWaypoints.push(nextPoint);
  state.previewMousePoint = nextPoint;
  drawWires();
  setStatus(state.currentWireRouteMode === 'free' ? 'Nodo libre agregado' : 'Quiebre 90° agregado');
}

function drawPreviewWire() {
  if (state.mode !== 'wire' || !state.pendingPort) return;

  const startGeometry = getPortGeometry(state.pendingPort);
  const start = center(state.pendingPort);
  const points = [start];
  if (startGeometry) pushPoint(points, offsetPoint(start, startGeometry.direction, 18));
  state.pendingWaypoints.forEach(point => {
    if (state.currentWireRouteMode === 'orthogonal') pushOrthogonal(points, { x: point.x, y: point.y });
    else pushPoint(points, { x: point.x, y: point.y });
  });
  if (state.previewMousePoint) {
    const previewPoint = snapPoint(state.previewMousePoint);
    if (state.currentWireRouteMode === 'orthogonal') pushOrthogonal(points, previewPoint);
    else pushPoint(points, previewPoint);
  }

  if (points.length < 2) return;

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', buildSmoothCadPath(points));
  path.setAttribute('stroke', state.currentWireColor);
  path.setAttribute('stroke-width', getWireStroke(state.currentWireGauge));
  path.setAttribute('fill', 'none');
  path.setAttribute('class', 'preview-segment');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  wiresSvg.appendChild(path);
}


function distancePointToSegment(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) {
    const ddx = p.x - a.x;
    const ddy = p.y - a.y;
    return Math.hypot(ddx, ddy);
  }
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
  const proj = { x: a.x + t * dx, y: a.y + t * dy };
  return Math.hypot(p.x - proj.x, p.y - proj.y);
}

function projectPointToSegment(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) return { x: a.x, y: a.y };
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
  return { x: a.x + t * dx, y: a.y + t * dy };
}

function createNodeOnSelectedWire(mousePoint) {
  const wire = state.wires.find(w => w.id === state.selectedWireId);
  if (!wire) {
    setStatus('Selecciona un cable primero', 'warning');
    return;
  }

  const points = getWirePoints(wire);
  if (!points || points.length < 2) return;

  let bestSegmentIndex = -1;
  let bestDistance = Infinity;
  let bestPoint = null;

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const d = distancePointToSegment(mousePoint, a, b);
    if (d < bestDistance) {
      bestDistance = d;
      bestSegmentIndex = i;
      bestPoint = projectPointToSegment(mousePoint, a, b);
    }
  }

  if (bestSegmentIndex < 0 || !bestPoint) return;

  if (!Array.isArray(wire.waypoints)) wire.waypoints = [];

  // Convert segment index from full rendered path to waypoint insertion index
  // path layout: start, optional lead, ...waypoints, optional lead, end
  let insertAt = 0;
  if (bestSegmentIndex <= 1) {
    insertAt = 0;
  } else {
    insertAt = Math.min(bestSegmentIndex - 1, wire.waypoints.length);
  }

  recordHistory();
  wire.waypoints.splice(insertAt, 0, bestPoint);
  selectedNodeIndex = insertAt;
  drawWires();
  showWireInspector(wire.id);
  setStatus('Nodo creado', 'success');
}

function deleteSelectedNode() {
  const wire = state.wires.find(w => w.id === state.selectedWireId);
  if (!wire || selectedNodeIndex == null || !Array.isArray(wire.waypoints)) {
    setStatus('Selecciona un nodo primero', 'warning');
    return;
  }
  if (selectedNodeIndex < 0 || selectedNodeIndex >= wire.waypoints.length) {
    setStatus('Selecciona un nodo válido', 'warning');
    return;
  }

  recordHistory();
  wire.waypoints.splice(selectedNodeIndex, 1);
  selectedNodeIndex = null;
  drawWires();
  showWireInspector(wire.id);
  setStatus('Nodo eliminado', 'success');
}


function getEndpointAngle(point, neighbor) {
  if (!point || !neighbor) return 0;
  return Math.atan2(point.y - neighbor.y, point.x - neighbor.x) * 180 / Math.PI;
}

function createWireTerminalElement(point, neighbor, wire) {
  const type = normalizeWireTerminal(wire.terminalType || 'ferrule');
  if (type === 'none' || !point || !neighbor) return null;

  const fillColor = normalizeTerminalColor(wire.terminalColor);
  const metrics = getTerminalMetrics(wire);
  const stroke = metrics.stroke;
  const unitX = neighbor.x - point.x;
  const unitY = neighbor.y - point.y;
  const angle = Math.atan2(unitY, unitX) * 180 / Math.PI;
  const length = metrics.ferruleLength;
  const width = metrics.ferruleWidth;
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('class', 'wire-terminal wire-terminal-' + type);
  group.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${angle})`);
  group.style.pointerEvents = 'none';

  const outline = '#1f2937';
  if (type === 'dot') {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(length * 0.35));
    circle.setAttribute('cy', '0');
    circle.setAttribute('r', String(metrics.dotRadius));
    circle.setAttribute('fill', fillColor);
    circle.setAttribute('stroke', outline);
    circle.setAttribute('stroke-width', '1.5');
    group.appendChild(circle);
    return group;
  }

  if (type === 'ring') {
    const outer = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    outer.setAttribute('cx', String(length * 0.45));
    outer.setAttribute('cy', '0');
    outer.setAttribute('r', String(metrics.ringRadius));
    outer.setAttribute('fill', fillColor);
    outer.setAttribute('stroke', outline);
    outer.setAttribute('stroke-width', '1.5');
    group.appendChild(outer);
    const inner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    inner.setAttribute('cx', String(length * 0.45));
    inner.setAttribute('cy', '0');
    inner.setAttribute('r', String(Math.max(1.8, metrics.ringRadius * 0.42))); 
    inner.setAttribute('fill', '#ffffff');
    inner.setAttribute('stroke', outline);
    inner.setAttribute('stroke-width', '1');
    group.appendChild(inner);
    return group;
  }

  if (type === 'ferrule') {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', String(-width / 2));
    rect.setAttribute('width', String(length));
    rect.setAttribute('height', String(width));
    rect.setAttribute('rx', String(metrics.ferruleRx));
    rect.setAttribute('fill', fillColor);
    rect.setAttribute('stroke', outline);
    rect.setAttribute('stroke-width', String(metrics.ferruleStrokeWidth));
    group.appendChild(rect);
    return group;
  }

  if (type === 'fork') {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M 0 ${-width/2} L ${length} ${-width/2} M 0 ${width/2} L ${length} ${width/2} M 0 ${-width/2} L 0 ${width/2}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', fillColor);
    path.setAttribute('stroke-width', String(Math.max(3, stroke)));
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    group.appendChild(path);
    return group;
  }

  return null;
}

function buildEndpointLabelSvg(point, neighbor, wire, text) {
  if (!text || !point || !neighbor) return '';
  const pos = getEndpointLabelPosition(point, neighbor, wire);
  if (!pos) return '';
  return buildSvgLabel(text, pos.x, pos.y, { className: 'wire-label-endpoint', fontSize: 8, bold: true, fill: '#ffffff', stroke: '#475569', strokeWidth: 0.55, textColor: '#111827', paddingX: 3, paddingY: 1, rotate: -90 });
}

function appendWireTerminals(fragment, points, wire) {
  if (!points || points.length < 2) return;
  const startTerminal = createWireTerminalElement(points[0], points[1], wire);
  const endTerminal = createWireTerminalElement(points[points.length - 1], points[points.length - 2], wire);
  if (startTerminal) fragment.appendChild(startTerminal);
  if (endTerminal) fragment.appendChild(endTerminal);
}


function getWireEndpointLabelOffset(wire) {
  const value = Number(wire?.endpointLabelOffset);
  if (Number.isFinite(value) && value >= 0) return value;
  return state.defaultEndpointLabelOffset;
}

function getEndpointLabelPosition(point, neighbor, wire) {
  if (!point || !neighbor) return null;
  const dx = neighbor.x - point.x;
  const dy = neighbor.y - point.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const metrics = getTerminalMetrics(wire);
  // Se desplaza sobre el cable, después de la férula/terminal, para no taparla.
  const distance = Math.max(18, metrics.ferruleLength + getWireEndpointLabelOffset(wire));
  return { x: point.x + ux * distance, y: point.y + uy * distance, rotate: -90 };
}

function appendWireEndpointLabels(fragment, points, wire) {
  if (!state.showWireLabels || wire.showEndpointLabels === false || !points || points.length < 2) return;
  const startText = wire.fromLabel || getWireEndpointText(wire, 'from');
  const endText = wire.toLabel || getWireEndpointText(wire, 'to');
  const startPos = getEndpointLabelPosition(points[0], points[1], wire);
  const endPos = getEndpointLabelPosition(points[points.length - 1], points[points.length - 2], wire);
  const options = { className: 'wire-label-endpoint', fontSize: 8, bold: true, fill: '#ffffff', stroke: '#475569', strokeWidth: 0.55, textColor: '#111827', paddingX: 3, paddingY: 1, rotate: -90 };
  if (startText && startPos) fragment.appendChild(makeSvgTextLabel(startText, startPos.x, startPos.y, options));
  if (endText && endPos) fragment.appendChild(makeSvgTextLabel(endText, endPos.x, endPos.y, options));
}

function appendWireLabels(fragment, points, wire, index) {
  if (!state.showWireLabels || !points || points.length < 2) return;
  if (wire.showLabel !== false) {
    const mid = midpointAlongPolyline(points);
    if (mid) {
      const labelText = getWireAutoLabel(wire, index);
      fragment.appendChild(makeSvgTextLabel(labelText, mid.x, mid.y - 10, {
        className: 'wire-label-main',
        fontSize: 11,
        bold: true,
        fill: '#ffffff',
        stroke: '#64748b',
        textColor: '#111827'
      }));
    }
  }
  appendWireEndpointLabels(fragment, points, wire);
}

function buildTerminalSvg(point, neighbor, wire) {
  const type = normalizeWireTerminal(wire.terminalType || 'ferrule');
  if (type === 'none' || !point || !neighbor) return '';
  const fillColor = xmlEscape(normalizeTerminalColor(wire.terminalColor));
  const metrics = getTerminalMetrics(wire);
  const stroke = metrics.stroke;
  const angle = Math.atan2(neighbor.y - point.y, neighbor.x - point.x) * 180 / Math.PI;
  const length = metrics.ferruleLength;
  const width = metrics.ferruleWidth;
  const outline = '#1f2937';
  if (type === 'dot') return `<g transform="translate(${point.x} ${point.y}) rotate(${angle})"><circle cx="${length*0.35}" cy="0" r="${metrics.dotRadius}" fill="${fillColor}" stroke="${outline}" stroke-width="1.5"/></g>`;
  if (type === 'ring') return `<g transform="translate(${point.x} ${point.y}) rotate(${angle})"><circle cx="${length*0.45}" cy="0" r="${metrics.ringRadius}" fill="${fillColor}" stroke="${outline}" stroke-width="1.5"/><circle cx="${length*0.45}" cy="0" r="${Math.max(1.8, metrics.ringRadius * 0.42)}" fill="#ffffff" stroke="${outline}" stroke-width="1"/></g>`;
  if (type === 'ferrule') return `<g transform="translate(${point.x} ${point.y}) rotate(${angle})"><rect x="0" y="${-width/2}" width="${length}" height="${width}" rx="${metrics.ferruleRx}" fill="${fillColor}" stroke="${outline}" stroke-width="${metrics.ferruleStrokeWidth}"/></g>`;
  if (type === 'fork') return `<g transform="translate(${point.x} ${point.y}) rotate(${angle})"><path d="M 0 ${-width/2} L ${length} ${-width/2} M 0 ${width/2} L ${length} ${width/2} M 0 ${-width/2} L 0 ${width/2}" fill="none" stroke="${fillColor}" stroke-width="${Math.max(3, stroke)}" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  return '';
}

function drawWires() {
  const fragment = document.createDocumentFragment();

  state.wires.forEach((wire, wireIndex) => {
    const points = getWirePoints(wire);
    if (!points) return;

    const pathData = buildSmoothCadPath(points);

    const hitPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hitPath.setAttribute('d', pathData);
    hitPath.setAttribute('stroke', 'transparent');
    hitPath.setAttribute('stroke-width', '16');
    hitPath.setAttribute('fill', 'none');
    hitPath.style.pointerEvents = 'stroke';
    hitPath.style.cursor = state.mode === 'delete-wire' || state.mode === 'edit-wire' ? 'pointer' : 'default';

    hitPath.addEventListener('click', event => {
      event.stopPropagation();

      if (state.mode === 'delete-wire') {
        recordHistory();
        const index = state.wires.findIndex(item => item.id === wire.id);
        if (index >= 0) state.wires.splice(index, 1);
        if (state.selectedWireId === wire.id) {
          state.selectedWireId = null;
          selectedNodeIndex = null;
          syncSelectionState(null, null);
          renderInspectorEmpty();
        }
        drawWires();
        setStatus('Cable eliminado', 'success');
        return;
      }

      $$('.component').forEach(component => component.classList.remove('selected'));
      state.selectedComponents.clear();
      activateWireEditing(wire.id);
      state.currentWireColor = wire.color || '#2563eb';
      syncWireColorControls(state.currentWireColor);
      state.currentWireGauge = normalizeWireGauge(wire.gauge, wire.thickness);
      if (wireGaugeSelect) wireGaugeSelect.value = state.currentWireGauge;
      state.currentWireThickness = wire.thickness || (getWireStroke(wire) >= 5 ? 'thick' : 'thin');
      state.currentWireRouteMode = wire.routeMode || 'orthogonal';
      state.currentWireTerminal = normalizeWireTerminal(wire.terminalType);
    state.currentTerminalColor = normalizeTerminalColor(wire.terminalColor);
      if (wireTerminalSelect) wireTerminalSelect.value = state.currentWireTerminal;
    if (terminalColorSelect) terminalColorSelect.value = state.currentTerminalColor;
      wireFreeBtn?.classList.toggle('active', state.currentWireRouteMode === 'free');
      wireOrthoBtn?.classList.toggle('active', state.currentWireRouteMode === 'orthogonal');
      const matching = document.querySelector(`input[name="wireThickness"][value="${state.currentWireThickness}"]`);
      if (matching) matching.checked = true;
      drawWires();
      showWireInspector(wire.id);
      setStatus('Cable seleccionado: edición activa', 'success');
    });

    hitPath.addEventListener('dblclick', event => {
      event.stopPropagation();
      activateWireEditing(wire.id);
      const pt = clientToWorld(event.clientX, event.clientY);
      createNodeOnSelectedWire(pt);
    });

    fragment.appendChild(hitPath);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', wireStrokeColor(wire.color));
    path.setAttribute('stroke-width', getWireStroke(wire));
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('class', 'wire-path' + (state.selectedWireId === wire.id ? ' selected-wire' : ''));
    path.style.pointerEvents = 'none';
    fragment.appendChild(path);
    if (wire.color === 'green-yellow') {
      const ypath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      ypath.setAttribute('d', pathData);
      ypath.setAttribute('stroke', '#facc15');
      ypath.setAttribute('stroke-width', Math.max(2, getWireStroke(wire) * 0.55));
      ypath.setAttribute('fill', 'none');
      ypath.setAttribute('stroke-linecap', 'round');
      ypath.setAttribute('stroke-linejoin', 'round');
      ypath.setAttribute('stroke-dasharray', '10 8');
      ypath.style.pointerEvents = 'none';
      fragment.appendChild(ypath);
    }
    appendWireTerminals(fragment, points, wire);
    appendWireLabels(fragment, points, wire, wireIndex);

    const showNodes = state.selectedWireId === wire.id;
    (wire.waypoints || []).forEach((point, index) => {
      const node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      node.setAttribute('cx', point.x);
      node.setAttribute('cy', point.y);
      node.setAttribute('r', '6');
      node.setAttribute('class', 'wire-node' + (showNodes ? '' : ' hidden') + (showNodes && selectedNodeIndex === index ? ' selected' : ''));

      node.addEventListener('click', event => {
        event.stopPropagation();
        activateWireEditing(wire.id);
        selectedNodeIndex = index;
        drawWires();
        showWireInspector(wire.id);
        setStatus(`Nodo ${index + 1} seleccionado`, 'success');
      });

      node.addEventListener('mousedown', event => {
        activateWireEditing(wire.id);
        event.stopPropagation();
        selectedNodeIndex = index;
        state.draggingNode = {
          wire,
          index,
          started: false,
          snapshotSaved: false,
          startPoint: { x: point.x, y: point.y }
        };
        drawWires();
      });

      fragment.appendChild(node);
    });
  });

  wiresSvg.replaceChildren(fragment);
  drawPreviewWire();
}

function applySelectedWireStyle() {
  if (!state.selectedWireId) {
    setStatus('Primero selecciona un cable', 'warning');
    return;
  }

  const wire = state.wires.find(item => item.id === state.selectedWireId);
  if (!wire) {
    setStatus('Cable no encontrado', 'warning');
    return;
  }

  recordHistory();
  wire.color = state.currentWireColor;
  wire.gauge = normalizeWireGauge(state.currentWireGauge, state.currentWireThickness);
  wire.thickness = getWireStroke(wire) >= 5 ? 'thick' : 'thin';
  wire.routeMode = state.currentWireRouteMode;
  wire.terminalType = normalizeWireTerminal(state.currentWireTerminal);
  wire.terminalColor = normalizeTerminalColor(state.currentTerminalColor);
  drawWires();
  showWireInspector(wire.id);
  setStatus('Estilo aplicado al cable seleccionado', 'success');
}

function deleteSelected() {
  const selectedComponents = getSelectedComponents();
  if (selectedComponents.length) {
    recordHistory();
    const ids = new Set(selectedComponents.map(component => component.dataset.id));
    selectedComponents.forEach(component => component.remove());
    state.selectedComponents.clear();
    state.selectedWireId = null;
  selectedNodeIndex = null;
    syncSelectionState(null, null);
    renderInspectorEmpty();
    for (let index = state.wires.length - 1; index >= 0; index -= 1) {
      const wire = state.wires[index];
      if (ids.has(wire.from.componentId) || ids.has(wire.to.componentId)) state.wires.splice(index, 1);
    }
    drawWires();
    setStatus(selectedComponents.length > 1 ? 'Componentes eliminados' : 'Componente eliminado', 'success');
    return;
  }

  if (state.selectedWireId) {
    recordHistory();
    const index = state.wires.findIndex(wire => wire.id === state.selectedWireId);
    if (index >= 0) state.wires.splice(index, 1);
    state.selectedWireId = null;
  selectedNodeIndex = null;
    syncSelectionState(null, null);
    renderInspectorEmpty();
    drawWires();
    setStatus('Cable eliminado', 'success');
    return;
  }

  setStatus('Nada seleccionado', 'warning');
}



function xmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\n;]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
  return text;
}

function downloadTextFile(fileName, text, mimeType = 'text/plain') {
  const blob = new Blob([text], { type: mimeType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function getProjectTitle() {
  const now = new Date();
  const stamp = now.toLocaleDateString('es-PE') + ' ' + now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  return `EduVolt - Tablero ${state.boardWidthMm} x ${state.boardHeightMm} mm - ${stamp}`;
}

function getComponentExportRows() {
  return $$('.component')
    .map(el => {
      const width = Math.round(parseFloat(el.style.width) || el.offsetWidth || COMPONENT_SIZE.target);
      const height = Math.round(parseFloat(el.style.height) || el.offsetHeight || COMPONENT_SIZE.target);
      return {
        id: el.dataset.id,
        typeId: el.dataset.typeId,
        name: el.dataset.name || state.libraryMap.get(el.dataset.typeId)?.name || el.dataset.typeId || 'Componente',
        ref: el.dataset.ref || '',
        labelOffsetX: Number(el.dataset.labelOffsetX || 0),
        labelOffsetY: Number(el.dataset.labelOffsetY || 0),
        x: parseFloat(el.style.left) || 0,
        y: parseFloat(el.style.top) || 0,
        width,
        height,
        widthMm: pxToMm(width),
        heightMm: pxToMm(height),
        xMm: pxToMm(parseFloat(el.style.left) || 0),
        yMm: pxToMm(parseFloat(el.style.top) || 0),
        layer: getComponentLayer(el)
      };
    })
    .sort((a, b) => a.layer - b.layer);
}

function buildBomRows() {
  const groups = new Map();
  getComponentExportRows().forEach(row => {
    const key = `${row.typeId}|${row.name}|${row.ref}`;
    if (!groups.has(key)) {
      groups.set(key, {
        typeId: row.typeId,
        name: row.name,
        ref: row.ref,
        qty: 0,
        widthMm: row.widthMm,
        heightMm: row.heightMm,
        instances: []
      });
    }
    const item = groups.get(key);
    item.qty += 1;
    item.instances.push(row.id);
  });
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

function buildBomCsv() {
  const rows = [
    ['Item', 'Cantidad', 'Componente', 'Referencia', 'Tipo ID', 'Medida aprox. mm', 'Instancias']
  ];
  buildBomRows().forEach((item, index) => {
    rows.push([
      index + 1,
      item.qty,
      item.name,
      item.ref,
      item.typeId,
      `${item.widthMm} x ${item.heightMm}`,
      item.instances.join(' ')
    ]);
  });
  rows.push([]);
  rows.push(['Tablero', `${state.boardWidthMm} x ${state.boardHeightMm} mm`]);
  rows.push(['Escala', `1 mm = ${state.pxPerMm} px`]);
  rows.push(['Cables', state.wires.length]);
  rows.push([]);
  rows.push(['Cable', 'Calibre', 'Color', 'Rotulado origen', 'Rotulado destino']);
  state.wires.forEach((wire, index) => {
    rows.push([
      getWireAutoLabel(wire, index),
      getWireGaugeLabel(wire.gauge),
      WIRE_COLOR_PRESETS[wire.color] || wire.color || '',
      wire.fromLabel || getWireEndpointText(wire, 'from'),
      wire.toLabel || getWireEndpointText(wire, 'to')
    ]);
  });
  return rows.map(row => row.map(csvEscape).join(';')).join('\n');
}

function exportBomCsv() {
  downloadTextFile('lista-materiales-bom.csv', buildBomCsv(), 'text/csv;charset=utf-8');
  setStatus('BOM exportado en CSV', 'success');
}

function buildBoardSvg() {
  const boardW = Math.max(200, mmToPx(state.boardWidthMm || 800));
  const boardH = Math.max(200, mmToPx(state.boardHeightMm || 1200));
  const grid10 = Math.max(4, mmToPx(10));
  const grid50 = Math.max(grid10, mmToPx(50));
  const title = xmlEscape(getProjectTitle());

  const parts = [];
  parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${boardW}" height="${boardH}" viewBox="0 0 ${boardW} ${boardH}">`);
  parts.push(`<title>${title}</title>`);
  parts.push(`<defs>`);
  parts.push(`<pattern id="grid10" width="${grid10}" height="${grid10}" patternUnits="userSpaceOnUse"><path d="M ${grid10} 0 L 0 0 0 ${grid10}" fill="none" stroke="#e5e7eb" stroke-width="1"/></pattern>`);
  parts.push(`<pattern id="grid50" width="${grid50}" height="${grid50}" patternUnits="userSpaceOnUse"><path d="M ${grid50} 0 L 0 0 0 ${grid50}" fill="none" stroke="#cbd5e1" stroke-width="1.4"/></pattern>`);
  parts.push(`</defs>`);
  parts.push(`<rect x="0" y="0" width="${boardW}" height="${boardH}" fill="#f8fafc" stroke="#64748b" stroke-width="2"/>`);
  parts.push(`<rect x="0" y="0" width="${boardW}" height="${boardH}" fill="url(#grid10)"/>`);
  parts.push(`<rect x="0" y="0" width="${boardW}" height="${boardH}" fill="url(#grid50)"/>`);
  parts.push(`<text x="12" y="24" font-family="Arial" font-size="14" fill="#334155">Tablero ${state.boardWidthMm} x ${state.boardHeightMm} mm | Escala 1 mm = ${state.pxPerMm} px</text>`);

  // Cables debajo de etiquetas, encima del fondo.
  state.wires.forEach(wire => {
    const points = getWirePoints(wire);
    if (!points) return;
    const d = buildSmoothCadPath(points);
    parts.push(`<path d="${xmlEscape(d)}" fill="none" stroke="${xmlEscape(wireStrokeColor(wire.color))}" stroke-width="${getWireStroke(wire)}" stroke-linecap="round" stroke-linejoin="round"/>`);
    if (wire.color === 'green-yellow') parts.push(`<path d="${xmlEscape(d)}" fill="none" stroke="#facc15" stroke-width="${Math.max(2, getWireStroke(wire) * 0.55)}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="10 8"/>`);
    parts.push(buildTerminalSvg(points[0], points[1], wire));
    parts.push(buildTerminalSvg(points[points.length - 1], points[points.length - 2], wire));
    if (state.showWireLabels && wire.showLabel !== false) {
      const mid = midpointAlongPolyline(points);
      if (mid) parts.push(buildSvgLabel(getWireAutoLabel(wire, state.wires.indexOf(wire)), mid.x, mid.y - 10, { className: 'wire-label-main', fontSize: 11, bold: true, fill: '#ffffff', stroke: '#64748b', textColor: '#111827' }));
      if (wire.showEndpointLabels !== false) {
        const startText = wire.fromLabel || getWireEndpointText(wire, 'from');
        const endText = wire.toLabel || getWireEndpointText(wire, 'to');
        parts.push(buildEndpointLabelSvg(points[0], points[1], wire, startText));
        parts.push(buildEndpointLabelSvg(points[points.length - 1], points[points.length - 2], wire, endText));
      }
    }
  });

  getComponentExportRows().forEach(row => {
    const def = state.libraryMap.get(row.typeId);
    const img = def?.image || '';
    const rotate = Number(document.querySelector(`.component[data-id="${row.id}"]`)?.dataset.rotation || 0) || 0;
    const cx = row.x + row.width / 2;
    const cy = row.y + row.height / 2;
    parts.push(`<g transform="rotate(${rotate} ${cx} ${cy})">`);
    if (img) {
      parts.push(`<image x="${row.x}" y="${row.y}" width="${row.width}" height="${row.height}" href="${xmlEscape(img)}" preserveAspectRatio="xMidYMid meet"/>`);
    } else {
      parts.push(`<rect x="${row.x}" y="${row.y}" width="${row.width}" height="${row.height}" fill="#ffffff" stroke="#334155"/>`);
    }
    parts.push(`</g>`);
    const labelX = row.x + row.width / 2 + (row.labelOffsetX || 0);
    const nameY = row.y - 24 + (row.labelOffsetY || 0);
    const refY = row.y + row.height + 24 + (row.labelOffsetY || 0);
    if (row.name) parts.push(`<text x="${labelX}" y="${nameY}" text-anchor="middle" font-family="Arial" font-size="10" font-weight="600" fill="#334155">${xmlEscape(row.name)}</text>`);
    if (row.ref) parts.push(`<text x="${labelX}" y="${refY}" text-anchor="middle" font-family="Arial" font-size="11" font-weight="700" fill="#111827">${xmlEscape(row.ref)}</text>`);
  });

  parts.push(`</svg>`);
  return parts.join('\n');
}

function exportSvgFile() {
  downloadTextFile('tablero-eduvolt.svg', buildBoardSvg(), 'image/svg+xml;charset=utf-8');
  setStatus('SVG exportado', 'success');
}

function buildBomHtmlTable() {
  const rows = buildBomRows();
  if (!rows.length) return '<p>No hay componentes en el tablero.</p>';
  return `<table><thead><tr><th>Item</th><th>Cant.</th><th>Componente</th><th>Referencia</th><th>Medida aprox.</th></tr></thead><tbody>${rows.map((item, index) => `<tr><td>${index + 1}</td><td>${item.qty}</td><td>${xmlEscape(item.name)}</td><td>${xmlEscape(item.ref || '-')}</td><td>${item.widthMm} x ${item.heightMm} mm</td></tr>`).join('')}</tbody></table>`;
}

function exportPdfPrint() {
  const svg = buildBoardSvg();
  const bom = buildBomHtmlTable();
  const encodedSvg = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const win = window.open('', '_blank');
  if (!win) {
    alert('El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para exportar PDF.');
    return;
  }
  win.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${xmlEscape(getProjectTitle())}</title><style>
    @page { size: A4 landscape; margin: 10mm; }
    body { font-family: Arial, sans-serif; color: #111827; margin: 0; }
    header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; margin-bottom: 10px; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .meta { font-size: 11px; color: #475569; line-height: 1.4; }
    .sheet { page-break-after: always; }
    .board-img { width: 100%; max-height: 175mm; object-fit: contain; border: 1px solid #94a3b8; background: #f8fafc; }
    h2 { font-size: 15px; margin: 12px 0 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th, td { border: 1px solid #cbd5e1; padding: 5px; text-align: left; }
    th { background: #e2e8f0; }
    @media print { .no-print { display: none; } }
  </style></head><body>
    <button class="no-print" onclick="window.print()" style="margin:8px;padding:8px 12px;">Imprimir / Guardar PDF</button>
    <section class="sheet">
      <header><div><h1>Plano de tablero</h1><div class="meta">${xmlEscape(getProjectTitle())}</div></div><div class="meta">Tablero: ${state.boardWidthMm} x ${state.boardHeightMm} mm<br>Escala técnica: 1 mm = ${state.pxPerMm} px<br>Cables: ${state.wires.length}</div></header>
      <img class="board-img" src="${encodedSvg}" alt="Plano del tablero">
    </section>
    <section>
      <header><div><h1>Lista de materiales / BOM</h1><div class="meta">Generado desde EduVolt</div></div></header>
      ${bom}
    </section>
    <script>setTimeout(() => window.print(), 500);<\/script>
  </body></html>`);
  win.document.close();
  setStatus('PDF preparado: usa Guardar como PDF en la ventana de impresión', 'success');
}

function saveProject() {
  const components = $$('.component').map(el => ({
    instanceId: el.dataset.id,
    typeId: el.dataset.typeId,
    x: parseFloat(el.style.left) || 0,
    y: parseFloat(el.style.top) || 0,
    width: Math.round(parseFloat(el.style.width) || el.offsetWidth || COMPONENT_SIZE.target),
    height: Math.round(parseFloat(el.style.height) || el.offsetHeight || COMPONENT_SIZE.target),
    name: el.dataset.name || '',
    ref: undefined,
    labelOffsetX: el.dataset.labelOffsetX || 0,
    labelOffsetY: el.dataset.labelOffsetY || 0,
    labelLocked: el.dataset.labelLocked || 'false',
    rotation: el.dataset.rotation || '0',
    locked: el.dataset.locked || 'false',
    showName: el.dataset.showName || 'true',
    textMode: getComponentTextMode(el),
    layer: getComponentLayer(el)
  }));

  const usedTypeIds = new Set(components.map(component => component.typeId));
  const projectLibrary = state.library.filter(item => usedTypeIds.has(item.id));

  const payload = {
    version: 7,
    view: { zoom: state.zoom, panX: state.panX, panY: state.panY },
    board: { widthMm: state.boardWidthMm, heightMm: state.boardHeightMm },
    editor: { snapEnabled: state.snapEnabled, wireRouteMode: state.currentWireRouteMode, wireTerminal: state.currentWireTerminal, terminalColor: state.currentTerminalColor, pxPerMm: state.pxPerMm, showRealUnits: state.showRealUnits },
    // Lista liviana para compatibilidad y biblioteca completa para que el proyecto sea autosuficiente.
    library: projectLibrary.map(item => ({ id: item.id, fileName: item.fileName, name: item.name })),
    embeddedLibrary: projectLibrary.map(item => ({
      id: item.id,
      fileName: item.fileName,
      name: item.name,
      width: item.width,
      height: item.height,
      category: item.category,
      image: item.image,
      terminals: item.terminals
    })),
    components,
    wires: state.wires,
    counters: { componentId: state.componentId, wireId: state.wireId, maxLayer: state.maxLayer }
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'proyecto.evd';
  link.click();
  URL.revokeObjectURL(link.href);
  setStatus('Proyecto guardado', 'success');
}

async function openProjectFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    await restoreProject(data);
    setStatus('Proyecto abierto', 'success');
  } catch (error) {
    console.error(error);
    alert('No se pudo abrir el proyecto');
  }

  event.target.value = '';
}

async function restoreProject(data) {
  clearPendingWire();
  state.selectedWireId = null;
  selectedNodeIndex = null;
  syncSelectionState(null, null);
  renderInspectorEmpty();
  canvas.innerHTML = '';
  state.wires.length = 0;

  await importEmbeddedLibrary(data);

  const missing = [];
  for (const component of data.components || []) {
    if (!state.libraryMap.has(component.typeId)) missing.push(component.typeId);
  }

  if (missing.length) {
    alert('Faltan componentes y el proyecto no trae sus imágenes internas: ' + [...new Set(missing)].join(', ') + '. Esos elementos se omitirán.');
  }

  state.componentId = data.counters?.componentId || 0;
  state.wireId = data.counters?.wireId || 0;
  state.maxLayer = data.counters?.maxLayer || 0;
  state.zoom = data.view?.zoom || 1;
  if (data.editor) {
    state.snapEnabled = data.editor.snapEnabled !== false;
    state.currentWireRouteMode = data.editor.wireRouteMode === 'orthogonal' ? 'orthogonal' : 'free';
    state.currentWireTerminal = normalizeWireTerminal(data.editor.wireTerminal);
    state.currentTerminalColor = normalizeTerminalColor(data.editor.terminalColor);
    if (Number(data.editor.pxPerMm) > 0) state.pxPerMm = clamp(Number(data.editor.pxPerMm), 0.2, 20);
    if (typeof data.editor.showRealUnits === 'boolean') state.showRealUnits = data.editor.showRealUnits;
    if (typeof data.editor.showWireLabels === 'boolean') state.showWireLabels = data.editor.showWireLabels;
    setWireLabelsVisible(state.showWireLabels);
    syncScaleControls();
    saveScaleSettings();
    snapToggleBtn?.classList.toggle('active', state.snapEnabled);
    if (snapToggleBtn) snapToggleBtn.textContent = state.snapEnabled ? 'Snap ON' : 'Snap OFF';
    wireFreeBtn?.classList.toggle('active', state.currentWireRouteMode === 'free');
    wireOrthoBtn?.classList.toggle('active', state.currentWireRouteMode === 'orthogonal');
    if (wireTerminalSelect) wireTerminalSelect.value = state.currentWireTerminal;
    if (terminalColorSelect) terminalColorSelect.value = state.currentTerminalColor;
  }
  if (data.board) {
    if (Number(data.board.widthMm) > 0) state.boardWidthMm = clamp(Number(data.board.widthMm), 100, 3000);
    if (Number(data.board.heightMm) > 0) state.boardHeightMm = clamp(Number(data.board.heightMm), 100, 3000);
  }
  applyBoardSize({ skipSave: true });
  state.panX = data.view?.panX || 0;
  state.panY = data.view?.panY || 0;
  updateViewportTransform();

  for (const component of data.components || []) {
    const def = state.libraryMap.get(component.typeId);
    if (def) {
      addComponent(def, {
        instanceId: component.instanceId,
        x: component.x,
        y: component.y,
        width: component.width,
        height: component.height,
        name: component.name,
        ref: component.ref,
        labelOffsetX: component.labelOffsetX || 0,
        labelOffsetY: component.labelOffsetY || 0,
        labelLocked: component.labelLocked || 'false',
        rotation: component.rotation,
        locked: component.locked,
        showName: component.showName,
        textMode: component.textMode,
        layer: component.layer,
        skipHistory: true,
        skipSelection: true
      });
    }
  }

  (data.wires || []).forEach(wire => state.wires.push({
    id: wire.id,
    from: wire.from,
    to: wire.to,
    thickness: wire.thickness || 'thin',
    gauge: normalizeWireGauge(wire.gauge, wire.thickness),
    color: normalizeWireColor(wire.color),
    waypoints: (wire.waypoints || []).map(point => ({ x: point.x, y: point.y })),
    routeMode: wire.routeMode || 'orthogonal',
    terminalType: normalizeWireTerminal(wire.terminalType),
    terminalColor: normalizeTerminalColor(wire.terminalColor)
  }));

  drawWires();
}

selectModeBtn.addEventListener('click', () => setMode('select'));
panModeBtn?.addEventListener('click', () => { setMode('pan'); setStatus('Pan activado: arrastra el área de trabajo'); });
wireModeBtn.addEventListener('click', () => setMode('wire'));
editWireModeBtn.addEventListener('click', () => setMode('edit-wire'));
deleteWireModeBtn.addEventListener('click', () => setMode('delete-wire'));
deleteBtn.addEventListener('click', deleteSelected);
snapToggleBtn?.addEventListener('click', () => setSnapEnabled(!state.snapEnabled));
wireFreeBtn?.addEventListener('click', () => setWireRouteMode('free'));
wireOrthoBtn?.addEventListener('click', () => setWireRouteMode('orthogonal'));
$('#layerFrontTopBtn')?.addEventListener('click', () => changeSelectedLayer('front'));
$('#layerBackTopBtn')?.addEventListener('click', () => changeSelectedLayer('back'));
$('#layerUpTopBtn')?.addEventListener('click', () => changeSelectedLayer('up'));
$('#layerDownTopBtn')?.addEventListener('click', () => changeSelectedLayer('down'));
clearWiresBtn.addEventListener('click', () => {
  if (!state.wires.length) {
    setStatus('No hay cables para borrar', 'warning');
    return;
  }
  recordHistory();
  state.wires.length = 0;
  clearPendingWire();
  state.selectedWireId = null;
  selectedNodeIndex = null;
  syncSelectionState(null, null);
  renderInspectorEmpty();
  drawWires();
  setStatus('Líneas borradas', 'success');
});

evcInput.addEventListener('change', handleFiles);
projectInput.addEventListener('change', openProjectFile);
applyScaleBtn?.addEventListener('click', () => {
  const next = clamp(Number(pxPerMmInput?.value) || state.pxPerMm || 2, 0.2, 20);
  state.pxPerMm = next;
  saveScaleSettings();
  syncScaleControls();
  applyBoardSize();
  if (getSelectedComponent()) showComponentInspector(getSelectedComponent());
  setStatus(`Escala técnica aplicada: 1 mm = ${state.pxPerMm} px`, 'success');
});

unitToggleBtn?.addEventListener('click', () => {
  state.showRealUnits = !state.showRealUnits;
  saveScaleSettings();
  syncScaleControls();
  if (getSelectedComponent()) showComponentInspector(getSelectedComponent());
  setStatus(state.showRealUnits ? 'Medidas en milímetros activadas' : 'Medidas en píxeles activadas', 'success');
});

applyBoardBtn?.addEventListener('click', setBoardFromInputs);
fitBoardBtn?.addEventListener('click', fitBoardToScreen);
exportPdfBtn?.addEventListener('click', exportPdfPrint);
exportSvgBtn?.addEventListener('click', exportSvgFile);
exportBomBtn?.addEventListener('click', exportBomCsv);
autoLabelWiresBtn?.addEventListener('click', autoNumberWires);
autoEndpointLabelsBtn?.addEventListener('click', autoEndpointLabels);
autoDeviceRefsBtn?.addEventListener('click', autoNumberDeviceRefs);
toggleWireLabelsBtn?.addEventListener('click', () => setWireLabelsVisible(!state.showWireLabels));
saveProjectBtn.addEventListener('click', saveProject);
openProjectBtn.addEventListener('click', () => projectInput.click());
applyWireStyleBtn.addEventListener('click', applySelectedWireStyle);
zoomInBtn.addEventListener('click', () => changeZoom(1.1));
zoomOutBtn.addEventListener('click', () => changeZoom(0.9));
libraryList?.addEventListener('click', event => {
  const btn = event.target.closest('[data-action="insert-library"]');
  if (!btn) return;
  event.preventDefault();
  event.stopPropagation();
  insertComponentFromLibrary(btn.dataset.typeId);
});

libraryBtn?.addEventListener('click', () => openLibraryDrawer());
closeLibraryBtn?.addEventListener('click', () => closeLibraryDrawer());
drawerBackdrop?.addEventListener('click', () => closeLibraryDrawer());

zoomResetBtn.addEventListener('click', () => {
  state.zoom = 1;
  state.panX = 0;
  state.panY = 0;
  updateViewportTransform();
  setStatus('Zoom 100%');
});

thicknessInputs.forEach(input => {
  input.addEventListener('change', () => {
    state.currentWireThickness = input.value;
    state.currentWireGauge = input.value === 'thick' ? '4mm2' : '1mm2';
    if (wireGaugeSelect) wireGaugeSelect.value = state.currentWireGauge;
    setStatus('Espesor seleccionado: ' + (state.currentWireThickness === 'thin' ? 'delgado' : 'grueso'));
  });
});

wireGaugeSelect?.addEventListener('change', () => {
  state.currentWireGauge = normalizeWireGauge(wireGaugeSelect.value, state.currentWireThickness);
  state.currentWireThickness = getWireStroke(state.currentWireGauge) >= 5 ? 'thick' : 'thin';
  const matching = document.querySelector(`input[name="wireThickness"][value="${state.currentWireThickness}"]`);
  if (matching) matching.checked = true;
  setStatus('Calibre seleccionado: ' + getWireGaugeLabel(state.currentWireGauge));
});

wireColorSelect?.addEventListener('change', () => {
  state.currentWireColor = wireColorSelect.value === 'custom' ? wireColorPicker.value : wireColorSelect.value;
  syncWireColorControls(state.currentWireColor);
  setStatus('Color de cable seleccionado');
});

wireColorPicker.addEventListener('input', () => {
  state.currentWireColor = wireColorPicker.value;
  if (wireColorSelect) wireColorSelect.value = 'custom';
  setStatus('Color personalizado: ' + state.currentWireColor);
});

terminalColorSelect?.addEventListener('change', () => {
  state.currentTerminalColor = normalizeTerminalColor(terminalColorSelect.value);
  setStatus('Color de terminal seleccionado');
});

wireTerminalSelect?.addEventListener('change', () => {
  state.currentWireTerminal = normalizeWireTerminal(wireTerminalSelect.value);
  setStatus('Terminal seleccionado: ' + getWireTerminalLabel(state.currentWireTerminal));
});


const inspectorToggle = $('#inspectorToggle');
function syncInspectorCollapsed() {
  if (!inspector || !inspectorToggle) return;
  const collapsed = inspector.classList.contains('collapsed');
  inspectorToggle.textContent = collapsed ? '◂' : '▸';
  inspectorToggle.title = collapsed ? 'Expandir propiedades' : 'Contraer propiedades';
}
inspectorToggle?.addEventListener('click', event => {
  event.stopPropagation();
  inspector?.classList.toggle('collapsed');
  syncInspectorCollapsed();
});
syncInspectorCollapsed();

inspector?.addEventListener('mousedown', event => event.stopPropagation());
inspector?.addEventListener('click', event => event.stopPropagation());

workspace.addEventListener('dragover', event => {
  if (!Array.from(event.dataTransfer.types || []).includes('text/plain')) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
});

workspace.addEventListener('drop', event => {
  const typeId = event.dataTransfer.getData('text/plain');
  const def = state.libraryMap.get(typeId);
  if (!def) return;
  event.preventDefault();
  try {
    const point = snapPoint(getWorkspacePoint(event));
    const created = addComponent(def, { x: point.x, y: point.y });
    if (created) {
      closeLibraryDrawer();
      setStatus('Componente insertado desde biblioteca', 'success');
    }
  } catch (error) {
    console.error('Error soltando componente:', error);
    setStatus('Error insertando componente', 'error');
  }
});

workspace.addEventListener('wheel', event => {
  event.preventDefault();
  changeZoom(event.deltaY < 0 ? 1.1 : 0.9, event.clientX, event.clientY);
}, { passive: false });

workspace.addEventListener('mousedown', event => {
  if (canStartPan(event)) {
    event.preventDefault();
    startPan(event, 'mouse');
  }
});

workspace.addEventListener('mousemove', event => {
  if (state.draggingNode) {
    const point = getWorkspacePoint(event);
    if (!state.draggingNode.snapshotSaved) {
      recordHistory();
      state.draggingNode.snapshotSaved = true;
    }
    state.draggingNode.started = true;
    state.draggingNode.wire.waypoints[state.draggingNode.index] = event.altKey ? point : snapPoint(point);
    requestDrawWires();
    return;
  }

  if (state.mode === 'wire' && state.pendingPort) {
    state.previewMousePoint = getWorkspacePoint(event);
    requestDrawWires();
  }
});

workspace.addEventListener('click', event => {
  if (state.suppressWorkspaceClick) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  if (event.target.closest('.inspector') || event.target.closest('.component') || event.target.closest('.wire-node') || event.target.closest('path')) return;
  clearSelection();
  if (state.mode === 'wire' && state.pendingPort) addWaypoint(getWorkspacePoint(event));
});

document.addEventListener('mousemove', event => {
  if (state.labelDragContext) {
    const ctx = state.labelDragContext;
    const dx = (event.clientX - ctx.startX) / state.zoom;
    const dy = (event.clientY - ctx.startY) / state.zoom;
    ctx.moved = ctx.moved || Math.hypot(dx, dy) > 1;
    ctx.el.dataset.labelOffsetX = String(Math.round((ctx.startOffsetX + dx) * 10) / 10);
    ctx.el.dataset.labelOffsetY = String(Math.round((ctx.startOffsetY + dy) * 10) / 10);
    updateComponentVisualMeta(ctx.el);
    return;
  }

  if (state.resizeContext) {
    const ctx = state.resizeContext;
    const dx = (event.clientX - ctx.startX) / state.zoom;
    const dy = (event.clientY - ctx.startY) / state.zoom;
    const widthFactor = (ctx.startW + dx) / Math.max(ctx.startW, 1);
    const heightFactor = (ctx.startH + dy) / Math.max(ctx.startH, 1);
    const factor = clamp(Math.max(widthFactor, heightFactor), 0.25, 3);
    const nextW = clamp(Math.round(ctx.startW * factor), COMPONENT_SIZE.canvasMin, COMPONENT_SIZE.canvasMax);
    const nextH = clamp(Math.round(nextW / ctx.aspect), COMPONENT_SIZE.canvasMin, COMPONENT_SIZE.canvasMax);
    ctx.el.style.width = `${nextW}px`;
    ctx.el.style.height = `${nextH}px`;
    updateComponentVisualMeta(ctx.el);
    requestDrawWires();
    return;
  }

  if (state.panState) {
    updatePan(event.clientX, event.clientY);
    return;
  }

  if (state.dragContext) {
    const dx = (event.clientX - state.dragContext.startX) / state.zoom;
    const dy = (event.clientY - state.dragContext.startY) / state.zoom;
    if (!state.dragContext.snapshotSaved && Math.hypot(dx, dy) > 2) {
      recordHistory();
      state.dragContext.snapshotSaved = true;
    }
    state.dragContext.moved = state.dragContext.moved || Math.hypot(dx, dy) > 2;
    state.dragContext.origins.forEach((item, index) => {
      const proposedX = item.x + dx;
      const proposedY = item.y + dy;
      const next = index === 0 ? applySmartSnapToComponent(item, proposedX, proposedY) : { x: snapCoordinate(proposedX), y: snapCoordinate(proposedY) };
      item.el.style.left = next.x + 'px';
      item.el.style.top = next.y + 'px';
    });
    requestDrawWires();
  }
});

document.addEventListener('mouseup', () => {
  if (state.labelDragContext) {
    const el = state.labelDragContext.el;
    if (state.labelDragContext.moved) {
      setStatus('Etiqueta del dispositivo acomodada', 'success');
      showComponentInspector(el);
    }
    state.labelDragContext = null;
  }

  if (state.resizeContext) {
    setStatus('Tamaño actualizado proporcionalmente', 'success');
    showComponentInspector(state.resizeContext.el);
    drawWires();
    state.resizeContext = null;
  }

  if (state.panState) {
    endPan();
  }
  if (state.dragContext) {
    if (state.dragContext.moved) {
      setStatus('Componente movido', 'success');
      showComponentInspector(state.dragContext.el);
      drawWires();
    }
    state.dragContext = null;
    hideAlignmentGuides();
  }
  if (state.draggingNode) {
    if (state.draggingNode.started) {
      drawWires();
      setStatus('Nodo actualizado', 'success');
    }
    state.draggingNode = null;
  }
});


workspace.addEventListener('touchstart', event => {
  if (event.touches.length === 2) {
    event.preventDefault();
    endPan();
    startPinchZoom(event);
    workspace.classList.add('panning');
    return;
  }
  if (event.touches.length !== 1) return;
  const touch = event.touches[0];
  const fakeEvent = { clientX: touch.clientX, clientY: touch.clientY, button: 0, target: event.target };
  if (state.mode === 'select' && isWorkspaceBackgroundTarget(event.target)) {
    event.preventDefault();
    startPan(fakeEvent, 'touch');
  }
}, { passive: false });

document.addEventListener('touchmove', event => {
  if (state.pinchState && event.touches.length >= 2) {
    event.preventDefault();
    updatePinchZoom(event);
    return;
  }
  if (state.panState && state.panState.source === 'touch' && event.touches.length === 1) {
    event.preventDefault();
    const touch = event.touches[0];
    updatePan(touch.clientX, touch.clientY);
  }
}, { passive: false });

document.addEventListener('touchend', event => {
  if (state.pinchState && event.touches.length < 2) {
    state.pinchState = null;
    workspace.classList.remove('panning');
    setStatus('Zoom ' + Math.round(state.zoom * 100) + '%');
  }
  if (state.panState && event.touches.length === 0) {
    endPan();
  }
}, { passive: false });

document.addEventListener('touchcancel', () => {
  state.pinchState = null;
  if (state.panState) endPan();
  workspace.classList.remove('panning');
}, { passive: false });

document.addEventListener('keydown', event => {
  if ((event.key === 'Delete' || event.key === 'Backspace') && state.selectedWireId && selectedNodeIndex != null) {
    event.preventDefault();
    deleteSelectedNode();
    return;
  }
  if (event.code === 'Space' && !event.repeat) {
    state.spacePressed = true;
    workspace.classList.add('panning');
  }

  if (event.ctrlKey && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    undo();
  }

  if (event.ctrlKey && event.key.toLowerCase() === 'y') {
    event.preventDefault();
    redo();
  }

  if (event.ctrlKey && event.key.toLowerCase() === 'd') {
    event.preventDefault();
    if (state.selected.type === 'component' && state.selected.id) {
      const current = document.querySelector(`.component[data-id="${state.selected.id}"]`);
      if (current) duplicateComponent(current);
    }
  }

  if (event.key === 'Delete') deleteSelected();
});

document.addEventListener('keyup', event => {
  if (event.code === 'Space') {
    state.spacePressed = false;
    if (!state.panState) workspace.classList.remove('panning');
  }
});

loadScaleSettings();
loadBoardSettings();
syncScaleControls();
setWireLabelsVisible(state.showWireLabels);
syncBoardControls();
applyBoardSize({ skipSave: true });
updateViewportTransform();
renderInspectorEmpty();
setMode('select');


restorePersistentLibrary();

// v24 - Fase 1.1: menus compactos funcionales.
// Los paneles de <details> estaban dentro de una barra con overflow horizontal;
// algunos navegadores recortan el dropdown y parece que el boton no hace nada.
// Esta rutina posiciona el menu como panel flotante y conecta cierre/estado.
function initCompactToolbarMenus() {
  const menus = $$('.topbar-menu');
  if (!menus.length) return;

  const closeOtherMenus = active => {
    menus.forEach(menu => {
      if (menu !== active) menu.removeAttribute('open');
    });
  };

  const positionMenuPanel = menu => {
    const panel = $('.menu-panel', menu);
    const summary = $('summary', menu);
    if (!panel || !summary || !menu.open) return;

    const rect = summary.getBoundingClientRect();
    const margin = 8;
    const panelWidth = Math.min(panel.offsetWidth || 260, window.innerWidth - margin * 2);
    let left = rect.left;
    if (left + panelWidth > window.innerWidth - margin) {
      left = window.innerWidth - panelWidth - margin;
    }
    left = Math.max(margin, left);

    panel.style.position = 'fixed';
    panel.style.top = `${Math.round(rect.bottom + 6)}px`;
    panel.style.left = `${Math.round(left)}px`;
    panel.style.right = 'auto';
    panel.style.zIndex = '9999';
  };

  menus.forEach(menu => {
    const summary = $('summary', menu);
    if (!summary) return;

    summary.addEventListener('click', () => {
      requestAnimationFrame(() => {
        if (menu.open) {
          closeOtherMenus(menu);
          positionMenuPanel(menu);
        }
      });
    });

    menu.addEventListener('toggle', () => {
      if (menu.open) {
        closeOtherMenus(menu);
        requestAnimationFrame(() => positionMenuPanel(menu));
      }
    });
  });

  document.addEventListener('click', event => {
    if (event.target.closest('.topbar-menu')) return;
    menus.forEach(menu => menu.removeAttribute('open'));
  });

  window.addEventListener('resize', () => {
    menus.forEach(menu => { if (menu.open) positionMenuPanel(menu); });
  });

  const ribbon = $('.compact-ribbon');
  ribbon?.addEventListener('scroll', () => {
    menus.forEach(menu => { if (menu.open) positionMenuPanel(menu); });
  });

  // Cerrar el menu luego de ejecutar botones de accion, pero no cuando se cambia un select/input.
  menus.forEach(menu => {
    menu.addEventListener('click', event => {
      const actionButton = event.target.closest('button');
      if (!actionButton) return;
      setTimeout(() => menu.removeAttribute('open'), 120);
    });
  });
}

initCompactToolbarMenus();
