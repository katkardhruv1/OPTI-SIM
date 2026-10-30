import React from 'react';
import { formatResistance, formatCapacitance, cleanFloat, formatFrequency } from '../../utils/formatters';
import { DynamicSchematicText } from './DynamicSchematicText';

interface SquareWaveSchematicSvgProps {
  r1Base: number;
  r2Base: number;
  rBase: number;
  cBase: number;
  posVsat: number;
  negVsat: number;
  frequency: number;
  beta: number;
}

export const SquareWaveSchematicSvg: React.FC<SquareWaveSchematicSvgProps> = ({
  r1Base,
  r2Base,
  rBase,
  cBase,
  posVsat,
  negVsat,
  frequency,
  beta,
}) => {
  const r1Str = formatResistance(r1Base);
  const r2Str = formatResistance(r2Base);
  const rStr = formatResistance(rBase);
  const cStr = formatCapacitance(cBase);

  const outputWireStroke = '#00F0FF';
  const outputWireFilter = 'drop-shadow(0 0 5px rgba(0, 240, 255, 0.75))';

  return (
    <div className="relative w-full overflow-hidden rounded-[4px] border border-white/10 bg-[#0B0F19] p-2 sm:p-4 shadow-md font-mono">
      {/* Top Schematic Status Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-2.5 mb-2 text-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[#00F0FF] font-bold">SCHEMATIC</span>
          <span className="text-white/20">/</span>
          <span className="text-slate-300">Op-Amp Relaxation Oscillator (Astable Multivibrator)</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="px-2 py-0.5 rounded-[2px] bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] font-bold flex items-center gap-1">
            <span>⚡</span> OSCILLATING (±{posVsat}V)
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF] inline-block shadow-[0_0_4px_#00F0FF]"></span>
            <span>RC Timing: {rStr}, {cStr}</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shadow-[0_0_4px_#F59E0B]"></span>
            <span>β = {cleanFloat(beta, 3)}</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span>f ≈ {formatFrequency(frequency)}</span>
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
            <pattern id="grid-sqw" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.6" fill="rgba(0, 240, 255, 0.08)" />
            </pattern>
          </defs>

          {/* Background Grid */}
          <rect width="760" height="380" fill="url(#grid-sqw)" />

          {/* ===================== OP-AMP TRIANGLE ===================== */}
          {/* Op-amp body: vertices at (360, 130), (360, 270), (470, 200) */}
          <polygon
            points="360,130 360,270 470,200"
            fill="#111520"
            stroke="rgba(0, 240, 255, 0.35)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Inputs markers */}
          <text x="375" y="172" fill="#F87171" fontSize="18" fontWeight="bold" fontFamily="JetBrains Mono">
            −
          </text>
          <text x="375" y="238" fill="#34D399" fontSize="18" fontWeight="bold" fontFamily="JetBrains Mono">
            +
          </text>

          {/* Saturation Rails */}
          <line x1="415" y1="164" x2="415" y2="80" stroke="#10B981" strokeWidth="2" />
          <rect x="380" y="55" width="70" height="24" rx="3" fill="#08231a" stroke="#059669" />
          <DynamicSchematicText
            value={`+Vsat (+${posVsat}V)`}
            x="415"
            y="71"
            fill="#6EE7B7"
            fontSize="10"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            fontWeight="bold"
            defaultColor="#6EE7B7"
          />

          <line x1="415" y1="236" x2="415" y2="320" stroke="#FF5722" strokeWidth="2" />
          <rect x="380" y="322" width="70" height="24" rx="3" fill="#250810" stroke="#FF5722" />
          <DynamicSchematicText
            value={`-Vsat (${negVsat}V)`}
            x="415"
            y="338"
            fill="#FDA4AF"
            fontSize="10"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            fontWeight="bold"
            defaultColor="#FDA4AF"
          />

          {/* ===================== UPPER RC TIMING LOOP (Negative Feedback to -) ===================== */}
          {/* Output tap at (510, 200) branching up to y=60 */}
          <line x1="470" y1="200" x2="510" y2="200" stroke="#00F0FF" strokeWidth="2.5" />
          <circle cx="510" cy="200" r="4.5" fill="#00F0FF" />
          <line x1="510" y1="200" x2="510" y2="60" stroke="#00F0FF" strokeWidth="2.5" />
          <line x1="510" y1="60" x2="330" y2="60" stroke="#00F0FF" strokeWidth="2.5" />

          {/* Timing Resistor R between x=330 and x=230 at y=60 */}
          <path
            d="M 330 60 L 318 60 L 312 45 L 300 75 L 288 45 L 276 75 L 264 45 L 252 75 L 246 60 L 230 60"
            fill="none"
            stroke="#00F0FF"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <rect x="225" y="24" width="110" height="22" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.25)" />
          <DynamicSchematicText
            value={`Timing R (${rStr})`}
            x="280"
            y="39"
            fill="#00F0FF"
            fontSize="10"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor="#00F0FF"
          />

          {/* Wire from R (230, 60) down to Node C at (230, 168) */}
          <line x1="230" y1="60" x2="230" y2="168" stroke="#00F0FF" strokeWidth="2.5" />
          <circle cx="230" cy="168" r="4.5" fill="#00F0FF" />
          <text x="200" y="165" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono">
            Node Vc
          </text>

          {/* Wire from Node C (230, 168) to op-amp Inverting (-) pin at (360, 168) */}
          <line x1="230" y1="168" x2="360" y2="168" stroke="#00F0FF" strokeWidth="2.5" />

          {/* Timing Capacitor C branch from (230, 168) down to Ground at (230, 240) */}
          <line x1="230" y1="168" x2="230" y2="200" stroke="#00F0FF" strokeWidth="2.5" />
          {/* Capacitor C plates at y=200 and y=208 */}
          <line x1="210" y1="200" x2="250" y2="200" stroke="#00F0FF" strokeWidth="3" />
          <line x1="210" y1="208" x2="250" y2="208" stroke="#00F0FF" strokeWidth="3" />
          <line x1="230" y1="208" x2="230" y2="235" stroke="#94A3B8" strokeWidth="2.5" />
          {/* Ground */}
          <line x1="215" y1="235" x2="245" y2="235" stroke="#94A3B8" strokeWidth="2.5" />
          <line x1="220" y1="240" x2="240" y2="240" stroke="#94A3B8" strokeWidth="2" />
          <line x1="226" y1="245" x2="234" y2="245" stroke="#94A3B8" strokeWidth="1.5" />
          <rect x="255" y="198" width="70" height="20" rx="2" fill="#111520" stroke="rgba(0, 240, 255, 0.25)" />
          <DynamicSchematicText
            value={`C (${cStr})`}
            x="290"
            y="212"
            fill="#00F0FF"
            fontSize="10"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor="#00F0FF"
          />

          {/* ===================== LOWER SCHMITT DIVIDER (Positive Feedback to +) ===================== */}
          {/* Output tap at (560, 200) branching down to y=330 */}
          <line x1="510" y1="200" x2="560" y2="200" stroke="#F59E0B" strokeWidth="2.5" />
          <circle cx="560" cy="200" r="4.5" fill="#F59E0B" />
          <line x1="560" y1="200" x2="560" y2="330" stroke="#F59E0B" strokeWidth="2.5" />
          <line x1="560" y1="330" x2="480" y2="330" stroke="#F59E0B" strokeWidth="2.5" />

          {/* Resistor R2 (feedback) between x=480 and x=380 at y=330 */}
          <path
            d="M 480 330 L 468 330 L 462 315 L 450 345 L 438 315 L 426 345 L 414 315 L 402 345 L 396 330 L 380 330"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <rect x="385" y="295" width="90" height="22" rx="3" fill="#1c160c" stroke="rgba(245, 158, 11, 0.4)" />
          <DynamicSchematicText
            value={`R2 (${r2Str})`}
            x="430"
            y="310"
            fill="#FBBF24"
            fontSize="10"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor="#FBBF24"
          />

          {/* Wire to Node V+ at (300, 330) */}
          <line x1="380" y1="330" x2="300" y2="330" stroke="#F59E0B" strokeWidth="2.5" />
          <circle cx="300" cy="330" r="4.5" fill="#F59E0B" />

          {/* Resistor R1 from (300, 330) to Ground at x=180 */}
          <line x1="300" y1="330" x2="260" y2="330" stroke="#F59E0B" strokeWidth="2.5" />
          <path
            d="M 260 330 L 248 330 L 242 315 L 230 345 L 218 315 L 206 345 L 194 315 L 182 345 L 176 330 L 160 330"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <rect x="165" y="295" width="90" height="22" rx="3" fill="#1c160c" stroke="rgba(245, 158, 11, 0.4)" />
          <DynamicSchematicText
            value={`R1 (${r1Str})`}
            x="210"
            y="310"
            fill="#FBBF24"
            fontSize="10"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor="#FBBF24"
          />
          <line x1="160" y1="330" x2="135" y2="330" stroke="#94A3B8" strokeWidth="2.5" />
          {/* Ground for R1 */}
          <line x1="135" y1="315" x2="135" y2="345" stroke="#94A3B8" strokeWidth="2.5" />
          <line x1="130" y1="320" x2="130" y2="340" stroke="#94A3B8" strokeWidth="2" />
          <line x1="125" y1="326" x2="125" y2="334" stroke="#94A3B8" strokeWidth="1.5" />

          {/* Wire from Node V+ (300, 330) up to op-amp Non-Inverting (+) pin at (360, 234) */}
          <line x1="300" y1="330" x2="300" y2="234" stroke="#F59E0B" strokeWidth="2.5" />
          <line x1="300" y1="234" x2="360" y2="234" stroke="#F59E0B" strokeWidth="2.5" />

          {/* ===================== DYNAMIC OUTPUT TERMINAL ===================== */}
          <line
            x1="560"
            y1="200"
            x2="650"
            y2="200"
            stroke={outputWireStroke}
            strokeWidth={3}
            style={{ filter: outputWireFilter, transition: 'all 0.25s ease-in-out' }}
          />
          <circle
            cx="650"
            cy="200"
            r="6"
            fill="#0B0F19"
            stroke={outputWireStroke}
            strokeWidth={3}
            style={{ filter: outputWireFilter, transition: 'all 0.25s ease-in-out' }}
          />
          <rect
            x="600"
            y="135"
            width="115"
            height="50"
            rx="3"
            fill="#111520"
            stroke="rgba(0, 240, 255, 0.3)"
            strokeWidth={1.5}
            style={{ transition: 'all 0.25s ease-in-out' }}
          />
          <text x="657" y="152" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
            Vout (Square Wave)
          </text>
          <DynamicSchematicText
            value={`f ≈ ${formatFrequency(frequency)}`}
            x="657"
            y="172"
            fill="#00F0FF"
            fontSize="12"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor="#00F0FF"
          />

          {/* Functional Division Labels */}
          <rect x="20" y="10" width="170" height="24" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.3)" />
          <text x="105" y="26" fill="#00F0FF" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle" fontWeight="bold">
            RC Timing Integrator
          </text>

          <rect x="20" y="348" width="195" height="24" rx="3" fill="#1c160c" stroke="rgba(245, 158, 11, 0.4)" />
          <text x="117" y="364" fill="#F59E0B" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle" fontWeight="bold">
            Schmitt Feedback Divider
          </text>
        </svg>
      </div>
    </div>
  );
};
