import { useMemo, useState } from 'react';
import { FaFlask, FaArrowLeft, FaPlay, FaRobot } from 'react-icons/fa';
import PageShell from '../components/ui/PageShell';
import Button from '../components/ui/Button';
import ReactionCanvas from '../components/chemistry/ReactionCanvas';
import { REACTANTS, REAGENTS, FUNCTIONAL_GROUPS, findReaction } from '../data/organicChemistryData';
import api from '../utils/api';

const ChemistryLab = () => {
  const [reactantId, setReactantId] = useState('ethanal');
  const [reagentId, setReagentId] = useState('tollens');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [aiNote, setAiNote] = useState('');
  const [aiBusy, setAiBusy] = useState(false);

  const reactant = useMemo(() => REACTANTS.find((r) => r.id === reactantId), [reactantId]);
  const reagent = useMemo(() => REAGENTS.find((r) => r.id === reagentId), [reagentId]);

  const run = () => {
    const rule = findReaction(reactant, reagentId);
    setResult(rule || {
      product: 'No reaction',
      observation: `${reactant.name} does not react with ${reagent.name} under these conditions.`,
      equation: '—',
      visual: 'none',
      color: '#475569',
    });
    setAiNote('');
    setRunning(true);
    setTimeout(() => setRunning(false), 2600);
  };

  const askNeuraX = async () => {
    if (!result) return;
    setAiBusy(true);
    try {
      const { data } = await api.post('/api/ai-chat', {
        integration: 'neurax',
        message: `Virtual lab check (NCTB HSC organic chemistry): student mixed ${reactant.name} (${reactant.structure}) with ${reagent.name}. Simulation says: ${result.observation} | equation: ${result.equation}. In 2-3 sentences, confirm whether this matches NCTB standards and name the underlying principle.`,
      });
      setAiNote(data.response);
    } catch {
      setAiNote('NeuraX unavailable — check AI keys.');
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <PageShell className="min-h-[calc(100vh-3.5rem)] text-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">
            <FaFlask className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="aura-headline text-2xl sm:text-3xl">Organic Chemistry Lab</h1>
            <p className="aura-subhead text-sm mt-0.5">Pick a compound, add a reagent, observe. Educational simulation only.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* bench */}
          <div>
            <ReactionCanvas result={result} running={running} />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 mb-2">Reactant</p>
                <select
                  value={reactantId}
                  onChange={(e) => { setReactantId(e.target.value); setResult(null); }}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400/60 outline-none"
                >
                  {REACTANTS.map((r) => <option key={r.id} value={r.id}>{r.name} — {r.formula}</option>)}
                </select>
                <p className="mt-2 text-[11px] text-white/50">{FUNCTIONAL_GROUPS[reactant.group]} · {reactant.structure}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 mb-2">Reagent</p>
                <select
                  value={reagentId}
                  onChange={(e) => { setReagentId(e.target.value); setResult(null); }}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400/60 outline-none"
                >
                  {REAGENTS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <p className="mt-2 text-[11px] text-white/50">{reagent.tag}</p>
              </div>
            </div>

            <button
              onClick={run}
              disabled={running}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-500 px-6 py-3.5 font-display text-sm font-bold uppercase tracking-widest text-[#04121c] transition enabled:hover:brightness-110 enabled:active:scale-95 disabled:opacity-50"
            >
              <FaPlay /> {running ? 'Reacting…' : 'Run experiment'}
            </button>

            {result && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-mono text-sm text-cyan-300">{result.equation}</p>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">{result.observation}</p>
                <button
                  onClick={askNeuraX}
                  disabled={aiBusy}
                  className="mt-3 flex items-center gap-2 rounded-xl border border-violet-400/40 bg-violet-400/15 px-4 py-2 text-xs font-bold text-violet-300 transition hover:bg-violet-400/25 disabled:opacity-50"
                >
                  <FaRobot /> {aiBusy ? 'NeuraX is checking…' : 'Verify with NeuraX'}
                </button>
                {aiNote && <p className="mt-2 rounded-xl border border-violet-400/20 bg-violet-400/5 p-3 text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">{aiNote}</p>}
              </div>
            )}
          </div>

          {/* side panel */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs leading-relaxed text-amber-200">
              ⚠️ Educational simulation. Not a substitute for real lab safety, procedures, or verified chemical data. Do not use to plan actual experiments.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Coverage (NCTB ch. organic)</p>
              <ul className="space-y-1 text-xs text-slate-400">
                <li>• Baeyer & bromine-water unsaturation tests</li>
                <li>• Ozonolysis · catalytic hydrogenation</li>
                <li>• Benzene nitration · Friedel–Crafts</li>
                <li>• Lucas test (1°/2°/3° alcohols)</li>
                <li>• Tollens' · Fehling's · 2,4-DNPH · iodoform</li>
                <li>• Soda-lime decarboxylation · carbylamine</li>
              </ul>
            </div>
            <Button to="/virtual-lab" variant="secondary" className="w-full">
              <FaArrowLeft className="h-4 w-4 mr-2" aria-hidden /> Back to labs
            </Button>
          </aside>
        </div>
      </div>
    </PageShell>
  );
};

export default ChemistryLab;
