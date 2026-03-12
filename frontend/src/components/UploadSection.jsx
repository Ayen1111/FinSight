import { useState, useRef } from 'react';
import { Upload, Sparkles } from 'lucide-react';
import { uploadFile, loadSampleData } from '../api';

export default function UploadSection({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loadingType, setLoadingType] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.csv') && !ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
      setError('Please upload a CSV or XLSX file');
      return;
    }

    setLoading(true);
    setLoadingType('upload');
    setError(null);

    try {
      const res = await uploadFile(file);
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleSampleData = async () => {
    setLoading(true);
    setLoadingType('sample');
    setError(null);

    try {
      const res = await loadSampleData();
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load sample data.');
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div className="relative min-h-[calc(100vh-73px)] flex flex-col justify-center" style={{ padding: '32px 0 48px' }}>
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/8 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/8 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 w-full space-y-8" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>

        {/* ── HERO SECTION ── */}
        <div className="text-center space-y-4 fade-in">
          <h2 className="text-5xl font-extrabold gradient-text leading-tight" style={{ textAlign: 'center', width: '100%' }}>
            Understand Your Money
          </h2>
          <p className="text-lg text-[var(--color-text-muted)]" style={{ textAlign: 'center', width: '100%' }}>
            Upload your transactions and let AI reveal hidden patterns, anomalies, and savings opportunities.
          </p>

          {/* Feature Pills */}
          <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
            {[
              'ML Clustering',
              'Anomaly Detection',
              'Forecasting',
              'Smart Advice',
            ].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-[var(--color-text-muted)]"
              >
                <span className="text-purple-400">✦</span>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* ── UPLOAD OPTIONS — Side by Side ── */}
        <div className="upload-options-grid fade-in" style={{ animationDelay: '150ms' }}>

          {/* LEFT — CSV Upload */}
          <div
            className={`group relative rounded-2xl transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-8 ${
              dragOver ? 'scale-[1.02]' : 'hover:scale-[1.01]'
            } ${loading && loadingType === 'upload' ? 'pointer-events-none opacity-70' : ''}`}
            style={{
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(59, 130, 246, 0.10))',
              border: '1px solid rgba(139, 92, 246, 0.55)',
              boxShadow: '0 0 30px rgba(139, 92, 246, 0.25), inset 0 0 20px rgba(139, 92, 246, 0.05)',
              borderRadius: '16px',
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !loading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />

            {loading && loadingType === 'upload' ? (
              <div className="flex flex-col items-center gap-3">
                <div className="spinner" />
                <p className="text-sm text-[var(--color-text-muted)]">Analyzing transactions...</p>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-7 h-7 text-purple-400 pulse-soft" />
                </div>
                <p className="text-base font-semibold text-white mb-1">
                  Drop your CSV or XLSX file here
                </p>
                <p className="text-sm text-[var(--color-text-dim)]">
                  or click to browse • Supports .csv, .xlsx
                </p>
              </>
            )}
          </div>

          {/* CENTER — Divider */}
          <div className="upload-divider-v">
            <div className="divider-line" />
            <span className="text-xs text-[var(--color-text-dim)] py-3 px-1 font-medium tracking-wider uppercase">or</span>
            <div className="divider-line" />
          </div>
          {/* Mobile divider */}
          <div className="upload-divider-h">
            <div className="flex-1 h-px bg-[var(--color-border)]" />
            <span className="text-xs text-[var(--color-text-dim)] font-medium tracking-wider uppercase">or</span>
            <div className="flex-1 h-px bg-[var(--color-border)]" />
          </div>

          {/* RIGHT — Sample Data */}
          <button
            onClick={handleSampleData}
            disabled={loading}
            className={`group relative rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-8 text-center border border-transparent disabled:opacity-60 disabled:cursor-not-allowed ${
              loading && loadingType === 'sample'
                ? 'pointer-events-none'
                : 'hover:scale-[1.01]'
            }`}
            style={{
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(59, 130, 246, 0.15))',
            }}
          >
            {/* Glow ring on hover */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                boxShadow: 'inset 0 0 40px rgba(124, 58, 237, 0.15), 0 0 50px rgba(124, 58, 237, 0.08)',
              }}
            />
            {/* Subtle border */}
            <div className="absolute inset-0 rounded-2xl border border-purple-500/20 group-hover:border-purple-400/40 transition-colors duration-300" />

            {loading && loadingType === 'sample' ? (
              <div className="relative flex flex-col items-center gap-3">
                <div className="spinner" />
                <p className="text-sm text-[var(--color-text-muted)]">
                  Running ML models & generating insights...
                </p>
              </div>
            ) : (
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/25 to-blue-500/25 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="w-7 h-7 text-purple-300" />
                </div>
                <p className="text-lg font-bold text-white mb-1">
                  Try with Sample Data
                </p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  1,500 real transactions • 5 years of data • Works instantly
                </p>
              </div>
            )}
          </button>
        </div>

        {/* Error Toast */}
        {error && (
          <div className="max-w-lg mx-auto p-3 rounded-xl bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 text-[var(--color-danger-light)] text-sm text-center fade-in">
            {error}
          </div>
        )}

        {/* ── FEATURE CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 fade-in" style={{ animationDelay: '300ms' }}>
          {[
            {
              icon: '🧠',
              title: 'ML-Powered Insights',
              desc: 'Uncover hidden patterns in your financial behavior',
            },
            {
              icon: '📊',
              title: 'Interactive Charts',
              desc: 'Drill down from yearly to weekly in one click',
            },
            {
              icon: '💡',
              title: 'Smart Advice',
              desc: 'Personalized tips based on your actual spending data',
            },
          ].map((card, i) => (
            <div
              key={i}
              className="glass-card p-5 flex flex-col items-center text-center group hover:border-purple-500/30 transition-all"
            >
              <span className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">{card.icon}</span>
              <h4 className="font-semibold text-sm text-white mb-1">{card.title}</h4>
              <p className="text-xs text-[var(--color-text-dim)] leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
