import { Link } from 'react-router-dom';
import { FaFlask, FaArrowLeft } from 'react-icons/fa';

/**
 * Task 1: placeholder for the AI virtual chemistry lab.
 * Later tasks will add reactants, mixing, and AI-backed results.
 */
const VirtualChemLab = () => {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
        <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 bg-white/90 dark:bg-gray-900/90 shadow-lg shadow-emerald-900/5 dark:shadow-black/40 p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">
              <FaFlask className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Virtual chemistry lab
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Coming soon — educational simulation only.
              </p>
            </div>
          </div>

          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed border-l-4 border-amber-400 dark:border-amber-600 pl-4 py-1 mb-8">
            This feature is for learning and demonstration. It is not a substitute for real lab safety,
            procedures, or verified chemical data. Do not use it to plan actual experiments.
          </p>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-medium px-4 py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
          >
            <FaArrowLeft className="h-4 w-4" aria-hidden />
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VirtualChemLab;
