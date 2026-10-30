import { DifferentialAmpInputs, DifferentialAmpResults, ValidationError } from '../types/circuit';
import { convertToOhms, convertToVolts, formatResistance, cleanFloat } from '../utils/formatters';

export function validateDifferentialAmpInputs(inputs: DifferentialAmpInputs): ValidationError[] {
  const errors: ValidationError[] = [];

  if (isNaN(inputs.v1)) {
    errors.push({ field: 'v1', message: 'Inverting Input Voltage (V1) must be a valid number.' });
  }

  if (isNaN(inputs.v2)) {
    errors.push({ field: 'v2', message: 'Non-Inverting Input Voltage (V2) must be a valid number.' });
  }

  if (isNaN(inputs.r1)) {
    errors.push({ field: 'r1', message: 'Input Resistance (R1) must be a valid number.' });
  } else if (inputs.r1 <= 0) {
    errors.push({ field: 'r1', message: 'Input Resistance (R1) must be strictly greater than 0 Ω.' });
  }

  if (isNaN(inputs.r2)) {
    errors.push({ field: 'r2', message: 'Input Resistance (R2) must be a valid number.' });
  } else if (inputs.r2 <= 0) {
    errors.push({ field: 'r2', message: 'Input Resistance (R2) must be strictly greater than 0 Ω.' });
  }

  if (isNaN(inputs.rf)) {
    errors.push({ field: 'rf', message: 'Feedback Resistance (Rf) must be a valid number.' });
  } else if (inputs.rf < 0) {
    errors.push({ field: 'rf', message: 'Feedback Resistance (Rf) cannot be negative.' });
  }

  if (isNaN(inputs.rg)) {
    errors.push({ field: 'rg', message: 'Ground Reference Resistance (Rg) must be a valid number.' });
  } else if (inputs.rg < 0) {
    errors.push({ field: 'rg', message: 'Ground Reference Resistance (Rg) cannot be negative.' });
  }

  return errors;
}

export function calculateDifferentialAmplifier(inputs: DifferentialAmpInputs): DifferentialAmpResults {
  const v1Base = convertToVolts(inputs.v1, inputs.v1Unit);
  const v2Base = convertToVolts(inputs.v2, inputs.v2Unit);
  const r1Base = convertToOhms(inputs.r1, inputs.r1Unit);
  const r2Base = convertToOhms(inputs.r2, inputs.r2Unit);
  const rfBase = convertToOhms(inputs.rf, inputs.rfUnit);
  const rgBase = convertToOhms(inputs.rg, inputs.rgUnit);

  // Differential voltage: Vdiff = V2 - V1
  const vdiff = v2Base - v1Base;

  // Check matching: Rf / R1 == Rg / R2
  const ratio1 = rfBase / r1Base;
  const ratio2 = rgBase / r2Base;
  const isMatched = Math.abs(ratio1 - ratio2) < 1e-6;

  // Differential gain (based on standard equal-ratio configuration: Ad = Rf / R1)
  const ad = ratio1;

  // When matched: Vout = (Rf / R1) * (V2 - V1)
  // For general unmatched case (using superposition theorem):
  // V+ = V2 * [Rg / (R2 + Rg)]
  // Vout = V+ * [1 + Rf/R1] - V1 * (Rf/R1)
  const vPlus = v2Base * (rgBase / (r2Base + rgBase));
  const vout = isMatched
    ? ad * vdiff
    : vPlus * (1 + rfBase / r1Base) - v1Base * (rfBase / r1Base);

  const phaseShiftDeg = vout < 0 ? 180 : 0;

  const rfStr = formatResistance(rfBase);
  const r1Str = formatResistance(r1Base);
  const v1Str = `${cleanFloat(v1Base)} V`;
  const v2Str = `${cleanFloat(v2Base)} V`;
  const vdiffStr = `${cleanFloat(vdiff)} V`;
  const adStr = cleanFloat(ad);
  const voutStr = `${cleanFloat(vout)} V`;

  const steps = {
    vdiffFormula: 'Vdiff = V2 - V1',
    vdiffSubstitution: `Vdiff = ${v2Str} - ${v1Str}`,
    vdiffResult: `Vdiff = ${vdiffStr}`,
    gainFormula: 'Ad = Rf / R1',
    gainSubstitution: `Ad = ${rfStr} / ${r1Str}`,
    gainResult: `Ad = ${adStr}`,
    voutFormula: 'Vout = Ad × Vdiff',
    voutSubstitution: `Vout = ${adStr} × (${vdiffStr})`,
    voutResult: `Vout = ${voutStr}`,
  };

  return {
    v1Base,
    v2Base,
    r1Base,
    r2Base,
    rfBase,
    rgBase,
    vdiff,
    ad,
    vout,
    phaseShiftDeg,
    isMatched,
    steps,
  };
}
