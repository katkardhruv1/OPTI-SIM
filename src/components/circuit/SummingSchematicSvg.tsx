import React from 'react';
import { SummingInputChannel } from '../../types/circuit';
import { formatResistance, formatVoltage } from '../../utils/formatters';
import { DynamicSchematicText } from './DynamicSchematicText';

interface SummingSchematicSvgProps {
  channels: SummingInputChannel[];
  rfBase: number;
  vout: number;
  posVsat?: number;
  negVsat?: number;
  isClipped?: boolean;
}

export const SummingSchematicSvg: React.FC<SummingSchematicSvgProps> = ({
  channels,
  rfBase,
  vout,
  posVsat = 15,
  negVsat = -15,
  isClipped,
}) => {
  const rfText = formatResistance(rfBase);
  const voutText = formatVoltage(vout);

  // Dynamic States
  const isSaturated = isClipped ?? (Math.abs(vout) >= posVsat - 0.05 || vout >= posVsat || vout <= negVsat);
  const allZero = channels.every((ch) => Math.abs(ch.voltage) < 1e-5);

  // Dynamic Output Wire Styling
  const outputWireStroke = isSaturated ? '#FF5722' : '#00F0FF';
  const outputWireFilter = isSaturated ? 'drop-shadow(0 0 6px rgba(255, 87, 34, 0.85))' : undefined;

  const n = channels.length;
  const branchYs: number[] = [];
  if (n === 2) {
    branchYs.push(160, 230);
  } else if (n === 3) {
    branchYs.push(130, 195, 260);
  } else {
    branchYs.push(110, 160, 210, 260);
  }

  const junctionX = 340;
  const junctionY = 210;
  const minY = Math.min(...branchYs);
  const maxY = Math.max(...branchYs);

  return (
    <div className="relative w-full overflow-hidden rounded-[4px] border border-white/10 bg-[#0B0F19] p-2 sm:p-4 shadow-md font-mono">
      {/* Top Schematic Status Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-2.5 mb-2 text-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[#00F0FF] font-bold">SCHEMATIC</span>
          <span className="text-white/20">/</span>
          <span className="text-slate-300">Inverting Summing Junction ({n} Channels)</span>
        </div>

        {/* Dynamic Alert Badges */}
        <div className="flex items-center gap-2 text-[11px]">
          {isSaturated && (
            <span className="px-2 py-0.5 rounded-[2px] bg-[#FF5722]/15 border border-[#FF5722]/50 text-[#FF5722] font-bold flex items-center gap-1 animate-pulse">
              <span>⚠️</span> SATURATED (±{posVsat}V)
            </span>
          )}
          {allZero && (
            <span className="px-2 py-0.5 rounded-[2px] bg-[#111520] border border-white/10 text-slate-400">
              ALL CHANNELS 0V
            </span>
          )}
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF] inline-block shadow-[0_0_4px_#00F0FF]"></span>
            <span>Input Branches</span>
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
          viewBox="0 0 760 410"
          className="w-full h-auto max-w-[760px] select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid-sum" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.6" fill="rgba(0, 240, 255, 0.08)" />
            </pattern>
            <marker
              id="arrow-sum-cyan"
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
              id="arrow-sum-orange"
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
              id="arrow-sum-amber"
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
          <rect width="760" height="410" fill="url(#grid-sum)" />

          {/* ===================== CHANNELS BRANCHES (WITH ZERO-STATE DIMMING) ===================== */}
          {channels.map((ch, idx) => {
            const y = branchYs[idx] || 150;
            const rText = formatResistance(ch.resistance);
            const vText = `${ch.voltage} ${ch.voltageUnit}`;
            const isZeroChan = Math.abs(ch.voltage) < 1e-5;

            return (
              <g
                key={`ch-${ch.id}`}
                style={{ opacity: isZeroChan ? 0.28 : 1, transition: 'opacity 0.25s ease-in-out' }}
              >
                {/* Input probe terminal (50, y) */}
                <circle cx="50" cy={y} r="5" fill="#0B0F19" stroke="#00F0FF" strokeWidth="2.5" />
                <rect x="5" y={y - 20} width="70" height="40" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.25)" />
                <text x="40" y={y - 5} fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">
                  V{idx + 1}
                </text>
                <DynamicSchematicText
                  value={vText}
                  x="40"
                  y={y + 11}
                  fontSize="10.5"
                  fontWeight="bold"
                  fontFamily="JetBrains Mono"
                  textAnchor="middle"
                  defaultColor="#00F0FF"
                />

                {/* Wire from probe (50, y) to resistor start (130, y) */}
                <line x1="55" y1={y} x2="130" y2={y} stroke="#00F0FF" strokeWidth="2" />
                {!isZeroChan && (
                  <line x1="75" y1={y} x2="110" y2={y} stroke="#00F0FF" strokeWidth="2" markerEnd="url(#arrow-sum-cyan)" />
                )}

                {/* Resistor Ri (130, y) to (210, y) */}
                <path
                  d={`M 130 ${y} L 138 ${y} L 143 ${y - 12} L 153 ${y + 12} L 163 ${y - 12} L 173 ${y + 12} L 183 ${y - 12} L 193 ${y + 12} L 198 ${y} L 210 ${y}`}
                  fill="none"
                  stroke="#00F0FF"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />

                {/* Ri Badge */}
                <rect x="145" y={y - 28} width="55" height="18" rx="2" fill="#111520" stroke="rgba(0, 240, 255, 0.2)" />
                <text x="172" y={y - 15} fill="#94A3B8" fontSize="8.5" fontFamily="JetBrains Mono" textAnchor="middle">
                  R{idx + 1}:
                </text>
                <DynamicSchematicText
                  value={rText}
                  x="188"
                  y={y - 15}
                  fontSize="8.5"
                  fontWeight="bold"
                  fontFamily="JetBrains Mono"
                  textAnchor="middle"
                  defaultColor="#E2E8F0"
                />

                {/* Wire from resistor end (210, y) to junction bus (junctionX, y) */}
                <line x1="210" y1={y} x2={junctionX} y2={y} stroke="#00F0FF" strokeWidth="2" />
                <circle cx={junctionX} cy={y} r="3.5" fill="#00F0FF" />
              </g>
            );
          })}

          {/* Summing Junction Vertical Bus: (junctionX, minY) to (junctionX, maxY) */}
          <line x1={junctionX} y1={minY} x2={junctionX} y2={maxY} stroke="#00F0FF" strokeWidth="2.5" />

          {/* Central Summing Junction Node dot at (junctionX, junctionY) */}
          <circle cx={junctionX} cy={junctionY} r="5" fill="#00F0FF" />

          {/* Wire from junction (junctionX, junctionY) to Op-Amp Inverting input (430, junctionY) */}
          <line x1={junctionX} y1={junctionY} x2={430} y2={junctionY} stroke="#00F0FF" strokeWidth="2.5" />

          {/* Virtual Ground Badge at summing node */}
          <g transform={`translate(${junctionX - 35}, ${maxY + 15})`}>
            <rect x="0" y="0" width="70" height="26" rx="3" fill="#06281e" stroke="#065f46" strokeWidth="1" />
            <text x="35" y="11" fill="#34D399" fontSize="8" fontFamily="JetBrains Mono" textAnchor="middle">
              Summing Node
            </text>
            <text x="35" y="21" fill="#A7F3D0" fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono" textAnchor="middle">
              V⁻ ≈ 0.00 V
            </text>
          </g>

          {/* ===================== FEEDBACK LOOP (RF) ===================== */}
          {/* Wire going UP from (junctionX, junctionY) to (junctionX, 70) */}
          <line x1={junctionX} y1={junctionY} x2={junctionX} y2={70} stroke="#F59E0B" strokeWidth="2.5" />
          <line x1={junctionX} y1={70} x2={380} y2={70} stroke="#F59E0B" strokeWidth="2.5" />

          {/* Rf Resistor (380, 70) to (470, 70) */}
          <path
            d="M 380 70 L 388 70 L 393 55 L 403 85 L 413 55 L 423 85 L 433 55 L 443 85 L 448 70 L 470 70"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Rf Badge */}
          <rect x="400" y="22" width="75" height="24" rx="3" fill="#1c160c" stroke="rgba(245, 158, 11, 0.4)" />
          <text x="437" y="38" fill="#FBBF24" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
            Rf:
          </text>
          <DynamicSchematicText
            value={rfText}
            x="457"
            y="38"
            fontSize="11"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor="#FEF08A"
          />

          {/* Wire continuing from Rf to Output wire */}
          <line x1="470" y1="70" x2="590" y2="70" stroke="#F59E0B" strokeWidth="2.5" />
          {!allZero && (
            <line x1="490" y1={70} x2="540" y2={70} stroke="#F59E0B" strokeWidth="2.5" markerEnd="url(#arrow-sum-amber)" />
          )}
          <line x1="590" y1={70} x2="590" y2={240} stroke="#F59E0B" strokeWidth="2.5" />

          {/* ===================== OP-AMP TRIANGLE ===================== */}
          <polygon
            points="430,170 430,310 540,240"
            fill="#111520"
            stroke="rgba(0, 240, 255, 0.35)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Inverting input '-' at (445, 216) */}
          <text
            x="445"
            y="216"
            fill="#F87171"
            fontSize="22"
            fontWeight="bold"
            fontFamily="JetBrains Mono, monospace"
          >
            −
          </text>

          {/* Non-inverting input '+' at (445, 282) */}
          <text
            x="445"
            y="282"
            fill="#34D399"
            fontSize="20"
            fontWeight="bold"
            fontFamily="JetBrains Mono, monospace"
          >
            +
          </text>

          <text
            x="475"
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
          <line x1="430" y1="275" x2="380" y2="275" stroke="#94A3B8" strokeWidth="2.5" />
          <line x1="380" y1="275" x2="380" y2="320" stroke="#94A3B8" strokeWidth="2.5" />

          {/* Ground Symbol */}
          <line x1="365" y1="320" x2="395" y2="320" stroke="#94A3B8" strokeWidth="2.5" />
          <line x1="370" y1="326" x2="390" y2="326" stroke="#94A3B8" strokeWidth="2" />
          <line x1="376" y1="332" x2="384" y2="332" stroke="#94A3B8" strokeWidth="1.5" />
          <text x="380" y="350" fill="#64748B" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
            GND
          </text>

          {/* ===================== DYNAMIC OP-AMP OUTPUT WIRE & PROBE ===================== */}
          <line
            x1="540"
            y1="240"
            x2="680"
            y2="240"
            stroke={outputWireStroke}
            strokeWidth={isSaturated ? 3.5 : 2.5}
            style={{ filter: outputWireFilter, transition: 'all 0.25s ease-in-out' }}
          />
          <circle cx="590" cy="240" r="4.5" fill={outputWireStroke} />
          {!allZero && (
            <line
              x1="605"
              y1="240"
              x2="645"
              y2="240"
              stroke={outputWireStroke}
              strokeWidth="2.5"
              markerEnd={isSaturated ? 'url(#arrow-sum-orange)' : 'url(#arrow-sum-cyan)'}
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

          {/* Equation summary */}
          <g transform="translate(560, 290)">
            <text x="0" y="0" fill="#64748B" fontSize="11" fontFamily="JetBrains Mono">
              Summing Eqn:
            </text>
            <text x="0" y="16" fill="#00F0FF" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono">
              Vout = -Rf Σ(Vi/Ri)
            </text>
            <text x="0" y="32" fill="#F59E0B" fontSize="11" fontFamily="JetBrains Mono">
              Phase Shift: 180°
            </text>
          </g>
        </svg>
      </div>

      {/* Schematic Readouts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/10 text-[11px] font-mono">
        <div className="bg-[#111520] p-2 rounded-[3px] border border-white/10">
          <span className="text-slate-400 block">Summing Junction:</span>
          <span className="text-[#00F0FF] font-semibold">{n} Active Inputs</span>
        </div>
        <div className="bg-[#111520] p-2 rounded-[3px] border border-white/10">
          <span className="text-slate-400 block">Virtual Ground (V⁻):</span>
          <span className="text-emerald-400 font-semibold">0.00 V (Zero Cross-Talk)</span>
        </div>
        <div className="bg-[#111520] p-2 rounded-[3px] border border-white/10">
          <span className="text-slate-400 block">Feedback Resistor (Rf):</span>
          <span className="text-amber-400 font-semibold">{rfText}</span>
        </div>
        <div className="bg-[#111520] p-2 rounded-[3px] border border-white/10">
          <span className="text-slate-400 block">Net Output (Vout):</span>
          <span className="text-[#00F0FF] font-semibold">{voutText}</span>
        </div>
      </div>
    </div>
  );
};
