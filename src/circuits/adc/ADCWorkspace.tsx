import React, { useState, useEffect } from 'react';
import { ADCInputs, ADCResults, ADCResolution } from '../../types/circuit';
import { calculateADC, validateADCInputs } from '../../calculations/adc';
import { InputNumber } from '../../components/ui/InputNumber';
import { ResultCard } from '../../components/ui/ResultCard';
import { TheoryTile } from '../../components/ui/TheoryTile';
import { ADCSchematicSvg } from '../../components/circuit/ADCSchematicSvg';
import { ADCTransferGraph } from '../../components/circuit/ADCTransferGraph';
import { BinaryToggleGroup } from '../../components/ui/BinaryToggleGroup';
import { cleanFloat } from '../../utils/formatters';
import { saveActiveCircuitState } from '../../utils/circuitStateBridge';
import { playTick, playError } from '../../utils/audioFeedback';
import { RotateCcw, Calculator, Zap, Eye, Activity, CheckCircle, Lightbulb, Cpu } from 'lucide-react';

interface ADCWorkspaceProps {
  onStatusChange?: (status: 'Ready' | 'Calculated' | 'Error', hasErrors: boolean) => void;
}

const DEFAULT_INPUTS: ADCInputs = {
  resolution: 4,
  vref: 5,
  vin: 2.5,
};

export const ADCWorkspace: React.FC<ADCWorkspaceProps> = ({ onStatusChange }) => {
  const [inputs, setInputs] = useState<ADCInputs>(DEFAULT_INPUTS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [results, setResults] = useState<ADCResults>(() => calculateADC(DEFAULT_INPUTS));
  const [viewMode, setViewMode] = useState<'quantization' | 'schematic'>('quantization');

  // Synchronize state with central bridge for Lab Mode and Exports
  useEffect(() => {
    saveActiveCircuitState('adc', inputs, results);
  }, [inputs, results]);

  // Handle resolution change
  const handleResolutionChange = (res: ADCResolution) => {
    const updated: ADCInputs = {
      ...inputs,
      resolution: res,
    };
    setInputs(updated);
    setErrors({});
    const r = calculateADC(updated);
    setResults(r);
  };

  const handleVinChange = (val: number) => {
    const updated: ADCInputs = {
      ...inputs,
      vin: val,
    };
    setInputs(updated);
    if (errors.vin) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.vin;
        return next;
      });
    }
  };

  const handleCalculate = () => {
    const validationErrors = validateADCInputs(inputs);

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
    const res = calculateADC(inputs);
    setResults(res);
    onStatusChange?.('Calculated', false);
  };

  const handleReset = () => {
    playTick();
    setInputs(DEFAULT_INPUTS);
    setErrors({});
    const res = calculateADC(DEFAULT_INPUTS);
    setResults(res);
    onStatusChange?.('Ready', false);
  };

  // Presets
  const applyPreset = (v: number) => {
    const p: ADCInputs = {
      ...inputs,
      vin: v,
    };
    setInputs(p);
    setErrors({});
    const r = calculateADC(p);
    setResults(r);
    onStatusChange?.('Calculated', false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#0B0F19] p-4 sm:p-6 lg:p-8 space-y-6 min-h-0">
      {/* Circuit Header */}
      <div className="bg-[#1A1E29] rounded-[3px] p-5 border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-[3px] text-[11px] font-mono font-medium bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF]">
                DATA CONVERSION
              </span>
              <span className="text-xs text-slate-400 font-mono">Module 17</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Analog-to-Digital Converter (ADC)
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Convert an analog continuous voltage input into its corresponding digital binary output using parallel comparators and priority encoding.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-mono mr-1">Vin Presets:</span>
            <button
              onClick={() => applyPreset(0.0)}
              className="px-2.5 py-1 text-xs rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-slate-300 border border-white/10 transition font-mono"
            >
              0.0 V (Zero)
            </button>
            <button
              onClick={() => applyPreset(1.25)}
              className="px-2.5 py-1 text-xs rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-slate-300 border border-white/10 transition font-mono"
            >
              1.25 V (1/4)
            </button>
            <button
              onClick={() => applyPreset(2.5)}
              className="px-2.5 py-1 text-xs rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-[#00F0FF] border border-white/10 transition font-mono"
            >
              2.5 V (Mid)
            </button>
            <button
              onClick={() => applyPreset(3.75)}
              className="px-2.5 py-1 text-xs rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-slate-300 border border-white/10 transition font-mono"
            >
              3.75 V (3/4)
            </button>
            <button
              onClick={() => applyPreset(inputs.vref)}
              className="px-2.5 py-1 text-xs rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-slate-300 border border-white/10 transition font-mono"
            >
              {cleanFloat(inputs.vref, 1)} V (Full)
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Parameter Inputs & Controls */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-[#1A1E29] rounded-[3px] p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-semibold text-white flex items-center gap-2 text-sm tracking-wide">
                <Zap className="w-4 h-4 text-[#00F0FF]" />
                INPUT PARAMETERS
              </h3>
              <span className="text-xs text-slate-400 font-mono">Flash / SAR Model</span>
            </div>

            {/* Resolution Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 font-medium">
                ADC Resolution (N)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([3, 4, 8] as ADCResolution[]).map((r) => (
                  <button
                    key={`res-${r}`}
                    type="button"
                    onClick={() => handleResolutionChange(r)}
                    className={`py-1.5 text-xs font-mono font-semibold rounded-[3px] border transition ${
                      inputs.resolution === r
                        ? 'bg-[#00F0FF] border-[#00F0FF] text-[#0B0F19] font-bold shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                        : 'bg-[#111520] border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r}-bit
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Total quantization steps: 2^{inputs.resolution} = {Math.pow(2, inputs.resolution)} levels ({Math.pow(2, inputs.resolution) - 1} comparators)
              </p>
            </div>

            {/* Vref Input */}
            <InputNumber
              id="vref"
              label="Reference Voltage (Vref)"
              symbol="Vref"
              value={inputs.vref}
              unit="V"
              step={0.1}
              min={0.1}
              max={50}
              onValueChange={(v) => {
                setInputs({ ...inputs, vref: v });
                if (errors.vref) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.vref;
                    return next;
                  });
                }
              }}
              error={errors.vref}
              helpText="Full-scale analog reference defining input conversion window."
            />

            {/* Analog Vin Input with Slider */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-slate-300 font-medium">
                  Analog Input Voltage (Vin)
                </label>
                <span className="text-xs font-mono text-[#00F0FF] font-bold">
                  {cleanFloat(inputs.vin, 3)} V
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={inputs.vref}
                step={inputs.vref / 100}
                value={Math.min(inputs.vin, inputs.vref)}
                onChange={(e) => handleVinChange(Number(e.target.value))}
                className="w-full accent-[#00F0FF] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0 V</span>
                <span>{cleanFloat(inputs.vref / 2, 2)} V</span>
                <span>{cleanFloat(inputs.vref, 2)} V</span>
              </div>
              <InputNumber
                id="vin"
                label="Fine Precision Vin"
                symbol="Vin"
                value={inputs.vin}
                unit="V"
                step={0.01}
                min={0}
                max={inputs.vref * 1.5}
                onValueChange={handleVinChange}
                error={errors.vin}
              />
            </div>

            {/* Interactive Hardware Digital Output Register & Code Targeter */}
            <BinaryToggleGroup
              resolution={inputs.resolution}
              value={results.digitalBinary}
              onChange={(newBin, newDec) => {
                const lsb = inputs.vref / Math.pow(2, inputs.resolution);
                const targetVin = Math.min(inputs.vref, Number(cleanFloat((newDec + 0.5) * lsb, 3)));
                handleVinChange(targetVin);
                const updated = { ...inputs, vin: targetVin };
                const res = calculateADC(updated);
                setResults(res);
                onStatusChange?.('Calculated', false);
              }}
              label="Hardware Digital Code Register"
              subtext="Real-time illuminated bit bus. Toggle DIP switches to target specific digital codes."
              showQuickActions={true}
              showBitWeights={true}
              showDecimalReadout={true}
            />

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleCalculate}
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-[3px] bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-[#0B0F19] font-bold text-sm transition shadow-[0_0_12px_rgba(0,240,255,0.25)]"
              >
                <Calculator className="w-4 h-4" />
                Calculate
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-slate-300 font-medium text-sm transition border border-white/10"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>

          {/* Flash Comparator Thermometer Ladder Table */}
          <div className="bg-[#1A1E29] rounded-[3px] p-5 border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <h3 className="font-semibold text-white flex items-center gap-2 text-xs font-mono tracking-wide">
                <Cpu className="w-3.5 h-3.5 text-[#00F0FF]" />
                FLASH COMPARATOR LADDER
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {results.comparatorStates.filter((s) => s.state === 'HIGH').length}/{results.numComparators} Active
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
              {results.comparatorStates.slice().reverse().map((comp) => {
                const isHigh = comp.state === 'HIGH';
                return (
                  <div
                    key={`comp-row-${comp.index}`}
                    className={`flex items-center justify-between px-2.5 py-1 rounded-[2px] border transition ${
                      isHigh
                        ? 'bg-[#00F0FF]/10 border-[#00F0FF]/30 text-[#00F0FF]'
                        : 'bg-[#111520] border-white/10 text-slate-400'
                    }`}
                  >
                    <span className="font-semibold">C{comp.index} (Vth = {cleanFloat(comp.thresholdVoltage, 2)} V)</span>
                    <span className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold ${
                      isHigh ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'bg-[#0B0F19] text-slate-400'
                    }`}>
                      {comp.state} ({isHigh ? '1' : '0'})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Visualizer, Results & Calculations */}
        <div className="lg:col-span-8 space-y-6">
          {/* Visualizer Mode Toggle */}
          <div className="bg-[#1A1E29] rounded-[3px] p-4 border border-white/10">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#00F0FF]" />
                <span className="text-sm font-semibold text-white tracking-wide">
                  ADC VISUALIZATION
                </span>
              </div>
              <div className="flex items-center rounded-[3px] bg-[#0B0F19] p-0.5 border border-white/10">
                <button
                  type="button"
                  onClick={() => setViewMode('quantization')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] text-xs font-mono transition ${
                    viewMode === 'quantization'
                      ? 'bg-[#00F0FF] text-[#0B0F19] shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  Quantizer Curve
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('schematic')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] text-xs font-mono transition ${
                    viewMode === 'schematic'
                      ? 'bg-[#00F0FF] text-[#0B0F19] shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Flash Schematic
                </button>
              </div>
            </div>

            {viewMode === 'quantization' ? (
              <ADCTransferGraph
                resolution={results.resolution}
                vref={results.vref}
                vin={results.vin}
                currentCode={results.digitalDecimal}
                maxCode={results.maxCode}
                lsbSize={results.lsbSize}
                quantizedVoltage={results.quantizedVoltage}
                quantizationError={results.quantizationError}
              />
            ) : (
              <ADCSchematicSvg
                resolution={results.resolution}
                vref={results.vref}
                vin={results.vin}
                digitalBinary={results.digitalBinary}
                digitalDecimal={results.digitalDecimal}
                comparatorStates={results.comparatorStates}
              />
            )}
          </div>

          {/* Results Display Panel */}
          <div className="bg-[#1A1E29] rounded-[3px] p-5 border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2 text-sm tracking-wide">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                CONVERSION RESULTS & ERROR METRICS
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded-[3px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold">
                  Code: {results.digitalBinary}₂ ({results.digitalDecimal}₁₀)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ResultCard
                label="Analog Vin"
                symbol="Vin"
                value={cleanFloat(results.vin, 3)}
                unit="V"
                subtext="Input continuous signal"
                accentColor="cyan"
                highlight
              />
              <ResultCard
                label="Reference Vref"
                symbol="Vref"
                value={cleanFloat(results.vref, 2)}
                unit="V"
                subtext="Full-scale range"
                accentColor="slate"
              />
              <ResultCard
                label="Resolution"
                symbol="N"
                value={`${results.resolution}-bit`}
                unit=""
                subtext={`${results.numLevels} quantization steps`}
                accentColor="cyan"
              />
              <ResultCard
                label="LSB Step Size"
                symbol="LSB"
                value={cleanFloat(results.lsbSize, 4)}
                unit="V"
                subtext="Vref / 2^N"
                accentColor="emerald"
              />
              <ResultCard
                label="Digital Output (Dec)"
                symbol="D₁₀"
                value={`${results.digitalDecimal}`}
                unit="₁₀"
                subtext={`Range 0 to ${results.maxCode}`}
                accentColor="emerald"
                highlight
              />
              <ResultCard
                label="Digital Output (Bin)"
                symbol="D₂"
                value={results.digitalBinary}
                unit="₂"
                subtext="Encoded binary word"
                accentColor="emerald"
                highlight
              />
              <ResultCard
                label="Quantized Voltage"
                symbol="Vq"
                value={cleanFloat(results.quantizedVoltage, 4)}
                unit="V"
                subtext="D × LSB"
                accentColor="slate"
              />
              <ResultCard
                label="Quantization Error"
                symbol="ε"
                value={cleanFloat(results.quantizationError, 4)}
                unit="V"
                subtext="Vin - Vq (within 0 to LSB)"
                accentColor="amber"
              />
            </div>
          </div>

          {/* Mathematical Derivation / Step-by-Step Proof */}
          <div className="bg-[#1A1E29] rounded-[3px] p-5 border border-white/10">
            <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
              <Lightbulb className="w-4 h-4 text-[#00F0FF]" />
              MATHEMATICAL DERIVATION & QUANTIZATION PROOF
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              {/* STEP 1 */}
              <div className="bg-[#111520] rounded-[3px] p-3 border border-white/10 space-y-1">
                <div className="text-[#00F0FF] font-semibold">
                  STEP 1 — QUANTIZATION LEVELS & LSB STEP SIZE
                </div>
                <div className="text-slate-300">
                  {results.steps.step1LevelsAndLsb}
                </div>
                <div className="text-slate-400">
                  Substitution: {results.steps.step1LsbSub}
                </div>
                <div className="text-[#00F0FF] font-bold">
                  LSB = {results.steps.step1LsbResult}
                </div>
              </div>

              {/* STEP 2 */}
              <div className="bg-[#111520] rounded-[3px] p-3 border border-white/10 space-y-1">
                <div className="text-[#FF5722] font-semibold">
                  STEP 2 — NORMALIZED CODE & QUANTIZATION
                </div>
                <div className="text-slate-300">
                  Formula: <span className="text-slate-200">{results.steps.step2CodeFormula}</span>
                </div>
                <div className="text-slate-400">
                  Substitution: {results.steps.step2CodeSub}
                </div>
                <div className="text-[#FF5722] font-bold">
                  Digital Code D = {results.steps.step2CodeResult}
                </div>
              </div>

              {/* STEP 3 */}
              <div className="bg-[#111520] rounded-[3px] p-3 border border-white/10 space-y-1">
                <div className="text-amber-400 font-semibold">
                  STEP 3 — BINARY WORD ENCODING
                </div>
                <div className="text-slate-300">
                  Conversion: {results.steps.step3BinaryConversion}
                </div>
              </div>

              {/* STEP 4 */}
              <div className="bg-[#111520] rounded-[3px] p-3 border border-white/10 space-y-1">
                <div className="text-emerald-400 font-semibold">
                  STEP 4 — QUANTIZED ANALOG VOLTAGE
                </div>
                <div className="text-slate-300">
                  Formula: <span className="text-slate-200">{results.steps.step4QuantizedFormula}</span>
                </div>
                <div className="text-slate-400">
                  Substitution: {results.steps.step4QuantizedSub} = <span className="text-emerald-300 font-bold">{results.steps.step4QuantizedResult}</span>
                </div>
              </div>

              {/* STEP 5 */}
              <div className="bg-[#111520] rounded-[3px] p-3 border border-white/10 space-y-1 md:col-span-2">
                <div className="text-cyan-400 font-semibold">
                  STEP 5 — QUANTIZATION ERROR ANALYSIS
                </div>
                <div className="text-slate-300">
                  Formula: <span className="text-slate-200">{results.steps.step5ErrorFormula}</span>
                </div>
                <div className="text-slate-400">
                  Substitution: {results.steps.step5ErrorSub} = <span className="text-amber-400 font-bold">{results.steps.step5ErrorResult}</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  (Error is bounded within [0, +LSB] for ideal truncating quantizer, or [-LSB/2, +LSB/2] with half-step offset)
                </div>
              </div>
            </div>
          </div>

          {/* Theory & Circuit Fundamentals */}
          <div className="bg-[#1A1E29] rounded-[3px] p-5 border border-white/10 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
              <Lightbulb className="w-4 h-4 text-[#00F0FF]" />
              <h2 className="text-xs font-mono font-semibold text-slate-200 uppercase tracking-wider">
                Theory & Circuit Fundamentals
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TheoryTile
                title="Flash ADC Parallel Comparator Architecture"
                microHeader="PARALLEL COMPARATOR BANK"
                formula="N_comp = 2ᴺ - 1 (Parallel Comparators)"
                description="Flash ADCs utilize a resistive divider chain feeding 2^N - 1 comparators simultaneously, achieving sub-nanosecond conversion latency."
                bulletPoints={[
                  "Every quantization threshold is evaluated in parallel during a single clock cycle",
                  "Fastest conversion speed among all ADC architectures (GHz range)",
                  "Requires exponential hardware growth: 3-bit = 7 comp, 8-bit = 255 comp",
                ]}
                badgeText="Flash Topology"
                badgeVariant="cyan"
              />

              <TheoryTile
                title="Quantization Noise & Theoretical SNR"
                microHeader="QUANTIZATION NOISE FLOOR"
                formula="SNR = 6.02 · N + 1.76 dB"
                description="Converting continuous analog voltages into discrete codes introduces an irreducible quantization uncertainty bounded by ±0.5 LSB."
                bulletPoints={[
                  "Quantization noise power is uniform over the Nyquist band",
                  "Each additional bit of resolution increases dynamic range by ~6.02 dB",
                  "8-bit ADC provides ~49.9 dB theoretical SNR; 16-bit yields ~98 dB",
                ]}
                badgeText="Noise & Dynamic Range"
                badgeVariant="orange"
              />

              <TheoryTile
                title="Priority Encoder & Thermometer-to-Binary"
                microHeader="THERMOMETER LOGIC DECODE"
                description="The parallel output of the comparator bank forms a thermometer code, which is decoded into compact binary format by a high-speed priority encoder."
                bulletPoints={[
                  "Comparator outputs are all 1s below Vin and all 0s above Vin",
                  "Encoder detects the 1-to-0 boundary transition index",
                  "Bubble error correction logic eliminates spark codes from comparator race conditions",
                ]}
                specs={[
                  { label: 'Latency', value: '< 1 Clock Cycle' },
                  { label: 'Complexity', value: 'O(2^N)' },
                  { label: 'Encoding', value: 'Thermometer -> Bin' },
                ]}
                badgeText="Logic Decoding"
                badgeVariant="slate"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
