import React, { useState } from 'react';
import { X, BookOpen, Search, ExternalLink, Activity, Sliders, CheckCircle2, Bookmark, Layers, Cpu } from 'lucide-react';
import { CIRCUIT_REGISTRY } from '../circuits/registry';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCircuit?: (id: string) => void;
}

const CIRCUIT_REFERENCES = [
  {
    id: 'inverting-amplifier',
    name: 'Inverting Amplifier',
    category: 'Linear Applications',
    purpose: 'Linear voltage amplification with 180° phase inversion and virtual ground condition.',
    formula: 'Av = -Rf / Rin ; Vout = Av × Vin',
    parameters: 'Vin (input voltage), Rin (input resistance), Rf (feedback resistance), ±Vsat (power rails)'
  },
  {
    id: 'non-inverting-amplifier',
    name: 'Non-Inverting Amplifier',
    category: 'Linear Applications',
    purpose: 'High input impedance linear amplification in phase (0° phase shift) with minimum gain Av ≥ 1.',
    formula: 'Av = 1 + (Rf / R1) ; Vout = Av × Vin',
    parameters: 'Vin (input voltage), R1 (ground divider resistance), Rf (feedback resistance)'
  },
  {
    id: 'voltage-follower',
    name: 'Voltage Follower (Unity Buffer)',
    category: 'Linear Applications',
    purpose: 'Unity gain buffer (Av = 1) providing maximum impedance isolation to prevent source loading.',
    formula: 'Vout = Vin (Av = 1.0)',
    parameters: 'Vin (input voltage), direct 100% negative feedback link'
  },
  {
    id: 'summing-amplifier',
    name: 'Summing Amplifier',
    category: 'Linear Applications',
    purpose: 'Analog weighted algebraic addition (mixing) of multiple input voltages with 180° inversion.',
    formula: 'Vout = -Rf ∑(Vi / Ri)',
    parameters: 'V1..Vn (channel voltages), R1..Rn (branch resistances), Rf (summing feedback resistor)'
  },
  {
    id: 'differential-amplifier',
    name: 'Differential Amplifier',
    category: 'Linear Applications',
    purpose: 'Amplification of the voltage difference (V2 - V1) while rejecting common-mode noise (CMRR).',
    formula: 'Vout = (Rf / R1) × (V2 - V1)',
    parameters: 'V1, V2 (input voltages), R1, R2, Rf, Rg (balanced 4-resistor bridge)'
  },
  {
    id: 'integrator',
    name: 'Practical Integrator',
    category: 'Linear Applications',
    purpose: 'Mathematical time integration (e.g. square-to-triangle) with shunt Rf limiting low-frequency drift.',
    formula: 'Vout(t) = -(1/RC) ∫ Vin dt ; fa = 1/(2π Rf C)',
    parameters: 'Rin (input resistance), C (feedback capacitor), Rf (shunt DC stabilization resistor)'
  },
  {
    id: 'differentiator',
    name: 'Practical Differentiator',
    category: 'Linear Applications',
    purpose: 'Mathematical rate-of-change evaluation with series R1 and Cf suppressing high-frequency noise.',
    formula: 'Vout(t) = -Rf C (dVin/dt) ; fb = 1/(2π R1 C)',
    parameters: 'C (input capacitor), Rf (feedback resistor), R1 (series noise suppression resistor)'
  },
  {
    id: 'low-pass-filter',
    name: 'First Order Low Pass Filter',
    category: 'Linear Applications',
    purpose: 'Passes frequencies below cutoff fc while attenuating high frequencies at -20 dB/decade.',
    formula: 'fc = 1 / (2π R C) ; |Av(f)| = Af / √(1 + (f/fc)²)',
    parameters: 'R (filter resistor), C (filter capacitor), Rf, R1 (passband gain setting)'
  },
  {
    id: 'high-pass-filter',
    name: 'First Order High Pass Filter',
    category: 'Linear Applications',
    purpose: 'Blocks DC and low frequencies below fc while passing high-frequency signals with +45° lead at fc.',
    formula: 'fc = 1 / (2π R C) ; |Av(f)| = Af(f/fc) / √(1 + (f/fc)²)',
    parameters: 'R (filter resistor), C (series coupling capacitor), passband gain resistors'
  },
  {
    id: 'precision-rectifier',
    name: 'Precision Half-Wave Rectifier',
    category: 'Linear Applications',
    purpose: 'Superdiode circuit eliminating the 0.7 V silicon diode barrier drop for millivolt rectification.',
    formula: 'Vout = Vin (Vin > 0) ; Vout = 0V (Vin ≤ 0)',
    parameters: 'Vin (AC peak), feedback diode D1, load resistance RL'
  },
  {
    id: 'comparator',
    name: 'Op-Amp Comparator',
    category: 'Nonlinear Applications',
    purpose: 'Open-loop high-gain threshold digitizing, switching outputs rail-to-rail (±Vsat).',
    formula: 'Vout = +Vsat (Vin > Vref) ; -Vsat (Vin < Vref)',
    parameters: 'Vin (analog input), Vref (reference threshold), ±Vsat (saturation rails)'
  },
  {
    id: 'schmitt-trigger',
    name: 'Schmitt Trigger',
    category: 'Nonlinear Applications',
    purpose: 'Bistable multivibrator utilizing positive feedback with dual trigger thresholds (UTP/LTP) and noise hysteresis.',
    formula: 'UTP = β(+Vsat) ; LTP = β(-Vsat) ; VH = UTP - LTP',
    parameters: 'R1, Rf (positive feedback divider), ±Vsat (supply rails)'
  },
  {
    id: 'square-wave-generator',
    name: 'Square Wave Generator',
    category: 'Nonlinear Applications',
    purpose: 'Autonomous astable relaxation oscillator generating clock square waveforms without external trigger.',
    formula: 'T = 2 R C ln((1 + β)/(1 - β)) ; f = 1 / T',
    parameters: 'R (timing resistor), C (timing capacitor), R1, R2 (feedback fraction β)'
  },
  {
    id: 'triangular-wave-generator',
    name: 'Triangular Wave Generator',
    category: 'Nonlinear Applications',
    purpose: 'Cascaded Schmitt trigger and integrator synthesizing continuous linear triangular ramp oscillations.',
    formula: 'f = R2 / (4 R1 R C) ; Vpk = (R1 / R2) × Vsat',
    parameters: 'R, C (integrator timing), R1, R2 (Schmitt threshold resistors)'
  },
  {
    id: 'pwm-generator',
    name: 'PWM Generator',
    category: 'Nonlinear Applications',
    purpose: 'Linear pulse-width modulation by comparing triangular carrier with analog DC control voltage.',
    formula: 'Duty Cycle (%) = [(Vctrl - Vmin)/(Vmax - Vmin)] × 100',
    parameters: 'Vcarrier (amplitude, frequency), Vcontrol (DC modulation voltage)'
  },
  {
    id: 'dac',
    name: 'Digital to Analog Converter (DAC)',
    category: 'Data Conversion',
    purpose: 'Converts N-bit digital binary word into a proportional discrete analog output voltage.',
    formula: 'Vout = (D / (2^N - 1)) × Vref ; LSB = Vref / (2^N - 1)',
    parameters: 'N (resolution: 4, 8, 10-bit), Vref (reference voltage), Binary code input'
  },
  {
    id: 'adc',
    name: 'Analog to Digital Converter (ADC)',
    category: 'Data Conversion',
    purpose: 'Quantizes continuous analog input voltage into discrete binary words via parallel flash comparators.',
    formula: 'D = round((Vin / Vref) × (2^N - 1)) ; Vq = D × LSB',
    parameters: 'N (resolution: 3, 4, 8-bit), Vref (reference voltage), Vin (analog input)'
  }
];

export const DocumentationModal: React.FC<DocumentationModalProps> = ({
  isOpen,
  onClose,
  onSelectCircuit
}) => {
  const [activeTab, setActiveTab] = useState<'reference' | 'getting-started' | 'theory'>('reference');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  if (!isOpen) return null;

  const filteredReferences = CIRCUIT_REFERENCES.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.formula.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || item.category.toLowerCase().includes(categoryFilter.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const handleLaunchCircuit = (id: string) => {
    onSelectCircuit?.(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-4xl max-h-[88vh] flex flex-col rounded-[3px] border border-white/10 bg-[#0B0F19] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-[#1A1E29] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-[3px] bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono">
                OPTI-SIM TECHNICAL DOCUMENTATION & REFERENCE
              </h2>
              <p className="text-xs text-slate-400">
                Operational Amplifier Circuit Library • Signal Analysis • Laboratory Curriculum
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[3px] text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/10 bg-[#111520] text-xs font-mono shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-[#0B0F19] p-0.5 rounded-[3px] border border-white/10">
            <button
              onClick={() => setActiveTab('reference')}
              className={`px-3 py-1.5 rounded-[2px] transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'reference'
                  ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Circuit Reference (17)</span>
            </button>

            <button
              onClick={() => setActiveTab('getting-started')}
              className={`px-3 py-1.5 rounded-[2px] transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'getting-started'
                  ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Waveforms & Measurements</span>
            </button>

            <button
              onClick={() => setActiveTab('theory')}
              className={`px-3 py-1.5 rounded-[2px] transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'theory'
                  ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Full Curriculum Theory</span>
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-300 leading-relaxed font-sans min-h-0">
          {/* TAB 1: SEARCHABLE CIRCUIT REFERENCE */}
          {activeTab === 'reference' && (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-[#070b14] border border-slate-800">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by circuit name, formula, or keyword..."
                    className="w-full pl-9 pr-3 py-1.5 bg-[#0a0f1d] border border-slate-800 rounded font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center gap-1 text-xs font-mono">
                  {(['all', 'linear', 'nonlinear', 'conversion'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded capitalize border transition cursor-pointer ${
                        categoryFilter === cat
                          ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat === 'all' ? 'All (17)' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredReferences.map((circuit) => (
                  <div
                    key={circuit.id}
                    className="p-4 rounded-xl bg-[#070b14] border border-slate-800 hover:border-cyan-500/50 transition space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                            {circuit.category}
                          </span>
                          <h3 className="text-sm font-bold font-mono text-slate-100">
                            {circuit.name}
                          </h3>
                        </div>
                        {onSelectCircuit && (
                          <button
                            onClick={() => handleLaunchCircuit(circuit.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900 text-[11px] font-mono transition cursor-pointer shrink-0"
                            title="Open circuit in simulator"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <p className="text-slate-300 text-xs">{circuit.purpose}</p>

                      <div className="p-2.5 rounded bg-[#0b101e] border border-slate-800 font-mono text-xs text-emerald-300">
                        <span className="text-slate-500 text-[10px] block">Governing Formula:</span>
                        {circuit.formula}
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-800/80">
                      <strong>Parameters: </strong> {circuit.parameters}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: GETTING STARTED, WAVEFORMS & MEASUREMENTS GLOSSARY */}
          {activeTab === 'getting-started' && (
            <div className="space-y-6">
              {/* Getting Started Guide */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold font-mono text-cyan-300 flex items-center gap-2 border-b border-slate-800 pb-1">
                  <span>A.</span> Getting Started with OPTI-SIM
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-[#070b14] border border-slate-800 space-y-1">
                    <span className="text-cyan-400 font-mono font-bold text-xs">Step 1 • Select</span>
                    <p className="text-slate-300 text-xs">
                      Pick any of the 17 circuits from the left sidebar or switch into <strong>Engineering Lab Mode</strong> for guided laboratory experiments.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#070b14] border border-slate-800 space-y-1">
                    <span className="text-emerald-400 font-mono font-bold text-xs">Step 2 • Configure</span>
                    <p className="text-slate-300 text-xs">
                      Enter component values (resistors, capacitors, reference voltages) or pick standard student lab presets. Use <strong>Ctrl + Enter</strong> to simulate.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#070b14] border border-slate-800 space-y-1">
                    <span className="text-indigo-400 font-mono font-bold text-xs">Step 3 • Analyze</span>
                    <p className="text-slate-300 text-xs">
                      Inspect the dynamic schematic diagram, step-by-step mathematical derivation panel, and dual-trace real-time oscilloscope.
                    </p>
                  </div>
                </div>
              </section>

              {/* Waveform Simulation Engine */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold font-mono text-cyan-300 flex items-center gap-2 border-b border-slate-800 pb-1">
                  <span>B.</span> Waveform Simulation Guide
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#070b14] border border-slate-800 space-y-1 font-mono">
                    <span className="text-amber-400 font-bold">Signal Types</span>
                    <ul className="text-slate-300 space-y-1 pt-1 text-[11px]">
                      <li>• <strong>Sine:</strong> x(t) = A sin(2πft + φ) + offset</li>
                      <li>• <strong>Square:</strong> High-speed 50% duty bipolar clock</li>
                      <li>• <strong>Triangle:</strong> Symmetric linear slope ramp</li>
                      <li>• <strong>DC:</strong> Constant non-varying voltage level</li>
                    </ul>
                  </div>
                  <div className="p-3 rounded-lg bg-[#070b14] border border-slate-800 space-y-1 font-mono">
                    <span className="text-sky-400 font-bold">Simulation Window & Rails</span>
                    <ul className="text-slate-300 space-y-1 pt-1 text-[11px]">
                      <li>• <strong>Time Window:</strong> Dynamically scaled to 3–5 periods (T = 1/f)</li>
                      <li>• <strong>Supply Rails:</strong> Output clips flat at ±Vsat (op-amp saturation)</li>
                      <li>• <strong>Time Units:</strong> Automatically displays s, ms, or µs</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Automated Engineering Measurements Glossary */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold font-mono text-cyan-300 flex items-center gap-2 border-b border-slate-800 pb-1">
                  <span>C.</span> Automated Scope Measurements Glossary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                  <div className="p-2.5 rounded bg-[#070b14] border border-slate-800">
                    <span className="text-slate-400 block font-semibold">Vpeak (Peak)</span>
                    <span className="text-slate-200">Max instantaneous absolute voltage: max(|v|)</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#070b14] border border-slate-800">
                    <span className="text-slate-400 block font-semibold">Vpp (Peak-to-Peak)</span>
                    <span className="text-slate-200">Total voltage span: Vmax - Vmin</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#070b14] border border-slate-800">
                    <span className="text-slate-400 block font-semibold">Vrms (Root Mean Square)</span>
                    <span className="text-slate-200">Effective heating power: √(∑ v² / N)</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#070b14] border border-slate-800">
                    <span className="text-slate-400 block font-semibold">Frequency & Period</span>
                    <span className="text-slate-200">Cycles per second (Hz) and period T = 1/f</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#070b14] border border-slate-800">
                    <span className="text-slate-400 block font-semibold">Voltage Gain</span>
                    <span className="text-slate-200">Measured ratio: Vout(pk) / Vin(pk)</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#070b14] border border-slate-800">
                    <span className="text-slate-400 block font-semibold">Gain in Decibels</span>
                    <span className="text-slate-200">Av(dB) = 20 × log₁₀(|Av|)</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#070b14] border border-slate-800">
                    <span className="text-slate-400 block font-semibold">Phase Difference</span>
                    <span className="text-slate-200">Time delay between zero crossings: Δθ (deg)</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#070b14] border border-slate-800">
                    <span className="text-slate-400 block font-semibold">Saturation Detection</span>
                    <span className="text-rose-400 font-bold">Triggers when output touches ±Vsat</span>
                  </div>
                </div>
              </section>

              {/* Data Conversion Reference */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold font-mono text-cyan-300 flex items-center gap-2 border-b border-slate-800 pb-1">
                  <span>D.</span> Data Conversion Principles (DAC & ADC)
                </h3>
                <div className="p-3 rounded-lg bg-[#070b14] border border-slate-800 space-y-2 text-xs leading-relaxed">
                  <p>
                    <strong className="text-cyan-300 font-mono">Digital-to-Analog Converter (DAC): </strong>
                    Uses binary-weighted or R-2R ladder networks to convert discrete binary numbers into proportional analog voltages:
                    <span className="font-mono text-emerald-300 ml-1">Vout = (D / (2^N - 1)) × Vref</span>.
                  </p>
                  <p>
                    <strong className="text-indigo-300 font-mono">Analog-to-Digital Converter (ADC): </strong>
                    Samples continuous voltages into discrete digital codes:
                    <span className="font-mono text-emerald-300 ml-1">D = round((Vin / Vref) × (2^N - 1))</span>.
                    The minimum resolvable increment is the Least Significant Bit (LSB):
                    <span className="font-mono text-emerald-300 ml-1">LSB = Vref / (2^N - 1)</span>.
                  </p>
                </div>
              </section>

              {/* Keyboard Shortcuts */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold font-mono text-cyan-300 flex items-center gap-2 border-b border-slate-800 pb-1">
                  <span>E.</span> Keyboard Shortcuts
                </h3>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-2 p-2 rounded bg-[#070b14] border border-slate-800">
                    <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-bold">
                      Ctrl + Enter
                    </kbd>
                    <span className="text-slate-400">Run Calculation & Simulation</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-[#070b14] border border-slate-800">
                    <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-bold">
                      Alt + R
                    </kbd>
                    <span className="text-slate-400">Reset Current Circuit</span>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB 3: FULL CURRICULUM THEORY MANUAL */}
          {activeTab === 'theory' && (
            <div className="space-y-6">
              {/* Section 1 */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-cyan-300 font-mono flex items-center gap-2 border-b border-slate-800 pb-1">
                  <span>01.</span> Ideal Operational Amplifier Characteristics
                </h3>
                <p>
                  An operational amplifier is a high-gain direct-coupled differential voltage amplifier. In circuit analysis, we invoke the classic ideal op-amp model:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                  <div className="p-2 rounded bg-[#0e1628] border border-slate-800">
                    <span className="text-slate-400 block">Open Loop Gain (Aol):</span>
                    <span className="text-emerald-400 font-bold">Infinite (∞)</span>
                  </div>
                  <div className="p-2 rounded bg-[#0e1628] border border-slate-800">
                    <span className="text-slate-400 block">Input Impedance (Zin):</span>
                    <span className="text-emerald-400 font-bold">Infinite (∞ Ω) → Iin ≈ 0 A</span>
                  </div>
                  <div className="p-2 rounded bg-[#0e1628] border border-slate-800">
                    <span className="text-slate-400 block">Output Impedance (Zout):</span>
                    <span className="text-emerald-400 font-bold">Zero (0 Ω)</span>
                  </div>
                  <div className="p-2 rounded bg-[#0e1628] border border-slate-800">
                    <span className="text-slate-400 block">Bandwidth (BW):</span>
                    <span className="text-emerald-400 font-bold">Infinite (DC to ∞ Hz)</span>
                  </div>
                </div>
              </section>

              {/* Section 2 */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-cyan-300 font-mono flex items-center gap-2 border-b border-slate-800 pb-1">
                  <span>02.</span> Golden Rules of Op-Amp Analysis
                </h3>
                <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                  <li>
                    <strong className="text-cyan-300">Rule 1 (Virtual Short):</strong> When negative feedback is present, the op-amp output drives the differential input voltage to zero: <span className="font-mono text-emerald-400">V(+) = V(-)</span>.
                  </li>
                  <li>
                    <strong className="text-cyan-300">Rule 2 (Zero Input Current):</strong> Because input impedance is infinite, no current flows into either the inverting or non-inverting input terminal: <span className="font-mono text-emerald-400">I(+) = I(-) = 0 A</span>.
                  </li>
                </ul>
              </section>

              {/* Section 3 */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-cyan-300 font-mono flex items-center gap-2 border-b border-slate-800 pb-1">
                  <span>03.</span> Inverting Amplifier Derivation
                </h3>
                <p>
                  Applying KCL at the inverting summing node: <span className="font-mono text-emerald-400">(Vin - V(-))/Rin + (Vout - V(-))/Rf = 0</span>. Since V(-) is held at virtual ground (0 V):
                </p>
                <div className="p-2 rounded bg-[#0e1628] border border-slate-800 font-mono text-[11px] text-cyan-300">
                  Vout = -(Rf / Rin) × Vin &nbsp;|&nbsp; Av = -Rf / Rin &nbsp;|&nbsp; Phase = 180°
                </div>
              </section>

              {/* Section 4 */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-cyan-300 font-mono flex items-center gap-2 border-b border-slate-800 pb-1">
                  <span>04.</span> Non-Inverting Amplifier Derivation
                </h3>
                <p>
                  Input voltage Vin connects to the non-inverting pin. By virtual short, the inverting pin is at Vin: <span className="font-mono text-emerald-400">Vin = Vout × [R1 / (R1 + Rf)]</span>:
                </p>
                <div className="p-2 rounded bg-[#0e1628] border border-slate-800 font-mono text-[11px] text-cyan-300">
                  Av = 1 + (Rf / R1) &nbsp;|&nbsp; Vout = Av × Vin &nbsp;|&nbsp; Phase = 0°
                </div>
              </section>

              {/* Section 5 */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-cyan-300 font-mono flex items-center gap-2 border-b border-slate-800 pb-1">
                  <span>05.</span> Active Filters & Frequency Roll-Off
                </h3>
                <p>
                  First-order active filters use an RC network with op-amp buffering. Cutoff frequency is the half-power (-3 dB) point:
                </p>
                <div className="p-2 rounded bg-[#0e1628] border border-slate-800 font-mono text-[11px] text-cyan-300">
                  fc = 1 / (2π R C) &nbsp;|&nbsp; Stopband Roll-Off = -20 dB/decade (-6 dB/octave)
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-[#1A1E29] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-[3px] bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-xs font-bold text-[#0B0F19] font-mono shadow-[0_0_8px_rgba(0,240,255,0.25)] transition-colors cursor-pointer"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
