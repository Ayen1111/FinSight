import { useEffect, useState } from 'react';
import { getFinancialHealthScore } from '../api';
import { ShieldCheck, ShieldAlert, AlertTriangle, TrendingUp, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';

export default function FinancialHealthScore() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    getFinancialHealthScore()
      .then((res) => {
        setHealthData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (healthData && healthData.score > 0) {
      let start = 0;
      const end = healthData.score;
      const duration = 1500;
      const increment = end / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          clearInterval(timer);
          setDisplayScore(end);
        } else {
          setDisplayScore(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [healthData]);

  if (loading) return null;
  if (!healthData) return null;

  const { score, rating, strengths, weaknesses, recommendations } = healthData;

  let color = '#10b981'; // Green
  if (score < 40) color = '#ef4444'; // Red
  else if (score < 60) color = '#f97316'; // Orange
  else if (score < 75) color = '#eab308'; // Yellow
  else if (score < 90) color = '#3b82f6'; // Blue

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="glass-card p-6 mb-6 slide-up">
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck className="w-6 h-6" style={{ color }} />
        <h2 className="text-xl font-bold">Financial Health Score</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Gauge Section */}
        <div className="flex flex-col items-center justify-center border-r border-[var(--color-border)] pr-0 md:pr-8">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="transform -rotate-90 w-40 h-40">
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className="text-[var(--color-surface-alt)]"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke={color}
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-100 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold" style={{ color }}>
                {displayScore}
              </span>
              <span className="text-sm text-[var(--color-text-dim)]">/ 100</span>
            </div>
          </div>
          <div 
            className="mt-4 px-4 py-1.5 rounded-full font-semibold text-sm"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {rating}
          </div>
        </div>

        {/* Explanation Section */}
        <div className="md:col-span-2 flex flex-col justify-center space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                What Helped Your Score
              </h3>
              <ul className="space-y-2">
                {strengths.length > 0 ? (
                  strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-[var(--color-text-dim)]">No major strengths identified yet.</li>
                )}
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                What Hurt Your Score
              </h3>
              <ul className="space-y-2">
                {weaknesses.length > 0 ? (
                  weaknesses.map((wk, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <XCircle className="w-4 h-4 text-[var(--color-danger)] shrink-0 mt-0.5" />
                      <span>{wk}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-[var(--color-text-dim)]">No major weaknesses identified!</li>
                )}
              </ul>
            </div>
          </div>

          {/* Actionable Insights */}
          {recommendations.length > 0 && (
            <div className="pt-4 border-t border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Actionable Insights
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="bg-[var(--color-surface-alt)] p-3 rounded-xl flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
                    <p className="text-sm text-[var(--color-text-dim)] leading-relaxed">
                      {rec}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
