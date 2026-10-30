import React, { useState } from 'react';
import { cleanFloat, formatVoltage } from '../../utils/formatters';

interface WaveformScopeProps {
  vinPeak: number;
  voutPeak: number;
  frequencyHz?: number;
}

export const WaveformScope: React.FC<WaveformScopeProps> = ({
  vinPeak,
  voutPeak,
  frequencyHz = 1000,
}) => {
  const [timeDiv, setTimeDiv] = useState<number>(0.5); // ms/div
  const [vDivCh1, setVDivCh1] = useState<number>(1);   // V/div for Vin
  const [vDivCh2, setVDivCh2] = useState<number>(5);   // V/div for Vout
  const [ch1Visible, setCh1Visible] = useState(true);
  const [ch2Visible, setCh2Visible] = useState(true);

  // Oscilloscope dimensions: 10 horizontal divisions, 8 vertical divisions
  const width = 640;
  const height = 280;
  const numGridX = 10;
  const numGridY = 8;
  const cellWidth = width / numGridX;
  const cellHeight = height / numGridY;
  const centerY = height / 2;

  // Generate waveform points
  const points = 200;
  const totalTimeSec = (timeDiv * numGridX) / 1000; // total displayed time
  const omega = 2 * Math.PI * frequencyHz;

  // CH1: Vin(t) = Vin * sin(omega * t)
  // CH2: Vout(t) = Vout * sin(omega * t + pi) = -Vout * sin(omega * t)
  const ch1Path: string[] = [];
  const ch2Path: string[] = [];

  for (let i = 0; i <= points; i++) {
    const t = (i / points) * totalTimeSec;
    const x = (i / points) * width;

    // Vin
    const vinVal = vinPeak * Math.sin(omega * t);
    const y1 = centerY - (vinVal / vDivCh1) * cellHeight;
    ch1Path.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y1.toFixed(1)}`);

    // Vout (180 deg phase shifted)
    const voutVal = -voutPeak * Math.sin(omega * t);
    const y2 = centerY - (voutVal / vDivCh2) * cellHeight;
    ch2Path.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y2.toFixed(1)}`);
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-[#070b13] p-4 text-xs font-mono">
      {/* Top Scope Status */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 mb-3 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold">OSCILLOSCOPE</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">Dual Trace Transient Response</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={ch1Visible}
              onChange={(e) => setCh1Visible(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
            />
            <span className="w-2.5 h-0.5 bg-cyan-400 inline-block"></span>
            <span className="text-cyan-400">CH1: Vin ({formatVoltage(vinPeak)} pk)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={ch2Visible}
              onChange={(e) => setCh2Visible(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
            />
            <span className="w-2.5 h-0.5 bg-amber-400 inline-block"></span>
            <span className="text-amber-400">CH2: Vout ({formatVoltage(Math.abs(voutPeak))} pk, 180° inv)</span>
          </label>
        </div>
      </div>

      {/* Scope Screen */}
      <div className="relative w-full overflow-hidden rounded border border-slate-800/90 bg-[#040810]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* Background Grid */}
          <defs>
            <pattern id="scope-grid" width={cellWidth} height={cellHeight} patternUnits="userSpaceOnUse">
              <path
                d={`M ${cellWidth} 0 L 0 0 0 ${cellHeight}`}
                fill="none"
                stroke="#131e33"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width={width} height={height} fill="url(#scope-grid)" />

          {/* Subdivisions on center axes */}
          <line x1="0" y1={centerY} x2={width} y2={centerY} stroke="#1e293b" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1={width / 2} y1="0" x2={width / 2} y2={height} stroke="#1e293b" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Waveforms */}
          {ch1Visible && (
            <path
              d={ch1Path.join(' ')}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}

          {ch2Visible && (
            <path
              d={ch2Path.join(' ')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* Floating Readouts */}
        <div className="absolute top-2 left-2 bg-[#0a101d]/90 px-2 py-1 rounded border border-slate-800 text-[10px] text-slate-400 space-y-0.5">
          <div>Freq: <span className="text-slate-200">1.00 kHz</span></div>
          <div>Phase: <span className="text-amber-400">180.0° (Opposite phase)</span></div>
        </div>
      </div>

      {/* Control Dials / Buttons */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <div className="bg-[#0b1120] p-2 rounded border border-slate-800/60 flex items-center justify-between">
          <span className="text-slate-400">Time / Div:</span>
          <select
            value={timeDiv}
            onChange={(e) => setTimeDiv(parseFloat(e.target.value))}
            className="bg-[#141d33] text-cyan-300 rounded px-1.5 py-0.5 border border-slate-700"
          >
            <option value={0.2}>0.2 ms</option>
            <option value={0.5}>0.5 ms</option>
            <option value={1.0}>1.0 ms</option>
            <option value={2.0}>2.0 ms</option>
          </select>
        </div>

        <div className="bg-[#0b1120] p-2 rounded border border-slate-800/60 flex items-center justify-between">
          <span className="text-cyan-400">CH1 Volt/Div:</span>
          <select
            value={vDivCh1}
            onChange={(e) => setVDivCh1(parseFloat(e.target.value))}
            className="bg-[#141d33] text-cyan-300 rounded px-1.5 py-0.5 border border-slate-700"
          >
            <option value={0.5}>0.5 V</option>
            <option value={1}>1.0 V</option>
            <option value={2}>2.0 V</option>
            <option value={5}>5.0 V</option>
          </select>
        </div>

        <div className="bg-[#0b1120] p-2 rounded border border-slate-800/60 flex items-center justify-between">
          <span className="text-amber-400">CH2 Volt/Div:</span>
          <select
            value={vDivCh2}
            onChange={(e) => setVDivCh2(parseFloat(e.target.value))}
            className="bg-[#141d33] text-amber-300 rounded px-1.5 py-0.5 border border-slate-700"
          >
            <option value={1}>1.0 V</option>
            <option value={2}>2.0 V</option>
            <option value={5}>5.0 V</option>
            <option value={10}>10.0 V</option>
            <option value={20}>20.0 V</option>
          </select>
        </div>
      </div>
    </div>
  );
};
