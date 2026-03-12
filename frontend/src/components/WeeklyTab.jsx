import { useState, useEffect } from 'react';
import { getMonthlySummary, getWeeklySummary } from '../api';
import { formatCurrency } from '../utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Flame, Calendar } from 'lucide-react';

export default function WeeklyTab({ selectedMonth }) {
  const [months, setMonths] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(selectedMonth || '');
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTransactions, setShowTransactions] = useState(null);

  // Load month list
  useEffect(() => {
    getMonthlySummary()
      .then((res) => {
        const ms = res.data.months || [];
        setMonths(ms);
        if (!currentMonth && ms.length > 0) {
          setCurrentMonth(ms[ms.length - 1].month);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load weekly data when month changes
  useEffect(() => {
    if (!currentMonth) return;
    setLoading(true);
    getWeeklySummary(currentMonth)
      .then((res) => setWeeklyData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentMonth]);

  // Update when drilled-down from MonthlyTab
  useEffect(() => {
    if (selectedMonth) setCurrentMonth(selectedMonth);
  }, [selectedMonth]);

  if (loading && !weeklyData) return <div className="flex justify-center py-20"><div className="spinner"></div></div>;

  const barData = weeklyData?.weeks?.map((w) => ({
    week: w.label,
    total: w.total,
    burnRate: w.burn_rate,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="glass-card p-4 flex items-center gap-4 flex-wrap">
        <Calendar className="w-5 h-5 text-[var(--color-primary-light)]" />
        <span className="text-sm text-[var(--color-text-muted)]">Select Month:</span>
        <select
          value={currentMonth}
          onChange={(e) => { setCurrentMonth(e.target.value); setShowTransactions(null); }}
          className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]"
        >
          {months.map((m) => (
            <option key={m.month} value={m.month}>{m.label}</option>
          ))}
        </select>
        {weeklyData && (
          <span className="text-sm font-medium text-[var(--color-primary-light)] ml-auto">
            Month Total: {formatCurrency(weeklyData.total)}
          </span>
        )}
      </div>

      {/* Weekly Bar Chart */}
      {weeklyData && weeklyData.weeks.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
            Weekly Spending Breakdown
          </h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="week"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#1e293b' }}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val, name) => [formatCurrency(val), name === 'total' ? 'Spending' : name]}
                  contentStyle={{
                    background: 'rgba(17, 24, 39, 0.95)',
                    border: '1px solid #1e293b',
                    borderRadius: '10px',
                    color: '#f1f5f9',
                  }}
                  cursor={{ fill: 'rgba(139, 92, 246, 0.08)' }}
                />
                <Bar
                  dataKey="total"
                  fill="#8b5cf6"
                  radius={[8, 8, 0, 0]}
                  cursor="pointer"
                  onClick={(d) => {
                    const week = weeklyData.weeks.find((w) => w.label === d.week);
                    if (week) setShowTransactions(week);
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-[var(--color-text-dim)] mt-2 text-center">
            Click a bar to view individual transactions
          </p>
        </div>
      )}

      {/* Burn Rate Indicator */}
      {weeklyData && weeklyData.weeks.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-orange-400" />
            <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Burn Rate (Cumulative Spending %)
            </h3>
          </div>
          <div className="space-y-3">
            {weeklyData.weeks.map((w, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{w.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--color-text-muted)]">{formatCurrency(w.total)}</span>
                    <span className={`font-semibold ${
                      w.burn_rate > 75 ? 'text-[var(--color-danger)]' :
                      w.burn_rate > 50 ? 'text-[var(--color-warning)]' :
                      'text-[var(--color-success)]'
                    }`}>
                      {w.burn_rate}%
                    </span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${w.burn_rate}%`,
                      background: w.burn_rate > 75 ? '#ef4444' : w.burn_rate > 50 ? '#f59e0b' : '#10b981',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {showTransactions && (
        <div className="glass-card p-6 slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              {showTransactions.label} Transactions ({showTransactions.count})
            </h3>
            <button
              onClick={() => setShowTransactions(null)}
              className="text-xs text-[var(--color-text-dim)] hover:text-white"
            >
              ✕ Close
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left py-2 text-[var(--color-text-dim)] font-medium">Date</th>
                  <th className="text-left py-2 text-[var(--color-text-dim)] font-medium">Description</th>
                  <th className="text-left py-2 text-[var(--color-text-dim)] font-medium">Category</th>
                  <th className="text-right py-2 text-[var(--color-text-dim)] font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {showTransactions.transactions?.map((t, i) => (
                  <tr key={i} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-alt)]">
                    <td className="py-2 text-[var(--color-text-muted)]">{t.date}</td>
                    <td className="py-2">{t.description || '—'}</td>
                    <td className="py-2">
                      <span className="badge badge-info text-xs">{t.category}</span>
                    </td>
                    <td className="py-2 text-right font-medium">{formatCurrency(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
