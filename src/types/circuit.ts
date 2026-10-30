export type CircuitCategory = 'linear' | 'non-linear' | 'data-conversion';

export interface CircuitDefinition {
  id: string;
  name: string;
  category: CircuitCategory;
  categoryLabel: string;
  shortDescription: string;
  status: 'active' | 'coming-soon';
  tags?: string[];
}

export interface InvertingAmpInputs {
  vin: number;
  vinUnit: 'V' | 'mV';
  rin: number;
  rinUnit: 'Ω' | 'kΩ' | 'MΩ';
  rf: number;
  rfUnit: 'Ω' | 'kΩ' | 'MΩ';
}

export interface InvertingAmpResults {
  // Base SI values for exact calculations
  vinBase: number; // in Volts
  rinBase: number; // in Ohms
  rfBase: number;  // in Ohms
  
  // Results
  av: number;
  vout: number;
  phaseShiftDeg: number;
  iin: number; // Input current (A)
  zin: number; // Input impedance (Ohms)
  vVirtualGround: number; // 0 V
  
  // Formatted step strings
  steps: {
    avFormula: string;
    avSubstitution: string;
    avResult: string;
    voutFormula: string;
    voutSubstitution: string;
    voutResult: string;
    phaseResult: string;
  };
}

export interface NonInvertingAmpInputs {
  vin: number;
  vinUnit: 'V' | 'mV';
  r1: number;
  r1Unit: 'Ω' | 'kΩ' | 'MΩ';
  rf: number;
  rfUnit: 'Ω' | 'kΩ' | 'MΩ';
}

export interface NonInvertingAmpResults {
  vinBase: number;
  r1Base: number;
  rfBase: number;
  av: number;
  vout: number;
  phaseShiftDeg: number;
  iin: number;
  zin: string; // Typically ~10^12 ohms (infinite for ideal)
  vFeedbackNode: number; // V- = Vin (Virtual short)
  steps: {
    avFormula: string;
    avSubstitution: string;
    avResult: string;
    voutFormula: string;
    voutSubstitution: string;
    voutResult: string;
    phaseResult: string;
  };
}

export interface VoltageFollowerInputs {
  vin: number;
  vinUnit: 'V' | 'mV';
}

export interface VoltageFollowerResults {
  vinBase: number;
  av: number;
  vout: number;
  phaseShiftDeg: number;
  zin: string;
  zout: string;
  steps: {
    avFormula: string;
    avResult: string;
    voutFormula: string;
    voutSubstitution: string;
    voutResult: string;
    phaseResult: string;
  };
}

export interface SummingInputChannel {
  id: string;
  name: string;
  voltage: number;
  voltageUnit: 'V' | 'mV';
  resistance: number;
  resistanceUnit: 'Ω' | 'kΩ' | 'MΩ';
}

export interface SummingAmpInputs {
  channels: SummingInputChannel[];
  rf: number;
  rfUnit: 'Ω' | 'kΩ' | 'MΩ';
}

export interface InputContribution {
  channelId: string;
  name: string;
  voltageBase: number;
  resistanceBase: number;
  weight: number; // Rf / Rn
  contribution: number; // - (Rf / Rn) * Vn
  contributionFormatted: string;
}

export interface SummingAmpResults {
  numInputs: number;
  rfBase: number;
  contributions: InputContribution[];
  vout: number;
  phaseShiftDeg: number;
  steps: {
    formula: string;
    substitution: string;
    result: string;
  };
}

export interface DifferentialAmpInputs {
  v1: number;
  v1Unit: 'V' | 'mV';
  v2: number;
  v2Unit: 'V' | 'mV';
  r1: number;
  r1Unit: 'Ω' | 'kΩ' | 'MΩ';
  r2: number;
  r2Unit: 'Ω' | 'kΩ' | 'MΩ';
  rf: number;
  rfUnit: 'Ω' | 'kΩ' | 'MΩ';
  rg: number;
  rgUnit: 'Ω' | 'kΩ' | 'MΩ';
}

export interface DifferentialAmpResults {
  v1Base: number;
  v2Base: number;
  r1Base: number;
  r2Base: number;
  rfBase: number;
  rgBase: number;
  vdiff: number; // V2 - V1
  ad: number;    // Rf / R1
  vout: number;
  phaseShiftDeg: number;
  isMatched: boolean;
  steps: {
    vdiffFormula: string;
    vdiffSubstitution: string;
    vdiffResult: string;
    gainFormula: string;
    gainSubstitution: string;
    gainResult: string;
    voutFormula: string;
    voutSubstitution: string;
    voutResult: string;
  };
}

export type WaveformType = 'square' | 'sine' | 'triangle';

export interface IntegratorInputs {
  vin: number;
  vinUnit: 'V' | 'mV';
  frequency: number;
  frequencyUnit: 'Hz' | 'kHz';
  r: number;
  rUnit: 'Ω' | 'kΩ' | 'MΩ';
  c: number;
  cUnit: 'µF' | 'nF' | 'pF';
  waveform: WaveformType;
}

export interface IntegratorResults {
  vinBase: number;
  freqBase: number;
  rBase: number;
  cBase: number;
  rcTimeConstant: number;
  gain: number;
  expectedOutputWaveform: string;
  steps: {
    rcFormula: string;
    rcSubstitution: string;
    rcResult: string;
    gainFormula: string;
    gainSubstitution: string;
    gainResult: string;
    outputExplanation: string;
  };
}

export interface DifferentiatorInputs {
  vin: number;
  vinUnit: 'V' | 'mV';
  frequency: number;
  frequencyUnit: 'Hz' | 'kHz';
  c: number;
  cUnit: 'µF' | 'nF' | 'pF';
  r: number;
  rUnit: 'Ω' | 'kΩ' | 'MΩ';
  waveform: WaveformType;
}

export interface DifferentiatorResults {
  vinBase: number;
  freqBase: number;
  cBase: number;
  rBase: number;
  rcTimeConstant: number;
  gain: number;
  expectedOutputWaveform: string;
  steps: {
    rcFormula: string;
    rcSubstitution: string;
    rcResult: string;
    gainFormula: string;
    gainSubstitution: string;
    gainResult: string;
    outputExplanation: string;
  };
}

export interface FilterInputs {
  passbandGain: number; // A (default: 2)
  r: number;            // R (default: 10 kΩ)
  rUnit: 'Ω' | 'kΩ' | 'MΩ';
  c: number;            // C (default: 0.01 µF)
  cUnit: 'µF' | 'nF' | 'pF';
  vin: number;          // Vin (default: 1 V)
  vinUnit: 'V' | 'mV';
  frequency: number;    // Test frequency (default: 1000 Hz)
  frequencyUnit: 'Hz' | 'kHz';
  waveform: WaveformType;
}

export interface FilterResults {
  vinBase: number;
  freqBase: number;
  rBase: number;
  cBase: number;
  passbandGain: number;
  rcTimeConstant: number;
  fc: number;          // Cutoff frequency in Hz
  freqRatio: number;   // f / fc
  gainMag: number;     // |H(f)|
  gainDb: number;      // 20 log10(|H(f)|)
  vout: number;        // Vin * |H(f)|
  phaseShiftDeg: number;
  steps: {
    rcFormula: string;
    rcSubstitution: string;
    rcResult: string;
    fcFormula: string;
    fcSubstitution: string;
    fcResult: string;
    ratioFormula: string;
    ratioResult: string;
    hFormula: string;
    hSubstitution: string;
    hResult: string;
    voutFormula: string;
    voutSubstitution: string;
    voutResult: string;
    dbFormula: string;
    dbResult: string;
  };
}

export interface PrecisionRectifierInputs {
  vin: number;
  vinUnit: 'V' | 'mV';
  frequency: number;
  frequencyUnit: 'Hz' | 'kHz';
  diodeType: string; // 'Ideal Diode'
}

export interface PrecisionRectifierResults {
  vinBase: number;
  freqBase: number;
  voutPosPeak: number;
  voutNegPeak: number;
  rectificationType: string;
  steps: {
    posCycleFormula: string;
    posCycleResult: string;
    negCycleFormula: string;
    negCycleResult: string;
    principleExplanation: string;
  };
}

export type ComparatorType = 'non-inverting' | 'inverting';

export interface ComparatorInputs {
  vin: number;
  vinUnit: 'V' | 'mV';
  vref: number;
  vrefUnit: 'V' | 'mV';
  posVsat: number;
  negVsat: number;
  comparatorType: ComparatorType;
  waveform: WaveformType;
  frequency: number;
  frequencyUnit: 'Hz' | 'kHz';
}

export interface ComparatorResults {
  vinBase: number;
  vrefBase: number;
  posVsat: number;
  negVsat: number;
  comparatorType: ComparatorType;
  vout: number;
  stateLabel: string; // 'HIGH / +Vsat' or 'LOW / -Vsat' or 'TRANSITION'
  isSaturatedPos: boolean;
  steps: {
    step1Comparison: string;
    step1Result: string;
    step2Logic: string;
    step2Result: string;
    step3Output: string;
  };
}

export interface SchmittTriggerInputs {
  vinAmplitude: number;
  vinUnit: 'V' | 'mV';
  vrefCenter: number;
  posVsat: number;
  negVsat: number;
  rf: number;
  rfUnit: 'Ω' | 'kΩ' | 'MΩ';
  r1: number;
  r1Unit: 'Ω' | 'kΩ' | 'MΩ';
  waveform: WaveformType;
  frequency: number;
  frequencyUnit: 'Hz' | 'kHz';
}

export interface SchmittTriggerResults {
  vinAmpBase: number;
  vrefCenter: number;
  posVsat: number;
  negVsat: number;
  r1Base: number;
  rfBase: number;
  beta: number;       // R1 / (R1 + Rf)
  utp: number;        // +beta * Vsat
  ltp: number;        // -beta * Vsat
  hysteresisWidth: number; // UTP - LTP
  currentVout: number; // based on current Vin amplitude
  currentStateLabel: string;
  steps: {
    step1BetaFormula: string;
    step1BetaSub: string;
    step1BetaResult: string;
    step2UtpFormula: string;
    step2UtpSub: string;
    step2UtpResult: string;
    step3LtpFormula: string;
    step3LtpSub: string;
    step3LtpResult: string;
    step4VhFormula: string;
    step4VhSub: string;
    step4VhResult: string;
  };
}

export interface SquareWaveInputs {
  posVsat: number;
  negVsat: number;
  r1: number;
  r1Unit: 'Ω' | 'kΩ' | 'MΩ';
  r2: number;
  r2Unit: 'Ω' | 'kΩ' | 'MΩ';
  r: number;
  rUnit: 'Ω' | 'kΩ' | 'MΩ';
  c: number;
  cUnit: 'µF' | 'nF' | 'pF';
}

export interface SquareWaveResults {
  posVsat: number;
  negVsat: number;
  r1Base: number;
  r2Base: number;
  rBase: number;
  cBase: number;
  beta: number; // R1 / (R1 + R2)
  timePeriod: number; // 2RC ln((1+beta)/(1-beta))
  frequency: number; // 1 / T
  vMax: number;
  vMin: number;
  dutyCycle: number; // 50%
  steps: {
    step1BetaFormula: string;
    step1BetaSub: string;
    step1BetaResult: string;
    step2PeriodFormula: string;
    step2PeriodSub: string;
    step2PeriodResult: string;
    step3FreqFormula: string;
    step3FreqSub: string;
    step3FreqResult: string;
    step4Levels: string;
    step5Duty: string;
  };
}

export interface TriangularWaveInputs {
  amplitude: number;
  amplitudeUnit: 'V' | 'mV';
  frequency: number;
  frequencyUnit: 'Hz' | 'kHz';
  r: number;
  rUnit: 'Ω' | 'kΩ' | 'MΩ';
  c: number;
  cUnit: 'µF' | 'nF' | 'pF';
  offset: number;
}

export interface TriangularWaveResults {
  ampBase: number;
  freqBase: number;
  rBase: number;
  cBase: number;
  offset: number;
  rcTimeConstant: number;
  timePeriod: number;
  outputSlope: number; // |Vin| / RC in V/s
  vpp: number; // Vin * T / (2 * RC)
  vPeak: number; // vpp / 2
  steps: {
    rcFormula: string;
    rcSub: string;
    rcResult: string;
    periodFormula: string;
    periodResult: string;
    slopeFormula: string;
    slopeSub: string;
    slopeResult: string;
    vppFormula: string;
    vppSub: string;
    vppResult: string;
  };
}

export interface PWMInputs {
  carrierFreq: number;
  carrierFreqUnit: 'Hz' | 'kHz';
  carrierAmp: number;
  vMin: number;
  vMax: number;
  vControl: number;
  pwmMode: 'comparator-based';
}

export interface PWMResults {
  carrierFreq: number;
  carrierAmp: number;
  vMin: number;
  vMax: number;
  vControl: number;
  controlRatio: number; // (Vcontrol - Vmin)/(Vmax - Vmin) clamped 0 to 1
  dutyCycle: number; // %
  timePeriod: number; // seconds
  tHigh: number; // seconds
  tLow: number; // seconds
  steps: {
    periodFormula: string;
    periodResult: string;
    ratioFormula: string;
    ratioSub: string;
    ratioResult: string;
    dutyFormula: string;
    dutySub: string;
    dutyResult: string;
    tHighFormula: string;
    tHighSub: string;
    tHighResult: string;
    tLowFormula: string;
    tLowSub: string;
    tLowResult: string;
  };
}

export type DACResolution = 4 | 8 | 10;

export interface DACInputs {
  resolution: DACResolution;
  vref: number;
  digitalBinary: string;
  digitalDecimal: number;
}

export interface DACResults {
  resolution: DACResolution;
  numLevels: number;
  binaryInput: string;
  decimalValue: number;
  vref: number;
  lsbSize: number;
  maxCode: number;
  vout: number;
  steps: {
    step1BinaryToDec: string;
    step2MaxCodeFormula: string;
    step2MaxCodeResult: string;
    step3LsbFormula: string;
    step3LsbSub: string;
    step3LsbResult: string;
    step4VoutFormula: string;
    step4VoutSub: string;
    step4VoutResult: string;
  };
}

export type ADCResolution = 3 | 4 | 8;

export interface ADCInputs {
  resolution: ADCResolution;
  vref: number;
  vin: number;
}

export interface ADCComparatorState {
  index: number;
  thresholdVoltage: number;
  state: 'HIGH' | 'LOW';
}

export interface ADCResults {
  resolution: ADCResolution;
  numLevels: number;
  vref: number;
  vin: number;
  lsbSize: number;
  maxCode: number;
  digitalDecimal: number;
  digitalBinary: string;
  quantizedVoltage: number;
  quantizationError: number;
  numComparators: number;
  comparatorStates: ADCComparatorState[];
  thermometerCode: string;
  steps: {
    step1LevelsAndLsb: string;
    step1LsbSub: string;
    step1LsbResult: string;
    step2CodeFormula: string;
    step2CodeSub: string;
    step2CodeResult: string;
    step3BinaryConversion: string;
    step4QuantizedFormula: string;
    step4QuantizedSub: string;
    step4QuantizedResult: string;
    step5ErrorFormula: string;
    step5ErrorSub: string;
    step5ErrorResult: string;
  };
}

export interface ValidationError {
  field?: string;
  message: string;
}

