import React from 'react';
import { ComparatorType } from '../../types/circuit';
import { cleanFloat } from '../../utils/formatters';
import { Activity, BarChart2 } from 'lucide-react';

interface ComparatorTransferGraphProps {
  vref: number;
  posVsat: number;
  negVsat: number;
  comparatorType: ComparatorType;
  currentVin?: number;
  currentVout?: number;
}

export const ComparatorTransferGraph: React.FC<ComparatorTransferGraphProps> = ({
  vref,
  posVsat,
  negVsat,
  comparatorType,
  currentVin,
  currentVout,
}) => {
  const svgWidth = 640;
  const svgHeight = 320;
  const padding = { top: 35, right: 35, bottom: 45, left: 65 };

  const plotW = svgWidth - padding.left - padding.right;
  const plotH = svgHeight - padding.top - padding.bottom;

  // X Range: span around Vref
  const xSpan = Math.max(Math.abs(vref) * 2, 6);
  const minVin = vref - xSpan;
  const maxVin = vref + xSpan;

  // Y Range: span around sat rails
  const maxVout = Math.max(posVsat + 4, 18);
  const minVout = Math.min(negVsat - 4, -18);

  const getX = (vin: number) => {
    return padding.left + ((vin - minVin) / (maxVin - minVin || 1)) * plotW;
  };

  const getY = (vout: number) => {
    return padding.top + plotH - ((vout - minVout) / (maxVout - minVout || 1)) * plotH;
  };

  const zeroX = getX(0);
  const zeroY = getY(0);
  const vrefX = getX(vref);
  const posSatY = getY(posVsat);
  const negSatY = getY(negVsat);

  // Path coordinates
  let pathD = '';
  if (comparatorType === 'non-inverting') {
    // Below Vref -> negVsat; jump at Vref -> posVsat
    pathD = `M ${getX(minVin)} ${negSatY} L ${vrefX} ${negSatY} L ${vrefX} ${posSatY} L ${getX(maxVin)} ${posSatY}`;
  } else {
    // Inverting: below Vref -> posVsat; jump at Vref -> negVsat
    pathD = `M ${getX(minVin)} ${posSatY} L ${vrefX} ${posSatY} L ${vrefX} ${negSatY} L ${getX(maxVin)} ${negSatY}`;
  }

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
            Transfer Characteristic (VTC)
          </span>
          <span className="text-white/20">/</span>
          <span className="text-slate-400 font-mono text-[11px]">
            {comparatorType === 'non-inverting' ? 'Non-Inverting' : 'Inverting'} (Vout vs Vin)
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-[#00F0FF]">
            <span className="w-3.5 h-1 rounded-full bg-[#00F0FF] inline-block shadow-[0_0_6px_rgba(0,240,255,0.8)]"></span>
            <span className="font-semibold">VTC Curve</span>
          </span>
          <span className="flex items-center gap-1.5 text-[#FF5722]">
            <span className="w-2.5 h-2.5 rounded-full border border-[#FF5722] bg-[#FF5722]/30 inline-block"></span>
            <span>Vref ({cleanFloat(vref, 2)} V)</span>
          </span>
          {hasCurrentPt && (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
              <span>Operating Point</span>
            </span>
          )}
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
            <pattern id="comp-dpo-grid" width="20" height="20" patternUnits="userSpaceOnUse">
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
            fill="url(#comp-dpo-grid)"
            opacity="0.85"
          />

          {/* Grid lines */}
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
            opacity="0.8"
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
            opacity="0.8"
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

          {/* Vref Vertical Threshold Line */}
          {vrefX >= padding.left && vrefX <= padding.left + plotW && (
            <g>
              <line
                x1={vrefX}
                y1={padding.top}
                x2={vrefX}
                y2={padding.top + plotH}
                stroke="#f59e0b"
                strokeDasharray="4 2"
                strokeWidth="1.5"
              />
              <circle cx={vrefX} cy={zeroY} r="4" fill="#f59e0b" />
              <rect
                x={vrefX - 35}
                y={padding.top + plotH + 8}
                width="70"
                height="18"
                rx="3"
                fill="#1e1805"
                stroke="#b45309"
              />
              <text
                x={vrefX}
                y={padding.top + plotH + 20}
                fill="#fbbf24"
                fontSize="9.5"
                fontFamily="JetBrains Mono"
                textAnchor="middle"
                fontWeight="bold"
              >
                Vref = {cleanFloat(vref, 2)}V
              </text>
            </g>
          )}

          {/* Transfer Characteristic Curve with Glowing Neon Cyan Phosphor Trace */}
          <path
            d={pathD}
            fill="none"
            stroke="#00F0FF"
            strokeWidth="6"
            strokeOpacity="0.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 6px rgba(0, 240, 255, 0.75))' }}
          />
          <path
            d={pathD}
            fill="none"
            stroke="#00F0FF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 2px #00F0FF)' }}
          />
          <path
            d={pathD}
            fill="none"
            stroke="#E0F7FA"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
          />

          {/* Arrow markers indicating steep transition */}
          {comparatorType === 'non-inverting' ? (
            <path
              d={`M ${vrefX - 4} ${(posSatY + negSatY) / 2 + 5} L ${vrefX} ${(posSatY + negSatY) / 2 - 5} L ${vrefX + 4} ${(posSatY + negSatY) / 2 + 5}`}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
            />
          ) : (
            <path
              d={`M ${vrefX - 4} ${(posSatY + negSatY) / 2 - 5} L ${vrefX} ${(posSatY + negSatY) / 2 + 5} L ${vrefX + 4} ${(posSatY + negSatY) / 2 - 5}`}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
            />
          )}

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
          Switching Threshold: <span className="text-amber-400 font-semibold">{cleanFloat(vref, 2)} V</span>
        </div>
        <div>
          Saturation Rails: <span className="text-emerald-400 font-semibold">+{posVsat}V</span> / <span className="text-rose-400 font-semibold">{negVsat}V</span>
        </div>
        <div>
          Mode: <span className="text-cyan-400 font-semibold">{comparatorType === 'non-inverting' ? 'Non-Inverting' : 'Inverting'}</span>
        </div>
      </div>
    </div>
  );
};
