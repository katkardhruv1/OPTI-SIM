import React, { useState } from 'react';
import { CIRCUIT_REGISTRY, CATEGORIES } from '../circuits/registry';
import { Layers, ChevronRight, Lock, Search } from 'lucide-react';

interface SidebarProps {
  selectedCircuitId: string;
  onSelectCircuit: (id: string) => void;
  onNotice: (msg: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedCircuitId,
  onSelectCircuit,
  onNotice,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed((prev) => !prev));

  const [searchQuery, setSearchQuery] = useState('');

  const activeCount = CIRCUIT_REGISTRY.filter((c) => c.status === 'active').length;

  const filteredCircuits = CIRCUIT_REGISTRY.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isCollapsed) {
    return (
      <aside className="w-12 shrink-0 border-r border-white/10 bg-[#1A1E29] flex flex-col items-center py-3 select-none justify-between h-full">
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={toggleCollapse}
            className="p-2 rounded-[3px] bg-[#111520] hover:bg-white/5 text-slate-300 transition-colors cursor-pointer eng-focus border border-white/10"
            title="Expand Circuit Library Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="p-1.5 rounded-[3px] bg-[#0B0F19] border border-[#00F0FF]/40 text-[#00F0FF]">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-mono text-slate-400 [writing-mode:vertical-rl] rotate-180 select-none py-2 font-semibold tracking-wider uppercase">
            Circuit Library
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#00F0FF] bg-[#0B0F19] px-1 py-0.5 rounded-[2px] border border-white/10">
          {activeCount}
        </span>
      </aside>
    );
  }

  return (
    <aside className="w-72 lg:w-80 shrink-0 border-r border-white/10 bg-[#1A1E29] flex flex-col h-full overflow-hidden select-none transition-all">
      {/* Sidebar Header */}
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Layers className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span className="font-mono uppercase tracking-wider text-[11px] font-bold">Circuit Library</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-[#00F0FF] bg-[#0B0F19] px-1.5 py-0.5 rounded-[2px] border border-white/10">
              {activeCount} active
            </span>
            <button
              onClick={toggleCollapse}
              className="p-1 rounded-[3px] hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer eng-focus"
              title="Collapse sidebar to maximize workspace"
            >
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search circuit topologies..."
            className="w-full bg-[#0B0F19] border border-white/10 rounded-[3px] px-2.5 py-1.5 pl-8 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]/40 font-mono transition-colors"
          />
        </div>
      </div>

      {/* Categories & Circuit List */}
      <div className="flex-1 overflow-y-auto p-3 pb-12 space-y-4">
        {CATEGORIES.map((category) => {
          const categoryCircuits = filteredCircuits.filter(
            (c) => c.category === category.id
          );

          if (categoryCircuits.length === 0) return null;

          return (
            <div key={category.id} className="space-y-1">
              <div className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
                {category.label}
              </div>

              <div className="space-y-0.5">
                {categoryCircuits.map((circuit) => {
                  const isActive = circuit.id === selectedCircuitId;
                  const isAvailable = circuit.status === 'active';

                  return (
                    <button
                      key={circuit.id}
                      onClick={() => {
                        if (isAvailable) {
                          onSelectCircuit(circuit.id);
                        } else {
                          onNotice(
                            `"${circuit.name}" is scheduled for the next module update.`
                          );
                        }
                      }}
                      className={`w-full group text-left px-2.5 py-1.5 rounded-[3px] text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#00F0FF]/15 text-[#00F0FF] font-semibold border-l-2 border-l-[#00F0FF] border-t-0 border-r-0 border-b-0 shadow-xs'
                          : isAvailable
                          ? 'hover:bg-white/5 text-slate-200 border border-transparent'
                          : 'text-slate-500 hover:bg-white/5 border border-transparent cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isActive
                              ? 'bg-[#00F0FF] shadow-[0_0_6px_#00F0FF]'
                              : isAvailable
                              ? 'bg-slate-500'
                              : 'bg-slate-600'
                          }`}
                        />
                        <span className="truncate">{circuit.name}</span>
                      </div>

                      {isAvailable ? (
                        <ChevronRight
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? 'text-[#00F0FF]' : 'text-slate-500 group-hover:text-slate-200'
                          }`}
                        />
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Soon</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Module info footer */}
      <div className="p-2.5 border-t border-white/10 bg-[#141824] text-[11px] text-slate-400 font-mono flex items-center justify-between">
        <span>ENTC Syllabus</span>
        <span className="text-[#00F0FF] font-semibold">Unit 1: Op-Amp</span>
      </div>
    </aside>
  );
};
