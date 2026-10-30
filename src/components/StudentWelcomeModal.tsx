import React, { useState } from 'react';
import { StudentProfile } from '../types/student';
import { saveStudentProfile } from '../utils/studentSync';
import { syncStudentProfile } from '../utils/api';
import { playTick, playSnap, playError } from '../utils/audioFeedback';
import {
  ShieldCheck,
  User,
  GraduationCap,
  Hash,
  ArrowRight,
  Cpu,
  Layers,
  Sparkles,
  Lock
} from 'lucide-react';

interface StudentWelcomeModalProps {
  isOpen: boolean;
  onProfileSaved: (profile: StudentProfile) => void;
}

export const StudentWelcomeModal: React.FC<StudentWelcomeModalProps> = ({
  isOpen,
  onProfileSaved
}) => {
  const [fullName, setFullName] = useState('');
  const [division, setDivision] = useState('A');
  const [customDivision, setCustomDivision] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [errors, setErrors] = useState<{ fullName?: string; rollNumber?: string; division?: string }>({});

  if (!isOpen) return null;

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
    // Allow digits only
    const cleanDigits = e.target.value.replace(/[^\d]/g, '');
    setRollNumber(cleanDigits);
    if (errors.rollNumber) setErrors((prev) => ({ ...prev, rollNumber: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};
    const trimmedName = fullName.trim();
    const finalDivision = division === 'custom' ? customDivision.trim() : division;
    const trimmedRoll = rollNumber.trim();

    if (!trimmedName || trimmedName.length < 2) {
      newErrors.fullName = 'Full Name is required (min 2 characters).';
    }

    if (!finalDivision) {
      newErrors.division = 'Division / Section is required.';
    }

    if (!trimmedRoll || trimmedRoll.length === 0) {
      newErrors.rollNumber = 'Numeric Roll Number is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      playError();
      setErrors(newErrors);
      return;
    }

    // Step 1: Capture Name, Roll No, and Division state object
    const studentData = {
      name: trimmedName,
      fullName: trimmedName,
      roll: trimmedRoll,
      rollNumber: trimmedRoll,
      division: finalDivision,
      div: finalDivision,
      timestamp: new Date().toISOString(),
      lastActive: new Date().toLocaleString(),
      completedPracticals: 0,
      completedPracticalsCount: 0,
      device: typeof navigator !== 'undefined' ? `${navigator.platform} (${navigator.userAgent})` : 'Web Browser'
    };

    // Step 2: Save this object to localStorage (key: optiSimProfile)
    try {
      localStorage.setItem('optiSimProfile', JSON.stringify(studentData));
    } catch (err) {
      console.error('[StudentWelcomeModal] Failed to write optiSimProfile to localStorage:', err);
    }

    const saved = saveStudentProfile({
      fullName: trimmedName,
      division: finalDivision,
      rollNumber: trimmedRoll
    });

    // Step 3: Call syncStudentProfile(studentData) in the background
    syncStudentProfile(studentData).catch((err) => {
      console.error('[StudentWelcomeModal] Background Google Sheets sync error:', err);
    });

    // Step 4: Trigger the UI audio "Snap" sound
    playSnap();

    // Step 5: Unmount/close the modal
    onProfileSaved(saved);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0F19]/90 backdrop-blur-md select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-gateway-title"
    >
      <div className="relative w-full max-w-md rounded-[6px] border border-[#00F0FF]/40 bg-[#1A1E29] p-6 sm:p-7 shadow-[0_0_35px_rgba(0,240,255,0.22)] overflow-hidden">
        {/* Top Decorative Cyberpunk Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00F0FF] via-[#38BDF8] to-[#FF5722]" />

        {/* Header with Badges */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[4px] bg-[#0B0F19] border border-[#00F0FF]/50 flex items-center justify-center text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.35)] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded-[2px] bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 uppercase">
                  Identity Gateway
                </span>
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-[#FF5722]" /> Required
                </span>
              </div>
              <h2
                id="student-gateway-title"
                className="text-lg font-bold font-mono text-white tracking-tight mt-0.5"
              >
                Student Laboratory Registration
              </h2>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-5 leading-relaxed font-sans">
          Welcome to <strong className="text-white font-mono">OPTI-SIM</strong>. Please enter your academic credentials to initialize your digital lab passport and personalize your syllabus experiment reports.
        </p>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#00F0FF]" />
                Full Name
              </span>
              <span className="text-[10px] text-slate-500">e.g., Aarav Sharma</span>
            </label>
            <input
              type="text"
              autoFocus
              value={fullName}
              onChange={handleFullNameChange}
              placeholder="Enter your first and last name"
              className={`w-full px-3 py-2.5 rounded-[3px] bg-[#0B0F19] border text-white placeholder-slate-600 focus:outline-hidden transition text-xs font-mono ${
                errors.fullName
                  ? 'border-[#FF5722] focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]'
                  : 'border-white/15 focus:border-[#00F0FF] focus:shadow-[0_0_10px_rgba(0,240,255,0.25)]'
              }`}
            />
            {errors.fullName && (
              <p className="text-[11px] text-[#FF5722] flex items-center gap-1 mt-1">
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Division and Roll Number Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Division */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-slate-300 font-medium">
                <GraduationCap className="w-3.5 h-3.5 text-[#00F0FF]" />
                Division / Class
              </label>
              <select
                value={division}
                onChange={handleDivisionChange}
                className="w-full px-3 py-2.5 rounded-[3px] bg-[#0B0F19] border border-white/15 text-white focus:border-[#00F0FF] focus:outline-hidden focus:shadow-[0_0_10px_rgba(0,240,255,0.25)] transition text-xs font-mono cursor-pointer"
              >
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
                  className="w-full mt-1.5 px-3 py-2 rounded-[3px] bg-[#0B0F19] border border-white/15 text-white text-xs font-mono focus:border-[#00F0FF] focus:outline-hidden"
                />
              )}

              {errors.division && (
                <p className="text-[11px] text-[#FF5722] mt-1">{errors.division}</p>
              )}
            </div>

            {/* Roll Number */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-slate-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-[#00F0FF]" />
                  Roll Number
                </span>
                <span className="text-[10px] text-slate-500">Digits only</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={rollNumber}
                onChange={handleRollNumberChange}
                placeholder="e.g. 21045"
                className={`w-full px-3 py-2.5 rounded-[3px] bg-[#0B0F19] border text-white placeholder-slate-600 focus:outline-hidden transition text-xs font-mono ${
                  errors.rollNumber
                    ? 'border-[#FF5722] focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]'
                    : 'border-white/15 focus:border-[#00F0FF] focus:shadow-[0_0_10px_rgba(0,240,255,0.25)]'
                }`}
              />
              {errors.rollNumber && (
                <p className="text-[11px] text-[#FF5722] mt-1">{errors.rollNumber}</p>
              )}
            </div>
          </div>

          {/* Verification Badge Notice */}
          <div className="p-3 rounded-[3px] bg-[#0B0F19] border border-white/10 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-[#00F0FF] font-semibold">
              <Cpu className="w-3.5 h-3.5" />
              <span>Official Academic Record Binding</span>
            </div>
            <p className="font-sans leading-relaxed text-slate-400">
              Your profile is saved locally to this device and attached to all future experiment observation tables and PDF export headers.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full mt-2 py-3 px-4 rounded-[3px] bg-[#00F0FF] hover:bg-[#00D2E0] active:bg-[#00B8C4] text-[#0B0F19] font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(0,240,255,0.35)] transition-all cursor-pointer"
          >
            <span>Enter Laboratory</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
