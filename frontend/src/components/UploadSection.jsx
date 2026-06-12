import { useState, useRef, useEffect } from 'react';
import {
  Upload, Sparkles, Brain, Lightbulb, Shield, TrendingUp,
  ArrowRight, Zap, Eye, Target, AlertTriangle, PiggyBank,
  BarChart3, LineChart, Lock, Activity
} from 'lucide-react';
import { uploadFile, loadSampleData } from '../api';

/* ═══════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════ */

function useScrollReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function CountUp({ end, suffix = '', prefix = '', duration = 1600 }) {
  const [val, setVal] = useState(0);
  const [go, setGo] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && !go) setGo(true); },
      { threshold: 0.5 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [go]);
  useEffect(() => {
    if (!go) return;
    let t0 = null;
    const step = (ts) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * end));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [go, end, duration]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

/* ── Subtle particles (12, slow drift) ── */
function Particles() {
  const pts = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 2.2 + 0.8,
    dur: Math.random() * 28 + 20,
    delay: Math.random() * 18,
    op: Math.random() * 0.25 + 0.05,
    color: ['#6366f1', '#3b82f6', '#8b5cf6'][i % 3],
  }));
  return (
    <>
      {pts.map(p => (
        <div key={p.id} className="fs-particle" style={{
          left: p.left, bottom: -4,
          width: p.size, height: p.size,
          background: p.color,
          boxShadow: `0 0 ${p.size * 5}px ${p.color}`,
          animationDuration: `${p.dur}s`,
          animationDelay: `${p.delay}s`,
          opacity: p.op,
        }} />
      ))}
    </>
  );
}


/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */

export default function UploadSection({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loadingType, setLoadingType] = useState(null);
  const [uploadHover, setUploadHover] = useState(false);
  const [sampleHover, setSampleHover] = useState(false);
  const fileInputRef = useRef(null);

  const [statsRef, statsVis] = useScrollReveal(0.25);
  const [dashRef, dashVis] = useScrollReveal(0.1);
  const [ctaRef, ctaVis] = useScrollReveal(0.1);
  const [featRef, featVis] = useScrollReveal(0.1);

  /* ── File handlers ── */
  const handleFile = async (file) => {
    if (!file) return;
    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) { setError('Please upload a CSV or XLSX file'); return; }
    setLoading(true); setLoadingType('upload'); setError(null);
    try { const r = await uploadFile(file); onSuccess(r.data); }
    catch (e) { setError(e.response?.data?.error || 'Upload failed.'); }
    finally { setLoading(false); setLoadingType(null); }
  };

  const handleSample = async () => {
    setLoading(true); setLoadingType('sample'); setError(null);
    try { const r = await loadSampleData(); onSuccess(r.data); }
    catch (e) { setError(e.response?.data?.error || 'Failed to load sample data.'); }
    finally { setLoading(false); setLoadingType(null); }
  };

  /* ── Feature cards (benefit-focused) ── */
  const features = [
    { icon: Eye, title: 'Detect Hidden Spending Patterns', desc: 'AI clustering reveals how your money moves each month — no manual tagging needed.', color: '#a78bfa', bg: 'rgba(139,92,246,0.08)' },
    { icon: AlertTriangle, title: 'Identify Unusual Transactions', desc: 'Isolation Forest flags anomalies that deviate from your normal financial behavior.', color: '#f87171', bg: 'rgba(239,68,68,0.08)' },
    { icon: LineChart, title: 'Forecast Future Expenses', desc: 'Regression models predict next month\'s spending so you can plan ahead with confidence.', color: '#34d399', bg: 'rgba(16,185,129,0.08)' },
    { icon: PiggyBank, title: 'Discover Savings Opportunities', desc: 'Actionable AI advice pinpoints exactly where you can cut costs and grow your savings.', color: '#fbbf24', bg: 'rgba(245,158,11,0.08)' },
  ];

  /* ── Trust metrics ── */
  const stats = [
    { end: 50000, suffix: '+', label: 'Transactions Analyzed', icon: BarChart3 },
    { end: 97, suffix: '%', label: 'Detection Accuracy', icon: Target },
    { end: 1200, suffix: '+', label: 'Savings Opportunities', icon: PiggyBank },
    { end: 8, suffix: '', label: 'AI Models Running', icon: Brain },
  ];

  /* ── Entrance helper ── */
  const ent = (delay) => ({
    opacity: 0,
    transform: 'translateY(22px) scale(0.98)',
    animation: `fsEntrance 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms forwards`,
  });

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: '#060b18' }}>

      {/* ── Background layers ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: `
          radial-gradient(ellipse 55% 45% at 8% 0%,  rgba(99,102,241,0.09), transparent 55%),
          radial-gradient(ellipse 50% 40% at 92% 2%, rgba(139,92,246,0.07), transparent 50%),
          radial-gradient(ellipse 65% 45% at 50% 95%, rgba(59,130,246,0.04), transparent 55%),
          linear-gradient(175deg, #060b18 0%, #0b1330 48%, #060b18 100%)
        `,
      }} />
      <div className="fs-grid" />
      <div className="fs-aurora" style={{ width: 520, height: 360, top: '-6%', left: '-8%', background: 'rgba(99,102,241,0.07)' }} />
      <div className="fs-aurora" style={{ width: 400, height: 280, bottom: '2%', right: '-5%', background: 'rgba(139,92,246,0.05)', animationDelay: '5s' }} />
      <Particles />

      {/* ── Content ── */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: 1100, margin: '0 auto', padding: '0 28px' }}>


        {/* ═══ SECTION 1 — HERO ═══ */}
        <section style={{ paddingTop: 72, paddingBottom: 20, textAlign: 'center' }}>

          {/* AI Badge */}
          <div style={ent(0)}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '6px 16px', borderRadius: 9999,
              fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.04em',
              color: '#c4b5fd',
              border: '1px solid rgba(139,92,246,0.25)',
              background: 'rgba(139,92,246,0.06)',
              animation: 'fsBadgePulse 3s ease-in-out infinite',
            }}>
              <Zap size={12} /> AI-Powered Financial Intelligence
            </span>
          </div>

          {/* Logo */}
          <div style={{ ...ent(80), marginTop: 20, marginBottom: 6 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
                fontSize: '1.1rem',
              }}>💰</div>
              <span style={{
                fontSize: '1.55rem', fontWeight: 700, letterSpacing: '0.06em',
                color: '#e2e8f0',
              }}>FinSight</span>
            </div>
          </div>

          {/* Main Headline — word-by-word fade */}
          <h1 style={{
            ...ent(200),
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            fontWeight: 800, lineHeight: 1.15,
            color: '#f1f5f9', letterSpacing: '-0.025em',
            marginTop: 28, marginBottom: 0,
            animationName: 'none', /* override; we animate individual words */
            opacity: 1, transform: 'none',
          }}>
            {'Your Spending Has a Story.'.split(' ').map((w, i, a) => (
              <span key={i} style={{
                display: 'inline-block', opacity: 0, transform: 'translateY(18px)',
                animation: `fsWordUp 0.65s cubic-bezier(0.16,1,0.3,1) ${280 + i * 100}ms forwards`,
              }}>{w}{i < a.length - 1 ? '\u00A0' : ''}</span>
            ))}
            <br />
            {'AI Reads It for You.'.split(' ').map((w, i, a) => (
              <span key={`b${i}`} style={{
                display: 'inline-block', opacity: 0, transform: 'translateY(18px)',
                animation: `fsWordUp 0.65s cubic-bezier(0.16,1,0.3,1) ${780 + i * 100}ms forwards`,
                background: i >= 2 ? 'linear-gradient(90deg, #60a5fa, #a78bfa)' : 'none',
                WebkitBackgroundClip: i >= 2 ? 'text' : 'unset',
                WebkitTextFillColor: i >= 2 ? 'transparent' : 'unset',
                backgroundClip: i >= 2 ? 'text' : 'unset',
              }}>{w}{i < a.length - 1 ? '\u00A0' : ''}</span>
            ))}
          </h1>

          {/* Subheading */}
          <p style={{
            ...ent(600),
            fontSize: '1rem', color: '#94a3b8',
            maxWidth: 520, margin: '18px auto 0',
            lineHeight: 1.72,
          }}>
            Upload your transactions and let machine learning uncover hidden patterns,
            flag anomalies, and surface real savings opportunities — instantly.
          </p>
        </section>


        {/* ═══ SECTION 2 — TRUST METRICS ═══ */}
        <section ref={statsRef} style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0,
          margin: '32px 0 0',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 16,
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          overflow: 'hidden',
          opacity: statsVis ? 1 : 0,
          transform: statsVis ? 'translateY(0)' : 'translateY(22px)',
          transition: 'all 0.65s 0.1s cubic-bezier(0.16,1,0.3,1)',
        }}>
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '22px 12px', gap: 5,
                borderRight: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <Icon size={16} style={{ color: '#475569', marginBottom: 2 }} />
                <span style={{
                  fontSize: '1.5rem', fontWeight: 700,
                  letterSpacing: '-0.02em', color: '#e2e8f0',
                  lineHeight: 1,
                  background: 'linear-gradient(90deg, #e2e8f0 40%, #94a3b8 50%, #e2e8f0 60%)',
                  backgroundSize: '300% 100%',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: statsVis ? `fsNumberShine 2.5s ${0.3 + i * 0.2}s ease forwards` : 'none',
                }}>
                  {statsVis ? <CountUp end={s.end} suffix={s.suffix} duration={1400 + i * 200} /> : `0${s.suffix}`}
                </span>
                <span style={{
                  fontSize: '0.63rem', fontWeight: 500,
                  color: '#3b4d65', letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>{s.label}</span>
              </div>
            );
          })}
        </section>


        {/* ═══ SECTION 3 — DASHBOARD PREVIEW ═══ */}
        <section ref={dashRef} style={{
          margin: '56px 0 0', position: 'relative',
          opacity: dashVis ? 1 : 0,
          transform: dashVis ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s 0.15s cubic-bezier(0.16,1,0.3,1)',
        }}>
          {/* Ambient glow behind */}
          <div style={{
            position: 'absolute', top: '20%', left: '10%', right: '10%', bottom: 0,
            background: 'radial-gradient(ellipse at 50% 60%, rgba(99,102,241,0.1), transparent 65%)',
            filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0,
          }} />

          <div style={{
            position: 'relative', zIndex: 1,
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.02)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.35), 0 0 1px rgba(255,255,255,0.05)',
            animation: dashVis ? 'fsDashFloat 6s ease-in-out infinite' : 'none',
            animationDelay: '1s',
          }}>
            {/* Gradient shimmer line at top */}
            <div style={{
              height: 2,
              background: 'linear-gradient(90deg, transparent, #6366f1, #8b5cf6, #3b82f6, transparent)',
              backgroundSize: '200% 100%',
              animation: 'fsLineShimmer 3s linear infinite',
            }} />

            <img
              src="/dashboard-preview.png"
              alt="FinSight AI Dashboard — spending trends, anomaly detection, and AI insights"
              style={{
                width: '100%', display: 'block',
                maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
              }}
            />

            {/* Overlay label */}
            <div style={{
              position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 9999,
              background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500,
              letterSpacing: '0.02em',
            }}>
              <Sparkles size={12} color="#a78bfa" />
              Live dashboard preview — try it now
            </div>
          </div>
        </section>


        {/* ═══ SECTION 4 — CTAs ═══ */}
        <section ref={ctaRef} style={{
          margin: '64px 0 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 18,
          opacity: ctaVis ? 1 : 0,
          transform: ctaVis ? 'translateY(0)' : 'translateY(26px)',
          transition: 'all 0.65s 0.1s cubic-bezier(0.16,1,0.3,1)',
        }}>

          {/* ── PRIMARY CTA: Try Sample Data ── */}
          <div
            onClick={() => !loading && handleSample()}
            onMouseEnter={() => setSampleHover(true)}
            onMouseLeave={() => setSampleHover(false)}
            style={{
              position: 'relative', cursor: loading && loadingType === 'sample' ? 'not-allowed' : 'pointer',
              borderRadius: 20, padding: '44px 32px',
              background: sampleHover
                ? 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))'
                : 'linear-gradient(135deg, rgba(99,102,241,0.07), rgba(139,92,246,0.04))',
              border: `1px solid ${sampleHover ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.07)'}`,
              boxShadow: sampleHover
                ? '0 24px 60px rgba(99,102,241,0.12), 0 0 40px rgba(139,92,246,0.06)'
                : '0 4px 24px rgba(0,0,0,0.1)',
              transform: sampleHover ? 'translateY(-4px)' : 'translateY(0)',
              transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
              overflow: 'hidden',
              opacity: loading && loadingType === 'sample' ? 0.6 : 1,
              order: 1, /* Show first on mobile via visual order */
            }}
          >
            {/* Shimmer accent */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: 'linear-gradient(90deg, transparent, #8b5cf6, #6366f1, transparent)',
              backgroundSize: '200% 100%',
              animation: 'fsLineShimmer 3s linear infinite',
              opacity: sampleHover ? 1 : 0.4,
              transition: 'opacity 0.3s',
            }} />

            {loading && loadingType === 'sample' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, minHeight: 160, justifyContent: 'center' }}>
                <div style={{ width: 36, height: 36, border: '2.5px solid rgba(139,92,246,0.15)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'fsSpin 0.75s linear infinite' }} />
                <p style={{ fontSize: '0.84rem', color: '#64748b' }}>Running ML models & generating insights...</p>
              </div>
            ) : (
              <>
                {/* "Recommended" pill */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 12px', borderRadius: 9999, marginBottom: 18,
                  fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em',
                  color: '#a78bfa', textTransform: 'uppercase',
                  background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)',
                }}>
                  <Sparkles size={10} /> Recommended
                </span>

                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.1))',
                  border: '1px solid rgba(139,92,246,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 18,
                  transform: sampleHover ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 0.3s',
                }}>
                  <Sparkles size={24} color="#a78bfa" />
                </div>

                <p style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 6, letterSpacing: '-0.01em' }}>
                  Try with Sample Data
                </p>
                <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: 16, lineHeight: 1.5 }}>
                  1,500 real transactions · 5 years · Instant insights
                </p>

                {/* CTA Button */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 24px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                  color: 'white', fontSize: '0.84rem', fontWeight: 600,
                  boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                  transform: sampleHover ? 'scale(1.03)' : 'scale(1)',
                  transition: 'transform 0.25s',
                }}>
                  Explore Now <ArrowRight size={14} />
                </div>
              </>
            )}
          </div>

          {/* ── SECONDARY CTA: Upload ── */}
          <div
            onClick={() => !loading && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onMouseEnter={() => setUploadHover(true)}
            onMouseLeave={() => setUploadHover(false)}
            style={{
              position: 'relative',
              cursor: loading && loadingType === 'upload' ? 'not-allowed' : 'pointer',
              borderRadius: 20, padding: '44px 32px',
              background: dragOver
                ? 'rgba(139,92,246,0.06)'
                : 'rgba(255,255,255,0.02)',
              border: `1px solid ${dragOver ? 'rgba(139,92,246,0.35)' : uploadHover ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
              boxShadow: uploadHover
                ? '0 20px 50px rgba(0,0,0,0.2), 0 0 30px rgba(139,92,246,0.05)'
                : '0 2px 16px rgba(0,0,0,0.08)',
              transform: uploadHover ? 'translateY(-3px)' : 'translateY(0)',
              transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
              overflow: 'hidden',
              opacity: loading && loadingType === 'upload' ? 0.6 : 1,
              order: 2,
            }}
          >
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files[0])} />

            {/* Animated dashed border */}
            <svg style={{ position: 'absolute', inset: 6, pointerEvents: 'none', zIndex: 0 }}
              width="100%" height="100%">
              <rect x="0" y="0" width="100%" height="100%"
                rx="14" ry="14" fill="none"
                stroke={dragOver ? 'rgba(139,92,246,0.5)' : 'rgba(139,92,246,0.12)'}
                strokeWidth="1.5" strokeDasharray="8 6"
                style={{ animation: 'fsDashRotate 2s linear infinite' }}
              />
            </svg>

            {loading && loadingType === 'upload' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, minHeight: 160, justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{ width: 36, height: 36, border: '2.5px solid rgba(139,92,246,0.15)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'fsSpin 0.75s linear infinite' }} />
                <p style={{ fontSize: '0.84rem', color: '#64748b' }}>Analyzing transactions...</p>
              </div>
            ) : (
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: 'rgba(139,92,246,0.08)',
                  border: '1px solid rgba(139,92,246,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 18px',
                  transform: uploadHover || dragOver ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.3s',
                }}>
                  <Upload size={22} color="#a78bfa" />
                </div>

                <p style={{ fontSize: '1.05rem', fontWeight: 600, color: '#e2e8f0', marginBottom: 6, letterSpacing: '-0.01em' }}>
                  Drop your CSV or XLSX file
                </p>
                <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: 16 }}>
                  or click to browse
                </p>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {[
                    { I: Lock, t: 'No account needed' },
                    { I: Activity, t: 'Processed locally' },
                  ].map(({ I, t }) => (
                    <span key={t} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', borderRadius: 9999,
                      fontSize: '0.66rem', color: '#475569',
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <I size={10} />{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Error */}
        {error && (
          <div style={{
            maxWidth: 440, margin: '16px auto 0', padding: '10px 18px',
            borderRadius: 12, background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171', fontSize: '0.82rem', textAlign: 'center',
          }}>{error}</div>
        )}


        {/* ═══ SECTION 5 — FEATURE CARDS (2×2 benefit-focused) ═══ */}
        <section ref={featRef} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 14, marginTop: 72, marginBottom: 80,
        }}>
          {features.map((f, i) => (
            <FeatureCard key={i} f={f} i={i} visible={featVis} />
          ))}
        </section>


      </div>
    </div>
  );
}

/* ── Extracted Feature Card component ── */
function FeatureCard({ f, i, visible }) {
  const [hov, setHov] = useState(false);
  const Icon = f.icon;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.018)',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        border: `1px solid ${hov ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: 16, padding: '28px 24px',
        transform: hov ? 'translateY(-4px)' : (visible ? 'translateY(0)' : 'translateY(26px)'),
        opacity: visible ? 1 : 0,
        boxShadow: hov ? '0 20px 50px rgba(0,0,0,0.22)' : 'none',
        transition: `opacity 0.6s ${i * 100}ms cubic-bezier(0.16,1,0.3,1),
                     transform 0.6s ${i * 100}ms cubic-bezier(0.16,1,0.3,1),
                     background 0.3s, border-color 0.3s, box-shadow 0.3s`,
      }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
        transform: hov ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.3s',
      }}>
        <Icon size={20} color={f.color} />
      </div>
      <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e2e8f0', marginBottom: 8, letterSpacing: '-0.01em' }}>{f.title}</p>
      <p style={{ fontSize: '0.78rem', color: '#4a5e78', lineHeight: 1.65, marginBottom: 14 }}>{f.desc}</p>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: '0.72rem', fontWeight: 500,
        color: f.color, opacity: hov ? 0.9 : 0.45,
        transition: 'opacity 0.3s',
      }}>
        Learn more <ArrowRight size={11} />
      </span>
    </div>
  );
}