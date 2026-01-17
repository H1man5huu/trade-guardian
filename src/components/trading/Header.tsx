import React, { useState, useEffect } from 'react';
import { useTrading } from '@/context/TradingContext';
import { Clock, AlertTriangle, Lock, Unlock, TrendingUp, TrendingDown } from 'lucide-react';

export function Header() {
  const { portfolio, session, unlockTrading, lockTrading } = useTrading();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getPnLColor = (value: number) => {
    if (value > 0) return 'status-profit';
    if (value < 0) return 'status-loss';
    return 'text-muted-foreground';
  };

  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
      {/* Left - Status Indicators */}
      <div className="flex items-center gap-6">
        {/* Trading Status */}
        <div className="flex items-center gap-2">
          {portfolio.isTradingLocked ? (
            <>
              <div className="w-2 h-2 rounded-full bg-destructive pulse-warning" />
              <Lock className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive">LOCKED</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <Unlock className="w-4 h-4 text-success" />
              <span className="text-sm text-success">ACTIVE</span>
            </>
          )}
        </div>

        {/* Session Timer */}
        {session.isActive && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-mono">
              Session: {Math.floor((currentTime.getTime() - new Date(session.startTime).getTime()) / 60000)}m
            </span>
          </div>
        )}

        {/* Drawdown Warning */}
        {portfolio.drawdown > 5 && (
          <div className="flex items-center gap-2 text-warning">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">DD: {portfolio.drawdown.toFixed(1)}%</span>
          </div>
        )}
      </div>

      {/* Right - Quick Stats */}
      <div className="flex items-center gap-6">
        {/* Daily P&L */}
        <div className="flex items-center gap-2">
          {portfolio.dailyPnL >= 0 ? (
            <TrendingUp className={`w-4 h-4 ${getPnLColor(portfolio.dailyPnL)}`} />
          ) : (
            <TrendingDown className={`w-4 h-4 ${getPnLColor(portfolio.dailyPnL)}`} />
          )}
          <div>
            <p className="text-xs text-muted-foreground">Daily P&L</p>
            <p className={`text-sm font-mono font-semibold ${getPnLColor(portfolio.dailyPnL)}`}>
              {formatCurrency(portfolio.dailyPnL)}
            </p>
          </div>
        </div>

        {/* Equity */}
        <div>
          <p className="text-xs text-muted-foreground">Equity</p>
          <p className="text-sm font-mono font-semibold">{formatCurrency(portfolio.currentEquity)}</p>
        </div>

        {/* Time */}
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
          <p className="text-sm font-mono font-semibold">
            {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </header>
  );
}
