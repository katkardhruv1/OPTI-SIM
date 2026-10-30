import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BuilderComponent,
  BuilderWire,
  BuilderComponentType,
  CircuitValidationIssue,
  DetectedTopology,
  SavedCircuitSchema
} from '../../types/circuitBuilder';
import {
  SYLLABUS_COMPONENT_SPECIFICATIONS,
  SYLLABUS_PRESET_TEMPLATES
} from './componentCatalog';
import { validateCircuit, detectCircuitTopology } from './circuitValidator';
import { runBuilderSimulation, BuilderSimulationOutput } from './simulationAdapter';
import { ComponentLibrary } from './ComponentLibrary';
import { CircuitCanvas } from './CircuitCanvas';
import { ComponentPropertyEditor } from './ComponentPropertyEditor';
import { CircuitValidationPanel } from './CircuitValidationPanel';
import { SimulationResultModal } from './SimulationResultModal';
import { playSnap, playTick, playError } from '../../utils/audioFeedback';
import {
  Plus,
  Trash2,
  Undo2,
  Redo2,
  Save,
  FolderOpen,
  Download,
  Upload,
  Play,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  FileText,
  Cable,
  MousePointer,
  Maximize2,
  Minimize2,
  Sliders,
  Layers
} from 'lucide-react';

interface ManualCircuitBuilderProps {
  onNotice?: (msg: string) => void;
}

const AUTOSAVE_KEY = 'optisim_builder_autosave';
const SAVED_CIRCUITS_KEY = 'optisim_builder_saved_circuits';

export const ManualCircuitBuilder: React.FC<ManualCircuitBuilderProps> = ({ onNotice }) => {
  // Circuit Model State
  const [circuitName, setCircuitName] = useState<string>('Inverting Amplifier Design');
  const [components, setComponents] = useState<BuilderComponent[]>(() => {
    // Default to classic Inverting Amplifier syllabus preset on initial start
    const preset = SYLLABUS_PRESET_TEMPLATES[0];
    return preset ? JSON.parse(JSON.stringify(preset.components)) : [];
  });
  const [wires, setWires] = useState<BuilderWire[]>(() => {
    const preset = SYLLABUS_PRESET_TEMPLATES[0];
    return preset ? JSON.parse(JSON.stringify(preset.wires)) : [];
  });

  // Selection State
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);

  // Tool Mode State: Select vs Wire Tool
  const [isWireMode, setIsWireMode] = useState<boolean>(false);

  // Panel Collapsible Layout State (Maximize canvas real estate)
  const [isLibraryCollapsed, setIsLibraryCollapsed] = useState<boolean>(false);
  const [isPropertiesCollapsed, setIsPropertiesCollapsed] = useState<boolean>(false);

  const isFullCanvas = isLibraryCollapsed && isPropertiesCollapsed;
  const handleToggleFullCanvas = () => {
    if (isFullCanvas) {
      setIsLibraryCollapsed(false);
      setIsPropertiesCollapsed(false);
      onNotice?.('Restored standard panel layout');
    } else {
      setIsLibraryCollapsed(true);
      setIsPropertiesCollapsed(true);
      onNotice?.('Full Canvas Mode activated: Maximum workspace area');
    }
  };

  // Undo / Redo History Stack
  const historyRef = useRef<Array<{ components: BuilderComponent[]; wires: BuilderWire[] }>>([
    {
      components: JSON.parse(JSON.stringify(SYLLABUS_PRESET_TEMPLATES[0]?.components || [])),
      wires: JSON.parse(JSON.stringify(SYLLABUS_PRESET_TEMPLATES[0]?.wires || []))
    }
  ]);
  const historyIndexRef = useRef<number>(0);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  // Validation & Topology State
  const [validationIssues, setValidationIssues] = useState<CircuitValidationIssue[]>([]);
  // Phase 18C: Live wire power-on validation pulse trigger key
  const [validationPulseKey, setValidationPulseKey] = useState<number>(0);
  const [detectedTopology, setDetectedTopology] = useState<DetectedTopology>(() =>
    detectCircuitTopology(
      SYLLABUS_PRESET_TEMPLATES[0]?.components || [],
      SYLLABUS_PRESET_TEMPLATES[0]?.wires || []
    )
  );

  // Simulation Modal State
  const [simulationOutput, setSimulationOutput] = useState<BuilderSimulationOutput | null>(null);
  const [isSimModalOpen, setIsSimModalOpen] = useState<boolean>(false);

  // Load Saved Modal State
  const [isLoadModalOpen, setIsLoadModalOpen] = useState<boolean>(false);
  const [savedCircuitsList, setSavedCircuitsList] = useState<SavedCircuitSchema[]>([]);

  // Push state to undo/redo history
  const pushHistory = useCallback((newComps: BuilderComponent[], newWires: BuilderWire[]) => {
    const nextIdx = historyIndexRef.current + 1;
    const trimmed = historyRef.current.slice(0, nextIdx);
    trimmed.push({
      components: JSON.parse(JSON.stringify(newComps)),
      wires: JSON.parse(JSON.stringify(newWires))
    });

    // Limit history stack size to 30 items
    if (trimmed.length > 30) trimmed.shift();

    historyRef.current = trimmed;
    historyIndexRef.current = trimmed.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);

    // Run real-time validation and topology detection
    const { issues } = validateCircuit(newComps, newWires);
    setValidationIssues(issues);
    setDetectedTopology(detectCircuitTopology(newComps, newWires));

    // Autosave draft to browser localStorage
    try {
      localStorage.setItem(
        AUTOSAVE_KEY,
        JSON.stringify({
          circuitName,
          components: newComps,
          wires: newWires
        })
      );
    } catch {
      // ignore
    }
  }, [circuitName]);

  // Initial validation check on mount
  useEffect(() => {
    const { issues } = validateCircuit(components, wires);
    setValidationIssues(issues);
    setDetectedTopology(detectCircuitTopology(components, wires));
  }, []);

  // UNDO
  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const state = historyRef.current[historyIndexRef.current];
      setComponents(JSON.parse(JSON.stringify(state.components)));
      setWires(JSON.parse(JSON.stringify(state.wires)));
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
      setSelectedComponentId(null);
      setSelectedWireId(null);

      const { issues } = validateCircuit(state.components, state.wires);
      setValidationIssues(issues);
      setDetectedTopology(detectCircuitTopology(state.components, state.wires));
      onNotice?.('Undo action performed');
    }
  };

  // REDO
  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const state = historyRef.current[historyIndexRef.current];
      setComponents(JSON.parse(JSON.stringify(state.components)));
      setWires(JSON.parse(JSON.stringify(state.wires)));
      setCanUndo(true);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
      setSelectedComponentId(null);
      setSelectedWireId(null);

      const { issues } = validateCircuit(state.components, state.wires);
      setValidationIssues(issues);
      setDetectedTopology(detectCircuitTopology(state.components, state.wires));
      onNotice?.('Redo action performed');
    }
  };

  // Keyboard shortcut listener for Undo/Redo/Delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedComponentId) {
          e.preventDefault();
          handleDeleteComponent(selectedComponentId);
        } else if (selectedWireId) {
          e.preventDefault();
          handleDeleteWire(selectedWireId);
        }
      } else if (e.key.toLowerCase() === 'r' && selectedComponentId) {
        e.preventDefault();
        handleRotateComponent(selectedComponentId);
      } else if (e.key.toLowerCase() === 'l') {
        setIsLibraryCollapsed((prev) => !prev);
      } else if (e.key.toLowerCase() === 'i') {
        setIsPropertiesCollapsed((prev) => !prev);
      } else if (e.key.toLowerCase() === 'm') {
        handleToggleFullCanvas();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // ADD COMPONENT TO CANVAS
  const handleAddComponent = (type: BuilderComponentType) => {
    const spec = SYLLABUS_COMPONENT_SPECIFICATIONS[type];
    if (!spec) return;

    // Generate unique reference label (e.g. R1, R2, U1, Vin1)
    let counter = 1;
    let label = `${spec.prefix}${counter}`;
    while (components.some((c) => c.label.toLowerCase() === label.toLowerCase())) {
      counter++;
      label = `${spec.prefix}${counter}`;
    }

    // Offset position to avoid overlapping previously added components
    const offset = (components.length % 8) * 30;
    const newComp: BuilderComponent = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      label,
      x: 320 + offset,
      y: 220 + offset,
      rotation: 0,
      params: JSON.parse(JSON.stringify(spec.defaultParams))
    };

    const nextComps = [...components, newComp];
    setComponents(nextComps);
    setSelectedComponentId(newComp.id);
    setSelectedWireId(null);
    pushHistory(nextComps, wires);
    onNotice?.(`Added ${spec.displayName} (${label}) to canvas`);
  };

  // MOVE COMPONENT
  const handleMoveComponent = (id: string, x: number, y: number) => {
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, x, y } : c))
    );
  };

  const handleComponentMoveEnd = () => {
    pushHistory(components, wires);
  };

  // ROTATE COMPONENT (0 -> 90 -> 180 -> 270)
  const handleRotateComponent = (id: string) => {
    const nextComps = components.map((c) => {
      if (c.id !== id) return c;
      const nextRot = ((c.rotation + 90) % 360) as 0 | 90 | 180 | 270;
      return { ...c, rotation: nextRot };
    });
    setComponents(nextComps);
    pushHistory(nextComps, wires);
    onNotice?.('Component rotated 90° clockwise');
  };

  // DELETE COMPONENT
  const handleDeleteComponent = (id: string) => {
    const compToDelete = components.find((c) => c.id === id);
    const nextComps = components.filter((c) => c.id !== id);
    // Automatically clean up wires attached to this component's terminals
    const nextWires = wires.filter((w) => w.fromCompId !== id && w.toCompId !== id);

    setComponents(nextComps);
    setWires(nextWires);
    setSelectedComponentId(null);
    pushHistory(nextComps, nextWires);
    onNotice?.(`Deleted ${compToDelete?.label || 'component'} and its connections`);
  };

  // UPDATE COMPONENT PARAMS
  const handleUpdateComponentParams = (id: string, params: Record<string, any>) => {
    const nextComps = components.map((c) => (c.id === id ? { ...c, params } : c));
    setComponents(nextComps);
    pushHistory(nextComps, wires);
  };

  // UPDATE COMPONENT LABEL
  const handleUpdateComponentLabel = (id: string, newLabel: string) => {
    const nextComps = components.map((c) => (c.id === id ? { ...c, label: newLabel } : c));
    setComponents(nextComps);
    pushHistory(nextComps, wires);
  };

  // CREATE WIRE
  const handleCreateWire = (
    fromCompId: string,
    fromTermId: string,
    toCompId: string,
    toTermId: string
  ) => {
    playSnap();
    const newWire: BuilderWire = {
      id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fromCompId,
      fromTerminalId: fromTermId,
      toCompId,
      toTerminalId: toTermId
    };
    const nextWires = [...wires, newWire];
    setWires(nextWires);
    setSelectedWireId(newWire.id);
    setSelectedComponentId(null);
    pushHistory(components, nextWires);
    onNotice?.('Wire connection created');
  };

  // DELETE WIRE
  const handleDeleteWire = (wireId: string) => {
    playTick();
    const nextWires = wires.filter((w) => w.id !== wireId);
    setWires(nextWires);
    setSelectedWireId(null);
    pushHistory(components, nextWires);
    onNotice?.('Wire connection removed');
  };

  // LOAD SYLLABUS PRESET
  const handleLoadPreset = (presetId: string) => {
    const tmpl = SYLLABUS_PRESET_TEMPLATES.find((t) => t.id === presetId);
    if (!tmpl) return;

    if (
      components.length > 0 &&
      !confirm(`Load preset "${tmpl.title}"? Current canvas items will be replaced.`)
    ) {
      return;
    }

    const newComps = JSON.parse(JSON.stringify(tmpl.components));
    const newWires = JSON.parse(JSON.stringify(tmpl.wires));

    setCircuitName(tmpl.title);
    setComponents(newComps);
    setWires(newWires);
    setSelectedComponentId(null);
    setSelectedWireId(null);
    pushHistory(newComps, newWires);
    // Phase 18C: Trigger live wire power-on pulse
    setValidationPulseKey((prev) => prev + 1);
    onNotice?.(`Loaded preset: ${tmpl.title}`);
  };

  // CLEAR CANVAS
  const handleClearCanvas = () => {
    if (components.length === 0) return;
    if (confirm('Clear the entire circuit canvas? All components and connections will be removed.')) {
      setComponents([]);
      setWires([]);
      setSelectedComponentId(null);
      setSelectedWireId(null);
      pushHistory([], []);
      onNotice?.('Canvas cleared');
    }
  };

  // NEW CIRCUIT
  const handleNewCircuit = () => {
    if (confirm('Start a new circuit design?')) {
      setCircuitName('Untitled Circuit Design');
      setComponents([]);
      setWires([]);
      setSelectedComponentId(null);
      setSelectedWireId(null);
      pushHistory([], []);
      onNotice?.('New circuit started');
    }
  };

  // RUN VALIDATION
  const handleValidateCircuit = () => {
    const { issues, isValid, hasErrors } = validateCircuit(components, wires);
    setValidationIssues(issues);
    const topo = detectCircuitTopology(components, wires);
    setDetectedTopology(topo);

    if (hasErrors) {
      playError();
      onNotice?.(`Validation check found ${issues.filter((i) => i.severity === 'error').length} electrical errors.`);
    } else if (isValid) {
      // Phase 18C: Trigger live wire power-on pulse animation
      playSnap();
      setValidationPulseKey((prev) => prev + 1);
      onNotice?.(`⚡ Power On! Circuit valid: ${topo.displayName}`);
    } else {
      playTick();
      if (wires.length > 0 && !hasErrors) {
        setValidationPulseKey((prev) => prev + 1);
      }
      onNotice?.('Circuit check complete.');
    }
  };

  // RUN SIMULATION
  const handleSimulateCircuit = () => {
    handleValidateCircuit();
    const topo = detectCircuitTopology(components, wires);

    if (!topo.isSimulatable) {
      playError();
      alert(
        `Simulation Limitation:\n\n${topo.explanation}\n\nSupported topologies: Inverting Amp, Non-Inverting Amp, Voltage Follower, Integrator, Schmitt Trigger, Comparator.`
      );
      return;
    }

    const simOut = runBuilderSimulation(topo, components);
    if (simOut) {
      playTick();
      setSimulationOutput(simOut);
      setIsSimModalOpen(true);
      onNotice?.(`Simulated ${topo.displayName} successfully!`);
    } else {
      playError();
      alert('Unable to simulate circuit: check component values and parameters.');
    }
  };

  // SAVE CIRCUIT LOCALLY
  const handleSaveCircuit = () => {
    try {
      const savedListRaw = localStorage.getItem(SAVED_CIRCUITS_KEY);
      const savedList: SavedCircuitSchema[] = savedListRaw ? JSON.parse(savedListRaw) : [];

      const newCircuit: SavedCircuitSchema = {
        schemaVersion: 1,
        id: `circuit_${Date.now()}`,
        circuitName: circuitName.trim() || 'Untitled Circuit',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        components,
        wires,
        canvas: { zoom: 1, panX: 0, panY: 0 }
      };

      // Replace if existing with same name or add new
      const filtered = savedList.filter((c) => c.circuitName !== newCircuit.circuitName);
      filtered.push(newCircuit);

      localStorage.setItem(SAVED_CIRCUITS_KEY, JSON.stringify(filtered));
      onNotice?.(`Circuit "${newCircuit.circuitName}" saved locally.`);
    } catch (err) {
      alert('Failed to save circuit to local storage.');
    }
  };

  // OPEN LOAD SAVED MODAL
  const handleOpenLoadModal = () => {
    try {
      const savedListRaw = localStorage.getItem(SAVED_CIRCUITS_KEY);
      const savedList: SavedCircuitSchema[] = savedListRaw ? JSON.parse(savedListRaw) : [];
      setSavedCircuitsList(savedList);
      setIsLoadModalOpen(true);
    } catch {
      setSavedCircuitsList([]);
      setIsLoadModalOpen(true);
    }
  };

  // LOAD SELECTED SAVED CIRCUIT
  const handleLoadSavedCircuit = (circuit: SavedCircuitSchema) => {
    setCircuitName(circuit.circuitName);
    setComponents(circuit.components);
    setWires(circuit.wires);
    setSelectedComponentId(null);
    setSelectedWireId(null);
    pushHistory(circuit.components, circuit.wires);
    setIsLoadModalOpen(false);
    onNotice?.(`Loaded saved circuit: "${circuit.circuitName}"`);
  };

  // EXPORT JSON
  const handleExportJSON = () => {
    const payload: SavedCircuitSchema = {
      schemaVersion: 1,
      id: `optisim_${Date.now()}`,
      circuitName: circuitName.trim() || 'Circuit',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      components,
      wires,
      canvas: { zoom: 1, panX: 0, panY: 0 }
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${circuitName.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.optisim.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onNotice?.('Exported circuit JSON file');
  };

  // IMPORT JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.components || !parsed.wires || !Array.isArray(parsed.components) || !Array.isArray(parsed.wires)) {
          alert('Invalid circuit file schema: Missing components or wires array.');
          return;
        }

        setCircuitName(parsed.circuitName || 'Imported Circuit');
        setComponents(parsed.components);
        setWires(parsed.wires);
        setSelectedComponentId(null);
        setSelectedWireId(null);
        pushHistory(parsed.components, parsed.wires);
        onNotice?.(`Imported circuit "${parsed.circuitName || 'Custom'}"`);
      } catch (err) {
        alert('Failed to parse circuit JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const selectedComp = components.find((c) => c.id === selectedComponentId) || null;
  const selectedWire = wires.find((w) => w.id === selectedWireId) || null;

  return (
    <div className="flex flex-col h-full w-full bg-[#070b14] select-none text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP BUILDER TOOLBAR */}
      <div className="h-12 border-b border-slate-800 bg-[#090d18] px-4 flex items-center justify-between shrink-0 font-mono text-xs">
        {/* Left: Circuit Name & Section Identifier */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-white font-bold uppercase tracking-wider text-xs">
              Manual Circuit Builder
            </span>
          </div>
          <div className="w-px h-4 bg-slate-800 my-auto" />
          <input
            type="text"
            value={circuitName}
            onChange={(e) => setCircuitName(e.target.value)}
            className="bg-[#070b14] border border-slate-700 text-cyan-300 font-bold px-2 py-0.5 rounded text-xs focus:outline-hidden focus:border-cyan-500 w-64"
            title="Click to rename circuit"
          />
        </div>

        {/* Center / Right: Primary Actions */}
        <div className="flex items-center gap-1.5">
          {/* Tool Mode: Select vs Wire */}
          <div className="flex items-center gap-1 bg-[#070b14] p-1 rounded-lg border border-slate-800 text-xs mr-1">
            <button
              onClick={() => {
                setIsWireMode(false);
                onNotice?.('Select Tool Active: Select and move components (V)');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                !isWireMode
                  ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/50 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Select Tool: Select, move, and edit components (Shortcut: V)"
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Select</span>
            </button>

            <button
              onClick={() => {
                setIsWireMode(true);
                onNotice?.('Wire Tool Active: Select a terminal, then select another terminal to connect them (W)');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                isWireMode
                  ? 'bg-amber-950 text-amber-300 font-bold border border-amber-500/50 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Wire Tool: Connect component terminals with wires (Shortcut: W)"
            >
              <Cable className="w-3.5 h-3.5 text-amber-400" />
              <span>Wire</span>
              <span className="text-[10px] px-1 rounded bg-amber-500/20 text-amber-300 font-mono hidden md:inline">
                W
              </span>
            </button>
          </div>

          <div className="w-px h-4 bg-slate-800 my-auto mx-1" />

          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded transition-colors ${
              canUndo
                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Undo (Ctrl + Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded transition-colors ${
              canRedo
                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Redo (Ctrl + Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-800 my-auto mx-1" />

          {/* New Circuit */}
          <button
            onClick={handleNewCircuit}
            className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            title="Start new blank circuit"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New</span>
          </button>

          {/* Clear Canvas */}
          <button
            onClick={handleClearCanvas}
            className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Clear current canvas"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          <div className="w-px h-4 bg-slate-800 my-auto mx-1" />

          {/* Save Local */}
          <button
            onClick={handleSaveCircuit}
            className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            title="Save circuit to local browser storage"
          >
            <Save className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Load Local */}
          <button
            onClick={handleOpenLoadModal}
            className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            title="Load previously saved circuits"
          >
            <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Load</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Export circuit as JSON file"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Import JSON */}
          <label
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Import circuit from JSON file"
          >
            <Upload className="w-4 h-4" />
            <input
              type="file"
              accept=".json,.optisim.json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>

          <div className="w-px h-4 bg-slate-800 my-auto mx-1" />

          {/* Panel Layout & Workspace Maximize Controls */}
          <div className="flex items-center gap-1 bg-[#070b14] p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => {
                setIsLibraryCollapsed((prev) => !prev);
                onNotice?.(isLibraryCollapsed ? 'Component Library expanded' : 'Component Library collapsed to maximize canvas');
              }}
              className={`p-1.5 rounded transition-colors cursor-pointer eng-focus ${
                !isLibraryCollapsed
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 shadow-xs'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title={isLibraryCollapsed ? 'Expand Component Library (L)' : 'Collapse Component Library to widen canvas (L)'}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleToggleFullCanvas}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-colors cursor-pointer eng-focus ${
                isFullCanvas
                  ? 'bg-amber-950 text-amber-300 font-bold border border-amber-600 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={isFullCanvas ? 'Restore Side Panels' : 'Full Canvas Mode: Collapse all panels to maximize workspace'}
            >
              {isFullCanvas ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden xl:inline text-[10.5px]">
                {isFullCanvas ? 'Restore' : 'Max Canvas'}
              </span>
            </button>

            <button
              onClick={() => {
                setIsPropertiesCollapsed((prev) => !prev);
                onNotice?.(isPropertiesCollapsed ? 'Properties Inspector expanded' : 'Properties Inspector collapsed');
              }}
              className={`p-1.5 rounded transition-colors cursor-pointer eng-focus ${
                !isPropertiesCollapsed
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 shadow-xs'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title={isPropertiesCollapsed ? 'Expand Properties Inspector (I)' : 'Collapse Properties Inspector (I)'}
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. THREE-PANEL WORKSPACE BODY */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Area A: Component Library */}
        <ComponentLibrary
          onAddComponent={handleAddComponent}
          onLoadPreset={handleLoadPreset}
          isCollapsed={isLibraryCollapsed}
          onToggleCollapse={() => setIsLibraryCollapsed((prev) => !prev)}
        />

        {/* Area B: Circuit Canvas */}
        <CircuitCanvas
          components={components}
          wires={wires}
          selectedComponentId={selectedComponentId}
          selectedWireId={selectedWireId}
          isWireMode={isWireMode}
          validationPulseKey={validationPulseKey}
          onToggleWireMode={setIsWireMode}
          onNotice={onNotice}
          onSelectComponent={(id) => {
            setSelectedComponentId(id);
            if (id) setSelectedWireId(null);
          }}
          onSelectWire={(id) => {
            setSelectedWireId(id);
            if (id) setSelectedComponentId(null);
          }}
          onMoveComponent={handleMoveComponent}
          onComponentMoveEnd={handleComponentMoveEnd}
          onCreateWire={handleCreateWire}
          onDeleteWire={handleDeleteWire}
        />

        {/* Area C: Selected Component Properties */}
        <ComponentPropertyEditor
          selectedComponent={selectedComp}
          selectedWire={selectedWire}
          components={components}
          wires={wires}
          isCollapsed={isPropertiesCollapsed}
          onToggleCollapse={() => setIsPropertiesCollapsed((prev) => !prev)}
          onUpdateComponentParams={handleUpdateComponentParams}
          onUpdateComponentLabel={handleUpdateComponentLabel}
          onRotateComponent={handleRotateComponent}
          onDeleteComponent={handleDeleteComponent}
          onDeleteWire={handleDeleteWire}
        />
      </div>

      {/* 3. AREA D: CIRCUIT ACTIONS AND VALIDATION PANEL */}
      <CircuitValidationPanel
        validationIssues={validationIssues}
        topology={detectedTopology}
        onValidate={handleValidateCircuit}
        onSimulate={handleSimulateCircuit}
        onSelectComponent={(id) => setSelectedComponentId(id)}
      />

      {/* 4. SIMULATION RESULTS MODAL */}
      <SimulationResultModal
        simulationOutput={simulationOutput}
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
      />

      {/* 5. LOAD SAVED CIRCUITS MODAL */}
      {isLoadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none font-mono">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-[#090e1a] shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Saved Circuit Designs ({savedCircuitsList.length})
                </h3>
              </div>
              <button
                onClick={() => setIsLoadModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {savedCircuitsList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No saved circuits found in local storage. Click "Save" to save your current design.
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {savedCircuitsList.map((circ) => (
                  <div
                    key={circ.id}
                    onClick={() => handleLoadSavedCircuit(circ)}
                    className="p-3 rounded-lg bg-[#070b14] border border-slate-800 hover:border-cyan-500/60 transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                        {circ.circuitName}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {circ.components.length} components • {circ.wires.length} wires • {new Date(circ.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="text-xs text-cyan-400 group-hover:underline">Load →</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsLoadModalOpen(false)}
                className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
