import React, { useState, useEffect } from 'react';
import { Header, AppMode } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { StatusBar } from './components/StatusBar';
import { DocumentationModal } from './components/DocumentationModal';
import { AboutModal } from './components/AboutModal';
import { HistoryModal } from './components/HistoryModal';
import { LabModeWorkspace } from './components/lab/LabModeWorkspace';
import { ManualCircuitBuilder } from './components/builder/ManualCircuitBuilder';

// Circuit Workspaces
import { InvertingAmpWorkspace } from './circuits/invertingAmp/InvertingAmpWorkspace';
import { NonInvertingAmpWorkspace } from './circuits/nonInvertingAmp/NonInvertingAmpWorkspace';
import { VoltageFollowerWorkspace } from './circuits/voltageFollower/VoltageFollowerWorkspace';
import { SummingAmpWorkspace } from './circuits/summingAmp/SummingAmpWorkspace';
import { DiffAmpWorkspace } from './circuits/diffAmp/DiffAmpWorkspace';
import { IntegratorWorkspace } from './circuits/integrator/IntegratorWorkspace';
import { DifferentiatorWorkspace } from './circuits/differentiator/DifferentiatorWorkspace';
import { LowPassFilterWorkspace } from './circuits/lowPassFilter/LowPassFilterWorkspace';
import { HighPassFilterWorkspace } from './circuits/highPassFilter/HighPassFilterWorkspace';
import { PrecisionRectifierWorkspace } from './circuits/precisionRectifier/PrecisionRectifierWorkspace';
import { ComparatorWorkspace } from './circuits/comparator/ComparatorWorkspace';
import { SchmittTriggerWorkspace } from './circuits/schmittTrigger/SchmittTriggerWorkspace';
import { SquareWaveWorkspace } from './circuits/squareWave/SquareWaveWorkspace';
import { TriangularWaveWorkspace } from './circuits/triangularWave/TriangularWaveWorkspace';
import { PWMWorkspace } from './circuits/pwm/PWMWorkspace';
import { DACWorkspace } from './circuits/dac/DACWorkspace';
import { ADCWorkspace } from './circuits/adc/ADCWorkspace';

import { StudentWelcomeModal } from './components/StudentWelcomeModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { OptiSimLandingPage } from './components/LandingPage';
import { StudentLoginPage } from './components/StudentLoginPage';
import { CustomCursor } from './components/ui/custom-cursor';
import MotionFooterDemo from './components/ui/motion-footer-demo';
import { StudentProfile } from './types/student';
import { getStoredStudentProfile, touchStudentActivity, STUDENT_PROFILE_UPDATE_EVENT } from './utils/studentSync';

import { Info, X } from 'lucide-react';
import { playTick, playError } from './utils/audioFeedback';

export default function App() {
  const [selectedCircuitId, setSelectedCircuitId] = useState<string>('inverting-amplifier');
  const [activeMode, setActiveMode] = useState<AppMode>('simulator');
  const [isLabModeActive, setIsLabModeActive] = useState<boolean>(false);
  const [isDocOpen, setIsDocOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Motion Footer Demo preview (?demo=footer)
  const [showFooterDemo] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        window.location.search.includes('footer') ||
        window.location.hash.includes('footer')
      );
    }
    return false;
  });

  // =========================================================================
  // PHASE 18M: 1. THE 3-STEP STATE MACHINE
  // Valid states: 'LANDING' | 'LOGIN' | 'SIMULATOR'
  // =========================================================================
  const [currentScreen, setCurrentScreen] = useState<'LANDING' | 'LOGIN' | 'SIMULATOR'>('LANDING');
  const [isManualSwitch, setIsManualSwitch] = useState<boolean>(false);

  // Self-Check: If currentScreen === 'LOGIN' and localStorage detects the user
  // is already logged in, immediately fire transition to 'SIMULATOR' (unless switching student).
  useEffect(() => {
    if (currentScreen === 'LOGIN') {
      const stored = getStoredStudentProfile();
      if (stored?.fullName && !isManualSwitch) {
        setStudentProfile(stored);
        setCurrentScreen('SIMULATOR');
        showNotice(`Welcome back, ${stored.fullName} (Div ${stored.division})!`);
      }
    }
  }, [currentScreen, isManualSwitch]);

  // Student Identity & Admin Dashboard State (Phase 18H)
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(() => getStoredStudentProfile());
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  
  // Status Bar State
  const [calcStatus, setCalcStatus] = useState<'Ready' | 'Calculated' | 'Error'>('Ready');
  const [hasErrors, setHasErrors] = useState<boolean>(false);
  const [lastCalculatedTime, setLastCalculatedTime] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  // Temporary notice toast
  const [notice, setNotice] = useState<string | null>(null);

  const handleModeSelect = (mode: AppMode) => {
    playTick();
    setActiveMode(mode);
    setIsLabModeActive(mode === 'lab');
    if (mode === 'builder') {
      showNotice('Switched to Manual Circuit Builder (Syllabus Visual CAD)');
    } else if (mode === 'lab') {
      showNotice('Activated Engineering Lab Mode (17 Guided Experiments)');
    } else {
      showNotice('Switched to Interactive Circuit Simulator');
    }
  };

  const handleStatusChange = (status: 'Ready' | 'Calculated' | 'Error', errors: boolean) => {
    if (errors || status === 'Error') {
      playError();
    } else if (status === 'Calculated') {
      playTick();
    }
    setCalcStatus(status);
    setHasErrors(errors);
    setLastCalculatedTime(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
  };

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => {
      setNotice((current) => (current === msg ? null : current));
    }, 4000);
  };

  // Keyboard shortcuts listener (Ctrl+Enter to calculate, Alt+R to reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const calcButtons = document.querySelectorAll<HTMLButtonElement>('button');
        for (const btn of Array.from(calcButtons)) {
          if (btn.textContent?.toLowerCase().includes('calculate')) {
            btn.click();
            showNotice('Shortcut: Simulated circuit (Ctrl + Enter)');
            break;
          }
        }
      }

      if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        const resetButtons = document.querySelectorAll<HTMLButtonElement>('button');
        for (const btn of Array.from(resetButtons)) {
          if (btn.textContent?.toLowerCase().includes('reset')) {
            btn.click();
            showNotice('Shortcut: Reset circuit parameters (Alt + R)');
            break;
          }
        }
      }

      // Secret Admin Dashboard Shortcut (Ctrl+Shift+A)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        playTick();
        setIsAdminOpen((prev) => !prev);
        showNotice('Admin Telemetry Console toggled (Ctrl + Shift + A)');
      }
    };

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const button = target.closest('button');
      if (!button) return;

      const txt = (button.textContent || '').trim().toLowerCase();
      if (
        txt.includes('calculate') ||
        txt.includes('simulate') ||
        txt.includes('power on') ||
        txt.includes('run simulation')
      ) {
        playTick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleGlobalClick, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleGlobalClick, true);
    };
  }, []);

  // Listen for Student Profile updates across sessions
  useEffect(() => {
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<StudentProfile | null>;
      setStudentProfile(customEvent.detail);
      if (!customEvent.detail) {
        setIsWelcomeModalOpen(true);
      }
    };
    window.addEventListener(STUDENT_PROFILE_UPDATE_EVENT, handleProfileUpdate);
    return () => window.removeEventListener(STUDENT_PROFILE_UPDATE_EVENT, handleProfileUpdate);
  }, []);

  // Touch student activity when interacting with simulator
  useEffect(() => {
    touchStudentActivity();
  }, [selectedCircuitId, activeMode]);

  // Helper to render the active circuit workspace
  const renderCircuitWorkspace = (circuitId: string) => {
    switch (circuitId) {
      case 'inverting-amplifier':
        return <InvertingAmpWorkspace onStatusChange={handleStatusChange} />;
      case 'non-inverting-amplifier':
        return <NonInvertingAmpWorkspace onStatusChange={handleStatusChange} />;
      case 'voltage-follower':
        return <VoltageFollowerWorkspace onStatusChange={handleStatusChange} />;
      case 'summing-amplifier':
        return <SummingAmpWorkspace onStatusChange={handleStatusChange} />;
      case 'differential-amplifier':
        return <DiffAmpWorkspace onStatusChange={handleStatusChange} />;
      case 'integrator':
        return <IntegratorWorkspace onStatusChange={handleStatusChange} />;
      case 'differentiator':
        return <DifferentiatorWorkspace onStatusChange={handleStatusChange} />;
      case 'low-pass-filter':
        return <LowPassFilterWorkspace onStatusChange={handleStatusChange} />;
      case 'high-pass-filter':
        return <HighPassFilterWorkspace onStatusChange={handleStatusChange} />;
      case 'precision-rectifier':
        return <PrecisionRectifierWorkspace onStatusChange={handleStatusChange} />;
      case 'comparator':
        return <ComparatorWorkspace onStatusChange={handleStatusChange} />;
      case 'schmitt-trigger':
        return <SchmittTriggerWorkspace onStatusChange={handleStatusChange} />;
      case 'square-wave-generator':
        return <SquareWaveWorkspace onStatusChange={handleStatusChange} />;
      case 'triangular-wave-generator':
        return <TriangularWaveWorkspace onStatusChange={handleStatusChange} />;
      case 'pwm-generator':
        return <PWMWorkspace onStatusChange={handleStatusChange} />;
      case 'dac':
        return <DACWorkspace onStatusChange={handleStatusChange} />;
      case 'adc':
        return <ADCWorkspace onStatusChange={handleStatusChange} />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div className="max-w-md p-6 rounded-lg border border-slate-800 bg-[#0a0f1d] space-y-3">
              <h3 className="text-base font-semibold font-mono text-cyan-300">
                Module Under Development
              </h3>
              <p className="text-xs text-slate-400">
                This circuit simulation will be activated in an upcoming update.
              </p>
              <button
                onClick={() => setSelectedCircuitId('inverting-amplifier')}
                className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-xs font-mono font-medium text-white transition-colors"
              >
                Return to Active Modules
              </button>
            </div>
          </div>
        );
    }
  };

  if (showFooterDemo) {
    return <MotionFooterDemo />;
  }

  return (
    <CustomCursor color="#00F0FF" className="w-full h-full min-h-screen">
      {/* 
        ========================================================================
        PHASE 18M: 2. INTEGRATING THE VIEWS (STRICT STEP ISOLATION)
        ========================================================================
      */}
      {currentScreen === 'LANDING' ? (
        /* STEP 1: THE LANDING PAGE */
        <OptiSimLandingPage
          onEnterLab={() => {
            setCurrentScreen('LOGIN');
          }}
        />
      ) : currentScreen === 'LOGIN' ? (
        /* STEP 2: THE LOGIN PAGE (STUDENT GATEWAY) */
        <StudentLoginPage
          onLoginSuccess={(prof) => {
            setStudentProfile(prof);
            setIsManualSwitch(false);
            setCurrentScreen('SIMULATOR');
            showNotice(`Welcome to OPTI-SIM, ${prof.fullName} (Div ${prof.division})!`);
          }}
          onBackToLanding={() => {
            setIsManualSwitch(false);
            setCurrentScreen('LANDING');
          }}
        />
      ) : (
        /* STEP 3: THE ACTUAL OP-AMP SIMULATOR */
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0B0F19] text-[#F3F4F6] font-sans selection:bg-[#00F0FF]/30 selection:text-[#00F0FF]">
          {/* 1. TOP HEADER */}
          <Header
            activeMode={activeMode}
            onSelectMode={handleModeSelect}
            onGoHome={() => {
              setIsManualSwitch(false);
              setCurrentScreen('LANDING');
            }}
            onGoLogin={() => {
              setIsManualSwitch(true);
              setCurrentScreen('LOGIN');
            }}
            studentProfile={studentProfile}
            onOpenAdmin={() => setIsAdminOpen(true)}
          />

          {/* 2. BODY WORKSPACE WITH SIDEBAR & MAIN STAGE */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Left Sidebar (Only visible in standard simulator mode) */}
            {activeMode === 'simulator' && (
              <Sidebar
                selectedCircuitId={selectedCircuitId}
                onSelectCircuit={(id) => setSelectedCircuitId(id)}
                onNotice={showNotice}
              />
            )}

            {/* Main Stage: Standard Simulator vs Engineering Lab Mode vs Manual Circuit Builder */}
            <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#0B0F19]">
              {activeMode === 'builder' ? (
                <ManualCircuitBuilder onNotice={showNotice} />
              ) : activeMode === 'lab' ? (
                <LabModeWorkspace
                  selectedCircuitId={selectedCircuitId}
                  onSelectCircuit={(id) => setSelectedCircuitId(id)}
                  onExitLabMode={() => handleModeSelect('simulator')}
                  onNotice={showNotice}
                >
                  {renderCircuitWorkspace(selectedCircuitId)}
                </LabModeWorkspace>
              ) : (
                renderCircuitWorkspace(selectedCircuitId)
              )}
            </main>
          </div>

          {/* 3. GLOBAL STATUS BAR */}
          <StatusBar
            circuitId={activeMode === 'builder' ? 'Manual CAD Workspace' : selectedCircuitId}
            calculationStatus={calcStatus}
            hasErrors={hasErrors}
            lastCalculatedTime={lastCalculatedTime}
          />

          {/* 4. MODALS */}
          <DocumentationModal
            isOpen={isDocOpen}
            onClose={() => setIsDocOpen(false)}
            onSelectCircuit={(id) => setSelectedCircuitId(id)}
          />

          <AboutModal
            isOpen={isAboutOpen}
            onClose={() => setIsAboutOpen(false)}
            onOpenAdmin={() => setIsAdminOpen(true)}
            onOpenLanding={() => {
              setIsAboutOpen(false);
              setIsManualSwitch(false);
              setCurrentScreen('LANDING');
            }}
          />

          <HistoryModal
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            onSelectCircuit={(id) => setSelectedCircuitId(id)}
            onNotice={showNotice}
          />

          {/* Student Identity Gateway (Welcome Modal for first-time visitors) */}
          <StudentWelcomeModal
            isOpen={isWelcomeModalOpen}
            onProfileSaved={(prof) => {
              setStudentProfile(prof);
              setIsWelcomeModalOpen(false);
              showNotice(`Welcome to OPTI-SIM, ${prof.fullName} (Div ${prof.division})!`);
            }}
          />

          {/* Admin Dashboard Modal (Protected console toggled via Ctrl+Shift+A) */}
          <AdminDashboardModal
            isOpen={isAdminOpen}
            onClose={() => setIsAdminOpen(false)}
            onProfileReset={() => {
              setStudentProfile(null);
              setIsAdminOpen(false);
              setIsManualSwitch(true);
              setCurrentScreen('LOGIN');
            }}
          />

          {/* 5. TOAST NOTIFICATION BANNER */}
          {notice && (
            <div className="fixed bottom-10 right-6 z-50 flex items-center gap-2.5 px-3.5 py-2 rounded-[3px] bg-[#1A1E29] border border-[#00F0FF]/40 text-white text-xs font-mono shadow-[0_0_20px_rgba(0,240,255,0.2)]">
              <Info className="w-4 h-4 text-[#00F0FF] shrink-0" />
              <span>{notice}</span>
              <button
                onClick={() => setNotice(null)}
                className="ml-2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </CustomCursor>
  );
}
