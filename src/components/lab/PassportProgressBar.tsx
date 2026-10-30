import React from 'react';
import { Award, ShieldCheck, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';
import { SYLLABUS_PRACTICALS_REGISTRY } from '../../data/syllabusRegistry';
import { LabPassportState, resetAllPassportProgress } from '../../utils/labPassportStorage';

interface PassportProgressBarProps {
  progressState: LabPassportState;
  onNotice?: (msg: string) => void;
}

export const PassportProgressBar: React.FC<PassportProgressBarProps> = ({
  progressState,
  onNotice,
}) => {
  const totalCount = SYLLABUS_PRACTICALS_REGISTRY.length;
  const completedCount = SYLLABUS_PRACTICALS_REGISTRY.filter(
    (t) => progressState[t.id]?.completed
  ).length;

  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllDone = completedCount === totalCount && totalCount > 0;

  const handleReset = () => {
    if (confirm('Reset your Lab Passport milestone progress? All completed stamps will be set back to pending.')) {
      resetAllPassportProgress();
      onNotice?.('Milestone Lab Passport reset to initial pending state.');
    }
  };

  return (
    <div className="bg-[#1A1E29] border border-white/10 rounded-[3px] p-4 sm:p-5 space-y-4 shadow-xl relative overflow-hidden">
      {/* Top Accent Strip */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] ${
          isAllDone
            ? 'bg-gradient-to-r from-[#00F0FF] via-emerald-400 to-[#00F0FF] shadow-[0_0_12px_#00F0FF]'
            : 'bg-gradient-to-r from-[#00F0FF] to-[#FF5722]'
        }`}
      />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`p-2.5 rounded-[3px] border ${
              isAllDone
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'bg-[#00F0FF]/10 border-[#00F0FF]/30 text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.2)]'
            }`}
          >
            {isAllDone ? (
              <Sparkles className="w-5 h-5 text-emerald-400" />
            ) : (
              <Award className="w-5 h-5 text-[#00F0FF]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                ENGINEERING LAB MODE • PASSPORT SYSTEM
              </span>
              <span
                className={`px-1.5 py-0.2 rounded-[2px] text-[9px] font-mono font-bold uppercase border ${
                  isAllDone
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/30'
                }`}
              >
                {isAllDone ? 'FULLY ACCREDITED' : 'ACTIVE CURRICULUM'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold font-mono text-white tracking-tight mt-0.5">
              College Practicals Milestone Progress
            </h2>
          </div>
        </div>

        {/* Counter & Action */}
        <div className="flex items-center gap-3 self-end sm:self-auto font-mono">
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="text-2xl font-bold font-mono text-[#00F0FF] tabular-nums">
                {completedCount}
              </span>
              <span className="text-xs text-slate-400 font-bold">/ {totalCount} Practicals</span>
            </div>
            <span className="text-[10px] text-slate-400">
              {percentage}% Verified & Stamped
            </span>
          </div>

          {completedCount > 0 && (
            <button
              onClick={handleReset}
              className="p-2 rounded-[2px] bg-[#111520] hover:bg-[#161c2b] border border-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              title="Reset passport milestone stamps"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="space-y-2">
        <div className="relative h-2.5 w-full bg-[#0B0F19] rounded-full border border-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isAllDone
                ? 'bg-gradient-to-r from-[#00F0FF] via-emerald-400 to-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'bg-gradient-to-r from-[#00F0FF] to-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
            }`}
            style={{ width: `${Math.max(percentage, 2)}%` }}
          />
        </div>

        {/* 8 Discrete Practical Milestone Markers */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-1">
          {SYLLABUS_PRACTICALS_REGISTRY.map((topic, idx) => {
            const isDone = !!progressState[topic.id]?.completed;
            const expNum = idx + 1;

            return (
              <div
                key={topic.id}
                className={`p-1.5 rounded-[2px] border text-center transition-all ${
                  isDone
                    ? 'bg-[#00F0FF]/10 border-[#00F0FF]/40 text-[#00F0FF]'
                    : 'bg-[#0B0F19] border-white/5 text-slate-500'
                }`}
                title={`Exp ${expNum}: ${topic.title} (${isDone ? 'Verified' : 'Pending'})`}
              >
                <div className="flex items-center justify-center gap-1 font-mono text-[10px] font-bold">
                  {isDone ? (
                    <CheckCircle2 className="w-2.5 h-2.5 text-[#00F0FF] shrink-0" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full border border-slate-600 shrink-0" />
                  )}
                  <span>P{expNum}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Celebratory Banner on 100% completion */}
      {isAllDone && (
        <div className="p-2.5 rounded-[2px] bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs font-mono text-emerald-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold">PASSPORT FULLY ACCREDITED:</span>
            <span className="text-slate-300">
              All 8 university syllabus laboratory practicals completed and digitally certified.
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-[2px] bg-[#0B0F19]">
            Grade: Excellent (O)
          </span>
        </div>
      )}
    </div>
  );
};
