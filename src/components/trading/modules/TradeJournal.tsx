import React, { useState } from 'react';
import { useTrading } from '@/context/TradingContext';
import { Trade } from '@/types/trading';
import { validateTrade } from '@/lib/riskEngine';
import { exportTradesToCSV, downloadCSV } from '@/lib/storage';
import { BookOpen, Plus, Download, Trash2, Edit2, X, Check, AlertTriangle } from 'lucide-react';

export function TradeJournal() {
  const { trades, portfolio, riskLimits, addTrade, updateTrade, closeTrade, deleteTrade } = useTrading();
  const [isAddingTrade, setIsAddingTrade] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [closeTradeId, setCloseTradeId] = useState<string | null>(null);
  const [exitPrice, setExitPrice] = useState('');

  const [newTrade, setNewTrade] = useState({
    date: new Date().toISOString().split('T')[0],
    instrument: '',
    side: 'LONG' as 'LONG' | 'SHORT',
    entryPrice: '',
    stopLoss: '',
    target: '',
    quantity: '',
    notes: '',
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleAddTrade = () => {
    const entry = parseFloat(newTrade.entryPrice);
    const sl = parseFloat(newTrade.stopLoss);
    const target = parseFloat(newTrade.target);
    const qty = parseInt(newTrade.quantity);

    if (!entry || !sl || !target || !qty) return;

    const slPercent = Math.abs((entry - sl) / entry) * 100;
    const targetPercent = Math.abs((target - entry) / entry) * 100;
    const riskReward = targetPercent / slPercent;

    // Validate trade
    const validation = validateTrade(riskReward, slPercent, riskLimits, portfolio);

    if (!validation.isValid) {
      alert(`Trade rejected:\n${validation.errors.join('\n')}`);
      return;
    }

    if (validation.warnings.length > 0) {
      const proceed = confirm(`Warnings:\n${validation.warnings.join('\n')}\n\nProceed anyway?`);
      if (!proceed) return;
    }

    addTrade({
      date: newTrade.date,
      instrument: newTrade.instrument.toUpperCase(),
      side: newTrade.side,
      entryPrice: entry,
      stopLoss: sl,
      target: target,
      quantity: qty,
      riskReward: riskReward,
      status: 'OPEN',
      notes: newTrade.notes,
    });

    setNewTrade({
      date: new Date().toISOString().split('T')[0],
      instrument: '',
      side: 'LONG',
      entryPrice: '',
      stopLoss: '',
      target: '',
      quantity: '',
      notes: '',
    });
    setIsAddingTrade(false);
  };

  const handleCloseTrade = () => {
    if (!closeTradeId || !exitPrice) return;
    closeTrade(closeTradeId, parseFloat(exitPrice));
    setCloseTradeId(null);
    setExitPrice('');
  };

  const handleExport = () => {
    const csv = exportTradesToCSV(trades);
    downloadCSV(csv, `trade_journal_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const openTrades = trades.filter(t => t.status === 'OPEN');
  const closedTrades = trades.filter(t => t.status === 'CLOSED');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Trade Journal</h2>
          <p className="text-muted-foreground">Log and track all your trades with discipline</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="btn-trading-outline flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button onClick={() => setIsAddingTrade(true)} className="btn-trading flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Trade
          </button>
        </div>
      </div>

      {/* Add Trade Form */}
      {isAddingTrade && (
        <div className="trading-card glow-primary">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Log New Trade</h3>
            <button onClick={() => setIsAddingTrade(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Date</label>
              <input
                type="date"
                value={newTrade.date}
                onChange={(e) => setNewTrade({ ...newTrade, date: e.target.value })}
                className="trading-input w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Instrument</label>
              <input
                type="text"
                value={newTrade.instrument}
                onChange={(e) => setNewTrade({ ...newTrade, instrument: e.target.value })}
                className="trading-input w-full"
                placeholder="NIFTY, RELIANCE..."
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Side</label>
              <select
                value={newTrade.side}
                onChange={(e) => setNewTrade({ ...newTrade, side: e.target.value as 'LONG' | 'SHORT' })}
                className="trading-input w-full"
              >
                <option value="LONG">LONG</option>
                <option value="SHORT">SHORT</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Quantity</label>
              <input
                type="number"
                value={newTrade.quantity}
                onChange={(e) => setNewTrade({ ...newTrade, quantity: e.target.value })}
                className="trading-input w-full"
                placeholder="100"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Entry Price (₹)</label>
              <input
                type="number"
                value={newTrade.entryPrice}
                onChange={(e) => setNewTrade({ ...newTrade, entryPrice: e.target.value })}
                className="trading-input w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Stop Loss (₹)</label>
              <input
                type="number"
                value={newTrade.stopLoss}
                onChange={(e) => setNewTrade({ ...newTrade, stopLoss: e.target.value })}
                className="trading-input w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Target (₹)</label>
              <input
                type="number"
                value={newTrade.target}
                onChange={(e) => setNewTrade({ ...newTrade, target: e.target.value })}
                className="trading-input w-full"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-muted-foreground mb-1">Notes</label>
            <textarea
              value={newTrade.notes}
              onChange={(e) => setNewTrade({ ...newTrade, notes: e.target.value })}
              className="trading-input w-full h-20 resize-none"
              placeholder="Trade rationale, setup type..."
            />
          </div>
          <button onClick={handleAddTrade} className="btn-trading w-full">
            Add Trade
          </button>
        </div>
      )}

      {/* Open Trades */}
      <div className="trading-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
          Open Positions ({openTrades.length})
        </h3>
        {openTrades.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No open positions</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-trading">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Instrument</th>
                  <th>Side</th>
                  <th>Entry</th>
                  <th>SL</th>
                  <th>Target</th>
                  <th>Qty</th>
                  <th>RR</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {openTrades.map((trade) => (
                  <tr key={trade.id}>
                    <td>{trade.date}</td>
                    <td className="font-semibold">{trade.instrument}</td>
                    <td>
                      <span className={trade.side === 'LONG' ? 'text-success' : 'text-destructive'}>
                        {trade.side}
                      </span>
                    </td>
                    <td>₹{trade.entryPrice.toLocaleString()}</td>
                    <td className="text-destructive">₹{trade.stopLoss.toLocaleString()}</td>
                    <td className="text-success">₹{trade.target.toLocaleString()}</td>
                    <td>{trade.quantity}</td>
                    <td>1:{trade.riskReward.toFixed(2)}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCloseTradeId(trade.id)}
                          className="p-1.5 hover:bg-success/20 rounded text-success"
                          title="Close trade"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTrade(trade.id)}
                          className="p-1.5 hover:bg-destructive/20 rounded text-destructive"
                          title="Delete trade"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Close Trade Modal */}
      {closeTradeId && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="trading-card w-96">
            <h3 className="text-lg font-semibold mb-4">Close Trade</h3>
            <div className="mb-4">
              <label className="block text-sm text-muted-foreground mb-1">Exit Price (₹)</label>
              <input
                type="number"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                className="trading-input w-full"
                placeholder="Enter exit price"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCloseTradeId(null)} className="btn-trading-outline flex-1">
                Cancel
              </button>
              <button onClick={handleCloseTrade} className="btn-trading flex-1">
                Close Trade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Closed Trades */}
      <div className="trading-card">
        <h3 className="text-lg font-semibold mb-4">Closed Trades ({closedTrades.length})</h3>
        {closedTrades.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No closed trades yet</p>
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
                  <th>Qty</th>
                  <th>P&L</th>
                  <th>RR</th>
                </tr>
              </thead>
              <tbody>
                {closedTrades.slice().reverse().map((trade) => (
                  <tr key={trade.id}>
                    <td>{trade.date}</td>
                    <td className="font-semibold">{trade.instrument}</td>
                    <td>
                      <span className={trade.side === 'LONG' ? 'text-success' : 'text-destructive'}>
                        {trade.side}
                      </span>
                    </td>
                    <td>₹{trade.entryPrice.toLocaleString()}</td>
                    <td>₹{trade.exitPrice?.toLocaleString()}</td>
                    <td>{trade.quantity}</td>
                    <td className={trade.pnl && trade.pnl > 0 ? 'text-success' : 'text-destructive'}>
                      {trade.pnl ? formatCurrency(trade.pnl) : '-'}
                    </td>
                    <td>1:{trade.riskReward.toFixed(2)}</td>
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
