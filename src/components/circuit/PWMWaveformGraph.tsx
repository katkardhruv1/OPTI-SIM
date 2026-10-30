import React, { useState } from 'react';
import { PWMWaveformData } from '../../utils/waveformGenerator';
import { cleanFloat } from '../../utils/formatters';
import { Activity } from 'lucide-react';

interface PWMWaveformGraphProps {
  data: PWMWaveformData;
  carrierFreq: number;
  dutyCycle: number;
  vControl: number;
  vMin: number;
  vMax: number;
}

export const PWMWaveformGraph: React.FC<PWMWaveformGraphProps> = ({
  data,
  carrierFreq,
  dutyCycle,
  vControl,
  vMin,
  vMax,
}) => {
  // 16:9 Widescreen aspect ratio (800 x 450)
  const width = 800;
  const height = 450;
  const padding = { top: 32, right: 35, bottom: 48, left: 65 };

  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const { points, tMin, tMax, timeUnit } = data;

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const xScale = (t: number) => {
    return padding.left + ((t - tMin) / (tMax - tMin || 1)) * plotW;
  };

  // Y-Scale spans from -1V to max(vMax, 5) + 1V for clean graticule margins
  const yMinPlot = -1;
  const yMaxPlot = Math.max(vMax, 5) + 1;

  const yScale = (v: number) => {
    return padding.top + plotH - ((v - yMinPlot) / (yMaxPlot - yMinPlot || 1)) * plotH;
  };

  // Build SVG paths for Carrier and PWM Out
  let carrierPath = '';
  let pwmPath = '';

  points.forEach((p, idx) => {
    const x = xScale(p.t).toFixed(1);
    const yCarrier = yScale(p.carrier).toFixed(1);
    const yPwm = yScale(p.pwmOut).toFixed(1);

    if (idx === 0) {
      carrierPath += `M ${x} ${yCarrier}`;
      pwmPath += `M ${x} ${yPwm}`;
    } else {
      carrierPath += ` L ${x} ${yCarrier}`;
      pwmPath += ` L ${x} ${yPwm}`;
    }
  });

  const controlY = yScale(vControl);
  const zeroY = yScale(0);
  const rail5Y = yScale(5);

  // 10 horizontal divisions (time ticks)
  const numXTicks = 10;
  const xTicks: { x: number; label: string }[] = [];
  for (let i = 0; i <= numXTicks; i++) {
    const tVal = tMin + (i / numXTicks) * (tMax - tMin);
    let displayVal = tVal;
    if (timeUnit === 'ms') displayVal = tVal * 1e3;
    if (timeUnit === 'µs') displayVal = tVal * 1e6;
    xTicks.push({
      x: xScale(tVal),
      label: `${cleanFloat(displayVal, 1)} ${timeUnit}`,
    });
  }

  // 8 vertical divisions (voltage ticks)
  const numYTicks = 8;
  const yTicks: { y: number; label: string; v: number }[] = [];
  for (let i = 0; i <= numYTicks; i++) {
    const vVal = yMinPlot + (i / numYTicks) * (yMaxPlot - yMinPlot);
    yTicks.push({
      y: yScale(vVal),
      label: cleanFloat(vVal, 1),
      v: vVal,
    });
  }

  // Hover Point
  const hoverPoint =
    hoverIndex !== null && hoverIndex >= 0 && hoverIndex < points.length
      ? {
          ...points[hoverIndex],
          x: xScale(points[hoverIndex].t),
          yCarrier: yScale(points[hoverIndex].carrier),
          yPwm: yScale(points[hoverIndex].pwmOut),
        }
      : null;

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
    <div className="flex flex-col h-full w-full rounded-[4px] border border-white/10 bg-[#1A1E29] p-3 sm:p-4 text-xs font-mono shadow-md space-y-3">
      {/* Header controls & legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00F0FF]" />
          <span className="font-mono text-[#00F0FF] font-bold uppercase tracking-wider">
            PWM DPO Oscilloscope
          </span>
          <span className="text-white/20">/</span>
          <span className="text-slate-400 font-mono text-[11px]">
            Carrier vs Control vs PWM Output
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-[#00F0FF]">
            <span className="w-3.5 h-1 rounded-full bg-[#00F0FF] inline-block shadow-[0_0_6px_rgba(0,240,255,0.8)]"></span>
            <span className="font-semibold">Carrier (Neon Cyan)</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-3.5 h-1 bg-emerald-400 inline-block"></span>
            <span>Vcontrol ({cleanFloat(vControl, 2)} V)</span>
          </span>
          <span className="flex items-center gap-1.5 text-[#FF5722]">
            <span className="w-3.5 h-1 rounded-full bg-[#FF5722] inline-block shadow-[0_0_6px_rgba(255,87,34,0.8)]"></span>
            <span className="font-semibold">PWM Out (Neon Orange)</span>
          </span>
        </div>
      </div>

      {/* SVG Canvas (16:9 Widescreen DPO Bench) */}
      <div className="relative w-full aspect-[16/9] max-h-[500px] overflow-hidden rounded-[3px] border border-white/10 bg-[#0B0F19] flex justify-center py-0.5">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full select-none cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            {/* DPO Cartesian Graticule Dot Pattern */}
            <pattern id="pwm-scope-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.6" fill="rgba(0, 240, 255, 0.08)" />
            </pattern>
          </defs>

          {/* Plot Background: Deep Charcoal / Midnight Navy */}
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
            fill="url(#pwm-scope-grid)"
            opacity="0.85"
          />

          {/* Zero Reference Center Horizontal Line */}
          <line
            x1={padding.left}
            y1={zeroY}
            x2={padding.left + plotW}
            y2={zeroY}
            stroke="rgba(0, 240, 255, 0.28)"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />

          {/* Center Graticule Minor Subdivision Tick Marks */}
          {Array.from({ length: 33 }, (_, i) => {
            const frac = i / 32;
            const xTick = padding.left + frac * plotW;
            const isMajor = i % 4 === 0;
            const tickH = isMajor ? 6 : 3;
            return (
              <line
                key={`htick-${i}`}
                x1={xTick}
                y1={zeroY - tickH / 2}
                x2={xTick}
                y2={zeroY + tickH / 2}
                stroke="rgba(0, 240, 255, 0.35)"
                strokeWidth="1"
              />
            );
          })}

          {/* Y Gridlines (8 divisions) */}
          {yTicks.map((tick, idx) => (
            <g key={`y-${idx}`}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={padding.left + plotW}
                y2={tick.y}
                stroke={Math.abs(tick.v) < 0.1 ? 'rgba(0, 240, 255, 0.22)' : 'rgba(0, 240, 255, 0.08)'}
                strokeDasharray="2 2"
                strokeWidth={Math.abs(tick.v) < 0.1 ? 1.4 : 1}
              />
              <text
                x={padding.left - 8}
                y={tick.y + 3.5}
                textAnchor="end"
                className="text-[9.5px] fill-slate-400 font-mono"
              >
                {tick.label} V
              </text>
            </g>
          ))}

          {/* X Gridlines (10 divisions) */}
          {xTicks.map((tick, idx) => (
            <g key={`x-${idx}`}>
              <line
                x1={tick.x}
                y1={padding.top}
                x2={tick.x}
                y2={padding.top + plotH}
                stroke={idx === Math.round(numXTicks / 2) ? 'rgba(0, 240, 255, 0.2)' : 'rgba(0, 240, 255, 0.08)'}
                strokeDasharray="2 2"
                strokeWidth={idx === Math.round(numXTicks / 2) ? 1.4 : 1}
              />
              <text
                x={tick.x}
                y={padding.top + plotH + 16}
                textAnchor="middle"
                className="text-[9.5px] fill-slate-400 font-mono"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* +5V Saturation / HIGH level line */}
          <line
            x1={padding.left}
            y1={rail5Y}
            x2={padding.left + plotW}
            y2={rail5Y}
            stroke="#F59E0B"
            strokeDasharray="3 3"
            strokeWidth="1"
            opacity="0.6"
          />
          <text
            x={padding.left + plotW - 6}
            y={rail5Y - 4}
            fill="#F59E0B"
            fontSize="9"
            fontFamily="JetBrains Mono"
            textAnchor="end"
            opacity="0.8"
          >
            +5V (TTL HIGH)
          </text>

          {/* Vcontrol Horizontal Line */}
          <line
            x1={padding.left}
            y1={controlY}
            x2={padding.left + plotW}
            y2={controlY}
            stroke="#10B981"
            strokeDasharray="4 2"
            strokeWidth="1.8"
          />
          <text
            x={padding.left + plotW - 6}
            y={controlY - 5}
            fill="#34D399"
            fontSize="9.5"
            fontFamily="JetBrains Mono"
            textAnchor="end"
            fontWeight="bold"
          >
            Vctrl = {cleanFloat(vControl, 2)} V
          </text>

          {/* Carrier Waveform (Glowing Neon Cyan with Phosphor Bloom) */}
          {carrierPath && (
            <g>
              {/* Phosphor Bloom Aura */}
              <path
                d={carrierPath}
                fill="none"
                stroke="#00F0FF"
                strokeWidth="6"
                strokeOpacity="0.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 0 6px rgba(0, 240, 255, 0.75))' }}
              />
              {/* Core Luminous Beam */}
              <path
                d={carrierPath}
                fill="none"
                stroke="#00F0FF"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 0 2px #00F0FF)' }}
              />
              {/* Specular Center Filament */}
              <path
                d={carrierPath}
                fill="none"
                stroke="#E0F7FA"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.85"
              />
            </g>
          )}

          {/* PWM Output Waveform (Glowing Neon Orange with Phosphor Bloom) */}
          {pwmPath && (
            <g>
              {/* Phosphor Bloom Aura */}
              <path
                d={pwmPath}
                fill="none"
                stroke="#FF5722"
                strokeWidth="6.5"
                strokeOpacity="0.28"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 0 7px rgba(255, 87, 34, 0.8))' }}
              />
              {/* Core Luminous Beam */}
              <path
                d={pwmPath}
                fill="none"
                stroke="#FF5722"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="miter"
                style={{ filter: 'drop-shadow(0 0 2.5px #FF5722)' }}
              />
              {/* Specular Center Filament */}
              <path
                d={pwmPath}
                fill="none"
                stroke="#FFEBE5"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="miter"
                opacity="0.9"
              />
            </g>
          )}

          {/* Precision Interactive Crosshairs & Reticle */}
          {hoverPoint && (
            <g>
              {/* Vertical Crosshair Line */}
              <line
                x1={hoverPoint.x}
                y1={padding.top}
                x2={hoverPoint.x}
                y2={padding.top + plotH}
                stroke="rgba(255, 255, 255, 0.45)"
                strokeDasharray="3 3"
                strokeWidth="1.2"
              />

              {/* Horizontal Crosshair for Carrier */}
              <line
                x1={padding.left}
                y1={hoverPoint.yCarrier}
                x2={padding.left + plotW}
                y2={hoverPoint.yCarrier}
                stroke="rgba(0, 240, 255, 0.45)"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              {/* Carrier Target Reticle */}
              <circle
                cx={hoverPoint.x}
                cy={hoverPoint.yCarrier}
                r="5"
                fill="#00F0FF"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />

              {/* Horizontal Crosshair for PWM Out */}
              <line
                x1={padding.left}
                y1={hoverPoint.yPwm}
                x2={padding.left + plotW}
                y2={hoverPoint.yPwm}
                stroke="rgba(255, 87, 34, 0.45)"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              {/* PWM Target Reticle */}
              <circle
                cx={hoverPoint.x}
                cy={hoverPoint.yPwm}
                r="5"
                fill="#FF5722"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />

              {/* Floating Monospace Digital Readout Tooltip */}
              {(() => {
                const boxW = 190;
                const boxH = 78;
                let boxX = hoverPoint.x + 12;
                if (boxX + boxW > padding.left + plotW) {
                  boxX = hoverPoint.x - boxW - 12;
                }
                const boxY = Math.min(padding.top + plotH - boxH - 6, Math.max(padding.top + 6, hoverPoint.yCarrier - 30));

                let displayT = hoverPoint.t;
                if (timeUnit === 'ms') displayT = hoverPoint.t * 1e3;
                if (timeUnit === 'µs') displayT = hoverPoint.t * 1e6;

                return (
                  <g transform={`translate(${boxX}, ${boxY})`} className="pointer-events-none">
                    <rect
                      x="0"
                      y="0"
                      width={boxW}
                      height={boxH}
                      rx="3"
                      fill="#0B0F19"
                      stroke="#00F0FF"
                      strokeWidth="1.2"
                      opacity="0.96"
                      filter="drop-shadow(0 4px 12px rgba(0,0,0,0.6))"
                    />
                    <rect x="0" y="0" width={boxW} height="16" rx="3" fill="#00F0FF" fillOpacity="0.12" />
                    <text x="8" y="12" className="text-[9px] font-mono fill-[#00F0FF] font-bold uppercase tracking-wider">
                      ⚡ DPO Hardware Readout
                    </text>
                    <text x="8" y="30" className="text-[10px] font-mono fill-slate-300">
                      Time: <tspan className="fill-white font-bold">{cleanFloat(displayT, 2)} {timeUnit}</tspan>
                    </text>
                    <text x="8" y="44" className="text-[10px] font-mono fill-[#00F0FF]">
                      Carrier: <tspan className="font-bold">{cleanFloat(hoverPoint.carrier, 2)} V</tspan>
                    </text>
                    <text x="8" y="58" className="text-[10px] font-mono fill-[#FF5722]">
                      PWM Out: <tspan className="font-bold">{cleanFloat(hoverPoint.pwmOut, 2)} V</tspan>
                    </text>
                    <text x="8" y="71" className="text-[9px] font-mono fill-emerald-400">
                      State: {hoverPoint.pwmOut > 2.5 ? 'HIGH (Vctrl > Vc)' : 'LOW (Vctrl ≤ Vc)'}
                    </text>
                  </g>
                );
              })()}
            </g>
          )}

          {/* Bottom X-axis label */}
          <text
            x={padding.left + plotW / 2}
            y={padding.top + plotH + 34}
            fill="#94A3B8"
            fontSize="10"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            className="uppercase tracking-wider"
          >
            TIME BASE ({timeUnit}) →
          </text>

          {/* Left Y-axis label */}
          <text
            x={padding.left - 45}
            y={padding.top + plotH / 2}
            fill="#94A3B8"
            fontSize="10"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            transform={`rotate(-90, ${padding.left - 45}, ${padding.top + plotH / 2})`}
            className="uppercase tracking-wider"
          >
            VOLTAGE (V)
          </text>
        </svg>
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
        <div>
          Modulation Duty Cycle: <span className="text-[#00F0FF] font-semibold">{cleanFloat(dutyCycle, 1)}%</span>
        </div>
        <div>
          Comparator Rule: <span className="text-emerald-400">Vcontrol &gt; Vcarrier → HIGH (5V)</span>
        </div>
        <div>
          Carrier: <span className="text-amber-400">{carrierFreq} Hz</span> ({vMin}V to {vMax}V)
        </div>
      </div>
    </div>
  );
};
