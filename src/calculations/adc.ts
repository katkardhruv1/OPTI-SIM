import { ADCInputs, ADCResults, ADCComparatorState, ValidationError } from '../types/circuit';
import { cleanFloat } from '../utils/formatters';

export function validateADCInputs(inputs: ADCInputs): ValidationError[] {
  const errors: ValidationError[] = [];

  if (inputs.vref === undefined || isNaN(inputs.vref)) {
    errors.push({ field: 'vref', message: 'Reference voltage is required.' });
  } else if (inputs.vref <= 0) {
    errors.push({ field: 'vref', message: 'Vref must be greater than 0 V.' });
  } else if (inputs.vref > 50) {
    errors.push({ field: 'vref', message: 'Vref cannot exceed 50 V.' });
  }

  if (inputs.vin === undefined || isNaN(inputs.vin)) {
    errors.push({ field: 'vin', message: 'Input voltage Vin is required.' });
  } else if (inputs.vin < 0) {
    errors.push({ field: 'vin', message: 'Vin cannot be negative (0 V to Vref).' });
  } else if (inputs.vref > 0 && inputs.vin > inputs.vref * 1.5) {
    errors.push({
      field: 'vin',
      message: `Vin exceeds maximum allowed overvoltage range (${cleanFloat(inputs.vref * 1.5, 2)} V).`,
    });
  }

  return errors;
}

export function calculateADC(inputs: ADCInputs): ADCResults {
  const N = inputs.resolution;
  const numLevels = Math.pow(2, N);
  const maxCode = numLevels - 1;
  const vref = Math.max(0.1, inputs.vref);
  const vin = Math.max(0, inputs.vin);

  // Standard engineering LSB step size for N-bit flash/ladder ADC:
  // LSB = Vref / (2^N - 1)
  const lsbSize = maxCode > 0 ? vref / maxCode : 0;

  // Digital code (Decimal): D = round((Vin / Vref) * maxCode), clamped to [0, maxCode]
  let digitalDecimal = Math.min(maxCode, Math.max(0, Math.round((vin / vref) * maxCode)));

  // Binary string padded to N bits
  const digitalBinary = digitalDecimal.toString(2).padStart(N, '0');

  // Quantized analog equivalent
  const quantizedVoltage = digitalDecimal * lsbSize;

  // Quantization error: ε = Vin - Vq
  const quantizationError = vin - quantizedVoltage;

  // Flash ADC Comparators: 2^N - 1 comparators in parallel
  const numComparators = numLevels - 1;
  const comparatorStates: ADCComparatorState[] = [];
  let thermometerBits = '';

  // Ladder thresholds: Vth_k = (k / maxCode) * Vref
  for (let k = 1; k <= numComparators; k++) {
    const vTh = (k * vref) / maxCode;
    const isHigh = vin >= vTh;
    if (k <= 63) {
      comparatorStates.push({
        index: k,
        thresholdVoltage: vTh,
        state: isHigh ? 'HIGH' : 'LOW',
      });
    }
    thermometerBits = (isHigh ? '1' : '0') + thermometerBits;
  }

  return {
    resolution: N,
    numLevels,
    vref,
    vin,
    lsbSize,
    maxCode,
    digitalDecimal,
    digitalBinary,
    quantizedVoltage,
    quantizationError,
    numComparators,
    comparatorStates,
    thermometerCode: thermometerBits.slice(0, 32),
    steps: {
      step1LevelsAndLsb: `2^N = 2^${N} = ${numLevels} levels (Max code: ${maxCode})`,
      step1LsbSub: `LSB = Vref / (2^N - 1) = ${vref} V / ${maxCode}`,
      step1LsbResult: `${cleanFloat(lsbSize, 4)} V`,
      step2CodeFormula: `D = round((Vin / Vref) × (2^N - 1))`,
      step2CodeSub: `D = round((${cleanFloat(vin, 3)} V / ${cleanFloat(vref, 2)} V) × ${maxCode}) = round(${cleanFloat((vin / vref) * maxCode, 3)})`,
      step2CodeResult: `${digitalDecimal}₁₀`,
      step3BinaryConversion: `${digitalDecimal}₁₀ = ${digitalBinary}₂`,
      step4QuantizedFormula: `Vq = D × LSB`,
      step4QuantizedSub: `Vq = ${digitalDecimal} × ${cleanFloat(lsbSize, 4)} V`,
      step4QuantizedResult: `${cleanFloat(quantizedVoltage, 4)} V`,
      step5ErrorFormula: `ε = Vin - Vq`,
      step5ErrorSub: `ε = ${cleanFloat(vin, 4)} V - ${cleanFloat(quantizedVoltage, 4)} V`,
      step5ErrorResult: `${cleanFloat(quantizationError, 4)} V`,
    },
  };
}
