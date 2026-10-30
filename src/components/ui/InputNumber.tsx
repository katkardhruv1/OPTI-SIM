import React from 'react';

interface InputNumberProps {
  id: string;
  label: string;
  symbol: string;
  value: number;
  unit: string;
  unitOptions?: string[];
  onValueChange: (val: number) => void;
  onUnitChange?: (unit: any) => void;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
  hint?: string;
  helpText?: string;
  disabled?: boolean;
}

export const InputNumber: React.FC<InputNumberProps> = ({
  id,
  label,
  symbol,
  value,
  unit,
  unitOptions,
  onValueChange,
  onUnitChange,
  min,
  max,
  step = 1,
  error,
  hint,
  helpText,
  disabled = false,
}) => {
  const displayHint = hint || helpText;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
          <span className="font-mono text-[#00F0FF] font-bold text-xs px-1 py-0.2 bg-[#0B0F19] rounded-[2px] border border-white/10">
            {symbol}
          </span>
          <span className="tracking-tight">{label}</span>
        </label>
        {displayHint && (
          <span className="text-[10px] text-slate-500 font-mono">{displayHint}</span>
        )}
      </div>

      <div className="relative flex rounded-[3px] shadow-xs">
        <input
          type="number"
          id={id}
          value={isNaN(value) ? '' : value}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            onValueChange(val);
          }}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={`block w-full h-9 rounded-l-[3px] border px-3 text-sm font-mono tabular-nums text-white bg-[#0B0F19] transition-all focus:outline-hidden ${
            disabled ? 'opacity-40 cursor-not-allowed bg-slate-900 text-slate-500' : ''
          } ${
            error
              ? 'border-[#FF5722] focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]/40'
              : 'border-white/10 hover:border-white/20 focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]/40'
          }`}
          placeholder="0.0"
        />

        {unitOptions && unitOptions.length > 1 && onUnitChange ? (
          <select
            value={unit}
            onChange={(e) => onUnitChange(e.target.value)}
            disabled={disabled}
            className="h-9 rounded-r-[3px] border border-l-0 border-white/10 bg-[#111520] px-2.5 text-xs font-mono font-semibold text-[#00F0FF] hover:bg-[#1A1E29] hover:border-white/20 focus:border-[#00F0FF] focus:outline-hidden cursor-pointer transition-colors"
          >
            {unitOptions.map((opt) => (
              <option key={opt} value={opt} className="bg-[#1A1E29] text-white">
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <span className="inline-flex items-center h-9 rounded-r-[3px] border border-l-0 border-white/10 bg-[#111520] px-3 text-xs font-mono font-medium text-slate-400 select-none">
            {unit}
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs text-[#FF5722] flex items-center gap-1.5 font-mono pt-0.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF5722] shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
