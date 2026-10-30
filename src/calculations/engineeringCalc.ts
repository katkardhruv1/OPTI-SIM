/**
 * Central Engineering Calculation Layer for OPTI-SIM
 * Standardizes circuit formulas, unit conversions, numerical precision,
 * clipping, and metric calculations across all 17 op-amp modules.
 */

// ============================================================================
// 1. ENGINEERING UNIT CONVERSIONS
// ============================================================================

export type ResistanceUnit = 'Ω' | 'kΩ' | 'MΩ';
export type CapacitanceUnit = 'F' | 'µF' | 'nF' | 'pF';
export type FrequencyUnit = 'Hz' | 'kHz' | 'MHz';
export type VoltageUnit = 'V' | 'mV';
export type TimeUnit = 's' | 'ms' | 'µs' | 'ns';

export function toOhms(val: number, unit: ResistanceUnit = 'Ω'): number {
  if (!isFinite(val)) return 0;
  switch (unit) {
    case 'kΩ': return val * 1e3;
    case 'MΩ': return val * 1e6;
    default: return val;
  }
}

export function fromOhms(ohms: number, targetUnit: ResistanceUnit = 'Ω'): number {
  if (!isFinite(ohms)) return 0;
  switch (targetUnit) {
    case 'kΩ': return ohms / 1e3;
    case 'MΩ': return ohms / 1e6;
    default: return ohms;
  }
}

export function toFarads(val: number, unit: CapacitanceUnit = 'µF'): number {
  if (!isFinite(val)) return 0;
  switch (unit) {
    case 'µF': return val * 1e-6;
    case 'nF': return val * 1e-9;
    case 'pF': return val * 1e-12;
    default: return val;
  }
}

export function fromFarads(farads: number, targetUnit: CapacitanceUnit = 'µF'): number {
  if (!isFinite(farads)) return 0;
  switch (targetUnit) {
    case 'µF': return farads * 1e6;
    case 'nF': return farads * 1e9;
    case 'pF': return farads * 1e12;
    default: return farads;
  }
}

export function toHertz(val: number, unit: FrequencyUnit = 'Hz'): number {
  if (!isFinite(val)) return 0;
  switch (unit) {
    case 'kHz': return val * 1e3;
    case 'MHz': return val * 1e6;
    default: return val;
  }
}

export function fromHertz(hz: number, targetUnit: FrequencyUnit = 'Hz'): number {
  if (!isFinite(hz)) return 0;
  switch (targetUnit) {
    case 'kHz': return hz / 1e3;
    case 'MHz': return hz / 1e6;
    default: return hz;
  }
}

export function toVolts(val: number, unit: VoltageUnit = 'V'): number {
  if (!isFinite(val)) return 0;
  return unit === 'mV' ? val * 1e-3 : val;
}

export function fromVolts(volts: number, targetUnit: VoltageUnit = 'V'): number {
  if (!isFinite(volts)) return 0;
  return targetUnit === 'mV' ? volts * 1e3 : volts;
}

export function toSeconds(val: number, unit: TimeUnit = 's'): number {
  if (!isFinite(val)) return 0;
  switch (unit) {
    case 'ms': return val * 1e-3;
    case 'µs': return val * 1e-6;
    case 'ns': return val * 1e-9;
    default: return val;
  }
}

export function fromSeconds(seconds: number, targetUnit: TimeUnit = 's'): number {
  if (!isFinite(seconds)) return 0;
  switch (targetUnit) {
    case 'ms': return seconds * 1e3;
    case 'µs': return seconds * 1e6;
    case 'ns': return seconds * 1e9;
    default: return seconds;
  }
}

// ============================================================================
// 2. CORE AMPLIFIER CALCULATIONS
// ============================================================================

/**
 * Calculates inverting amplifier closed-loop gain: Av = -Rf / Rin
 */
export function calcInvertingGain(rinOhms: number, rfOhms: number): number {
  if (rinOhms <= 0) return 0;
  return -(rfOhms / rinOhms);
}

/**
 * Calculates non-inverting amplifier closed-loop gain: Av = 1 + (Rf / R1)
 */
export function calcNonInvertingGain(r1Ohms: number, rfOhms: number): number {
  if (r1Ohms <= 0) return 1;
  return 1 + (rfOhms / r1Ohms);
}

/**
 * Voltage follower unity gain: Av = 1
 */
export function calcVoltageFollowerGain(): number {
  return 1;
}

/**
 * Calculates differential amplifier gain (for matched bridge): Ad = Rf / R1
 */
export function calcDifferentialGain(r1Ohms: number, rfOhms: number): number {
  if (r1Ohms <= 0) return 0;
  return rfOhms / r1Ohms;
}

/**
 * Calculates differential amplifier output using superposition
 * V+ = V2 * [Rg / (R2 + Rg)]
 * Vout = V+ * (1 + Rf/R1) - V1 * (Rf/R1)
 */
export function calcDifferentialOutput(
  v1: number,
  v2: number,
  r1: number,
  r2: number,
  rf: number,
  rg: number
): { vdiff: number; vout: number; gain: number; isMatched: boolean } {
  const vdiff = v2 - v1;
  const ratio1 = r1 > 0 ? rf / r1 : 0;
  const ratio2 = r2 > 0 ? rg / r2 : 0;
  const isMatched = Math.abs(ratio1 - ratio2) < 1e-6;

  let vout = 0;
  if (isMatched) {
    vout = ratio1 * vdiff;
  } else {
    const vPlus = (r2 + rg) > 0 ? v2 * (rg / (r2 + rg)) : 0;
    vout = vPlus * (1 + ratio1) - v1 * ratio1;
  }

  return {
    vdiff,
    vout,
    gain: ratio1,
    isMatched,
  };
}

/**
 * Calculates summing amplifier output: Vout = -Rf * ∑(Vi / Ri)
 */
export function calcSummingOutput(
  channels: { voltage: number; resistance: number }[],
  rf: number
): { vout: number; contributions: { voltage: number; weight: number; contribution: number }[] } {
  let totalVout = 0;
  const contributions = channels.map((ch) => {
    const weight = ch.resistance > 0 ? rf / ch.resistance : 0;
    const contribution = -weight * ch.voltage;
    totalVout += contribution;
    return {
      voltage: ch.voltage,
      weight,
      contribution,
    };
  });

  return { vout: totalVout, contributions };
}

// ============================================================================
// 3. FREQUENCY, REACTANCE & TIME DOMAIN UTILITIES
// ============================================================================

/**
 * Calculates first-order RC cutoff frequency: fc = 1 / (2 * π * R * C)
 */
export function calcCutoffFrequency(rOhms: number, cFarads: number): number {
  if (rOhms <= 0 || cFarads <= 0) return 0;
  return 1 / (2 * Math.PI * rOhms * cFarads);
}

/**
 * Calculates capacitive reactance: Xc = 1 / (2 * π * f * C)
 */
export function calcCapacitiveReactance(freqHz: number, cFarads: number): number {
  if (freqHz <= 0 || cFarads <= 0) return Infinity;
  return 1 / (2 * Math.PI * freqHz * cFarads);
}

/**
 * Calculates inductive reactance: XL = 2 * π * f * L
 */
export function calcInductiveReactance(freqHz: number, lHenries: number): number {
  if (freqHz < 0 || lHenries < 0) return 0;
  return 2 * Math.PI * freqHz * lHenries;
}

/**
 * Calculates frequency from period in seconds: f = 1 / T
 */
export function calcFrequency(periodSec: number): number {
  return periodSec > 0 ? 1 / periodSec : 0;
}

/**
 * Calculates period in seconds from frequency in Hertz: T = 1 / f
 */
export function calcPeriod(freqHz: number): number {
  return freqHz > 0 ? 1 / freqHz : 0;
}

/**
 * Calculates dB gain: Gain(dB) = 20 * log10(|Av|)
 */
export function calcDbGain(linearGain: number): number {
  const absGain = Math.abs(linearGain);
  if (absGain <= 0 || !isFinite(absGain)) return -120;
  return 20 * Math.log10(absGain);
}

// ============================================================================
// 4. WAVEFORM METRICS (RMS, Vpp, Saturation/Clipping)
// ============================================================================

/**
 * Applies realistic op-amp power supply voltage rail saturation
 * Default rails: +15V, -15V
 */
export function applyClipping(
  v: number,
  posVsat: number = 15,
  negVsat: number = -15
): { value: number; isClipped: boolean; isSaturatedPos: boolean; isSaturatedNeg: boolean } {
  if (v > posVsat) {
    return { value: posVsat, isClipped: true, isSaturatedPos: true, isSaturatedNeg: false };
  }
  if (v < negVsat) {
    return { value: negVsat, isClipped: true, isSaturatedPos: false, isSaturatedNeg: true };
  }
  return { value: v, isClipped: false, isSaturatedPos: false, isSaturatedNeg: false };
}

/**
 * Calculates peak-to-peak voltage: Vpp = max - min
 */
export function calcVpp(values: number[]): number {
  if (!values || values.length === 0) return 0;
  let min = values[0];
  let max = values[0];
  for (let i = 1; i < values.length; i++) {
    const v = values[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return max - min;
}

/**
 * Calculates RMS voltage from numerical sample array: Vrms = sqrt(mean(v^2))
 */
export function calcRMS(values: number[]): number {
  if (!values || values.length === 0) return 0;
  let sumSq = 0;
  for (let i = 0; i < values.length; i++) {
    sumSq += values[i] * values[i];
  }
  return Math.sqrt(sumSq / values.length);
}

// ============================================================================
// 5. DATA CONVERSION UTILITIES (ADC / DAC)
// ============================================================================

/**
 * Converts digital integer code D to analog voltage for N-bit DAC
 * Vout = (D / (2^N - 1)) * Vref
 */
export function calcDACConversion(
  digitalDecimal: number,
  vref: number,
  resolution: number
): { vout: number; lsbSize: number; maxCode: number } {
  const maxCode = Math.pow(2, resolution) - 1;
  const clampedD = Math.max(0, Math.min(maxCode, Math.floor(digitalDecimal || 0)));
  const lsbSize = maxCode > 0 ? vref / maxCode : 0;
  const vout = maxCode > 0 ? (clampedD / maxCode) * vref : 0;
  return { vout, lsbSize, maxCode };
}

/**
 * Quantizes continuous analog voltage Vin into digital code D for N-bit ADC
 * maxCode = 2^N - 1
 * LSB = Vref / (2^N - 1)
 * D = clamp(round((Vin / Vref) * maxCode), 0, maxCode)
 * Vq = D * LSB
 * Error = Vin - Vq
 */
export function calcADCQuantization(
  vin: number,
  vref: number,
  resolution: number
): {
  digitalDecimal: number;
  digitalBinary: string;
  lsbSize: number;
  quantizedVoltage: number;
  quantizationError: number;
  maxCode: number;
} {
  const maxCode = Math.pow(2, resolution) - 1;
  const safeVref = Math.max(0.1, vref);
  const safeVin = Math.max(0, vin);
  const lsbSize = maxCode > 0 ? safeVref / maxCode : 0;

  // Reconstructed quantization code
  const rawFraction = safeVin / safeVref;
  const code = Math.min(maxCode, Math.max(0, Math.round(rawFraction * maxCode)));
  const digitalBinary = code.toString(2).padStart(resolution, '0');
  const quantizedVoltage = code * lsbSize;
  const quantizationError = safeVin - quantizedVoltage;

  return {
    digitalDecimal: code,
    digitalBinary,
    lsbSize,
    quantizedVoltage,
    quantizationError,
    maxCode,
  };
}

// ============================================================================
// 6. PERCENTAGE ERROR & MEASUREMENT ACCURACY
// ============================================================================

/**
 * Calculates percentage error between theoretical and simulated values
 * Error % = (|Theoretical - Simulated| / |Theoretical|) * 100
 */
export function calcPercentageError(theoretical: number, simulated: number): number {
  if (!isFinite(theoretical) || !isFinite(simulated)) return 0;
  if (Math.abs(theoretical) < 1e-9) {
    return Math.abs(simulated) < 1e-9 ? 0 : 0;
  }
  const err = (Math.abs(theoretical - simulated) / Math.abs(theoretical)) * 100;
  return isFinite(err) ? Math.round(err * 100) / 100 : 0;
}

// ============================================================================
// 7. STANDARDIZED NUMERICAL DISPLAY FORMATTING
// ============================================================================

/**
 * Formats a number to engineering presentation standards:
 * - Avoids 2.00000000001 -> formats cleanly as 2
 * - Displays normal decimals with clean trailing zeros stripped
 * - Small values format with metric prefixes or clean scientific notation
 * - Never returns NaN, Infinity, null, or undefined
 */
export function formatEngineeringNumber(val: number, maxDecimals: number = 3): string {
  if (val === undefined || val === null || isNaN(val)) return '0';
  if (!isFinite(val)) return val > 0 ? '+Sat Rail' : '-Sat Rail';

  // Check if value is essentially an integer
  if (Math.abs(val - Math.round(val)) < 1e-7) {
    return Math.round(val).toString();
  }

  const abs = Math.abs(val);

  // Very small non-zero numbers
  if (abs < 1e-4 && abs > 0) {
    return val.toExponential(2);
  }

  // Very large numbers
  if (abs >= 1e7) {
    return val.toExponential(3);
  }

  // Normal decimal range
  const fixed = val.toFixed(maxDecimals);
  return parseFloat(fixed).toString();
}
