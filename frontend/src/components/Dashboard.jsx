// src/components/Dashboard.jsx
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const FGSM_DATA = [
  { eps: '0.00', normal: 87.4, robust: 82.1 },
  { eps: '0.01', normal: 72.1, robust: 79.4 },
  { eps: '0.05', normal: 45.3, robust: 68.2 },
  { eps: '0.10', normal: 28.7, robust: 55.6 },
  { eps: '0.20', normal: 15.2, robust: 42.1 },
  { eps: '0.30', normal: 9.8,  robust: 33.7 },
];

const COMPARE_DATA = [
  { name: 'Clean',       normal: 87.4, robust: 82.1 },
  { name: 'FGSM ε=0.1',  normal: 28.7, robust: 55.6 },
  { name: 'PGD ε=0.1',   normal: 12.4, robust: 48.9 },
];

const RADAR_DATA = [
  { metric: 'Clean Acc',    normal: 87.4, robust: 82.1  },
  { metric: 'FGSM ε=0.01', normal: 72.1, robust: 79.4  },
  { metric: 'FGSM ε=0.05', normal: 45.3, robust: 68.2  },
  { metric: 'FGSM ε=0.10', normal: 28.7, robust: 55.6  },
  { metric: 'PGD',          normal: 12.4, robust: 48.9  },
];

const tip = { contentStyle: { background: '#16161e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 13 }, itemStyle: { color: '#9896a0' }, labelStyle: { color: '#f0ede8', fontWeight: 500 } };

function SectionLabel({ children }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 56 }}>
      <span className="pill pill-sage" style={{ marginBottom: 16, display: 'inline-flex' }}>{children}</span>
    </div>
  );
}

const METRIC_CARDS = [
  { title: 'Clean Accuracy',    normal: '87.4%', robust: '82.1%', delta: '-5.3%', impact: 'Minimal clean drop', color: 'var(--sage)'   },
  { title: 'FGSM ε=0.1 Attack', normal: '28.7%', robust: '55.6%', delta: '+26.9%', impact: 'Strong FGSM defense', color: 'var(--amber)' },
  { title: 'PGD ε=0.1 Attack',  normal: '12.4%', robust: '48.9%', delta: '+36.5%', impact: 'Excellent PGD defense', color: 'var(--rose)'  },
];

export default function Dashboard() {
  return (
    <section id="metrics">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span className="pill pill-sage" style={{ marginBottom: 20, display: 'inline-flex' }}>
            Performance Metrics
          </span>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 300, letterSpacing: '-0.03em', marginBottom: 14 }}>
            Results &amp; <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--sage)' }}>Analysis</span>
          </h2>
          <p style={{ color: 'var(--t2)', maxWidth: 480, margin: '0 auto', fontWeight: 300, fontSize: 16 }}>
            Normal model vs adversarially-trained model across attack scenarios
          </p>
        </div>

        <div style={{ height: 40 }}/>

        {/* Metric cards */}
        <div className="grid-3" style={{ marginBottom: 40 }}>
          {METRIC_CARDS.map((m, i) => (
            <div key={i} className="card card-hover" style={{ animationDelay: `${i * 0.1}s` }}>
              <div style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
                {m.title}
              </div>
              <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--rose)', marginBottom: 4, fontFamily: 'var(--mono)' }}>NORMAL</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '1.8rem', fontWeight: 500, color: 'var(--rose)', letterSpacing: '-0.03em' }}>{m.normal}</div>
                </div>
                <div style={{ width: 1, background: 'var(--border)' }}/>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--sage)', marginBottom: 4, fontFamily: 'var(--mono)' }}>ROBUST</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '1.8rem', fontWeight: 500, color: 'var(--sage)', letterSpacing: '-0.03em' }}>{m.robust}</div>
                </div>
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 100,
                background: 'var(--sage-dim)', fontSize: 12, color: 'var(--sage)',
                fontFamily: 'var(--mono)',
              }}>
                {m.delta} &nbsp;{m.impact}
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid-2" style={{ marginBottom: 24 }}>
          {/* FGSM line chart */}
          <div className="card">
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 4 }}>Accuracy vs. Epsilon (FGSM)</div>
              <div style={{ fontSize: 12, color: 'var(--t3)' }}>Stronger attack = bigger accuracy drop</div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={FGSM_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="eps" stroke="var(--t3)" tick={{ fill: 'var(--t3)', fontSize: 11 }} label={{ value: 'ε', position: 'insideRight', fill: 'var(--t3)' }} />
                <YAxis stroke="var(--t3)" tick={{ fill: 'var(--t3)', fontSize: 11 }} domain={[0, 100]} />
                <Tooltip {...tip} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine y={50} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="normal" name="Normal" stroke="#e87b7b" strokeWidth={2} dot={{ fill: '#e87b7b', r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="robust" name="Robust" stroke="#7eb8a4" strokeWidth={2} dot={{ fill: '#7eb8a4', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Comparison bar chart */}
          <div className="card">
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 4 }}>Attack Scenario Comparison</div>
              <div style={{ fontSize: 12, color: 'var(--t3)' }}>Normal vs Robust under each attack type</div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={COMPARE_DATA} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--t3)" tick={{ fill: 'var(--t3)', fontSize: 10 }} />
                <YAxis stroke="var(--t3)" tick={{ fill: 'var(--t3)', fontSize: 11 }} domain={[0, 100]} />
                <Tooltip {...tip} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="normal" name="Normal" fill="#e87b7b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="robust" name="Robust" fill="#7eb8a4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Full-width delta chart */}
        <div className="card">
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 4 }}>Defense Gain by Attack Strength</div>
            <div style={{ fontSize: 12, color: 'var(--t3)' }}>How much adversarial training helps at each epsilon level</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={FGSM_DATA.map(d => ({ eps: d.eps, gain: parseFloat((d.robust - d.normal).toFixed(1)) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="eps" stroke="var(--t3)" tick={{ fill: 'var(--t3)', fontSize: 11 }} />
              <YAxis stroke="var(--t3)" tick={{ fill: 'var(--t3)', fontSize: 11 }} />
              <Tooltip {...tip} formatter={(v) => [`+${v}%`, 'Defense Gain']} />
              <Bar dataKey="gain" name="Defense Gain %" fill="#9b8df0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}