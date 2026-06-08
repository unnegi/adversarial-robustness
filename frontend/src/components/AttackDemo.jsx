// src/components/AttackDemo.jsx
import { useState, useRef } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const STEPS = [
  { n: 1, label: 'Upload Image'   },
  { n: 2, label: 'Set Parameters' },
  { n: 3, label: 'Run Attack'     },
  { n: 4, label: 'See Results'    },
];

export default function AttackDemo() {
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [attackType, setType]   = useState('fgsm');
  const [epsilon, setEps]       = useState(0.1);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [step, setStep]         = useState(1);
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f); setResult(null); setError(null); setStep(2);
    const r = new FileReader();
    r.onload = ev => setPreview(ev.target.result);
    r.readAsDataURL(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f || !f.type.startsWith('image/')) return;
    const synth = { target: { files: [f] } };
    handleFile(synth);
  };

  const runAttack = async () => {
    if (!file) return;
    setLoading(true); setError(null); setStep(3);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axios.post(
        `${API_URL}/attack?attack_type=${attackType}&epsilon=${epsilon}`,
        fd, { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setResult(res.data); setStep(4);
    } catch (err) {
      setError(err.response?.data?.detail || 'Backend not reachable. Make sure the server is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setFile(null); setPreview(null); setResult(null); setError(null); setStep(1); };

  const fooled = result?.adversarial?.normal_model?.fooled;

  return (
    <section id="demo">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="pill pill-rose" style={{ marginBottom: 20, display: 'inline-flex' }}>
            Interactive Demo
          </span>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 300, letterSpacing: '-0.03em', marginBottom: 14 }}>
            Live <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--rose)' }}>Attack</span> Demo
          </h2>
          <p style={{ color: 'var(--t2)', maxWidth: 460, margin: '0 auto', fontWeight: 300, fontSize: 15 }}>
            Upload any image, choose your attack, and watch the model get fooled — then see how the robust model defends.
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 40, overflowX: 'auto' }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '0 8px' }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: step >= s.n ? 'var(--sage)' : 'var(--bg3)',
                  border: `1px solid ${step >= s.n ? 'var(--sage)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 600,
                  color: step >= s.n ? '#0c0c0f' : 'var(--t3)',
                  transition: 'all 0.3s var(--ease)',
                }}>{s.n}</div>
                <span style={{ fontSize: 10, color: step >= s.n ? 'var(--sage)' : 'var(--t3)', whiteSpace: 'nowrap', transition: 'color 0.3s' }}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 40, height: 1, background: step > s.n ? 'var(--sage)' : 'var(--border)', transition: 'background 0.4s', marginBottom: 18 }}/>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'start' }}>

          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Upload zone */}
            <div className="card">
              <div style={{ fontSize: 12, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Image</div>
              <div
                onClick={() => fileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                style={{
                  border: `1.5px dashed ${preview ? 'var(--sage)' : 'var(--border)'}`,
                  borderRadius: 12, padding: 20, textAlign: 'center', cursor: 'pointer',
                  background: preview ? 'var(--sage-dim)' : 'transparent',
                  transition: 'all 0.25s',
                  minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                {preview
                  ? <img src={preview} alt="preview" style={{ maxWidth: '100%', maxHeight: 130, borderRadius: 8, display: 'block' }}/>
                  : <div>
                      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ margin: '0 auto 8px', display: 'block' }}>
                        <path d="M14 5v12M8 11l6-6 6 6M5 21h18" stroke="var(--t3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <div style={{ fontSize: 13, color: 'var(--t2)' }}>Click or drop image</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>PNG, JPG up to 5 MB</div>
                    </div>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }}/>
            </div>

            {/* Attack settings */}
            <div className="card">
              <div style={{ fontSize: 12, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Attack Type</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {['fgsm', 'pgd'].map(a => (
                  <button key={a} onClick={() => setType(a)} style={{
                    flex: 1, padding: '10px 0', borderRadius: 8,
                    border: `1px solid ${attackType === a ? 'var(--sage)' : 'var(--border)'}`,
                    background: attackType === a ? 'var(--sage-dim)' : 'transparent',
                    color: attackType === a ? 'var(--sage)' : 'var(--t2)',
                    fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}>{a.toUpperCase()}</button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 20 }}>
                {attackType === 'fgsm'
                  ? 'Single-step gradient attack — fast, effective'
                  : 'Multi-step iterative attack — stronger, slower'}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--t2)' }}>Epsilon (ε)</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 15, color: 'var(--amber)', fontWeight: 500 }}>{epsilon.toFixed(2)}</span>
                </div>
                <input type="range" min={0.01} max={0.5} step={0.01} value={epsilon} onChange={e => setEps(parseFloat(e.target.value))} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--t3)', marginTop: 6 }}>
                  <span>Subtle</span><span>Aggressive</span>
                </div>
              </div>
            </div>

            <button
              className="btn btn-sage"
              onClick={runAttack}
              disabled={!file || loading}
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 14 }}>
              {loading
                ? <>
                    <div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#0c0c0f', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
                    Attacking...
                  </>
                : <>
                    Run {attackType.toUpperCase()} Attack
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
              }
            </button>

            {result && (
              <button className="btn btn-ghost" onClick={reset} style={{ justifyContent: 'center', fontSize: 13 }}>
                Reset
              </button>
            )}

            {error && (
              <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--rose-dim)', border: '1px solid rgba(232,123,123,0.2)', fontSize: 12, color: 'var(--rose)', lineHeight: 1.6 }}>
                {error}
              </div>
            )}
          </div>

          {/* Results panel */}
          <div className="card" style={{ minHeight: 420 }}>
            {!result ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 380, color: 'var(--t3)', gap: 16 }}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect x="8" y="8" width="32" height="32" rx="8" stroke="var(--border2)" strokeWidth="1.5"/>
                  <circle cx="20" cy="20" r="4" stroke="var(--border2)" strokeWidth="1.5"/>
                  <path d="M8 30l8-8 8 8 8-8 8 8" stroke="var(--border2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 15, color: 'var(--t2)', marginBottom: 6 }}>Results appear here</div>
                  <div style={{ fontSize: 12, color: 'var(--t3)' }}>Upload an image and run an attack</div>
                </div>
              </div>
            ) : (
              <div style={{ animation: 'fadeUp 0.4s var(--ease) both' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div style={{ fontWeight: 500, fontSize: 15 }}>Attack Results</div>
                  <span className={`pill ${fooled ? 'pill-rose' : 'pill-sage'}`} style={{ fontSize: 11 }}>
                    {fooled ? 'Model fooled' : 'Attack failed'}
                  </span>
                </div>

                <div className="grid-2" style={{ marginBottom: 24 }}>
                  {/* Original */}
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Original</div>
                    <div style={{ background: 'var(--bg3)', borderRadius: 10, overflow: 'hidden', marginBottom: 12, border: '1px solid var(--border)' }}>
                      <img src={`data:image/png;base64,${result.original.image_b64}`}
                        style={{ width: '100%', display: 'block', imageRendering: 'pixelated' }} alt="original"/>
                    </div>
                    <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>Predicted as</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, color: 'var(--sage)' }}>{result.original.prediction}</div>
                      <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>{result.original.confidence}% confidence</div>
                    </div>
                  </div>

                  {/* Adversarial */}
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                      Adversarial ({attackType.toUpperCase()} ε={epsilon})
                    </div>
                    <div style={{ background: 'var(--bg3)', borderRadius: 10, overflow: 'hidden', marginBottom: 12, border: '1px solid var(--border)' }}>
                      <img src={`data:image/png;base64,${result.adversarial.image_b64}`}
                        style={{ width: '100%', display: 'block', imageRendering: 'pixelated' }} alt="adversarial"/>
                    </div>
                    <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 6 }}>Normal model</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 500, color: fooled ? 'var(--rose)' : 'var(--sage)', marginBottom: 2 }}>
                        {result.adversarial.normal_model.prediction}
                        {fooled ? ' (fooled)' : ' (correct)'}
                      </div>
                      {result.adversarial.robust_model && (
                        <>
                          <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }}/>
                          <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>Robust model</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 500,
                            color: result.adversarial.robust_model.fooled ? 'var(--amber)' : 'var(--sage)' }}>
                            {result.adversarial.robust_model.prediction}
                            {result.adversarial.robust_model.fooled ? ' (fooled)' : ' (defended)'}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div style={{
                  padding: '14px 18px', borderRadius: 10,
                  background: fooled ? 'var(--rose-dim)' : 'var(--sage-dim)',
                  border: `1px solid ${fooled ? 'rgba(232,123,123,0.2)' : 'rgba(126,184,164,0.2)'}`,
                  fontSize: 13, color: fooled ? 'var(--rose)' : 'var(--sage)',
                  lineHeight: 1.6,
                }}>
                  {fooled
                    ? `Attack succeeded. The model changed its prediction from "${result.original.prediction}" to "${result.adversarial.normal_model.prediction}" despite a visually identical image.`
                    : 'The normal model was not fooled by this attack. Try increasing epsilon or switching to PGD.'}
                </div>
              </div>
            )}
          </div>
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @media (max-width: 720px) {
            #demo .container > div:last-child { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </section>
  );
}