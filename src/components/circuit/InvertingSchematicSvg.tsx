import React from 'react';
import { formatResistance, formatVoltage } from '../../utils/formatters';
import { DynamicSchematicText } from './DynamicSchematicText';

interface InvertingSchematicSvgProps {
  vin: number;
  vinUnit: 'V' | 'mV';
  rinBase: number;
  rfBase: number;
  vout: number;
  av: number;
  iin: number;
  showCurrentFlow?: boolean;
  posVsat?: number;
  negVsat?: number;
  isClipped?: boolean;
}

export const InvertingSchematicSvg: React.FC<InvertingSchematicSvgProps> = ({
  vin,
  vinUnit,
  rinBase,
  rfBase,
  vout,
  av,
  iin,
  showCurrentFlow = true,
  posVsat = 15,
  negVsat = -15,
  isClipped,
}) => {
  const rinText = formatResistance(rinBase);
  const rfText = formatResistance(rfBase);
  const vinText = `${vin} ${vinUnit}`;
  const voutText = formatVoltage(vout);

  // Dynamic States
  const isZeroVin = Math.abs(vin) < 1e-5;
  const isSaturated = isClipped ?? (Math.abs(vout) >= posVsat - 0.05 || vout >= posVsat || vout <= negVsat);

  // Dynamic Colors
  const outputWireStroke = isSaturated ? '#FF5722' : '#00F0FF';
  const outputWireFilter = isSaturated ? 'drop-shadow(0 0 6px rgba(255, 87, 34, 0.85))' : undefined;

  return (
    <div className="relative w-full overflow-hidden rounded-[4px] border border-white/10 bg-[#0B0F19] p-2 sm:p-4 shadow-md font-mono">
      {/* Top Schematic Status Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-2.5 mb-2 text-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[#00F0FF] font-bold">SCHEMATIC</span>
          <span className="text-white/20">/</span>
          <span className="text-slate-300">Standard Inverting Topology</span>
        </div>

        {/* Dynamic State Alert Badges */}
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
            <span>Signal Path</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-[0_0_4px_#10B981]"></span>
            <span>Virtual GND (0V)</span>
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
            {/* Grid pattern */}
            <pattern id="grid-inv" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.6" fill="rgba(0, 240, 255, 0.08)" />
            </pattern>

            {/* Signal Flow Arrow (Cyan) */}
            <marker
              id="arrow-cyan"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#00F0FF" />
            </marker>

            {/* Saturation Flow Arrow (Orange) */}
            <marker
              id="arrow-orange"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#FF5722" />
            </marker>

            {/* Feedback Flow Arrow (Amber) */}
            <marker
              id="arrow-amber"
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
          <rect width="760" height="380" fill="url(#grid-inv)" />

          {/* ===================== ZERO-STATE DIMMED INPUT REGION ===================== */}
          <g style={{ opacity: isZeroVin ? 0.28 : 1, transition: 'opacity 0.25s ease-in-out' }}>
            {/* Input Wire: Vin Terminal (70, 200) to Rin start (160, 200) */}
            <line x1="70" y1="200" x2="160" y2="200" stroke="#00F0FF" strokeWidth="2.5" />
            {showCurrentFlow && !isZeroVin && (
              <line x1="90" y1="200" x2="130" y2="200" stroke="#00F0FF" strokeWidth="2.5" markerEnd="url(#arrow-cyan)" />
            )}

            {/* Vin Input Terminal (65, 200) */}
            <circle cx="65" cy="200" r="5.5" fill="#0B0F19" stroke="#00F0FF" strokeWidth="2.5" />
            <rect x="15" y="145" width="85" height="42" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.3)" />
            <text x="57" y="162" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
              Vin (Input)
            </text>
            <DynamicSchematicText
              value={vinText}
              x="57"
              y="179"
              fontSize="13"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
              textAnchor="middle"
              defaultColor="#00F0FF"
            />
          </g>

          {/* ===================== RESISTOR RIN & INVERTING NODE ===================== */}
          {/* Rin Resistor Symbol (160, 200) to (260, 200) */}
          <path
            d="M 160 200 L 172 200 L 178 185 L 190 215 L 202 185 L 214 215 L 226 185 L 238 215 L 244 200 L 260 200"
            fill="none"
            stroke="#00F0FF"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Rin Value Badge above resistor */}
          <rect x="165" y="140" width="90" height="34" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.25)" />
          <text x="210" y="154" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
            Rin (Input Resistor)
          </text>
          <DynamicSchematicText
            value={rinText}
            x="210"
            y="168"
            fontSize="12"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor="#E2E8F0"
          />

          {/* Rin to Inverting Node: (260, 200) to Node (330, 200) to OpAmp Inverting Input (420, 200) */}
          <line x1="260" y1="200" x2="420" y2="200" stroke="#00F0FF" strokeWidth="2.5" />
          {showCurrentFlow && !isZeroVin && (
            <line x1="270" y1="200" x2="310" y2="200" stroke="#00F0FF" strokeWidth="2.5" markerEnd="url(#arrow-cyan)" />
          )}

          {/* Inverting Node Dot at (330, 200) */}
          <circle cx="330" cy="200" r="4.5" fill="#00F0FF" />

          {/* ===================== FEEDBACK LOOP (RF) ===================== */}
          {/* Feedback loop wire going UP from (330, 200) to (330, 90) */}
          <line x1="330" y1="200" x2="330" y2="90" stroke="#F59E0B" strokeWidth="2.5" />
          <line x1="330" y1="90" x2="380" y2="90" stroke="#F59E0B" strokeWidth="2.5" />

          {/* Rf Resistor Symbol (380, 90) to (480, 90) */}
          <path
            d="M 380 90 L 392 90 L 398 75 L 410 105 L 422 75 L 434 105 L 446 75 L 458 105 L 464 90 L 480 90"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Rf Value Badge above feedback resistor */}
          <rect x="385" y="28" width="90" height="34" rx="3" fill="#1c160c" stroke="rgba(245, 158, 11, 0.4)" />
          <text x="430" y="42" fill="#FBBF24" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
            Rf (Feedback)
          </text>
          <DynamicSchematicText
            value={rfText}
            x="430"
            y="56"
            fontSize="12"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor="#FEF08A"
          />

          {/* Feedback loop wire continuing from Rf (480, 90) to (590, 90) then down to Output (590, 240) */}
          <line x1="480" y1="90" x2="590" y2="90" stroke="#F59E0B" strokeWidth="2.5" />
          {showCurrentFlow && !isZeroVin && (
            <line x1="495" y1="90" x2="545" y2="90" stroke="#F59E0B" strokeWidth="2.5" markerEnd="url(#arrow-amber)" />
          )}
          <line x1="590" y1="90" x2="590" y2="240" stroke="#F59E0B" strokeWidth="2.5" />

          {/* Output Node Dot at (590, 240) */}
          <circle cx="590" cy="240" r="4.5" fill={outputWireStroke} />

          {/* ===================== NON-INVERTING INPUT & GROUND ===================== */}
          {/* Non-inverting input '+': (420, 280) to ground */}
          <line x1="420" y1="280" x2="350" y2="280" stroke="#94A3B8" strokeWidth="2.5" />
          <line x1="350" y1="280" x2="350" y2="320" stroke="#94A3B8" strokeWidth="2.5" />

          {/* Ground symbol at (350, 320) */}
          <line x1="335" y1="320" x2="365" y2="320" stroke="#94A3B8" strokeWidth="2.5" />
          <line x1="340" y1="326" x2="360" y2="326" stroke="#94A3B8" strokeWidth="2" />
          <line x1="346" y1="332" x2="354" y2="332" stroke="#94A3B8" strokeWidth="1.5" />

          {/* ===================== OP-AMP TRIANGLE ===================== */}
          <polygon
            points="420,160 420,320 530,240"
            fill="#111520"
            stroke="rgba(0, 240, 255, 0.35)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Inverting Terminal '-' at (435, 206) */}
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

          {/* Non-inverting Terminal '+' at (435, 287) */}
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

          {/* Op-Amp Label inside triangle */}
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

          {/* Virtual Ground Indicator at Inverting Node */}
          <g transform="translate(305, 220)">
            <rect x="-10" y="0" width="70" height="32" rx="3" fill="#06281e" stroke="#065f46" strokeWidth="1" />
            <text x="25" y="13" fill="#34D399" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">
              Virtual Ground
            </text>
            <text x="25" y="25" fill="#A7F3D0" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono" textAnchor="middle">
              V⁻ ≈ 0.00 V
            </text>
          </g>

          {/* ===================== DYNAMIC OP-AMP OUTPUT WIRE & PROBE ===================== */}
          {/* OpAmp Output (530, 240) to Vout probe (680, 240) */}
          <line
            x1="530"
            y1="240"
            x2="680"
            y2="240"
            stroke={outputWireStroke}
            strokeWidth={isSaturated ? 3.5 : 2.5}
            style={{
              filter: outputWireFilter,
              transition: 'all 0.25s ease-in-out',
            }}
          />
          {showCurrentFlow && !isZeroVin && (
            <line
              x1="610"
              y1="240"
              x2="650"
              y2="240"
              stroke={outputWireStroke}
              strokeWidth="2.5"
              markerEnd={isSaturated ? 'url(#arrow-orange)' : 'url(#arrow-cyan)'}
            />
          )}

          {/* Vout Terminal Probe (680, 240) */}
          <circle
            cx="680"
            cy="240"
            r="5.5"
            fill="#0B0F19"
            stroke={outputWireStroke}
            strokeWidth="2.5"
            style={{ filter: outputWireFilter, transition: 'all 0.25s ease-in-out' }}
          />

          {/* Vout Value Badge (Dynamic Saturation Pill) */}
          <rect
            x="625"
            y="180"
            width="115"
            height="42"
            rx="3"
            fill={isSaturated ? '#1f110c' : '#111520'}
            stroke={isSaturated ? '#FF5722' : 'rgba(0, 240, 255, 0.3)'}
            strokeWidth={isSaturated ? 1.5 : 1}
            style={{ transition: 'all 0.25s ease-in-out' }}
          />
          <text
            x="682"
            y="197"
            fill={isSaturated ? '#FF5722' : '#94A3B8'}
            fontSize="10"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            fontWeight={isSaturated ? 'bold' : 'normal'}
          >
            {isSaturated ? 'Vout (SATURATED)' : 'Vout (Output)'}
          </text>
          <DynamicSchematicText
            value={voutText}
            x="682"
            y="214"
            fontSize="13"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor={isSaturated ? '#FF5722' : '#00F0FF'}
          />

          {/* Inverting Gain Marker */}
          <g transform="translate(605, 275)">
            <text x="0" y="0" fill="#64748B" fontSize="11" fontFamily="JetBrains Mono">
              Gain Av ={' '}
              <tspan fill="#00F0FF" fontWeight="bold">
                {av.toFixed(2)}
              </tspan>
            </text>
            <text x="0" y="16" fill="#64748B" fontSize="11" fontFamily="JetBrains Mono">
              Phase ={' '}
              <tspan fill="#F59E0B" fontWeight="bold">
                180°
              </tspan>
            </text>
          </g>

          {/* Ground annotation */}
          <text x="350" y="352" fill="#64748B" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
            GND (0V)
          </text>
        </svg>
      </div>

      {/* Schematic Legend / Readouts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/10 text-[11px] font-mono">
        <div className="bg-[#111520] p-2 rounded-[3px] border border-white/10">
          <span className="text-slate-400 block">Input Current (Iin):</span>
          <span className="text-[#00F0FF] font-semibold">{iin.toExponential(3)} A</span>
        </div>
        <div className="bg-[#111520] p-2 rounded-[3px] border border-white/10">
          <span className="text-slate-400 block">Input Impedance (Zin):</span>
          <span className="text-[#00F0FF] font-semibold">{rinText}</span>
        </div>
        <div className="bg-[#111520] p-2 rounded-[3px] border border-white/10">
          <span className="text-slate-400 block">Inverting Node (V⁻):</span>
          <span className="text-emerald-400 font-semibold">0.00 V (Virtual GND)</span>
        </div>
        <div className="bg-[#111520] p-2 rounded-[3px] border border-white/10">
          <span className="text-slate-400 block">Output Polarity:</span>
          <span className="text-amber-400 font-semibold">Inverted (180°)</span>
        </div>
      </div>
    </div>
  );
};
