import { Link } from 'react-router-dom';
import { FaCompass, FaFlask, FaArrowLeft } from 'react-icons/fa';
import PageShell from '../components/ui/PageShell';
import Button from '../components/ui/Button';

/**
 * AdventureHub
 * ------------
 * Chapter-map / router landing page for HSC Aura Adventure Mode.
 * Groups the playable adventure levels by subject:
 *
 *   - Physics · Vector chapter  (river crossing + Scenes 1-3)
 *   - Chemistry                 (UV passport verification)
 *
 * Each card links to /adventure/:levelKey, which AdventureLevelPage routes to
 * the matching level modal (mounted bare / full-screen).
 */

const LEVELS = [
  {
    group: 'পদার্থবিজ্ঞান · ভেক্টর অধ্যায়',
    items: [
      {
        levelKey: 'vector-level-1',
        title: 'লেভেল ১ — প্রাচীনদের নদী',
        description: 'স্রোত আর ইঞ্জিনের বেগ থেকে নদী পার হওয়ার আদর্শ কোণ α নির্ণয় করো এবং নৌকাকে নিরাপদে ওপারে নামাও।',
        icon: FaCompass,
        border: 'border-cyan-500/10',
        shadow: 'shadow-cyan-500/10',
        iconBg: 'bg-cyan-100 dark:bg-cyan-950/80',
        iconText: 'text-cyan-700 dark:text-cyan-400',
      },
      {
        levelKey: 'vector-scene-1',
        title: 'দৃশ্য ১ — আনসিলারি স্যাংচুয়ারির গেট',
        description: 'সদৃশ ভেক্টর ধাঁধা সমাধান করে আশ্রয়-স্থলের দরজা খোলো (ডট ও ক্রস অঙ্কন)।',
        icon: FaCompass,
        border: 'border-indigo-500/10',
        shadow: 'shadow-indigo-500/10',
        iconBg: 'bg-indigo-100 dark:bg-indigo-950/80',
        iconText: 'text-indigo-700 dark:text-indigo-400',
      },
      {
        levelKey: 'vector-scene-2',
        title: 'দৃশ্য ২ — ঝড়ঝাপটা রিজ উদ্ধার',
        description: 'বৃষ্টি, বাতাস আর মানুষের আপেক্ষিক বেগ বিশ্লেষণ করে ঝড়ে আটকা দলকে উদ্ধার করো।',
        icon: FaCompass,
        border: 'border-sky-500/10',
        shadow: 'shadow-sky-500/10',
        iconBg: 'bg-sky-100 dark:bg-sky-950/80',
        iconText: 'text-sky-700 dark:text-sky-400',
      },
      {
        levelKey: 'vector-scene-3',
        title: 'দৃশ্য ৩ — কোর রিঅ্যাক্টর স্থিতিশীলকরণ',
        description: 'ভেক্টর ক্যালকুলাস (∇·F ও curl) দিয়ে প্লাজমা ক্ষেত্র স্থিতিশীল করে চুল্লি সুরক্ষিত করো।',
        icon: FaCompass,
        border: 'border-violet-500/10',
        shadow: 'shadow-violet-500/10',
        iconBg: 'bg-violet-100 dark:bg-violet-950/80',
        iconText: 'text-violet-700 dark:text-violet-400',
      },
    ],
  },
  {
    group: 'রসায়ন · গুণগত বিশ্লেষণ',
    items: [
      {
        levelKey: 'chem-level-1',
        title: 'লেভেল ১ — ইউভি পাসপোর্ট যাচাই',
        description: 'UV বাতির তরঙ্গদৈর্ঘ্য (nm) ও তীব্রতা সামঞ্জস্য করে পাসপোর্টের গুপ্ত নিরাপত্তা-সূত্র (আভা) উন্মোচন করো।',
        icon: FaFlask,
        border: 'border-emerald-500/10',
        shadow: 'shadow-emerald-500/10',
        iconBg: 'bg-emerald-100 dark:bg-emerald-950/80',
        iconText: 'text-emerald-700 dark:text-emerald-400',
      },
    ],
  },
];

const AdventureHub = () => {
  return (
    <PageShell className="min-h-[calc(100vh-3.5rem)] text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 dark:bg-violet-950/80 text-cyan-700 dark:text-violet-300 text-2xl">
            🌟
          </span>
          <div>
            <h1 className="aura-headline text-2xl sm:text-3xl">HSC Aura Adventure</h1>
            <p className="aura-subhead text-sm mt-0.5">
              একটি অধ্যায়-মানচিত্র — স্তরগুলোর গল্প খুলো, চ্যালেঞ্জ সমাধান করো, অরা পয়েন্ট অর্জন করো।
            </p>
          </div>
        </div>

        {LEVELS.map(({ group, items }) => (
          <section key={group} className="mb-10">
            <h2 className="aura-headline text-xl sm:text-2xl mb-4 flex items-center gap-2">
              {group}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {items.map((item) => {
                const { levelKey, title, description, icon: Icon } = item;
                const route = `/adventure/${levelKey}`;
                return (
                  <Link
                    key={levelKey}
                    to={route}
                    className={`aura-glass aura-glass-card rounded-2xl ${item.border} ${item.shadow} shadow-lg p-6 sm:p-8 transition-transform hover:-translate-y-1 hover:shadow-xl`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.iconBg} ${item.iconText}`}>
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <h3 className="aura-headline text-xl">{title}</h3>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        <Button to="/virtual-lab" variant="secondary">
          <FaArrowLeft className="h-4 w-4 mr-2" aria-hidden />
          Back to Virtual Lab
        </Button>
      </div>
    </PageShell>
  );
};

export default AdventureHub;