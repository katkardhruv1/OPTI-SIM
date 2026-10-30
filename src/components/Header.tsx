import React from 'react';
import { Cpu, FlaskConical, Sliders, CircuitBoard, Volume2, VolumeX, Terminal, User } from 'lucide-react';
import { useAudioFeedback } from '../utils/audioFeedback';
import { StudentProfile } from '../types/student';

export type AppMode = 'simulator' | 'lab' | 'builder';

interface HeaderProps {
  activeMode?: AppMode;
  onSelectMode?: (mode: AppMode) => void;
  isLabMode?: boolean;
  onToggleLabMode?: () => void;
  onOpenHistory?: () => void;
  onOpenDoc?: () => void;
  onOpenAbout?: () => void;
  onGoHome: () => void;
  onGoLogin?: () => void;
  studentProfile?: StudentProfile | null;
  onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeMode = 'simulator',
  onSelectMode,
  isLabMode,
  onToggleLabMode,
  onGoHome,
  onGoLogin,
  studentProfile,
  onOpenAdmin,
}) => {
  const { isMuted, toggleMute } = useAudioFeedback();

  // Normalize current mode
  const currentMode: AppMode = onSelectMode
    ? activeMode
    : isLabMode
    ? 'lab'
    : 'simulator';

  const handleSelectMode = (mode: AppMode) => {
    if (onSelectMode) {
      onSelectMode(mode);
    } else if (onToggleLabMode) {
      if ((mode === 'lab' && !isLabMode) || (mode !== 'lab' && isLabMode)) {
        onToggleLabMode();
      }
    }
  };

  return (
    <header className="h-14 border-b border-white/10 bg-[#1A1E29] px-4 md:px-6 flex items-center justify-between shrink-0 select-none z-30">
      {/* Brand & Wordmark */}
      <div className="flex items-center gap-3">
        <button
          onClick={onGoHome}
          className="flex items-center gap-2.5 text-left group focus:outline-hidden cursor-pointer"
        >
          <div className="w-8 h-8 rounded-[3px] bg-[#0B0F19] border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF] group-hover:border-[#00F0FF] group-hover:shadow-[0_0_12px_rgba(0,240,255,0.35)] transition-all">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold tracking-tight text-white text-base">
                OPTI-SIM
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono text-[#00F0FF] font-semibold px-1.5 py-0.5 rounded-[2px] border border-[#00F0FF]/30 bg-[#00F0FF]/10">
                PRO-ENG
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block leading-tight font-sans">
              Interactive op-amp circuit simulator
            </p>
          </div>
        </button>

        {studentProfile ? (
          <div className="hidden lg:flex items-center gap-2 ml-2">
            <div
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[#0B0F19] border border-white/10 hover:border-[#00F0FF]/40 text-slate-300 hover:text-white transition cursor-pointer"
              title={`Registered Student: ${studentProfile.fullName} (Roll: ${studentProfile.rollNumber}, Div: ${studentProfile.division}) • Click to open Admin Dashboard`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_6px_#10B981]" />
              <span className="text-[11px] font-mono font-semibold text-white max-w-[130px] truncate">
                {studentProfile.fullName}
              </span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 font-bold">
                {studentProfile.division}-{studentProfile.rollNumber}
              </span>
            </div>

            {onGoLogin && (
              <button
                type="button"
                onClick={onGoLogin}
                className="px-2 py-1 rounded-[3px] text-[10px] font-mono text-slate-400 hover:text-[#00F0FF] hover:bg-white/5 border border-transparent hover:border-white/10 transition cursor-pointer"
                title="Switch student identity / Return to Login Page"
              >
                Switch
              </button>
            )}
          </div>
        ) : (
          onGoLogin && (
            <button
              type="button"
              onClick={onGoLogin}
              className="hidden sm:flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-[3px] bg-[#00F0FF]/10 border border-[#00F0FF]/30 hover:bg-[#00F0FF]/20 text-[#00F0FF] text-[11px] font-mono font-bold transition cursor-pointer"
            >
              <User className="w-3 h-3" />
              <span>Student Login</span>
            </button>
          )
        )}
      </div>

      {/* Center Mode Switcher: Standard Simulator vs Engineering Lab Mode vs Circuit Builder */}
      <div className="flex items-center gap-1 sm:gap-1.5 bg-[#0B0F19] p-1 rounded-[3px] border border-white/10 text-xs font-mono">
        <button
          onClick={() => handleSelectMode('simulator')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 rounded-[2px] transition cursor-pointer eng-focus ${
            currentMode === 'simulator'
              ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_14px_rgba(0,240,255,0.35)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Interactive circuit simulation and testing modules"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Simulator</span>
          <span className="sm:hidden text-[11px]">Sim</span>
        </button>

        <button
          onClick={() => handleSelectMode('lab')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 rounded-[2px] transition cursor-pointer eng-focus ${
            currentMode === 'lab'
              ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_14px_rgba(0,240,255,0.35)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Guided 17-experiment curriculum laboratory mode & College Practicals"
        >
          <FlaskConical className={`w-3.5 h-3.5 ${currentMode === 'lab' ? 'text-[#0B0F19]' : 'text-[#FF5722]'}`} />
          <span>Lab mode</span>
          <span className={`text-[10px] px-1 rounded font-mono hidden md:inline ${
            currentMode === 'lab' ? 'bg-[#0B0F19]/20 text-[#0B0F19]' : 'bg-[#FF5722]/15 text-[#FF5722]'
          }`}>
            17 exps
          </span>
        </button>

        <button
          onClick={() => handleSelectMode('builder')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 rounded-[2px] transition cursor-pointer eng-focus ${
            currentMode === 'builder'
              ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_14px_rgba(0,240,255,0.35)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Manual Circuit Builder (Syllabus Visual CAD & Netlist Simulation)"
        >
          <CircuitBoard className={`w-3.5 h-3.5 ${currentMode === 'builder' ? 'text-[#0B0F19]' : 'text-[#00F0FF]'}`} />
          <span className="hidden sm:inline">Circuit builder</span>
          <span className="sm:hidden text-[11px]">CAD</span>
          <span className={`text-[10px] px-1 rounded font-mono hidden md:inline ${
            currentMode === 'builder' ? 'bg-[#0B0F19]/20 text-[#0B0F19]' : 'bg-[#00F0FF]/15 text-[#00F0FF]'
          }`}>
            CAD
          </span>
        </button>
      </div>

      {/* Nav Actions */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-400">
        {/* UI Audio Mute / Unmute Toggle */}
        <button
          onClick={toggleMute}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-[3px] border transition cursor-pointer eng-focus ${
            isMuted
              ? 'bg-[#111520] border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'
              : 'bg-[#111520] border-[#00F0FF]/30 text-[#00F0FF] hover:border-[#00F0FF] hover:shadow-[0_0_8px_rgba(0,240,255,0.25)]'
          }`}
          title={isMuted ? 'UI Audio: Muted (Click to Unmute)' : 'UI Audio: Active (Click to Mute)'}
          aria-label={isMuted ? 'Unmute UI Audio' : 'Mute UI Audio'}
        >
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
          <span className="text-[11px] font-mono font-semibold">
            {isMuted ? 'Muted' : 'Audio'}
          </span>
        </button>

        {onOpenAdmin && (
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-[3px] border border-white/10 hover:border-[#00F0FF]/40 bg-[#111520] hover:bg-white/5 hover:text-white transition-colors cursor-pointer text-slate-300 eng-focus"
            title="Open Admin Telemetry & Visitor Console (Ctrl+Shift+A)"
          >
            <Terminal className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span className="text-[11px] font-mono font-semibold">Admin</span>
          </button>
        )}
      </nav>
    </header>
  );
};
