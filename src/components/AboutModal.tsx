import React from 'react';
import { X, Cpu, Award, BookCheck, Shield } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdmin?: () => void;
  onOpenLanding?: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, onOpenAdmin, onOpenLanding }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-xl rounded-[3px] border border-white/10 bg-[#1A1E29] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-[3px] bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF]">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white font-mono">
                ABOUT OPTI-SIM
              </h2>
              <p className="text-xs text-slate-400">
                Interactive Op-Amp Circuit Simulator & Analysis Tool
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[3px] text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
          <div className="p-3 rounded-[3px] bg-[#111520] border border-[#00F0FF]/30 text-white">
            <p className="font-medium">
              OPTI-SIM is an academic engineering software tool engineered for 2nd-year
              Electronics and Telecommunication Engineering (ENTC) students and faculty.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-mono text-[#00F0FF] font-semibold text-xs uppercase tracking-wider">
              Project Purpose & Scope
            </h4>
            <p className="text-slate-400">
              Provides rigorous theoretical derivations, step-by-step mathematical calculations,
              interactive vector circuit schematics, and transient waveform analysis for operational
              amplifiers across linear, non-linear, and data conversion circuits.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
            <div className="p-2.5 rounded-[3px] bg-[#111520] border border-white/10">
              <div className="text-slate-400">Domain</div>
              <div className="text-white font-semibold mt-0.5">Linear & Non-Linear ICs</div>
            </div>
            <div className="p-2.5 rounded-[3px] bg-[#111520] border border-white/10">
              <div className="text-slate-400">Target Curriculum</div>
              <div className="text-white font-semibold mt-0.5">ENTC Year 2 / Semester 4</div>
            </div>
            <div className="p-2.5 rounded-[3px] bg-[#111520] border border-white/10">
              <div className="text-slate-400">Active Modules</div>
              <div className="text-[#00F0FF] font-semibold mt-0.5">17 Active (Linear, Non-Linear & Data Conversion)</div>
            </div>
            <div className="p-2.5 rounded-[3px] bg-[#111520] border border-white/10">
              <div className="text-slate-400">Execution Runtime</div>
              <div className="text-emerald-400 font-semibold mt-0.5">Client-Side Browser (Zero-Latency)</div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-3 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Electronics & Telecommunication Engg</span>
            <span className="text-slate-400">© 2026 OPTI-SIM</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onOpenLanding && (
              <button
                onClick={onOpenLanding}
                className="px-3 py-1.5 rounded-[3px] bg-[#111520] hover:bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-xs font-mono text-[#00F0FF] transition-colors cursor-pointer"
              >
                Welcome Screen
              </button>
            )}
            {onOpenAdmin && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                className="px-3 py-1.5 rounded-[3px] bg-[#111520] hover:bg-[#FF5722]/15 border border-[#FF5722]/40 text-xs font-mono text-[#FF5722] transition-colors cursor-pointer"
              >
                Admin Console
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-[3px] bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-xs font-bold text-[#0B0F19] font-mono shadow-[0_0_8px_rgba(0,240,255,0.25)] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
