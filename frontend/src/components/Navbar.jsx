// src/components/Navbar.jsx
import { useState, useEffect } from 'react';

const NAV_LINKS = [
  { id: 'home',      label: 'Overview' },
  { id: 'metrics',   label: 'Metrics'  },
  { id: 'realtime',  label: 'Live'     },
  { id: 'demo',      label: 'Demo'     },
];

export default function Navbar() {
  const [active, setActive] = useState('home');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    setActive(id);
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      background: scrolled ? 'rgba(12,12,15,0.88)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px) saturate(1.5)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      transition: 'all 0.4s var(--ease)',
      padding: '0 24px',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 60,
      }}>
        {/* Logo */}
        <button onClick={() => scrollTo('home')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 30, height: 30,
            background: 'var(--sage)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" stroke="#0c0c0f" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="8" cy="8" r="2" fill="#0c0c0f"/>
            </svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--t1)', letterSpacing: '-0.02em' }}>
            Adver<span style={{ color: 'var(--sage)' }}>Sight</span>
          </span>
        </button>

        {/* Desktop nav */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} className="desktop-nav">
          {NAV_LINKS.map(l => (
            <button key={l.id} onClick={() => scrollTo(l.id)} style={{
              background: active === l.id ? 'var(--sage-dim)' : 'transparent',
              border: 'none',
              color: active === l.id ? 'var(--sage)' : 'var(--t2)',
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'var(--sans)',
            }}>
              {l.label}
            </button>
          ))}
          <span style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: 'var(--sage)', fontFamily: 'var(--mono)' }}>
            <span className="live-dot"/>API Live
          </span>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} style={{
          display: 'none', background: 'none', border: 'none',
          cursor: 'pointer', color: 'var(--t1)', padding: 4,
        }} className="mob-menu-btn" aria-label="Menu">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            {menuOpen
              ? <><line x1="4" y1="4" x2="18" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <line x1="18" y1="4" x2="4" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></>
              : <><line x1="3" y1="7"  x2="19" y2="7"  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <line x1="3" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <line x1="3" y1="15" x2="19" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></>
            }
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
          padding: '12px 24px 20px',
          animation: 'fadeIn 0.2s ease',
        }}>
          {NAV_LINKS.map(l => (
            <button key={l.id} onClick={() => scrollTo(l.id)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              background: 'none', border: 'none', cursor: 'pointer',
              color: active === l.id ? 'var(--sage)' : 'var(--t2)',
              fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 500,
              padding: '10px 0',
              borderBottom: '1px solid var(--border)',
            }}>
              {l.label}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .mob-menu-btn { display: block !important; }
        }
      `}</style>
    </nav>
  );
}