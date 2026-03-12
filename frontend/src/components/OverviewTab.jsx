import { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank,
  Receipt, BarChart3
} from 'lucide-react';
import { getOverview, getRecentTransactions } from '../api';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

export default function OverviewTab({ initialData }) {
  const [data, setData] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (initialData?.overview) {
      setData(initialData);
    } else {
      getOverview().then((res) => setData({ overview: res.data })).catch(() => {});
    }

    getRecentTransactions()
      .then((res) => setTransactions(res.data.transactions || []))
      .catch(() => {});
  }, [initialData]);

  if (!data) return <Loading />;

  const { overview, cluster } = data;

  const cards = [
    {
      icon: Wallet,
      label: 'Total Income',
      value: formatCurrency(overview.total_income),
      color: 'var(--color-success)',
      bg: 'rgba(16, 185, 129, 0.1)',
    },
    {
      icon: Receipt,
      label: 'Total Expenses',
      value: formatCurrency(overview.total_expenses),
      color: 'var(--color-danger)',
      bg: 'rgba(239, 68, 68, 0.1)',
    },
    {
      icon: PiggyBank,
      label: 'Net Savings',
      value: formatCurrency(overview.savings),
      color: overview.savings >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
      bg: overview.savings >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
    },
    {
      icon: BarChart3,
      label: 'Avg Monthly Expense',
      value: formatCurrency(overview.avg_monthly_expense),
      color: 'var(--color-primary)',
      bg: 'rgba(59, 130, 246, 0.1)',
    },
  ];

  const pieData = overview.top_categories?.map((c) => ({
    name: c.category,
    value: c.amount,
  })) || [];

  return (
    <div style={{ paddingTop: '16px' }}>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="glass-card p-5 slide-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: card.bg }}
                  >
                    <Icon className="w-5 h-5" style={{ color: card.color }} />
                  </div>
                  <span className="text-sm text-[var(--color-text-muted)]">{card.label}</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Spending Profile */}
          {cluster && (
            <div className="glass-card p-6 slide-up" style={{ animationDelay: '300ms', minHeight: '260px' }}>
              <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
                Spending Profile
              </h3>
              <div
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-lg font-bold mb-3"
                style={{
                  background: `${cluster.profile.color}20`,
                  border: `1px solid ${cluster.profile.color}40`,
                  color: cluster.profile.color,
                }}
              >
                <span className="text-2xl">{cluster.profile.emoji}</span>
                {cluster.profile.name}
              </div>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mt-3">
                {cluster.profile.description}
              </p>
            </div>
          )}

          {/* Top Categories Pie Chart */}
          <div className="glass-card p-6 lg:col-span-2 slide-up" style={{ animationDelay: '400ms', minHeight: '260px' }}>
            <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
              Top Spending Categories
            </h3>
            <div className="flex items-center gap-6">
              <div className="w-48 h-48">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => formatCurrency(val)}
                      contentStyle={{
                        background: 'rgba(17, 24, 39, 0.95)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '10px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {pieData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-[var(--color-text-muted)]">{item.name}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="glass-card p-6 slide-up" style={{ animationDelay: '500ms' }}>
          <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
            Quick Stats
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Transactions" value={overview.transaction_count} />
            <Stat label="Months of Data" value={overview.months_of_data} />
            <Stat label="Savings Rate" value={formatPercent(overview.savings_rate)} highlight={overview.savings_rate >= 0} />
            <Stat
              label="Date Range"
              value={`${overview.date_range?.start?.slice(0, 7)} → ${overview.date_range?.end?.slice(0, 7)}`}
              small
            />
          </div>
        </div>

        {/* Recent Transactions */}
        {transactions.length > 0 && (
          <div className="glass-card p-6 slide-up" style={{ animationDelay: '600ms' }}>
            <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
              Recent Transactions
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Description</th>
                    <th style={thStyle}>Category</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={tdStyle}>
                        <span style={{ color: 'var(--color-text-dim)', fontSize: '0.8125rem' }}>{tx.date}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{tx.description}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          background: 'rgba(139, 92, 246, 0.12)',
                          color: '#a78bfa',
                          border: '1px solid rgba(139, 92, 246, 0.25)',
                        }}>
                          {tx.category}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <span style={{
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: tx.type === 'Income' ? 'var(--color-success)' : 'var(--color-danger)',
                        }}>
                          {tx.type === 'Income' ? '+' : '−'}{formatCurrency(Math.abs(tx.amount))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const thStyle = {
  textAlign: 'left',
  padding: '10px 12px',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-dim)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tdStyle = {
  padding: '12px 12px',
  fontSize: '0.875rem',
  verticalAlign: 'middle',
};

function Stat({ label, value, highlight, small }) {
  return (
    <div className="text-center p-3 rounded-xl bg-[var(--color-surface-alt)]">
      <p className={`${small ? 'text-sm' : 'text-xl'} font-bold ${highlight === false ? 'text-[var(--color-danger)]' : ''}`}>
        {value}
      </p>
      <p className="text-xs text-[var(--color-text-dim)] mt-1">{label}</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="spinner"></div>
    </div>
  );
}
