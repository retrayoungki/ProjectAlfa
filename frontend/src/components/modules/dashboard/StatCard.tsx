import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change: string;
  up: boolean;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  up,
  icon: Icon,
  iconColor,
  iconBg,
}) => {
  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <div>
          <div className="kpi-label">{label}</div>
          <div className="kpi-value" style={{ marginTop: 4 }}>{value}</div>
        </div>
        <div className="kpi-icon" style={{ background: iconBg }}>
          <Icon size={18} color={iconColor} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {up ? (
          <TrendingUp size={12} color="#10B981" />
        ) : (
          <TrendingDown size={12} color="#EF4444" />
        )}
        <span className={`kpi-change ${up ? 'up' : 'down'}`}>{change}</span>
      </div>
    </div>
  );
};

export default StatCard;
