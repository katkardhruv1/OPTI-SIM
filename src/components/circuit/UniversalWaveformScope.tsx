import React, { useState, useEffect, useRef } from 'react';
import { SimulationResult } from '../../utils/waveformEngine';
import { cleanFloat, formatFrequency, formatVoltage } from '../../utils/formatters';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  AlertTriangle,
  Eye,
  Maximize2,
  Minimize2,
  X,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface UniversalWaveformScopeProps {
  simulation: SimulationResult;
  title?: string;
  subtitle?: string;
  insight?: string;
  showPhaseMetric?: boolean;
  showGainMetric?: boolean;
  onResetTime?: () => void;
}

export const UniversalWaveformScope: React.FC<UniversalWaveformScopeProps> = ({
  simulation,
  title = 'Circuit oscilloscope & waveform analyzer',
  subtitle = 'Dual-trace real-time input vs output signal analysis',
  insight,
  showPhaseMetric = true,
  showGainMetric = true,
  onResetTime,
}) => {
  // Display modes: 'both' | 'input' | 'output' | 'split'
  const [displayMode, setDisplayMode] = useState<'both' | 'input' | 'output' | 'split'>('both');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [showMeasurements, setShowMeasurements] = useState<boolean>(true);
  const [showRails, setShowRails] = useState<boolean>(true);
  const [autoScale, setAutoScale] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Animation sweep progress: 0 to 1
  const [animProgress, setAnimProgress] = useState<number>(1);
  const animRef = useRef<number | null>(null);

  // Mouse hover cursor inspection state
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Progressive sweep animation
  useEffect(() => {
    if (!isRunning) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    let lastTimestamp = performance.now();
    const animate = (timestamp: number) => {
      const delta = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      setAnimProgress((prev) => {
        // Complete one screen sweep every 2 seconds
        const next = prev + delta * 0.5;
        return next > 1 ? 0.05 : next;
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isRunning]);

  const handleResetAnim = () => {
    setAnimProgress(1);
    onResetTime?.();
  };

  useEffect(() => {
    if (!isExpanded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  const {
    time,
    vin,
    vout,
    inMetrics,
    outMetrics,
    gain,
    gainDb,
    phaseDiffDeg,
    clipped,
    posVsat = 15,
    negVsat = -15,
    timeUnit,
    timeScaleMultiplier,
    period,
  } = simulation;

  // SVG Dimensions: 16:9 Widescreen aspect ratio (960 x 540)
  const svgWidth = 960;
  const isSplit = displayMode === 'split';
  const svgHeight = 540;
  const margin = { top: 32, right: 35, bottom: 48, left: 70 };
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = isSplit ? (svgHeight - margin.top - margin.bottom - 24) / 2 : svgHeight - margin.top - margin.bottom;

  // Time X limits
  const tMin = 0;
  const tMax = time.length > 0 ? time[time.length - 1] : period * 4;

  // Voltage Y limits with Auto-scale
  const rawMin = Math.min(inMetrics.vMin, outMetrics.vMin, showRails ? negVsat : 0);
  const rawMax = Math.max(inMetrics.vMax, outMetrics.vMax, showRails ? posVsat : 0);
  const absMax = Math.max(Math.abs(rawMin), Math.abs(rawMax), 1);
  const ySpan = autoScale ? Math.ceil(absMax * 1.25) : 18;
  const vMin = -ySpan;
  const vMax = ySpan;

  // Scale functions for main plot
  const getX = (t: number) => margin.left + ((t - tMin) / Math.max(1e-9, tMax - tMin)) * plotWidth;
  const getY = (v: number, topOffset: number = margin.top, height: number = plotHeight) =>
    topOffset + height / 2 - (v / Math.max(1e-9, ySpan)) * (height / 2);

  // Samples slice based on animation progress
  const visibleCount = isRunning ? Math.max(10, Math.floor(time.length * animProgress)) : time.length;

  // Build SVG polyline paths
  const inPoints: string[] = [];
  const outPoints: string[] = [];
  for (let i = 0; i < visibleCount; i++) {
    const x = getX(time[i]);
    const yIn = getY(vin[i]);
    const yOut = getY(vout[i]);
    inPoints.push(`${x.toFixed(1)},${yIn.toFixed(1)}`);
    outPoints.push(`${x.toFixed(1)},${yOut.toFixed(1)}`);
  }

  // Split view paths (Channel 1 top, Channel 2 bottom)
  const topPlotTop = margin.top;
  const botPlotTop = margin.top + plotHeight + 20;

  const splitInPoints: string[] = [];
  const splitOutPoints: string[] = [];
  for (let i = 0; i < visibleCount; i++) {
    const x = getX(time[i]);
    const yIn = getY(vin[i], topPlotTop, plotHeight);
    const yOut = getY(vout[i], botPlotTop, plotHeight);
    splitInPoints.push(`${x.toFixed(1)},${yIn.toFixed(1)}`);
    splitOutPoints.push(`${x.toFixed(1)},${yOut.toFixed(1)}`);
  }

  // Hover cursor sample with exact coordinates for both vertical & horizontal crosshairs
  const hoverPoint = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < time.length ? {
    t: time[hoverIndex],
    vin: vin[hoverIndex],
    vout: vout[hoverIndex],
    x: getX(time[hoverIndex]),
    yIn: !isSplit ? getY(vin[hoverIndex]) : getY(vin[hoverIndex], topPlotTop, plotHeight),
    yOut: !isSplit ? getY(vout[hoverIndex]) : getY(vout[hoverIndex], botPlotTop, plotHeight),
  } : null;

  // Mouse move handler over SVG
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * svgWidth;
    if (relX >= margin.left && relX <= margin.left + plotWidth) {
      const ratio = (relX - margin.left) / plotWidth;
      const idx = Math.min(time.length - 1, Math.max(0, Math.floor(ratio * (time.length - 1))));
      setHoverIndex(idx);
    } else {
      setHoverIndex(null);
    }
  };

  // Grid Ticks: 10 horizontal x 8 vertical divisions (Oscilloscope standard graticule)
  const xDivisions = 10;
  const xTicks = Array.from({ length: xDivisions + 1 }, (_, i) => {
    const t = (tMax / xDivisions) * i;
    return { t, x: getX(t), label: cleanFloat(t * timeScaleMultiplier, 1) };
  });

  const yDivisions = 8;
  const yTicks = Array.from({ length: yDivisions + 1 }, (_, i) => {
    const v = vMin + ((vMax - vMin) / yDivisions) * i;
    return { v, y: getY(v), label: cleanFloat(v, 1) };
  });

  return (
    <div className="w-full bg-[#1A1E29] rounded-[4px] border border-white/10 p-4 space-y-4 text-white">
      {/* Scope Header Bar */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-white/10 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-[3px] bg-[#0B0F19] border border-[#00F0FF]/40 text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide font-sans flex items-center gap-2">
              <span>{title}</span>
              {clipped && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-[2px] bg-[#FF5722]/15 border border-[#FF5722]/50 text-[#FF5722] shadow-[0_0_8px_rgba(255,87,34,0.3)]">
                  <AlertTriangle className="w-3 h-3" />
                  Saturation clipping detected
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 font-sans">{subtitle}</p>
          </div>
        </div>

        {/* Action and Mode Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          {/* Display Mode Tabs */}
          <div className="flex items-center bg-[#0B0F19] rounded-[3px] p-0.5 border border-white/10">
            <button
              onClick={() => setDisplayMode('both')}
              className={`px-2.5 py-1 rounded-[2px] transition cursor-pointer ${
                displayMode === 'both' ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              In + out
            </button>
            <button
              onClick={() => setDisplayMode('input')}
              className={`px-2.5 py-1 rounded-[2px] transition cursor-pointer ${
                displayMode === 'input' ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Vin only
            </button>
            <button
              onClick={() => setDisplayMode('output')}
              className={`px-2.5 py-1 rounded-[2px] transition cursor-pointer ${
                displayMode === 'output' ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Vout only
            </button>
            <button
              onClick={() => setDisplayMode('split')}
              className={`px-2.5 py-1 rounded-[2px] transition cursor-pointer ${
                displayMode === 'split' ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Split view
            </button>
          </div>

          {/* Run/Pause Button */}
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border font-bold font-mono transition cursor-pointer ${
              isRunning
                ? 'bg-[#111520] border-white/15 text-white hover:border-white/30'
                : 'bg-[#00F0FF] border-[#00F0FF] text-[#0B0F19] hover:bg-[#00D2E0] shadow-[0_0_12px_rgba(0,240,255,0.3)]'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? 'Pause' : 'Run'}</span>
          </button>

          {/* Reset Sweep */}
          <button
            onClick={handleResetAnim}
            className="p-1.5 rounded-[3px] bg-[#111520] hover:bg-white/5 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
            title="Reset sweep cycle"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Auto-scale Toggle */}
          <button
            onClick={() => setAutoScale(!autoScale)}
            className={`px-2.5 py-1 rounded-[3px] border font-mono transition cursor-pointer ${
              autoScale ? 'bg-[#00F0FF]/15 border-[#00F0FF]/40 text-[#00F0FF] font-semibold' : 'bg-[#111520] border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Toggle auto-scaling on voltage axis"
          >
            Auto scale
          </button>

          {/* Saturation Rails Toggle */}
          <button
            onClick={() => setShowRails(!showRails)}
            className={`px-2.5 py-1 rounded-[3px] border font-mono transition cursor-pointer ${
              showRails ? 'bg-[#FF5722]/15 border-[#FF5722]/50 text-[#FF5722] font-semibold' : 'bg-[#111520] border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Toggle saturation limit rails (±Vsat)"
          >
            ±Vsat rails
          </button>

          <div className="w-px h-4 bg-white/10 my-auto mx-0.5" />

          {/* Fullscreen / Expanded Scope Button */}
          <button
            onClick={() => setIsExpanded(true)}
            className="p-1.5 rounded-[3px] bg-[#111520] hover:bg-white/5 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer eng-focus flex items-center gap-1 font-mono text-xs"
            title="Expand oscilloscope view (full screen bench view)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span className="hidden sm:inline text-[11px] font-medium">Expand</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas Area / Empty State */}
      {time.length === 0 ? (
        <div className="w-full h-80 flex flex-col items-center justify-center p-6 text-center text-slate-400 font-mono bg-[#0B0F19] rounded-[3px] border border-white/10 space-y-2">
          <Activity className="w-8 h-8 text-slate-500 animate-pulse" />
          <p className="text-sm text-white font-bold">No active waveform excitation</p>
          <p className="text-xs text-slate-400 max-w-sm">
            Set excitation signal parameters and click Calculate to simulate oscilloscope waveforms.
          </p>
        </div>
      ) : (
        <div className="relative w-full aspect-[16/9] max-h-[560px] overflow-hidden flex justify-center py-1 bg-[#0B0F19] rounded-[3px] border border-white/10">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full select-none cursor-crosshair"
            style={{ minWidth: '480px', backgroundColor: '#0B0F19' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              {/* DPO Cartesian Graticule Grid Pattern */}
              <pattern id="scope-dot-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="0.6" fill="rgba(0, 240, 255, 0.09)" />
              </pattern>
            </defs>

          {/* Normal Single / Superimposed View */}
          {!isSplit ? (
            <g>
              {/* Plot Background: Deep Charcoal / Midnight Navy */}
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
                fill="url(#scope-dot-grid)"
                opacity="0.85"
              />

              {/* Zero Reference Center Horizontal Line */}
              <line
                x1={margin.left}
                y1={getY(0)}
                x2={margin.left + plotWidth}
                y2={getY(0)}
                stroke="rgba(0, 240, 255, 0.28)"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />

              {/* Center Vertical Axis */}
              <line
                x1={margin.left + plotWidth / 2}
                y1={margin.top}
                x2={margin.left + plotWidth / 2}
                y2={margin.top + plotHeight}
                stroke="rgba(0, 240, 255, 0.2)"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />

              {/* Center Graticule Minor Subdivision Tick Marks (DPO Hardware Screen Feel) */}
              {Array.from({ length: 41 }, (_, i) => {
                const frac = i / 40;
                const xTick = margin.left + frac * plotWidth;
                const isMajor = i % 4 === 0;
                const tickH = isMajor ? 6 : 3;
                return (
                  <line
                    key={`htick-${i}`}
                    x1={xTick}
                    y1={getY(0) - tickH / 2}
                    x2={xTick}
                    y2={getY(0) + tickH / 2}
                    stroke="rgba(0, 240, 255, 0.35)"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Y Gridlines (8 divisions with tick labels in Fira Code) */}
              {yTicks.map((tick, idx) => (
                <g key={`y-${idx}`}>
                  <line
                    x1={margin.left}
                    y1={tick.y}
                    x2={margin.left + plotWidth}
                    y2={tick.y}
                    stroke={Math.abs(tick.v) < 1e-4 ? 'rgba(0, 240, 255, 0.25)' : 'rgba(0, 240, 255, 0.08)'}
                    strokeDasharray="2 2"
                    strokeWidth={Math.abs(tick.v) < 1e-4 ? 1.4 : 1}
                  />
                  <text
                    x={margin.left - 8}
                    y={tick.y + 3.5}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {tick.label} V
                  </text>
                </g>
              ))}

              {/* X Gridlines (10 divisions with tick labels in Fira Code) */}
              {xTicks.map((tick, idx) => (
                <g key={`x-${idx}`}>
                  <line
                    x1={tick.x}
                    y1={margin.top}
                    x2={tick.x}
                    y2={margin.top + plotHeight}
                    stroke={idx === Math.round(xDivisions / 2) ? 'rgba(0, 240, 255, 0.22)' : 'rgba(0, 240, 255, 0.08)'}
                    strokeDasharray="2 2"
                    strokeWidth={idx === Math.round(xDivisions / 2) ? 1.4 : 1}
                  />
                  <text
                    x={tick.x}
                    y={margin.top + plotHeight + 16}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {tick.label} {timeUnit}
                  </text>
                </g>
              ))}

              {/* Y Axis Title */}
              <text
                x={margin.left - 48}
                y={margin.top + plotHeight / 2}
                textAnchor="middle"
                transform={`rotate(-90, ${margin.left - 48}, ${margin.top + plotHeight / 2})`}
                className="text-[10px] font-mono fill-slate-400 font-semibold uppercase tracking-wider"
              >
                VOLTAGE (V)
              </text>

              {/* X Axis Title */}
              <text
                x={margin.left + plotWidth / 2}
                y={margin.top + plotHeight + 36}
                textAnchor="middle"
                className="text-[10px] font-mono fill-slate-400 font-semibold uppercase tracking-wider"
              >
                TIME BASE ({timeUnit})
              </text>

              {/* Saturation Rails (+Vsat and -Vsat in Subtle Amber Dashed Line) */}
              {showRails && (
                <g>
                  {/* +Vsat */}
                  <line
                    x1={margin.left}
                    y1={getY(posVsat)}
                    x2={margin.left + plotWidth}
                    y2={getY(posVsat)}
                    stroke="#F59E0B"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                    opacity="0.65"
                  />
                  <text
                    x={margin.left + plotWidth - 6}
                    y={getY(posVsat) - 5}
                    textAnchor="end"
                    className="text-[9px] font-mono fill-amber-400 font-bold"
                  >
                    +Vsat ({cleanFloat(posVsat, 1)} V)
                  </text>

                  {/* -Vsat */}
                  <line
                    x1={margin.left}
                    y1={getY(negVsat)}
                    x2={margin.left + plotWidth}
                    y2={getY(negVsat)}
                    stroke="#F59E0B"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                    opacity="0.65"
                  />
                  <text
                    x={margin.left + plotWidth - 6}
                    y={getY(negVsat) + 12}
                    textAnchor="end"
                    className="text-[9px] font-mono fill-amber-400 font-bold"
                  >
                    -Vsat ({cleanFloat(negVsat, 1)} V)
                  </text>
                </g>
              )}

              {/* Waveform Trace CH1 (INPUT - Bright Neon Cyan #00F0FF with Phosphor Bloom) */}
              {(displayMode === 'both' || displayMode === 'input') && inPoints.length > 1 && (
                <g>
                  {/* Phosphor Bloom Aura Underlayer */}
                  <polyline
                    points={inPoints.join(' ')}
                    fill="none"
                    stroke="#00F0FF"
                    strokeWidth="6"
                    strokeOpacity="0.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(0, 240, 255, 0.75))' }}
                  />
                  {/* Core Luminous Beam */}
                  <polyline
                    points={inPoints.join(' ')}
                    fill="none"
                    stroke="#00F0FF"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: 'drop-shadow(0 0 2px #00F0FF)' }}
                  />
                  {/* Specular White Center Filament */}
                  <polyline
                    points={inPoints.join(' ')}
                    fill="none"
                    stroke="#E0F7FA"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.85"
                  />
                </g>
              )}

              {/* Waveform Trace CH2 (OUTPUT - Vivid Neon Orange #FF5722 with Phosphor Bloom) */}
              {(displayMode === 'both' || displayMode === 'output') && outPoints.length > 1 && (
                <g>
                  {/* Phosphor Bloom Aura Underlayer */}
                  <polyline
                    points={outPoints.join(' ')}
                    fill="none"
                    stroke="#FF5722"
                    strokeWidth="6.5"
                    strokeOpacity="0.28"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: 'drop-shadow(0 0 7px rgba(255, 87, 34, 0.8))' }}
                  />
                  {/* Core Luminous Beam */}
                  <polyline
                    points={outPoints.join(' ')}
                    fill="none"
                    stroke="#FF5722"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: 'drop-shadow(0 0 2.5px #FF5722)' }}
                  />
                  {/* Specular Center Filament */}
                  <polyline
                    points={outPoints.join(' ')}
                    fill="none"
                    stroke="#FFEBE5"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.9"
                  />
                </g>
              )}
            </g>
          ) : (
            /* Split View (Dual Stacked DPO Graphs) */
            <g>
              {/* Channel 1: Top (Vin - Neon Cyan) */}
              <rect
                x={margin.left}
                y={topPlotTop}
                width={plotWidth}
                height={plotHeight}
                fill="#0B0F19"
                stroke="rgba(0, 240, 255, 0.15)"
                strokeWidth="1.2"
                rx="2"
              />
              <line
                x1={margin.left}
                y1={topPlotTop + plotHeight / 2}
                x2={margin.left + plotWidth}
                y2={topPlotTop + plotHeight / 2}
                stroke="rgba(0, 240, 255, 0.22)"
                strokeDasharray="3 3"
              />
              {/* CH1 Phosphor Bloom & Beam */}
              <polyline
                points={splitInPoints.join(' ')}
                fill="none"
                stroke="#00F0FF"
                strokeWidth="5"
                strokeOpacity="0.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 0 6px rgba(0, 240, 255, 0.75))' }}
              />
              <polyline
                points={splitInPoints.join(' ')}
                fill="none"
                stroke="#00F0FF"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={splitInPoints.join(' ')}
                fill="none"
                stroke="#E0F7FA"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.85"
              />
              <text x={margin.left + 8} y={topPlotTop + 16} className="text-[10px] font-mono fill-[#00F0FF] font-bold">
                CH1: Vin ({cleanFloat(inMetrics.vPeak, 2)} Vpk) [neon cyan]
              </text>

              {/* Channel 2: Bottom (Vout - Neon Orange) */}
              <rect
                x={margin.left}
                y={botPlotTop}
                width={plotWidth}
                height={plotHeight}
                fill="#0B0F19"
                stroke="rgba(255, 87, 34, 0.15)"
                strokeWidth="1.2"
                rx="2"
              />
              <line
                x1={margin.left}
                y1={botPlotTop + plotHeight / 2}
                x2={margin.left + plotWidth}
                y2={botPlotTop + plotHeight / 2}
                stroke="rgba(255, 87, 34, 0.22)"
                strokeDasharray="3 3"
              />
              {/* CH2 Phosphor Bloom & Beam */}
              <polyline
                points={splitOutPoints.join(' ')}
                fill="none"
                stroke="#FF5722"
                strokeWidth="5"
                strokeOpacity="0.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 0 6px rgba(255, 87, 34, 0.75))' }}
              />
              <polyline
                points={splitOutPoints.join(' ')}
                fill="none"
                stroke="#FF5722"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={splitOutPoints.join(' ')}
                fill="none"
                stroke="#FFEBE5"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />
              <text x={margin.left + 8} y={botPlotTop + 16} className="text-[10px] font-mono fill-[#FF5722] font-bold">
                CH2: Vout ({cleanFloat(outMetrics.vPeak, 2)} Vpk) [neon orange]
              </text>
            </g>
          )}

          {/* Interactive Mouse Cursor Crosshairs & DPO Digital Readout */}
          {hoverPoint && (
            <g className="pointer-events-none select-none">
              {/* Vertical Crosshair Line (tracks cursor time) */}
              <line
                x1={hoverPoint.x}
                y1={!isSplit ? margin.top : topPlotTop}
                x2={hoverPoint.x}
                y2={!isSplit ? margin.top + plotHeight : botPlotTop + plotHeight}
                stroke="#00F0FF"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                opacity="0.55"
              />

              {/* Horizontal Crosshair Line at Vout */}
              {(displayMode === 'both' || displayMode === 'output') && (
                <line
                  x1={margin.left}
                  y1={hoverPoint.yOut}
                  x2={margin.left + plotWidth}
                  y2={hoverPoint.yOut}
                  stroke="#FF5722"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                  opacity="0.55"
                />
              )}

              {/* Horizontal Crosshair Line at Vin */}
              {(displayMode === 'both' || displayMode === 'input') && (
                <line
                  x1={margin.left}
                  y1={hoverPoint.yIn}
                  x2={margin.left + plotWidth}
                  y2={hoverPoint.yIn}
                  stroke="#00F0FF"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.4"
                />
              )}

              {/* Reticle Target at Vin */}
              {(displayMode === 'both' || displayMode === 'input') && (
                <g>
                  <circle cx={hoverPoint.x} cy={hoverPoint.yIn} r="6" fill="rgba(0, 240, 255, 0.3)" />
                  <circle cx={hoverPoint.x} cy={hoverPoint.yIn} r="4" fill="#00F0FF" stroke="#FFFFFF" strokeWidth="1.5" />
                </g>
              )}

              {/* Reticle Target at Vout */}
              {(displayMode === 'both' || displayMode === 'output') && (
                <g>
                  <circle cx={hoverPoint.x} cy={hoverPoint.yOut} r="6.5" fill="rgba(255, 87, 34, 0.3)" />
                  <circle cx={hoverPoint.x} cy={hoverPoint.yOut} r="4.2" fill="#FF5722" stroke="#FFFFFF" strokeWidth="1.5" />
                </g>
              )}

              {/* Floating Monospace Digital Readout Tooltip */}
              {(() => {
                const boxW = 210;
                const boxH = 74;
                // If cursor is on the right side, flip tooltip to left of crosshair
                const boxX = hoverPoint.x + boxW + 15 > margin.left + plotWidth
                  ? hoverPoint.x - boxW - 12
                  : hoverPoint.x + 12;
                const boxY = Math.max(margin.top + 6, Math.min(hoverPoint.yOut - boxH / 2, margin.top + plotHeight - boxH - 6));

                return (
                  <g transform={`translate(${boxX}, ${boxY})`}>
                    {/* Readout Bezel */}
                    <rect
                      x="0"
                      y="0"
                      width={boxW}
                      height={boxH}
                      rx="3"
                      fill="#0B0F19"
                      stroke="#00F0FF"
                      strokeWidth="1.2"
                      fillOpacity="0.95"
                      style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.85))' }}
                    />
                    {/* Header bar */}
                    <rect x="0" y="0" width={boxW} height="18" rx="3" fill="#1A1E29" />
                    <circle cx="8" cy="9" r="2.5" fill="#00F0FF" className="animate-pulse" />
                    <text x="16" y="12.5" fill="#94A3B8" fontSize="8" fontFamily="'Fira Code', monospace" fontWeight="700" letterSpacing="0.05em">
                      DPO HARDWARE READOUT
                    </text>

                    {/* Coordinates Readout */}
                    <text x="10" y="32" fill="#F8FAFC" fontSize="9.5" fontFamily="'Fira Code', monospace" fontWeight="600">
                      Time:    <tspan fill="#F8FAFC">{cleanFloat(hoverPoint.t * timeScaleMultiplier, 3)} {timeUnit}</tspan>
                    </text>
                    <text x="10" y="47" fill="#00F0FF" fontSize="9.5" fontFamily="'Fira Code', monospace" fontWeight="700">
                      CH1 Vin:  <tspan fill="#00F0FF">{cleanFloat(hoverPoint.vin, 3)} V</tspan>
                    </text>
                    <text x="10" y="62" fill="#FF5722" fontSize="9.5" fontFamily="'Fira Code', monospace" fontWeight="700">
                      CH2 Vout: <tspan fill="#FF5722">{cleanFloat(hoverPoint.vout, 3)} V</tspan>
                      <tspan fill="#64748B" fontSize="8" dx="6">ΔV: {cleanFloat(hoverPoint.vout - hoverPoint.vin, 2)}V</tspan>
                    </text>
                  </g>
                );
              })()}
            </g>
          )}
        </svg>
      </div>
      )}

      {/* Scope Footer Legend with DPO Neon Indicators */}
      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-white/10 text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-4 flex-wrap font-mono">
          <div className="flex items-center gap-2">
            <span className="w-5 h-1 rounded-full bg-[#00F0FF] inline-block shadow-[0_0_8px_rgba(0,240,255,0.7)]"></span>
            <span className="font-mono text-[#00F0FF] font-semibold text-xs">CH1: Input (Vin) — Neon Cyan</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-1 rounded-full bg-[#FF5722] inline-block shadow-[0_0_8px_rgba(255,87,34,0.7)]"></span>
            <span className="font-mono text-[#FF5722] font-semibold text-xs">CH2: Output (Vout) — Neon Orange</span>
          </div>
          {showRails && (
            <div className="flex items-center gap-2">
              <span className="w-5 h-0.5 border-t border-dashed border-amber-400/80 inline-block"></span>
              <span className="font-mono text-amber-400/80 text-xs">Rails (±{posVsat}V) — Amber Dashed</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMeasurements(!showMeasurements)}
            className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300 hover:text-[#00F0FF] transition cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>{showMeasurements ? 'Hide Telemetry' : 'Show Telemetry'}</span>
          </button>
        </div>
      </div>

      {/* Engineering Measurement Panel */}
      {showMeasurements && (
        <div className="bg-[#111520] rounded-[3px] border border-white/10 p-3 pt-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span className="text-xs font-mono font-bold text-white tracking-wider uppercase">
                ENGINEERING MEASUREMENTS & WAVEFORM METRICS
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              f = {formatFrequency(inMetrics.frequency)} (T = {cleanFloat(period * timeScaleMultiplier, 3)} {timeUnit})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 font-mono text-xs">
            {/* Vin Peak */}
            <div className="bg-[#1A1E29] p-2.5 rounded-[2px] border border-white/10">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Vin Peak</div>
              <div className="text-white font-bold text-sm mt-0.5">{cleanFloat(inMetrics.vPeak, 3)} V</div>
              <div className="text-[9px] text-slate-500 mt-0.5">Vpp = {cleanFloat(inMetrics.vpp, 2)}V</div>
            </div>

            {/* Vout Peak */}
            <div className="bg-[#1A1E29] p-2.5 rounded-[2px] border border-white/10">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Vout Peak</div>
              <div className="text-[#00F0FF] font-bold text-sm mt-0.5">{cleanFloat(outMetrics.vPeak, 3)} V</div>
              <div className="text-[9px] text-slate-500 mt-0.5">Vpp = {cleanFloat(outMetrics.vpp, 2)}V</div>
            </div>

            {/* Vin RMS */}
            <div className="bg-[#1A1E29] p-2.5 rounded-[2px] border border-white/10">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Vin (RMS)</div>
              <div className="text-white font-bold text-sm mt-0.5">{cleanFloat(inMetrics.vrms, 3)} V</div>
              <div className="text-[9px] text-slate-500 mt-0.5">Vmax: {cleanFloat(inMetrics.vMax, 2)}V</div>
            </div>

            {/* Vout RMS */}
            <div className="bg-[#1A1E29] p-2.5 rounded-[2px] border border-white/10">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Vout (RMS)</div>
              <div className="text-[#00F0FF] font-bold text-sm mt-0.5">{cleanFloat(outMetrics.vrms, 3)} V</div>
              <div className="text-[9px] text-slate-500 mt-0.5">Vmax: {cleanFloat(outMetrics.vMax, 2)}V</div>
            </div>

            {/* Measured Gain */}
            {showGainMetric && (
              <div className="bg-[#1A1E29] p-2.5 rounded-[2px] border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Gain (|Av|)</div>
                <div className="text-white font-bold text-sm mt-0.5">{cleanFloat(gain, 3)}</div>
                <div className="text-[9px] text-slate-400 mt-0.5">{cleanFloat(gainDb, 2)} dB</div>
              </div>
            )}

            {/* Phase Difference */}
            {showPhaseMetric && (
              <div className="bg-[#1A1E29] p-2.5 rounded-[2px] border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Phase Diff (Δφ)</div>
                <div className="text-white font-bold text-sm mt-0.5">{cleanFloat(phaseDiffDeg, 1)}°</div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  {Math.abs(phaseDiffDeg - 180) < 1e-2 ? 'Inverted' : Math.abs(phaseDiffDeg) < 1e-2 ? 'In phase' : 'Shifted'}
                </div>
              </div>
            )}

            {/* Saturation State */}
            <div className={`p-2.5 rounded-[2px] border ${
              clipped ? 'bg-[#FF5722]/15 border-[#FF5722]/60 text-[#FF5722]' : 'bg-[#1A1E29] border-white/10 text-white'
            }`}>
              <div className="text-[10px] uppercase text-slate-400 tracking-wider">Clipping</div>
              <div className={`font-bold text-sm mt-0.5 ${clipped ? 'text-[#FF5722]' : 'text-[#00F0FF]'}`}>
                {clipped ? 'Clipped' : 'Linear'}
              </div>
              <div className="text-[9px] mt-0.5 text-slate-400">
                {clipped ? `Rail: ±${posVsat}V` : 'Within rails'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Educational Engineering Insight Card */}
      {insight && (
        <div className="bg-[#111520] border border-[#00F0FF]/30 rounded-[3px] p-3 flex items-start gap-2.5 text-xs">
          <Info className="w-4 h-4 text-[#00F0FF] shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-slate-200">
            <span className="font-semibold text-[#00F0FF] font-mono">ENGINEERING INSIGHT: </span>
            <span className="font-sans text-slate-300">{insight}</span>
          </div>
        </div>
      )}

      {/* Expanded Laboratory DSO Scope Modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 select-none font-sans">
          <div className="w-full max-w-6xl max-h-[95vh] bg-[#1A1E29] border border-white/10 rounded-[4px] shadow-2xl p-5 flex flex-col overflow-hidden space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-[3px] bg-[#0B0F19] border border-[#00F0FF]/40 text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold font-mono text-white flex items-center gap-2">
                    <span>{title} — Expanded DSO View</span>
                    {clipped && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-[2px] bg-[#FF5722]/15 border border-[#FF5722]/50 text-[#FF5722]">
                        Clipped
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 font-sans">{subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="px-3 py-1.5 rounded-[3px] bg-[#111520] hover:bg-white/5 border border-white/10 text-slate-300 hover:text-white font-mono text-xs transition-colors cursor-pointer flex items-center gap-1.5 eng-focus"
                  title="Close expanded scope (Esc)"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Close (Esc)</span>
                </button>
              </div>
            </div>

            {/* Modal Scope Display (Deep Midnight Navy) */}
            <div className="flex-1 min-h-[380px] bg-[#0B0F19] rounded-[3px] border border-white/10 p-3 flex flex-col justify-center items-center overflow-x-auto relative">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto select-none cursor-crosshair max-w-5xl"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoverIndex(null)}
              >
                {/* Plot Background */}
                <rect
                  x={margin.left}
                  y={margin.top}
                  width={plotWidth}
                  height={plotHeight}
                  fill="#0B0F19"
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="1.5"
                  rx="2"
                />

                {/* Zero Reference Line */}
                <line
                  x1={margin.left}
                  y1={getY(0)}
                  x2={margin.left + plotWidth}
                  y2={getY(0)}
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {/* Y Ticks & Labels */}
                {yTicks.map((tick, idx) => (
                  <g key={`my-${idx}`}>
                    <line
                      x1={margin.left}
                      y1={tick.y}
                      x2={margin.left + plotWidth}
                      y2={tick.y}
                      stroke={Math.abs(tick.v) < 1e-4 ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)'}
                      strokeDasharray="2 2"
                      strokeWidth={Math.abs(tick.v) < 1e-4 ? 1.5 : 1}
                    />
                    <text
                      x={margin.left - 8}
                      y={tick.y + 4}
                      textAnchor="end"
                      className="text-[11px] fill-slate-400 font-mono"
                    >
                      {tick.label} V
                    </text>
                  </g>
                ))}

                {/* X Ticks & Labels */}
                {xTicks.map((tick, idx) => (
                  <g key={`mx-${idx}`}>
                    <line
                      x1={tick.x}
                      y1={margin.top}
                      x2={tick.x}
                      y2={margin.top + plotHeight}
                      stroke={idx === Math.round(xDivisions / 2) ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)'}
                      strokeDasharray="2 2"
                      strokeWidth={idx === Math.round(xDivisions / 2) ? 1.5 : 1}
                    />
                    <text
                      x={tick.x}
                      y={margin.top + plotHeight + 18}
                      textAnchor="middle"
                      className="text-[11px] fill-slate-400 font-mono"
                    >
                      {tick.label} {timeUnit}
                    </text>
                  </g>
                ))}

                {/* Rails in Subtle Amber Dashed Line */}
                {showRails && (
                  <g>
                    <line x1={margin.left} y1={getY(posVsat)} x2={margin.left + plotWidth} y2={getY(posVsat)} stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.65" />
                    <text x={margin.left + plotWidth - 6} y={getY(posVsat) - 5} textAnchor="end" className="text-[10px] font-mono fill-amber-400 font-bold">+Vsat ({cleanFloat(posVsat, 1)} V)</text>
                    <line x1={margin.left} y1={getY(negVsat)} x2={margin.left + plotWidth} y2={getY(negVsat)} stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.65" />
                    <text x={margin.left + plotWidth - 6} y={getY(negVsat) + 14} textAnchor="end" className="text-[10px] font-mono fill-amber-400 font-bold">-Vsat ({cleanFloat(negVsat, 1)} V)</text>
                  </g>
                )}

                {/* CH1 Trace (Input - Bright Neon Cyan #00F0FF with Phosphor Bloom) */}
                {(displayMode === 'both' || displayMode === 'input') && inPoints.length > 1 && (
                  <g>
                    <polyline points={inPoints.join(' ')} fill="none" stroke="#00F0FF" strokeWidth="6" strokeOpacity="0.25" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 6px rgba(0, 240, 255, 0.75))' }} />
                    <polyline points={inPoints.join(' ')} fill="none" stroke="#00F0FF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 2px #00F0FF)' }} />
                    <polyline points={inPoints.join(' ')} fill="none" stroke="#E0F7FA" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
                  </g>
                )}

                {/* CH2 Trace (Output - Vivid Neon Orange #FF5722 with Phosphor Bloom) */}
                {(displayMode === 'both' || displayMode === 'output') && outPoints.length > 1 && (
                  <g>
                    <polyline points={outPoints.join(' ')} fill="none" stroke="#FF5722" strokeWidth="6.5" strokeOpacity="0.28" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 7px rgba(255, 87, 34, 0.8))' }} />
                    <polyline points={outPoints.join(' ')} fill="none" stroke="#FF5722" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 2.5px #FF5722)' }} />
                    <polyline points={outPoints.join(' ')} fill="none" stroke="#FFEBE5" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
                  </g>
                )}

                {/* Interactive Mouse Cursor Crosshairs & DPO Digital Readout */}
                {hoverPoint && (
                  <g className="pointer-events-none select-none">
                    <line x1={hoverPoint.x} y1={margin.top} x2={hoverPoint.x} y2={margin.top + plotHeight} stroke="#00F0FF" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.55" />
                    {(displayMode === 'both' || displayMode === 'output') && (
                      <line x1={margin.left} y1={hoverPoint.yOut} x2={margin.left + plotWidth} y2={hoverPoint.yOut} stroke="#FF5722" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.55" />
                    )}
                    {(displayMode === 'both' || displayMode === 'input') && (
                      <line x1={margin.left} y1={hoverPoint.yIn} x2={margin.left + plotWidth} y2={hoverPoint.yIn} stroke="#00F0FF" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                    )}
                    {(displayMode === 'both' || displayMode === 'input') && (
                      <circle cx={hoverPoint.x} cy={hoverPoint.yIn} r="4.2" fill="#00F0FF" stroke="#FFFFFF" strokeWidth="1.5" />
                    )}
                    {(displayMode === 'both' || displayMode === 'output') && (
                      <circle cx={hoverPoint.x} cy={hoverPoint.yOut} r="4.5" fill="#FF5722" stroke="#FFFFFF" strokeWidth="1.5" />
                    )}
                    {(() => {
                      const boxW = 210;
                      const boxH = 74;
                      const boxX = hoverPoint.x + boxW + 15 > margin.left + plotWidth ? hoverPoint.x - boxW - 12 : hoverPoint.x + 12;
                      const boxY = Math.max(margin.top + 6, Math.min(hoverPoint.yOut - boxH / 2, margin.top + plotHeight - boxH - 6));
                      return (
                        <g transform={`translate(${boxX}, ${boxY})`}>
                          <rect x="0" y="0" width={boxW} height={boxH} rx="3" fill="#0B0F19" stroke="#00F0FF" strokeWidth="1.2" fillOpacity="0.95" style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.85))' }} />
                          <rect x="0" y="0" width={boxW} height="18" rx="3" fill="#1A1E29" />
                          <circle cx="8" cy="9" r="2.5" fill="#00F0FF" className="animate-pulse" />
                          <text x="16" y="12.5" fill="#94A3B8" fontSize="8" fontFamily="'Fira Code', monospace" fontWeight="700">DPO HARDWARE READOUT</text>
                          <text x="10" y="32" fill="#F8FAFC" fontSize="9.5" fontFamily="'Fira Code', monospace" fontWeight="600">Time:    <tspan fill="#F8FAFC">{cleanFloat(hoverPoint.t * timeScaleMultiplier, 3)} {timeUnit}</tspan></text>
                          <text x="10" y="47" fill="#00F0FF" fontSize="9.5" fontFamily="'Fira Code', monospace" fontWeight="700">CH1 Vin:  <tspan fill="#00F0FF">{cleanFloat(hoverPoint.vin, 3)} V</tspan></text>
                          <text x="10" y="62" fill="#FF5722" fontSize="9.5" fontFamily="'Fira Code', monospace" fontWeight="700">CH2 Vout: <tspan fill="#FF5722">{cleanFloat(hoverPoint.vout, 3)} V</tspan><tspan fill="#64748B" fontSize="8" dx="6">ΔV: {cleanFloat(hoverPoint.vout - hoverPoint.vin, 2)}V</tspan></text>
                        </g>
                      );
                    })()}
                  </g>
                )}
              </svg>
            </div>

            {/* Modal Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 font-mono text-xs shrink-0">
              <div className="bg-[#111520] p-2 rounded-[2px] border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Vin Peak</span>
                <span className="text-white font-bold">{cleanFloat(inMetrics.vPeak, 3)} V</span>
              </div>
              <div className="bg-[#111520] p-2 rounded-[2px] border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Vout Peak</span>
                <span className="text-[#00F0FF] font-bold">{cleanFloat(outMetrics.vPeak, 3)} V</span>
              </div>
              <div className="bg-[#111520] p-2 rounded-[2px] border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Gain (|Av|)</span>
                <span className="text-white font-bold">{cleanFloat(gain, 3)} ({cleanFloat(gainDb, 2)} dB)</span>
              </div>
              <div className="bg-[#111520] p-2 rounded-[2px] border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Phase Diff</span>
                <span className="text-white font-bold">{cleanFloat(phaseDiffDeg, 1)}°</span>
              </div>
              <div className="bg-[#111520] p-2 rounded-[2px] border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Frequency</span>
                <span className="text-white font-bold">{formatFrequency(inMetrics.frequency)}</span>
              </div>
              <div className={`p-2 rounded-[2px] border ${clipped ? 'bg-[#FF5722]/15 border-[#FF5722]/60 text-[#FF5722]' : 'bg-[#111520] border-white/10 text-[#00F0FF]'}`}>
                <span className="text-[10px] uppercase tracking-wider block text-slate-400">State</span>
                <span className="font-bold">{clipped ? 'Clipped' : 'Linear'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
