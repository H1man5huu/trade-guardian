import React, { useMemo } from 'react';
import { useTrading } from '@/context/TradingContext';
import { calculateKellyCriterion } from '@/lib/riskEngine';
import { MetricCard } from '../MetricCard';
import { Calculator, Percent, AlertTriangle, Target, Shield } from 'lucide-react';

export function KellyCriterion() {
  const { metrics, riskLimits, portfolio } = useTrading();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const kellyPercent = useMemo(() => {
    return calculateKellyCriterion(metrics.winRate, metrics.avgWin, metrics.avgLoss);
  }, [metrics.winRate, metrics.avgWin, metrics.avgLoss]);

  const fullKelly = kellyPercent * 2; // We return half-Kelly, so full is 2x
  const quarterKelly = kellyPercent / 2;

  const kellyAmount = (portfolio.capital * kellyPercent) / 100;
  const fullKellyAmount = (portfolio.capital * fullKelly) / 100;
  const quarterKellyAmount = (portfolio.capital * quarterKelly) / 100;

  const isKellyBelowLimit = kellyPercent <= riskLimits.riskPerTrade;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-2">Kelly Criterion Engine</h2>
        <p className="text-muted-foreground">Calculate mathematically optimal bet sizing based on your edge</p>
      </div>

      {/* Main Kelly Result */}
      <div className="trading-card glow-primary">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Optimal Kelly Fraction (Half-Kelly)</p>
            <p className="text-5xl font-mono font-bold text-primary">
              {kellyPercent.toFixed(2)}%
            </p>
            <p className="text-muted-foreground mt-2">
              Risk {formatCurrency(kellyAmount)} per trade
            </p>
          </div>
          <div className="text-right">
            <Calculator className="w-16 h-16 text-primary opacity-30" />
          </div>
        </div>
      </div>

      {/* Kelly Variants */}
      <div className="grid grid-cols-3 gap-4">
        <div className="trading-card text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Quarter Kelly (Conservative)</p>
          <p className="text-2xl font-mono font-bold">{quarterKelly.toFixed(2)}%</p>
          <p className="text-sm text-muted-foreground mt-1">{formatCurrency(quarterKellyAmount)}</p>
          <p className="text-xs text-success mt-2">Lowest volatility</p>
        </div>
        <div className="trading-card text-center border-primary/50 glow-primary">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Half Kelly (Recommended)</p>
          <p className="text-2xl font-mono font-bold text-primary">{kellyPercent.toFixed(2)}%</p>
          <p className="text-sm text-muted-foreground mt-1">{formatCurrency(kellyAmount)}</p>
          <p className="text-xs text-primary mt-2">Optimal balance</p>
        </div>
        <div className="trading-card text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Full Kelly (Aggressive)</p>
          <p className="text-2xl font-mono font-bold text-warning">{fullKelly.toFixed(2)}%</p>
          <p className="text-sm text-muted-foreground mt-1">{formatCurrency(fullKellyAmount)}</p>
          <p className="text-xs text-warning mt-2">Maximum growth, high volatility</p>
        </div>
      </div>

      {/* Input Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Win Rate"
          value={`${metrics.winRate.toFixed(1)}%`}
          variant={metrics.winRate >= 50 ? 'profit' : 'loss'}
          icon={<Percent className="w-4 h-4" />}
        />
        <MetricCard
          label="Average Win"
          value={formatCurrency(metrics.avgWin)}
          variant="profit"
        />
        <MetricCard
          label="Average Loss"
          value={formatCurrency(metrics.avgLoss)}
          variant="loss"
        />
        <MetricCard
          label="Win/Loss Ratio"
          value={metrics.avgLoss > 0 ? (metrics.avgWin / metrics.avgLoss).toFixed(2) : '∞'}
        />
      </div>

      {/* Comparison with Current Risk */}
      <div className="trading-card">
        <h3 className="text-lg font-semibold mb-4">Kelly vs Current Risk Setting</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className={`p-4 rounded-lg border ${isKellyBelowLimit ? 'bg-success/10 border-success/30' : 'bg-warning/10 border-warning/30'}`}>
            <div className="flex items-center gap-3 mb-3">
              {isKellyBelowLimit ? (
                <Shield className="w-6 h-6 text-success" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-warning" />
              )}
              <p className="font-semibold">
                {isKellyBelowLimit ? 'Conservative Setting' : 'Aggressive Setting'}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {isKellyBelowLimit 
                ? `Your current risk (${riskLimits.riskPerTrade}%) is higher than Kelly optimal (${kellyPercent.toFixed(2)}%). Consider reducing risk for optimal long-term growth.`
                : `Your current risk (${riskLimits.riskPerTrade}%) is below Kelly optimal. You could potentially increase risk, but current setting is safer.`
              }
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
              <span>Current Risk Setting</span>
              <span className="font-mono font-bold">{riskLimits.riskPerTrade}%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/30">
              <span>Kelly Optimal</span>
              <span className="font-mono font-bold text-primary">{kellyPercent.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
              <span>Difference</span>
              <span className={`font-mono font-bold ${isKellyBelowLimit ? 'text-destructive' : 'text-success'}`}>
                {isKellyBelowLimit ? '+' : ''}{(riskLimits.riskPerTrade - kellyPercent).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Kelly Formula */}
      <div className="trading-card">
        <h3 className="text-lg font-semibold mb-4">Kelly Criterion Formula</h3>
        <div className="p-4 bg-muted/20 rounded-lg font-mono text-sm">
          <p className="text-muted-foreground mb-2">Kelly % = W - [(1-W) / R]</p>
          <p className="mb-2">Where:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
            <li>W = Win probability ({(metrics.winRate / 100).toFixed(3)})</li>
            <li>R = Win/Loss ratio ({(metrics.avgLoss > 0 ? metrics.avgWin / metrics.avgLoss : 0).toFixed(2)})</li>
          </ul>
          <div className="mt-4 pt-4 border-t border-border">
            <p>Kelly = {(metrics.winRate / 100).toFixed(3)} - [(1 - {(metrics.winRate / 100).toFixed(3)}) / {(metrics.avgLoss > 0 ? metrics.avgWin / metrics.avgLoss : 0).toFixed(2)}]</p>
            <p className="text-lg mt-2">= <span className="text-primary font-bold">{(fullKelly).toFixed(2)}%</span> (Full Kelly)</p>
            <p className="text-lg">= <span className="text-success font-bold">{kellyPercent.toFixed(2)}%</span> (Half Kelly - Recommended)</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          <strong>Note:</strong> We recommend Half-Kelly to reduce volatility while still capturing most of the growth benefits. 
          Full Kelly maximizes long-term growth but with extreme volatility.
        </p>
      </div>

      {/* Warning */}
      {metrics.totalTrades < 30 && (
        <div className="trading-card bg-warning/10 border-warning/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-warning mt-0.5" />
            <div>
              <p className="font-semibold text-warning">Insufficient Data</p>
              <p className="text-sm text-muted-foreground">
                Kelly Criterion requires a statistically significant sample size. With only {metrics.totalTrades} trades, 
                the calculated Kelly value may not be reliable. Aim for at least 30+ trades before relying on Kelly sizing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
