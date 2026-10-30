import React from 'react';
import { formatMathFormula } from '../../utils/mathFormatter';

interface ResultCardProps {
  label: string;
  symbol: string;
  value: string | number;
  unit?: string;
  formula?: string;
  subtext?: string;
  accentColor?: 'cyan' | 'amber' | 'emerald' | 'slate' | 'orange';
  highlight?: boolean;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  label,
  symbol,
  value,
  unit,
  formula,
  subtext,
  accentColor = 'cyan',
  highlight = false,
}) => {
  const getAccentDetails = () => {
    switch (accentColor) {
      case 'amber':
      case 'orange':
        return {
          text: 'text-[#FF5722]',
          badge: 'bg-[#FF5722]/15 text-[#FF5722] border-[#FF5722]/30',
          dot: 'bg-[#FF5722]',
          border: 'border-[#FF5722]/50 shadow-[0_0_15px_rgba(255,87,34,0.15)]',
        };
      case 'emerald':
        return {
          text: 'text-[#10B981]',
          badge: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30',
          dot: 'bg-[#10B981]',
          border: 'border-[#10B981]/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
        };
      case 'slate':
        return {
          text: 'text-slate-400',
          badge: 'bg-white/5 text-slate-300 border-white/10',
          dot: 'bg-slate-400',
          border: 'border-white/15',
        };
      default:
        return {
          text: 'text-[#00F0FF]',
          badge: 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/30',
          dot: 'bg-[#00F0FF]',
          border: 'border-[#00F0FF]/60 shadow-[0_0_15px_rgba(0,240,255,0.15)]',
        };
    }
  };

  const accent = getAccentDetails();

  return (
    <div
      className={`relative rounded-[3px] border p-3.5 sm:p-4 bg-[#1A1E29] transition-all group overflow-hidden ${
        highlight
          ? 'border-[#00F0FF]/70 shadow-[0_0_18px_rgba(0,240,255,0.18)] ring-1 ring-[#00F0FF]/30'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Top Accent Strip */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] transition-opacity ${
          highlight
            ? 'bg-[#00F0FF] opacity-100 shadow-[0_0_8px_#00F0FF]'
            : 'bg-white/10 group-hover:bg-white/25 opacity-70'
        }`}
      />

      {/* Header: Micro-Header & Symbol Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded-[2px] border ${accent.badge}`}
          >
            {symbol}
          </span>
          <span className="font-mono text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-300">
            {label}
          </span>
        </div>

        {formula && (
          <span className="font-mono text-[10px] text-cyan-300 bg-[#0B0F19] px-2 py-0.5 rounded-[2px] border border-white/10 shrink-0">
            {formatMathFormula(formula)}
          </span>
        )}
      </div>

      {/* Numerical Output Block (Monospace Engineering Display) */}
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-white tabular-nums drop-shadow-xs">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-mono font-semibold uppercase text-slate-400 tracking-wider">
            {unit}
          </span>
        )}
      </div>

      {/* Subtext Detail Footer */}
      {subtext && (
        <div className="mt-2.5 text-[11px] font-mono text-slate-400 flex items-center gap-2 border-t border-white/10 pt-2">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${accent.dot}`} />
          <span className="leading-snug">{subtext}</span>
        </div>
      )}
    </div>
  );
};
