"use client";

import React, { useState } from 'react';
import { StudentProfile } from '../types/student';
import { saveStudentProfile, getStoredStudentProfile } from '../utils/studentSync';
import { syncStudentProfile } from '../utils/api';
import { playTick, playSnap, playError } from '../utils/audioFeedback';
import {
  ShieldCheck,
  User,
  GraduationCap,
  Hash,
  ArrowRight,
  ArrowLeft,
  Cpu,
  Lock,
  CircuitBoard,
  Zap,
} from 'lucide-react';

interface StudentLoginPageProps {
  onLoginSuccess: (profile: StudentProfile) => void;
  onBackToLanding?: () => void;
  onDirectSimulator?: () => void;
}

export const StudentLoginPage: React.FC<StudentLoginPageProps> = ({
  onLoginSuccess,
  onBackToLanding,
  onDirectSimulator,
}) => {
  // Prepopulate from existing stored profile if available
  const existing = getStoredStudentProfile();

  const [fullName, setFullName] = useState(existing?.fullName || '');
  const [division, setDivision] = useState(existing?.division || 'J');
  const [customDivision, setCustomDivision] = useState('');
  const [rollNumber, setRollNumber] = useState(existing?.rollNumber || '');
  const [errors, setErrors] = useState<{ fullName?: string; rollNumber?: string; division?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    playTick();
    setFullName(e.target.value);
    if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
  };

  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    playTick();
    setDivision(e.target.value);
    if (errors.division) setErrors((prev) => ({ ...prev, division: undefined }));
  };

  const handleCustomDivisionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    playTick();
    setCustomDivision(e.target.value);
    if (errors.division) setErrors((prev) => ({ ...prev, division: undefined }));
  };

  const handleRollNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    playTick();
    const cleanDigits = e.target.value.replace(/[^\d]/g, '');
    setRollNumber(cleanDigits);
    if (errors.rollNumber) setErrors((prev) => ({ ...prev, rollNumber: undefined }));
  };

  const handleQuickFill = () => {
    playSnap();
    setFullName('Dhruv Katkar');
    setDivision('J');
    setRollNumber('15');
    setErrors({});
  };

  const handleGuestAccess = () => {
    playTick();
    if (onDirectSimulator) {
      onDirectSimulator();
    } else {
      const guestProfile = saveStudentProfile({
        fullName: 'Guest Student',
        division: 'J',
        rollNumber: '99',
      });
      onLoginSuccess(guestProfile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};
    const trimmedName = fullName.trim();
    const finalDivision = division === 'custom' ? customDivision.trim() : division;
    const trimmedRoll = rollNumber.trim();

    if (!trimmedName || trimmedName.length < 2) {
      newErrors.fullName = 'Full Name is required (minimum 2 characters).';
    }

    if (!finalDivision) {
      newErrors.division = 'Division / Class is required.';
    }

    if (!trimmedRoll || trimmedRoll.length === 0) {
      newErrors.rollNumber = 'Numeric Roll Number is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      playError();
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    const studentData = {
      name: trimmedName,
      fullName: trimmedName,
      roll: trimmedRoll,
      rollNumber: trimmedRoll,
      division: finalDivision,
      div: finalDivision,
      timestamp: new Date().toISOString(),
      lastActive: new Date().toLocaleString(),
      completedPracticals: existing?.completedPracticalsCount ?? existing?.completedPracticals ?? 0,
      completedPracticalsCount: existing?.completedPracticalsCount ?? existing?.completedPracticals ?? 0,
      device: typeof navigator !== 'undefined' ? `${navigator.platform} (${navigator.userAgent})` : 'Web Browser',
    };

    // Save to localStorage
    try {
      localStorage.setItem('optiSimProfile', JSON.stringify(studentData));
    } catch (err) {
      console.error('[StudentLoginPage] Failed to write optiSimProfile to localStorage:', err);
    }

    const saved = saveStudentProfile({
      fullName: trimmedName,
      division: finalDivision,
      rollNumber: trimmedRoll,
    });

    // Cloud sync to Google Sheets in background
    syncStudentProfile(studentData).catch((err) => {
      console.error('[StudentLoginPage] Background Google Sheets sync error:', err);
    });

    playSnap();

    // Instant state transition
    onLoginSuccess(saved);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0B0F19] text-[#F8FAFC] flex flex-col justify-between overflow-x-hidden selection:bg-[#00F0FF]/30 selection:text-[#00F0FF]">
      {/* Background Aurora Glow & Circuit Grid */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[60vh] bg-gradient-to-tr from-[#00F0FF]/15 via-[#FF5722]/10 to-transparent rounded-[50%] blur-[100px] pointer-events-none z-0" />
      <div
        className="absolute inset-0 opacity-20 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Top Navigation Bar with Navigation Links */}
      <header className="relative z-10 h-16 border-b border-white/10 px-4 sm:px-10 flex items-center justify-between backdrop-blur-md bg-[#0B0F19]/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[4px] bg-[#0B0F19] border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.3)]">
            <CircuitBoard className="w-4 h-4" />
          </div>
          <div>
            <span className="font-mono font-bold text-sm tracking-wider text-white">OPTI-SIM</span>
            <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400 ml-2">
              | Stage 2: Student Identity Gateway
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {onBackToLanding && (
            <button
              type="button"
              onClick={onBackToLanding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 text-slate-300 hover:text-white hover:border-[#00F0FF]/50 hover:bg-[#00F0FF]/10 transition-all text-xs font-mono cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Landing Page</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleGuestAccess}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#00F0FF]/40 bg-[#00F0FF]/10 text-[#00F0FF] hover:bg-[#00F0FF]/20 transition-all text-xs font-mono cursor-pointer"
          >
            <span>Skip to Simulator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Login Card Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="relative w-full max-w-lg rounded-2xl border border-[#00F0FF]/40 bg-[#1A1E29]/90 backdrop-blur-xl p-6 sm:p-10 shadow-[0_0_50px_rgba(0,240,255,0.2)] overflow-hidden">
          {/* Cyberpunk Top Gradient Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00F0FF] via-[#38BDF8] to-[#FF5722]" />

          {/* Header Badges */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#0B0F19] border border-[#00F0FF]/50 flex items-center justify-center text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.35)] shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 uppercase">
                    Identity Gateway
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5 text-[#FF5722]" /> SPPU Syllabus
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight mt-1">
                  Student Laboratory Authentication
                </h1>
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 mb-5 leading-relaxed">
            Welcome to <strong className="text-white font-mono">OPTI-SIM</strong>. Please enter your academic credentials to unlock your digital lab passport and personalize all 17 guided experiment workspaces.
          </p>

          {/* Quick Pre-fill / Existing Profile Pill */}
          {existing?.fullName ? (
            <div className="mb-5 p-3 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-between gap-2">
              <div className="text-xs">
                <span className="text-slate-400">Saved profile: </span>
                <strong className="text-white font-mono">{existing.fullName}</strong>
                <span className="text-[#00F0FF] font-mono ml-1.5">
                  ({existing.division}-{existing.rollNumber})
                </span>
              </div>
              <button
                type="button"
                onClick={() => onLoginSuccess(existing)}
                className="px-2.5 py-1 rounded bg-[#00F0FF] hover:bg-[#00D2E0] text-[#0B0F19] text-[11px] font-mono font-bold transition cursor-pointer"
              >
                Continue ➔
              </button>
            </div>
          ) : (
            <div className="mb-5 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleQuickFill}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:border-[#00F0FF]/40 text-[#00F0FF] text-[11px] font-mono transition cursor-pointer"
              >
                <Zap className="w-3 h-3" />
                <span>Quick Fill Demo Student: Dhruv Katkar (Div J • Roll 15)</span>
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-slate-200 font-semibold text-xs">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#00F0FF]" />
                  Full Name
                </span>
                <span className="text-[11px] text-slate-400 font-normal">e.g., Dhruv Katkar</span>
              </label>
              <input
                type="text"
                autoFocus
                value={fullName}
                onChange={handleFullNameChange}
                placeholder="Enter your first and last name"
                className={`w-full px-3.5 py-3 rounded-lg bg-[#0B0F19] border text-white placeholder-slate-500 focus:outline-hidden transition text-sm font-mono ${
                  errors.fullName
                    ? 'border-[#FF5722] focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]'
                    : 'border-white/20 focus:border-[#00F0FF] focus:shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                }`}
              />
              {errors.fullName && (
                <p className="text-[11px] text-[#FF5722] flex items-center gap-1 mt-1 font-sans">
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Division & Roll Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Division */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-slate-200 font-semibold text-xs">
                  <GraduationCap className="w-4 h-4 text-[#00F0FF]" />
                  Division / Class
                </label>
                <select
                  value={division}
                  onChange={handleDivisionChange}
                  className="w-full px-3.5 py-3 rounded-lg bg-[#0B0F19] border border-white/20 text-white focus:border-[#00F0FF] focus:outline-hidden focus:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition text-sm font-mono cursor-pointer"
                >
                  <option value="J">Division J (SPPU ENTC)</option>
                  <option value="A">Division A</option>
                  <option value="B">Division B</option>
                  <option value="C">Division C</option>
                  <option value="D">Division D</option>
                  <option value="custom">Other / Custom</option>
                </select>

                {division === 'custom' && (
                  <input
                    type="text"
                    value={customDivision}
                    onChange={handleCustomDivisionChange}
                    placeholder="Enter division code"
                    className="w-full mt-2 px-3.5 py-2.5 rounded-lg bg-[#0B0F19] border border-white/20 text-white text-xs font-mono focus:border-[#00F0FF] focus:outline-hidden"
                  />
                )}

                {errors.division && (
                  <p className="text-[11px] text-[#FF5722] mt-1 font-sans">{errors.division}</p>
                )}
              </div>

              {/* Roll Number */}
              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-slate-200 font-semibold text-xs">
                  <span className="flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-[#00F0FF]" />
                    Roll Number
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">Numeric</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={rollNumber}
                  onChange={handleRollNumberChange}
                  placeholder="e.g. 15 or 21045"
                  className={`w-full px-3.5 py-3 rounded-lg bg-[#0B0F19] border text-white placeholder-slate-500 focus:outline-hidden transition text-sm font-mono ${
                    errors.rollNumber
                      ? 'border-[#FF5722] focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]'
                      : 'border-white/20 focus:border-[#00F0FF] focus:shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                  }`}
                />
                {errors.rollNumber && (
                  <p className="text-[11px] text-[#FF5722] mt-1 font-sans">{errors.rollNumber}</p>
                )}
              </div>
            </div>

            {/* Academic Record Notice */}
            <div className="p-3 rounded-lg bg-[#0B0F19]/80 border border-white/10 text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-[#00F0FF] font-semibold text-xs">
                <Cpu className="w-3.5 h-3.5" />
                <span>Academic Record Binding</span>
              </div>
              <p className="leading-relaxed text-slate-400 font-sans text-xs">
                Your credentials authenticate your laboratory session and will automatically stamp all circuit calculations and PDF observation reports.
              </p>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-4 px-6 rounded-xl bg-gradient-to-r from-[#00F0FF] via-[#00D2E0] to-[#38BDF8] text-[#0B0F19] font-mono font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(0,240,255,0.5)] hover:shadow-[0_0_40px_rgba(0,240,255,0.8)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'AUTHENTICATING...' : 'AUTHENTICATE & ENTER LABORATORY'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Guest / Skip Option at bottom of card */}
          <div className="mt-4 pt-3 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={handleGuestAccess}
              className="text-xs font-mono text-slate-400 hover:text-white transition cursor-pointer"
            >
              Want to test without registering? <span className="text-[#00F0FF] underline">Continue as Guest ➔</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="relative z-10 py-4 px-6 text-center text-xs font-mono text-slate-500 border-t border-white/5">
        <span>OPTI-SIM V2.4 • SPPU ENTC ENGINEERING PRACTICALS</span>
      </footer>
    </div>
  );
};

export default StudentLoginPage;
