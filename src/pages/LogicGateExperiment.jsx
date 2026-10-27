import { useState, useMemo, useCallback, useEffect } from 'react';
import { FaPowerOff, FaArrowLeft, FaCheck, FaTrash } from 'react-icons/fa';
import PageShell from '../components/ui/PageShell';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

const BOARD_IMAGE_OFF = 'https://res.cloudinary.com/dxqtqnfgf/image/upload/v1793035024/89d494cf-feaf-4395-bf85-42bd6213532e.png';
const BOARD_IMAGE_POWER_ON_OVERLAY = 'https://res.cloudinary.com/dxqtqnfgf/image/upload/v1793025957/fe4f87ca-683e-493e-aeee-bd3ef11ff1fc.png';

const BOARD_NATURAL_W = 1280;
const BOARD_NATURAL_H = 800;
const BOARD_DISPLAY_W = 800;

const pct = (value, dimension) => (value / 100) * dimension;

const IC_INFO = {
  NOT: { name: '7404', label: 'HEX INVERTER (7404)', pinCount: 14 },
  AND: { name: '7408', label: 'QUAD 2-INPUT AND (7408)', pinCount: 14 },
  OR: { name: '7432', label: 'QUAD 2-INPUT OR (7432)', pinCount: 14 },
};

const BREADBOARD_COORDS = {
  powerRailTop: { pctY: 52.0 },
  powerRailBottom: { pctY: 56.5 },
  icCenterX: { pctX: 50.0 },
  icCenterY: { pctY: 62.0 },
  icWidth: { pctX: 8.0 },
  icHeight: { pctY: 8.0 },
};

const TRAINER_COORDS = {
  holes: {
    S1: { pctX: 56.404, pctY: 46.163 },
    S2: { pctX: 65.566, pctY: 46.600 },
    S3: { pctX: 75.684, pctY: 46.163 },
    S4: { pctX: 83.615, pctY: 46.163 },
  },
  toggles: {
    S1: { pctX: 56.404, pctY: 40.256 },
    S2: { pctX: 65.702, pctY: 40.474 },
    S3: { pctX: 74.864, pctY: 40.037 },
    S4: { pctX: 83.615, pctY: 40.256 },
  },
  leds: {
    L1: { pctX: 55.584, pctY: 22.316 },
    L2: { pctX: 65.019, pctY: 21.878 },
    L3: { pctX: 74.590, pctY: 21.878 },
    L4: { pctX: 84.025, pctY: 21.441 },
  },
  powerButton: { pctX: 20.989, pctY: 4.376 },
  powerSupply: { pctX: 36.714, pctY: 43.537 },
  vccTerminal: { pctX: 30.0, pctY: 48.0 },
  gndTerminal: { pctX: 42.0, pctY: 48.0 },
};

const GATE_CONFIG = {
  NOT: {
    name: 'NOT Gate',
    symbol: '¬A',
    description: 'Inverter — outputs the opposite of the input.',
    inputSwitch: 'S1',
    ic: 'NOT',
    truthTable: [
      { A: 0, Y: 1 },
      { A: 1, Y: 0 },
    ],
  },
  AND: {
    name: 'AND Gate',
    symbol: 'A · B',
    description: 'Outputs HIGH only when both inputs are HIGH.',
    inputSwitches: ['S1', 'S2'],
    ic: 'AND',
    truthTable: [
      { A: 0, B: 0, Y: 0 },
      { A: 0, B: 1, Y: 0 },
      { A: 1, B: 0, Y: 0 },
      { A: 1, B: 1, Y: 1 },
    ],
  },
  OR: {
    name: 'OR Gate',
    symbol: 'A + B',
    description: 'Outputs HIGH when either or both inputs are HIGH.',
    inputSwitches: ['S1', 'S2'],
    ic: 'OR',
    truthTable: [
      { A: 0, B: 0, Y: 0 },
      { A: 0, B: 1, Y: 1 },
      { A: 1, B: 0, Y: 1 },
      { A: 1, B: 1, Y: 1 },
    ],
  },
};

const WORKFLOW_STEPS = {
  NOT: [
    { id: 'place-ic', label: 'Place 7404 IC on breadboard', check: (st) => st.icPlaced, connectable: true },
    { id: 'vcc', label: 'Connect VCC (Pin 14) to +5V', check: (st) => st.connections.has('vcc'), connectable: true },
    { id: 'gnd', label: 'Connect GND (Pin 7) to Ground', check: (st) => st.connections.has('gnd'), connectable: true },
    { id: 'input', label: 'Connect S1 to IC Input (Pin 1)', check: (st) => st.connections.has('input'), connectable: true },
    { id: 'output', label: 'Connect IC Output (Pin 2) to L1', check: (st) => st.connections.has('output'), connectable: true },
    { id: 'power', label: 'Turn Power ON and test', check: (st) => st.powerOn, connectable: false },
  ],
  AND: [
    { id: 'place-ic', label: 'Place 7408 IC on breadboard', check: (st) => st.icPlaced, connectable: true },
    { id: 'vcc', label: 'Connect VCC (Pin 14) to +5V', check: (st) => st.connections.has('vcc'), connectable: true },
    { id: 'gnd', label: 'Connect GND (Pin 7) to Ground', check: (st) => st.connections.has('gnd'), connectable: true },
    { id: 'input', label: 'Connect S1 to IC Input (Pin 1)', check: (st) => st.connections.has('input'), connectable: true },
    { id: 'output', label: 'Connect IC Output (Pin 3) to L1', check: (st) => st.connections.has('output'), connectable: true },
    { id: 'power', label: 'Turn Power ON and test', check: (st) => st.powerOn, connectable: false },
  ],
  OR: [
    { id: 'place-ic', label: 'Place 7432 IC on breadboard', check: (st) => st.icPlaced, connectable: true },
    { id: 'vcc', label: 'Connect VCC (Pin 14) to +5V', check: (st) => st.connections.has('vcc'), connectable: true },
    { id: 'gnd', label: 'Connect GND (Pin 7) to Ground', check: (st) => st.connections.has('gnd'), connectable: true },
    { id: 'input', label: 'Connect S1 to IC Input (Pin 1)', check: (st) => st.connections.has('input'), connectable: true },
    { id: 'output', label: 'Connect IC Output (Pin 3) to L1', check: (st) => st.connections.has('output'), connectable: true },
    { id: 'power', label: 'Turn Power ON and test', check: (st) => st.powerOn, connectable: false },
  ],
};

const getControlPoint = (from, to) => {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const curvature = Math.min(30, dist * 0.4);
  const nx = -dy / (dist || 1);
  const ny = dx / (dist || 1);
  return { x: midX + nx * curvature, y: midY + ny * curvature };
};

const WIRE_COLORS = {
  vcc: '#ef4444',
  gnd: '#1f2937',
  input: '#22c55e',
  output: '#f59e0b',
};

const TrainerBoard = ({ boardState, switchStates, onToggle, ledStates, workflowState, connections, config }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const canvasW = BOARD_DISPLAY_W;
  const canvasH = (BOARD_DISPLAY_W / BOARD_NATURAL_W) * BOARD_NATURAL_H;

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImgLoaded(true);
    img.onerror = () => setImgError(true);
    img.src = BOARD_IMAGE_OFF;
  }, []);

  const toCanvas = (coord) => ({
    x: pct(coord.pctX, canvasW),
    y: pct(coord.pctY, canvasH),
  });

  const icCenter = toCanvas({
    pctX: BREADBOARD_COORDS.icCenterX.pctX,
    pctY: BREADBOARD_COORDS.icCenterY.pctY,
  });

  const wirePoints = (() => {
    const pts = {};
    pts.vcc = toCanvas({ ...TRAINER_COORDS.vccTerminal });
    pts.gnd = toCanvas({ ...TRAINER_COORDS.gndTerminal });
    pts.input = toCanvas({ ...TRAINER_COORDS.toggles.S1 });
    pts.output = toCanvas({ ...TRAINER_COORDS.leds.L1 });
    pts.icVcc = { x: icCenter.x, y: icCenter.y - 20 };
    pts.icGnd = { x: icCenter.x, y: icCenter.y + 20 };
    pts.icInput = { x: icCenter.x - 30, y: icCenter.y - 10 };
    pts.icOutput = { x: icCenter.x + 30, y: icCenter.y - 10 };
    return pts;
  })();

  return (
    <div
      className={`relative rounded-xl shadow-2xl transition-all duration-500 overflow-hidden ${
        boardState
          ? 'ring-2 ring-cyan-400/50 shadow-cyan-500/30'
          : 'ring-1 ring-slate-600/30'
      }`}
      style={{ width: canvasW, maxWidth: '100%', margin: '0 auto' }}
    >
      {imgError ? (
        <div className="flex items-center justify-center h-64 text-red-400">Failed to load board image</div>
      ) : (
        <>
          <img
            src={BOARD_IMAGE_OFF}
            alt="Logic trainer board"
            style={{ width: '100%', height: 'auto', display: 'block' }}
            onLoad={() => setImgLoaded(true)}
          />
          <img
            src={BOARD_IMAGE_POWER_ON_OVERLAY}
            alt="Power ON overlay"
            className="absolute top-0 left-0 w-full h-auto"
            style={{
              opacity: boardState ? 1 : 0,
              pointerEvents: 'none',
              transition: 'opacity 0.3s ease',
              width: '100%',
              height: 'auto',
            }}
          />
        </>
      )}

      {imgLoaded && (
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: boardState ? 'auto' : 'none', zIndex: 10 }}
          viewBox={`0 0 ${canvasW} ${canvasH}`}
        >
          <defs>
            <filter id="ledGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="switchGlow">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {connections.has('vcc') && (
            <path
              d={`M ${wirePoints.vcc.x} ${wirePoints.vcc.y} Q ${getControlPoint(wirePoints.vcc, wirePoints.icVcc).x} ${getControlPoint(wirePoints.vcc, wirePoints.icVcc).y} ${wirePoints.icVcc.x} ${wirePoints.icVcc.y}`}
              fill="none"
              stroke={WIRE_COLORS.vcc}
              strokeWidth={3}
              strokeLinecap="round"
            />
          )}

          {connections.has('gnd') && (
            <path
              d={`M ${wirePoints.gnd.x} ${wirePoints.gnd.y} Q ${getControlPoint(wirePoints.gnd, wirePoints.icGnd).x} ${getControlPoint(wirePoints.gnd, wirePoints.icGnd).y} ${wirePoints.icGnd.x} ${wirePoints.icGnd.y}`}
              fill="none"
              stroke={WIRE_COLORS.gnd}
              strokeWidth={3}
              strokeLinecap="round"
            />
          )}

          {connections.has('input') && (
            <path
              d={`M ${wirePoints.input.x} ${wirePoints.input.y} Q ${getControlPoint(wirePoints.input, wirePoints.icInput).x} ${getControlPoint(wirePoints.input, wirePoints.icInput).y} ${wirePoints.icInput.x} ${wirePoints.icInput.y}`}
              fill="none"
              stroke={WIRE_COLORS.input}
              strokeWidth={3}
              strokeLinecap="round"
            />
          )}

          {connections.has('output') && (
            <path
              d={`M ${wirePoints.icOutput.x} ${wirePoints.icOutput.y} Q ${getControlPoint(wirePoints.icOutput, wirePoints.output).x} ${getControlPoint(wirePoints.icOutput, wirePoints.output).y} ${wirePoints.output.x} ${wirePoints.output.y}`}
              fill="none"
              stroke={WIRE_COLORS.output}
              strokeWidth={3}
              strokeLinecap="round"
            />
          )}

          {workflowState.icPlaced && (
            <g>
              <rect
                x={icCenter.x - 24}
                y={icCenter.y - 16}
                width={48}
                height={32}
                rx={4}
                fill={boardState ? '#1e293b' : '#374151'}
                stroke={boardState ? '#06b6d4' : '#475569'}
                strokeWidth={2}
              />
              <text
                x={icCenter.x}
                y={icCenter.y - 6}
                textAnchor="middle"
                fill={boardState ? '#06b6d4' : '#94a3b8'}
                fontSize={9}
                fontFamily="monospace"
                fontWeight="bold"
              >
                {IC_INFO[config.ic].name}
              </text>
              <text
                x={icCenter.x}
                y={icCenter.y + 10}
                textAnchor="middle"
                fill={boardState ? '#94a3b8' : '#64748b'}
                fontSize={7}
                fontFamily="monospace"
              >
                1 2 3 4 5 6
              </text>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'].map((pin, i) => {
                const pinY = icCenter.y - 12 + (i % 7) * 4;
                const pinX = i < 7 ? icCenter.x - 30 : icCenter.x + 30;
                return (
                  <g key={pin}>
                    <circle cx={pinX} cy={pinY} r={3} fill={boardState ? '#06b6d4' : '#64748b'} />
                    <text x={pinX} y={pinY + 14} textAnchor="middle" fill="#94a3b8" fontSize={5} fontFamily="monospace">
                      {pin}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {Object.entries(TRAINER_COORDS.leds).map(([id, pos]) => {
            const isActive = ledStates[id];
            const cx = pct(pos.pctX, canvasW);
            const cy = pct(pos.pctY, canvasH);
            return (
              <g key={id}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isActive ? 14 : 11}
                  fill={isActive ? '#f59e0b' : '#374151'}
                  filter={isActive ? 'url(#ledGlow)' : 'none'}
                />
                <text
                  x={cx}
                  y={cy + 30}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize={9}
                  fontFamily="monospace"
                >
                  {id}
                </text>
              </g>
            );
          })}

          {Object.keys(switchStates).map((sId) => {
            const togglePos = TRAINER_COORDS.toggles[sId];
            const isOn = switchStates[sId];
            const tx = pct(togglePos.pctX, canvasW);
            const ty = pct(togglePos.pctY, canvasH);
            return (
              <g key={sId}>
                <rect
                  x={tx - 14}
                  y={ty - 8}
                  width={28}
                  height={16}
                  rx={8}
                  fill={isOn ? '#10b981' : '#475569'}
                  stroke={isOn ? '#22c55e' : '#64748b'}
                  strokeWidth={2}
                  filter={isOn ? 'url(#switchGlow)' : 'none'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onToggle(sId)}
                />
                <text
                  x={tx}
                  y={ty + 22}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize={9}
                  fontFamily="monospace"
                >
                  {sId}
                </text>
              </g>
            );
          })}

          <g>
            <circle
              cx={pct(TRAINER_COORDS.vccTerminal.pctX, canvasW)}
              cy={pct(TRAINER_COORDS.vccTerminal.pctY, canvasH)}
              r={10}
              fill="#10b981"
              stroke="#22c55e"
              strokeWidth={1}
            />
            <text
              x={pct(TRAINER_COORDS.vccTerminal.pctX, canvasW)}
              y={pct(TRAINER_COORDS.vccTerminal.pctY, canvasH) + 25}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize={8}
              fontFamily="monospace"
            >
              VCC
            </text>
          </g>

          <g>
            <circle
              cx={pct(TRAINER_COORDS.gndTerminal.pctX, canvasW)}
              cy={pct(TRAINER_COORDS.gndTerminal.pctY, canvasH)}
              r={10}
              fill="#475569"
              stroke="#64748b"
              strokeWidth={1}
            />
            <text
              x={pct(TRAINER_COORDS.gndTerminal.pctX, canvasW)}
              y={pct(TRAINER_COORDS.gndTerminal.pctY, canvasH) + 25}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize={8}
              fontFamily="monospace"
            >
              GND
            </text>
          </g>

          {workflowState.icPlaced && (
            <g>
              <circle
                cx={wirePoints.icVcc.x}
                cy={wirePoints.icVcc.y}
                r={5}
                fill={connections.has('vcc') ? '#22c55e' : '#64748b'}
                stroke="#06b6d4"
                strokeWidth={1}
              />
              <circle
                cx={wirePoints.icGnd.x}
                cy={wirePoints.icGnd.y}
                r={5}
                fill={connections.has('gnd') ? '#22c55e' : '#64748b'}
                stroke="#06b6d4"
                strokeWidth={1}
              />
              <circle
                cx={wirePoints.icInput.x}
                cy={wirePoints.icInput.y}
                r={5}
                fill={connections.has('input') ? '#22c55e' : '#64748b'}
                stroke="#06b6d4"
                strokeWidth={1}
              />
              <circle
                cx={wirePoints.icOutput.x}
                cy={wirePoints.icOutput.y}
                r={5}
                fill={connections.has('output') ? '#22c55e' : '#64748b'}
                stroke="#06b6d4"
                strokeWidth={1}
              />
            </g>
          )}
        </svg>
      )}
    </div>
  );
};

const LogicGateExperiment = ({ gateType = 'NOT' }) => {
  const navigate = useNavigate();
  const config = useMemo(() => GATE_CONFIG[gateType] || GATE_CONFIG.NOT, [gateType]);
  const [boardState, setBoardState] = useState(false);
  const [switchStates, setSwitchStates] = useState(
    gateType === 'NOT' ? { S1: false } : { S1: false, S2: false }
  );
  const [workflowState, setWorkflowState] = useState({
    icPlaced: false,
    powerOn: false,
    connections: new Set(),
  });

  const inputSwitches = useMemo(() => {
    return gateType === 'NOT' ? [config.inputSwitch] : config.inputSwitches;
  }, [gateType, config]);

  const inputValues = useMemo(() => {
    return inputSwitches.map((s) => (switchStates[s] ? 1 : 0));
  }, [inputSwitches, switchStates]);

  const outputValue = useMemo(() => {
    if (gateType === 'NOT') return inputValues[0] ^ 1;
    if (gateType === 'AND') return inputValues[0] & inputValues[1];
    if (gateType === 'OR') return inputValues[0] | inputValues[1];
    return 0;
  }, [gateType, inputValues]);

  const allStepsComplete = useMemo(() => {
    return WORKFLOW_STEPS[gateType].every((step) => step.check(workflowState));
  }, [gateType, workflowState]);

  const ledStates = useMemo(() => {
    const states = { L1: false, L2: false, L3: false, L4: false };
    states[config.outputLed] = boardState && allStepsComplete && outputValue === 1;
    return states;
  }, [boardState, outputValue, config.outputLed, allStepsComplete]);

  const connectionSet = useMemo(() => workflowState.connections, [workflowState.connections]);

  const toggleSwitch = useCallback((sId) => {
    setSwitchStates((prev) => ({ ...prev, [sId]: !prev[sId] }));
  }, []);

  const togglePower = useCallback(() => {
    if (!allStepsComplete) return;
    setBoardState((prev) => !prev);
    setWorkflowState((prev) => ({ ...prev, powerOn: !prev.powerOn }));
  }, [allStepsComplete]);

  const placeIC = useCallback(() => {
    setWorkflowState((prev) => ({ ...prev, icPlaced: true }));
  }, []);

  const handleConnect = useCallback((connType) => {
    setWorkflowState((prev) => ({ ...prev, connections: new Set([...prev.connections, connType]) }));
  }, []);

  const resetExperiment = () => {
    setBoardState(false);
    setSwitchStates(gateType === 'NOT' ? { S1: false } : { S1: false, S2: false });
    setWorkflowState({ icPlaced: false, powerOn: false, connections: new Set() });
  };

  const currentTruthTableRow = config.truthTable.findIndex((row) => {
    const inputKeys = Object.keys(row).filter((k) => k !== 'Y');
    return inputKeys.every((k, i) => row[k] === inputValues[i]);
  });

  return (
    <PageShell className="min-h-0 h-full text-slate-100" showMesh={false}>
      <div className="h-full flex flex-col max-w-7xl mx-auto px-3 py-2 sm:px-4 sm:py-2 gap-1.5">
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400">
              <span className="text-lg">🔌</span>
            </span>
            <div>
              <h1 className="aura-headline text-lg sm:text-xl">{config.name} Experiment</h1>
              <p className="aura-subhead text-xs mt-0.5">{config.description}</p>
            </div>
          </div>
          <Button to="/virtual-lab/physics" variant="secondary" size="sm">
            <FaArrowLeft className="h-3 w-3 mr-1" aria-hidden />
            Back
          </Button>
        </div>

        <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-2 min-h-0">
          <div className="xl:col-span-2 flex flex-col gap-2 min-h-0">
            <div className="flex justify-center gap-2 flex-shrink-0">
              {!workflowState.icPlaced && (
                <Button onClick={placeIC} variant="secondary" size="sm">
                  Place {IC_INFO[config.ic].name} IC
                </Button>
              )}
              {workflowState.icPlaced && !connectionSet.has('vcc') && (
                <Button onClick={() => handleConnect('vcc')} variant="secondary" size="sm" disabled={!workflowState.icPlaced}>
                  Connect VCC
                </Button>
              )}
              {connectionSet.has('vcc') && !connectionSet.has('gnd') && (
                <Button onClick={() => handleConnect('gnd')} variant="secondary" size="sm">
                  Connect GND
                </Button>
              )}
              {connectionSet.has('gnd') && !connectionSet.has('input') && (
                <Button onClick={() => handleConnect('input')} variant="secondary" size="sm">
                  Connect Input Wire
                </Button>
              )}
              {connectionSet.has('input') && !connectionSet.has('output') && (
                <Button onClick={() => handleConnect('output')} variant="secondary" size="sm">
                  Connect Output Wire
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-auto flex justify-center">
              <TrainerBoard
                boardState={boardState}
                switchStates={switchStates}
                onToggle={toggleSwitch}
                ledStates={ledStates}
                workflowState={workflowState}
                connections={connectionSet}
                config={config}
              />
            </div>

            <div className="flex justify-center gap-2 flex-shrink-0">
              <Button
                onClick={togglePower}
                variant={boardState ? 'primary' : 'secondary'}
                size="sm"
                disabled={!allStepsComplete}
              >
                <FaPowerOff className="h-3 w-3 mr-1" />
                {boardState ? 'Power ON' : 'Power OFF'}
              </Button>
              <Button onClick={resetExperiment} variant="ghost" size="sm">
                <FaTrash className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>
          </div>

          <div className="space-y-2 min-h-0 overflow-y-auto">
            <div className="aura-glass aura-glass-card rounded-xl border border-cyan-500/10 shadow-lg shadow-cyan-500/10 p-3">
              <h3 className="aura-headline text-sm mb-2">Truth Table — {config.symbol}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-cyan-500/10">
                      {inputSwitches.map((s) => (
                        <th key={s} className="py-1 px-2 text-slate-400 font-medium">
                          {s}
                        </th>
                      ))}
                      <th className="py-1 px-2 text-slate-400 font-medium">Y</th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.truthTable.map((row, idx) => {
                      const inputKeys = Object.keys(row).filter((k) => k !== 'Y');
                      return (
                        <tr
                          key={idx}
                          className={`border-b border-cyan-500/5 transition-colors ${
                            idx === currentTruthTableRow ? 'bg-cyan-500/10 font-bold' : 'hover:bg-black/20'
                          }`}
                        >
                          {inputKeys.map((k) => (
                            <td key={k} className="py-1 px-2 text-center font-mono text-cyan-300">
                              {row[k]}
                            </td>
                          ))}
                          <td className="py-1 px-2 text-center font-mono text-emerald-300">{row.Y}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-black/20 border border-cyan-500/10 p-2">
                  <p className="text-xs text-slate-400">Input A</p>
                  <p className="font-mono text-sm text-cyan-300">{inputValues[0] || 0}</p>
                </div>
                {gateType !== 'NOT' && (
                  <div className="rounded-lg bg-black/20 border border-cyan-500/10 p-2">
                    <p className="text-xs text-slate-400">Input B</p>
                    <p className="font-mono text-sm text-cyan-300">{inputValues[1] || 0}</p>
                  </div>
                )}
                <div className="rounded-lg bg-black/20 border border-emerald-500/20 p-2 col-span-2">
                  <p className="text-xs text-slate-400">Output Y = {config.symbol}</p>
                  <p className={`font-mono text-base ${outputValue === 1 ? 'text-amber-400' : 'text-slate-500'}`}>
                    {outputValue === 1 ? '1 (HIGH)' : '0 (LOW)'}
                  </p>
                </div>
              </div>
            </div>

            <div className="aura-glass aura-glass-card rounded-xl border border-cyan-500/10 shadow-lg shadow-cyan-500/10 p-3">
              <h3 className="aura-headline text-sm mb-2">Procedure Checklist</h3>
              <div className="space-y-1">
                {WORKFLOW_STEPS[gateType].map((step, idx) => {
                  const isComplete = step.check(workflowState);
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition-all ${
                        isComplete
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-black/20 border-cyan-500/10 text-slate-400'
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                          isComplete ? 'bg-emerald-500 text-black' : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {isComplete ? <FaCheck className="h-2 w-2" /> : idx + 1}
                      </span>
                      <span className="flex-1">{step.label}</span>
                      {!isComplete && idx < WORKFLOW_STEPS[gateType].length - 1 && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700/30 text-slate-500">
                          Pending
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 pt-2 border-t border-cyan-500/10">
                <p className="text-xs text-slate-400">
                  Progress: {WORKFLOW_STEPS[gateType].filter((s) => s.check(workflowState)).length} / {WORKFLOW_STEPS[gateType].length}
                </p>
              </div>
            </div>

            <div className="aura-glass aura-glass-card rounded-xl border border-cyan-500/10 shadow-lg shadow-cyan-500/10 p-3">
              <h3 className="aura-headline text-sm mb-2">Circuit Status</h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">IC Placed</span>
                  <span className={`font-mono ${workflowState.icPlaced ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {workflowState.icPlaced ? IC_INFO[config.ic].name : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">VCC Wire</span>
                  <span className={`font-mono ${connectionSet.has('vcc') ? 'text-red-400' : 'text-slate-600'}`}>
                    {connectionSet.has('vcc') ? 'Connected' : 'Not connected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">GND Wire</span>
                  <span className={`font-mono ${connectionSet.has('gnd') ? 'text-slate-400' : 'text-slate-600'}`}>
                    {connectionSet.has('gnd') ? 'Connected' : 'Not connected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Input Wire</span>
                  <span className={`font-mono ${connectionSet.has('input') ? 'text-green-400' : 'text-slate-600'}`}>
                    {connectionSet.has('input') ? 'Connected' : 'Not connected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Output Wire</span>
                  <span className={`font-mono ${connectionSet.has('output') ? 'text-amber-400' : 'text-slate-600'}`}>
                    {connectionSet.has('output') ? 'Connected' : 'Not connected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Power</span>
                  <span className={`font-mono ${boardState ? 'text-emerald-400' : 'text-red-400'}`}>
                    {boardState ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-2 flex-shrink-0 pb-1">
          {Object.entries(GATE_CONFIG).map(([key, cfg]) => (
            <Button
              key={key}
              onClick={() => navigate(`/virtual-lab/physics/${key.toLowerCase()}-gate`)}
              variant="ghost"
              size="sm"
            >
              {cfg.name}
            </Button>
          ))}
        </div>
      </div>
    </PageShell>
  );
};

export default LogicGateExperiment;
