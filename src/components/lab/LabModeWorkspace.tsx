import React, { useState, useEffect, useRef } from 'react';
import { LAB_EXPERIMENTS, generateIntelligentConclusion } from '../../utils/labExperimentsData';
import { CIRCUIT_REGISTRY } from '../../circuits/registry';
import { ObservationRow, SavedExperimentConfig } from '../../types/lab';
import {
  exportExperimentToJSON,
  parseAndValidateExperimentJSON,
  exportExperimentToCSV,
  printExperimentReport
} from '../../utils/exportEngine';
import { saveExperiment, addCalculationHistory } from '../../utils/historyStorage';
import {
  getActiveCircuitState,
  CIRCUIT_UPDATE_EVENT,
  generateObservationFromSimulation
} from '../../utils/circuitStateBridge';
import { getStoredStudentProfile } from '../../utils/studentSync';
import {
  BookOpen,
  FlaskConical,
  FileText,
  Printer,
  Download,
  Upload,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
  Table,
  Sliders,
  ListOrdered,
  Camera,
  Activity,
  GraduationCap
} from 'lucide-react';
import { SyllabusPracticalsList } from './SyllabusPracticalsList';
import { SyllabusTopicDetail } from './SyllabusTopicDetail';
import { SyllabusTopic } from '../../types/syllabus';
import { SYLLABUS_PRACTICALS_REGISTRY } from '../../data/syllabusRegistry';
import { getPassportSummary, OPTI_SIM_PASSPORT_UPDATE_EVENT } from '../../utils/labPassportStorage';

interface LabModeWorkspaceProps {
  selectedCircuitId: string;
  onSelectCircuit: (id: string) => void;
  onExitLabMode: () => void;
  onNotice?: (msg: string) => void;
  children: React.ReactNode;
}

export const LabModeWorkspace: React.FC<LabModeWorkspaceProps> = ({
  selectedCircuitId,
  onSelectCircuit,
  onExitLabMode,
  onNotice,
  children,
}) => {
  const experiment = LAB_EXPERIMENTS[selectedCircuitId] || LAB_EXPERIMENTS['inverting-amplifier'];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Milestone Lab Passport summary count
  const [passportStats, setPassportStats] = useState(() => getPassportSummary());

  useEffect(() => {
    const handleUpdate = () => {
      setPassportStats(getPassportSummary());
    };
    window.addEventListener(OPTI_SIM_PASSPORT_UPDATE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(OPTI_SIM_PASSPORT_UPDATE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Section switcher: A. Existing OPTI-SIM Topics vs B. College Syllabus Practicals
  const [activeSection, setActiveSection] = useState<'optisim-topics' | 'syllabus-practicals'>(() => {
    return (localStorage.getItem('optisim_lab_active_section') as any) || 'syllabus-practicals';
  });

  const [selectedSyllabusTopic, setSelectedSyllabusTopic] = useState<SyllabusTopic | null>(() => {
    const savedTopicId = localStorage.getItem('optisim_selected_syllabus_id');
    if (savedTopicId) {
      return SYLLABUS_PRACTICALS_REGISTRY.find((t) => t.id === savedTopicId) || null;
    }
    return null;
  });

  const handleSwitchSection = (section: 'optisim-topics' | 'syllabus-practicals') => {
    setActiveSection(section);
    localStorage.setItem('optisim_lab_active_section', section);
  };

  const handleSelectSyllabusTopic = (topic: SyllabusTopic | null) => {
    setSelectedSyllabusTopic(topic);
    if (topic) {
      localStorage.setItem('optisim_selected_syllabus_id', topic.id);
    } else {
      localStorage.removeItem('optisim_selected_syllabus_id');
    }
  };

  // Collapsible section toggles
  const [showTheory, setShowTheory] = useState<boolean>(true);
  const [showProcedure, setShowProcedure] = useState<boolean>(false);
  const [showComparison, setShowComparison] = useState<boolean>(true);

  // Student details
  const [studentName, setStudentName] = useState<string>(() => {
    return localStorage.getItem('optisim_student_name') || 'ENTC Student';
  });

  // Observations state per experiment
  const [observations, setObservations] = useState<ObservationRow[]>(() => {
    try {
      const saved = localStorage.getItem(`optisim_obs_${experiment.id}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return experiment.defaultObservationRows;
  });

  // Notes state per experiment
  const [notes, setNotes] = useState<string>(() => {
    return localStorage.getItem(`optisim_notes_${experiment.id}`) || '';
  });

  // Active circuit inputs and calculation results synchronization
  const [activeState, setActiveState] = useState(() => getActiveCircuitState(selectedCircuitId));

  // Reload observations, notes, and active circuit state when experiment changes
  useEffect(() => {
    setActiveState(getActiveCircuitState(selectedCircuitId));

    try {
      const savedObs = localStorage.getItem(`optisim_obs_${experiment.id}`);
      if (savedObs) {
        setObservations(JSON.parse(savedObs));
      } else {
        setObservations(experiment.defaultObservationRows);
      }

      const savedNotes = localStorage.getItem(`optisim_notes_${experiment.id}`);
      setNotes(savedNotes || '');
    } catch {
      setObservations(experiment.defaultObservationRows);
      setNotes('');
    }

    const handleCircuitUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.circuitId === selectedCircuitId) {
        setActiveState({
          inputs: customEvent.detail.inputs,
          results: customEvent.detail.results,
        });
      }
    };

    window.addEventListener(CIRCUIT_UPDATE_EVENT, handleCircuitUpdate);
    return () => window.removeEventListener(CIRCUIT_UPDATE_EVENT, handleCircuitUpdate);
  }, [selectedCircuitId, experiment.id]);

  // Persist student name
  const handleStudentNameChange = (name: string) => {
    setStudentName(name);
    localStorage.setItem('optisim_student_name', name);
  };

  // Persist observations
  const updateObservations = (newObs: ObservationRow[]) => {
    setObservations(newObs);
    try {
      localStorage.setItem(`optisim_obs_${experiment.id}`, JSON.stringify(newObs));
    } catch (e) {
      console.warn('Failed to save observations:', e);
    }
  };

  // Persist notes
  const updateNotes = (newNotes: string) => {
    setNotes(newNotes);
    try {
      localStorage.setItem(`optisim_notes_${experiment.id}`, newNotes);
    } catch (e) {
      console.warn('Failed to save notes:', e);
    }
  };

  // Observation table actions
  const handleAddObservationRow = () => {
    const newRow: ObservationRow = {
      id: `row-${Date.now()}`
    };
    experiment.defaultObservationColumns.forEach((col) => {
      newRow[col.key] = col.type === 'number' ? 0 : '-';
    });
    updateObservations([...observations, newRow]);
    onNotice?.('New row added to observations.');
  };

  const handleUpdateObservationCell = (rowId: string, colKey: string, val: any) => {
    const updated = observations.map((r) => {
      if (r.id === rowId) {
        return { ...r, [colKey]: val };
      }
      return r;
    });
    updateObservations(updated);
  };

  const handleDeleteObservationRow = (rowId: string) => {
    const updated = observations.filter((r) => r.id !== rowId);
    updateObservations(updated);
    onNotice?.('Observation row deleted.');
  };

  const handleClearObservationTable = () => {
    if (confirm('Are you sure you want to clear all recorded observations for this experiment?')) {
      updateObservations([]);
      onNotice?.('Observations cleared.');
    }
  };

  // Dynamic comparison items & statements derived from active state
  const comparisonItems = experiment.generateComparison(activeState.inputs, activeState.results);
  const dynamicResultStatement = experiment.generateResult(activeState.inputs, activeState.results);
  const dynamicConclusion = generateIntelligentConclusion(
    experiment.id,
    activeState.inputs,
    activeState.results,
    comparisonItems
  );

  // Capture current simulation directly into observations table
  const handleCaptureSimulation = () => {
    const row = generateObservationFromSimulation(experiment.id, activeState.inputs, activeState.results);
    if (row) {
      updateObservations([...observations, row]);
      onNotice?.('Captured current live simulation values into observation table.');
    } else {
      handleAddObservationRow();
    }
  };

  // Save experiment to persistent storage
  const handleSaveExperiment = () => {
    saveExperiment({
      experimentNumber: experiment.experimentNumber,
      title: experiment.title,
      circuitId: experiment.id,
      studentName,
      inputs: activeState.inputs,
      observations,
      notes
    });

    // Also record in calculation history
    addCalculationHistory({
      circuitId: experiment.id,
      circuitName: experiment.title,
      category: experiment.category,
      inputsSummary: `Experiment ${experiment.experimentNumber} recorded`,
      outputsSummary: `Observations: ${observations.length} rows`,
      keyMetrics: {
        experiment: experiment.experimentNumber,
        observationsCount: observations.length
      }
    });

    onNotice?.(`Experiment ${experiment.experimentNumber} (${experiment.title}) successfully saved.`);
  };

  // Reset experiment
  const handleResetExperiment = () => {
    if (confirm('Reset this experiment to factory default observations and notes? (Saved history will remain safe)')) {
      updateObservations(experiment.defaultObservationRows);
      updateNotes('');
      onNotice?.('Experiment reset to default state.');
    }
  };

  // Export handlers
  const handleExportPDF = () => {
    const profile = getStoredStudentProfile();
    printExperimentReport({
      title: experiment.title,
      experimentNumber: experiment.experimentNumber,
      aim: experiment.aim,
      theory: experiment.theory,
      formulas: experiment.formulas,
      procedure: experiment.procedure,
      comparison: comparisonItems,
      observations,
      observationColumns: experiment.defaultObservationColumns,
      resultStatement: dynamicResultStatement,
      conclusion: dynamicConclusion,
      parameters: activeState.inputs,
      notes,
      studentName: profile?.fullName || studentName,
      division: profile?.division,
      rollNumber: profile?.rollNumber,
      studentProfile: profile || undefined,
      circuitId: selectedCircuitId,
      activeResults: activeState.results,
    });
  };

  const handleExportCSV = () => {
    exportExperimentToCSV({
      title: experiment.title,
      experimentNumber: experiment.experimentNumber,
      comparison: comparisonItems,
      observations,
      observationColumns: experiment.defaultObservationColumns,
      parameters: activeState.inputs
    });
    onNotice?.('CSV data exported successfully.');
  };

  const handleExportJSON = () => {
    const config: SavedExperimentConfig = {
      id: `exp-${Date.now()}`,
      timestamp: Date.now(),
      dateFormatted: new Date().toLocaleString(),
      experimentNumber: experiment.experimentNumber,
      title: experiment.title,
      circuitId: experiment.id,
      studentName,
      observations,
      notes
    };
    exportExperimentToJSON(config);
    onNotice?.('JSON configuration exported.');
  };

  const handleImportJSONClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const config = parseAndValidateExperimentJSON(content);

        // Switch circuit if needed
        if (config.circuitId !== selectedCircuitId) {
          onSelectCircuit(config.circuitId);
        }

        if (config.observations) {
          updateObservations(config.observations);
        }
        if (config.notes) {
          updateNotes(config.notes);
        }
        if (config.studentName) {
          handleStudentNameChange(config.studentName);
        }

        onNotice?.(`Imported Experiment ${config.experimentNumber}: "${config.title}"`);
      } catch (err: any) {
        alert(err.message || 'Failed to import experiment file.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#0B0F19] text-slate-100 min-h-0">
      {/* Hidden file input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* 1. TOP LAB BANNER & ACTION BAR */}
      <div className="bg-[#1A1E29] border-b border-white/10 px-4 py-3 sm:px-6 shrink-0 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Mode Title, Section Tabs & Experiment Dropdown */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[3px] bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
                <FlaskConical className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#00F0FF] uppercase tracking-wider">
                    ENGINEERING LAB MODE
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {activeSection === 'syllabus-practicals'
                      ? (selectedSyllabusTopic ? selectedSyllabusTopic.secondaryRefNumber : 'College Practicals')
                      : `Exp ${experiment.experimentNumber} of 17`}
                  </span>
                </div>
                <h1 className="text-sm sm:text-base font-bold font-mono text-white max-w-md truncate">
                  {activeSection === 'syllabus-practicals'
                    ? (selectedSyllabusTopic ? selectedSyllabusTopic.title : 'College Practicals')
                    : experiment.title}
                </h1>
              </div>
            </div>

            {/* SECTIONS SWITCHER: A vs B */}
            <div className="flex items-center bg-[#0B0F19] p-0.5 rounded-[3px] border border-white/10 text-xs font-mono">
              <button
                onClick={() => handleSwitchSection('optisim-topics')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] transition cursor-pointer ${
                  activeSection === 'optisim-topics'
                    ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Existing 17 Guided OPTI-SIM Experiments"
              >
                <span>A. OPTI-SIM Topics</span>
                <span className={`text-[10px] px-1 rounded-[2px] ${
                  activeSection === 'optisim-topics' ? 'bg-[#0B0F19]/20 text-[#0B0F19] font-bold' : 'bg-[#111520] text-slate-400'
                }`}>17</span>
              </button>

              <button
                onClick={() => handleSwitchSection('syllabus-practicals')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] transition cursor-pointer ${
                  activeSection === 'syllabus-practicals'
                    ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="College Practicals"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>B. College Practicals</span>
                <span className={`text-[10px] px-1.5 rounded-[2px] font-bold ${
                  activeSection === 'syllabus-practicals'
                    ? 'bg-[#0B0F19]/20 text-[#0B0F19]'
                    : passportStats.completedCount > 0
                      ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30'
                      : 'bg-[#111520] text-slate-400'
                }`}>
                  {passportStats.completedCount > 0 ? `${passportStats.completedCount}/${passportStats.totalCount}` : '8'}
                </span>
              </button>
            </div>

            {/* Experiment Quick Switcher (Only in Section A) */}
            {activeSection === 'optisim-topics' && (
              <div className="relative">
                <select
                  value={selectedCircuitId}
                  onChange={(e) => onSelectCircuit(e.target.value)}
                  className="bg-[#111520] border border-white/10 text-xs font-mono text-[#00F0FF] rounded-[3px] px-2.5 py-1.5 focus:outline-none focus:border-[#00F0FF] cursor-pointer"
                >
                  {CIRCUIT_REGISTRY.map((c, idx) => (
                    <option key={c.id} value={c.id}>
                      Exp {idx + 1}: {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Right: Lab Controls (PDF, CSV, JSON, Save, Exit) */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs font-mono">
            {activeSection === 'optisim-topics' && (
              <>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-[#0B0F19] font-bold shadow-[0_0_10px_rgba(0,240,255,0.25)] transition cursor-pointer"
                  title="Generate printable technical laboratory report"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print / PDF</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[3px] bg-[#111520] border border-white/10 text-slate-300 hover:text-white hover:bg-[#1A1E29] transition cursor-pointer"
                  title="Export observation data as CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>

                <button
                  onClick={handleExportJSON}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[3px] bg-[#111520] border border-white/10 text-slate-300 hover:text-white hover:bg-[#1A1E29] transition cursor-pointer"
                  title="Export full experiment JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>JSON</span>
                </button>

                <button
                  onClick={handleImportJSONClick}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[3px] bg-[#111520] border border-white/10 text-slate-300 hover:text-white hover:bg-[#1A1E29] transition cursor-pointer"
                  title="Import previously saved experiment JSON"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import</span>
                </button>

                <button
                  onClick={handleSaveExperiment}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[3px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer"
                  title="Save experiment to browser local storage"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>

                <button
                  onClick={handleResetExperiment}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-[3px] bg-[#111520] border border-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Reset current experiment observations to default"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            <button
              onClick={onExitLabMode}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[3px] bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer ml-1"
            >
              <span>Exit Lab</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. BODY CONTENT: SYLLABUS PRACTICALS VS EXISTING 17 EXPERIMENTS */}
      {activeSection === 'syllabus-practicals' ? (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {selectedSyllabusTopic ? (
            <SyllabusTopicDetail
              topic={selectedSyllabusTopic}
              onBack={() => handleSelectSyllabusTopic(null)}
              onOpenCircuitSimulator={(cId) => {
                handleSwitchSection('optisim-topics');
                onSelectCircuit(cId);
              }}
              onNotice={onNotice}
            />
          ) : (
            <SyllabusPracticalsList
              onSelectTopic={(t) => handleSelectSyllabusTopic(t)}
              onOpenCircuitSimulator={(cId) => {
                handleSwitchSection('optisim-topics');
                onSelectCircuit(cId);
              }}
              onNotice={onNotice}
            />
          )}
        </div>
      ) : (
        /* EXISTING OPTI-SIM 17 EXPERIMENTS CONTAINER */
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* SECTION 1: AIM & STUDENT METADATA */}
        <div className="bg-[#1A1E29] border border-white/10 rounded-[3px] p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-mono font-bold bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF]">
                LAB WORKFLOW STEP 1
              </span>
              <h2 className="text-sm font-semibold font-mono text-slate-200 uppercase tracking-wide">
                Experiment Aim & Objectives
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Student:</span>
              <input
                type="text"
                value={studentName}
                onChange={(e) => handleStudentNameChange(e.target.value)}
                placeholder="Student Name / Group"
                className="bg-[#111520] border border-white/10 rounded-[3px] px-2.5 py-1 text-white focus:outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]/40 text-xs w-44"
              />
            </div>
          </div>

          <p className="text-sm text-slate-300 font-sans leading-relaxed">
            <strong className="text-[#00F0FF] font-mono">Aim: </strong>
            {experiment.aim}
          </p>
        </div>

        {/* SECTION 2 & 3: THEORY & FORMULAS (Collapsible) */}
        <div className="bg-[#1A1E29] border border-white/10 rounded-[3px] overflow-hidden">
          <div
            onClick={() => setShowTheory(!showTheory)}
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition select-none"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#00F0FF]" />
              <h2 className="text-sm font-semibold font-mono text-slate-200 uppercase tracking-wide">
                Theory, Principles & Formulas Used
              </h2>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
              <span>{showTheory ? 'Collapse' : 'Expand'}</span>
              {showTheory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>

          {showTheory && (
            <div className="p-4 sm:p-5 pt-0 border-t border-white/10 space-y-4">
              <div className="space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <p>{experiment.theory.principle}</p>
                <div className="p-2.5 rounded-[3px] bg-[#111520] border border-white/10 font-mono text-[#00F0FF] text-xs">
                  <strong>Main Governing Equation: </strong> {experiment.theory.mainEquation}
                </div>
                <p className="text-slate-400 text-xs">{experiment.theory.circuitRelationship}</p>
              </div>

              {/* Assumptions */}
              <div className="space-y-1">
                <span className="text-xs font-mono text-slate-400 uppercase font-semibold">
                  Operating Assumptions:
                </span>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs text-slate-400 font-sans">
                  {experiment.theory.assumptions.map((assump, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-[#00F0FF] font-mono">•</span>
                      <span>{assump}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Formulas Grid */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <span className="text-xs font-mono text-slate-400 uppercase font-semibold block">
                  Formulas Used:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {experiment.formulas.map((f, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-[3px] bg-[#111520] border border-white/10 space-y-1"
                    >
                      <span className="text-[11px] font-mono text-slate-400 block font-medium">
                        {f.label}
                      </span>
                      <div className="text-xs font-mono font-bold text-[#00F0FF]">
                        {f.formula}
                      </div>
                      {f.description && (
                        <p className="text-[10px] text-slate-400 leading-tight">
                          {f.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: PROCEDURE (Collapsible) */}
        <div className="bg-[#1A1E29] border border-white/10 rounded-[3px] overflow-hidden">
          <div
            onClick={() => setShowProcedure(!showProcedure)}
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition select-none"
          >
            <div className="flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold font-mono text-slate-200 uppercase tracking-wide">
                Experimental Laboratory Procedure
              </h2>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
              <span>{showProcedure ? 'Collapse' : 'Show Steps'}</span>
              {showProcedure ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>

          {showProcedure && (
            <div className="p-4 sm:p-5 pt-0 border-t border-white/10">
              <ol className="space-y-2 text-xs sm:text-sm text-slate-300">
                {experiment.procedure.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-mono text-emerald-400 font-bold shrink-0">{idx + 1}.</span>
                    <span>{step.replace(/^[0-9]+\.\s*/, '')}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* SECTION 5: LIVE CIRCUIT SIMULATOR (Embeds existing simulator without duplication) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#00F0FF]" />
              <h2 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Interactive Circuit Simulation & Analysis Canvas
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Live Interactive Testbed
            </span>
          </div>

          {/* Embedded workspace child */}
          <div className="border border-white/10 rounded-[3px] overflow-hidden bg-[#0B0F19]">
            {children}
          </div>
        </div>

        {/* SECTION 6: THEORETICAL VS SIMULATED RESULTS */}
        <div className="bg-[#1A1E29] border border-white/10 rounded-[3px] overflow-hidden">
          <div
            onClick={() => setShowComparison(!showComparison)}
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition select-none"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold font-mono text-slate-200 uppercase tracking-wide">
                Theoretical vs Simulated Results Comparison
              </h2>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
              <span>{showComparison ? 'Collapse' : 'Expand'}</span>
              {showComparison ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>

          {showComparison && (
            <div className="p-4 sm:p-5 pt-0 border-t border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="py-2.5 px-3">Parameter</th>
                      <th className="py-2.5 px-3 text-right">Theoretical</th>
                      <th className="py-2.5 px-3 text-right">Simulated</th>
                      <th className="py-2.5 px-3 text-right">Error %</th>
                      <th className="py-2.5 px-3">Governing Relation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {comparisonItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-white">{item.parameter}</td>
                        <td className="py-2.5 px-3 text-right text-[#00F0FF]">
                          {item.theoretical} {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-300">
                          {item.simulated} {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          <span
                            className={
                              Number(item.errorPercent) === 0
                                ? 'text-emerald-400'
                                : Number(item.errorPercent) < 5
                                ? 'text-amber-400'
                                : 'text-[#FF5722]'
                            }
                          >
                            {item.errorPercent}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                          {item.formulaExplanation || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 7: OBSERVATION TABLE (Editable) */}
        <div className="bg-[#1A1E29] border border-white/10 rounded-[3px] p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-[#00F0FF]" />
              <h2 className="text-sm font-semibold font-mono text-slate-200 uppercase tracking-wide">
                Student Observations Table
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <button
                onClick={handleCaptureSimulation}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-[3px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer"
                title="Record current simulation data directly into observation row"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Capture Simulation</span>
              </button>

              <button
                onClick={handleAddObservationRow}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-[3px] bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/20 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>

              <button
                onClick={handleClearObservationTable}
                className="flex items-center gap-1 px-2 py-1.5 rounded-[3px] bg-[#111520] border border-white/10 text-slate-400 hover:text-[#FF5722] transition cursor-pointer"
                title="Clear all recorded observation rows"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-2 px-2 text-center w-10">#</th>
                  {experiment.defaultObservationColumns.map((col) => (
                    <th key={col.key} className="py-2 px-3">
                      {col.label} {col.unit ? `(${col.unit})` : ''}
                    </th>
                  ))}
                  <th className="py-2 px-2 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {observations.length > 0 ? (
                  observations.map((row, rowIdx) => (
                    <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2 px-2 text-center text-slate-500">{rowIdx + 1}</td>
                      {experiment.defaultObservationColumns.map((col) => (
                        <td key={col.key} className="py-2 px-3">
                          <input
                            type={col.type === 'number' ? 'number' : 'text'}
                            value={row[col.key] ?? ''}
                            step="any"
                            onChange={(e) =>
                              handleUpdateObservationCell(
                                row.id,
                                col.key,
                                col.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                              )
                            }
                            className="w-full bg-[#111520] border border-white/10 focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]/40 rounded-[3px] px-2 py-1 text-white text-xs focus:outline-none"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => handleDeleteObservationRow(row.id)}
                          className="text-slate-500 hover:text-[#FF5722] p-1 transition cursor-pointer"
                          title="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={experiment.defaultObservationColumns.length + 2}
                      className="py-6 text-center text-slate-500 font-sans italic"
                    >
                      No observations entered yet. Click "Add Row" to record experiment data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 8: ENGINEERING NOTES */}
        <div className="bg-[#1A1E29] border border-white/10 rounded-[3px] p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h2 className="text-sm font-semibold font-mono text-slate-200 uppercase tracking-wide">
              Engineering Lab Notes & Remarks
            </h2>
            <span className="text-[11px] font-mono text-slate-400">
              Auto-saved to Local Storage
            </span>
          </div>

          <textarea
            value={notes}
            onChange={(e) => updateNotes(e.target.value)}
            rows={3}
            placeholder="Enter practical observations, component tolerances, breadboard observations, or hardware discrepancy remarks..."
            className="w-full bg-[#111520] border border-white/10 rounded-[3px] p-3 text-xs sm:text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]/40 resize-y"
          />
        </div>

        {/* SECTION 9: RESULT & CONCLUSION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#1A1E29] border border-emerald-500/30 rounded-[3px] p-4 sm:p-5 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <h3 className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">
                Experimental Result
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
              {dynamicResultStatement}
            </p>
          </div>

          <div className="bg-[#1A1E29] border border-[#00F0FF]/30 rounded-[3px] p-4 sm:p-5 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00F0FF]"></span>
              <h3 className="text-xs font-mono font-bold text-[#00F0FF] uppercase tracking-wider">
                Technical Conclusion
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
              {dynamicConclusion}
            </p>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};
