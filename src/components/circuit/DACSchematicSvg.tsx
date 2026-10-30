import React from 'react';
import { DACResolution } from '../../types/circuit';
import { cleanFloat } from '../../utils/formatters';
import { DynamicSchematicText } from './DynamicSchematicText';

interface DACSchematicSvgProps {
  resolution: DACResolution;
  vref: number;
  binaryString: string;
  decimalValue: number;
  vout: number;
  posVsat?: number;
  negVsat?: number;
  isClipped?: boolean;
}

export const DACSchematicSvg: React.FC<DACSchematicSvgProps> = ({
  resolution,
  vref,
  binaryString,
  decimalValue,
  vout,
  posVsat = 15,
  negVsat = -15,
  isClipped,
}) => {
  // Extract 4 lowest/highest bits for schematic display
  const paddedBin = binaryString.padStart(4, '0');
  const d3 = paddedBin[paddedBin.length - 4] === '1';
  const d2 = paddedBin[paddedBin.length - 3] === '1';
  const d1 = paddedBin[paddedBin.length - 2] === '1';
  const d0 = paddedBin[paddedBin.length - 1] === '1';

  const bits = [
    { label: 'D3 (MSB)', bit: d3, x: 120 },
    { label: 'D2', bit: d2, x: 220 },
    { label: 'D1', bit: d1, x: 320 },
    { label: 'D0 (LSB)', bit: d0, x: 420 },
  ];

  // Dynamic States
  const isZeroState = decimalValue === 0;
  const isSaturated = isClipped ?? (Math.abs(vout) >= posVsat - 0.05);

  const outputWireStroke = isSaturated ? '#FF5722' : '#00F0FF';
  const outputWireFilter = isSaturated ? 'drop-shadow(0 0 6px rgba(255, 87, 34, 0.85))' : undefined;

  return (
    <div className="relative w-full overflow-hidden rounded-[4px] border border-white/10 bg-[#0B0F19] p-2 sm:p-4 shadow-md font-mono">
      {/* Top Schematic Status Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-2.5 mb-2 text-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[#00F0FF] font-bold">SCHEMATIC</span>
          <span className="text-white/20">/</span>
          <span className="text-slate-300">4-Bit R-2R Ladder Op-Amp Digital-to-Analog Converter</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          {isSaturated && (
            <span className="px-2 py-0.5 rounded-[2px] bg-[#FF5722]/15 border border-[#FF5722]/50 text-[#FF5722] font-bold flex items-center gap-1 animate-pulse">
              <span>⚠️</span> SATURATED (±{posVsat}V)
            </span>
          )}
          {isZeroState && (
            <span className="px-2 py-0.5 rounded-[2px] bg-[#111520] border border-white/10 text-slate-400">
              ZERO-STATE (Code = 0)
            </span>
          )}
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF] inline-block shadow-[0_0_4px_#00F0FF]"></span>
            <span>Vref = {cleanFloat(vref, 2)} V</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span>Code = {binaryString}₂</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span>Vout = {cleanFloat(vout, 3)} V</span>
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full flex items-center justify-center">
        <svg
          viewBox="0 0 760 380"
          className="w-full h-auto max-w-[760px] select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid-dac" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.6" fill="rgba(0, 240, 255, 0.08)" />
            </pattern>
          </defs>

          {/* Background grid */}
          <rect width="760" height="380" fill="#0B0F19" />
          <rect width="760" height="380" fill="url(#grid-dac)" />

          {/* ===================== ZERO-STATE REACTIVE LADDER INPUT ===================== */}
          <g style={{ opacity: isZeroState ? 0.35 : 1, transition: 'opacity 0.25s ease-in-out' }}>
            {/* Vref Rail along top */}
            <line x1="80" y1="45" x2="480" y2="45" stroke="#00F0FF" strokeWidth="2.5" />
            <circle cx="80" cy="45" r="4" fill="#00F0FF" />
            <rect x="25" y="33" width="50" height="24" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1" />
            <DynamicSchematicText
              value="+Vref"
              x="50"
              y="49"
              textAnchor="middle"
              className="text-[11px] font-mono font-bold"
              fill="#00F0FF"
              defaultColor="#00F0FF"
            />
          </g>

          {/* GND Rail along bottom */}
          <line x1="80" y1="125" x2="480" y2="125" stroke="#475569" strokeWidth="2" />
          <circle cx="80" cy="125" r="4" fill="#475569" />
          <text x="50" y="129" textAnchor="middle" className="text-[11px] font-mono fill-slate-400 font-bold">
            GND
          </text>

          {/* Horizontal R-2R ladder line at Y = 200 */}
          {/* Ground termination resistor 2R at far right */}
          <line x1="420" y1="200" x2="480" y2="200" stroke="#00F0FF" strokeWidth="2" />
          {/* Termination 2R resistor */}
          <rect x="480" y="192" width="30" height="16" rx="2" fill="#111520" stroke="#00F0FF" strokeWidth="1.5" />
          <text x="495" y="204" textAnchor="middle" className="text-[10px] font-mono fill-[#00F0FF] font-bold">
            2R
          </text>
          <line x1="510" y1="200" x2="530" y2="200" stroke="#475569" strokeWidth="2" />
          {/* Ground symbol at termination */}
          <line x1="530" y1="192" x2="530" y2="208" stroke="#64748B" strokeWidth="2" />
          <line x1="535" y1="195" x2="535" y2="205" stroke="#64748B" strokeWidth="1.5" />
          <line x1="540" y1="198" x2="540" y2="202" stroke="#64748B" strokeWidth="1" />

          {/* Horizontal Series R resistors between ladder taps */}
          {/* Between D3 (x:120) and D2 (x:220) */}
          <line x1="120" y1="200" x2="155" y2="200" stroke="#00F0FF" strokeWidth="2" />
          <rect x="155" y="192" width="30" height="16" rx="2" fill="#111520" stroke="#00F0FF" strokeWidth="1.5" />
          <text x="170" y="204" textAnchor="middle" className="text-[10px] font-mono fill-[#00F0FF] font-bold">R</text>
          <line x1="185" y1="200" x2="220" y2="200" stroke="#00F0FF" strokeWidth="2" />

          {/* Between D2 (x:220) and D1 (x:320) */}
          <line x1="220" y1="200" x2="255" y2="200" stroke="#00F0FF" strokeWidth="2" />
          <rect x="255" y="192" width="30" height="16" rx="2" fill="#111520" stroke="#00F0FF" strokeWidth="1.5" />
          <text x="270" y="204" textAnchor="middle" className="text-[10px] font-mono fill-[#00F0FF] font-bold">R</text>
          <line x1="285" y1="200" x2="320" y2="200" stroke="#00F0FF" strokeWidth="2" />

          {/* Between D1 (x:320) and D0 (x:420) */}
          <line x1="320" y1="200" x2="355" y2="200" stroke="#00F0FF" strokeWidth="2" />
          <rect x="355" y="192" width="30" height="16" rx="2" fill="#111520" stroke="#00F0FF" strokeWidth="1.5" />
          <text x="370" y="204" textAnchor="middle" className="text-[10px] font-mono fill-[#00F0FF] font-bold">R</text>
          <line x1="385" y1="200" x2="420" y2="200" stroke="#00F0FF" strokeWidth="2" />

          {/* 4 Shunt Legs for D3, D2, D1, D0 */}
          {bits.map((b, idx) => {
            const isHigh = b.bit;
            const switchY = isHigh ? 45 : 125;
            const switchColor = isHigh ? '#00F0FF' : '#64748B';

            return (
              <g key={`leg-${idx}`}>
                {/* Tap node on horizontal ladder line */}
                <circle cx={b.x} cy="200" r="3.5" fill="#00F0FF" />

                {/* Shunt 2R resistor */}
                <line x1={b.x} y1="200" x2={b.x} y2="175" stroke="#00F0FF" strokeWidth="2" />
                <rect x={b.x - 10} y="145" width="20" height="30" rx="2" fill="#111520" stroke="#00F0FF" strokeWidth="1.5" />
                <text x={b.x} y="164" textAnchor="middle" className="text-[9px] font-mono fill-[#00F0FF] font-bold">
                  2R
                </text>
                <line x1={b.x} y1="145" x2={b.x} y2="120" stroke="#00F0FF" strokeWidth="2" />

                {/* Single Pole Double Throw (SPDT) Switch */}
                <circle cx={b.x} cy="115" r="3" fill="#CBD5E1" />
                {/* Switch throw line to Vref (y:45) or GND (y:125) */}
                <line
                  x1={b.x}
                  y1="115"
                  x2={b.x}
                  y2={switchY}
                  stroke={switchColor}
                  strokeWidth="2.5"
                  strokeDasharray={isHigh ? 'none' : '2 2'}
                  style={{
                    filter: isHigh ? 'drop-shadow(0 0 4px #00F0FF)' : undefined,
                    transition: 'all 0.25s ease-in-out',
                  }}
                />
                <circle cx={b.x} cy={switchY} r="3" fill={switchColor} />

                {/* Bit state indicator badge */}
                <g transform={`translate(${b.x - 24}, 235)`}>
                  <rect
                    x="0"
                    y="0"
                    width="48"
                    height="32"
                    rx="3"
                    fill={isHigh ? '#0c3547' : '#111520'}
                    stroke={isHigh ? '#00F0FF' : 'rgba(255, 255, 255, 0.1)'}
                    strokeWidth="1.5"
                    style={{ transition: 'all 0.25s ease-in-out' }}
                  />
                  <text x="24" y="14" textAnchor="middle" className="text-[8px] font-mono fill-slate-400">
                    {b.label}
                  </text>
                  <DynamicSchematicText
                    value={isHigh ? '1' : '0'}
                    x="24"
                    y="27"
                    textAnchor="middle"
                    className={`text-[12px] font-mono font-bold ${isHigh ? 'fill-[#00F0FF]' : 'fill-slate-500'}`}
                    defaultColor={isHigh ? '#00F0FF' : '#64748B'}
                  />
                </g>
              </g>
            );
          })}

          {/* Summing connection from D3 to Op-Amp Inverting Input */}
          <line x1="120" y1="200" x2="80" y2="200" stroke="#00F0FF" strokeWidth="2" />
          <line x1="80" y1="200" x2="80" y2="260" stroke="#00F0FF" strokeWidth="2" />
          <line x1="80" y1="260" x2="570" y2="260" stroke="#00F0FF" strokeWidth="2" />
          <line x1="570" y1="260" x2="570" y2="230" stroke="#00F0FF" strokeWidth="2" />
          <line x1="570" y1="230" x2="600" y2="230" stroke="#00F0FF" strokeWidth="2" />

          {/* Op-Amp Triangle */}
          <polygon
            points="600,210 600,270 660,240"
            fill="#111520"
            stroke="rgba(0, 240, 255, 0.35)"
            strokeWidth="2"
          />

          {/* Op-Amp Terminals */}
          <text x="607" y="234" className="text-[16px] font-mono fill-rose-400 font-bold">−</text>
          <text x="607" y="254" className="text-[16px] font-mono fill-emerald-400 font-bold">+</text>

          {/* Non-inverting input grounded */}
          <line x1="600" y1="250" x2="580" y2="250" stroke="#94A3B8" strokeWidth="2" />
          <line x1="580" y1="250" x2="580" y2="280" stroke="#94A3B8" strokeWidth="2" />
          <line x1="572" y1="280" x2="588" y2="280" stroke="#94A3B8" strokeWidth="2" />
          <line x1="575" y1="284" x2="585" y2="284" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="578" y1="288" x2="582" y2="288" stroke="#94A3B8" strokeWidth="1" />

          {/* Feedback Resistor Rf (2R) across Op-Amp */}
          <circle cx="570" cy="230" r="3" fill="#00F0FF" />
          <line x1="570" y1="230" x2="570" y2="180" stroke="#00F0FF" strokeWidth="2" />
          <line x1="570" y1="180" x2="615" y2="180" stroke="#00F0FF" strokeWidth="2" />
          <rect x="615" y="172" width="30" height="16" rx="2" fill="#111520" stroke="#00F0FF" strokeWidth="1.5" />
          <text x="630" y="184" textAnchor="middle" className="text-[10px] font-mono fill-[#00F0FF] font-bold">
            Rf
          </text>
          <line x1="645" y1="180" x2="685" y2="180" stroke="#00F0FF" strokeWidth="2" />
          <line x1="685" y1="180" x2="685" y2="240" stroke="#00F0FF" strokeWidth="2" />

          {/* ===================== DYNAMIC OP-AMP OUTPUT PATH ===================== */}
          <line
            x1="660"
            y1="240"
            x2="710"
            y2="240"
            stroke={outputWireStroke}
            strokeWidth={isSaturated ? 3.5 : 2.5}
            style={{ filter: outputWireFilter, transition: 'all 0.25s ease-in-out' }}
          />
          <circle cx="685" cy="240" r="3" fill={outputWireStroke} />
          <circle
            cx="710"
            cy="240"
            r="4.5"
            fill="#0B0F19"
            stroke={outputWireStroke}
            strokeWidth="2.5"
            style={{ filter: outputWireFilter, transition: 'all 0.25s ease-in-out' }}
          />

          {/* Vout Probe Box */}
          <g transform="translate(645, 260)">
            <rect
              x="0"
              y="0"
              width="105"
              height="38"
              rx="3"
              fill={isSaturated ? '#1f110c' : '#111520'}
              stroke={isSaturated ? '#FF5722' : 'rgba(0, 240, 255, 0.3)'}
              strokeWidth={isSaturated ? 1.5 : 1}
              style={{ transition: 'all 0.25s ease-in-out' }}
            />
            <text x="52" y="14" textAnchor="middle" className="text-[9px] font-mono fill-slate-400 font-semibold">
              {isSaturated ? 'SATURATED' : 'ANALOG VOUT'}
            </text>
            <DynamicSchematicText
              value={`${cleanFloat(vout, 3)} V`}
              x="52"
              y="30"
              textAnchor="middle"
              className="text-[12px] font-mono font-bold"
              fill={outputWireStroke}
              defaultColor={outputWireStroke}
            />
          </g>

          {/* Virtual Ground Note */}
          <text x="560" y="275" textAnchor="end" className="text-[9px] font-mono fill-slate-400">
            Virtual Ground (0 V)
          </text>
        </svg>
      </div>

      {/* Schematic Footer Legend */}
      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-white/10 text-xs text-slate-400 gap-2 font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] inline-block shadow-[0_0_4px_#00F0FF]"></span>
            <span>Bit = 1: Connected to +Vref</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block"></span>
            <span>Bit = 0: Connected to GND</span>
          </div>
        </div>
        <div className="text-slate-500 font-mono text-[11px]">
          Virtual Ground Inverting Summing Node (Rf = 2R)
        </div>
      </div>
    </div>
  );
};
