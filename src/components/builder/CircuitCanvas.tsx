import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  BuilderComponent,
  BuilderWire,
  TerminalDefinition
} from '../../types/circuitBuilder';
import {
  SYLLABUS_COMPONENT_SPECIFICATIONS,
  getTerminalAbsoluteCoords
} from './componentCatalog';
import { ComponentSymbolSvg } from './ComponentSymbolSvg';
import { playSnap, playError, playTick } from '../../utils/audioFeedback';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Cable,
  MousePointer,
  HelpCircle,
  X
} from 'lucide-react';

interface CircuitCanvasProps {
  components: BuilderComponent[];
  wires: BuilderWire[];
  selectedComponentId: string | null;
  selectedWireId: string | null;
  isWireMode?: boolean;
  validationPulseKey?: number; // Phase 18C: Trigger for Power-On current pulse
  onToggleWireMode?: (active: boolean) => void;
  onNotice?: (msg: string) => void;
  onSelectComponent: (id: string | null) => void;
  onSelectWire: (id: string | null) => void;
  onMoveComponent: (id: string, x: number, y: number) => void;
  onComponentMoveEnd?: () => void;
  onCreateWire: (fromCompId: string, fromTermId: string, toCompId: string, toTermId: string) => void;
  onDeleteWire: (wireId: string) => void;
}

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({
  components,
  wires,
  selectedComponentId,
  selectedWireId,
  isWireMode = false,
  validationPulseKey = 0,
  onToggleWireMode,
  onNotice,
  onSelectComponent,
  onSelectWire,
  onMoveComponent,
  onComponentMoveEnd,
  onCreateWire,
  onDeleteWire
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Phase 18C: Power-On Validation Pulse State
  const [isPowerPulseActive, setIsPowerPulseActive] = useState<boolean>(false);
  const pulseTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (validationPulseKey && validationPulseKey > 0) {
      setIsPowerPulseActive(true);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = setTimeout(() => {
        setIsPowerPulseActive(false);
      }, 950);
    }
    return () => {
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, [validationPulseKey]);

  // Viewport Transform (Zoom & Pan)
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Wiring State
  const [wiringSource, setWiringSource] = useState<{ compId: string; termId: string } | null>(null);
  const [mouseCanvasPos, setMouseCanvasPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredTerminal, setHoveredTerminal] = useState<{ compId: string; termId: string } | null>(null);

  // Dragging Component State
  const [draggingCompId, setDraggingCompId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef<boolean>(false);

  // Grid Snapping (20px pitch)
  const snapToGrid = (val: number, step: number = 20): number => {
    return Math.round(val / step) * step;
  };

  // Screen to Canvas coordinate transformation
  const screenToCanvas = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const rawX = clientX - rect.left - pan.x;
      const rawY = clientY - rect.top - pan.y;
      return {
        x: rawX / zoom,
        y: rawY / zoom
      };
    },
    [pan, zoom]
  );

  // Smooth window mousemove tracking during active wiring preview
  useEffect(() => {
    if (!wiringSource) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setMouseCanvasPos(canvasPos);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    return () => window.removeEventListener('mousemove', handleWindowMouseMove);
  }, [wiringSource, screenToCanvas]);

  // Handle Zoom In / Out / Reset
  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(2.5, Math.max(0.4, Number((prev + delta).toFixed(2)))));
  };

  const handleResetZoom = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  const handleFitCircuit = () => {
    if (components.length === 0 || !containerRef.current) {
      handleResetZoom();
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const comp of components) {
      minX = Math.min(minX, comp.x - 60);
      maxX = Math.max(maxX, comp.x + 60);
      minY = Math.min(minY, comp.y - 60);
      maxY = Math.max(maxY, comp.y + 60);
    }

    const circuitW = maxX - minX || 400;
    const circuitH = maxY - minY || 300;
    const scaleX = (rect.width - 120) / circuitW;
    const scaleY = (rect.height - 120) / circuitH;
    const newZoom = Math.min(1.6, Math.max(0.5, Math.min(scaleX, scaleY)));

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    setZoom(newZoom);
    setPan({
      x: rect.width / 2 - midX * newZoom,
      y: rect.height / 2 - midY * newZoom
    });
  };

  // Mouse Down on Canvas (Pan vs Deselect)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Middle click or Space/Shift/Alt panning
    if (e.button === 1 || e.shiftKey || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    // Left click on empty canvas
    if (e.button === 0) {
      if (wiringSource) {
        // Cancel active wiring if clicked on empty canvas
        setWiringSource(null);
        onNotice?.('Wire connection cancelled');
      } else {
        onSelectComponent(null);
        onSelectWire(null);
      }
    }
  };

  // Mouse Move over Canvas
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setMouseCanvasPos(canvasPos);

    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
      return;
    }

    if (draggingCompId) {
      hasMovedRef.current = true;
      const newX = snapToGrid(canvasPos.x - dragOffsetRef.current.x);
      const newY = snapToGrid(canvasPos.y - dragOffsetRef.current.y);
      onMoveComponent(draggingCompId, newX, newY);
    }
  };

  // Mouse Up
  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    if (draggingCompId) {
      setDraggingCompId(null);
      if (hasMovedRef.current) {
        onComponentMoveEnd?.();
        hasMovedRef.current = false;
      }
    }
  };

  // Wheel Zoom (centered at mouse pointer)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(2.5, Math.max(0.4, Number((zoom * zoomFactor).toFixed(2))));

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom towards mouse
    const newPanX = mouseX - ((mouseX - pan.x) / zoom) * newZoom;
    const newPanY = mouseY - ((mouseY - pan.y) / zoom) * newZoom;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Component Drag Start
  const handleComponentMouseDown = (comp: BuilderComponent, e: React.MouseEvent) => {
    // In wiring mode or when active wire source exists, clicking the component body should NOT start drag
    if (isWireMode || wiringSource) return;
    if (e.button !== 0) return;

    e.stopPropagation();
    onSelectComponent(comp.id);
    onSelectWire(null);

    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    dragOffsetRef.current = {
      x: canvasPos.x - comp.x,
      y: canvasPos.y - comp.y
    };
    hasMovedRef.current = false;
    setDraggingCompId(comp.id);
  };

  // Terminal Click: Connect Wire
  const handleTerminalClick = (
    compId: string,
    termId: string,
    e: React.MouseEvent | React.PointerEvent
  ) => {
    e.stopPropagation();
    e.preventDefault();

    if (!wiringSource) {
      // Step 2: Select source terminal
      playTick();
      setWiringSource({ compId, termId });
      onSelectComponent(null);
      onSelectWire(null);

      const comp = components.find((c) => c.id === compId);
      const spec = comp ? SYLLABUS_COMPONENT_SPECIFICATIONS[comp.type] : null;
      const termDef = spec?.terminals.find((t) => t.id === termId);
      const termName = termDef?.name || termId;
      onNotice?.(`Selected ${comp?.label || compId} [${termName}]. Now click destination terminal.`);
    } else {
      // Step 4: Click destination terminal
      if (wiringSource.compId === compId && wiringSource.termId === termId) {
        // Clicked the exact same terminal: keep incomplete and show helpful notice
        playError();
        onNotice?.('Cannot connect a terminal to itself. Select a different terminal or press Esc to cancel.');
        return;
      }

      // Check if duplicate wire already exists
      const wireExists = wires.some(
        (w) =>
          (w.fromCompId === wiringSource.compId &&
            w.fromTerminalId === wiringSource.termId &&
            w.toCompId === compId &&
            w.toTerminalId === termId) ||
          (w.fromCompId === compId &&
            w.fromTerminalId === termId &&
            w.toCompId === wiringSource.compId &&
            w.toTerminalId === wiringSource.termId)
      );

      if (wireExists) {
        playError();
        onNotice?.('A wire connection between these two terminals already exists.');
        return;
      }

      // Valid connection: Create wire
      playSnap();
      onCreateWire(wiringSource.compId, wiringSource.termId, compId, termId);
      const fromComp = components.find((c) => c.id === wiringSource.compId);
      const toComp = components.find((c) => c.id === compId);
      onNotice?.(`Wire created: connected ${fromComp?.label || wiringSource.compId} to ${toComp?.label || compId}`);
      setWiringSource(null);
    }
  };

  // Keyboard shortcut listener for canvas actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (wiringSource) {
          setWiringSource(null);
          onNotice?.('Wire connection cancelled (Esc)');
        } else if (isWireMode) {
          onToggleWireMode?.(false);
          onNotice?.('Exited Wire mode (Esc)');
        }
        onSelectComponent(null);
        onSelectWire(null);
      } else if (e.key === 'w' || e.key === 'W') {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          onToggleWireMode?.(!isWireMode);
          onNotice?.(!isWireMode ? 'Wire Tool Activated: Click any terminal to connect' : 'Select Tool Activated');
        }
      } else if (e.key === 'v' || e.key === 'V') {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          onToggleWireMode?.(false);
          setWiringSource(null);
          onNotice?.('Select Tool Activated');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [wiringSource, isWireMode, onToggleWireMode, onNotice, onSelectComponent, onSelectWire]);

  // Terminal coordinates helper
  const getTerminalCoords = (compId: string, termId: string): { x: number; y: number } | null => {
    const comp = components.find((c) => c.id === compId);
    if (!comp) return null;
    const spec = SYLLABUS_COMPONENT_SPECIFICATIONS[comp.type];
    if (!spec) return null;
    const termDef = spec.terminals.find((t) => t.id === termId);
    if (!termDef) return null;
    return getTerminalAbsoluteCoords(comp.x, comp.y, comp.rotation, termDef);
  };

  // Generate Orthogonal Manhattan routing path for wires
  const computeWirePath = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ): string => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    if (Math.abs(dx) < 4 || Math.abs(dy) < 4) {
      return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
    }

    // Midpoint stepped orthogonal route
    const midX = start.x + dx / 2;
    return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
  };

  // Identify junction dots where 3+ wire ends meet at a terminal
  const terminalUsageCount = new Map<string, number>();
  for (const w of wires) {
    const k1 = `${w.fromCompId}:${w.fromTerminalId}`;
    const k2 = `${w.toCompId}:${w.toTerminalId}`;
    terminalUsageCount.set(k1, (terminalUsageCount.get(k1) || 0) + 1);
    terminalUsageCount.set(k2, (terminalUsageCount.get(k2) || 0) + 1);
  }

  // Active wiring source coordinates
  const activeSourceCoords = wiringSource
    ? getTerminalCoords(wiringSource.compId, wiringSource.termId)
    : null;

  // Snapped target coordinates for preview line when hovering a destination terminal
  const previewEndPos =
    hoveredTerminal &&
    (hoveredTerminal.compId !== wiringSource?.compId ||
      hoveredTerminal.termId !== wiringSource?.termId)
      ? getTerminalCoords(hoveredTerminal.compId, hoveredTerminal.termId) || mouseCanvasPos
      : mouseCanvasPos;

  const isConnectingOrWireMode = isWireMode || !!wiringSource;

  return (
    <div
      ref={containerRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onWheel={handleWheel}
      className={`relative flex-1 w-full h-full overflow-hidden bg-[#0B0F19] select-none border-2 border-white/10 ${
        isConnectingOrWireMode ? 'cursor-crosshair' : 'cursor-default'
      }`}
      style={{
        backgroundImage: `
          radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.08) 1.2px, transparent 0),
          radial-gradient(circle at 1px 1px, rgba(0, 240, 255, 0.12) 1.5px, transparent 0)
        `,
        backgroundSize: `${20 * zoom}px ${20 * zoom}px, ${100 * zoom}px ${100 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px, ${pan.x}px ${pan.y}px`
      }}
    >
      {/* 4 Corner Aluminum Mounting Screws (Pro Hardware Accent) */}
      <div className="absolute top-3 left-3 pointer-events-none opacity-30">
        <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#1A1E29] border border-cyan-400/40" />
        </div>
      </div>
      <div className="absolute top-3 right-3 pointer-events-none opacity-30">
        <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#1A1E29] border border-cyan-400/40" />
        </div>
      </div>
      <div className="absolute bottom-3 left-3 pointer-events-none opacity-30">
        <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#1A1E29] border border-cyan-400/40" />
        </div>
      </div>
      <div className="absolute bottom-3 right-3 pointer-events-none opacity-30">
        <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#1A1E29] border border-cyan-400/40" />
        </div>
      </div>

      {/* SVG Canvas Root */}
      <svg className="w-full h-full overflow-visible pointer-events-none">
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* 1. WIRES LAYER: LIVE WIRE VISUAL FEEDBACK (Phase 18C) */}
          {wires.map((wire) => {
            const start = getTerminalCoords(wire.fromCompId, wire.fromTerminalId);
            const end = getTerminalCoords(wire.toCompId, wire.toTerminalId);
            if (!start || !end) return null;

            const isSelected = wire.id === selectedWireId;
            const pathData = computeWirePath(start, end);

            return (
              <g
                key={wire.id}
                className="pointer-events-auto cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectWire(wire.id);
                  onSelectComponent(null);
                }}
              >
                {/* 1A. Thick transparent hit-test line for easy clicking */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* 1B. Ambient Glow Overlay (Active Connection Glow / Selection Halo) */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={isSelected ? '#FF5722' : '#00F0FF'}
                  strokeWidth={isSelected ? '8' : '5'}
                  strokeOpacity={isSelected ? 0.45 : 0.22}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-all duration-200 group-hover:stroke-opacity-50 ${
                    isPowerPulseActive ? 'live-wire-pulse-surge' : ''
                  }`}
                  style={{
                    filter: isSelected
                      ? 'drop-shadow(0 0 8px rgba(255, 87, 34, 0.85))'
                      : 'drop-shadow(0 0 4px rgba(0, 240, 255, 0.65))'
                  }}
                />

                {/* 1C. Primary Live Wire Path */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={isSelected ? '#FF7043' : '#00F0FF'}
                  strokeWidth={isSelected ? '3.0' : '2.0'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-colors duration-200 group-hover:stroke-white"
                  style={{
                    filter: isSelected
                      ? 'drop-shadow(0 0 5px #FF5722)'
                      : 'drop-shadow(0 0 3px rgba(0, 240, 255, 0.8))'
                  }}
                />

                {/* 1D. Core Specular Filament (High-tech crisp highlight) */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={isSelected ? '#FFEBE5' : '#E0F7FA'}
                  strokeWidth={isSelected ? '1.4' : '0.8'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pointer-events-none opacity-85 group-hover:opacity-100"
                />

                {/* 1E. "Power On" Travelling Current Dash (One-Shot Validation Pulse) */}
                {isPowerPulseActive && (
                  <path
                    d={pathData}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="live-wire-pulse-current pointer-events-none"
                    style={{
                      filter: 'drop-shadow(0 0 8px #00F0FF) drop-shadow(0 0 4px #FFFFFF)'
                    }}
                  />
                )}
              </g>
            );
          })}

          {/* 2. RUBBERBAND WIRING PREVIEW LINE */}
          {activeSourceCoords && (
            <g className="pointer-events-none">
              <path
                d={computeWirePath(activeSourceCoords, previewEndPos)}
                fill="none"
                stroke="#00F0FF"
                strokeWidth="2.4"
                strokeDasharray="6 4"
                className="animate-pulse"
                style={{
                  filter: 'drop-shadow(0 0 5px rgba(0, 240, 255, 0.75))'
                }}
              />
              <circle
                cx={previewEndPos.x}
                cy={previewEndPos.y}
                r="5.5"
                fill="#00F0FF"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                style={{
                  filter: 'drop-shadow(0 0 6px rgba(0, 240, 255, 0.9))'
                }}
              />
            </g>
          )}

          {/* 3. JUNCTION DOTS */}
          {components.map((comp) => {
            const spec = SYLLABUS_COMPONENT_SPECIFICATIONS[comp.type];
            if (!spec) return null;

            return spec.terminals.map((term) => {
              const count = terminalUsageCount.get(`${comp.id}:${term.id}`) || 0;
              if (count < 2) return null;

              const coords = getTerminalAbsoluteCoords(comp.x, comp.y, comp.rotation, term);
              return (
                <g key={`junc-${comp.id}-${term.id}`} className="pointer-events-none">
                  {/* Subtle junction halo */}
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={isPowerPulseActive ? '6' : '4.5'}
                    fill="rgba(0, 240, 255, 0.3)"
                    className={isPowerPulseActive ? 'animate-ping' : ''}
                  />
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r="4"
                    fill="#00F0FF"
                    stroke="#0B0F19"
                    strokeWidth="1.8"
                    style={{
                      filter: 'drop-shadow(0 0 4px rgba(0, 240, 255, 0.8))'
                    }}
                  />
                </g>
              );
            });
          })}

          {/* 4. COMPONENTS LAYER */}
          {components.map((comp) => {
            const isSelected = comp.id === selectedComponentId;
            return (
              <g
                key={comp.id}
                className="pointer-events-auto"
                onMouseDown={(e) => handleComponentMouseDown(comp, e)}
              >
                <ComponentSymbolSvg
                  component={comp}
                  isSelected={isSelected}
                  activeTerminalId={wiringSource?.compId === comp.id ? wiringSource.termId : null}
                />
              </g>
            );
          })}

          {/* 5. TERMINALS INTERACTION LAYER: SNAP FEEDBACK (Phase 18C) */}
          {components.map((comp) => {
            const spec = SYLLABUS_COMPONENT_SPECIFICATIONS[comp.type];
            if (!spec) return null;

            return spec.terminals.map((term) => {
              const coords = getTerminalAbsoluteCoords(comp.x, comp.y, comp.rotation, term);
              const isSource = wiringSource?.compId === comp.id && wiringSource?.termId === term.id;
              const isHovered = hoveredTerminal?.compId === comp.id && hoveredTerminal?.termId === term.id;
              const highlightAll = isConnectingOrWireMode;

              // Check if a wire already exists between wiring source and this terminal
              const isDuplicateWire = Boolean(
                wiringSource &&
                wires.some(
                  (w) =>
                    (w.fromCompId === wiringSource.compId &&
                      w.fromTerminalId === wiringSource.termId &&
                      w.toCompId === comp.id &&
                      w.toTerminalId === term.id) ||
                    (w.fromCompId === comp.id &&
                      w.fromTerminalId === term.id &&
                      w.toCompId === wiringSource.compId &&
                      w.toTerminalId === wiringSource.termId)
                )
              );

              // Terminal is a valid snap target when dragging a wire, not self, and wire doesn't already exist
              const isValidSnapTarget = Boolean(wiringSource && !isSource && !isDuplicateWire);

              return (
                <g
                  key={`term-${comp.id}-${term.id}`}
                  className="pointer-events-auto cursor-crosshair group terminal-snap-node"
                  transform={`translate(${coords.x}, ${coords.y}) ${
                    isHovered && isValidSnapTarget ? 'scale(1.32)' : 'scale(1)'
                  }`}
                  onMouseDown={(e) => {
                    // Critical: stop propagation so parent canvas does not interpret this as empty-space click
                    e.stopPropagation();
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                  }}
                  onPointerUp={(e) => {
                    e.stopPropagation();
                  }}
                  onClick={(e) => handleTerminalClick(comp.id, term.id, e)}
                  onMouseEnter={() => setHoveredTerminal({ compId: comp.id, termId: term.id })}
                  onMouseLeave={() => setHoveredTerminal(null)}
                >
                  {/* Generous 30px transparent hit target ensuring comfortable clicks */}
                  <circle
                    cx="0"
                    cy="0"
                    r="15"
                    fill="#ffffff"
                    fillOpacity="0.001"
                    style={{ pointerEvents: 'all' }}
                  />

                  {/* Outer target guide / beacon ring */}
                  {highlightAll && !isSource && (
                    <circle
                      cx="0"
                      cy="0"
                      r={isValidSnapTarget && isHovered ? '11' : '9'}
                      fill={isValidSnapTarget && isHovered ? 'rgba(0, 240, 255, 0.16)' : 'none'}
                      stroke={isValidSnapTarget && isHovered ? '#00F0FF' : isHovered ? '#FF5722' : '#00F0FF'}
                      strokeWidth={isValidSnapTarget && isHovered ? '2.2' : isHovered ? '2' : '1.2'}
                      strokeDasharray={isValidSnapTarget && isHovered ? '4 2' : isHovered ? 'none' : '2 2'}
                      className={isValidSnapTarget && isHovered ? 'animate-spin' : isHovered ? 'animate-pulse' : 'opacity-70'}
                      style={{
                        filter: isValidSnapTarget && isHovered ? 'drop-shadow(0 0 6px rgba(0, 240, 255, 0.85))' : undefined
                      }}
                    />
                  )}

                  {/* Pulsing ring when terminal is active wire source */}
                  {isSource && (
                    <circle
                      cx="0"
                      cy="0"
                      r="11"
                      fill="rgba(255, 87, 34, 0.15)"
                      stroke="#FF5722"
                      strokeWidth="2.2"
                      strokeDasharray="4 2"
                      className="animate-spin"
                      style={{
                        filter: 'drop-shadow(0 0 6px rgba(255, 87, 34, 0.85))'
                      }}
                    />
                  )}

                  {/* Contact pad with Neon Cyan snap indicator */}
                  <circle
                    cx="0"
                    cy="0"
                    r={
                      isSource
                        ? '5.5'
                        : isValidSnapTarget && isHovered
                          ? '5.8'
                          : isHovered
                            ? '5'
                            : '3.8'
                    }
                    fill={
                      isSource
                        ? '#FF5722'
                        : isValidSnapTarget && isHovered
                          ? '#00F0FF'
                          : isHovered
                            ? '#FF5722'
                            : '#00F0FF'
                    }
                    stroke={
                      isSource
                        ? '#FFFFFF'
                        : isValidSnapTarget && isHovered
                          ? '#FFFFFF'
                          : '#0B0F19'
                    }
                    strokeWidth={isHovered || isSource ? '2' : '1.2'}
                    className="transition-colors duration-150"
                    style={{
                      filter:
                        isSource
                          ? 'drop-shadow(0 0 6px rgba(255, 87, 34, 0.9))'
                          : isValidSnapTarget && isHovered
                            ? 'drop-shadow(0 0 7px rgba(0, 240, 255, 0.95))'
                            : 'drop-shadow(0 0 2px rgba(0, 240, 255, 0.4))'
                    }}
                  />

                  {/* Terminal Pin Label Tag when hovered or active */}
                  {(isHovered || isSource) && (
                    <g transform="translate(0, -20)" className="pointer-events-none select-none">
                      <rect
                        x="-30"
                        y="-10"
                        width="60"
                        height="15"
                        rx="2"
                        fill="#0B0F19"
                        stroke={
                          isSource
                            ? '#FF5722'
                            : isValidSnapTarget && isHovered
                              ? '#00F0FF'
                              : isHovered && isDuplicateWire
                                ? '#FF5722'
                                : '#00F0FF'
                        }
                        strokeWidth="1.2"
                        fillOpacity="0.95"
                        style={{
                          filter:
                            isValidSnapTarget && isHovered
                              ? 'drop-shadow(0 0 6px rgba(0, 240, 255, 0.6))'
                              : undefined
                        }}
                      />
                      <text
                        x="0"
                        y="1"
                        textAnchor="middle"
                        fill={
                          isSource
                            ? '#FFAB91'
                            : isValidSnapTarget && isHovered
                              ? '#00F0FF'
                              : isHovered && isDuplicateWire
                                ? '#FF8A65'
                                : '#F8FAFC'
                        }
                        fontSize="8"
                        fontFamily="Fira Code, monospace"
                        fontWeight="700"
                      >
                        {isSource
                          ? `FROM: ${term.label || term.name}`
                          : isValidSnapTarget && isHovered
                            ? `SNAP: ${term.label || term.name}`
                            : isDuplicateWire
                              ? `CONNECTED`
                              : term.label || term.name}
                      </text>
                    </g>
                  )}
                </g>
              );
            });
          })}
        </g>
      </svg>

      {/* TOP INSTRUCTION & WIRE CONNECTION STATUS BANNER */}
      {isConnectingOrWireMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-1.5 rounded-[3px] bg-[#1A1E29]/95 border border-white/10 text-white font-mono text-xs shadow-[0_4px_16px_rgba(0,0,0,0.5)] backdrop-blur-sm">
          <Cable className="w-4 h-4 text-[#00F0FF] shrink-0" />
          <span>
            {wiringSource ? (
              <>
                Connecting from{' '}
                <strong className="text-[#00F0FF]">
                  {components.find((c) => c.id === wiringSource.compId)?.label || wiringSource.compId}
                </strong>
                : hover & click destination terminal to connect wire.
              </>
            ) : (
              <>Select a terminal, then hover destination terminal to snap & connect.</>
            )}
          </span>
          <button
            onClick={() => {
              setWiringSource(null);
              onToggleWireMode?.(false);
              onNotice?.('Wire connection cancelled');
            }}
            className="ml-2 px-2 py-0.5 rounded-[2px] bg-[#111520] hover:bg-[#222736] text-slate-300 hover:text-white text-[11px] font-medium border border-white/10 cursor-pointer flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" />
            <span>Cancel</span>
          </button>
        </div>
      )}

      {/* EMPTY CANVAS CONTEXTUAL GUIDANCE */}
      {components.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
          <div className="max-w-md p-6 rounded-[4px] bg-[#1A1E29]/95 border border-white/10 text-center shadow-[0_8px_24px_rgba(0,0,0,0.6)] space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-[#111520] border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF]">
              <MousePointer className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold font-mono text-white">
              Manual circuit board ready
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Assemble op-amp circuits visually using syllabus components.
              Add components from the library on the left, then use the <strong className="text-[#00F0FF]">Wire tool</strong> or click terminals directly to connect them.
            </p>
            <div className="pt-2 flex justify-center gap-2 text-[11px] font-mono text-slate-400">
              <span className="px-2 py-0.5 rounded-[2px] bg-[#111520] border border-white/10 text-slate-300">W: Wire tool</span>
              <span className="px-2 py-0.5 rounded-[2px] bg-[#111520] border border-white/10 text-slate-300">V: Select</span>
              <span className="px-2 py-0.5 rounded-[2px] bg-[#111520] border border-white/10 text-slate-300">R: Rotate</span>
              <span className="px-2 py-0.5 rounded-[2px] bg-[#111520] border border-white/10 text-slate-300">Del: Remove</span>
            </div>
          </div>
        </div>
      )}

      {/* CANVAS FLOATING VIEWPORT CONTROLS */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 p-1 rounded-[3px] bg-[#1A1E29]/90 border border-white/10 shadow-lg text-xs font-mono select-none backdrop-blur-xs">
        <button
          onClick={() => handleZoom(0.1)}
          className="p-1.5 rounded-[2px] hover:bg-[#222736] text-slate-300 hover:text-white transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="px-1 text-[11px] text-slate-400 font-medium min-w-[42px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => handleZoom(-0.1)}
          className="p-1.5 rounded-[2px] hover:bg-[#222736] text-slate-300 hover:text-white transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-white/10 my-auto" />
        <button
          onClick={handleFitCircuit}
          className="p-1.5 rounded-[2px] hover:bg-[#222736] text-slate-300 hover:text-white transition-colors"
          title="Fit circuit to workspace view"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-1.5 rounded-[2px] hover:bg-[#222736] text-slate-300 hover:text-white transition-colors"
          title="Reset zoom & pan (100%)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* COMPONENT / WIRE COUNT BADGE */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-[3px] bg-[#1A1E29]/90 border border-white/10 text-[11px] font-mono text-slate-400 shadow-lg backdrop-blur-xs">
        <span>Components: <strong className="text-white">{components.length}</strong></span>
        <span>•</span>
        <span>Wires: <strong className="text-[#00F0FF]">{wires.length}</strong></span>
      </div>
    </div>
  );
};
