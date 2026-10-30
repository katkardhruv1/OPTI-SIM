import { PrecisionRectifierInputs, PrecisionRectifierResults, ValidationError } from '../types/circuit';
import { convertToHertz, convertToVolts, formatFrequency, cleanFloat } from '../utils/formatters';

export function validatePrecisionRectifierInputs(inputs: PrecisionRectifierInputs): ValidationError[] {
  const errors: ValidationError[] = [];

  if (isNaN(inputs.vin)) {
    errors.push({ field: 'vin', message: 'Input Voltage must be a valid number.' });
  } else if (inputs.vin <= 0) {
    errors.push({ field: 'vin', message: 'Input Voltage amplitude must be greater than 0 V.' });
  }

  if (isNaN(inputs.frequency)) {
    errors.push({ field: 'frequency', message: 'Frequency must be a valid number.' });
  } else if (inputs.frequency <= 0) {
    errors.push({ field: 'frequency', message: 'Frequency must be strictly greater than 0 Hz.' });
  }

  return errors;
}

export function calculatePrecisionRectifier(inputs: PrecisionRectifierInputs): PrecisionRectifierResults {
  const vinBase = convertToVolts(inputs.vin, inputs.vinUnit);
  const freqBase = convertToHertz(inputs.frequency, inputs.frequencyUnit);

  const voutPosPeak = vinBase;
  const voutNegPeak = 0;
  const rectificationType = 'Ideal Non-Inverting Superdiode (Half-Wave)';

  const vinStr = `${cleanFloat(vinBase)} V`;

  const steps = {
    posCycleFormula: 'For Vin > 0: Diode is Forward-Biased (ON)',
    posCycleResult: `Vout = Vin = +${vinStr} (0.7V diode drop eliminated by op-amp open-loop gain)`,
    negCycleFormula: 'For Vin ≤ 0: Diode is Reverse-Biased (OFF)',
    negCycleResult: 'Vout = 0.00 V (Output isolated through load resistor RL)',
    principleExplanation:
      'In a conventional diode rectifier, signals below 0.7 V cannot conduct. Placing the diode inside the op-amp feedback loop divides the forward drop by open-loop gain (Vγ / Aol ≈ 0.7V / 100,000 ≈ 7 µV), achieving near-ideal precision rectification down to millivolts.',
  };

  return {
    vinBase,
    freqBase,
    voutPosPeak,
    voutNegPeak,
    rectificationType,
    steps,
  };
}
