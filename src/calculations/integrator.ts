import { IntegratorInputs, IntegratorResults, ValidationError } from '../types/circuit';
import { convertToOhms, convertToFarads, convertToHertz, convertToVolts, formatResistance, formatCapacitance, formatFrequency, formatTimeSeconds, cleanFloat } from '../utils/formatters';

export function validateIntegratorInputs(inputs: IntegratorInputs): ValidationError[] {
  const errors: ValidationError[] = [];

  if (isNaN(inputs.vin)) {
    errors.push({ field: 'vin', message: 'Input Voltage must be a valid number.' });
  }

  if (isNaN(inputs.frequency)) {
    errors.push({ field: 'frequency', message: 'Frequency must be a valid number.' });
  } else if (inputs.frequency <= 0) {
    errors.push({ field: 'frequency', message: 'Frequency must be strictly greater than 0 Hz.' });
  }

  if (isNaN(inputs.r)) {
    errors.push({ field: 'r', message: 'Input Resistance (R) must be a valid number.' });
  } else if (inputs.r <= 0) {
    errors.push({ field: 'r', message: 'Input Resistance (R) must be strictly greater than 0 Ω.' });
  }

  if (isNaN(inputs.c)) {
    errors.push({ field: 'c', message: 'Feedback Capacitance (C) must be a valid number.' });
  } else if (inputs.c <= 0) {
    errors.push({ field: 'c', message: 'Feedback Capacitance (C) must be strictly greater than 0 F.' });
  }

  return errors;
}

export function calculateIntegrator(inputs: IntegratorInputs): IntegratorResults {
  const vinBase = convertToVolts(inputs.vin, inputs.vinUnit);
  const freqBase = convertToHertz(inputs.frequency, inputs.frequencyUnit);
  const rBase = convertToOhms(inputs.r, inputs.rUnit);
  const cBase = convertToFarads(inputs.c, inputs.cUnit);

  // RC Time Constant: RC = R * C
  const rcTimeConstant = rBase * cBase;

  // Integrator Sinusoidal Gain Magnitude: Gain = 1 / (2 * pi * f * R * C)
  const omega = 2 * Math.PI * freqBase;
  const gain = 1 / (omega * rcTimeConstant);

  let expectedOutputWaveform = '';
  let outputExplanation = '';

  if (inputs.waveform === 'square') {
    expectedOutputWaveform = 'Triangle-like waveform';
    outputExplanation = 'A square-wave input produces alternating constant current into capacitor C, integrating into a linear triangular output wave.';
  } else if (inputs.waveform === 'sine') {
    expectedOutputWaveform = 'Phase-shifted sinusoidal waveform';
    outputExplanation = 'A sinusoidal input produces an inverting integrated cosine waveform with a +90° phase shift and gain of 1/(2πfRC).';
  } else {
    expectedOutputWaveform = 'Integrated curved waveform';
    outputExplanation = 'A triangular input has a linear ramp slope, integrating into smooth parabolic curved segments.';
  }

  const rStr = formatResistance(rBase);
  const cStr = formatCapacitance(cBase);
  const fStr = formatFrequency(freqBase);
  const rcStr = formatTimeSeconds(rcTimeConstant);
  const gainStr = cleanFloat(gain, 3);

  const steps = {
    rcFormula: 'RC = R × C',
    rcSubstitution: `RC = ${cleanFloat(rBase)} Ω × ${cBase.toExponential(4)} F`,
    rcResult: `RC = ${cleanFloat(rcTimeConstant, 6)} s (${rcStr})`,
    gainFormula: 'Gain = 1 / (2πfRC)',
    gainSubstitution: `Gain = 1 / (2π × ${cleanFloat(freqBase)} × ${cleanFloat(rcTimeConstant, 6)})`,
    gainResult: `Gain ≈ ${gainStr}`,
    outputExplanation,
  };

  return {
    vinBase,
    freqBase,
    rBase,
    cBase,
    rcTimeConstant,
    gain,
    expectedOutputWaveform,
    steps,
  };
}
