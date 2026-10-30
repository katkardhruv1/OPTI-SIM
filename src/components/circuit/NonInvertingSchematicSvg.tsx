import React from 'react';
import { formatResistance, formatVoltage } from '../../utils/formatters';
import { DynamicSchematicText } from './DynamicSchematicText';

interface NonInvertingSchematicSvgProps {
  vin: number;
  vinUnit: 'V' | 'mV';
  r1Base: number;
  rfBase: number;
  vout: number;
  av: number;
  posVsat?: number;
  negVsat?: number;
  isClipped?: boolean;
}

export const NonInvertingSchematicSvg: React.FC<NonInvertingSchematicSvgProps> = ({
  vin,
  vinUnit,
  r1Base,
  rfBase,
  vout,
  av,
  posVsat = 15,
  negVsat = -15,
  isClipped,
}) => {
  const r1Text = formatResistance(r1Base);
  const rfText = formatResistance(rfBase);
  const vinText = `${vin} ${vinUnit}`;
  const voutText = formatVoltage(vout);

  // Dynamic States
  const isZeroVin = Math.abs(vin) < 1e-5;
  const isSaturated = isClipped ?? (Math.abs(vout) >= posVsat - 0.05 || vout >= posVsat || vout <= negVsat);

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
          <span className="text-slate-300">Non-Inverting Configuration</span>
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
            <span>Non-Inverting Input (+)</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-[0_0_4px_#10B981]"></span>
            <span>Virtual Short (V⁻ = V⁺)</span>
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full flex items-center justify-center">
        <svg
          viewBox="0 0 760 400"
          className="w-full h-auto max-w-[760px] select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid-noninv" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.6" fill="rgba(0, 240, 255, 0.08)" />
            </pattern>
            <marker
              id="arrow-cyan-noninv"
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
              id="arrow-orange-noninv"
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
              id="arrow-amber-noninv"
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
          <rect width="760" height="400" fill="url(#grid-noninv)" />

          {/* ===================== OP-AMP TRIANGLE ===================== */}
          <polygon
            points="420,150 420,310 530,230"
            fill="#111520"
            stroke="rgba(0, 240, 255, 0.35)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Inverting Terminal '-' at (435, 196) */}
          <text
            x="435"
            y="196"
            fill="#F87171"
            fontSize="22"
            fontWeight="bold"
            fontFamily="JetBrains Mono, monospace"
          >
            −
          </text>

          {/* Non-inverting Terminal '+' at (435, 277) */}
          <text
            x="435"
            y="277"
            fill="#34D399"
            fontSize="20"
            fontWeight="bold"
            fontFamily="JetBrains Mono, monospace"
          >
            +
          </text>

          {/* Op-Amp Label */}
          <text
            x="465"
            y="235"
            fill="#64748B"
            fontSize="12"
            fontWeight="bold"
            letterSpacing="0.05em"
            fontFamily="JetBrains Mono, monospace"
            textAnchor="middle"
          >
            OP-AMP
          </text>

          {/* ===================== ZERO-STATE DIMMED NON-INVERTING INPUT ===================== */}
          <g style={{ opacity: isZeroVin ? 0.28 : 1, transition: 'opacity 0.25s ease-in-out' }}>
            {/* Vin terminal at (70, 270) to OpAmp '+' at (420, 270) */}
            <line x1="70" y1="270" x2="420" y2="270" stroke="#00F0FF" strokeWidth="2.5" />
            {!isZeroVin && (
              <line x1="160" y1="270" x2="220" y2="270" stroke="#00F0FF" strokeWidth="2.5" markerEnd="url(#arrow-cyan-noninv)" />
            )}

            {/* Vin Input Terminal Probe */}
            <circle cx="65" cy="270" r="5.5" fill="#0B0F19" stroke="#00F0FF" strokeWidth="2.5" />
            <rect x="20" y="215" width="85" height="42" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.3)" />
            <text x="62" y="232" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
              Vin (Input)
            </text>
            <DynamicSchematicText
              value={vinText}
              x="62"
              y="249"
              fontSize="13"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
              textAnchor="middle"
              defaultColor="#00F0FF"
            />
          </g>

          {/* ===================== INVERTING TERMINAL FEEDBACK & R1 ===================== */}
          {/* Inverting input '-' at (420, 190) -> goes left to node (320, 190) */}
          <line x1="420" y1="190" x2="320" y2="190" stroke="#94A3B8" strokeWidth="2.5" />

          {/* Node dot at (320, 190) */}
          <circle cx="320" cy="190" r="4.5" fill="#00F0FF" />

          {/* Branch 1: R1 going down from (320, 190) to GND */}
          <line x1="320" y1="190" x2="320" y2="250" stroke="#94A3B8" strokeWidth="2.5" />

          {/* R1 Resistor Symbol (320, 250) to (320, 320) (Vertical) */}
          <path
            d="M 320 250 L 320 258 L 305 264 L 335 274 L 305 284 L 335 294 L 305 304 L 335 314 L 320 320"
            fill="none"
            stroke="#00F0FF"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <line x1="320" y1="320" x2="320" y2="350" stroke="#94A3B8" strokeWidth="2.5" />

          {/* Ground symbol at (320, 350) */}
          <line x1="305" y1="350" x2="335" y2="350" stroke="#94A3B8" strokeWidth="2.5" />
          <line x1="310" y1="356" x2="330" y2="356" stroke="#94A3B8" strokeWidth="2" />
          <line x1="316" y1="362" x2="324" y2="362" stroke="#94A3B8" strokeWidth="1.5" />
          <text x="320" y="380" fill="#64748B" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
            GND
          </text>

          {/* R1 Badge */}
          <rect x="200" y="270" width="95" height="34" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.25)" />
          <text x="247" y="284" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
            R1 (Gain Res.)
          </text>
          <DynamicSchematicText
            value={r1Text}
            x="247"
            y="298"
            fontSize="12"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor="#E2E8F0"
          />

          {/* Branch 2: Rf Feedback loop going up from (320, 190) to (320, 80) */}
          <line x1="320" y1="190" x2="320" y2="80" stroke="#F59E0B" strokeWidth="2.5" />
          <line x1="320" y1="80" x2="370" y2="80" stroke="#F59E0B" strokeWidth="2.5" />

          {/* Rf Resistor Symbol (370, 80) to (470, 80) */}
          <path
            d="M 370 80 L 382 80 L 388 65 L 400 95 L 412 65 L 424 95 L 436 65 L 448 95 L 454 80 L 470 80"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Rf Badge */}
          <rect x="375" y="18" width="90" height="34" rx="3" fill="#1c160c" stroke="rgba(245, 158, 11, 0.4)" />
          <text x="420" y="32" fill="#FBBF24" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
            Rf (Feedback)
          </text>
          <DynamicSchematicText
            value={rfText}
            x="420"
            y="46"
            fontSize="12"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor="#FEF08A"
          />

          {/* Feedback wire continuing from Rf to Output wire */}
          <line x1="470" y1="80" x2="580" y2="80" stroke="#F59E0B" strokeWidth="2.5" />
          {!isZeroVin && (
            <line x1="490" y1="80" x2="530" y2="80" stroke="#F59E0B" strokeWidth="2.5" markerEnd="url(#arrow-amber-noninv)" />
          )}
          <line x1="580" y1="80" x2="580" y2="230" stroke="#F59E0B" strokeWidth="2.5" />

          {/* ===================== DYNAMIC OP-AMP OUTPUT WIRE & PROBE ===================== */}
          {/* Output wire from OpAmp (530, 230) to Vout probe (680, 230) */}
          <line
            x1="530"
            y1="230"
            x2="680"
            y2="230"
            stroke={outputWireStroke}
            strokeWidth={isSaturated ? 3.5 : 2.5}
            style={{
              filter: outputWireFilter,
              transition: 'all 0.25s ease-in-out',
            }}
          />
          <circle cx="580" cy="230" r="4.5" fill={outputWireStroke} />
          {!isZeroVin && (
            <line
              x1="600"
              y1="230"
              x2="640"
              y2="230"
              stroke={outputWireStroke}
              strokeWidth="2.5"
              markerEnd={isSaturated ? 'url(#arrow-orange-noninv)' : 'url(#arrow-cyan-noninv)'}
            />
          )}

          {/* Vout Probe */}
          <circle
            cx="680"
            cy="230"
            r="5.5"
            fill="#0B0F19"
            stroke={outputWireStroke}
            strokeWidth="2.5"
            style={{ filter: outputWireFilter, transition: 'all 0.25s ease-in-out' }}
          />

          {/* Vout Value Badge (Dynamic Saturation Indicator) */}
          <rect
            x="625"
            y="170"
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
            y="187"
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
            y="204"
            fontSize="13"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor={isSaturated ? '#FF5722' : '#00F0FF'}
          />

          {/* Virtual Short indicator at feedback node */}
          <g transform="translate(285, 130)">
            <rect x="0" y="0" width="90" height="30" rx="3" fill="#06281e" stroke="#065f46" strokeWidth="1" />
            <text x="45" y="12" fill="#34D399" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">
              Virtual Short
            </text>
            <text x="45" y="24" fill="#A7F3D0" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono" textAnchor="middle">
              V⁻ = V⁺ = {vinText}
            </text>
          </g>

          {/* Live Gain & Phase text annotation */}
          <g transform="translate(605, 270)">
            <text x="0" y="0" fill="#64748B" fontSize="11" fontFamily="JetBrains Mono">
              Gain Av ={' '}
              <tspan fill="#00F0FF" fontWeight="bold">
                {av.toFixed(2)}
              </tspan>
            </text>
            <text x="0" y="16" fill="#64748B" fontSize="11" fontFamily="JetBrains Mono">
              Phase ={' '}
              <tspan fill="#34D399" fontWeight="bold">
                0° (In-Phase)
              </tspan>
            </text>
          </g>
        </svg>
      </div>

      {/* Schematic Readouts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/10 text-[11px] font-mono">
        <div className="bg-[#111520] p-2 rounded-[3px] border border-white/10">
          <span className="text-slate-400 block">Input Terminal:</span>
          <span className="text-[#00F0FF] font-semibold">Non-Inverting (+)</span>
        </div>
        <div className="bg-[#111520] p-2 rounded-[3px] border border-white/10">
          <span className="text-slate-400 block">Input Impedance (Zin):</span>
          <span className="text-[#00F0FF] font-semibold">∞ (Extremely High)</span>
        </div>
        <div className="bg-[#111520] p-2 rounded-[3px] border border-white/10">
          <span className="text-slate-400 block">Inverting Node (V⁻):</span>
          <span className="text-emerald-400 font-semibold">{vinText} (Tracks Vin)</span>
        </div>
        <div className="bg-[#111520] p-2 rounded-[3px] border border-white/10">
          <span className="text-slate-400 block">Phase Shift:</span>
          <span className="text-emerald-400 font-semibold">0° (No Inversion)</span>
        </div>
      </div>
    </div>
  );
};
