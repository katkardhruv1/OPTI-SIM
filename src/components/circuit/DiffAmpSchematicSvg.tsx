import React from 'react';
import { formatResistance, formatVoltage } from '../../utils/formatters';
import { DynamicSchematicText } from './DynamicSchematicText';

interface DiffAmpSchematicSvgProps {
  v1: number;
  v1Unit: 'V' | 'mV';
  v2: number;
  v2Unit: 'V' | 'mV';
  r1Base: number;
  r2Base: number;
  rfBase: number;
  rgBase: number;
  vdiff: number;
  ad: number;
  vout: number;
  posVsat?: number;
  negVsat?: number;
  isClipped?: boolean;
}

export const DiffAmpSchematicSvg: React.FC<DiffAmpSchematicSvgProps> = ({
  v1,
  v1Unit,
  v2,
  v2Unit,
  r1Base,
  r2Base,
  rfBase,
  rgBase,
  vdiff,
  ad,
  vout,
  posVsat = 15,
  negVsat = -15,
  isClipped,
}) => {
  const v1Text = `${v1} ${v1Unit}`;
  const v2Text = `${v2} ${v2Unit}`;
  const r1Text = formatResistance(r1Base);
  const r2Text = formatResistance(r2Base);
  const rfText = formatResistance(rfBase);
  const rgText = formatResistance(rgBase);
  const voutText = formatVoltage(vout);
  const vdiffText = formatVoltage(vdiff);

  // Dynamic States
  const isZeroV1 = Math.abs(v1) < 1e-5;
  const isZeroV2 = Math.abs(v2) < 1e-5;
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
          <span className="text-slate-300">4-Resistor Differential Configuration</span>
        </div>

        {/* Dynamic Alert Badges */}
        <div className="flex items-center gap-2 text-[11px]">
          {isSaturated && (
            <span className="px-2 py-0.5 rounded-[2px] bg-[#FF5722]/15 border border-[#FF5722]/50 text-[#FF5722] font-bold flex items-center gap-1 animate-pulse">
              <span>⚠️</span> SATURATED (±{posVsat}V)
            </span>
          )}
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-400 inline-block shadow-[0_0_4px_#F43F5E]"></span>
            <span>V1 (Inverting)</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-[0_0_4px_#10B981]"></span>
            <span>V2 (Non-Inv)</span>
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full flex items-center justify-center">
        <svg
          viewBox="0 0 760 410"
          className="w-full h-auto max-w-[760px] select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid-diff" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.6" fill="rgba(0, 240, 255, 0.08)" />
            </pattern>
            <marker
              id="arrow-diff-cyan"
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
              id="arrow-diff-orange"
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
          <rect width="760" height="410" fill="url(#grid-diff)" />

          {/* ===================== OP-AMP TRIANGLE ===================== */}
          <polygon
            points="430,150 430,310 540,230"
            fill="#111520"
            stroke="rgba(0, 240, 255, 0.35)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Inverting Terminal '-' at (445, 196) */}
          <text
            x="445"
            y="196"
            fill="#F87171"
            fontSize="22"
            fontWeight="bold"
            fontFamily="JetBrains Mono, monospace"
          >
            −
          </text>

          {/* Non-inverting Terminal '+' at (445, 277) */}
          <text
            x="445"
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
            x="475"
            y="235"
            fill="#64748B"
            fontSize="12"
            fontWeight="bold"
            letterSpacing="0.05em"
            fontFamily="JetBrains Mono, monospace"
            textAnchor="middle"
          >
            DIFF OP-AMP
          </text>

          {/* ===================== V1 PATH (ZERO-STATE DIMMED IF V1=0) ===================== */}
          <g style={{ opacity: isZeroV1 ? 0.28 : 1, transition: 'opacity 0.25s ease-in-out' }}>
            {/* V1 Terminal Probe at (60, 190) */}
            <circle cx="60" cy="190" r="5" fill="#0B0F19" stroke="#F43F5E" strokeWidth="2.5" />
            <rect x="15" y="135" width="85" height="42" rx="3" fill="#111520" stroke="rgba(244, 63, 94, 0.4)" />
            <text x="57" y="152" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
              V1 (Inverting)
            </text>
            <DynamicSchematicText
              value={v1Text}
              x="57"
              y="169"
              fontSize="13"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
              textAnchor="middle"
              defaultColor="#F43F5E"
            />

            {/* Wire: (60, 190) to (150, 190) */}
            <line x1="65" y1="190" x2="150" y2="190" stroke="#F43F5E" strokeWidth="2.5" />
          </g>

          {/* R1 Resistor: (150, 190) to (240, 190) */}
          <path
            d="M 150 190 L 160 190 L 166 175 L 178 205 L 190 175 L 202 205 L 214 175 L 226 205 L 232 190 L 240 190"
            fill="none"
            stroke="#00F0FF"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* R1 Badge */}
          <rect x="160" y="145" width="75" height="24" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.25)" />
          <text x="197" y="161" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
            R1:
          </text>
          <DynamicSchematicText
            value={r1Text}
            x="215"
            y="161"
            fontSize="11"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor="#E2E8F0"
          />

          {/* Wire: (240, 190) to Op-Amp Inverting input at (430, 190) */}
          <line x1="240" y1="190" x2="430" y2="190" stroke="#00F0FF" strokeWidth="2.5" />

          {/* Node dot for feedback branch at (330, 190) */}
          <circle cx="330" cy="190" r="4.5" fill="#00F0FF" />

          {/* Feedback wire going UP: (330, 190) to (330, 75) to (380, 75) */}
          <line x1="330" y1="190" x2="330" y2="75" stroke="#F59E0B" strokeWidth="2.5" />
          <line x1="330" y1="75" x2="380" y2="75" stroke="#F59E0B" strokeWidth="2.5" />

          {/* Rf Resistor: (380, 75) to (480, 75) */}
          <path
            d="M 380 75 L 390 75 L 396 60 L 408 90 L 420 60 L 432 90 L 444 60 L 456 90 L 462 75 L 480 75"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Rf Badge */}
          <rect x="400" y="25" width="75" height="24" rx="3" fill="#1c160c" stroke="rgba(245, 158, 11, 0.4)" />
          <text x="437" y="41" fill="#FBBF24" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
            Rf:
          </text>
          <DynamicSchematicText
            value={rfText}
            x="457"
            y="41"
            fontSize="11"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor="#FEF08A"
          />

          {/* Feedback wire to output: (480, 75) to (590, 75) to (590, 230) */}
          <line x1="480" y1="75" x2="590" y2="75" stroke="#F59E0B" strokeWidth="2.5" />
          <line x1="590" y1="75" x2="590" y2="230" stroke="#F59E0B" strokeWidth="2.5" />

          {/* ===================== V2 PATH (ZERO-STATE DIMMED IF V2=0) ===================== */}
          <g style={{ opacity: isZeroV2 ? 0.28 : 1, transition: 'opacity 0.25s ease-in-out' }}>
            {/* V2 Terminal Probe at (60, 270) */}
            <circle cx="60" cy="270" r="5" fill="#0B0F19" stroke="#10B981" strokeWidth="2.5" />
            <rect x="15" y="290" width="85" height="42" rx="3" fill="#111520" stroke="rgba(16, 185, 129, 0.4)" />
            <text x="57" y="307" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
              V2 (Non-Inv)
            </text>
            <DynamicSchematicText
              value={v2Text}
              x="57"
              y="324"
              fontSize="13"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
              textAnchor="middle"
              defaultColor="#10B981"
            />

            {/* Wire: (60, 270) to (150, 270) */}
            <line x1="65" y1="270" x2="150" y2="270" stroke="#10B981" strokeWidth="2.5" />
          </g>

          {/* R2 Resistor: (150, 270) to (240, 270) */}
          <path
            d="M 150 270 L 160 270 L 166 255 L 178 285 L 190 255 L 202 285 L 214 255 L 226 285 L 232 270 L 240 270"
            fill="none"
            stroke="#00F0FF"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* R2 Badge */}
          <rect x="160" y="295" width="75" height="24" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.25)" />
          <text x="197" y="311" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
            R2:
          </text>
          <DynamicSchematicText
            value={r2Text}
            x="215"
            y="311"
            fontSize="11"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor="#E2E8F0"
          />

          {/* Wire from R2 to Non-inverting input: (240, 270) to (430, 270) */}
          <line x1="240" y1="270" x2="430" y2="270" stroke="#00F0FF" strokeWidth="2.5" />

          {/* Junction Node for Rg ground reference at (330, 270) */}
          <circle cx="330" cy="270" r="4.5" fill="#00F0FF" />

          {/* Rg branch going DOWN to GND: (330, 270) to (330, 305) */}
          <line x1="330" y1="270" x2="330" y2="305" stroke="#00F0FF" strokeWidth="2.5" />

          {/* Rg Resistor (Vertical): (330, 305) to (330, 360) */}
          <path
            d="M 330 305 L 330 312 L 318 318 L 342 326 L 318 334 L 342 342 L 318 350 L 330 355 L 330 360"
            fill="none"
            stroke="#00F0FF"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Rg Badge */}
          <rect x="235" y="325" width="80" height="24" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.25)" />
          <text x="275" y="341" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
            Rg:
          </text>
          <DynamicSchematicText
            value={rgText}
            x="295"
            y="341"
            fontSize="10"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor="#E2E8F0"
          />

          {/* Wire from Rg to Ground: (330, 360) to (330, 375) */}
          <line x1="330" y1="360" x2="330" y2="375" stroke="#94A3B8" strokeWidth="2.5" />

          {/* Ground symbol at (330, 375) */}
          <line x1="315" y1="375" x2="345" y2="375" stroke="#94A3B8" strokeWidth="2.5" />
          <line x1="320" y1="381" x2="340" y2="381" stroke="#94A3B8" strokeWidth="2" />
          <line x1="326" y1="387" x2="334" y2="387" stroke="#94A3B8" strokeWidth="1.5" />
          <text x="330" y="403" fill="#64748B" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">
            GND
          </text>

          {/* ===================== DYNAMIC OP-AMP OUTPUT WIRE & PROBE ===================== */}
          <line
            x1="540"
            y1="230"
            x2="680"
            y2="230"
            stroke={outputWireStroke}
            strokeWidth={isSaturated ? 3.5 : 2.5}
            style={{ filter: outputWireFilter, transition: 'all 0.25s ease-in-out' }}
          />
          <circle cx="590" cy="230" r="4.5" fill={outputWireStroke} />
          {!isZeroV1 && !isZeroV2 && (
            <line
              x1="605"
              y1="230"
              x2="645"
              y2="230"
              stroke={outputWireStroke}
              strokeWidth="2.5"
              markerEnd={isSaturated ? 'url(#arrow-diff-orange)' : 'url(#arrow-diff-cyan)'}
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

          {/* Differential Telemetry Card inside SVG */}
          <g transform="translate(565, 275)">
            <text x="0" y="0" fill="#64748B" fontSize="11" fontFamily="JetBrains Mono">
              Vdiff (V2-V1) ={' '}
              <tspan fill="#34D399" fontWeight="bold">
                {vdiffText}
              </tspan>
            </text>
            <text x="0" y="16" fill="#64748B" fontSize="11" fontFamily="JetBrains Mono">
              Diff Gain Ad ={' '}
              <tspan fill="#00F0FF" fontWeight="bold">
                {ad.toFixed(2)}
              </tspan>
            </text>
            <text x="0" y="32" fill="#64748B" fontSize="10" fontFamily="JetBrains Mono">
              Eqn: Vout = Ad × Vdiff
            </text>
          </g>
        </svg>
      </div>

      {/* Schematic Readouts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/10 text-[11px] font-mono">
        <div className="bg-[#111520] p-2 rounded-[3px] border border-white/10">
          <span className="text-slate-400 block">Differential Input (Vdiff):</span>
          <span className="text-[#00F0FF] font-semibold">{vdiffText}</span>
        </div>
        <div className="bg-[#111520] p-2 rounded-[3px] border border-white/10">
          <span className="text-slate-400 block">Differential Gain (Ad):</span>
          <span className="text-[#00F0FF] font-semibold">{ad.toFixed(2)} (Rf/R1)</span>
        </div>
        <div className="bg-[#111520] p-2 rounded-[3px] border border-white/10">
          <span className="text-slate-400 block">Resistor Ratio Match:</span>
          <span className="text-emerald-400 font-semibold">Matched (CMRR Ideal)</span>
        </div>
        <div className="bg-[#111520] p-2 rounded-[3px] border border-white/10">
          <span className="text-slate-400 block">Output Voltage (Vout):</span>
          <span className="text-amber-400 font-semibold">{voutText}</span>
        </div>
      </div>
    </div>
  );
};
