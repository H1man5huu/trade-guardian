import { Trade, PortfolioState, RiskLimits } from '@/types/trading';
import { DEFAULT_RISK_LIMITS } from './riskEngine';

const STORAGE_KEYS = {
  TRADES: 'trmap_trades',
  PORTFOLIO: 'trmap_portfolio',
  RISK_LIMITS: 'trmap_risk_limits',
  SESSION: 'trmap_session',
  AUTHENTICATED: 'trmap_authenticated',
};

export function saveTrades(trades: Trade[]): void {
  localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades));
}

export function loadTrades(): Trade[] {
  const data = localStorage.getItem(STORAGE_KEYS.TRADES);
  return data ? JSON.parse(data) : [];
}

export function savePortfolio(portfolio: PortfolioState): void {
  localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(portfolio));
}

export function loadPortfolio(): PortfolioState | null {
  const data = localStorage.getItem(STORAGE_KEYS.PORTFOLIO);
  return data ? JSON.parse(data) : null;
}

export function saveRiskLimits(limits: RiskLimits): void {
  localStorage.setItem(STORAGE_KEYS.RISK_LIMITS, JSON.stringify(limits));
}

export function loadRiskLimits(): RiskLimits {
  const data = localStorage.getItem(STORAGE_KEYS.RISK_LIMITS);
  return data ? JSON.parse(data) : DEFAULT_RISK_LIMITS;
}

export function setAuthenticated(value: boolean): void {
  localStorage.setItem(STORAGE_KEYS.AUTHENTICATED, JSON.stringify(value));
}

export function isAuthenticated(): boolean {
  const data = localStorage.getItem(STORAGE_KEYS.AUTHENTICATED);
  return data ? JSON.parse(data) : false;
}

export function generateTradeId(): string {
  return `TRD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function exportTradesToCSV(trades: Trade[]): string {
  const headers = ['Date', 'Instrument', 'Side', 'Entry', 'StopLoss', 'Target', 'Qty', 'Exit', 'P&L', 'RR', 'Status', 'Notes'];
  
  const rows = trades.map(t => [
    t.date,
    t.instrument,
    t.side,
    t.entryPrice,
    t.stopLoss,
    t.target,
    t.quantity,
    t.exitPrice ?? '',
    t.pnl ?? '',
    t.riskReward.toFixed(2),
    t.status,
    t.notes ?? '',
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
