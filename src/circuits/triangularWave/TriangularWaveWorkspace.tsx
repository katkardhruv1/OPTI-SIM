import React, { useState, useEffect } from 'react';
import { TriangularWaveInputs, TriangularWaveResults } from '../../types/circuit';
import { calculateTriangularWave, validateTriangularWaveInputs } from '../../calculations/triangularWave';
import { generateTriangularFromSquare, WaveformData } from '../../utils/waveformGenerator';
import { InputNumber } from '../../components/ui/InputNumber';
import { ResultCard } from '../../components/ui/ResultCard';
import { TheoryTile } from '../../components/ui/TheoryTile';
import { TriangularWaveSchematicSvg } from '../../components/circuit/TriangularWaveSchematicSvg';
import { CalculusWaveformGraph } from '../../components/circuit/CalculusWaveformGraph';
import { cleanFloat, formatResistance, formatCapacitance, formatFrequency } from '../../utils/formatters';
import { saveActiveCircuitState } from '../../utils/circuitStateBridge';
import { RotateCcw, Calculator, Zap, Eye, Activity, CheckCircle, Lightbulb } from 'lucide-react';

interface TriangularWaveWorkspaceProps {
  onStatusChange?: (status: 'Ready' | 'Calculated' | 'Error', hasErrors: boolean) => void;
}

const DEFAULT_INPUTS: TriangularWaveInputs = {
  amplitude: 12,
  amplitudeUnit: 'V',
  frequency: 1000,
  frequencyUnit: 'Hz',
  r: 10,
  rUnit: 'kΩ',
  c: 0.01,
  cUnit: 'µF',
  offset: 0,
};

export const TriangularWaveWorkspace: React.FC<TriangularWaveWorkspaceProps> = ({
  onStatusChange,
}) => {
  const [inputs, setInputs] = useState<TriangularWaveInputs>(DEFAULT_INPUTS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [results, setResults] = useState<TriangularWaveResults>(() =>
    calculateTriangularWave(DEFAULT_INPUTS)
  );
  const [viewMode, setViewMode] = useState<'waveform' | 'schematic'>('waveform');

  // Synchronize state with central bridge for Lab Mode and Exports
  useEffect(() => {
    saveActiveCircuitState('triangular-wave-generator', inputs, results);
  }, [inputs, results]);

  // Compute waveform by integrating square wave input
  const waveformData: WaveformData = generateTriangularFromSquare(
    results.ampBase,
    results.timePeriod,
    results.rcTimeConstant
  );

  const handleCalculate = () => {
    const validationErrors = validateTriangularWaveInputs(inputs);

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
    const res = calculateTriangularWave(inputs);
    setResults(res);
    onStatusChange?.('Calculated', false);
  };

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    setErrors({});
    const res = calculateTriangularWave(DEFAULT_INPUTS);
    setResults(res);
    onStatusChange?.('Ready', false);
  };

  const applyDefaultTest = () => {
    setInputs(DEFAULT_INPUTS);
    setErrors({});
    const res = calculateTriangularWave(DEFAULT_INPUTS);
    setResults(res);
    onStatusChange?.('Calculated', false);
  };

  const applyScaledTriangle = () => {
    // 5V amplitude, 1 kHz, R = 10k, C = 0.05 uF => Vpp = 5 * 1ms / (2 * 0.5ms) = 5V
    const p: TriangularWaveInputs = {
      ...inputs,
      amplitude: 5,
      frequency: 1000,
      r: 10,
      rUnit: 'kΩ',
      c: 0.05,
      cUnit: 'µF',
    };
    setInputs(p);
    setErrors({});
    setResults(calculateTriangularWave(p));
    onStatusChange?.('Calculated', false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#0B0F19] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. MODULE TITLE & DESCRIPTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white">
              Triangular Wave Generator
            </h1>
            <span className="px-2 py-0.5 rounded-[3px] text-[11px] font-mono uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">
              Waveform Converter
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            Generate a continuous triangular waveform using a square-wave oscillator and op-amp integrator. The constant voltage levels of the square wave produce constant charging currents into the feedback capacitor, creating linear positive and negative voltage ramps.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-mono text-slate-300 hover:text-white bg-[#111520] hover:bg-[#1A1E29] border border-white/10 transition-colors"
            title="Reset to standard defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleCalculate}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-[3px] text-xs font-mono font-bold text-[#0B0F19] bg-[#00F0FF] hover:bg-[#00F0FF]/90 border border-[#00F0FF]/40 shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all"
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
          <div className="p-4 sm:p-5 rounded-[3px] border border-white/10 bg-[#1A1E29] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#00F0FF]" />
                <h2 className="text-xs font-mono font-semibold text-slate-200 uppercase tracking-wider">
                  Generator Parameters
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Integrator Stage</span>
            </div>

            {/* Square Wave Input Amplitude */}
            <InputNumber
              id="amplitude"
              label="Square Wave Amplitude"
              symbol="Vin (pk)"
              value={inputs.amplitude}
              unit={inputs.amplitudeUnit}
              unitOptions={['V', 'mV']}
              onValueChange={(val) => setInputs({ ...inputs, amplitude: val })}
              onUnitChange={(u) => setInputs({ ...inputs, amplitudeUnit: u })}
              step={1}
              min={0.1}
              max={30}
              helpText="Peak amplitude of driving square wave"
              error={errors.amplitude}
            />

            {/* Frequency */}
            <InputNumber
              id="frequency"
              label="Square Wave Frequency"
              symbol="f"
              value={inputs.frequency}
              unit={inputs.frequencyUnit}
              unitOptions={['Hz', 'kHz']}
              onValueChange={(val) => setInputs({ ...inputs, frequency: val })}
              onUnitChange={(u) => setInputs({ ...inputs, frequencyUnit: u })}
              step={100}
              min={1}
              max={1000000}
              helpText="Repetition rate of square excitation"
              error={errors.frequency}
            />

            {/* Integrator Resistance R */}
            <InputNumber
              id="r"
              label="Integrator Resistance (R)"
              symbol="R"
              value={inputs.r}
              unit={inputs.rUnit}
              unitOptions={['Ω', 'kΩ', 'MΩ']}
              onValueChange={(val) => setInputs({ ...inputs, r: val })}
              onUnitChange={(u) => setInputs({ ...inputs, rUnit: u })}
              step={1}
              min={0.01}
              helpText="Series input resistor setting ramp slope"
              error={errors.r}
            />

            {/* Integrator Capacitance C */}
            <InputNumber
              id="c"
              label="Integrator Capacitance (C)"
              symbol="C"
              value={inputs.c}
              unit={inputs.cUnit}
              unitOptions={['µF', 'nF', 'pF']}
              onValueChange={(val) => setInputs({ ...inputs, c: val })}
              onUnitChange={(u) => setInputs({ ...inputs, cUnit: u })}
              step={0.001}
              min={0.0001}
              helpText="Feedback ramp integration capacitor"
              error={errors.c}
            />

            {/* Presets */}
            <div className="pt-2 border-t border-white/10">
              <div className="text-[11px] font-mono text-slate-400 mb-2">
                Operational Scenarios:
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={applyDefaultTest}
                  className="px-2.5 py-1.5 text-[11px] font-mono rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-[#00F0FF] border border-white/10 transition-colors"
                  title="Test 2: 12V, 1 kHz, 10k, 0.01uF => RC=100us"
                >
                  Academic Default (1 kHz)
                </button>
                <button
                  type="button"
                  onClick={applyScaledTriangle}
                  className="px-2.5 py-1.5 text-[11px] font-mono rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-emerald-400 border border-white/10 transition-colors"
                  title="5V input, C=0.05uF => 5Vpp triangle"
                >
                  Scaled (5 Vpp Output)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Waveform Scope or Circuit Schematic */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* View Mode Toggle Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#00F0FF]" />
              <span className="text-xs font-mono font-semibold text-slate-200 uppercase tracking-wider">
                Simulation Visualizer
              </span>
            </div>
            <div className="flex items-center gap-1 bg-[#0B0F19] p-0.5 rounded-[3px] border border-white/10 text-xs font-mono">
              <button
                type="button"
                onClick={() => setViewMode('waveform')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] transition-colors ${
                  viewMode === 'waveform'
                    ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Dual-Trace Waveform</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('schematic')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] transition-colors ${
                  viewMode === 'schematic'
                    ? 'bg-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Schematic</span>
              </button>
            </div>
          </div>

          {/* Active View Stage */}
          <div className="flex-1 flex flex-col min-h-[360px]">
            {viewMode === 'waveform' && (
              <CalculusWaveformGraph
                data={waveformData}
                title={`Square-to-Triangle Integration (@ ${formatFrequency(results.freqBase)})`}
                inputLabel={`INPUT: Square Wave (±${cleanFloat(results.ampBase, 1)} V)`}
                outputLabel={`OUTPUT: Integrated Triangle (Vpp ≈ ${cleanFloat(results.vpp, 1)} V)`}
                expectedOutputWaveform={`Linear slope: |dV/dt| = ${cleanFloat(results.outputSlope / 1e3, 2)} V/ms | Period T = ${cleanFloat(results.timePeriod * 1e3, 2)} ms`}
              />
            )}

            {viewMode === 'schematic' && (
              <TriangularWaveSchematicSvg
                squareAmp={inputs.amplitude}
                frequency={results.freqBase}
                rBase={results.rBase}
                cBase={results.cBase}
                vpp={results.vpp}
              />
            )}
          </div>
        </div>
      </div>

      {/* 3. KEY RESULTS PANEL */}
      <div className="p-4 sm:p-5 rounded-[3px] border border-white/10 bg-[#1A1E29] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00F0FF]" />
            <h2 className="text-xs font-mono font-semibold text-slate-200 uppercase tracking-wider">
              Triangular Waveform Generator Metrics
            </h2>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Linear Integration Active</span>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <ResultCard
            label="Square In Amplitude"
            symbol="Vin(pk)"
            value={`±${cleanFloat(results.ampBase, 1)} V`}
            formula="Source amplitude"
            accentColor="slate"
          />
          <ResultCard
            label="RC Time Constant"
            symbol="RC"
            value={results.rcTimeConstant < 1e-3 ? `${cleanFloat(results.rcTimeConstant * 1e6, 2)} µs` : `${cleanFloat(results.rcTimeConstant * 1e3, 3)} ms`}
            formula="R × C"
            accentColor="cyan"
            highlight={true}
            subtext={`R=${formatResistance(results.rBase)}, C=${formatCapacitance(results.cBase)}`}
          />
          <ResultCard
            label="Time Period"
            symbol="T"
            value={results.timePeriod < 1e-3 ? `${cleanFloat(results.timePeriod * 1e6, 2)} µs` : `${cleanFloat(results.timePeriod * 1e3, 3)} ms`}
            formula="1 / f"
            accentColor="slate"
            subtext={`f = ${formatFrequency(results.freqBase)}`}
          />
          <ResultCard
            label="Output Ramp Slope"
            symbol="|dVout/dt|"
            value={`${cleanFloat(results.outputSlope / 1e3, 1)} V/ms`}
            formula="|Vin| / RC"
            accentColor="amber"
            highlight={true}
            subtext="Linear slew rate"
          />
          <ResultCard
            label="Peak-to-Peak Output"
            symbol="Vpp"
            value={`${cleanFloat(results.vpp, 1)} V`}
            formula="Vin × T / (2RC)"
            accentColor="emerald"
            highlight={true}
            subtext={`Peak: ±${cleanFloat(results.vPeak, 1)} V`}
          />
          <ResultCard
            label="Waveform Profile"
            symbol="Shape"
            value="Triangular"
            formula="Linear Ramp"
            accentColor="cyan"
            subtext="Symmetric Triangle"
          />
        </div>
      </div>

      {/* 4. CALCULATION STEPS / PROOF */}
      <div className="p-4 sm:p-5 rounded-[3px] border border-white/10 bg-[#1A1E29] shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
          <Calculator className="w-4 h-4 text-[#00F0FF]" />
          <h2 className="text-xs font-mono font-semibold text-slate-200 uppercase tracking-wider">
            Step-by-Step Mathematical Derivation
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          {/* STEP 1: RC TIME CONSTANT */}
          <div className="p-3.5 rounded-[3px] border border-white/10 bg-[#111520] space-y-1.5">
            <span className="text-[10px] text-[#00F0FF] font-bold uppercase tracking-wider">
              Step 1 — RC Time Constant
            </span>
            <div className="text-slate-400">{results.steps.rcFormula}</div>
            <div className="text-slate-300">{results.steps.rcSub}</div>
            <div className="text-[#00F0FF] font-bold">{results.steps.rcResult}</div>
          </div>

          {/* STEP 2: TIME PERIOD */}
          <div className="p-3.5 rounded-[3px] border border-white/10 bg-[#111520] space-y-1.5">
            <span className="text-[10px] text-[#FF5722] font-bold uppercase tracking-wider">
              Step 2 — Time Period (T)
            </span>
            <div className="text-slate-400">{results.steps.periodFormula}</div>
            <div className="text-[#FF5722] font-bold">{results.steps.periodResult}</div>
          </div>

          {/* STEP 3: RAMP SLOPE */}
          <div className="p-3.5 rounded-[3px] border border-white/10 bg-[#111520] space-y-1.5">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              Step 3 — Linear Ramp Slope
            </span>
            <div className="text-slate-400">{results.steps.slopeFormula}</div>
            <div className="text-slate-300">{results.steps.slopeSub}</div>
            <div className="text-amber-400 font-bold">{results.steps.slopeResult}</div>
          </div>

          {/* STEP 4: PEAK-TO-PEAK VOLTAGE */}
          <div className="p-3.5 rounded-[3px] border border-white/10 bg-[#111520] space-y-1.5">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              Step 4 — Peak-to-Peak Amplitude
            </span>
            <div className="text-slate-400">{results.steps.vppFormula}</div>
            <div className="text-slate-300">{results.steps.vppSub}</div>
            <div className="text-emerald-400 font-bold">{results.steps.vppResult}</div>
          </div>
        </div>
      </div>

      {/* 5. THEORY & CIRCUIT FUNDAMENTALS */}
      <div className="p-4 sm:p-5 rounded-[3px] border border-white/10 bg-[#1A1E29] shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
          <Lightbulb className="w-4 h-4 text-[#00F0FF]" />
          <h2 className="text-xs font-mono font-semibold text-slate-200 uppercase tracking-wider">
            Theory & Circuit Fundamentals
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TheoryTile
            title="Continuous Integration Engine"
            microHeader="INTEGRATION PRINCIPLE"
            formula="Vpp = Vin / (2 · f · R · C)"
            description="Integrating a symmetrical square wave produces a linear triangular waveform with constant slope |Vin| / (RC)."
            bulletPoints={[
              "Positive half-period produces negative linear ramp slope -Vin/(RC)",
              "Negative half-period produces positive linear ramp slope +Vin/(RC)",
              "Symmetric charging creates balanced zero-centered triangle waves",
            ]}
            badgeText="Op-Amp Integrator"
            badgeVariant="cyan"
          />

          <TheoryTile
            title="Inverse Frequency-Amplitude Coupling"
            microHeader="SLOPE & TIMING DYNAMICS"
            formula="ΔV ∝ 1 / (f · R · C)"
            description="Because integration time is inversely proportional to frequency, doubling frequency cuts peak-to-peak amplitude by 50%."
            bulletPoints={[
              "Half-period duration T/2 = 1 / (2f) defines integration span",
              "Higher frequency allows less charge to accumulate on capacitor C",
              "Lower frequency risks op-amp rail saturation if Vpp exceeds supplies",
            ]}
            badgeText="Frequency Scaling"
            badgeVariant="orange"
          />

          <TheoryTile
            title="Laboratory Function Generator Architecture"
            microHeader="ANALOG WAVEFORM SYNTHESIS"
            description="Commercial laboratory signal generators cascade a Schmitt trigger relaxation oscillator into an active Miller integrator."
            bulletPoints={[
              "Square wave from Schmitt trigger drives integrator input directly",
              "Triangle wave can be shaped into sine waves via diode network",
              "Provides synchronous dual-waveform capability with zero phase jitter",
            ]}
            specs={[
              { label: 'Oscillator Stage', value: 'Schmitt Inverter' },
              { label: 'Integrator Stage', value: 'Active Miller' },
              { label: 'Ramp Linearity', value: '> 99.5%' },
            ]}
            badgeText="Cascade Topology"
            badgeVariant="slate"
          />
        </div>
      </div>
    </div>
  );
};
