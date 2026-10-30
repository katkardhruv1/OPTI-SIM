import { DifferentiatorInputs, DifferentiatorResults, ValidationError } from '../types/circuit';
import { convertToOhms, convertToFarads, convertToHertz, convertToVolts, formatResistance, formatCapacitance, formatFrequency, formatTimeSeconds, cleanFloat } from '../utils/formatters';

export function validateDifferentiatorInputs(inputs: DifferentiatorInputs): ValidationError[] {
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
    errors.push({ field: 'r', message: 'Feedback Resistance (R) must be a valid number.' });
  } else if (inputs.r <= 0) {
    errors.push({ field: 'r', message: 'Feedback Resistance (R) must be strictly greater than 0 Ω.' });
  }

  if (isNaN(inputs.c)) {
    errors.push({ field: 'c', message: 'Input Capacitance (C) must be a valid number.' });
  } else if (inputs.c <= 0) {
    errors.push({ field: 'c', message: 'Input Capacitance (C) must be strictly greater than 0 F.' });
  }

  return errors;
}

export function calculateDifferentiator(inputs: DifferentiatorInputs): DifferentiatorResults {
  const vinBase = convertToVolts(inputs.vin, inputs.vinUnit);
  const freqBase = convertToHertz(inputs.frequency, inputs.frequencyUnit);
  const rBase = convertToOhms(inputs.r, inputs.rUnit);
  const cBase = convertToFarads(inputs.c, inputs.cUnit);

  // RC Time Constant: RC = R * C
  const rcTimeConstant = rBase * cBase;

  // Differentiator Sinusoidal Gain Magnitude: Gain = 2 * pi * f * R * C
  const omega = 2 * Math.PI * freqBase;
  const gain = omega * rcTimeConstant;

  let expectedOutputWaveform = '';
  let outputExplanation = '';

  if (inputs.waveform === 'triangle') {
    expectedOutputWaveform = 'Square-like output';
    outputExplanation = 'A triangular-wave input has alternating constant positive and negative slopes, differentiating into a clean square wave.';
  } else if (inputs.waveform === 'square') {
    expectedOutputWaveform = 'Sharp positive/negative transitions';
    outputExplanation = 'A square-wave input contains near-infinite instantaneous edge rates, generating sharp bidirectional impulse voltage spikes.';
  } else {
    expectedOutputWaveform = 'Phase-shifted sinusoidal output';
    outputExplanation = 'A sinusoidal input differentiates into an inverting cosine wave with a -90° phase shift and magnitude proportional to frequency.';
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
    gainFormula: 'Gain = 2πfRC',
    gainSubstitution: `Gain = 2π × ${cleanFloat(freqBase)} × ${cleanFloat(rcTimeConstant, 6)}`,
    gainResult: `Gain ≈ ${gainStr}`,
    outputExplanation,
  };

  return {
    vinBase,
    freqBase,
    cBase,
    rBase,
    rcTimeConstant,
    gain,
    expectedOutputWaveform,
    steps,
  };
}
