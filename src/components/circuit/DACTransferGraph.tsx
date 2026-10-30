import React, { useState } from 'react';
import { DACResolution } from '../../types/circuit';
import { cleanFloat } from '../../utils/formatters';
import { Activity, BarChart2 } from 'lucide-react';

interface DACTransferGraphProps {
  resolution: DACResolution;
  vref: number;
  currentCode: number;
  currentVout: number;
  maxCode: number;
  lsbSize: number;
  onSelectCode?: (code: number) => void;
}

export const DACTransferGraph: React.FC<DACTransferGraphProps> = ({
  resolution,
  vref,
  currentCode,
  currentVout,
  maxCode,
  lsbSize,
  onSelectCode,
}) => {
  const [hoverCode, setHoverCode] = useState<number | null>(null);

  // SVG dimensions
  const svgWidth = 640;
  const svgHeight = 360;
  const margin = { top: 35, right: 35, bottom: 50, left: 65 };
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = svgHeight - margin.top - margin.bottom;

  // Scale mappings:
  // X: 0 to maxCode
  // Y: 0 to vref
  const xScale = (code: number) => margin.left + (code / Math.max(1, maxCode)) * plotWidth;
  const yScale = (v: number) => margin.top + plotHeight - (v / Math.max(0.1, vref)) * plotHeight;

  // Generate staircase path
  // For each code D from 0 to maxCode:
  // step from (D, Vout(D)) to (D+1, Vout(D)) then vertical to (D+1, Vout(D+1))
  let staircasePath = '';
  const numSteps = Math.min(maxCode, 64); // for 8/10-bit smooth rendering
  const stepStride = Math.max(1, Math.floor(maxCode / numSteps));

  for (let c = 0; c <= maxCode; c += stepStride) {
    const v = (c / maxCode) * vref;
    const x1 = xScale(c);
    const y1 = yScale(v);
    const nextC = Math.min(maxCode, c + stepStride);
    const nextV = (nextC / maxCode) * vref;
    const x2 = xScale(nextC);
    const y2 = yScale(nextV);

    if (c === 0) {
      staircasePath += `M ${x1} ${y1}`;
    }
    staircasePath += ` H ${x2} V ${y2}`;
  }

  // Active point coordinates
  const activeX = xScale(currentCode);
  const activeY = yScale(currentVout);

  // Hovered point coordinates
  const hoveredCodeVal = hoverCode !== null ? hoverCode : currentCode;
  const hoveredVoutVal = (hoveredCodeVal / Math.max(1, maxCode)) * vref;
  const hoverX = xScale(hoveredCodeVal);
  const hoverY = yScale(hoveredVoutVal);

  // Grid tick marks
  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => (vref / yTicks) * i);

  // X ticks: for 4-bit, every 1 or 2 codes; for 8/10-bit, 4 to 8 divisions
  const xTickSteps = resolution === 4 ? 8 : 8;
  const xTickValues = Array.from({ length: xTickSteps + 1 }, (_, i) =>
    Math.round((maxCode / xTickSteps) * i)
  );

  return (
    <div className="w-full bg-[#1A1E29] rounded-[4px] border border-white/10 p-4 flex flex-col shadow-md space-y-3 font-mono text-xs">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between pb-2.5 border-b border-white/10 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-[3px] bg-[#00F0FF]/10 border border-[#00F0FF]/25 text-[#00F0FF]">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-200 tracking-wider uppercase">
              DAC Transfer Characteristic (Staircase)
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">
              Ideal {resolution}-bit Digital Input Code vs Analog Output Voltage
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[#0B0F19] border border-white/10 text-slate-300">
            <span className="text-slate-400">LSB:</span>
            <span className="text-[#00F0FF] font-semibold">{cleanFloat(lsbSize, 4)} V</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[#0B0F19] border border-[#00F0FF]/30 text-white">
            <span className="text-slate-400">Active Code:</span>
            <span className="font-bold">{currentCode} ({currentCode.toString(2).padStart(resolution, '0')}₂)</span>
            <span className="text-[#FF5722] font-bold ml-1">→ {cleanFloat(currentVout, 3)} V</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-x-auto flex justify-center py-1 rounded-[3px] border border-white/10 bg-[#0B0F19]">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-[680px] h-auto select-none"
          style={{ minWidth: '400px', backgroundColor: '#0B0F19' }}
        >
          <defs>
            <pattern id="dac-dpo-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.6" fill="rgba(0, 240, 255, 0.08)" />
            </pattern>
            <linearGradient id="dacStairFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Plot Background */}
          <rect
            x={margin.left}
            y={margin.top}
            width={plotWidth}
            height={plotHeight}
            fill="#0B0F19"
            stroke="rgba(0, 240, 255, 0.15)"
            strokeWidth="1.2"
            rx="2"
          />
          <rect
            x={margin.left}
            y={margin.top}
            width={plotWidth}
            height={plotHeight}
            fill="url(#dac-dpo-grid)"
            opacity="0.85"
          />

          {/* Y Gridlines and Labels */}
          {yTickValues.map((v, i) => {
            const y = yScale(v);
            return (
              <g key={`y-${i}`}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={margin.left + plotWidth}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={margin.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {cleanFloat(v, 2)} V
                </text>
              </g>
            );
          })}

          {/* X Gridlines and Labels */}
          {xTickValues.map((c, i) => {
            const x = xScale(c);
            return (
              <g key={`x-${i}`}>
                <line
                  x1={x}
                  y1={margin.top}
                  x2={x}
                  y2={margin.top + plotHeight}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={margin.top + plotHeight + 16}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {c}
                </text>
              </g>
            );
          })}

          {/* Ideal continuous linear ramp reference line (dashed faint) */}
          <line
            x1={xScale(0)}
            y1={yScale(0)}
            x2={xScale(maxCode)}
            y2={yScale(vref)}
            stroke="#38bdf8"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.3"
          />

          {/* DAC Staircase Area Fill */}
          <path
            d={`${staircasePath} L ${xScale(maxCode)} ${yScale(0)} L ${xScale(0)} ${yScale(0)} Z`}
            fill="url(#dacStairFill)"
          />

          {/* DAC Staircase Line */}
          <path
            d={staircasePath}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2.5"
            strokeLinejoin="miter"
          />

          {/* Active Code Projection Lines */}
          <line
            x1={activeX}
            y1={margin.top + plotHeight}
            x2={activeX}
            y2={activeY}
            stroke="#22d3ee"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <line
            x1={margin.left}
            y1={activeY}
            x2={activeX}
            y2={activeY}
            stroke="#22d3ee"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* Active Operating Point Highlight */}
          <circle
            cx={activeX}
            cy={activeY}
            r="8"
            fill="#06b6d4"
            fillOpacity="0.3"
            filter="url(#dacGlow)"
          />
          <circle
            cx={activeX}
            cy={activeY}
            r="5"
            fill="#38bdf8"
            stroke="#ffffff"
            strokeWidth="2"
          />

          {/* Active Point Coordinate Label */}
          <g transform={`translate(${Math.min(activeX + 10, svgWidth - 110)}, ${Math.max(activeY - 12, margin.top + 16)})`}>
            <rect
              x="-6"
              y="-14"
              width="96"
              height="20"
              rx="4"
              fill="#0f172a"
              stroke="#06b6d4"
              strokeWidth="1"
            />
            <text
              x="42"
              y="0"
              textAnchor="middle"
              className="text-[10px] font-mono fill-cyan-300 font-bold"
            >
              D={currentCode} | {cleanFloat(currentVout, 3)}V
            </text>
          </g>

          {/* Axis Titles */}
          <text
            x={margin.left + plotWidth / 2}
            y={svgHeight - 12}
            textAnchor="middle"
            className="text-[11px] font-mono fill-slate-300 font-semibold"
          >
            Digital Input Code (Decimal D: 0 → {maxCode})
          </text>

          <text
            x={-margin.top - plotHeight / 2}
            y={18}
            textAnchor="middle"
            transform="rotate(-90)"
            className="text-[11px] font-mono fill-slate-300 font-semibold"
          >
            Output Voltage Vout (0 → {cleanFloat(vref, 2)} V)
          </text>

          {/* Interactive invisible hover overlay bars for 4-bit codes */}
          {resolution === 4 &&
            Array.from({ length: maxCode + 1 }, (_, i) => {
              const x1 = xScale(i);
              const w = plotWidth / (maxCode + 1);
              return (
                <rect
                  key={`hover-bar-${i}`}
                  x={x1 - w / 2}
                  y={margin.top}
                  width={w}
                  height={plotHeight}
                  fill="transparent"
                  className="cursor-pointer hover:fill-cyan-500/10 transition-colors"
                  onMouseEnter={() => setHoverCode(i)}
                  onMouseLeave={() => setHoverCode(null)}
                  onClick={() => onSelectCode?.(i)}
                />
              );
            })}
        </svg>
      </div>

      {/* Legend and Info footer */}
      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-400 inline-block"></span>
            <span>Quantized Staircase: Vout = (D / {maxCode}) × Vref</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-sky-400 inline-block"></span>
            <span>Continuous Linear Ideal Reference</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 font-mono">
          <Activity className="w-3.5 h-3.5 text-cyan-500" />
          <span>Full Scale = {cleanFloat(vref, 2)} V | 2^{resolution} = {Math.pow(2, resolution)} levels</span>
        </div>
      </div>
    </div>
  );
};
