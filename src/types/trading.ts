export interface Trade {
  id: string;
  date: string;
  instrument: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  stopLoss: number;
  target: number;
  quantity: number;
  exitPrice?: number;
  pnl?: number;
  riskReward: number;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  notes?: string;
}

export interface RiskLimits {
  riskPerTrade: number;
  dailyLossLimit: number;
  weeklyLossLimit: number;
  monthlyLossLimit: number;
}

export interface PortfolioState {
  capital: number;
  leverage: number;
  effectiveCapital: number;
  currentEquity: number;
  peakEquity: number;
  dailyPnL: number;
  weeklyPnL: number;
  monthlyPnL: number;
  drawdown: number;
  maxDrawdown: number;
  isTradingLocked: boolean;
  lockReason?: string;
}

export interface PositionSizeResult {
  quantity: number;
  positionSize: number;
  marginRequired: number;
  maxLoss: number;
  maxProfit: number;
  riskAmount: number;
}

export interface MarginResult {
  futuresMargin: number;
  optionsPremium: number;
  optionsSellingMargin: number;
  totalExposure: number;
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  profitFactor: number;
  maxWinStreak: number;
  maxLossStreak: number;
  currentStreak: number;
  streakType: 'WIN' | 'LOSS' | 'NONE';
}

export interface CompoundingProjection {
  month: number;
  capital: number;
  profit: number;
  cumulativeProfit: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SessionState {
  startTime: Date;
  isActive: boolean;
  tradesCount: number;
  cooldownEndTime?: Date;
  consecutiveLosses: number;
}
