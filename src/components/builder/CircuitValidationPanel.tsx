import React from 'react';
import {
  CircuitValidationIssue,
  DetectedTopology
} from '../../types/circuitBuilder';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Play,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface CircuitValidationPanelProps {
  validationIssues: CircuitValidationIssue[];
  topology: DetectedTopology;
  onValidate: () => void;
  onSimulate: () => void;
  onSelectComponent: (id: string | null) => void;
}

export const CircuitValidationPanel: React.FC<CircuitValidationPanelProps> = ({
  validationIssues,
  topology,
  onValidate,
  onSimulate,
  onSelectComponent
}) => {
  const [showDetails, setShowDetails] = React.useState<boolean>(true);
  const errors = validationIssues.filter((i) => i.severity === 'error');
  const warnings = validationIssues.filter((i) => i.severity === 'warning');
  const infos = validationIssues.filter((i) => i.severity === 'info');

  const isValid = errors.length === 0 && validationIssues.length > 0 && !validationIssues.some((i) => i.id === 'empty-canvas');

  return (
    <div className="bg-[#090e1a] border-t border-slate-800 p-3.5 select-none font-mono">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Left: Validation & Topology Status Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Validation Status Badge */}
          {errors.length > 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-950/80 border border-rose-600/60 text-rose-300 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>{errors.length} Electrical Error{errors.length > 1 ? 's' : ''} Detected</span>
            </div>
          ) : warnings.length > 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-950/80 border border-amber-600/60 text-amber-300 text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>{warnings.length} Warning{warnings.length > 1 ? 's' : ''}</span>
            </div>
          ) : isValid ? (
            <div
              onClick={onValidate}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-bold cursor-pointer hover:bg-emerald-900/60 hover:border-emerald-400 transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              title="Circuit verified! Click to trigger Power-On Live Wire pulse"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Electrical Netlist Valid ⚡</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold">
              <Info className="w-3.5 h-3.5" />
              <span>Ready for Validation</span>
            </div>
          )}

          {/* Identified Topology Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#070b14] border border-slate-800 text-xs">
            <span className="text-slate-400">Topology:</span>
            <strong className={topology.isSimulatable ? 'text-cyan-300' : 'text-slate-300'}>
              {topology.displayName}
            </strong>
          </div>
        </div>

        {/* Right: Validation & Simulation Triggers */}
        <div className="flex items-center gap-2">
          <button
            onClick={onValidate}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Inspect electrical nets and connection rules"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Validate Circuit</span>
          </button>

          <button
            onClick={onSimulate}
            disabled={!topology.isSimulatable || errors.length > 0}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              topology.isSimulatable && errors.length === 0
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/30'
                : 'bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed'
            }`}
            title={
              !topology.isSimulatable
                ? 'Simulation is available when circuit topology matches a verified syllabus model'
                : errors.length > 0
                ? 'Resolve electrical errors before simulating'
                : 'Simulate waveforms and calculate theoretical parameters'
            }
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simulate Circuit</span>
          </button>

          {validationIssues.length > 0 && (
            <button
              onClick={() => setShowDetails((prev) => !prev)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={showDetails ? 'Collapse validation issues details' : 'Expand validation issues details'}
            >
              {showDetails ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Validation Message Feed & Topology Explanation */}
      {validationIssues.length > 0 && showDetails && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs animate-in fade-in slide-in-from-bottom-1 duration-150">
          {/* Issues List */}
          <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
            {validationIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => issue.componentId && onSelectComponent(issue.componentId)}
                className={`p-2 rounded text-[11px] flex items-start gap-2 border transition-colors ${
                  issue.componentId ? 'cursor-pointer hover:brightness-110' : ''
                } ${
                  issue.severity === 'error'
                    ? 'bg-rose-950/40 border-rose-900/60 text-rose-200'
                    : issue.severity === 'warning'
                    ? 'bg-amber-950/40 border-amber-900/60 text-amber-200'
                    : 'bg-cyan-950/40 border-cyan-900/60 text-cyan-200'
                }`}
              >
                {issue.severity === 'error' ? (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                ) : issue.severity === 'warning' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                )}
                <span className="leading-tight">{issue.message}</span>
              </div>
            ))}
          </div>

          {/* Topology Explanation Note */}
          <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <div className="font-bold text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              <span>Topology Detection &amp; Analysis:</span>
            </div>
            <p className="text-slate-400 text-[10.5px] leading-relaxed">
              {topology.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
