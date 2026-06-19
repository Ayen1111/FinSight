import React, { useState, useEffect, useCallback } from 'react';
import { runSimulation, getSimulationAIExplanation, getSubscriptions } from '../api';
import { Sparkles, BrainCircuit, TrendingUp, TrendingDown, Target, Activity } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function WhatIfSimulator() {
  const [params, setParams] = useState({
    food_reduction: 0,
    shopping_reduction: 0,
    entertainment_reduction: 0,
    travel_reduction: 0,
    extra_savings: 0,
    subscription_removals: []
  });
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [subscriptionsData, setSubscriptionsData] = useState(null);

  // Fetch subscriptions on mount
  useEffect(() => {
    getSubscriptions().then(res => setSubscriptionsData(res.data)).catch(console.error);
  }, []);

  // Auto-run simulation when params change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSimulation(params);
    }, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [params]);

  const fetchSimulation = async (currentParams) => {
    setLoading(true);
    try {
      const res = await runSimulation(currentParams);
      setResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAiReview = async () => {
    if (!result) return;
    setAiLoading(true);
    try {
      const res = await getSimulationAIExplanation(params, result);
      setAiExplanation(res.data.explanation);
    } catch (err) {
      setAiExplanation("AI analysis unavailable.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubToggle = (subName) => {
    setParams(prev => {
      const isRemoved = prev.subscription_removals.includes(subName);
      return {
        ...prev,
        subscription_removals: isRemoved 
          ? prev.subscription_removals.filter(n => n !== subName)
          : [...prev.subscription_removals, subName]
      };
    });
  };

  const applyPreset = (type) => {
    if (type === 'conservative') {
      setParams({ ...params, food_reduction: 10, shopping_reduction: 10, entertainment_reduction: 5, extra_savings: 1000 });
    } else if (type === 'aggressive') {
      setParams({ ...params, food_reduction: 25, shopping_reduction: 40, entertainment_reduction: 30, extra_savings: 5000 });
    } else if (type === 'reset') {
      setParams({ food_reduction: 0, shopping_reduction: 0, entertainment_reduction: 0, travel_reduction: 0, extra_savings: 0, subscription_removals: [] });
      setAiExplanation('');
    }
  };

  return (
    <div className="space-y-6 slide-up">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--color-primary)]" /> What-If Simulator
          </h2>
          <p className="text-sm text-[var(--color-text-dim)]">Test financial decisions before making them.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => applyPreset('conservative')} className="px-3 py-1.5 rounded-lg bg-[var(--color-surface-alt)] text-xs text-white hover:bg-[var(--color-primary)]/20 transition-colors">Conservative Plan</button>
          <button onClick={() => applyPreset('aggressive')} className="px-3 py-1.5 rounded-lg bg-[var(--color-surface-alt)] text-xs text-white hover:bg-[var(--color-primary)]/20 transition-colors">Aggressive Plan</button>
          <button onClick={() => applyPreset('reset')} className="px-3 py-1.5 rounded-lg bg-[var(--color-danger)]/10 text-[var(--color-danger-light)] text-xs hover:bg-[var(--color-danger)]/20 transition-colors">Reset</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT SIDE: CONTROLS */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-6">Spending Reductions</h3>
            <div className="space-y-5">
              {[
                { key: 'food_reduction', label: 'Food & Dining' },
                { key: 'shopping_reduction', label: 'Shopping & Clothes' },
                { key: 'entertainment_reduction', label: 'Entertainment' },
                { key: 'travel_reduction', label: 'Travel' },
              ].map(item => (
                <div key={item.key}>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm text-white">{item.label}</label>
                    <span className="text-sm font-bold text-[var(--color-primary)]">{params[item.key]}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" step="5" 
                    value={params[item.key]} 
                    onChange={e => setParams({...params, [item.key]: parseInt(e.target.value)})}
                    className="w-full accent-[var(--color-primary)]"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Additional Savings</h3>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-white">Extra Monthly Savings (₹)</label>
                <span className="text-sm font-bold text-[var(--color-success)]">+{params.extra_savings}</span>
              </div>
              <input 
                type="range" min="0" max="20000" step="500" 
                value={params.extra_savings} 
                onChange={e => setParams({...params, extra_savings: parseInt(e.target.value)})}
                className="w-full accent-[var(--color-success)]"
              />
            </div>
          </div>

          {subscriptionsData && subscriptionsData.subscriptions && subscriptionsData.subscriptions.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Cancel Subscriptions</h3>
              <div className="grid grid-cols-2 gap-3">
                {subscriptionsData.subscriptions.map((sub, i) => {
                  const isRemoved = params.subscription_removals.includes(sub.name);
                  return (
                    <button 
                      key={i}
                      onClick={() => handleSubToggle(sub.name)}
                      className={`p-3 rounded-xl text-left border transition-all ${
                        isRemoved 
                        ? 'border-[var(--color-danger)] bg-[var(--color-danger)]/10' 
                        : 'border-[var(--color-border)] bg-[var(--color-surface-alt)] hover:border-[var(--color-primary)]'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-sm font-medium ${isRemoved ? 'line-through text-[var(--color-text-dim)]' : 'text-white'}`}>{sub.name}</span>
                        {isRemoved ? <span className="text-xs text-[var(--color-danger)]">Cancelled</span> : <span className="text-xs text-[var(--color-text-dim)]">Active</span>}
                      </div>
                      <span className={`text-xs ${isRemoved ? 'text-[var(--color-text-dim)]' : 'text-[var(--color-primary-light)]'}`}>{formatCurrency(sub.estimated_monthly_cost)}/mo</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDE: RESULTS */}
        <div className="space-y-6">
          <div className={`glass-card p-6 transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-6 flex items-center justify-between">
              Projected Outcomes
              {loading && <span className="text-[var(--color-primary)] text-xs animate-pulse">Calculating...</span>}
            </h3>

            {result ? (
              <div className="space-y-6">
                
                {/* Health Score Impact */}
                <div className="flex items-center justify-between p-4 bg-[var(--color-surface-alt)] rounded-xl border border-[var(--color-border)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-[var(--color-primary)]" />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-dim)]">Financial Health Score</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">{result.health_score_after}</span>
                        <span className="text-sm text-[var(--color-text-muted)] line-through">was {result.health_score_before}</span>
                      </div>
                    </div>
                  </div>
                  {result.health_score_after > result.health_score_before && (
                    <div className="flex items-center text-[var(--color-success)] bg-[var(--color-success)]/10 px-3 py-1 rounded-full">
                      <TrendingUp className="w-4 h-4 mr-1" /> +{result.health_score_after - result.health_score_before}
                    </div>
                  )}
                  {result.health_score_after < result.health_score_before && (
                    <div className="flex items-center text-[var(--color-danger)] bg-[var(--color-danger)]/10 px-3 py-1 rounded-full">
                      <TrendingDown className="w-4 h-4 mr-1" /> {result.health_score_after - result.health_score_before}
                    </div>
                  )}
                </div>

                {/* Savings Impact */}
                <div className="flex items-center justify-between p-4 bg-[var(--color-surface-alt)] rounded-xl border border-[var(--color-border)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-success)]/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-[var(--color-success)]" />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-dim)]">Projected Annual Savings</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">{formatCurrency(result.annual_savings_after)}</span>
                        <span className="text-sm text-[var(--color-text-muted)] line-through">was {formatCurrency(result.annual_savings_before)}</span>
                      </div>
                    </div>
                  </div>
                  {result.annual_savings_after > result.annual_savings_before && (
                    <div className="text-right">
                      <p className="text-[var(--color-success)] font-bold">+{formatCurrency(result.annual_savings_after - result.annual_savings_before)}</p>
                      <p className="text-[10px] text-[var(--color-text-dim)]">extra per year</p>
                    </div>
                  )}
                </div>

                {/* Goal Impact */}
                {result.goal_name && (
                  <div className="flex items-center justify-between p-4 bg-[var(--color-surface-alt)] rounded-xl border border-[var(--color-border)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center">
                        <Target className="w-5 h-5 text-[var(--color-accent)]" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--color-text-dim)]">Goal: {result.goal_name}</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-white">{result.goal_completion_after} mos</span>
                          <span className="text-sm text-[var(--color-text-muted)] line-through">was {result.goal_completion_before} mos</span>
                        </div>
                      </div>
                    </div>
                    {result.goal_time_saved > 0 && (
                      <div className="text-right">
                        <p className="text-[var(--color-accent-light)] font-bold">{result.goal_time_saved} months</p>
                        <p className="text-[10px] text-[var(--color-text-dim)]">reached faster</p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-[var(--color-text-muted)]">Run a simulation to see projected outcomes.</p>
              </div>
            )}
          </div>

          {/* AI Explanation Panel */}
          <div className="glass-card p-6 border border-[var(--color-primary)]/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)]/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            
            <div className="flex justify-between items-center mb-4 relative z-10">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-[var(--color-primary-light)]" />
                AI Coach Review
              </h3>
              {!aiExplanation && result && (
                <button 
                  onClick={handleAiReview} 
                  disabled={aiLoading}
                  className="px-3 py-1 bg-[var(--color-primary)] text-white text-xs rounded-full hover:bg-[var(--color-primary-light)] disabled:opacity-50"
                >
                  {aiLoading ? 'Thinking...' : 'Get AI Review'}
                </button>
              )}
            </div>
            
            <div className="relative z-10 min-h-[60px]">
              {aiExplanation ? (
                <div>
                  <p className="text-sm text-[var(--color-text-muted)] leading-relaxed italic border-l-2 border-[var(--color-primary)] pl-3">"{aiExplanation}"</p>
                  <button 
                    onClick={() => setAiExplanation('')}
                    className="text-xs text-[var(--color-primary-light)] mt-3 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <p className="text-xs text-[var(--color-text-dim)]">Adjust the sliders and click "Get AI Review" to hear what your AI Coach thinks about your hypothetical choices.</p>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
