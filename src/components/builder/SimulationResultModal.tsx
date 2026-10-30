import React from 'react';
import { BuilderSimulationOutput } from './simulationAdapter';
import { UniversalWaveformScope } from '../circuit/UniversalWaveformScope';
import {
  X,
  Sparkles,
  Cpu,
  CheckCircle2,
  BookOpen,
  Sliders
} from 'lucide-react';

interface SimulationResultModalProps {
  simulationOutput: BuilderSimulationOutput | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SimulationResultModal: React.FC<SimulationResultModalProps> = ({
  simulationOutput,
  isOpen,
  onClose
}) => {
  if (!isOpen || !simulationOutput) return null;

  const { topology, summaryMetrics, derivationSteps, simulationResult } = simulationOutput;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-xl border border-slate-800 bg-[#090e1a] shadow-2xl overflow-hidden font-mono">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 bg-[#070b14] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Simulation &amp; Analytical Verification
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold">
                  {topology.displayName}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Mapped from actual visual circuit netlist into OPTI-SIM core simulation engine.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 1. Summary Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {summaryMetrics.map((metric, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-[#070b14] border border-slate-800 space-y-1"
              >
                <div className="text-[10.5px] text-slate-400 font-medium">
                  {metric.label}
                </div>
                <div className="text-lg font-bold text-cyan-300 font-mono">
                  {metric.value} <span className="text-xs text-slate-400 font-normal">{metric.unit}</span>
                </div>
                {metric.description && (
                  <div className="text-[10px] text-slate-500 line-clamp-1">
                    {metric.description}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 2. Step-by-Step Mathematical Derivations */}
          <div className="p-3.5 rounded-lg bg-[#070b14] border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Analytical Mathematical Derivations:</span>
            </div>
            <div className="space-y-1 pl-2 border-l-2 border-cyan-500/40 text-xs text-slate-300 font-mono">
              {derivationSteps.map((step, idx) => (
                <div key={idx} className="py-0.5">
                  {step}
                </div>
              ))}
            </div>
          </div>

          {/* 3. Dual-Trace Oscilloscope & Dynamic Waveform Analyzer */}
          <div className="rounded-lg overflow-hidden border border-slate-800 bg-[#070b14]">
            <UniversalWaveformScope
              simulation={simulationResult}
              title={`${topology.displayName.toUpperCase()} DUAL-TRACE OSCILLOSCOPE`}
              subtitle="Real-Time Input vs Output Waveform Response (Time-Domain Simulation)"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-[#070b14] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mathematical calculations and waveforms computed directly by OPTI-SIM analytical simulation engine.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
