import React, { useState, useEffect } from 'react';
import { FilterInputs, FilterResults, WaveformType } from '../../types/circuit';
import { calculateLowPassResponse, validateFilterInputs } from '../../calculations/activeFilter';
import { generateFilteredWaveform, WaveformData } from '../../utils/waveformGenerator';
import { InputNumber } from '../../components/ui/InputNumber';
import { ResultCard } from '../../components/ui/ResultCard';
import { TheoryTile } from '../../components/ui/TheoryTile';
import { LowPassFilterSchematicSvg } from '../../components/circuit/LowPassFilterSchematicSvg';
import { BodePlotGraph } from '../../components/circuit/BodePlotGraph';
import { UniversalWaveformScope } from '../../components/circuit/UniversalWaveformScope';
import { simulateActiveFilterWaveform } from '../../utils/waveformEngine';
import { cleanFloat, formatResistance, formatCapacitance, formatFrequency } from '../../utils/formatters';
import { saveActiveCircuitState } from '../../utils/circuitStateBridge';
import { RotateCcw, Calculator, Zap, Eye, Activity, CheckCircle, Lightbulb, BarChart2 } from 'lucide-react';

interface LowPassFilterWorkspaceProps {
  onStatusChange?: (status: 'Ready' | 'Calculated' | 'Error', hasErrors: boolean) => void;
}

const DEFAULT_INPUTS: FilterInputs = {
  passbandGain: 1,
  r: 10,
  rUnit: 'kΩ',
  c: 0.01,
  cUnit: 'µF',
  vin: 2,
  vinUnit: 'V',
  frequency: 100,
  frequencyUnit: 'Hz',
  waveform: 'sine',
};

export const LowPassFilterWorkspace: React.FC<LowPassFilterWorkspaceProps> = ({
  onStatusChange,
}) => {
  const [inputs, setInputs] = useState<FilterInputs>(DEFAULT_INPUTS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [results, setResults] = useState<FilterResults>(() =>
    calculateLowPassResponse(DEFAULT_INPUTS)
  );
  const [viewMode, setViewMode] = useState<'bode' | 'schematic' | 'waveform'>('bode');

  // Synchronize state with central bridge for Lab Mode and Exports
  useEffect(() => {
    saveActiveCircuitState('low-pass-filter', inputs, results);
  }, [inputs, results]);

  // Compute waveform data dynamically from current results
  const waveformData: WaveformData = generateFilteredWaveform(
    inputs.waveform,
    results.vinBase,
    results.freqBase,
    results.gainMag,
    results.phaseShiftDeg
  );

  const handleCalculate = () => {
    const validationErrors = validateFilterInputs(inputs);

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
    const res = calculateLowPassResponse(inputs);
    setResults(res);
    onStatusChange?.('Calculated', false);
  };

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    setErrors({});
    const res = calculateLowPassResponse(DEFAULT_INPUTS);
    setResults(res);
    onStatusChange?.('Ready', false);
  };

  const setWaveform = (wf: WaveformType) => {
    const updated = { ...inputs, waveform: wf };
    setInputs(updated);
    const res = calculateLowPassResponse(updated);
    setResults(res);
  };

  const applyPresetAtCutoff = () => {
    // Set frequency exactly at cutoff fc ≈ 1591.55 Hz
    const p: FilterInputs = {
      ...inputs,
      frequency: 1592,
      frequencyUnit: 'Hz',
    };
    setInputs(p);
    setErrors({});
    const res = calculateLowPassResponse(p);
    setResults(res);
    onStatusChange?.('Calculated', false);
  };

  const applyPresetPassband = () => {
    // Low frequency deep in passband: 100 Hz
    const p: FilterInputs = {
      ...inputs,
      frequency: 100,
      frequencyUnit: 'Hz',
    };
    setInputs(p);
    setErrors({});
    const res = calculateLowPassResponse(p);
    setResults(res);
    onStatusChange?.('Calculated', false);
  };

  const applyPresetStopband = () => {
    // High frequency deep in stopband: 15 kHz
    const p: FilterInputs = {
      ...inputs,
      frequency: 15,
      frequencyUnit: 'kHz',
    };
    setInputs(p);
    setErrors({});
    const res = calculateLowPassResponse(p);
    setResults(res);
    onStatusChange?.('Calculated', false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#090e1a] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. MODULE TITLE & DESCRIPTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white">
              First-Order Low-Pass Filter
            </h1>
            <span className="px-2 py-0.5 rounded-[2px] text-[11px] font-mono uppercase bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30">
              Active Butterworth
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            Analyze the frequency response of a first-order active low-pass filter. Frequencies below cutoff{' '}
            <span className="text-amber-400 font-mono">fc</span> pass with passband gain{' '}
            <span className="text-[#00F0FF] font-mono">A</span>, attenuating at{' '}
            <span className="text-[#00F0FF] font-mono">-20 dB/decade</span> beyond the corner.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[3px] text-xs font-mono text-slate-300 hover:text-white bg-[#111520] hover:bg-[#161c2b] border border-white/10 transition-colors cursor-pointer"
            title="Reset parameters to standard academic defaults"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleCalculate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-[3px] text-xs font-mono font-bold text-[#0B0F19] bg-[#00F0FF] hover:bg-[#00d8e6] shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-colors cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Calculate</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN SPLIT: CONTROLS & DIAGRAM/BODE PLOT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Parameters & Waveform Selection */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-4 sm:p-5 rounded-[3px] border border-white/10 bg-[#1A1E29] space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#00F0FF]" />
                <h2 className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
                  Filter Parameters
                </h2>
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase">SI Units</span>
            </div>

            {/* Input Voltage */}
            <InputNumber
              id="vin"
              label="Input Voltage Amplitude"
              symbol="Vin"
              value={inputs.vin}
              unit={inputs.vinUnit}
              unitOptions={['V', 'mV']}
              onValueChange={(val) => setInputs({ ...inputs, vin: val })}
              onUnitChange={(u) => setInputs({ ...inputs, vinUnit: u })}
              step={0.1}
              min={0.01}
              max={100}
              helpText="Peak AC test voltage"
              error={errors.vin}
            />

            {/* Passband Gain */}
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Passband Gain (A)
              </label>
              <div className="flex rounded-[3px] border border-white/10 bg-[#0B0F19] overflow-hidden focus-within:border-[#00F0FF] focus-within:ring-1 focus-within:ring-[#00F0FF]/40">
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="100"
                  value={inputs.passbandGain}
                  onChange={(e) => setInputs({ ...inputs, passbandGain: parseFloat(e.target.value) || 1 })}
                  className="w-full bg-transparent px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                />
                <span className="px-3 py-1.5 text-[11px] font-mono text-slate-400 bg-[#111520] border-l border-white/10">
                  V/V
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                A = 1 + Rf / R1 (set to 1 for unity buffer, 2 for +6 dB)
              </p>
            </div>

            {/* Filter Resistance R */}
            <InputNumber
              id="r"
              label="Filter Resistance (R)"
              symbol="R"
              value={inputs.r}
              unit={inputs.rUnit}
              unitOptions={['Ω', 'kΩ', 'MΩ']}
              onValueChange={(val) => setInputs({ ...inputs, r: val })}
              onUnitChange={(u) => setInputs({ ...inputs, rUnit: u })}
              step={1}
              min={0.01}
              max={1000}
              helpText="Series filter resistor forming pole with C"
              error={errors.r}
            />

            {/* Filter Capacitance C */}
            <InputNumber
              id="c"
              label="Filter Capacitance (C)"
              symbol="C"
              value={inputs.c}
              unit={inputs.cUnit}
              unitOptions={['µF', 'nF', 'pF']}
              onValueChange={(val) => setInputs({ ...inputs, c: val })}
              onUnitChange={(u) => setInputs({ ...inputs, cUnit: u })}
              step={0.001}
              min={0.0001}
              max={1000}
              helpText="Shunt filter capacitor connected to ground"
              error={errors.c}
            />

            {/* Operating Test Frequency */}
            <InputNumber
              id="frequency"
              label="Test Frequency"
              symbol="f"
              value={inputs.frequency}
              unit={inputs.frequencyUnit}
              unitOptions={['Hz', 'kHz']}
              onValueChange={(val) => setInputs({ ...inputs, frequency: val })}
              onUnitChange={(u) => setInputs({ ...inputs, frequencyUnit: u })}
              step={10}
              min={1}
              max={1000000}
              helpText="Input excitation frequency to evaluate attenuation"
              error={errors.frequency}
            />

            {/* Waveform Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-mono text-slate-300">
                Input Waveform
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['sine', 'square', 'triangle'] as WaveformType[]).map((wf) => (
                  <button
                    key={wf}
                    type="button"
                    onClick={() => setWaveform(wf)}
                    className={`py-1.5 px-2 rounded-[3px] text-xs font-mono capitalize transition-all border cursor-pointer ${
                      inputs.waveform === wf
                        ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF] font-semibold'
                        : 'bg-[#0B0F19] text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {wf}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Academic Presets */}
            <div className="pt-2 border-t border-white/10">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                Quick Operating Scenarios:
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={applyPresetPassband}
                  className="px-2 py-1 text-[11px] font-mono rounded-[2px] bg-[#111520] hover:bg-[#161c2b] text-slate-300 hover:text-[#00F0FF] border border-white/10 transition-colors cursor-pointer"
                  title="f << fc (100 Hz)"
                >
                  Passband (f ≪ fc)
                </button>
                <button
                  type="button"
                  onClick={applyPresetAtCutoff}
                  className="px-2 py-1 text-[11px] font-mono rounded-[2px] bg-[#111520] hover:bg-[#161c2b] text-amber-400 border border-white/10 transition-colors cursor-pointer"
                  title="f = fc (~1.59 kHz)"
                >
                  At Cutoff (f = fc)
                </button>
                <button
                  type="button"
                  onClick={applyPresetStopband}
                  className="px-2 py-1 text-[11px] font-mono rounded-[2px] bg-[#111520] hover:bg-[#161c2b] text-slate-300 hover:text-[#00F0FF] border border-white/10 transition-colors cursor-pointer"
                  title="f >> fc (15 kHz)"
                >
                  Stopband (f ≫ fc)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Bode Plot, Waveform Scope, or Circuit Schematic */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* View Mode Toggle Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#00F0FF]" />
              <span className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
                Simulation Visualizer
              </span>
            </div>
            <div className="flex items-center gap-1 bg-[#0B0F19] p-0.5 rounded-[3px] border border-white/10 text-xs font-mono">
              <button
                type="button"
                onClick={() => setViewMode('bode')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                  viewMode === 'bode'
                    ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Bode Plot</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('waveform')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                  viewMode === 'waveform'
                    ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Oscilloscope</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('schematic')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                  viewMode === 'schematic'
                    ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Schematic</span>
              </button>
            </div>
          </div>

          {/* Active View Stage */}
          <div className="flex-1 flex flex-col min-h-[360px]">
            {viewMode === 'bode' && (
              <BodePlotGraph
                fc={results.fc}
                passbandGain={results.passbandGain}
                testFreq={results.freqBase}
                filterType="low-pass"
              />
            )}

            {viewMode === 'waveform' && (
              <UniversalWaveformScope
                simulation={simulateActiveFilterWaveform({
                  inputParams: {
                    waveform: inputs.waveform,
                    amplitude: results.vinBase,
                    frequency: results.freqBase,
                    phaseDeg: 0,
                    dcOffset: 0,
                  },
                  cutoffFreq: results.fc,
                  passbandGain: results.passbandGain,
                  filterType: 'low-pass',
                  posVsat: 15,
                  negVsat: -15,
                })}
                title="FIRST-ORDER LOW-PASS FILTER WAVEFORM SIMULATION"
                subtitle={`fc = ${formatFrequency(results.fc)} | Test f = ${formatFrequency(results.freqBase)} | |H(f)| = ${cleanFloat(results.gainMag, 3)} (${cleanFloat(results.gainDb, 1)} dB)`}
                insight="Low-frequency components pass with little attenuation (|H(f)| ≈ A). Frequencies beyond cutoff fc attenuate at -20 dB/decade with a phase lag approaching -90° (-45° at fc)."
              />
            )}

            {viewMode === 'schematic' && (
              <LowPassFilterSchematicSvg
                vin={inputs.vin}
                vinUnit={inputs.vinUnit}
                rBase={results.rBase}
                cBase={results.cBase}
                passbandGain={inputs.passbandGain}
                fc={results.fc}
                vout={results.vout}
              />
            )}
          </div>
        </div>
      </div>

      {/* 3. KEY CALCULATION RESULTS PANEL: Infographic-Style Analytical Data Blocks */}
      <div className="p-4 sm:p-5 rounded-[3px] border border-white/10 bg-[#1A1E29] space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00F0FF]" />
            <h2 className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
              Filter Calculation Results
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[#00F0FF] uppercase flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Active Filter Evaluated</span>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <ResultCard
            label="Cutoff Frequency"
            symbol="fc"
            value={formatFrequency(results.fc)}
            formula="fc = 1 / (2πRC)"
            accentColor="amber"
            highlight={true}
            subtext={`RC = ${cleanFloat(results.rcTimeConstant, 6)} s`}
          />
          <ResultCard
            label="Frequency Ratio"
            symbol="f / fc"
            value={cleanFloat(results.freqRatio, 3)}
            formula="f / fc"
            accentColor="slate"
            subtext={
              results.freqRatio < 1
                ? 'Passband region'
                : results.freqRatio === 1
                ? 'Corner -3dB point'
                : 'Stopband region'
            }
          />
          <ResultCard
            label="Gain Magnitude"
            symbol="|H(f)|"
            value={`${cleanFloat(results.gainMag, 4)}×`}
            formula="A / √(1 + (f/fc)²)"
            accentColor="cyan"
            highlight={true}
            subtext={`Passband A = ${results.passbandGain}×`}
          />
          <ResultCard
            label="Gain in Decibels"
            symbol="Gain(dB)"
            value={`${cleanFloat(results.gainDb, 2)} dB`}
            formula="20 log10(|H(f)|)"
            accentColor={results.gainDb < -3 ? 'amber' : 'cyan'}
            subtext="Logarithmic power ratio"
          />
          <ResultCard
            label="Output Voltage"
            symbol="Vout"
            value={`${cleanFloat(results.vout, 3)} V`}
            formula="Vin × |H(f)|"
            accentColor="emerald"
            highlight={true}
            subtext={`Vin = ${cleanFloat(results.vinBase, 2)} V`}
          />
          <ResultCard
            label="Phase Shift"
            symbol="θ"
            value={`${cleanFloat(results.phaseShiftDeg, 1)}°`}
            formula="-arctan(f / fc)"
            accentColor="slate"
            subtext="Phase lag"
          />
        </div>
      </div>

      {/* 4. STEP-BY-STEP MATHEMATICAL DERIVATION */}
      <div className="p-4 sm:p-5 rounded-[3px] border border-white/10 bg-[#1A1E29] space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#00F0FF]" />
            <h2 className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
              Step-by-Step Mathematical Derivation & Proof
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[#00F0FF] uppercase">
            6-Stage Analytical Proof
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
          {/* Step 1: RC Time Constant */}
          <div className="p-3.5 rounded-[3px] border border-white/10 bg-[#111520] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                STEP 01: RC TIME CONSTANT (τ)
              </span>
              <span className="text-[10px] text-[#00F0FF] bg-[#0B0F19] px-1.5 py-0.5 rounded-[2px] border border-white/10">τ = R × C</span>
            </div>
            <div className="text-white font-semibold">{results.steps.rcFormula}</div>
            <div className="text-slate-400 text-[11px]">{results.steps.rcSubstitution}</div>
            <div className="text-[#00F0FF] font-bold text-sm pt-1 border-t border-white/10">{results.steps.rcResult}</div>
          </div>

          {/* Step 2: Cutoff Frequency */}
          <div className="p-3.5 rounded-[3px] border border-white/10 bg-[#111520] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                STEP 02: CUTOFF FREQUENCY (fc)
              </span>
              <span className="text-[10px] text-[#00F0FF] bg-[#0B0F19] px-1.5 py-0.5 rounded-[2px] border border-white/10">Pole</span>
            </div>
            <div className="text-white font-semibold">{results.steps.fcFormula}</div>
            <div className="text-slate-400 text-[11px]">{results.steps.fcSubstitution}</div>
            <div className="text-[#00F0FF] font-bold text-sm pt-1 border-t border-white/10">{results.steps.fcResult}</div>
          </div>

          {/* Step 3: Normalized Frequency Ratio */}
          <div className="p-3.5 rounded-[3px] border border-white/10 bg-[#111520] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                STEP 03: NORMALIZED FREQUENCY (f / fc)
              </span>
              <span className="text-[10px] text-[#00F0FF] bg-[#0B0F19] px-1.5 py-0.5 rounded-[2px] border border-white/10">Ratio</span>
            </div>
            <div className="text-white font-semibold">{results.steps.ratioFormula}</div>
            <div className="text-slate-400 text-[11px]">{results.steps.ratioResult}</div>
            <div className="text-[#00F0FF] font-bold text-sm pt-1 border-t border-white/10">
              {results.freqRatio < 1
                ? 'f < fc (Passband)'
                : results.freqRatio === 1
                ? 'f = fc (-3 dB Point)'
                : 'f > fc (Stopband Attenuation)'}
            </div>
          </div>

          {/* Step 4: Gain Magnitude Transfer Function */}
          <div className="p-3.5 rounded-[3px] border border-white/10 bg-[#111520] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                STEP 04: MAGNITUDE RESPONSE |H(f)|
              </span>
              <span className="text-[10px] text-[#00F0FF] bg-[#0B0F19] px-1.5 py-0.5 rounded-[2px] border border-white/10">Transfer</span>
            </div>
            <div className="text-white font-semibold">{results.steps.hFormula}</div>
            <div className="text-slate-400 text-[11px]">{results.steps.hSubstitution}</div>
            <div className="text-[#00F0FF] font-bold text-sm pt-1 border-t border-white/10">{results.steps.hResult}</div>
          </div>

          {/* Step 5: Output Voltage */}
          <div className="p-3.5 rounded-[3px] border border-white/10 bg-[#111520] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                STEP 05: OUTPUT VOLTAGE (Vout)
              </span>
              <span className="text-[10px] text-[#FF5722] bg-[#0B0F19] px-1.5 py-0.5 rounded-[2px] border border-white/10">Voltage</span>
            </div>
            <div className="text-white font-semibold">{results.steps.voutFormula}</div>
            <div className="text-slate-400 text-[11px]">{results.steps.voutSubstitution}</div>
            <div className="text-[#FF5722] font-bold text-sm pt-1 border-t border-white/10">{results.steps.voutResult}</div>
          </div>

          {/* Step 6: Decibel Gain */}
          <div className="p-3.5 rounded-[3px] border border-white/10 bg-[#111520] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                STEP 06: LOGARITHMIC GAIN & PHASE
              </span>
              <span className="text-[10px] text-[#00F0FF] bg-[#0B0F19] px-1.5 py-0.5 rounded-[2px] border border-white/10">Bode</span>
            </div>
            <div className="text-white font-semibold">{results.steps.dbFormula}</div>
            <div className="text-slate-400 text-[11px]">{results.steps.dbResult}</div>
            <div className="text-amber-400 font-bold text-sm pt-1 border-t border-white/10">
              Phase Shift: {cleanFloat(results.phaseShiftDeg, 2)}°
            </div>
          </div>
        </div>
      </div>

      {/* 5. THEORY & ENGINEERING INSIGHTS: Modular Infographic Grid */}
      <div className="p-4 sm:p-5 rounded-[3px] border border-white/10 bg-[#1A1E29] space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[#00F0FF]" />
            <h2 className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
              Theory & Circuit Fundamentals
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            ENTC Coursework
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TheoryTile
            title="The -3 dB Cutoff Definition"
            category="HALF-POWER CORNER"
            formula="fc = 1 / (2πRC)"
            description="At the corner frequency fc, capacitive reactance equals resistance (Xc = R). The transfer gain drops to 1/√2 (≈ 70.7%) of passband gain, exactly -3.01 dB power loss."
            specs={[
              { label: 'Gain Drop', value: '-3.01 dB (Half-Power)' },
              { label: 'Corner Phase', value: '-45.0° Phase Lag' },
              { label: 'Condition', value: 'Xc = R' },
            ]}
            accentColor="cyan"
            icon="zap"
          />

          <TheoryTile
            title="First-Order -20 dB/Decade Roll-Off"
            category="ASYMPTOTIC SLOPE"
            formula="Slope = -20 dB/decade (-6 dB/octave)"
            description="With a single reactive capacitor pole, each decade increase in stopband frequency (10x frequency) divides the output amplitude by 10 (-20 dB attenuation rate)."
            specs={[
              { label: 'Roll-Off Rate', value: '-20 dB / Decade' },
              { label: 'Octave Slope', value: '-6 dB / Octave' },
              { label: 'Stopband Phase', value: '-90° Asymptote' },
            ]}
            accentColor="emerald"
            icon="check"
          />

          <TheoryTile
            title="Active vs Passive Stage Buffering"
            category="IMPEDANCE ADVANTAGE"
            formula="Zin ≈ ∞ | Zout ≈ 0 Ω"
            description="Active op-amp implementation prevents load pulling. Subsequent stages do not change the cutoff frequency or load down the RC frequency-selective network."
            specs={[
              { label: 'Load Immunity', value: 'Complete (Buffered)' },
              { label: 'Passband Gain', value: 'Adjustable A ≥ 1' },
              { label: 'Topology', value: 'Sallen-Key / Non-Inv' },
            ]}
            accentColor="amber"
            icon="zap"
          />
        </div>
      </div>
    </div>
  );
};
