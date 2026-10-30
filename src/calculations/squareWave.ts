import { SquareWaveInputs, SquareWaveResults, ValidationError } from '../types/circuit';
import { convertToOhms, convertToFarads, formatResistance, formatCapacitance, formatFrequency, cleanFloat } from '../utils/formatters';

export function validateSquareWaveInputs(inputs: SquareWaveInputs): ValidationError[] {
  const errors: ValidationError[] = [];

  if (isNaN(inputs.posVsat)) {
    errors.push({ field: 'posVsat', message: '+Vsat must be a valid number.' });
  } else if (inputs.posVsat <= 0) {
    errors.push({ field: 'posVsat', message: '+Vsat must be positive (> 0 V).' });
  }

  if (isNaN(inputs.negVsat)) {
    errors.push({ field: 'negVsat', message: '-Vsat must be a valid number.' });
  } else if (inputs.negVsat >= 0) {
    errors.push({ field: 'negVsat', message: '-Vsat must be negative (< 0 V).' });
  }

  if (isNaN(inputs.r1)) {
    errors.push({ field: 'r1', message: 'Resistor R1 must be a valid number.' });
  } else if (inputs.r1 <= 0) {
    errors.push({ field: 'r1', message: 'Resistor R1 must be strictly greater than 0 Ω.' });
  }

  if (isNaN(inputs.r2)) {
    errors.push({ field: 'r2', message: 'Resistor R2 must be a valid number.' });
  } else if (inputs.r2 <= 0) {
    errors.push({ field: 'r2', message: 'Resistor R2 must be strictly greater than 0 Ω.' });
  }

  if (isNaN(inputs.r)) {
    errors.push({ field: 'r', message: 'Timing Resistor R must be a valid number.' });
  } else if (inputs.r <= 0) {
    errors.push({ field: 'r', message: 'Timing Resistor R must be strictly greater than 0 Ω.' });
  }

  if (isNaN(inputs.c)) {
    errors.push({ field: 'c', message: 'Timing Capacitor C must be a valid number.' });
  } else if (inputs.c <= 0) {
    errors.push({ field: 'c', message: 'Timing Capacitor C must be strictly greater than 0 F.' });
  }

  return errors;
}

export function calculateSquareWave(inputs: SquareWaveInputs): SquareWaveResults {
  const posVsat = inputs.posVsat;
  const negVsat = inputs.negVsat;
  const r1Base = convertToOhms(inputs.r1, inputs.r1Unit);
  const r2Base = convertToOhms(inputs.r2, inputs.r2Unit);
  const rBase = convertToOhms(inputs.r, inputs.rUnit);
  const cBase = convertToFarads(inputs.c, inputs.cUnit);

  // Feedback factor beta = R1 / (R1 + R2)
  const beta = r1Base / (r1Base + r2Base);

  // Time period T = 2 * R * C * ln((1 + beta) / (1 - beta))
  const lnTerm = Math.log(Math.max((1 + beta) / Math.max(1 - beta, 1e-6), 1e-6));
  const timePeriod = 2 * rBase * cBase * lnTerm;
  const frequency = timePeriod > 0 ? 1 / timePeriod : 0;

  const vMax = posVsat;
  const vMin = negVsat;
  const dutyCycle = 50; // Ideal symmetric relaxation oscillator

  const r1Str = formatResistance(r1Base);
  const r2Str = formatResistance(r2Base);
  const rStr = formatResistance(rBase);
  const cStr = formatCapacitance(cBase);
  const betaStr = cleanFloat(beta, 4);
  const tStr = timePeriod < 1e-3
    ? `${cleanFloat(timePeriod * 1e6, 2)} µs`
    : timePeriod < 1
    ? `${cleanFloat(timePeriod * 1e3, 3)} ms`
    : `${cleanFloat(timePeriod, 4)} s`;
  const fStr = formatFrequency(frequency);

  const steps = {
    step1BetaFormula: 'β = R1 / (R1 + R2)',
    step1BetaSub: `β = ${cleanFloat(r1Base)} / (${cleanFloat(r1Base)} + ${cleanFloat(r2Base)})`,
    step1BetaResult: `β = ${betaStr}`,
    step2PeriodFormula: 'T = 2RC ln((1 + β) / (1 - β))',
    step2PeriodSub: `T = 2 × ${cleanFloat(rBase)} × ${cBase.toExponential(3)} × ln((1 + ${betaStr}) / (1 - ${betaStr}))`,
    step2PeriodResult: `T = ${tStr}`,
    step3FreqFormula: 'f = 1 / T',
    step3FreqSub: `f = 1 / (${tStr})`,
    step3FreqResult: `f ≈ ${fStr}`,
    step4Levels: `Vout(max) ≈ +${cleanFloat(posVsat)} V &emsp;|&emsp; Vout(min) ≈ ${cleanFloat(negVsat)} V`,
    step5Duty: `Duty Cycle = T_high / T × 100% ≈ 50% (Symmetrical switching)`,
  };

  return {
    posVsat,
    negVsat,
    r1Base,
    r2Base,
    rBase,
    cBase,
    beta,
    timePeriod,
    frequency,
    vMax,
    vMin,
    dutyCycle,
    steps,
  };
}
