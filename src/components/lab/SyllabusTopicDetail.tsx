import React, { useState, useEffect } from 'react';
import { SyllabusTopic, SyllabusObservationRow } from '../../types/syllabus';
import {
  printSyllabusReport,
  exportSyllabusToCSV,
  exportSyllabusToJSON
} from '../../utils/syllabusExport';
import { getActiveCircuitState, generateObservationFromSimulation } from '../../utils/circuitStateBridge';
import { PassportStamp } from './PassportStamp';
import {
  recordSimulationRun,
  recordTableInteraction,
  markPracticalVerified,
  unmarkPracticalVerified,
  getLabPassportProgress,
  OPTI_SIM_PASSPORT_UPDATE_EVENT
} from '../../utils/labPassportStorage';
import {
  ArrowLeft,
  Printer,
  Download,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Cpu,
  Layers,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Activity,
  School,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info,
  Award
} from 'lucide-react';

interface SyllabusTopicDetailProps {
  topic: SyllabusTopic;
  onBack: () => void;
  onOpenCircuitSimulator?: (circuitId: string) => void;
  onNotice?: (msg: string) => void;
}

export const SyllabusTopicDetail: React.FC<SyllabusTopicDetailProps> = ({
  topic,
  onBack,
  onOpenCircuitSimulator,
  onNotice,
}) => {
  // Student Name
  const [studentName, setStudentName] = useState<string>(() => {
    return localStorage.getItem('optisim_student_name') || 'ENTC Student';
  });

  // Milestone Lab Passport Progress State
  const [passportState, setPassportState] = useState(() => getLabPassportProgress());
  const passportRecord = passportState[topic.id];
  const isVerified = !!passportRecord?.completed;
  const simRunStatus = !!passportRecord?.simulationRun;
  const tableInteractedStatus = !!passportRecord?.tableInteracted;

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

  // Sync simulation status when circuit is mapped and has active inputs/results
  useEffect(() => {
    if (topic.mappedCircuitId) {
      const state = getActiveCircuitState(topic.mappedCircuitId);
      const hasInputs = state?.inputs && Object.keys(state.inputs).length > 0;
      const hasResults = state?.results && Object.keys(state.results).length > 0;
      if (hasInputs || hasResults) {
        recordSimulationRun(topic.id);
      }
    }
  }, [topic.id, topic.mappedCircuitId]);

  // Observations per table in this topic
  const [observations, setObservations] = useState<Record<string, SyllabusObservationRow[]>>(() => {
    const initial: Record<string, SyllabusObservationRow[]> = {};
    for (const tbl of topic.observationTables) {
      try {
        const saved = localStorage.getItem(`optisim_syllabus_obs_${topic.id}_${tbl.id}`);
        if (saved) {
          initial[tbl.id] = JSON.parse(saved);
          continue;
        }
      } catch {
        // fallback
      }
      initial[tbl.id] = tbl.defaultStudentRows;
    }
    return initial;
  });

  // Student remarks and hardware notes
  const [studentConclusion, setStudentConclusion] = useState<string>(() => {
    return localStorage.getItem(`optisim_syllabus_conclusion_${topic.id}`) || '';
  });

  const [studentNotes, setStudentNotes] = useState<string>(() => {
    return localStorage.getItem(`optisim_syllabus_notes_${topic.id}`) || '';
  });

  // Active circuit state (if mapped)
  const [activeCircuitState, setActiveCircuitState] = useState(() => {
    return topic.mappedCircuitId ? getActiveCircuitState(topic.mappedCircuitId) : { inputs: {}, results: {} };
  });

  // Expand/collapse states for sections
  const [showTheory, setShowTheory] = useState<boolean>(true);
  const [showCalculations, setShowCalculations] = useState<boolean>(true);
  const [showProcedure, setShowProcedure] = useState<boolean>(true);
  const [showViva, setShowViva] = useState<boolean>(true);
  const [openVivaIndex, setOpenVivaIndex] = useState<number | null>(null);

  // Sync state on topic change
  useEffect(() => {
    if (topic.mappedCircuitId) {
      setActiveCircuitState(getActiveCircuitState(topic.mappedCircuitId));
    }

    const initial: Record<string, SyllabusObservationRow[]> = {};
    for (const tbl of topic.observationTables) {
      try {
        const saved = localStorage.getItem(`optisim_syllabus_obs_${topic.id}_${tbl.id}`);
        if (saved) {
          initial[tbl.id] = JSON.parse(saved);
          continue;
        }
      } catch {
        // fallback
      }
      initial[tbl.id] = tbl.defaultStudentRows;
    }
    setObservations(initial);

    const savedConc = localStorage.getItem(`optisim_syllabus_conclusion_${topic.id}`);
    setStudentConclusion(savedConc || '');

    const savedN = localStorage.getItem(`optisim_syllabus_notes_${topic.id}`);
    setStudentNotes(savedN || '');
  }, [topic.id, topic.mappedCircuitId]);

  // Persist observations
  const updateTableRows = (tableId: string, rows: SyllabusObservationRow[]) => {
    const updated = { ...observations, [tableId]: rows };
    setObservations(updated);
    try {
      localStorage.setItem(`optisim_syllabus_obs_${topic.id}_${tableId}`, JSON.stringify(rows));
      recordTableInteraction(topic.id, rows.length);
    } catch {
      // ignore
    }
  };

  const handleCellChange = (tableId: string, rowId: string, key: string, value: any) => {
    const currentRows = observations[tableId] || [];
    const updatedRows = currentRows.map((r) => (r.id === rowId ? { ...r, [key]: value } : r));
    updateTableRows(tableId, updatedRows);
  };

  const handleAddRow = (tableId: string) => {
    const currentRows = observations[tableId] || [];
    const newRowId = `row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const blankRow: SyllabusObservationRow = { id: newRowId };
    const tbl = topic.observationTables.find((t) => t.id === tableId);
    if (tbl) {
      for (const col of tbl.columns) {
        blankRow[col.key] = '';
      }
      blankRow.srNo = String(currentRows.length + 1);
    }
    updateTableRows(tableId, [...currentRows, blankRow]);
  };

  const handleDeleteRow = (tableId: string, rowId: string) => {
    const currentRows = observations[tableId] || [];
    if (currentRows.length <= 1) {
      onNotice?.('At least one observation row should be maintained.');
      return;
    }
    const updatedRows = currentRows.filter((r) => r.id !== rowId);
    updateTableRows(tableId, updatedRows);
  };

  const handleClearTable = (tableId: string) => {
    if (confirm('Clear all student rows in this observation table?')) {
      updateTableRows(tableId, []);
      onNotice?.('Observation table cleared.');
    }
  };

  const handleResetTable = (tableId: string) => {
    const tbl = topic.observationTables.find((t) => t.id === tableId);
    if (tbl && confirm('Reset this observation table to default template rows?')) {
      updateTableRows(tableId, tbl.defaultStudentRows);
      onNotice?.('Observation table reset to default.');
    }
  };

  // Capture simulation observation into table (if mapped)
  const handleCaptureSimulation = (tableId: string) => {
    if (!topic.mappedCircuitId) return;
    const simState = getActiveCircuitState(topic.mappedCircuitId);
    const simRow = generateObservationFromSimulation(topic.mappedCircuitId, simState.inputs, simState.results);
    if (!simRow) {
      onNotice?.('Could not capture simulation state for this circuit.');
      return;
    }

    const currentRows = observations[tableId] || [];
    const tbl = topic.observationTables.find((t) => t.id === tableId);
    const newRowId = `sim-${Date.now()}`;
    const newRow: SyllabusObservationRow = {
      id: newRowId,
      srNo: String(currentRows.length + 1)
    };

    if (tbl) {
      for (const col of tbl.columns) {
        if (col.key in simRow) {
          newRow[col.key] = (simRow as any)[col.key];
        } else if (col.key === 'croOutput' || col.key === 'studentVout') {
          newRow[col.key] = (simRow as any).voutSim ?? (simRow as any).vpos ?? (simRow as any).vout ?? '';
        } else {
          newRow[col.key] = '';
        }
      }
    }

    recordSimulationRun(topic.id);
    updateTableRows(tableId, [...currentRows, newRow]);
    onNotice?.('Captured active simulator state into observation table.');
  };

  // Save Progress
  const handleSaveProgress = () => {
    try {
      localStorage.setItem('optisim_student_name', studentName);
      localStorage.setItem(`optisim_syllabus_conclusion_${topic.id}`, studentConclusion);
      localStorage.setItem(`optisim_syllabus_notes_${topic.id}`, studentNotes);
      let totalRows = 0;
      for (const tbl of topic.observationTables) {
        const rows = observations[tbl.id] || [];
        totalRows += rows.length;
        localStorage.setItem(
          `optisim_syllabus_obs_${topic.id}_${tbl.id}`,
          JSON.stringify(rows)
        );
      }
      recordTableInteraction(topic.id, totalRows);
      onNotice?.(`Progress saved for ${topic.secondaryRefNumber} (${topic.title}).`);
    } catch {
      alert('Failed to save to local storage.');
    }
  };

  // Reset entire practical
  const handleResetAll = () => {
    if (confirm('Reset this entire syllabus practical to manual defaults? Saved readings and passport verification will be reset.')) {
      setStudentConclusion('');
      setStudentNotes('');
      const initial: Record<string, SyllabusObservationRow[]> = {};
      for (const tbl of topic.observationTables) {
        initial[tbl.id] = tbl.defaultStudentRows;
        localStorage.removeItem(`optisim_syllabus_obs_${topic.id}_${tbl.id}`);
      }
      setObservations(initial);
      localStorage.removeItem(`optisim_syllabus_conclusion_${topic.id}`);
      localStorage.removeItem(`optisim_syllabus_notes_${topic.id}`);
      unmarkPracticalVerified(topic.id);
      onNotice?.('Practical reset to clean laboratory state.');
    }
  };

  // Explicit milestone verification handlers
  const handleSignAndVerify = () => {
    recordSimulationRun(topic.id);
    recordTableInteraction(topic.id);
    markPracticalVerified(topic.id);
    onNotice?.(`★ Milestone Certified: ${topic.secondaryRefNumber} verified in Lab Passport!`);
  };

  const handleUnverify = () => {
    unmarkPracticalVerified(topic.id);
    onNotice?.(`Passport seal reset for ${topic.secondaryRefNumber}.`);
  };

  // Check if active simulation parameters differ from the source manual
  const isSimulationAdjusted = (() => {
    if (topic.id === 'nmiet-pcc204-exp03-schmitt-trigger' && activeCircuitState?.inputs) {
      const inp = activeCircuitState.inputs;
      const r1 = inp.r1 !== undefined ? (inp.r1Unit === 'kΩ' ? inp.r1 * 1000 : inp.r1) : 100;
      const r2 = inp.r2 !== undefined ? (inp.r2Unit === 'kΩ' ? inp.r2 * 1000 : inp.r2) : (inp.rf !== undefined ? (inp.rfUnit === 'kΩ' ? inp.rf * 1000 : inp.rf) : 4700);
      const posVsat = inp.posVsat !== undefined ? inp.posVsat : 2.0;
      const negVsat = inp.negVsat !== undefined ? inp.negVsat : -2.0;
      return Math.abs(r1 - 100) > 1 || Math.abs(r2 - 4700) > 10 || Math.abs(posVsat - 2.0) > 0.05 || Math.abs(negVsat - (-2.0)) > 0.05;
    }
    return false;
  })();

  const formatColumnHeader = (col: { label: string; unit?: string }): string => {
    let lbl = col.label.trim();
    let unit = col.unit ? col.unit.trim() : '';
    if (unit.toLowerCase() === 'mv / v' || unit.toLowerCase() === 'vp / vpp' || unit.toLowerCase() === 'v / mv') {
      unit = 'V';
    }
    if (unit) {
      const parenMatch = lbl.match(/\(([^)]+)\)$/);
      if (parenMatch) {
        const inside = parenMatch[1].trim().toLowerCase();
        if (inside === unit.toLowerCase() || inside === 'v' || inside === 'mv' || inside === 'vp' || inside === 'vpp' || inside === 'hz' || inside === 'khz' || inside === 'db') {
          return `${lbl.replace(/\s*\([^)]+\)$/, '').trim()} (${unit})`;
        }
        return lbl;
      }
      return `${lbl} (${unit})`;
    }
    lbl = lbl.replace(/\s*\(mv\s*\/\s*v\)/i, ' (V)').replace(/\s*\(vp\s*\/\s*vpp\)/i, ' (V)');
    return lbl;
  };

  // Exports
  const handlePrint = () => {
    printSyllabusReport({
      topic,
      studentName,
      observations,
      studentConclusion,
      studentNotes,
      activeState: activeCircuitState
    });
  };

  const handleExportCSV = () => {
    exportSyllabusToCSV({
      topic,
      observations,
      studentName
    });
    onNotice?.('CSV data exported successfully.');
  };

  const handleExportJSON = () => {
    exportSyllabusToJSON({
      topic,
      studentName,
      observations,
      studentNotes,
      studentConclusion
    });
    onNotice?.('JSON configuration exported.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      {/* 1. TOP ACTION & NAVIGATION BAR */}
      <div className="bg-[#0b101e] border border-slate-800 rounded-xl p-3 sm:p-4 sticky top-0 z-20 backdrop-blur-md shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#111520] border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-mono transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Syllabus Topics</span>
          </button>

          <span className="text-white/20 hidden sm:inline">|</span>

          <span className="text-xs font-mono font-bold text-[#00F0FF] hidden sm:inline">
            {topic.secondaryRefNumber}
          </span>

          {isVerified ? (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] text-[10px] font-mono font-bold">
              <ShieldCheck className="w-3 h-3 text-[#00F0FF]" />
              <span>PASSPORT VERIFIED</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-white/5 border border-white/10 text-slate-400 text-[10px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full border border-slate-500" />
              <span>PASSPORT PENDING</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap text-xs font-mono">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-cyan-950/70 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/60 transition cursor-pointer"
            title="Generate printable laboratory record"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print Report</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Export observations to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Export JSON record"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>

          <button
            onClick={handleSaveProgress}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/50 transition cursor-pointer"
            title="Save observations to browser storage"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          <button
            onClick={handleResetAll}
            className="flex items-center gap-1 px-2 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title="Reset practical observations"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. INSTITUTION & SOURCE METADATA BANNER */}
      <div className="bg-[#0b101e] border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-950/80 border border-indigo-500/40 text-indigo-300">
                {topic.source.college}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-700 text-slate-400">
                Subject: {topic.source.subject}
              </span>
              {topic.source.academicYear && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-700 text-slate-400">
                  AY: {topic.source.academicYear}
                </span>
              )}
            </div>

            {/* Exact Topic Title */}
            <h1 className="text-lg sm:text-2xl font-bold font-mono text-slate-100 tracking-tight pt-1">
              {topic.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 pt-1">
              <span>Source: <strong className="text-cyan-300">{topic.source.manualTitle}</strong></span>
              <span>•</span>
              <span>Manual Pages: <strong className="text-cyan-300">{topic.source.pageReferences}</strong></span>
              <span>•</span>
              <span>Practical Ref: <strong className="text-slate-300">{topic.secondaryRefNumber}</strong></span>
            </div>
          </div>

          {/* Student Name Input */}
          <div className="bg-[#070b14] border border-slate-800 rounded-lg p-3 shrink-0 flex flex-col gap-1 text-xs font-mono min-w-[200px]">
            <span className="text-slate-400">Student Name:</span>
            <input
              type="text"
              value={studentName}
              onChange={(e) => {
                setStudentName(e.target.value);
                localStorage.setItem('optisim_student_name', e.target.value);
              }}
              placeholder="e.g. John Doe (Roll 42)"
              className="bg-[#0b101e] border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:outline-hidden focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Traceability & Review Status Alert */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#070b14] border border-slate-800/80 rounded-lg p-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300">
              Source Fidelity Verified: Exact college syllabus content preserved without substitution.
            </span>
          </div>

          {topic.reviewStatus.flaggedNotes && topic.reviewStatus.flaggedNotes.length > 0 && (
            <div className="flex items-center gap-1.5 text-amber-400 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{topic.reviewStatus.flaggedNotes.length} item(s) flagged for manual verification</span>
            </div>
          )}
        </div>
      </div>

      {/* DIGITAL LAB PASSPORT: MILESTONE ACCREDITATION SEAL CARD */}
      <div
        className={`p-4 sm:p-5 rounded-[3px] border transition-all ${
          isVerified
            ? 'bg-[#1A1E29] border-[#00F0FF]/50 shadow-[0_0_24px_rgba(0,240,255,0.12)] ring-1 ring-[#00F0FF]/25'
            : 'bg-[#111520] border-white/10 shadow-md'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                ENGINEERING LAB PASSPORT VERIFICATION
              </span>
              <span
                className={`px-2 py-0.5 rounded-[2px] text-[9px] font-mono font-bold uppercase border ${
                  isVerified
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}
              >
                {isVerified ? 'VERIFIED & STAMPED' : 'PENDING REQUIREMENTS'}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold font-mono text-white">
              Curriculum Milestone Progression
            </h3>

            {/* Checklist */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] border ${
                  simRunStatus
                    ? 'bg-[#00F0FF]/10 border-[#00F0FF]/30 text-[#00F0FF]'
                    : 'bg-[#0B0F19] border-white/10 text-slate-400'
                }`}
              >
                {simRunStatus ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00F0FF]" />
                ) : (
                  <span className="w-2 h-2 rounded-full border border-slate-500 shrink-0" />
                )}
                <span>Requirement A: Simulation Engine Run</span>
              </div>

              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] border ${
                  tableInteractedStatus
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-[#0B0F19] border-white/10 text-slate-400'
                }`}
              >
                {tableInteractedStatus ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span className="w-2 h-2 rounded-full border border-slate-500 shrink-0" />
                )}
                <span>Requirement B: Observation Table Interacted</span>
              </div>
            </div>
          </div>

          {/* Right Action / Stamp */}
          <div className="flex items-center gap-4 self-start lg:self-auto shrink-0">
            {isVerified ? (
              <div className="flex items-center gap-3">
                <PassportStamp
                  completed={true}
                  date={passportRecord?.completedAt}
                  variant="cyan"
                  size="md"
                />
                <button
                  onClick={handleUnverify}
                  className="px-2.5 py-1 text-[10px] font-mono text-slate-400 hover:text-white bg-[#0B0F19] border border-white/10 rounded-[2px] transition cursor-pointer"
                  title="Reset verified seal to test again"
                >
                  Reset Seal
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignAndVerify}
                className="flex items-center gap-2 px-4 py-2.5 rounded-[2px] bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-[#0B0F19] font-mono font-bold text-xs transition cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                title="Mark this practical as verified and stamp your digital lab passport"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Stamp Lab Passport</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PART I: COLLEGE LABORATORY MANUAL (SOURCE & THEORY) */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-indigo-300 font-mono text-xs font-bold uppercase tracking-wider shadow-md">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span>PART I: COLLEGE LABORATORY MANUAL (SOURCE &amp; THEORY)</span>
        </div>
        <span className="text-[11px] text-indigo-400 font-normal hidden sm:inline">
          Authentic Curriculum Record • {topic.source.manualTitle}
        </span>
      </div>

      {/* 3. AIM & OBJECTIVES */}
      <div className="bg-[#0b101e] border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
          <FlaskConical className="w-4 h-4" />
          <span>AIM</span>
        </div>
        <p className="text-sm font-mono text-slate-200 bg-[#070b14] border border-slate-800/80 p-3.5 rounded-lg leading-relaxed">
          {topic.aim}
        </p>

        {topic.objectives && topic.objectives.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-mono text-slate-400 font-semibold block">OBJECTIVES:</span>
            <ul className="space-y-1 text-xs font-mono text-slate-300 bg-[#070b14] p-3 rounded-lg border border-slate-800/60">
              {topic.objectives.map((obj, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 4. APPARATUS & COMPONENTS REQUIRED */}
      <div className="bg-[#0b101e] border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>APPARATUS / COMPONENTS REQUIRED</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {topic.apparatus.length} Items Listed in Manual
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {topic.apparatus.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#070b14] border border-slate-800/80 rounded-lg p-2.5 flex items-start gap-2 text-xs font-mono text-slate-300"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. THEORY & OPERATING PRINCIPLE */}
      <div className="bg-[#0b101e] border border-slate-800 rounded-xl p-5 space-y-3">
        <div
          onClick={() => setShowTheory(!showTheory)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>THEORY & OPERATING PRINCIPLE</span>
          </div>
          <button className="text-slate-400 hover:text-white">
            {showTheory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showTheory && (
          <div className="space-y-4 pt-2 text-xs font-mono">
            <div className="bg-[#070b14] border border-slate-800/80 rounded-lg p-4 text-slate-300 whitespace-pre-line leading-relaxed text-justify">
              {topic.theory.overview}
            </div>

            {/* Key Technical Points */}
            <div className="space-y-1.5">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                KEY WORKING PRINCIPLES:
              </span>
              <ul className="space-y-1.5 bg-[#070b14] p-3.5 rounded-lg border border-slate-800/70 text-slate-300">
                {topic.theory.keyPoints.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Equations */}
            {topic.theory.equations && topic.theory.equations.length > 0 && (
              <div className="space-y-2">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  GOVERNING EQUATIONS:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {topic.theory.equations.map((eq, idx) => (
                    <div
                      key={idx}
                      className="bg-[#070b14] border border-cyan-950 rounded-lg p-3 space-y-1 font-mono"
                    >
                      <span className="text-[11px] text-cyan-400 font-bold block">{eq.label}</span>
                      <div className="text-xs text-slate-100 bg-[#0b101e] px-2.5 py-1.5 rounded border border-slate-800">
                        {eq.formula}
                      </div>
                      {eq.explanation && (
                        <p className="text-[10px] text-slate-400">{eq.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Supplementary Explanations */}
            {topic.theory.supplementaryNotes && topic.theory.supplementaryNotes.length > 0 && (
              <div className="bg-indigo-950/30 border border-indigo-700/40 rounded-lg p-3 space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                  SUPPLEMENTARY TECHNICAL EXPLANATION
                </span>
                {topic.theory.supplementaryNotes.map((note, idx) => (
                  <p key={idx} className="text-xs text-indigo-200 leading-relaxed">
                    {note}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. DESIGN PROCEDURE & CALCULATIONS */}
      {topic.designCalculations && (
        <div className="bg-[#0b101e] border border-slate-800 rounded-xl p-5 space-y-3">
          <div
            onClick={() => setShowCalculations(!showCalculations)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              <span>DESIGN PROCEDURE & CALCULATIONS</span>
            </div>
            <button className="text-slate-400 hover:text-white">
              {showCalculations ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showCalculations && (
            <div className="space-y-3 pt-2 text-xs font-mono">
              {topic.designCalculations.specifications && (
                <div className="bg-[#070b14] border border-slate-800/80 rounded-lg p-3 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] block">
                    GIVEN DESIGN SPECIFICATIONS:
                  </span>
                  <ul className="space-y-1 text-slate-300">
                    {topic.designCalculations.specifications.map((spec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-cyan-400">▸</span>
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {topic.designCalculations.formulas.map((form, idx) => (
                  <div key={idx} className="bg-[#070b14] border border-slate-800 rounded-lg p-3 space-y-1.5">
                    <span className="text-xs text-cyan-300 font-bold block">{form.name}</span>
                    <div className="bg-[#0b101e] border border-slate-800 p-2 rounded text-slate-100 font-mono text-xs">
                      {form.formula}
                    </div>
                    {form.description && (
                      <p className="text-[11px] text-slate-400 whitespace-pre-line">{form.description}</p>
                    )}
                    {form.calculationNote && (
                      <p className="text-[10px] text-amber-400/90 bg-amber-950/20 p-1.5 rounded border border-amber-900/30">
                        {form.calculationNote}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {topic.designCalculations.reviewNotes && (
                <div className="bg-amber-950/20 border border-amber-700/40 rounded-lg p-3 text-xs text-amber-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>MANUAL REVIEW NOTE</span>
                  </div>
                  {topic.designCalculations.reviewNotes.map((rn, idx) => (
                    <p key={idx} className="text-[11px] leading-relaxed text-amber-200">
                      {rn}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 7. CIRCUIT SCHEMATIC SPECIFICATION */}
      <div className="bg-[#0b101e] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>CIRCUIT SCHEMATIC SPECIFICATION</span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {topic.schematic.topologyName}
          </span>
        </div>

        <p className="text-xs font-mono text-slate-300 bg-[#070b14] border border-slate-800/80 p-3 rounded-lg leading-relaxed">
          {topic.schematic.description}
        </p>

        {/* Components Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border border-slate-800 rounded-lg overflow-hidden">
            <thead className="bg-[#0f172a] text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-2.5">Designation</th>
                <th className="p-2.5">Component Value</th>
                <th className="p-2.5">Functional Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 bg-[#070b14]">
              {topic.schematic.components.map((comp, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40">
                  <td className="p-2.5 font-bold text-cyan-300">{comp.designation}</td>
                  <td className="p-2.5 text-emerald-300">{comp.value}</td>
                  <td className="p-2.5 text-slate-300">{comp.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {topic.schematic.diagramNotes && (
          <div className="bg-[#070b14] p-3 rounded-lg border border-slate-800/60 space-y-1 text-xs font-mono text-slate-400">
            <span className="text-[10px] uppercase font-bold text-slate-500">DIAGRAM NOTES:</span>
            {topic.schematic.diagramNotes.map((dn, idx) => (
              <p key={idx}>• {dn}</p>
            ))}
          </div>
        )}
      </div>

      {/* 8. LABORATORY PROCEDURE */}
      <div className="bg-[#0b101e] border border-slate-800 rounded-xl p-5 space-y-3">
        <div
          onClick={() => setShowProcedure(!showProcedure)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
            <FlaskConical className="w-4 h-4" />
            <span>STEP-BY-STEP PROCEDURE</span>
          </div>
          <button className="text-slate-400 hover:text-white">
            {showProcedure ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showProcedure && (
          <div className="space-y-2 pt-2 text-xs font-mono">
            <ol className="space-y-2 bg-[#070b14] p-4 rounded-lg border border-slate-800/80 text-slate-300 leading-relaxed">
              {topic.procedure.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded bg-slate-900 border border-slate-700 text-cyan-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step.replace(/^\d+[\.\)]\s*/, '')}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* PART II: ACTIVE SIMULATION & MODELING */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider shadow-md">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>PART II: ACTIVE SIMULATION &amp; MODELING</span>
        </div>
        <span className="text-[11px] text-cyan-400 font-normal hidden sm:inline">
          SPICE Analytical Engine • Real-Time Model Validation
        </span>
      </div>

      {isSimulationAdjusted && (
        <div className="bg-amber-950/30 border border-amber-500/50 rounded-xl p-3.5 text-xs font-mono text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300">Note: Simulation parameters adjusted from source manual for ideal modeling.</strong>
            <p className="text-amber-200/90 text-[11px] mt-0.5">
              Circuit schematic, threshold calculations, and dynamic graphs reflect active simulation parameters rather than historical manual entries.
            </p>
          </div>
        </div>
      )}

      {/* 9. INTERACTIVE SIMULATION INTEGRATION / SIMULATION LIMITATIONS */}
      <div className="bg-[#0b101e] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
            <Zap className="w-4 h-4" />
            <span>SIMULATION ENGINE INTEGRATION</span>
          </div>

          {topic.mappedCircuitId && onOpenCircuitSimulator && (
            <button
              onClick={() => {
                recordSimulationRun(topic.id);
                onOpenCircuitSimulator(topic.mappedCircuitId!);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-mono hover:bg-[#00F0FF]/25 transition cursor-pointer font-bold shadow-[0_0_10px_rgba(0,240,255,0.2)]"
            >
              <span>Open in Circuit Simulator</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Check simulation fidelity */}
        {topic.simulationLimitation && !topic.simulationLimitation.isFullySupported ? (
          <div className="bg-amber-950/20 border border-amber-600/50 rounded-xl p-4 space-y-2.5 text-xs font-mono">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>SIMULATION LIMITATION & TOPOLOGY NOTICE</span>
            </div>
            <p className="text-amber-200 leading-relaxed">
              {topic.simulationLimitation.mismatchDescription}
            </p>
            {topic.simulationLimitation.opAmpEquivalentNote && (
              <div className="bg-[#070b14] border border-amber-900/40 p-3 rounded-lg text-slate-300">
                <strong>Op-Amp Equivalent: </strong>
                {topic.simulationLimitation.opAmpEquivalentNote}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#070b14] border border-emerald-900/40 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Faithfully Simulated by OPTI-SIM Module: {topic.simulationLimitation?.mappedModuleName || 'Active Op-Amp Simulator'}</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                The calculation engine and waveform synthesizers model this circuit topology directly.
                You can test frequencies, amplitudes, and capture live readings into the observation table below.
              </p>
            </div>

            {topic.observationTables.length > 0 && (
              <button
                onClick={() => handleCaptureSimulation(topic.observationTables[0].id)}
                className="px-3 py-2 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-semibold shrink-0 transition cursor-pointer flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Capture Active Simulation Reading</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 10. GRAPH & WAVEFORM REQUIREMENTS */}
      {topic.graphRequirements && topic.graphRequirements.length > 0 && (
        <div className="bg-[#0b101e] border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            <span>EXPECTED WAVEFORMS & GRAPH REQUIREMENTS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            {topic.graphRequirements.map((gr, idx) => (
              <div key={idx} className="bg-[#070b14] border border-slate-800 rounded-lg p-3.5 space-y-2">
                <span className="font-bold text-slate-200 block text-xs">{gr.description}</span>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>X-Axis: <strong className="text-cyan-300">{gr.axes.x}</strong></span>
                  <span>•</span>
                  <span>Y-Axis: <strong className="text-cyan-300">{gr.axes.y}</strong></span>
                </div>
                <p className="text-[11px] text-slate-400 bg-[#0b101e] p-2 rounded border border-slate-800/80">
                  {gr.expectedBehavior}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 11. OBSERVATION TABLES (HISTORICAL READINGS + STUDENT EDITABLE TABLE) */}
      <div className="bg-[#0b101e] border border-slate-800 rounded-xl p-5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>OBSERVATION TABLES</span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Source Readings & Student Experimental Logs
          </span>
        </div>

        {topic.observationTables.map((tbl) => {
          const currentStudentRows = observations[tbl.id] || [];

          return (
            <div key={tbl.id} className="space-y-4 bg-[#070b14] border border-slate-800 rounded-xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold font-mono text-slate-100">{tbl.title}</h3>
                  {tbl.subtitle && (
                    <p className="text-xs font-mono text-slate-400 mt-0.5">{tbl.subtitle}</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap text-xs font-mono">
                  {topic.mappedCircuitId && (
                    <button
                      onClick={() => handleCaptureSimulation(tbl.id)}
                      className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-900 transition cursor-pointer flex items-center gap-1"
                      title="Add current simulator point to table"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Capture Sim</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleAddRow(tbl.id)}
                    className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Row</span>
                  </button>

                  <button
                    onClick={() => handleResetTable(tbl.id)}
                    className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                    title="Reset to default template"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => handleClearTable(tbl.id)}
                    className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-rose-400 hover:text-rose-200 transition cursor-pointer"
                    title="Clear table rows"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Editable Student Observations Table */}
              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#0f172a] text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      {tbl.columns.map((col) => (
                        <th key={col.key} className="p-2.5 whitespace-nowrap">
                          {formatColumnHeader(col)}
                        </th>
                      ))}
                      <th className="p-2.5 w-10 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 bg-[#090e1a]">
                    {currentStudentRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={tbl.columns.length + 1}
                          className="p-6 text-center text-slate-500 italic"
                        >
                          No observation rows. Click &quot;Add Row&quot; or &quot;Capture Sim&quot; to begin.
                        </td>
                      </tr>
                    ) : (
                      currentStudentRows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-900/60">
                          {tbl.columns.map((col) => (
                            <td key={col.key} className="p-2 whitespace-nowrap">
                              <input
                                type={col.type === 'number' ? 'number' : 'text'}
                                value={row[col.key] !== undefined ? row[col.key] : ''}
                                onChange={(e) =>
                                  handleCellChange(
                                    tbl.id,
                                    row.id,
                                    col.key,
                                    col.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value
                                  )
                                }
                                placeholder={col.placeholder || '—'}
                                className="w-full min-w-[90px] bg-[#070b14] border border-slate-800 focus:border-cyan-500 rounded px-2 py-1 text-slate-200 text-xs font-mono"
                              />
                            </td>
                          ))}
                          <td className="p-2 text-center">
                            <button
                              onClick={() => handleDeleteRow(tbl.id, row.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded transition cursor-pointer"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Historical College Readings from Scan (Reference Accordion) */}
              {tbl.sourceSampleRows && tbl.sourceSampleRows.length > 0 && (
                <details className="text-xs font-mono bg-[#0b101e] border border-slate-800 rounded-lg p-3 group">
                  <summary className="cursor-pointer text-slate-400 hover:text-cyan-300 font-semibold flex items-center justify-between select-none">
                    <span>
                      📋 Historical Readings from Scanned Manual ({tbl.sourceSampleRows.length} points recorded in college scan)
                    </span>
                    <span className="text-[10px] text-slate-500 group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </summary>

                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-[11px] font-mono border border-slate-800 rounded">
                      <thead className="bg-[#070b14] text-slate-400 border-b border-slate-800">
                        <tr>
                          {tbl.columns.map((col) => (
                            <th key={col.key} className="p-2">
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-[#070b14]/50">
                        {tbl.sourceSampleRows.map((sample, sIdx) => (
                          <tr key={sIdx} className="hover:bg-slate-900/30">
                            {tbl.columns.map((col) => (
                              <td key={col.key} className="p-2 text-slate-300 font-mono">
                                {sample[col.key] !== undefined ? String(sample[col.key]) : '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </div>
          );
        })}
      </div>

      {/* 12. RESULTS TABLE (THEORETICAL VS PRACTICAL) */}
      {topic.resultsTable && topic.resultsTable.length > 0 && (
        <div className="bg-[#0b101e] border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>RESULTS &amp; THEORETICAL VS PRACTICAL COMPARISON</span>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0f172a] text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Parameter</th>
                  <th className="p-2.5">Theoretical Value</th>
                  <th className="p-2.5">Simulated Value</th>
                  <th className="p-2.5">Source Manual Reading</th>
                  <th className="p-2.5">Student Measurement</th>
                  {topic.resultsTable.some((r) => r.remarks) && <th className="p-2.5">Remarks</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 bg-[#070b14]">
                {topic.resultsTable.map((res, idx) => {
                  let studentVal = '';
                  const firstTbl = topic.observationTables[0];
                  const studentRows = firstTbl ? (observations[firstTbl.id] || []) : [];
                  const genuineRow = studentRows.find((row: any) => {
                    if (!row || String(row.id || '').startsWith('ns-') || String(row.id || '').startsWith('sim-')) return false;
                    return (row.vutp !== undefined && row.vutp !== '' && row.vutp !== null) ||
                           (row.vltp !== undefined && row.vltp !== '' && row.vltp !== null) ||
                           (row.studentVout !== undefined && row.studentVout !== '' && row.studentVout !== null) ||
                           (row.croOutput !== undefined && row.croOutput !== '' && row.croOutput !== null);
                  });
                  if (genuineRow) {
                    const lp = res.parameter.toLowerCase();
                    if (lp.includes('vutp') && genuineRow.vutp) studentVal = `${genuineRow.vutp} V`;
                    else if (lp.includes('vltp') && genuineRow.vltp) studentVal = `${genuineRow.vltp} V`;
                    else if (lp.includes('+vsat') && genuineRow.posVsat) studentVal = `${genuineRow.posVsat} V`;
                    else if (lp.includes('-vsat') && genuineRow.negVsat) studentVal = `${genuineRow.negVsat} V`;
                    else if (lp.includes('vh') && genuineRow.vh) studentVal = `${genuineRow.vh} V`;
                  } else if (res.studentMeasured && res.studentMeasured !== 'Not recorded') {
                    studentVal = res.studentMeasured;
                  }

                  const hasStudentVal = Boolean(studentVal && studentVal.trim() !== '' && studentVal !== 'Not recorded');
                  const sourceDisplay = res.sourceManual || res.practical || '—';

                  return (
                    <tr key={idx} className="hover:bg-slate-900/50">
                      <td className="p-2.5 font-bold text-slate-200">{res.parameter}</td>
                      <td className="p-2.5 text-cyan-300 font-bold">{res.theoretical}</td>
                      <td className="p-2.5 text-purple-400 font-bold">{res.simulated || res.theoretical}</td>
                      <td className="p-2.5 text-emerald-300 font-bold">{sourceDisplay}</td>
                      <td className={`p-2.5 font-bold ${hasStudentVal ? 'text-emerald-400' : 'text-slate-500 italic'}`}>
                        {hasStudentVal ? studentVal : 'Not recorded'}
                      </td>
                      {topic.resultsTable && topic.resultsTable.some((r) => r.remarks) && (
                        <td className="p-2.5 text-slate-400 text-[11px]">{res.remarks || '—'}</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 13. CONCLUSION */}
      <div className="bg-[#0b101e] border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
          <CheckCircle2 className="w-4 h-4" />
          <span>CONCLUSION</span>
        </div>

        {/* Verbatim manual conclusion */}
        <div className="bg-[#070b14] border border-emerald-900/50 rounded-lg p-3.5 space-y-1">
          <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
            MANUAL VERBATIM CONCLUSION:
          </span>
          <p className="text-xs font-mono text-emerald-200 leading-relaxed">
            {topic.conclusion}
          </p>
        </div>

        {/* Student personal conclusion */}
        <div className="space-y-1 pt-1">
          <label className="text-xs font-mono text-slate-400 block font-semibold">
            Student Observation Remark / Conclusion:
          </label>
          <textarea
            value={studentConclusion}
            onChange={(e) => {
              setStudentConclusion(e.target.value);
              localStorage.setItem(`optisim_syllabus_conclusion_${topic.id}`, e.target.value);
            }}
            placeholder="Enter your personal analysis, percentage error calculation, or hardware bench remarks..."
            rows={2}
            className="w-full bg-[#070b14] border border-slate-800 focus:border-cyan-500 rounded-lg p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-hidden"
          />
        </div>
      </div>

      {/* 14. ORAL / VIVA QUESTIONS */}
      {topic.vivaQuestions && topic.vivaQuestions.length > 0 && (
        <div className="bg-[#0b101e] border border-slate-800 rounded-xl p-5 space-y-3">
          <div
            onClick={() => setShowViva(!showViva)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              <HelpCircle className="w-4 h-4" />
              <span>ORAL / VIVA VOCE QUESTIONS ({topic.vivaQuestions.length})</span>
            </div>
            <button className="text-slate-400 hover:text-white">
              {showViva ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showViva && (
            <div className="space-y-2 pt-2 text-xs font-mono">
              {topic.vivaQuestions.map((vq, idx) => {
                const isOpen = openVivaIndex === idx;

                return (
                  <div
                    key={idx}
                    className="bg-[#070b14] border border-slate-800 rounded-lg p-3.5 space-y-2"
                  >
                    <div
                      onClick={() => setOpenVivaIndex(isOpen ? null : idx)}
                      className="flex items-start justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="flex items-start gap-2 text-slate-200 font-semibold">
                        <span className="text-cyan-400">Q{vq.questionNumber}.</span>
                        <span>{vq.question}</span>
                      </div>
                      <span className="text-slate-500 text-[10px] shrink-0 mt-0.5">
                        {isOpen ? '▲ Hide Hint' : '▼ Show Hint'}
                      </span>
                    </div>

                    {isOpen && vq.answerHint && (
                      <div className="bg-[#0b101e] border border-slate-800/80 rounded p-3 text-cyan-200/90 text-xs leading-relaxed">
                        <strong className="text-cyan-400 block mb-1">Key Conceptual Answer:</strong>
                        {vq.answerHint}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 15. REFERENCE BOOKS */}
      {topic.referenceBooks && topic.referenceBooks.length > 0 && (
        <div className="bg-[#0b101e] border border-slate-800 rounded-xl p-5 space-y-2 text-xs font-mono">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
            REFERENCE BOOKS & TEXTBOOKS:
          </span>
          <ul className="space-y-1 text-slate-300 bg-[#070b14] p-3 rounded-lg border border-slate-800/70">
            {topic.referenceBooks.map((book, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-cyan-400">{idx + 1}.</span>
                <span>{book}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 16. STUDENT LABORATORY SCRATCHPAD / HARDWARE READINGS */}
      <div className="bg-[#0b101e] border border-slate-800 rounded-xl p-5 space-y-2 text-xs font-mono">
        <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
          STUDENT BENCH LOG & HARDWARE MEASUREMENTS:
        </span>
        <textarea
          value={studentNotes}
          onChange={(e) => {
            setStudentNotes(e.target.value);
            localStorage.setItem(`optisim_syllabus_notes_${topic.id}`, e.target.value);
          }}
          placeholder="Record real bench component values (multimeter measured resistance, actual supply voltages, DSO screenshot notes, etc.)..."
          rows={3}
          className="w-full bg-[#070b14] border border-slate-800 focus:border-cyan-500 rounded-lg p-3 text-slate-200 placeholder-slate-600 focus:outline-hidden"
        />
      </div>
    </div>
  );
};
