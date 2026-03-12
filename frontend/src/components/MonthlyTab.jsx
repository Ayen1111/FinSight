import { useState, useEffect, useMemo } from 'react';
import { getMonthlySummary } from '../api';
import { formatCurrency, formatMonth } from '../utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

export default function MonthlyTab({ onDrillDown }) {
  const [data, setData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMonthlySummary()
      .then((res) => {
        const months = res.data.months || [];
        setData(months);
        if (months.length > 0) {
          // Default to the latest year
          const latestYear = months[months.length - 1].month.slice(0, 4);
          setSelectedYear(latestYear);
          setSelectedMonth(months[months.length - 1]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Extract unique years from data
  const years = useMemo(() => {
    if (!data) return [];
    const yearSet = new Set(data.map((m) => m.month.slice(0, 4)));
    return [...yearSet].sort();
  }, [data]);

  // Filter months by selected year
  const barData = useMemo(() => {
    if (!data || !selectedYear) return [];
    return data
      .filter((m) => m.month.startsWith(selectedYear))
      .map((m) => ({
        month: m.label,
        fullMonth: m.month,
        total: m.total,
      }));
  }, [data, selectedYear]);

  if (loading) return <div className="flex justify-center py-20"><div className="spinner"></div></div>;
  if (!data || data.length === 0) return <p className="text-center text-[var(--color-text-muted)] py-10">No monthly data available.</p>;

  // Pie chart data for selected month
  const pieData = selectedMonth?.categories?.map((c) => ({
    name: c.category,
    value: c.amount,
  })) || [];

  const currentYearIndex = years.indexOf(selectedYear);

  return (
    <div className="space-y-6">
      {/* Month-over-Month Bar Chart */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Monthly Spending Trend
          </h3>
          <span className="text-xs text-[var(--color-text-dim)]">
            Click a bar to see category breakdown • Double-click to drill down to weeks
          </span>
        </div>

        {/* Year Filter */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <button
            onClick={() => setSelectedYear(years[currentYearIndex - 1])}
            disabled={currentYearIndex <= 0}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 text-[var(--color-text-muted)]" />
          </button>
          {years.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedYear === year
                  ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-blue-500/20'
                  : 'text-[var(--color-text-muted)] hover:bg-white/5 hover:text-white'
              }`}
            >
              {year}
            </button>
          ))}
          <button
            onClick={() => setSelectedYear(years[currentYearIndex + 1])}
            disabled={currentYearIndex >= years.length - 1}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
          </button>
        </div>

        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="month"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#1e293b' }}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#1e293b' }}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val) => formatCurrency(val)}
                contentStyle={{
                  background: 'rgba(17, 24, 39, 0.95)',
                  border: '1px solid #1e293b',
                  borderRadius: '10px',
                  color: '#f1f5f9',
                }}
                cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
              />
              <Bar
                dataKey="total"
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
                cursor="pointer"
                onClick={(d) => {
                  const month = data.find((m) => m.label === d.month);
                  if (month) setSelectedMonth(month);
                }}
                onDoubleClick={(d) => {
                  const month = data.find((m) => m.label === d.month);
                  if (month) onDrillDown(month.month);
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Selected Month Detail */}
      {selectedMonth && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                {selectedMonth.label} — Category Breakdown
              </h3>
              <span className="text-lg font-bold text-[var(--color-primary-light)]">
                {formatCurrency(selectedMonth.total)}
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    dataKey="value"
                    stroke="none"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => formatCurrency(val)}
                    contentStyle={{
                      background: 'rgba(17, 24, 39, 0.95)',
                      border: '1px solid #1e293b',
                      borderRadius: '10px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category List + Drill-down */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                Categories ({selectedMonth.count} txns)
              </h3>
              <button
                onClick={() => onDrillDown(selectedMonth.month)}
                className="text-xs text-[var(--color-primary-light)] hover:text-white flex items-center gap-1 transition-colors"
              >
                View Weekly <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {selectedMonth.categories.map((cat, i) => {
                const pct = (cat.amount / selectedMonth.total * 100).toFixed(1);
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: COLORS[i % COLORS.length] }}
                        />
                        <span>{cat.category}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(cat.amount)}</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${pct}%`,
                          background: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
