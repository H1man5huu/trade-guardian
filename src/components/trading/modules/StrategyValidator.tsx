import React, { useState, useMemo } from 'react';
import { useTrading } from '@/context/TradingContext';
import { validateTrade } from '@/lib/riskEngine';
import { CheckCircle, XCircle, AlertTriangle, Shield, Calculator } from 'lucide-react';

export function StrategyValidator() {
  const { portfolio, riskLimits } = useTrading();
  
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [target, setTarget] = useState('');
  const [quantity, setQuantity] = useState('');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const validation = useMemo(() => {
    const entry = parseFloat(entryPrice) || 0;
    const sl = parseFloat(stopLoss) || 0;
    const tgt = parseFloat(target) || 0;
    const qty = parseInt(quantity) || 0;

    if (!entry || !sl || !tgt || !qty) return null;

    const slPercent = Math.abs((entry - sl) / entry) * 100;
    const targetPercent = Math.abs((tgt - entry) / entry) * 100;
    const riskReward = slPercent > 0 ? targetPercent / slPercent : 0;
    const riskAmount = Math.abs(entry - sl) * qty;
    const riskPercent = (riskAmount / portfolio.capital) * 100;

    const result = validateTrade(riskReward, riskPercent, riskLimits, portfolio);

    return {
      ...result,
      riskReward,
      riskPercent,
      riskAmount,
      potentialProfit: Math.abs(tgt - entry) * qty,
      slPercent,
      targetPercent,
    };
  }, [entryPrice, stopLoss, target, quantity, portfolio, riskLimits]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-2">Strategy Validator</h2>
        <p className="text-muted-foreground">Validate trades before execution against institutional risk rules</p>
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
                placeholder="e.g., 2500"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Stop Loss (₹)</label>
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="trading-input w-full"
                placeholder="e.g., 2475"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Target (₹)</label>
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="trading-input w-full"
                placeholder="e.g., 2550"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="trading-input w-full"
                placeholder="e.g., 100"
              />
            </div>
          </div>
        </div>

        {/* Validation Result */}
        <div className="trading-card">
          <h3 className="text-lg font-semibold mb-4">Validation Result</h3>
          {validation ? (
            <div className="space-y-4">
              {/* Main Status */}
              <div className={`p-4 rounded-lg border ${
                validation.isValid 
                  ? 'bg-success/10 border-success/30' 
                  : 'bg-destructive/10 border-destructive/30'
              }`}>
                <div className="flex items-center gap-3">
                  {validation.isValid ? (
                    <CheckCircle className="w-8 h-8 text-success" />
                  ) : (
                    <XCircle className="w-8 h-8 text-destructive" />
                  )}
                  <div>
                    <p className={`text-xl font-bold ${validation.isValid ? 'text-success' : 'text-destructive'}`}>
                      {validation.isValid ? 'TRADE APPROVED' : 'TRADE REJECTED'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {validation.isValid 
                        ? 'This trade meets all risk criteria'
                        : `${validation.errors.length} rule violation(s) detected`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Trade Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-lg ${validation.riskReward >= 2 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  <p className="text-xs text-muted-foreground">Risk-Reward</p>
                  <p className={`text-xl font-mono font-bold ${validation.riskReward >= 2 ? 'text-success' : 'text-destructive'}`}>
                    1:{validation.riskReward.toFixed(2)}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${validation.riskPercent <= riskLimits.riskPerTrade ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  <p className="text-xs text-muted-foreground">Risk %</p>
                  <p className={`text-xl font-mono font-bold ${validation.riskPercent <= riskLimits.riskPerTrade ? 'text-success' : 'text-destructive'}`}>
                    {validation.riskPercent.toFixed(2)}%
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-destructive/10">
                  <p className="text-xs text-muted-foreground">Max Loss</p>
                  <p className="text-xl font-mono font-bold text-destructive">
                    {formatCurrency(validation.riskAmount)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-success/10">
                  <p className="text-xs text-muted-foreground">Potential Profit</p>
                  <p className="text-xl font-mono font-bold text-success">
                    {formatCurrency(validation.potentialProfit)}
                  </p>
                </div>
              </div>

              {/* Errors */}
              {validation.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-destructive">Rule Violations:</p>
                  {validation.errors.map((error, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-destructive/10 rounded-lg">
                      <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{error}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {validation.warnings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-warning">Warnings:</p>
                  {validation.warnings.map((warning, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-warning/10 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{warning}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Calculator className="w-12 h-12 mb-4 opacity-30" />
              <p>Enter trade parameters to validate</p>
            </div>
          )}
        </div>
      </div>

      {/* Validation Rules */}
      <div className="trading-card">
        <h3 className="text-lg font-semibold mb-4">Validation Rules</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
              <Shield className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Minimum RR Ratio</p>
                <p className="text-xs text-muted-foreground">
                  Trade must have at least 1:2 risk-reward ratio
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
              <Shield className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Risk Per Trade Limit</p>
                <p className="text-xs text-muted-foreground">
                  Maximum {riskLimits.riskPerTrade}% of capital per trade
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
              <Shield className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Daily Loss Check</p>
                <p className="text-xs text-muted-foreground">
                  No new trades if daily loss exceeds {riskLimits.dailyLossLimit}%
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
              <Shield className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Weekly Loss Check</p>
                <p className="text-xs text-muted-foreground">
                  No new trades if weekly loss exceeds {riskLimits.weeklyLossLimit}%
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
              <Shield className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Monthly Loss Check</p>
                <p className="text-xs text-muted-foreground">
                  No new trades if monthly loss exceeds {riskLimits.monthlyLossLimit}%
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
              <Shield className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Drawdown Limit</p>
                <p className="text-xs text-muted-foreground">
                  Trading halted if drawdown exceeds 20%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
