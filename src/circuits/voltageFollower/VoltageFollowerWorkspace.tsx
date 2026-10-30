import React, { useState, useEffect } from 'react';
import { VoltageFollowerInputs, VoltageFollowerResults } from '../../types/circuit';
import { calculateVoltageFollower, validateVoltageFollowerInputs } from '../../calculations/voltageFollower';
import { InputNumber } from '../../components/ui/InputNumber';
import { ResultCard } from '../../components/ui/ResultCard';
import { TheoryTile } from '../../components/ui/TheoryTile';
import { VoltageFollowerSchematicSvg } from '../../components/circuit/VoltageFollowerSchematicSvg';
import { UniversalWaveformScope } from '../../components/circuit/UniversalWaveformScope';
import { simulateLinearOpAmp, SignalWaveformType } from '../../utils/waveformEngine';
import { cleanFloat } from '../../utils/formatters';
import { saveActiveCircuitState } from '../../utils/circuitStateBridge';
import { RotateCcw, Calculator, Zap, Eye, Activity, CheckCircle, Lightbulb } from 'lucide-react';

interface VoltageFollowerWorkspaceProps {
  onStatusChange?: (status: 'Ready' | 'Calculated' | 'Error', hasErrors: boolean) => void;
}

const DEFAULT_INPUTS: VoltageFollowerInputs = {
  vin: 5,
  vinUnit: 'V',
};

export const VoltageFollowerWorkspace: React.FC<VoltageFollowerWorkspaceProps> = ({
  onStatusChange,
}) => {
  const [inputs, setInputs] = useState<VoltageFollowerInputs>(DEFAULT_INPUTS);
  
  // Waveform signal parameters
  const [signalType, setSignalType] = useState<SignalWaveformType>('sine');
  const [signalFreq, setSignalFreq] = useState<number>(1000);
  const [posVsat, setPosVsat] = useState<number>(15);
  const [negVsat, setNegVsat] = useState<number>(-15);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [results, setResults] = useState<VoltageFollowerResults>(() =>
    calculateVoltageFollower(DEFAULT_INPUTS)
  );
  const [viewMode, setViewMode] = useState<'schematic' | 'scope'>('scope');

  // Synchronize state with central bridge for Lab Mode and Exports
  useEffect(() => {
    saveActiveCircuitState('voltage-follower', inputs, results);
  }, [inputs, results]);

  const handleCalculate = () => {
    const validationErrors = validateVoltageFollowerInputs(inputs);

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
    const res = calculateVoltageFollower(inputs);
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
    const res = calculateVoltageFollower(DEFAULT_INPUTS);
    setResults(res);
    onStatusChange?.('Ready', false);
  };

  const applyPreset = (vin: number, freq: number = 1000) => {
    const newInputs: VoltageFollowerInputs = {
      vin,
      vinUnit: 'V',
    };
    setInputs(newInputs);
    setSignalFreq(freq);
    setErrors({});
    const res = calculateVoltageFollower(newInputs);
    setResults(res);
    onStatusChange?.('Calculated', false);
  };

  // Run dynamic simulation for waveform scope
  const simulation = simulateLinearOpAmp({
    inputParams: {
      waveform: signalType,
      amplitude: Math.abs(results.vinBase),
      frequency: signalFreq,
      phaseDeg: 0,
      dcOffset: 0,
    },
    gain: 1.0,
    phaseInvert: false,
    posVsat,
    negVsat,
    applyClipping: true,
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* 1. Header & Subtitle */}
      <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold font-mono text-white tracking-tight">
              Voltage Follower (Unity Buffer)
            </h1>
            <span className="text-xs font-mono text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/30 px-2 py-0.5 rounded-[2px]">
              Active Simulation
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Analyze unity-gain buffering, infinite input impedance isolation, and zero-loss signal tracking.
          </p>
        </div>

        {/* Quick Presets matching Lab Test Cases */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mr-1">Lab Presets:</span>
          <button
            onClick={() => applyPreset(2)}
            className="text-[11px] font-mono px-2.5 py-1 rounded-[2px] bg-[#111520] border border-white/10 text-slate-300 hover:border-[#00F0FF]/50 hover:text-[#00F0FF] transition-colors"
          >
            Vin = 2 V (Test 1)
          </button>
          <button
            onClick={() => applyPreset(5)}
            className="text-[11px] font-mono px-2.5 py-1 rounded-[2px] bg-[#111520] border border-white/10 text-slate-300 hover:border-[#00F0FF]/50 hover:text-[#00F0FF] transition-colors"
          >
            Vin = 5 V (Test 2)
          </button>
          <button
            onClick={() => applyPreset(3.3)}
            className="text-[11px] font-mono px-2.5 py-1 rounded-[2px] bg-[#111520] border border-white/10 text-slate-300 hover:border-[#00F0FF]/50 hover:text-[#00F0FF] transition-colors"
          >
            Vin = 3.3 V (Logic Buffer)
          </button>
        </div>
      </div>

      {/* 2. Main Workspace Split: Parameters | Circuit Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Input Parameters */}
        <div className="lg:col-span-4 rounded-[3px] border border-white/10 bg-[#1A1E29] p-4 sm:p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#00F0FF]" />
              <h2 className="text-sm font-semibold font-mono text-white uppercase tracking-wider">
                Input Parameters
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">
              Unity Buffer Model
            </span>
          </div>

          <div className="space-y-4">
            {/* Input Voltage (Vin) */}
            <InputNumber
              id="vin-vf"
              symbol="Vin"
              label="Input Voltage"
              value={inputs.vin}
              unit={inputs.vinUnit}
              unitOptions={['V', 'mV']}
              onValueChange={(val) => {
                setInputs((prev) => ({ ...prev, vin: val }));
                if (errors.vin) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.vin;
                    return next;
                  });
                }
              }}
              onUnitChange={(unit) => setInputs((prev) => ({ ...prev, vinUnit: unit }))}
              error={errors.vin}
              hint="Connected directly to non-inverting (+) input"
            />

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
                    className={`py-1 text-xs font-mono font-semibold rounded-[3px] capitalize border transition ${
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
                    id="signalFreq"
                    symbol="f"
                    label="Test Frequency"
                    value={signalFreq}
                    unit="Hz"
                    step={100}
                    min={1}
                    max={100000}
                    onValueChange={(f) => setSignalFreq(Math.max(1, f))}
                    hint="Signal frequency"
                  />
                </div>
              )}
            </div>

            {/* Note on external resistors */}
            <div className="p-3 rounded-[3px] bg-[#111520] border border-white/10 text-xs text-slate-400 font-mono space-y-1">
              <span className="text-[#00F0FF] font-semibold block text-[10px] uppercase tracking-wider">
                Buffer Feedback Axiom:
              </span>
              <p className="text-[11px] leading-relaxed text-slate-300">
                100% negative feedback with output directly tied to inverting (−) terminal (β = 1.00). No external resistors required.
              </p>
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
        <div className="lg:col-span-8 rounded-[3px] border border-white/10 bg-[#1A1E29] p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-3 gap-2">
            <div>
              <h2 className="text-sm font-semibold font-mono text-white uppercase tracking-wider">
                Circuit Diagram & Visual Probes
              </h2>
              <p className="text-[11px] text-slate-400">
                Direct negative feedback closed loop with zero external resistance.
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
            <VoltageFollowerSchematicSvg
              vin={inputs.vin}
              vinUnit={inputs.vinUnit}
              vout={results.vout}
            />
          ) : (
            <UniversalWaveformScope
              simulation={simulation}
              title="VOLTAGE FOLLOWER (BUFFER) WAVEFORM SIMULATION"
              subtitle="Unity Gain Buffer: Av = 1.000 | In-Phase (0°)"
              insight="The voltage follower operates with 100% negative feedback (β = 1). The output precisely tracks the input voltage in amplitude and phase without loading down the high-impedance source."
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
            Unity Gain Equations
          </span>
        </div>

        {/* Primary Metric Result Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ResultCard
            label="Theoretical Gain"
            symbol="Av"
            value="1"
            unit=""
            formula="Av = 1.00"
            subtext="Unity voltage gain (0 dB transmission)"
            accentColor="cyan"
            highlight={true}
          />

          <ResultCard
            label="Output Voltage"
            symbol="Vout"
            value={cleanFloat(results.vout)}
            unit="V"
            formula="Vout = Vin"
            subtext={`Identical to Vin = ${cleanFloat(results.vinBase)} V`}
            accentColor="amber"
          />

          <ResultCard
            label="Phase Angle"
            symbol="θ"
            value={`${results.phaseShiftDeg}°`}
            unit=""
            formula="θ = 0°"
            subtext="Zero phase lag (exact waveform synchronization)"
            accentColor="emerald"
          />
        </div>

        {/* Step-by-Step Mathematical Derivations */}
        <div className="rounded-[3px] border border-white/10 bg-[#111520] p-4 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/10">
            <span className="font-bold text-white tracking-wider uppercase text-[11px]">
              STEP-BY-STEP CALCULATION PROOF & UNITY BUFFER DERIVATION
            </span>
            <span className="text-[10px] text-[#00F0FF] uppercase">
              Unity Proof
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Gain */}
            <div className="p-3.5 rounded-[3px] bg-[#1A1E29] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                  STEP 01: CLOSED-LOOP GAIN (Av)
                </span>
                <span className="text-[10px] text-[#00F0FF] bg-[#0B0F19] px-1.5 py-0.5 rounded-[2px] border border-white/10">
                  Formula
                </span>
              </div>
              <div className="text-white text-xs font-semibold">{results.steps.avFormula}</div>
              <div className="text-slate-400 text-[11px]">From Non-Inverting Eqn: Av = 1 + (Rf / R1) with Rf = 0, R1 = ∞</div>
              <div className="text-[#00F0FF] font-bold text-sm pt-2 border-t border-white/10">
                {results.steps.avResult}
              </div>
            </div>

            {/* Step 2: Output Voltage */}
            <div className="p-3.5 rounded-[3px] bg-[#1A1E29] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                  STEP 02: OUTPUT VOLTAGE (Vout)
                </span>
                <span className="text-[10px] text-[#FF5722] bg-[#0B0F19] px-1.5 py-0.5 rounded-[2px] border border-white/10">
                  Evaluation
                </span>
              </div>
              <div className="text-white text-xs font-semibold">{results.steps.voutFormula}</div>
              <div className="text-slate-400 text-[11px]">Vout = 1 × Vin = {results.steps.voutSubstitution}</div>
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
            title="Unity Transmission"
            category="GOVERNING AXIOM"
            formula="Av = 1.000 (0.00 dB)"
            description="A voltage follower provides direct 1:1 voltage transfer without voltage scaling or phase displacement. Perfect for buffering high-impedance sensors."
            specs={[
              { label: 'Voltage Gain', value: '1.000 V/V' },
              { label: 'Gain (dB)', value: '0.00 dB' },
              { label: 'Phase Shift', value: '0.0° (Locked)' },
            ]}
            accentColor="cyan"
            icon="zap"
          />

          <TheoryTile
            title="Impedance Transformation"
            category="STAGE ISOLATION"
            formula="Zin ≈ ∞ | Zout ≈ 0 Ω"
            description="Eliminates the loading effect by isolating the signal generator from downstream resistive loads. Converts high impedance to extremely low impedance."
            specs={[
              { label: 'Input Impedance', value: '≈ 10¹² Ω' },
              { label: 'Output Impedance', value: '< 0.1 Ω' },
              { label: 'Source Loading', value: 'Zero (0 μA)' },
            ]}
            accentColor="emerald"
            icon="check"
          />

          <TheoryTile
            title="Feedback Loop Dynamics"
            category="STABILITY & FEEDBACK"
            formula="β = 1.00 | V⁻ = Vout = Vin"
            description="With 100% negative feedback, the closed-loop bandwidth equals the op-amp gain bandwidth product (GBWP), yielding the maximum available operational bandwidth."
            specs={[
              { label: 'Feedback Factor β', value: '1.00 (100%)' },
              { label: 'Bandwidth', value: 'Max (≈ GBWP)' },
              { label: 'Phase Inversion', value: 'None (0°)' },
            ]}
            accentColor="amber"
            icon="zap"
          />
        </div>
      </div>
    </div>
  );
};
