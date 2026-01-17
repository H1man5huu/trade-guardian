import React from 'react';
import {
  LayoutDashboard,
  Calculator,
  Scale,
  BookOpen,
  TrendingUp,
  BarChart3,
  Percent,
  LineChart,
  Shield,
  Target,
  CheckSquare,
  Calendar,
  Settings,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
  onLogout: () => void;
}

const modules = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'capital', label: 'Capital & Leverage', icon: Calculator },
  { id: 'risk', label: 'Risk Manager', icon: Shield },
  { id: 'position', label: 'Position Sizing', icon: Scale },
  { id: 'margin', label: 'F&O Margin', icon: Percent },
  { id: 'journal', label: 'Trade Journal', icon: BookOpen },
  { id: 'analytics', label: 'P&L Analytics', icon: TrendingUp },
  { id: 'performance', label: 'Win Rate & Expectancy', icon: BarChart3 },
  { id: 'compounding', label: 'Compounding Engine', icon: LineChart },
  { id: 'drawdown', label: 'Drawdown Control', icon: Target },
  { id: 'kelly', label: 'Kelly Criterion', icon: Calculator },
  { id: 'validator', label: 'Strategy Validator', icon: CheckSquare },
  { id: 'planner', label: 'Growth Planner', icon: Calendar },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activeModule, onModuleChange, onLogout }: SidebarProps) {
  return (
    <div className="w-64 bg-sidebar h-screen flex flex-col border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-gradient-primary">TRMAP</h1>
        <p className="text-xs text-muted-foreground mt-1">Trading Risk Management</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4">
        <div className="space-y-1 px-3">
          {modules.map((module) => {
            const Icon = module.icon;
            const isActive = activeModule === module.id;
            
            return (
              <button
                key={module.id}
                onClick={() => onModuleChange(module.id)}
                className={`nav-item w-full ${isActive ? 'active' : ''}`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{module.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={onLogout}
          className="nav-item w-full text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
}
