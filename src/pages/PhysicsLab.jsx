import { FaAtom, FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import PageShell from '../components/ui/PageShell';
import Button from '../components/ui/Button';

const experiments = [
  {
    title: 'Post Office Box Experiment',
    description: 'Determine the resistance of a wire using a Post Office Box (meter bridge) setup.',
    to: '/virtual-lab/physics/post-office-box',
  },
];

const PhysicsLab = () => {
  return (
    <PageShell className="min-h-[calc(100vh-3.5rem)] text-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <div className="flex items-center gap-3 mb-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400">
            <FaAtom className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="aura-headline text-2xl sm:text-3xl">Physics Lab</h1>
            <p className="aura-subhead text-sm mt-0.5">
              Select an experiment to launch the workspace.
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {experiments.map(({ title, description, to }) => (
            <Link
              key={title}
              to={to}
              className="aura-glass aura-glass-card rounded-2xl border border-cyan-500/10 shadow-lg shadow-cyan-500/10 p-6 sm:p-8 transition-transform hover:-translate-y-1 hover:shadow-xl block"
            >
              <h2 className="aura-headline text-xl mb-2">{title}</h2>
              <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
            </Link>
          ))}
        </div>

        <div className="mt-10">
          <Button to="/virtual-lab" variant="secondary">
            <FaArrowLeft className="h-4 w-4 mr-2" aria-hidden />
            Back to labs
          </Button>
        </div>
      </div>
    </PageShell>
  );
};

export default PhysicsLab;
