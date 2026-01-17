import React, { useState, useMemo } from 'react';
import { useTrading } from '@/context/TradingContext';
import { calculateCompounding } from '@/lib/riskEngine';
import { MetricCard } from '../MetricCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, Calendar, Target, Rocket } from 'lucide-react';

export function Compounding() {
  const { portfolio } = useTrading();
  const [monthlyReturn, setMonthlyReturn] = useState('5');
  const [years, setYears] = useState('5');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const projections = useMemo(() => {
    const months = parseInt(years) * 12 || 12;
    const returnRate = parseFloat(monthlyReturn) || 0;
    return calculateCompounding(portfolio.capital, returnRate, months);
  }, [portfolio.capital, monthlyReturn, years]);

  // Key milestones
  const year1 = projections[11] || projections[projections.length - 1];
  const year3 = projections[35] || projections[projections.length - 1];
  const year5 = projections[59] || projections[projections.length - 1];
  const finalProjection = projections[projections.length - 1];

  const totalReturn = finalProjection ? ((finalProjection.capital - portfolio.capital) / portfolio.capital) * 100 : 0;
  const cagr = finalProjection 
    ? (Math.pow(finalProjection.capital / portfolio.capital, 1 / parseInt(years)) - 1) * 100 
    : 0;

  // Chart data - sample every year for cleaner display
  const chartData = useMemo(() => {
    const data = [{ year: 0, capital: portfolio.capital }];
    for (let i = 11; i < projections.length; i += 12) {
      data.push({
        year: Math.floor((i + 1) / 12),
        capital: Math.round(projections[i].capital),
      });
    }
    return data;
  }, [projections, portfolio.capital]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-2">Compounding Engine</h2>
        <p className="text-muted-foreground">Project your wealth growth with consistent returns</p>
      </div>

      {/* Input Controls */}
      <div className="trading-card">
        <div className="grid grid-cols-4 gap-6 items-end">
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Starting Capital</label>
            <p className="text-2xl font-mono font-bold text-primary">{formatCurrency(portfolio.capital)}</p>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Monthly Return (%)</label>
            <input
              type="number"
              value={monthlyReturn}
              onChange={(e) => setMonthlyReturn(e.target.value)}
              className="trading-input w-full"
              step="0.5"
              min="0.5"
              max="20"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Projection Period (Years)</label>
            <select
              value={years}
              onChange={(e) => setYears(e.target.value)}
              className="trading-input w-full"
            >
              <option value="1">1 Year</option>
              <option value="3">3 Years</option>
              <option value="5">5 Years</option>
              <option value="10">10 Years</option>
            </select>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">CAGR Equivalent</p>
            <p className="text-2xl font-mono font-bold text-success">{cagr.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Key Projections */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Year 1 Capital"
          value={formatCurrency(year1?.capital || portfolio.capital)}
          subValue={`+${formatCurrency((year1?.capital || portfolio.capital) - portfolio.capital)}`}
          variant="primary"
          icon={<Calendar className="w-4 h-4" />}
        />
        <MetricCard
          label="Year 3 Capital"
          value={formatCurrency(year3?.capital || portfolio.capital)}
          variant="profit"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <MetricCard
          label="Year 5 Capital"
          value={formatCurrency(year5?.capital || portfolio.capital)}
          variant="profit"
          icon={<Target className="w-4 h-4" />}
        />
        <MetricCard
          label="Final Value"
          value={formatCurrency(finalProjection?.capital || portfolio.capital)}
          subValue={`${totalReturn.toFixed(0)}% total return`}
          variant="profit"
          icon={<Rocket className="w-4 h-4" />}
        />
      </div>

      {/* Growth Chart */}
      <div className="trading-card">
        <h3 className="text-lg font-semibold mb-4">Capital Growth Projection</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="capitalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(145, 75%, 45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(145, 75%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
              <XAxis 
                dataKey="year" 
                tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(220, 15%, 18%)' }}
                label={{ value: 'Years', position: 'bottom', fill: 'hsl(215, 15%, 55%)' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(220, 15%, 18%)' }}
                tickFormatter={(v) => v >= 10000000 ? `₹${(v / 10000000).toFixed(1)}Cr` : `₹${(v / 100000).toFixed(0)}L`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(220, 18%, 10%)',
                  border: '1px solid hsl(220, 15%, 18%)',
                  borderRadius: '8px',
                  color: 'hsl(210, 20%, 95%)',
                }}
                formatter={(value: number) => [formatCurrency(value), 'Capital']}
                labelFormatter={(label) => `Year ${label}`}
              />
              <Area
                type="monotone"
                dataKey="capital"
                stroke="hsl(145, 75%, 45%)"
                strokeWidth={2}
                fill="url(#capitalGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="trading-card">
        <h3 className="text-lg font-semibold mb-4">Monthly Growth Table (First 12 Months)</h3>
        <div className="overflow-x-auto">
          <table className="table-trading">
            <thead>
              <tr>
                <th>Month</th>
                <th>Starting Capital</th>
                <th>Monthly Profit</th>
                <th>Ending Capital</th>
                <th>Cumulative Growth</th>
              </tr>
            </thead>
            <tbody>
              {projections.slice(0, 12).map((proj, i) => {
                const startCapital = i === 0 ? portfolio.capital : projections[i - 1].capital;
                const growthPercent = ((proj.capital - portfolio.capital) / portfolio.capital) * 100;
                
                return (
                  <tr key={proj.month}>
                    <td className="font-semibold">Month {proj.month}</td>
                    <td className="font-mono">{formatCurrency(startCapital)}</td>
                    <td className="font-mono text-success">+{formatCurrency(proj.profit)}</td>
                    <td className="font-mono font-semibold">{formatCurrency(proj.capital)}</td>
                    <td className="font-mono text-primary">+{growthPercent.toFixed(2)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Power of Compounding */}
      <div className="trading-card bg-gradient-to-r from-primary/10 to-success/10 border-primary/30">
        <h3 className="text-lg font-semibold mb-2">The Power of Compounding</h3>
        <p className="text-muted-foreground text-sm mb-4">
          With consistent {monthlyReturn}% monthly returns, your capital multiplies exponentially over time.
        </p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Starting</p>
            <p className="text-xl font-mono font-bold">{formatCurrency(portfolio.capital)}</p>
          </div>
          <div className="text-3xl text-muted-foreground">→</div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">After {years} Years</p>
            <p className="text-xl font-mono font-bold text-success">{formatCurrency(finalProjection?.capital || 0)}</p>
            <p className="text-sm text-success mt-1">
              {(finalProjection ? finalProjection.capital / portfolio.capital : 1).toFixed(1)}x growth
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
