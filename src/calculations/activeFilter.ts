import { FilterInputs, FilterResults, ValidationError } from '../types/circuit';
import { convertToOhms, convertToFarads, convertToHertz, convertToVolts, formatResistance, formatCapacitance, formatFrequency, cleanFloat } from '../utils/formatters';

export function validateFilterInputs(inputs: FilterInputs): ValidationError[] {
  const errors: ValidationError[] = [];

  if (isNaN(inputs.passbandGain)) {
    errors.push({ field: 'passbandGain', message: 'Passband Gain must be a valid number.' });
  } else if (inputs.passbandGain <= 0) {
    errors.push({ field: 'passbandGain', message: 'Passband Gain must be strictly greater than 0.' });
  }

  if (isNaN(inputs.r)) {
    errors.push({ field: 'r', message: 'Resistance (R) must be a valid number.' });
  } else if (inputs.r <= 0) {
    errors.push({ field: 'r', message: 'Resistance (R) must be strictly greater than 0 Ω.' });
  }

  if (isNaN(inputs.c)) {
    errors.push({ field: 'c', message: 'Capacitance (C) must be a valid number.' });
  } else if (inputs.c <= 0) {
    errors.push({ field: 'c', message: 'Capacitance (C) must be strictly greater than 0 F.' });
  }

  if (isNaN(inputs.vin)) {
    errors.push({ field: 'vin', message: 'Input Voltage must be a valid number.' });
  }

  if (isNaN(inputs.frequency)) {
    errors.push({ field: 'frequency', message: 'Test Frequency must be a valid number.' });
  } else if (inputs.frequency <= 0) {
    errors.push({ field: 'frequency', message: 'Test Frequency must be strictly greater than 0 Hz.' });
  }

  return errors;
}

export function calculateCutoffFrequency(rOhms: number, cFarads: number): number {
  return 1 / (2 * Math.PI * rOhms * cFarads);
}

export function calculateLowPassResponse(inputs: FilterInputs): FilterResults {
  const rBase = convertToOhms(inputs.r, inputs.rUnit);
  const cBase = convertToFarads(inputs.c, inputs.cUnit);
  const vinBase = convertToVolts(inputs.vin, inputs.vinUnit);
  const freqBase = convertToHertz(inputs.frequency, inputs.frequencyUnit);
  const passbandGain = inputs.passbandGain;

  const rcTimeConstant = rBase * cBase;
  const fc = calculateCutoffFrequency(rBase, cBase);
  const freqRatio = freqBase / fc;

  // |H(f)| = A / sqrt(1 + (f/fc)^2)
  const denom = Math.sqrt(1 + Math.pow(freqRatio, 2));
  const gainMag = passbandGain / denom;
  const vout = vinBase * gainMag;
  const gainDb = 20 * Math.log10(Math.max(gainMag, 1e-9));

  // Phase shift for low-pass: -arctan(f/fc)
  const phaseShiftDeg = -(Math.atan(freqRatio) * 180) / Math.PI;

  const rStr = formatResistance(rBase);
  const cStr = formatCapacitance(cBase);
  const fcStr = `${cleanFloat(fc, 2)} Hz (${formatFrequency(fc)})`;
  const fStr = formatFrequency(freqBase);
  const ratioStr = cleanFloat(freqRatio, 4);
  const gainMagStr = cleanFloat(gainMag, 4);
  const voutStr = `${cleanFloat(vout, 4)} V`;
  const dbStr = `${cleanFloat(gainDb, 2)} dB`;

  const steps = {
    rcFormula: 'RC = R × C',
    rcSubstitution: `RC = ${cleanFloat(rBase)} Ω × ${cBase.toExponential(4)} F`,
    rcResult: `RC = ${cleanFloat(rcTimeConstant, 6)} s`,
    fcFormula: 'fc = 1 / (2πRC)',
    fcSubstitution: `fc = 1 / (2π × ${cleanFloat(rBase)} × ${cBase.toExponential(4)})`,
    fcResult: `fc ≈ ${fcStr}`,
    ratioFormula: 'f / fc',
    ratioResult: `${cleanFloat(freqBase)} / ${cleanFloat(fc, 2)} = ${ratioStr}`,
    hFormula: '|H(f)| = A / √(1 + (f/fc)²)',
    hSubstitution: `|H(f)| = ${passbandGain} / √(1 + (${ratioStr})²)`,
    hResult: `|H(f)| ≈ ${gainMagStr}`,
    voutFormula: 'Vout = Vin × |H(f)|',
    voutSubstitution: `Vout = ${cleanFloat(vinBase)} V × ${gainMagStr}`,
    voutResult: `Vout ≈ ${voutStr}`,
    dbFormula: 'Gain(dB) = 20 log10(|H(f)|)',
    dbResult: `Gain(dB) = 20 log10(${gainMagStr}) = ${dbStr}`,
  };

  return {
    vinBase,
    freqBase,
    rBase,
    cBase,
    passbandGain,
    rcTimeConstant,
    fc,
    freqRatio,
    gainMag,
    gainDb,
    vout,
    phaseShiftDeg,
    steps,
  };
}

export function calculateHighPassResponse(inputs: FilterInputs): FilterResults {
  const rBase = convertToOhms(inputs.r, inputs.rUnit);
  const cBase = convertToFarads(inputs.c, inputs.cUnit);
  const vinBase = convertToVolts(inputs.vin, inputs.vinUnit);
  const freqBase = convertToHertz(inputs.frequency, inputs.frequencyUnit);
  const passbandGain = inputs.passbandGain;

  const rcTimeConstant = rBase * cBase;
  const fc = calculateCutoffFrequency(rBase, cBase);
  const freqRatio = freqBase / fc;

  // |H(f)| = A * (f/fc) / sqrt(1 + (f/fc)^2)
  const denom = Math.sqrt(1 + Math.pow(freqRatio, 2));
  const gainMag = (passbandGain * freqRatio) / denom;
  const vout = vinBase * gainMag;
  const gainDb = 20 * Math.log10(Math.max(gainMag, 1e-9));

  // Phase shift for high-pass: 90 deg - arctan(f/fc)
  const phaseShiftDeg = 90 - (Math.atan(freqRatio) * 180) / Math.PI;

  const rStr = formatResistance(rBase);
  const cStr = formatCapacitance(cBase);
  const fcStr = `${cleanFloat(fc, 2)} Hz (${formatFrequency(fc)})`;
  const fStr = formatFrequency(freqBase);
  const ratioStr = cleanFloat(freqRatio, 4);
  const gainMagStr = cleanFloat(gainMag, 4);
  const voutStr = `${cleanFloat(vout, 4)} V`;
  const dbStr = `${cleanFloat(gainDb, 2)} dB`;

  const steps = {
    rcFormula: 'RC = R × C',
    rcSubstitution: `RC = ${cleanFloat(rBase)} Ω × ${cBase.toExponential(4)} F`,
    rcResult: `RC = ${cleanFloat(rcTimeConstant, 6)} s`,
    fcFormula: 'fc = 1 / (2πRC)',
    fcSubstitution: `fc = 1 / (2π × ${cleanFloat(rBase)} × ${cBase.toExponential(4)})`,
    fcResult: `fc ≈ ${fcStr}`,
    ratioFormula: 'f / fc',
    ratioResult: `${cleanFloat(freqBase)} / ${cleanFloat(fc, 2)} = ${ratioStr}`,
    hFormula: '|H(f)| = A × (f/fc) / √(1 + (f/fc)²)',
    hSubstitution: `|H(f)| = (${passbandGain} × ${ratioStr}) / √(1 + (${ratioStr})²)`,
    hResult: `|H(f)| ≈ ${gainMagStr}`,
    voutFormula: 'Vout = Vin × |H(f)|',
    voutSubstitution: `Vout = ${cleanFloat(vinBase)} V × ${gainMagStr}`,
    voutResult: `Vout ≈ ${voutStr}`,
    dbFormula: 'Gain(dB) = 20 log10(|H(f)|)',
    dbResult: `Gain(dB) = 20 log10(${gainMagStr}) = ${dbStr}`,
  };

  return {
    vinBase,
    freqBase,
    rBase,
    cBase,
    passbandGain,
    rcTimeConstant,
    fc,
    freqRatio,
    gainMag,
    gainDb,
    vout,
    phaseShiftDeg,
    steps,
  };
}

export interface BodePoint {
  freq: number;
  freqRatio: number;
  gainMag: number;
  gainDb: number;
  phaseDeg: number;
  isFc?: boolean;
}

/**
 * Generates logarithmic frequency response points for Bode magnitude and phase plots
 */
export function generateFrequencyResponse(
  fc: number,
  passbandGain: number,
  filterType: 'low-pass' | 'high-pass'
): BodePoint[] {
  // Multipliers covering 4 decades: from 0.01 * fc to 100 * fc
  const multipliers = [
    0.01, 0.02, 0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.7, 0.85, 1.0, 1.2, 1.5,
    2.0, 3.0, 4.0, 5.0, 7.0, 10.0, 15.0, 20.0, 30.0, 50.0, 70.0, 100.0,
  ];

  return multipliers.map((mult) => {
    const f = mult * fc;
    const ratio = mult;
    let gainMag = 0;
    let phaseDeg = 0;

    if (filterType === 'low-pass') {
      gainMag = passbandGain / Math.sqrt(1 + Math.pow(ratio, 2));
      phaseDeg = -(Math.atan(ratio) * 180) / Math.PI;
    } else {
      gainMag = (passbandGain * ratio) / Math.sqrt(1 + Math.pow(ratio, 2));
      phaseDeg = 90 - (Math.atan(ratio) * 180) / Math.PI;
    }

    const gainDb = 20 * Math.log10(Math.max(gainMag, 1e-9));

    return {
      freq: f,
      freqRatio: ratio,
      gainMag,
      gainDb,
      phaseDeg,
      isFc: mult === 1.0,
    };
  });
}
