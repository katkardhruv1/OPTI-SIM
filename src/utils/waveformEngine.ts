import { cleanFloat, formatFrequency, formatVoltage } from './formatters';

export type SignalWaveformType = 'sine' | 'square' | 'triangle' | 'dc';

export interface WaveformSignalParams {
  waveform: SignalWaveformType;
  amplitude: number; // Volts peak (or DC voltage if 'dc')
  frequency: number; // Hertz
  phaseDeg: number;  // degrees
  dcOffset: number;  // Volts
}

export interface WaveformMetrics {
  vMax: number;
  vMin: number;
  vPeak: number;
  vpp: number;
  vrms: number;
  frequency: number;
  period: number;
}

export interface SimulationResult {
  time: number[];
  vin: number[];
  vout: number[];
  inMetrics: WaveformMetrics;
  outMetrics: WaveformMetrics;
  gain: number;
  gainDb: number;
  phaseDiffDeg: number;
  clipped: boolean;
  posVsat?: number;
  negVsat?: number;
  timeUnit: 's' | 'ms' | 'µs';
  timeScaleMultiplier: number; // e.g. 1000 if timeUnit is 'ms'
  period: number;
  numCycles: number;
}

/**
 * Generates an array of evenly spaced time points covering `numCycles` periods.
 */
export function generateTimeArray(
  frequency: number,
  numCycles: number = 4,
  sampleCount: number = 600
): { time: number[]; tTotal: number; period: number; timeUnit: 's' | 'ms' | 'µs'; scale: number } {
  const safeFreq = Math.max(0.1, frequency);
  const period = 1 / safeFreq;
  const tTotal = period * numCycles;

  let timeUnit: 's' | 'ms' | 'µs' = 's';
  let scale = 1;
  if (tTotal < 1e-3) {
    timeUnit = 'µs';
    scale = 1e6;
  } else if (tTotal < 1) {
    timeUnit = 'ms';
    scale = 1e3;
  }

  const time: number[] = new Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    time[i] = (i / (sampleCount - 1)) * tTotal;
  }

  return { time, tTotal, period, timeUnit, scale };
}

/**
 * Evaluates a sinusoidal waveform at time t
 * x(t) = A sin(2πft + φ) + offset
 */
export function generateSineWave(
  t: number,
  amplitude: number,
  frequency: number,
  phaseDeg: number = 0,
  dcOffset: number = 0
): number {
  const omega = 2 * Math.PI * frequency;
  const phi = (phaseDeg * Math.PI) / 180;
  return amplitude * Math.sin(omega * t + phi) + dcOffset;
}

/**
 * Evaluates a mathematically correct square waveform with 50% duty cycle
 */
export function generateSquareWave(
  t: number,
  amplitude: number,
  frequency: number,
  phaseDeg: number = 0,
  dcOffset: number = 0
): number {
  if (frequency <= 0) return amplitude + dcOffset;
  const period = 1 / frequency;
  const phaseShiftSec = (phaseDeg / 360) * period;
  const tMod = ((t + phaseShiftSec) % period + period) % period;
  return (tMod < period / 2 ? amplitude : -amplitude) + dcOffset;
}

/**
 * Evaluates a mathematically correct symmetric triangular waveform
 */
export function generateTriangleWave(
  t: number,
  amplitude: number,
  frequency: number,
  phaseDeg: number = 0,
  dcOffset: number = 0
): number {
  if (frequency <= 0) return amplitude + dcOffset;
  const period = 1 / frequency;
  const phaseShiftSec = (phaseDeg / 360) * period;
  const tMod = ((t + phaseShiftSec) % period + period) % period;
  const normalized = tMod / period; // 0 to 1

  let val = 0;
  if (normalized < 0.25) {
    val = 4 * amplitude * normalized; // 0 to +A
  } else if (normalized < 0.75) {
    val = 2 * amplitude - 4 * amplitude * normalized; // +A to -A
  } else {
    val = -4 * amplitude + 4 * amplitude * normalized; // -A to 0
  }

  return val + dcOffset;
}

/**
 * Evaluates a constant DC waveform
 */
export function generateDCWaveform(dcVoltage: number): number {
  return dcVoltage;
}

/**
 * Evaluates any supported waveform type at time t
 */
export function evaluateWaveformAtTime(
  t: number,
  params: WaveformSignalParams
): number {
  switch (params.waveform) {
    case 'sine':
      return generateSineWave(t, params.amplitude, params.frequency, params.phaseDeg, params.dcOffset);
    case 'square':
      return generateSquareWave(t, params.amplitude, params.frequency, params.phaseDeg, params.dcOffset);
    case 'triangle':
      return generateTriangleWave(t, params.amplitude, params.frequency, params.phaseDeg, params.dcOffset);
    case 'dc':
      return generateDCWaveform(params.dcOffset || params.amplitude);
    default:
      return 0;
  }
}

/**
 * Multiplies an array of values by a constant scalar gain
 */
export function applyGain(values: number[], gain: number): number[] {
  return values.map((v) => v * gain);
}

/**
 * Applies ideal op-amp voltage rail saturation clipping
 */
export function applySaturation(
  values: number[],
  posVsat: number = 15,
  negVsat: number = -15
): { values: number[]; clipped: boolean; clippedCount: number } {
  let clippedCount = 0;
  const out = values.map((v) => {
    if (v > posVsat) {
      clippedCount++;
      return posVsat;
    }
    if (v < negVsat) {
      clippedCount++;
      return negVsat;
    }
    return v;
  });

  return {
    values: out,
    clipped: clippedCount > 0,
    clippedCount,
  };
}

/**
 * Calculates Peak-to-Peak voltage (Vpp = Vmax - Vmin)
 */
export function calculatePeakToPeak(values: number[]): number {
  if (values.length === 0) return 0;
  let min = values[0];
  let max = values[0];
  for (let i = 1; i < values.length; i++) {
    if (values[i] < min) min = values[i];
    if (values[i] > max) max = values[i];
  }
  return max - min;
}

/**
 * Calculates RMS voltage from numerical samples: Vrms = sqrt(mean(v^2))
 */
export function calculateRMS(values: number[]): number {
  if (values.length === 0) return 0;
  let sumSquares = 0;
  for (let i = 0; i < values.length; i++) {
    sumSquares += values[i] * values[i];
  }
  return Math.sqrt(sumSquares / values.length);
}

/**
 * Extracts comprehensive waveform metrics
 */
export function extractMetrics(values: number[], frequency: number): WaveformMetrics {
  if (values.length === 0) {
    return { vMax: 0, vMin: 0, vPeak: 0, vpp: 0, vrms: 0, frequency: 0, period: 0 };
  }

  let min = values[0];
  let max = values[0];
  for (let i = 1; i < values.length; i++) {
    if (values[i] < min) min = values[i];
    if (values[i] > max) max = values[i];
  }

  const vpp = max - min;
  const vPeak = Math.max(Math.abs(max), Math.abs(min));
  const vrms = calculateRMS(values);
  const period = frequency > 0 ? 1 / frequency : 0;

  return {
    vMax: max,
    vMin: min,
    vPeak,
    vpp,
    vrms,
    frequency,
    period,
  };
}

/**
 * Unified simulation engine for linear operational amplifiers
 * (Inverting, Non-inverting, Voltage Follower, Summing, Differential)
 */
export function simulateLinearOpAmp({
  inputParams,
  gain,
  phaseInvert = false,
  posVsat = 15,
  negVsat = -15,
  applyClipping = true,
  numCycles = 4,
  sampleCount = 600,
}: {
  inputParams: WaveformSignalParams;
  gain: number;
  phaseInvert?: boolean;
  posVsat?: number;
  negVsat?: number;
  applyClipping?: boolean;
  numCycles?: number;
  sampleCount?: number;
}): SimulationResult {
  const { time, period, timeUnit, scale } = generateTimeArray(
    inputParams.frequency,
    numCycles,
    sampleCount
  );

  const vin: number[] = new Array(time.length);
  const voutRaw: number[] = new Array(time.length);

  for (let i = 0; i < time.length; i++) {
    const t = time[i];
    const vInVal = evaluateWaveformAtTime(t, inputParams);
    vin[i] = vInVal;

    // Ideal amplification with phase inversion if requested
    // Note: If gain is negative, phase is inverted
    let vOutVal = 0;
    if (inputParams.waveform === 'dc') {
      vOutVal = vInVal * gain;
    } else {
      // Inverting amplifier: 180° shift
      const effGain = phaseInvert ? -Math.abs(gain) : gain;
      vOutVal = vInVal * effGain;
    }
    voutRaw[i] = vOutVal;
  }

  let finalVout = voutRaw;
  let isClipped = false;

  if (applyClipping) {
    const satRes = applySaturation(voutRaw, posVsat, negVsat);
    finalVout = satRes.values;
    isClipped = satRes.clipped;
  }

  const inMetrics = extractMetrics(vin, inputParams.frequency);
  const outMetrics = extractMetrics(finalVout, inputParams.frequency);

  const measuredGain = inMetrics.vPeak > 1e-6 ? outMetrics.vPeak / inMetrics.vPeak : Math.abs(gain);
  const gainDb = 20 * Math.log10(Math.max(measuredGain, 1e-6));
  const phaseDiffDeg = phaseInvert || gain < 0 ? 180 : 0;

  return {
    time,
    vin,
    vout: finalVout,
    inMetrics,
    outMetrics,
    gain: measuredGain,
    gainDb,
    phaseDiffDeg,
    clipped: isClipped,
    posVsat,
    negVsat,
    timeUnit,
    timeScaleMultiplier: scale,
    period,
    numCycles,
  };
}

/**
 * Unified simulation engine for First-Order Active Filters
 * Computes frequency-dependent attenuation and phase angle
 */
export function simulateActiveFilterWaveform({
  inputParams,
  cutoffFreq,
  passbandGain,
  filterType,
  posVsat = 15,
  negVsat = -15,
  numCycles = 4,
  sampleCount = 600,
}: {
  inputParams: WaveformSignalParams;
  cutoffFreq: number;
  passbandGain: number;
  filterType: 'low-pass' | 'high-pass';
  posVsat?: number;
  negVsat?: number;
  numCycles?: number;
  sampleCount?: number;
}): SimulationResult {
  const f = Math.max(0.1, inputParams.frequency);
  const fc = Math.max(0.1, cutoffFreq);
  const ratio = f / fc;

  let gainMag = 0;
  let phaseShiftDeg = 0;

  if (filterType === 'low-pass') {
    // |H(f)| = A / sqrt(1 + (f/fc)^2)
    gainMag = passbandGain / Math.sqrt(1 + Math.pow(ratio, 2));
    // phi = -arctan(f/fc)
    phaseShiftDeg = -(Math.atan(ratio) * 180) / Math.PI;
  } else {
    // |H(f)| = A * (f/fc) / sqrt(1 + (f/fc)^2)
    gainMag = (passbandGain * ratio) / Math.sqrt(1 + Math.pow(ratio, 2));
    // phi = 90 - arctan(f/fc)
    phaseShiftDeg = 90 - (Math.atan(ratio) * 180) / Math.PI;
  }

  const { time, period, timeUnit, scale } = generateTimeArray(f, numCycles, sampleCount);
  const vin: number[] = new Array(time.length);
  const voutRaw: number[] = new Array(time.length);

  for (let i = 0; i < time.length; i++) {
    const t = time[i];
    const vInVal = evaluateWaveformAtTime(t, inputParams);
    vin[i] = vInVal;

    // Evaluated output with magnitude scaling and phase shift
    const shiftedParams: WaveformSignalParams = {
      ...inputParams,
      amplitude: inputParams.amplitude * gainMag,
      phaseDeg: inputParams.phaseDeg + phaseShiftDeg,
      dcOffset: filterType === 'low-pass' ? inputParams.dcOffset * passbandGain : 0,
    };
    voutRaw[i] = evaluateWaveformAtTime(t, shiftedParams);
  }

  const satRes = applySaturation(voutRaw, posVsat, negVsat);
  const finalVout = satRes.values;
  const isClipped = satRes.clipped;

  const inMetrics = extractMetrics(vin, f);
  const outMetrics = extractMetrics(finalVout, f);
  const gainDb = 20 * Math.log10(Math.max(gainMag, 1e-6));

  return {
    time,
    vin,
    vout: finalVout,
    inMetrics,
    outMetrics,
    gain: gainMag,
    gainDb,
    phaseDiffDeg: phaseShiftDeg,
    clipped: isClipped,
    posVsat,
    negVsat,
    timeUnit,
    timeScaleMultiplier: scale,
    period,
    numCycles,
  };
}

/**
 * Unified simulation engine for Practical Integrator and Differentiator
 */
export function simulateCalculusWaveform({
  mode,
  waveform,
  vinPeak,
  frequency,
  rc,
  r1OrRf,
  posVsat = 15,
  negVsat = -15,
  numCycles = 4,
  sampleCount = 600,
}: {
  mode: 'integrator' | 'differentiator';
  waveform: SignalWaveformType;
  vinPeak: number;
  frequency: number;
  rc: number;
  r1OrRf?: number;
  posVsat?: number;
  negVsat?: number;
  numCycles?: number;
  sampleCount?: number;
}): SimulationResult {
  const f = Math.max(0.1, frequency);
  const omega = 2 * Math.PI * f;
  const { time, period, timeUnit, scale } = generateTimeArray(f, numCycles, sampleCount);

  const vin: number[] = new Array(time.length);
  const voutRaw: number[] = new Array(time.length);

  let theoreticalGain = 1;
  let phaseShiftDeg = 0;

  if (mode === 'integrator') {
    // Vout = -1/RC * ∫ Vin dt
    // For sine: Vin = A sin(wt) => Vout = A/(wRC) cos(wt) = A/(wRC) sin(wt + 90°)
    theoreticalGain = 1 / Math.max(omega * rc, 1e-4);
    phaseShiftDeg = 90; // with inversion
  } else {
    // Vout = -RC * dVin/dt
    // For sine: Vin = A sin(wt) => Vout = -wRC A cos(wt) = wRC A sin(wt - 90°)
    theoreticalGain = omega * rc;
    phaseShiftDeg = -90;
  }

  for (let i = 0; i < time.length; i++) {
    const t = time[i];
    const cyclePos = (t / period) % 1;

    let vInVal = 0;
    let vOutVal = 0;

    if (waveform === 'sine') {
      vInVal = vinPeak * Math.sin(omega * t);
      if (mode === 'integrator') {
        vOutVal = vinPeak * theoreticalGain * Math.cos(omega * t);
      } else {
        vOutVal = -vinPeak * theoreticalGain * Math.cos(omega * t);
      }
    } else if (waveform === 'square') {
      vInVal = cyclePos < 0.5 ? vinPeak : -vinPeak;
      if (mode === 'integrator') {
        // Square wave integrates to triangle
        const voutPk = (vinPeak * period) / (4 * Math.max(rc, 1e-9));
        vOutVal = cyclePos < 0.5 ? voutPk - (2 * voutPk * (cyclePos / 0.5)) : -voutPk + (2 * voutPk * ((cyclePos - 0.5) / 0.5));
      } else {
        // Differentiator of square wave produces sharp spikes at transitions
        const spikePeak = Math.min(posVsat, vinPeak * 8);
        const nearEdge1 = Math.abs(cyclePos) < 0.03;
        const nearEdge2 = Math.abs(cyclePos - 0.5) < 0.03;
        vOutVal = nearEdge1 ? -spikePeak : nearEdge2 ? spikePeak : 0;
      }
    } else if (waveform === 'triangle') {
      const norm = cyclePos < 0.5 ? (cyclePos / 0.5) * 2 - 1 : ((1 - cyclePos) / 0.5) * 2 - 1;
      vInVal = vinPeak * norm;
      if (mode === 'integrator') {
        // Triangle integrates to parabolic / smooth quasi-sine
        vOutVal = -vinPeak * theoreticalGain * Math.sin(omega * t);
      } else {
        // Triangle differentiates to square wave
        const squarePeak = (2 * vinPeak * rc) / (period / 2);
        vOutVal = cyclePos < 0.5 ? -squarePeak : squarePeak;
      }
    } else {
      vInVal = vinPeak;
      vOutVal = mode === 'integrator' ? -vinPeak * (t / rc) : 0;
    }

    vin[i] = vInVal;
    voutRaw[i] = vOutVal;
  }

  const satRes = applySaturation(voutRaw, posVsat, negVsat);
  const finalVout = satRes.values;
  const isClipped = satRes.clipped;

  const inMetrics = extractMetrics(vin, f);
  const outMetrics = extractMetrics(finalVout, f);
  const gainDb = 20 * Math.log10(Math.max(theoreticalGain, 1e-6));

  return {
    time,
    vin,
    vout: finalVout,
    inMetrics,
    outMetrics,
    gain: theoreticalGain,
    gainDb,
    phaseDiffDeg: phaseShiftDeg,
    clipped: isClipped,
    posVsat,
    negVsat,
    timeUnit,
    timeScaleMultiplier: scale,
    period,
    numCycles,
  };
}

/**
 * Unified simulation engine for Precision Half-Wave Rectifier (Superdiode)
 */
/**
 * Applies a phase shift to a time-series signal by circular interpolation
 */
export function applyPhaseShift(
  values: number[],
  phaseDeg: number
): number[] {
  if (values.length === 0 || phaseDeg === 0) return [...values];
  const n = values.length;
  const shiftSamples = Math.round((phaseDeg / 360) * n) % n;
  const shift = shiftSamples < 0 ? shiftSamples + n : shiftSamples;
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = values[(i + shift) % n];
  }
  return out;
}

/**
 * Calculates frequency from period in seconds
 */
export function calculateFrequency(periodSec: number): number {
  return periodSec > 0 ? 1 / periodSec : 0;
}

/**
 * Calculates period in seconds from frequency in Hertz
 */
export function calculatePeriod(frequencyHz: number): number {
  return frequencyHz > 0 ? 1 / frequencyHz : 0;
}

/**
 * Calculates the fundamental phase difference in degrees between two signals
 */
export function calculatePhaseDifference(
  inSignal: number[],
  outSignal: number[],
  time: number[],
  period: number
): number {
  if (inSignal.length === 0 || outSignal.length === 0 || period <= 0) return 0;

  const findRisingZero = (sig: number[]) => {
    for (let i = 0; i < sig.length - 1; i++) {
      if (sig[i] <= 0 && sig[i + 1] > 0) {
        const denom = sig[i + 1] - sig[i];
        const frac = denom !== 0 ? -sig[i] / denom : 0;
        return time[i] + frac * (time[i + 1] - time[i]);
      }
    }
    return null;
  };

  const tZeroIn = findRisingZero(inSignal);
  const tZeroOut = findRisingZero(outSignal);

  if (tZeroIn !== null && tZeroOut !== null) {
    const dt = tZeroOut - tZeroIn;
    let deg = ((dt / period) * 360) % 360;
    if (deg > 180) deg -= 360;
    if (deg < -180) deg += 360;
    return Math.round(deg * 10) / 10;
  }

  // Dot product / cross-correlation fallback
  let sumProd = 0;
  let inNorm = 0;
  let outNorm = 0;
  for (let i = 0; i < inSignal.length; i++) {
    sumProd += inSignal[i] * outSignal[i];
    inNorm += inSignal[i] * inSignal[i];
    outNorm += outSignal[i] * outSignal[i];
  }
  const denom = Math.sqrt(inNorm * outNorm);
  if (denom < 1e-9) return 0;
  const cosVal = Math.max(-1, Math.min(1, sumProd / denom));
  return Math.round(((Math.acos(cosVal) * 180) / Math.PI) * 10) / 10;
}

/**
 * Unified simulation engine for Summing Amplifier
 * Vout(t) = -Rf * ∑ [ Vi(t) / Ri ]
 */
export interface SummingChannelSimInput {
  waveform: SignalWaveformType;
  amplitude: number;
  frequency: number;
  phaseDeg: number;
  dcOffset: number;
  resistance: number; // in Ohms
  name?: string;
}

export function simulateSummingOpAmp({
  channels,
  rf,
  baseFrequency = 1000,
  posVsat = 15,
  negVsat = -15,
  applyClipping = true,
  numCycles = 4,
  sampleCount = 600,
}: {
  channels: SummingChannelSimInput[];
  rf: number; // in Ohms
  baseFrequency?: number;
  posVsat?: number;
  negVsat?: number;
  applyClipping?: boolean;
  numCycles?: number;
  sampleCount?: number;
}): SimulationResult {
  const f = Math.max(0.1, baseFrequency);
  const { time, period, timeUnit, scale } = generateTimeArray(f, numCycles, sampleCount);

  const vin: number[] = new Array(time.length);
  const voutRaw: number[] = new Array(time.length);

  for (let i = 0; i < time.length; i++) {
    const t = time[i];
    let sumCurrent = 0;
    let vInSum = 0;

    channels.forEach((ch, idx) => {
      const vVal = evaluateWaveformAtTime(t, {
        waveform: ch.waveform,
        amplitude: ch.amplitude,
        frequency: ch.frequency,
        phaseDeg: ch.phaseDeg,
        dcOffset: ch.dcOffset,
      });
      if (idx === 0) {
        vInSum = vVal; // Reference Ch 1 as primary Vin display
      }
      const rSafe = Math.max(1, ch.resistance);
      sumCurrent += vVal / rSafe;
    });

    vin[i] = vInSum;
    voutRaw[i] = -rf * sumCurrent;
  }

  const satRes = applyClipping
    ? applySaturation(voutRaw, posVsat, negVsat)
    : { values: voutRaw, clipped: false, clippedCount: 0 };

  const inMetrics = extractMetrics(vin, f);
  const outMetrics = extractMetrics(satRes.values, f);
  const gain = inMetrics.vPeak > 1e-6 ? outMetrics.vPeak / inMetrics.vPeak : 1;
  const gainDb = 20 * Math.log10(Math.max(gain, 1e-6));
  const phaseDiffDeg = 180; // Inverting summing node

  return {
    time,
    vin,
    vout: satRes.values,
    inMetrics,
    outMetrics,
    gain,
    gainDb,
    phaseDiffDeg,
    clipped: satRes.clipped,
    posVsat,
    negVsat,
    timeUnit,
    timeScaleMultiplier: scale,
    period,
    numCycles,
  };
}

/**
 * Unified simulation engine for Differential Amplifier
 * Vout(t) = (Rg / (R2 + Rg)) * (1 + Rf/R1) * V2(t) - (Rf/R1) * V1(t)
 */
export function simulateDifferentialOpAmp({
  v1Params,
  v2Params,
  r1,
  r2,
  rf,
  rg,
  posVsat = 15,
  negVsat = -15,
  applyClipping = true,
  numCycles = 4,
  sampleCount = 600,
}: {
  v1Params: WaveformSignalParams;
  v2Params: WaveformSignalParams;
  r1: number; // in Ohms
  r2: number; // in Ohms
  rf: number; // in Ohms
  rg: number; // in Ohms
  posVsat?: number;
  negVsat?: number;
  applyClipping?: boolean;
  numCycles?: number;
  sampleCount?: number;
}): SimulationResult {
  const f = Math.max(0.1, v1Params.frequency || v2Params.frequency || 1000);
  const { time, period, timeUnit, scale } = generateTimeArray(f, numCycles, sampleCount);

  const vinDiff: number[] = new Array(time.length);
  const voutRaw: number[] = new Array(time.length);

  const r1Safe = Math.max(1, r1);
  const r2Safe = Math.max(1, r2);
  const v2Factor = (rg / (r2Safe + rg)) * (1 + rf / r1Safe);
  const v1Factor = rf / r1Safe;

  for (let i = 0; i < time.length; i++) {
    const t = time[i];
    const val1 = evaluateWaveformAtTime(t, v1Params);
    const val2 = evaluateWaveformAtTime(t, v2Params);
    const diff = val2 - val1;
    vinDiff[i] = diff;
    voutRaw[i] = v2Factor * val2 - v1Factor * val1;
  }

  const satRes = applyClipping
    ? applySaturation(voutRaw, posVsat, negVsat)
    : { values: voutRaw, clipped: false, clippedCount: 0 };

  const inMetrics = extractMetrics(vinDiff, f);
  const outMetrics = extractMetrics(satRes.values, f);
  const gain = inMetrics.vPeak > 1e-6 ? outMetrics.vPeak / inMetrics.vPeak : rf / r1Safe;
  const gainDb = 20 * Math.log10(Math.max(gain, 1e-6));
  const phaseDiffDeg = 0; // Differential output in phase with (V2 - V1)

  return {
    time,
    vin: vinDiff,
    vout: satRes.values,
    inMetrics,
    outMetrics,
    gain,
    gainDb,
    phaseDiffDeg,
    clipped: satRes.clipped,
    posVsat,
    negVsat,
    timeUnit,
    timeScaleMultiplier: scale,
    period,
    numCycles,
  };
}

/**
 * Unified simulation engine for Precision Half-Wave Rectifier (Superdiode)
 */
export function simulateRectifierWaveform({
  waveform = 'sine',
  vinPeak,
  frequency,
  posVsat = 15,
  negVsat = -15,
  numCycles = 4,
  sampleCount = 600,
}: {
  waveform?: SignalWaveformType;
  vinPeak: number;
  frequency: number;
  posVsat?: number;
  negVsat?: number;
  numCycles?: number;
  sampleCount?: number;
}): SimulationResult {
  const f = Math.max(0.1, frequency);
  const { time, period, timeUnit, scale } = generateTimeArray(f, numCycles, sampleCount);

  const vin: number[] = new Array(time.length);
  const voutRaw: number[] = new Array(time.length);

  for (let i = 0; i < time.length; i++) {
    const t = time[i];
    const vInVal = evaluateWaveformAtTime(t, {
      waveform,
      amplitude: vinPeak,
      frequency: f,
      phaseDeg: 0,
      dcOffset: 0,
    });
    vin[i] = vInVal;
    // Ideal superdiode: passes positive signals, clamps negative to 0V
    voutRaw[i] = vInVal > 0 ? vInVal : 0;
  }

  const satRes = applySaturation(voutRaw, posVsat, negVsat);
  const finalVout = satRes.values;
  const isClipped = satRes.clipped;

  const inMetrics = extractMetrics(vin, f);
  const outMetrics = extractMetrics(finalVout, f);
  const gain = inMetrics.vPeak > 1e-6 ? outMetrics.vPeak / inMetrics.vPeak : 1;
  const gainDb = 20 * Math.log10(Math.max(gain, 1e-6));

  return {
    time,
    vin,
    vout: finalVout,
    inMetrics,
    outMetrics,
    gain,
    gainDb,
    phaseDiffDeg: 0,
    clipped: isClipped,
    posVsat,
    negVsat,
    timeUnit,
    timeScaleMultiplier: scale,
    period,
    numCycles,
  };
}

