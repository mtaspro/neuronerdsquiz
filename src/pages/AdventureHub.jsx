import { Link } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight, FaCompass, FaFlask, FaLock, FaStar } from 'react-icons/fa';
import PageShell from '../components/ui/PageShell';
import Button from '../components/ui/Button';

const LEVELS = [
  {
    subject: 'পদার্থবিজ্ঞান',
    chapter: 'ভেক্টর অধ্যায়',
    accent: 'cyan',
    icon: FaCompass,
    items: [
      { levelKey: 'vector-level-1', number: '01', title: 'প্রাচীনদের নদী', description: 'স্রোত আর ইঞ্জিনের বেগ মিলিয়ে নিরাপদ পারাপারের আদর্শ কোণ নির্ণয় করো।', tag: 'Vector basics', live: true },
      { levelKey: 'vector-scene-1', number: '02', title: 'স্যাংচুয়ারির গেট', description: 'সদৃশ ভেক্টর ধাঁধা সমাধান করে আশ্রয়-স্থলের দরজা খোলো।', tag: 'Dot & cross', live: true },
      { levelKey: 'vector-scene-2', number: '03', title: 'ঝড়ঝাপটা রিজ', description: 'বৃষ্টি, বাতাস আর আপেক্ষিক বেগ বিশ্লেষণ করে দলকে উদ্ধার করো।', tag: 'Relative motion', live: true },
      { levelKey: 'vector-scene-3', number: '04', title: 'কোর রিঅ্যাক্টর', description: '∇·F ও curl ব্যবহার করে প্লাজমা ক্ষেত্র স্থিতিশীল করো।', tag: 'Vector calculus', live: true },
    ],
  },
  {
    subject: 'রসায়ন',
    chapter: 'গুণগত বিশ্লেষণ',
    accent: 'violet',
    icon: FaFlask,
    items: [{ levelKey: 'chem-level-1', number: '05', title: 'ইউভি পাসপোর্ট', description: 'UV বাতির তরঙ্গদৈর্ঘ্য ও তীব্রতা সামঞ্জস্য করে গোপন নিরাপত্তা-সূত্র উন্মোচন করো।', tag: 'UV analysis', live: true }],
  },
];

const accentClasses = {
  cyan: { line: 'from-cyan-300/80', text: 'text-cyan-300', border: 'border-cyan-300/20', glow: 'shadow-cyan-500/10', icon: 'bg-cyan-300/10 text-cyan-200' },
  violet: { line: 'from-violet-300/80', text: 'text-violet-300', border: 'border-violet-300/20', glow: 'shadow-violet-500/10', icon: 'bg-violet-300/10 text-violet-200' },
};

function MissionCard({ item, accent }) {
  const colors = accentClasses[accent];
  const Icon = accent === 'violet' ? FaFlask : FaCompass;
  return (
    <Link to={`/adventure/${item.levelKey}`} className={`group relative overflow-hidden rounded-2xl border ${colors.border} ${colors.glow} bg-slate-950/35 p-5 shadow-xl transition duration-300 hover:-translate-y-1 hover:bg-slate-900/60 hover:shadow-2xl`}>
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${colors.line} to-transparent opacity-70`} />
      <div className="mb-8 flex items-start justify-between gap-3">
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${colors.icon}`}><Icon aria-hidden /></span>
        <span className={`rounded-full border ${colors.border} px-2.5 py-1 font-mono text-[10px] font-bold ${colors.text}`}>{item.number}</span>
      </div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">{item.tag}</p>
      <h3 className="aura-headline text-xl text-slate-100 transition group-hover:text-white">{item.title}</h3>
      <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-400">{item.description}</p>
      <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-[10px] font-bold uppercase tracking-[0.18em]">
        <span className="flex items-center gap-2 text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_currentColor]" />Mission ready</span>
        <FaArrowRight className={`${colors.text} transition group-hover:translate-x-1`} aria-hidden />
      </div>
    </Link>
  );
}

const AdventureHub = () => (
  <PageShell className="min-h-[calc(100vh-3.5rem)] overflow-hidden text-slate-100">
    <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-cyan-500/10 blur-[90px]" />
      <div className="pointer-events-none absolute -right-24 top-72 h-80 w-80 rounded-full bg-violet-500/10 blur-[100px]" />

      <header className="relative mb-12 flex flex-col gap-8 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300"><span className="h-px w-8 bg-cyan-300" />Aura // Adventure protocol</div>
          <h1 className="aura-headline text-4xl leading-tight text-slate-100 sm:text-6xl">জ্ঞানকে <span className="bg-gradient-to-r from-cyan-200 via-cyan-300 to-violet-300 bg-clip-text text-transparent">অস্ত্রে</span> পরিণত করো।</h1>
          <p className="aura-subhead mt-5 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">একটি অধ্যায়-মানচিত্র। গল্প খোলো, চ্যালেঞ্জ সমাধান করো, আর প্রতিটি সঠিক সিদ্ধান্তে নিজের Aura শক্তিশালী করো।</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 backdrop-blur-md"><FaStar className="text-amber-300" aria-hidden /><div><p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Current rank</p><p className="font-mono text-sm font-bold text-slate-100">AURA INITIATE</p></div></div>
      </header>

      <main className="relative space-y-12">
        {LEVELS.map(({ subject, chapter, accent, icon: SubjectIcon, items }) => {
          const colors = accentClasses[accent];
          return <section key={chapter} aria-labelledby={chapter.replaceAll(' ', '-')}>
            <div className="mb-5 flex items-center gap-4"><div className={`grid h-10 w-10 place-items-center rounded-xl ${colors.icon}`}><SubjectIcon aria-hidden /></div><div><p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${colors.text}`}>{subject}</p><h2 id={chapter.replaceAll(' ', '-')} className="aura-headline mt-1 text-2xl text-slate-100">{chapter}</h2></div><div className={`ml-2 h-px flex-1 bg-gradient-to-r ${colors.line} to-transparent opacity-30`} /></div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{items.map((item) => <MissionCard key={item.levelKey} item={item} accent={accent} />)}</div>
          </section>;
        })}
      </main>

      <footer className="relative mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">প্রতিটি মিশন শেষ হলে নতুন অধ্যায়ের সিগন্যাল আনলক হবে।</p><Button to="/virtual-lab" variant="secondary"><FaArrowLeft className="mr-2 h-3 w-3" aria-hidden />Back to Virtual Lab</Button></footer>
    </div>
  </PageShell>
);

export default AdventureHub;
