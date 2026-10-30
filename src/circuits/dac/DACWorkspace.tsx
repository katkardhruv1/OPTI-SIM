import React, { useState, useEffect } from 'react';
import { DACInputs, DACResults, DACResolution } from '../../types/circuit';
import { calculateDAC, validateDACInputs } from '../../calculations/dac';
import { InputNumber } from '../../components/ui/InputNumber';
import { ResultCard } from '../../components/ui/ResultCard';
import { TheoryTile } from '../../components/ui/TheoryTile';
import { DACSchematicSvg } from '../../components/circuit/DACSchematicSvg';
import { DACTransferGraph } from '../../components/circuit/DACTransferGraph';
import { BinaryToggleGroup } from '../../components/ui/BinaryToggleGroup';
import { cleanFloat } from '../../utils/formatters';
import { saveActiveCircuitState } from '../../utils/circuitStateBridge';
import { playTick, playError } from '../../utils/audioFeedback';
import { RotateCcw, Calculator, Zap, Eye, Activity, CheckCircle, Lightbulb } from 'lucide-react';

interface DACWorkspaceProps {
  onStatusChange?: (status: 'Ready' | 'Calculated' | 'Error', hasErrors: boolean) => void;
}

const DEFAULT_INPUTS: DACInputs = {
  resolution: 4,
  vref: 5,
  digitalBinary: '1010',
  digitalDecimal: 10,
};

export const DACWorkspace: React.FC<DACWorkspaceProps> = ({ onStatusChange }) => {
  const [inputs, setInputs] = useState<DACInputs>(DEFAULT_INPUTS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [results, setResults] = useState<DACResults>(() => calculateDAC(DEFAULT_INPUTS));
  const [viewMode, setViewMode] = useState<'transfer' | 'schematic'>('transfer');

  // Synchronize state with central bridge for Lab Mode and Exports
  useEffect(() => {
    saveActiveCircuitState('dac', inputs, results);
  }, [inputs, results]);

  const maxDecimal = Math.pow(2, inputs.resolution) - 1;

  // Handle resolution change
  const handleResolutionChange = (res: DACResolution) => {
    const newMax = Math.pow(2, res) - 1;
    // Keep decimal within new range
    const clampedDec = Math.min(inputs.digitalDecimal, newMax);
    const newBin = clampedDec.toString(2).padStart(res, '0');
    const updated: DACInputs = {
      ...inputs,
      resolution: res,
      digitalDecimal: clampedDec,
      digitalBinary: newBin,
    };
    setInputs(updated);
    setErrors({});
    const r = calculateDAC(updated);
    setResults(r);
  };

  // Synchronized update from Decimal input / slider
  const handleDecimalChange = (val: number) => {
    const clamped = Math.max(0, Math.min(maxDecimal, Math.floor(val)));
    const bin = clamped.toString(2).padStart(inputs.resolution, '0');
    const updated: DACInputs = {
      ...inputs,
      digitalDecimal: clamped,
      digitalBinary: bin,
    };
    setInputs(updated);
    if (errors.digitalDecimal || errors.digitalBinary) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.digitalDecimal;
        delete next.digitalBinary;
        return next;
      });
    }
  };

  // Synchronized update from Binary string input
  const handleBinaryChange = (binStr: string) => {
    // Filter only 0 and 1
    const cleanBin = binStr.replace(/[^01]/g, '').slice(0, inputs.resolution);
    const parsedDec = cleanBin ? parseInt(cleanBin, 2) : 0;
    const updated: DACInputs = {
      ...inputs,
      digitalBinary: cleanBin,
      digitalDecimal: isNaN(parsedDec) ? 0 : parsedDec,
    };
    setInputs(updated);
    if (errors.digitalBinary || errors.digitalDecimal) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.digitalBinary;
        delete next.digitalDecimal;
        return next;
      });
    }
  };

  // Toggle single bit
  const handleToggleBit = (bitIndex: number) => {
    playTick();
    const currentBits = inputs.digitalBinary.padStart(inputs.resolution, '0').split('');
    currentBits[bitIndex] = currentBits[bitIndex] === '1' ? '0' : '1';
    const newBin = currentBits.join('');
    const newDec = parseInt(newBin, 2);
    const updated: DACInputs = {
      ...inputs,
      digitalBinary: newBin,
      digitalDecimal: newDec,
    };
    setInputs(updated);
    const r = calculateDAC(updated);
    setResults(r);
    onStatusChange?.('Calculated', false);
  };

  const handleCalculate = () => {
    const validationErrors = validateDACInputs(inputs);

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
    const res = calculateDAC(inputs);
    setResults(res);
    onStatusChange?.('Calculated', false);
  };

  const handleReset = () => {
    playTick();
    setInputs(DEFAULT_INPUTS);
    setErrors({});
    const res = calculateDAC(DEFAULT_INPUTS);
    setResults(res);
    onStatusChange?.('Ready', false);
  };

  // Presets
  const applyPreset = (presetName: 'example' | 'zero' | 'mid' | 'full' | 'threeQuarter') => {
    let dec = 0;
    let res: DACResolution = inputs.resolution;
    if (presetName === 'example') {
      res = 4;
      dec = 10;
    } else if (presetName === 'zero') {
      dec = 0;
    } else if (presetName === 'mid') {
      dec = Math.floor(Math.pow(2, res) / 2);
    } else if (presetName === 'threeQuarter') {
      dec = Math.floor((Math.pow(2, res) * 3) / 4);
    } else if (presetName === 'full') {
      dec = Math.pow(2, res) - 1;
    }

    const bin = dec.toString(2).padStart(res, '0');
    const p: DACInputs = {
      ...inputs,
      resolution: res,
      digitalDecimal: dec,
      digitalBinary: bin,
      vref: 5,
    };
    setInputs(p);
    setErrors({});
    const r = calculateDAC(p);
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
              <span className="text-xs text-slate-400 font-mono">Module 16</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Digital-to-Analog Converter (DAC)
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Convert a digital binary input into its corresponding analog voltage using an R-2R ladder network and summing amplifier.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-mono mr-1">Presets:</span>
            <button
              onClick={() => applyPreset('example')}
              className="px-2.5 py-1 text-xs rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-[#00F0FF] border border-white/10 transition font-mono"
            >
              1010₂ (Example)
            </button>
            <button
              onClick={() => applyPreset('zero')}
              className="px-2.5 py-1 text-xs rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-slate-300 border border-white/10 transition font-mono"
            >
              Zero (0000₂)
            </button>
            <button
              onClick={() => applyPreset('mid')}
              className="px-2.5 py-1 text-xs rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-slate-300 border border-white/10 transition font-mono"
            >
              Midscale (1000₂)
            </button>
            <button
              onClick={() => applyPreset('full')}
              className="px-2.5 py-1 text-xs rounded-[3px] bg-[#111520] hover:bg-[#1A1E29] text-slate-300 border border-white/10 transition font-mono"
            >
              Full-Scale (1111₂)
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
              <span className="text-xs text-slate-400 font-mono">Ideal N-bit DAC</span>
            </div>

            {/* Resolution Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 font-medium">
                DAC Resolution (N)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([4, 8, 10] as DACResolution[]).map((r) => (
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
                Total quantization levels: 2^{inputs.resolution} = {Math.pow(2, inputs.resolution)} levels
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
              helpText="Full-scale analog voltage reference (0 V to Vref)."
            />

            {/* Tactile Hardware DIP Switch Bank */}
            <BinaryToggleGroup
              resolution={inputs.resolution}
              value={inputs.digitalBinary}
              onChange={(newBin, newDec) => {
                const updated: DACInputs = {
                  ...inputs,
                  digitalBinary: newBin,
                  digitalDecimal: newDec,
                };
                setInputs(updated);
                if (errors.digitalBinary || errors.digitalDecimal) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.digitalBinary;
                    delete next.digitalDecimal;
                    return next;
                  });
                }
                const r = calculateDAC(updated);
                setResults(r);
                onStatusChange?.('Calculated', false);
              }}
              label="Hardware DIP Switch Register"
              subtext="Toggle physical DIP switches to configure digital input word (MSB to LSB)."
              showQuickActions={true}
              showBitWeights={true}
              showDecimalReadout={true}
            />

            {/* Decimal Input and Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-slate-300 font-medium">
                  Decimal Value (D)
                </label>
                <span className="text-xs font-mono text-[#00F0FF] font-bold">
                  {inputs.digitalDecimal} / {maxDecimal}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={maxDecimal}
                step="1"
                value={inputs.digitalDecimal}
                onChange={(e) => handleDecimalChange(Number(e.target.value))}
                className="w-full accent-[#00F0FF] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0</span>
                <span>{Math.floor(maxDecimal / 2)}</span>
                <span>{maxDecimal}</span>
              </div>
            </div>

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
        </div>

        {/* Right Column: Visualizer, Results & Calculations */}
        <div className="lg:col-span-8 space-y-6">
          {/* Visualizer Mode Toggle */}
          <div className="bg-[#1A1E29] rounded-[3px] p-4 border border-white/10">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#00F0FF]" />
                <span className="text-sm font-semibold text-white tracking-wide">
                  CIRCUIT VISUALIZATION
                </span>
              </div>
              <div className="flex items-center rounded-[3px] bg-[#0B0F19] p-0.5 border border-white/10">
                <button
                  type="button"
                  onClick={() => setViewMode('transfer')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] text-xs font-mono transition ${
                    viewMode === 'transfer'
                      ? 'bg-[#00F0FF] text-[#0B0F19] shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  Transfer Curve
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
                  R-2R Schematic
                </button>
              </div>
            </div>

            {viewMode === 'transfer' ? (
              <DACTransferGraph
                resolution={results.resolution}
                vref={results.vref}
                currentCode={results.decimalValue}
                currentVout={results.vout}
                maxCode={results.maxCode}
                lsbSize={results.lsbSize}
                onSelectCode={(c) => {
                  handleDecimalChange(c);
                  const p = {
                    ...inputs,
                    digitalDecimal: c,
                    digitalBinary: c.toString(2).padStart(inputs.resolution, '0'),
                  };
                  setResults(calculateDAC(p));
                }}
              />
            ) : (
              <DACSchematicSvg
                resolution={results.resolution}
                vref={results.vref}
                binaryString={results.binaryInput}
                decimalValue={results.decimalValue}
                vout={results.vout}
              />
            )}
          </div>

          {/* Results Display Panel */}
          <div className="bg-[#1A1E29] rounded-[3px] p-5 border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2 text-sm tracking-wide">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                CALCULATED PARAMETERS & RESULTS
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded-[3px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold">
                  Vout ≈ {cleanFloat(results.vout, 4)} V
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ResultCard
                label="Resolution"
                symbol="N"
                value={`${results.resolution}-bit`}
                unit=""
                subtext="Quantization bit depth"
                accentColor="cyan"
              />
              <ResultCard
                label="Number of Levels"
                symbol="2^N"
                value={`${results.numLevels}`}
                unit="steps"
                subtext={`2^${results.resolution} discrete values`}
                accentColor="cyan"
              />
              <ResultCard
                label="Binary Input"
                symbol="D₂"
                value={results.binaryInput}
                unit="₂"
                subtext="Base-2 representation"
                accentColor="amber"
                highlight
              />
              <ResultCard
                label="Decimal Value"
                symbol="D₁₀"
                value={`${results.decimalValue}`}
                unit="₁₀"
                subtext={`Code D (0 to ${results.maxCode})`}
                accentColor="amber"
                highlight
              />
              <ResultCard
                label="Reference Voltage"
                symbol="Vref"
                value={cleanFloat(results.vref, 2)}
                unit="V"
                subtext="Full-scale reference"
                accentColor="slate"
              />
              <ResultCard
                label="LSB Size"
                symbol="LSB"
                value={cleanFloat(results.lsbSize, 4)}
                unit="V"
                subtext="Vref / (2^N - 1)"
                accentColor="emerald"
              />
              <ResultCard
                label="Maximum Code"
                symbol="Dmax"
                value={`${results.maxCode}`}
                unit=""
                subtext="2^N - 1"
                accentColor="slate"
              />
              <ResultCard
                label="Output Voltage"
                symbol="Vout"
                value={cleanFloat(results.vout, 4)}
                unit="V"
                subtext="Analog reconstructed"
                accentColor="emerald"
                highlight
              />
            </div>
          </div>

          {/* Mathematical Derivation / Step-by-Step Proof */}
          <div className="bg-[#1A1E29] rounded-[3px] p-5 border border-white/10">
            <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
              <Lightbulb className="w-4 h-4 text-[#00F0FF]" />
              MATHEMATICAL DERIVATION & PROOF
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              {/* STEP 1 */}
              <div className="bg-[#111520] rounded-[3px] p-3 border border-white/10 space-y-1">
                <div className="text-[#00F0FF] font-semibold">
                  STEP 1 — BINARY TO DECIMAL CONVERSION
                </div>
                <div className="text-slate-400">
                  {results.steps.step1BinaryToDec}
                </div>
              </div>

              {/* STEP 2 */}
              <div className="bg-[#111520] rounded-[3px] p-3 border border-white/10 space-y-1">
                <div className="text-[#FF5722] font-semibold">
                  STEP 2 — MAXIMUM DIGITAL CODE
                </div>
                <div className="text-slate-300">
                  Formula: <span className="text-slate-200">Max Code = 2^N - 1</span>
                </div>
                <div className="text-slate-400">
                  Substitution: {results.steps.step2MaxCodeFormula} = <span className="text-[#FF5722] font-bold">{results.steps.step2MaxCodeResult}</span>
                </div>
              </div>

              {/* STEP 3 */}
              <div className="bg-[#111520] rounded-[3px] p-3 border border-white/10 space-y-1">
                <div className="text-amber-400 font-semibold">
                  STEP 3 — LEAST SIGNIFICANT BIT (LSB) SIZE
                </div>
                <div className="text-slate-300">
                  Formula: <span className="text-slate-200">{results.steps.step3LsbFormula}</span>
                </div>
                <div className="text-slate-400">
                  Substitution: {results.steps.step3LsbSub}
                </div>
                <div className="text-amber-400 font-bold">
                  LSB = {results.steps.step3LsbResult}
                </div>
              </div>

              {/* STEP 4 */}
              <div className="bg-[#111520] rounded-[3px] p-3 border border-white/10 space-y-1">
                <div className="text-emerald-400 font-semibold">
                  STEP 4 — OUTPUT VOLTAGE CALCULATION
                </div>
                <div className="text-slate-300">
                  Formula: <span className="text-slate-200">{results.steps.step4VoutFormula}</span>
                </div>
                <div className="text-slate-400">
                  Substitution: {results.steps.step4VoutSub}
                </div>
                <div className="text-emerald-400 font-bold text-sm">
                  Vout = {results.steps.step4VoutResult}
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
                title="R-2R Ladder Network Architecture"
                microHeader="RESISTIVE LADDER TOPOLOGY"
                formula="Vout = Vref · ∑ (bi / 2ⁱ)  for i = 1..N"
                description="The R-2R ladder topology requires only two standard resistor values, avoiding the wide resistance spread of weighted-resistor DACs."
                bulletPoints={[
                  "Constant Thévenin equivalent resistance R seen at each node",
                  "Current divides equally by half at each successive R-2R stage",
                  "Significantly higher precision and easier thermal tracking in ICs",
                ]}
                badgeText="R-2R Topology"
                badgeVariant="cyan"
              />

              <TheoryTile
                title="Quantization Resolution & LSB Step Size"
                microHeader="ANALOG QUANTUM RESOLUTION"
                formula="V_LSB = Vref / (2ᴺ - 1)"
                description="Each bit increment increases analog output by exactly one LSB voltage step, defining the finest resolution achievable."
                bulletPoints={[
                  "4-bit DAC provides 16 discrete levels with Vref/15 steps",
                  "8-bit DAC provides 256 discrete levels with Vref/255 steps",
                  "10-bit DAC provides 1024 discrete levels for sub-millivolt accuracy",
                ]}
                badgeText="Quantization"
                badgeVariant="orange"
              />

              <TheoryTile
                title="Superposition & Binary Current Summing"
                microHeader="VIRTUAL GROUND INTEGRATION"
                description="Each digital input bit steers binary-weighted currents into the virtual ground summing junction of the output buffer amplifier."
                bulletPoints={[
                  "Op-amp inverting terminal stays pinned at virtual ground 0V",
                  "Zero switch voltage variations eliminate non-linearity",
                  "Output buffer provides low impedance drive capability",
                ]}
                specs={[
                  { label: 'Input Resistance', value: 'Constant R' },
                  { label: 'Settling Time', value: '< 200 ns' },
                  { label: 'Monotonicity', value: 'Guaranteed' },
                ]}
                badgeText="Current Steering"
                badgeVariant="slate"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
