import React, { useState, useEffect } from 'react';
import { PrecisionRectifierInputs, PrecisionRectifierResults } from '../../types/circuit';
import { calculatePrecisionRectifier, validatePrecisionRectifierInputs } from '../../calculations/rectifier';
import { generateRectifiedWaveform, WaveformData } from '../../utils/waveformGenerator';
import { InputNumber } from '../../components/ui/InputNumber';
import { ResultCard } from '../../components/ui/ResultCard';
import { TheoryTile } from '../../components/ui/TheoryTile';
import { PrecisionRectifierSchematicSvg } from '../../components/circuit/PrecisionRectifierSchematicSvg';
import { UniversalWaveformScope } from '../../components/circuit/UniversalWaveformScope';
import { simulateRectifierWaveform } from '../../utils/waveformEngine';
import { cleanFloat, formatFrequency } from '../../utils/formatters';
import { saveActiveCircuitState } from '../../utils/circuitStateBridge';
import { RotateCcw, Calculator, Zap, Eye, Activity, CheckCircle, Lightbulb } from 'lucide-react';

interface PrecisionRectifierWorkspaceProps {
  onStatusChange?: (status: 'Ready' | 'Calculated' | 'Error', hasErrors: boolean) => void;
}

const DEFAULT_INPUTS: PrecisionRectifierInputs = {
  vin: 2,
  vinUnit: 'V',
  frequency: 1000,
  frequencyUnit: 'Hz',
  diodeType: 'Ideal Superdiode',
};

export const PrecisionRectifierWorkspace: React.FC<PrecisionRectifierWorkspaceProps> = ({
  onStatusChange,
}) => {
  const [inputs, setInputs] = useState<PrecisionRectifierInputs>(DEFAULT_INPUTS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [results, setResults] = useState<PrecisionRectifierResults>(() =>
    calculatePrecisionRectifier(DEFAULT_INPUTS)
  );
  const [viewMode, setViewMode] = useState<'graph' | 'schematic'>('graph');

  // Synchronize state with central bridge for Lab Mode and Exports
  useEffect(() => {
    saveActiveCircuitState('precision-rectifier', inputs, results);
  }, [inputs, results]);

  // Generate rectified waveform data
  const waveformData: WaveformData = generateRectifiedWaveform(
    results.vinBase,
    results.freqBase
  );

  const handleCalculate = () => {
    const validationErrors = validatePrecisionRectifierInputs(inputs);

    if (validationErrors.length > 0) {
      const errMap: Record<string, string> = {};
      validationErrors.forEach((e) => {
        if (e.field) errMap[e.field] = e.message;
      });
      setErrors(errMap);
      onStatusChange?.('Error', true);
      return;
    }

    setErrors({});
    const res = calculatePrecisionRectifier(inputs);
    setResults(res);
    onStatusChange?.('Calculated', false);
  };

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    setErrors({});
    const res = calculatePrecisionRectifier(DEFAULT_INPUTS);
    setResults(res);
    onStatusChange?.('Ready', false);
  };

  const applyPresetSmallSignal = () => {
    // 100 mV small signal where regular diodes completely fail!
    const p: PrecisionRectifierInputs = {
      ...inputs,
      vin: 100,
      vinUnit: 'mV',
    };
    setInputs(p);
    setErrors({});
    const res = calculatePrecisionRectifier(p);
    setResults(res);
    onStatusChange?.('Calculated', false);
  };

  const applyPreset1V = () => {
    const p: PrecisionRectifierInputs = {
      ...inputs,
      vin: 1,
      vinUnit: 'V',
    };
    setInputs(p);
    setErrors({});
    const res = calculatePrecisionRectifier(p);
    setResults(res);
    onStatusChange?.('Calculated', false);
  };

  const applyPreset5V = () => {
    const p: PrecisionRectifierInputs = {
      ...inputs,
      vin: 5,
      vinUnit: 'V',
    };
    setInputs(p);
    setErrors({});
    const res = calculatePrecisionRectifier(p);
    setResults(res);
    onStatusChange?.('Calculated', false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#0B0F19] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. MODULE TITLE & DESCRIPTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white">
              Precision Half-Wave Rectifier
            </h1>
            <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-mono uppercase tracking-wider bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
              Superdiode Circuit
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl font-sans">
            Analyze the rectification behavior of an operational amplifier superdiode circuit with zero knee voltage threshold.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-[3px] text-xs font-mono text-slate-300 hover:text-white bg-[#0B0F19] hover:bg-[#111520] border border-white/10 transition-colors cursor-pointer"
            title="Reset parameters to standard academic defaults"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleCalculate}
            className="flex items-center gap-1.5 h-9 px-4.5 rounded-[3px] text-xs font-mono font-bold text-[#0B0F19] bg-[#00F0FF] hover:bg-[#38bdf8] shadow-[0_0_14px_rgba(0,240,255,0.35)] transition-all cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Calculate</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN SPLIT: CONTROLS & DIAGRAM/GRAPH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Parameters */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-4 sm:p-5 rounded-[4px] border border-white/10 bg-[#1A1E29] shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#00F0FF]" />
                <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                  Rectifier Parameters
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#00F0FF] bg-[#111520] px-2 py-0.5 rounded-[2px] border border-white/5">SI Units</span>
            </div>

            {/* Input Voltage */}
            <InputNumber
              id="vin"
              label="Input Voltage Peak Amplitude"
              symbol="Vin (peak)"
              value={inputs.vin}
              unit={inputs.vinUnit}
              unitOptions={['V', 'mV']}
              onValueChange={(val) => setInputs({ ...inputs, vin: val })}
              onUnitChange={(u) => setInputs({ ...inputs, vinUnit: u })}
              step={0.1}
              min={0.001}
              max={20}
              helpText="Peak sinusoidal AC input amplitude"
              error={errors.vin}
            />

            {/* Frequency */}
            <InputNumber
              id="frequency"
              label="Input Frequency"
              symbol="f"
              value={inputs.frequency}
              unit={inputs.frequencyUnit}
              unitOptions={['Hz', 'kHz']}
              onValueChange={(val) => setInputs({ ...inputs, frequency: val })}
              onUnitChange={(u) => setInputs({ ...inputs, frequencyUnit: u })}
              step={100}
              min={1}
              max={1000000}
              helpText="AC signal frequency (typical 50 Hz - 10 kHz)"
              error={errors.frequency}
            />

            {/* Diode Model */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                Diode Configuration
              </label>
              <div className="px-3 py-2 rounded-[3px] border border-white/10 bg-[#111520] text-xs font-mono text-[#00F0FF] flex items-center justify-between">
                <span>Superdiode (Feedback Compensated)</span>
                <span className="text-[10px] text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded-[2px] border border-[#00F0FF]/30">
                  Vγ / Aol ≈ 7 µV
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                The 0.7 V diode drop is divided by op-amp open loop gain Aol
              </p>
            </div>

            {/* Quick Academic Presets */}
            <div className="pt-2 border-t border-white/10">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                Demonstration Signals:
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={applyPresetSmallSignal}
                  className="px-2 py-1 text-[11px] font-mono rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-slate-300 hover:text-[#00F0FF] border border-white/10 hover:border-[#00F0FF] transition-all cursor-pointer"
                  title="100 mV peak (unrectifiable by conventional passive diode)"
                >
                  100 mV (Small)
                </button>
                <button
                  type="button"
                  onClick={applyPreset1V}
                  className="px-2 py-1 text-[11px] font-mono rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-slate-300 hover:text-[#00F0FF] border border-white/10 hover:border-[#00F0FF] transition-all cursor-pointer"
                  title="1 V peak"
                >
                  1 V (Medium)
                </button>
                <button
                  type="button"
                  onClick={applyPreset5V}
                  className="px-2 py-1 text-[11px] font-mono rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-slate-300 hover:text-[#00F0FF] border border-white/10 hover:border-[#00F0FF] transition-all cursor-pointer"
                  title="5 V peak"
                >
                  5 V (Large)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Oscilloscope Waveform & Circuit Schematic */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* View Mode Toggle Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#00F0FF]" />
              <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                Simulation Visualizer
              </span>
            </div>
            <div className="flex items-center gap-1 bg-[#0B0F19] p-1 rounded-[3px] border border-white/10 text-xs font-mono">
              <button
                type="button"
                onClick={() => setViewMode('graph')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] transition-all cursor-pointer ${
                  viewMode === 'graph'
                    ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_10px_rgba(0,240,255,0.35)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Dual-Trace Waveform</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('schematic')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] transition-all cursor-pointer ${
                  viewMode === 'schematic'
                    ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_10px_rgba(0,240,255,0.35)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Schematic</span>
              </button>
            </div>
          </div>

          {/* Active View Stage */}
          <div className="flex-1 flex flex-col min-h-[360px]">
            {viewMode === 'graph' && (
              <UniversalWaveformScope
                simulation={simulateRectifierWaveform({
                  waveform: 'sine',
                  vinPeak: results.vinBase,
                  frequency: results.freqBase,
                  posVsat: 15,
                  negVsat: -15,
                })}
                title="PRECISION HALF-WAVE RECTIFIER (SUPERDIODE) WAVEFORM"
                subtitle={`Vin = ${cleanFloat(results.vinBase, 2)} Vpk | Frequency = ${formatFrequency(results.freqBase)}`}
                insight="The op-amp open-loop gain drives the diode into conduction immediately when Vin > 0, virtually eliminating the 0.7V silicon diode knee voltage. During the negative half-cycle (Vin < 0), the diode turns off and output is clamped to 0.00 V."
              />
            )}

            {viewMode === 'schematic' && (
              <PrecisionRectifierSchematicSvg
                vin={inputs.vin}
                vinUnit={inputs.vinUnit}
                frequency={inputs.frequency}
                frequencyUnit={inputs.frequencyUnit}
              />
            )}
          </div>
        </div>
      </div>

      {/* 3. KEY CALCULATION RESULTS PANEL */}
      <div className="p-4 sm:p-5 rounded-[4px] border border-white/10 bg-[#1A1E29] shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00F0FF]" />
            <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              Rectifier Performance Metrics
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#00F0FF] flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Superdiode Simulation Active</span>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ResultCard
            label="Positive Peak Output"
            symbol="Vout (pk+)"
            value={`+${cleanFloat(results.voutPosPeak, 3)}`}
            unit="V"
            formula="Vout = Vin (for Vin > 0)"
            accentColor="emerald"
            highlight={true}
            subtext="Diode D1 forward conducting"
          />
          <ResultCard
            label="Negative Clamped Output"
            symbol="Vout (pk-)"
            value="0.00"
            unit="V"
            formula="Vout = 0 (for Vin ≤ 0)"
            accentColor="slate"
            subtext="Diode D1 reverse blocking"
          />
          <ResultCard
            label="Knee Threshold Drop"
            symbol="Vγ,eff"
            value="~7"
            unit="µV"
            formula="Vγ / Aol"
            accentColor="cyan"
            highlight={true}
            subtext="Compensated by open-loop gain"
          />
          <ResultCard
            label="Conduction Angle"
            symbol="θcond"
            value="180"
            unit="°"
            formula="Half-Wave (50% Duty)"
            accentColor="amber"
            subtext="Half-period conduction"
          />
        </div>
      </div>

      {/* 4. STEP-BY-STEP MATHEMATICAL DERIVATION */}
      <div className="p-4 sm:p-5 rounded-[4px] border border-white/10 bg-[#1A1E29] shadow-lg space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
          <Calculator className="w-4 h-4 text-[#00F0FF]" />
          <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            Operational Derivation & Superdiode Principle
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          {/* Positive Half-Cycle Analysis */}
          <div className="p-3.5 rounded-[3px] border border-white/10 bg-[#111520] space-y-2 shadow-sm">
            <span className="text-[10px] text-[#00F0FF] font-bold uppercase tracking-wider block">
              1. Positive Half-Cycle (Vin &gt; 0)
            </span>
            <div className="text-slate-300 font-semibold font-mono">{results.steps.posCycleFormula}</div>
            <p className="text-slate-400 leading-relaxed font-sans text-xs">
              When <code className="text-[#00F0FF] font-mono">Vin &gt; 0</code>, the op-amp output voltage rises positive to <code className="text-emerald-400 font-mono">Vin + 0.7V</code>, forward biasing diode D1. This closes the negative feedback loop to the inverting input (<code className="text-slate-200 font-mono">V- = Vout</code>), enforcing the virtual short condition: <code className="text-[#00F0FF] font-bold font-mono">Vout = Vin</code>.
            </p>
          </div>

          {/* Negative Half-Cycle Analysis */}
          <div className="p-3.5 rounded-[3px] border border-white/10 bg-[#111520] space-y-2 shadow-sm">
            <span className="text-[10px] text-[#FF5722] font-bold uppercase tracking-wider block">
              2. Negative Half-Cycle (Vin &le; 0)
            </span>
            <div className="text-slate-300 font-semibold font-mono">{results.steps.negCycleFormula}</div>
            <p className="text-slate-400 leading-relaxed font-sans text-xs">
              When <code className="text-[#00F0FF] font-mono">Vin &lt; 0</code>, the op-amp output is driven towards negative saturation (<code className="text-[#FF5722] font-mono">-Vsat</code>). Diode D1 becomes strongly reverse-biased and stops conducting. The feedback path opens, and the output is pulled down to zero via load resistor RL: <code className="text-emerald-400 font-bold font-mono">Vout = 0.00 V</code>.
            </p>
          </div>

          {/* Virtual Knee Voltage Elimination */}
          <div className="p-3.5 rounded-[3px] border border-white/10 bg-[#111520] space-y-2 shadow-sm">
            <span className="text-[10px] text-[#00F0FF] font-bold uppercase tracking-wider block">
              3. Elimination of Diode Threshold Barrier
            </span>
            <div className="text-[#00F0FF] font-semibold font-mono">Vγ,eff = VD / Aol ≈ 0.7 V / 10⁵ ≈ 7 µV</div>
            <p className="text-slate-400 leading-relaxed font-sans text-xs">
              In a standard passive diode rectifier, signals below <code className="text-amber-400 font-mono">0.7 V</code> cannot turn on the silicon p-n junction, causing complete loss of millivolt signals. The op-amp divides this barrier by its massive open-loop gain (<code className="text-[#00F0FF] font-mono">Aol ~ 100,000</code>), making the threshold barrier virtually invisible.
            </p>
          </div>
        </div>
      </div>

      {/* 5. THEORY & CIRCUIT FUNDAMENTALS (Infographic Modular Tiles) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[#00F0FF]" />
            <h2 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
              Circuit Theory & Superdiode Fundamentals
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Nonlinear Feedback Compensation</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TheoryTile
            badge="Superdiode Axiom"
            title="Loop Knee Voltage Reduction"
            formula="Vγ(eff) = Vγ / Aol ≈ 0.7 V / 10⁵ ≈ 7 μV"
            accentColor="cyan"
            description="By embedding the non-linear p-n junction inside the global negative feedback loop, any voltage drop across the diode is counteracted by op-amp open-loop gain, synthesising a textbook ideal diode."
            bullets={[
              "Zero forward drop (Vγ ≈ 0 V) for signals as small as 1 mV",
              "Virtually instantaneous conduction transition at Vin = 0.00 V",
              "100% transmission fidelity during positive alternation"
            ]}
          />

          <TheoryTile
            badge="Transient Speed"
            title="Slew Rate & Saturation Recovery"
            formula="t_recovery = |-Vsat - Vγ| / Slew Rate"
            accentColor="orange"
            description="During negative half-cycles when the feedback loop breaks open, the op-amp output saturates at negative rail -Vsat. When the input swings positive again, the amplifier must slew from -Vsat to +0.7V before conduction resumes."
            bullets={[
              "Basic superdiode is slew-rate and saturation recovery limited",
              "High-speed precision rectifiers add clamping diode D2 to prevent rail-out",
              "Best suited for instrumentation signals below 20 kHz"
            ]}
          />

          <TheoryTile
            badge="Instrumentation"
            title="Precision AC to DC Processing"
            formula="Vdc = Vpeak / π ≈ 0.318 · Vpeak"
            accentColor="slate"
            description="Precision rectifiers form the essential front-end for true-RMS converters, AC digital voltmeters, bio-potential peak detectors (ECG R-wave detectors), and RF audio envelope demodulators."
            specs={{
              "Sensitivity": "Accurately rectifies signals down to 1 mV",
              "Output Impedance": "Low output impedance during positive conduction",
              "Negative Half-Cycle": "Output pulled to ground via load resistor RL",
              "Peak Detector Upgrade": "Add parallel capacitor across RL"
            }}
          />
        </div>
      </div>
    </div>
  );
};
