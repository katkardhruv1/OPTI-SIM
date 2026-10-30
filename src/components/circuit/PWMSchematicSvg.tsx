import React from 'react';
import { cleanFloat, formatFrequency } from '../../utils/formatters';
import { DynamicSchematicText } from './DynamicSchematicText';

interface PWMSchematicSvgProps {
  carrierFreq: number;
  carrierAmp: number;
  vControl: number;
  dutyCycle: number;
  vMin: number;
  vMax: number;
}

export const PWMSchematicSvg: React.FC<PWMSchematicSvgProps> = ({
  carrierFreq,
  carrierAmp,
  vControl,
  dutyCycle,
  vMin,
  vMax,
}) => {
  const isZeroVcontrol = Math.abs(vControl) < 1e-5;
  const isZeroCarrier = carrierFreq <= 0;

  const outputWireStroke = '#00F0FF';
  const outputWireFilter = 'drop-shadow(0 0 5px rgba(0, 240, 255, 0.75))';

  return (
    <div className="relative w-full overflow-hidden rounded-[4px] border border-white/10 bg-[#0B0F19] p-2 sm:p-4 shadow-md font-mono">
      {/* Top Schematic Status Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-2.5 mb-2 text-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[#00F0FF] font-bold">SCHEMATIC</span>
          <span className="text-white/20">/</span>
          <span className="text-slate-300">Comparator-Based Pulse Width Modulator</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          {isZeroVcontrol && (
            <span className="px-2 py-0.5 rounded-[2px] bg-[#111520] border border-white/10 text-slate-400">
              INACTIVE (Vctrl = 0V)
            </span>
          )}
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shadow-[0_0_4px_#F59E0B]"></span>
            <span>Carrier: {formatFrequency(carrierFreq)} (0–{vMax}V)</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-[0_0_4px_#10B981]"></span>
            <span>Vcontrol = {cleanFloat(vControl, 2)} V</span>
          </span>
          <span className="flex items-center gap-1.5 text-[#00F0FF]">
            <span>Duty: {cleanFloat(dutyCycle, 1)}%</span>
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
            <pattern id="grid-pwm" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.6" fill="rgba(0, 240, 255, 0.08)" />
            </pattern>
            <marker
              id="arrow-pwm-amber"
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
              id="arrow-pwm-emerald"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#10B981" />
            </marker>
            <marker
              id="arrow-pwm-cyan"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#00F0FF" />
            </marker>
          </defs>

          {/* Background Grid */}
          <rect width="760" height="380" fill="url(#grid-pwm)" />

          {/* ===================== STAGE 1: TRIANGULAR CARRIER GENERATOR ===================== */}
          <g style={{ opacity: isZeroCarrier ? 0.28 : 1, transition: 'opacity 0.25s ease-in-out' }}>
            <rect x="25" y="70" width="145" height="105" rx="4" fill="#1c160c" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="1.5" />
            <text x="97" y="95" fill="#F59E0B" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle" fontWeight="bold">
              Triangular Carrier
            </text>
            {/* Triangular wave icon */}
            <path
              d="M 45 145 L 70 115 L 95 145 L 120 115 L 145 145"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2"
            />
            <DynamicSchematicText
              value={`${formatFrequency(carrierFreq)} | ${vMin}V–${vMax}V`}
              x="97"
              y="162"
              fill="#FDE68A"
              fontSize="9"
              fontFamily="JetBrains Mono"
              textAnchor="middle"
              defaultColor="#FDE68A"
            />

            {/* Carrier signal wire to Comparator inverting (-) pin */}
            <line x1="170" y1="125" x2="360" y2="125" stroke="#F59E0B" strokeWidth="2.5" />
            {!isZeroCarrier && (
              <line x1="170" y1="125" x2="310" y2="125" stroke="#F59E0B" strokeWidth="2.5" markerEnd="url(#arrow-pwm-amber)" />
            )}
            <line x1="360" y1="125" x2="360" y2="168" stroke="#F59E0B" strokeWidth="2.5" />
            <line x1="360" y1="168" x2="410" y2="168" stroke="#F59E0B" strokeWidth="2.5" />
          </g>

          {/* ===================== STAGE 2: DC CONTROL VOLTAGE SOURCE (ZERO-STATE DIMMED) ===================== */}
          <g style={{ opacity: isZeroVcontrol ? 0.28 : 1, transition: 'opacity 0.25s ease-in-out' }}>
            <rect x="25" y="210" width="145" height="105" rx="4" fill="#08231a" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1.5" />
            <text x="97" y="235" fill="#10B981" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle" fontWeight="bold">
              DC Control Voltage
            </text>
            {/* DC level icon */}
            <line x1="45" y1="260" x2="145" y2="260" stroke="#10B981" strokeWidth="2.5" />
            <DynamicSchematicText
              value={`Vcontrol = ${cleanFloat(vControl, 2)} V`}
              x="97"
              y="295"
              fill="#6EE7B7"
              fontSize="11"
              fontFamily="JetBrains Mono"
              textAnchor="middle"
              fontWeight="bold"
              defaultColor="#6EE7B7"
            />

            {/* Control signal wire to Comparator non-inverting (+) pin */}
            <line x1="170" y1="260" x2="360" y2="260" stroke="#10B981" strokeWidth="2.5" />
            {!isZeroVcontrol && (
              <line x1="170" y1="260" x2="310" y2="260" stroke="#10B981" strokeWidth="2.5" markerEnd="url(#arrow-pwm-emerald)" />
            )}
            <line x1="360" y1="260" x2="360" y2="232" stroke="#10B981" strokeWidth="2.5" />
            <line x1="360" y1="232" x2="410" y2="232" stroke="#10B981" strokeWidth="2.5" />
          </g>

          {/* ===================== OP-AMP COMPARATOR ===================== */}
          {/* Op-amp body: vertices at (410, 130), (410, 270), (520, 200) */}
          <polygon
            points="410,130 410,270 520,200"
            fill="#111520"
            stroke="rgba(0, 240, 255, 0.35)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Inputs markers */}
          <text x="425" y="172" fill="#F87171" fontSize="18" fontWeight="bold" fontFamily="JetBrains Mono">
            −
          </text>
          <text x="425" y="238" fill="#34D399" fontSize="18" fontWeight="bold" fontFamily="JetBrains Mono">
            +
          </text>

          {/* Op-Amp Label */}
          <text x="455" y="204" fill="#64748B" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle" fontWeight="bold">
            PWM Comparator
          </text>

          {/* ===================== PWM DIGITAL OUTPUT TERMINAL ===================== */}
          <line
            x1="520"
            y1="200"
            x2="640"
            y2="200"
            stroke={outputWireStroke}
            strokeWidth={3}
            style={{ filter: outputWireFilter, transition: 'all 0.25s ease-in-out' }}
          />
          <line
            x1="540"
            y1="200"
            x2="600"
            y2="200"
            stroke={outputWireStroke}
            strokeWidth="2.5"
            markerEnd="url(#arrow-pwm-cyan)"
          />
          <circle
            cx="640"
            cy="200"
            r="6"
            fill="#0B0F19"
            stroke={outputWireStroke}
            strokeWidth={3}
            style={{ filter: outputWireFilter, transition: 'all 0.25s ease-in-out' }}
          />

          <rect
            x="585"
            y="135"
            width="135"
            height="55"
            rx="3"
            fill="#111520"
            stroke="rgba(0, 240, 255, 0.3)"
            strokeWidth={1.5}
            style={{ transition: 'all 0.25s ease-in-out' }}
          />
          <text x="652" y="155" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
            PWM Pulse Train
          </text>
          <DynamicSchematicText
            value={`Duty: ${cleanFloat(dutyCycle, 1)}%`}
            x="652"
            y="175"
            fill="#00F0FF"
            fontSize="13"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor="#00F0FF"
          />

          {/* Comparator Decision Badge at Bottom */}
          <rect x="25" y="330" width="460" height="34" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.2)" />
          <text x="40" y="347" fill="#00F0FF" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
            Condition: Vcontrol &gt; Vcarrier ⟹ PWM = 5V (HIGH) | Vcontrol &le; Vcarrier ⟹ PWM = 0V (LOW)
          </text>
          <text x="40" y="358" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono">
            Duty Cycle = (Vcontrol - Vmin) / (Vmax - Vmin) × 100% = {cleanFloat(dutyCycle, 1)}%
          </text>
        </svg>
      </div>
    </div>
  );
};
