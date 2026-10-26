import { useState, useMemo, useCallback, useEffect } from 'react';
import { FaPowerOff, FaArrowLeft, FaCheck, FaTimes, FaInfoCircle } from 'react-icons/fa';
import PageShell from '../components/ui/PageShell';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

const BOARD_IMAGE_OFF = 'https://res.cloudinary.com/dxqtqnfgf/image/upload/v1793035024/89d494cf-feaf-4395-bf85-42bd6213532e.png';
const BOARD_IMAGE_POWER_ON_OVERLAY = 'https://res.cloudinary.com/dxqtqnfgf/image/upload/v1793025957/fe4f87ca-683e-493e-aeee-bd3ef11ff1fc.png';

const BOARD_NATURAL_W = 1280;
const BOARD_NATURAL_H = 800;
const CANVAS_W = 800;

const GATE_CONFIG = {
  NOT: {
    name: 'NOT Gate',
    symbol: '¬A',
    description: 'Inverter — outputs the opposite of the input.',
    inputSwitch: 'S1',
    outputLed: 'L1',
    truthTable: [
      { A: 0, Y: 1 },
      { A: 1, Y: 0 },
    ],
    procedure: [
      'Set Switch S1 to position 0 (LOW). Observe that LED L1 glows (Output = HIGH).',
      'Set Switch S1 to position 1 (HIGH). Observe that LED L1 turns OFF (Output = LOW).',
      'Record both observations in your lab notebook.',
    ],
  },
  AND: {
    name: 'AND Gate',
    symbol: 'A · B',
    description: 'Outputs HIGH only when both inputs are HIGH.',
    inputSwitches: ['S1', 'S2'],
    outputLed: 'L1',
    truthTable: [
      { A: 0, B: 0, Y: 0 },
      { A: 0, B: 1, Y: 0 },
      { A: 1, B: 0, Y: 0 },
      { A: 1, B: 1, Y: 1 },
    ],
    procedure: [
      'Set both S1 and S2 to 0 (LOW). LED L1 should be OFF.',
      'Set S1=1, S2=0. LED L1 should be OFF.',
      'Set S1=0, S2=1. LED L1 should be OFF.',
      'Set S1=1, S2=1. LED L1 should be ON (Output = HIGH).',
      'Record all four combinations in your notebook.',
    ],
  },
  OR: {
    name: 'OR Gate',
    symbol: 'A + B',
    description: 'Outputs HIGH when either or both inputs are HIGH.',
    inputSwitches: ['S1', 'S2'],
    outputLed: 'L1',
    truthTable: [
      { A: 0, B: 0, Y: 0 },
      { A: 0, B: 1, Y: 1 },
      { A: 1, B: 0, Y: 1 },
      { A: 1, B: 1, Y: 1 },
    ],
    procedure: [
      'Set both S1 and S2 to 0 (LOW). LED L1 should be OFF.',
      'Set S1=0, S2=1. LED L1 should be ON.',
      'Set S1=1, S2=0. LED L1 should be ON.',
      'Set S1=1, S2=1. LED L1 should be ON.',
      'Record all four combinations in your notebook.',
    ],
  },
};

const COORDINATES = {
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
};

const pct = (value, dimension) => (value / 100) * dimension;

const TrainerBoard = ({ boardState, switchStates, onToggle, ledStates }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const canvasW = CANVAS_W;
  const canvasH = (CANVAS_W / BOARD_NATURAL_W) * BOARD_NATURAL_H;

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImgLoaded(true);
    img.onerror = () => setImgError(true);
    img.src = BOARD_IMAGE_OFF;
  }, []);

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
            className={boardState ? 'opacity-0' : 'opacity-100'}
          />
          {boardState && (
            <img
              src={BOARD_IMAGE_POWER_ON_OVERLAY}
              alt="Power ON overlay"
              className="absolute top-0 left-0 w-full h-auto opacity-100"
              style={{ pointerEvents: 'none' }}
            />
          )}
          {!boardState && (
            <img
              src={BOARD_IMAGE_POWER_ON_OVERLAY}
              alt="Power ON overlay (hidden)"
              className="absolute top-0 left-0 w-full h-auto opacity-0"
              style={{ pointerEvents: 'none' }}
            />
          )}
        </>
      )}

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

        {imgLoaded && (
          <>
            {Object.entries(COORDINATES.leds).map(([id, pos]) => {
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
              const togglePos = COORDINATES.toggles[sId];
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
          </>
        )}
      </svg>
    </div>
  );
};

const LogicGateExperiment = ({ gateType = 'NOT' }) => {
  const navigate = useNavigate();
  const config = useMemo(() => GATE_CONFIG[gateType] || GATE_CONFIG.NOT, [gateType]);
  const [boardState, setBoardState] = useState(false);
  const [switchStates, setSwitchStates] = useState(
    gateType === 'NOT'
      ? { S1: false }
      : { S1: false, S2: false }
  );
  const [completedSteps, setCompletedSteps] = useState({});

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

  const ledStates = useMemo(() => {
    const states = { L1: false, L2: false, L3: false, L4: false };
    states[config.outputLed] = boardState && outputValue === 1;
    return states;
  }, [boardState, outputValue, config.outputLed]);

  const toggleSwitch = useCallback((sId) => {
    setSwitchStates((prev) => ({ ...prev, [sId]: !prev[sId] }));
  }, []);

  const togglePower = useCallback(() => {
    setBoardState((prev) => !prev);
    if (!boardState) {
      setSwitchStates(gateType === 'NOT' ? { S1: false } : { S1: false, S2: false });
    }
  }, [boardState, gateType]);

  const resetExperiment = () => {
    setBoardState(false);
    setSwitchStates(gateType === 'NOT' ? { S1: false } : { S1: false, S2: false });
    setCompletedSteps({});
  };

  const toggleStep = (index) => {
    setCompletedSteps((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const currentTruthTableRow = config.truthTable.findIndex((row) => {
    const inputKeys = Object.keys(row).filter((k) => k !== 'Y');
    return inputKeys.every((k, i) => row[k] === inputValues[i]);
  });

  return (
    <PageShell className="min-h-[calc(100vh-3.5rem)] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400">
              <FaInfoCircle className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h1 className="aura-headline text-xl sm:text-2xl">{config.name} Experiment</h1>
              <p className="aura-subhead text-sm mt-0.5">{config.description}</p>
            </div>
          </div>
          <Button to="/virtual-lab/physics" variant="secondary">
            <FaArrowLeft className="h-4 w-4 mr-2" aria-hidden />
            Back to Physics Lab
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <TrainerBoard
              boardState={boardState}
              switchStates={switchStates}
              onToggle={toggleSwitch}
              ledStates={ledStates}
            />

            <div className="flex gap-4 justify-center">
              <Button onClick={togglePower} variant={boardState ? 'primary' : 'secondary'} size="md">
                <FaPowerOff className="h-4 w-4 mr-2" />
                {boardState ? 'Power ON' : 'Power OFF'}
              </Button>
              <Button onClick={resetExperiment} variant="ghost" size="md">
                Reset Experiment
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="aura-glass aura-glass-card rounded-2xl border border-cyan-500/10 shadow-lg shadow-cyan-500/10 p-6">
              <h3 className="aura-headline text-lg mb-4">Truth Table — {config.symbol}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-cyan-500/10">
                      {inputSwitches.map((s) => (
                        <th key={s} className="py-2 px-3 text-slate-400 font-medium">
                          {s}
                        </th>
                      ))}
                      <th className="py-2 px-3 text-slate-400 font-medium">Y</th>
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
                            <td key={k} className="py-2 px-3 text-center font-mono text-cyan-300">
                              {row[k]}
                            </td>
                          ))}
                          <td className="py-2 px-3 text-center font-mono text-emerald-300">{row.Y}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg bg-black/20 border border-cyan-500/10 p-3">
                  <p className="text-xs text-slate-400">Input A</p>
                  <p className="font-mono text-lg text-cyan-300">{gateType === 'NOT' ? inputValues[0] : inputValues[0] || '-'}</p>
                </div>
                {gateType !== 'NOT' && (
                  <div className="rounded-lg bg-black/20 border border-cyan-500/10 p-3">
                    <p className="text-xs text-slate-400">Input B</p>
                    <p className="font-mono text-lg text-cyan-300">{inputValues[1] || '-'}</p>
                  </div>
                )}
                <div className="rounded-lg bg-black/20 border border-emerald-500/20 p-3 col-span-2">
                  <p className="text-xs text-slate-400">Output Y</p>
                  <p className={`font-mono text-2xl ${outputValue === 1 ? 'text-amber-400' : 'text-slate-500'}`}>
                    {outputValue === 1 ? '1 (HIGH)' : '0 (LOW)'}
                  </p>
                </div>
              </div>
            </div>

            <div className="aura-glass aura-glass-card rounded-2xl border border-cyan-500/10 shadow-lg shadow-cyan-500/10 p-6">
              <h3 className="aura-headline text-lg mb-4">Procedure</h3>
              <div className="space-y-2">
                {config.procedure.map((step, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      completedSteps[idx]
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-black/20 border-cyan-500/10 text-slate-300 hover:bg-cyan-500/5'
                    }`}
                    onClick={() => toggleStep(idx)}
                  >
                    <span
                      className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        completedSteps[idx] ? 'bg-emerald-500 text-black' : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {completedSteps[idx] ? <FaCheck /> : idx + 1}
                    </span>
                    <span className="text-sm">{step}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-cyan-500/10">
                <p className="text-xs text-slate-400">
                  Steps completed: {Object.values(completedSteps).filter(Boolean).length} / {config.procedure.length}
                </p>
              </div>
            </div>

            <div className="aura-glass aura-glass-card rounded-2xl border border-cyan-500/10 shadow-lg shadow-cyan-500/10 p-6">
              <h3 className="aura-headline text-lg mb-4">Circuit Status</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Power</span>
                  <span className={`font-mono ${boardState ? 'text-emerald-400' : 'text-red-400'}`}>
                    {boardState ? 'ON' : 'OFF'}
                  </span>
                </div>
                {inputSwitches.map((s) => (
                  <div key={s} className="flex justify-between">
                    <span className="text-slate-400">Switch {s}</span>
                    <span className={`font-mono ${switchStates[s] ? 'text-amber-400' : 'text-slate-500'}`}>
                      {switchStates[s] ? '1 (HIGH)' : '0 (LOW)'}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span className="text-slate-400">Output (Y)</span>
                  <span className={`font-mono ${outputValue === 1 ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`}>
                    {outputValue === 1 ? '1 (HIGH)' : '0 (LOW)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">LED {config.outputLed}</span>
                  <span className={ledStates[config.outputLed] ? 'text-amber-400 animate-bounce' : 'text-slate-600'}>
                    {ledStates[config.outputLed] ? 'GLOWING' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex gap-2 justify-center">
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
      </div>
    </PageShell>
  );
};

export default LogicGateExperiment;
