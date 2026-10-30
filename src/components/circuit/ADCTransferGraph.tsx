import React from 'react';
import { ADCResolution } from '../../types/circuit';
import { cleanFloat } from '../../utils/formatters';
import { Activity, BarChart2 } from 'lucide-react';

interface ADCTransferGraphProps {
  resolution: ADCResolution;
  vref: number;
  vin: number;
  currentCode: number;
  maxCode: number;
  lsbSize: number;
  quantizedVoltage: number;
  quantizationError: number;
}

export const ADCTransferGraph: React.FC<ADCTransferGraphProps> = ({
  resolution,
  vref,
  vin,
  currentCode,
  maxCode,
  lsbSize,
  quantizedVoltage,
  quantizationError,
}) => {
  // SVG dimensions
  const svgWidth = 640;
  const svgHeight = 360;
  const margin = { top: 35, right: 35, bottom: 50, left: 65 };
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = svgHeight - margin.top - margin.bottom;

  // Scale mappings:
  // X: 0 to vref
  // Y: 0 to maxCode
  const xScale = (v: number) => margin.left + (Math.max(0, Math.min(vref, v)) / Math.max(0.1, vref)) * plotWidth;
  const yScale = (code: number) => margin.top + plotHeight - (code / Math.max(1, maxCode)) * plotHeight;

  // Generate staircase path:
  // For each code D from 0 to maxCode:
  // Threshold for code D is D * LSB.
  // Output is D for Vin in [D * LSB, (D + 1) * LSB)
  let staircasePath = '';
  const numSteps = Math.min(maxCode, 64);
  const stepStride = Math.max(1, Math.floor(maxCode / numSteps));

  for (let c = 0; c <= maxCode; c += stepStride) {
    const vStart = c * lsbSize;
    const vEnd = Math.min(vref, (c + stepStride) * lsbSize);
    const x1 = xScale(vStart);
    const x2 = xScale(vEnd);
    const y = yScale(c);

    if (c === 0) {
      staircasePath += `M ${x1} ${y}`;
    } else {
      staircasePath += ` V ${y}`;
    }
    staircasePath += ` H ${x2}`;
  }

  // Active point coordinates
  const activeX = xScale(vin);
  const activeY = yScale(currentCode);

  // Grid tick marks
  const xTicks = 5;
  const xTickValues = Array.from({ length: xTicks + 1 }, (_, i) => (vref / xTicks) * i);

  const yTickSteps = resolution === 3 || resolution === 4 ? maxCode : 8;
  const yTickValues = Array.from({ length: Math.min(yTickSteps + 1, 16) }, (_, i) =>
    Math.round((maxCode / Math.min(yTickSteps, 15)) * i)
  ).filter((val, idx, self) => self.indexOf(val) === idx);

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
              ADC Quantization Transfer Characteristic
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">
              Analog Input Voltage Vin vs Quantized {resolution}-bit Digital Output Code
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[#0B0F19] border border-white/10 text-slate-300">
            <span className="text-slate-400">LSB:</span>
            <span className="text-[#00F0FF] font-semibold">{cleanFloat(lsbSize, 4)} V</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[#0B0F19] border border-[#00F0FF]/30 text-white">
            <span className="text-slate-400">Sample:</span>
            <span className="font-bold">{cleanFloat(vin, 3)} V</span>
            <span className="text-[#00F0FF] font-bold ml-1">→ Code {currentCode} ({currentCode.toString(2).padStart(resolution, '0')}₂)</span>
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
            <pattern id="adc-dpo-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.6" fill="rgba(0, 240, 255, 0.08)" />
            </pattern>
            <linearGradient id="adcStairFill" x1="0" y1="0" x2="1" y2="0">
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
            fill="url(#adc-dpo-grid)"
            opacity="0.85"
          />

          {/* Y Gridlines and Labels (Digital Codes) */}
          {yTickValues.map((code, i) => {
            const y = yScale(code);
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
                  {code}
                </text>
              </g>
            );
          })}

          {/* X Gridlines and Labels (Analog Input Voltage) */}
          {xTickValues.map((v, i) => {
            const x = xScale(v);
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
                  {cleanFloat(v, 2)} V
                </text>
              </g>
            );
          })}

          {/* Ideal continuous ramp reference line */}
          <line
            x1={xScale(0)}
            y1={yScale(0)}
            x2={xScale(vref)}
            y2={yScale(maxCode)}
            stroke="#34d399"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.35"
          />

          {/* Quantizer Staircase Line */}
          <path
            d={staircasePath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinejoin="miter"
          />

          {/* Active Operating Input Projection Lines */}
          <line
            x1={activeX}
            y1={margin.top + plotHeight}
            x2={activeX}
            y2={activeY}
            stroke="#34d399"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <line
            x1={margin.left}
            y1={activeY}
            x2={activeX}
            y2={activeY}
            stroke="#34d399"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* Quantized reconstructed voltage marker */}
          <line
            x1={xScale(quantizedVoltage)}
            y1={margin.top + plotHeight - 10}
            x2={xScale(quantizedVoltage)}
            y2={margin.top + plotHeight}
            stroke="#06b6d4"
            strokeWidth="2"
          />

          {/* Active Point Highlight */}
          <circle
            cx={activeX}
            cy={activeY}
            r="8"
            fill="#10b981"
            fillOpacity="0.3"
            filter="url(#adcGlow)"
          />
          <circle
            cx={activeX}
            cy={activeY}
            r="5"
            fill="#34d399"
            stroke="#ffffff"
            strokeWidth="2"
          />

          {/* Active Coordinate Label */}
          <g transform={`translate(${Math.min(activeX + 10, svgWidth - 115)}, ${Math.max(activeY - 14, margin.top + 18)})`}>
            <rect
              x="-6"
              y="-14"
              width="105"
              height="20"
              rx="4"
              fill="#0f172a"
              stroke="#10b981"
              strokeWidth="1"
            />
            <text
              x="46"
              y="0"
              textAnchor="middle"
              className="text-[10px] font-mono fill-emerald-300 font-bold"
            >
              Vin={cleanFloat(vin, 2)}V → D={currentCode}
            </text>
          </g>

          {/* Axis Titles */}
          <text
            x={margin.left + plotWidth / 2}
            y={svgHeight - 12}
            textAnchor="middle"
            className="text-[11px] font-mono fill-slate-300 font-semibold"
          >
            Analog Input Voltage Vin (0 → {cleanFloat(vref, 2)} V)
          </text>

          <text
            x={-margin.top - plotHeight / 2}
            y={18}
            textAnchor="middle"
            transform="rotate(-90)"
            className="text-[11px] font-mono fill-slate-300 font-semibold"
          >
            Digital Output Code (0 → {maxCode})
          </text>
        </svg>
      </div>

      {/* Legend and Info footer */}
      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-400 inline-block"></span>
            <span>Flash Quantization Steps: D = ⌊Vin / LSB⌋</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
            <span>Quantization Error: ε = {cleanFloat(quantizationError, 4)} V</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 font-mono">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          <span>Vq = {cleanFloat(quantizedVoltage, 3)} V (Reconstructed)</span>
        </div>
      </div>
    </div>
  );
};
