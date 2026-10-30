import { InvertingAmpInputs, InvertingAmpResults, ValidationError } from '../types/circuit';
import { convertToOhms, convertToVolts, formatResistance, cleanFloat } from '../utils/formatters';

export function validateInvertingAmpInputs(inputs: InvertingAmpInputs): ValidationError[] {
  const errors: ValidationError[] = [];

  if (isNaN(inputs.vin)) {
    errors.push({ field: 'vin', message: 'Input Voltage (Vin) must be a valid number.' });
  }

  if (isNaN(inputs.rin)) {
    errors.push({ field: 'rin', message: 'Input Resistance (Rin) must be a valid number.' });
  } else if (inputs.rin <= 0) {
    errors.push({
      field: 'rin',
      message: 'Input Resistance (Rin) must be strictly greater than 0 Ω to prevent infinite gain and division by zero.'
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

export function calculateInvertingAmp(inputs: InvertingAmpInputs): InvertingAmpResults {
  const vinBase = convertToVolts(inputs.vin, inputs.vinUnit);
  const rinBase = convertToOhms(inputs.rin, inputs.rinUnit);
  const rfBase = convertToOhms(inputs.rf, inputs.rfUnit);

  // Ideal Op-Amp Inverting Configuration Equations:
  // Av = -Rf / Rin
  // Vout = Av * Vin
  // Phase Shift = 180 deg
  const av = -(rfBase / rinBase);
  const vout = av * vinBase;
  const phaseShiftDeg = 180;
  
  // Auxiliary 2nd-year ENTC parameters
  const iin = vinBase / rinBase; // current flowing through Rin and Rf
  const zin = rinBase;          // due to virtual ground at inverting node
  const vVirtualGround = 0;     // Ideal op-amp virtual ground

  // Format strings for step-by-step breakdown as specified in the prompt:
  // Av = -Rf / Rin
  // Av = -100kΩ / 10kΩ
  // Av = -10
  // Vout = Av × Vin
  // Vout = -10 × 1
  // Vout = -10 V
  const rfStr = formatResistance(rfBase);
  const rinStr = formatResistance(rinBase);
  const avStr = cleanFloat(av);
  const vinStr = `${cleanFloat(vinBase)} V`;
  const voutStr = `${cleanFloat(vout)} V`;

  const steps = {
    avFormula: 'Av = -Rf / Rin',
    avSubstitution: `Av = -(${rfStr}) / (${rinStr})`,
    avResult: `Av = ${avStr}`,
    voutFormula: 'Vout = Av × Vin',
    voutSubstitution: `Vout = ${avStr} × ${vinStr}`,
    voutResult: `Vout = ${voutStr}`,
    phaseResult: 'Phase Shift = 180° (Signal is inverted)'
  };

  return {
    vinBase,
    rinBase,
    rfBase,
    av,
    vout,
    phaseShiftDeg,
    iin,
    zin,
    vVirtualGround,
    steps
  };
}
