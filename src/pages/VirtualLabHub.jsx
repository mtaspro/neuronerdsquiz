import { Link } from 'react-router-dom';
import { FaAtom, FaFlask, FaArrowLeft } from 'react-icons/fa';
import PageShell from '../components/ui/PageShell';
import Button from '../components/ui/Button';

const VirtualLabHub = () => {
  const subjects = [
    {
      title: 'Physics Lab',
      description: 'Explore mechanics, optics, electricity, and more through interactive experiments.',
      icon: FaAtom,
      to: '/virtual-lab/physics',
      border: 'border-cyan-500/10',
      shadow: 'shadow-cyan-500/10',
      iconBg: 'bg-cyan-100 dark:bg-cyan-950/80',
      iconText: 'text-cyan-700 dark:text-cyan-400',
    },
    {
      title: 'Chemistry Lab',
      description: 'Investigate reactions, molecular structures, and chemical processes safely.',
      icon: FaFlask,
      to: '/virtual-lab/chemistry',
      border: 'border-emerald-500/10',
      shadow: 'shadow-emerald-500/10',
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/80',
      iconText: 'text-emerald-700 dark:text-emerald-400',
    },
  ];

  return (
    <PageShell className="min-h-[calc(100vh-3.5rem)] text-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <div className="flex items-center gap-3 mb-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400">
            <FaAtom className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="aura-headline text-2xl sm:text-3xl">Virtual Lab</h1>
            <p className="aura-subhead text-sm mt-0.5">
              Choose a subject to begin your experiment.
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 mb-10">
          {subjects.map((subject) => {
            const { title, description, to, border, shadow, iconBg, iconText, icon: Icon } = subject;
            return (
              <Link
                key={title}
                to={to}
                className={`aura-glass aura-glass-card rounded-2xl ${border} ${shadow} shadow-lg p-6 sm:p-8 transition-transform hover:-translate-y-1 hover:shadow-xl`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg} ${iconText}`}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h2 className="aura-headline text-xl">{title}</h2>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
              </Link>
            );
          })}
        </div>

        <Button to="/dashboard" variant="secondary">
          <FaArrowLeft className="h-4 w-4 mr-2" aria-hidden />
          Back to dashboard
        </Button>
      </div>
    </PageShell>
  );
};

export default VirtualLabHub;
