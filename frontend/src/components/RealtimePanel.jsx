// src/components/RealtimePanel.jsx
import { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Simulated accuracy curves (polynomial fit from experiment data)
function normalAcc(eps)  { return Math.max(3, 87.4 * Math.exp(-8.5 * eps)); }
function robustAcc(eps)  { return Math.max(20, 82.1 * Math.exp(-3.1 * eps)); }

function buildCurve() {
  const pts = [];
  for (let e = 0; e <= 0.5; e += 0.01) {
    pts.push({ eps: parseFloat(e.toFixed(2)), normal: parseFloat(normalAcc(e).toFixed(1)), robust: parseFloat(robustAcc(e).toFixed(1)) });
  }
  return pts;
}
const CURVE = buildCurve();

const tip = { contentStyle: { background: '#16161e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 }, itemStyle: { color: '#9896a0' }, labelStyle: { color: '#f0ede8' } };

export default function RealtimePanel() {
  const [eps, setEps] = useState(0.10);
  const [apiStatus, setApiStatus] = useState(null); // null=checking, obj=result
  const [checking, setChecking] = useState(false);
  const timerRef = useRef(null);

  const normalVal = parseFloat(normalAcc(eps).toFixed(1));
  const robustVal = parseFloat(robustAcc(eps).toFixed(1));
  const gain      = parseFloat((robustVal - normalVal).toFixed(1));

  const idx = Math.round(eps / 0.01);

  useEffect(() => {
    checkApi();
  }, []);

  const checkApi = async () => {
    setChecking(true);
    try {
      const res = await axios.get(`${API_URL}/health`, { timeout: 4000 });
      setApiStatus({ ok: true, ...res.data });
    } catch {
      setApiStatus({ ok: false });
    } finally {
      setChecking(false);
    }
  };

  return (
    <section id="realtime" style={{ background: 'var(--bg2)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="pill pill-violet" style={{ marginBottom: 20, display: 'inline-flex' }}>
            <span className="live-dot" style={{ background: 'var(--violet)', marginRight: 6 }}/>
            Interactive
          </span>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 300, letterSpacing: '-0.03em', marginBottom: 14 }}>
            Real-time <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--violet)' }}>Comparison</span>
          </h2>
          <p style={{ color: 'var(--t2)', maxWidth: 440, margin: '0 auto', fontWeight: 300, fontSize: 15 }}>
            Drag the epsilon slider and watch both models' accuracy update instantly.
          </p>
        </div>

        <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
          {/* Slider + live stats */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: 'var(--t2)' }}>Attack strength — Epsilon (ε)</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color: 'var(--violet)' }}>
                  {eps.toFixed(2)}
                </span>
              </div>
              <input type="range" min={0} max={0.5} step={0.01} value={eps}
                onChange={e => setEps(parseFloat(e.target.value))} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>
                <span>No attack</span><span>Very strong</span>
              </div>
            </div>

            {/* Live readouts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { label: 'Normal Model', value: `${normalVal}%`, color: 'var(--rose)' },
                { label: 'Robust Model', value: `${robustVal}%`, color: 'var(--sage)' },
                { label: 'Defense Gain', value: `+${gain}%`,    color: 'var(--violet)' },
              ].map((s, i) => (
                <div key={i} style={{
                  background: 'var(--bg3)', borderRadius: 12, padding: '16px 12px', textAlign: 'center',
                  border: '1px solid var(--border)',
                  transition: 'all 0.15s',
                }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '1.5rem', fontWeight: 500, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Insight text */}
            <div style={{
              background: 'var(--bg3)', borderRadius: 10, padding: '14px 16px',
              border: '1px solid var(--border)', fontSize: 13, color: 'var(--t2)', lineHeight: 1.6,
            }}>
              {eps < 0.02
                ? 'At near-zero epsilon, both models perform at clean accuracy. No meaningful perturbation.'
                : eps < 0.08
                ? `At ε=${eps.toFixed(2)}, the normal model starts failing. The robust model holds well above 60%.`
                : eps < 0.2
                ? `At ε=${eps.toFixed(2)}, the normal model is severely degraded. Robust training provides a +${gain}% accuracy shield.`
                : `At ε=${eps.toFixed(2)}, the normal model is nearly random (10 classes). The robust model retains meaningful accuracy.`}
            </div>
          </div>

          {/* Mini line chart that tracks current eps */}
          <div className="card">
            <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>FGSM Accuracy Curve</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 16 }}>
              Vertical line = current ε value
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={CURVE.filter((_, i) => i % 2 === 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="eps" stroke="var(--t3)" tick={{ fill: 'var(--t3)', fontSize: 10 }} interval={4} />
                <YAxis stroke="var(--t3)" tick={{ fill: 'var(--t3)', fontSize: 10 }} domain={[0, 100]} />
                <Tooltip {...tip} />
                <ReferenceLine x={parseFloat(eps.toFixed(2))} stroke="var(--violet)" strokeWidth={1.5} strokeDasharray="4 3" label={{ value: `ε=${eps.toFixed(2)}`, fill: 'var(--violet)', fontSize: 11 }} />
                <Line type="monotone" dataKey="normal" stroke="#e87b7b" strokeWidth={1.5} dot={false} name="Normal" />
                <Line type="monotone" dataKey="robust" stroke="#7eb8a4" strokeWidth={1.5} dot={false} name="Robust" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* API health card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: apiStatus?.ok ? 'var(--sage-dim)' : 'var(--rose-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {checking
                ? <div style={{ width: 14, height: 14, border: '2px solid var(--t3)', borderTopColor: 'var(--sage)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
                : <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    {apiStatus?.ok
                      ? <path d="M3 8l3.5 3.5L13 4" stroke="#7eb8a4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      : <path d="M4 4l8 8M12 4l-8 8" stroke="#e87b7b" strokeWidth="1.8" strokeLinecap="round"/>
                    }
                  </svg>
              }
            </div>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>Backend API</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', fontFamily: 'var(--mono)' }}>{API_URL}</div>
            </div>
          </div>

          {apiStatus && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'Status',         value: apiStatus.ok ? 'Connected' : 'Offline',   color: apiStatus.ok ? 'var(--sage)' : 'var(--rose)' },
                { label: 'Normal Model',   value: apiStatus.normal_model ? 'Loaded' : 'Missing', color: apiStatus.normal_model ? 'var(--sage)' : 'var(--amber)' },
                { label: 'Robust Model',   value: apiStatus.robust_model ? 'Loaded' : 'Missing', color: apiStatus.robust_model ? 'var(--sage)' : 'var(--amber)' },
                { label: 'Device',         value: apiStatus.device || '—', color: 'var(--violet)' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '8px 14px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: s.color, fontWeight: 500 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          <button className="btn btn-ghost" onClick={checkApi} style={{ fontSize: 13 }}>
            {checking ? 'Checking...' : 'Refresh Status'}
          </button>
        </div>

        {!apiStatus?.ok && (
          <div style={{
            marginTop: 16, padding: '14px 18px', borderRadius: 10,
            background: 'rgba(232,168,76,0.08)', border: '1px solid rgba(232,168,76,0.2)',
            fontSize: 13, color: 'var(--amber)', lineHeight: 1.6,
          }}>
            <strong>Backend not running.</strong> Start it with:
            &nbsp;<code style={{ fontFamily: 'var(--mono)', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: 4 }}>
              cd backend &amp;&amp; uvicorn demo.app:app --reload --port 8000
            </code>
            &nbsp;The charts and slider above still work — they use precomputed curves.
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </section>
  );
}