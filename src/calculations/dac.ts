import { DACInputs, DACResults, ValidationError } from '../types/circuit';
import { cleanFloat } from '../utils/formatters';

export function validateDACInputs(inputs: DACInputs): ValidationError[] {
  const errors: ValidationError[] = [];

  if (inputs.vref === undefined || isNaN(inputs.vref)) {
    errors.push({ field: 'vref', message: 'Reference voltage is required.' });
  } else if (inputs.vref <= 0) {
    errors.push({ field: 'vref', message: 'Vref must be greater than 0 V.' });
  } else if (inputs.vref > 50) {
    errors.push({ field: 'vref', message: 'Vref cannot exceed 50 V.' });
  }

  const maxCode = Math.pow(2, inputs.resolution) - 1;
  const binaryRegex = new RegExp(`^[01]{1,${inputs.resolution}}$`);

  if (!inputs.digitalBinary || !binaryRegex.test(inputs.digitalBinary)) {
    errors.push({
      field: 'digitalBinary',
      message: `Binary input must be a ${inputs.resolution}-bit binary string (0s and 1s only).`,
    });
  }

  if (
    inputs.digitalDecimal === undefined ||
    isNaN(inputs.digitalDecimal) ||
    inputs.digitalDecimal < 0 ||
    inputs.digitalDecimal > maxCode
  ) {
    errors.push({
      field: 'digitalDecimal',
      message: `Decimal value must be an integer between 0 and ${maxCode}.`,
    });
  }

  return errors;
}

export function calculateDAC(inputs: DACInputs): DACResults {
  const N = inputs.resolution;
  const numLevels = Math.pow(2, N);
  const maxCode = numLevels - 1;

  // Decimal code D (sanitized and clamped)
  let D = Math.max(0, Math.min(maxCode, Math.floor(inputs.digitalDecimal || 0)));

  // If binary string provided, we ensure sync
  if (inputs.digitalBinary && /^[01]+$/.test(inputs.digitalBinary)) {
    const parsedFromBin = parseInt(inputs.digitalBinary, 2);
    if (!isNaN(parsedFromBin) && parsedFromBin >= 0 && parsedFromBin <= maxCode) {
      D = parsedFromBin;
    }
  }

  const binaryString = D.toString(2).padStart(N, '0');
  const vref = inputs.vref;

  // LSB = Vref / (2^N - 1)
  const lsbSize = maxCode > 0 ? vref / maxCode : 0;

  // Vout = (D / (2^N - 1)) * Vref
  const vout = maxCode > 0 ? (D / maxCode) * vref : 0;

  return {
    resolution: N,
    numLevels,
    binaryInput: binaryString,
    decimalValue: D,
    vref,
    lsbSize,
    maxCode,
    vout,
    steps: {
      step1BinaryToDec: `${binaryString}₂ = ${D}₁₀`,
      step2MaxCodeFormula: `2^N - 1 = 2^${N} - 1`,
      step2MaxCodeResult: `${maxCode}`,
      step3LsbFormula: `LSB = Vref / (2^N - 1)`,
      step3LsbSub: `LSB = ${vref} V / ${maxCode}`,
      step3LsbResult: `${cleanFloat(lsbSize, 4)} V`,
      step4VoutFormula: `Vout = (D / (2^N - 1)) × Vref`,
      step4VoutSub: `Vout = (${D} / ${maxCode}) × ${vref} V`,
      step4VoutResult: `${cleanFloat(vout, 4)} V`,
    },
  };
}
