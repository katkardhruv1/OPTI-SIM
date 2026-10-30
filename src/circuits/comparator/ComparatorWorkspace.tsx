import React, { useState, useEffect } from 'react';
import { ComparatorInputs, ComparatorResults, ComparatorType, WaveformType } from '../../types/circuit';
import { calculateComparator, validateComparatorInputs } from '../../calculations/comparator';
import { generateComparatorWaveform, WaveformData } from '../../utils/waveformGenerator';
import { InputNumber } from '../../components/ui/InputNumber';
import { ResultCard } from '../../components/ui/ResultCard';
import { TheoryTile } from '../../components/ui/TheoryTile';
import { ComparatorSchematicSvg } from '../../components/circuit/ComparatorSchematicSvg';
import { ComparatorTransferGraph } from '../../components/circuit/ComparatorTransferGraph';
import { CalculusWaveformGraph } from '../../components/circuit/CalculusWaveformGraph';
import { cleanFloat, formatFrequency } from '../../utils/formatters';
import { saveActiveCircuitState } from '../../utils/circuitStateBridge';
import { RotateCcw, Calculator, Zap, Eye, Activity, CheckCircle, Lightbulb, BarChart2 } from 'lucide-react';

interface ComparatorWorkspaceProps {
  onStatusChange?: (status: 'Ready' | 'Calculated' | 'Error', hasErrors: boolean) => void;
}

const DEFAULT_INPUTS: ComparatorInputs = {
  vin: 2,
  vinUnit: 'V',
  vref: 1,
  vrefUnit: 'V',
  posVsat: 15,
  negVsat: -15,
  comparatorType: 'non-inverting',
  waveform: 'sine',
  frequency: 1000,
  frequencyUnit: 'Hz',
};

export const ComparatorWorkspace: React.FC<ComparatorWorkspaceProps> = ({
  onStatusChange,
}) => {
  const [inputs, setInputs] = useState<ComparatorInputs>(DEFAULT_INPUTS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [results, setResults] = useState<ComparatorResults>(() =>
    calculateComparator(DEFAULT_INPUTS)
  );
  const [viewMode, setViewMode] = useState<'transfer' | 'waveform' | 'schematic'>('transfer');

  // Synchronize state with central bridge for Lab Mode and Exports
  useEffect(() => {
    saveActiveCircuitState('comparator', inputs, results);
  }, [inputs, results]);

  // Generate waveform dynamically
  const waveformData: WaveformData = generateComparatorWaveform(
    inputs.waveform,
    Math.max(Math.abs(results.vinBase), 2.5),
    inputs.frequency,
    results.vrefBase,
    results.posVsat,
    results.negVsat,
    inputs.comparatorType
  );

  const handleCalculate = () => {
    const validationErrors = validateComparatorInputs(inputs);

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
    const res = calculateComparator(inputs);
    setResults(res);
    onStatusChange?.('Calculated', false);
  };

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    setErrors({});
    const res = calculateComparator(DEFAULT_INPUTS);
    setResults(res);
    onStatusChange?.('Ready', false);
  };

  const setComparatorType = (type: ComparatorType) => {
    const updated: ComparatorInputs = { ...inputs, comparatorType: type };
    setInputs(updated);
    const res = calculateComparator(updated);
    setResults(res);
  };

  const setWaveform = (wf: WaveformType) => {
    const updated: ComparatorInputs = { ...inputs, waveform: wf };
    setInputs(updated);
    const res = calculateComparator(updated);
    setResults(res);
  };

  // Test Case 1: Non-Inverting Vin = 2V, Vref = 1V => +15V
  const applyTest1 = () => {
    const p: ComparatorInputs = {
      ...inputs,
      vin: 2,
      vinUnit: 'V',
      vref: 1,
      vrefUnit: 'V',
      posVsat: 15,
      negVsat: -15,
      comparatorType: 'non-inverting',
    };
    setInputs(p);
    setErrors({});
    setResults(calculateComparator(p));
    onStatusChange?.('Calculated', false);
  };

  // Test Case 2: Non-Inverting Vin = 0.5V, Vref = 1V => -15V
  const applyTest2 = () => {
    const p: ComparatorInputs = {
      ...inputs,
      vin: 0.5,
      vinUnit: 'V',
      vref: 1,
      vrefUnit: 'V',
      posVsat: 15,
      negVsat: -15,
      comparatorType: 'non-inverting',
    };
    setInputs(p);
    setErrors({});
    setResults(calculateComparator(p));
    onStatusChange?.('Calculated', false);
  };

  // Test Case 3: Inverting Vin = 2V, Vref = 1V => -15V
  const applyTest3 = () => {
    const p: ComparatorInputs = {
      ...inputs,
      vin: 2,
      vinUnit: 'V',
      vref: 1,
      vrefUnit: 'V',
      posVsat: 15,
      negVsat: -15,
      comparatorType: 'inverting',
    };
    setInputs(p);
    setErrors({});
    setResults(calculateComparator(p));
    onStatusChange?.('Calculated', false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#0B0F19] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. MODULE TITLE & DESCRIPTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white">
              Op-Amp Comparator
            </h1>
            <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-mono uppercase tracking-wider bg-[#FF5722]/15 text-[#FF5722] border border-[#FF5722]/30">
              Nonlinear Application
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl font-sans">
            Analyze open-loop rail-to-rail switching dynamics of an operational amplifier voltage comparator without negative feedback.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-[3px] text-xs font-mono text-slate-300 hover:text-white bg-[#0B0F19] hover:bg-[#111520] border border-white/10 transition-colors cursor-pointer"
            title="Reset to standard defaults"
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
        {/* Left Column: Input Parameters & Configuration */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-4 sm:p-5 rounded-[4px] border border-white/10 bg-[#1A1E29] shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#00F0FF]" />
                <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                  Comparator Parameters
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#00F0FF] bg-[#111520] px-2 py-0.5 rounded-[2px] border border-white/5">Open-Loop</span>
            </div>

            {/* Input Configuration Selector */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Input Configuration
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setComparatorType('non-inverting')}
                  className={`py-2 px-3 rounded-[3px] text-xs font-mono transition-all border text-center cursor-pointer ${
                    inputs.comparatorType === 'non-inverting'
                      ? 'bg-[#00F0FF] text-[#0B0F19] font-bold border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.35)]'
                      : 'bg-[#0B0F19] text-slate-400 border-white/10 hover:border-white/20 hover:text-white'
                  }`}
                >
                  Non-Inverting (Vin on +)
                </button>
                <button
                  type="button"
                  onClick={() => setComparatorType('inverting')}
                  className={`py-2 px-3 rounded-[3px] text-xs font-mono transition-all border text-center cursor-pointer ${
                    inputs.comparatorType === 'inverting'
                      ? 'bg-[#00F0FF] text-[#0B0F19] font-bold border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.35)]'
                      : 'bg-[#0B0F19] text-slate-400 border-white/10 hover:border-white/20 hover:text-white'
                  }`}
                >
                  Inverting (Vin on -)
                </button>
              </div>
            </div>

            {/* Input Voltage (Vin) */}
            <InputNumber
              id="vin"
              label="Input Voltage (Vin)"
              symbol="Vin"
              value={inputs.vin}
              unit={inputs.vinUnit}
              unitOptions={['V', 'mV']}
              onValueChange={(val) => setInputs({ ...inputs, vin: val })}
              onUnitChange={(u) => setInputs({ ...inputs, vinUnit: u })}
              step={0.1}
              helpText="Signal voltage to compare against reference"
              error={errors.vin}
            />

            {/* Reference Voltage (Vref) */}
            <InputNumber
              id="vref"
              label="Reference Voltage (Vref)"
              symbol="Vref"
              value={inputs.vref}
              unit={inputs.vrefUnit}
              unitOptions={['V', 'mV']}
              onValueChange={(val) => setInputs({ ...inputs, vref: val })}
              onUnitChange={(u) => setInputs({ ...inputs, vrefUnit: u })}
              step={0.1}
              helpText="Threshold reference voltage"
              error={errors.vref}
            />

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
                helpText="Positive rail limit"
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
                helpText="Negative rail limit"
                error={errors.negVsat}
              />
            </div>

            {/* Waveform Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Test Input Waveform
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

            {/* Presets / Verification Tests */}
            <div className="pt-2 border-t border-white/10">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                Academic Test Cases:
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={applyTest1}
                  className="px-2 py-1 text-[11px] font-mono rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-slate-300 hover:text-[#00F0FF] border border-white/10 hover:border-[#00F0FF] transition-all cursor-pointer"
                  title="Test 1: Non-Inv Vin=2V > Vref=1V -> +15V"
                >
                  Test 1 (Vin &gt; Vref)
                </button>
                <button
                  type="button"
                  onClick={applyTest2}
                  className="px-2 py-1 text-[11px] font-mono rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-slate-300 hover:text-[#FF5722] border border-white/10 hover:border-[#FF5722] transition-all cursor-pointer"
                  title="Test 2: Non-Inv Vin=0.5V < Vref=1V -> -15V"
                >
                  Test 2 (Vin &lt; Vref)
                </button>
                <button
                  type="button"
                  onClick={applyTest3}
                  className="px-2 py-1 text-[11px] font-mono rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-slate-300 hover:text-[#00F0FF] border border-white/10 hover:border-[#00F0FF] transition-all cursor-pointer"
                  title="Test 3: Inverting Vin=2V > Vref=1V -> -15V"
                >
                  Test 3 (Inverting)
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
                <span>Transfer Curve (VTC)</span>
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
              <ComparatorTransferGraph
                vref={results.vrefBase}
                posVsat={results.posVsat}
                negVsat={results.negVsat}
                comparatorType={inputs.comparatorType}
                currentVin={results.vinBase}
                currentVout={results.vout}
              />
            )}

            {viewMode === 'waveform' && (
              <CalculusWaveformGraph
                data={waveformData}
                title={`Comparator Switching Output (${inputs.waveform.toUpperCase()} vs Vref = ${cleanFloat(results.vrefBase, 2)} V)`}
                inputLabel="INPUT WAVEFORM (Vin)"
                outputLabel="COMPARATOR OUTPUT (Switches at Saturation)"
                expectedOutputWaveform={`${inputs.comparatorType === 'non-inverting' ? 'Vin > Vref → +Vsat' : 'Vin > Vref → -Vsat'}`}
              />
            )}

            {viewMode === 'schematic' && (
              <ComparatorSchematicSvg
                vin={inputs.vin}
                vinUnit={inputs.vinUnit}
                vref={inputs.vref}
                vrefUnit={inputs.vrefUnit}
                posVsat={results.posVsat}
                negVsat={results.negVsat}
                comparatorType={inputs.comparatorType}
                vout={results.vout}
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
              Comparator Output & State Results
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#00F0FF] flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Switching Logic Evaluated</span>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <ResultCard
            label="Input Voltage"
            symbol="Vin"
            value={cleanFloat(results.vinBase, 2)}
            unit="V"
            formula="Applied signal"
            accentColor="cyan"
            highlight={true}
          />
          <ResultCard
            label="Reference Voltage"
            symbol="Vref"
            value={cleanFloat(results.vrefBase, 2)}
            unit="V"
            formula="Threshold reference"
            accentColor="amber"
          />
          <ResultCard
            label="Comparator Type"
            symbol="Type"
            value={inputs.comparatorType === 'non-inverting' ? 'Non-Inv' : 'Inverting'}
            formula={inputs.comparatorType === 'non-inverting' ? 'Vin on +' : 'Vin on -'}
            accentColor="slate"
          />
          <ResultCard
            label="+Vsat Rail"
            symbol="+Vsat"
            value={`+${results.posVsat}`}
            unit="V"
            formula="Upper rail"
            accentColor="emerald"
          />
          <ResultCard
            label="-Vsat Rail"
            symbol="-Vsat"
            value={`${results.negVsat}`}
            unit="V"
            formula="Lower rail"
            accentColor="slate"
          />
          <ResultCard
            label="Output Voltage"
            symbol="Vout"
            value={results.vout >= 0 ? `+${cleanFloat(results.vout, 1)}` : cleanFloat(results.vout, 1)}
            unit="V"
            formula="Vout = ±Vsat"
            accentColor={results.isSaturatedPos ? 'cyan' : 'amber'}
            highlight={true}
            subtext={results.stateLabel}
          />
        </div>
      </div>

      {/* 4. CALCULATION STEPS / PROOF */}
      <div className="p-4 sm:p-5 rounded-[4px] border border-white/10 bg-[#1A1E29] shadow-lg space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
          <Calculator className="w-4 h-4 text-[#00F0FF]" />
          <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            Comparator Calculation & Decision Proof
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          {/* STEP 1: COMPARE INPUT AND REFERENCE */}
          <div className="p-3.5 rounded-[3px] border border-white/10 bg-[#111520] space-y-2 shadow-sm">
            <span className="text-[10px] text-[#00F0FF] font-bold uppercase tracking-wider block">
              Step 1 — Compare Input & Reference
            </span>
            <div className="text-slate-400 font-mono text-[11px]">{results.steps.step1Comparison}</div>
            <div className="text-[#FF5722] font-mono font-bold text-sm">{results.steps.step1Result}</div>
          </div>

          {/* STEP 2: DETERMINE OUTPUT STATE */}
          <div className="p-3.5 rounded-[3px] border border-white/10 bg-[#111520] space-y-2 shadow-sm">
            <span className="text-[10px] text-[#00F0FF] font-bold uppercase tracking-wider block">
              Step 2 — Apply Comparator Logic
            </span>
            <div className="text-slate-400 font-mono text-[11px]">{results.steps.step2Logic}</div>
            <div className="text-slate-200 leading-relaxed font-sans text-xs">
              {results.steps.step2Result}
            </div>
          </div>

          {/* STEP 3: OUTPUT */}
          <div className="p-3.5 rounded-[3px] border border-white/10 bg-[#111520] space-y-2 shadow-sm">
            <span className="text-[10px] text-[#00F0FF] font-bold uppercase tracking-wider block">
              Step 3 — Output Saturation Result
            </span>
            <div className="text-slate-400 font-mono text-[11px]">Final Determined State:</div>
            <div className="text-[#00F0FF] font-mono font-bold text-sm">
              {results.steps.step3Output}
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
              Circuit Theory & Switching Fundamentals
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Open-Loop Voltage Detection</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TheoryTile
            badge="Open-Loop Gain"
            title="Saturating Voltage Comparison"
            formula="Vout = +Vsat (v⁺ > v⁻) | -Vsat (v⁺ < v⁻)"
            accentColor="cyan"
            description="With zero negative feedback, the op-amp operates at raw open-loop differential gain Aol (typically 10^5 to 10^6). A differential input difference of mere microvolts pushes the output stage into hard saturation."
            bullets={[
              "Differential input voltage: Vd = (V+ - V-)",
              "Required input overdrive to rail: |Vd| > Vsat / Aol ≈ 150 µV",
              "Outputs discrete binary voltage states (+Vsat / -Vsat)"
            ]}
          />

          <TheoryTile
            badge="Topology Rules"
            title="Input Terminal Configuration"
            formula="Non-Inverting: Vin > Vref → +Vsat | Vin < Vref → -Vsat"
            accentColor="orange"
            description="Terminal assignment dictates output polarity. Non-inverting configuration yields high output when signal exceeds reference; inverting configuration inverts the switching logic."
            bullets={[
              "Non-Inverting: Vin connected to (+), Vref to (-)",
              "Inverting: Vin connected to (-), Vref to (+)",
              "Level detector threshold exactly equals reference voltage Vref"
            ]}
          />

          <TheoryTile
            badge="Noise & Chattering"
            title="Single-Threshold Noise Vulnerability"
            formula="ΔV_hysteresis = 0 V (Zero Noise Margin)"
            accentColor="slate"
            description="Because open-loop comparators have only one threshold, slow-moving inputs or electrical noise cause the output to rapidly toggle between rails ('chattering'). This is eliminated by positive feedback in Schmitt triggers."
            specs={{
              "Threshold Width": "0 mV (Knife-edge transition)",
              "Noise Vulnerability": "Extremely high at Vin ≈ Vref",
              "Switching Speed": "Slew-rate and propagation delay limited",
              "Solution": "Add regenerative positive feedback (Hysteresis)"
            }}
          />
        </div>
      </div>
    </div>
  );
};
