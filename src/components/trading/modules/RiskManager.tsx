import React, { useState } from 'react';
import { useTrading } from '@/context/TradingContext';
import { MetricCard } from '../MetricCard';
import { Shield, AlertTriangle, Lock, Unlock, Bell } from 'lucide-react';

export function RiskManager() {
  const { riskLimits, updateRiskLimits, portfolio, lockTrading, unlockTrading } = useTrading();
  const [limits, setLimits] = useState(riskLimits);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleUpdate = () => {
    updateRiskLimits(limits);
  };

  const dailyLossPercent = portfolio.capital > 0 
    ? (Math.abs(Math.min(0, portfolio.dailyPnL)) / portfolio.capital) * 100 
    : 0;
  const weeklyLossPercent = portfolio.capital > 0 
    ? (Math.abs(Math.min(0, portfolio.weeklyPnL)) / portfolio.capital) * 100 
    : 0;
  const monthlyLossPercent = portfolio.capital > 0 
    ? (Math.abs(Math.min(0, portfolio.monthlyPnL)) / portfolio.capital) * 100 
    : 0;

  const isNearLimit = (current: number, limit: number) => current > limit * 0.8;
  const isBreached = (current: number, limit: number) => current >= limit;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-2">Institutional Risk Manager</h2>
        <p className="text-muted-foreground">Enforce trading discipline with automated risk controls</p>
      </div>

      {/* Trading Lock Status */}
      <div className={`trading-card ${portfolio.isTradingLocked ? 'glow-destructive border-destructive/30' : 'glow-success border-success/30'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {portfolio.isTradingLocked ? (
              <Lock className="w-6 h-6 text-destructive" />
            ) : (
              <Unlock className="w-6 h-6 text-success" />
            )}
            <div>
              <h3 className="font-semibold">
                Trading Status: {portfolio.isTradingLocked ? 'LOCKED' : 'ACTIVE'}
              </h3>
              {portfolio.lockReason && (
                <p className="text-sm text-destructive">{portfolio.lockReason}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => portfolio.isTradingLocked ? unlockTrading() : lockTrading('Manual lock')}
            className={portfolio.isTradingLocked ? 'btn-trading' : 'btn-danger'}
          >
            {portfolio.isTradingLocked ? 'Unlock Trading' : 'Lock Trading'}
          </button>
        </div>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Risk Per Trade"
          value={`${riskLimits.riskPerTrade}%`}
          subValue={formatCurrency(portfolio.capital * riskLimits.riskPerTrade / 100)}
          variant="primary"
          icon={<Shield className="w-4 h-4" />}
        />
        <MetricCard
          label="Daily Loss"
          value={`${dailyLossPercent.toFixed(2)}%`}
          subValue={`Limit: ${riskLimits.dailyLossLimit}%`}
          variant={isBreached(dailyLossPercent, riskLimits.dailyLossLimit) ? 'loss' : isNearLimit(dailyLossPercent, riskLimits.dailyLossLimit) ? 'warning' : 'default'}
          icon={isNearLimit(dailyLossPercent, riskLimits.dailyLossLimit) ? <AlertTriangle className="w-4 h-4" /> : undefined}
        />
        <MetricCard
          label="Weekly Loss"
          value={`${weeklyLossPercent.toFixed(2)}%`}
          subValue={`Limit: ${riskLimits.weeklyLossLimit}%`}
          variant={isBreached(weeklyLossPercent, riskLimits.weeklyLossLimit) ? 'loss' : isNearLimit(weeklyLossPercent, riskLimits.weeklyLossLimit) ? 'warning' : 'default'}
        />
        <MetricCard
          label="Monthly Loss"
          value={`${monthlyLossPercent.toFixed(2)}%`}
          subValue={`Limit: ${riskLimits.monthlyLossLimit}%`}
          variant={isBreached(monthlyLossPercent, riskLimits.monthlyLossLimit) ? 'loss' : isNearLimit(monthlyLossPercent, riskLimits.monthlyLossLimit) ? 'warning' : 'default'}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Configure Limits */}
        <div className="trading-card">
          <h3 className="text-lg font-semibold mb-4">Configure Risk Limits</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Risk Per Trade (%)</label>
              <input
                type="number"
                value={limits.riskPerTrade}
                onChange={(e) => setLimits({ ...limits, riskPerTrade: parseFloat(e.target.value) || 0 })}
                className="trading-input w-full"
                step="0.1"
                min="0.1"
                max="5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: 0.5% - 2% for professional traders
              </p>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">Daily Loss Limit (%)</label>
              <input
                type="number"
                value={limits.dailyLossLimit}
                onChange={(e) => setLimits({ ...limits, dailyLossLimit: parseFloat(e.target.value) || 0 })}
                className="trading-input w-full"
                step="0.5"
                min="1"
                max="10"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">Weekly Loss Limit (%)</label>
              <input
                type="number"
                value={limits.weeklyLossLimit}
                onChange={(e) => setLimits({ ...limits, weeklyLossLimit: parseFloat(e.target.value) || 0 })}
                className="trading-input w-full"
                step="0.5"
                min="2"
                max="15"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">Monthly Loss Limit (%)</label>
              <input
                type="number"
                value={limits.monthlyLossLimit}
                onChange={(e) => setLimits({ ...limits, monthlyLossLimit: parseFloat(e.target.value) || 0 })}
                className="trading-input w-full"
                step="1"
                min="5"
                max="25"
              />
            </div>

            <button onClick={handleUpdate} className="btn-trading w-full">
              Update Limits
            </button>
          </div>
        </div>

        {/* Risk Rules */}
        <div className="trading-card">
          <h3 className="text-lg font-semibold mb-4">Institutional Risk Rules</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
              <Bell className="w-5 h-5 text-warning mt-0.5" />
              <div>
                <p className="text-sm font-medium">Daily Loss Breach</p>
                <p className="text-xs text-muted-foreground">
                  Trading automatically locked when daily loss exceeds {riskLimits.dailyLossLimit}%
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
              <Bell className="w-5 h-5 text-warning mt-0.5" />
              <div>
                <p className="text-sm font-medium">Consecutive Loss Cooldown</p>
                <p className="text-xs text-muted-foreground">
                  Mandatory 30-minute cooldown after 3 consecutive losses
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
              <Bell className="w-5 h-5 text-warning mt-0.5" />
              <div>
                <p className="text-sm font-medium">Drawdown Protection</p>
                <p className="text-xs text-muted-foreground">
                  Risk auto-reduced by 50% when drawdown exceeds 10%
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
              <Bell className="w-5 h-5 text-warning mt-0.5" />
              <div>
                <p className="text-sm font-medium">RR Validation</p>
                <p className="text-xs text-muted-foreground">
                  All trades must have minimum 1:2 risk-reward ratio
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Emergency Stop</p>
                <p className="text-xs text-muted-foreground">
                  All trading halted at 20% drawdown - requires manual reset
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
