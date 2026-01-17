import React, { useState, useMemo } from 'react';
import { calculateMarginRequirements } from '@/lib/riskEngine';
import { MetricCard } from '../MetricCard';
import { Percent, Calculator, TrendingUp, TrendingDown } from 'lucide-react';

type InstrumentType = 'FUTURES' | 'OPTIONS_BUY' | 'OPTIONS_SELL';

export function MarginCalculator() {
  const [instrumentType, setInstrumentType] = useState<InstrumentType>('FUTURES');
  const [spotPrice, setSpotPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [lotSize, setLotSize] = useState('50');
  const [optionPremium, setOptionPremium] = useState('');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const result = useMemo(() => {
    const price = parseFloat(spotPrice) || 0;
    const qty = parseFloat(quantity) || 0;
    const lot = parseFloat(lotSize) || 1;
    const premium = parseFloat(optionPremium) || 0;

    if (price <= 0 || qty <= 0) return null;

    return calculateMarginRequirements(price, qty, instrumentType, premium, lot);
  }, [spotPrice, quantity, lotSize, instrumentType, optionPremium]);

  const instrumentTypes: { value: InstrumentType; label: string; description: string }[] = [
    { value: 'FUTURES', label: 'Futures', description: 'Margin-based trading' },
    { value: 'OPTIONS_BUY', label: 'Options Buy', description: 'Pay premium only' },
    { value: 'OPTIONS_SELL', label: 'Options Sell', description: 'SPAN + Premium margin' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-2">F&O Margin Calculator</h2>
        <p className="text-muted-foreground">Zerodha-style margin calculator for Futures & Options</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="trading-card">
          <h3 className="text-lg font-semibold mb-4">Instrument Details</h3>
          
          {/* Instrument Type Selector */}
          <div className="mb-6">
            <label className="block text-sm text-muted-foreground mb-2">Instrument Type</label>
            <div className="grid grid-cols-3 gap-2">
              {instrumentTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setInstrumentType(type.value)}
                  className={`p-3 rounded-lg border transition-all ${
                    instrumentType === type.value
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-secondary/30 border-border hover:border-primary/50'
                  }`}
                >
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Spot/Futures Price (₹)</label>
              <input
                type="number"
                value={spotPrice}
                onChange={(e) => setSpotPrice(e.target.value)}
                className="trading-input w-full"
                placeholder="Enter price"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Quantity (Lots)</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="trading-input w-full"
                  placeholder="1"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Lot Size</label>
                <input
                  type="number"
                  value={lotSize}
                  onChange={(e) => setLotSize(e.target.value)}
                  className="trading-input w-full"
                  placeholder="50"
                />
              </div>
            </div>

            {(instrumentType === 'OPTIONS_BUY' || instrumentType === 'OPTIONS_SELL') && (
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Option Premium (₹)</label>
                <input
                  type="number"
                  value={optionPremium}
                  onChange={(e) => setOptionPremium(e.target.value)}
                  className="trading-input w-full"
                  placeholder="Enter premium"
                />
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="trading-card">
          <h3 className="text-lg font-semibold mb-4">Margin Requirements</h3>
          {result ? (
            <div className="space-y-6">
              {/* Total Exposure */}
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Exposure</p>
                <p className="text-3xl font-mono font-bold text-primary">{formatCurrency(result.totalExposure)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {quantity} lots × {lotSize} × ₹{parseFloat(spotPrice).toLocaleString()}
                </p>
              </div>

              <div className="space-y-4">
                {instrumentType === 'FUTURES' && (
                  <div className="data-row p-3 bg-secondary/30 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Futures Margin</p>
                      <p className="text-xs text-muted-foreground">~12% of contract value</p>
                    </div>
                    <span className="font-mono font-semibold text-lg">{formatCurrency(result.futuresMargin)}</span>
                  </div>
                )}

                {instrumentType === 'OPTIONS_BUY' && (
                  <div className="data-row p-3 bg-secondary/30 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Premium Required</p>
                      <p className="text-xs text-muted-foreground">Pay upfront, max loss capped</p>
                    </div>
                    <span className="font-mono font-semibold text-lg">{formatCurrency(result.optionsPremium)}</span>
                  </div>
                )}

                {instrumentType === 'OPTIONS_SELL' && (
                  <>
                    <div className="data-row p-3 bg-secondary/30 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">SPAN Margin</p>
                        <p className="text-xs text-muted-foreground">~15% + Premium margin</p>
                      </div>
                      <span className="font-mono font-semibold text-lg">{formatCurrency(result.optionsSellingMargin)}</span>
                    </div>
                    <div className="p-3 bg-warning/10 rounded-lg border border-warning/30">
                      <p className="text-xs text-warning flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        Options selling has unlimited risk potential
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Additional Info */}
              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-3">Margin Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contract Value</span>
                    <span className="font-mono">{formatCurrency(result.totalExposure)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Leverage</span>
                    <span className="font-mono">
                      {instrumentType === 'FUTURES' 
                        ? `~${Math.round(result.totalExposure / result.futuresMargin)}x`
                        : instrumentType === 'OPTIONS_BUY' 
                          ? '1x (Premium paid)'
                          : `~${Math.round(result.totalExposure / result.optionsSellingMargin)}x`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Margin %</span>
                    <span className="font-mono">
                      {instrumentType === 'FUTURES' 
                        ? '~12%'
                        : instrumentType === 'OPTIONS_BUY' 
                          ? 'N/A'
                          : '~15%'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Percent className="w-12 h-12 mb-4 opacity-30" />
              <p>Enter instrument details to calculate margin</p>
            </div>
          )}
        </div>
      </div>

      {/* Popular Instruments Reference */}
      <div className="trading-card">
        <h3 className="text-lg font-semibold mb-4">Popular F&O Contracts - Quick Reference</h3>
        <div className="overflow-x-auto">
          <table className="table-trading">
            <thead>
              <tr>
                <th>Instrument</th>
                <th>Lot Size</th>
                <th>Approx. Margin %</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-semibold">NIFTY</td>
                <td className="font-mono">50</td>
                <td className="font-mono">~9-12%</td>
                <td className="text-muted-foreground">High liquidity</td>
              </tr>
              <tr>
                <td className="font-semibold">BANKNIFTY</td>
                <td className="font-mono">25</td>
                <td className="font-mono">~10-14%</td>
                <td className="text-muted-foreground">Higher volatility</td>
              </tr>
              <tr>
                <td className="font-semibold">RELIANCE</td>
                <td className="font-mono">250</td>
                <td className="font-mono">~15-18%</td>
                <td className="text-muted-foreground">Stock F&O</td>
              </tr>
              <tr>
                <td className="font-semibold">TATA STEEL</td>
                <td className="font-mono">425</td>
                <td className="font-mono">~20-25%</td>
                <td className="text-muted-foreground">Higher margin</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
