import { RiskLimits, PortfolioState, PositionSizeResult, ValidationResult, PerformanceMetrics, Trade } from '@/types/trading';

export const DEFAULT_RISK_LIMITS: RiskLimits = {
  riskPerTrade: 1,
  dailyLossLimit: 3,
  weeklyLossLimit: 6,
  monthlyLossLimit: 12,
};

export function calculatePositionSize(
  capital: number,
  riskPercent: number,
  stopLossPercent: number,
  entryPrice: number,
  leverage: number = 1
): PositionSizeResult {
  const effectiveCapital = capital * leverage;
  const riskAmount = (capital * riskPercent) / 100;
  const stopLossAmount = (entryPrice * stopLossPercent) / 100;
  
  const quantity = stopLossAmount > 0 ? Math.floor(riskAmount / stopLossAmount) : 0;
  const positionSize = quantity * entryPrice;
  const marginRequired = positionSize / leverage;
  const maxLoss = riskAmount;
  const maxProfit = riskAmount * 2; // Assuming 1:2 RR minimum

  return {
    quantity,
    positionSize,
    marginRequired,
    maxLoss,
    maxProfit,
    riskAmount,
  };
}

export function calculateDrawdown(currentEquity: number, peakEquity: number): number {
  if (peakEquity <= 0) return 0;
  return ((peakEquity - currentEquity) / peakEquity) * 100;
}

export function validateTrade(
  riskReward: number,
  riskPercent: number,
  limits: RiskLimits,
  portfolio: PortfolioState
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check RR ratio
  if (riskReward < 2) {
    errors.push(`Risk-Reward ratio ${riskReward.toFixed(2)} is below minimum 1:2`);
  }

  // Check risk per trade
  if (riskPercent > limits.riskPerTrade) {
    errors.push(`Risk ${riskPercent}% exceeds limit of ${limits.riskPerTrade}%`);
  }

  // Check daily loss limit
  const dailyLossPercent = (Math.abs(portfolio.dailyPnL) / portfolio.capital) * 100;
  if (portfolio.dailyPnL < 0 && dailyLossPercent >= limits.dailyLossLimit) {
    errors.push(`Daily loss limit of ${limits.dailyLossLimit}% breached`);
  }

  // Check weekly loss limit
  const weeklyLossPercent = (Math.abs(portfolio.weeklyPnL) / portfolio.capital) * 100;
  if (portfolio.weeklyPnL < 0 && weeklyLossPercent >= limits.weeklyLossLimit) {
    errors.push(`Weekly loss limit of ${limits.weeklyLossLimit}% breached`);
  }

  // Check monthly loss limit
  const monthlyLossPercent = (Math.abs(portfolio.monthlyPnL) / portfolio.capital) * 100;
  if (portfolio.monthlyPnL < 0 && monthlyLossPercent >= limits.monthlyLossLimit) {
    errors.push(`Monthly loss limit of ${limits.monthlyLossLimit}% breached`);
  }

  // Check drawdown
  if (portfolio.drawdown > 10) {
    warnings.push(`Current drawdown ${portfolio.drawdown.toFixed(2)}% is elevated`);
  }

  if (portfolio.drawdown > 20) {
    errors.push(`Drawdown ${portfolio.drawdown.toFixed(2)}% exceeds maximum threshold`);
  }

  // Trading lock check
  if (portfolio.isTradingLocked) {
    errors.push(`Trading is locked: ${portfolio.lockReason}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function calculateKellyCriterion(winRate: number, avgWin: number, avgLoss: number): number {
  if (avgLoss === 0 || winRate === 0 || winRate === 1) return 0;
  
  const winProbability = winRate / 100;
  const lossRatio = avgWin / avgLoss;
  
  const kelly = winProbability - ((1 - winProbability) / lossRatio);
  
  // Return half-Kelly for safety
  return Math.max(0, Math.min(kelly * 50, 25)); // Cap at 25%
}

export function calculatePerformanceMetrics(trades: Trade[]): PerformanceMetrics {
  const closedTrades = trades.filter(t => t.status === 'CLOSED' && t.pnl !== undefined);
  
  if (closedTrades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      expectancy: 0,
      profitFactor: 0,
      maxWinStreak: 0,
      maxLossStreak: 0,
      currentStreak: 0,
      streakType: 'NONE',
    };
  }

  const winningTrades = closedTrades.filter(t => (t.pnl ?? 0) > 0);
  const losingTrades = closedTrades.filter(t => (t.pnl ?? 0) < 0);

  const totalWins = winningTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0));

  const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;

  const winRate = (winningTrades.length / closedTrades.length) * 100;
  const expectancy = avgWin * (winRate / 100) - avgLoss * (1 - winRate / 100);
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

  // Calculate streaks
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;

  closedTrades.forEach(trade => {
    if ((trade.pnl ?? 0) > 0) {
      currentWinStreak++;
      currentLossStreak = 0;
      maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
    } else {
      currentLossStreak++;
      currentWinStreak = 0;
      maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
    }
  });

  const lastTrade = closedTrades[closedTrades.length - 1];
  const streakType = lastTrade && (lastTrade.pnl ?? 0) > 0 ? 'WIN' : lastTrade && (lastTrade.pnl ?? 0) < 0 ? 'LOSS' : 'NONE';
  const currentStreak = streakType === 'WIN' ? currentWinStreak : streakType === 'LOSS' ? currentLossStreak : 0;

  return {
    totalTrades: closedTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate,
    avgWin,
    avgLoss,
    expectancy,
    profitFactor,
    maxWinStreak,
    maxLossStreak,
    currentStreak,
    streakType,
  };
}

export function calculateCompounding(
  startCapital: number,
  monthlyReturnPercent: number,
  months: number
): { month: number; capital: number; profit: number; cumulativeProfit: number }[] {
  const projections = [];
  let capital = startCapital;
  let cumulativeProfit = 0;

  for (let month = 1; month <= months; month++) {
    const profit = capital * (monthlyReturnPercent / 100);
    capital += profit;
    cumulativeProfit += profit;

    projections.push({
      month,
      capital,
      profit,
      cumulativeProfit,
    });
  }

  return projections;
}

export function calculateMarginRequirements(
  instrumentPrice: number,
  quantity: number,
  instrumentType: 'FUTURES' | 'OPTIONS_BUY' | 'OPTIONS_SELL',
  optionPremium?: number,
  lotSize: number = 1
): {
  futuresMargin: number;
  optionsPremium: number;
  optionsSellingMargin: number;
  totalExposure: number;
} {
  const contractValue = instrumentPrice * quantity * lotSize;
  
  let futuresMargin = 0;
  let optionsPremium = 0;
  let optionsSellingMargin = 0;

  if (instrumentType === 'FUTURES') {
    futuresMargin = contractValue * 0.12; // ~12% margin for futures
  } else if (instrumentType === 'OPTIONS_BUY') {
    optionsPremium = (optionPremium ?? 0) * quantity * lotSize;
  } else if (instrumentType === 'OPTIONS_SELL') {
    // SPAN-like approximation for options selling
    optionsSellingMargin = contractValue * 0.15 + (optionPremium ?? 0) * quantity * lotSize;
  }

  return {
    futuresMargin,
    optionsPremium,
    optionsSellingMargin,
    totalExposure: contractValue,
  };
}

export function calculateRequiredMonthlyReturn(
  currentCapital: number,
  targetCapital: number,
  months: number
): number {
  if (currentCapital <= 0 || targetCapital <= currentCapital || months <= 0) return 0;
  
  const growthRate = Math.pow(targetCapital / currentCapital, 1 / months) - 1;
  return growthRate * 100;
}

export function getAdjustedRiskForDrawdown(
  baseRisk: number,
  drawdownPercent: number
): number {
  // Reduce risk as drawdown increases
  if (drawdownPercent < 5) return baseRisk;
  if (drawdownPercent < 10) return baseRisk * 0.75;
  if (drawdownPercent < 15) return baseRisk * 0.5;
  if (drawdownPercent < 20) return baseRisk * 0.25;
  return 0; // Stop trading
}
