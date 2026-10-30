import React from 'react';
import { Activity, CheckCircle2, ShieldAlert } from 'lucide-react';

interface StatusBarProps {
  circuitId?: string;
  calculationStatus?: 'Ready' | 'Calculated' | 'Error';
  lastCalculatedTime?: string;
  hasErrors?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  circuitId,
  calculationStatus = 'Ready',
  lastCalculatedTime,
  hasErrors = false,
}) => {
  return (
    <footer className="h-8 border-t border-white/10 bg-[#1A1E29] px-4 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0 select-none z-30">
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-[#00F0FF]" />
          <span className="text-slate-500">Circuit:</span>
          <span className="text-white font-semibold">{circuitId || 'Active'}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {hasErrors ? (
            <ShieldAlert className="w-3 h-3 text-[#FF5722]" />
          ) : (
            <CheckCircle2 className="w-3 h-3 text-[#00F0FF]" />
          )}
          <span className="text-slate-500">Status:</span>
          <span
            className={`font-semibold ${
              hasErrors
                ? 'text-[#FF5722]'
                : calculationStatus === 'Calculated'
                ? 'text-[#00F0FF]'
                : 'text-slate-300'
            }`}
          >
            {hasErrors ? 'Validation Error' : calculationStatus}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1.5">
          <span className="text-slate-500">Units:</span>
          <span className="text-slate-200">SI Standard (V, Ω, A, Hz)</span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-slate-400">
        {lastCalculatedTime && (
          <span className="hidden sm:inline">
            Updated: <span className="text-white font-medium">{lastCalculatedTime}</span>
          </span>
        )}
        <span className="text-white/10 hidden lg:inline">|</span>
        <span className="hidden lg:inline text-slate-500">OPTI-SIM Core Engine v1.0</span>
      </div>
    </footer>
  );
};
