import { Link } from 'react-router-dom';
import { FaFlask, FaArrowLeft } from 'react-icons/fa';
import PageShell from '../components/ui/PageShell';
import Button from '../components/ui/Button';

/**
 * Task 1: placeholder for the AI virtual chemistry lab.
 * Later tasks will add reactants, mixing, and AI-backed results.
 */
const VirtualChemLab = () => {
  return (
    <PageShell className="min-h-[calc(100vh-3.5rem)] text-slate-100">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
        <div className="aura-glass aura-glass-card rounded-2xl border border-cyan-500/10 shadow-lg shadow-cyan-500/10 p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">
              <FaFlask className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h1 className="aura-headline text-2xl sm:text-3xl">
                Virtual chemistry lab
              </h1>
              <p className="aura-subhead text-sm mt-0.5">
                Coming soon — educational simulation only.
              </p>
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed border-l-4 border-amber-400 dark:border-amber-600 pl-4 py-1 mb-8">
            This feature is for learning and demonstration. It is not a substitute for real lab safety,
            procedures, or verified chemical data. Do not use it to plan actual experiments.
          </p>

          <Button
            to="/dashboard"
          >
            <FaArrowLeft className="h-4 w-4 mr-2" aria-hidden />
            Back to dashboard
          </Button>
        </div>
      </div>
    </PageShell>
  );
};

export default VirtualChemLab;
