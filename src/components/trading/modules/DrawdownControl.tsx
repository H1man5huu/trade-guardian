import React from 'react';
import { useTrading } from '@/context/TradingContext';
import { getAdjustedRiskForDrawdown } from '@/lib/riskEngine';
import { MetricCard } from '../MetricCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Shield, AlertTriangle, Target, TrendingDown, Lock } from 'lucide-react';

export function DrawdownControl() {
  const { portfolio, trades, riskLimits, lockTrading, unlockTrading } = useTrading();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const adjustedRisk = getAdjustedRiskForDrawdown(riskLimits.riskPerTrade, portfolio.drawdown);
  const riskReduction = ((riskLimits.riskPerTrade - adjustedRisk) / riskLimits.riskPerTrade) * 100;

  // Drawdown history
  const drawdownHistory = React.useMemo(() => {
    let peak = portfolio.capital;
    let equity = portfolio.capital;
    const data: { trade: number; drawdown: number; equity: number }[] = [{ trade: 0, drawdown: 0, equity: portfolio.capital }];
    
    const closedTrades = trades.filter(t => t.status === 'CLOSED' && t.pnl);
    closedTrades.forEach((trade, i) => {
      equity += trade.pnl ?? 0;
      if (equity > peak) peak = equity;
      const drawdown = ((peak - equity) / peak) * 100;
      data.push({
        trade: i + 1,
        drawdown,
        equity,
      });
    });
    
    return data;
  }, [trades, portfolio.capital]);

  const getDrawdownLevel = (dd: number) => {
    if (dd < 5) return { level: 'Safe', color: 'text-success', bg: 'bg-success/10' };
    if (dd < 10) return { level: 'Caution', color: 'text-warning', bg: 'bg-warning/10' };
    if (dd < 15) return { level: 'Warning', color: 'text-orange-500', bg: 'bg-orange-500/10' };
    if (dd < 20) return { level: 'Critical', color: 'text-destructive', bg: 'bg-destructive/10' };
    return { level: 'STOP', color: 'text-destructive', bg: 'bg-destructive/20' };
  };

  const currentLevel = getDrawdownLevel(portfolio.drawdown);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-2">Drawdown Control Engine</h2>
        <p className="text-muted-foreground">Automatic risk adjustment based on drawdown levels</p>
      </div>

      {/* Current Status */}
      <div className={`trading-card ${currentLevel.bg} border-current`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${currentLevel.bg}`}>
              {portfolio.drawdown >= 15 ? (
                <AlertTriangle className={`w-8 h-8 ${currentLevel.color}`} />
              ) : (
                <Shield className={`w-8 h-8 ${currentLevel.color}`} />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Drawdown Level</p>
              <p className={`text-3xl font-bold ${currentLevel.color}`}>
                {currentLevel.level}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-mono font-bold">{portfolio.drawdown.toFixed(2)}%</p>
            <p className="text-sm text-muted-foreground">from peak</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Peak Equity"
          value={formatCurrency(portfolio.peakEquity)}
          icon={<Target className="w-4 h-4" />}
        />
        <MetricCard
          label="Current Equity"
          value={formatCurrency(portfolio.currentEquity)}
          variant={portfolio.currentEquity >= portfolio.peakEquity ? 'profit' : 'loss'}
        />
        <MetricCard
          label="Max Drawdown"
          value={`${portfolio.maxDrawdown.toFixed(2)}%`}
          variant={portfolio.maxDrawdown > 15 ? 'loss' : portfolio.maxDrawdown > 10 ? 'warning' : 'default'}
          icon={<TrendingDown className="w-4 h-4" />}
        />
        <MetricCard
          label="Loss from Peak"
          value={formatCurrency(portfolio.peakEquity - portfolio.currentEquity)}
          variant="loss"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Risk Adjustment */}
        <div className="trading-card">
          <h3 className="text-lg font-semibold mb-4">Automatic Risk Adjustment</h3>
          <div className="space-y-4">
            <div className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Base Risk</span>
                <span className="font-mono font-semibold">{riskLimits.riskPerTrade}%</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Adjusted Risk</span>
                <span className={`font-mono font-semibold ${adjustedRisk < riskLimits.riskPerTrade ? 'text-warning' : 'text-success'}`}>
                  {adjustedRisk.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Risk Reduction</span>
                <span className={`font-mono font-semibold ${riskReduction > 0 ? 'text-destructive' : 'text-success'}`}>
                  {riskReduction > 0 ? `-${riskReduction.toFixed(0)}%` : 'None'}
                </span>
              </div>
            </div>

            {/* Risk Levels */}
            <div className="space-y-2">
              {[
                { dd: '< 5%', risk: '100%', level: 'Full risk' },
                { dd: '5-10%', risk: '75%', level: 'Reduced risk' },
                { dd: '10-15%', risk: '50%', level: 'Half risk' },
                { dd: '15-20%', risk: '25%', level: 'Minimum risk' },
                { dd: '> 20%', risk: '0%', level: 'STOP trading' },
              ].map((tier, i) => {
                const isActive = 
                  (i === 0 && portfolio.drawdown < 5) ||
                  (i === 1 && portfolio.drawdown >= 5 && portfolio.drawdown < 10) ||
                  (i === 2 && portfolio.drawdown >= 10 && portfolio.drawdown < 15) ||
                  (i === 3 && portfolio.drawdown >= 15 && portfolio.drawdown < 20) ||
                  (i === 4 && portfolio.drawdown >= 20);
                
                return (
                  <div
                    key={tier.dd}
                    className={`flex justify-between items-center p-2 rounded ${
                      isActive ? 'bg-primary/20 border border-primary/50' : 'bg-secondary/20'
                    }`}
                  >
                    <span className="text-sm">{tier.dd} drawdown</span>
                    <span className="text-sm font-mono">{tier.risk} → {tier.level}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Drawdown Chart */}
        <div className="trading-card">
          <h3 className="text-lg font-semibold mb-4">Drawdown History</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={drawdownHistory}>
                <defs>
                  <linearGradient id="ddGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                <XAxis 
                  dataKey="trade" 
                  tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(220, 15%, 18%)' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(220, 15%, 18%)' }}
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  reversed
                  domain={[0, 'auto']}
                />
                <ReferenceLine y={10} stroke="hsl(38, 92%, 55%)" strokeDasharray="5 5" label={{ value: '10%', fill: 'hsl(38, 92%, 55%)', fontSize: 10 }} />
                <ReferenceLine y={20} stroke="hsl(0, 72%, 55%)" strokeDasharray="5 5" label={{ value: '20%', fill: 'hsl(0, 72%, 55%)', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(220, 18%, 10%)',
                    border: '1px solid hsl(220, 15%, 18%)',
                    borderRadius: '8px',
                    color: 'hsl(210, 20%, 95%)',
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Drawdown']}
                />
                <Area
                  type="monotone"
                  dataKey="drawdown"
                  stroke="hsl(0, 72%, 55%)"
                  strokeWidth={2}
                  fill="url(#ddGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recovery Analysis */}
      <div className="trading-card">
        <h3 className="text-lg font-semibold mb-4">Recovery Analysis</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-secondary/30 rounded-lg text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Amount to Recover</p>
            <p className="text-2xl font-mono font-bold text-destructive">
              {formatCurrency(portfolio.peakEquity - portfolio.currentEquity)}
            </p>
          </div>
          <div className="p-4 bg-secondary/30 rounded-lg text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Return Needed</p>
            <p className="text-2xl font-mono font-bold text-warning">
              {portfolio.currentEquity > 0 
                ? `${(((portfolio.peakEquity - portfolio.currentEquity) / portfolio.currentEquity) * 100).toFixed(1)}%`
                : '0%'
              }
            </p>
          </div>
          <div className="p-4 bg-secondary/30 rounded-lg text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Trades Needed*</p>
            <p className="text-2xl font-mono font-bold">
              {portfolio.peakEquity > portfolio.currentEquity && riskLimits.riskPerTrade > 0
                ? Math.ceil((portfolio.peakEquity - portfolio.currentEquity) / (portfolio.capital * riskLimits.riskPerTrade / 100 * 2))
                : 0
              }
            </p>
            <p className="text-xs text-muted-foreground mt-1">*at 1:2 RR</p>
          </div>
          <div className="p-4 bg-success/10 rounded-lg text-center border border-success/30">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Days at 1%/day</p>
            <p className="text-2xl font-mono font-bold text-success">
              {portfolio.currentEquity > 0 
                ? Math.ceil(Math.log(portfolio.peakEquity / portfolio.currentEquity) / Math.log(1.01))
                : 0
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
