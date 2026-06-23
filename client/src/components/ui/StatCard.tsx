import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface StatCardItem {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bg: string;
  border?: string;
}

interface StatCardGridProps {
  items: StatCardItem[];
}

const StatCardGrid: React.FC<StatCardGridProps> = ({ items }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    {items.map(({ label, value, icon: Icon, color, bg, border }) => (
      <div
        key={label}
        className={`card${border ? ` border ${border}` : ''} animate-fade-in`}
      >
        <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
          <Icon size={20} className={color} />
        </div>
        <div className="text-2xl font-black text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div className="text-gray-400 text-sm mt-0.5">{label}</div>
      </div>
    ))}
  </div>
);

export default StatCardGrid;
