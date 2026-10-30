import React from 'react';
import { formatVoltage, cleanFloat, formatFrequency } from '../../utils/formatters';
import { DynamicSchematicText } from './DynamicSchematicText';

interface PrecisionRectifierSchematicSvgProps {
  vin: number;
  vinUnit: 'V' | 'mV';
  frequency: number;
  frequencyUnit: 'Hz' | 'kHz';
  posVsat?: number;
  negVsat?: number;
  isClipped?: boolean;
}

export const PrecisionRectifierSchematicSvg: React.FC<PrecisionRectifierSchematicSvgProps> = ({
  vin,
  vinUnit,
  frequency,
  frequencyUnit,
  posVsat = 15,
  negVsat = -15,
  isClipped,
}) => {
  const vinText = `${vin} ${vinUnit}`;
  const freqText = `${frequency} ${frequencyUnit}`;
  const isPositiveCycle = vin > 0;
  const isZeroVin = Math.abs(vin) < 1e-5;
  const isSaturated = isClipped ?? (Math.abs(vin) >= posVsat - 0.05);

  const outputWireStroke = isSaturated ? '#FF5722' : '#00F0FF';
  const outputWireFilter = isSaturated ? 'drop-shadow(0 0 6px rgba(255, 87, 34, 0.85))' : undefined;

  return (
    <div className="relative w-full overflow-hidden rounded-[4px] border border-white/10 bg-[#0B0F19] p-2 sm:p-4 shadow-md font-mono">
      {/* Top Schematic Status Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-2.5 mb-2 text-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[#00F0FF] font-bold">SCHEMATIC</span>
          <span className="text-white/20">/</span>
          <span className="text-slate-300">Precision Half-Wave Rectifier (Superdiode)</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          {isSaturated && (
            <span className="px-2 py-0.5 rounded-[2px] bg-[#FF5722]/15 border border-[#FF5722]/50 text-[#FF5722] font-bold flex items-center gap-1 animate-pulse">
              <span>⚠️</span> SATURATED (±{posVsat}V)
            </span>
          )}
          {isZeroVin && (
            <span className="px-2 py-0.5 rounded-[2px] bg-[#111520] border border-white/10 text-slate-400">
              INACTIVE (Vin = 0V)
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isPositiveCycle ? 'bg-emerald-400 shadow-[0_0_4px_#10B981]' : 'bg-rose-500'
              }`}
            ></span>
            <span className={isPositiveCycle ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
              {isPositiveCycle ? 'D1: ON (Forward-Biased)' : 'D1: OFF (Reverse-Biased)'}
            </span>
          </span>
          <span className="text-slate-400">Freq: {freqText}</span>
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
            <pattern id="grid-rect" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.6" fill="rgba(0, 240, 255, 0.08)" />
            </pattern>
            <marker
              id="arrow-rect-cyan"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#00F0FF" />
            </marker>
            <marker
              id="arrow-rect-orange"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#FF5722" />
            </marker>
          </defs>

          {/* Background Grid */}
          <rect width="760" height="380" fill="url(#grid-rect)" />

          {/* ===================== ZERO-STATE DIMMED INPUT PATH ===================== */}
          <g style={{ opacity: isZeroVin ? 0.28 : 1, transition: 'opacity 0.25s ease-in-out' }}>
            {/* Vin terminal probe at (75, 230) */}
            <circle cx="75" cy="230" r="5.5" fill="#0B0F19" stroke="#00F0FF" strokeWidth="2.5" />
            <rect x="25" y="175" width="95" height="42" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.3)" />
            <text x="72" y="192" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
              Vin (AC Sine)
            </text>
            <DynamicSchematicText
              value={vinText}
              x="72"
              y="209"
              fill="#00F0FF"
              fontSize="13"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
              textAnchor="middle"
              defaultColor="#00F0FF"
            />

            {/* Wire: (75, 230) to (300, 230) */}
            <line x1="80" y1="230" x2="300" y2="230" stroke="#00F0FF" strokeWidth="2.5" />
            {!isZeroVin && (
              <line x1="120" y1="230" x2="220" y2="230" stroke="#00F0FF" strokeWidth="2.5" markerEnd="url(#arrow-rect-cyan)" />
            )}
          </g>

          {/* Non-inverting junction at (300, 230) */}
          <circle cx="300" cy="230" r="4.5" fill="#00F0FF" />

          {/* ===================== OP-AMP TRIANGLE ===================== */}
          {/* Op-amp body: vertices at (300, 140), (300, 260), (400, 200) */}
          <polygon
            points="300,140 300,260 400,200"
            fill="#111520"
            stroke="rgba(0, 240, 255, 0.35)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Inputs markers */}
          <text x="315" y="176" fill="#F87171" fontSize="18" fontWeight="bold" fontFamily="JetBrains Mono">
            −
          </text>
          <text x="315" y="235" fill="#34D399" fontSize="18" fontWeight="bold" fontFamily="JetBrains Mono">
            +
          </text>

          {/* Op-Amp Label */}
          <text x="345" y="204" fill="#64748B" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle" fontWeight="bold">
            Aol ≈ ∞
          </text>

          {/* ===================== OP-AMP OUTPUT TO DIODE D1 ===================== */}
          {/* Wire: (400, 200) to (445, 200) */}
          <line x1="400" y1="200" x2="445" y2="200" stroke={outputWireStroke} strokeWidth="2.5" />

          {/* Diode D1 symbol from x=445 to x=485, y=200 */}
          {/* Anode triangle */}
          <polygon
            points="445,185 445,215 470,200"
            fill={isPositiveCycle ? '#10B981' : '#1E293B'}
            stroke={isPositiveCycle ? '#34D399' : '#64748B'}
            strokeWidth="2"
            style={{ transition: 'all 0.25s ease-in-out' }}
          />
          {/* Cathode bar */}
          <line
            x1="470"
            y1="185"
            x2="470"
            y2="215"
            stroke={isPositiveCycle ? '#34D399' : '#64748B'}
            strokeWidth="2.5"
            style={{ transition: 'all 0.25s ease-in-out' }}
          />

          {/* Diode Label */}
          <rect x="415" y="158" width="85" height="20" rx="2" fill="#111520" stroke="rgba(255, 255, 255, 0.1)" />
          <DynamicSchematicText
            value={isPositiveCycle ? 'D1 (ON)' : 'D1 (OFF)'}
            x="457"
            y="172"
            fill={isPositiveCycle ? '#34D399' : '#94A3B8'}
            fontSize="10"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor={isPositiveCycle ? '#34D399' : '#94A3B8'}
          />

          {/* Wire from Cathode (470, 200) to Node Vout (520, 200) */}
          <line x1="470" y1="200" x2="520" y2="200" stroke={outputWireStroke} strokeWidth="2.5" />
          <circle cx="520" cy="200" r="4.5" fill={outputWireStroke} />

          {/* ===================== NEGATIVE FEEDBACK LOOP (Vout -> Inverting -) ===================== */}
          {/* Branch up from Node Vout (520, 200) to (520, 110) */}
          <line x1="520" y1="200" x2="520" y2="110" stroke={isPositiveCycle ? '#00F0FF' : '#475569'} strokeWidth="2" />

          {/* Feedback line: (520, 110) to (260, 110) */}
          <line x1="520" y1="110" x2="260" y2="110" stroke={isPositiveCycle ? '#00F0FF' : '#475569'} strokeWidth="2" />

          {/* Wire down from (260, 110) to inverting input (300, 170) */}
          <line x1="260" y1="110" x2="260" y2="170" stroke={isPositiveCycle ? '#00F0FF' : '#475569'} strokeWidth="2" />
          <line x1="260" y1="170" x2="300" y2="170" stroke={isPositiveCycle ? '#00F0FF' : '#475569'} strokeWidth="2" />

          {/* Feedback loop label */}
          <rect x="320" y="96" width="150" height="22" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.2)" />
          <text x="395" y="111" fill="#94A3B8" fontSize="9.5" fontFamily="JetBrains Mono" textAnchor="middle">
            {isPositiveCycle ? 'Closed Feedback (V⁻ = Vin)' : 'Open Feedback (Diode OFF)'}
          </text>

          {/* ===================== LOAD RESISTOR RL ===================== */}
          {/* Branch down from Node Vout (520, 200) to RL (520, 245) */}
          <line x1="520" y1="200" x2="520" y2="245" stroke="#00F0FF" strokeWidth="2.5" />

          {/* Resistor RL: (520, 245) to (520, 310) */}
          <path
            d="M 520 245 L 520 252 L 505 258 L 535 268 L 505 278 L 535 288 L 505 298 L 520 304 L 520 310"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Ground under RL */}
          <line x1="505" y1="310" x2="535" y2="310" stroke="#94A3B8" strokeWidth="2.5" />
          <line x1="510" y1="315" x2="530" y2="315" stroke="#94A3B8" strokeWidth="2" />
          <line x1="516" y1="320" x2="524" y2="320" stroke="#94A3B8" strokeWidth="1.5" />

          {/* Resistor RL Label */}
          <rect x="545" y="268" width="85" height="22" rx="3" fill="#1c160c" stroke="rgba(245, 158, 11, 0.4)" />
          <DynamicSchematicText
            value="RL (10 kΩ)"
            x="587"
            y="283"
            fill="#FBBF24"
            fontSize="10"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor="#FBBF24"
          />

          {/* ===================== DYNAMIC OUTPUT TERMINAL ===================== */}
          {/* Wire: (520, 200) to (660, 200) */}
          <line
            x1="520"
            y1="200"
            x2="660"
            y2="200"
            stroke={outputWireStroke}
            strokeWidth={isSaturated ? 3.5 : 2.5}
            style={{ filter: outputWireFilter, transition: 'all 0.25s ease-in-out' }}
          />
          {!isZeroVin && isPositiveCycle && (
            <line
              x1="570"
              y1="200"
              x2="620"
              y2="200"
              stroke={outputWireStroke}
              strokeWidth="2.5"
              markerEnd={isSaturated ? 'url(#arrow-rect-orange)' : 'url(#arrow-rect-cyan)'}
            />
          )}

          {/* Vout Probe terminal at (660, 200) */}
          <circle
            cx="660"
            cy="200"
            r="5.5"
            fill="#0B0F19"
            stroke={outputWireStroke}
            strokeWidth="2.5"
            style={{ filter: outputWireFilter, transition: 'all 0.25s ease-in-out' }}
          />
          <rect
            x="610"
            y="145"
            width="110"
            height="46"
            rx="3"
            fill={isSaturated ? '#1f110c' : '#111520'}
            stroke={isSaturated ? '#FF5722' : 'rgba(0, 240, 255, 0.3)'}
            strokeWidth={isSaturated ? 1.5 : 1}
            style={{ transition: 'all 0.25s ease-in-out' }}
          />
          <text
            x="665"
            y="160"
            fill={isSaturated ? '#FF5722' : '#94A3B8'}
            fontSize="10"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            fontWeight={isSaturated ? 'bold' : 'normal'}
          >
            {isSaturated ? 'Vout (SAT ±Vsat)' : 'Vout (Half-Wave)'}
          </text>
          <DynamicSchematicText
            value={isPositiveCycle ? `+${vinText}` : '0.00 V'}
            x="665"
            y="178"
            fill={isSaturated ? '#FF5722' : isPositiveCycle ? '#00F0FF' : '#94A3B8'}
            fontSize="13"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor={isSaturated ? '#FF5722' : isPositiveCycle ? '#00F0FF' : '#94A3B8'}
          />

          {/* Engineering Insight Badge at Bottom */}
          <rect x="30" y="325" width="410" height="34" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.2)" />
          <text x="45" y="342" fill="#00F0FF" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
            Virtual Knee Drop Elimination:
          </text>
          <text x="45" y="353" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono">
            Effective Vγ = VD / Aol ≈ 0.7 V / 100,000 ≈ 7 µV (millivolt signals rectified without loss)
          </text>
        </svg>
      </div>
    </div>
  );
};
