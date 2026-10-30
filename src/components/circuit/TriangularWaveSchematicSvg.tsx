import React from 'react';
import { formatResistance, formatCapacitance, cleanFloat, formatFrequency } from '../../utils/formatters';
import { DynamicSchematicText } from './DynamicSchematicText';

interface TriangularWaveSchematicSvgProps {
  squareAmp: number;
  frequency: number;
  rBase: number;
  cBase: number;
  vpp: number;
  posVsat?: number;
  negVsat?: number;
  isClipped?: boolean;
}

export const TriangularWaveSchematicSvg: React.FC<TriangularWaveSchematicSvgProps> = ({
  squareAmp,
  frequency,
  rBase,
  cBase,
  vpp,
  posVsat = 15,
  negVsat = -15,
  isClipped,
}) => {
  const rStr = formatResistance(rBase);
  const cStr = formatCapacitance(cBase);

  // Dynamic States
  const isZeroVin = Math.abs(squareAmp) < 1e-5 || frequency <= 0;
  const peakOutput = vpp / 2;
  const isSaturated = isClipped ?? (peakOutput >= posVsat - 0.05);

  const outputWireStroke = isSaturated ? '#FF5722' : '#00F0FF';
  const outputWireFilter = isSaturated ? 'drop-shadow(0 0 6px rgba(255, 87, 34, 0.85))' : undefined;

  return (
    <div className="relative w-full overflow-hidden rounded-[4px] border border-white/10 bg-[#0B0F19] p-2 sm:p-4 shadow-md font-mono">
      {/* Top Schematic Status Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-2.5 mb-2 text-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[#00F0FF] font-bold">SCHEMATIC</span>
          <span className="text-white/20">/</span>
          <span className="text-slate-300">Square-to-Triangle Waveform Generator (Integrator Stage)</span>
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
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF] inline-block shadow-[0_0_4px_#00F0FF]"></span>
            <span>R = {rStr}</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shadow-[0_0_4px_#F59E0B]"></span>
            <span>C = {cStr}</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span>Vpp ≈ {cleanFloat(vpp, 1)}V</span>
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
            <pattern id="grid-tri" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.6" fill="rgba(0, 240, 255, 0.08)" />
            </pattern>
            <marker
              id="arrow-tri-cyan"
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
              id="arrow-tri-orange"
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
          <rect width="760" height="380" fill="url(#grid-tri)" />

          {/* ===================== ZERO-STATE DIMMED INPUT STAGE ===================== */}
          <g style={{ opacity: isZeroVin ? 0.28 : 1, transition: 'opacity 0.25s ease-in-out' }}>
            <rect x="25" y="145" width="125" height="110" rx="4" fill="#111520" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1.5" />
            <text x="87" y="170" fill="#00F0FF" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle" fontWeight="bold">
              Square Wave Source
            </text>
            {/* Square wave icon inside */}
            <path
              d="M 50 220 L 50 190 L 75 190 L 75 235 L 100 235 L 100 190 L 125 190 L 125 220"
              fill="none"
              stroke="#00F0FF"
              strokeWidth="2"
            />
            <DynamicSchematicText
              value={`±${squareAmp}V @ ${formatFrequency(frequency)}`}
              x="87"
              y="248"
              fill="#94A3B8"
              fontSize="9"
              fontFamily="JetBrains Mono"
              textAnchor="middle"
              defaultColor="#94A3B8"
            />

            {/* Wire from square source to Integrator input resistor */}
            <line x1="150" y1="200" x2="230" y2="200" stroke="#00F0FF" strokeWidth="2.5" />
            {!isZeroVin && (
              <line x1="160" y1="200" x2="205" y2="200" stroke="#00F0FF" strokeWidth="2.5" markerEnd="url(#arrow-tri-cyan)" />
            )}
          </g>

          {/* Input Resistor R: (230, 200) to (330, 200) */}
          <path
            d="M 230 200 L 242 200 L 248 185 L 260 215 L 272 185 L 284 215 L 296 185 L 308 215 L 314 200 L 330 200"
            fill="none"
            stroke="#00F0FF"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <rect x="235" y="160" width="90" height="22" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.25)" />
          <DynamicSchematicText
            value={`R (${rStr})`}
            x="280"
            y="175"
            fill="#00F0FF"
            fontSize="10"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor="#00F0FF"
          />

          {/* Virtual Ground Node at (360, 200) */}
          <line x1="330" y1="200" x2="380" y2="200" stroke="#00F0FF" strokeWidth="2.5" />
          <circle cx="380" cy="200" r="4.5" fill="#00F0FF" />
          <text x="380" y="218" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
            V- Node (0V)
          </text>

          {/* ===================== OP-AMP INTEGRATOR ===================== */}
          {/* Op-amp body: vertices at (420, 150), (420, 290), (530, 220) */}
          <polygon
            points="420,150 420,290 530,220"
            fill="#111520"
            stroke="rgba(0, 240, 255, 0.35)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Input pins: inverting (-) at y=190, non-inverting (+) at y=250 */}
          <text x="435" y="194" fill="#F87171" fontSize="18" fontWeight="bold" fontFamily="JetBrains Mono">
            −
          </text>
          <text x="435" y="258" fill="#34D399" fontSize="18" fontWeight="bold" fontFamily="JetBrains Mono">
            +
          </text>

          {/* Wire from V- node (380, 200) into (-) pin at (420, 190) */}
          <line x1="380" y1="200" x2="380" y2="190" stroke="#00F0FF" strokeWidth="2.5" />
          <line x1="380" y1="190" x2="420" y2="190" stroke="#00F0FF" strokeWidth="2.5" />

          {/* Non-inverting (+) pin connected to ground at (420, 250) */}
          <line x1="420" y1="250" x2="380" y2="250" stroke="#94A3B8" strokeWidth="2.5" />
          <line x1="380" y1="250" x2="380" y2="280" stroke="#94A3B8" strokeWidth="2.5" />
          <line x1="365" y1="280" x2="395" y2="280" stroke="#94A3B8" strokeWidth="2.5" />
          <line x1="370" y1="285" x2="390" y2="285" stroke="#94A3B8" strokeWidth="2" />
          <line x1="376" y1="290" x2="384" y2="290" stroke="#94A3B8" strokeWidth="1.5" />
          <text x="380" y="305" fill="#94A3B8" fontSize="9.5" fontFamily="JetBrains Mono" textAnchor="middle">
            GND
          </text>

          {/* ===================== FEEDBACK CAPACITOR C ===================== */}
          {/* Branch up from (380, 190) to (380, 100) */}
          <line x1="380" y1="190" x2="380" y2="100" stroke="#F59E0B" strokeWidth="2.5" />
          <line x1="380" y1="100" x2="445" y2="100" stroke="#F59E0B" strokeWidth="2.5" />

          {/* Capacitor C plates at x=445 and x=455 */}
          <line x1="445" y1="80" x2="445" y2="120" stroke="#F59E0B" strokeWidth="3" />
          <line x1="455" y1="80" x2="455" y2="120" stroke="#F59E0B" strokeWidth="3" />
          <rect x="410" y="52" width="80" height="22" rx="3" fill="#1c160c" stroke="rgba(245, 158, 11, 0.4)" />
          <DynamicSchematicText
            value={`C (${cStr})`}
            x="450"
            y="67"
            fill="#FBBF24"
            fontSize="10"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor="#FBBF24"
          />

          {/* Wire from C (455, 100) to output tap at (570, 100) */}
          <line x1="455" y1="100" x2="570" y2="100" stroke="#F59E0B" strokeWidth="2.5" />
          <line x1="570" y1="100" x2="570" y2="220" stroke="#F59E0B" strokeWidth="2.5" />
          <circle cx="570" cy="220" r="4.5" fill={outputWireStroke} />

          {/* ===================== DYNAMIC OP-AMP OUTPUT PATH ===================== */}
          {/* Wire from op-amp output (530, 220) to output probe at (650, 220) */}
          <line
            x1="530"
            y1="220"
            x2="650"
            y2="220"
            stroke={outputWireStroke}
            strokeWidth={isSaturated ? 3.5 : 2.5}
            style={{ filter: outputWireFilter, transition: 'all 0.25s ease-in-out' }}
          />
          <circle
            cx="650"
            cy="220"
            r="6"
            fill="#0B0F19"
            stroke={outputWireStroke}
            strokeWidth={3}
            style={{ filter: outputWireFilter, transition: 'all 0.25s ease-in-out' }}
          />

          <rect
            x="595"
            y="145"
            width="125"
            height="55"
            rx="3"
            fill={isSaturated ? '#1f110c' : '#111520'}
            stroke={isSaturated ? '#FF5722' : 'rgba(0, 240, 255, 0.3)'}
            strokeWidth={isSaturated ? 1.5 : 1}
            style={{ transition: 'all 0.25s ease-in-out' }}
          />
          <text
            x="657"
            y="165"
            fill={isSaturated ? '#FF5722' : '#94A3B8'}
            fontSize="10"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            fontWeight={isSaturated ? 'bold' : 'normal'}
          >
            {isSaturated ? 'Triangular (CLIPPED)' : 'Triangular Output'}
          </text>
          <DynamicSchematicText
            value={`Vpp ≈ ${cleanFloat(vpp, 1)} V`}
            x="657"
            y="185"
            fill={outputWireStroke}
            fontSize="13"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor={outputWireStroke}
          />

          {/* Integration Formula Badge at Bottom */}
          <rect x="25" y="325" width="360" height="34" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.2)" />
          <text x="40" y="342" fill="#00F0FF" fontSize="10.5" fontFamily="JetBrains Mono" fontWeight="bold">
            Vout(t) = -(1 / RC) ∫ Vin(t) dt
          </text>
          <text x="40" y="353" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono">
            Square excitation produces linear triangular ramp: |dV/dt| = |Vin| / RC
          </text>
        </svg>
      </div>
    </div>
  );
};
