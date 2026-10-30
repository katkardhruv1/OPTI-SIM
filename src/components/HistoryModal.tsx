import React, { useState, useEffect } from 'react';
import {
  getCalculationHistory,
  deleteCalculationHistory,
  clearCalculationHistory,
  getSavedExperiments,
  deleteSavedExperiment
} from '../utils/historyStorage';
import { CalculationHistoryEntry, SavedExperimentConfig } from '../types/lab';
import { exportExperimentToJSON } from '../utils/exportEngine';
import { saveActiveCircuitState, computeResultsForCircuit } from '../utils/circuitStateBridge';
import {
  History,
  Clock,
  Trash2,
  Download,
  FolderOpen,
  X,
  Search,
  ExternalLink,
  Layers,
  FileText
} from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCircuit: (circuitId: string) => void;
  onNotice?: (msg: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectCircuit,
  onNotice
}) => {
  const [activeTab, setActiveTab] = useState<'calculations' | 'saved'>('calculations');
  const [historyItems, setHistoryItems] = useState<CalculationHistoryEntry[]>([]);
  const [savedItems, setSavedItems] = useState<SavedExperimentConfig[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const refreshData = () => {
    setHistoryItems(getCalculationHistory());
    setSavedItems(getSavedExperiments());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCalculationHistory(id);
    refreshData();
    onNotice?.('History entry removed.');
  };

  const handleClearAllHistory = () => {
    if (confirm('Are you sure you want to clear all calculation history?')) {
      clearCalculationHistory();
      refreshData();
      onNotice?.('All calculation history cleared.');
    }
  };

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSavedExperiment(id);
    refreshData();
    onNotice?.('Saved experiment deleted.');
  };

  const handleLoadCircuit = (circuitId: string) => {
    onSelectCircuit(circuitId);
    onClose();
    onNotice?.(`Opened circuit: ${circuitId}`);
  };

  const handleLoadSavedExperiment = (item: SavedExperimentConfig) => {
    try {
      if (item.observations && Array.isArray(item.observations)) {
        localStorage.setItem(`optisim_obs_${item.circuitId}`, JSON.stringify(item.observations));
      }
      if (typeof item.notes === 'string') {
        localStorage.setItem(`optisim_notes_${item.circuitId}`, item.notes);
      }
      if (item.studentName) {
        localStorage.setItem('optisim_student_name', item.studentName);
      }
      if (item.inputs && typeof item.inputs === 'object') {
        const computedResults = computeResultsForCircuit(item.circuitId, item.inputs);
        saveActiveCircuitState(item.circuitId, item.inputs, computedResults);
      }
    } catch (err) {
      console.warn('Error loading saved experiment state:', err);
    }
    onSelectCircuit(item.circuitId);
    onClose();
    onNotice?.(`Loaded saved experiment ${item.experimentNumber}: "${item.title}"`);
  };

  // Filter items
  const filteredHistory = historyItems.filter((item) =>
    item.circuitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.inputsSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.outputsSummary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSaved = savedItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.circuitId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#0b101e] border border-slate-800 rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#090d19]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-cyan-950 border border-cyan-800 text-cyan-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-mono text-slate-100">
                Calculation History & Saved Experiments
              </h2>
              <p className="text-xs text-slate-400">
                Persistent local storage records for simulations and lab runs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-b border-slate-800/80 bg-[#080c16]">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveTab('calculations')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
                activeTab === 'calculations'
                  ? 'bg-cyan-950 text-cyan-300 font-semibold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Calculation History ({historyItems.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
                activeTab === 'saved'
                  ? 'bg-cyan-950 text-cyan-300 font-semibold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Saved Experiments ({savedItems.length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search records..."
              className="pl-8 pr-3 py-1.5 bg-[#090e1a] border border-slate-800 rounded text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500 w-full sm:w-56"
            />
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-0">
          {activeTab === 'calculations' ? (
            filteredHistory.length > 0 ? (
              <div className="space-y-2.5">
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleLoadCircuit(item.circuitId)}
                    className="p-3.5 rounded-lg bg-[#070b14] border border-slate-800/80 hover:border-cyan-500/50 hover:bg-[#0a0f1d] transition cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-300 group-hover:text-cyan-200">
                          {item.circuitName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {item.dateFormatted}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-400">
                        {item.inputsSummary}
                      </div>
                      <div className="text-xs font-mono text-emerald-400">
                        {item.outputsSummary}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={(e) => handleDeleteHistory(item.id, e)}
                        className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 font-mono text-xs space-y-2">
                <Clock className="w-8 h-8 mx-auto text-slate-600" />
                <p>No experiments recorded yet.</p>
                <p className="text-[11px] text-slate-600">
                  Calculations performed in the simulator will automatically appear here.
                </p>
              </div>
            )
          ) : (
            filteredSaved.length > 0 ? (
              <div className="space-y-2.5">
                {filteredSaved.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg bg-[#070b14] border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
                            Exp {item.experimentNumber}
                          </span>
                          <h4 className="text-xs font-mono font-bold text-slate-200">
                            {item.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Saved: {item.dateFormatted} {item.studentName ? `• Student: ${item.studentName}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => exportExperimentToJSON(item)}
                          className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition text-xs font-mono flex items-center gap-1"
                          title="Export as JSON"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">JSON</span>
                        </button>

                        <button
                          onClick={() => handleLoadSavedExperiment(item)}
                          className="px-2.5 py-1.5 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-900 transition text-xs font-mono flex items-center gap-1 cursor-pointer"
                          title="Restore complete saved experiment state"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Load</span>
                        </button>

                        <button
                          onClick={(e) => handleDeleteSaved(item.id, e)}
                          className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Delete saved experiment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {item.notes && (
                      <div className="p-2.5 rounded bg-[#090e1a] border border-slate-800/80 text-[11px] font-mono text-slate-400">
                        <strong>Notes: </strong> {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 font-mono text-xs space-y-2">
                <FolderOpen className="w-8 h-8 mx-auto text-slate-600" />
                <p>No saved experiments yet.</p>
                <p className="text-[11px] text-slate-600">
                  Click "Save Experiment" inside Engineering Lab Mode to preserve a complete laboratory record.
                </p>
              </div>
            )
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#090d19] flex items-center justify-between text-xs font-mono text-slate-400">
          <div>
            {activeTab === 'calculations' && historyItems.length > 0 && (
              <button
                onClick={handleClearAllHistory}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Calculation History</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
