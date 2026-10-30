import React, { useState, useEffect } from 'react';
import { InvertingAmpInputs, InvertingAmpResults, ValidationError } from '../../types/circuit';
import { calculateInvertingAmp, validateInvertingAmpInputs } from '../../calculations/invertingAmp';
import { InputNumber } from '../../components/ui/InputNumber';
import { ResultCard } from '../../components/ui/ResultCard';
import { TheoryTile } from '../../components/ui/TheoryTile';
import { InvertingSchematicSvg } from '../../components/circuit/InvertingSchematicSvg';
import { UniversalWaveformScope } from '../../components/circuit/UniversalWaveformScope';
import { simulateLinearOpAmp, SignalWaveformType } from '../../utils/waveformEngine';
import { cleanFloat, formatResistance } from '../../utils/formatters';
import { saveActiveCircuitState } from '../../utils/circuitStateBridge';
import { playTick, playError } from '../../utils/audioFeedback';
import { RotateCcw, Calculator, Zap, Eye, Activity, CheckCircle, Lightbulb } from 'lucide-react';

interface InvertingAmpWorkspaceProps {
  onStatusChange?: (status: 'Ready' | 'Calculated' | 'Error', hasErrors: boolean) => void;
}

const DEFAULT_INPUTS: InvertingAmpInputs = {
  vin: 2,
  vinUnit: 'V',
  rin: 10,
  rinUnit: 'kΩ',
  rf: 50,
  rfUnit: 'kΩ',
};

export const InvertingAmpWorkspace: React.FC<InvertingAmpWorkspaceProps> = ({
  onStatusChange,
}) => {
  // Input state
  const [inputs, setInputs] = useState<InvertingAmpInputs>(DEFAULT_INPUTS);
  
  // Waveform signal parameters
  const [signalType, setSignalType] = useState<SignalWaveformType>('sine');
  const [signalFreq, setSignalFreq] = useState<number>(1000);
  const [posVsat, setPosVsat] = useState<number>(15);
  const [negVsat, setNegVsat] = useState<number>(-15);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Calculated results
  const [results, setResults] = useState<InvertingAmpResults>(() =>
    calculateInvertingAmp(DEFAULT_INPUTS)
  );

  // Active right-panel visualization mode: 'schematic' | 'scope'
  const [viewMode, setViewMode] = useState<'schematic' | 'scope'>('scope');

  // Synchronize state with central bridge for Lab Mode and Exports
  useEffect(() => {
    saveActiveCircuitState('inverting-amplifier', inputs, results);
  }, [inputs, results]);

  // Handle Calculate button click
  const handleCalculate = () => {
    const validationErrors = validateInvertingAmpInputs(inputs);

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
    const res = calculateInvertingAmp(inputs);
    setResults(res);
    onStatusChange?.('Calculated', false);
  };

  // Handle Reset button click
  const handleReset = () => {
    playTick();
    setInputs(DEFAULT_INPUTS);
    setSignalType('sine');
    setSignalFreq(1000);
    setPosVsat(15);
    setNegVsat(-15);
    setErrors({});
    const res = calculateInvertingAmp(DEFAULT_INPUTS);
    setResults(res);
    onStatusChange?.('Ready', false);
  };

  // Preset quick-set buttons for student lab experiments
  const applyPreset = (rin: number, rinUnit: 'kΩ' | 'Ω', rf: number, rfUnit: 'kΩ' | 'Ω', vin: number, freq: number = 1000) => {
    const newInputs: InvertingAmpInputs = {
      vin,
      vinUnit: 'V',
      rin,
      rinUnit,
      rf,
      rfUnit,
    };
    setInputs(newInputs);
    setSignalFreq(freq);
    setErrors({});
    const res = calculateInvertingAmp(newInputs);
    setResults(res);
    onStatusChange?.('Calculated', false);
  };

  // Unified simulation calculation
  const simulation = simulateLinearOpAmp({
    inputParams: {
      waveform: signalType,
      amplitude: Math.abs(results.vinBase),
      frequency: signalFreq,
      phaseDeg: 0,
      dcOffset: 0,
    },
    gain: results.av,
    phaseInvert: true,
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
              Inverting Amplifier
            </h1>
            <span className="text-[10px] font-mono font-bold text-[#00F0FF] bg-[#00F0FF]/15 border border-[#00F0FF]/30 px-2 py-0.5 rounded-[2px]">
              Active Simulation
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Analyze closed-loop gain, 180° phase inversion, and saturation clipping of an inverting op-amp.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-mono text-slate-500 mr-1">Lab Presets:</span>
          <button
            onClick={() => applyPreset(10, 'kΩ', 50, 'kΩ', 1, 1000)}
            className="text-[11px] font-mono px-2 py-1 rounded-[2px] bg-[#111520] border border-[#00F0FF]/40 text-[#00F0FF] hover:bg-[#00F0FF]/10 transition-colors cursor-pointer"
          >
            Av = -5 (Test 1)
          </button>
          <button
            onClick={() => applyPreset(10, 'kΩ', 10, 'kΩ', 1, 1000)}
            className="text-[11px] font-mono px-2 py-1 rounded-[2px] bg-[#111520] border border-white/10 text-slate-300 hover:border-[#00F0FF]/40 hover:text-[#00F0FF] transition-colors cursor-pointer"
          >
            Av = -1 (Inverter)
          </button>
          <button
            onClick={() => applyPreset(10, 'kΩ', 100, 'kΩ', 1, 1000)}
            className="text-[11px] font-mono px-2 py-1 rounded-[2px] bg-[#111520] border border-white/10 text-slate-300 hover:border-[#00F0FF]/40 hover:text-[#00F0FF] transition-colors cursor-pointer"
          >
            Av = -10 (Standard)
          </button>
          <button
            onClick={() => applyPreset(10, 'kΩ', 180, 'kΩ', 1.2, 1000)}
            className="text-[11px] font-mono px-2 py-1 rounded-[2px] bg-[#111520] border border-[#FF5722]/50 text-[#FF5722] hover:bg-[#FF5722]/10 transition-colors cursor-pointer"
          >
            Overdrive Saturation
          </button>
        </div>
      </div>

      {/* 2. Main Workspace Split: Left (Parameters) | Right (Circuit Diagram) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Input Parameters (4 cols on lg) */}
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
              hint="Peak / DC level"
            />

            {/* Input Resistance (Rin) */}
            <InputNumber
              id="rin"
              symbol="Rin"
              label="Input Resistance"
              value={inputs.rin}
              unit={inputs.rinUnit}
              unitOptions={['Ω', 'kΩ', 'MΩ']}
              onValueChange={(val) => {
                setInputs((prev) => ({ ...prev, rin: val }));
                if (errors.rin) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.rin;
                    return next;
                  });
                }
              }}
              onUnitChange={(unit) => setInputs((prev) => ({ ...prev, rinUnit: unit }))}
              error={errors.rin}
              hint="Rin > 0 Ω required"
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
              hint="Rf ≥ 0 Ω (0 = Short)"
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
                    className={`py-1 text-xs font-mono font-semibold rounded-[2px] capitalize border transition cursor-pointer ${
                      signalType === wf
                        ? 'bg-[#00F0FF] text-[#0B0F19] border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                        : 'bg-[#111520] border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
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
              className="flex-1 py-2.5 px-4 rounded-[3px] bg-[#00F0FF] hover:bg-[#00D2E0] active:bg-[#00B8C4] text-[#0B0F19] font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Calculate</span>
            </button>

            <button
              onClick={handleReset}
              className="py-2.5 px-4 rounded-[3px] bg-[#111520] hover:bg-white/5 border border-white/10 text-slate-300 font-mono font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          </div>

          {/* Error Summary Banner if any */}
          {Object.keys(errors).length > 0 && (
            <div className="p-3 rounded-[3px] bg-[#FF5722]/15 border border-[#FF5722]/50 text-[#FF5722] text-xs font-mono space-y-1">
              <span className="font-bold block uppercase tracking-wider">Simulation Halt:</span>
              {Object.values(errors).map((err, idx) => (
                <p key={idx} className="text-[11px] leading-tight">• {err}</p>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Circuit Diagram & Oscilloscope (8 cols on lg) */}
        <div className="lg:col-span-8 rounded-[3px] border border-white/10 bg-[#1A1E29] p-4 sm:p-5 space-y-4">
          {/* Header & View Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-3 gap-2">
            <div>
              <h2 className="text-sm font-semibold font-mono text-white uppercase tracking-wider">
                Circuit Diagram & Visual Probes
              </h2>
              <p className="text-[11px] text-slate-400">
                Interactive real-time circuit schematic and multi-channel transient oscilloscope.
              </p>
            </div>

            {/* Toggle View: Schematic vs Oscilloscope */}
            <div className="flex items-center rounded-[3px] bg-[#0B0F19] p-0.5 border border-white/10 text-xs font-mono">
              <button
                onClick={() => setViewMode('schematic')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
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
                className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
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
            <InvertingSchematicSvg
              vin={inputs.vin}
              vinUnit={inputs.vinUnit}
              rinBase={results.rinBase}
              rfBase={results.rfBase}
              vout={results.vout}
              av={results.av}
              iin={results.iin}
            />
          ) : (
            <UniversalWaveformScope
              simulation={simulation}
              title="INVERTING AMPLIFIER WAVEFORM SIMULATION"
              subtitle={`Gain Av = -${cleanFloat(Math.abs(results.av), 2)} | 180° Inversion | Rails ±${posVsat}V`}
              insight="The output amplitude is multiplied by closed-loop gain (|Av| × Vin) with 180° inversion. When the calculated voltage exceeds the supply rails (±Vsat), the output clips flat."
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
            Closed-Loop Derivations
          </span>
        </div>

        {/* Primary Metric Result Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ResultCard
            label="Theoretical Gain"
            symbol="Av"
            value={cleanFloat(results.av)}
            unit=""
            formula="Av = -Rf / Rin"
            subtext={
              results.av < 0
                ? 'Negative gain indicates 180° phase inversion'
                : 'Unity gain'
            }
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
            label="Phase Inversion"
            symbol="θ"
            value={`${results.phaseShiftDeg}°`}
            unit=""
            formula="θ = 180°"
            subtext="Opposite polarity relative to input signal"
            accentColor="emerald"
          />
        </div>

        {/* Modular Step-by-Step Mathematical Derivations Infographic Block */}
        <div className="rounded-[3px] border border-white/10 bg-[#111520] p-4 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/10">
            <span className="font-bold text-white tracking-wider uppercase text-[11px]">
              STEP-BY-STEP MATHEMATICAL PROOF & SI SUBSTITUTION
            </span>
            <span className="text-[10px] text-[#00F0FF] uppercase">
              Analytical Proof
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Gain Tile */}
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

            {/* Step 2: Output Voltage Tile */}
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
            formula="Av = -Rf / Rin"
            description="The inverting configuration provides stable voltage amplification with negative feedback. Closed-loop gain depends strictly on external passive resistor ratio."
            specs={[
              { label: 'Gain Type', value: 'Inverting (-)' },
              { label: 'Phase Shift', value: '180° Inversion' },
              { label: 'Feedback', value: 'Negative (Inv)' },
            ]}
            accentColor="cyan"
            icon="zap"
          />

          <TheoryTile
            title="Virtual Ground"
            category="TERMINAL DYNAMICS"
            formula="V⁻ = V⁺ = 0.00 V"
            description="The infinite open-loop gain drives the inverting terminal to 0V (virtual ground), since the non-inverting terminal is tied to analog ground."
            specs={[
              { label: 'Non-Inv (V⁺)', value: '0.00 V (GND)' },
              { label: 'Inv (V⁻)', value: '0.00 V (V-GND)', accent: 'emerald' },
              { label: 'Input Current', value: 'I_in ≈ 0 A' },
            ]}
            accentColor="emerald"
            icon="check"
          />

          <TheoryTile
            title="Impedance Specs"
            category="CIRCUIT LOADING"
            formula="Zin ≈ Rin | Zout ≈ 0 Ω"
            description="Input impedance is directly governed by Rin. The input signal source must supply the input loop current without impedance mismatch or signal drop."
            specs={[
              { label: 'Input Zin', value: formatResistance(results.rinBase) },
              { label: 'Output Zout', value: '≈ 0 Ω (Ideal)' },
              { label: 'Bandwidth', value: 'BW = GBW / |Av|', accent: 'orange' },
            ]}
            accentColor="orange"
            icon="activity"
          />
        </div>
      </div>
    </div>
  );
};
