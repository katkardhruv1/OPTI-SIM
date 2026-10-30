import React from 'react';
import { Sliders, RefreshCw, CheckCircle2, RotateCcw } from 'lucide-react';
import { playTick } from '../../utils/audioFeedback';

export interface BinaryToggleGroupProps {
  resolution: number;
  value: string;
  onChange?: (newBinary: string, decimalValue: number) => void;
  label?: string;
  subtext?: string;
  readOnly?: boolean;
  accentColor?: 'cyan' | 'orange';
  showQuickActions?: boolean;
  showBitWeights?: boolean;
  showDecimalReadout?: boolean;
}

export const BinaryToggleGroup: React.FC<BinaryToggleGroupProps> = ({
  resolution,
  value,
  onChange,
  label = 'Digital Binary Input',
  subtext,
  readOnly = false,
  accentColor = 'cyan',
  showQuickActions = true,
  showBitWeights = true,
  showDecimalReadout = true,
}) => {
  // Normalize binary string to exact resolution length
  const rawClean = (value || '').replace(/[^01]/g, '');
  const paddedBin = rawClean.padStart(resolution, '0').slice(-resolution);
  const bits = paddedBin.split('');
  const decimalVal = parseInt(paddedBin, 2) || 0;
  const maxDecimal = Math.pow(2, resolution) - 1;

  const handleBitClick = (bitIndex: number) => {
    if (readOnly || !onChange) return;
    playTick();
    const newBits = [...bits];
    newBits[bitIndex] = newBits[bitIndex] === '1' ? '0' : '1';
    const newBinary = newBits.join('');
    const newDec = parseInt(newBinary, 2) || 0;
    onChange(newBinary, newDec);
  };

  const setAllBits = (bitVal: '0' | '1') => {
    if (readOnly || !onChange) return;
    playTick();
    const newBinary = bitVal.repeat(resolution);
    const newDec = parseInt(newBinary, 2) || 0;
    onChange(newBinary, newDec);
  };

  const invertAllBits = () => {
    if (readOnly || !onChange) return;
    playTick();
    const newBinary = bits.map((b) => (b === '1' ? '0' : '1')).join('');
    const newDec = parseInt(newBinary, 2) || 0;
    onChange(newBinary, newDec);
  };

  const setMidscale = () => {
    if (readOnly || !onChange) return;
    playTick();
    const midVal = Math.floor(Math.pow(2, resolution) / 2);
    const newBinary = midVal.toString(2).padStart(resolution, '0');
    onChange(newBinary, midVal);
  };

  // Color schemes
  const isCyan = accentColor === 'cyan';
  const activeColorHex = isCyan ? '#00F0FF' : '#FF5722';
  const activeLedGlow = isCyan
    ? 'shadow-[0_0_8px_#00F0FF]'
    : 'shadow-[0_0_8px_#FF5722]';
  const activeSwitchGlow = isCyan
    ? 'shadow-[0_0_12px_rgba(0,240,255,0.45)]'
    : 'shadow-[0_0_12px_rgba(255,87,34,0.45)]';

  // Responsive switch sizing based on resolution
  const getSwitchWidthClass = () => {
    if (resolution <= 4) return 'w-11 sm:w-12';
    if (resolution <= 8) return 'w-8 sm:w-9';
    return 'w-7 sm:w-7.5';
  };

  return (
    <div className="flex flex-col w-full rounded-[4px] border border-white/10 bg-[#0B0F19] p-3 sm:p-3.5 space-y-2.5 font-mono select-none">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 flex-wrap gap-1.5">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">
            {label}
          </span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#111520] border border-white/10 text-[#00F0FF]">
            {resolution}-BIT
          </span>
        </div>

        {/* Readout chip */}
        {showDecimalReadout && (
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-400">
              Value:{' '}
              <span className="text-white font-bold">{decimalVal}</span>
              <span className="text-slate-500 text-[10px]">/{maxDecimal}</span>
            </span>
            <span className="px-1.5 py-0.5 rounded-[2px] bg-[#111520] border border-white/10 text-slate-300 text-[10px]">
              0x{decimalVal.toString(16).toUpperCase().padStart(Math.ceil(resolution / 4), '0')}
            </span>
          </div>
        )}
      </div>

      {subtext && <p className="text-[11px] text-slate-400 font-sans">{subtext}</p>}

      {/* Hardware DIP Switch Bank */}
      <div className="w-full bg-[#060911] border border-white/10 rounded-[3px] p-2 sm:p-2.5 shadow-inner">
        {/* Alignment labels (MSB to LSB header) */}
        <div className="flex items-center justify-between text-[9px] text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">
          <span className="flex items-center gap-1 font-bold text-[#00F0FF]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] inline-block shadow-[0_0_4px_#00F0FF]"></span>
            MSB (b{resolution - 1})
          </span>
          <span className="text-slate-500 font-sans text-[10px]">
            {readOnly ? 'Illuminated Hardware Output Bus' : 'Tactile DIP Switches (Click to Toggle)'}
          </span>
          <span className="flex items-center gap-1 font-bold text-slate-300">
            LSB (b0)
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block"></span>
          </span>
        </div>

        {/* Switches Row */}
        <div className="flex items-center justify-between gap-1 sm:gap-1.5 overflow-x-auto py-1 px-0.5">
          {bits.map((bit, idx) => {
            const bitPos = resolution - 1 - idx;
            const isHigh = bit === '1';
            const bitWeight = Math.pow(2, bitPos);

            return (
              <div
                key={`bit-toggle-${idx}`}
                className={`flex flex-col items-center flex-shrink-0 ${getSwitchWidthClass()}`}
              >
                {/* Top Bit Name */}
                <span
                  className={`text-[9.5px] font-bold mb-1 transition-colors ${
                    isHigh ? 'text-[#00F0FF]' : 'text-slate-400'
                  }`}
                >
                  b{bitPos}
                </span>

                {/* Tactile Rocker Switch Body */}
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => handleBitClick(idx)}
                  className={`w-full h-16 rounded-[3px] p-1 flex flex-col justify-between items-center transition-all duration-150 ease-in-out cursor-pointer active:scale-95 border ${
                    readOnly ? 'cursor-default' : ''
                  } ${
                    isHigh
                      ? `bg-[#0B1E2A] border-[#00F0FF]/60 ${activeSwitchGlow}`
                      : 'bg-[#111520] border-white/10 hover:border-white/20'
                  }`}
                  role="switch"
                  aria-checked={isHigh}
                  aria-label={`Bit ${bitPos}, value ${bit}`}
                  title={`Bit ${bitPos} (Weight: 2^${bitPos} = ${bitWeight}): Click to ${isHigh ? 'clear (0)' : 'set (1)'}`}
                >
                  {/* Status LED pip indicator */}
                  <div
                    className={`w-2 h-1 rounded-full transition-all duration-150 ${
                      isHigh
                        ? `bg-[#00F0FF] ${activeLedGlow}`
                        : 'bg-slate-700 opacity-60'
                    }`}
                  />

                  {/* Rocker Actuator Lever */}
                  <div
                    className={`w-full rounded-[2px] flex items-center justify-center font-bold font-mono transition-all duration-150 transform ${
                      isHigh
                        ? 'h-7 bg-[#00F0FF] text-[#0B0F19] shadow-[0_2px_6px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.7)] translate-y-[-1px]'
                        : 'h-6 bg-[#1A1E29] text-slate-400 border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] translate-y-[2px]'
                    }`}
                  >
                    <span className={resolution > 8 ? 'text-[11px]' : 'text-xs'}>
                      {bit}
                    </span>
                  </div>

                  {/* Rocker Base Label */}
                  <span
                    className={`text-[8.5px] font-semibold uppercase tracking-tighter ${
                      isHigh ? 'text-[#00F0FF]' : 'text-slate-500'
                    }`}
                  >
                    {isHigh ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* Bottom Positional Weight */}
                {showBitWeights && (
                  <span
                    className={`text-[8.5px] mt-1 font-mono transition-colors text-center ${
                      isHigh ? 'text-[#00F0FF] font-semibold' : 'text-slate-400'
                    }`}
                    title={`2^${bitPos} = ${bitWeight}`}
                  >
                    {bitWeight >= 1000 ? `${(bitWeight / 1024).toFixed(0)}k` : bitWeight}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Action Toolbar (Preset Toggles) */}
      {showQuickActions && !readOnly && (
        <div className="flex items-center justify-between pt-1 border-t border-white/10 flex-wrap gap-1.5 text-[10px]">
          <span className="text-slate-400 text-[10.5px]">Quick Set:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setAllBits('0')}
              className="px-2 py-0.5 rounded-[2px] bg-[#111520] hover:bg-white/5 border border-white/10 text-slate-300 hover:text-white transition"
              title="Set all bits to 0 (Clear)"
            >
              CLR (0000)
            </button>
            <button
              type="button"
              onClick={setMidscale}
              className="px-2 py-0.5 rounded-[2px] bg-[#111520] hover:bg-white/5 border border-white/10 text-slate-300 hover:text-white transition"
              title="Set to midscale (MSB=1, rest 0)"
            >
              MID (1000)
            </button>
            <button
              type="button"
              onClick={() => setAllBits('1')}
              className="px-2 py-0.5 rounded-[2px] bg-[#111520] hover:bg-white/5 border border-white/10 text-[#00F0FF] hover:text-[#00F0FF] transition"
              title="Set all bits to 1 (Full-scale)"
            >
              SET (1111)
            </button>
            <button
              type="button"
              onClick={invertAllBits}
              className="px-2 py-0.5 rounded-[2px] bg-[#111520] hover:bg-white/5 border border-white/10 text-amber-400 hover:text-amber-300 transition flex items-center gap-1"
              title="Invert all bit states (Bitwise NOT)"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              NOT (~)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
