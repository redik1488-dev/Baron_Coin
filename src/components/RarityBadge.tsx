// components/RarityBadge.tsx
import React from 'react';
import { Rarity } from '@/types/coin';

const RARITY_CONFIG: Record<
  Rarity,
  { label: string; classes: string; dot: string }
> = {
  common: {
    label: 'Часта',
    classes:
      'bg-slate-100 text-slate-700 border border-slate-300',
    dot: 'bg-slate-500',
  },
  uncommon: {
    label: 'Нечаста',
    classes:
      'bg-emerald-50 text-emerald-800 border border-emerald-300',
    dot: 'bg-emerald-500',
  },
  rare: {
    label: 'Рідкісна',
    classes:
      'bg-blue-50 text-blue-800 border border-blue-300',
    dot: 'bg-blue-500',
  },
  very_rare: {
    label: 'Дуже Рідкісна',
    classes:
      'bg-purple-50 text-purple-800 border border-purple-300',
    dot: 'bg-purple-500',
  },
  unique: {
    label: 'Унікальна',
    classes:
      'bg-amber-50 text-amber-800 border border-amber-400',
    dot: 'bg-amber-500',
  },
};

interface RarityBadgeProps {
  rarity: Rarity;
}

export default function RarityBadge({ rarity }: RarityBadgeProps) {
  const config = RARITY_CONFIG[rarity] || RARITY_CONFIG.common;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${config.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
