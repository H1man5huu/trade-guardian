import React, { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'profit' | 'loss' | 'warning' | 'primary';
  icon?: ReactNode;
  className?: string;
}

export function MetricCard({
  label,
  value,
  subValue,
  trend,
  variant = 'default',
  icon,
  className = '',
}: MetricCardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'profit':
        return 'glow-success border-success/20';
      case 'loss':
        return 'glow-destructive border-destructive/20';
      case 'warning':
        return 'border-warning/20';
      case 'primary':
        return 'glow-primary border-primary/20';
      default:
        return '';
    }
  };

  const getValueColor = () => {
    switch (variant) {
      case 'profit':
        return 'text-success';
      case 'loss':
        return 'text-destructive';
      case 'warning':
        return 'text-warning';
      case 'primary':
        return 'text-primary';
      default:
        return 'text-foreground';
    }
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className={`trading-card ${getVariantClasses()} ${className}`}>
      <div className="flex items-start justify-between mb-2">
        <p className="metric-label">{label}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="flex items-end gap-2">
        <p className={`metric-value ${getValueColor()}`}>{value}</p>
        {trend && (
          <TrendIcon className={`w-4 h-4 mb-1 ${
            trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
          }`} />
        )}
      </div>
      {subValue && (
        <p className="text-sm text-muted-foreground mt-1">{subValue}</p>
      )}
    </div>
  );
}
