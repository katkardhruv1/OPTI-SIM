import { NonInvertingAmpInputs, NonInvertingAmpResults, ValidationError } from '../types/circuit';
import { convertToOhms, convertToVolts, formatResistance, cleanFloat } from '../utils/formatters';

export function validateNonInvertingAmpInputs(inputs: NonInvertingAmpInputs): ValidationError[] {
  const errors: ValidationError[] = [];

  if (isNaN(inputs.vin)) {
    errors.push({ field: 'vin', message: 'Input Voltage (Vin) must be a valid number.' });
  }

  if (isNaN(inputs.r1)) {
    errors.push({ field: 'r1', message: 'Gain Resistance (R1) must be a valid number.' });
  } else if (inputs.r1 <= 0) {
    errors.push({
      field: 'r1',
      message: 'Gain Resistance (R1) must be strictly greater than 0 Ω to prevent infinite gain and division by zero.'
    });
  }

  if (isNaN(inputs.rf)) {
    errors.push({ field: 'rf', message: 'Feedback Resistance (Rf) must be a valid number.' });
  } else if (inputs.rf < 0) {
    errors.push({
      field: 'rf',
      message: 'Feedback Resistance (Rf) cannot be negative.'
    });
  }

  return errors;
}

export function calculateNonInvertingAmp(inputs: NonInvertingAmpInputs): NonInvertingAmpResults {
  const vinBase = convertToVolts(inputs.vin, inputs.vinUnit);
  const r1Base = convertToOhms(inputs.r1, inputs.r1Unit);
  const rfBase = convertToOhms(inputs.rf, inputs.rfUnit);

  // Ideal Non-Inverting Op-Amp Equations:
  // Av = 1 + (Rf / R1)
  // Vout = Av * Vin
  // Phase Shift = 0 deg
  const gainRatio = rfBase / r1Base;
  const av = 1 + gainRatio;
  const vout = av * vinBase;
  const phaseShiftDeg = 0;

  // Auxiliary parameters for 2nd-year ENTC
  const iin = 0; // Ideal op-amp non-inverting input draws zero current
  const zin = '∞ (Very High, > 10¹² Ω)';
  const vFeedbackNode = vinBase; // By virtual short, V- = V+ = Vin

  const rfStr = formatResistance(rfBase);
  const r1Str = formatResistance(r1Base);
  const avStr = cleanFloat(av);
  const vinStr = `${cleanFloat(vinBase)} V`;
  const voutStr = `${cleanFloat(vout)} V`;

  const steps = {
    avFormula: 'Av = 1 + Rf / R1',
    avSubstitution: `Av = 1 + (${rfStr}) / (${r1Str})`,
    avResult: `Av = ${avStr}`,
    voutFormula: 'Vout = Av × Vin',
    voutSubstitution: `Vout = ${avStr} × ${vinStr}`,
    voutResult: `Vout = ${voutStr}`,
    phaseResult: 'Phase Shift = 0° (In-phase output)'
  };

  return {
    vinBase,
    r1Base,
    rfBase,
    av,
    vout,
    phaseShiftDeg,
    iin,
    zin,
    vFeedbackNode,
    steps
  };
}
