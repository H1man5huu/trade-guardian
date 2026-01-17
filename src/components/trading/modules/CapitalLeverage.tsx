import React, { useState } from 'react';
import { useTrading } from '@/context/TradingContext';
import { MetricCard } from '../MetricCard';
import { Wallet, Scale, TrendingUp, Percent } from 'lucide-react';

export function CapitalLeverage() {
  const { portfolio, updatePortfolio } = useTrading();
  const [capital, setCapital] = useState(portfolio.capital.toString());
  const [customLeverage, setCustomLeverage] = useState('');

  const leverageOptions = [1, 2, 3, 5, 10];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleCapitalUpdate = () => {
    const newCapital = parseFloat(capital);
    if (!isNaN(newCapital) && newCapital > 0) {
      updatePortfolio({ 
        capital: newCapital,
        currentEquity: newCapital,
        peakEquity: newCapital,
      });
    }
  };

  const handleLeverageChange = (leverage: number) => {
    updatePortfolio({ leverage });
    setCustomLeverage('');
  };

  const handleCustomLeverage = () => {
    const leverage = parseFloat(customLeverage);
    if (!isNaN(leverage) && leverage > 0 && leverage <= 100) {
      updatePortfolio({ leverage });
    }
  };

  const marginUtilization = (portfolio.effectiveCapital / (portfolio.capital * 10)) * 100;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-2">Capital & Leverage Engine</h2>
        <p className="text-muted-foreground">Configure your trading capital and leverage settings</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Base Capital"
          value={formatCurrency(portfolio.capital)}
          variant="primary"
          icon={<Wallet className="w-4 h-4" />}
        />
        <MetricCard
          label="Leverage"
          value={`${portfolio.leverage}x`}
          variant="default"
          icon={<Scale className="w-4 h-4" />}
        />
        <MetricCard
          label="Effective Capital"
          value={formatCurrency(portfolio.effectiveCapital)}
          subValue={`${portfolio.leverage}x multiplier`}
          variant="profit"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <MetricCard
          label="Margin Utilization"
          value={`${marginUtilization.toFixed(1)}%`}
          variant={marginUtilization > 80 ? 'warning' : 'default'}
          icon={<Percent className="w-4 h-4" />}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Capital Input */}
        <div className="trading-card">
          <h3 className="text-lg font-semibold mb-4">Set Trading Capital</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Base Capital (₹)</label>
              <input
                type="number"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                className="trading-input w-full text-lg"
                placeholder="Enter capital amount"
              />
            </div>
            <button
              onClick={handleCapitalUpdate}
              className="btn-trading w-full"
            >
              Update Capital
            </button>
            
            {/* Quick presets */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Quick Presets</p>
              <div className="grid grid-cols-4 gap-2">
                {[100000, 500000, 1000000, 5000000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      setCapital(amount.toString());
                      updatePortfolio({ 
                        capital: amount,
                        currentEquity: amount,
                        peakEquity: amount,
                      });
                    }}
                    className="btn-trading-outline text-sm py-2"
                  >
                    {amount >= 1000000 ? `${amount / 1000000}M` : `${amount / 1000}k`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Leverage Selector */}
        <div className="trading-card">
          <h3 className="text-lg font-semibold mb-4">Select Leverage</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {leverageOptions.map((lev) => (
                <button
                  key={lev}
                  onClick={() => handleLeverageChange(lev)}
                  className={`py-3 rounded-lg font-mono font-semibold transition-all ${
                    portfolio.leverage === lev
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  {lev}x
                </button>
              ))}
            </div>

            <div className="border-t border-border pt-4">
              <label className="block text-sm text-muted-foreground mb-2">Custom Leverage</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={customLeverage}
                  onChange={(e) => setCustomLeverage(e.target.value)}
                  className="trading-input flex-1"
                  placeholder="Enter custom (1-100)"
                  min="1"
                  max="100"
                />
                <button
                  onClick={handleCustomLeverage}
                  className="btn-trading"
                  disabled={!customLeverage}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leverage Impact Table */}
      <div className="trading-card">
        <h3 className="text-lg font-semibold mb-4">Leverage Impact Analysis</h3>
        <div className="overflow-x-auto">
          <table className="table-trading">
            <thead>
              <tr>
                <th>Leverage</th>
                <th>Effective Capital</th>
                <th>1% Risk Amount</th>
                <th>Max Position (₹)</th>
                <th>Margin Required</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 5, 10, 20].map((lev) => {
                const effCapital = portfolio.capital * lev;
                const riskAmount = portfolio.capital * 0.01;
                const maxPosition = effCapital * 0.5;
                const marginReq = maxPosition / lev;
                
                return (
                  <tr key={lev} className={portfolio.leverage === lev ? 'bg-primary/10' : ''}>
                    <td className="font-semibold">{lev}x</td>
                    <td>{formatCurrency(effCapital)}</td>
                    <td className="text-warning">{formatCurrency(riskAmount)}</td>
                    <td>{formatCurrency(maxPosition)}</td>
                    <td>{formatCurrency(marginReq)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
