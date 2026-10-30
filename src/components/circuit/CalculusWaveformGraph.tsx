import React, { useState } from 'react';
import { WaveformData } from '../../utils/waveformGenerator';
import { cleanFloat, formatVoltage } from '../../utils/formatters';

interface CalculusWaveformGraphProps {
  data: WaveformData;
  title: string;
  inputLabel?: string;
  outputLabel?: string;
  expectedOutputWaveform?: string;
}

export const CalculusWaveformGraph: React.FC<CalculusWaveformGraphProps> = ({
  data,
  title,
  inputLabel = 'INPUT WAVEFORM',
  outputLabel = 'OUTPUT WAVEFORM',
  expectedOutputWaveform,
}) => {
  const [showInput, setShowInput] = useState(true);
  const [showOutput, setShowOutput] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // 16:9 Widescreen aspect ratio (800 x 450)
  const width = 800;
  const height = 450;
  const padding = { top: 32, right: 35, bottom: 45, left: 65 };

  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const { points, tMin, tMax, vMin, vMax, timeUnit } = data;

  const xScale = (t: number) => {
    return padding.left + ((t - tMin) / (tMax - tMin || 1)) * plotW;
  };

  const yScale = (v: number) => {
    return padding.top + plotH - ((v - vMin) / (vMax - vMin || 1)) * plotH;
  };

  const zeroY = yScale(0);

  // Generate SVG path strings
  let inputPath = '';
  let outputPath = '';

  points.forEach((p, idx) => {
    const x = xScale(p.t).toFixed(1);
    const yIn = yScale(p.vin).toFixed(1);
    const yOut = yScale(p.vout).toFixed(1);

    if (idx === 0) {
      inputPath += `M ${x} ${yIn}`;
      outputPath += `M ${x} ${yOut}`;
    } else {
      inputPath += ` L ${x} ${yIn}`;
      outputPath += ` L ${x} ${yOut}`;
    }
  });

  // Ticks: 8 vertical divisions
  const numYTicks = 8;
  const yTicks: number[] = [];
  for (let i = 0; i <= numYTicks; i++) {
    yTicks.push(vMin + (i / numYTicks) * (vMax - vMin));
  }

  // Ticks: 10 horizontal divisions
  const numXTicks = 10;
  const xTicks: { val: number; label: string }[] = [];
  for (let i = 0; i <= numXTicks; i++) {
    const tVal = tMin + (i / numXTicks) * (tMax - tMin);
    let displayVal = tVal;
    if (timeUnit === 'ms') displayVal = tVal * 1e3;
    if (timeUnit === 'µs') displayVal = tVal * 1e6;
    xTicks.push({
      val: tVal,
      label: `${cleanFloat(displayVal, 2)} ${timeUnit}`,
    });
  }

  // Hover Point
  const hoverPoint = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < points.length ? {
    ...points[hoverIndex],
    x: xScale(points[hoverIndex].t),
    yIn: yScale(points[hoverIndex].vin),
    yOut: yScale(points[hoverIndex].vout),
  } : null;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    if (relX >= padding.left && relX <= padding.left + plotW) {
      const ratio = (relX - padding.left) / plotW;
      const idx = Math.min(points.length - 1, Math.max(0, Math.floor(ratio * (points.length - 1))));
      setHoverIndex(idx);
    } else {
      setHoverIndex(null);
    }
  };

  return (
    <div className="rounded-[4px] border border-white/10 bg-[#1A1E29] p-3 sm:p-4 text-xs font-mono shadow-md space-y-3">
      {/* Top Header & Channels Toggles */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-2.5 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[#00F0FF] font-bold tracking-wider uppercase">{title}</span>
          <span className="text-white/30">/</span>
          <span className="text-slate-400 text-[11px] font-sans">DPO Digital Phosphor Oscilloscope Mode</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showInput}
              onChange={(e) => setShowInput(e.target.checked)}
              className="rounded-[2px] border-white/20 bg-[#0B0F19] text-[#00F0FF] focus:ring-0"
            />
            <span className="w-4 h-1 rounded-full bg-[#00F0FF] inline-block shadow-[0_0_8px_rgba(0,240,255,0.7)]"></span>
            <span className="text-[#00F0FF] font-semibold">{inputLabel} (Neon Cyan)</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showOutput}
              onChange={(e) => setShowOutput(e.target.checked)}
              className="rounded-[2px] border-white/20 bg-[#0B0F19] text-[#FF5722] focus:ring-0"
            />
            <span className="w-4 h-1 rounded-full bg-[#FF5722] inline-block shadow-[0_0_8px_rgba(255,87,34,0.7)]"></span>
            <span className="text-[#FF5722] font-semibold">{outputLabel} (Neon Orange)</span>
          </label>
        </div>
      </div>

      {/* SVG Scope Screen (16:9 Widescreen) */}
      <div className="relative w-full aspect-[16/9] max-h-[500px] overflow-hidden rounded-[3px] border border-white/10 bg-[#0B0F19] flex justify-center py-0.5">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full select-none cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <pattern id="calc-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.6" fill="rgba(0, 240, 255, 0.08)" />
            </pattern>
          </defs>

          {/* Background grid */}
          <rect
            x={padding.left}
            y={padding.top}
            width={plotW}
            height={plotH}
            fill="#0B0F19"
            stroke="rgba(0, 240, 255, 0.12)"
            strokeWidth="1.2"
          />
          <rect
            x={padding.left}
            y={padding.top}
            width={plotW}
            height={plotH}
            fill="url(#calc-grid)"
            opacity="0.85"
          />

          {/* Zero Volt Axis */}
          {zeroY >= padding.top && zeroY <= padding.top + plotH && (
            <line
              x1={padding.left}
              y1={zeroY}
              x2={padding.left + plotW}
              y2={zeroY}
              stroke="rgba(0, 240, 255, 0.28)"
              strokeWidth="1.2"
              strokeDasharray="4 4"
            />
          )}

          {/* Horizontal grid lines and Y-axis labels */}
          {yTicks.map((yVal, idx) => {
            const yPos = yScale(yVal);
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={yPos}
                  x2={padding.left + plotW}
                  y2={yPos}
                  stroke={Math.abs(yVal) < 1e-4 ? 'rgba(0, 240, 255, 0.25)' : 'rgba(0, 240, 255, 0.08)'}
                  strokeWidth={Math.abs(yVal) < 1e-4 ? 1.4 : 1}
                  strokeDasharray="2 2"
                />
                <text
                  x={padding.left - 8}
                  y={yPos + 3.5}
                  fill="#94A3B8"
                  fontSize="9.5"
                  fontFamily="'Fira Code', 'Roboto Mono', monospace"
                  textAnchor="end"
                >
                  {formatVoltage(yVal)}
                </text>
              </g>
            );
          })}

          {/* Vertical grid lines and X-axis labels */}
          {xTicks.map((tItem, idx) => {
            const xPos = xScale(tItem.val);
            return (
              <g key={idx}>
                <line
                  x1={xPos}
                  y1={padding.top}
                  x2={xPos}
                  y2={padding.top + plotH}
                  stroke={idx === Math.round(numXTicks / 2) ? 'rgba(0, 240, 255, 0.22)' : 'rgba(0, 240, 255, 0.08)'}
                  strokeWidth={idx === Math.round(numXTicks / 2) ? 1.4 : 1}
                  strokeDasharray="2 2"
                />
                <text
                  x={xPos}
                  y={padding.top + plotH + 16}
                  fill="#94A3B8"
                  fontSize="9.5"
                  fontFamily="'Fira Code', 'Roboto Mono', monospace"
                  textAnchor="middle"
                >
                  {tItem.label}
                </text>
              </g>
            );
          })}

          {/* Input Waveform Path (Glowing Neon Cyan with Phosphor Bloom) */}
          {showInput && (
            <g>
              <path
                d={inputPath}
                fill="none"
                stroke="#00F0FF"
                strokeWidth="6"
                strokeOpacity="0.25"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 0 6px rgba(0, 240, 255, 0.75))' }}
              />
              <path
                d={inputPath}
                fill="none"
                stroke="#00F0FF"
                strokeWidth="2.3"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 0 2px #00F0FF)' }}
              />
              <path
                d={inputPath}
                fill="none"
                stroke="#E0F7FA"
                strokeWidth="0.8"
                strokeLinejoin="round"
                opacity="0.85"
              />
            </g>
          )}

          {/* Output Waveform Path (Glowing Neon Orange with Phosphor Bloom) */}
          {showOutput && (
            <g>
              <path
                d={outputPath}
                fill="none"
                stroke="#FF5722"
                strokeWidth="6.5"
                strokeOpacity="0.28"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 0 7px rgba(255, 87, 34, 0.8))' }}
              />
              <path
                d={outputPath}
                fill="none"
                stroke="#FF5722"
                strokeWidth="2.5"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 0 2.5px #FF5722)' }}
              />
              <path
                d={outputPath}
                fill="none"
                stroke="#FFEBE5"
                strokeWidth="0.8"
                strokeLinejoin="round"
                opacity="0.9"
              />
            </g>
          )}

          {/* Precision Interactive Crosshairs & Monospace Digital Readout */}
          {hoverPoint && (
            <g className="pointer-events-none select-none">
              {/* Vertical Crosshair Line */}
              <line
                x1={hoverPoint.x}
                y1={padding.top}
                x2={hoverPoint.x}
                y2={padding.top + plotH}
                stroke="#00F0FF"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                opacity="0.55"
              />

              {/* Horizontal Crosshair Line for Output */}
              {showOutput && (
                <line
                  x1={padding.left}
                  y1={hoverPoint.yOut}
                  x2={padding.left + plotW}
                  y2={hoverPoint.yOut}
                  stroke="#FF5722"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                  opacity="0.55"
                />
              )}

              {/* Horizontal Crosshair Line for Input */}
              {showInput && (
                <line
                  x1={padding.left}
                  y1={hoverPoint.yIn}
                  x2={padding.left + plotW}
                  y2={hoverPoint.yIn}
                  stroke="#00F0FF"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.4"
                />
              )}

              {/* Reticles */}
              {showInput && (
                <g>
                  <circle cx={hoverPoint.x} cy={hoverPoint.yIn} r="6" fill="rgba(0, 240, 255, 0.3)" />
                  <circle cx={hoverPoint.x} cy={hoverPoint.yIn} r="4" fill="#00F0FF" stroke="#FFFFFF" strokeWidth="1.5" />
                </g>
              )}
              {showOutput && (
                <g>
                  <circle cx={hoverPoint.x} cy={hoverPoint.yOut} r="6.5" fill="rgba(255, 87, 34, 0.3)" />
                  <circle cx={hoverPoint.x} cy={hoverPoint.yOut} r="4.2" fill="#FF5722" stroke="#FFFFFF" strokeWidth="1.5" />
                </g>
              )}

              {/* Monospace Digital Hardware Readout Tooltip */}
              {(() => {
                const boxW = 205;
                const boxH = 72;
                const boxX = hoverPoint.x + boxW + 15 > padding.left + plotW ? hoverPoint.x - boxW - 12 : hoverPoint.x + 12;
                const boxY = Math.max(padding.top + 6, Math.min(hoverPoint.yOut - boxH / 2, padding.top + plotH - boxH - 6));
                let displayT = hoverPoint.t;
                if (timeUnit === 'ms') displayT = hoverPoint.t * 1e3;
                if (timeUnit === 'µs') displayT = hoverPoint.t * 1e6;

                return (
                  <g transform={`translate(${boxX}, ${boxY})`}>
                    <rect x="0" y="0" width={boxW} height={boxH} rx="3" fill="#0B0F19" stroke="#00F0FF" strokeWidth="1.2" fillOpacity="0.95" style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.85))' }} />
                    <rect x="0" y="0" width={boxW} height="18" rx="3" fill="#1A1E29" />
                    <circle cx="8" cy="9" r="2.5" fill="#00F0FF" className="animate-pulse" />
                    <text x="16" y="12.5" fill="#94A3B8" fontSize="8" fontFamily="'Fira Code', monospace" fontWeight="700">DPO HARDWARE READOUT</text>
                    <text x="10" y="32" fill="#F8FAFC" fontSize="9.5" fontFamily="'Fira Code', monospace" fontWeight="600">
                      Time:    <tspan fill="#F8FAFC">{cleanFloat(displayT, 3)} {timeUnit}</tspan>
                    </text>
                    <text x="10" y="47" fill="#00F0FF" fontSize="9.5" fontFamily="'Fira Code', monospace" fontWeight="700">
                      Vin:     <tspan fill="#00F0FF">{cleanFloat(hoverPoint.vin, 3)} V</tspan>
                    </text>
                    <text x="10" y="62" fill="#FF5722" fontSize="9.5" fontFamily="'Fira Code', monospace" fontWeight="700">
                      Vout:    <tspan fill="#FF5722">{cleanFloat(hoverPoint.vout, 3)} V</tspan>
                      <tspan fill="#64748B" fontSize="8" dx="6">ΔV: {cleanFloat(hoverPoint.vout - hoverPoint.vin, 2)}V</tspan>
                    </text>
                  </g>
                );
              })()}
            </g>
          )}
        </svg>

        {/* Floating telemetry summary badge */}
        {expectedOutputWaveform && (
          <div className="absolute top-2 left-16 bg-[#111520]/95 px-2.5 py-1 rounded-[3px] border border-white/10 text-[10px] text-slate-300 shadow">
            <span className="text-slate-500 font-sans">Output Nature: </span>
            <span className="text-[#FF5722] font-mono font-semibold">{expectedOutputWaveform}</span>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>Numerical Resolution: {points.length} calculated data points</span>
        <span className="text-[#00F0FF]">Scale: 16:9 DPO Dual Channel Calibrated</span>
      </div>
    </div>
  );
};

