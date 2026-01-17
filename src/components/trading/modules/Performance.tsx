import React from 'react';
import { useTrading } from '@/context/TradingContext';
import { MetricCard } from '../MetricCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { BarChart3, Target, Percent, TrendingUp, Award, AlertTriangle } from 'lucide-react';

export function Performance() {
  const { metrics, trades } = useTrading();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const winLossData = [
    { name: 'Wins', value: metrics.winningTrades, color: 'hsl(145, 75%, 45%)' },
    { name: 'Losses', value: metrics.losingTrades, color: 'hsl(0, 72%, 55%)' },
  ];

  const getExpectancyGrade = () => {
    if (metrics.expectancy >= 500) return { grade: 'A+', color: 'text-success' };
    if (metrics.expectancy >= 250) return { grade: 'A', color: 'text-success' };
    if (metrics.expectancy >= 100) return { grade: 'B', color: 'text-primary' };
    if (metrics.expectancy >= 0) return { grade: 'C', color: 'text-warning' };
    return { grade: 'F', color: 'text-destructive' };
  };

  const getProfitFactorGrade = () => {
    if (metrics.profitFactor >= 3) return { grade: 'Excellent', color: 'text-success' };
    if (metrics.profitFactor >= 2) return { grade: 'Good', color: 'text-success' };
    if (metrics.profitFactor >= 1.5) return { grade: 'Fair', color: 'text-primary' };
    if (metrics.profitFactor >= 1) return { grade: 'Break-even', color: 'text-warning' };
    return { grade: 'Losing', color: 'text-destructive' };
  };

  const expectancyGrade = getExpectancyGrade();
  const pfGrade = getProfitFactorGrade();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-2">Win Rate & Expectancy Engine</h2>
        <p className="text-muted-foreground">Analyze your trading edge and statistical performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Win Rate"
          value={`${metrics.winRate.toFixed(1)}%`}
          subValue={`${metrics.winningTrades} wins`}
          variant={metrics.winRate >= 50 ? 'profit' : 'loss'}
          icon={<Percent className="w-4 h-4" />}
        />
        <MetricCard
          label="Expectancy"
          value={formatCurrency(metrics.expectancy)}
          subValue={`Grade: ${expectancyGrade.grade}`}
          variant={metrics.expectancy > 0 ? 'profit' : 'loss'}
          icon={<Target className="w-4 h-4" />}
        />
        <MetricCard
          label="Profit Factor"
          value={metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
          subValue={pfGrade.grade}
          variant={metrics.profitFactor >= 1.5 ? 'profit' : metrics.profitFactor >= 1 ? 'warning' : 'loss'}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <MetricCard
          label="Total Trades"
          value={metrics.totalTrades}
          subValue={`${metrics.winningTrades}W / ${metrics.losingTrades}L`}
          icon={<BarChart3 className="w-4 h-4" />}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Win/Loss Distribution */}
        <div className="trading-card">
          <h3 className="text-lg font-semibold mb-4">Win/Loss Distribution</h3>
          <div className="h-64">
            {metrics.totalTrades > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={winLossData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {winLossData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(220, 18%, 10%)',
                      border: '1px solid hsl(220, 15%, 18%)',
                      borderRadius: '8px',
                      color: 'hsl(210, 20%, 95%)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No trades to analyze
              </div>
            )}
          </div>
        </div>

        {/* Average Win/Loss */}
        <div className="trading-card">
          <h3 className="text-lg font-semibold mb-4">Average Trade Analysis</h3>
          <div className="space-y-6">
            <div className="p-4 bg-success/10 rounded-lg border border-success/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Average Win</span>
                <Award className="w-5 h-5 text-success" />
              </div>
              <p className="text-2xl font-mono font-bold text-success">
                {formatCurrency(metrics.avgWin)}
              </p>
            </div>

            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Average Loss</span>
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <p className="text-2xl font-mono font-bold text-destructive">
                {formatCurrency(metrics.avgLoss)}
              </p>
            </div>

            <div className="p-4 bg-secondary/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Win/Loss Ratio</span>
              </div>
              <p className="text-2xl font-mono font-bold">
                {metrics.avgLoss > 0 ? (metrics.avgWin / metrics.avgLoss).toFixed(2) : '∞'}:1
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Streaks */}
      <div className="trading-card">
        <h3 className="text-lg font-semibold mb-4">Streak Analysis</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-secondary/30 rounded-lg text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Max Win Streak</p>
            <p className="text-3xl font-mono font-bold text-success">{metrics.maxWinStreak}</p>
          </div>
          <div className="p-4 bg-secondary/30 rounded-lg text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Max Loss Streak</p>
            <p className="text-3xl font-mono font-bold text-destructive">{metrics.maxLossStreak}</p>
          </div>
          <div className="p-4 bg-secondary/30 rounded-lg text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Current Streak</p>
            <p className={`text-3xl font-mono font-bold ${
              metrics.streakType === 'WIN' ? 'text-success' : 
              metrics.streakType === 'LOSS' ? 'text-destructive' : 'text-muted-foreground'
            }`}>
              {metrics.currentStreak}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{metrics.streakType}</p>
          </div>
          <div className="p-4 bg-primary/10 rounded-lg text-center border border-primary/30">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Edge Score</p>
            <p className="text-3xl font-mono font-bold text-primary">
              {((metrics.winRate / 100) * (metrics.avgWin / Math.max(metrics.avgLoss, 1))).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Expectancy Formula */}
      <div className="trading-card">
        <h3 className="text-lg font-semibold mb-4">Expectancy Formula Breakdown</h3>
        <div className="p-4 bg-muted/20 rounded-lg font-mono text-sm">
          <p className="text-muted-foreground mb-2">Expectancy = (Win Rate × Avg Win) - (Loss Rate × Avg Loss)</p>
          <p className="text-lg">
            E = ({metrics.winRate.toFixed(1)}% × {formatCurrency(metrics.avgWin)}) - 
            ({(100 - metrics.winRate).toFixed(1)}% × {formatCurrency(metrics.avgLoss)})
          </p>
          <p className={`text-2xl mt-2 font-bold ${metrics.expectancy > 0 ? 'text-success' : 'text-destructive'}`}>
            = {formatCurrency(metrics.expectancy)} per trade
          </p>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          {metrics.expectancy > 0 
            ? `✓ Positive expectancy: You have a statistical edge. Keep trading your system.`
            : `✗ Negative expectancy: Your system needs adjustment. Review your risk-reward or win rate.`
          }
        </p>
      </div>
    </div>
  );
}
