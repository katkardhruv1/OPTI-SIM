import React from 'react';
import { formatResistance, formatCapacitance, formatVoltage, cleanFloat, formatFrequency } from '../../utils/formatters';
import { DynamicSchematicText } from './DynamicSchematicText';

interface LowPassFilterSchematicSvgProps {
  vin: number;
  vinUnit: 'V' | 'mV';
  rBase: number;
  cBase: number;
  passbandGain: number;
  fc: number;
  vout?: number;
  posVsat?: number;
  negVsat?: number;
  isClipped?: boolean;
}

export const LowPassFilterSchematicSvg: React.FC<LowPassFilterSchematicSvgProps> = ({
  vin,
  vinUnit,
  rBase,
  cBase,
  passbandGain,
  fc,
  vout,
  posVsat = 15,
  negVsat = -15,
  isClipped,
}) => {
  const vinText = `${vin} ${vinUnit}`;
  const rText = formatResistance(rBase);
  const cText = formatCapacitance(cBase);
  const fcText = formatFrequency(fc);
  const currentVout = vout ?? vin * passbandGain;
  const voutText = formatVoltage(currentVout);

  // Dynamic States
  const isZeroVin = Math.abs(vin) < 1e-5;
  const isSaturated = isClipped ?? (Math.abs(currentVout) >= posVsat - 0.05 || currentVout >= posVsat || currentVout <= negVsat);

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
          <span className="text-slate-300">First-Order Active Low-Pass Filter</span>
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
            <span>R = {rText}</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shadow-[0_0_4px_#F59E0B]"></span>
            <span>C = {cText}</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span>fc ≈ {fcText}</span>
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
            <pattern id="grid-lpf" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.6" fill="rgba(0, 240, 255, 0.08)" />
            </pattern>
            <marker
              id="arrow-lpf-cyan"
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
              id="arrow-lpf-orange"
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
          <rect width="760" height="380" fill="url(#grid-lpf)" />

          {/* ===================== ZERO-STATE DIMMED INPUT REGION ===================== */}
          <g style={{ opacity: isZeroVin ? 0.28 : 1, transition: 'opacity 0.25s ease-in-out' }}>
            {/* Vin terminal probe at (65, 230) */}
            <circle cx="65" cy="230" r="5.5" fill="#0B0F19" stroke="#00F0FF" strokeWidth="2.5" />
            <rect x="20" y="175" width="85" height="42" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.3)" />
            <text x="62" y="192" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
              Vin (Input)
            </text>
            <DynamicSchematicText
              value={vinText}
              x="62"
              y="209"
              fill="#00F0FF"
              fontSize="13"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
              textAnchor="middle"
              defaultColor="#00F0FF"
            />

            {/* Wire: (65, 230) to (140, 230) */}
            <line x1="70" y1="230" x2="140" y2="230" stroke="#00F0FF" strokeWidth="2.5" />
            {!isZeroVin && (
              <line x1="85" y1="230" x2="120" y2="230" stroke="#00F0FF" strokeWidth="2.5" markerEnd="url(#arrow-lpf-cyan)" />
            )}
          </g>

          {/* Resistor R: (140, 230) to (240, 230) */}
          <path
            d="M 140 230 L 152 230 L 158 215 L 170 245 L 182 215 L 194 245 L 206 215 L 218 245 L 224 230 L 240 230"
            fill="none"
            stroke="#00F0FF"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <rect x="150" y="165" width="80" height="24" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.25)" />
          <DynamicSchematicText
            value={`R (${rText})`}
            x="190"
            y="181"
            fill="#00F0FF"
            fontSize="11"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor="#00F0FF"
          />

          {/* Wire from R (240, 230) to Node A (270, 230) */}
          <line x1="240" y1="230" x2="270" y2="230" stroke="#00F0FF" strokeWidth="2.5" />

          {/* Node A junction at (270, 230) */}
          <circle cx="270" cy="230" r="4.5" fill="#00F0FF" />
          <text x="270" y="220" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
            V+ Node
          </text>

          {/* Wire from Node A (270, 230) to non-inverting input (+) at (380, 230) */}
          <line x1="270" y1="230" x2="380" y2="230" stroke="#00F0FF" strokeWidth="2.5" />

          {/* Shunt Capacitor C branch going down from Node A (270, 230) to (270, 310) */}
          <line x1="270" y1="230" x2="270" y2="275" stroke="#F59E0B" strokeWidth="2.5" />

          {/* Capacitor C plates at y=275 and y=283 */}
          <line x1="250" y1="275" x2="290" y2="275" stroke="#F59E0B" strokeWidth="3" />
          <line x1="250" y1="283" x2="290" y2="283" stroke="#F59E0B" strokeWidth="3" />

          {/* Wire below Capacitor to Ground */}
          <line x1="270" y1="283" x2="270" y2="310" stroke="#94A3B8" strokeWidth="2.5" />

          {/* Ground symbol under C */}
          <line x1="255" y1="310" x2="285" y2="310" stroke="#94A3B8" strokeWidth="2.5" />
          <line x1="260" y1="315" x2="280" y2="315" stroke="#94A3B8" strokeWidth="2" />
          <line x1="266" y1="320" x2="274" y2="320" stroke="#94A3B8" strokeWidth="1.5" />

          {/* Capacitor C Label */}
          <rect x="295" y="270" width="85" height="22" rx="3" fill="#1c160c" stroke="rgba(245, 158, 11, 0.4)" />
          <DynamicSchematicText
            value={`C (${cText})`}
            x="337"
            y="285"
            fill="#FBBF24"
            fontSize="10"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor="#FBBF24"
          />

          {/* ===================== OP-AMP TRIANGLE ===================== */}
          {/* Op-amp body: vertices at (380, 140), (380, 260), (480, 200) */}
          <polygon
            points="380,140 380,260 480,200"
            fill="#111520"
            stroke="rgba(0, 240, 255, 0.35)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Inputs markers */}
          <text x="395" y="176" fill="#F87171" fontSize="18" fontWeight="bold" fontFamily="JetBrains Mono">
            −
          </text>
          <text x="395" y="235" fill="#34D399" fontSize="18" fontWeight="bold" fontFamily="JetBrains Mono">
            +
          </text>

          {/* Op-Amp Label */}
          <text x="420" y="204" fill="#64748B" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle" fontWeight="bold">
            Active Filter
          </text>

          {/* ===================== FEEDBACK / PASSBAND GAIN NETWORK ===================== */}
          {/* Inverting input (-) wire from (380, 170) to (340, 170) */}
          <line x1="380" y1="170" x2="340" y2="170" stroke="#94A3B8" strokeWidth="2.5" />
          <circle cx="340" cy="170" r="4" fill="#94A3B8" />

          {/* Branch 1: to y=100 */}
          <line x1="340" y1="170" x2="340" y2="100" stroke="#94A3B8" strokeWidth="2" />
          <line x1="340" y1="100" x2="370" y2="100" stroke="#94A3B8" strokeWidth="2" />

          {/* Feedback loop from output (480, 200) to (530, 200) */}
          <line x1="480" y1="200" x2="530" y2="200" stroke={outputWireStroke} strokeWidth="2.5" />
          <circle cx="530" cy="200" r="4.5" fill={outputWireStroke} />

          {/* Branch up from (530, 200) to (530, 100) */}
          <line x1="530" y1="200" x2="530" y2="100" stroke="#94A3B8" strokeWidth="2" />
          <line x1="530" y1="100" x2="470" y2="100" stroke="#94A3B8" strokeWidth="2" />

          {/* Feedback Resistor Rf (or unity buffer line if passbandGain = 1) */}
          {passbandGain > 1 ? (
            <>
              {/* Feedback Resistor Rf: (470, 100) to (370, 100) */}
              <path
                d="M 470 100 L 455 100 L 447 90 L 435 110 L 423 90 L 411 110 L 399 90 L 387 110 L 382 100 L 370 100"
                fill="none"
                stroke="#A855F7"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <text x="420" y="80" fill="#C084FC" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono" textAnchor="middle">
                Rf (Gain: {cleanFloat(passbandGain, 1)}×)
              </text>
            </>
          ) : (
            <>
              <line x1="530" y1="100" x2="340" y2="100" stroke="#00F0FF" strokeWidth="2" />
              <text x="435" y="88" fill="#00F0FF" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
                Unity Gain Buffer Loop (A = 1)
              </text>
            </>
          )}

          {/* ===================== DYNAMIC OP-AMP OUTPUT PATH ===================== */}
          {/* Wire: (530, 200) to (660, 200) */}
          <line
            x1="530"
            y1="200"
            x2="660"
            y2="200"
            stroke={outputWireStroke}
            strokeWidth={isSaturated ? 3.5 : 2.5}
            style={{ filter: outputWireFilter, transition: 'all 0.25s ease-in-out' }}
          />
          {!isZeroVin && (
            <line
              x1="560"
              y1="200"
              x2="620"
              y2="200"
              stroke={outputWireStroke}
              strokeWidth="2.5"
              markerEnd={isSaturated ? 'url(#arrow-lpf-orange)' : 'url(#arrow-lpf-cyan)'}
            />
          )}

          {/* Vout Probe terminal at (660, 200) */}
          <circle
            cx="660"
            cy="200"
            r="5.5"
            fill="#0B0F19"
            stroke={outputWireStroke}
            strokeWidth="2.5"
            style={{ filter: outputWireFilter, transition: 'all 0.25s ease-in-out' }}
          />
          <rect
            x="615"
            y="145"
            width="105"
            height="46"
            rx="3"
            fill={isSaturated ? '#1f110c' : '#111520'}
            stroke={isSaturated ? '#FF5722' : 'rgba(0, 240, 255, 0.3)'}
            strokeWidth={isSaturated ? 1.5 : 1}
            style={{ transition: 'all 0.25s ease-in-out' }}
          />
          <text
            x="667"
            y="160"
            fill={isSaturated ? '#FF5722' : '#94A3B8'}
            fontSize="10"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            fontWeight={isSaturated ? 'bold' : 'normal'}
          >
            {isSaturated ? 'Vout (SAT ±Vsat)' : 'Vout (Filtered)'}
          </text>
          <DynamicSchematicText
            value={voutText}
            x="667"
            y="178"
            fill={isSaturated ? '#FF5722' : '#00F0FF'}
            fontSize="13"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor={isSaturated ? '#FF5722' : '#00F0FF'}
          />

          {/* Formula summary badge at bottom left */}
          <rect x="20" y="325" width="220" height="32" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.2)" />
          <DynamicSchematicText
            value={`fc = 1 / (2πRC) = ${fcText}`}
            x="130"
            y="345"
            fill="#94A3B8"
            fontSize="10.5"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            defaultColor="#94A3B8"
          />

          {/* Roll-off rate badge at bottom right */}
          <rect x="520" y="325" width="200" height="32" rx="3" fill="#111520" stroke="rgba(0, 240, 255, 0.2)" />
          <text x="620" y="345" fill="#00F0FF" fontSize="11" fontFamily="JetBrains Mono" textAnchor="middle">
            Roll-off: -20 dB / decade
          </text>
        </svg>
      </div>
    </div>
  );
};

