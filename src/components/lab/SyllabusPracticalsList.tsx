import React, { useState, useMemo, useEffect } from 'react';
import { SYLLABUS_PRACTICALS_REGISTRY } from '../../data/syllabusRegistry';
import { SyllabusTopic } from '../../types/syllabus';
import {
  BookOpen,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { PassportProgressBar } from './PassportProgressBar';
import { PassportStamp } from './PassportStamp';
import {
  getLabPassportProgress,
  LabPassportState,
  OPTI_SIM_PASSPORT_UPDATE_EVENT
} from '../../utils/labPassportStorage';

interface SyllabusPracticalsListProps {
  onSelectTopic: (topic: SyllabusTopic) => void;
  onOpenCircuitSimulator?: (circuitId: string) => void;
  onNotice?: (msg: string) => void;
}

export const SyllabusPracticalsList: React.FC<SyllabusPracticalsListProps> = ({
  onSelectTopic,
  onOpenCircuitSimulator,
  onNotice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCollege, setSelectedCollege] = useState<string>('all');
  const [passportState, setPassportState] = useState<LabPassportState>(() => getLabPassportProgress());

  useEffect(() => {
    const handleUpdate = () => {
      setPassportState(getLabPassportProgress());
    };
    window.addEventListener(OPTI_SIM_PASSPORT_UPDATE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(OPTI_SIM_PASSPORT_UPDATE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'linear', label: 'Calculus & Filters' },
    { id: 'non-linear', label: 'Nonlinear Switching' },
    { id: 'data-conversion', label: 'Data Conversion' },
    { id: 'waveforms', label: 'Waveform Generators' },
    { id: 'feedback-amplifiers', label: 'Feedback Amplifiers' },
  ];

  const colleges = [
    { id: 'all', label: 'All Manuals' },
    { id: 'NMIET', label: 'NMIET Talegaon (ICA & PCC-204)' },
    { id: 'Modern College', label: 'PES Modern College of Engineering' },
  ];

  const filteredTopics = useMemo(() => {
    return SYLLABUS_PRACTICALS_REGISTRY.filter((t) => {
      // Category filter
      if (selectedCategory !== 'all' && t.category !== selectedCategory) {
        return false;
      }

      // College filter
      if (selectedCollege !== 'all' && !t.source.college.includes(selectedCollege)) {
        return false;
      }

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchRef = t.secondaryRefNumber.toLowerCase().includes(q);
      const matchCollege = t.source.college.toLowerCase().includes(q);
      const matchAim = t.aim.toLowerCase().includes(q);
      const matchApparatus = t.apparatus.some((a) => a.toLowerCase().includes(q));

      return matchTitle || matchRef || matchCollege || matchAim || matchApparatus;
    });
  }, [searchQuery, selectedCategory, selectedCollege]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* 1. MILESTONE PASSPORT OVERVIEW PROGRESS BAR */}
      <PassportProgressBar progressState={passportState} onNotice={onNotice} />

      {/* 2. SEARCH & FILTER CONTROLS */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic title, apparatus, experiment ref..."
              className="w-full bg-[#0b101e] border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* College Manual Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 shrink-0">Manual:</span>
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="bg-[#0b101e] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-hidden focus:border-cyan-500 cursor-pointer"
            >
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer border ${
                selectedCategory === cat.id
                  ? 'bg-cyan-950 border-cyan-500/60 text-cyan-300 font-semibold shadow-xs'
                  : 'bg-[#0b101e] border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. TOPICS LISTING GRID */}
      {filteredTopics.length === 0 ? (
        <div className="p-12 text-center bg-[#0b101e] border border-slate-800 rounded-xl space-y-3">
          <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-mono font-semibold text-slate-300">No syllabus practicals found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search terms or selecting &quot;All Topics&quot;.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedCollege('all');
            }}
            className="px-3 py-1.5 rounded bg-slate-800 text-xs font-mono text-slate-300 hover:bg-slate-700 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTopics.map((topic, idx) => {
            const hasSimulator = !!topic.mappedCircuitId;
            const isFullSimulation = topic.simulationLimitation?.isFullySupported ?? true;
            const isCompleted = !!passportState[topic.id]?.completed;
            const completedAt = passportState[topic.id]?.completedAt;

            return (
              <div
                key={topic.id}
                className={`relative rounded-[3px] p-5 flex flex-col justify-between transition-all duration-200 overflow-hidden group ${
                  isCompleted
                    ? 'bg-[#1A1E29] border border-[#00F0FF]/50 shadow-[0_0_24px_rgba(0,240,255,0.12)] ring-1 ring-[#00F0FF]/25'
                    : 'bg-[#111520] border border-white/10 hover:border-white/25 shadow-lg'
                }`}
              >
                {/* Top Accent Strip */}
                <div
                  className={`absolute top-0 left-0 right-0 h-[2px] ${
                    isCompleted
                      ? 'bg-gradient-to-r from-[#00F0FF] via-emerald-400 to-[#00F0FF] shadow-[0_0_8px_#00F0FF]'
                      : 'bg-white/10 group-hover:bg-white/20'
                  }`}
                />

                {/* VERIFIED DIGITAL STAMP OR PENDING STATUS */}
                {isCompleted ? (
                  <PassportStamp
                    completed={true}
                    date={completedAt}
                    variant={idx % 2 === 0 ? 'cyan' : 'orange'}
                    size="md"
                    className="absolute top-3.5 right-3.5 z-10"
                  />
                ) : (
                  <PassportStamp
                    completed={false}
                    className="absolute top-3.5 right-3.5 z-10"
                  />
                )}

                <div className="space-y-3.5 pr-2">
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 max-w-[calc(100%-140px)]">
                    <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-bold bg-[#0B0F19] border border-[#00F0FF]/40 text-[#00F0FF]">
                      {topic.secondaryRefNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono bg-[#0B0F19] border border-white/10 text-slate-400">
                      {topic.categoryLabel}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 bg-[#0B0F19] px-2 py-0.5 rounded-[2px] border border-white/5 hidden sm:inline">
                      {topic.source.pageReferences}
                    </span>
                  </div>

                  {/* Primary Topic Title */}
                  <div className="pt-1">
                    <h2
                      onClick={() => onSelectTopic(topic)}
                      className={`text-sm sm:text-base font-bold font-mono transition-colors cursor-pointer leading-snug ${
                        isCompleted
                          ? 'text-white group-hover:text-[#00F0FF]'
                          : 'text-slate-100 group-hover:text-[#00F0FF]'
                      }`}
                    >
                      {topic.title}
                    </h2>
                    <p className="text-[11px] font-mono text-slate-400 mt-1 line-clamp-1">
                      {topic.source.college}
                    </p>
                  </div>

                  {/* Aim Snippet */}
                  <div className="bg-[#0B0F19] border border-white/10 rounded-[2px] p-2.5 space-y-1">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
                      CURRICULUM AIM &amp; OBJECTIVE
                    </span>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {topic.aim}
                    </p>
                  </div>

                  {/* Key Components Preview */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {topic.schematic.components.slice(0, 4).map((c, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono bg-[#0B0F19] border border-white/10 text-slate-300"
                      >
                        {c.designation}: {c.value}
                      </span>
                    ))}
                    {topic.schematic.components.length > 4 && (
                      <span className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono text-slate-500">
                        +{topic.schematic.components.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Actions & Simulation Status */}
                <div className="pt-4 mt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    {isCompleted ? (
                      <span className="flex items-center gap-1.5 text-[#00F0FF] text-[11px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00F0FF]" />
                        <span>Milestone Stamped</span>
                      </span>
                    ) : isFullSimulation ? (
                      <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Interactive Simulator Ready</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-400 text-[11px]" title="Discrete Multisim Circuit">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Discrete Circuit (Multisim)</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectTopic(topic)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] text-xs font-mono font-medium transition cursor-pointer shadow-xs ${
                        isCompleted
                          ? 'bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-[#0B0F19] font-bold shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                          : 'bg-[#1A1E29] hover:bg-[#202634] border border-white/15 text-slate-200 hover:text-white'
                      }`}
                    >
                      <span>{isCompleted ? 'View Verified Record' : 'Open Lab Record'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
