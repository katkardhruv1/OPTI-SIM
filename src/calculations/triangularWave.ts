import { TriangularWaveInputs, TriangularWaveResults, ValidationError } from '../types/circuit';
import { convertToOhms, convertToFarads, convertToHertz, convertToVolts, formatResistance, formatCapacitance, formatFrequency, cleanFloat } from '../utils/formatters';

export function validateTriangularWaveInputs(inputs: TriangularWaveInputs): ValidationError[] {
  const errors: ValidationError[] = [];

  if (isNaN(inputs.amplitude)) {
    errors.push({ field: 'amplitude', message: 'Square Wave Amplitude must be a valid number.' });
  } else if (inputs.amplitude <= 0) {
    errors.push({ field: 'amplitude', message: 'Square Wave Amplitude must be strictly greater than 0 V.' });
  }

  if (isNaN(inputs.frequency)) {
    errors.push({ field: 'frequency', message: 'Frequency must be a valid number.' });
  } else if (inputs.frequency <= 0) {
    errors.push({ field: 'frequency', message: 'Frequency must be strictly greater than 0 Hz.' });
  }

  if (isNaN(inputs.r)) {
    errors.push({ field: 'r', message: 'Integrator Resistance R must be a valid number.' });
  } else if (inputs.r <= 0) {
    errors.push({ field: 'r', message: 'Integrator Resistance R must be strictly greater than 0 Ω.' });
  }

  if (isNaN(inputs.c)) {
    errors.push({ field: 'c', message: 'Integrator Capacitance C must be a valid number.' });
  } else if (inputs.c <= 0) {
    errors.push({ field: 'c', message: 'Integrator Capacitance C must be strictly greater than 0 F.' });
  }

  return errors;
}

export function calculateTriangularWave(inputs: TriangularWaveInputs): TriangularWaveResults {
  const ampBase = convertToVolts(inputs.amplitude, inputs.amplitudeUnit);
  const freqBase = convertToHertz(inputs.frequency, inputs.frequencyUnit);
  const rBase = convertToOhms(inputs.r, inputs.rUnit);
  const cBase = convertToFarads(inputs.c, inputs.cUnit);
  const offset = inputs.offset || 0;

  const rcTimeConstant = rBase * cBase;
  const timePeriod = freqBase > 0 ? 1 / freqBase : 0;

  // Slope: |dVout/dt| = |Vin| / RC (in V/s)
  const outputSlope = rcTimeConstant > 0 ? ampBase / rcTimeConstant : 0;

  // Vpp = Vin * T / (2 * RC)
  const vpp = rcTimeConstant > 0 ? (ampBase * timePeriod) / (2 * rcTimeConstant) : 0;
  const vPeak = vpp / 2;

  const rStr = formatResistance(rBase);
  const cStr = formatCapacitance(cBase);
  const rcStr = rcTimeConstant < 1e-3
    ? `${cleanFloat(rcTimeConstant * 1e6, 2)} µs`
    : rcTimeConstant < 1
    ? `${cleanFloat(rcTimeConstant * 1e3, 3)} ms`
    : `${cleanFloat(rcTimeConstant, 4)} s`;
  const tStr = timePeriod < 1e-3
    ? `${cleanFloat(timePeriod * 1e6, 2)} µs`
    : `${cleanFloat(timePeriod * 1e3, 3)} ms`;
  const slopeStr = outputSlope >= 1e6
    ? `${cleanFloat(outputSlope / 1e6, 2)} V/µs`
    : outputSlope >= 1e3
    ? `${cleanFloat(outputSlope / 1e3, 2)} V/ms`
    : `${cleanFloat(outputSlope, 2)} V/s`;

  const steps = {
    rcFormula: 'RC = R × C',
    rcSub: `RC = ${cleanFloat(rBase)} Ω × ${cBase.toExponential(3)} F`,
    rcResult: `RC = ${rcStr}`,
    periodFormula: 'T = 1 / f',
    periodResult: `T = 1 / ${cleanFloat(freqBase)} Hz = ${tStr}`,
    slopeFormula: '|dVout / dt| = |Vin| / RC',
    slopeSub: `|dVout / dt| = ${cleanFloat(ampBase)} V / (${rcStr})`,
    slopeResult: `Slope = ${slopeStr}`,
    vppFormula: 'Vpp(triangle) = Vin × T / (2 × RC)',
    vppSub: `Vpp = (${cleanFloat(ampBase)} V × ${tStr}) / (2 × ${rcStr})`,
    vppResult: `Vpp = ${cleanFloat(vpp, 2)} V (Peak: ±${cleanFloat(vPeak, 2)} V)`,
  };

  return {
    ampBase,
    freqBase,
    rBase,
    cBase,
    offset,
    rcTimeConstant,
    timePeriod,
    outputSlope,
    vpp,
    vPeak,
    steps,
  };
}
