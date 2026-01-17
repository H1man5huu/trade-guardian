import React from 'react';
import { useTrading } from '@/context/TradingContext';
import { exportTradesToCSV, downloadCSV } from '@/lib/storage';
import { Settings as SettingsIcon, Download, Trash2, RefreshCw, Shield, Bell } from 'lucide-react';

export function Settings() {
  const { portfolio, trades, riskLimits, updatePortfolio, updateRiskLimits, resetDailyPnL } = useTrading();

  const handleExportTrades = () => {
    const csv = exportTradesToCSV(trades);
    downloadCSV(csv, `trmap_trades_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleResetDailyPnL = () => {
    if (confirm('Reset daily P&L to zero? This should be done at the start of each trading day.')) {
      resetDailyPnL();
    }
  };

  const handleResetWeeklyPnL = () => {
    if (confirm('Reset weekly P&L to zero? This should be done at the start of each trading week.')) {
      updatePortfolio({ weeklyPnL: 0 });
    }
  };

  const handleResetMonthlyPnL = () => {
    if (confirm('Reset monthly P&L to zero? This should be done at the start of each month.')) {
      updatePortfolio({ monthlyPnL: 0 });
    }
  };

  const handleResetDrawdown = () => {
    if (confirm('Reset drawdown tracking? This will set peak equity to current equity.')) {
      updatePortfolio({ 
        peakEquity: portfolio.currentEquity,
        maxDrawdown: 0,
      });
    }
  };

  const handleClearAllData = () => {
    if (confirm('This will delete ALL your data including trades, portfolio settings, and risk limits. Are you sure?')) {
      if (confirm('This action cannot be undone. Type "DELETE" in the next prompt to confirm.')) {
        const input = prompt('Type DELETE to confirm:');
        if (input === 'DELETE') {
          localStorage.clear();
          window.location.reload();
        }
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-2">Settings</h2>
        <p className="text-muted-foreground">Configure your trading platform preferences</p>
      </div>

      {/* Risk Settings */}
      <div className="trading-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Risk Management Settings
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Risk Per Trade (%)</label>
              <input
                type="number"
                value={riskLimits.riskPerTrade}
                onChange={(e) => updateRiskLimits({ riskPerTrade: parseFloat(e.target.value) || 1 })}
                className="trading-input w-full"
                step="0.1"
                min="0.1"
                max="5"
              />
              <p className="text-xs text-muted-foreground mt-1">Recommended: 0.5% - 2%</p>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Daily Loss Limit (%)</label>
              <input
                type="number"
                value={riskLimits.dailyLossLimit}
                onChange={(e) => updateRiskLimits({ dailyLossLimit: parseFloat(e.target.value) || 3 })}
                className="trading-input w-full"
                step="0.5"
                min="1"
                max="10"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Weekly Loss Limit (%)</label>
              <input
                type="number"
                value={riskLimits.weeklyLossLimit}
                onChange={(e) => updateRiskLimits({ weeklyLossLimit: parseFloat(e.target.value) || 6 })}
                className="trading-input w-full"
                step="0.5"
                min="2"
                max="15"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Monthly Loss Limit (%)</label>
              <input
                type="number"
                value={riskLimits.monthlyLossLimit}
                onChange={(e) => updateRiskLimits({ monthlyLossLimit: parseFloat(e.target.value) || 12 })}
                className="trading-input w-full"
                step="1"
                min="5"
                max="25"
              />
            </div>
          </div>
        </div>
      </div>

      {/* P&L Reset Options */}
      <div className="trading-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-primary" />
          P&L Reset Options
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Reset P&L counters at the start of new trading periods
        </p>
        <div className="grid grid-cols-4 gap-4">
          <button
            onClick={handleResetDailyPnL}
            className="p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-all text-center"
          >
            <p className="font-semibold">Reset Daily P&L</p>
            <p className="text-sm text-muted-foreground mt-1">Start of trading day</p>
          </button>
          <button
            onClick={handleResetWeeklyPnL}
            className="p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-all text-center"
          >
            <p className="font-semibold">Reset Weekly P&L</p>
            <p className="text-sm text-muted-foreground mt-1">Start of trading week</p>
          </button>
          <button
            onClick={handleResetMonthlyPnL}
            className="p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-all text-center"
          >
            <p className="font-semibold">Reset Monthly P&L</p>
            <p className="text-sm text-muted-foreground mt-1">Start of month</p>
          </button>
          <button
            onClick={handleResetDrawdown}
            className="p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-all text-center"
          >
            <p className="font-semibold">Reset Drawdown</p>
            <p className="text-sm text-muted-foreground mt-1">Set new peak equity</p>
          </button>
        </div>
      </div>

      {/* Data Export */}
      <div className="trading-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" />
          Data Export
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleExportTrades}
            className="btn-trading-outline flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Trade Journal (CSV)
          </button>
          <button
            onClick={() => {
              const data = {
                portfolio,
                trades,
                riskLimits,
                exportDate: new Date().toISOString(),
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `trmap_backup_${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="btn-trading-outline flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Full Backup (JSON)
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="trading-card border-destructive/30">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-destructive">
          <Trash2 className="w-5 h-5" />
          Danger Zone
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          These actions are irreversible. Make sure to backup your data first.
        </p>
        <button
          onClick={handleClearAllData}
          className="btn-danger flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear All Data
        </button>
      </div>

      {/* System Info */}
      <div className="trading-card">
        <h3 className="text-lg font-semibold mb-4">System Information</h3>
        <div className="data-grid text-sm">
          <div className="data-row">
            <span className="text-muted-foreground">Version</span>
            <span className="font-mono">1.0.0</span>
          </div>
          <div className="data-row">
            <span className="text-muted-foreground">Total Trades</span>
            <span className="font-mono">{trades.length}</span>
          </div>
          <div className="data-row">
            <span className="text-muted-foreground">Open Positions</span>
            <span className="font-mono">{trades.filter(t => t.status === 'OPEN').length}</span>
          </div>
          <div className="data-row">
            <span className="text-muted-foreground">Storage Used</span>
            <span className="font-mono">
              {(new Blob([localStorage.getItem('trmap_trades') || '']).size / 1024).toFixed(2)} KB
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
