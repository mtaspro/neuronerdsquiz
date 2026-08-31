'use client'

import { useEffect, useState } from 'react'

export function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const started = performance.now()
    let frame = 0
    const tick = () => {
      const elapsed = performance.now() - started
      const next = Math.min(100, Math.round((elapsed / 1200) * 100))
      setProgress(next)
      if (next < 100) frame = requestAnimationFrame(tick)
      else window.setTimeout(onComplete, 220)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [onComplete])

  return (
    <div className="boot-sequence" role="status" aria-live="polite">
      <div className="boot-mark" aria-hidden="true"><span>H</span></div>
      <p className="boot-kicker">HSCAURA / NEURAL LEARNING SYSTEM</p>
      <p className="boot-title">AURA INITIALIZING</p>
      <div className="boot-track"><span style={{ width: `${progress}%` }} /></div>
      <div className="boot-meta"><span>CALIBRATING FOCUS</span><span>{progress}%</span></div>
    </div>
  )
}

export function AuraGlowOrb() {
  return <div className="aura-orb" aria-hidden="true"><div /><div /><div /></div>
}

export function FeatureCard({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <article className="feature-card"><span className="feature-eyebrow">{eyebrow}</span><h3>{title}</h3><p>{copy}</p><span className="feature-arrow" aria-hidden="true">↗</span></article>
}

export function QuizBattlePreview() {
  const [selected, setSelected] = useState<string | null>(null)
  const answers = ['Mitochondria', 'Ribosome', 'Nucleus']
  return <div className="battle-card">
    <div className="battle-top"><span className="live-dot">LIVE SESSION</span><span>ROUND 04 / 08</span></div>
    <div className="battle-players"><div><span className="avatar avatar-you">Y</span><strong>You</strong><small>7 streak</small></div><span className="versus">VS</span><div className="player-right"><span className="avatar avatar-opponent">A</span><strong>Alex Chen</strong><small>6 streak</small></div></div>
    <div className="question"><span className="question-label">BIOLOGY / CELL ENERGY</span><h2>Which organelle is known as the powerhouse of the cell?</h2><div className="answers">{answers.map((answer, index) => <button key={answer} className={selected === answer ? 'answer selected' : 'answer'} onClick={() => setSelected(answer)}><span>{String.fromCharCode(65 + index)}</span>{answer}</button>)}</div></div>
    <div className="battle-footer"><span>{selected ? 'Answer locked. Nice instinct.' : 'Choose your answer'}</span><span className="confidence">AURA CONFIDENCE <b>{selected ? '94%' : '—'}</b></span></div>
  </div>
}

export function IntroScreen() {
  const [booted, setBooted] = useState(false)
  return <main className={`intro-shell ${booted ? 'is-ready' : ''}`}>
    {!booted && <BootSequence onComplete={() => setBooted(true)} />}
    <div className="hero-grid" aria-hidden="true" /><div className="scanlines" aria-hidden="true" /><AuraGlowOrb />
    <nav className="site-nav"><a className="brand" href="#top"><span className="brand-glyph">H</span><span>HSCAURA</span></a><div className="nav-links"><a href="#experience">Experience</a><a href="#features">Why Aura</a><a href="#signin">Sign in</a></div><a className="nav-join" href="#join">Join free <span>↗</span></a></nav>
    <section className="hero" id="top"><div className="hero-copy"><p className="eyebrow"><span className="pulse" /> THE NEXT ERA OF STUDYING</p><h1>Train your mind<br /><em>at full speed.</em></h1><p className="hero-sub">Adaptive quizzes, real-time battles, and AI feedback that turns every study session into momentum.</p><div className="status-strip"><span>LIVE BATTLES</span><i /> <span>ADAPTIVE AI</span><i /> <span>MEMORY TRACKING</span></div><div className="hero-actions"><a className="primary-cta" href="#join">Enter HSCAura <span>↗</span></a><a className="secondary-cta" href="#experience"><span className="play-icon">▶</span> Watch the experience</a></div></div><div className="hero-visual" id="experience"><QuizBattlePreview /></div></section>
    <section className="feature-row" id="features"><FeatureCard eyebrow="01 / ADAPTIVE" title="Learning that evolves." copy="Difficulty follows your focus, so every question hits the edge of your ability." /><FeatureCard eyebrow="02 / LIVE" title="Study, but make it social." copy="Challenge sharp minds, climb the ranks, and make progress feel electric." /><FeatureCard eyebrow="03 / AURA AI" title="Know what to fix next." copy="Instant feedback surfaces the gaps that matter before they become blockers." /></section>
    <footer className="site-footer"><span>HSCAURA / FOCUS WITHOUT LIMITS</span><span>SCROLL TO ENTER <b>↓</b></span></footer>
  </main>
}

export default IntroScreen
