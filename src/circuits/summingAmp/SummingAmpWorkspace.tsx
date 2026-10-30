import React, { useState, useEffect } from 'react';
import { SummingAmpInputs, SummingAmpResults, SummingInputChannel } from '../../types/circuit';
import { calculateSummingAmplifier, validateSummingAmpInputs } from '../../calculations/summingAmp';
import { InputNumber } from '../../components/ui/InputNumber';
import { ResultCard } from '../../components/ui/ResultCard';
import { TheoryTile } from '../../components/ui/TheoryTile';
import { SummingSchematicSvg } from '../../components/circuit/SummingSchematicSvg';
import { UniversalWaveformScope } from '../../components/circuit/UniversalWaveformScope';
import { simulateSummingOpAmp, SignalWaveformType } from '../../utils/waveformEngine';
import { cleanFloat, formatResistance } from '../../utils/formatters';
import { saveActiveCircuitState } from '../../utils/circuitStateBridge';
import { RotateCcw, Calculator, Zap, Eye, Activity, CheckCircle, Lightbulb, Plus, Trash2 } from 'lucide-react';

interface SummingAmpWorkspaceProps {
  onStatusChange?: (status: 'Ready' | 'Calculated' | 'Error', hasErrors: boolean) => void;
}

const DEFAULT_CHANNELS: SummingInputChannel[] = [
  {
    id: 'ch1',
    name: 'Input 1',
    voltage: 1,
    voltageUnit: 'V',
    resistance: 10,
    resistanceUnit: 'kΩ',
  },
  {
    id: 'ch2',
    name: 'Input 2',
    voltage: 2,
    voltageUnit: 'V',
    resistance: 10,
    resistanceUnit: 'kΩ',
  },
];

const DEFAULT_INPUTS: SummingAmpInputs = {
  channels: DEFAULT_CHANNELS,
  rf: 10,
  rfUnit: 'kΩ',
};

export const SummingAmpWorkspace: React.FC<SummingAmpWorkspaceProps> = ({
  onStatusChange,
}) => {
  const [inputs, setInputs] = useState<SummingAmpInputs>(DEFAULT_INPUTS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [results, setResults] = useState<SummingAmpResults>(() =>
    calculateSummingAmplifier(DEFAULT_INPUTS)
  );
  const [viewMode, setViewMode] = useState<'schematic' | 'scope'>('schematic');
  const [signalType, setSignalType] = useState<SignalWaveformType>('sine');
  const [signalFreq, setSignalFreq] = useState<number>(1000);
  const [posVsat, setPosVsat] = useState<number>(15);
  const [negVsat, setNegVsat] = useState<number>(-15);

  // Synchronize state with central bridge for Lab Mode and Exports
  useEffect(() => {
    saveActiveCircuitState('summing-amplifier', inputs, results);
  }, [inputs, results]);

  const handleAddChannel = () => {
    if (inputs.channels.length >= 4) return;
    const nextIdx = inputs.channels.length + 1;
    const newChannel: SummingInputChannel = {
      id: `ch_${Date.now()}`,
      name: `Input ${nextIdx}`,
      voltage: nextIdx,
      voltageUnit: 'V',
      resistance: 10,
      resistanceUnit: 'kΩ',
    };
    const updatedInputs = {
      ...inputs,
      channels: [...inputs.channels, newChannel],
    };
    setInputs(updatedInputs);
    const res = calculateSummingAmplifier(updatedInputs);
    setResults(res);
  };

  const handleRemoveChannel = (id: string) => {
    if (inputs.channels.length <= 2) return;
    const updatedChannels = inputs.channels
      .filter((ch) => ch.id !== id)
      .map((ch, idx) => ({ ...ch, name: `Input ${idx + 1}` }));
    const updatedInputs = {
      ...inputs,
      channels: updatedChannels,
    };
    setInputs(updatedInputs);
    const res = calculateSummingAmplifier(updatedInputs);
    setResults(res);
  };

  const handleUpdateChannel = (
    id: string,
    field: keyof SummingInputChannel,
    value: any
  ) => {
    const updatedChannels = inputs.channels.map((ch) => {
      if (ch.id === id) {
        return { ...ch, [field]: value };
      }
      return ch;
    });
    setInputs((prev) => ({ ...prev, channels: updatedChannels }));
  };

  const handleCalculate = () => {
    const validationErrors = validateSummingAmpInputs(inputs);

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
    const res = calculateSummingAmplifier(inputs);
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
    const res = calculateSummingAmplifier(DEFAULT_INPUTS);
    setResults(res);
    onStatusChange?.('Ready', false);
  };

  // Unified dynamic simulation for Summing Amplifier
  const simulation = simulateSummingOpAmp({
    channels: inputs.channels.map((ch, idx) => ({
      waveform: signalType,
      amplitude: Math.abs(ch.voltage * (ch.voltageUnit === 'mV' ? 1e-3 : 1)),
      frequency: signalFreq,
      phaseDeg: 0,
      dcOffset: 0,
      resistance: ch.resistance * (ch.resistanceUnit === 'kΩ' ? 1000 : ch.resistanceUnit === 'MΩ' ? 1e6 : 1),
      name: ch.name,
    })),
    rf: inputs.rf * (inputs.rfUnit === 'kΩ' ? 1000 : inputs.rfUnit === 'MΩ' ? 1e6 : 1),
    baseFrequency: signalFreq,
    posVsat,
    negVsat,
    applyClipping: true,
  });

  // Lab Presets for verification
  const applyPresetTest1 = () => {
    const preset: SummingAmpInputs = {
      channels: [
        { id: 'ch1', name: 'Input 1', voltage: 1, voltageUnit: 'V', resistance: 10, resistanceUnit: 'kΩ' },
        { id: 'ch2', name: 'Input 2', voltage: 2, voltageUnit: 'V', resistance: 10, resistanceUnit: 'kΩ' },
      ],
      rf: 10,
      rfUnit: 'kΩ',
    };
    setInputs(preset);
    setErrors({});
    setResults(calculateSummingAmplifier(preset));
    onStatusChange?.('Calculated', false);
  };

  const applyPresetTest2 = () => {
    const preset: SummingAmpInputs = {
      channels: [
        { id: 'ch1', name: 'Input 1', voltage: 1, voltageUnit: 'V', resistance: 10, resistanceUnit: 'kΩ' },
        { id: 'ch2', name: 'Input 2', voltage: 2, voltageUnit: 'V', resistance: 20, resistanceUnit: 'kΩ' },
      ],
      rf: 20,
      rfUnit: 'kΩ',
    };
    setInputs(preset);
    setErrors({});
    setResults(calculateSummingAmplifier(preset));
    onStatusChange?.('Calculated', false);
  };

  const applyPresetTest3 = () => {
    const preset: SummingAmpInputs = {
      channels: [
        { id: 'ch1', name: 'Input 1', voltage: 1, voltageUnit: 'V', resistance: 10, resistanceUnit: 'kΩ' },
        { id: 'ch2', name: 'Input 2', voltage: 2, voltageUnit: 'V', resistance: 20, resistanceUnit: 'kΩ' },
        { id: 'ch3', name: 'Input 3', voltage: 3, voltageUnit: 'V', resistance: 30, resistanceUnit: 'kΩ' },
      ],
      rf: 30,
      rfUnit: 'kΩ',
    };
    setInputs(preset);
    setErrors({});
    setResults(calculateSummingAmplifier(preset));
    onStatusChange?.('Calculated', false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* 1. Header & Subtitle */}
      <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold font-mono text-white tracking-tight">
              Summing Amplifier
            </h1>
            <span className="text-xs font-mono text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/30 px-2 py-0.5 rounded-[2px]">
              Active Simulation
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Analyze the weighted superposition of multiple input signals using an inverting summing node.
          </p>
        </div>

        {/* Quick Presets matching Lab Test Cases */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mr-1">Lab Presets:</span>
          <button
            onClick={applyPresetTest1}
            className="text-[11px] font-mono px-2.5 py-1 rounded-[2px] bg-[#111520] border border-white/10 text-slate-300 hover:border-[#00F0FF]/50 hover:text-[#00F0FF] transition-colors"
          >
            2 Inputs (Test 1: -3V)
          </button>
          <button
            onClick={applyPresetTest2}
            className="text-[11px] font-mono px-2.5 py-1 rounded-[2px] bg-[#111520] border border-white/10 text-slate-300 hover:border-[#00F0FF]/50 hover:text-[#00F0FF] transition-colors"
          >
            Weighted (Test 2: -4V)
          </button>
          <button
            onClick={applyPresetTest3}
            className="text-[11px] font-mono px-2.5 py-1 rounded-[2px] bg-[#111520] border border-white/10 text-slate-300 hover:border-[#00F0FF]/50 hover:text-[#00F0FF] transition-colors"
          >
            3 Inputs (Test 3: -6V)
          </button>
        </div>
      </div>

      {/* 2. Main Workspace Split: Parameters | Circuit Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Input Channels & Rf */}
        <div className="lg:col-span-5 rounded-[3px] border border-white/10 bg-[#1A1E29] p-4 sm:p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#00F0FF]" />
              <h2 className="text-sm font-semibold font-mono text-white uppercase tracking-wider">
                Input Channels & Feedback
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">
              {inputs.channels.length} of 4 Channels
            </span>
          </div>

          {/* Dynamic Channels List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Signal Channels (2 to 4)
              </span>
              <button
                onClick={handleAddChannel}
                disabled={inputs.channels.length >= 4}
                className="text-[11px] font-mono flex items-center gap-1 px-2 py-1 rounded-[2px] bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] hover:bg-[#00F0FF]/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Input</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {inputs.channels.map((ch, idx) => (
                <div
                  key={ch.id}
                  className="p-3 rounded-[3px] bg-[#111520] border border-white/10 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-[#00F0FF] flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]"></span>
                      {ch.name}
                    </span>
                    {inputs.channels.length > 2 && (
                      <button
                        onClick={() => handleRemoveChannel(ch.id)}
                        className="text-slate-500 hover:text-[#FF5722] p-1 transition-colors cursor-pointer"
                        title="Remove Input"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <InputNumber
                      id={`v_${ch.id}`}
                      symbol={`V${idx + 1}`}
                      label="Voltage"
                      value={ch.voltage}
                      unit={ch.voltageUnit}
                      unitOptions={['V', 'mV']}
                      onValueChange={(val) => handleUpdateChannel(ch.id, 'voltage', val)}
                      onUnitChange={(u) => handleUpdateChannel(ch.id, 'voltageUnit', u)}
                      error={errors[`ch_v_${ch.id}`]}
                    />

                    <InputNumber
                      id={`r_${ch.id}`}
                      symbol={`R${idx + 1}`}
                      label="Resistance"
                      value={ch.resistance}
                      unit={ch.resistanceUnit}
                      unitOptions={['Ω', 'kΩ', 'MΩ']}
                      onValueChange={(val) => handleUpdateChannel(ch.id, 'resistance', val)}
                      onUnitChange={(u) => handleUpdateChannel(ch.id, 'resistanceUnit', u)}
                      error={errors[`ch_r_${ch.id}`]}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Feedback Resistance Rf */}
            <div className="pt-2 border-t border-white/10">
              <InputNumber
                id="rf-summing"
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
                onUnitChange={(u) => setInputs((prev) => ({ ...prev, rfUnit: u }))}
                error={errors.rf}
                hint="Summing feedback resistor"
              />
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
                    id="summing-signalFreq"
                    symbol="f"
                    label="Test Frequency"
                    value={signalFreq}
                    unit="Hz"
                    step={100}
                    min={1}
                    max={100000}
                    onValueChange={(f) => setSignalFreq(Math.max(1, f))}
                    hint="Signal frequency for superposition"
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
                Summing Circuit Diagram & Probes
              </h2>
              <p className="text-[11px] text-slate-400">
                Dynamically renders all active input branches and live resistor values.
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
            <SummingSchematicSvg
              channels={inputs.channels}
              rfBase={results.rfBase}
              vout={results.vout}
            />
          ) : (
            <UniversalWaveformScope
              simulation={simulation}
              title="SUMMING AMPLIFIER DUAL-TRACE OSCILLOSCOPE"
              subtitle={`Superposition: Vout(t) = -Rf ∑(Vi(t)/Ri) • Frequency: ${cleanFloat(signalFreq)} Hz`}
              insight="The summing amplifier adds weighted input voltages with 180° inversion. When the output magnitude exceeds ±Vsat, the op-amp clips at the power supply rails."
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
            Weighted Inverting Superposition
          </span>
        </div>

        {/* Primary Metric Result Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ResultCard
            label="Total Output Voltage"
            symbol="Vout"
            value={cleanFloat(results.vout)}
            unit="V"
            formula="Vout = -Rf Σ(Vi/Ri)"
            subtext="Algebraic sum of weighted inverted inputs"
            accentColor="amber"
            highlight={true}
          />

          <ResultCard
            label="Active Channels"
            symbol="N"
            value={results.numInputs}
            unit="Inputs"
            formula="2 ≤ N ≤ 4"
            subtext="Parallel input branch configuration"
            accentColor="cyan"
          />

          <ResultCard
            label="Phase Inversion"
            symbol="θ"
            value="180°"
            unit=""
            formula="θ = 180°"
            subtext="Inverting summing junction polarity"
            accentColor="emerald"
          />
        </div>

        {/* Per-Channel Contributions Breakdown */}
        <div className="rounded-[3px] border border-white/10 bg-[#111520] p-4 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/10">
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              CHANNEL-BY-CHANNEL CONTRIBUTIONS
            </span>
            <span className="text-[10px] text-[#00F0FF] uppercase">Contribution = -(Rf / Rn) × Vn</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {results.contributions.map((c) => (
              <div
                key={c.channelId}
                className="p-3.5 rounded-[3px] bg-[#1A1E29] border border-white/10 space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-bold text-white text-[10px] uppercase tracking-wider">{c.name}</span>
                  <span className="text-[#00F0FF] text-[10px] bg-[#0B0F19] px-1.5 py-0.5 rounded-[2px] border border-white/10">
                    {c.weight.toFixed(2)}x
                  </span>
                </div>
                <div className="text-[#00F0FF] font-bold text-base">
                  {c.contributionFormatted}
                </div>
                <div className="text-[10px] text-slate-500">
                  -({formatResistance(results.rfBase)} / {formatResistance(c.resistanceBase)}) × {cleanFloat(c.voltageBase)}V
                </div>
              </div>
            ))}
          </div>

          {/* Mathematical Proof */}
          <div className="pt-3 border-t border-white/10 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Analytical Superposition Derivation:
              </span>
              <span className="text-[10px] text-[#FF5722] uppercase">Kirchhoff Junction</span>
            </div>
            <div className="text-white text-xs font-semibold">{results.steps.formula}</div>
            <div className="text-slate-400 text-[11px]">{results.steps.substitution}</div>
            <div className="text-[#FF5722] font-bold text-sm pt-1 border-t border-white/10">
              {results.steps.result}
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
            title="Superposition Axiom"
            category="SUMMING JUNCTION"
            formula="Vout = -Rf ∑(Vi / Ri)"
            description="Linear superposition enables the summing node to add multiple independent input voltages with distinct weighting gains set by each branch's input resistance."
            specs={[
              { label: 'Gain Weighting', value: 'Gn = -(Rf / Rn)' },
              { label: 'Phase Shift', value: '180° Inversion' },
              { label: 'Scaling Mode', value: 'Independent Weights' },
            ]}
            accentColor="cyan"
            icon="zap"
          />

          <TheoryTile
            title="Virtual Ground Isolation"
            category="NODE DYNAMICS"
            formula="V⁻ = 0.00 V | ∑ I_in + I_f = 0"
            description="The op-amp holds the inverting terminal at 0V (virtual ground). Because the summing node voltage is fixed, changes on one input channel do not alter current in other channels."
            specs={[
              { label: 'Summing Node', value: '0.00 V (V-GND)', accent: 'emerald' },
              { label: 'Cross-Talk', value: 'Zero (Total Isolation)' },
              { label: 'KCL At Node', value: 'I_f = -∑ I_i' },
            ]}
            accentColor="emerald"
            icon="check"
          />

          <TheoryTile
            title="Channel Scaling & Audio Mixing"
            category="ENGINEERING APPLICATION"
            formula="Rf = R1 = R2 → Inverting Adder"
            description="When all input resistors equal Rf, the circuit becomes an inverting adder (Vout = -(V1 + V2 + ...)). If Rn = N·Rf, it forms an analog averager."
            specs={[
              { label: 'Equal Resistors', value: 'Direct Inverted Sum' },
              { label: 'Averager Mode', value: 'Rn = N · Rf' },
              { label: 'DAC Application', value: 'Binary Weighted Ladder' },
            ]}
            accentColor="amber"
            icon="zap"
          />
        </div>
      </div>
    </div>
  );
};
