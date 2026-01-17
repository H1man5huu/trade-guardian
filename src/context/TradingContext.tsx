import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Trade, PortfolioState, RiskLimits, SessionState, PerformanceMetrics } from '@/types/trading';
import { DEFAULT_RISK_LIMITS, calculatePerformanceMetrics, calculateDrawdown } from '@/lib/riskEngine';
import { saveTrades, loadTrades, savePortfolio, loadPortfolio, saveRiskLimits, loadRiskLimits, generateTradeId } from '@/lib/storage';

interface TradingContextType {
  portfolio: PortfolioState;
  trades: Trade[];
  riskLimits: RiskLimits;
  session: SessionState;
  metrics: PerformanceMetrics;
  updatePortfolio: (updates: Partial<PortfolioState>) => void;
  addTrade: (trade: Omit<Trade, 'id'>) => void;
  updateTrade: (id: string, updates: Partial<Trade>) => void;
  closeTrade: (id: string, exitPrice: number) => void;
  deleteTrade: (id: string) => void;
  updateRiskLimits: (limits: Partial<RiskLimits>) => void;
  startSession: () => void;
  endSession: () => void;
  lockTrading: (reason: string) => void;
  unlockTrading: () => void;
  resetDailyPnL: () => void;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

const DEFAULT_PORTFOLIO: PortfolioState = {
  capital: 100000,
  leverage: 1,
  effectiveCapital: 100000,
  currentEquity: 100000,
  peakEquity: 100000,
  dailyPnL: 0,
  weeklyPnL: 0,
  monthlyPnL: 0,
  drawdown: 0,
  maxDrawdown: 0,
  isTradingLocked: false,
};

const DEFAULT_SESSION: SessionState = {
  startTime: new Date(),
  isActive: false,
  tradesCount: 0,
  consecutiveLosses: 0,
};

export function TradingProvider({ children }: { children: ReactNode }) {
  const [portfolio, setPortfolio] = useState<PortfolioState>(DEFAULT_PORTFOLIO);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [riskLimits, setRiskLimits] = useState<RiskLimits>(DEFAULT_RISK_LIMITS);
  const [session, setSession] = useState<SessionState>(DEFAULT_SESSION);
  const [metrics, setMetrics] = useState<PerformanceMetrics>(calculatePerformanceMetrics([]));

  // Load data on mount
  useEffect(() => {
    const savedPortfolio = loadPortfolio();
    const savedTrades = loadTrades();
    const savedLimits = loadRiskLimits();

    if (savedPortfolio) setPortfolio(savedPortfolio);
    if (savedTrades.length > 0) setTrades(savedTrades);
    if (savedLimits) setRiskLimits(savedLimits);
  }, []);

  // Save data on changes
  useEffect(() => {
    savePortfolio(portfolio);
  }, [portfolio]);

  useEffect(() => {
    saveTrades(trades);
    setMetrics(calculatePerformanceMetrics(trades));
  }, [trades]);

  useEffect(() => {
    saveRiskLimits(riskLimits);
  }, [riskLimits]);

  const updatePortfolio = useCallback((updates: Partial<PortfolioState>) => {
    setPortfolio(prev => {
      const updated = { ...prev, ...updates };
      updated.effectiveCapital = updated.capital * updated.leverage;
      updated.drawdown = calculateDrawdown(updated.currentEquity, updated.peakEquity);
      updated.maxDrawdown = Math.max(updated.maxDrawdown, updated.drawdown);
      
      // Update peak equity
      if (updated.currentEquity > updated.peakEquity) {
        updated.peakEquity = updated.currentEquity;
      }
      
      return updated;
    });
  }, []);

  const addTrade = useCallback((trade: Omit<Trade, 'id'>) => {
    const newTrade: Trade = {
      ...trade,
      id: generateTradeId(),
    };
    setTrades(prev => [...prev, newTrade]);
    setSession(prev => ({ ...prev, tradesCount: prev.tradesCount + 1 }));
  }, []);

  const updateTrade = useCallback((id: string, updates: Partial<Trade>) => {
    setTrades(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const closeTrade = useCallback((id: string, exitPrice: number) => {
    setTrades(prev => prev.map(t => {
      if (t.id !== id) return t;
      
      const pnl = t.side === 'LONG'
        ? (exitPrice - t.entryPrice) * t.quantity
        : (t.entryPrice - exitPrice) * t.quantity;

      return {
        ...t,
        exitPrice,
        pnl,
        status: 'CLOSED' as const,
      };
    }));

    // Update portfolio PnL
    setTrades(prev => {
      const trade = prev.find(t => t.id === id);
      if (trade?.pnl) {
        updatePortfolio({
          dailyPnL: portfolio.dailyPnL + trade.pnl,
          weeklyPnL: portfolio.weeklyPnL + trade.pnl,
          monthlyPnL: portfolio.monthlyPnL + trade.pnl,
          currentEquity: portfolio.currentEquity + trade.pnl,
        });

        // Check for consecutive losses
        if (trade.pnl < 0) {
          setSession(s => {
            const newLosses = s.consecutiveLosses + 1;
            if (newLosses >= 3) {
              lockTrading('3 consecutive losses - mandatory cooldown');
            }
            return { ...s, consecutiveLosses: newLosses };
          });
        } else {
          setSession(s => ({ ...s, consecutiveLosses: 0 }));
        }
      }
      return prev;
    });
  }, [portfolio, updatePortfolio]);

  const deleteTrade = useCallback((id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateRiskLimits = useCallback((limits: Partial<RiskLimits>) => {
    setRiskLimits(prev => ({ ...prev, ...limits }));
  }, []);

  const startSession = useCallback(() => {
    setSession({
      startTime: new Date(),
      isActive: true,
      tradesCount: 0,
      consecutiveLosses: 0,
    });
  }, []);

  const endSession = useCallback(() => {
    setSession(prev => ({ ...prev, isActive: false }));
  }, []);

  const lockTrading = useCallback((reason: string) => {
    setPortfolio(prev => ({
      ...prev,
      isTradingLocked: true,
      lockReason: reason,
    }));
  }, []);

  const unlockTrading = useCallback(() => {
    setPortfolio(prev => ({
      ...prev,
      isTradingLocked: false,
      lockReason: undefined,
    }));
    setSession(prev => ({ ...prev, consecutiveLosses: 0 }));
  }, []);

  const resetDailyPnL = useCallback(() => {
    updatePortfolio({ dailyPnL: 0 });
  }, [updatePortfolio]);

  return (
    <TradingContext.Provider
      value={{
        portfolio,
        trades,
        riskLimits,
        session,
        metrics,
        updatePortfolio,
        addTrade,
        updateTrade,
        closeTrade,
        deleteTrade,
        updateRiskLimits,
        startSession,
        endSession,
        lockTrading,
        unlockTrading,
        resetDailyPnL,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
}

export function useTrading() {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
}
