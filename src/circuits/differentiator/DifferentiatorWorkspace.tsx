import React, { useState, useEffect } from 'react';
import { DifferentiatorInputs, DifferentiatorResults, WaveformType } from '../../types/circuit';
import { calculateDifferentiator, validateDifferentiatorInputs } from '../../calculations/differentiator';
import { generateDifferentiatorWaveform, WaveformData } from '../../utils/waveformGenerator';
import { InputNumber } from '../../components/ui/InputNumber';
import { ResultCard } from '../../components/ui/ResultCard';
import { TheoryTile } from '../../components/ui/TheoryTile';
import { DifferentiatorSchematicSvg } from '../../components/circuit/DifferentiatorSchematicSvg';
import { UniversalWaveformScope } from '../../components/circuit/UniversalWaveformScope';
import { simulateCalculusWaveform } from '../../utils/waveformEngine';
import { cleanFloat, formatResistance, formatCapacitance, formatFrequency, formatTimeSeconds } from '../../utils/formatters';
import { saveActiveCircuitState } from '../../utils/circuitStateBridge';
import { RotateCcw, Calculator, Zap, Eye, Activity, CheckCircle, Lightbulb } from 'lucide-react';

interface DifferentiatorWorkspaceProps {
  onStatusChange?: (status: 'Ready' | 'Calculated' | 'Error', hasErrors: boolean) => void;
}

const DEFAULT_INPUTS: DifferentiatorInputs = {
  vin: 1,
  vinUnit: 'V',
  frequency: 1000,
  frequencyUnit: 'Hz',
  c: 0.01,
  cUnit: 'µF',
  r: 10,
  rUnit: 'kΩ',
  waveform: 'triangle',
};

export const DifferentiatorWorkspace: React.FC<DifferentiatorWorkspaceProps> = ({
  onStatusChange,
}) => {
  const [inputs, setInputs] = useState<DifferentiatorInputs>(DEFAULT_INPUTS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [results, setResults] = useState<DifferentiatorResults>(() =>
    calculateDifferentiator(DEFAULT_INPUTS)
  );
  const [viewMode, setViewMode] = useState<'graph' | 'schematic'>('graph');

  // Synchronize state with central bridge for Lab Mode and Exports
  useEffect(() => {
    saveActiveCircuitState('differentiator', inputs, results);
  }, [inputs, results]);

  // Compute waveform data dynamically from current results
  const waveformData: WaveformData = generateDifferentiatorWaveform(
    inputs.waveform,
    results.vinBase,
    results.freqBase,
    results.rcTimeConstant
  );

  const handleCalculate = () => {
    const validationErrors = validateDifferentiatorInputs(inputs);

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
    const res = calculateDifferentiator(inputs);
    setResults(res);
    onStatusChange?.('Calculated', false);
  };

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    setErrors({});
    const res = calculateDifferentiator(DEFAULT_INPUTS);
    setResults(res);
    onStatusChange?.('Ready', false);
  };

  const setWaveform = (wf: WaveformType) => {
    const updated = { ...inputs, waveform: wf };
    setInputs(updated);
    const res = calculateDifferentiator(updated);
    setResults(res);
  };

  const applyPresetTest3 = () => {
    const p: DifferentiatorInputs = {
      vin: 1,
      vinUnit: 'V',
      frequency: 1000,
      frequencyUnit: 'Hz',
      c: 0.01,
      cUnit: 'µF',
      r: 10,
      rUnit: 'kΩ',
      waveform: 'triangle',
    };
    setInputs(p);
    setErrors({});
    setResults(calculateDifferentiator(p));
    onStatusChange?.('Calculated', false);
  };

  const applyPresetTest4 = () => {
    const p: DifferentiatorInputs = {
      vin: 1,
      vinUnit: 'V',
      frequency: 1000,
      frequencyUnit: 'Hz',
      c: 0.01,
      cUnit: 'µF',
      r: 10,
      rUnit: 'kΩ',
      waveform: 'square',
    };
    setInputs(p);
    setErrors({});
    setResults(calculateDifferentiator(p));
    onStatusChange?.('Calculated', false);
  };

  const applyPresetSine = () => {
    const p: DifferentiatorInputs = {
      vin: 1,
      vinUnit: 'V',
      frequency: 1000,
      frequencyUnit: 'Hz',
      c: 0.01,
      cUnit: 'µF',
      r: 10,
      rUnit: 'kΩ',
      waveform: 'sine',
    };
    setInputs(p);
    setErrors({});
    setResults(calculateDifferentiator(p));
    onStatusChange?.('Calculated', false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* 1. Header & Subtitle */}
      <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold font-mono text-white tracking-tight">
              Practical Differentiator
            </h1>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/30 px-2 py-0.5 rounded-[3px]">
              Active Simulation
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-sans">
            Analyze rate-of-change amplification and time-derivative dynamics of an op-amp circuit.
          </p>
        </div>

        {/* Quick Presets matching Lab Test Cases */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mr-1">Lab Presets:</span>
          <button
            onClick={applyPresetTest3}
            className="text-[11px] font-mono px-2.5 py-1 rounded-[3px] bg-[#111520] border border-white/10 text-slate-300 hover:border-[#00F0FF] hover:text-[#00F0FF] transition-all cursor-pointer"
          >
            Triangle In → Square Out (Test 3)
          </button>
          <button
            onClick={applyPresetTest4}
            className="text-[11px] font-mono px-2.5 py-1 rounded-[3px] bg-[#111520] border border-white/10 text-slate-300 hover:border-[#00F0FF] hover:text-[#00F0FF] transition-all cursor-pointer"
          >
            Square In → Impulse Spikes (Test 4)
          </button>
          <button
            onClick={applyPresetSine}
            className="text-[11px] font-mono px-2.5 py-1 rounded-[3px] bg-[#111520] border border-white/10 text-slate-300 hover:border-[#00F0FF] hover:text-[#00F0FF] transition-all cursor-pointer"
          >
            Sine In → Cosine Out
          </button>
        </div>
      </div>

      {/* 2. Main Workspace Split: Parameters | Circuit Diagram & Waveforms */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Input Parameters */}
        <div className="lg:col-span-5 rounded-[4px] border border-white/10 bg-[#1A1E29] p-4 sm:p-5 space-y-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#00F0FF]" />
              <h2 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
                Input Parameters
              </h2>
            </div>
            <span className="text-[11px] font-mono text-[#00F0FF] bg-[#111520] px-2 py-0.5 rounded-[2px] border border-white/5">
              f = {formatFrequency(results.freqBase)}
            </span>
          </div>

          <div className="space-y-4">
            {/* Waveform Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Input Waveform Type</span>
                <span className="text-[11px] font-mono text-[#00F0FF] font-semibold uppercase">
                  {inputs.waveform}
                </span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-[3px] bg-[#0B0F19] border border-white/10 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setWaveform('triangle')}
                  className={`py-1.5 px-2 rounded-[2px] transition-all cursor-pointer ${
                    inputs.waveform === 'triangle'
                      ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_10px_rgba(0,240,255,0.35)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Triangle
                </button>
                <button
                  type="button"
                  onClick={() => setWaveform('square')}
                  className={`py-1.5 px-2 rounded-[2px] transition-all cursor-pointer ${
                    inputs.waveform === 'square'
                      ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_10px_rgba(0,240,255,0.35)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Square
                </button>
                <button
                  type="button"
                  onClick={() => setWaveform('sine')}
                  className={`py-1.5 px-2 rounded-[2px] transition-all cursor-pointer ${
                    inputs.waveform === 'sine'
                      ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_10px_rgba(0,240,255,0.35)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sine
                </button>
              </div>
            </div>

            {/* Input Voltage Amplitude */}
            <InputNumber
              id="vin-diff"
              symbol="Vin"
              label="Input Amplitude"
              value={inputs.vin}
              unit={inputs.vinUnit}
              unitOptions={['V', 'mV']}
              onValueChange={(val) => setInputs((prev) => ({ ...prev, vin: val }))}
              onUnitChange={(u) => setInputs((prev) => ({ ...prev, vinUnit: u }))}
              error={errors.vin}
              hint="Peak amplitude"
            />

            {/* Frequency */}
            <InputNumber
              id="freq-diff"
              symbol="f"
              label="Signal Frequency"
              value={inputs.frequency}
              unit={inputs.frequencyUnit}
              unitOptions={['Hz', 'kHz']}
              onValueChange={(val) => setInputs((prev) => ({ ...prev, frequency: val }))}
              onUnitChange={(u) => setInputs((prev) => ({ ...prev, frequencyUnit: u }))}
              error={errors.frequency}
              hint="Operating frequency"
            />

            {/* Input Capacitance C */}
            <InputNumber
              id="c-diff"
              symbol="C"
              label="Input Capacitance"
              value={inputs.c}
              unit={inputs.cUnit}
              unitOptions={['µF', 'nF', 'pF']}
              onValueChange={(val) => setInputs((prev) => ({ ...prev, c: val }))}
              onUnitChange={(u) => setInputs((prev) => ({ ...prev, cUnit: u }))}
              error={errors.c}
              hint="Series input capacitor"
            />

            {/* Feedback Resistance R */}
            <InputNumber
              id="r-diff"
              symbol="R"
              label="Feedback Resistance"
              value={inputs.r}
              unit={inputs.rUnit}
              unitOptions={['Ω', 'kΩ', 'MΩ']}
              onValueChange={(val) => setInputs((prev) => ({ ...prev, r: val }))}
              onUnitChange={(u) => setInputs((prev) => ({ ...prev, rUnit: u }))}
              error={errors.r}
              hint="Feedback resistor"
            />
          </div>

          {/* Action Buttons: Calculate & Reset */}
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleCalculate}
              className="flex-1 h-9 px-4 rounded-[3px] bg-[#00F0FF] hover:bg-[#38bdf8] text-[#0B0F19] font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_14px_rgba(0,240,255,0.35)] transition-all cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Calculate</span>
            </button>

            <button
              onClick={handleReset}
              className="h-9 px-4 rounded-[3px] bg-[#0B0F19] hover:bg-[#111520] border border-white/10 text-slate-300 font-mono font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          </div>

          {/* Error Summary Banner */}
          {Object.keys(errors).length > 0 && (
            <div className="p-3 rounded-[3px] bg-[#FF5722]/10 border border-[#FF5722]/40 text-[#FF5722] text-xs font-mono space-y-1">
              <span className="font-semibold block text-white">Simulation Halt:</span>
              {Object.values(errors).map((err, idx) => (
                <p key={idx} className="text-[11px] leading-tight">• {err}</p>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Waveform Simulation & Circuit Diagram */}
        <div className="lg:col-span-7 rounded-[4px] border border-white/10 bg-[#1A1E29] p-4 sm:p-5 space-y-4 shadow-lg">
          <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-3 gap-2">
            <div>
              <h2 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
                Rate-of-Change Differentiation & Schematic
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                Real numerical differentiation d(Vin)/dt of {inputs.waveform} waveform.
              </p>
            </div>

            {/* Toggle View: Waveform Graph vs Schematic */}
            <div className="flex items-center rounded-[3px] bg-[#0B0F19] p-1 border border-white/10 text-xs font-mono">
              <button
                onClick={() => setViewMode('graph')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] transition-all cursor-pointer ${
                  viewMode === 'graph'
                    ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_10px_rgba(0,240,255,0.35)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Time-Domain Waveform</span>
              </button>

              <button
                onClick={() => setViewMode('schematic')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] transition-all cursor-pointer ${
                  viewMode === 'schematic'
                    ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_10px_rgba(0,240,255,0.35)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Schematic</span>
              </button>
            </div>
          </div>

          {/* Visualization Canvas */}
          {viewMode === 'graph' ? (
            <UniversalWaveformScope
              simulation={simulateCalculusWaveform({
                mode: 'differentiator',
                waveform: inputs.waveform,
                vinPeak: results.vinBase,
                frequency: results.freqBase,
                rc: results.rcTimeConstant,
                posVsat: 15,
                negVsat: -15,
              })}
              title="PRACTICAL DIFFERENTIATOR WAVEFORM SIMULATION"
              subtitle={`Differentiation: Vout = -RC dVin/dt | τ = RC = ${formatTimeSeconds(results.rcTimeConstant)}`}
              insight="The practical differentiator computes the time derivative of the input with a 90° phase lead. Sinusoids differentiate into negative cosines, triangular waveforms differentiate into square waves, and fast edges produce transition impulses."
            />
          ) : (
            <DifferentiatorSchematicSvg
              vin={inputs.vin}
              vinUnit={inputs.vinUnit}
              cBase={results.cBase}
              rBase={results.rBase}
              gain={results.gain}
            />
          )}
        </div>
      </div>

      {/* 3. RESULTS PANEL */}
      <div className="rounded-[4px] border border-white/10 bg-[#1A1E29] p-4 sm:p-5 space-y-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#00F0FF]" />
            <h2 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
              Differentiator Results & Analytical Solutions
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Derivative Calculus Parameters
          </span>
        </div>

        {/* Primary Metric Result Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ResultCard
            label="RC Time Constant"
            symbol="RC"
            value={cleanFloat(results.rcTimeConstant, 5)}
            unit="s"
            formula="RC = R × C"
            subtext={`${formatResistance(results.rBase)} × ${formatCapacitance(results.cBase)}`}
            accentColor="cyan"
          />

          <ResultCard
            label="Differentiator Gain"
            symbol="Gain"
            value={cleanFloat(results.gain, 3)}
            unit=""
            formula="Gain = 2πfRC"
            subtext={`Magnitude at f = ${formatFrequency(results.freqBase)}`}
            accentColor="amber"
            highlight={true}
          />

          <ResultCard
            label="Input Voltage"
            symbol="Vin"
            value={cleanFloat(results.vinBase)}
            unit="V"
            formula="Vin (Peak)"
            subtext={`${inputs.waveform.toUpperCase()} input signal`}
            accentColor="emerald"
          />

          <ResultCard
            label="Frequency"
            symbol="f"
            value={cleanFloat(results.freqBase)}
            unit="Hz"
            formula="f = 1 / T"
            subtext={`Period T = ${formatTimeSeconds(1 / results.freqBase)}`}
            accentColor="slate"
          />
        </div>

        {/* Step-by-Step Calculation Steps */}
        <div className="rounded-[3px] border border-white/10 bg-[#111520] p-4 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/10">
            <span className="font-bold text-slate-200 tracking-wider uppercase text-[11px]">Step-by-Step Calculation Proof</span>
            <span className="text-[11px] text-[#00F0FF]">SI Standard Substitution</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: RC */}
            <div className="p-3.5 rounded-[3px] bg-[#1A1E29] border border-white/10 space-y-1.5 shadow-sm">
              <span className="text-[#00F0FF] text-[10px] font-mono uppercase tracking-wider block font-bold">Step 1: Calculate RC Time Constant</span>
              <div className="text-slate-300 font-mono text-xs">{results.steps.rcFormula}</div>
              <div className="text-slate-400 font-mono text-[11px]">{results.steps.rcSubstitution}</div>
              <div className="text-[#00F0FF] font-bold text-sm pt-1.5 border-t border-white/10 font-mono">
                {results.steps.rcResult}
              </div>
            </div>

            {/* Step 2: Gain */}
            <div className="p-3.5 rounded-[3px] bg-[#1A1E29] border border-white/10 space-y-1.5 shadow-sm">
              <span className="text-[#FF5722] text-[10px] font-mono uppercase tracking-wider block font-bold">Step 2: Calculate Sinusoidal Gain Magnitude</span>
              <div className="text-slate-300 font-mono text-xs">{results.steps.gainFormula}</div>
              <div className="text-slate-400 font-mono text-[11px]">{results.steps.gainSubstitution}</div>
              <div className="text-[#FF5722] font-bold text-sm pt-1.5 border-t border-white/10 font-mono">
                {results.steps.gainResult}
              </div>
            </div>
          </div>

          {/* Expected Output Waveform Explanation */}
          <div className="p-3 rounded-[3px] bg-[#1A1E29] border border-white/10 flex items-start gap-3">
            <div className="text-[#00F0FF] font-mono font-bold text-xs uppercase shrink-0 pt-0.5">
              Expected Output Waveform:
            </div>
            <div className="text-slate-200 text-xs font-sans">
              <span className="font-mono font-bold text-[#FF5722]">{results.expectedOutputWaveform}.</span>{' '}
              <span className="text-slate-400">{results.steps.outputExplanation}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. THEORY & CIRCUIT FUNDAMENTALS (Infographic Modular Tiles) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[#00F0FF]" />
            <h2 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
              Circuit Theory & Calculus Fundamentals
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">High-Pass Differentiation Dynamics</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TheoryTile
            badge="Governing Law"
            title="Time-Derivative Operator"
            formula="Vout(t) = -RC · (dVin / dt)"
            accentColor="cyan"
            description="The input capacitor feeds current proportional to the slew rate dvin/dt of the input signal directly into the virtual ground summing junction. Ohm's law across Rf converts this displacement current into an inverted voltage."
            bullets={[
              "Capacitor displacement current: i_c = C (dv_in / dt)",
              "Virtual ground Ohm's law: v_out = -i_c × R",
              "180° inversion with +90° phase lead in the frequency domain"
            ]}
          />

          <TheoryTile
            badge="Waveform Dynamics"
            title="Rate-of-Change Morphing"
            formula="d/dt [A·sin(ωt)] = ωA·cos(ωt)  (-90° lag)"
            accentColor="orange"
            description="A differentiator highlights instantaneous slope changes: constant slopes produce step DC plateaus; abrupt transitions produce narrow impulse spikes."
            bullets={[
              "Triangle Wave (Linear Slopes) → Bipolar Square Wave Output",
              "Sine Wave Input → Inverted Cosine Wave with 90° Phase Advance",
              "Square Wave Input → Sharp Bidirectional Spike Impulses"
            ]}
          />

          <TheoryTile
            badge="Noise & Stability"
            title="High-Frequency Gain Spike & Practical Damping"
            formula="|Av(f)| = 2π · f · R · C  (+20 dB/dec noise)"
            accentColor="slate"
            description="Ideal differentiators exhibit linearly increasing gain with frequency (+20 dB/dec), rendering them extremely vulnerable to high-frequency noise and parasitic oscillation. Practical circuits add a series resistor Rs to cap HF gain."
            specs={{
              "Gain Slope": "+20 dB/decade until cutoff",
              "Series Resistor Rs": "Caps maximum closed-loop gain at Rf/Rs",
              "Parallel Capacitor Cf": "Adds high-frequency roll-off pole",
              "Stability Margin": "Prevents op-amp phase margin degradation"
            }}
          />
        </div>
      </div>
    </div>
  );
};
