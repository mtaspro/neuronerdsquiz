import { useEffect, useRef, useState, useCallback } from 'react';
import { FaArrowLeft, FaPlay } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import PageShell from '../components/ui/PageShell';
import Button from '../components/ui/Button';

const ASSETS = {
  board: 'https://res.cloudinary.com/dxqtqnfgf/image/upload/v1787845449/73a5728a-e6ff-43c8-8b7e-1674fb2f32b2_bjpyww.jpg',
  plugKey: 'https://res.cloudinary.com/dxqtqnfgf/image/upload/v1787845872/image_2026-08-27_215109064_nm2x4f.png',
  galvanometerBody: 'https://res.cloudinary.com/dxqtqnfgf/image/upload/v1787845902/9c59b452-2d12-4038-8aa5-4758d79d2e2c_tgycfj.jpg',
  galvanometerNeedle: 'https://res.cloudinary.com/dxqtqnfgf/image/upload/v1787846624/6062d609-b2d9-4296-a960-ca4911d228d0-removebg-preview_juhlii.png',
  battery: 'https://res.cloudinary.com/dxqtqnfgf/image/upload/v1787846637/e7c545ca-2c51-4f08-982a-7f6624bf7ad1-removebg-preview_ge0pj7.png',
};

const SOCKET_GROUPS = {
  P: {
    label: 'Ratio Arm P (Left)',
    sockets: [
      { id: 'P1', resistance: 10, x: 0.202, y: 0.210 },
      { id: 'P2', resistance: 100, x: 0.296, y: 0.210 },
      { id: 'P3', resistance: 1000, x: 0.391, y: 0.210 },
    ],
  },
  Q: {
    label: 'Ratio Arm Q (Right)',
    sockets: [
      { id: 'Q1', resistance: 10, x: 0.593, y: 0.210 },
      { id: 'Q2', resistance: 100, x: 0.695, y: 0.210 },
      { id: 'Q3', resistance: 1000, x: 0.795, y: 0.210 },
    ],
  },
  R: {
    label: 'Resistance Arm R',
    sockets: [
      { id: 'R1', resistance: 1, x: 0.202, y: 0.470 },
      { id: 'R2', resistance: 5, x: 0.299, y: 0.470 },
      { id: 'R3', resistance: 10, x: 0.391, y: 0.470 },
      { id: 'R4', resistance: 10, x: 0.484, y: 0.470 },
      { id: 'R5', resistance: 20, x: 0.575, y: 0.470 },
      { id: 'R6', resistance: 20, x: 0.669, y: 0.470 },
      { id: 'R7', resistance: 50, x: 0.760, y: 0.470 },
      { id: 'R8', resistance: 100, x: 0.202, y: 0.732 },
      { id: 'R9', resistance: 200, x: 0.299, y: 0.732 },
      { id: 'R10', resistance: 200, x: 0.391, y: 0.732 },
      { id: 'R11', resistance: 500, x: 0.484, y: 0.732 },
      { id: 'R∞', resistance: Infinity, x: 0.854, y: 0.732 },
      { id: 'R12', resistance: 100, x: 0.945, y: 0.732 },
      { id: 'R13', resistance: 200, x: 0.945, y: 0.732 },
      { id: 'R14', resistance: 200, x: 0.945, y: 0.732 },
      { id: 'R15', resistance: 500, x: 0.945, y: 0.732 },
    ],
  },
};

const COMPONENTS = {
  galvanometer: {
    src: ASSETS.galvanometerBody,
    x: 0.55,
    y: 0.08,
    width: 0.22,
    height: 0.18,
  },
  galvanometerNeedle: {
    src: ASSETS.galvanometerNeedle,
    parent: 'galvanometer',
    offsetX: 0.50,
    offsetY: 0.92,
    width: 0.08,
    height: 0.14,
    pivotY: 1.0,
  },
  battery: {
    src: ASSETS.battery,
    x: 0.08,
    y: 0.65,
    width: 0.12,
    height: 0.18,
  },
  unknownResistance: {
    label: 'Unknown Resistance X',
    x: 0.50,
    y: 0.200,
    radius: 0.04,
  },
};

const TERMINALS = {
  batteryPlus: { id: 'batteryPlus', label: '+', color: '#ef4444', x: 0.035, y: 0.50, component: 'batteryBox' },
  batteryMinus: { id: 'batteryMinus', label: '−', color: '#1f2937', x: 0.115, y: 0.50, component: 'batteryBox' },
  batteryBoxPlus: { id: 'batteryBoxPlus', label: 'B+', color: '#ef4444', x: 0.035, y: 0.50, component: 'batteryBox' },
  batteryBoxMinus: { id: 'batteryBoxMinus', label: 'B-', color: '#1f2937', x: 0.115, y: 0.50, component: 'batteryBox' },
  galvanometerG0: { id: 'galvanometerG0', label: 'G0', color: '#3b82f6', x: 0.408, y: 0.075, component: 'galvanometer' },
  galvanometerG1: { id: 'galvanometerG1', label: 'G1', color: '#3b82f6', x: 0.592, y: 0.075, component: 'galvanometer' },
  leftScrew3: { id: 'leftScrew3', label: 'LS3', color: '#f59e0b', x: 0.075, y: 0.735, component: 'board' },
  bottomScrew1: { id: 'bottomScrew1', label: 'K1', color: '#22c55e', x: 0.149, y: 0.897, component: 'board' },
  bottomScrew2: { id: 'bottomScrew2', label: 'K1', color: '#22c55e', x: 0.424, y: 0.903, component: 'board' },
  rightScrew1: { id: 'rightScrew1', label: 'RS1', color: '#f59e0b', x: 0.922, y: 0.200, component: 'board' },
  bottomScrew3: { id: 'bottomScrew3', label: 'K2', color: '#3b82f6', x: 0.582, y: 0.903, component: 'board' },
  bottomScrew4: { id: 'bottomScrew4', label: 'K2', color: '#3b82f6', x: 0.845, y: 0.911, component: 'board' },
};

const TERMINAL_RADIUS = 12;

const VALID_CONNECTIONS = {
  batteryPlus: ['galvanometerG0', 'galvanometerG1', 'leftScrew3', 'bottomScrew1', 'bottomScrew2', 'bottomScrew3', 'bottomScrew4', 'rightScrew1', 'batteryBoxPlus', 'batteryBoxMinus'],
  batteryMinus: ['galvanometerG0', 'galvanometerG1', 'leftScrew3', 'bottomScrew1', 'bottomScrew2', 'bottomScrew3', 'bottomScrew4', 'rightScrew1', 'batteryBoxPlus', 'batteryBoxMinus'],
  batteryBoxPlus: ['galvanometerG0', 'galvanometerG1', 'leftScrew3', 'bottomScrew1', 'bottomScrew2', 'bottomScrew3', 'bottomScrew4', 'rightScrew1', 'batteryPlus', 'batteryMinus', 'batteryBoxMinus'],
  batteryBoxMinus: ['galvanometerG0', 'galvanometerG1', 'leftScrew3', 'bottomScrew1', 'bottomScrew2', 'bottomScrew3', 'bottomScrew4', 'rightScrew1', 'batteryPlus', 'batteryMinus', 'batteryBoxPlus'],
  galvanometerG0: ['batteryPlus', 'batteryMinus', 'batteryBoxPlus', 'batteryBoxMinus', 'leftScrew3', 'bottomScrew1', 'bottomScrew2', 'bottomScrew3', 'bottomScrew4', 'rightScrew1'],
  galvanometerG1: ['batteryPlus', 'batteryMinus', 'batteryBoxPlus', 'batteryBoxMinus', 'leftScrew3', 'bottomScrew1', 'bottomScrew2', 'bottomScrew3', 'bottomScrew4', 'rightScrew1'],
  leftScrew3: ['batteryPlus', 'batteryMinus', 'batteryBoxPlus', 'batteryBoxMinus', 'galvanometerG0', 'galvanometerG1', 'bottomScrew1', 'bottomScrew2', 'bottomScrew3', 'bottomScrew4', 'rightScrew1'],
  bottomScrew1: ['batteryPlus', 'batteryMinus', 'batteryBoxPlus', 'batteryBoxMinus', 'galvanometerG0', 'galvanometerG1', 'leftScrew3', 'bottomScrew2', 'bottomScrew3', 'bottomScrew4', 'rightScrew1'],
  bottomScrew2: ['batteryPlus', 'batteryMinus', 'batteryBoxPlus', 'batteryBoxMinus', 'galvanometerG0', 'galvanometerG1', 'leftScrew3', 'bottomScrew1', 'bottomScrew3', 'bottomScrew4', 'rightScrew1'],
  bottomScrew3: ['batteryPlus', 'batteryMinus', 'batteryBoxPlus', 'batteryBoxMinus', 'galvanometerG0', 'galvanometerG1', 'leftScrew3', 'bottomScrew1', 'bottomScrew2', 'bottomScrew4', 'rightScrew1'],
  bottomScrew4: ['batteryPlus', 'batteryMinus', 'batteryBoxPlus', 'batteryBoxMinus', 'galvanometerG0', 'galvanometerG1', 'leftScrew3', 'bottomScrew1', 'bottomScrew2', 'bottomScrew3', 'rightScrew1'],
  rightScrew1: ['batteryPlus', 'batteryMinus', 'batteryBoxPlus', 'batteryBoxMinus', 'galvanometerG0', 'galvanometerG1', 'leftScrew3', 'bottomScrew1', 'bottomScrew2', 'bottomScrew3', 'bottomScrew4'],
};

function useAssetLoader(urls) {
  const [images, setImages] = useState({});
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const entries = Object.entries(urls);
    const loaded = {};
    let done = 0;

    entries.forEach(([key, url]) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        loaded[key] = img;
        done += 1;
        setProgress(Math.round((done / entries.length) * 100));
        if (done === entries.length) {
          setImages(loaded);
        }
      };
      img.onerror = () => setError(new Error(`Failed to load ${key}`));
      img.src = url;
    });
  }, [urls]);

  return { images, progress, error };
}

function drawSocket(ctx, x, y, radius, label, isActive, plugKeyImg) {
  const socketSize = 24;
  const halfSize = socketSize / 2;

  if (isActive) {
    ctx.save();
    ctx.globalAlpha = 0.25;
    if (plugKeyImg) {
      ctx.drawImage(plugKeyImg, x - halfSize, y - halfSize, socketSize, socketSize);
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,245,255,0.2)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00f5ff';
    ctx.stroke();

    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,245,255,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else {
    if (plugKeyImg) {
      ctx.drawImage(plugKeyImg, x - halfSize, y - halfSize, socketSize, socketSize);
    } else {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15,23,42,0.8)';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0,245,255,0.35)';
      ctx.stroke();
    }
  }

  const badgePadX = 4;
  const badgePadY = 2;
  const badgeRadius = 3;
  ctx.font = 'bold 11px "Space Grotesk", sans-serif';
  const metrics = ctx.measureText(label);
  const textWidth = metrics.width;
  const textHeight = 13;
  const bx = x - textWidth / 2 - badgePadX;
  const by = y - radius - textHeight - badgePadY;
  const bw = textWidth + badgePadX * 2;
  const bh = textHeight + badgePadY * 2;

  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.moveTo(bx + badgeRadius, by);
  ctx.lineTo(bx + bw - badgeRadius, by);
  ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + badgeRadius);
  ctx.lineTo(bx + bw, by + bh - badgeRadius);
  ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - badgeRadius, by + bh);
  ctx.lineTo(bx + badgeRadius, by + bh);
  ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - badgeRadius);
  ctx.lineTo(bx, by + badgeRadius);
  ctx.quadraticCurveTo(bx, by, bx + badgeRadius, by);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, by + bh / 2);
}

function buildTerminalHitAreas(dimensions, boardImg, batteryBoxYOffset = 0) {
  const { width, height } = dimensions;
  let drawWidth = width;
  let drawHeight = height;
  let offsetX = 0;
  let offsetY = 0;

  if (boardImg) {
    const boardAspect = boardImg.naturalWidth / boardImg.naturalHeight;
    drawWidth = width;
    drawHeight = width / boardAspect;
    if (drawHeight < height) {
      drawHeight = height;
      drawWidth = height * boardAspect;
    }
    offsetX = (width - drawWidth) / 2;
    offsetY = (height - drawHeight) / 2;
  }

  const boardHitAreas = Object.fromEntries(
    Object.entries(TERMINALS).filter(([, terminal]) => terminal.component !== 'batteryBox').map(([id, terminal]) => {
      const cx = offsetX + terminal.x * drawWidth;
      const cy = offsetY + terminal.y * drawHeight;
      return [id, { x: cx, y: cy, radius: TERMINAL_RADIUS }];
    })
  );

  const externalHitAreas = Object.fromEntries(
    Object.entries(TERMINALS).filter(([, terminal]) => terminal.component === 'batteryBox').map(([id, terminal]) => {
      const cx = terminal.x * width;
      const cy = batteryBoxYOffset + terminal.y * 80;
      return [id, { x: cx, y: cy, radius: TERMINAL_RADIUS }];
    })
  );

  return { ...boardHitAreas, ...externalHitAreas };
}

function getTerminalScreenPositions(dimensions, boardImg, batteryBoxYOffset = 0) {
  const { width, height } = dimensions;
  let drawWidth = width;
  let drawHeight = height;
  let offsetX = 0;
  let offsetY = 0;

  if (boardImg) {
    const boardAspect = boardImg.naturalWidth / boardImg.naturalHeight;
    drawWidth = width;
    drawHeight = width / boardAspect;
    if (drawHeight < height) {
      drawHeight = height;
      drawWidth = height * boardAspect;
    }
    offsetX = (width - drawWidth) / 2;
    offsetY = (height - drawHeight) / 2;
  }

  const boardTerminals = Object.fromEntries(
    Object.entries(TERMINALS).filter(([, terminal]) => terminal.component !== 'batteryBox').map(([id, terminal]) => {
      return [id, { x: offsetX + terminal.x * drawWidth, y: offsetY + terminal.y * drawHeight }];
    })
  );

  const externalTerminals = Object.fromEntries(
    Object.entries(TERMINALS).filter(([, terminal]) => terminal.component === 'batteryBox').map(([id, terminal]) => {
      return [id, { x: terminal.x * width, y: batteryBoxYOffset + terminal.y * 80 }];
    })
  );

  return { ...boardTerminals, ...externalTerminals };
}

const UNKNOWN_RESISTANCE_X = 12.5;
const BATTERY_VOLTAGE = 3;
const GALVANOMETER_RESISTANCE = 100;

const SOCKET_DEFAULT_STATE = Object.fromEntries(
  Object.entries(SOCKET_GROUPS).flatMap(([, group]) =>
    group.sockets.map((socket) => [socket.id, false])
  )
);

function calculateArmResistances(pluggedSockets) {
  const sumArm = (groupKey) =>
    SOCKET_GROUPS[groupKey].sockets.reduce((sum, socket) => {
      return sum + (pluggedSockets[socket.id] ? socket.resistance : 0);
    }, 0);

  return {
    P: sumArm('P'),
    Q: sumArm('Q'),
    R: sumArm('R'),
    X: UNKNOWN_RESISTANCE_X,
  };
}

function buildAdjacencyGraph(wires) {
  const graph = new Map();
  const addEdge = (a, b) => {
    if (!graph.has(a)) graph.set(a, new Set());
    if (!graph.has(b)) graph.set(b, new Set());
    graph.get(a).add(b);
    graph.get(b).add(a);
  };
  wires.forEach((w) => addEdge(w.fromTerminalId, w.toTerminalId));
  return graph;
}

function bfsReachable(graph, startNodes) {
  const visited = new Set();
  const queue = [...startNodes];
  startNodes.forEach((n) => visited.add(n));
  while (queue.length > 0) {
    const node = queue.shift();
    const neighbors = graph.get(node);
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
  }
  return visited;
}

function validateCircuitConnections(wires, pluggedSockets, unknownResWire) {
  const graph = buildAdjacencyGraph(wires);

  const batteryPosSources = ['batteryPlus', 'batteryBoxPlus'];
  const batteryNegSources = ['batteryMinus', 'batteryBoxMinus'];

  const hasPosSource = batteryPosSources.some((s) => graph.has(s));
  const hasNegSource = batteryNegSources.some((s) => graph.has(s));
  if (!hasPosSource || !hasNegSource) return { valid: false, reason: 'Battery not connected' };

  const posReachable = bfsReachable(graph, batteryPosSources);
  const negReachable = bfsReachable(graph, batteryNegSources);

  const batteryPosToRS1 = posReachable.has('rightScrew1');
  if (!batteryPosToRS1) return { valid: false, reason: 'Battery (+) not connected to RS1' };

  const batteryNegToK2 = negReachable.has('bottomScrew3') || negReachable.has('bottomScrew4');
  if (!batteryNegToK2) return { valid: false, reason: 'Battery (-) not connected to K2 base (BS3/BS4)' };

  const galvSources = ['galvanometerG0', 'galvanometerG1'].filter((s) => graph.has(s));
  if (galvSources.length < 2) return { valid: false, reason: 'Galvanometer not connected' };
  const galvReachable = bfsReachable(graph, galvSources);

  const galvG0ToLS3 = galvReachable.has('leftScrew3');
  if (!galvG0ToLS3) return { valid: false, reason: 'Galvanometer G0 not connected to LS3' };

  const galvG1ToK1 = galvReachable.has('bottomScrew1') || galvReachable.has('bottomScrew2');
  if (!galvG1ToK1) return { valid: false, reason: 'Galvanometer G1 not connected to K1 base (BS1/BS2)' };

  const end1 = unknownResWire.end1Terminal;
  const end2 = unknownResWire.end2Terminal;
  const resWireConnected = (end1 === 'leftScrew3' && end2 === 'rightScrew1') || (end1 === 'rightScrew1' && end2 === 'leftScrew3');
  if (!resWireConnected) return { valid: false, reason: 'Unknown resistance S not connected across LS3 and RS1' };

  const arms = calculateArmResistances(pluggedSockets);
  if (arms.P <= 0 || arms.Q <= 0) {
    return { valid: false, reason: 'Ratio arms P and Q must be plugged' };
  }

  return { valid: true, arms };
}

function calculateGalvanometerCurrent(arms, batteryVoltage, galvanometerResistance) {
  const { P, Q, R, X } = arms;
  
  if (R === 0) {
    return { ig: 30.0, polarity: 1, balanced: false, extreme: 'R=0' };
  }
  if (R === Infinity) {
    return { ig: 30.0, polarity: -1, balanced: false, extreme: 'R=∞' };
  }
  
  if (P <= 0 || Q <= 0 || X <= 0) return { ig: 0, polarity: 0, balanced: false };

  const Va = batteryVoltage;
  const Vc = 0;
  const Rg = galvanometerResistance;

  const a = 1 / P + 1 / R + 1 / Rg;
  const b = 1 / Q + 1 / X + 1 / Rg;
  const c = 1 / Rg;

  const det = a * b - c * c;
  if (Math.abs(det) < 1e-12) return { ig: 0, polarity: 0, balanced: false };

  const rhs1 = Va / P + Vc / R;
  const rhs2 = Va / Q + Vc / X;

  const Vb = (b * rhs1 + c * rhs2) / det;
  const Vd = (c * rhs1 + a * rhs2) / det;

  const ig = (Vd - Vb) / Rg;
  const polarity = ig > 0 ? 1 : ig < 0 ? -1 : 0;
  const balanced = Math.abs(P / Q - R / X) < 0.01;

  return {
    ig: Math.abs(ig) * 1000,
    polarity,
    balanced,
    Vb,
    Vd,
    P,
    Q,
    R,
    X,
  };
}

function getControlPoint(from, to) {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const curvature = Math.min(40, dist * 0.35);
  const nx = -dy / (dist || 1);
  const ny = dx / (dist || 1);
  return { x: midX + nx * curvature, y: midY + ny * curvature };
}

const PostOfficeBoxExperiment = () => {
  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const { images, progress, error } = useAssetLoader(ASSETS);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const needleAngleRef = useRef(0);
  const needleVelocityRef = useRef(0);
  const animationRef = useRef(null);
  const [wires, setWires] = useState([]);
  const [hoveredTerminal, setHoveredTerminal] = useState(null);
  const [draggingFrom, setDraggingFrom] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [dragWireId, setDragWireId] = useState(null);
  const [dragWireEnd, setDragWireEnd] = useState(null);
  const [pluggedSockets, setPluggedSockets] = useState(SOCKET_DEFAULT_STATE);
  const [bridgeResult, setBridgeResult] = useState({ valid: false, reason: 'Incomplete circuit', arms: null, ig: 0, polarity: 0, balanced: false });
  const targetAngleRef = useRef(0);
  const [k1Pressed, setK1Pressed] = useState(false);
  const [k2Pressed, setK2Pressed] = useState(false);
  const [showKeyWarning, setShowKeyWarning] = useState(false);
  const [observations, setObservations] = useState([]);
  const [showObservationTable, setShowObservationTable] = useState(false);
  const nextIdRef = useRef(1);
  const nextObsIdRef = useRef(1);
  const latestPointRef = useRef(null);
  const rafPendingRef = useRef(false);
  const [unknownResWire, setUnknownResWire] = useState({
    id: 'unknown-res-s',
    x: 0.50,
    y: 0.20,
    width: 0.30,
    end1Terminal: null,
    end2Terminal: null,
    color: '#d97706',
    orientation: 'horizontal',
  });
  const [dragResEnd, setDragResEnd] = useState(null);
  const RES_HANDLE_RADIUS = 14;
  const [hintTerminals, setHintTerminals] = useState([]);
  const [hintMessage, setHintMessage] = useState(null);
  const [hintSWireTerminal, setHintSWireTerminal] = useState(null);

  const batteryBoxYOffset = (dimensions.height || 560) + 16 + 12;
  const terminalPositions = dimensions.width && images.board ? getTerminalScreenPositions(dimensions, images.board, batteryBoxYOffset) : {};

  const resizeCanvas = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = Math.max(560, Math.min(760, width * 0.65));

    setDimensions({ width, height });
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dimensions.width) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const { width, height } = dimensions;
    ctx.clearRect(0, 0, width, height);

    const boardImg = images.board;
    if (boardImg) {
      const boardAspect = boardImg.naturalWidth / boardImg.naturalHeight;
      let drawWidth = width;
      let drawHeight = width / boardAspect;
      if (drawHeight < height) {
        drawHeight = height;
        drawWidth = height * boardAspect;
      }
      const offsetX = (width - drawWidth) / 2;
      const offsetY = (height - drawHeight) / 2;

      ctx.drawImage(boardImg, offsetX, offsetY, drawWidth, drawHeight);

      Object.values(SOCKET_GROUPS).forEach((group) => {
        group.sockets.forEach((socket) => {
          const sx = offsetX + socket.x * drawWidth;
          const sy = offsetY + socket.y * drawHeight;
          drawSocket(ctx, sx, sy, 10, `${socket.resistance}Ω`, pluggedSockets[socket.id], images.plugKey);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '8px "Space Grotesk", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(socket.id, sx, sy + 14);
        });
      });
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      Object.values(SOCKET_GROUPS).forEach((group) => {
        group.sockets.forEach((socket) => {
          const sx = socket.x * width;
          const sy = socket.y * height;
          drawSocket(ctx, sx, sy, 10, `${socket.resistance}Ω`, pluggedSockets[socket.id], images.plugKey);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '8px "Space Grotesk", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(socket.id, sx, sy + 14);
        });
      });

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Loading board assets...', width / 2, height / 2);
    }

    const galv = COMPONENTS.galvanometer;
    if (images[galv.src] && boardImg) {
      const drawWidth = width;
      const drawHeight = width / (boardImg.naturalWidth / boardImg.naturalHeight);
      const offsetX = (width - drawWidth) / 2;
      const offsetY = (height - drawHeight) / 2;

      const gx = offsetX + galv.x * drawWidth - (galv.width * drawWidth) / 2;
      const gy = offsetY + galv.y * drawHeight - (galv.height * drawHeight) / 2;
      const gw = galv.width * drawWidth;
      const gh = galv.height * drawHeight;

      ctx.drawImage(images[galv.src], gx, gy, gw, gh);

      const needle = COMPONENTS.galvanometerNeedle;
      const nx = offsetX + needle.offsetX * drawWidth;
      const ny = offsetY + needle.offsetY * drawHeight;
      const nw = needle.width * drawWidth;
      const nh = needle.height * drawHeight;

      ctx.save();
      ctx.translate(nx, ny + nh * needle.pivotY);
      ctx.rotate(needleAngleRef.current);
      ctx.drawImage(images[needle.src], -nw / 2, -nh, nw, nh);
      ctx.restore();
    }
  }, [images, dimensions, pluggedSockets]);

  useEffect(() => {
    const animate = () => {
      needleAngleRef.current += needleVelocityRef.current;
      needleVelocityRef.current += (targetAngleRef.current - needleAngleRef.current) * 0.05;
      needleVelocityRef.current *= 0.92;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  const getCanvasPoint = useCallback((clientX, clientY) => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !dimensions.width) return null;
    const rect = wrapper.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, [dimensions.width]);

  const findWireAtTerminal = useCallback((terminalId, wiresList) => {
    return wiresList.find((w) => w.fromTerminalId === terminalId || w.toTerminalId === terminalId) || null;
  }, []);

  const scheduleDragUpdate = useCallback((point) => {
    latestPointRef.current = point;
    if (!rafPendingRef.current) {
      rafPendingRef.current = true;
      requestAnimationFrame(() => {
        rafPendingRef.current = false;
        if (latestPointRef.current) {
          setDragEnd(latestPointRef.current);
        }
      });
    }
  }, []);

  const getResWireEndpoints = useCallback((wire, dimensions) => {
    const { width, height } = dimensions;
    const cx = wire.x * width;
    const cy = wire.y * height;
    const isVertical = wire.orientation === 'vertical';
    const halfSize = ((isVertical ? wire.height : wire.width) * (isVertical ? height : width)) / 2;

    let end1X = cx;
    let end1Y = isVertical ? cy - halfSize : cy;
    let end2X = cx;
    let end2Y = isVertical ? cy + halfSize : cy;

    if (!isVertical) {
      end1X = cx - halfSize;
      end2X = cx + halfSize;
    }

    if (wire.end1Terminal && terminalPositions[wire.end1Terminal]) {
      const pos = terminalPositions[wire.end1Terminal];
      end1X = pos.x;
      end1Y = pos.y;
    }
    if (wire.end2Terminal && terminalPositions[wire.end2Terminal]) {
      const pos = terminalPositions[wire.end2Terminal];
      end2X = pos.x;
      end2Y = pos.y;
    }

    return { end1: { x: end1X, y: end1Y }, end2: { x: end2X, y: end2Y }, cx, cy, halfSize };
  }, [terminalPositions]);

  const hitTestResHandle = useCallback((point, wire, dimensions) => {
    if (!point || !dimensions.width) return null;
    const { end1, end2 } = getResWireEndpoints(wire, dimensions);
    const dx1 = point.x - end1.x;
    const dy1 = point.y - end1.y;
    if (dx1 * dx1 + dy1 * dy1 <= RES_HANDLE_RADIUS * RES_HANDLE_RADIUS) return 'end1';
    const dx2 = point.x - end2.x;
    const dy2 = point.y - end2.y;
    if (dx2 * dx2 + dy2 * dy2 <= RES_HANDLE_RADIUS * RES_HANDLE_RADIUS) return 'end2';
    return null;
  }, [getResWireEndpoints]);

  const buildResistorZigZag = useCallback((end1, end2, cx, cy) => {
    const dx = end2.x - end1.x;
    const dy = end2.y - end1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 20) return `M ${end1.x} ${end1.y} L ${end2.x} ${end2.y}`;

    const nx = dx / dist;
    const ny = dy / dist;
    const px = -ny;
    const py = nx;

    const segments = 6;
    const segLen = dist / (segments + 1);
    const amplitude = Math.min(12, dist * 0.08);

    let path = `M ${end1.x} ${end1.y}`;
    for (let i = 1; i <= segments; i++) {
      const t = i / (segments + 1);
      const midX = end1.x + dx * t;
      const midY = end1.y + dy * t;
      const sign = i % 2 === 1 ? 1 : -1;
      const zX = midX + px * amplitude * sign;
      const zY = midY + py * amplitude * sign;
      path += ` L ${zX} ${zY}`;
    }
    path += ` L ${end2.x} ${end2.y}`;
    return path;
  }, []);

  const hitTestTerminal = useCallback((point) => {
    if (!point || !images.board || !dimensions.width) return null;
    const batteryBoxYOffset = (dimensions.height || 560) + 16 + 12;
    const hitAreas = buildTerminalHitAreas(dimensions, images.board, batteryBoxYOffset);
    for (const [id, area] of Object.entries(hitAreas)) {
      const dx = point.x - area.x;
      const dy = point.y - area.y;
      if (dx * dx + dy * dy <= (area.radius + 12) * (area.radius + 12)) {
        return id;
      }
    }
    return null;
  }, [dimensions, images.board]);

  const handleCanvasMouseMove = useCallback((e) => {
    const point = getCanvasPoint(e.clientX, e.clientY);
    if (!point) return;

    if (dragResEnd) {
      scheduleDragUpdate(point);
      return;
    }

    if (draggingFrom || dragWireId) {
      scheduleDragUpdate(point);
      return;
    }
    const hit = hitTestTerminal(point);
    setHoveredTerminal(hit);
  }, [draggingFrom, dragWireId, dragResEnd, getCanvasPoint, hitTestTerminal, scheduleDragUpdate]);

  const handleCanvasMouseDown = useCallback((e) => {
    const point = getCanvasPoint(e.clientX, e.clientY);

    if (dimensions.width) {
      const handleHit = hitTestResHandle(point, unknownResWire, dimensions);
      if (handleHit) {
        setDragResEnd(handleHit);
        setDragEnd(point);
        return;
      }
    }

    const hit = hitTestTerminal(point);
    if (!hit) return;

    setDraggingFrom(hit);
    setDragEnd(point);
  }, [getCanvasPoint, hitTestTerminal, hitTestResHandle, unknownResWire, dimensions]);

  const findNearestSnapTerminal = useCallback((point, terminals, maxDist = 30) => {
    if (!point || !terminals) return null;
    let closest = null;
    let closestDist = maxDist * maxDist;
    for (const [id, pos] of Object.entries(terminals)) {
      if (id !== 'leftScrew3' && id !== 'rightScrew1') continue;
      const dx = point.x - pos.x;
      const dy = point.y - pos.y;
      const dist = dx * dx + dy * dy;
      if (dist < closestDist) {
        closestDist = dist;
        closest = id;
      }
    }
    return closest;
  }, []);

  const handleCanvasMouseUp = useCallback((e) => {
    if (dragResEnd) {
      const point = getCanvasPoint(e.clientX, e.clientY);
      const snapTarget = findNearestSnapTerminal(point, terminalPositions, 35);
      if (snapTarget) {
        setUnknownResWire((prev) => ({
          ...prev,
          [dragResEnd === 'end1' ? 'end1Terminal' : 'end2Terminal']: snapTarget,
        }));
      } else {
        setUnknownResWire((prev) => ({
          ...prev,
          [dragResEnd === 'end1' ? 'end1Terminal' : 'end2Terminal']: null,
        }));
      }
      setDragResEnd(null);
      setDragEnd(null);
      return;
    }

    if (dragWireId) {
      const point = getCanvasPoint(e.clientX, e.clientY);
      const targetId = hitTestTerminal(point);
      const wire = wires.find((w) => w.id === dragWireId);
      if (targetId && targetId !== draggingFrom && wire) {
        const allowed = VALID_CONNECTIONS[draggingFrom] || [];
        if (allowed.includes(targetId)) {
          setWires((prev) =>
            prev.map((w) => {
              if (w.id !== dragWireId) return w;
              return dragWireEnd === 'from'
                ? { ...w, fromTerminalId: targetId }
                : { ...w, toTerminalId: targetId };
            })
          );
        } else {
          setWires((prev) => prev.filter((w) => w.id !== dragWireId));
        }
      } else {
        setWires((prev) => prev.filter((w) => w.id !== dragWireId));
      }
      setDragWireId(null);
      setDragWireEnd(null);
      setDraggingFrom(null);
      setDragEnd(null);
      return;
    }

    if (!draggingFrom) return;
    const point = getCanvasPoint(e.clientX, e.clientY);
    const targetId = hitTestTerminal(point);
    if (targetId && targetId !== draggingFrom) {
      const allowed = VALID_CONNECTIONS[draggingFrom] || [];
      if (allowed.includes(targetId)) {
        const terminalA = TERMINALS[draggingFrom];
        const terminalB = TERMINALS[targetId];
        const color = terminalA.color || terminalB.color || '#00f5ff';
        setWires((prev) => [...prev, {
          id: nextIdRef.current++,
          fromTerminalId: draggingFrom,
          toTerminalId: targetId,
          color,
        }]);
      }
    }
    setDraggingFrom(null);
    setDragEnd(null);
  }, [draggingFrom, dragWireId, dragWireEnd, dragResEnd, getCanvasPoint, hitTestTerminal, wires, findNearestSnapTerminal, terminalPositions]);

  const handleWireDoubleClick = useCallback((wireId) => {
    setWires((prev) => prev.filter((w) => w.id !== wireId));
  }, []);

  const handleTerminalDoubleClick = useCallback((terminalId) => {
    setWires((prev) => prev.filter((w) => w.fromTerminalId !== terminalId && w.toTerminalId !== terminalId));
  }, []);

  useEffect(() => {
    if (!k1Pressed || !k2Pressed) {
      const reason = k2Pressed && !k1Pressed ? 'Close K1 before K2' : 'Press K1 then K2 to energize circuit';
      setBridgeResult({ valid: false, reason, arms: null, ig: 0, polarity: 0, balanced: false });
      targetAngleRef.current = 0;
      return;
    }

    const validation = validateCircuitConnections(wires, pluggedSockets, unknownResWire);
    if (!validation.valid) {
      setBridgeResult({ valid: false, reason: validation.reason, arms: null, ig: 0, polarity: 0, balanced: false });
      targetAngleRef.current = 0;
      return;
    }
    const result = calculateGalvanometerCurrent(validation.arms, BATTERY_VOLTAGE, GALVANOMETER_RESISTANCE);
    const angle = result.polarity * Math.min(30, result.ig * 5);
    targetAngleRef.current = angle;
    setBridgeResult({ ...result, valid: true, reason: 'Circuit complete' });
  }, [wires, pluggedSockets, k1Pressed, k2Pressed, unknownResWire]);

  const toggleSocket = useCallback((socketId) => {
    setPluggedSockets((prev) => ({ ...prev, [socketId]: !prev[socketId] }));
  }, []);

  const handleK1Click = useCallback(() => {
    setK1Pressed((prev) => !prev);
    if (!k1Pressed) setK2Pressed(false);
  }, [k1Pressed]);

  const handleK2Click = useCallback(() => {
    if (!k1Pressed) {
      setShowKeyWarning(true);
      setTimeout(() => setShowKeyWarning(false), 3000);
      return;
    }
    setK2Pressed((prev) => !prev);
  }, [k1Pressed]);

  const addObservation = useCallback(() => {
    if (!bridgeResult.valid || !bridgeResult.arms) return;

    const { P, Q, R, X } = bridgeResult.arms;
    const deflectionDivisions = bridgeResult.polarity * Math.min(30, bridgeResult.ig * 5);
    const deflectionDirection = bridgeResult.polarity === 0 ? 'Zero' : bridgeResult.polarity > 0 ? 'Right' : 'Left';

    let d1, d2;
    if (bridgeResult.balanced) {
      d1 = 0;
      d2 = 1;
    } else {
      d1 = Math.abs(deflectionDivisions) || 0.1;
      d2 = 5;
    }

    const baseS = (Q / P) * R;
    const estimatedRange = deflectionDirection === 'Zero'
      ? `~${baseS.toFixed(2)} Ω`
      : deflectionDirection === 'Right'
        ? `<${baseS.toFixed(2)} Ω`
        : `>${baseS.toFixed(2)} Ω`;

    const finalS = (Q / P) * (R + d1 / (d1 + d2));

    setObservations((prev) => [
      ...prev,
      {
        id: nextObsIdRef.current++,
        P,
        Q,
        R,
        deflectionDirection,
        estimatedRange,
        finalS: finalS.toFixed(2),
        d1: d1.toFixed(2),
        d2: d2.toFixed(2),
      },
    ]);
  }, [bridgeResult]);

  const resetCircuit = useCallback(() => {
    setWires([]);
    setPluggedSockets(SOCKET_DEFAULT_STATE);
    setK1Pressed(false);
    setK2Pressed(false);
    setShowKeyWarning(false);
    setBridgeResult({ valid: false, reason: 'Incomplete circuit', arms: null, ig: 0, polarity: 0, balanced: false });
    setObservations([]);
    setShowObservationTable(false);
    setUnknownResWire({
      id: 'unknown-res-s',
      x: 0.50,
      y: 0.20,
      width: 0.30,
      end1Terminal: null,
      end2Terminal: null,
      color: '#d97706',
      orientation: 'horizontal',
    });
  }, []);

  const hasWireBetween = useCallback((wires, termA, termB) => {
    return wires.some((w) =>
      (w.fromTerminalId === termA && w.toTerminalId === termB) ||
      (w.fromTerminalId === termB && w.toTerminalId === termA)
    );
  }, []);

  const handleHint = useCallback(() => {
    const requiredConnections = [
      {
        id: 'bat-pos-rs1',
        check: () => hasWireBetween(wires, 'batteryPlus', 'rightScrew1') || hasWireBetween(wires, 'batteryBoxPlus', 'rightScrew1'),
        hintTerminals: ['batteryPlus', 'rightScrew1'],
        label: 'Battery (+) ↔ RS1',
      },
      {
        id: 'bat-neg-k2',
        check: () => hasWireBetween(wires, 'batteryMinus', 'bottomScrew3') || hasWireBetween(wires, 'batteryMinus', 'bottomScrew4') || hasWireBetween(wires, 'batteryBoxMinus', 'bottomScrew3') || hasWireBetween(wires, 'batteryBoxMinus', 'bottomScrew4'),
        hintTerminals: ['batteryMinus', 'bottomScrew4'],
        label: 'Battery (-) ↔ K2 Base',
      },
      {
        id: 'g0-ls3',
        check: () => hasWireBetween(wires, 'galvanometerG0', 'leftScrew3'),
        hintTerminals: ['galvanometerG0', 'leftScrew3'],
        label: 'Galvanometer G0 ↔ LS3',
      },
      {
        id: 'g1-k1',
        check: () => hasWireBetween(wires, 'galvanometerG1', 'bottomScrew1') || hasWireBetween(wires, 'galvanometerG1', 'bottomScrew2'),
        hintTerminals: ['galvanometerG1', 'bottomScrew1'],
        label: 'Galvanometer G1 ↔ K1 Base',
      },
    ];

    const sEnd1 = unknownResWire.end1Terminal;
    const sEnd2 = unknownResWire.end2Terminal;
    const sTerm1Connected = sEnd1 === 'leftScrew3' || sEnd1 === 'rightScrew1';
    const sTerm2Connected = sEnd2 === 'leftScrew3' || sEnd2 === 'rightScrew1';
    const sConnected = (sEnd1 === 'leftScrew3' && sEnd2 === 'rightScrew1') || (sEnd1 === 'rightScrew1' && sEnd2 === 'leftScrew3');

    const missing = requiredConnections.filter((conn) => !conn.check());

    if (!sTerm1Connected) {
      missing.push({
        id: 's-term1',
        hintTerminals: ['leftScrew3'],
        hintSWire: 1,
        label: 'Unknown S (Terminal 1) ↔ LS3',
      });
    }

    if (!sTerm2Connected) {
      missing.push({
        id: 's-term2',
        hintTerminals: ['rightScrew1'],
        hintSWire: 2,
        label: 'Unknown S (Terminal 2) ↔ RS1',
      });
    }

    if (missing.length === 0) {
      if (!k1Pressed || !k2Pressed) {
        setHintTerminals([]);
        setHintSWireTerminal(null);
        setHintMessage(!k1Pressed ? 'Press K1 (Battery Key) to energize circuit' : 'Press K2 (Galvanometer Key) to complete circuit');
        setTimeout(() => setHintMessage(null), 3000);
        return;
      }
      setHintMessage('সব কানেকশন ঠিক আছে।');
      setHintTerminals([]);
      setHintSWireTerminal(null);
      setTimeout(() => setHintMessage(null), 3000);
      return;
    }

    const randomMissing = missing[Math.floor(Math.random() * missing.length)];
    setHintTerminals(randomMissing.hintTerminals);
    setHintSWireTerminal(randomMissing.hintSWire || null);
    setHintMessage(null);

    setTimeout(() => {
      setHintTerminals([]);
      setHintSWireTerminal(null);
    }, 2500);
  }, [wires, unknownResWire, k1Pressed, k2Pressed, hasWireBetween]);

  return (
    <PageShell className="min-h-[calc(100vh-3.5rem)] text-slate-100">
      <style>{`
        @keyframes hint-pulse {
          0%, 100% { opacity: 1; r: 12; }
          50% { opacity: 0.5; r: 18; }
        }
        .hint-pulse {
          animation: hint-pulse 0.6s ease-in-out 4;
        }
      `}</style>
      <div className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400">
                <FaPlay className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h1 className="aura-headline text-xl sm:text-2xl">Post Office Box Experiment</h1>
                <p className="aura-subhead text-sm mt-0.5">
                  Physics — Resistance measurement via meter bridge.
                </p>
              </div>
            </div>
            <Button to="/virtual-lab/physics" variant="secondary">
              <FaArrowLeft className="h-4 w-4 mr-2" aria-hidden />
              Back
            </Button>
          </div>

          <div className="aura-glass aura-glass-card rounded-2xl border border-cyan-500/10 shadow-lg shadow-cyan-500/10 p-6 sm:p-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
               <div className="rounded-xl border border-cyan-500/10 bg-black/20 p-4 text-center">
                 <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Apparatus</p>
                 <p className="text-sm text-slate-200">Post Office Box, Galvanometer, Resistance Wire (Unknown X), Battery, Keys (K1, K2), Connecting Wires.</p>
               </div>
               <div className="rounded-xl border border-cyan-500/10 bg-black/20 p-4 text-center">
                 <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Theory</p>
                 <p className="text-sm text-slate-200">Wheatstone bridge principle: Unknown resistance S = (Q / P) * R when bridge is balanced.</p>
               </div>
               <div className="rounded-xl border border-cyan-500/10 bg-black/20 p-4 text-center">
                 <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Formula</p>
                 <p className="text-sm text-slate-200 font-mono">S = (Q / P) × R</p>
               </div>
            </div>

              <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Workspace</p>
                  <p className="text-xs text-slate-500">{progress}% loaded</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <button
                    type="button"
                    onClick={handleK1Click}
                    className={`px-5 py-2.5 rounded-lg text-xs font-bold border-2 transition-all select-none ${
                      k1Pressed
                        ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-lg shadow-emerald-500/30 scale-95'
                        : 'bg-slate-800/50 border-slate-500/50 text-slate-300 hover:border-emerald-500/50 hover:bg-emerald-500/10 active:scale-95'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${k1Pressed ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                      {k1Pressed ? 'K1 ON' : 'K1 (Battery Key)'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleK2Click}
                    className={`px-5 py-2.5 rounded-lg text-xs font-bold border-2 transition-all select-none ${
                      k2Pressed
                        ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-lg shadow-amber-500/30 scale-95'
                        : k1Pressed
                          ? 'bg-slate-800/50 border-slate-500/50 text-slate-300 hover:border-amber-500/50 hover:bg-amber-500/10 active:scale-95'
                          : 'bg-slate-800/30 border-slate-600/30 text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${k2Pressed ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`} />
                      {k2Pressed ? 'K2 ON' : 'K2 (Galvanometer Key)'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={resetCircuit}
                    className="px-4 py-2.5 rounded-lg text-xs font-bold border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors"
                  >
                    Reset Circuit &amp; Plugs
                  </button>
                  <button
                    type="button"
                    onClick={handleHint}
                    className="px-4 py-2.5 rounded-lg text-xs font-bold border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20 transition-colors"
                  >
                    💡 Hint
                  </button>
                </div>

                {hintMessage && (
                  <div className="mb-4 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                    {hintMessage}
                  </div>
                )}

                {showKeyWarning && (
                  <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                    Always close Battery Key (K1) before Galvanometer Key (K2).
                  </div>
                )}
                <div
                  ref={wrapperRef}
                  className="relative touch-none select-none"
                  onMouseMove={handleCanvasMouseMove}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseUp={handleCanvasMouseUp}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    handleCanvasMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
                  }}
                  onTouchMove={(e) => {
                    const touch = e.touches[0];
                    handleCanvasMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
                  }}
                  onTouchEnd={(e) => {
                    const touch = e.changedTouches[0];
                    handleCanvasMouseUp({ clientX: touch.clientX, clientY: touch.clientY });
                  }}
                  onMouseLeave={() => {
                    setHoveredTerminal(null);
                    setDraggingFrom(null);
                    setDragEnd(null);
                    setDragWireId(null);
                    setDragWireEnd(null);
                    setDragResEnd(null);
                  }}
                >
                <div
                  ref={containerRef}
                  className="relative w-full rounded-xl overflow-hidden border border-cyan-500/10 bg-black/30 select-none"
                  style={{ height: Math.max(560, Math.min(760, (dimensions.width || 800) * 0.65)) }}
                >
                 {error && (
                   <div className="absolute inset-0 flex items-center justify-center text-red-400 text-sm z-10">
                     {error.message}
                   </div>
                 )}

                 {/* Dynamic Zoom Camera Projection View */}
                {k1Pressed && k2Pressed && (
                  <div className="absolute z-20 pointer-events-none" style={{ top: '5%', right: '5%' }}>
                    {bridgeResult.valid ? (
                      <div className="flex flex-col items-center">
                        <div className="relative w-28 h-28 rounded-full border-4 border-cyan-500/60 bg-black/90 shadow-xl shadow-cyan-500/30 overflow-hidden backdrop-blur-md">
                          {images.galvanometerBody && (
                            <img
                              src={ASSETS.galvanometerBody}
                              alt="Galvanometer dial"
                              className="absolute inset-0 w-full h-full object-cover rounded-full opacity-90"
                            />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-0.5 h-12 bg-cyan-500/20 absolute" />
                            <div className="w-12 h-0.5 bg-cyan-500/20 absolute" />
                          </div>
                          <div
                            className="absolute bottom-1/2 left-1/2 w-1 h-12 origin-bottom transition-transform duration-300 ease-out z-10"
                            style={{
                              transform: `translateX(-50%) rotate(${Math.max(-30, Math.min(30, bridgeResult.polarity * Math.min(30, bridgeResult.ig * 5)))}deg)`,
                              background: bridgeResult.polarity > 0 ? '#ef4444' : bridgeResult.polarity < 0 ? '#3b82f6' : '#94a3b8',
                              borderRadius: '2px',
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center z-20">
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-100 shadow border border-slate-700" />
                          </div>
                          {[-30, -20, -10, 0, 10, 20, 30].map((deg) => {
                            const rad = (deg - 90) * (Math.PI / 180);
                            const x = 50 + 38 * Math.cos(rad);
                            const y = 50 + 38 * Math.sin(rad);
                            return (
                              <span
                                key={deg}
                                className="absolute text-[7px] text-cyan-200/80 font-mono font-bold select-none"
                                style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                              >
                                {deg}
                              </span>
                            );
                          })}
                        </div>
                        <div className="mt-1.5 text-center bg-black/80 px-2.5 py-1 rounded border border-cyan-500/40 shadow-md">
                          <p className="text-[11px] font-mono font-bold text-cyan-300">
                            {bridgeResult.polarity > 0 ? '+' : bridgeResult.polarity < 0 ? '-' : '0'}{bridgeResult.ig.toFixed(2)} mA
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-rose-950/90 border border-rose-500/50 text-rose-200 text-[11px] p-2.5 rounded-lg max-w-[170px] text-center shadow-xl backdrop-blur-md">
                        ⚠️ {bridgeResult.reason}
                      </div>
                    )}
                  </div>
                )}

                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  />
                  
                  {!images.board && !error && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm z-10">
                      Initializing canvas workspace...
                    </div>
                  )}
                </div>

                {/* External Battery Box Panel */}
                <div className="mt-4 aura-glass aura-glass-card rounded-xl border border-cyan-500/10 bg-black/20 p-3">
                  <div className="flex items-center gap-4">
                    <div className="relative w-28 h-20 bg-gradient-to-b from-slate-700 to-slate-800 border-2 border-slate-500 rounded-lg shadow-lg flex flex-col items-center justify-center gap-1">
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full border border-red-300" />
                      <div className="absolute -top-1 left-1/2 translate-x-3 w-3 h-3 bg-slate-900 rounded-full border border-slate-500" />
                      <span className="text-[10px] font-bold text-slate-300 tracking-wider">BATTERY</span>
                      <div className="flex gap-3 mt-1">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="text-[9px] text-red-400 font-bold">+</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-500" />
                          <span className="text-[9px] text-slate-400 font-bold">-</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-300">External Battery</p>
                      <p className="text-[10px] text-slate-400">Connect B+ to board A/C and B- to board B/D</p>
                    </div>
                  </div>
                </div>

                <svg
                  ref={svgRef}
                  className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                  style={{ zIndex: 10 }}
                >
                  <defs>
                    <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {wires.map((wire) => {
                    const fromPos = terminalPositions[wire.fromTerminalId];
                    const toPos = terminalPositions[wire.toTerminalId];
                    if (!fromPos || !toPos) return null;
                    const cp = getControlPoint(fromPos, toPos);
                    return (
                      <path
                        key={wire.id}
                        d={`M ${fromPos.x} ${fromPos.y} Q ${cp.x} ${cp.y} ${toPos.x} ${toPos.y}`}
                        fill="none"
                        stroke={wire.color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        filter="url(#neon-glow)"
                        className="pointer-events-auto cursor-pointer"
                        onDoubleClick={() => handleWireDoubleClick(wire.id)}
                        style={{ zIndex: 3 }}
                      />
                    );
                  })}

                  {draggingFrom && dragEnd && (() => {
                    if (dragWireId) {
                      const wire = wires.find((w) => w.id === dragWireId);
                      if (!wire) return null;
                      const fixedEnd = dragWireEnd === 'from' ? wire.toTerminalId : wire.fromTerminalId;
                      const fixedPos = terminalPositions[fixedEnd];
                      if (!fixedPos) return null;
                      const terminal = TERMINALS[fixedEnd];
                      const cp = getControlPoint(fixedPos, dragEnd);
                      return (
                        <path
                          d={`M ${fixedPos.x} ${fixedPos.y} Q ${cp.x} ${cp.y} ${dragEnd.x} ${dragEnd.y}`}
                          fill="none"
                          stroke={terminal.color}
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray="6 4"
                          opacity="0.7"
                        />
                      );
                    }
                    const fromPos = terminalPositions[draggingFrom];
                    if (!fromPos) return null;
                    const terminal = TERMINALS[draggingFrom];
                    const cp = getControlPoint(fromPos, dragEnd);
                    return (
                      <path
                        d={`M ${fromPos.x} ${fromPos.y} Q ${cp.x} ${cp.y} ${dragEnd.x} ${dragEnd.y}`}
                        fill="none"
                        stroke={terminal.color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="6 4"
                        opacity="0.7"
                      />
                    );
                  })()}

                  {/* Unknown Resistance Wire (S) */}
                  {dimensions.width && (() => {
                    const { end1, end2, cx, cy } = getResWireEndpoints(unknownResWire, dimensions);
                    const end1Connected = !!unknownResWire.end1Terminal;
                    const end2Connected = !!unknownResWire.end2Terminal;
                    const bothConnected = end1Connected && end2Connected;
                    const end1Pos = dragResEnd === 'end1' ? dragEnd : end1;
                    const end2Pos = dragResEnd === 'end2' ? dragEnd : end2;
                    const sWireHintEnd1 = hintSWireTerminal === 1;
                    const sWireHintEnd2 = hintSWireTerminal === 2;

                    return (
                      <g style={{ zIndex: 5 }}>
                        <path
                          d={buildResistorZigZag(
                            dragResEnd === 'end1' && dragEnd ? dragEnd : end1,
                            dragResEnd === 'end2' && dragEnd ? dragEnd : end2,
                            cx, cy
                          )}
                          fill="none"
                          stroke={unknownResWire.color}
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="url(#neon-glow)"
                          opacity={bothConnected ? 1 : 0.85}
                        />
                        <text
                          x={cx}
                          y={cy - 18}
                          textAnchor="middle"
                          fill={unknownResWire.color}
                          fontSize="11"
                          fontWeight="bold"
                          fontFamily="Space Grotesk, sans-serif"
                        >
                          S (Unknown X)
                        </text>
                        <circle
                          cx={end1Pos.x}
                          cy={end1Pos.y}
                          r={RES_HANDLE_RADIUS}
                          fill={sWireHintEnd1 ? '#fbbf24' : end1Connected ? `${unknownResWire.color}66` : 'rgba(217,119,6,0.2)'}
                          stroke={sWireHintEnd1 ? '#fbbf24' : unknownResWire.color}
                          strokeWidth={sWireHintEnd1 ? '4' : '2.5'}
                          style={{ cursor: 'grab', pointerEvents: 'auto' }}
                          filter="url(#neon-glow)"
                          className={sWireHintEnd1 ? 'hint-pulse' : ''}
                        />
                        <text
                          x={end1Pos.x}
                          y={end1Pos.y}
                          textAnchor="middle"
                          dy="0.35em"
                          fill="#fef3c7"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="Space Grotesk, sans-serif"
                          style={{ pointerEvents: 'none' }}
                        >
                          1
                        </text>
                        <circle
                          cx={end2Pos.x}
                          cy={end2Pos.y}
                          r={RES_HANDLE_RADIUS}
                          fill={sWireHintEnd2 ? '#fbbf24' : end2Connected ? `${unknownResWire.color}66` : 'rgba(217,119,6,0.2)'}
                          stroke={sWireHintEnd2 ? '#fbbf24' : unknownResWire.color}
                          strokeWidth={sWireHintEnd2 ? '4' : '2.5'}
                          style={{ cursor: 'grab', pointerEvents: 'auto' }}
                          filter="url(#neon-glow)"
                          className={sWireHintEnd2 ? 'hint-pulse' : ''}
                        />
                        <text
                          x={end2Pos.x}
                          y={end2Pos.y}
                          textAnchor="middle"
                          dy="0.35em"
                          fill="#fef3c7"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="Space Grotesk, sans-serif"
                          style={{ pointerEvents: 'none' }}
                        >
                          2
                        </text>
                      </g>
                    );
                  })()}

                  {Object.entries(TERMINALS).map(([id, terminal]) => {
                    const pos = terminalPositions[id];
                    if (!pos) return null;
                    const isHovered = hoveredTerminal === id;
                    const isDragSource = draggingFrom === id;
                    const isHintActive = hintTerminals.includes(id);
                    const isKeyTerminal = id === 'bottomScrew1' || id === 'bottomScrew2' || id === 'bottomScrew3' || id === 'bottomScrew4';
                    const isK1 = id === 'bottomScrew1' || id === 'bottomScrew2';
                    const isK2 = id === 'bottomScrew3' || id === 'bottomScrew4';
                    const keyPressed = isK1 ? k1Pressed : isK2 ? k2Pressed : false;
                    const glowFilter = isHovered || isDragSource || isHintActive ? 'url(#neon-glow)' : '';

                    if (isKeyTerminal) {
                      const keyColor = isK1 ? '#22c55e' : '#3b82f6';
                      return (
                        <g
                          key={id}
                          transform={`translate(${pos.x}, ${pos.y})`}
                          onClick={isK1 ? handleK1Click : handleK2Click}
                          style={{ zIndex: 4, cursor: 'pointer' }}
                        >
                          <rect
                            x={-18}
                            y={-14}
                            width={36}
                            height={28}
                            rx={6}
                            fill={keyPressed ? `${keyColor}44` : 'rgba(15,23,42,0.9)'}
                            stroke={keyPressed ? keyColor : isHintActive ? '#fbbf24' : `${keyColor}88`}
                            strokeWidth={keyPressed ? '3' : '2'}
                            filter={glowFilter}
                            className={isHintActive ? 'hint-pulse' : ''}
                          />
                          <circle
                            cx={-8}
                            cy={0}
                            r={4}
                            fill={keyPressed ? keyColor : '#475569'}
                          />
                          <text
                            textAnchor="middle"
                            x={4}
                            dy="0.35em"
                            fill={keyPressed ? keyColor : '#f8fafc'}
                            fontSize="10"
                            fontWeight="bold"
                            fontFamily="Space Grotesk, sans-serif"
                          >
                            {isK1 ? 'K1' : 'K2'}
                          </text>
                        </g>
                      );
                    }

                    return (
                      <g
                        key={id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onDoubleClick={() => handleTerminalDoubleClick(id)}
                        style={{ zIndex: 4, cursor: 'pointer' }}
                      >
                        <circle
                          r={TERMINAL_RADIUS}
                          fill={isHintActive ? '#fbbf24' : isHovered || isDragSource ? `${terminal.color}33` : 'rgba(15,23,42,0.9)'}
                          stroke={isHintActive ? '#fbbf24' : terminal.color}
                          strokeWidth={isHintActive ? '4' : '2'}
                          filter={glowFilter}
                          className={isHintActive ? 'hint-pulse' : ''}
                        />
                        <text
                          textAnchor="middle"
                          dy="0.35em"
                          fill="#f8fafc"
                          fontSize="11"
                          fontWeight="bold"
                          fontFamily="Space Grotesk, sans-serif"
                          stroke="#0f172a"
                          strokeWidth="0.4"
                        >
                          {terminal.label}
                        </text>
                      </g>
                    );
                  })}
                 </svg>
               </div>

               <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <div className="aura-glass aura-glass-card rounded-2xl border border-cyan-500/10 shadow-lg shadow-cyan-500/10 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs uppercase tracking-widest text-slate-400">Socket Controls</p>
                    <button
                      type="button"
                      onClick={resetCircuit}
                      className="px-3 py-1 rounded-lg text-[10px] font-bold border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors"
                    >
                      Reset Circuit & Plugs
                    </button>
                  </div>
                   <div className="grid gap-4">
                     {Object.entries(SOCKET_GROUPS).map(([groupKey, group]) => (
                       <div key={groupKey}>
                          <p className="text-xs font-medium text-slate-300 mb-2">{group.label}</p>
                         <div className="flex flex-wrap gap-3">
                           {group.sockets.map((socket) => {
                             const isPlugged = pluggedSockets[socket.id];
                             return (
                               <button
                                 key={socket.id}
                                 type="button"
                                 onClick={() => toggleSocket(socket.id)}
                                 className={`min-w-[72px] px-4 py-2.5 rounded-lg text-sm font-bold border transition-colors ${
                                   isPlugged
                                     ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                                     : 'bg-slate-800/50 border-slate-600/50 text-slate-400 hover:border-cyan-500/30'
                                 }`}
                               >
                                 {socket.id}: {socket.resistance}Ω
                               </button>
                             );
                           })}
                         </div>
                       </div>
                     ))}
                   </div>
                </div>

                <div className="aura-glass aura-glass-card rounded-2xl border border-cyan-500/10 shadow-lg shadow-cyan-500/10 p-6">
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">Bridge Mathematics</p>
                  {bridgeResult.valid && bridgeResult.arms ? (
                    <div className="grid gap-3 text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-black/20 border border-cyan-500/10 p-3">
                          <p className="text-xs text-slate-400 mb-1">Arm P (A-B)</p>
                          <p className="text-lg font-mono text-cyan-300">{bridgeResult.arms.P.toFixed(1)} Ω</p>
                        </div>
                        <div className="rounded-lg bg-black/20 border border-cyan-500/10 p-3">
                          <p className="text-xs text-slate-400 mb-1">Arm Q (A-D)</p>
                          <p className="text-lg font-mono text-cyan-300">{bridgeResult.arms.Q.toFixed(1)} Ω</p>
                        </div>
                        <div className="rounded-lg bg-black/20 border border-cyan-500/10 p-3">
                          <p className="text-xs text-slate-400 mb-1">Arm R (C-B)</p>
                          <p className="text-lg font-mono text-emerald-300">{bridgeResult.arms.R.toFixed(1)} Ω</p>
                        </div>
                        <div className="rounded-lg bg-black/20 border border-cyan-500/10 p-3">
                          <p className="text-xs text-slate-400 mb-1">Unknown X (C-D)</p>
                          <p className="text-lg font-mono text-emerald-300">{bridgeResult.arms.X.toFixed(1)} Ω</p>
                        </div>
                      </div>
                      <div className="rounded-lg bg-black/20 border border-cyan-500/10 p-3">
                        <p className="text-xs text-slate-400 mb-1">Galvanometer Current</p>
                        <p className="text-lg font-mono text-amber-300">{bridgeResult.ig.toFixed(4)} mA</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Polarity: {bridgeResult.polarity === 0 ? 'Zero' : bridgeResult.polarity > 0 ? 'Positive' : 'Negative'}
                        </p>
                        {bridgeResult.extreme && (
                          <p className="text-xs text-rose-400 mt-1 font-medium">
                            Extreme: {bridgeResult.extreme} — verify wire connectivity
                          </p>
                        )}
                      </div>
                      <div className="rounded-lg bg-black/20 border border-cyan-500/10 p-3">
                        <p className="text-xs text-slate-400 mb-1">Balance Check</p>
                        <p className={`text-sm font-medium ${bridgeResult.balanced ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {bridgeResult.balanced ? 'Bridge Balanced' : `P/Q ≠ R/X  (${(bridgeResult.arms.P / bridgeResult.arms.Q).toFixed(3)} ≠ ${(bridgeResult.arms.R / bridgeResult.arms.X).toFixed(3)})`}
                        </p>
                        {!bridgeResult.balanced && (
                          <div className="mt-2 text-xs text-slate-400">
                            <p className="font-mono">S = (Q/P) × (R + d1/(d1+d2))</p>
                            {(() => {
                              const { P, Q, R } = bridgeResult.arms;
                              const deflectionDivisions = bridgeResult.polarity * Math.min(30, bridgeResult.ig * 5);
                              const d1 = Math.abs(deflectionDivisions) || 0.1;
                              const d2 = 5;
                              const s = (Q / P) * (R + d1 / (d1 + d2));
                              return (
                                <p className="mt-1">
                                  d1={d1.toFixed(1)}, d2={d2} → S = <span className="text-amber-300">{s.toFixed(2)} Ω</span>
                                </p>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">{bridgeResult.reason}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span>Click and drag between terminals to wire. Double-click a wire or terminal to remove it.</span>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => setShowObservationTable((prev) => !prev)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                  >
                    {showObservationTable ? 'Hide' : 'Show'} Observation Table
                    <span className="text-slate-400">({observations.length} entries)</span>
                  </button>
                  <button
                    type="button"
                    onClick={addObservation}
                    disabled={!bridgeResult.valid}
                    className="px-4 py-2 rounded-lg text-xs font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Current Observation
                  </button>
                </div>

                {showObservationTable && (
                  <div className="aura-glass aura-glass-card rounded-2xl border border-cyan-500/10 shadow-lg shadow-cyan-500/10 p-6 overflow-x-auto">
                    <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">HSC Practical Observation Table</p>
                    {observations.length === 0 ? (
                      <p className="text-sm text-slate-400">No observations recorded. Configure the circuit and click "Add Current Observation".</p>
                    ) : (
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-cyan-500/10">
                            <th className="py-2 px-3 text-slate-400 font-medium">P (Ω)</th>
                            <th className="py-2 px-3 text-slate-400 font-medium">Q (Ω)</th>
                            <th className="py-2 px-3 text-slate-400 font-medium">R (Ω)</th>
                            <th className="py-2 px-3 text-slate-400 font-medium">Deflection Direction</th>
                            <th className="py-2 px-3 text-slate-400 font-medium">Estimated Range of S</th>
                            <th className="py-2 px-3 text-slate-400 font-medium">Final Calculated S (Ω)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {observations.map((obs) => (
                            <tr key={obs.id} className="border-b border-cyan-500/5">
                              <td className="py-2 px-3 font-mono text-cyan-300">{obs.P.toFixed(1)}</td>
                              <td className="py-2 px-3 font-mono text-cyan-300">{obs.Q.toFixed(1)}</td>
                              <td className="py-2 px-3 font-mono text-emerald-300">{obs.R === Infinity ? '∞' : obs.R.toFixed(1)}</td>
                              <td className="py-2 px-3">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  obs.deflectionDirection === 'Zero' ? 'bg-emerald-500/20 text-emerald-300' :
                                  obs.deflectionDirection === 'Right' ? 'bg-amber-500/20 text-amber-300' :
                                  'bg-blue-500/20 text-blue-300'
                                }`}>
                                  {obs.deflectionDirection}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-mono text-amber-300">{obs.estimatedRange}</td>
                              <td className="py-2 px-3 font-mono text-emerald-300">{obs.finalS}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {observations.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-cyan-500/10 text-xs text-slate-400">
                        <p className="font-mono">Formula: S = (Q / P) × (R + d1 / (d1 + d2))</p>
                        <p className="mt-1">d1 = deflection magnitude, d2 = reference divisions (5)</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default PostOfficeBoxExperiment;
