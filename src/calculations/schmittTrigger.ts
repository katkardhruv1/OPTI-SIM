import { SchmittTriggerInputs, SchmittTriggerResults, ValidationError } from '../types/circuit';
import { convertToOhms, convertToVolts, formatResistance, cleanFloat } from '../utils/formatters';

export function validateSchmittTriggerInputs(inputs: SchmittTriggerInputs): ValidationError[] {
  const errors: ValidationError[] = [];

  if (isNaN(inputs.vinAmplitude)) {
    errors.push({ field: 'vinAmplitude', message: 'Input Voltage amplitude must be a valid number.' });
  } else if (inputs.vinAmplitude <= 0) {
    errors.push({ field: 'vinAmplitude', message: 'Input Voltage amplitude must be strictly greater than 0 V.' });
  }

  if (isNaN(inputs.r1)) {
    errors.push({ field: 'r1', message: 'Resistor R1 must be a valid number.' });
  } else if (inputs.r1 <= 0) {
    errors.push({ field: 'r1', message: 'Resistor R1 must be strictly greater than 0 Ω.' });
  }

  if (isNaN(inputs.rf)) {
    errors.push({ field: 'rf', message: 'Feedback Resistor Rf must be a valid number.' });
  } else if (inputs.rf <= 0) {
    errors.push({ field: 'rf', message: 'Feedback Resistor Rf must be strictly greater than 0 Ω.' });
  }

  if (inputs.r1 + inputs.rf <= 0) {
    errors.push({ field: 'rf', message: 'Sum of R1 and Rf must be greater than 0.' });
  }

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

  if (!isNaN(inputs.posVsat) && !isNaN(inputs.negVsat) && inputs.posVsat <= inputs.negVsat) {
    errors.push({ field: 'posVsat', message: '+Vsat must be strictly greater than -Vsat.' });
  }

  if (isNaN(inputs.frequency)) {
    errors.push({ field: 'frequency', message: 'Frequency must be a valid number.' });
  } else if (inputs.frequency <= 0) {
    errors.push({ field: 'frequency', message: 'Frequency must be greater than 0 Hz.' });
  }

  return errors;
}

export function calculateSchmittTrigger(inputs: SchmittTriggerInputs): SchmittTriggerResults {
  const vinAmpBase = convertToVolts(inputs.vinAmplitude, inputs.vinUnit);
  const vrefCenter = inputs.vrefCenter || 0;
  const posVsat = inputs.posVsat;
  const negVsat = inputs.negVsat;
  const r1Base = convertToOhms(inputs.r1, inputs.r1Unit);
  const rfBase = convertToOhms(inputs.rf, inputs.rfUnit);

  // Feedback factor beta = R1 / (R1 + Rf)
  const beta = r1Base / (r1Base + rfBase);

  // Trigger points (centered at vrefCenter)
  const utp = vrefCenter + beta * posVsat;
  const ltp = vrefCenter + beta * negVsat;
  const hysteresisWidth = utp - ltp;

  // Determine state for current input amplitude peak
  let currentVout = 0;
  let currentStateLabel = '';

  if (vinAmpBase > utp) {
    currentVout = posVsat;
    currentStateLabel = 'HIGH (+Vsat)';
  } else if (vinAmpBase < ltp) {
    currentVout = negVsat;
    currentStateLabel = 'LOW (-Vsat)';
  } else {
    // Inside hysteresis band
    currentVout = posVsat; // Peak has reached HIGH state
    currentStateLabel = 'RETAINS STATE (Hysteresis Memory)';
  }

  const r1Str = formatResistance(r1Base);
  const rfStr = formatResistance(rfBase);
  const betaStr = cleanFloat(beta, 4);
  const posVsatStr = `+${cleanFloat(posVsat)} V`;
  const negVsatStr = `${cleanFloat(negVsat)} V`;
  const utpStr = `+${cleanFloat(utp, 2)} V`;
  const ltpStr = `${cleanFloat(ltp, 2)} V`;
  const vhStr = `${cleanFloat(hysteresisWidth, 2)} V`;

  const steps = {
    step1BetaFormula: 'β = R1 / (R1 + Rf)',
    step1BetaSub: `β = ${cleanFloat(r1Base)} Ω / (${cleanFloat(r1Base)} Ω + ${cleanFloat(rfBase)} Ω)`,
    step1BetaResult: `β = ${cleanFloat(r1Base)} / ${cleanFloat(r1Base + rfBase)} = ${betaStr}`,
    step2UtpFormula: 'UTP = +β × +Vsat',
    step2UtpSub: `UTP = ${betaStr} × ${cleanFloat(posVsat)} V`,
    step2UtpResult: `UTP ≈ ${utpStr}`,
    step3LtpFormula: 'LTP = +β × -Vsat',
    step3LtpSub: `LTP = ${betaStr} × (${cleanFloat(negVsat)} V)`,
    step3LtpResult: `LTP ≈ ${ltpStr}`,
    step4VhFormula: 'VH = UTP - LTP',
    step4VhSub: `VH = (${cleanFloat(utp, 2)} V) - (${cleanFloat(ltp, 2)} V)`,
    step4VhResult: `VH = ${vhStr}`,
  };

  return {
    vinAmpBase,
    vrefCenter,
    posVsat,
    negVsat,
    r1Base,
    rfBase,
    beta,
    utp,
    ltp,
    hysteresisWidth,
    currentVout,
    currentStateLabel,
    steps,
  };
}

export interface HysteresisCurveData {
  risingPath: { vin: number; vout: number }[];
  fallingPath: { vin: number; vout: number }[];
  utp: number;
  ltp: number;
  posVsat: number;
  negVsat: number;
}

/**
 * Generates the bidirectional hysteresis loop for the Schmitt Trigger
 */
export function generateSchmittHysteresisCurve(
  utp: number,
  ltp: number,
  posVsat: number,
  negVsat: number,
  span: number = 8
): HysteresisCurveData {
  const minVin = Math.min(ltp - 3, -span);
  const maxVin = Math.max(utp + 3, span);
  const eps = 0.005;

  // Path for increasing Vin: starts at minVin (at -Vsat), stays at -Vsat until UTP, then switches to +Vsat up to maxVin
  const risingPath = [
    { vin: minVin, vout: negVsat },
    { vin: utp - eps, vout: negVsat },
    { vin: utp + eps, vout: posVsat },
    { vin: maxVin, vout: posVsat },
  ];

  // Path for decreasing Vin: starts at maxVin (at +Vsat), stays at +Vsat down to LTP, then switches to -Vsat down to minVin
  const fallingPath = [
    { vin: maxVin, vout: posVsat },
    { vin: ltp + eps, vout: posVsat },
    { vin: ltp - eps, vout: negVsat },
    { vin: minVin, vout: negVsat },
  ];

  return {
    risingPath,
    fallingPath,
    utp,
    ltp,
    posVsat,
    negVsat,
  };
}
