import { useState } from 'react';
import { motion } from 'framer-motion';
import TiltCard from './ui/TiltCard';

const KINETIC = [0.22, 1, 0.36, 1];

// Live battle demo card — interactive product showcase for the hero's right column.
// Structure from the reference design; styling + tilt/spotlight magic from our system.
export default function QuizBattlePreview({ active = true }) {
  const [selected, setSelected] = useState(null);
  const answers = ['Mitochondria', 'Ribosome', 'Nucleus'];

  return (
    <motion.div
      className="aura-battle-wrap"
      initial={{ opacity: 0, y: 40, rotateX: 6 }}
      animate={active ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 40 }}
      transition={{ delay: 0.45, duration: 0.9, ease: KINETIC }}
    >
      <TiltCard className="aura-glass aura-battle-card">
        <div className="aura-battle-top">
          <span className="aura-live-dot">LIVE SESSION</span>
          <span>ROUND 04 / 08</span>
        </div>

        <div className="aura-battle-players">
          <div>
            <span className="aura-avatar aura-avatar-you">Y</span>
            <strong>You</strong>
            <small>7 streak</small>
          </div>
          <span className="aura-versus">VS</span>
          <div className="aura-player-right">
            <span className="aura-avatar aura-avatar-opp">A</span>
            <strong>Alex Chen</strong>
            <small>6 streak</small>
          </div>
        </div>

        <div className="aura-battle-question">
          <span className="aura-question-label">BIOLOGY / CELL ENERGY</span>
          <h2>Which organelle is known as the powerhouse of the cell?</h2>
          <div className="aura-answers">
            {answers.map((answer, index) => (
              <button
                key={answer}
                type="button"
                className={`aura-answer ${selected === answer ? 'selected' : ''}`}
                onClick={() => setSelected(answer)}
              >
                <span>{String.fromCharCode(65 + index)}</span>
                {answer}
              </button>
            ))}
          </div>
        </div>

        <div className="aura-battle-footer">
          <span>{selected ? 'Answer locked. Nice instinct.' : 'Choose your answer'}</span>
          <span className="aura-confidence">
            AURA CONFIDENCE <b>{selected ? '94%' : '—'}</b>
          </span>
        </div>
      </TiltCard>
    </motion.div>
  );
}