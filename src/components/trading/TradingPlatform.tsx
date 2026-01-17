import React, { useState } from 'react';
import { TradingProvider } from '@/context/TradingContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Dashboard } from './modules/Dashboard';
import { CapitalLeverage } from './modules/CapitalLeverage';
import { RiskManager } from './modules/RiskManager';
import { PositionSizing } from './modules/PositionSizing';
import { MarginCalculator } from './modules/MarginCalculator';
import { TradeJournal } from './modules/TradeJournal';
import { Analytics } from './modules/Analytics';
import { Performance } from './modules/Performance';
import { Compounding } from './modules/Compounding';
import { DrawdownControl } from './modules/DrawdownControl';
import { KellyCriterion } from './modules/KellyCriterion';
import { StrategyValidator } from './modules/StrategyValidator';
import { GrowthPlanner } from './modules/GrowthPlanner';
import { Settings } from './modules/Settings';
import { LoginScreen } from './LoginScreen';
import { setAuthenticated, isAuthenticated } from '@/lib/storage';

export function TradingPlatform() {
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const [activeModule, setActiveModule] = useState('dashboard');

  const handleLogin = () => {
    setAuthenticated(true);
    setLoggedIn(true);
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard />;
      case 'capital':
        return <CapitalLeverage />;
      case 'risk':
        return <RiskManager />;
      case 'position':
        return <PositionSizing />;
      case 'margin':
        return <MarginCalculator />;
      case 'journal':
        return <TradeJournal />;
      case 'analytics':
        return <Analytics />;
      case 'performance':
        return <Performance />;
      case 'compounding':
        return <Compounding />;
      case 'drawdown':
        return <DrawdownControl />;
      case 'kelly':
        return <KellyCriterion />;
      case 'validator':
        return <StrategyValidator />;
      case 'planner':
        return <GrowthPlanner />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <TradingProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar 
          activeModule={activeModule} 
          onModuleChange={setActiveModule}
          onLogout={handleLogout}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
            {renderModule()}
          </main>
        </div>
      </div>
    </TradingProvider>
  );
}
