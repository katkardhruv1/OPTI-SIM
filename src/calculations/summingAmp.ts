import { SummingAmpInputs, SummingAmpResults, InputContribution, ValidationError } from '../types/circuit';
import { convertToOhms, convertToVolts, formatResistance, formatVoltage, cleanFloat } from '../utils/formatters';

export function validateSummingAmpInputs(inputs: SummingAmpInputs): ValidationError[] {
  const errors: ValidationError[] = [];

  if (inputs.channels.length < 2) {
    errors.push({ field: 'channels', message: 'A minimum of 2 input channels is required.' });
  } else if (inputs.channels.length > 4) {
    errors.push({ field: 'channels', message: 'A maximum of 4 input channels is supported.' });
  }

  if (isNaN(inputs.rf)) {
    errors.push({ field: 'rf', message: 'Feedback Resistance (Rf) must be a valid number.' });
  } else if (inputs.rf <= 0) {
    errors.push({ field: 'rf', message: 'Feedback Resistance (Rf) must be strictly greater than 0 Ω.' });
  }

  inputs.channels.forEach((ch, idx) => {
    if (isNaN(ch.voltage)) {
      errors.push({ field: `ch_v_${ch.id}`, message: `${ch.name}: Voltage must be a valid number.` });
    }
    if (isNaN(ch.resistance)) {
      errors.push({ field: `ch_r_${ch.id}`, message: `${ch.name}: Resistance must be a valid number.` });
    } else if (ch.resistance <= 0) {
      errors.push({
        field: `ch_r_${ch.id}`,
        message: `${ch.name}: Resistance must be strictly greater than 0 Ω to prevent division by zero.`
      });
    }
  });

  return errors;
}

export function calculateSummingAmplifier(inputs: SummingAmpInputs): SummingAmpResults {
  const rfBase = convertToOhms(inputs.rf, inputs.rfUnit);

  let totalVout = 0;
  const contributions: InputContribution[] = [];

  const ratioTerms: string[] = [];
  const valueTerms: string[] = [];

  inputs.channels.forEach((ch, idx) => {
    const vBase = convertToVolts(ch.voltage, ch.voltageUnit);
    const rBase = convertToOhms(ch.resistance, ch.resistanceUnit);

    const weight = rfBase / rBase;
    const contribution = -weight * vBase;
    totalVout += contribution;

    contributions.push({
      channelId: ch.id,
      name: ch.name,
      voltageBase: vBase,
      resistanceBase: rBase,
      weight,
      contribution,
      contributionFormatted: `${cleanFloat(contribution)} V`,
    });

    const index = idx + 1;
    ratioTerms.push(`V${index}/R${index}`);
    valueTerms.push(`${cleanFloat(vBase)}V/${formatResistance(rBase)}`);
  });

  const rfStr = formatResistance(rfBase);
  const voutStr = `${cleanFloat(totalVout)} V`;

  const steps = {
    formula: `Vout = -Rf × (${ratioTerms.join(' + ')})`,
    substitution: `Vout = -(${rfStr}) × (${valueTerms.join(' + ')})`,
    result: `Vout = ${voutStr}`
  };

  return {
    numInputs: inputs.channels.length,
    rfBase,
    contributions,
    vout: totalVout,
    phaseShiftDeg: 180,
    steps,
  };
}
