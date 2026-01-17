import React, { useState, useMemo } from 'react';
import { useTrading } from '@/context/TradingContext';
import { calculateRequiredMonthlyReturn, calculateCompounding } from '@/lib/riskEngine';
import { MetricCard } from '../MetricCard';
import { Target, Calendar, TrendingUp, Rocket, AlertTriangle } from 'lucide-react';

export function GrowthPlanner() {
  const { portfolio } = useTrading();
  const [targetCapital, setTargetCapital] = useState('1000000');
  const [months, setMonths] = useState('24');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const requiredMonthlyReturn = useMemo(() => {
    return calculateRequiredMonthlyReturn(
      portfolio.capital,
      parseFloat(targetCapital) || 0,
      parseInt(months) || 1
    );
  }, [portfolio.capital, targetCapital, months]);

  const projections = useMemo(() => {
    return calculateCompounding(portfolio.capital, requiredMonthlyReturn, parseInt(months) || 12);
  }, [portfolio.capital, requiredMonthlyReturn, months]);

  const isAchievable = requiredMonthlyReturn <= 10; // 10% monthly is very aggressive
  const isModerate = requiredMonthlyReturn <= 5;
  const isConservative = requiredMonthlyReturn <= 3;

  const getDifficultyLevel = () => {
    if (requiredMonthlyReturn <= 2) return { level: 'Conservative', color: 'text-success', difficulty: 'Achievable with consistent trading' };
    if (requiredMonthlyReturn <= 5) return { level: 'Moderate', color: 'text-primary', difficulty: 'Requires good discipline and skill' };
    if (requiredMonthlyReturn <= 10) return { level: 'Aggressive', color: 'text-warning', difficulty: 'Very challenging, high risk tolerance needed' };
    return { level: 'Unrealistic', color: 'text-destructive', difficulty: 'Consider adjusting timeline or target' };
  };

  const difficulty = getDifficultyLevel();

  // Milestone calculations
  const milestones = useMemo(() => {
    const target = parseFloat(targetCapital) || 0;
    const result = [];
    
    [0.25, 0.5, 0.75, 1].forEach(fraction => {
      const milestone = portfolio.capital + (target - portfolio.capital) * fraction;
      const projection = projections.find(p => p.capital >= milestone);
      result.push({
        fraction: fraction * 100,
        amount: milestone,
        month: projection?.month || parseInt(months),
      });
    });
    
    return result;
  }, [portfolio.capital, targetCapital, projections, months]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-2">Monthly Growth Planner</h2>
        <p className="text-muted-foreground">Plan your path to financial goals with realistic timelines</p>
      </div>

      {/* Input Controls */}
      <div className="trading-card">
        <div className="grid grid-cols-4 gap-6 items-end">
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Current Capital</label>
            <p className="text-2xl font-mono font-bold">{formatCurrency(portfolio.capital)}</p>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Target Capital (₹)</label>
            <input
              type="number"
              value={targetCapital}
              onChange={(e) => setTargetCapital(e.target.value)}
              className="trading-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Timeline (Months)</label>
            <input
              type="number"
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              className="trading-input w-full"
              min="1"
              max="120"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Growth Multiple</p>
            <p className="text-2xl font-mono font-bold text-primary">
              {(parseFloat(targetCapital) / portfolio.capital).toFixed(1)}x
            </p>
          </div>
        </div>
      </div>

      {/* Required Return */}
      <div className={`trading-card ${difficulty.level === 'Unrealistic' ? 'glow-destructive border-destructive/30' : 'glow-primary'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Required Monthly Return</p>
            <p className={`text-5xl font-mono font-bold ${difficulty.color}`}>
              {requiredMonthlyReturn.toFixed(2)}%
            </p>
            <p className="text-muted-foreground mt-2">{difficulty.difficulty}</p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${difficulty.color}`}>{difficulty.level}</p>
            <p className="text-sm text-muted-foreground mt-1">Difficulty Level</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Target Capital"
          value={formatCurrency(parseFloat(targetCapital) || 0)}
          icon={<Target className="w-4 h-4" />}
          variant="primary"
        />
        <MetricCard
          label="Total Gain Needed"
          value={formatCurrency((parseFloat(targetCapital) || 0) - portfolio.capital)}
        />
        <MetricCard
          label="Timeline"
          value={`${months} months`}
          subValue={`${(parseInt(months) / 12).toFixed(1)} years`}
          icon={<Calendar className="w-4 h-4" />}
        />
        <MetricCard
          label="CAGR Required"
          value={`${(Math.pow(parseFloat(targetCapital) / portfolio.capital, 12 / parseInt(months)) - 1) * 100}`.slice(0, 5) + '%'}
          icon={<TrendingUp className="w-4 h-4" />}
        />
      </div>

      {/* Milestones */}
      <div className="trading-card">
        <h3 className="text-lg font-semibold mb-4">Goal Milestones</h3>
        <div className="grid grid-cols-4 gap-4">
          {milestones.map((milestone) => (
            <div key={milestone.fraction} className="p-4 bg-secondary/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                {milestone.fraction}% of Goal
              </p>
              <p className="text-xl font-mono font-bold">{formatCurrency(milestone.amount)}</p>
              <p className="text-sm text-muted-foreground mt-2">Month {milestone.month}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Alternative Scenarios */}
      <div className="trading-card">
        <h3 className="text-lg font-semibold mb-4">Alternative Scenarios</h3>
        <div className="overflow-x-auto">
          <table className="table-trading">
            <thead>
              <tr>
                <th>Monthly Return</th>
                <th>Months to Target</th>
                <th>Years</th>
                <th>Final Capital</th>
                <th>Difficulty</th>
              </tr>
            </thead>
            <tbody>
              {[2, 3, 5, 7, 10, 15].map((rate) => {
                const projData = calculateCompounding(portfolio.capital, rate, 120);
                const target = parseFloat(targetCapital) || 0;
                const monthsNeeded = projData.find(p => p.capital >= target)?.month || 120;
                const finalCapital = projData.find(p => p.month === parseInt(months))?.capital || portfolio.capital;
                
                let diffLabel = '';
                let diffColor = '';
                if (rate <= 2) { diffLabel = 'Conservative'; diffColor = 'text-success'; }
                else if (rate <= 5) { diffLabel = 'Moderate'; diffColor = 'text-primary'; }
                else if (rate <= 10) { diffLabel = 'Aggressive'; diffColor = 'text-warning'; }
                else { diffLabel = 'Very Aggressive'; diffColor = 'text-destructive'; }
                
                return (
                  <tr key={rate} className={rate === Math.round(requiredMonthlyReturn) ? 'bg-primary/10' : ''}>
                    <td className="font-mono font-semibold">{rate}%</td>
                    <td className="font-mono">{monthsNeeded >= 120 ? '120+' : monthsNeeded}</td>
                    <td className="font-mono">{(monthsNeeded / 12).toFixed(1)}</td>
                    <td className="font-mono">{formatCurrency(finalCapital)}</td>
                    <td className={diffColor}>{diffLabel}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warning for unrealistic goals */}
      {!isAchievable && (
        <div className="trading-card bg-destructive/10 border-destructive/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-destructive mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">Unrealistic Goal</p>
              <p className="text-sm text-muted-foreground">
                A {requiredMonthlyReturn.toFixed(1)}% monthly return is extremely difficult to sustain. 
                Even top hedge funds average 15-25% annually. Consider:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 list-disc list-inside">
                <li>Extending your timeline</li>
                <li>Lowering your target capital</li>
                <li>Increasing your starting capital</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
