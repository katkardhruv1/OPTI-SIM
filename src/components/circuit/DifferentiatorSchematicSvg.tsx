import React from 'react';
import { formatResistance, formatCapacitance, formatVoltage, cleanFloat } from '../../utils/formatters';
import { DynamicSchematicText } from './DynamicSchematicText';

interface DifferentiatorSchematicSvgProps {
  vin: number;
  vinUnit: 'V' | 'mV';
  cBase: number;
  rBase: number;
  gain: number;
  vout?: number;
  posVsat?: number;
  negVsat?: number;
  isClipped?: boolean;
}

export const DifferentiatorSchematicSvg: React.FC<DifferentiatorSchematicSvgProps> = ({
  vin,
  vinUnit,
  cBase,
  rBase,
  gain,
  vout,
  posVsat = 15,
  negVsat = -15,
  isClipped,
}) => {
  const vinText = `${vin} ${vinUnit}`;
  const cText = formatCapacitance(cBase);
  const rText = formatResistance(rBase);

  // Dynamic States
  const isZeroVin = Math.abs(vin) < 1e-5;
  const isSaturated = isClipped ?? (vout !== undefined && (Math.abs(vout) >= posVsat - 0.05 || vout >= posVsat || vout <= negVsat));

  // Dynamic Output Wire Styling
  const outputWireStroke = isSaturated ? '#FF5722' : '#00F0FF';
  const outputWireFilter = isSaturated ? 'drop-shadow(0 0 6px rgba(255, 87, 34, 0.85))' : undefined;

  return (
    <div className="relative w-full overflow-hidden rounded-[4px] border border-white/10 bg-[#0B0F19] p-2 sm:p-4 shadow-md font-mono">
      {/* Top Schematic Status Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-2.5 mb-2 text-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[#00F0FF] font-bold">SCHEMATIC</span>
          <span className="text-white/20">/</span>
          <span className="text-slate-300">Practical Inverting Op-Amp Differentiator</span>
        </div>

        {/* Dynamic Alert Badges */}
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
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF] inline-block shadow-[0_0_4px_#00F0FF]"></span>
            <span>Input Capacitor (C)</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shadow-[0_0_4px_#F59E0B]"></span>
            <span>Feedback Resistor (R)</span>
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
            <pattern id="grid-diff-c" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.6" fill="rgba(0, 240, 255, 0.08)" />
            </pattern>
            <marker
              id="arrow-diff-cyan-c"
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
              id="arrow-diff-orange-c"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#FF5722" />
            </marker>
            <marker
              id="arrow-diff-amber-c"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#F59E0B" />
            </marker>
          </defs>

          {/* Background Grid */}
          <rect width="760" height="380" fill="url(#grid-diff-c)" />

          {/* ===================== ZERO-STATE DIMMED INPUT PATH ===================== */}
          <g style={{ opacity: isZeroVin ? 0.28 : 1, transition: 'opacity 0.25s ease-in-out' }}>
            <circle cx="65" cy="200" r="5.5" fill="#0B0F19" stroke="#00F0FF" strokeWidth="2.5" />
            <rect x="20" y="145" width="85" height="42" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.3)" />
            <text x="62" y="162" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
              Vin (Input)
            </text>
            <DynamicSchematicText
              value={vinText}
              x="62"
              y="179"
              fontSize="13"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
              textAnchor="middle"
              defaultColor="#00F0FF"
            />

            {/* Wire: (65, 200) to (180, 200) */}
            <line x1="70" y1="200" x2="180" y2="200" stroke="#00F0FF" strokeWidth="2.5" />
            {!isZeroVin && (
              <line x1="90" y1="200" x2="140" y2="200" stroke="#00F0FF" strokeWidth="2.5" markerEnd="url(#arrow-diff-cyan-c)" />
            )}
          </g>

          {/* Input Capacitor C Plates at (180, 200) to (220, 200) */}
          <line x1="180" y1="200" x2="195" y2="200" stroke="#00F0FF" strokeWidth="2.5" />
          <line x1="195" y1="175" x2="195" y2="225" stroke="#00F0FF" strokeWidth="3" />
          <line x1="207" y1="175" x2="207" y2="225" stroke="#00F0FF" strokeWidth="3" />
          <line x1="207" y1="200" x2="240" y2="200" stroke="#00F0FF" strokeWidth="2.5" />

          {/* C Value Badge */}
          <rect x="165" y="135" width="75" height="26" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.25)" />
          <text x="202" y="151" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
            C:
          </text>
          <DynamicSchematicText
            value={cText}
            x="218"
            y="151"
            fontSize="10.5"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor="#E2E8F0"
          />

          {/* Wire: (240, 200) to Op-Amp Inverting input (420, 200) */}
          <line x1="240" y1="200" x2="420" y2="200" stroke="#00F0FF" strokeWidth="2.5" />
          <circle cx="330" cy="200" r="4.5" fill="#00F0FF" />

          {/* Virtual Ground Indicator */}
          <g transform="translate(305, 220)">
            <rect x="-5" y="0" width="70" height="28" rx="3" fill="#06281e" stroke="#065f46" strokeWidth="1" />
            <text x="30" y="12" fill="#34D399" fontSize="8.5" fontFamily="JetBrains Mono" textAnchor="middle">
              Virtual GND
            </text>
            <text x="30" y="23" fill="#A7F3D0" fontSize="9.5" fontWeight="bold" fontFamily="JetBrains Mono" textAnchor="middle">
              V⁻ ≈ 0V
            </text>
          </g>

          {/* ===================== FEEDBACK RESISTOR (R) ===================== */}
          <line x1="330" y1="200" x2="330" y2="90" stroke="#F59E0B" strokeWidth="2.5" />
          <line x1="330" y1="90" x2="380" y2="90" stroke="#F59E0B" strokeWidth="2.5" />

          {/* Rf Resistor Symbol */}
          <path
            d="M 380 90 L 392 90 L 398 75 L 410 105 L 422 75 L 434 105 L 446 75 L 458 105 L 464 90 L 480 90"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Rf Value Badge */}
          <rect x="385" y="28" width="90" height="34" rx="3" fill="#1c160c" stroke="rgba(245, 158, 11, 0.4)" />
          <text x="430" y="42" fill="#FBBF24" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
            R (Feedback)
          </text>
          <DynamicSchematicText
            value={rText}
            x="430"
            y="56"
            fontSize="12"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor="#FEF08A"
          />

          {/* Feedback wire continuing to output wire at (580, 90) then down to (580, 240) */}
          <line x1="480" y1="90" x2="580" y2="90" stroke="#F59E0B" strokeWidth="2.5" />
          {!isZeroVin && (
            <line x1="495" y1="90" x2="545" y2="90" stroke="#F59E0B" strokeWidth="2.5" markerEnd="url(#arrow-diff-amber-c)" />
          )}
          <line x1="580" y1="90" x2="580" y2="240" stroke="#F59E0B" strokeWidth="2.5" />

          {/* ===================== OP-AMP TRIANGLE ===================== */}
          <polygon
            points="420,160 420,320 530,240"
            fill="#111520"
            stroke="rgba(0, 240, 255, 0.35)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Inverting '-' at (435, 206) */}
          <text
            x="435"
            y="206"
            fill="#F87171"
            fontSize="22"
            fontWeight="bold"
            fontFamily="JetBrains Mono, monospace"
          >
            −
          </text>

          {/* Non-inverting '+' at (435, 287) */}
          <text
            x="435"
            y="287"
            fill="#34D399"
            fontSize="20"
            fontWeight="bold"
            fontFamily="JetBrains Mono, monospace"
          >
            +
          </text>

          <text
            x="465"
            y="245"
            fill="#64748B"
            fontSize="12"
            fontWeight="bold"
            letterSpacing="0.05em"
            fontFamily="JetBrains Mono, monospace"
            textAnchor="middle"
          >
            OP-AMP
          </text>

          {/* Non-inverting input '+' grounded */}
          <line x1="420" y1="280" x2="350" y2="280" stroke="#94A3B8" strokeWidth="2.5" />
          <line x1="350" y1="280" x2="350" y2="320" stroke="#94A3B8" strokeWidth="2.5" />

          {/* Ground symbol */}
          <line x1="335" y1="320" x2="365" y2="320" stroke="#94A3B8" strokeWidth="2.5" />
          <line x1="340" y1="326" x2="360" y2="326" stroke="#94A3B8" strokeWidth="2" />
          <line x1="346" y1="332" x2="354" y2="332" stroke="#94A3B8" strokeWidth="1.5" />
          <text x="350" y="350" fill="#64748B" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
            Ground
          </text>

          {/* ===================== DYNAMIC OP-AMP OUTPUT WIRE & PROBE ===================== */}
          <line
            x1="530"
            y1="240"
            x2="680"
            y2="240"
            stroke={outputWireStroke}
            strokeWidth={isSaturated ? 3.5 : 2.5}
            style={{ filter: outputWireFilter, transition: 'all 0.25s ease-in-out' }}
          />
          <circle cx="580" cy="240" r="4.5" fill={outputWireStroke} />
          {!isZeroVin && (
            <line
              x1="600"
              y1="240"
              x2="640"
              y2="240"
              stroke={outputWireStroke}
              strokeWidth="2.5"
              markerEnd={isSaturated ? 'url(#arrow-diff-orange-c)' : 'url(#arrow-diff-cyan-c)'}
            />
          )}

          {/* Vout Probe */}
          <circle
            cx="680"
            cy="240"
            r="5.5"
            fill="#0B0F19"
            stroke={outputWireStroke}
            strokeWidth="2.5"
            style={{ filter: outputWireFilter, transition: 'all 0.25s ease-in-out' }}
          />
          <rect
            x="625"
            y="175"
            width="115"
            height="46"
            rx="3"
            fill={isSaturated ? '#1f110c' : '#111520'}
            stroke={isSaturated ? '#FF5722' : 'rgba(0, 240, 255, 0.3)'}
            strokeWidth={isSaturated ? 1.5 : 1}
            style={{ transition: 'all 0.25s ease-in-out' }}
          />
          <text
            x="682"
            y="192"
            fill={isSaturated ? '#FF5722' : '#94A3B8'}
            fontSize="10"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            fontWeight={isSaturated ? 'bold' : 'normal'}
          >
            {isSaturated ? 'Vout (SATURATED)' : 'Vout (Differentiated)'}
          </text>
          <DynamicSchematicText
            value={vout !== undefined ? formatVoltage(vout) : '-RC (dVin/dt)'}
            x="682"
            y="210"
            fontSize="11.5"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor={isSaturated ? '#FF5722' : '#00F0FF'}
          />

          {/* Calculus Equation Summary */}
          <g transform="translate(565, 280)">
            <text x="0" y="0" fill="#64748B" fontSize="11" fontFamily="JetBrains Mono">
              Gain (Sine) ={' '}
              <tspan fill="#00F0FF" fontWeight="bold">
                {cleanFloat(gain, 2)}
              </tspan>
            </text>
            <text x="0" y="16" fill="#64748B" fontSize="11" fontFamily="JetBrains Mono">
              Relation:{' '}
              <tspan fill="#F59E0B" fontWeight="bold">
                Triangle → Square
              </tspan>
            </text>
          </g>
        </svg>
      </div>

      {/* Schematic Readouts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/10 text-[11px] font-mono">
        <div className="bg-[#111520] p-2 rounded-[3px] border border-white/10">
          <span className="text-slate-400 block">Input Capacitor (C):</span>
          <span className="text-[#00F0FF] font-semibold">{cText}</span>
        </div>
        <div className="bg-[#111520] p-2 rounded-[3px] border border-white/10">
          <span className="text-slate-400 block">Feedback Resistor (R):</span>
          <span className="text-amber-400 font-semibold">{rText}</span>
        </div>
        <div className="bg-[#111520] p-2 rounded-[3px] border border-white/10">
          <span className="text-slate-400 block">RC Time Constant:</span>
          <span className="text-emerald-400 font-semibold">{rText} × {cText}</span>
        </div>
        <div className="bg-[#111520] p-2 rounded-[3px] border border-white/10">
          <span className="text-slate-400 block">Differentiation Function:</span>
          <span className="text-[#00F0FF] font-semibold">Vout = -RC (dVin/dt)</span>
        </div>
      </div>
    </div>
  );
};
