import React from 'react';
import { useTrading } from '@/context/TradingContext';
import { MetricCard } from '../MetricCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Target, Shield, Activity, Calendar, BarChart3 } from 'lucide-react';

export function Dashboard() {
  const { portfolio, trades, metrics, riskLimits } = useTrading();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Generate equity curve data
  const equityCurveData = React.useMemo(() => {
    let equity = portfolio.capital;
    const data = [{ date: 'Start', equity }];
    
    const closedTrades = trades.filter(t => t.status === 'CLOSED' && t.pnl);
    closedTrades.forEach((trade, i) => {
      equity += trade.pnl ?? 0;
      data.push({
        date: `Trade ${i + 1}`,
        equity: Math.round(equity),
      });
    });
    
    return data;
  }, [trades, portfolio.capital]);

  // Calculate P&L percentages
  const dailyLossPercent = portfolio.capital > 0 
    ? (Math.abs(Math.min(0, portfolio.dailyPnL)) / portfolio.capital) * 100 
    : 0;
  const weeklyLossPercent = portfolio.capital > 0 
    ? (Math.abs(Math.min(0, portfolio.weeklyPnL)) / portfolio.capital) * 100 
    : 0;
  const monthlyLossPercent = portfolio.capital > 0 
    ? (Math.abs(Math.min(0, portfolio.monthlyPnL)) / portfolio.capital) * 100 
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Capital"
          value={formatCurrency(portfolio.capital)}
          subValue={`${portfolio.leverage}x Leverage`}
          variant="primary"
          icon={<Wallet className="w-4 h-4" />}
        />
        <MetricCard
          label="Current Equity"
          value={formatCurrency(portfolio.currentEquity)}
          subValue={`Peak: ${formatCurrency(portfolio.peakEquity)}`}
          trend={portfolio.currentEquity >= portfolio.capital ? 'up' : 'down'}
          variant={portfolio.currentEquity >= portfolio.capital ? 'profit' : 'loss'}
          icon={<Activity className="w-4 h-4" />}
        />
        <MetricCard
          label="Daily P&L"
          value={formatCurrency(portfolio.dailyPnL)}
          subValue={`Limit: ${riskLimits.dailyLossLimit}%`}
          trend={portfolio.dailyPnL >= 0 ? 'up' : 'down'}
          variant={portfolio.dailyPnL >= 0 ? 'profit' : 'loss'}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <MetricCard
          label="Max Drawdown"
          value={`${portfolio.maxDrawdown.toFixed(2)}%`}
          subValue={`Current: ${portfolio.drawdown.toFixed(2)}%`}
          variant={portfolio.drawdown > 10 ? 'loss' : portfolio.drawdown > 5 ? 'warning' : 'default'}
          icon={<Target className="w-4 h-4" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Equity Curve */}
        <div className="trading-card">
          <h3 className="text-lg font-semibold mb-4">Equity Curve</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityCurveData}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(170, 85%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(170, 85%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(220, 15%, 18%)' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(220, 15%, 18%)' }}
                  tickFormatter={(v) => `₹${(v / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(220, 18%, 10%)',
                    border: '1px solid hsl(220, 15%, 18%)',
                    borderRadius: '8px',
                    color: 'hsl(210, 20%, 95%)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Equity']}
                />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="hsl(170, 85%, 50%)"
                  strokeWidth={2}
                  fill="url(#equityGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Limits Progress */}
        <div className="trading-card">
          <h3 className="text-lg font-semibold mb-4">Risk Limits Status</h3>
          <div className="space-y-6">
            {/* Daily Loss */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Daily Loss</span>
                <span className={dailyLossPercent > riskLimits.dailyLossLimit * 0.8 ? 'text-warning' : ''}>
                  {dailyLossPercent.toFixed(2)}% / {riskLimits.dailyLossLimit}%
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${
                    dailyLossPercent >= riskLimits.dailyLossLimit 
                      ? 'bg-destructive' 
                      : dailyLossPercent > riskLimits.dailyLossLimit * 0.8 
                        ? 'bg-warning' 
                        : 'bg-success'
                  }`}
                  style={{ width: `${Math.min((dailyLossPercent / riskLimits.dailyLossLimit) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Weekly Loss */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Weekly Loss</span>
                <span className={weeklyLossPercent > riskLimits.weeklyLossLimit * 0.8 ? 'text-warning' : ''}>
                  {weeklyLossPercent.toFixed(2)}% / {riskLimits.weeklyLossLimit}%
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${
                    weeklyLossPercent >= riskLimits.weeklyLossLimit 
                      ? 'bg-destructive' 
                      : weeklyLossPercent > riskLimits.weeklyLossLimit * 0.8 
                        ? 'bg-warning' 
                        : 'bg-success'
                  }`}
                  style={{ width: `${Math.min((weeklyLossPercent / riskLimits.weeklyLossLimit) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Monthly Loss */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Monthly Loss</span>
                <span className={monthlyLossPercent > riskLimits.monthlyLossLimit * 0.8 ? 'text-warning' : ''}>
                  {monthlyLossPercent.toFixed(2)}% / {riskLimits.monthlyLossLimit}%
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${
                    monthlyLossPercent >= riskLimits.monthlyLossLimit 
                      ? 'bg-destructive' 
                      : monthlyLossPercent > riskLimits.monthlyLossLimit * 0.8 
                        ? 'bg-warning' 
                        : 'bg-success'
                  }`}
                  style={{ width: `${Math.min((monthlyLossPercent / riskLimits.monthlyLossLimit) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Win Rate"
          value={`${metrics.winRate.toFixed(1)}%`}
          subValue={`${metrics.winningTrades}W / ${metrics.losingTrades}L`}
          variant={metrics.winRate >= 50 ? 'profit' : 'loss'}
          icon={<BarChart3 className="w-4 h-4" />}
        />
        <MetricCard
          label="Profit Factor"
          value={metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
          variant={metrics.profitFactor >= 1.5 ? 'profit' : metrics.profitFactor >= 1 ? 'warning' : 'loss'}
        />
        <MetricCard
          label="Expectancy"
          value={formatCurrency(metrics.expectancy)}
          subValue="Per trade"
          variant={metrics.expectancy > 0 ? 'profit' : 'loss'}
        />
        <MetricCard
          label="Total Trades"
          value={metrics.totalTrades}
          subValue={`Current streak: ${metrics.currentStreak} ${metrics.streakType}`}
        />
      </div>

      {/* Recent Trades */}
      <div className="trading-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Trades</h3>
          <span className="text-sm text-muted-foreground">{trades.length} total</span>
        </div>
        {trades.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No trades recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-trading">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Instrument</th>
                  <th>Side</th>
                  <th>Entry</th>
                  <th>Exit</th>
                  <th>P&L</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(-5).reverse().map((trade) => (
                  <tr key={trade.id}>
                    <td>{trade.date}</td>
                    <td className="font-semibold">{trade.instrument}</td>
                    <td>
                      <span className={trade.side === 'LONG' ? 'text-success' : 'text-destructive'}>
                        {trade.side}
                      </span>
                    </td>
                    <td>₹{trade.entryPrice.toLocaleString()}</td>
                    <td>{trade.exitPrice ? `₹${trade.exitPrice.toLocaleString()}` : '-'}</td>
                    <td className={trade.pnl ? (trade.pnl > 0 ? 'text-success' : 'text-destructive') : ''}>
                      {trade.pnl ? formatCurrency(trade.pnl) : '-'}
                    </td>
                    <td>
                      <span className={`text-xs px-2 py-1 rounded ${
                        trade.status === 'OPEN' ? 'bg-primary/20 text-primary' :
                        trade.status === 'CLOSED' ? 'bg-muted text-muted-foreground' :
                        'bg-warning/20 text-warning'
                      }`}>
                        {trade.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
