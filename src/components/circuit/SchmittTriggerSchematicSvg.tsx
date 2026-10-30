import React from 'react';
import { formatResistance, cleanFloat } from '../../utils/formatters';
import { DynamicSchematicText } from './DynamicSchematicText';

interface SchmittTriggerSchematicSvgProps {
  vinAmp: number;
  vinUnit: 'V' | 'mV';
  r1Base: number;
  rfBase: number;
  posVsat: number;
  negVsat: number;
  utp: number;
  ltp: number;
  beta: number;
}

export const SchmittTriggerSchematicSvg: React.FC<SchmittTriggerSchematicSvgProps> = ({
  vinAmp,
  vinUnit,
  r1Base,
  rfBase,
  posVsat,
  negVsat,
  utp,
  ltp,
  beta,
}) => {
  const vinText = `${vinAmp} ${vinUnit}`;
  const r1Text = formatResistance(r1Base);
  const rfText = formatResistance(rfBase);
  const isZeroVin = Math.abs(vinAmp) < 1e-5;

  const outputWireStroke = '#00F0FF';
  const outputWireFilter = 'drop-shadow(0 0 5px rgba(0, 240, 255, 0.75))';

  return (
    <div className="relative w-full overflow-hidden rounded-[4px] border border-white/10 bg-[#0B0F19] p-2 sm:p-4 shadow-md font-mono">
      {/* Top Schematic Status Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-2.5 mb-2 text-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[#00F0FF] font-bold">SCHEMATIC</span>
          <span className="text-white/20">/</span>
          <span className="text-slate-300">Non-Inverting Schmitt Trigger (Regenerative Comparator)</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="px-2 py-0.5 rounded-[2px] bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] font-bold flex items-center gap-1">
            <span>⚡</span> BISTABLE (±{posVsat}V)
          </span>
          {isZeroVin && (
            <span className="px-2 py-0.5 rounded-[2px] bg-[#111520] border border-white/10 text-slate-400">
              INACTIVE (Vin = 0V)
            </span>
          )}
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF] inline-block shadow-[0_0_4px_#00F0FF]"></span>
            <span>R1 = {r1Text}</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shadow-[0_0_4px_#F59E0B]"></span>
            <span>Rf = {rfText}</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span>β = {cleanFloat(beta, 3)}</span>
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
            <pattern id="grid-schmitt" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.6" fill="rgba(0, 240, 255, 0.08)" />
            </pattern>
            <marker
              id="arrow-schmitt-cyan"
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
          <rect width="760" height="380" fill="url(#grid-schmitt)" />

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

          {/* Op-Amp Label */}
          <text x="410" y="204" fill="#64748B" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle" fontWeight="bold">
            Regenerative
          </text>

          {/* Inverting Input (-) connected to Ground */}
          <line x1="360" y1="168" x2="310" y2="168" stroke="#94A3B8" strokeWidth="2.5" />
          <line x1="310" y1="168" x2="310" y2="195" stroke="#94A3B8" strokeWidth="2.5" />
          {/* Ground symbol */}
          <line x1="295" y1="195" x2="325" y2="195" stroke="#94A3B8" strokeWidth="2.5" />
          <line x1="300" y1="200" x2="320" y2="200" stroke="#94A3B8" strokeWidth="2" />
          <line x1="306" y1="205" x2="314" y2="205" stroke="#94A3B8" strokeWidth="1.5" />
          <text x="335" y="198" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono">
            GND (0 V)
          </text>

          {/* ===================== SATURATION RAILS ===================== */}
          {/* +Vsat */}
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

          {/* -Vsat */}
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

          {/* ===================== ZERO-STATE DIMMED INPUT PATH & R1 ===================== */}
          <g style={{ opacity: isZeroVin ? 0.28 : 1, transition: 'opacity 0.25s ease-in-out' }}>
            {/* Vin terminal probe at (65, 234) */}
            <circle cx="65" cy="234" r="5.5" fill="#0B0F19" stroke="#00F0FF" strokeWidth="2.5" />
            <rect x="20" y="213" width="85" height="42" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.3)" />
            <text x="62" y="230" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
              Vin (Input)
            </text>
            <DynamicSchematicText
              value={`±${vinText}`}
              x="62"
              y="247"
              fill="#00F0FF"
              fontSize="12"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
              textAnchor="middle"
              defaultColor="#00F0FF"
            />

            {/* Wire: (70, 234) to (140, 234) */}
            <line x1="70" y1="234" x2="140" y2="234" stroke="#00F0FF" strokeWidth="2.5" />
            {!isZeroVin && (
              <line x1="85" y1="234" x2="125" y2="234" stroke="#00F0FF" strokeWidth="2.5" markerEnd="url(#arrow-schmitt-cyan)" />
            )}
          </g>

          {/* Resistor R1: (140, 234) to (240, 234) */}
          <path
            d="M 140 234 L 152 234 L 158 219 L 170 249 L 182 219 L 194 249 L 206 219 L 218 249 L 224 234 L 240 234"
            fill="none"
            stroke="#00F0FF"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <rect x="150" y="195" width="80" height="22" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.25)" />
          <DynamicSchematicText
            value={`R1 (${r1Text})`}
            x="190"
            y="210"
            fill="#00F0FF"
            fontSize="10"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor="#00F0FF"
          />

          {/* Wire to Node (+) at (290, 234) */}
          <line x1="240" y1="234" x2="290" y2="234" stroke="#00F0FF" strokeWidth="2.5" />
          <circle cx="290" cy="234" r="4.5" fill="#00F0FF" />
          <text x="290" y="254" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
            V+ Node
          </text>

          {/* Wire from Node (290, 234) to op-amp (+) terminal (360, 234) */}
          <line x1="290" y1="234" x2="360" y2="234" stroke="#00F0FF" strokeWidth="2.5" />

          {/* ===================== POSITIVE FEEDBACK LOOP (Vout to Node + via Rf) ===================== */}
          {/* Branch up from Node (+) (290, 234) to (290, 100) */}
          <line x1="290" y1="234" x2="290" y2="100" stroke="#F59E0B" strokeWidth="2.5" />
          <line x1="290" y1="100" x2="350" y2="100" stroke="#F59E0B" strokeWidth="2.5" />

          {/* Feedback Resistor Rf: (350, 100) to (450, 100) */}
          <path
            d="M 350 100 L 362 100 L 368 85 L 380 115 L 392 85 L 404 115 L 416 85 L 428 115 L 434 100 L 450 100"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <rect x="350" y="60" width="100" height="22" rx="3" fill="#1c160c" stroke="rgba(245, 158, 11, 0.4)" />
          <DynamicSchematicText
            value={`Rf (${rfText})`}
            x="400"
            y="75"
            fill="#FBBF24"
            fontSize="10"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor="#FBBF24"
          />

          {/* Wire from Rf (450, 100) to output tap line at (520, 100) */}
          <line x1="450" y1="100" x2="520" y2="100" stroke="#F59E0B" strokeWidth="2.5" />
          <line x1="520" y1="100" x2="520" y2="200" stroke="#F59E0B" strokeWidth="2.5" />
          <circle cx="520" cy="200" r="4.5" fill="#F59E0B" />

          {/* ===================== DYNAMIC OUTPUT PATH ===================== */}
          {/* Wire from op-amp output (470, 200) to (640, 200) */}
          <line
            x1="470"
            y1="200"
            x2="640"
            y2="200"
            stroke={outputWireStroke}
            strokeWidth={3}
            style={{ filter: outputWireFilter, transition: 'all 0.25s ease-in-out' }}
          />
          <line
            x1="530"
            y1="200"
            x2="590"
            y2="200"
            stroke={outputWireStroke}
            strokeWidth="2.5"
            markerEnd="url(#arrow-schmitt-cyan)"
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
            fill="#111520"
            stroke="rgba(0, 240, 255, 0.3)"
            strokeWidth={1.5}
            style={{ transition: 'all 0.25s ease-in-out' }}
          />
          <text
            x="647"
            y="152"
            fill="#94A3B8"
            fontSize="10"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
          >
            Vout (Bistable)
          </text>
          <DynamicSchematicText
            value={`±${posVsat} V`}
            x="647"
            y="172"
            fill={outputWireStroke}
            fontSize="13"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor={outputWireStroke}
          />

          {/* Trigger Points Annotation Box at Bottom */}
          <rect x="30" y="322" width="310" height="38" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.2)" />
          <DynamicSchematicText
            value={`UTP = +${cleanFloat(utp, 2)} V  |  LTP = ${cleanFloat(ltp, 2)} V`}
            x="45"
            y="338"
            fill="#00F0FF"
            fontSize="10.5"
            fontFamily="JetBrains Mono"
            fontWeight="bold"
            defaultColor="#00F0FF"
          />
          <text x="45" y="351" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono">
            β = R1 / (R1 + Rf) = {cleanFloat(beta, 4)} &nbsp;|&nbsp; Hysteresis VH = {cleanFloat(utp - ltp, 2)} V
          </text>
        </svg>
      </div>
    </div>
  );
};
