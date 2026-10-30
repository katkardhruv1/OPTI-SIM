import React from 'react';
import { cleanFloat } from '../../utils/formatters';
import { Activity, BarChart2 } from 'lucide-react';

interface SchmittTransferGraphProps {
  utp: number;
  ltp: number;
  posVsat: number;
  negVsat: number;
  hysteresisWidth: number;
  currentVin?: number;
  currentVout?: number;
}

export const SchmittTransferGraph: React.FC<SchmittTransferGraphProps> = ({
  utp,
  ltp,
  posVsat,
  negVsat,
  hysteresisWidth,
  currentVin,
  currentVout,
}) => {
  const svgWidth = 640;
  const svgHeight = 320;
  const padding = { top: 35, right: 35, bottom: 45, left: 65 };

  const plotW = svgWidth - padding.left - padding.right;
  const plotH = svgHeight - padding.top - padding.bottom;

  // X Range: span around LTP and UTP
  const maxAbsThreshold = Math.max(Math.abs(utp), Math.abs(ltp), 4);
  const minVin = -(maxAbsThreshold + 3);
  const maxVin = maxAbsThreshold + 3;

  // Y Range: span around sat rails
  const maxVout = Math.max(posVsat + 4, 16);
  const minVout = Math.min(negVsat - 4, -16);

  const getX = (vin: number) => {
    return padding.left + ((vin - minVin) / (maxVin - minVin || 1)) * plotW;
  };

  const getY = (vout: number) => {
    return padding.top + plotH - ((vout - minVout) / (maxVout - minVout || 1)) * plotH;
  };

  const zeroX = getX(0);
  const zeroY = getY(0);
  const utpX = getX(utp);
  const ltpX = getX(ltp);
  const posSatY = getY(posVsat);
  const negSatY = getY(negVsat);

  // Increasing Vin path (Cyan):
  // (minVin, negVsat) -> (utp, negVsat) -> (utp, posVsat) -> (maxVin, posVsat)
  const risingPathD = `M ${getX(minVin)} ${negSatY} L ${utpX} ${negSatY} L ${utpX} ${posSatY} L ${getX(maxVin)} ${posSatY}`;

  // Decreasing Vin path (Amber/Rose):
  // (maxVin, posVsat) -> (ltp, posVsat) -> (ltp, negVsat) -> (minVin, negVsat)
  const fallingPathD = `M ${getX(maxVin)} ${posSatY} L ${ltpX} ${posSatY} L ${ltpX} ${negSatY} L ${getX(minVin)} ${negSatY}`;

  // Operating point
  const hasCurrentPt = currentVin !== undefined && currentVout !== undefined;
  const currX = hasCurrentPt ? getX(currentVin!) : 0;
  const currY = hasCurrentPt ? getY(currentVout!) : 0;

  return (
    <div className="flex flex-col h-full w-full rounded-[4px] border border-white/10 bg-[#1A1E29] p-3 sm:p-4 text-xs font-mono shadow-md space-y-3">
      {/* Header controls & legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-[#00F0FF]" />
          <span className="font-mono text-[#00F0FF] font-bold uppercase tracking-wider">
            Hysteresis Transfer Loop
          </span>
          <span className="text-white/20">/</span>
          <span className="text-slate-400 font-mono text-[11px]">
            VH = {cleanFloat(hysteresisWidth, 2)} V (Noise Margin)
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-[#00F0FF]">
            <span className="w-3.5 h-1 rounded-full bg-[#00F0FF] inline-block shadow-[0_0_6px_rgba(0,240,255,0.8)]"></span>
            <span className="font-semibold">Rising Vin (→ UTP)</span>
          </span>
          <span className="flex items-center gap-1.5 text-[#FF5722]">
            <span className="w-3.5 h-1 rounded-full bg-[#FF5722] inline-block shadow-[0_0_6px_rgba(255,87,34,0.8)]"></span>
            <span className="font-semibold">Falling Vin (← LTP)</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full border border-amber-400 bg-amber-400/30 inline-block"></span>
            <span>Trigger Points</span>
          </span>
        </div>
      </div>

      {/* SVG Plot */}
      <div className="relative flex-1 w-full flex items-center justify-center min-h-[260px] rounded-[3px] border border-white/10 bg-[#0B0F19] overflow-hidden py-0.5">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="schmitt-dpo-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.6" fill="rgba(0, 240, 255, 0.08)" />
            </pattern>
          </defs>

          {/* Plot Background */}
          <rect
            x={padding.left}
            y={padding.top}
            width={plotW}
            height={plotH}
            fill="#0B0F19"
            stroke="rgba(0, 240, 255, 0.15)"
            strokeWidth="1.2"
            rx="2"
          />
          <rect
            x={padding.left}
            y={padding.top}
            width={plotW}
            height={plotH}
            fill="url(#schmitt-dpo-grid)"
            opacity="0.85"
          />

          {/* Hysteresis band shaded region */}
          <rect
            x={ltpX}
            y={posSatY}
            width={Math.max(utpX - ltpX, 2)}
            height={negSatY - posSatY}
            fill="#0284c7"
            fillOpacity="0.08"
            stroke="#0284c7"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Zero X Axis (Vin = 0) */}
          {zeroX >= padding.left && zeroX <= padding.left + plotW && (
            <line
              x1={zeroX}
              y1={padding.top}
              x2={zeroX}
              y2={padding.top + plotH}
              stroke="#334155"
              strokeWidth="1"
            />
          )}

          {/* Zero Y Axis (Vout = 0) */}
          {zeroY >= padding.top && zeroY <= padding.top + plotH && (
            <line
              x1={padding.left}
              y1={zeroY}
              x2={padding.left + plotW}
              y2={zeroY}
              stroke="#334155"
              strokeWidth="1"
            />
          )}

          {/* +Vsat Horizontal Reference */}
          <line
            x1={padding.left}
            y1={posSatY}
            x2={padding.left + plotW}
            y2={posSatY}
            stroke="#10b981"
            strokeDasharray="4 3"
            strokeWidth="1.2"
            opacity="0.7"
          />
          <text
            x={padding.left - 8}
            y={posSatY + 4}
            fill="#10b981"
            fontSize="10"
            fontFamily="JetBrains Mono"
            textAnchor="end"
            fontWeight="bold"
          >
            +Vsat ({posVsat > 0 ? `+${posVsat}` : posVsat}V)
          </text>

          {/* -Vsat Horizontal Reference */}
          <line
            x1={padding.left}
            y1={negSatY}
            x2={padding.left + plotW}
            y2={negSatY}
            stroke="#f43f5e"
            strokeDasharray="4 3"
            strokeWidth="1.2"
            opacity="0.7"
          />
          <text
            x={padding.left - 8}
            y={negSatY + 4}
            fill="#f43f5e"
            fontSize="10"
            fontFamily="JetBrains Mono"
            textAnchor="end"
            fontWeight="bold"
          >
            -Vsat ({negVsat}V)
          </text>

          {/* LTP Threshold Vertical Line */}
          <line
            x1={ltpX}
            y1={padding.top}
            x2={ltpX}
            y2={padding.top + plotH}
            stroke="#fb7185"
            strokeDasharray="3 3"
            strokeWidth="1.5"
          />
          <circle cx={ltpX} cy={posSatY} r="4" fill="#fb7185" />
          <circle cx={ltpX} cy={negSatY} r="4" fill="#fb7185" />
          <rect
            x={ltpX - 35}
            y={padding.top + plotH + 8}
            width="70"
            height="18"
            rx="3"
            fill="#270c14"
            stroke="#9f1239"
          />
          <text
            x={ltpX}
            y={padding.top + plotH + 20}
            fill="#fda4af"
            fontSize="9"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            fontWeight="bold"
          >
            LTP={cleanFloat(ltp, 1)}V
          </text>

          {/* UTP Threshold Vertical Line */}
          <line
            x1={utpX}
            y1={padding.top}
            x2={utpX}
            y2={padding.top + plotH}
            stroke="#38bdf8"
            strokeDasharray="3 3"
            strokeWidth="1.5"
          />
          <circle cx={utpX} cy={negSatY} r="4" fill="#38bdf8" />
          <circle cx={utpX} cy={posSatY} r="4" fill="#38bdf8" />
          <rect
            x={utpX - 35}
            y={padding.top + plotH + 8}
            width="70"
            height="18"
            rx="3"
            fill="#082136"
            stroke="#0284c7"
          />
          <text
            x={utpX}
            y={padding.top + plotH + 20}
            fill="#7dd3fc"
            fontSize="9"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            fontWeight="bold"
          >
            UTP={cleanFloat(utp, 1)}V
          </text>

          {/* Falling Path (Neon Orange with Glow) */}
          <path
            d={fallingPathD}
            fill="none"
            stroke="#FF5722"
            strokeWidth="5"
            strokeOpacity="0.25"
            strokeDasharray="4 2"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 6px rgba(255, 87, 34, 0.75))' }}
          />
          <path
            d={fallingPathD}
            fill="none"
            stroke="#FF5722"
            strokeWidth="2.4"
            strokeDasharray="4 2"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 2px #FF5722)' }}
          />

          {/* Rising Path (Neon Cyan with Glow) */}
          <path
            d={risingPathD}
            fill="none"
            stroke="#00F0FF"
            strokeWidth="6"
            strokeOpacity="0.25"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 6px rgba(0, 240, 255, 0.75))' }}
          />
          <path
            d={risingPathD}
            fill="none"
            stroke="#00F0FF"
            strokeWidth="2.5"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 2px #00F0FF)' }}
          />

          {/* Directional Arrows for Rising Path (Moving right at -Vsat and up at UTP) */}
          <polygon
            points={`${(getX(minVin) + utpX) / 2},${negSatY - 4} ${(getX(minVin) + utpX) / 2 + 8},${negSatY} ${(getX(minVin) + utpX) / 2},${negSatY + 4}`}
            fill="#00F0FF"
          />
          <polygon
            points={`${utpX - 4},${(posSatY + negSatY) / 2} ${utpX},${(posSatY + negSatY) / 2 - 8} ${utpX + 4},${(posSatY + negSatY) / 2}`}
            fill="#00F0FF"
          />

          {/* Directional Arrows for Falling Path (Moving left at +Vsat and down at LTP) */}
          <polygon
            points={`${(getX(maxVin) + ltpX) / 2},${posSatY - 4} ${(getX(maxVin) + ltpX) / 2 - 8},${posSatY} ${(getX(maxVin) + ltpX) / 2},${posSatY + 4}`}
            fill="#FF5722"
          />
          <polygon
            points={`${ltpX - 4},${(posSatY + negSatY) / 2} ${ltpX},${(posSatY + negSatY) / 2 + 8} ${ltpX + 4},${(posSatY + negSatY) / 2}`}
            fill="#FF5722"
          />

          {/* Hysteresis Width Dimension Indicator at center */}
          <g transform={`translate(0, ${zeroY - 10})`}>
            <line x1={ltpX} y1="0" x2={utpX} y2="0" stroke="#f59e0b" strokeWidth="1.5" />
            <line x1={ltpX} y1="-5" x2={ltpX} y2="5" stroke="#f59e0b" strokeWidth="1.5" />
            <line x1={utpX} y1="-5" x2={utpX} y2="5" stroke="#f59e0b" strokeWidth="1.5" />
            <rect
              x={(ltpX + utpX) / 2 - 32}
              y="-18"
              width="64"
              height="16"
              rx="3"
              fill="#181305"
              stroke="#b45309"
            />
            <text
              x={(ltpX + utpX) / 2}
              y="-6"
              fill="#fbbf24"
              fontSize="9"
              fontFamily="JetBrains Mono"
              textAnchor="middle"
              fontWeight="bold"
            >
              VH = {cleanFloat(hysteresisWidth, 1)}V
            </text>
          </g>

          {/* Current Operating Point Marker */}
          {hasCurrentPt && currX >= padding.left && currX <= padding.left + plotW && (
            <g>
              <line
                x1={currX}
                y1={padding.top}
                x2={currX}
                y2={padding.top + plotH}
                stroke="#10b981"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <circle
                cx={currX}
                cy={currY}
                r="6"
                fill="#10b981"
                stroke="#070b13"
                strokeWidth="2.5"
              />
              {/* Value badge */}
              <g transform={`translate(${Math.min(currX + 8, padding.left + plotW - 130)}, ${Math.max(currY - 26, padding.top + 8)})`}>
                <rect width="125" height="22" rx="4" fill="#062218" stroke="#059669" />
                <text x="6" y="15" fill="#a7f3d0" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
                  Vin={cleanFloat(currentVin!, 2)}V → Vout={cleanFloat(currentVout!, 1)}V
                </text>
              </g>
            </g>
          )}

          {/* Axis Labels */}
          <text
            x={padding.left + plotW}
            y={zeroY - 8}
            fill="#94a3b8"
            fontSize="10"
            fontFamily="JetBrains Mono"
            textAnchor="end"
          >
            Vin (Input) →
          </text>
          <text
            x={padding.left + 10}
            y={padding.top + 15}
            fill="#94a3b8"
            fontSize="10"
            fontFamily="JetBrains Mono"
          >
            ↑ Vout
          </text>
        </svg>
      </div>

      {/* Footer Info */}
      <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
        <div>
          Trigger Points: <span className="text-cyan-400 font-semibold">UTP = +{cleanFloat(utp, 2)}V</span> | <span className="text-rose-400 font-semibold">LTP = {cleanFloat(ltp, 2)}V</span>
        </div>
        <div>
          Noise Band: <span className="text-amber-400 font-semibold">VH = {cleanFloat(hysteresisWidth, 2)} V</span>
        </div>
        <div>
          Rails: <span className="text-emerald-400 font-semibold">+{posVsat}V</span> / <span className="text-rose-400 font-semibold">{negVsat}V</span>
        </div>
      </div>
    </div>
  );
};
