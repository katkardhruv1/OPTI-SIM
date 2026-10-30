import React, { useState, useEffect } from 'react';
import {
  BuilderComponent,
  BuilderWire
} from '../../types/circuitBuilder';
import {
  SYLLABUS_COMPONENT_SPECIFICATIONS
} from './componentCatalog';
import {
  Sliders,
  RotateCw,
  Trash2,
  Unplug,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ComponentPropertyEditorProps {
  selectedComponent: BuilderComponent | null;
  selectedWire: BuilderWire | null;
  components: BuilderComponent[];
  wires: BuilderWire[];
  onUpdateComponentParams: (id: string, params: Record<string, any>) => void;
  onUpdateComponentLabel: (id: string, newLabel: string) => void;
  onRotateComponent: (id: string) => void;
  onDeleteComponent: (id: string) => void;
  onDeleteWire: (wireId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const ComponentPropertyEditor: React.FC<ComponentPropertyEditorProps> = ({
  selectedComponent,
  selectedWire,
  components,
  wires,
  onUpdateComponentParams,
  onUpdateComponentLabel,
  onRotateComponent,
  onDeleteComponent,
  onDeleteWire,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [labelInput, setLabelInput] = useState<string>('');
  const [labelError, setLabelError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedComponent) {
      setLabelInput(selectedComponent.label);
      setLabelError(null);
    }
  }, [selectedComponent?.id, selectedComponent?.label]);

  // Handle Label Change with Uniqueness Validation
  const handleLabelChange = (newLabel: string) => {
    setLabelInput(newLabel);
    const trimmed = newLabel.trim();
    if (!trimmed) {
      setLabelError('Label cannot be empty.');
      return;
    }

    const isDuplicate = components.some(
      (c) => c.id !== selectedComponent?.id && c.label.toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      setLabelError(`Label '${trimmed}' is already in use.`);
    } else {
      setLabelError(null);
      if (selectedComponent) {
        onUpdateComponentLabel(selectedComponent.id, trimmed);
      }
    }
  };

  // Collapsed Rail View
  if (isCollapsed) {
    return (
      <aside className="w-12 bg-[#090e1a] border-l border-slate-800 flex flex-col items-center py-2.5 shrink-0 select-none justify-between h-full z-10">
        <div className="flex flex-col items-center gap-3 w-full">
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-cyan-400 hover:text-white transition-colors cursor-pointer eng-focus"
            title="Expand Property Editor (I)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="w-6 h-px bg-slate-800" />

          <div className="p-1.5 rounded bg-slate-800/60 text-slate-400">
            <Sliders className="w-4 h-4" />
          </div>

          {selectedComponent && (
            <div className="px-1.5 py-1 rounded bg-cyan-950 border border-cyan-800 text-[10px] font-mono font-bold text-cyan-300">
              {selectedComponent.label}
            </div>
          )}

          {selectedWire && (
            <div className="p-1.5 rounded bg-amber-950/80 border border-amber-800 text-amber-400">
              <Unplug className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        <div className="flex flex-col items-center pb-2">
          <span className="text-[9.5px] font-mono text-slate-500 uppercase tracking-widest [writing-mode:vertical-rl] select-none py-1">
            Inspector
          </span>
        </div>
      </aside>
    );
  }

  // 1. WIRE SELECTED VIEW
  if (selectedWire) {
    const fromComp = components.find((c) => c.id === selectedWire.fromCompId);
    const toComp = components.find((c) => c.id === selectedWire.toCompId);

    return (
      <aside className="w-80 bg-[#090e1a] border-l border-slate-800 flex flex-col shrink-0 select-none p-4 space-y-4 transition-all">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Unplug className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Selected Connection Wire
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onDeleteWire(selectedWire.id)}
              className="p-1.5 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 transition-colors"
              title="Delete this wire"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer eng-focus"
                title="Collapse Property Editor to maximize canvas"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-xs font-mono">
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            Terminal Endpoints:
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-[#070b14] border border-slate-800">
            <span className="text-cyan-300 font-bold">{fromComp?.label || 'Source'}</span>
            <span className="text-slate-400 text-[10px]">({selectedWire.fromTerminalId})</span>
          </div>
          <div className="flex justify-center text-slate-500">
            <ArrowRightLeft className="w-3.5 h-3.5 rotate-90" />
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-[#070b14] border border-slate-800">
            <span className="text-emerald-300 font-bold">{toComp?.label || 'Destination'}</span>
            <span className="text-slate-400 text-[10px]">({selectedWire.toTerminalId})</span>
          </div>
        </div>

        <button
          onClick={() => onDeleteWire(selectedWire.id)}
          className="w-full py-2 px-3 rounded bg-rose-950 hover:bg-rose-900 border border-rose-800 text-xs font-mono font-bold text-rose-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Remove Wire Connection</span>
        </button>
      </aside>
    );
  }

  // 2. NO SELECTION VIEW
  if (!selectedComponent) {
    return (
      <aside className="w-80 bg-[#090e1a] border-l border-slate-800 flex flex-col shrink-0 select-none p-4 text-xs font-mono transition-all">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            <h3 className="font-bold text-white uppercase tracking-wider">Property Editor</h3>
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer eng-focus"
              title="Collapse Property Editor to maximize canvas"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-2">
          <Cpu className="w-8 h-8 stroke-1 text-slate-600" />
          <p className="text-xs text-slate-400">No component selected</p>
          <p className="text-[11px] text-slate-500 leading-tight">
            Click any component or terminal on the canvas to inspect its terminals and configure values.
          </p>
        </div>
      </aside>
    );
  }

  // 3. COMPONENT SELECTED VIEW
  const spec = SYLLABUS_COMPONENT_SPECIFICATIONS[selectedComponent.type];
  const { params } = selectedComponent;

  // Find wires connected to this component
  const connectedWires = wires.filter(
    (w) => w.fromCompId === selectedComponent.id || w.toCompId === selectedComponent.id
  );

  return (
    <aside className="w-80 bg-[#090e1a] border-l border-slate-800 flex flex-col shrink-0 select-none overflow-y-auto transition-all">
      {/* Title & Quick Action Bar */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            {spec.displayName}
          </h3>
          <div className="text-[10px] font-mono text-slate-400">
            ID: <strong className="text-cyan-400">{selectedComponent.id}</strong>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onRotateComponent(selectedComponent.id)}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Rotate 90° Clockwise (R)"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteComponent(selectedComponent.id)}
            className="p-1.5 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 transition-colors cursor-pointer"
            title="Delete this component (Delete)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer eng-focus"
              title="Collapse Property Editor to maximize canvas"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4 text-xs font-mono">
        {/* Reference Label Editor */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-300">Reference Label:</label>
          <input
            type="text"
            value={labelInput}
            onChange={(e) => handleLabelChange(e.target.value)}
            className="w-full bg-[#070b14] border border-slate-700 text-slate-100 rounded px-2.5 py-1.5 text-xs font-mono focus:outline-hidden focus:border-cyan-500"
          />
          {labelError && (
            <div className="text-[10.5px] text-rose-400 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{labelError}</span>
            </div>
          )}
        </div>

        {/* Spatial Coordinates & Rotation */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded bg-[#070b14] border border-slate-800 text-[11px]">
          <div>
            <span className="text-slate-500 block">X Pos:</span>
            <strong className="text-slate-300">{selectedComponent.x}px</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Y Pos:</span>
            <strong className="text-slate-300">{selectedComponent.y}px</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Rotation:</span>
            <strong className="text-cyan-400">{selectedComponent.rotation}°</strong>
          </div>
        </div>

        {/* COMPONENT SPECIFIC PARAMETERS */}
        {selectedComponent.type === 'resistor' && (
          <div className="space-y-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
              Resistance Parameters:
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-slate-400 block mb-1">Resistance Value:</label>
                <input
                  type="number"
                  step="any"
                  value={params.value ?? 10}
                  onChange={(e) =>
                    onUpdateComponentParams(selectedComponent.id, {
                      ...params,
                      value: Number(e.target.value)
                    })
                  }
                  className="w-full bg-[#070b14] border border-slate-700 text-slate-100 rounded px-2 py-1 text-xs font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
              <div className="w-24">
                <label className="text-[10px] text-slate-400 block mb-1">Unit:</label>
                <select
                  value={params.unit || 'kΩ'}
                  onChange={(e) =>
                    onUpdateComponentParams(selectedComponent.id, {
                      ...params,
                      unit: e.target.value
                    })
                  }
                  className="w-full bg-[#070b14] border border-slate-700 text-slate-100 rounded px-2 py-1 text-xs font-mono focus:border-cyan-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="Ω">Ω</option>
                  <option value="kΩ">kΩ</option>
                  <option value="MΩ">MΩ</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {selectedComponent.type === 'capacitor' && (
          <div className="space-y-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
              Capacitance Parameters:
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-slate-400 block mb-1">Capacitance Value:</label>
                <input
                  type="number"
                  step="any"
                  value={params.value ?? 0.01}
                  onChange={(e) =>
                    onUpdateComponentParams(selectedComponent.id, {
                      ...params,
                      value: Number(e.target.value)
                    })
                  }
                  className="w-full bg-[#070b14] border border-slate-700 text-slate-100 rounded px-2 py-1 text-xs font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
              <div className="w-24">
                <label className="text-[10px] text-slate-400 block mb-1">Unit:</label>
                <select
                  value={params.unit || 'µF'}
                  onChange={(e) =>
                    onUpdateComponentParams(selectedComponent.id, {
                      ...params,
                      unit: e.target.value
                    })
                  }
                  className="w-full bg-[#070b14] border border-slate-700 text-slate-100 rounded px-2 py-1 text-xs font-mono focus:border-cyan-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="pF">pF</option>
                  <option value="nF">nF</option>
                  <option value="µF">µF</option>
                  <option value="mF">mF</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {selectedComponent.type === 'ac-source' && (
          <div className="space-y-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
              Signal Generator Parameters:
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Amplitude (V Peak):</label>
              <input
                type="number"
                step="0.1"
                value={params.amplitude ?? 1.0}
                onChange={(e) =>
                  onUpdateComponentParams(selectedComponent.id, {
                    ...params,
                    amplitude: Number(e.target.value)
                  })
                }
                className="w-full bg-[#070b14] border border-slate-700 text-slate-100 rounded px-2 py-1 text-xs font-mono focus:border-cyan-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Frequency (Hz):</label>
              <input
                type="number"
                step="50"
                value={params.frequency ?? 1000}
                onChange={(e) =>
                  onUpdateComponentParams(selectedComponent.id, {
                    ...params,
                    frequency: Number(e.target.value)
                  })
                }
                className="w-full bg-[#070b14] border border-slate-700 text-slate-100 rounded px-2 py-1 text-xs font-mono focus:border-cyan-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Waveform Shape:</label>
              <select
                value={params.waveform || 'sine'}
                onChange={(e) =>
                  onUpdateComponentParams(selectedComponent.id, {
                    ...params,
                    waveform: e.target.value
                  })
                }
                className="w-full bg-[#070b14] border border-slate-700 text-slate-100 rounded px-2 py-1 text-xs font-mono focus:border-cyan-500 focus:outline-hidden cursor-pointer"
              >
                <option value="sine">Sine Wave</option>
                <option value="square">Square Wave</option>
                <option value="triangle">Triangle Wave</option>
              </select>
            </div>
          </div>
        )}

        {selectedComponent.type === 'dc-source' && (
          <div className="space-y-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
              DC Voltage Settings:
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">DC Voltage (V):</label>
              <input
                type="number"
                step="0.1"
                value={params.voltage ?? 2.5}
                onChange={(e) =>
                  onUpdateComponentParams(selectedComponent.id, {
                    ...params,
                    voltage: Number(e.target.value)
                  })
                }
                className="w-full bg-[#070b14] border border-slate-700 text-slate-100 rounded px-2 py-1 text-xs font-mono focus:border-cyan-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {selectedComponent.type === 'op-amp' && (
          <div className="space-y-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
              Op-Amp Model &amp; Rails:
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Op-Amp IC:</label>
              <select
                value={params.model || 'LM741'}
                onChange={(e) =>
                  onUpdateComponentParams(selectedComponent.id, {
                    ...params,
                    model: e.target.value
                  })
                }
                className="w-full bg-[#070b14] border border-slate-700 text-slate-100 rounded px-2 py-1 text-xs font-mono focus:border-cyan-500 focus:outline-hidden cursor-pointer"
              >
                <option value="LM741">LM741 (Dual Supply IC)</option>
                <option value="UA741">UA741 (Precision)</option>
                <option value="Ideal">Ideal Op-Amp Model</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">+Vsat Rail (V):</label>
                <input
                  type="number"
                  step="0.5"
                  value={params.posVsat ?? 15}
                  onChange={(e) =>
                    onUpdateComponentParams(selectedComponent.id, {
                      ...params,
                      posVsat: Number(e.target.value)
                    })
                  }
                  className="w-full bg-[#070b14] border border-slate-700 text-slate-100 rounded px-2 py-1 text-xs font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">-Vsat Rail (V):</label>
                <input
                  type="number"
                  step="0.5"
                  value={params.negVsat ?? -15}
                  onChange={(e) =>
                    onUpdateComponentParams(selectedComponent.id, {
                      ...params,
                      negVsat: Number(e.target.value)
                    })
                  }
                  className="w-full bg-[#070b14] border border-slate-700 text-slate-100 rounded px-2 py-1 text-xs font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* TERMINAL CONNECTION STATUS */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Terminals ({spec.terminals.length}):
          </div>
          <div className="space-y-1.5">
            {spec.terminals.map((term) => {
              const wiresForTerm = connectedWires.filter(
                (w) =>
                  (w.fromCompId === selectedComponent.id && w.fromTerminalId === term.id) ||
                  (w.toCompId === selectedComponent.id && w.toTerminalId === term.id)
              );
              const isConnected = wiresForTerm.length > 0;

              return (
                <div
                  key={term.id}
                  className="p-2 rounded bg-[#070b14] border border-slate-800 flex items-center justify-between text-[11px]"
                >
                  <div>
                    <span className="font-bold text-slate-200">{term.name}</span>
                    <span className="text-[10px] text-slate-500 block">{term.description}</span>
                  </div>
                  {isConnected ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                      {wiresForTerm.length} wire{wiresForTerm.length > 1 ? 's' : ''}
                    </span>
                  ) : term.isOptional ? (
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                      Optional
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 text-[10px]">
                      Unconnected
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
