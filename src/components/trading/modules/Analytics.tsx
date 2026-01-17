import React, { useMemo } from 'react';
import { useTrading } from '@/context/TradingContext';
import { MetricCard } from '../MetricCard';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ComposedChart, Line
} from 'recharts';
import { TrendingUp, Calendar, BarChart3, Activity } from 'lucide-react';

export function Analytics() {
  const { trades, portfolio } = useTrading();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate daily P&L data
  const dailyData = useMemo(() => {
    const closedTrades = trades.filter(t => t.status === 'CLOSED' && t.pnl !== undefined);
    const dataByDate: Record<string, number> = {};

    closedTrades.forEach(trade => {
      if (!dataByDate[trade.date]) {
        dataByDate[trade.date] = 0;
      }
      dataByDate[trade.date] += trade.pnl ?? 0;
    });

    return Object.entries(dataByDate).map(([date, pnl]) => ({
      date,
      pnl,
      color: pnl >= 0 ? 'hsl(145, 75%, 45%)' : 'hsl(0, 72%, 55%)',
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [trades]);

  // Calculate weekly P&L
  const weeklyData = useMemo(() => {
    const closedTrades = trades.filter(t => t.status === 'CLOSED' && t.pnl !== undefined);
    const dataByWeek: Record<string, number> = {};

    closedTrades.forEach(trade => {
      const date = new Date(trade.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!dataByWeek[weekKey]) {
        dataByWeek[weekKey] = 0;
      }
      dataByWeek[weekKey] += trade.pnl ?? 0;
    });

    return Object.entries(dataByWeek).map(([week, pnl]) => ({
      week: `W${week.slice(5, 7)}/${week.slice(8, 10)}`,
      pnl,
    })).slice(-12);
  }, [trades]);

  // Calculate monthly P&L
  const monthlyData = useMemo(() => {
    const closedTrades = trades.filter(t => t.status === 'CLOSED' && t.pnl !== undefined);
    const dataByMonth: Record<string, number> = {};

    closedTrades.forEach(trade => {
      const monthKey = trade.date.slice(0, 7);

      if (!dataByMonth[monthKey]) {
        dataByMonth[monthKey] = 0;
      }
      dataByMonth[monthKey] += trade.pnl ?? 0;
    });

    return Object.entries(dataByMonth).map(([month, pnl]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      pnl,
    })).slice(-12);
  }, [trades]);

  // Equity curve data
  const equityCurveData = useMemo(() => {
    let equity = portfolio.capital;
    const data = [{ trade: 0, equity, date: 'Start' }];
    
    const closedTrades = trades.filter(t => t.status === 'CLOSED' && t.pnl);
    closedTrades.forEach((trade, i) => {
      equity += trade.pnl ?? 0;
      data.push({
        trade: i + 1,
        equity: Math.round(equity),
        date: trade.date,
      });
    });
    
    return data;
  }, [trades, portfolio.capital]);

  // Drawdown data
  const drawdownData = useMemo(() => {
    let peak = portfolio.capital;
    let equity = portfolio.capital;
    const data: { trade: number; drawdown: number }[] = [{ trade: 0, drawdown: 0 }];
    
    const closedTrades = trades.filter(t => t.status === 'CLOSED' && t.pnl);
    closedTrades.forEach((trade, i) => {
      equity += trade.pnl ?? 0;
      if (equity > peak) peak = equity;
      const drawdown = ((peak - equity) / peak) * 100;
      data.push({
        trade: i + 1,
        drawdown: drawdown,
      });
    });
    
    return data;
  }, [trades, portfolio.capital]);

  const totalPnL = trades.filter(t => t.status === 'CLOSED').reduce((sum, t) => sum + (t.pnl ?? 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-2">P&L Analytics Dashboard</h2>
        <p className="text-muted-foreground">Comprehensive performance analysis and visualization</p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Total P&L"
          value={formatCurrency(totalPnL)}
          variant={totalPnL >= 0 ? 'profit' : 'loss'}
          trend={totalPnL >= 0 ? 'up' : 'down'}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <MetricCard
          label="Daily P&L"
          value={formatCurrency(portfolio.dailyPnL)}
          variant={portfolio.dailyPnL >= 0 ? 'profit' : 'loss'}
          icon={<Calendar className="w-4 h-4" />}
        />
        <MetricCard
          label="Weekly P&L"
          value={formatCurrency(portfolio.weeklyPnL)}
          variant={portfolio.weeklyPnL >= 0 ? 'profit' : 'loss'}
        />
        <MetricCard
          label="Monthly P&L"
          value={formatCurrency(portfolio.monthlyPnL)}
          variant={portfolio.monthlyPnL >= 0 ? 'profit' : 'loss'}
        />
      </div>

      {/* Charts Grid */}
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
                  dataKey="trade" 
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

        {/* Drawdown Chart */}
        <div className="trading-card">
          <h3 className="text-lg font-semibold mb-4">Drawdown History</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={drawdownData}>
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
                  tickFormatter={(v) => `${v.toFixed(1)}%`}
                  reversed
                />
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

        {/* Daily P&L */}
        <div className="trading-card">
          <h3 className="text-lg font-semibold mb-4">Daily P&L</h3>
          <div className="h-64">
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }}
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
                    formatter={(value: number) => [formatCurrency(value), 'P&L']}
                  />
                  <Bar 
                    dataKey="pnl" 
                    fill="hsl(170, 85%, 50%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Monthly P&L */}
        <div className="trading-card">
          <h3 className="text-lg font-semibold mb-4">Monthly P&L</h3>
          <div className="h-64">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                  <XAxis 
                    dataKey="month" 
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
                    formatter={(value: number) => [formatCurrency(value), 'P&L']}
                  />
                  <Bar 
                    dataKey="pnl" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
