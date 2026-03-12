import { useState, useEffect } from 'react';
import {
  getAnomalies, getAdvice, getForecast,
  getSubscriptions, getSavingsGoal
} from '../api';
import { formatCurrency, formatPercent } from '../utils/formatters';
import {
  AlertTriangle, Lightbulb, TrendingUp, CreditCard,
  Target, ChevronDown, ChevronUp, Zap, Ghost,
  ArrowRight
} from 'lucide-react';

export default function InsightsTab() {
  const [section, setSection] = useState('anomalies');

  return (
    <div className="space-y-6">
      {/* Section Nav */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
          { id: 'advice', label: 'AI Advice', icon: Lightbulb },
          { id: 'forecast', label: 'Forecast', icon: TrendingUp },
          { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
          { id: 'savings', label: 'Savings Goal', icon: Target },
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
        {section === 'anomalies' && <AnomaliesSection />}
        {section === 'advice' && <AdviceSection />}
        {section === 'forecast' && <ForecastSection />}
        {section === 'subscriptions' && <SubscriptionsSection />}
        {section === 'savings' && <SavingsSection />}
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

/* ── SAVINGS GOAL ── */
function SavingsSection() {
  const [target, setTarget] = useState('');
  const [months, setMonths] = useState('');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!target || !months) return;

    setLoading(true);
    setError(null);
    try {
      const res = await getSavingsGoal(parseFloat(target), parseInt(months));
      setPlan(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate plan');
    } finally {
      setLoading(false);
    }
  };

  const difficultyColor = {
    Easy: 'text-[var(--color-success)]',
    Medium: 'text-[var(--color-warning)]',
    Hard: 'text-[var(--color-danger)]',
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="glass-card p-6 glow-border">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-[var(--color-accent)]" />
          <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Set Your Savings Goal
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-[var(--color-text-dim)] block mb-1">Target Amount (₹)</label>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="text-xs text-[var(--color-text-dim)] block mb-1">Timeframe (months)</label>
            <input
              type="number"
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              placeholder="e.g. 4"
              className="w-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !target || !months}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white font-semibold hover:shadow-lg hover:shadow-[var(--color-primary)]/20 transition-all disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Create Plan'}
          </button>
        </form>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 text-[var(--color-danger-light)] text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Plan Result */}
      {plan && (
        <div className="space-y-4 slide-up">
          {/* Feasibility Banner */}
          <div className={`glass-card p-4 flex items-center gap-3 ${
            plan.feasible
              ? 'border-[var(--color-success)]/30'
              : 'border-[var(--color-warning)]/30'
          }`}>
            <span className="text-2xl">{plan.feasible ? '✅' : '⚠️'}</span>
            <div>
              <p className="font-semibold">
                {plan.feasible ? 'Goal is Achievable!' : 'Challenging Goal'}
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">{plan.timeline_message}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniStat label="Monthly Target" value={formatCurrency(plan.monthly_target)} />
            <MiniStat label="Current Surplus" value={formatCurrency(plan.current_monthly_surplus)} />
            <MiniStat label="Achievable Savings" value={formatCurrency(plan.total_achievable_savings)} />
            <MiniStat label="Est. Months" value={plan.estimated_months || '∞'} />
          </div>

          {/* Cutting Plan */}
          {plan.plan.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
                Category Reduction Plan
              </h3>
              <div className="space-y-3">
                {plan.plan.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-alt)]">
                    <div>
                      <p className="font-medium text-sm">{item.category}</p>
                      <p className="text-xs text-[var(--color-text-dim)]">
                        Current: {formatCurrency(item.current_monthly)}/mo →
                        New: {formatCurrency(item.new_budget)}/mo
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[var(--color-success)]">
                        −{formatCurrency(item.monthly_savings)}/mo
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--color-text-dim)]">
                          ↓{item.reduction_pct}%
                        </span>
                        <span className={`text-xs font-medium ${difficultyColor[item.difficulty]}`}>
                          {item.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {plan.tips.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                💡 Tips
              </h3>
              <ul className="space-y-2">
                {plan.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-[var(--color-text-muted)] flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-[var(--color-primary-light)] mt-0.5 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
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
