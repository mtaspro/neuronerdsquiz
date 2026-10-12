import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { QUESTION_BANK } from '../../data/organicChemistryData';

const REWARDS = { auraPoints: 120, inGameTokens: 60 };

export default function OrganicQuizModal({ open = true, onClose = () => {}, onLevelComplete = () => {} }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = QUESTION_BANK[idx];
  const total = QUESTION_BANK.length;

  const pick = (i) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (idx + 1 >= total) {
      const accuracy = Math.round((score / total) * 100);
      const stars = accuracy >= 90 ? 3 : accuracy >= 65 ? 2 : accuracy >= 50 ? 1 : 0;
      setDone(true);
      onLevelComplete({ success: stars > 0, accuracy, stars });
    } else {
      setIdx(idx + 1); setPicked(null);
    }
  };

  const accuracy = Math.round((score / total) * 100);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative z-10 w-full max-w-xl rounded-3xl border border-emerald-400/25 bg-gradient-to-b from-[#0b1020] to-[#080d18] p-6 shadow-aura-violet"
            initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-300">Chemistry · Organic Quest</p>
                <h2 className="text-lg font-bold text-white">জৈব রসায়ন মিশন — Board MCQ</h2>
              </div>
              <button onClick={onClose} aria-label="Close" className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white"><FaTimes /></button>
            </div>

            {!done ? (
              <>
                <p className="text-xs text-slate-400 mb-3">Question {idx + 1}/{total} · {q.topic} · {q.board}</p>
                <p className="text-sm text-slate-100 leading-relaxed mb-4">{q.q}</p>
                <div className="space-y-2">
                  {q.options.map((opt, i) => {
                    const isRight = picked !== null && i === q.answer;
                    const isWrong = picked === i && i !== q.answer;
                    return (
                      <button key={i} onClick={() => pick(i)}
                        className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                          isRight ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-200'
                          : isWrong ? 'border-rose-400/60 bg-rose-400/15 text-rose-200'
                          : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                        }`}>{opt}</button>
                    );
                  })}
                </div>
                {picked !== null && (
                  <button onClick={next}
                    className="mt-4 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 py-2.5 text-xs font-bold uppercase tracking-widest text-[#04121c]">
                    {idx + 1 === total ? 'Finish' : 'Next question ▸'}
                  </button>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-3xl tracking-[0.2em]">{'⭐'.repeat(Math.max(1, Math.round(accuracy / 34)))}</div>
                <p className="mt-3 font-bold text-emerald-300">{score}/{total} correct — {accuracy}%</p>
                <div className="mt-3 flex justify-center gap-2">
                  <span className="rounded-full border border-violet-400/40 bg-violet-400/15 px-3 py-1 text-xs font-bold text-violet-300">+{REWARDS.auraPoints} aura</span>
                  <span className="rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-300">+{REWARDS.inGameTokens} tokens</span>
                </div>
                <button onClick={onClose} className="mt-4 w-full rounded-xl border border-emerald-400/40 bg-emerald-400/15 py-2.5 text-xs font-bold uppercase tracking-widest text-emerald-300">মিশন সম্পন্ন ▸</button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
