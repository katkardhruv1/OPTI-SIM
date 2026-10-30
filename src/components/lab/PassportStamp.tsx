import React from 'react';
import { ShieldCheck, CheckCircle2, Award } from 'lucide-react';

interface PassportStampProps {
  completed?: boolean;
  date?: string;
  variant?: 'cyan' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PassportStamp: React.FC<PassportStampProps> = ({
  completed = true,
  date,
  variant = 'cyan',
  size = 'md',
  className = '',
}) => {
  if (!completed) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] border border-dashed border-white/20 bg-[#0B0F19]/80 text-[10px] font-mono text-slate-400 tracking-wider uppercase select-none ${className}`}
        title="Practical pending simulation and observation verification"
      >
        <span className="w-1.5 h-1.5 rounded-full border border-slate-500 shrink-0" />
        <span>Pending Validation</span>
      </div>
    );
  }

  const isOrange = variant === 'orange';
  const accentColor = isOrange ? 'text-[#FF5722]' : 'text-[#00F0FF]';
  const borderColor = isOrange ? 'border-[#FF5722]' : 'border-[#00F0FF]';
  const glow = isOrange
    ? 'shadow-[0_0_16px_rgba(255,87,34,0.35)]'
    : 'shadow-[0_0_16px_rgba(0,240,255,0.35)]';

  const sizeClasses = {
    sm: 'p-1.5 text-[9px] max-w-[130px]',
    md: 'p-2 text-[10px] max-w-[170px]',
    lg: 'p-2.5 text-xs max-w-[210px]',
  }[size];

  return (
    <div
      className={`pointer-events-none select-none transform -rotate-6 transition-all duration-300 ${className}`}
    >
      <div
        className={`relative rounded-[3px] border-2 ${borderColor} bg-[#0B0F19]/90 backdrop-blur-xs ${glow} ${sizeClasses} font-mono`}
      >
        {/* Corner Technical Crosshairs */}
        <div className={`absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 ${borderColor}`} />
        <div className={`absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 ${borderColor}`} />
        <div className={`absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 ${borderColor}`} />
        <div className={`absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 ${borderColor}`} />

        {/* Inner Border Ring */}
        <div
          className={`border border-dashed ${borderColor}/60 rounded-[2px] p-1.5 flex flex-col items-center justify-center text-center`}
        >
          {/* Top Micro-Header */}
          <div className="flex items-center gap-1 text-[8px] uppercase tracking-widest text-slate-300 font-bold opacity-90 leading-none pb-0.5">
            <ShieldCheck className={`w-2.5 h-2.5 ${accentColor}`} />
            <span>OPTI-SIM LAB PASSPORT</span>
          </div>

          {/* Central Stamp Heading */}
          <div className="py-0.5">
            <span
              className={`block font-black tracking-widest uppercase text-xs sm:text-sm drop-shadow-xs ${accentColor}`}
            >
              ★ VERIFIED ★
            </span>
          </div>

          {/* Bottom Accreditation / Date */}
          <div className="flex items-center justify-between w-full pt-0.5 border-t border-white/10 text-[7px] text-slate-400 font-bold tracking-wider uppercase leading-none">
            <span>PASSPORT SEAL</span>
            <span>{date || 'ACCREDITED'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
