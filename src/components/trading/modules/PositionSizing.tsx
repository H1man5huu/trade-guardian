import React, { useState, useMemo } from 'react';
import { useTrading } from '@/context/TradingContext';
import { calculatePositionSize } from '@/lib/riskEngine';
import { MetricCard } from '../MetricCard';
import { Calculator, Scale, AlertTriangle, Wallet, Target } from 'lucide-react';

export function PositionSizing() {
  const { portfolio, riskLimits } = useTrading();
  
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLossPercent, setStopLossPercent] = useState('1');
  const [riskPercent, setRiskPercent] = useState(riskLimits.riskPerTrade.toString());
  const [targetPercent, setTargetPercent] = useState('2');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const result = useMemo(() => {
    const entry = parseFloat(entryPrice) || 0;
    const sl = parseFloat(stopLossPercent) || 0;
    const risk = parseFloat(riskPercent) || 0;
    
    if (entry <= 0 || sl <= 0 || risk <= 0) return null;

    return calculatePositionSize(
      portfolio.capital,
      risk,
      sl,
      entry,
      portfolio.leverage
    );
  }, [entryPrice, stopLossPercent, riskPercent, portfolio.capital, portfolio.leverage]);

  const targetPrice = useMemo(() => {
    const entry = parseFloat(entryPrice) || 0;
    const target = parseFloat(targetPercent) || 0;
    return entry * (1 + target / 100);
  }, [entryPrice, targetPercent]);

  const stopLossPrice = useMemo(() => {
    const entry = parseFloat(entryPrice) || 0;
    const sl = parseFloat(stopLossPercent) || 0;
    return entry * (1 - sl / 100);
  }, [entryPrice, stopLossPercent]);

  const riskRewardRatio = useMemo(() => {
    const sl = parseFloat(stopLossPercent) || 0;
    const target = parseFloat(targetPercent) || 0;
    return sl > 0 ? target / sl : 0;
  }, [stopLossPercent, targetPercent]);

  const isRRValid = riskRewardRatio >= 2;
  const isRiskValid = parseFloat(riskPercent) <= riskLimits.riskPerTrade;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-2">Position Sizing Engine</h2>
        <p className="text-muted-foreground">Calculate optimal position size based on your risk parameters</p>
      </div>

      {/* Capital Info */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Available Capital"
          value={formatCurrency(portfolio.capital)}
          icon={<Wallet className="w-4 h-4" />}
        />
        <MetricCard
          label="Leverage"
          value={`${portfolio.leverage}x`}
          icon={<Scale className="w-4 h-4" />}
        />
        <MetricCard
          label="Effective Capital"
          value={formatCurrency(portfolio.effectiveCapital)}
          variant="primary"
        />
        <MetricCard
          label="Max Risk Per Trade"
          value={`${riskLimits.riskPerTrade}%`}
          subValue={formatCurrency(portfolio.capital * riskLimits.riskPerTrade / 100)}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="trading-card">
          <h3 className="text-lg font-semibold mb-4">Trade Parameters</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Entry Price (₹)</label>
              <input
                type="number"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="trading-input w-full"
                placeholder="Enter instrument price"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">Stop Loss (%)</label>
              <input
                type="number"
                value={stopLossPercent}
                onChange={(e) => setStopLossPercent(e.target.value)}
                className="trading-input w-full"
                step="0.1"
                min="0.1"
              />
              {entryPrice && (
                <p className="text-xs text-muted-foreground mt-1">
                  SL Price: ₹{stopLossPrice.toFixed(2)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">Risk Per Trade (%)</label>
              <input
                type="number"
                value={riskPercent}
                onChange={(e) => setRiskPercent(e.target.value)}
                className={`trading-input w-full ${!isRiskValid ? 'border-warning' : ''}`}
                step="0.1"
                min="0.1"
                max="5"
              />
              {!isRiskValid && (
                <p className="text-xs text-warning mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Exceeds max risk of {riskLimits.riskPerTrade}%
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">Target (%)</label>
              <input
                type="number"
                value={targetPercent}
                onChange={(e) => setTargetPercent(e.target.value)}
                className="trading-input w-full"
                step="0.1"
                min="0.1"
              />
              {entryPrice && (
                <p className="text-xs text-muted-foreground mt-1">
                  Target Price: ₹{targetPrice.toFixed(2)}
                </p>
              )}
            </div>

            {/* RR Indicator */}
            <div className={`p-3 rounded-lg border ${isRRValid ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm">Risk-Reward Ratio</span>
                <span className={`font-mono font-bold ${isRRValid ? 'text-success' : 'text-destructive'}`}>
                  1:{riskRewardRatio.toFixed(2)}
                </span>
              </div>
              {!isRRValid && (
                <p className="text-xs text-destructive mt-1">
                  Minimum required: 1:2 RR
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="trading-card">
          <h3 className="text-lg font-semibold mb-4">Position Sizing Result</h3>
          {result ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Quantity</p>
                  <p className="text-3xl font-mono font-bold text-primary">{result.quantity}</p>
                  <p className="text-xs text-muted-foreground">shares/units</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Position Size</p>
                  <p className="text-2xl font-mono font-bold">{formatCurrency(result.positionSize)}</p>
                </div>
              </div>

              <div className="data-grid">
                <div className="data-row">
                  <span className="text-muted-foreground">Margin Required</span>
                  <span className="font-mono">{formatCurrency(result.marginRequired)}</span>
                </div>
                <div className="data-row">
                  <span className="text-muted-foreground">Risk Amount</span>
                  <span className="font-mono text-warning">{formatCurrency(result.riskAmount)}</span>
                </div>
                <div className="data-row">
                  <span className="text-muted-foreground">Max Loss (@ SL)</span>
                  <span className="font-mono text-destructive">{formatCurrency(result.maxLoss)}</span>
                </div>
                <div className="data-row">
                  <span className="text-muted-foreground">Max Profit (@ Target)</span>
                  <span className="font-mono text-success">{formatCurrency(result.maxProfit * riskRewardRatio)}</span>
                </div>
              </div>

              {/* Trade Summary */}
              <div className="mt-4 p-4 bg-muted/20 rounded-lg">
                <h4 className="text-sm font-semibold mb-2">Trade Summary</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Entry: ₹{parseFloat(entryPrice).toLocaleString()}</p>
                  <p>• Stop Loss: ₹{stopLossPrice.toFixed(2)} (-{stopLossPercent}%)</p>
                  <p>• Target: ₹{targetPrice.toFixed(2)} (+{targetPercent}%)</p>
                  <p>• RR Ratio: 1:{riskRewardRatio.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Calculator className="w-12 h-12 mb-4 opacity-30" />
              <p>Enter trade parameters to calculate position size</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
