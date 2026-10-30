import React, { useState, useEffect } from 'react';
import { NonInvertingAmpInputs, NonInvertingAmpResults } from '../../types/circuit';
import { calculateNonInvertingAmp, validateNonInvertingAmpInputs } from '../../calculations/nonInvertingAmp';
import { InputNumber } from '../../components/ui/InputNumber';
import { ResultCard } from '../../components/ui/ResultCard';
import { TheoryTile } from '../../components/ui/TheoryTile';
import { NonInvertingSchematicSvg } from '../../components/circuit/NonInvertingSchematicSvg';
import { UniversalWaveformScope } from '../../components/circuit/UniversalWaveformScope';
import { simulateLinearOpAmp, SignalWaveformType } from '../../utils/waveformEngine';
import { cleanFloat, formatResistance } from '../../utils/formatters';
import { saveActiveCircuitState } from '../../utils/circuitStateBridge';
import { playTick, playError } from '../../utils/audioFeedback';
import { RotateCcw, Calculator, Zap, Eye, Activity, CheckCircle, Lightbulb } from 'lucide-react';

interface NonInvertingAmpWorkspaceProps {
  onStatusChange?: (status: 'Ready' | 'Calculated' | 'Error', hasErrors: boolean) => void;
}

const DEFAULT_INPUTS: NonInvertingAmpInputs = {
  vin: 1,
  vinUnit: 'V',
  r1: 10,
  r1Unit: 'kΩ',
  rf: 90,
  rfUnit: 'kΩ',
};

export const NonInvertingAmpWorkspace: React.FC<NonInvertingAmpWorkspaceProps> = ({
  onStatusChange,
}) => {
  const [inputs, setInputs] = useState<NonInvertingAmpInputs>(DEFAULT_INPUTS);
  
  // Waveform signal parameters
  const [signalType, setSignalType] = useState<SignalWaveformType>('sine');
  const [signalFreq, setSignalFreq] = useState<number>(1000);
  const [posVsat, setPosVsat] = useState<number>(15);
  const [negVsat, setNegVsat] = useState<number>(-15);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [results, setResults] = useState<NonInvertingAmpResults>(() =>
    calculateNonInvertingAmp(DEFAULT_INPUTS)
  );
  const [viewMode, setViewMode] = useState<'schematic' | 'scope'>('scope');

  // Synchronize state with central bridge for Lab Mode and Exports
  useEffect(() => {
    saveActiveCircuitState('non-inverting-amplifier', inputs, results);
  }, [inputs, results]);

  const handleCalculate = () => {
    const validationErrors = validateNonInvertingAmpInputs(inputs);

    if (validationErrors.length > 0) {
      playError();
      const errMap: Record<string, string> = {};
      validationErrors.forEach((e) => {
        if (e.field) errMap[e.field] = e.message;
      });
      setErrors(errMap);
      onStatusChange?.('Error', true);
      return;
    }

    playTick();
    setErrors({});
    const res = calculateNonInvertingAmp(inputs);
    setResults(res);
    onStatusChange?.('Calculated', false);
  };

  const handleReset = () => {
    playTick();
    setInputs(DEFAULT_INPUTS);
    setSignalType('sine');
    setSignalFreq(1000);
    setPosVsat(15);
    setNegVsat(-15);
    setErrors({});
    const res = calculateNonInvertingAmp(DEFAULT_INPUTS);
    setResults(res);
    onStatusChange?.('Ready', false);
  };

  const applyPreset = (r1: number, r1Unit: 'kΩ' | 'Ω', rf: number, rfUnit: 'kΩ' | 'Ω', vin: number, freq: number = 1000) => {
    const newInputs: NonInvertingAmpInputs = {
      vin,
      vinUnit: 'V',
      r1,
      r1Unit,
      rf,
      rfUnit,
    };
    setInputs(newInputs);
    setSignalFreq(freq);
    setErrors({});
    const res = calculateNonInvertingAmp(newInputs);
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
    gain: results.av,
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
              Non-Inverting Amplifier
            </h1>
            <span className="text-xs font-mono text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/30 px-2 py-0.5 rounded-[2px]">
              Active Simulation
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Analyze closed-loop non-inverting gain, in-phase output response, and infinite input impedance behavior.
          </p>
        </div>

        {/* Quick Presets matching Lab Test Cases */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mr-1">Lab Presets:</span>
          <button
            onClick={() => applyPreset(10, 'kΩ', 90, 'kΩ', 1)}
            className="text-[11px] font-mono px-2.5 py-1 rounded-[2px] bg-[#111520] border border-white/10 text-slate-300 hover:border-[#00F0FF]/50 hover:text-[#00F0FF] transition-colors"
          >
            Av = 10 (Test 1)
          </button>
          <button
            onClick={() => applyPreset(20, 'kΩ', 100, 'kΩ', 2)}
            className="text-[11px] font-mono px-2.5 py-1 rounded-[2px] bg-[#111520] border border-white/10 text-slate-300 hover:border-[#00F0FF]/50 hover:text-[#00F0FF] transition-colors"
          >
            Av = 6 (Test 2)
          </button>
          <button
            onClick={() => applyPreset(10, 'kΩ', 40, 'kΩ', 0.5)}
            className="text-[11px] font-mono px-2.5 py-1 rounded-[2px] bg-[#111520] border border-white/10 text-slate-300 hover:border-[#00F0FF]/50 hover:text-[#00F0FF] transition-colors"
          >
            Av = 5 (Test 3)
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
              Ideal Model
            </span>
          </div>

          <div className="space-y-4">
            {/* Input Voltage (Vin) */}
            <InputNumber
              id="vin"
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
              hint="Connected to (+) non-inverting terminal"
            />

            {/* Gain Resistance (R1) */}
            <InputNumber
              id="r1"
              symbol="R1"
              label="Ground Resistance"
              value={inputs.r1}
              unit={inputs.r1Unit}
              unitOptions={['Ω', 'kΩ', 'MΩ']}
              onValueChange={(val) => {
                setInputs((prev) => ({ ...prev, r1: val }));
                if (errors.r1) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.r1;
                    return next;
                  });
                }
              }}
              onUnitChange={(unit) => setInputs((prev) => ({ ...prev, r1Unit: unit }))}
              error={errors.r1}
              hint="R1 from (-) node to GND (> 0 Ω)"
            />

            {/* Feedback Resistance (Rf) */}
            <InputNumber
              id="rf"
              symbol="Rf"
              label="Feedback Resistance"
              value={inputs.rf}
              unit={inputs.rfUnit}
              unitOptions={['Ω', 'kΩ', 'MΩ']}
              onValueChange={(val) => {
                setInputs((prev) => ({ ...prev, rf: val }));
                if (errors.rf) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.rf;
                    return next;
                  });
                }
              }}
              onUnitChange={(unit) => setInputs((prev) => ({ ...prev, rfUnit: unit }))}
              error={errors.rf}
              hint="Rf feedback loop (≥ 0 Ω)"
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
                Values update live with component parameter inputs.
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
            <NonInvertingSchematicSvg
              vin={inputs.vin}
              vinUnit={inputs.vinUnit}
              r1Base={results.r1Base}
              rfBase={results.rfBase}
              vout={results.vout}
              av={results.av}
            />
          ) : (
            <UniversalWaveformScope
              simulation={simulation}
              title="NON-INVERTING AMPLIFIER WAVEFORM SIMULATION"
              subtitle={`Gain Av = +${cleanFloat(results.av, 2)} | In-Phase (0°) | Rails ±${posVsat}V`}
              insight="The output signal is in phase (0° phase shift) with the input. Closed loop voltage gain is 1 + Rf/R1. If output peaks exceed ±Vsat, the op-amp clips at the saturation rail."
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
            Standard Equations
          </span>
        </div>

        {/* Primary Metric Result Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ResultCard
            label="Theoretical Gain"
            symbol="Av"
            value={cleanFloat(results.av)}
            unit=""
            formula="Av = 1 + (Rf / R1)"
            subtext="Positive gain indicates 0° phase shift (in-phase)"
            accentColor="cyan"
            highlight={true}
          />

          <ResultCard
            label="Output Voltage"
            symbol="Vout"
            value={cleanFloat(results.vout)}
            unit="V"
            formula="Vout = Av × Vin"
            subtext={`Response for Vin = ${cleanFloat(results.vinBase)} V`}
            accentColor="amber"
          />

          <ResultCard
            label="Phase Angle"
            symbol="θ"
            value={`${results.phaseShiftDeg}°`}
            unit=""
            formula="θ = 0°"
            subtext="Output is completely in-phase with input"
            accentColor="emerald"
          />
        </div>

        {/* Detailed Step-by-Step Mathematical Derivations */}
        <div className="rounded-[3px] border border-white/10 bg-[#111520] p-4 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/10">
            <span className="font-bold text-white tracking-wider uppercase text-[11px]">
              STEP-BY-STEP CALCULATION PROOF & SI SUBSTITUTION
            </span>
            <span className="text-[10px] text-[#00F0FF] uppercase">
              Analytical Proof
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
              <div className="text-slate-400 text-[11px]">{results.steps.avSubstitution}</div>
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
            title="Transfer Function"
            category="GOVERNING AXIOM"
            formula="Av = 1 + (Rf / R1)"
            description="The non-inverting amplifier provides closed-loop amplification with zero phase shift. The minimum possible voltage gain is unity (+1) when Rf is zero or R1 is infinite."
            specs={[
              { label: 'Gain Type', value: 'Non-Inverting (+)' },
              { label: 'Minimum Gain', value: 'Av ≥ 1.00' },
              { label: 'Phase Shift', value: '0° (In-Phase)' },
            ]}
            accentColor="cyan"
            icon="zap"
          />

          <TheoryTile
            title="Virtual Short Principle"
            category="TERMINAL DYNAMICS"
            formula="V⁻ = V⁺ = Vin"
            description="Due to large open-loop gain and negative feedback, the voltage at the inverting terminal is forced to track the non-inverting input voltage directly."
            specs={[
              { label: 'Non-Inv (V⁺)', value: `${cleanFloat(results.vinBase)} V` },
              { label: 'Inv (V⁻)', value: `${cleanFloat(results.vinBase)} V`, accent: 'emerald' },
              { label: 'Differential Vd', value: '0.00 V' },
            ]}
            accentColor="emerald"
            icon="check"
          />

          <TheoryTile
            title="Impedance Specs"
            category="CIRCUIT LOADING"
            formula="Zin ≈ ∞ | Zout ≈ 0 Ω"
            description="Input source drives directly into the op-amp gate terminal, offering ultra-high input impedance and virtually zero source loading or current draw."
            specs={[
              { label: 'Input Impedance', value: '≈ 10¹² Ω (Ultra High)' },
              { label: 'Source Loading', value: '0.00 μA (Negligible)' },
              { label: 'Output Drive', value: 'Low Zout (< 10 Ω)' },
            ]}
            accentColor="amber"
            icon="zap"
          />
        </div>
      </div>
    </div>
  );
};
