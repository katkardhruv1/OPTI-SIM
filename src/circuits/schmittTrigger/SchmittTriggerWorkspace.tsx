import React, { useState, useEffect } from 'react';
import { SchmittTriggerInputs, SchmittTriggerResults, WaveformType } from '../../types/circuit';
import { calculateSchmittTrigger, validateSchmittTriggerInputs } from '../../calculations/schmittTrigger';
import { generateSchmittWaveform, WaveformData } from '../../utils/waveformGenerator';
import { InputNumber } from '../../components/ui/InputNumber';
import { ResultCard } from '../../components/ui/ResultCard';
import { TheoryTile } from '../../components/ui/TheoryTile';
import { SchmittTriggerSchematicSvg } from '../../components/circuit/SchmittTriggerSchematicSvg';
import { SchmittTransferGraph } from '../../components/circuit/SchmittTransferGraph';
import { CalculusWaveformGraph } from '../../components/circuit/CalculusWaveformGraph';
import { cleanFloat, formatResistance } from '../../utils/formatters';
import { saveActiveCircuitState } from '../../utils/circuitStateBridge';
import { RotateCcw, Calculator, Zap, Eye, Activity, CheckCircle, Lightbulb, BarChart2 } from 'lucide-react';

interface SchmittTriggerWorkspaceProps {
  onStatusChange?: (status: 'Ready' | 'Calculated' | 'Error', hasErrors: boolean) => void;
}

const DEFAULT_INPUTS: SchmittTriggerInputs = {
  vinAmplitude: 5,
  vinUnit: 'V',
  vrefCenter: 0,
  posVsat: 12,
  negVsat: -12,
  rf: 20,
  rfUnit: 'kΩ',
  r1: 10,
  r1Unit: 'kΩ',
  waveform: 'sine',
  frequency: 1000,
  frequencyUnit: 'Hz',
};

export const SchmittTriggerWorkspace: React.FC<SchmittTriggerWorkspaceProps> = ({
  onStatusChange,
}) => {
  const [inputs, setInputs] = useState<SchmittTriggerInputs>(DEFAULT_INPUTS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [results, setResults] = useState<SchmittTriggerResults>(() =>
    calculateSchmittTrigger(DEFAULT_INPUTS)
  );
  const [viewMode, setViewMode] = useState<'transfer' | 'waveform' | 'schematic'>('transfer');

  // Synchronize state with central bridge for Lab Mode and Exports
  useEffect(() => {
    saveActiveCircuitState('schmitt-trigger', inputs, results);
  }, [inputs, results]);

  // Compute Schmitt waveform with memory hysteresis
  const waveformData: WaveformData = generateSchmittWaveform(
    inputs.waveform,
    results.vinAmpBase,
    inputs.frequency,
    results.utp,
    results.ltp,
    results.posVsat,
    results.negVsat
  );

  const handleCalculate = () => {
    const validationErrors = validateSchmittTriggerInputs(inputs);

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
    const res = calculateSchmittTrigger(inputs);
    setResults(res);
    onStatusChange?.('Calculated', false);
  };

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    setErrors({});
    const res = calculateSchmittTrigger(DEFAULT_INPUTS);
    setResults(res);
    onStatusChange?.('Ready', false);
  };

  const setWaveform = (wf: WaveformType) => {
    const updated: SchmittTriggerInputs = { ...inputs, waveform: wf };
    setInputs(updated);
    const res = calculateSchmittTrigger(updated);
    setResults(res);
  };

  const applyDefaultTest = () => {
    setInputs(DEFAULT_INPUTS);
    setErrors({});
    setResults(calculateSchmittTrigger(DEFAULT_INPUTS));
    onStatusChange?.('Calculated', false);
  };

  const applyWideHysteresis = () => {
    // R1 = 20k, Rf = 20k => beta = 0.5 => UTP = +6V, LTP = -6V
    const p: SchmittTriggerInputs = {
      ...inputs,
      vinAmplitude: 8,
      r1: 20,
      r1Unit: 'kΩ',
      rf: 20,
      rfUnit: 'kΩ',
      posVsat: 12,
      negVsat: -12,
    };
    setInputs(p);
    setErrors({});
    setResults(calculateSchmittTrigger(p));
    onStatusChange?.('Calculated', false);
  };

  const applyNarrowHysteresis = () => {
    // R1 = 5k, Rf = 45k => beta = 0.1 => UTP = +1.2V, LTP = -1.2V
    const p: SchmittTriggerInputs = {
      ...inputs,
      vinAmplitude: 3,
      r1: 5,
      r1Unit: 'kΩ',
      rf: 45,
      rfUnit: 'kΩ',
      posVsat: 12,
      negVsat: -12,
    };
    setInputs(p);
    setErrors({});
    setResults(calculateSchmittTrigger(p));
    onStatusChange?.('Calculated', false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#0B0F19] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. MODULE TITLE & DESCRIPTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white">
              Schmitt Trigger
            </h1>
            <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-mono uppercase tracking-wider bg-[#FF5722]/15 text-[#FF5722] border border-[#FF5722]/30">
              Regenerative Comparator
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl font-sans">
            Analyze hysteresis memory and noise immunity using a regenerative comparator. Positive feedback creates separate Upper Trigger Point (<span className="text-[#00F0FF] font-mono">UTP</span>) and Lower Trigger Point (<span className="text-[#FF5722] font-mono">LTP</span>), eliminating false switching from noise.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-[3px] text-xs font-mono text-slate-300 hover:text-white bg-[#0B0F19] hover:bg-[#111520] border border-white/10 transition-colors cursor-pointer"
            title="Reset to default values (β = 0.3333, UTP = +4V, LTP = -4V)"
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
                  Schmitt Trigger Parameters
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#00F0FF] bg-[#111520] px-2 py-0.5 rounded-[2px] border border-white/5">Positive Feedback</span>
            </div>

            {/* Input Voltage Amplitude */}
            <InputNumber
              id="vinAmplitude"
              label="Input Voltage Peak Amplitude"
              symbol="Vin (peak)"
              value={inputs.vinAmplitude}
              unit={inputs.vinUnit}
              unitOptions={['V', 'mV']}
              onValueChange={(val) => setInputs({ ...inputs, vinAmplitude: val })}
              onUnitChange={(u) => setInputs({ ...inputs, vinUnit: u })}
              step={0.5}
              min={0.1}
              max={30}
              helpText="Must exceed UTP to toggle output high"
              error={errors.vinAmplitude}
            />

            {/* Resistors R1 and Rf setting Feedback factor beta */}
            <div className="grid grid-cols-2 gap-3">
              <InputNumber
                id="r1"
                label="Ground Resistor (R1)"
                symbol="R1"
                value={inputs.r1}
                unit={inputs.r1Unit}
                unitOptions={['Ω', 'kΩ', 'MΩ']}
                onValueChange={(val) => setInputs({ ...inputs, r1: val })}
                onUnitChange={(u) => setInputs({ ...inputs, r1Unit: u })}
                step={1}
                min={0.01}
                helpText="Resistor to ground"
                error={errors.r1}
              />
              <InputNumber
                id="rf"
                label="Feedback Resistor (Rf)"
                symbol="Rf"
                value={inputs.rf}
                unit={inputs.rfUnit}
                unitOptions={['Ω', 'kΩ', 'MΩ']}
                onValueChange={(val) => setInputs({ ...inputs, rf: val })}
                onUnitChange={(u) => setInputs({ ...inputs, rfUnit: u })}
                step={1}
                min={0.01}
                helpText="Positive feedback resistor"
                error={errors.rf}
              />
            </div>

            {/* Saturation Voltage Rails (+Vsat and -Vsat) */}
            <div className="grid grid-cols-2 gap-3">
              <InputNumber
                id="posVsat"
                label="Positive Rail (+Vsat)"
                symbol="+Vsat"
                value={inputs.posVsat}
                unit="V"
                onValueChange={(val) => setInputs({ ...inputs, posVsat: val })}
                step={1}
                min={1}
                max={30}
                helpText="Upper saturation rail"
                error={errors.posVsat}
              />
              <InputNumber
                id="negVsat"
                label="Negative Rail (-Vsat)"
                symbol="-Vsat"
                value={inputs.negVsat}
                unit="V"
                onValueChange={(val) => setInputs({ ...inputs, negVsat: val })}
                step={1}
                min={-30}
                max={-1}
                helpText="Lower saturation rail"
                error={errors.negVsat}
              />
            </div>

            {/* Waveform Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Input Excitation Waveform
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['sine', 'triangle', 'square'] as WaveformType[]).map((wf) => (
                  <button
                    key={wf}
                    type="button"
                    onClick={() => setWaveform(wf)}
                    className={`py-1.5 px-2 rounded-[3px] text-xs font-mono capitalize transition-all border cursor-pointer ${
                      inputs.waveform === wf
                        ? 'bg-[#00F0FF] text-[#0B0F19] font-bold border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.35)]'
                        : 'bg-[#0B0F19] text-slate-400 border-white/10 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {wf}
                  </button>
                ))}
              </div>
            </div>

            {/* Presets */}
            <div className="pt-2 border-t border-white/10">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                Hysteresis Scenarios:
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={applyDefaultTest}
                  className="px-2 py-1 text-[11px] font-mono rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-slate-300 hover:text-[#00F0FF] border border-white/10 hover:border-[#00F0FF] transition-all cursor-pointer"
                  title="Default: β = 1/3, UTP = +4V, LTP = -4V, VH = 8V"
                >
                  Standard (VH = 8V)
                </button>
                <button
                  type="button"
                  onClick={applyWideHysteresis}
                  className="px-2 py-1 text-[11px] font-mono rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-slate-300 hover:text-[#FF5722] border border-white/10 hover:border-[#FF5722] transition-all cursor-pointer"
                  title="Wide: β = 0.5, UTP = +6V, LTP = -6V, VH = 12V"
                >
                  Wide (VH = 12V)
                </button>
                <button
                  type="button"
                  onClick={applyNarrowHysteresis}
                  className="px-2 py-1 text-[11px] font-mono rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-slate-300 hover:text-[#00F0FF] border border-white/10 hover:border-[#00F0FF] transition-all cursor-pointer"
                  title="Narrow: β = 0.1, UTP = +1.2V, LTP = -1.2V, VH = 2.4V"
                >
                  Narrow (VH = 2.4V)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Transfer Graph, Oscilloscope, or Circuit Schematic */}
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
                onClick={() => setViewMode('transfer')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] transition-all cursor-pointer ${
                  viewMode === 'transfer'
                    ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_10px_rgba(0,240,255,0.35)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Hysteresis Loop (VTC)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('waveform')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] transition-all cursor-pointer ${
                  viewMode === 'waveform'
                    ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_10px_rgba(0,240,255,0.35)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Waveform Scope</span>
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
            {viewMode === 'transfer' && (
              <SchmittTransferGraph
                utp={results.utp}
                ltp={results.ltp}
                posVsat={results.posVsat}
                negVsat={results.negVsat}
                hysteresisWidth={results.hysteresisWidth}
                currentVin={results.vinAmpBase}
                currentVout={results.currentVout}
              />
            )}

            {viewMode === 'waveform' && (
              <CalculusWaveformGraph
                data={waveformData}
                title={`Schmitt Trigger Hysteresis Response (UTP: +${cleanFloat(results.utp, 2)}V, LTP: ${cleanFloat(results.ltp, 2)}V)`}
                inputLabel="INPUT WAVEFORM (Vin with Trigger Thresholds)"
                outputLabel="SCHMITT TRIGGER OUTPUT (Regenerative Switching)"
                expectedOutputWaveform={`Memory zone between ${cleanFloat(results.ltp, 1)}V and +${cleanFloat(results.utp, 1)}V maintains previous state without oscillation.`}
              />
            )}

            {viewMode === 'schematic' && (
              <SchmittTriggerSchematicSvg
                vinAmp={inputs.vinAmplitude}
                vinUnit={inputs.vinUnit}
                r1Base={results.r1Base}
                rfBase={results.rfBase}
                posVsat={results.posVsat}
                negVsat={results.negVsat}
                utp={results.utp}
                ltp={results.ltp}
                beta={results.beta}
              />
            )}
          </div>
        </div>
      </div>

      {/* 3. KEY RESULTS PANEL */}
      <div className="p-4 sm:p-5 rounded-[4px] border border-white/10 bg-[#1A1E29] shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00F0FF]" />
            <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              Schmitt Trigger Hysteresis Results
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#00F0FF] flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Regenerative Feedback Active</span>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <ResultCard
            label="Feedback Factor"
            symbol="β"
            value={cleanFloat(results.beta, 4)}
            unit=""
            formula="R1 / (R1 + Rf)"
            accentColor="slate"
            subtext={`R1=${formatResistance(results.r1Base)}, Rf=${formatResistance(results.rfBase)}`}
          />
          <ResultCard
            label="Upper Trigger Point"
            symbol="UTP"
            value={`+${cleanFloat(results.utp, 2)}`}
            unit="V"
            formula="+β × +Vsat"
            accentColor="cyan"
            highlight={true}
            subtext="Threshold for rising Vin"
          />
          <ResultCard
            label="Lower Trigger Point"
            symbol="LTP"
            value={`${cleanFloat(results.ltp, 2)}`}
            unit="V"
            formula="+β × -Vsat"
            accentColor="orange"
            highlight={true}
            subtext="Threshold for falling Vin"
          />
          <ResultCard
            label="Hysteresis Width"
            symbol="VH"
            value={cleanFloat(results.hysteresisWidth, 2)}
            unit="V"
            formula="UTP - LTP"
            accentColor="amber"
            highlight={true}
            subtext="Noise immunity deadband"
          />
          <ResultCard
            label="Input Peak"
            symbol="Vin (pk)"
            value={`±${cleanFloat(results.vinAmpBase, 1)}`}
            unit="V"
            formula="Signal amplitude"
            accentColor="slate"
            subtext={results.vinAmpBase > results.utp ? 'Exceeds UTP (switches)' : 'Below UTP'}
          />
          <ResultCard
            label="Current State"
            symbol="Vout"
            value={results.currentVout >= 0 ? `+${results.currentVout}` : `${results.currentVout}`}
            unit="V"
            formula="Bistable output"
            accentColor="cyan"
            highlight={true}
            subtext={results.currentStateLabel}
          />
        </div>
      </div>

      {/* 4. CALCULATION STEPS / PROOF */}
      <div className="p-4 sm:p-5 rounded-[4px] border border-white/10 bg-[#1A1E29] shadow-lg space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
          <Calculator className="w-4 h-4 text-[#00F0FF]" />
          <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            Step-by-Step Mathematical Derivation
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          {/* STEP 1: FEEDBACK FACTOR */}
          <div className="p-3.5 rounded-[3px] border border-white/10 bg-[#111520] space-y-1.5 shadow-sm">
            <span className="text-[10px] text-[#00F0FF] font-bold uppercase tracking-wider block">
              Step 1 — Feedback Factor (β)
            </span>
            <div className="text-slate-400 font-mono text-[11px]">{results.steps.step1BetaFormula}</div>
            <div className="text-slate-300 font-mono text-xs">{results.steps.step1BetaSub}</div>
            <div className="text-[#00F0FF] font-mono font-bold text-sm pt-1 border-t border-white/10">
              {results.steps.step1BetaResult}
            </div>
          </div>

          {/* STEP 2: UPPER TRIGGER POINT */}
          <div className="p-3.5 rounded-[3px] border border-white/10 bg-[#111520] space-y-1.5 shadow-sm">
            <span className="text-[10px] text-[#00F0FF] font-bold uppercase tracking-wider block">
              Step 2 — Upper Trigger Point (UTP)
            </span>
            <div className="text-slate-400 font-mono text-[11px]">{results.steps.step2UtpFormula}</div>
            <div className="text-slate-300 font-mono text-xs">{results.steps.step2UtpSub}</div>
            <div className="text-[#00F0FF] font-mono font-bold text-sm pt-1 border-t border-white/10">
              {results.steps.step2UtpResult}
            </div>
          </div>

          {/* STEP 3: LOWER TRIGGER POINT */}
          <div className="p-3.5 rounded-[3px] border border-white/10 bg-[#111520] space-y-1.5 shadow-sm">
            <span className="text-[10px] text-[#FF5722] font-bold uppercase tracking-wider block">
              Step 3 — Lower Trigger Point (LTP)
            </span>
            <div className="text-slate-400 font-mono text-[11px]">{results.steps.step3LtpFormula}</div>
            <div className="text-slate-300 font-mono text-xs">{results.steps.step3LtpSub}</div>
            <div className="text-[#FF5722] font-mono font-bold text-sm pt-1 border-t border-white/10">
              {results.steps.step3LtpResult}
            </div>
          </div>

          {/* STEP 4: HYSTERESIS WIDTH */}
          <div className="p-3.5 rounded-[3px] border border-white/10 bg-[#111520] space-y-1.5 shadow-sm">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
              Step 4 — Hysteresis Width (VH)
            </span>
            <div className="text-slate-400 font-mono text-[11px]">{results.steps.step4VhFormula}</div>
            <div className="text-slate-300 font-mono text-xs">{results.steps.step4VhSub}</div>
            <div className="text-amber-400 font-mono font-bold text-sm pt-1 border-t border-white/10">
              {results.steps.step4VhResult}
            </div>
          </div>
        </div>
      </div>

      {/* 5. THEORY & CIRCUIT FUNDAMENTALS (Infographic Modular Tiles) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[#00F0FF]" />
            <h2 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
              Circuit Theory & Hysteresis Dynamics
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Regenerative Bistable Switching</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TheoryTile
            badge="Positive Feedback"
            title="Voltage Threshold Division"
            formula="V_UTP = β(+Vsat),  V_LTP = β(-Vsat)  where β = R1 / (R1 + Rf)"
            accentColor="cyan"
            description="A resistive voltage divider connected to the non-inverting terminal feeds back a fraction β of the saturated output voltage. This dynamically resets the comparison threshold to align with the current output state."
            bullets={[
              "Feedback attenuation ratio: β = R1 / (R1 + Rf)",
              "Dual switching thresholds: UTP for rising edges, LTP for falling edges",
              "Symmetric rails produce symmetric thresholds centered on 0V"
            ]}
          />

          <TheoryTile
            badge="Hysteresis Loop"
            title="Direction-Dependent Memory Deadband"
            formula="VH = V_UTP - V_LTP = 2β · Vsat"
            accentColor="orange"
            description="The deadband between UTP and LTP acts as a 1-bit analog memory. Inside this voltage window, input fluctuations have zero effect—the op-amp tenaciously preserves its prior saturation state."
            bullets={[
              "Vin rising above UTP triggers abrupt transition to -Vsat (inverting) or +Vsat (non-inv)",
              "Vin falling below LTP resets output to opposite rail",
              "Immune to peak-to-peak noise amplitude less than VH"
            ]}
          />

          <TheoryTile
            badge="Pulse Conditioning"
            title="Universal Analog Waveform Squarer"
            formula="t_rise ≈ (Vsat⁺ - Vsat⁻) / Slew Rate"
            accentColor="slate"
            description="Slow-moving analog signals (sine waves, sensor ramps, noisy triangular pulses) cannot be directly fed to digital CMOS/TTL logic gates due to intermediate voltage metastability. Schmitt triggers snap slowly varying inputs into steep, jitter-free square edges."
            specs={{
              "Noise Immunity": "Noise peak < VH / 2 is completely rejected",
              "Output Form": "Bistable rail-to-rail square wave",
              "Switching Transition": "Accelerated by regenerative positive feedback loop",
              "Primary Applications": "Clock conditioning, debounce, astable relaxation oscillators"
            }}
          />
        </div>
      </div>
    </div>
  );
};
