import React, { useState, useEffect } from 'react';
import { DifferentialAmpInputs, DifferentialAmpResults } from '../../types/circuit';
import { calculateDifferentialAmplifier, validateDifferentialAmpInputs } from '../../calculations/diffAmp';
import { InputNumber } from '../../components/ui/InputNumber';
import { ResultCard } from '../../components/ui/ResultCard';
import { TheoryTile } from '../../components/ui/TheoryTile';
import { DiffAmpSchematicSvg } from '../../components/circuit/DiffAmpSchematicSvg';
import { UniversalWaveformScope } from '../../components/circuit/UniversalWaveformScope';
import { simulateDifferentialOpAmp, SignalWaveformType } from '../../utils/waveformEngine';
import { cleanFloat, formatResistance } from '../../utils/formatters';
import { saveActiveCircuitState } from '../../utils/circuitStateBridge';
import { RotateCcw, Calculator, Zap, Eye, Activity, CheckCircle, Lightbulb } from 'lucide-react';

interface DiffAmpWorkspaceProps {
  onStatusChange?: (status: 'Ready' | 'Calculated' | 'Error', hasErrors: boolean) => void;
}

const DEFAULT_INPUTS: DifferentialAmpInputs = {
  v1: 2,
  v1Unit: 'V',
  v2: 1,
  v2Unit: 'V',
  r1: 10,
  r1Unit: 'kΩ',
  r2: 10,
  r2Unit: 'kΩ',
  rf: 20,
  rfUnit: 'kΩ',
  rg: 20,
  rgUnit: 'kΩ',
};

export const DiffAmpWorkspace: React.FC<DiffAmpWorkspaceProps> = ({
  onStatusChange,
}) => {
  const [inputs, setInputs] = useState<DifferentialAmpInputs>(DEFAULT_INPUTS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [results, setResults] = useState<DifferentialAmpResults>(() =>
    calculateDifferentialAmplifier(DEFAULT_INPUTS)
  );
  const [viewMode, setViewMode] = useState<'schematic' | 'scope'>('schematic');
  const [signalType, setSignalType] = useState<SignalWaveformType>('sine');
  const [signalFreq, setSignalFreq] = useState<number>(1000);
  const [posVsat, setPosVsat] = useState<number>(15);
  const [negVsat, setNegVsat] = useState<number>(-15);

  // Synchronize state with central bridge for Lab Mode and Exports
  useEffect(() => {
    saveActiveCircuitState('differential-amplifier', inputs, results);
  }, [inputs, results]);

  const handleCalculate = () => {
    const validationErrors = validateDifferentialAmpInputs(inputs);

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
    const res = calculateDifferentialAmplifier(inputs);
    setResults(res);
    onStatusChange?.('Calculated', false);
  };

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    setSignalType('sine');
    setSignalFreq(1000);
    setPosVsat(15);
    setNegVsat(-15);
    setErrors({});
    const res = calculateDifferentialAmplifier(DEFAULT_INPUTS);
    setResults(res);
    onStatusChange?.('Ready', false);
  };

  // Unified dynamic simulation for Differential Amplifier
  const simulation = simulateDifferentialOpAmp({
    v1Params: {
      waveform: signalType,
      amplitude: Math.abs(results.v1Base),
      frequency: signalFreq,
      phaseDeg: 0,
      dcOffset: 0,
    },
    v2Params: {
      waveform: signalType,
      amplitude: Math.abs(results.v2Base),
      frequency: signalFreq,
      phaseDeg: 0,
      dcOffset: 0,
    },
    r1: results.r1Base,
    r2: results.r2Base,
    rf: results.rfBase,
    rg: results.rgBase,
    posVsat,
    negVsat,
    applyClipping: true,
  });

  const applyPresetTest1 = () => {
    const p: DifferentialAmpInputs = {
      v1: 2,
      v1Unit: 'V',
      v2: 1,
      v2Unit: 'V',
      r1: 10,
      r1Unit: 'kΩ',
      r2: 10,
      r2Unit: 'kΩ',
      rf: 20,
      rfUnit: 'kΩ',
      rg: 20,
      rgUnit: 'kΩ',
    };
    setInputs(p);
    setErrors({});
    setResults(calculateDifferentialAmplifier(p));
    onStatusChange?.('Calculated', false);
  };

  const applyPresetTest2 = () => {
    const p: DifferentialAmpInputs = {
      v1: 1,
      v1Unit: 'V',
      v2: 3,
      v2Unit: 'V',
      r1: 10,
      r1Unit: 'kΩ',
      r2: 10,
      r2Unit: 'kΩ',
      rf: 30,
      rfUnit: 'kΩ',
      rg: 30,
      rgUnit: 'kΩ',
    };
    setInputs(p);
    setErrors({});
    setResults(calculateDifferentialAmplifier(p));
    onStatusChange?.('Calculated', false);
  };

  const applyPresetCMRR = () => {
    const p: DifferentialAmpInputs = {
      v1: 2,
      v1Unit: 'V',
      v2: 2,
      v2Unit: 'V',
      r1: 10,
      r1Unit: 'kΩ',
      r2: 10,
      r2Unit: 'kΩ',
      rf: 20,
      rfUnit: 'kΩ',
      rg: 20,
      rgUnit: 'kΩ',
    };
    setInputs(p);
    setErrors({});
    setResults(calculateDifferentialAmplifier(p));
    onStatusChange?.('Calculated', false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* 1. Header & Subtitle */}
      <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold font-mono text-white tracking-tight">
              Differential Amplifier (Subtractor)
            </h1>
            <span className="text-xs font-mono text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/30 px-2 py-0.5 rounded-[2px]">
              Active Simulation
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Analyze differential voltage subtraction, common-mode rejection ratio (CMRR), and balanced bridge amplification.
          </p>
        </div>

        {/* Quick Presets matching Lab Test Cases */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mr-1">Lab Presets:</span>
          <button
            onClick={applyPresetTest1}
            className="text-[11px] font-mono px-2.5 py-1 rounded-[2px] bg-[#111520] border border-white/10 text-slate-300 hover:border-[#00F0FF]/50 hover:text-[#00F0FF] transition-colors cursor-pointer"
          >
            Ad = 2 (Test 1: -2V)
          </button>
          <button
            onClick={applyPresetTest2}
            className="text-[11px] font-mono px-2.5 py-1 rounded-[2px] bg-[#111520] border border-white/10 text-slate-300 hover:border-[#00F0FF]/50 hover:text-[#00F0FF] transition-colors cursor-pointer"
          >
            Ad = 3 (Test 2: +6V)
          </button>
          <button
            onClick={applyPresetCMRR}
            className="text-[11px] font-mono px-2.5 py-1 rounded-[2px] bg-[#111520] border border-white/10 text-slate-300 hover:border-[#00F0FF]/50 hover:text-[#00F0FF] transition-colors cursor-pointer"
          >
            Common-Mode (Vdiff = 0V)
          </button>
        </div>
      </div>

      {/* 2. Main Workspace Split: Parameters | Circuit Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Input Parameters */}
        <div className="lg:col-span-5 rounded-[3px] border border-white/10 bg-[#1A1E29] p-4 sm:p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#00F0FF]" />
              <h2 className="text-sm font-semibold font-mono text-white uppercase tracking-wider">
                Input Parameters & Resistors
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">
              Matched Bridge
            </span>
          </div>

          <div className="space-y-4">
            {/* V1 and R1 (Inverting Arm) */}
            <div className="p-3.5 rounded-[3px] bg-[#111520] border border-white/10 space-y-3">
              <span className="text-[10px] font-mono font-bold text-[#FF5722] uppercase tracking-wider block">
                Inverting Arm (Terminal 1 - Invert)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <InputNumber
                  id="v1"
                  symbol="V1"
                  label="Inverting Vin"
                  value={inputs.v1}
                  unit={inputs.v1Unit}
                  unitOptions={['V', 'mV']}
                  onValueChange={(val) => setInputs((prev) => ({ ...prev, v1: val }))}
                  onUnitChange={(u) => setInputs((prev) => ({ ...prev, v1Unit: u }))}
                  error={errors.v1}
                />
                <InputNumber
                  id="r1"
                  symbol="R1"
                  label="Input Resistor"
                  value={inputs.r1}
                  unit={inputs.r1Unit}
                  unitOptions={['Ω', 'kΩ', 'MΩ']}
                  onValueChange={(val) => setInputs((prev) => ({ ...prev, r1: val }))}
                  onUnitChange={(u) => setInputs((prev) => ({ ...prev, r1Unit: u }))}
                  error={errors.r1}
                />
              </div>
            </div>

            {/* V2 and R2 (Non-Inverting Arm) */}
            <div className="p-3.5 rounded-[3px] bg-[#111520] border border-white/10 space-y-3">
              <span className="text-[10px] font-mono font-bold text-[#00F0FF] uppercase tracking-wider block">
                Non-Inverting Arm (Terminal 2 - Non-Invert)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <InputNumber
                  id="v2"
                  symbol="V2"
                  label="Non-Inv Vin"
                  value={inputs.v2}
                  unit={inputs.v2Unit}
                  unitOptions={['V', 'mV']}
                  onValueChange={(val) => setInputs((prev) => ({ ...prev, v2: val }))}
                  onUnitChange={(u) => setInputs((prev) => ({ ...prev, v2Unit: u }))}
                  error={errors.v2}
                />
                <InputNumber
                  id="r2"
                  symbol="R2"
                  label="Input Resistor"
                  value={inputs.r2}
                  unit={inputs.r2Unit}
                  unitOptions={['Ω', 'kΩ', 'MΩ']}
                  onValueChange={(val) => setInputs((prev) => ({ ...prev, r2: val }))}
                  onUnitChange={(u) => setInputs((prev) => ({ ...prev, r2Unit: u }))}
                  error={errors.r2}
                />
              </div>
            </div>

            {/* Rf and Rg Resistors */}
            <div className="p-3.5 rounded-[3px] bg-[#111520] border border-white/10 space-y-3">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                Feedback & Reference Resistors
              </span>
              <div className="grid grid-cols-2 gap-2">
                <InputNumber
                  id="rf-diff"
                  symbol="Rf"
                  label="Feedback Res."
                  value={inputs.rf}
                  unit={inputs.rfUnit}
                  unitOptions={['Ω', 'kΩ', 'MΩ']}
                  onValueChange={(val) => setInputs((prev) => ({ ...prev, rf: val }))}
                  onUnitChange={(u) => setInputs((prev) => ({ ...prev, rfUnit: u }))}
                  error={errors.rf}
                />
                <InputNumber
                  id="rg-diff"
                  symbol="Rg"
                  label="Ground Ref. Res."
                  value={inputs.rg}
                  unit={inputs.rgUnit}
                  unitOptions={['Ω', 'kΩ', 'MΩ']}
                  onValueChange={(val) => setInputs((prev) => ({ ...prev, rg: val }))}
                  onUnitChange={(u) => setInputs((prev) => ({ ...prev, rgUnit: u }))}
                  error={errors.rg}
                />
              </div>
            </div>

            {/* Waveform Controls */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="text-xs font-mono text-slate-300 font-medium block">
                Excitation Waveform
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['sine', 'square', 'triangle', 'dc'] as SignalWaveformType[]).map((wf) => (
                  <button
                    key={wf}
                    type="button"
                    onClick={() => setSignalType(wf)}
                    className={`py-1 text-xs font-mono font-semibold rounded-[3px] capitalize border transition cursor-pointer ${
                      signalType === wf
                        ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF]'
                        : 'bg-[#0B0F19] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {wf}
                  </button>
                ))}
              </div>

              {/* Frequency input */}
              {signalType !== 'dc' && (
                <div className="pt-2">
                  <InputNumber
                    id="diff-signalFreq"
                    symbol="f"
                    label="Test Frequency"
                    value={signalFreq}
                    unit="Hz"
                    step={100}
                    min={1}
                    max={100000}
                    onValueChange={(f) => setSignalFreq(Math.max(1, f))}
                    hint="Differential signal frequency"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons: Calculate & Reset */}
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleCalculate}
              className="flex-1 py-2.5 px-4 rounded-[3px] bg-[#00F0FF] hover:bg-[#00d8e6] active:bg-[#00c2cf] text-[#0B0F19] font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-colors cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Calculate</span>
            </button>

            <button
              onClick={handleReset}
              className="py-2.5 px-4 rounded-[3px] bg-[#111520] hover:bg-[#161c2b] border border-white/10 text-slate-300 font-mono font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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

        {/* RIGHT COLUMN: Circuit Diagram & Oscilloscope */}
        <div className="lg:col-span-7 rounded-[3px] border border-white/10 bg-[#1A1E29] p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-3 gap-2">
            <div>
              <h2 className="text-sm font-semibold font-mono text-white uppercase tracking-wider">
                Differential Circuit Diagram & Probes
              </h2>
              <p className="text-[11px] text-slate-400">
                Balanced 4-resistor subtraction topology with dual input terminals.
              </p>
            </div>

            {/* Toggle View: Schematic vs Oscilloscope */}
            <div className="flex items-center rounded-[3px] bg-[#0B0F19] p-1 border border-white/10 text-xs font-mono">
              <button
                onClick={() => setViewMode('schematic')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] transition-colors ${
                  viewMode === 'schematic'
                    ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Schematic</span>
              </button>

              <button
                onClick={() => setViewMode('scope')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] transition-colors ${
                  viewMode === 'scope'
                    ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Oscilloscope</span>
              </button>
            </div>
          </div>

          {/* Visualization Canvas */}
          {viewMode === 'schematic' ? (
            <DiffAmpSchematicSvg
              v1={inputs.v1}
              v1Unit={inputs.v1Unit}
              v2={inputs.v2}
              v2Unit={inputs.v2Unit}
              r1Base={results.r1Base}
              r2Base={results.r2Base}
              rfBase={results.rfBase}
              rgBase={results.rgBase}
              vdiff={results.vdiff}
              ad={results.ad}
              vout={results.vout}
            />
          ) : (
            <UniversalWaveformScope
              simulation={simulation}
              title="DIFFERENTIAL AMPLIFIER DUAL-TRACE OSCILLOSCOPE"
              subtitle={`Differential Subtraction: Vin = (V2 - V1), Vout = Ad • Vdiff • Frequency: ${cleanFloat(signalFreq)} Hz`}
              insight="The differential amplifier amplifies the difference (V2 - V1) while rejecting common-mode signals. Saturation occurs if Vout reaches the DC power supply rails."
              showPhaseMetric={true}
              showGainMetric={true}
            />
          )}
        </div>
      </div>

      {/* 3. RESULTS PANEL: Infographic-Style Analytical Data Blocks */}
      <div className="rounded-[3px] border border-white/10 bg-[#1A1E29] p-4 sm:p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#00F0FF]" />
            <h2 className="text-sm font-semibold font-mono text-white uppercase tracking-wider">
              Calculation Results & Analytical Solutions
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            Differential Subtraction & Gain
          </span>
        </div>

        {/* Primary Metric Result Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ResultCard
            label="Differential Signal"
            symbol="Vdiff"
            value={cleanFloat(results.vdiff)}
            unit="V"
            formula="Vdiff = V2 - V1"
            subtext={`${cleanFloat(results.v2Base)}V - ${cleanFloat(results.v1Base)}V`}
            accentColor="cyan"
          />

          <ResultCard
            label="Differential Gain"
            symbol="Ad"
            value={cleanFloat(results.ad)}
            unit=""
            formula="Ad = Rf / R1"
            subtext={`${formatResistance(results.rfBase)} / ${formatResistance(results.r1Base)}`}
            accentColor="emerald"
          />

          <ResultCard
            label="Output Voltage"
            symbol="Vout"
            value={cleanFloat(results.vout)}
            unit="V"
            formula="Vout = Ad × Vdiff"
            subtext={`${cleanFloat(results.ad)} × (${cleanFloat(results.vdiff)}V)`}
            accentColor="amber"
            highlight={true}
          />

          <ResultCard
            label="Bridge Balance"
            symbol="CMRR"
            value={results.isMatched ? 'Balanced' : 'Imbalanced'}
            unit=""
            formula="Rf/R1 = Rg/R2"
            subtext={results.isMatched ? 'Common-mode fully rejected' : 'Gain ratio disparity'}
            accentColor={results.isMatched ? 'emerald' : 'amber'}
          />
        </div>

        {/* Step-by-Step Mathematical Derivations */}
        <div className="rounded-[3px] border border-white/10 bg-[#111520] p-4 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/10">
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              STEP-BY-STEP CALCULATION PROOF & SI SUBSTITUTION
            </span>
            <span className="text-[10px] text-[#00F0FF] uppercase">Analytical Proof</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1: Vdiff */}
            <div className="p-3.5 rounded-[3px] bg-[#1A1E29] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                  STEP 01: VDIFF
                </span>
                <span className="text-[10px] text-[#00F0FF] bg-[#0B0F19] px-1.5 py-0.5 rounded-[2px] border border-white/10">
                  Subtraction
                </span>
              </div>
              <div className="text-white text-xs font-semibold">{results.steps.vdiffFormula}</div>
              <div className="text-slate-400 text-[11px]">{results.steps.vdiffSubstitution}</div>
              <div className="text-[#00F0FF] font-bold text-sm pt-2 border-t border-white/10">
                {results.steps.vdiffResult}
              </div>
            </div>

            {/* Step 2: Gain Ad */}
            <div className="p-3.5 rounded-[3px] bg-[#1A1E29] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                  STEP 02: GAIN (Ad)
                </span>
                <span className="text-[10px] text-[#00F0FF] bg-[#0B0F19] px-1.5 py-0.5 rounded-[2px] border border-white/10">
                  Resistor Ratio
                </span>
              </div>
              <div className="text-white text-xs font-semibold">{results.steps.gainFormula}</div>
              <div className="text-slate-400 text-[11px]">{results.steps.gainSubstitution}</div>
              <div className="text-emerald-400 font-bold text-sm pt-2 border-t border-white/10">
                {results.steps.gainResult}
              </div>
            </div>

            {/* Step 3: Vout */}
            <div className="p-3.5 rounded-[3px] bg-[#1A1E29] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                  STEP 03: OUTPUT (Vout)
                </span>
                <span className="text-[10px] text-[#FF5722] bg-[#0B0F19] px-1.5 py-0.5 rounded-[2px] border border-white/10">
                  Product
                </span>
              </div>
              <div className="text-white text-xs font-semibold">{results.steps.voutFormula}</div>
              <div className="text-slate-400 text-[11px]">{results.steps.voutSubstitution}</div>
              <div className="text-[#FF5722] font-bold text-sm pt-2 border-t border-white/10">
                {results.steps.voutResult}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. THEORY & ENGINEERING INSIGHTS: Modular Infographic Grid */}
      <div className="rounded-[3px] border border-white/10 bg-[#1A1E29] p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[#00F0FF]" />
            <h3 className="text-sm font-semibold font-mono text-white uppercase tracking-wider">
              Theory & Circuit Fundamentals
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            ENTC Coursework
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TheoryTile
            title="Differential Subtraction"
            category="GOVERNING AXIOM"
            formula="Vout = (Rf / R1) × (V2 - V1)"
            description="The differential amplifier amplifies the exact voltage disparity between the two input terminals while suppressing identical noise voltages present on both lines."
            specs={[
              { label: 'Gain Factor', value: 'Ad = Rf / R1' },
              { label: 'Subtraction', value: 'Vdiff = V2 - V1' },
              { label: 'Polarity', value: 'Non-Inverting (V2-lead)' },
            ]}
            accentColor="cyan"
            icon="zap"
          />

          <TheoryTile
            title="Common-Mode Rejection (CMRR)"
            category="BRIDGE BALANCE"
            formula="Rf / R1 = Rg / R2"
            description="Perfect rejection of common-mode interference requires tight resistor ratio matching. Any resistance mismatch degrades the CMRR and allows noise pickup into Vout."
            specs={[
              { label: 'Balance State', value: results.isMatched ? 'Matched (Optimal)' : 'Imbalanced' },
              { label: 'Ideal CMRR', value: '∞ dB (Infinite)' },
              { label: 'Noise Rejection', value: 'Eliminates 50/60Hz Hum' },
            ]}
            accentColor="emerald"
            icon="check"
          />

          <TheoryTile
            title="Instrumentation Sensor Front-End"
            category="ENGINEERING APPLICATION"
            formula="Wheatstone Bridge Interface"
            description="Essential for reading tiny mV differential signals from strain gauges, thermocouples, and medical ECG leads floating on top of large ground-loop voltages."
            specs={[
              { label: 'Application', value: 'Strain Gauges & Sensors' },
              { label: 'Input Type', value: 'Floating Differential' },
              { label: 'Ground Isolation', value: 'High Loop Immunity' },
            ]}
            accentColor="amber"
            icon="zap"
          />
        </div>
      </div>
    </div>
  );
};
