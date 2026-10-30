import React, { useState } from 'react';
import {
  BuilderComponentType,
  ComponentCategory
} from '../../types/circuitBuilder';
import {
  SYLLABUS_COMPONENT_SPECIFICATIONS,
  SYLLABUS_PRESET_TEMPLATES
} from './componentCatalog';
import {
  Cpu,
  Zap,
  Activity,
  Layers,
  Sparkles,
  BookOpen,
  Plus,
  ChevronLeft,
  ChevronRight,
  Radio
} from 'lucide-react';

interface ComponentLibraryProps {
  onAddComponent: (type: BuilderComponentType) => void;
  onLoadPreset: (presetId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const ComponentLibrary: React.FC<ComponentLibraryProps> = ({
  onAddComponent,
  onLoadPreset,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const specs = Object.values(SYLLABUS_COMPONENT_SPECIFICATIONS);

  const filteredSpecs = specs.filter((spec) => {
    if (selectedCategory !== 'all' && spec.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        spec.displayName.toLowerCase().includes(q) ||
        spec.prefix.toLowerCase().includes(q) ||
        spec.syllabusNote.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Collapsed Rail View
  if (isCollapsed) {
    return (
      <aside className="w-12 bg-[#090e1a] border-r border-slate-800 flex flex-col items-center py-2.5 shrink-0 select-none justify-between h-full z-10">
        <div className="flex flex-col items-center gap-3 w-full">
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-cyan-400 hover:text-white transition-colors cursor-pointer eng-focus"
            title="Expand Component Library (L)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <div className="w-6 h-px bg-slate-800" />

          {/* Quick Add Icons */}
          <button
            onClick={() => onAddComponent('op-amp')}
            className="p-2 rounded hover:bg-cyan-950 text-cyan-400 border border-transparent hover:border-cyan-800 transition-colors cursor-pointer"
            title="Quick Add: LM741 Op-Amp"
          >
            <Cpu className="w-4 h-4" />
          </button>

          <button
            onClick={() => onAddComponent('resistor')}
            className="p-2 rounded hover:bg-cyan-950 text-cyan-400 border border-transparent hover:border-cyan-800 transition-colors cursor-pointer"
            title="Quick Add: Resistor"
          >
            <Zap className="w-4 h-4" />
          </button>

          <button
            onClick={() => onAddComponent('capacitor')}
            className="p-2 rounded hover:bg-cyan-950 text-cyan-400 border border-transparent hover:border-cyan-800 transition-colors cursor-pointer"
            title="Quick Add: Capacitor"
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            onClick={() => onAddComponent('ac-source')}
            className="p-2 rounded hover:bg-cyan-950 text-cyan-400 border border-transparent hover:border-cyan-800 transition-colors cursor-pointer"
            title="Quick Add: AC Signal Generator"
          >
            <Activity className="w-4 h-4" />
          </button>

          <button
            onClick={() => onAddComponent('ground')}
            className="p-2 rounded hover:bg-cyan-950 text-cyan-400 border border-transparent hover:border-cyan-800 transition-colors cursor-pointer"
            title="Quick Add: 0V Ground"
          >
            <Radio className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center pb-2">
          <span className="text-[9.5px] font-mono text-slate-500 uppercase tracking-widest [writing-mode:vertical-rl] rotate-180 select-none py-1">
            Components
          </span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-72 bg-[#090e1a] border-r border-slate-800 flex flex-col shrink-0 select-none transition-all">
      {/* Header */}
      <div className="p-3 border-b border-slate-800">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Component Library
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              Syllabus
            </span>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer eng-focus"
                title="Collapse Component Library to maximize canvas"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          Components strictly derived from SPPU laboratory practical manuals.
        </p>
      </div>

      {/* Preset Circuits Quick-Start Dropdown */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/60">
        <label className="text-[10.5px] font-mono font-bold text-cyan-400 flex items-center gap-1.5 mb-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Load Syllabus Preset:</span>
        </label>
        <select
          onChange={(e) => {
            if (e.target.value) {
              onLoadPreset(e.target.value);
              e.target.value = '';
            }
          }}
          defaultValue=""
          className="w-full text-xs font-mono bg-[#070b14] border border-slate-700 text-slate-200 rounded p-1.5 focus:outline-hidden focus:border-cyan-500 cursor-pointer"
        >
          <option value="" disabled>Select a syllabus practical template...</option>
          {SYLLABUS_PRESET_TEMPLATES.map((tmpl) => (
            <option key={tmpl.id} value={tmpl.id}>
              {tmpl.title}
            </option>
          ))}
        </select>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex p-1.5 gap-1 border-b border-slate-800 bg-[#070b14] text-[10.5px] font-mono overflow-x-auto">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setSelectedCategory('active')}
          className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
            selectedCategory === 'active'
              ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setSelectedCategory('passive')}
          className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
            selectedCategory === 'passive'
              ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Passive
        </button>
        <button
          onClick={() => setSelectedCategory('sources')}
          className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
            selectedCategory === 'sources'
              ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Sources
        </button>
      </div>

      {/* Component Catalog List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredSpecs.map((spec) => (
          <div
            key={spec.type}
            className="p-2.5 rounded-lg border border-slate-800 bg-[#070b14]/80 hover:border-cyan-500/50 hover:bg-[#0c1424] transition-all group cursor-pointer"
            onClick={() => onAddComponent(spec.type)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-mono text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {spec.displayName}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 mb-1">
                  Prefix: <strong className="text-cyan-400">{spec.prefix}</strong> • {spec.terminals.length} Terminals
                </div>
                <div className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                  {spec.syllabusNote}
                </div>
              </div>

              <button
                className="shrink-0 p-1.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 group-hover:bg-cyan-600 group-hover:text-white transition-colors"
                title={`Add ${spec.displayName} to canvas`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Syllabus Assurance Footer */}
      <div className="p-3 border-t border-slate-800 bg-[#070b14] text-[10px] text-slate-400 flex items-center gap-2">
        <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span>Verified against NMIET PCC-204 &amp; Modern College manuals.</span>
      </div>
    </aside>
  );
};
