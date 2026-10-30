import { PWMInputs, PWMResults, ValidationError } from '../types/circuit';
import { convertToHertz, cleanFloat } from '../utils/formatters';

export function validatePWMInputs(inputs: PWMInputs): ValidationError[] {
  const errors: ValidationError[] = [];

  if (isNaN(inputs.carrierFreq)) {
    errors.push({ field: 'carrierFreq', message: 'Carrier Frequency must be a valid number.' });
  } else if (inputs.carrierFreq <= 0) {
    errors.push({ field: 'carrierFreq', message: 'Carrier Frequency must be strictly greater than 0 Hz.' });
  }

  if (isNaN(inputs.vMax)) {
    errors.push({ field: 'vMax', message: 'Carrier Maximum (Vmax) must be a valid number.' });
  }

  if (isNaN(inputs.vMin)) {
    errors.push({ field: 'vMin', message: 'Carrier Minimum (Vmin) must be a valid number.' });
  }

  if (!isNaN(inputs.vMax) && !isNaN(inputs.vMin) && inputs.vMax <= inputs.vMin) {
    errors.push({ field: 'vMax', message: 'Carrier Maximum (Vmax) must be strictly greater than Vmin.' });
  }

  if (isNaN(inputs.vControl)) {
    errors.push({ field: 'vControl', message: 'Control Voltage must be a valid number.' });
  }

  return errors;
}

export function calculatePWM(inputs: PWMInputs): PWMResults {
  const carrierFreq = convertToHertz(inputs.carrierFreq, inputs.carrierFreqUnit);
  const carrierAmp = inputs.carrierAmp;
  const vMin = inputs.vMin;
  const vMax = inputs.vMax;
  const vControl = inputs.vControl;

  const timePeriod = carrierFreq > 0 ? 1 / carrierFreq : 0;

  // Normalized control ratio: (Vcontrol - Vmin) / (Vmax - Vmin)
  const span = vMax - vMin;
  let rawRatio = span > 0 ? (vControl - vMin) / span : 0;

  // Clamp ratio to [0, 1]
  const controlRatio = Math.max(0, Math.min(1, rawRatio));
  const dutyCycle = controlRatio * 100;

  const tHigh = (dutyCycle / 100) * timePeriod;
  const tLow = timePeriod - tHigh;

  const tStr = timePeriod < 1e-3
    ? `${cleanFloat(timePeriod * 1e6, 2)} µs`
    : `${cleanFloat(timePeriod * 1e3, 3)} ms`;
  const tHighStr = tHigh < 1e-3
    ? `${cleanFloat(tHigh * 1e6, 2)} µs`
    : `${cleanFloat(tHigh * 1e3, 3)} ms`;
  const tLowStr = tLow < 1e-3
    ? `${cleanFloat(tLow * 1e6, 2)} µs`
    : `${cleanFloat(tLow * 1e3, 3)} ms`;

  const steps = {
    periodFormula: 'T = 1 / f',
    periodResult: `T = 1 / ${cleanFloat(carrierFreq)} Hz = ${tStr}`,
    ratioFormula: 'Control Ratio = (Vcontrol - Vmin) / (Vmax - Vmin)',
    ratioSub: `Control Ratio = (${cleanFloat(vControl, 2)} V - ${cleanFloat(vMin, 2)} V) / (${cleanFloat(vMax, 2)} V - ${cleanFloat(vMin, 2)} V)`,
    ratioResult: `Control Ratio = ${cleanFloat(controlRatio, 4)}${rawRatio < 0 ? ' (Clamped to 0.00 min)' : rawRatio > 1 ? ' (Clamped to 1.00 max)' : ''}`,
    dutyFormula: 'Duty Cycle = Control Ratio × 100%',
    dutySub: `Duty Cycle = ${cleanFloat(controlRatio, 4)} × 100%`,
    dutyResult: `Duty Cycle = ${cleanFloat(dutyCycle, 1)}%`,
    tHighFormula: 'THIGH = Duty Cycle × T',
    tHighSub: `THIGH = ${cleanFloat(dutyCycle, 1)}% × ${tStr}`,
    tHighResult: `THIGH = ${tHighStr}`,
    tLowFormula: 'TLOW = T - THIGH',
    tLowSub: `TLOW = ${tStr} - ${tHighStr}`,
    tLowResult: `TLOW = ${tLowStr}`,
  };

  return {
    carrierFreq,
    carrierAmp,
    vMin,
    vMax,
    vControl,
    controlRatio,
    dutyCycle,
    timePeriod,
    tHigh,
    tLow,
    steps,
  };
}
