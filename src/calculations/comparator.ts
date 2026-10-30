import { ComparatorInputs, ComparatorResults, ComparatorType, ValidationError } from '../types/circuit';
import { convertToVolts, cleanFloat } from '../utils/formatters';

export function validateComparatorInputs(inputs: ComparatorInputs): ValidationError[] {
  const errors: ValidationError[] = [];

  if (isNaN(inputs.vin)) {
    errors.push({ field: 'vin', message: 'Input Voltage must be a valid number.' });
  }

  if (isNaN(inputs.vref)) {
    errors.push({ field: 'vref', message: 'Reference Voltage (Vref) must be a valid number.' });
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

export function calculateComparator(inputs: ComparatorInputs): ComparatorResults {
  const vinBase = convertToVolts(inputs.vin, inputs.vinUnit);
  const vrefBase = convertToVolts(inputs.vref, inputs.vrefUnit);
  const posVsat = inputs.posVsat;
  const negVsat = inputs.negVsat;
  const comparatorType = inputs.comparatorType;

  const diff = vinBase - vrefBase;
  const isDiffZero = Math.abs(diff) < 1e-9;

  let vout = 0;
  let stateLabel = '';
  let isSaturatedPos = false;

  if (comparatorType === 'non-inverting') {
    if (diff > 0) {
      vout = posVsat;
      stateLabel = 'HIGH / +Vsat';
      isSaturatedPos = true;
    } else if (diff < 0) {
      vout = negVsat;
      stateLabel = 'LOW / -Vsat';
      isSaturatedPos = false;
    } else {
      // Threshold boundary transition
      vout = 0;
      stateLabel = 'THRESHOLD TRANSITION (0 V)';
      isSaturatedPos = false;
    }
  } else {
    // Inverting comparator
    if (diff > 0) {
      vout = negVsat;
      stateLabel = 'LOW / -Vsat';
      isSaturatedPos = false;
    } else if (diff < 0) {
      vout = posVsat;
      stateLabel = 'HIGH / +Vsat';
      isSaturatedPos = true;
    } else {
      vout = 0;
      stateLabel = 'THRESHOLD TRANSITION (0 V)';
      isSaturatedPos = false;
    }
  }

  const vinStr = `${cleanFloat(vinBase)} V`;
  const vrefStr = `${cleanFloat(vrefBase)} V`;
  const posVsatStr = `+${cleanFloat(posVsat)} V`;
  const negVsatStr = `${cleanFloat(negVsat)} V`;
  const compLabel = comparatorType === 'non-inverting' ? 'Non-Inverting Comparator' : 'Inverting Comparator';

  const relOperator = diff > 0 ? '>' : diff < 0 ? '<' : '=';

  const steps = {
    step1Comparison: `Vin (${vinStr}) vs Vref (${vrefStr})`,
    step1Result: isDiffZero
      ? `Vin = Vref (${vinStr}) [Operating directly at switching threshold boundary]`
      : `Vin ${relOperator} Vref (${vinStr} ${relOperator} ${vrefStr})`,
    step2Logic:
      comparatorType === 'non-inverting'
        ? `Non-Inverting Configuration: Input applied to non-inverting terminal (+), Vref to inverting (-).`
        : `Inverting Configuration: Input applied to inverting terminal (-), Vref to non-inverting (+).`,
    step2Result:
      comparatorType === 'non-inverting'
        ? diff > 0
          ? `Since Vin > Vref: Differential voltage Vd = (Vin - Vref) > 0 → Output saturates to +Vsat (${posVsatStr}).`
          : diff < 0
          ? `Since Vin < Vref: Differential voltage Vd = (Vin - Vref) < 0 → Output saturates to -Vsat (${negVsatStr}).`
          : `At boundary Vin = Vref: Differential input is 0 V (metastable switching point).`
        : diff > 0
        ? `Since Vin > Vref: Differential voltage Vd = (Vref - Vin) < 0 → Output inverts and saturates to -Vsat (${negVsatStr}).`
        : diff < 0
        ? `Since Vin < Vref: Differential voltage Vd = (Vref - Vin) > 0 → Output inverts and saturates to +Vsat (${posVsatStr}).`
        : `At boundary Vin = Vref: Differential input is 0 V (metastable switching point).`,
    step3Output: `Vout = ${vout >= 0 ? `+${cleanFloat(vout)} V` : `${cleanFloat(vout)} V`} (${stateLabel})`,
  };

  return {
    vinBase,
    vrefBase,
    posVsat,
    negVsat,
    comparatorType,
    vout,
    stateLabel,
    isSaturatedPos,
    steps,
  };
}

export interface TransferCurvePoint {
  vin: number;
  vout: number;
}

/**
 * Generates transfer characteristic points (Vout vs Vin) for the comparator
 */
export function generateComparatorTransferCurve(
  vref: number,
  posVsat: number,
  negVsat: number,
  comparatorType: ComparatorType,
  spanVolts: number = 6
): TransferCurvePoint[] {
  const minVin = vref - spanVolts;
  const maxVin = vref + spanVolts;
  const delta = 0.005; // sharp transition step

  if (comparatorType === 'non-inverting') {
    return [
      { vin: minVin, vout: negVsat },
      { vin: vref - delta, vout: negVsat },
      { vin: vref + delta, vout: posVsat },
      { vin: maxVin, vout: posVsat },
    ];
  } else {
    return [
      { vin: minVin, vout: posVsat },
      { vin: vref - delta, vout: posVsat },
      { vin: vref + delta, vout: negVsat },
      { vin: maxVin, vout: negVsat },
    ];
  }
}
