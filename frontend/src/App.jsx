// src/App.jsx
import Navbar        from './components/Navbar';
import Hero          from './components/Hero';
import Dashboard     from './components/Dashboard';
import RealtimePanel from './components/RealtimePanel';
import AttackDemo    from './components/AttackDemo';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Dashboard />
        <RealtimePanel />
        <AttackDemo />

        <footer style={{
          textAlign: 'center', padding: '32px 24px',
          borderTop: '1px solid var(--border)',
          fontSize: 12, color: 'var(--t3)', fontFamily: 'var(--mono)',
          letterSpacing: '0.03em',
        }}>
          AdverSight — Adversarial Robustness Research &nbsp;·&nbsp; PyTorch + React
        </footer>
      </main>
    </>
  );
}