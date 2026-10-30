import { VoltageFollowerInputs, VoltageFollowerResults, ValidationError } from '../types/circuit';
import { convertToVolts, cleanFloat } from '../utils/formatters';

export function validateVoltageFollowerInputs(inputs: VoltageFollowerInputs): ValidationError[] {
  const errors: ValidationError[] = [];

  if (isNaN(inputs.vin)) {
    errors.push({ field: 'vin', message: 'Input Voltage (Vin) must be a valid number.' });
  }

  return errors;
}

export function calculateVoltageFollower(inputs: VoltageFollowerInputs): VoltageFollowerResults {
  const vinBase = convertToVolts(inputs.vin, inputs.vinUnit);

  // Ideal Voltage Follower:
  // Av = 1 (Unity Gain)
  // Vout = Vin
  // Phase Shift = 0 deg
  const av = 1;
  const vout = vinBase;
  const phaseShiftDeg = 0;
  const zin = '∞ (Ultra High, > 10¹² Ω)';
  const zout = '0 Ω (Ideal Buffer)';

  const vinStr = `${cleanFloat(vinBase)} V`;
  const voutStr = `${cleanFloat(vout)} V`;

  const steps = {
    avFormula: 'Av = 1',
    avResult: 'Av = 1 (Unity Gain Buffer)',
    voutFormula: 'Vout = Vin',
    voutSubstitution: `Vout = ${vinStr}`,
    voutResult: `Vout = ${voutStr}`,
    phaseResult: 'Phase Shift = 0° (In-phase output)'
  };

  return {
    vinBase,
    av,
    vout,
    phaseShiftDeg,
    zin,
    zout,
    steps
  };
}
