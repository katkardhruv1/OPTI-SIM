import React, { useState, useEffect } from 'react';
import { PWMInputs, PWMResults } from '../../types/circuit';
import { calculatePWM, validatePWMInputs } from '../../calculations/pwm';
import { generatePWMWaveformData, PWMWaveformData } from '../../utils/waveformGenerator';
import { InputNumber } from '../../components/ui/InputNumber';
import { ResultCard } from '../../components/ui/ResultCard';
import { TheoryTile } from '../../components/ui/TheoryTile';
import { PWMSchematicSvg } from '../../components/circuit/PWMSchematicSvg';
import { PWMWaveformGraph } from '../../components/circuit/PWMWaveformGraph';
import { cleanFloat, formatFrequency } from '../../utils/formatters';
import { saveActiveCircuitState } from '../../utils/circuitStateBridge';
import { RotateCcw, Calculator, Zap, Eye, Activity, CheckCircle, Lightbulb } from 'lucide-react';

interface PWMWorkspaceProps {
  onStatusChange?: (status: 'Ready' | 'Calculated' | 'Error', hasErrors: boolean) => void;
}

const DEFAULT_INPUTS: PWMInputs = {
  carrierFreq: 1000,
  carrierFreqUnit: 'Hz',
  carrierAmp: 5,
  vMin: 0,
  vMax: 5,
  vControl: 2.5,
  pwmMode: 'comparator-based',
};

export const PWMWorkspace: React.FC<PWMWorkspaceProps> = ({
  onStatusChange,
}) => {
  const [inputs, setInputs] = useState<PWMInputs>(DEFAULT_INPUTS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [results, setResults] = useState<PWMResults>(() =>
    calculatePWM(DEFAULT_INPUTS)
  );
  const [viewMode, setViewMode] = useState<'waveform' | 'schematic'>('waveform');

  // Synchronize state with central bridge for Lab Mode and Exports
  useEffect(() => {
    saveActiveCircuitState('pwm-generator', inputs, results);
  }, [inputs, results]);

  // Compute 3-trace PWM waveform data
  const waveformData: PWMWaveformData = generatePWMWaveformData(
    results.carrierFreq,
    results.vMin,
    results.vMax,
    results.vControl
  );

  const handleCalculate = () => {
    const validationErrors = validatePWMInputs(inputs);

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
    const res = calculatePWM(inputs);
    setResults(res);
    onStatusChange?.('Calculated', false);
  };

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    setErrors({});
    const res = calculatePWM(DEFAULT_INPUTS);
    setResults(res);
    onStatusChange?.('Ready', false);
  };

  // Test A: 50% Duty Cycle (Vcontrol = 2.5V)
  const applyTestA = () => {
    const p: PWMInputs = {
      ...inputs,
      vControl: 2.5,
      vMin: 0,
      vMax: 5,
      carrierFreq: 1000,
    };
    setInputs(p);
    setErrors({});
    setResults(calculatePWM(p));
    onStatusChange?.('Calculated', false);
  };

  // Test B: 25% Duty Cycle (Vcontrol = 1.25V)
  const applyTestB = () => {
    const p: PWMInputs = {
      ...inputs,
      vControl: 1.25,
      vMin: 0,
      vMax: 5,
      carrierFreq: 1000,
    };
    setInputs(p);
    setErrors({});
    setResults(calculatePWM(p));
    onStatusChange?.('Calculated', false);
  };

  // Test C: 75% Duty Cycle (Vcontrol = 3.75V)
  const applyTestC = () => {
    const p: PWMInputs = {
      ...inputs,
      vControl: 3.75,
      vMin: 0,
      vMax: 5,
      carrierFreq: 1000,
    };
    setInputs(p);
    setErrors({});
    setResults(calculatePWM(p));
    onStatusChange?.('Calculated', false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#0B0F19] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. MODULE TITLE & DESCRIPTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white">
              PWM Generator
            </h1>
            <span className="px-2 py-0.5 rounded-[3px] text-[11px] font-mono uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">
              Pulse Width Modulator
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            Generate a pulse-width-modulated signal by comparing a control voltage with a carrier waveform. As the DC control level varies relative to the triangular carrier bounds, the comparator output duty cycle changes proportionally from 0% to 100%.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-mono text-slate-300 hover:text-white bg-[#111520] hover:bg-[#1A1E29] border border-white/10 transition-colors"
            title="Reset parameters to standard defaults"
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
                  Modulator Parameters
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Comparator Mode</span>
            </div>

            {/* Control Voltage */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300 font-mono">
                  Control Voltage (Vcontrol)
                </label>
                <span className="text-xs font-mono text-[#00F0FF] font-bold">
                  {cleanFloat(inputs.vControl, 2)} V
                </span>
              </div>
              <input
                type="range"
                min={inputs.vMin}
                max={inputs.vMax}
                step={0.05}
                value={inputs.vControl}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  const updated = { ...inputs, vControl: val };
                  setInputs(updated);
                  setResults(calculatePWM(updated));
                }}
                className="w-full accent-[#00F0FF] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>0% Duty ({inputs.vMin}V)</span>
                <span>50% Duty ({(inputs.vMin + inputs.vMax) / 2}V)</span>
                <span>100% Duty ({inputs.vMax}V)</span>
              </div>
            </div>

            {/* Precise Input Voltage */}
            <InputNumber
              id="vControl"
              label="Control Voltage (Direct Entry)"
              symbol="Vctrl"
              value={inputs.vControl}
              unit="V"
              onValueChange={(val) => setInputs({ ...inputs, vControl: val })}
              step={0.1}
              helpText="Analog modulation voltage input"
              error={errors.vControl}
            />

            {/* Carrier Frequency */}
            <InputNumber
              id="carrierFreq"
              label="Carrier Frequency"
              symbol="fc"
              value={inputs.carrierFreq}
              unit={inputs.carrierFreqUnit}
              unitOptions={['Hz', 'kHz']}
              onValueChange={(val) => setInputs({ ...inputs, carrierFreq: val })}
              onUnitChange={(u) => setInputs({ ...inputs, carrierFreqUnit: u })}
              step={100}
              min={1}
              helpText="Frequency of triangular carrier"
              error={errors.carrierFreq}
            />

            {/* Carrier Bounds */}
            <div className="grid grid-cols-2 gap-3">
              <InputNumber
                id="vMin"
                label="Carrier Minimum (Vmin)"
                symbol="Vmin"
                value={inputs.vMin}
                unit="V"
                onValueChange={(val) => setInputs({ ...inputs, vMin: val })}
                step={0.5}
                helpText="Lower carrier peak"
                error={errors.vMin}
              />
              <InputNumber
                id="vMax"
                label="Carrier Maximum (Vmax)"
                symbol="Vmax"
                value={inputs.vMax}
                unit="V"
                onValueChange={(val) => setInputs({ ...inputs, vMax: val })}
                step={0.5}
                helpText="Upper carrier peak"
                error={errors.vMax}
              />
            </div>

            {/* Presets */}
            <div className="pt-2 border-t border-white/10">
              <div className="text-[11px] font-mono text-slate-400 mb-2">
                Standard Test Cases:
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={applyTestB}
                  className="px-2 py-1.5 text-[11px] font-mono rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-[#00F0FF] border border-white/10 transition-colors"
                  title="Test B: Vcontrol = 1.25 V -> 25% Duty"
                >
                  Test B (25% Duty)
                </button>
                <button
                  type="button"
                  onClick={applyTestA}
                  className="px-2 py-1.5 text-[11px] font-mono rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-emerald-400 border border-white/10 transition-colors"
                  title="Test A: Vcontrol = 2.5 V -> 50% Duty"
                >
                  Test A (50% Duty)
                </button>
                <button
                  type="button"
                  onClick={applyTestC}
                  className="px-2 py-1.5 text-[11px] font-mono rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-[#FF5722] border border-white/10 transition-colors"
                  title="Test C: Vcontrol = 3.75 V -> 75% Duty"
                >
                  Test C (75% Duty)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 3-Trace Waveform Scope or Circuit Schematic */}
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
                <span>Oscilloscope (3-Trace)</span>
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
              <PWMWaveformGraph
                data={waveformData}
                carrierFreq={results.carrierFreq}
                dutyCycle={results.dutyCycle}
                vControl={results.vControl}
                vMin={results.vMin}
                vMax={results.vMax}
              />
            )}

            {viewMode === 'schematic' && (
              <PWMSchematicSvg
                carrierFreq={results.carrierFreq}
                carrierAmp={results.carrierAmp}
                vControl={results.vControl}
                dutyCycle={results.dutyCycle}
                vMin={results.vMin}
                vMax={results.vMax}
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
              Pulse Width Modulation Performance Metrics
            </h2>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Modulation Active</span>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <ResultCard
            label="Carrier Frequency"
            symbol="fc"
            value={formatFrequency(results.carrierFreq)}
            formula="Carrier rate"
            accentColor="amber"
          />
          <ResultCard
            label="Control Voltage"
            symbol="Vctrl"
            value={`${cleanFloat(results.vControl, 2)} V`}
            formula="Analog input"
            accentColor="emerald"
            highlight={true}
            subtext={`Carrier: ${results.vMin}V–${results.vMax}V`}
          />
          <ResultCard
            label="PWM Duty Cycle"
            symbol="Duty"
            value={`${cleanFloat(results.dutyCycle, 1)}%`}
            formula="(Vctrl-Vmin)/(Vmax-Vmin)"
            accentColor="cyan"
            highlight={true}
            subtext="Pulse high ratio"
          />
          <ResultCard
            label="PWM Period"
            symbol="T"
            value={results.timePeriod < 1e-3 ? `${cleanFloat(results.timePeriod * 1e6, 2)} µs` : `${cleanFloat(results.timePeriod * 1e3, 3)} ms`}
            formula="1 / fc"
            accentColor="slate"
          />
          <ResultCard
            label="High Time"
            symbol="THIGH"
            value={results.tHigh < 1e-3 ? `${cleanFloat(results.tHigh * 1e6, 2)} µs` : `${cleanFloat(results.tHigh * 1e3, 3)} ms`}
            formula="Duty × T"
            accentColor="cyan"
            subtext="Pulse duration"
          />
          <ResultCard
            label="Low Time"
            symbol="TLOW"
            value={results.tLow < 1e-3 ? `${cleanFloat(results.tLow * 1e6, 2)} µs` : `${cleanFloat(results.tLow * 1e3, 3)} ms`}
            formula="T - THIGH"
            accentColor="slate"
            subtext="Rest duration"
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-mono">
          {/* STEP 1: CARRIER PERIOD */}
          <div className="p-3 rounded-[3px] border border-white/10 bg-[#111520] space-y-1.5">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              Step 1 — Carrier Period
            </span>
            <div className="text-slate-400">{results.steps.periodFormula}</div>
            <div className="text-amber-400 font-bold">{results.steps.periodResult}</div>
          </div>

          {/* STEP 2: NORMALIZED CONTROL LEVEL */}
          <div className="p-3 rounded-[3px] border border-white/10 bg-[#111520] space-y-1.5">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              Step 2 — Control Ratio
            </span>
            <div className="text-slate-400">{results.steps.ratioFormula}</div>
            <div className="text-slate-300">{results.steps.ratioSub}</div>
            <div className="text-emerald-400 font-bold">{results.steps.ratioResult}</div>
          </div>

          {/* STEP 3: DUTY CYCLE */}
          <div className="p-3 rounded-[3px] border border-white/10 bg-[#111520] space-y-1.5">
            <span className="text-[10px] text-[#00F0FF] font-bold uppercase tracking-wider">
              Step 3 — Duty Cycle
            </span>
            <div className="text-slate-400">{results.steps.dutyFormula}</div>
            <div className="text-slate-300">{results.steps.dutySub}</div>
            <div className="text-[#00F0FF] font-bold">{results.steps.dutyResult}</div>
          </div>

          {/* STEP 4: HIGH TIME */}
          <div className="p-3 rounded-[3px] border border-white/10 bg-[#111520] space-y-1.5">
            <span className="text-[10px] text-[#00F0FF] font-bold uppercase tracking-wider">
              Step 4 — High Time (THIGH)
            </span>
            <div className="text-slate-400">{results.steps.tHighFormula}</div>
            <div className="text-slate-300">{results.steps.tHighSub}</div>
            <div className="text-[#00F0FF] font-bold">{results.steps.tHighResult}</div>
          </div>

          {/* STEP 5: LOW TIME */}
          <div className="p-3 rounded-[3px] border border-white/10 bg-[#111520] space-y-1.5">
            <span className="text-[10px] text-[#FF5722] font-bold uppercase tracking-wider">
              Step 5 — Low Time (TLOW)
            </span>
            <div className="text-slate-400">{results.steps.tLowFormula}</div>
            <div className="text-slate-300">{results.steps.tLowSub}</div>
            <div className="text-[#FF5722] font-bold">{results.steps.tLowResult}</div>
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
            title="Comparator-Based Duty Encoding"
            microHeader="ANALOG-TO-DUTY MAPPING"
            formula="Duty = ((Vctrl - Vmin) / (Vmax - Vmin)) × 100%"
            description="An open-loop comparator outputs logic HIGH whenever the carrier triangle drops below the analog control voltage."
            bulletPoints={[
              "Non-inverting input receives DC control voltage Vctrl",
              "Inverting input receives triangular or sawtooth reference carrier",
              "Linear triangular slope produces linear analog duty modulation",
            ]}
            badgeText="Op-Amp Comparator"
            badgeVariant="cyan"
          />

          <TheoryTile
            title="Switching Power Efficiency"
            microHeader="POWER STAGE DYNAMICS"
            formula="Ploss = Vsat · Ion ≈ 0 W (Ideal Switch)"
            description="In switching supplies and class-D drivers, transistors switch rapidly between cutoff and saturation, maintaining theoretical efficiency above 90%."
            bulletPoints={[
              "Transistors operate fully ON (low Vce) or fully OFF (zero Ic)",
              "Minimal power dissipation compared to linear power amplifiers",
              "Essential standard for DC motor speed controllers and SMPS",
            ]}
            badgeText="High Efficiency"
            badgeVariant="orange"
          />

          <TheoryTile
            title="Analog Low-Pass Recovery (1-Bit DAC)"
            microHeader="AVERAGING RECONSTRUCTION"
            formula="Vavg = Duty × Vrail"
            description="Routing the high-frequency PWM waveform through a passive RC low-pass filter suppresses carrier harmonics, recovering the continuous analog level."
            bulletPoints={[
              "Cutoff frequency fc < fcarrier / 10 eliminates ripple",
              "Integrates digital pulses into smooth proportional DC output",
              "Commonly used with microcontroller timers for cheap DACs",
            ]}
            specs={[
              { label: 'Carrier Rejection', value: '> 40 dB' },
              { label: 'Filter Topology', value: 'RC Low-Pass' },
              { label: 'Conversion Speed', value: 'Fast Slew' },
            ]}
            badgeText="D/A Reconstruction"
            badgeVariant="slate"
          />
        </div>
      </div>
    </div>
  );
};
