import { useState, useEffect } from 'react';
import { 
  getAnomalies, getForecast, getAdvice, 
  getSubscriptions, getSavingsGoal, getPersonality, askCoach,
  createGoal, getGoals, getGoalAnalysis
} from '../api';
import { formatCurrency, formatPercent } from '../utils/formatters';
import {
  AlertTriangle, Lightbulb, TrendingUp, CreditCard,
  Target, ChevronDown, ChevronUp, Zap, Ghost,
  ArrowRight, Sparkles, CheckCircle2, XCircle, AlertCircle,
  Bot, Send, User, Loader2
} from 'lucide-react';

import WhatIfSimulator from './WhatIfSimulator';

export default function InsightsTab() {
  const [section, setSection] = useState('anomalies');

  return (
    <div className="space-y-6">
      {/* Section Nav */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'coach', label: 'AI Financial Coach', icon: Bot },
          { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
          { id: 'advice', label: 'AI Advice', icon: Lightbulb },
          { id: 'forecast', label: 'Forecast', icon: TrendingUp },
          { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
          { id: 'savings', label: 'Savings Goal', icon: Target },
          { id: 'simulator', label: 'What-If Simulator', icon: Sparkles },
          { id: 'personality', label: 'Financial Personality', icon: Sparkles },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`tab-button flex items-center gap-2 text-sm ${section === s.id ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4" />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Section Content */}
      <div className="slide-up" key={section}>
        {section === 'coach' && <CoachSection />}
        {section === 'anomalies' && <AnomaliesSection />}
        {section === 'advice' && <AdviceSection />}
        {section === 'forecast' && <ForecastSection />}
        {section === 'subscriptions' && <SubscriptionsSection />}
        {section === 'savings' && <SavingsSection />}
        {section === 'simulator' && <WhatIfSimulator />}
        {section === 'personality' && <PersonalitySection />}
      </div>
    </div>
  );
}

/* ── ANOMALIES ── */
function AnomaliesSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    getAnomalies()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data || data.anomalies.length === 0) {
    return <EmptyState icon={AlertTriangle} message="No anomalies detected — your spending looks consistent!" />;
  }

  // Extract unique years and months from anomaly dates
  const years = [...new Set(data.anomalies.map((a) => a.date.slice(0, 4)))].sort();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Filter anomalies
  const filtered = data.anomalies.filter((a) => {
    const yearMatch = selectedYear === 'all' || a.date.startsWith(selectedYear);
    const monthMatch = selectedMonth === 'all' || a.date.slice(5, 7) === selectedMonth;
    return yearMatch && monthMatch;
  });

  const shown = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  const severityClass = { high: 'badge-critical', medium: 'badge-high', low: 'badge-low' };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="glass-card p-4 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-[var(--color-warning)]" />
        <span className="text-sm">
          <strong>{data.total_flagged}</strong> total anomalies detected by Isolation Forest ML model
          {filtered.length !== data.total_flagged && (
            <span className="text-[var(--color-primary-light)]"> — showing <strong>{filtered.length}</strong> for selected period</span>
          )}
        </span>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 space-y-3">
        {/* Year filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[var(--color-text-dim)] font-semibold uppercase tracking-wider w-12">Year</span>
          <button
            onClick={() => { setSelectedYear('all'); setVisibleCount(15); }}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              selectedYear === 'all'
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-text-muted)] hover:bg-white/5'
            }`}
          >
            All
          </button>
          {years.map((y) => (
            <button
              key={y}
              onClick={() => { setSelectedYear(y); setVisibleCount(15); }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedYear === y
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-text-muted)] hover:bg-white/5'
              }`}
            >
              {y}
            </button>
          ))}
        </div>

        {/* Month filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[var(--color-text-dim)] font-semibold uppercase tracking-wider w-12">Month</span>
          <button
            onClick={() => { setSelectedMonth('all'); setVisibleCount(15); }}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              selectedMonth === 'all'
                ? 'bg-[var(--color-accent)] text-white'
                : 'text-[var(--color-text-muted)] hover:bg-white/5'
            }`}
          >
            All
          </button>
          {monthNames.map((m, i) => {
            const val = String(i + 1).padStart(2, '0');
            return (
              <button
                key={val}
                onClick={() => { setSelectedMonth(val); setVisibleCount(15); }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedMonth === val
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'text-[var(--color-text-muted)] hover:bg-white/5'
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* Anomaly List */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-[var(--color-text-muted)]">
          No anomalies found for the selected period.
        </div>
      ) : (
        <>
          {shown.map((a, i) => (
            <div key={i} className="glass-card p-4 slide-up" style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge ${severityClass[a.severity]}`}>
                      {a.severity.toUpperCase()}
                    </span>
                    <span className="text-xs text-[var(--color-text-dim)]">{a.date}</span>
                  </div>
                  <p className="font-medium mb-1">{a.description || a.category}</p>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Category: {a.category} • Expected: {a.expected_range}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-[var(--color-danger)]">
                    {formatCurrency(a.amount)}
                  </p>
                  <p className="text-xs text-[var(--color-text-dim)]">
                    {a.deviation}x deviation
                  </p>
                </div>
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="text-center pt-2">
              <button
                onClick={() => setVisibleCount((prev) => prev + 15)}
                className="px-6 py-2 rounded-xl text-sm font-medium text-[var(--color-primary-light)] border border-[var(--color-border)] hover:bg-white/5 transition-all"
              >
                Show More ({filtered.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── AI ADVICE ── */
function AdviceSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = () => {
    setLoading(true);
    getAdvice()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { generate(); }, []);

  if (loading) return <Spinner />;

  if (!data) {
    return (
      <div className="text-center py-12">
        <Lightbulb className="w-12 h-12 text-[var(--color-accent)] mx-auto mb-4" />
        <p className="text-[var(--color-text-muted)] mb-4">Get personalized financial advice based on your spending patterns</p>
        <button onClick={generate} className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white font-semibold hover:shadow-lg hover:shadow-[var(--color-primary)]/20 transition-all">
          Generate Advice
        </button>
      </div>
    );
  }

  const priorityClass = {
    critical: 'badge-critical',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
    info: 'badge-info',
  };

  return (
    <div className="space-y-4">
      {data.total_potential_savings > 0 && (
        <div className="glass-card p-4 flex items-center gap-3 border-[var(--color-success)]/30">
          <Zap className="w-5 h-5 text-[var(--color-success)]" />
          <span className="text-sm">
            Total potential savings: <strong className="text-[var(--color-success)]">{formatCurrency(data.total_potential_savings)}/month</strong>
          </span>
        </div>
      )}

      {data.tips.map((tip, i) => (
        <div key={i} className="glass-card p-5 slide-up" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{tip.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{tip.title.replace(/^[^\w]*/, '')}</h4>
                <span className={`badge ${priorityClass[tip.priority]} text-xs`}>
                  {tip.priority}
                </span>
              </div>
              <p className="text-sm text-[var(--color-text-muted)] mb-2">{tip.description}</p>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--color-surface-alt)]">
                <ArrowRight className="w-4 h-4 text-[var(--color-primary-light)] mt-0.5 shrink-0" />
                <p className="text-sm text-[var(--color-primary-light)]">{tip.action}</p>
              </div>
              {tip.potential_savings > 0 && (
                <p className="text-xs text-[var(--color-success)] mt-2 font-medium">
                  💰 Potential savings: {formatCurrency(tip.potential_savings)}/month
                </p>
              )}
            </div>
          </div>
        </div>
      ))}

      <div className="text-center">
        <button onClick={generate} className="text-sm text-[var(--color-primary-light)] hover:text-white transition-colors">
          ↻ Regenerate Advice
        </button>
      </div>
    </div>
  );
}

/* ── FORECAST ── */
function ForecastSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getForecast()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data) return <EmptyState icon={TrendingUp} message="Forecast not available" />;

  return (
    <div className="space-y-4">
      {/* Main Prediction Card */}
      <div className="glass-card p-6 glow-border">
        <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
          Next Month Spending Forecast
        </h3>
        <div className="text-center py-4">
          <p className="text-5xl font-extrabold gradient-text mb-2">
            {formatCurrency(data.predicted)}
          </p>
          <p className="text-[var(--color-text-muted)]">{data.message}</p>
        </div>

        {data.alert && (
          <div className="mt-4 p-3 rounded-xl bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 text-[var(--color-warning-light)] text-sm text-center">
            {data.alert}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-[var(--color-text-dim)] mb-1">Average Spending</p>
          <p className="text-xl font-bold">{formatCurrency(data.average)}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-[var(--color-text-dim)] mb-1">Confidence</p>
          <div className="flex items-center justify-center gap-2">
            <p className={`text-xl font-bold ${
              data.confidence === 'high' ? 'text-[var(--color-success)]' :
              data.confidence === 'medium' ? 'text-[var(--color-warning)]' :
              'text-[var(--color-danger)]'
            }`}>
              {data.confidence_pct}%
            </p>
            <span className={`badge ${
              data.confidence === 'high' ? 'badge-low' :
              data.confidence === 'medium' ? 'badge-high' :
              'badge-critical'
            } text-xs`}>
              {data.confidence}
            </span>
          </div>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-[var(--color-text-dim)] mb-1">Trend</p>
          <p className="text-sm font-medium text-[var(--color-text-muted)]">{data.trend_message}</p>
        </div>
      </div>
    </div>
  );
}

/* ── SUBSCRIPTIONS ── */
function SubscriptionsSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSubscriptions()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data || data.subscriptions.length === 0) {
    return <EmptyState icon={CreditCard} message="No recurring subscriptions detected" />;
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-[var(--color-text-dim)] mb-1">Subscriptions Found</p>
          <p className="text-2xl font-bold">{data.total_found}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-[var(--color-text-dim)] mb-1">Total Monthly Cost</p>
          <p className="text-2xl font-bold text-[var(--color-primary-light)]">{formatCurrency(data.total_monthly_cost)}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-[var(--color-text-dim)] mb-1">Potential Savings</p>
          <p className="text-2xl font-bold text-[var(--color-success)]">{formatCurrency(data.potential_savings)}</p>
        </div>
      </div>

      {/* Subscription List */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Ghost className="w-5 h-5 text-[var(--color-accent)]" />
          <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Subscription Graveyard
          </h3>
        </div>
        <div className="space-y-3">
          {data.subscriptions.map((sub, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-alt)] slide-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{sub.status_icon}</span>
                <div>
                  <p className="font-medium text-sm">{sub.name}</p>
                  <p className="text-xs text-[var(--color-text-dim)]">
                    {sub.category} • {sub.months_active} months active • Last: {sub.last_seen}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(sub.amount)}/mo</p>
                <span className={`badge text-xs ${
                  sub.status === 'active' ? 'badge-low' :
                  sub.status === 'possibly_unused' ? 'badge-high' :
                  'badge-critical'
                }`}>
                  {sub.status === 'possibly_unused' ? 'Possibly Unused' :
                   sub.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── SAVINGS GOALS PLANNER ── */
function SavingsSection() {
  const [goals, setGoals] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '', target_amount: '', timeline_months: '', priority: 'Medium', current_savings: ''
  });

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await getGoals();
      setGoals(res.data.goals || []);
      
      if (res.data.goals && res.data.goals.length > 0) {
        // Load analysis for the first goal by default
        const analysisRes = await getGoalAnalysis(res.data.goals[0].id);
        setAnalysis(analysisRes.data);
      } else {
        setAnalysis(null);
      }
    } catch (err) {
      setError("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createGoal({
        ...newGoal,
        target_amount: parseFloat(newGoal.target_amount),
        timeline_months: parseInt(newGoal.timeline_months),
        current_savings: parseFloat(newGoal.current_savings || 0)
      });
      setShowForm(false);
      setNewGoal({ name: '', target_amount: '', timeline_months: '', priority: 'Medium', current_savings: '' });
      await fetchGoals();
    } catch (err) {
      setError("Failed to create goal");
      setLoading(false);
    }
  };

  if (loading && goals.length === 0) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Goal-Based Savings Planner</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm hover:opacity-90"
        >
          {showForm ? 'Cancel' : '+ New Goal'}
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6 slide-up">
          <h3 className="text-lg font-semibold text-white mb-4">Create a Savings Goal</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[var(--color-text-dim)] block mb-1">Goal Name</label>
              <input required value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} placeholder="e.g. MacBook Pro" className="w-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-white" />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-dim)] block mb-1">Target Amount (₹)</label>
              <input required type="number" value={newGoal.target_amount} onChange={e => setNewGoal({...newGoal, target_amount: e.target.value})} placeholder="e.g. 120000" className="w-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-white" />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-dim)] block mb-1">Timeline (Months)</label>
              <input required type="number" value={newGoal.timeline_months} onChange={e => setNewGoal({...newGoal, timeline_months: e.target.value})} placeholder="e.g. 12" className="w-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-white" />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-dim)] block mb-1">Current Savings Already Available (₹)</label>
              <input type="number" value={newGoal.current_savings} onChange={e => setNewGoal({...newGoal, current_savings: e.target.value})} placeholder="e.g. 20000" className="w-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-white" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={loading} className="px-6 py-2 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white w-full">Save Goal</button>
            </div>
          </form>
        </div>
      )}

      {goals.length === 0 && !showForm && (
        <div className="glass-card p-10 text-center">
          <Target className="w-12 h-12 text-[var(--color-text-dim)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No active goals yet</h3>
          <p className="text-[var(--color-text-muted)] text-sm">Create a goal to get personalized saving recommendations.</p>
        </div>
      )}

      {analysis && !showForm && (
        <div className="space-y-6 slide-up">
          {/* Main Goal Card */}
          <div className="glass-card p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Target className="w-6 h-6 text-[var(--color-primary)]" />
                  {analysis.goal_name}
                </h3>
                <p className="text-[var(--color-text-muted)]">Target: {formatCurrency(analysis.target_amount)} • Remaining: {formatCurrency(analysis.remaining_amount)}</p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  analysis.achievability === 'Easy' ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]' :
                  analysis.achievability === 'Moderate' ? 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]' :
                  'bg-[var(--color-danger)]/20 text-[var(--color-danger)]'
                }`}>
                  Achievability: {analysis.achievability}
                </span>
                <p className="text-xs text-[var(--color-text-dim)] mt-2">{analysis.success_probability}% Success Probability</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[var(--color-surface-alt)] p-4 rounded-xl">
                <p className="text-xs text-[var(--color-text-dim)]">Required Monthly</p>
                <p className="text-lg font-semibold text-white">{formatCurrency(analysis.required_monthly_savings)}</p>
              </div>
              <div className="bg-[var(--color-surface-alt)] p-4 rounded-xl">
                <p className="text-xs text-[var(--color-text-dim)]">Your Current Surplus</p>
                <p className="text-lg font-semibold text-white">{formatCurrency(analysis.current_monthly_savings)}</p>
              </div>
              <div className="bg-[var(--color-surface-alt)] p-4 rounded-xl border border-[var(--color-danger)]/30">
                <p className="text-xs text-[var(--color-text-dim)]">Monthly Gap</p>
                <p className="text-lg font-semibold text-[var(--color-danger-light)]">{formatCurrency(analysis.gap)}</p>
              </div>
            </div>

            {/* AI Insights */}
            {(analysis.health_insight || analysis.personality_insight) && (
              <div className="bg-black/30 p-4 rounded-xl space-y-2 border border-white/5">
                {analysis.health_insight && <p className="text-sm text-[var(--color-primary-light)]">🩺 <b>Health:</b> {analysis.health_insight}</p>}
                {analysis.personality_insight && <p className="text-sm text-[var(--color-accent-light)]">🧠 <b>Personality:</b> {analysis.personality_insight}</p>}
              </div>
            )}
          </div>

          {/* Recommendations Engine */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-4">Smart Savings Recommendations</h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">We found exactly where you can cut back to bridge your {formatCurrency(analysis.gap)} gap:</p>
              <div className="space-y-3">
                {analysis.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-[var(--color-surface-alt)] border border-[var(--color-border)]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center text-[var(--color-success)]">
                        ↓
                      </div>
                      <p className="text-sm font-medium text-white">{rec.action}</p>
                    </div>
                    <p className="text-sm font-bold text-[var(--color-success)]">+{formatCurrency(rec.amount)}/mo</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Reusable Small Components ── */
function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="spinner"></div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="text-center py-16">
      <Icon className="w-12 h-12 text-[var(--color-text-dim)] mx-auto mb-3" />
      <p className="text-[var(--color-text-muted)]">{message}</p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="glass-card p-3 text-center">
      <p className="text-xs text-[var(--color-text-dim)] mb-1">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

/* ── FINANCIAL PERSONALITY ── */
function PersonalitySection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPersonality()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data) return <EmptyState icon={Sparkles} message="Financial Personality not available" />;

  return (
    <div className="space-y-8">
      {/* Premium Header Card (Spotify Wrapped Style) */}
      <div 
        className="glass-card p-8 text-center relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${data.color}20 0%, transparent 100%)`,
          borderColor: `${data.color}40`
        }}
      >
        <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: data.color }} />
        
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 mb-4 shadow-xl border border-white/10 backdrop-blur-md">
          <span className="text-4xl">{data.icon}</span>
        </div>
        
        <h3 className="text-sm font-semibold uppercase tracking-widest mb-3 opacity-90" style={{ color: data.color }}>
          Your Financial Identity
        </h3>
        
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
          {data.personality}
        </h2>
        
        <div className="flex items-center justify-center gap-2 mb-6">
          <Sparkles className="w-4 h-4" style={{ color: data.color }} />
          <p className="text-sm font-medium text-[var(--color-text-muted)]">
            AI Confidence: <strong className="text-white">{data.confidence}%</strong>
          </p>
        </div>
        
        <p className="text-lg text-[var(--color-text-muted)] max-w-2xl mx-auto leading-relaxed">
          "{data.description}"
        </p>
      </div>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        
        {/* Strengths */}
        <div className="glass-card p-6 border-t-2 border-t-[var(--color-success)]">
          <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />
            Your Strengths
          </h4>
          <ul className="space-y-3">
            {data.strengths.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                <span className="text-[var(--color-success)] mt-0.5">✓</span>
                <span className="text-gray-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="glass-card p-6 border-t-2 border-t-[var(--color-warning)]">
          <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[var(--color-warning)]" />
            Areas to Watch
          </h4>
          <ul className="space-y-3">
            {data.weaknesses.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm slide-up" style={{ animationDelay: `${(i+4) * 50}ms` }}>
                <span className="text-[var(--color-warning)] mt-0.5">⚠</span>
                <span className="text-gray-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Risks */}
        <div className="glass-card p-6 border-t-2 border-t-[var(--color-danger)]">
          <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[var(--color-danger)]" />
            Financial Risks
          </h4>
          <ul className="space-y-3">
            {data.risks.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm slide-up" style={{ animationDelay: `${(i+8) * 50}ms` }}>
                <XCircle className="w-4 h-4 text-[var(--color-danger)] shrink-0 mt-0.5" />
                <span className="text-gray-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div className="glass-card p-6 border-t-2 border-t-[var(--color-primary)]">
          <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-4 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[var(--color-primary-light)]" />
            Action Plan
          </h4>
          <ul className="space-y-3">
            {data.recommendations.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm slide-up" style={{ animationDelay: `${(i+12) * 50}ms` }}>
                <ArrowRight className="w-4 h-4 text-[var(--color-primary-light)] shrink-0 mt-0.5" />
                <span className="text-gray-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Secondary Traits */}
      {data.traits && data.traits.length > 1 && (
        <div className="glass-card p-8 mt-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-8 text-center">
            Secondary Personality Breakdown
          </h4>
          <div className="space-y-6 max-w-2xl mx-auto">
            {data.traits.map((trait, i) => (
              <div key={i} className="slide-up" style={{ animationDelay: `${(i+16) * 50}ms` }}>
                <div className="flex justify-between text-sm mb-1">
                  <span className={i === 0 ? "font-bold text-white" : "text-[var(--color-text-muted)]"}>
                    {trait.name} {i === 0 && "(Primary)"}
                  </span>
                  <span className="font-semibold">{trait.percentage}%</span>
                </div>
                <div className="w-full bg-[var(--color-surface-alt)] rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${trait.percentage}%`,
                      backgroundColor: i === 0 ? data.color : 'var(--color-border)',
                      opacity: i === 0 ? 1 : 0.6
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── AI FINANCIAL COACH ── */
function CoachSection() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'model',
      text: "Hi! I'm your FinSight AI Financial Coach. I've analyzed your financial health, spending habits, and subscriptions. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const suggestedQuestions = [
    "Why is my score low?",
    "How can I save more money?",
    "Where am I spending too much?",
    "What should I improve first?"
  ];

  const handleSend = async (question) => {
    if (!question.trim()) return;
    
    const userMsg = { id: Date.now().toString(), sender: 'user', text: question.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Pass the previous conversation history (excluding the current msg and the initial welcome msg)
      const history = messages.filter(m => m.id !== 'welcome');
      const response = await askCoach(question, history);
      
      const aiMsg = { id: (Date.now() + 1).toString(), sender: 'model', text: response.data.answer };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to connect to the AI Coach. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Left Chat Column */}
      <div className="lg:col-span-2 flex flex-col space-y-6 overflow-hidden h-full">
        {/* Header */}
        <div className="glass-card p-6 border-l-4 border-l-[var(--color-primary)] flex items-center gap-4 shrink-0">
          <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center">
            <Bot className="w-6 h-6 text-[var(--color-primary-light)]" />
          </div>
          <div>
            <h2 className="text-xl font-bold">FinSight AI Coach</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Your personalized financial mentor</p>
          </div>
        </div>

      {/* Suggested Questions */}
      {messages.length === 1 && !error && (
        <div className="flex flex-wrap gap-2 shrink-0">
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="px-4 py-2 text-sm bg-[var(--color-surface-alt)] hover:bg-[var(--color-primary)]/20 hover:text-[var(--color-primary-light)] rounded-full transition-colors border border-[var(--color-border)]"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* API Key Error Prompt */}
      {error && (
        <div className="glass-card p-6 border-l-4 border-l-[var(--color-danger)] shrink-0 bg-red-900/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--color-danger)] mt-0.5" />
            <div>
              <h3 className="font-bold text-[var(--color-danger)] mb-1">Configuration Required</h3>
              <p className="text-sm text-gray-300 mb-4">{error}</p>
              {error && error.includes('GEMINI_API_KEY') && (
                <div className="bg-black/50 p-3 rounded text-xs font-mono text-gray-300">
                  # Create a file named .env in the backend folder<br/>
                  GEMINI_API_KEY="your-api-key-here"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="glass-card flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.sender === 'user' ? 'bg-[var(--color-surface-alt)]' : 'bg-[var(--color-primary)]/20'
              }`}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-[var(--color-primary-light)]" />}
              </div>
              <div className={`p-4 rounded-2xl ${
                msg.sender === 'user' 
                  ? 'bg-[var(--color-surface-alt)] text-white' 
                  : 'bg-[var(--color-primary)]/10 text-gray-200 border border-[var(--color-primary)]/20'
              }`}>
                <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-[var(--color-primary-light)]" />
              </div>
              <div className="p-4 rounded-2xl bg-[var(--color-primary)]/10 text-gray-200 border border-[var(--color-primary)]/20 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary-light)]" />
                <span className="text-sm animate-pulse">Analyzing your data...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[var(--color-border)] bg-black/20">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your finances..."
              className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full px-6 py-3 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              disabled={loading || (error && error.includes('missing_api_key'))}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || (error && error.includes('missing_api_key'))}
              className="w-12 h-12 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-primary-light)] transition-colors shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
      </div>

      {/* Right Context Panel */}
      <div className="hidden lg:flex flex-col space-y-6 h-full">
        <div className="glass-card p-6 flex-1 flex flex-col">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-[var(--color-primary-light)]">
            <Sparkles className="w-5 h-5" />
            What the AI Knows
          </h3>
          
          <div className="space-y-6 overflow-y-auto flex-1 pr-2">
            <div className="p-4 rounded-xl bg-black/20 border border-white/5">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-green-400" />
                Financial Health
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                The AI has full access to your Health Score, including your positive financial habits and areas that need immediate improvement.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/20 border border-white/5">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Spending Patterns
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                It understands your entire transaction history, your top spending categories, and your overall savings rate.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/20 border border-white/5">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-400" />
                Subscriptions
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                It can identify all your recurring charges and calculate exactly how much money you could save by cancelling unused ones.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/20 border border-white/5">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                Anomalies
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                The AI is aware of any unusual spending spikes or anomalous transactions that deviate from your normal behavior.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-center text-gray-500">
              Your financial data is processed securely and only used to generate personalized advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
