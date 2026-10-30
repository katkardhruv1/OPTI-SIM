import React from 'react';
import { ADCResolution, ADCComparatorState } from '../../types/circuit';
import { cleanFloat } from '../../utils/formatters';
import { DynamicSchematicText } from './DynamicSchematicText';

interface ADCSchematicSvgProps {
  resolution: ADCResolution;
  vref: number;
  vin: number;
  digitalBinary: string;
  digitalDecimal: number;
  comparatorStates: ADCComparatorState[];
}

export const ADCSchematicSvg: React.FC<ADCSchematicSvgProps> = ({
  resolution,
  vref,
  vin,
  digitalBinary,
  digitalDecimal,
  comparatorStates,
}) => {
  const isZeroVin = Math.abs(vin) < 1e-5;

  return (
    <div className="relative w-full overflow-hidden rounded-[4px] border border-white/10 bg-[#0B0F19] p-2 sm:p-4 shadow-md font-mono">
      {/* Top Schematic Status Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-2.5 mb-2 text-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[#00F0FF] font-bold">SCHEMATIC</span>
          <span className="text-white/20">/</span>
          <span className="text-slate-300">Flash ADC Op-Amp Comparator Ladder & Priority Encoder</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          {isZeroVin && (
            <span className="px-2 py-0.5 rounded-[2px] bg-[#111520] border border-white/10 text-slate-400">
              INACTIVE (Vin = 0V)
            </span>
          )}
          <span className="flex items-center gap-1.5 text-[#00F0FF]">
            <span>Vin = {cleanFloat(vin, 2)} V</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span>Vref = {cleanFloat(vref, 2)} V</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span>Code = {digitalBinary}₂ ({digitalDecimal}₁₀)</span>
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
            <pattern id="grid-adc" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.6" fill="rgba(0, 240, 255, 0.08)" />
            </pattern>
          </defs>

          {/* Background grid */}
          <rect width="760" height="380" fill="#0B0F19" />
          <rect width="760" height="380" fill="url(#grid-adc)" />

          {/* Vref Terminal and top rail */}
          <rect x="25" y="20" width="55" height="24" rx="3" fill="#08231a" stroke="#059669" strokeWidth="1" />
          <DynamicSchematicText
            value="+Vref"
            x="52"
            y="36"
            textAnchor="middle"
            className="text-[10px] font-mono fill-emerald-300 font-bold"
            defaultColor="#6EE7B7"
          />
          <line x1="80" y1="32" x2="120" y2="32" stroke="#10B981" strokeWidth="2.5" />
          <circle cx="120" cy="32" r="4" fill="#10B981" />

          {/* Vertical Resistor Ladder at X = 120 */}
          <line x1="120" y1="32" x2="120" y2="340" stroke="#10B981" strokeWidth="2" strokeDasharray="1 1" />

          {/* Resistors along ladder */}
          {[60, 105, 150, 195, 240, 285].map((y, idx) => (
            <g key={`res-${idx}`}>
              <rect x="112" y={y} width="16" height="24" rx="2" fill="#111520" stroke="#10B981" strokeWidth="1.5" />
              <text x="120" y={y + 16} textAnchor="middle" className="text-[8px] font-mono fill-emerald-400 font-bold">
                R
              </text>
            </g>
          ))}

          {/* Bottom Ground of ladder */}
          <line x1="120" y1="325" x2="120" y2="355" stroke="#475569" strokeWidth="2" />
          <line x1="110" y1="355" x2="130" y2="355" stroke="#64748B" strokeWidth="2" />
          <line x1="114" y1="359" x2="126" y2="359" stroke="#64748B" strokeWidth="1.5" />
          <line x1="117" y1="363" x2="123" y2="363" stroke="#64748B" strokeWidth="1" />
          <text x="95" y="360" textAnchor="end" className="text-[9px] font-mono fill-slate-500 font-bold">GND</text>

          {/* ===================== ZERO-STATE DIMMED ANALOG VIN BUS ===================== */}
          <g style={{ opacity: isZeroVin ? 0.28 : 1, transition: 'opacity 0.25s ease-in-out' }}>
            {/* Vin terminal at top */}
            <g transform="translate(180, 15)">
              <rect x="0" y="0" width="70" height="24" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1" />
              <DynamicSchematicText
                value="ANALOG Vin"
                x="35"
                y="16"
                textAnchor="middle"
                className="text-[10px] font-mono fill-[#00F0FF] font-bold"
                defaultColor="#00F0FF"
              />
            </g>
            {/* Vertical Vin distribution bus */}
            <line x1="215" y1="39" x2="215" y2="320" stroke="#00F0FF" strokeWidth="2.5" />
          </g>

          {/* Comparators 1 to 5 rendered explicitly */}
          {[
            { id: 5, y: 70, vth: (5 * vref) / 8 },
            { id: 4, y: 120, vth: (4 * vref) / 8 },
            { id: 3, y: 170, vth: (3 * vref) / 8 },
            { id: 2, y: 220, vth: (2 * vref) / 8 },
            { id: 1, y: 270, vth: (1 * vref) / 8 },
          ].map((c) => {
            const isHigh = vin >= c.vth;
            const stateColor = isHigh ? '#10B981' : '#475569';
            const stateFilter = isHigh ? 'drop-shadow(0 0 5px rgba(16, 185, 129, 0.75))' : undefined;
            const stateText = isHigh ? '1' : '0';

            return (
              <g key={`comp-${c.id}`}>
                {/* Tap from ladder to (-) inverting input */}
                <line x1="120" y1={c.y + 12} x2="280" y2={c.y + 12} stroke="#10B981" strokeWidth="1.5" />
                <circle cx="120" cy={c.y + 12} r="3" fill="#10B981" />
                <text x="130" y={c.y + 8} className="text-[8px] font-mono fill-emerald-400">
                  {cleanFloat(c.vth, 2)}V
                </text>

                {/* Connection from Vin bus to (+) non-inverting input */}
                <line
                  x1="215"
                  y1={c.y - 12}
                  x2="280"
                  y2={c.y - 12}
                  stroke="#00F0FF"
                  strokeWidth="1.5"
                  style={{ opacity: isZeroVin ? 0.28 : 1, transition: 'opacity 0.25s ease-in-out' }}
                />
                <circle
                  cx="215"
                  cy={c.y - 12}
                  r="3"
                  fill="#00F0FF"
                  style={{ opacity: isZeroVin ? 0.28 : 1, transition: 'opacity 0.25s ease-in-out' }}
                />

                {/* Op-Amp Comparator Triangle */}
                <polygon
                  points={`280,${c.y - 24} 280,${c.y + 24} 330,${c.y}`}
                  fill="#111520"
                  stroke={isHigh ? '#00F0FF' : 'rgba(0, 240, 255, 0.35)'}
                  strokeWidth="1.5"
                  style={{ transition: 'all 0.25s ease-in-out' }}
                />

                {/* Terminals */}
                <text x="284" y={c.y - 8} className="text-[12px] font-mono fill-cyan-400 font-bold">+</text>
                <text x="285" y={c.y + 16} className="text-[12px] font-mono fill-emerald-400 font-bold">−</text>

                <text x="300" y={c.y + 4} textAnchor="middle" className="text-[9px] font-mono fill-slate-400 font-bold">
                  C{c.id}
                </text>

                {/* Output line to Priority Encoder */}
                <line
                  x1="330"
                  y1={c.y}
                  x2="440"
                  y2={c.y}
                  stroke={stateColor}
                  strokeWidth={isHigh ? 2.5 : 1.5}
                  style={{ filter: stateFilter, transition: 'all 0.25s ease-in-out' }}
                />

                {/* State LED */}
                <circle
                  cx="380"
                  cy={c.y}
                  r="5"
                  fill={isHigh ? '#10B981' : '#1E293B'}
                  stroke={isHigh ? '#34D399' : '#475569'}
                  strokeWidth="1.5"
                  style={{ filter: stateFilter, transition: 'all 0.25s ease-in-out' }}
                />
                <text
                  x="380"
                  y={c.y - 8}
                  textAnchor="middle"
                  className={`text-[8px] font-mono font-bold ${isHigh ? 'fill-emerald-300' : 'fill-slate-500'}`}
                >
                  {stateText}
                </text>
              </g>
            );
          })}

          {/* Priority Encoder Block (X: 440 to 560, Y: 50 to 290) */}
          <rect
            x="440"
            y="50"
            width="120"
            height="240"
            rx="4"
            fill="#0B0F19"
            stroke="#6366F1"
            strokeWidth="2"
          />
          <text x="500" y="80" textAnchor="middle" className="text-[11px] font-mono fill-indigo-300 font-bold">
            PRIORITY
          </text>
          <text x="500" y="96" textAnchor="middle" className="text-[11px] font-mono fill-indigo-300 font-bold">
            ENCODER
          </text>
          <text x="500" y="112" textAnchor="middle" className="text-[8px] font-mono fill-slate-400">
            Thermometer → Binary
          </text>

          {/* Input labels on encoder */}
          <text x="448" y="74" className="text-[8px] font-mono fill-slate-400">D5</text>
          <text x="448" y="124" className="text-[8px] font-mono fill-slate-400">D4</text>
          <text x="448" y="174" className="text-[8px] font-mono fill-slate-400">D3</text>
          <text x="448" y="224" className="text-[8px] font-mono fill-slate-400">D2</text>
          <text x="448" y="274" className="text-[8px] font-mono fill-slate-400">D1</text>

          {/* Output lines from encoder to Output Display */}
          {[
            { label: 'B3 (MSB)', y: 130, val: digitalBinary[digitalBinary.length - 4] || '0' },
            { label: 'B2', y: 165, val: digitalBinary[digitalBinary.length - 3] || '0' },
            { label: 'B1', y: 200, val: digitalBinary[digitalBinary.length - 2] || '0' },
            { label: 'B0 (LSB)', y: 235, val: digitalBinary[digitalBinary.length - 1] || '0' },
          ].map((out, idx) => {
            const is1 = out.val === '1';
            const color = is1 ? '#10B981' : '#475569';
            const filter = is1 ? 'drop-shadow(0 0 4px #10B981)' : undefined;
            return (
              <g key={`out-${idx}`}>
                <text x="552" y={out.y + 3} textAnchor="end" className="text-[8px] font-mono fill-slate-400">
                  {out.label}
                </text>
                <line
                  x1="560"
                  y1={out.y}
                  x2="630"
                  y2={out.y}
                  stroke={color}
                  strokeWidth="2.5"
                  style={{ filter, transition: 'all 0.25s ease-in-out' }}
                />
                <circle cx="630" cy={out.y} r="4" fill={color} />
                <rect
                  x="640"
                  y={out.y - 12}
                  width="40"
                  height="24"
                  rx="3"
                  fill={is1 ? '#08231a' : '#111520'}
                  stroke={is1 ? '#10B981' : '#475569'}
                  strokeWidth="1.5"
                  style={{ transition: 'all 0.25s ease-in-out' }}
                />
                <DynamicSchematicText
                  value={out.val}
                  x="660"
                  y={out.y + 4}
                  textAnchor="middle"
                  className={`text-[12px] font-mono font-bold ${is1 ? 'fill-emerald-300' : 'fill-slate-500'}`}
                  defaultColor={is1 ? '#6EE7B7' : '#64748B'}
                />
              </g>
            );
          })}

          {/* Digital Output Result Summary Panel */}
          <g transform="translate(615, 275)">
            <rect
              x="0"
              y="0"
              width="130"
              height="38"
              rx="3"
              fill="#08231a"
              stroke="#059669"
              strokeWidth="1.5"
            />
            <text x="65" y="15" textAnchor="middle" className="text-[9px] font-mono fill-emerald-300 font-semibold">
              OUTPUT WORD
            </text>
            <DynamicSchematicText
              value={`${digitalBinary}₂ (${digitalDecimal}₁₀)`}
              x="65"
              y="30"
              textAnchor="middle"
              className="text-[12px] font-mono fill-emerald-100 font-bold"
              defaultColor="#A7F3D0"
            />
          </g>
        </svg>
      </div>

      {/* Schematic Footer Legend */}
      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-white/10 text-xs text-slate-400 gap-2 font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_4px_#10B981]"></span>
            <span>Comparator Output: 1 (Vin ≥ Vtap)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block"></span>
            <span>Comparator Output: 0 (Vin &lt; Vtap)</span>
          </div>
        </div>
        <div className="text-slate-500 font-mono text-[11px]">
          Flash Architecture: 2^N - 1 high-speed op-amp comparators
        </div>
      </div>
    </div>
  );
};
