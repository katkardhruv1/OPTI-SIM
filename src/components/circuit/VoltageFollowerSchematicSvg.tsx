import React from 'react';
import { formatVoltage } from '../../utils/formatters';
import { DynamicSchematicText } from './DynamicSchematicText';

interface VoltageFollowerSchematicSvgProps {
  vin: number;
  vinUnit: 'V' | 'mV';
  vout: number;
  posVsat?: number;
  negVsat?: number;
  isClipped?: boolean;
}

export const VoltageFollowerSchematicSvg: React.FC<VoltageFollowerSchematicSvgProps> = ({
  vin,
  vinUnit,
  vout,
  posVsat = 15,
  negVsat = -15,
  isClipped,
}) => {
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
          <span className="text-slate-300">Unity Gain Buffer (Voltage Follower)</span>
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
            <span>Non-Inverting Input (+)</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shadow-[0_0_4px_#F59E0B]"></span>
            <span>100% Negative Feedback</span>
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
            <pattern id="grid-follower" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.6" fill="rgba(0, 240, 255, 0.08)" />
            </pattern>
            <marker
              id="arrow-cyan-vf"
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
              id="arrow-orange-vf"
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
              id="arrow-amber-vf"
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
          <rect width="760" height="380" fill="url(#grid-follower)" />

          {/* ===================== OP-AMP TRIANGLE ===================== */}
          <polygon
            points="390,140 390,300 500,220"
            fill="#111520"
            stroke="rgba(0, 240, 255, 0.35)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Inverting Terminal '-' at (405, 186) */}
          <text
            x="405"
            y="186"
            fill="#F87171"
            fontSize="22"
            fontWeight="bold"
            fontFamily="JetBrains Mono, monospace"
          >
            −
          </text>

          {/* Non-inverting Terminal '+' at (405, 267) */}
          <text
            x="405"
            y="267"
            fill="#34D399"
            fontSize="20"
            fontWeight="bold"
            fontFamily="JetBrains Mono, monospace"
          >
            +
          </text>

          {/* Op-Amp Center Label */}
          <text
            x="435"
            y="225"
            fill="#64748B"
            fontSize="12"
            fontWeight="bold"
            letterSpacing="0.05em"
            fontFamily="JetBrains Mono, monospace"
            textAnchor="middle"
          >
            OP-AMP
          </text>

          {/* ===================== ZERO-STATE DIMMED INPUT ===================== */}
          <g style={{ opacity: isZeroVin ? 0.28 : 1, transition: 'opacity 0.25s ease-in-out' }}>
            <line x1="80" y1="260" x2="390" y2="260" stroke="#00F0FF" strokeWidth="2.5" />
            {!isZeroVin && (
              <line x1="180" y1="260" x2="240" y2="260" stroke="#00F0FF" strokeWidth="2.5" markerEnd="url(#arrow-cyan-vf)" />
            )}

            {/* Vin Input Probe */}
            <circle cx="80" cy="260" r="5.5" fill="#0B0F19" stroke="#00F0FF" strokeWidth="2.5" />
            <rect x="30" y="205" width="85" height="42" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.3)" />
            <text x="72" y="222" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
              Vin (Input)
            </text>
            <DynamicSchematicText
              value={vinText}
              x="72"
              y="239"
              fontSize="13"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
              textAnchor="middle"
              defaultColor="#00F0FF"
            />
          </g>

          {/* ===================== DIRECT FEEDBACK LOOP (Output -> Inverting -) ===================== */}
          {/* Wire from Inverting input (390, 180) to (310, 180) */}
          <line x1="390" y1="180" x2="310" y2="180" stroke="#F59E0B" strokeWidth="2.5" />

          {/* Loop wire UP: (310, 180) to (310, 90) */}
          <line x1="310" y1="180" x2="310" y2="90" stroke="#F59E0B" strokeWidth="2.5" />

          {/* Top Feedback Bar: (310, 90) to (560, 90) */}
          <line x1="310" y1="90" x2="560" y2="90" stroke="#F59E0B" strokeWidth="2.5" />
          {!isZeroVin && (
            <line x1="410" y1="90" x2="470" y2="90" stroke="#F59E0B" strokeWidth="2.5" markerEnd="url(#arrow-amber-vf)" />
          )}

          {/* Loop wire DOWN: (560, 90) to Output node at (560, 220) */}
          <line x1="560" y1="90" x2="560" y2="220" stroke="#F59E0B" strokeWidth="2.5" />

          {/* Direct feedback annotation badge */}
          <rect x="360" y="45" width="150" height="30" rx="3" fill="#1c160c" stroke="rgba(245, 158, 11, 0.4)" />
          <text x="435" y="58" fill="#FBBF24" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">
            Direct Negative Feedback
          </text>
          <text x="435" y="70" fill="#FEF08A" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono" textAnchor="middle">
            Rf = 0 Ω, R1 = ∞ (Av = 1)
          </text>

          {/* ===================== DYNAMIC OP-AMP OUTPUT WIRE & PROBE ===================== */}
          <line
            x1="500"
            y1="220"
            x2="680"
            y2="220"
            stroke={outputWireStroke}
            strokeWidth={isSaturated ? 3.5 : 2.5}
            style={{
              filter: outputWireFilter,
              transition: 'all 0.25s ease-in-out',
            }}
          />

          {/* Feedback junction node dot at (560, 220) */}
          <circle cx="560" cy="220" r="4.5" fill={outputWireStroke} />
          {!isZeroVin && (
            <line
              x1="590"
              y1="220"
              x2="630"
              y2="220"
              stroke={outputWireStroke}
              strokeWidth="2.5"
              markerEnd={isSaturated ? 'url(#arrow-orange-vf)' : 'url(#arrow-cyan-vf)'}
            />
          )}

          {/* Vout Output Probe */}
          <circle
            cx="680"
            cy="220"
            r="5.5"
            fill="#0B0F19"
            stroke={outputWireStroke}
            strokeWidth="2.5"
            style={{ filter: outputWireFilter, transition: 'all 0.25s ease-in-out' }}
          />
          <rect
            x="625"
            y="160"
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
            y="177"
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
            y="194"
            fontSize="13"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor={isSaturated ? '#FF5722' : '#00F0FF'}
          />

          {/* Gain marker */}
          <g transform="translate(580, 270)">
            <text x="0" y="0" fill="#64748B" fontSize="11" fontFamily="JetBrains Mono">
              Voltage Gain Av ={' '}
              <tspan fill="#00F0FF" fontWeight="bold">
                1.00 (Unity)
              </tspan>
            </text>
            <text x="0" y="16" fill="#64748B" fontSize="11" fontFamily="JetBrains Mono">
              Phase Shift ={' '}
              <tspan fill="#34D399" fontWeight="bold">
                0° (Direct Tracking)
              </tspan>
            </text>
            <text x="0" y="32" fill="#64748B" fontSize="11" fontFamily="JetBrains Mono">
              Relation:{' '}
              <tspan fill="#A7F3D0" fontWeight="bold">
                Vout = Vin
              </tspan>
            </text>
          </g>
        </svg>
      </div>

      {/* Schematic Readouts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/10 text-[11px] font-mono">
        <div className="bg-[#111520] p-2 rounded-[3px] border border-white/10">
          <span className="text-slate-400 block">Feedback Ratio (β):</span>
          <span className="text-[#00F0FF] font-semibold">1.00 (100% Feedback)</span>
        </div>
        <div className="bg-[#111520] p-2 rounded-[3px] border border-white/10">
          <span className="text-slate-400 block">Input Impedance (Zin):</span>
          <span className="text-[#00F0FF] font-semibold">∞ (No Loading Effect)</span>
        </div>
        <div className="bg-[#111520] p-2 rounded-[3px] border border-white/10">
          <span className="text-slate-400 block">Output Impedance (Zout):</span>
          <span className="text-emerald-400 font-semibold">0 Ω (Ideal Buffer)</span>
        </div>
        <div className="bg-[#111520] p-2 rounded-[3px] border border-white/10">
          <span className="text-slate-400 block">Output Voltage:</span>
          <span className="text-amber-400 font-semibold">{voutText} (Follows Vin)</span>
        </div>
      </div>
    </div>
  );
};
