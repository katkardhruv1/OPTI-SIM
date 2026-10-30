import React, { useState, useEffect } from 'react';
import { IntegratorInputs, IntegratorResults, WaveformType } from '../../types/circuit';
import { calculateIntegrator, validateIntegratorInputs } from '../../calculations/integrator';
import { generateIntegratorWaveform, WaveformData } from '../../utils/waveformGenerator';
import { InputNumber } from '../../components/ui/InputNumber';
import { ResultCard } from '../../components/ui/ResultCard';
import { TheoryTile } from '../../components/ui/TheoryTile';
import { IntegratorSchematicSvg } from '../../components/circuit/IntegratorSchematicSvg';
import { UniversalWaveformScope } from '../../components/circuit/UniversalWaveformScope';
import { simulateCalculusWaveform } from '../../utils/waveformEngine';
import { cleanFloat, formatResistance, formatCapacitance, formatFrequency, formatTimeSeconds } from '../../utils/formatters';
import { saveActiveCircuitState } from '../../utils/circuitStateBridge';
import { RotateCcw, Calculator, Zap, Eye, Activity, CheckCircle, Lightbulb } from 'lucide-react';

interface IntegratorWorkspaceProps {
  onStatusChange?: (status: 'Ready' | 'Calculated' | 'Error', hasErrors: boolean) => void;
}

const DEFAULT_INPUTS: IntegratorInputs = {
  vin: 1,
  vinUnit: 'V',
  frequency: 1000,
  frequencyUnit: 'Hz',
  r: 10,
  rUnit: 'kΩ',
  c: 0.01,
  cUnit: 'µF',
  waveform: 'square',
};

export const IntegratorWorkspace: React.FC<IntegratorWorkspaceProps> = ({
  onStatusChange,
}) => {
  const [inputs, setInputs] = useState<IntegratorInputs>(DEFAULT_INPUTS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [results, setResults] = useState<IntegratorResults>(() =>
    calculateIntegrator(DEFAULT_INPUTS)
  );
  const [viewMode, setViewMode] = useState<'graph' | 'schematic'>('graph');

  // Synchronize state with central bridge for Lab Mode and Exports
  useEffect(() => {
    saveActiveCircuitState('integrator', inputs, results);
  }, [inputs, results]);

  // Compute waveform data dynamically from current results
  const waveformData: WaveformData = generateIntegratorWaveform(
    inputs.waveform,
    results.vinBase,
    results.freqBase,
    results.rcTimeConstant
  );

  const handleCalculate = () => {
    const validationErrors = validateIntegratorInputs(inputs);

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
    const res = calculateIntegrator(inputs);
    setResults(res);
    onStatusChange?.('Calculated', false);
  };

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    setErrors({});
    const res = calculateIntegrator(DEFAULT_INPUTS);
    setResults(res);
    onStatusChange?.('Ready', false);
  };

  const setWaveform = (wf: WaveformType) => {
    const updated = { ...inputs, waveform: wf };
    setInputs(updated);
    const res = calculateIntegrator(updated);
    setResults(res);
  };

  const applyPresetTest1 = () => {
    const p: IntegratorInputs = {
      vin: 1,
      vinUnit: 'V',
      frequency: 1000,
      frequencyUnit: 'Hz',
      r: 10,
      rUnit: 'kΩ',
      c: 0.01,
      cUnit: 'µF',
      waveform: 'square',
    };
    setInputs(p);
    setErrors({});
    setResults(calculateIntegrator(p));
    onStatusChange?.('Calculated', false);
  };

  const applyPresetTest2 = () => {
    const p: IntegratorInputs = {
      vin: 1,
      vinUnit: 'V',
      frequency: 1000,
      frequencyUnit: 'Hz',
      r: 10,
      rUnit: 'kΩ',
      c: 0.01,
      cUnit: 'µF',
      waveform: 'sine',
    };
    setInputs(p);
    setErrors({});
    setResults(calculateIntegrator(p));
    onStatusChange?.('Calculated', false);
  };

  const applyPresetTriangle = () => {
    const p: IntegratorInputs = {
      vin: 1,
      vinUnit: 'V',
      frequency: 1000,
      frequencyUnit: 'Hz',
      r: 10,
      rUnit: 'kΩ',
      c: 0.01,
      cUnit: 'µF',
      waveform: 'triangle',
    };
    setInputs(p);
    setErrors({});
    setResults(calculateIntegrator(p));
    onStatusChange?.('Calculated', false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* 1. Header & Subtitle */}
      <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold font-mono text-white tracking-tight">
              Practical Integrator
            </h1>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/30 px-2 py-0.5 rounded-[3px]">
              Active Simulation
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-sans">
            Analyze mathematical integration dynamics and transient response of an op-amp circuit.
          </p>
        </div>

        {/* Quick Presets matching Lab Test Cases */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mr-1">Lab Presets:</span>
          <button
            onClick={applyPresetTest1}
            className="text-[11px] font-mono px-2.5 py-1 rounded-[3px] bg-[#111520] border border-white/10 text-slate-300 hover:border-[#00F0FF] hover:text-[#00F0FF] transition-all cursor-pointer"
          >
            Square In → Triangle Out (Test 1)
          </button>
          <button
            onClick={applyPresetTest2}
            className="text-[11px] font-mono px-2.5 py-1 rounded-[3px] bg-[#111520] border border-white/10 text-slate-300 hover:border-[#00F0FF] hover:text-[#00F0FF] transition-all cursor-pointer"
          >
            Sine In → Cosine Out (Test 2)
          </button>
          <button
            onClick={applyPresetTriangle}
            className="text-[11px] font-mono px-2.5 py-1 rounded-[3px] bg-[#111520] border border-white/10 text-slate-300 hover:border-[#00F0FF] hover:text-[#00F0FF] transition-all cursor-pointer"
          >
            Triangle In → Parabolic
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
              </div>
            </div>

            {/* Input Voltage Amplitude */}
            <InputNumber
              id="vin-int"
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
              id="freq-int"
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

            {/* Input Resistance R */}
            <InputNumber
              id="r-int"
              symbol="R"
              label="Input Resistance"
              value={inputs.r}
              unit={inputs.rUnit}
              unitOptions={['Ω', 'kΩ', 'MΩ']}
              onValueChange={(val) => setInputs((prev) => ({ ...prev, r: val }))}
              onUnitChange={(u) => setInputs((prev) => ({ ...prev, rUnit: u }))}
              error={errors.r}
              hint="Input series resistor"
            />

            {/* Feedback Capacitance C */}
            <InputNumber
              id="c-int"
              symbol="C"
              label="Feedback Capacitance"
              value={inputs.c}
              unit={inputs.cUnit}
              unitOptions={['µF', 'nF', 'pF']}
              onValueChange={(val) => setInputs((prev) => ({ ...prev, c: val }))}
              onUnitChange={(u) => setInputs((prev) => ({ ...prev, cUnit: u }))}
              error={errors.c}
              hint="Feedback capacitor"
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
                Time-Domain Integration & Schematic
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                Real numerical mathematical integration of {inputs.waveform} waveform.
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
                mode: 'integrator',
                waveform: inputs.waveform,
                vinPeak: results.vinBase,
                frequency: results.freqBase,
                rc: results.rcTimeConstant,
                posVsat: 15,
                negVsat: -15,
              })}
              title="PRACTICAL INTEGRATOR WAVEFORM SIMULATION"
              subtitle={`Integration: Vout = -1/RC ∫ Vin dt | τ = RC = ${formatTimeSeconds(results.rcTimeConstant)}`}
              insight="The practical integrator integrates the input waveform over time with a 90° phase lag. Sine input integrates into a cosine, square wave integrates into a triangular ramp, and triangular input produces smooth parabolic integration."
            />
          ) : (
            <IntegratorSchematicSvg
              vin={inputs.vin}
              vinUnit={inputs.vinUnit}
              rBase={results.rBase}
              cBase={results.cBase}
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
              Integrator Results & Analytical Solutions
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Calculus Integration Parameters
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
            label="Integrator Gain"
            symbol="Gain"
            value={cleanFloat(results.gain, 3)}
            unit=""
            formula="Gain = 1 / (2πfRC)"
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
          <span className="text-[11px] font-mono text-slate-400">Time-Domain Op-Amp Dynamics</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TheoryTile
            badge="Governing Law"
            title="Continuous Integration Operator"
            formula="Vout(t) = -(1/RC) ∫₀ᵗ Vin(τ) dτ + Vout(0)"
            accentColor="cyan"
            description="The feedback capacitor charges via the virtual ground summing junction. Because no current enters the inverting terminal, capacitor current equals input current: ic = vin/R = -C(dvout/dt)."
            bullets={[
              "Current relation: i_in = v_in / R",
              "Feedback capacitor current: i_c = -C (dv_out / dt)",
              "Inverting topology enforces a 180° polarity inversion on integral output"
            ]}
          />

          <TheoryTile
            badge="Waveform Dynamics"
            title="Calculus Waveform Morphing"
            formula="∫ A·sin(ωt) dt = -(A/ω)·cos(ωt) (+90° lead)"
            accentColor="orange"
            description="Integration acts as an accumulator: constant DC voltage integrates into a linear slope; alternating square waves integrate into linear triangle waves."
            bullets={[
              "Square Wave Input → Continuous Linear Triangle Ramp",
              "Sine Wave Input → Inverted Cosine with 90° Phase Lag",
              "Triangle Wave Input → Smooth Piecewise Parabolic Waveform"
            ]}
          />

          <TheoryTile
            badge="Practical Limits"
            title="Frequency Domain & DC Saturation"
            formula="fc = 1 / (2π · Rf · C)  (Practical Shunt Cutoff)"
            accentColor="slate"
            description="An ideal integrator exhibits infinite DC open-loop gain, causing tiny input offset voltages to charge the capacitor until the op-amp rails at ±Vsat. A practical integrator places a high-value resistor Rf across C."
            specs={{
              "Integration Band": "f >> 1 / (2π Rf C)",
              "DC Closed-Loop Gain": "Rf / R (Finite Bound)",
              "Phase Response": "-90° at frequencies in integration band",
              "Slew Rate Floor": "Limited by op-amp maximum dV/dt"
            }}
          />
        </div>
      </div>
    </div>
  );
};
