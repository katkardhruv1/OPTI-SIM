import React from 'react';
import { Lightbulb, BookOpen, Activity, Zap, CheckCircle2 } from 'lucide-react';
import { formatMathFormula } from '../../utils/mathFormatter';

export interface TheorySpecItem {
  label: string;
  value: string;
  highlight?: boolean;
  accent?: 'cyan' | 'orange' | 'emerald' | 'amber' | 'slate';
}

export type TheorySpecs = TheorySpecItem[] | Record<string, string>;
export type TheoryAccentColor = 'cyan' | 'orange' | 'emerald' | 'amber' | 'slate';

export interface TheoryTileProps {
  title: string;
  category?: string;
  microHeader?: string;
  badge?: string;
  badgeText?: string;
  formula?: string;
  description?: string;
  specs?: TheorySpecs;
  bulletPoints?: string[];
  bullets?: string[];
  accentColor?: TheoryAccentColor;
  badgeVariant?: TheoryAccentColor;
  icon?: 'lightbulb' | 'book' | 'activity' | 'zap' | 'check';
}

export const TheoryTile: React.FC<TheoryTileProps> = ({
  title,
  category,
  microHeader,
  badge,
  badgeText,
  formula,
  description,
  specs,
  bulletPoints,
  bullets,
  accentColor,
  badgeVariant,
  icon = 'lightbulb',
}) => {
  const effectiveCategory = microHeader || category || badge || 'THEORY & PRINCIPLE';
  const effectiveAccent = accentColor || badgeVariant || 'cyan';
  const effectiveBadge = badgeText || badge || title.toUpperCase();
  const effectiveBullets = bullets || bulletPoints || [];
  const formattedFormula = formula ? formatMathFormula(formula) : undefined;

  const normalizedSpecs: TheorySpecItem[] = React.useMemo(() => {
    if (!specs) return [];
    if (Array.isArray(specs)) return specs;
    return Object.entries(specs).map(([label, value]) => ({
      label,
      value: String(value),
    }));
  }, [specs]);

  const getAccent = () => {
    switch (effectiveAccent) {
      case 'orange':
        return {
          headerText: 'text-[#FF5722]',
          badge: 'bg-[#FF5722]/15 text-[#FF5722] border-[#FF5722]/30',
          formulaBg: 'bg-[#0B0F19] text-[#FF5722] border-[#FF5722]/30',
          dot: 'bg-[#FF5722]',
          border: 'border-[#FF5722]/40',
        };
      case 'amber':
        return {
          headerText: 'text-amber-400',
          badge: 'bg-amber-400/15 text-amber-400 border-amber-400/30',
          formulaBg: 'bg-[#0B0F19] text-amber-400 border-amber-400/30',
          dot: 'bg-amber-400',
          border: 'border-amber-400/40',
        };
      case 'emerald':
        return {
          headerText: 'text-[#10B981]',
          badge: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30',
          formulaBg: 'bg-[#0B0F19] text-[#10B981] border-[#10B981]/30',
          dot: 'bg-[#10B981]',
          border: 'border-[#10B981]/40',
        };
      case 'slate':
        return {
          headerText: 'text-slate-400',
          badge: 'bg-white/5 text-slate-300 border-white/10',
          formulaBg: 'bg-[#0B0F19] text-slate-300 border-white/10',
          dot: 'bg-slate-400',
          border: 'border-white/15',
        };
      default:
        return {
          headerText: 'text-[#00F0FF]',
          badge: 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/30',
          formulaBg: 'bg-[#0B0F19] text-[#00F0FF] border-[#00F0FF]/30',
          dot: 'bg-[#00F0FF]',
          border: 'border-[#00F0FF]/40',
        };
    }
  };

  const accent = getAccent();

  const renderIcon = () => {
    const iconClass = `w-3.5 h-3.5 ${accent.headerText}`;
    switch (icon) {
      case 'book':
        return <BookOpen className={iconClass} />;
      case 'activity':
        return <Activity className={iconClass} />;
      case 'zap':
        return <Zap className={iconClass} />;
      case 'check':
        return <CheckCircle2 className={iconClass} />;
      default:
        return <Lightbulb className={iconClass} />;
    }
  };

  return (
    <div className="rounded-[3px] border border-white/10 bg-[#1A1E29] p-4 flex flex-col justify-between space-y-3.5 hover:border-white/20 transition-all">
      {/* Tile Micro-Header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          {renderIcon()}
          <span className="font-mono text-[10px] tracking-wider uppercase font-bold text-slate-400">
            {effectiveCategory}
          </span>
        </div>
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px] border ${accent.badge}`}>
          {effectiveBadge}
        </span>
      </div>

      {/* Prominent Monospace Formula Block if provided */}
      {formattedFormula && (
        <div className={`p-2.5 rounded-[2px] border font-mono text-xs font-bold flex items-center justify-between gap-3 ${accent.formulaBg}`}>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 shrink-0">Formula:</span>
          <span className="text-white text-xs sm:text-sm tracking-tight text-right overflow-x-auto whitespace-nowrap">
            {formattedFormula}
          </span>
        </div>
      )}

      {/* Description */}
      {description && (
        <p className="text-xs text-slate-300 font-sans leading-relaxed">
          {description}
        </p>
      )}

      {/* Bullet Points */}
      {effectiveBullets && effectiveBullets.length > 0 && (
        <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
          {effectiveBullets.map((pt, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${accent.dot}`} />
              <span className="leading-snug">{pt}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Key-Value Engineering Specs Grid */}
      {normalizedSpecs && normalizedSpecs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-white/10">
          {normalizedSpecs.map((spec, idx) => (
            <div
              key={idx}
              className="p-2 rounded-[2px] bg-[#0B0F19] border border-white/10 flex flex-col justify-between"
            >
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                {spec.label}
              </span>
              <span
                className={`font-mono text-xs font-bold mt-0.5 truncate ${
                  spec.accent === 'orange'
                    ? 'text-[#FF5722]'
                    : spec.accent === 'amber'
                    ? 'text-amber-400'
                    : spec.accent === 'emerald'
                    ? 'text-[#10B981]'
                    : spec.accent === 'slate'
                    ? 'text-slate-300'
                    : 'text-[#00F0FF]'
                }`}
              >
                {spec.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
