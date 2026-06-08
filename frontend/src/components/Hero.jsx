// src/components/Hero.jsx
import { useEffect, useRef } from 'react';

function NoiseBg() {
  const ref = useRef();
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    c.width  = window.innerWidth;
    c.height = window.innerHeight;
    const imageData = ctx.createImageData(c.width, c.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const v = Math.random() * 25;
      imageData.data[i]     = v;
      imageData.data[i + 1] = v;
      imageData.data[i + 2] = v;
      imageData.data[i + 3] = 30;
    }
    ctx.putImageData(imageData, 0, 0);
  }, []);
  return <canvas ref={ref} style={{
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    pointerEvents: 'none', opacity: 0.6,
  }}/>;
}

const STATS = [
  { label: 'Clean accuracy',   value: '87.4%', color: 'var(--sage)'   },
  { label: 'Under PGD attack', value: '12.4%', color: 'var(--rose)'   },
  { label: 'After defense',    value: '82.1%', color: 'var(--amber)'  },
  { label: 'Attack types',     value: '2',     color: 'var(--violet)' },
];

export default function Hero() {
  return (
    <section id="home" style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center',
      position: 'relative', overflow: 'hidden',
      padding: '100px 24px 80px',
    }}>
      <NoiseBg/>

      {/* Radial glow */}
      <div style={{
        position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
        width: 700, height: 500,
        background: 'radial-gradient(ellipse at center, rgba(126,184,164,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}/>

      {/* Dot-grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(126,184,164,0.35) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)',
      }}/>

      <div className="container" style={{ position: 'relative', textAlign: 'center' }}>

        <div className="anim-fade-up" style={{ marginBottom: 28 }}>
          <span className="pill pill-sage" style={{ fontSize: 12 }}>
            Deep Learning Security Research
          </span>
        </div>

        <h1 className="anim-fade-up delay-1" style={{
          fontSize: 'clamp(38px, 6vw, 76px)',
          fontWeight: 300,
          lineHeight: 1.08,
          letterSpacing: '-0.04em',
          marginBottom: 32,
          color: 'var(--t1)',
        }}>
          <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--sage)', fontWeight: 400 }}>
            Adversarial
          </span>
          <br/>Robustness
          <br/>
          <span style={{ color: 'var(--t3)', fontSize: '0.65em', fontWeight: 300, letterSpacing: '-0.02em' }}>
            in Deep Learning
          </span>
        </h1>

        <p className="anim-fade-up delay-2" style={{
          fontSize: 17, color: 'var(--t2)', maxWidth: 520, margin: '0 auto 48px',
          lineHeight: 1.75, fontWeight: 300,
        }}>
          Studying how image classifiers fail under imperceptible perturbations
          and building defenses that hold — powered by CIFAR-10, PyTorch, and
          state-of-the-art adversarial training.
        </p>

        <div className="anim-fade-up delay-3" style={{
          display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap',
          marginBottom: 80,
        }}>
          <button className="btn btn-sage" onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
            Run Live Demo
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="btn btn-ghost" onClick={() => document.getElementById('metrics')?.scrollIntoView({ behavior: 'smooth' })}>
            View Metrics
          </button>
        </div>

        {/* Stat strip */}
        <div className="anim-fade-up delay-4" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 1,
          background: 'var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid var(--border)',
          maxWidth: 700, margin: '0 auto',
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              background: 'var(--card)',
              padding: '20px 16px',
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: '1.7rem',
                fontWeight: 500, color: s.color,
                letterSpacing: '-0.03em', lineHeight: 1,
                marginBottom: 6,
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}