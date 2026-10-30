import React, { useState } from 'react';
import { generateFrequencyResponse, BodePoint } from '../../calculations/activeFilter';
import { cleanFloat, formatFrequency } from '../../utils/formatters';
import { BarChart2 } from 'lucide-react';

interface BodePlotGraphProps {
  fc: number;
  passbandGain: number;
  testFreq: number;
  filterType: 'low-pass' | 'high-pass';
}

export const BodePlotGraph: React.FC<BodePlotGraphProps> = ({
  fc,
  passbandGain,
  testFreq,
  filterType,
}) => {
  // View mode: 'dual' | 'magnitude' | 'phase'
  const [bodeMode, setBodeMode] = useState<'dual' | 'magnitude' | 'phase'>('dual');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const points = generateFrequencyResponse(fc, passbandGain, filterType);

  // SVG dimensions: 16:9 widescreen or dual layout
  const svgWidth = 800;
  const isDual = bodeMode === 'dual';
  const svgHeight = isDual ? 450 : 320;
  const padLeft = 65;
  const padRight = 35;
  const padTop = 32;
  const padBottom = 48;

  const plotWidth = svgWidth - padLeft - padRight;
  const singlePlotHeight = isDual ? (svgHeight - padTop - padBottom - 30) / 2 : svgHeight - padTop - padBottom;

  // X-axis: 4 decades: from 0.01 * fc to 100 * fc
  const minFreqRatio = 0.01;
  const maxFreqRatio = 100;
  const minLog = Math.log10(minFreqRatio); // -2
  const maxLog = Math.log10(maxFreqRatio); // +2
  const logRange = maxLog - minLog;        // 4 decades

  const getX = (ratio: number) => {
    const clamped = Math.max(minFreqRatio, Math.min(maxFreqRatio, ratio));
    const logVal = Math.log10(clamped);
    return padLeft + ((logVal - minLog) / logRange) * plotWidth;
  };

  // Magnitude Y-axis: dB gain
  const passbandDb = 20 * Math.log10(Math.max(passbandGain, 1e-4));
  const minDb = Math.floor((passbandDb - 35) / 10) * 10;
  const maxDb = Math.ceil((passbandDb + 10) / 10) * 10;
  const dbRange = Math.max(maxDb - minDb, 20);

  const getMagY = (db: number, topOffset: number = padTop, height: number = singlePlotHeight) => {
    const clamped = Math.max(minDb, Math.min(maxDb, db));
    return topOffset + height - ((clamped - minDb) / dbRange) * height;
  };

  // Phase Y-axis: degrees (-100° to +10° for LPF, -10° to +100° for HPF)
  const minPhase = filterType === 'low-pass' ? -100 : -10;
  const maxPhase = filterType === 'low-pass' ? 10 : 100;
  const phaseRange = maxPhase - minPhase;

  const getPhaseY = (deg: number, topOffset: number = padTop, height: number = singlePlotHeight) => {
    const clamped = Math.max(minPhase, Math.min(maxPhase, deg));
    return topOffset + height - ((clamped - minPhase) / phaseRange) * height;
  };

  // Top offsets for plots
  const magPlotTop = padTop;
  const phasePlotTop = isDual ? padTop + singlePlotHeight + 30 : padTop;

  // Paths
  const magPath = points.reduce((acc, pt, idx) => {
    const x = getX(pt.freqRatio);
    const y = getMagY(pt.gainDb, magPlotTop, singlePlotHeight);
    return idx === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }, '');

  const phasePath = points.reduce((acc, pt, idx) => {
    const x = getX(pt.freqRatio);
    const y = getPhaseY(pt.phaseDeg, phasePlotTop, singlePlotHeight);
    return idx === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }, '');

  // Test point coordinates
  const testRatio = testFreq / fc;
  const testX = getX(testRatio);

  let testGainMag = 0;
  let testPhaseDeg = 0;
  if (filterType === 'low-pass') {
    testGainMag = passbandGain / Math.sqrt(1 + Math.pow(testRatio, 2));
    testPhaseDeg = -(Math.atan(testRatio) * 180) / Math.PI;
  } else {
    testGainMag = (passbandGain * testRatio) / Math.sqrt(1 + Math.pow(testRatio, 2));
    testPhaseDeg = 90 - (Math.atan(testRatio) * 180) / Math.PI;
  }
  const testDb = 20 * Math.log10(Math.max(testGainMag, 1e-9));
  const testMagY = getMagY(testDb, magPlotTop, singlePlotHeight);
  const testPhaseY = getPhaseY(testPhaseDeg, phasePlotTop, singlePlotHeight);

  // Decades
  const decades = [0.01, 0.1, 1, 10, 100];
  const fcX = getX(1.0);
  const fcCutoffDb = passbandDb - 3.01;
  const fcMagY = getMagY(fcCutoffDb, magPlotTop, singlePlotHeight);
  const fcPhaseDeg = filterType === 'low-pass' ? -45 : 45;
  const fcPhaseY = getPhaseY(fcPhaseDeg, phasePlotTop, singlePlotHeight);

  // Y-axis ticks for Magnitude
  const yMagTicks: number[] = [];
  for (let db = minDb; db <= maxDb; db += 10) {
    yMagTicks.push(db);
  }

  // Y-axis ticks for Phase
  const yPhaseTicks = filterType === 'low-pass' ? [0, -22.5, -45, -67.5, -90] : [90, 67.5, 45, 22.5, 0];

  // Hover Point Handling
  const hoverPoint =
    hoverIndex !== null && hoverIndex >= 0 && hoverIndex < points.length
      ? {
          ...points[hoverIndex],
          x: getX(points[hoverIndex].freqRatio),
          yMag: getMagY(points[hoverIndex].gainDb, magPlotTop, singlePlotHeight),
          yPhase: getPhaseY(points[hoverIndex].phaseDeg, phasePlotTop, singlePlotHeight),
        }
      : null;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * svgWidth;
    if (relX >= padLeft && relX <= padLeft + plotWidth) {
      const frac = (relX - padLeft) / plotWidth;
      const targetLog = minLog + frac * logRange;
      const targetRatio = Math.pow(10, targetLog);

      // Find closest point by freqRatio
      let bestIdx = 0;
      let minDiff = Infinity;
      for (let i = 0; i < points.length; i++) {
        const diff = Math.abs(points[i].freqRatio - targetRatio);
        if (diff < minDiff) {
          minDiff = diff;
          bestIdx = i;
        }
      }
      setHoverIndex(bestIdx);
    } else {
      setHoverIndex(null);
    }
  };

  return (
    <div className="flex flex-col h-full w-full rounded-[4px] border border-white/10 bg-[#1A1E29] p-3 sm:p-4 text-xs font-mono shadow-md space-y-3">
      {/* Header controls & legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-[#00F0FF]" />
          <span className="font-mono text-[#00F0FF] font-bold uppercase tracking-wider">
            Bode DPO Frequency Response
          </span>
          <span className="text-white/20">/</span>
          <span className="text-slate-300 font-mono text-[11px]">
            {filterType === 'low-pass'
              ? 'Low Pass (fc = ' + formatFrequency(fc) + ')'
              : 'High Pass (fc = ' + formatFrequency(fc) + ')'}
          </span>
        </div>

        {/* View Mode Buttons */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <div className="flex items-center bg-[#0B0F19] rounded-[3px] p-0.5 border border-white/10">
            <button
              onClick={() => setBodeMode('dual')}
              className={`px-2.5 py-1 rounded-[2px] transition ${
                bodeMode === 'dual'
                  ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Dual (Mag + Phase)
            </button>
            <button
              onClick={() => setBodeMode('magnitude')}
              className={`px-2.5 py-1 rounded-[2px] transition ${
                bodeMode === 'magnitude'
                  ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Magnitude Only
            </button>
            <button
              onClick={() => setBodeMode('phase')}
              className={`px-2.5 py-1 rounded-[2px] transition ${
                bodeMode === 'phase'
                  ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Phase Only
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas (DPO Widescreen Graticule Display) */}
      <div className="relative w-full overflow-hidden flex justify-center py-0.5 rounded-[3px] border border-white/10 bg-[#0B0F19]">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none cursor-crosshair"
          style={{ minWidth: '460px', backgroundColor: '#0B0F19' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <pattern id="bode-dpo-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.6" fill="rgba(0, 240, 255, 0.08)" />
            </pattern>
          </defs>

          {/* 1. MAGNITUDE PLOT */}
          {(bodeMode === 'dual' || bodeMode === 'magnitude') && (
            <g>
              {/* Background */}
              <rect
                x={padLeft}
                y={magPlotTop}
                width={plotWidth}
                height={singlePlotHeight}
                fill="#0B0F19"
                stroke="rgba(0, 240, 255, 0.15)"
                strokeWidth="1.2"
                rx="2"
              />
              <rect
                x={padLeft}
                y={magPlotTop}
                width={plotWidth}
                height={singlePlotHeight}
                fill="url(#bode-dpo-grid)"
                opacity="0.85"
              />

              {/* Title label */}
              <text x={padLeft + 10} y={magPlotTop + 18} className="text-[11px] font-mono fill-[#00F0FF] font-bold">
                MAGNITUDE RESPONSE |H(f)| (dB) [Neon Cyan]
              </text>

              {/* Y Gridlines and Labels (dB) */}
              {yMagTicks.map((db, idx) => {
                const y = getMagY(db, magPlotTop, singlePlotHeight);
                return (
                  <g key={`ymag-${idx}`}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={padLeft + plotWidth}
                      y2={y}
                      stroke="rgba(0, 240, 255, 0.08)"
                      strokeDasharray="2 2"
                      strokeWidth="1"
                    />
                    <text x={padLeft - 8} y={y + 3.5} textAnchor="end" className="text-[9.5px] font-mono fill-slate-400">
                      {db} dB
                    </text>
                  </g>
                );
              })}

              {/* X Decade Gridlines */}
              {decades.map((dec, idx) => {
                const x = getX(dec);
                return (
                  <g key={`xdec-mag-${idx}`}>
                    <line
                      x1={x}
                      y1={magPlotTop}
                      x2={x}
                      y2={magPlotTop + singlePlotHeight}
                      stroke={dec === 1 ? 'rgba(0, 240, 255, 0.28)' : 'rgba(0, 240, 255, 0.08)'}
                      strokeDasharray={dec === 1 ? '4 2' : '2 2'}
                      strokeWidth={dec === 1 ? '1.4' : '1'}
                    />
                  </g>
                );
              })}

              {/* fc Cutoff marker (vertical dashed line) */}
              <line
                x1={fcX}
                y1={magPlotTop}
                x2={fcX}
                y2={magPlotTop + singlePlotHeight}
                stroke="#FF5722"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Magnitude curve with DPO Phosphor Glow */}
              <path
                d={magPath}
                fill="none"
                stroke="#00F0FF"
                strokeWidth="6"
                strokeOpacity="0.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 0 6px rgba(0, 240, 255, 0.75))' }}
              />
              <path
                d={magPath}
                fill="none"
                stroke="#00F0FF"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 0 2px #00F0FF)' }}
              />
              <path
                d={magPath}
                fill="none"
                stroke="#E0F7FA"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.85"
              />

              {/* Cutoff point highlight circle (-3 dB) */}
              <circle cx={fcX} cy={fcMagY} r="5" fill="#FF5722" stroke="#FFFFFF" strokeWidth="1.5" />
              <g transform={`translate(${fcX + 6}, ${fcMagY - 8})`}>
                <rect x="0" y="-12" width="70" height="18" rx="2" fill="#0B0F19" stroke="#FF5722" strokeWidth="1" />
                <text x="35" y="0" textAnchor="middle" className="text-[9px] font-mono fill-[#FF5722] font-bold">
                  fc: -3 dB
                </text>
              </g>

              {/* Operating Test Point Marker */}
              <line
                x1={testX}
                y1={magPlotTop}
                x2={testX}
                y2={magPlotTop + singlePlotHeight}
                stroke="#10B981"
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />
              <circle cx={testX} cy={testMagY} r="5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
            </g>
          )}

          {/* 2. PHASE PLOT */}
          {(bodeMode === 'dual' || bodeMode === 'phase') && (
            <g>
              {/* Background */}
              <rect
                x={padLeft}
                y={phasePlotTop}
                width={plotWidth}
                height={singlePlotHeight}
                fill="#0B0F19"
                stroke="rgba(0, 240, 255, 0.15)"
                strokeWidth="1.2"
                rx="2"
              />
              <rect
                x={padLeft}
                y={phasePlotTop}
                width={plotWidth}
                height={singlePlotHeight}
                fill="url(#bode-dpo-grid)"
                opacity="0.85"
              />

              {/* Title label */}
              <text x={padLeft + 10} y={phasePlotTop + 18} className="text-[11px] font-mono fill-[#FF5722] font-bold">
                PHASE RESPONSE ∠H(f) (DEGREES) [Neon Orange]
              </text>

              {/* Y Gridlines and Labels (Degrees) */}
              {yPhaseTicks.map((deg, idx) => {
                const y = getPhaseY(deg, phasePlotTop, singlePlotHeight);
                return (
                  <g key={`yphase-${idx}`}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={padLeft + plotWidth}
                      y2={y}
                      stroke="rgba(0, 240, 255, 0.08)"
                      strokeDasharray="2 2"
                      strokeWidth="1"
                    />
                    <text x={padLeft - 8} y={y + 3.5} textAnchor="end" className="text-[9.5px] font-mono fill-slate-400">
                      {cleanFloat(deg, 1)}°
                    </text>
                  </g>
                );
              })}

              {/* X Decade Gridlines and Frequency Axis Labels */}
              {decades.map((dec, idx) => {
                const x = getX(dec);
                const actualFreq = dec * fc;
                return (
                  <g key={`xdec-phase-${idx}`}>
                    <line
                      x1={x}
                      y1={phasePlotTop}
                      x2={x}
                      y2={phasePlotTop + singlePlotHeight}
                      stroke={dec === 1 ? 'rgba(0, 240, 255, 0.28)' : 'rgba(0, 240, 255, 0.08)'}
                      strokeDasharray={dec === 1 ? '4 2' : '2 2'}
                      strokeWidth={dec === 1 ? '1.4' : '1'}
                    />
                    <text
                      x={x}
                      y={phasePlotTop + singlePlotHeight + 16}
                      textAnchor="middle"
                      className="text-[9.5px] font-mono fill-slate-400"
                    >
                      {formatFrequency(actualFreq)}
                    </text>
                    <text
                      x={x}
                      y={phasePlotTop + singlePlotHeight + 28}
                      textAnchor="middle"
                      className="text-[8.5px] font-mono fill-slate-500"
                    >
                      ({dec === 1 ? 'fc' : `${dec}fc`})
                    </text>
                  </g>
                );
              })}

              {/* fc Cutoff marker (vertical dashed line) */}
              <line
                x1={fcX}
                y1={phasePlotTop}
                x2={fcX}
                y2={phasePlotTop + singlePlotHeight}
                stroke="#FF5722"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Phase curve with Neon Orange Phosphor Glow */}
              <path
                d={phasePath}
                fill="none"
                stroke="#FF5722"
                strokeWidth="6.5"
                strokeOpacity="0.28"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 0 7px rgba(255, 87, 34, 0.8))' }}
              />
              <path
                d={phasePath}
                fill="none"
                stroke="#FF5722"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 0 2.5px #FF5722)' }}
              />
              <path
                d={phasePath}
                fill="none"
                stroke="#FFEBE5"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />

              {/* Cutoff point highlight circle (-45° or +45°) */}
              <circle cx={fcX} cy={fcPhaseY} r="5" fill="#FF5722" stroke="#FFFFFF" strokeWidth="1.5" />
              <g transform={`translate(${fcX + 6}, ${fcPhaseY - 8})`}>
                <rect x="0" y="-12" width="70" height="18" rx="2" fill="#0B0F19" stroke="#FF5722" strokeWidth="1" />
                <text x="35" y="0" textAnchor="middle" className="text-[9px] font-mono fill-[#FF5722] font-bold">
                  fc: {cleanFloat(fcPhaseDeg, 0)}°
                </text>
              </g>

              {/* Operating Test Point Marker */}
              <line
                x1={testX}
                y1={phasePlotTop}
                x2={testX}
                y2={phasePlotTop + singlePlotHeight}
                stroke="#10B981"
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />
              <circle cx={testX} cy={testPhaseY} r="5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
            </g>
          )}

          {/* Precision Interactive Crosshairs & Reticle */}
          {hoverPoint && (
            <g>
              {/* Vertical Frequency Crosshair Line across all active plots */}
              <line
                x1={hoverPoint.x}
                y1={padTop}
                x2={hoverPoint.x}
                y2={padTop + (isDual ? singlePlotHeight * 2 + 30 : singlePlotHeight)}
                stroke="rgba(255, 255, 255, 0.45)"
                strokeDasharray="3 3"
                strokeWidth="1.2"
              />

              {/* Horizontal Crosshair for Magnitude */}
              {(bodeMode === 'dual' || bodeMode === 'magnitude') && (
                <>
                  <line
                    x1={padLeft}
                    y1={hoverPoint.yMag}
                    x2={padLeft + plotWidth}
                    y2={hoverPoint.yMag}
                    stroke="rgba(0, 240, 255, 0.45)"
                    strokeDasharray="2 2"
                    strokeWidth="1"
                  />
                  <circle
                    cx={hoverPoint.x}
                    cy={hoverPoint.yMag}
                    r="5"
                    fill="#00F0FF"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                </>
              )}

              {/* Horizontal Crosshair for Phase */}
              {(bodeMode === 'dual' || bodeMode === 'phase') && (
                <>
                  <line
                    x1={padLeft}
                    y1={hoverPoint.yPhase}
                    x2={padLeft + plotWidth}
                    y2={hoverPoint.yPhase}
                    stroke="rgba(255, 87, 34, 0.45)"
                    strokeDasharray="2 2"
                    strokeWidth="1"
                  />
                  <circle
                    cx={hoverPoint.x}
                    cy={hoverPoint.yPhase}
                    r="5"
                    fill="#FF5722"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                </>
              )}

              {/* Floating Monospace Digital Readout Tooltip */}
              {(() => {
                const boxW = 185;
                const boxH = 75;
                let boxX = hoverPoint.x + 12;
                if (boxX + boxW > padLeft + plotWidth) {
                  boxX = hoverPoint.x - boxW - 12;
                }
                const boxY = Math.min(
                  padTop + (isDual ? singlePlotHeight * 2 + 30 : singlePlotHeight) - boxH - 6,
                  Math.max(padTop + 6, hoverPoint.yMag - 25)
                );

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
                      Freq: <tspan className="fill-white font-bold">{formatFrequency(hoverPoint.freq)}</tspan>
                    </text>
                    <text x="8" y="44" className="text-[10px] font-mono fill-[#00F0FF]">
                      |H(f)|: <tspan className="font-bold">{cleanFloat(hoverPoint.gainDb, 2)} dB</tspan> ({cleanFloat(hoverPoint.gainMag, 3)}×)
                    </text>
                    <text x="8" y="58" className="text-[10px] font-mono fill-[#FF5722]">
                      Phase φ: <tspan className="font-bold">{cleanFloat(hoverPoint.phaseDeg, 1)}°</tspan>
                    </text>
                    <text x="8" y="70" className="text-[9px] font-mono fill-slate-400">
                      f/fc: {cleanFloat(hoverPoint.freqRatio, 3)}
                    </text>
                  </g>
                );
              })()}
            </g>
          )}

          {/* Operating Point Indicator Badge (Test Signal) */}
          <g transform={`translate(${Math.min(testX + 10, svgWidth - 170)}, ${magPlotTop + 30})`}>
            <rect x="0" y="0" width="160" height="46" rx="3" fill="#0B0F19" stroke="#10B981" strokeWidth="1" opacity="0.95" />
            <text x="8" y="14" className="text-[9px] font-mono fill-emerald-400 font-bold">
              OPERATING TEST POINT: {formatFrequency(testFreq)}
            </text>
            <text x="8" y="27" className="text-[9.5px] font-mono fill-[#00F0FF]">
              |H(f)| = {cleanFloat(testGainMag, 3)} ({cleanFloat(testDb, 1)} dB)
            </text>
            <text x="8" y="40" className="text-[9.5px] font-mono fill-[#FF5722]">
              Phase φ = {cleanFloat(testPhaseDeg, 1)}°
            </text>
          </g>
        </svg>
      </div>

      {/* Legend & Educational Summary */}
      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-white/10 text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-[#00F0FF]">
            <span className="w-3.5 h-1 rounded-full bg-[#00F0FF] inline-block shadow-[0_0_6px_rgba(0,240,255,0.8)]"></span>
            <span className="font-semibold">Magnitude |H(f)| (Neon Cyan)</span>
          </span>
          <span className="flex items-center gap-1.5 text-[#FF5722]">
            <span className="w-3.5 h-1 rounded-full bg-[#FF5722] inline-block shadow-[0_0_6px_rgba(255,87,34,0.8)]"></span>
            <span className="font-semibold">Phase ∠H(f) (Neon Orange)</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-300">
            <span className="w-2 h-2 rounded-full border border-amber-400 bg-amber-400/40 inline-block"></span>
            <span>Cutoff fc (-3 dB / {filterType === 'low-pass' ? '-45°' : '+45°'})</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
            <span>Operating Test Point</span>
          </span>
        </div>
      </div>
    </div>
  );
};
