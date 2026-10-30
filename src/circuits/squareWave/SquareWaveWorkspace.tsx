import React, { useState, useEffect } from 'react';
import { SquareWaveInputs, SquareWaveResults } from '../../types/circuit';
import { calculateSquareWave, validateSquareWaveInputs } from '../../calculations/squareWave';
import { generateAstableSquareWave, WaveformData } from '../../utils/waveformGenerator';
import { InputNumber } from '../../components/ui/InputNumber';
import { ResultCard } from '../../components/ui/ResultCard';
import { TheoryTile } from '../../components/ui/TheoryTile';
import { SquareWaveSchematicSvg } from '../../components/circuit/SquareWaveSchematicSvg';
import { CalculusWaveformGraph } from '../../components/circuit/CalculusWaveformGraph';
import { cleanFloat, formatResistance, formatCapacitance, formatFrequency } from '../../utils/formatters';
import { saveActiveCircuitState } from '../../utils/circuitStateBridge';
import { RotateCcw, Calculator, Zap, Eye, Activity, CheckCircle, Lightbulb } from 'lucide-react';

interface SquareWaveWorkspaceProps {
  onStatusChange?: (status: 'Ready' | 'Calculated' | 'Error', hasErrors: boolean) => void;
}

const DEFAULT_INPUTS: SquareWaveInputs = {
  posVsat: 12,
  negVsat: -12,
  r1: 10,
  r1Unit: 'kΩ',
  r2: 10,
  r2Unit: 'kΩ',
  r: 10,
  rUnit: 'kΩ',
  c: 0.01,
  cUnit: 'µF',
};

export const SquareWaveWorkspace: React.FC<SquareWaveWorkspaceProps> = ({
  onStatusChange,
}) => {
  const [inputs, setInputs] = useState<SquareWaveInputs>(DEFAULT_INPUTS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [results, setResults] = useState<SquareWaveResults>(() =>
    calculateSquareWave(DEFAULT_INPUTS)
  );
  const [viewMode, setViewMode] = useState<'waveform' | 'schematic'>('waveform');

  // Synchronize state with central bridge for Lab Mode and Exports
  useEffect(() => {
    saveActiveCircuitState('square-wave-generator', inputs, results);
  }, [inputs, results]);

  // Compute waveform data dynamically from current results
  const waveformData: WaveformData = generateAstableSquareWave(
    results.timePeriod,
    results.posVsat,
    results.negVsat,
    results.beta,
    results.rBase * results.cBase
  );

  const handleCalculate = () => {
    const validationErrors = validateSquareWaveInputs(inputs);

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
    const res = calculateSquareWave(inputs);
    setResults(res);
    onStatusChange?.('Calculated', false);
  };

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    setErrors({});
    const res = calculateSquareWave(DEFAULT_INPUTS);
    setResults(res);
    onStatusChange?.('Ready', false);
  };

  const applyDefaultPreset = () => {
    setInputs(DEFAULT_INPUTS);
    setErrors({});
    const res = calculateSquareWave(DEFAULT_INPUTS);
    setResults(res);
    onStatusChange?.('Calculated', false);
  };

  const applyAudioPreset = () => {
    // 1 kHz range: R = 10k, C = 0.045uF
    const p: SquareWaveInputs = {
      ...inputs,
      r: 10,
      rUnit: 'kΩ',
      c: 0.045,
      cUnit: 'µF',
      r1: 10,
      r1Unit: 'kΩ',
      r2: 10,
      r2Unit: 'kΩ',
    };
    setInputs(p);
    setErrors({});
    setResults(calculateSquareWave(p));
    onStatusChange?.('Calculated', false);
  };

  const applyHighFreqPreset = () => {
    // High frequency: R = 2.2k, C = 0.001uF (1 nF)
    const p: SquareWaveInputs = {
      ...inputs,
      r: 2.2,
      rUnit: 'kΩ',
      c: 1,
      cUnit: 'nF',
      r1: 10,
      r1Unit: 'kΩ',
      r2: 10,
      r2Unit: 'kΩ',
    };
    setInputs(p);
    setErrors({});
    setResults(calculateSquareWave(p));
    onStatusChange?.('Calculated', false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#0B0F19] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. MODULE TITLE & DESCRIPTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white">
              Square Wave Generator
            </h1>
            <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-mono uppercase tracking-wider bg-[#FF5722]/15 text-[#FF5722] border border-[#FF5722]/30">
              Relaxation Oscillator
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl font-sans">
            Generate continuous rail-to-rail square waves using an op-amp astable multivibrator with RC timing and regenerative feedback.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-[3px] text-xs font-mono text-slate-300 hover:text-white bg-[#0B0F19] hover:bg-[#111520] border border-white/10 transition-colors cursor-pointer"
            title="Reset parameters to standard defaults"
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
                  Oscillator Parameters
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#00F0FF] bg-[#111520] px-2 py-0.5 rounded-[2px] border border-white/5">SI Units</span>
            </div>

            {/* Timing Resistor R */}
            <InputNumber
              id="r"
              label="Timing Resistor (R)"
              symbol="R"
              value={inputs.r}
              unit={inputs.rUnit}
              unitOptions={['Ω', 'kΩ', 'MΩ']}
              onValueChange={(val) => setInputs({ ...inputs, r: val })}
              onUnitChange={(u) => setInputs({ ...inputs, rUnit: u })}
              step={1}
              min={0.01}
              helpText="Charging resistor in RC timing branch"
              error={errors.r}
            />

            {/* Timing Capacitor C */}
            <InputNumber
              id="c"
              label="Timing Capacitor (C)"
              symbol="C"
              value={inputs.c}
              unit={inputs.cUnit}
              unitOptions={['µF', 'nF', 'pF']}
              onValueChange={(val) => setInputs({ ...inputs, c: val })}
              onUnitChange={(u) => setInputs({ ...inputs, cUnit: u })}
              step={0.001}
              min={0.0001}
              helpText="Timing capacitor to ground"
              error={errors.c}
            />

            {/* Positive Feedback Divider R1 and R2 */}
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
                id="r2"
                label="Feedback Resistor (R2)"
                symbol="R2"
                value={inputs.r2}
                unit={inputs.r2Unit}
                unitOptions={['Ω', 'kΩ', 'MΩ']}
                onValueChange={(val) => setInputs({ ...inputs, r2: val })}
                onUnitChange={(u) => setInputs({ ...inputs, r2Unit: u })}
                step={1}
                min={0.01}
                helpText="Positive feedback resistor"
                error={errors.r2}
              />
            </div>

            {/* Saturation Voltage Rails */}
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
                helpText="Positive saturation rail"
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
                helpText="Negative saturation rail"
                error={errors.negVsat}
              />
            </div>

            {/* Presets */}
            <div className="pt-2 border-t border-white/10">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                Quick Operating Configurations:
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={applyDefaultPreset}
                  className="px-2 py-1 text-[11px] font-mono rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-slate-300 hover:text-[#00F0FF] border border-white/10 hover:border-[#00F0FF] transition-all cursor-pointer"
                  title="Default: R=10k, C=0.01uF, R1=10k, R2=10k"
                >
                  Standard (β = 0.5)
                </button>
                <button
                  type="button"
                  onClick={applyAudioPreset}
                  className="px-2 py-1 text-[11px] font-mono rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-slate-300 hover:text-[#00F0FF] border border-white/10 hover:border-[#00F0FF] transition-all cursor-pointer"
                  title="Audio: ~1 kHz"
                >
                  Audio (~1 kHz)
                </button>
                <button
                  type="button"
                  onClick={applyHighFreqPreset}
                  className="px-2 py-1 text-[11px] font-mono rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-slate-300 hover:text-[#00F0FF] border border-white/10 hover:border-[#00F0FF] transition-all cursor-pointer"
                  title="High Frequency: ~200 kHz"
                >
                  HF (1 nF)
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
              <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                Simulation Visualizer
              </span>
            </div>
            <div className="flex items-center gap-1 bg-[#0B0F19] p-1 rounded-[3px] border border-white/10 text-xs font-mono">
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
                <span>Oscilloscope (Dual-Trace)</span>
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
            {viewMode === 'waveform' && (
              <CalculusWaveformGraph
                data={waveformData}
                title={`Astable Square Wave Generator Output (@ ${formatFrequency(results.frequency)})`}
                inputLabel={`Capacitor Voltage Vc(t) [±${cleanFloat(results.beta * results.posVsat, 2)} V Thresholds]`}
                outputLabel="OUTPUT WAVEFORM (Saturated Square Wave)"
                expectedOutputWaveform={`Frequency ≈ ${formatFrequency(results.frequency)} | Period T ≈ ${cleanFloat(results.timePeriod * 1e3, 3)} ms | Duty Cycle ≈ 50%`}
              />
            )}

            {viewMode === 'schematic' && (
              <SquareWaveSchematicSvg
                r1Base={results.r1Base}
                r2Base={results.r2Base}
                rBase={results.rBase}
                cBase={results.cBase}
                posVsat={results.posVsat}
                negVsat={results.negVsat}
                frequency={results.frequency}
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
              Astable Oscillator Performance Metrics
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#00F0FF] flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Oscillation Established</span>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <ResultCard
            label="Feedback Factor"
            symbol="β"
            value={cleanFloat(results.beta, 4)}
            unit=""
            formula="R1 / (R1 + R2)"
            accentColor="slate"
            subtext={`R1=${formatResistance(results.r1Base)}, R2=${formatResistance(results.r2Base)}`}
          />
          <ResultCard
            label="Oscillation Period"
            symbol="T"
            value={results.timePeriod < 1e-3 ? cleanFloat(results.timePeriod * 1e6, 2) : cleanFloat(results.timePeriod * 1e3, 3)}
            unit={results.timePeriod < 1e-3 ? 'µs' : 'ms'}
            formula="2RC ln((1+β)/(1-β))"
            accentColor="amber"
            highlight={true}
            subtext="Total cycle time"
          />
          <ResultCard
            label="Output Frequency"
            symbol="f"
            value={cleanFloat(results.frequency, 2)}
            unit="Hz"
            formula="f = 1 / T"
            accentColor="cyan"
            highlight={true}
            subtext="Repetition rate"
          />
          <ResultCard
            label="Positive Peak"
            symbol="Vout(max)"
            value={`+${results.posVsat}`}
            unit="V"
            formula="≈ +Vsat"
            accentColor="emerald"
            subtext="Upper rail"
          />
          <ResultCard
            label="Negative Peak"
            symbol="Vout(min)"
            value={`${results.negVsat}`}
            unit="V"
            formula="≈ -Vsat"
            accentColor="slate"
            subtext="Lower rail"
          />
          <ResultCard
            label="Duty Cycle"
            symbol="D"
            value="50.0"
            unit="%"
            formula="THIGH / T × 100%"
            accentColor="cyan"
            highlight={true}
            subtext="Symmetric cycle"
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-mono">
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

          {/* STEP 2: TIME PERIOD */}
          <div className="p-3.5 rounded-[3px] border border-white/10 bg-[#111520] space-y-1.5 shadow-sm">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
              Step 2 — Time Period (T)
            </span>
            <div className="text-slate-400 font-mono text-[11px]">{results.steps.step2PeriodFormula}</div>
            <div className="text-slate-300 font-mono text-xs">{results.steps.step2PeriodSub}</div>
            <div className="text-amber-400 font-mono font-bold text-sm pt-1 border-t border-white/10">
              {results.steps.step2PeriodResult}
            </div>
          </div>

          {/* STEP 3: FREQUENCY */}
          <div className="p-3.5 rounded-[3px] border border-white/10 bg-[#111520] space-y-1.5 shadow-sm">
            <span className="text-[10px] text-[#00F0FF] font-bold uppercase tracking-wider block">
              Step 3 — Frequency (f)
            </span>
            <div className="text-slate-400 font-mono text-[11px]">{results.steps.step3FreqFormula}</div>
            <div className="text-slate-300 font-mono text-xs">{results.steps.step3FreqSub}</div>
            <div className="text-[#00F0FF] font-mono font-bold text-sm pt-1 border-t border-white/10">
              {results.steps.step3FreqResult}
            </div>
          </div>

          {/* STEP 4: OUTPUT LEVELS */}
          <div className="p-3.5 rounded-[3px] border border-white/10 bg-[#111520] space-y-1.5 shadow-sm">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Step 4 — Output Levels
            </span>
            <div className="text-slate-400 font-mono text-[11px]">Peak Rail Swings:</div>
            <div className="text-slate-200 font-mono text-xs pt-1 border-t border-white/10">{results.steps.step4Levels}</div>
          </div>

          {/* STEP 5: DUTY CYCLE */}
          <div className="p-3.5 rounded-[3px] border border-white/10 bg-[#111520] space-y-1.5 shadow-sm">
            <span className="text-[10px] text-[#00F0FF] font-bold uppercase tracking-wider block">
              Step 5 — Duty Cycle
            </span>
            <div className="text-slate-400 font-mono text-[11px]">Symmetric Switching:</div>
            <div className="text-[#00F0FF] font-mono font-bold text-sm pt-1 border-t border-white/10">
              {results.steps.step5Duty}
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
              Circuit Theory & Relaxation Fundamentals
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Autonomous Astable Multivibrator</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TheoryTile
            badge="Governing Period"
            title="Relaxation Timing Formula"
            formula="T = 2RC · ln((1 + β) / (1 - β)) | For β = 0.5: T ≈ 2.2RC"
            accentColor="cyan"
            description="The op-amp switches output whenever the capacitor voltage vc(t) reaches the reference threshold v+(t) = ±β Vsat. The charging interval is governed by the natural exponential RC response."
            bullets={[
              "Threshold fraction: β = R1 / (R1 + R2)",
              "Equal positive and negative rails yield an exact 50% duty cycle",
              "Standard R1 = R2 condition sets β = 0.5, giving T ≈ 2.2 RC"
            ]}
          />

          <TheoryTile
            badge="Capacitor Dynamics"
            title="Transient RC Charging Exponentials"
            formula="vc(t) = Vsat - (1 + β)Vsat · e^(-t / RC)"
            accentColor="orange"
            description="The capacitor never reaches full saturation ±Vsat. As soon as vc(t) crosses ±β Vsat, the regenerative Schmitt trigger flips states, immediately reversing the charging direction."
            bullets={[
              "Continuous charging and discharging between -β Vsat and +β Vsat",
              "Zero external input trigger required (pure self-sustaining oscillator)",
              "Capacitor voltage presents a clean pseudo-triangular ramp"
            ]}
          />

          <TheoryTile
            badge="Practical Limits"
            title="Slew Rate & High-Frequency Edge Quality"
            formula="f_max ≈ Slew Rate / (4 · Vsat)"
            accentColor="slate"
            description="At frequencies above 50 kHz, op-amp finite slew rate causes transition edges to slope, transforming crisp square edges into trapezoids. High-speed comparator ICs (e.g. LM311) are preferred for high-frequency clock generation."
            specs={{
              "Waveform Shape": "Bipolar square wave (50% duty cycle)",
              "Output Swing": "Switches between +Vsat and -Vsat rails",
              "Frequency Range": "0.1 Hz to 50 kHz (op-amp dependent)",
              "Core Application": "Clock generation, pulse width modulators, signal test sources"
            }}
          />
        </div>
      </div>
    </div>
  );
};
