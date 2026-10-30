import React from 'react';
import { ComparatorType } from '../../types/circuit';
import { cleanFloat } from '../../utils/formatters';
import { DynamicSchematicText } from './DynamicSchematicText';

interface ComparatorSchematicSvgProps {
  vin: number;
  vinUnit: 'V' | 'mV';
  vref: number;
  vrefUnit: 'V' | 'mV';
  posVsat: number;
  negVsat: number;
  comparatorType: ComparatorType;
  vout: number;
}

export const ComparatorSchematicSvg: React.FC<ComparatorSchematicSvgProps> = ({
  vin,
  vinUnit,
  vref,
  vrefUnit,
  posVsat,
  negVsat,
  comparatorType,
  vout,
}) => {
  const vinText = `${vin} ${vinUnit}`;
  const vrefText = `${vref} ${vrefUnit}`;
  const isPosSat = vout > 0;
  const isZeroVin = Math.abs(vin) < 1e-5;
  const voutText = vout >= 0 ? `+${cleanFloat(vout, 1)} V` : `${cleanFloat(vout, 1)} V`;

  const outputWireStroke = isPosSat ? '#10B981' : '#FF5722';
  const outputWireFilter = isPosSat
    ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.75))'
    : 'drop-shadow(0 0 6px rgba(255, 87, 34, 0.85))';

  return (
    <div className="relative w-full overflow-hidden rounded-[4px] border border-white/10 bg-[#0B0F19] p-2 sm:p-4 shadow-md font-mono">
      {/* Top Schematic Status Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-2.5 mb-2 text-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[#00F0FF] font-bold">SCHEMATIC</span>
          <span className="text-white/20">/</span>
          <span className="text-slate-300">
            {comparatorType === 'non-inverting' ? 'Non-Inverting Voltage Comparator' : 'Inverting Voltage Comparator'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span
            className={`px-2 py-0.5 rounded-[2px] font-bold flex items-center gap-1 ${
              isPosSat
                ? 'bg-emerald-500/15 border border-emerald-500/50 text-emerald-400'
                : 'bg-[#FF5722]/15 border border-[#FF5722]/50 text-[#FF5722]'
            }`}
          >
            <span>⚡</span> RAIL: {isPosSat ? `+Vsat (+${posVsat}V)` : `-Vsat (${negVsat}V)`}
          </span>
          {isZeroVin && (
            <span className="px-2 py-0.5 rounded-[2px] bg-[#111520] border border-white/10 text-slate-400">
              INACTIVE (Vin = 0V)
            </span>
          )}
          <span className="flex items-center gap-1.5 text-[#00F0FF]">
            <span>Vin = {vinText}</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span>Vref = {vrefText}</span>
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
            <pattern id="grid-comp" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.6" fill="rgba(0, 240, 255, 0.08)" />
            </pattern>
            <marker
              id="arrow-comp-cyan"
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
              id="arrow-comp-amber"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#F59E0B" />
            </marker>
            <marker
              id="arrow-comp-out"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill={outputWireStroke} />
            </marker>
          </defs>

          {/* Background Grid */}
          <rect width="760" height="380" fill="url(#grid-comp)" />

          {/* ===================== OP-AMP TRIANGLE ===================== */}
          {/* Op-amp body: vertices at (340, 130), (340, 270), (450, 200) */}
          <polygon
            points="340,130 340,270 450,200"
            fill="#111520"
            stroke="rgba(0, 240, 255, 0.35)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Inputs markers */}
          <text x="355" y="172" fill="#F87171" fontSize="18" fontWeight="bold" fontFamily="JetBrains Mono">
            −
          </text>
          <text x="355" y="238" fill="#34D399" fontSize="18" fontWeight="bold" fontFamily="JetBrains Mono">
            +
          </text>

          {/* Op-Amp Label: Open Loop Comparator */}
          <text x="390" y="204" fill="#64748B" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle" fontWeight="bold">
            Aol ≈ 10⁵ (Open Loop)
          </text>

          {/* ===================== POWER SUPPLY SATURATION RAILS ===================== */}
          {/* +Vsat rail pin at (395, 164) up to (395, 80) */}
          <line
            x1="395"
            y1="164"
            x2="395"
            y2="80"
            stroke={isPosSat ? '#10B981' : '#64748B'}
            strokeWidth={isPosSat ? 3 : 2}
            style={{
              filter: isPosSat ? 'drop-shadow(0 0 4px #10B981)' : undefined,
              transition: 'all 0.25s ease-in-out',
            }}
          />
          <rect
            x="355"
            y="55"
            width="80"
            height="24"
            rx="3"
            fill={isPosSat ? '#08231a' : '#111520'}
            stroke={isPosSat ? '#059669' : 'rgba(255, 255, 255, 0.15)'}
          />
          <DynamicSchematicText
            value={`+Vsat (+${posVsat}V)`}
            x="395"
            y="71"
            fill={isPosSat ? '#6EE7B7' : '#94A3B8'}
            fontSize="10"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            fontWeight="bold"
            defaultColor={isPosSat ? '#6EE7B7' : '#94A3B8'}
          />

          {/* -Vsat rail pin at (395, 236) down to (395, 320) */}
          <line
            x1="395"
            y1="236"
            x2="395"
            y2="320"
            stroke={!isPosSat ? '#FF5722' : '#64748B'}
            strokeWidth={!isPosSat ? 3 : 2}
            style={{
              filter: !isPosSat ? 'drop-shadow(0 0 4px #FF5722)' : undefined,
              transition: 'all 0.25s ease-in-out',
            }}
          />
          <rect
            x="355"
            y="322"
            width="80"
            height="24"
            rx="3"
            fill={!isPosSat ? '#250810' : '#111520'}
            stroke={!isPosSat ? '#FF5722' : 'rgba(255, 255, 255, 0.15)'}
          />
          <DynamicSchematicText
            value={`-Vsat (${negVsat}V)`}
            x="395"
            y="338"
            fill={!isPosSat ? '#FDA4AF' : '#94A3B8'}
            fontSize="10"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            fontWeight="bold"
            defaultColor={!isPosSat ? '#FDA4AF' : '#94A3B8'}
          />

          {/* ===================== INPUT PATHS ACCORDING TO CONFIGURATION ===================== */}
          {comparatorType === 'non-inverting' ? (
            <>
              {/* NON-INVERTING: Vin to (+) at y=230, Vref to (-) at y=170 */}
              {/* --- Vin to (+) at y=230 with ZERO-STATE DIMMING --- */}
              <g style={{ opacity: isZeroVin ? 0.28 : 1, transition: 'opacity 0.25s ease-in-out' }}>
                <circle cx="65" cy="230" r="5.5" fill="#0B0F19" stroke="#00F0FF" strokeWidth="2.5" />
                <rect x="20" y="209" width="85" height="42" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.3)" />
                <text x="62" y="226" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
                  Vin (Signal)
                </text>
                <DynamicSchematicText
                  value={vinText}
                  x="62"
                  y="243"
                  fill="#00F0FF"
                  fontSize="12"
                  fontWeight="bold"
                  fontFamily="JetBrains Mono"
                  textAnchor="middle"
                  defaultColor="#00F0FF"
                />
                <line x1="70" y1="230" x2="340" y2="230" stroke="#00F0FF" strokeWidth="2.5" />
                {!isZeroVin && (
                  <line x1="120" y1="230" x2="240" y2="230" stroke="#00F0FF" strokeWidth="2.5" markerEnd="url(#arrow-comp-cyan)" />
                )}
              </g>

              {/* --- Vref to (-) at y=170 --- */}
              <circle cx="65" cy="170" r="5.5" fill="#0B0F19" stroke="#F59E0B" strokeWidth="2.5" />
              <rect x="20" y="105" width="85" height="42" rx="3" fill="#1c160c" stroke="rgba(245, 158, 11, 0.4)" />
              <text x="62" y="122" fill="#FDE68A" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
                Vref (Reference)
              </text>
              <DynamicSchematicText
                value={vrefText}
                x="62"
                y="139"
                fill="#F59E0B"
                fontSize="12"
                fontWeight="bold"
                fontFamily="JetBrains Mono"
                textAnchor="middle"
                defaultColor="#F59E0B"
              />
              <line x1="70" y1="170" x2="340" y2="170" stroke="#F59E0B" strokeWidth="2.5" />
              <line x1="120" y1="170" x2="240" y2="170" stroke="#F59E0B" strokeWidth="2.5" markerEnd="url(#arrow-comp-amber)" />
            </>
          ) : (
            <>
              {/* INVERTING: Vin to (-) at y=170, Vref to (+) at y=230 */}
              {/* --- Vin to (-) at y=170 with ZERO-STATE DIMMING --- */}
              <g style={{ opacity: isZeroVin ? 0.28 : 1, transition: 'opacity 0.25s ease-in-out' }}>
                <circle cx="65" cy="170" r="5.5" fill="#0B0F19" stroke="#00F0FF" strokeWidth="2.5" />
                <rect x="20" y="105" width="85" height="42" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.3)" />
                <text x="62" y="122" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
                  Vin (Inverting)
                </text>
                <DynamicSchematicText
                  value={vinText}
                  x="62"
                  y="139"
                  fill="#00F0FF"
                  fontSize="12"
                  fontWeight="bold"
                  fontFamily="JetBrains Mono"
                  textAnchor="middle"
                  defaultColor="#00F0FF"
                />
                <line x1="70" y1="170" x2="340" y2="170" stroke="#00F0FF" strokeWidth="2.5" />
                {!isZeroVin && (
                  <line x1="120" y1="170" x2="240" y2="170" stroke="#00F0FF" strokeWidth="2.5" markerEnd="url(#arrow-comp-cyan)" />
                )}
              </g>

              {/* --- Vref to (+) at y=230 --- */}
              <circle cx="65" cy="230" r="5.5" fill="#0B0F19" stroke="#F59E0B" strokeWidth="2.5" />
              <rect x="20" y="209" width="85" height="42" rx="3" fill="#1c160c" stroke="rgba(245, 158, 11, 0.4)" />
              <text x="62" y="226" fill="#FDE68A" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
                Vref (Non-Inv)
              </text>
              <DynamicSchematicText
                value={vrefText}
                x="62"
                y="243"
                fill="#F59E0B"
                fontSize="12"
                fontWeight="bold"
                fontFamily="JetBrains Mono"
                textAnchor="middle"
                defaultColor="#F59E0B"
              />
              <line x1="70" y1="230" x2="340" y2="230" stroke="#F59E0B" strokeWidth="2.5" />
              <line x1="120" y1="230" x2="240" y2="230" stroke="#F59E0B" strokeWidth="2.5" markerEnd="url(#arrow-comp-amber)" />
            </>
          )}

          {/* ===================== DYNAMIC OUTPUT PATH ===================== */}
          {/* Wire: (450, 200) to (640, 200) */}
          <line
            x1="450"
            y1="200"
            x2="640"
            y2="200"
            stroke={outputWireStroke}
            strokeWidth={3}
            style={{ filter: outputWireFilter, transition: 'all 0.25s ease-in-out' }}
          />
          <line
            x1="480"
            y1="200"
            x2="560"
            y2="200"
            stroke={outputWireStroke}
            strokeWidth="2.5"
            markerEnd="url(#arrow-comp-out)"
          />

          {/* Vout Probe terminal at (640, 200) */}
          <circle
            cx="640"
            cy="200"
            r="6"
            fill="#0B0F19"
            stroke={outputWireStroke}
            strokeWidth="3"
            style={{ filter: outputWireFilter, transition: 'all 0.25s ease-in-out' }}
          />
          <rect
            x="595"
            y="135"
            width="105"
            height="50"
            rx="3"
            fill={isPosSat ? '#08231a' : '#250810'}
            stroke={isPosSat ? '#059669' : '#FF5722'}
            strokeWidth={1.5}
            style={{ transition: 'all 0.25s ease-in-out' }}
          />
          <text
            x="647"
            y="152"
            fill={isPosSat ? '#6EE7B7' : '#FDA4AF'}
            fontSize="10"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
          >
            Vout (Saturated)
          </text>
          <DynamicSchematicText
            value={voutText}
            x="647"
            y="172"
            fill={outputWireStroke}
            fontSize="13"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor={outputWireStroke}
          />

          {/* Bottom Summary Badge */}
          <rect x="30" y="325" width="280" height="34" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.2)" />
          <text x="45" y="342" fill="#00F0FF" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
            Condition: {vin > vref ? 'Vin > Vref' : vin < vref ? 'Vin < Vref' : 'Vin = Vref'}
          </text>
          <text x="45" y="353" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono">
            {comparatorType === 'non-inverting'
              ? vin > vref
                ? 'Output drives to +Vsat (HIGH)'
                : 'Output drives to -Vsat (LOW)'
              : vin > vref
              ? 'Output inverts to -Vsat (LOW)'
              : 'Output inverts to +Vsat (HIGH)'}
          </text>
        </svg>
      </div>
    </div>
  );
};
