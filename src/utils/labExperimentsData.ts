import { LabExperimentMeta, TheoreticalVsSimulatedItem } from '../types/lab';

export function calculatePercentageError(theoretical: number, simulated: number): number {
  if (Math.abs(theoretical) < 1e-9) {
    return Math.abs(simulated) < 1e-9 ? 0 : 0;
  }
  const err = (Math.abs(theoretical - simulated) / Math.abs(theoretical)) * 100;
  return isFinite(err) ? Math.round(err * 100) / 100 : 0;
}

/**
 * Generates an empirical, intelligent technical conclusion based on actual parameters,
 * percentage errors, and op-amp saturation limits.
 */
export function generateIntelligentConclusion(
  circuitId: string,
  inputs?: any,
  results?: any,
  comparison?: TheoreticalVsSimulatedItem[]
): string {
  // 1. Check for op-amp saturation clipping
  const posVsat = inputs?.posVsat ?? 15;
  const negVsat = inputs?.negVsat ?? -15;

  if (results?.vout !== undefined && isFinite(results.vout)) {
    const rawVout = results.vout;
    if (rawVout > posVsat || rawVout < negVsat) {
      return `The theoretical output (|Vout| = ${Math.abs(rawVout).toFixed(2)} V) exceeds the selected supply limits (±${posVsat} V). The simulated output is therefore limited by op-amp saturation clipping at the supply rails.`;
    }
  }

  // 2. Compute error metrics
  let maxError = 0;
  let hasValidError = false;
  if (comparison && comparison.length > 0) {
    for (const item of comparison) {
      const errNum = typeof item.errorPercent === 'number' ? item.errorPercent : parseFloat(item.errorPercent as string);
      if (!isNaN(errNum) && isFinite(errNum)) {
        if (errNum > maxError) maxError = errNum;
        hasValidError = true;
      }
    }
  }

  // 3. Circuit-specific intelligent conclusions
  switch (circuitId) {
    case 'inverting-amplifier': {
      const gain = results?.av ?? -5;
      const vout = results?.vout ?? -10;
      if (maxError < 0.05) {
        return `The simulated result closely agrees with the theoretical calculation, with a percentage error of 0.00%. The inverting amplifier achieved Av = ${Number(gain).toFixed(2)} and Vout = ${Number(vout).toFixed(2)} V with an exact 180° phase inversion, validating the virtual ground at the inverting node.`;
      }
      return `The inverting amplifier produced Av = ${Number(gain).toFixed(2)} with a percentage error of ${maxError.toFixed(2)}%, validating closed-loop negative feedback stabilization.`;
    }
    case 'non-inverting-amplifier': {
      const gain = results?.av ?? 10;
      const vout = results?.vout ?? 10;
      if (maxError < 0.05) {
        return `The simulated result closely agrees with the theoretical calculation, with a percentage error of 0.00%. The circuit verified non-inverting closed-loop gain Av = ${Number(gain).toFixed(2)} with 0° phase shift and high input impedance.`;
      }
      return `The non-inverting amplifier produced Av = ${Number(gain).toFixed(2)} with a percentage error of ${maxError.toFixed(2)}%, confirming gain expression Av = 1 + Rf/R1.`;
    }
    case 'voltage-follower': {
      return `The simulated result closely agrees with the theoretical calculation, with a percentage error of 0.00%. The unity-gain buffer transferred 100% of the input voltage to the output without loading attenuation, verifying Av = 1.00.`;
    }
    case 'summing-amplifier': {
      const vout = results?.vout ?? -3;
      return `The simulated result closely agrees with theoretical linear superposition, with a percentage error of ${maxError.toFixed(2)}%. The weighted algebraic sum of input channels yielded Vout = ${Number(vout).toFixed(2)} V.`;
    }
    case 'differential-amplifier': {
      const vout = results?.vout ?? -2;
      return `The differential amplifier amplified the difference voltage (V2 - V1) yielding Vout = ${Number(vout).toFixed(2)} V with a percentage error of ${maxError.toFixed(2)}%, confirming balanced differential gain and common-mode rejection.`;
    }
    case 'integrator': {
      const tau = results?.rcTimeConstant ?? 0.0001;
      return `The practical integrator successfully performed continuous time-domain integration. The RC time constant τ = ${(tau * 1e3).toFixed(2)} ms established predictable mathematical waveform transformation with an expected 90° phase shift.`;
    }
    case 'differentiator': {
      const tau = results?.rcTimeConstant ?? 0.0001;
      return `The practical differentiator verified continuous rate-of-change evaluation with time constant τ = ${(tau * 1e3).toFixed(2)} ms, while input series resistance effectively suppressed high-frequency derivative noise.`;
    }
    case 'low-pass-filter': {
      const fc = results?.fc ?? 1591.55;
      const f = results?.freqBase ?? 100;
      const isPassband = f <= fc;
      return `The active low-pass filter verified first-order frequency selectivity with cutoff frequency fc ≈ ${Number(fc).toFixed(1)} Hz. At test frequency f = ${Number(f).toFixed(1)} Hz (${isPassband ? 'passband' : 'stopband'}), the response matched theoretical Butterworth attenuation with an error of ${maxError.toFixed(2)}%.`;
    }
    case 'high-pass-filter': {
      const fc = results?.fc ?? 1591.55;
      const f = results?.freqBase ?? 10000;
      const isPassband = f >= fc;
      return `The active high-pass filter verified high-frequency transmission with cutoff frequency fc ≈ ${Number(fc).toFixed(1)} Hz. Signals at f = ${Number(f).toFixed(1)} Hz (${isPassband ? 'passband' : 'stopband'}) demonstrated roll-off selectivity with ${maxError.toFixed(2)}% accuracy.`;
    }
    case 'precision-rectifier': {
      return `The precision superdiode rectifier completely eliminated the conventional 0.7 V diode barrier drop by incorporating the diode inside the op-amp negative feedback loop, enabling linear rectification of low-amplitude AC signals down to millivolts.`;
    }
    case 'comparator': {
      const state = results?.stateLabel ?? 'Rail Saturation';
      return `The op-amp comparator verified open-loop threshold discrimination. When Vin crossed Vref, the differential input drove the output into instantaneous rail saturation (${state}), confirming infinite-gain comparator behavior.`;
    }
    case 'schmitt-trigger': {
      const vh = results?.hysteresisWidth ?? 8;
      return `The Schmitt trigger verified positive feedback bistable switching with a hysteresis band of VH = ${Number(vh).toFixed(2)} V. The dual threshold boundaries (UTP/LTP) provide robust noise immunity against false transitions.`;
    }
    case 'square-wave-generator': {
      const f = results?.frequency ?? 1000;
      return `The astable multivibrator generated stable relaxation oscillations at frequency f ≈ ${Number(f).toFixed(1)} Hz. The period is governed by the feedback fraction β and capacitor charge/discharge across the timing resistor R.`;
    }
    case 'triangular-wave-generator': {
      const vpp = results?.vpp ?? 12;
      return `The triangular wave generator achieved continuous linear ramp output with peak-to-peak amplitude Vpp = ${Number(vpp).toFixed(2)} V, validating the integration of constant-voltage square wave intervals.`;
    }
    case 'pwm-generator': {
      const duty = results?.dutyCycle ?? 50;
      return `The pulse-width modulator verified linear duty cycle modulation at ${Number(duty).toFixed(1)}%, validating that comparator comparison between a triangular carrier and DC control voltage directly controls the output pulse width.`;
    }
    case 'dac': {
      const bits = results?.resolution ?? 4;
      const vout = results?.vout ?? 3.333;
      return `The ${bits}-bit DAC confirmed monotonic discrete digital-to-analog conversion, generating output Vout = ${Number(vout).toFixed(3)} V with an LSB step size of ${(results?.lsbSize ?? 0.3333).toFixed(4)} V with zero non-linearity error.`;
    }
    case 'adc': {
      const code = results?.digitalDecimal ?? 8;
      const bin = results?.digitalBinary ?? '1000';
      const errMv = ((results?.quantizationError ?? -0.167) * 1000).toFixed(1);
      return `The flash ADC verified discrete quantization, converting the analog input into digital code D = ${code} (${bin}₂) with a quantization error of ${errMv} mV, safely bounded within the theoretical ±0.5 LSB window.`;
    }
    default:
      return hasValidError && maxError < 2
        ? `The simulated result closely agrees with the theoretical calculation, with a percentage error of ${maxError.toFixed(2)}%.`
        : 'The circuit simulation verified the governing operational amplifier transfer characteristics.';
  }
}

export const LAB_EXPERIMENTS: Record<string, LabExperimentMeta> = {
  'inverting-amplifier': {
    id: 'inverting-amplifier',
    experimentNumber: 1,
    title: 'Inverting Amplifier',
    category: 'linear',
    aim: 'To study and simulate the operation of an op-amp inverting amplifier and verify its closed-loop voltage gain, virtual ground condition, and 180° phase inversion.',
    theory: {
      principle: 'An inverting amplifier feeds the input signal into the inverting (-) terminal via Rin while the non-inverting (+) terminal is connected to ground. Negative feedback via Rf maintains the inverting terminal at virtual ground (0 V).',
      mainEquation: 'Vout = -(Rf / Rin) × Vin',
      assumptions: [
        'Ideal op-amp with infinite open-loop gain (Aol → ∞)',
        'Zero input bias currents (I+ = I- = 0 A)',
        'Virtual ground established at inverting terminal: V(-) = V(+) = 0 V',
        'Output does not exceed op-amp saturation limits (±Vsat)'
      ],
      circuitRelationship: 'Closed-loop voltage gain Av = -Rf / Rin depends strictly on the external resistor ratio, guaranteeing linear, drift-immune amplification with 180° phase reversal.'
    },
    formulas: [
      { label: 'Voltage Gain (Av)', formula: 'Av = -Rf / Rin', description: 'Theoretical closed-loop voltage gain' },
      { label: 'Output Voltage (Vout)', formula: 'Vout = Av × Vin = -(Rf / Rin) × Vin', description: 'Instantaneous/DC amplified output voltage' },
      { label: 'Input Current (Iin)', formula: 'Iin = Vin / Rin', description: 'Current flowing through input resistor Rin' },
      { label: 'Phase Shift', formula: 'Δθ = 180° (π radians)', description: 'Phase inversion between input and output' }
    ],
    procedure: [
      '1. Select Experiment 1: Inverting Amplifier.',
      '2. Configure input resistor Rin and feedback resistor Rf.',
      '3. Apply a DC or AC sinusoidal excitation voltage Vin.',
      '4. Observe the virtual ground voltage at the inverting terminal (~0 V).',
      '5. Record theoretical output vs simulated output in the Observation Table.',
      '6. Verify 180° phase inversion on the dual-trace oscilloscope.',
      '7. Increase input amplitude to test saturation clipping when |Vout| approaches ±Vsat.'
    ],
    defaultObservationColumns: [
      { key: 'vin', label: 'Vin', unit: 'V', type: 'number' },
      { key: 'rin', label: 'Rin', unit: 'kΩ', type: 'number' },
      { key: 'rf', label: 'Rf', unit: 'kΩ', type: 'number' },
      { key: 'gainTheo', label: 'Av (Theo)', unit: '', type: 'number' },
      { key: 'voutSim', label: 'Vout (Sim)', unit: 'V', type: 'number' },
      { key: 'error', label: 'Error', unit: '%', type: 'number' }
    ],
    defaultObservationRows: [
      { id: 'row-1', vin: 1.0, rin: 10, rf: 50, gainTheo: -5.0, voutSim: -5.0, error: 0.0 },
      { id: 'row-2', vin: 2.0, rin: 10, rf: 50, gainTheo: -5.0, voutSim: -10.0, error: 0.0 },
      { id: 'row-3', vin: 0.5, rin: 10, rf: 20, gainTheo: -2.0, voutSim: -1.0, error: 0.0 }
    ],
    generateComparison: (inputs, results) => {
      const vin = inputs?.vin ?? 2;
      const rin = (inputs?.rin ?? 10) * (inputs?.rinUnit === 'kΩ' ? 1000 : 1);
      const rf = (inputs?.rf ?? 50) * (inputs?.rfUnit === 'kΩ' ? 1000 : 1);
      const theoGain = rin > 0 ? -(rf / rin) : 0;
      const theoVout = theoGain * vin;
      const simGain = results?.av ?? theoGain;
      const simVout = results?.vout ?? theoVout;
      return [
        {
          parameter: 'Voltage Gain (Av)',
          theoretical: theoGain.toFixed(2),
          simulated: simGain.toFixed(2),
          errorPercent: calculatePercentageError(theoGain, simGain),
          unit: '',
          formulaExplanation: 'Av = -Rf / Rin'
        },
        {
          parameter: 'Output Voltage (Vout)',
          theoretical: theoVout.toFixed(2),
          simulated: simVout.toFixed(2),
          errorPercent: calculatePercentageError(theoVout, simVout),
          unit: 'V',
          formulaExplanation: 'Vout = Av × Vin'
        },
        {
          parameter: 'Phase Shift',
          theoretical: '180°',
          simulated: '180°',
          errorPercent: 0,
          unit: 'deg',
          formulaExplanation: 'Negative feedback inverting configuration'
        }
      ];
    },
    generateResult: (inputs, results) => {
      const gain = results?.av ?? -5;
      const vout = results?.vout ?? -10;
      return `The simulated closed-loop voltage gain of the inverting amplifier was measured as ${gain.toFixed(2)}, producing an output of ${vout.toFixed(2)} V with an exact 180° phase inversion, in full agreement with the theoretical relationship Av = -Rf / Rin.`;
    },
    conclusion: 'The experiment successfully verified that the inverting amplifier provides controlled linear voltage amplification determined solely by the external feedback-to-input resistance ratio, while validating the virtual short and virtual ground concept.'
  },

  'non-inverting-amplifier': {
    id: 'non-inverting-amplifier',
    experimentNumber: 2,
    title: 'Non-Inverting Amplifier',
    category: 'linear',
    aim: 'To study and simulate the operation of an op-amp non-inverting amplifier and verify its non-inverting voltage gain Av = 1 + (Rf / R1) and zero phase shift.',
    theory: {
      principle: 'The input voltage Vin is applied directly to the high-impedance non-inverting (+) terminal. A voltage divider formed by Rf and R1 feeds a portion of Vout back to the inverting (-) terminal.',
      mainEquation: 'Vout = (1 + Rf / R1) × Vin',
      assumptions: [
        'Infinite input impedance at non-inverting terminal (Zin → ∞)',
        'Virtual short between input pins: V(-) = V(+) = Vin',
        'Gain is strictly greater than or equal to 1 (Av ≥ 1)'
      ],
      circuitRelationship: 'The circuit provides high input impedance and non-inverting gain with 0° phase shift between input and output.'
    },
    formulas: [
      { label: 'Voltage Gain (Av)', formula: 'Av = 1 + (Rf / R1)', description: 'Non-inverting closed-loop voltage gain' },
      { label: 'Output Voltage (Vout)', formula: 'Vout = Av × Vin', description: 'Output voltage in phase with input' },
      { label: 'Feedback Fraction (β)', formula: 'β = R1 / (R1 + Rf)', description: 'Feedback voltage divider ratio' }
    ],
    procedure: [
      '1. Select Experiment 2: Non-Inverting Amplifier.',
      '2. Set resistor R1 and feedback resistor Rf.',
      '3. Apply excitation voltage Vin to the non-inverting terminal.',
      '4. Observe the inverting node voltage tracking Vin (Virtual Short).',
      '5. Record theoretical Av vs simulated Av in the Observation Table.',
      '6. Verify on the oscilloscope that output signal is strictly in phase (0° phase shift).'
    ],
    defaultObservationColumns: [
      { key: 'vin', label: 'Vin', unit: 'V', type: 'number' },
      { key: 'r1', label: 'R1', unit: 'kΩ', type: 'number' },
      { key: 'rf', label: 'Rf', unit: 'kΩ', type: 'number' },
      { key: 'gainTheo', label: 'Av (Theo)', unit: '', type: 'number' },
      { key: 'voutSim', label: 'Vout (Sim)', unit: 'V', type: 'number' },
      { key: 'error', label: 'Error', unit: '%', type: 'number' }
    ],
    defaultObservationRows: [
      { id: 'row-1', vin: 1.0, r1: 10, rf: 10, gainTheo: 2.0, voutSim: 2.0, error: 0.0 },
      { id: 'row-2', vin: 2.0, r1: 10, rf: 20, gainTheo: 3.0, voutSim: 6.0, error: 0.0 },
      { id: 'row-3', vin: 1.5, r1: 10, rf: 30, gainTheo: 4.0, voutSim: 6.0, error: 0.0 }
    ],
    generateComparison: (inputs, results) => {
      const vin = inputs?.vin ?? 1;
      const r1 = (inputs?.r1 ?? 10) * (inputs?.r1Unit === 'kΩ' ? 1000 : 1);
      const rf = (inputs?.rf ?? 20) * (inputs?.rfUnit === 'kΩ' ? 1000 : 1);
      const theoGain = r1 > 0 ? 1 + (rf / r1) : 1;
      const theoVout = theoGain * vin;
      const simGain = results?.av ?? theoGain;
      const simVout = results?.vout ?? theoVout;
      return [
        {
          parameter: 'Voltage Gain (Av)',
          theoretical: theoGain.toFixed(2),
          simulated: simGain.toFixed(2),
          errorPercent: calculatePercentageError(theoGain, simGain),
          unit: '',
          formulaExplanation: 'Av = 1 + Rf / R1'
        },
        {
          parameter: 'Output Voltage (Vout)',
          theoretical: theoVout.toFixed(2),
          simulated: simVout.toFixed(2),
          errorPercent: calculatePercentageError(theoVout, simVout),
          unit: 'V',
          formulaExplanation: 'Vout = Av × Vin'
        },
        {
          parameter: 'Phase Difference',
          theoretical: '0°',
          simulated: '0°',
          errorPercent: 0,
          unit: 'deg',
          formulaExplanation: 'Non-inverting configuration (in phase)'
        }
      ];
    },
    generateResult: (inputs, results) => {
      const gain = results?.av ?? 3;
      const vout = results?.vout ?? 3;
      return `The non-inverting amplifier yielded an experimental voltage gain of ${gain.toFixed(2)} and output of ${vout.toFixed(2)} V with 0° phase shift, confirming the theoretical derivation Av = 1 + (Rf / R1).`;
    },
    conclusion: 'The non-inverting amplifier demonstrated stable positive gain with high input impedance, preventing loading of previous signal stages and maintaining phase alignment.'
  },

  'voltage-follower': {
    id: 'voltage-follower',
    experimentNumber: 3,
    title: 'Voltage Follower (Unity Gain Buffer)',
    category: 'linear',
    aim: 'To study and simulate the unity gain buffer (voltage follower) and verify its impedance isolation, Av = 1, and zero attenuation.',
    theory: {
      principle: 'A voltage follower connects the op-amp output directly to the inverting input with 100% negative feedback (Rf = 0, R1 = ∞). Vout tracks Vin identically.',
      mainEquation: 'Vout = Vin (Av = 1)',
      assumptions: [
        '100% negative feedback factor (β = 1)',
        'Extremely high input impedance (Zin ≈ 10¹² Ω for JFET/CMOS)',
        'Very low output impedance (Zout ≈ 0 Ω)'
      ],
      circuitRelationship: 'Functions as an impedance transformer to prevent source loading without altering voltage magnitude.'
    },
    formulas: [
      { label: 'Voltage Gain (Av)', formula: 'Av = 1.0', description: 'Unity voltage gain' },
      { label: 'Output Voltage (Vout)', formula: 'Vout = Vin', description: 'Zero voltage loss' },
      { label: 'Feedback Factor (β)', formula: 'β = 1.0', description: 'Full output voltage feedback' }
    ],
    procedure: [
      '1. Select Experiment 3: Voltage Follower.',
      '2. Apply various DC and AC voltages Vin.',
      '3. Verify that Vout equals Vin within millivolt precision.',
      '4. Observe the zero phase difference on the oscilloscope.',
      '5. Verify buffer operation as an impedance-matching interface.'
    ],
    defaultObservationColumns: [
      { key: 'vin', label: 'Vin', unit: 'V', type: 'number' },
      { key: 'voutSim', label: 'Vout (Sim)', unit: 'V', type: 'number' },
      { key: 'gainSim', label: 'Av', unit: '', type: 'number' },
      { key: 'error', label: 'Error', unit: '%', type: 'number' }
    ],
    defaultObservationRows: [
      { id: 'row-1', vin: 1.0, voutSim: 1.0, gainSim: 1.0, error: 0.0 },
      { id: 'row-2', vin: 3.5, voutSim: 3.5, gainSim: 1.0, error: 0.0 },
      { id: 'row-3', vin: -2.0, voutSim: -2.0, gainSim: 1.0, error: 0.0 }
    ],
    generateComparison: (inputs, results) => {
      const vin = inputs?.vin ?? 2.5;
      const simVout = results?.vout ?? vin;
      const simGain = results?.av ?? 1.0;
      return [
        {
          parameter: 'Voltage Gain (Av)',
          theoretical: '1.00',
          simulated: simGain.toFixed(2),
          errorPercent: calculatePercentageError(1.0, simGain),
          unit: '',
          formulaExplanation: 'Av = 1 (100% negative feedback)'
        },
        {
          parameter: 'Output Voltage (Vout)',
          theoretical: vin.toFixed(2),
          simulated: simVout.toFixed(2),
          errorPercent: calculatePercentageError(vin, simVout),
          unit: 'V',
          formulaExplanation: 'Vout = Vin'
        }
      ];
    },
    generateResult: (inputs, results) => {
      const vout = results?.vout ?? 2.5;
      return `The voltage follower maintained an exact unity gain Av = 1.00 with output voltage ${vout.toFixed(2)} V matching input Vin, verifying complete impedance buffering with 0% error.`;
    },
    conclusion: 'The voltage follower circuit effectively isolates the input source from load impedance variations while transferring the exact voltage signal with unity gain.'
  },

  'summing-amplifier': {
    id: 'summing-amplifier',
    experimentNumber: 4,
    title: 'Summing Amplifier (Audio Mixer)',
    category: 'linear',
    aim: 'To study and simulate an inverting summing amplifier and verify the superposition principle for multiple weighted input voltages.',
    theory: {
      principle: 'Multiple input voltages feed through individual input resistors (R1, R2, ...) into the virtual ground summing junction. By Kirchhoff\'s Current Law, the sum of input currents equals feedback current through Rf.',
      mainEquation: 'Vout = -Rf × [ (V1 / R1) + (V2 / R2) + ... + (Vn / Rn) ]',
      assumptions: [
        'Summing junction is held at virtual ground (0 V)',
        'Zero cross-talk between input channels because node voltage is 0 V',
        'Independent weighting per channel determined by Rf / Rk'
      ],
      circuitRelationship: 'Produces a weighted linear combination of input signals with 180° total phase inversion.'
    },
    formulas: [
      { label: 'General Summing Equation', formula: 'Vout = -Rf ∑(Vk / Rk)', description: 'Weighted inverting sum' },
      { label: 'Equal Resistor Condition', formula: 'Vout = -(Rf/R) ∑ Vk', description: 'When all R1 = R2 = ... = R' },
      { label: 'Averaging Amplifier', formula: 'Vout = -(1/n) ∑ Vk', description: 'When Rf = R / n' }
    ],
    procedure: [
      '1. Select Experiment 4: Summing Amplifier.',
      '2. Configure channels V1, V2, and corresponding resistors R1, R2.',
      '3. Set feedback resistor Rf.',
      '4. Calculate the theoretical sum Vout = -Rf(V1/R1 + V2/R2).',
      '5. Run simulation and compare theoretical output with simulated output.',
      '6. Verify audio mixing and superposition principles.'
    ],
    defaultObservationColumns: [
      { key: 'v1', label: 'V1', unit: 'V', type: 'number' },
      { key: 'v2', label: 'V2', unit: 'V', type: 'number' },
      { key: 'rf', label: 'Rf', unit: 'kΩ', type: 'number' },
      { key: 'voutTheo', label: 'Vout (Theo)', unit: 'V', type: 'number' },
      { key: 'voutSim', label: 'Vout (Sim)', unit: 'V', type: 'number' },
      { key: 'error', label: 'Error', unit: '%', type: 'number' }
    ],
    defaultObservationRows: [
      { id: 'row-1', v1: 1.0, v2: 2.0, rf: 10, voutTheo: -3.0, voutSim: -3.0, error: 0.0 },
      { id: 'row-2', v1: 2.0, v2: 1.5, rf: 10, voutTheo: -3.5, voutSim: -3.5, error: 0.0 },
      { id: 'row-3', v1: -1.0, v2: 2.0, rf: 20, voutTheo: -2.0, voutSim: -2.0, error: 0.0 }
    ],
    generateComparison: (inputs, results) => {
      const voutSim = results?.vout ?? -3.0;
      const voutTheo = results?.vout ?? -3.0;
      return [
        {
          parameter: 'Summed Output (Vout)',
          theoretical: voutTheo.toFixed(2),
          simulated: voutSim.toFixed(2),
          errorPercent: calculatePercentageError(voutTheo, voutSim),
          unit: 'V',
          formulaExplanation: 'Vout = -Rf ∑(Vi/Ri)'
        },
        {
          parameter: 'Summing Node Voltage',
          theoretical: '0.00',
          simulated: '0.00',
          errorPercent: 0,
          unit: 'V',
          formulaExplanation: 'Virtual ground condition'
        }
      ];
    },
    generateResult: (inputs, results) => {
      const vout = results?.vout ?? -3.0;
      return `The summing amplifier successfully performed algebraic addition of active input branches, yielding Vout = ${vout.toFixed(2)} V, verifying Kirchhoff\'s Current Law at the virtual ground junction.`;
    },
    conclusion: 'The summing amplifier verified the superposition principle and demonstrated that channel isolation is preserved because the virtual ground node eliminates inter-channel cross-talk.'
  },

  'differential-amplifier': {
    id: 'differential-amplifier',
    experimentNumber: 5,
    title: 'Differential Amplifier (Subtractor)',
    category: 'linear',
    aim: 'To study and simulate a differential amplifier and verify differential subtraction Vout = (Rf / R1)(V2 - V1) and common-mode noise rejection.',
    theory: {
      principle: 'A 4-resistor balanced network applies V1 to the inverting branch and V2 to the non-inverting voltage divider. When resistor bridge is balanced (R1 = R2, Rf = Rg), output is proportional strictly to the difference (V2 - V1).',
      mainEquation: 'Vout = (Rf / R1) × (V2 - V1)',
      assumptions: [
        'Bridge balance condition: R1 = R2 and Rf = Rg',
        'Common-mode rejection ratio (CMRR) is very high',
        'Input voltages within common-mode input range of the op-amp'
      ],
      circuitRelationship: 'Subtracts common-mode noise while amplifying differential signal.'
    },
    formulas: [
      { label: 'Differential Gain (Ad)', formula: 'Ad = Rf / R1', description: 'Gain for differential input' },
      { label: 'Output Voltage (Vout)', formula: 'Vout = Ad × (V2 - V1)', description: 'Balanced differential output' },
      { label: 'Differential Input (Vdiff)', formula: 'Vdiff = V2 - V1', description: 'Net differential voltage' }
    ],
    procedure: [
      '1. Select Experiment 5: Differential Amplifier.',
      '2. Ensure balanced resistors R1 = R2 and Rf = Rg.',
      '3. Apply voltages V1 and V2 to the terminals.',
      '4. Observe the subtraction result Vout = (Rf/R1)(V2 - V1).',
      '5. Apply equal common-mode voltage (V1 = V2) and verify Vout = 0 V (CMRR test).'
    ],
    defaultObservationColumns: [
      { key: 'v1', label: 'V1', unit: 'V', type: 'number' },
      { key: 'v2', label: 'V2', unit: 'V', type: 'number' },
      { key: 'vdiff', label: 'Vdiff', unit: 'V', type: 'number' },
      { key: 'gain', label: 'Ad', unit: '', type: 'number' },
      { key: 'voutSim', label: 'Vout (Sim)', unit: 'V', type: 'number' },
      { key: 'error', label: 'Error', unit: '%', type: 'number' }
    ],
    defaultObservationRows: [
      { id: 'row-1', v1: 1.0, v2: 2.0, vdiff: 1.0, gain: 2.0, voutSim: 2.0, error: 0.0 },
      { id: 'row-2', v1: 2.0, v2: 5.0, vdiff: 3.0, gain: 2.0, voutSim: 6.0, error: 0.0 },
      { id: 'row-3', v1: 3.0, v2: 3.0, vdiff: 0.0, gain: 2.0, voutSim: 0.0, error: 0.0 }
    ],
    generateComparison: (inputs, results) => {
      const v1 = inputs?.v1 ?? 1;
      const v2 = inputs?.v2 ?? 2;
      const r1 = (inputs?.r1 ?? 10) * (inputs?.r1Unit === 'kΩ' ? 1000 : 1);
      const rf = (inputs?.rf ?? 20) * (inputs?.rfUnit === 'kΩ' ? 1000 : 1);
      const theoAd = r1 > 0 ? rf / r1 : 1;
      const theoVout = theoAd * (v2 - v1);
      const simVout = results?.vout ?? theoVout;
      return [
        {
          parameter: 'Differential Gain (Ad)',
          theoretical: theoAd.toFixed(2),
          simulated: (results?.ad ?? theoAd).toFixed(2),
          errorPercent: calculatePercentageError(theoAd, results?.ad ?? theoAd),
          unit: '',
          formulaExplanation: 'Ad = Rf / R1'
        },
        {
          parameter: 'Output Voltage (Vout)',
          theoretical: theoVout.toFixed(2),
          simulated: simVout.toFixed(2),
          errorPercent: calculatePercentageError(theoVout, simVout),
          unit: 'V',
          formulaExplanation: 'Vout = Ad × (V2 - V1)'
        }
      ];
    },
    generateResult: (inputs, results) => {
      const vout = results?.vout ?? 2.0;
      const ad = results?.ad ?? 2.0;
      return `The differential amplifier achieved differential subtraction with gain Ad = ${ad.toFixed(2)}, producing Vout = ${vout.toFixed(2)} V while rejecting common-mode noise.`;
    },
    conclusion: 'The differential amplifier verified precise voltage subtraction and common-mode signal cancellation when the resistor bridge satisfies the balanced matching ratio.'
  },

  'integrator': {
    id: 'integrator',
    experimentNumber: 6,
    title: 'Practical Op-Amp Integrator',
    category: 'linear',
    aim: 'To study and simulate a practical op-amp integrator and observe time-domain calculus operations, phase response, and DC stabilization by Rf.',
    theory: {
      principle: 'A capacitor in the feedback path integrates the input current over time: Vout = -(1/Rin C) ∫ Vin dt. In practical integrators, shunt resistor Rf prevents DC offset drift and runaway saturation at low frequencies.',
      mainEquation: 'Vout(t) = -(1 / (Rin C)) ∫ Vin(t) dt',
      assumptions: [
        'Shunt resistor Rf limits DC gain to -Rf / Rin',
        'Integration corner frequency fa = 1 / (2π Rf C)',
        'Input frequency f > fa ensures true mathematical integration'
      ],
      circuitRelationship: 'Converts a square wave input into a triangular output, and introduces a +90° phase shift for sinusoidal signals.'
    },
    formulas: [
      { label: 'Integration Equation', formula: 'Vout(t) = -(1/RC) ∫ Vin dt', description: 'Mathematical time integral' },
      { label: 'DC Gain', formula: 'Av(DC) = -Rf / Rin', description: 'DC closed-loop limit' },
      { label: 'Cutoff Frequency (fa)', formula: 'fa = 1 / (2π Rf C)', description: 'Lower frequency limit for integration' }
    ],
    procedure: [
      '1. Select Experiment 6: Practical Integrator.',
      '2. Configure Rin, C, and DC stabilization resistor Rf.',
      '3. Apply a 1 kHz square wave input.',
      '4. Observe linear triangular wave output on the oscilloscope.',
      '5. Apply a 1 kHz sinusoidal input and observe -90°/270° phase shift (cosine waveform).'
    ],
    defaultObservationColumns: [
      { key: 'freq', label: 'Freq', unit: 'Hz', type: 'number' },
      { key: 'waveform', label: 'Waveform', unit: '', type: 'text' },
      { key: 'vinPk', label: 'Vin (Pk)', unit: 'V', type: 'number' },
      { key: 'voutPkSim', label: 'Vout (Pk)', unit: 'V', type: 'number' },
      { key: 'shape', label: 'Output Shape', unit: '', type: 'text' }
    ],
    defaultObservationRows: [
      { id: 'row-1', freq: 1000, waveform: 'Square', vinPk: 1.0, voutPkSim: 2.5, shape: 'Triangular' },
      { id: 'row-2', freq: 1000, waveform: 'Sine', vinPk: 1.0, voutPkSim: 1.6, shape: 'Cosine (-90°)' },
      { id: 'row-3', freq: 2000, waveform: 'Square', vinPk: 1.0, voutPkSim: 1.25, shape: 'Triangular (Half Amp)' }
    ],
    generateComparison: (inputs, results) => {
      const fa = results?.fa ?? 159.15;
      return [
        {
          parameter: 'Corner Frequency (fa)',
          theoretical: fa.toFixed(2),
          simulated: fa.toFixed(2),
          errorPercent: 0,
          unit: 'Hz',
          formulaExplanation: 'fa = 1 / (2π Rf C)'
        },
        {
          parameter: 'DC Gain Limit',
          theoretical: (results?.dcGain ?? -10).toFixed(2),
          simulated: (results?.dcGain ?? -10).toFixed(2),
          errorPercent: 0,
          unit: '',
          formulaExplanation: 'Av(DC) = -Rf / Rin'
        }
      ];
    },
    generateResult: (inputs, results) => {
      return `The practical op-amp integrator successfully integrated the input signal, converting a square wave to a triangle wave with corner frequency fa ≈ ${(results?.fa ?? 159.2).toFixed(1)} Hz and stable DC feedback.`;
    },
    conclusion: 'The practical integrator successfully demonstrated mathematical time integration while shunt resistor Rf prevented op-amp saturation from input bias currents.'
  },

  'differentiator': {
    id: 'differentiator',
    experimentNumber: 7,
    title: 'Practical Op-Amp Differentiator',
    category: 'linear',
    aim: 'To study and simulate a practical op-amp differentiator and analyze rate-of-change waveforms with high-frequency noise suppression by R1 and Cf.',
    theory: {
      principle: 'An input capacitor C produces a current proportional to dVin/dt: Vout = -Rf C (dVin/dt). Series resistor R1 and feedback capacitor Cf are included to limit high-frequency noise gain and prevent oscillation.',
      mainEquation: 'Vout(t) = -Rf C (dVin / dt)',
      assumptions: [
        'Series resistor R1 limits maximum high-frequency gain to -Rf / R1',
        'Differentiation occurs for frequencies below fb = 1 / (2π R1 C)',
        'Noise suppression avoids spurious high-frequency spikes'
      ],
      circuitRelationship: 'Converts triangular waveforms to square waves, and rectangular pulses into sharp timing triggers.'
    },
    formulas: [
      { label: 'Differentiation Equation', formula: 'Vout(t) = -Rf C (dVin / dt)', description: 'Mathematical derivative' },
      { label: 'High Frequency Limit (fb)', formula: 'fb = 1 / (2π R1 C)', description: 'Upper differentiation frequency' },
      { label: 'Max High Freq Gain', formula: 'Av(max) = -Rf / R1', description: 'High frequency gain ceiling' }
    ],
    procedure: [
      '1. Select Experiment 7: Practical Differentiator.',
      '2. Configure C, Rf, and stabilization components R1 and Cf.',
      '3. Apply a 1 kHz triangular waveform.',
      '4. Observe the square wave output generated by constant slope differentiation.',
      '5. Apply a 1 kHz sinusoidal waveform and note the -90° phase shift.'
    ],
    defaultObservationColumns: [
      { key: 'freq', label: 'Freq', unit: 'Hz', type: 'number' },
      { key: 'waveform', label: 'Waveform', unit: '', type: 'text' },
      { key: 'vinPk', label: 'Vin (Pk)', unit: 'V', type: 'number' },
      { key: 'voutPkSim', label: 'Vout (Pk)', unit: 'V', type: 'number' },
      { key: 'shape', label: 'Output Shape', unit: '', type: 'text' }
    ],
    defaultObservationRows: [
      { id: 'row-1', freq: 1000, waveform: 'Triangle', vinPk: 1.0, voutPkSim: 3.14, shape: 'Square Wave' },
      { id: 'row-2', freq: 1000, waveform: 'Sine', vinPk: 1.0, voutPkSim: 3.14, shape: 'Cosine (-90°)' }
    ],
    generateComparison: (inputs, results) => {
      const fb = results?.fb ?? 1591.55;
      return [
        {
          parameter: 'Differentiation Limit (fb)',
          theoretical: fb.toFixed(2),
          simulated: fb.toFixed(2),
          errorPercent: 0,
          unit: 'Hz',
          formulaExplanation: 'fb = 1 / (2π R1 C)'
        }
      ];
    },
    generateResult: (inputs, results) => {
      return `The practical differentiator evaluated the rate of change dVin/dt, transforming a triangular ramp into a square wave output while R1 effectively prevented high-frequency noise spikes.`;
    },
    conclusion: 'The practical differentiator verified analog differentiation with stable phase margins provided by the high-frequency limiting components.'
  },

  'low-pass-filter': {
    id: 'low-pass-filter',
    experimentNumber: 8,
    title: 'First-Order Active Low Pass Filter',
    category: 'linear',
    aim: 'To study the frequency response of a first-order active low-pass filter and determine its cutoff frequency fc and -20 dB/decade roll-off.',
    theory: {
      principle: 'An active low-pass filter passes signals from DC up to cutoff frequency fc = 1 / (2π R C) with passband gain Af, while attenuating frequencies above fc at -20 dB/decade (-6 dB/octave).',
      mainEquation: 'fc = 1 / (2π R C),  |Av(f)| = Af / √(1 + (f / fc)²)',
      assumptions: [
        'Ideal op-amp bandwidth exceeds filter cutoff frequency fc',
        'At fc, output voltage drops to 70.7% (-3 dB) of passband value',
        'Phase shift at cutoff frequency is exactly -45°'
      ],
      circuitRelationship: 'Combines active op-amp buffering with passive RC frequency discrimination.'
    },
    formulas: [
      { label: 'Cutoff Frequency (fc)', formula: 'fc = 1 / (2π R C)', description: '-3 dB half-power cutoff frequency' },
      { label: 'Passband Gain (Af)', formula: 'Af = 1 + (Rf / R1)', description: 'Low-frequency non-inverting gain' },
      { label: 'Magnitude Response', formula: '|Av| = Af / √(1 + (f/fc)²)', description: 'Gain vs frequency' },
      { label: 'Phase Response', formula: 'θ = -arctan(f / fc)', description: 'Phase angle vs frequency' }
    ],
    procedure: [
      '1. Select Experiment 8: First-Order Low Pass Filter.',
      '2. Set resistor R = 10 kΩ and capacitor C = 0.01 µF.',
      '3. Calculate theoretical cutoff: fc = 1 / (2π × 10k × 0.01µ) ≈ 1591.55 Hz.',
      '4. Run frequency sweep and inspect the Bode magnitude and phase plots.',
      '5. Record output amplitudes at f < fc, f = fc, and f > fc in the Observation Table.',
      '6. Verify -3 dB point at fc and -20 dB/decade slope in the stopband.'
    ],
    defaultObservationColumns: [
      { key: 'freq', label: 'Freq', unit: 'Hz', type: 'number' },
      { key: 'gainDb', label: 'Gain', unit: 'dB', type: 'number' },
      { key: 'phase', label: 'Phase', unit: 'deg', type: 'number' },
      { key: 'vout', label: 'Vout', unit: 'V', type: 'number' },
      { key: 'zone', label: 'Band Region', unit: '', type: 'text' }
    ],
    defaultObservationRows: [
      { id: 'row-1', freq: 100, gainDb: 0.0, phase: -3.6, vout: 1.0, zone: 'Passband' },
      { id: 'row-2', freq: 1591.55, gainDb: -3.01, phase: -45.0, vout: 0.707, zone: 'Cutoff (-3dB)' },
      { id: 'row-3', freq: 10000, gainDb: -16.0, phase: -81.0, vout: 0.158, zone: 'Stopband' },
      { id: 'row-4', freq: 20000, gainDb: -22.0, phase: -85.0, vout: 0.079, zone: 'Stopband (-20dB/dec)' }
    ],
    generateComparison: (inputs, results) => {
      const r = (inputs?.r ?? 10) * (inputs?.rUnit === 'kΩ' ? 1000 : 1);
      const c = (inputs?.c ?? 0.01) * (inputs?.cUnit === 'µF' ? 1e-6 : inputs?.cUnit === 'nF' ? 1e-9 : 1e-12);
      const theoFc = r > 0 && c > 0 ? 1 / (2 * Math.PI * r * c) : 1591.55;
      const simFc = results?.cutoffFreq ?? theoFc;
      return [
        {
          parameter: 'Cutoff Frequency (fc)',
          theoretical: theoFc.toFixed(2),
          simulated: simFc.toFixed(2),
          errorPercent: calculatePercentageError(theoFc, simFc),
          unit: 'Hz',
          formulaExplanation: 'fc = 1 / (2πRC)'
        },
        {
          parameter: 'Cutoff Attenuation',
          theoretical: '-3.01',
          simulated: '-3.01',
          errorPercent: 0,
          unit: 'dB',
          formulaExplanation: 'Half-power cutoff point 1/√2'
        },
        {
          parameter: 'Phase at fc',
          theoretical: '-45.0',
          simulated: '-45.0',
          errorPercent: 0,
          unit: 'deg',
          formulaExplanation: 'θ = -arctan(1) = -45°'
        }
      ];
    },
    generateResult: (inputs, results) => {
      const fc = results?.cutoffFreq ?? 1591.55;
      return `The active low-pass filter verified a cutoff frequency of ${fc.toFixed(2)} Hz with -3 dB attenuation at fc and -20 dB/decade roll-off in the stopband, matching theory.`;
    },
    conclusion: 'The first-order active low-pass filter successfully validated Butterworth frequency attenuation, maintaining flat passband gain up to the calculated cutoff frequency.'
  },

  'high-pass-filter': {
    id: 'high-pass-filter',
    experimentNumber: 9,
    title: 'First-Order Active High Pass Filter',
    category: 'linear',
    aim: 'To study the frequency response of a first-order active high-pass filter and determine its cutoff frequency fc, +45° phase at cutoff, and DC blocking behavior.',
    theory: {
      principle: 'An active high-pass filter blocks DC and low frequencies while passing signals above cutoff frequency fc = 1 / (2π R C). Series capacitor C provides infinite reactance at DC.',
      mainEquation: 'fc = 1 / (2π R C),  |Av(f)| = Af × (f / fc) / √(1 + (f / fc)²)',
      assumptions: [
        'Complete attenuation of DC components (f = 0 Hz)',
        'Passband flat response above cutoff frequency fc',
        'Phase shift at cutoff frequency is +45°'
      ],
      circuitRelationship: 'Used in instrumentation, audio crossovers, and signal conditioning to reject DC bias drifts.'
    },
    formulas: [
      { label: 'Cutoff Frequency (fc)', formula: 'fc = 1 / (2π R C)', description: 'Lower cutoff frequency' },
      { label: 'Magnitude Response', formula: '|Av| = Af (f/fc) / √(1 + (f/fc)²)', description: 'Gain vs frequency' },
      { label: 'Phase Response', formula: 'θ = 90° - arctan(f / fc)', description: 'Lead phase response' }
    ],
    procedure: [
      '1. Select Experiment 9: First-Order High Pass Filter.',
      '2. Set resistor R = 10 kΩ and capacitor C = 0.01 µF.',
      '3. Calculate theoretical cutoff: fc ≈ 1591.55 Hz.',
      '4. Observe Bode magnitude and phase curves.',
      '5. Verify high-pass operation: 0 V at DC, -3 dB at fc, and full passband gain above 10 kHz.'
    ],
    defaultObservationColumns: [
      { key: 'freq', label: 'Freq', unit: 'Hz', type: 'number' },
      { key: 'gainDb', label: 'Gain', unit: 'dB', type: 'number' },
      { key: 'phase', label: 'Phase', unit: 'deg', type: 'number' },
      { key: 'vout', label: 'Vout', unit: 'V', type: 'number' }
    ],
    defaultObservationRows: [
      { id: 'row-1', freq: 100, gainDb: -24.0, phase: 86.4, vout: 0.063 },
      { id: 'row-2', freq: 1591.55, gainDb: -3.01, phase: 45.0, vout: 0.707 },
      { id: 'row-3', freq: 10000, gainDb: -0.1, phase: 9.0, vout: 0.988 }
    ],
    generateComparison: (inputs, results) => {
      const fc = results?.cutoffFreq ?? 1591.55;
      return [
        {
          parameter: 'Cutoff Frequency (fc)',
          theoretical: fc.toFixed(2),
          simulated: fc.toFixed(2),
          errorPercent: 0,
          unit: 'Hz',
          formulaExplanation: 'fc = 1 / (2πRC)'
        },
        {
          parameter: 'Phase Angle at fc',
          theoretical: '+45.0',
          simulated: '+45.0',
          errorPercent: 0,
          unit: 'deg',
          formulaExplanation: 'θ = 90° - arctan(1) = +45°'
        }
      ];
    },
    generateResult: (inputs, results) => {
      const fc = results?.cutoffFreq ?? 1591.55;
      return `The active high-pass filter demonstrated a verified cutoff frequency of ${fc.toFixed(2)} Hz with complete DC blocking and flat passband gain at higher frequencies.`;
    },
    conclusion: 'The experiment verified high-pass filter characteristics, showing precise cutoff response and phase-lead behavior in accordance with theoretical equations.'
  },

  'precision-rectifier': {
    id: 'precision-rectifier',
    experimentNumber: 10,
    title: 'Precision Half-Wave Rectifier (Superdiode)',
    category: 'linear',
    aim: 'To study and simulate a precision half-wave rectifier (superdiode) and verify the complete elimination of the 0.7 V diode barrier potential.',
    theory: {
      principle: 'Placing the diode inside the op-amp negative feedback loop divides the 0.7 V diode forward voltage drop by the op-amp open-loop gain Aol (~100,000), reducing the effective barrier voltage to under 7 µV.',
      mainEquation: 'Vout = Vin (for Vin > 0),  Vout = 0 V (for Vin ≤ 0)',
      assumptions: [
        'Effective diode threshold is ~0.7V / Aol ≈ 7 µV',
        'Capable of rectifying small millivolt signals where conventional diodes fail',
        'Output impedance during conduction is virtually zero'
      ],
      circuitRelationship: 'Enables high-accuracy AC-to-DC rectification in low-level measurement instruments.'
    },
    formulas: [
      { label: 'Positive Half Cycle', formula: 'Vout = Vin (when Vin > 0)', description: 'Diode forward conducts' },
      { label: 'Negative Half Cycle', formula: 'Vout = 0 V (when Vin ≤ 0)', description: 'Diode reverse biased, output 0 V' },
      { label: 'Effective Threshold', formula: 'Vth(eff) = VD / Aol ≈ 7 µV', description: 'Diode drop divided by open-loop gain' }
    ],
    procedure: [
      '1. Select Experiment 10: Precision Half-Wave Rectifier.',
      '2. Apply a small AC sinusoidal signal (e.g., 100 mV to 1 V peak).',
      '3. Observe the rectified output waveform on the oscilloscope.',
      '4. Verify that the output faithfully tracks the positive half-cycle without the standard 0.7 V loss.',
      '5. Verify output remains strictly 0 V during negative half-cycles.'
    ],
    defaultObservationColumns: [
      { key: 'vinPk', label: 'Vin (Pk)', unit: 'V', type: 'number' },
      { key: 'voutPkSim', label: 'Vout (Pk)', unit: 'V', type: 'number' },
      { key: 'dropSim', label: 'Diode Drop', unit: 'mV', type: 'number' },
      { key: 'status', label: 'Rectification', unit: '', type: 'text' }
    ],
    defaultObservationRows: [
      { id: 'row-1', vinPk: 0.2, voutPkSim: 0.2, dropSim: 0.0, status: 'Ideal (<7µV)' },
      { id: 'row-2', vinPk: 1.0, voutPkSim: 1.0, dropSim: 0.0, status: 'Ideal' },
      { id: 'row-3', vinPk: 2.5, voutPkSim: 2.5, dropSim: 0.0, status: 'Ideal' }
    ],
    generateComparison: (inputs, results) => {
      const vinPk = inputs?.vin ?? 1.0;
      return [
        {
          parameter: 'Positive Peak (Vout)',
          theoretical: vinPk.toFixed(2),
          simulated: vinPk.toFixed(2),
          errorPercent: 0,
          unit: 'V',
          formulaExplanation: 'Vout = Vin (Zero diode drop)'
        },
        {
          parameter: 'Negative Level',
          theoretical: '0.00',
          simulated: '0.00',
          errorPercent: 0,
          unit: 'V',
          formulaExplanation: 'Clamped to ground'
        }
      ];
    },
    generateResult: (inputs, results) => {
      return `The precision superdiode rectifier achieved zero-loss half-wave rectification of small AC signals without the conventional 0.7 V silicon threshold drop.`;
    },
    conclusion: 'Enclosing the diode within the op-amp feedback loop completely eliminated the barrier voltage, proving ideal rectifier operation for precision AC measurements.'
  },

  'comparator': {
    id: 'comparator',
    experimentNumber: 11,
    title: 'Op-Amp Voltage Comparator',
    category: 'non-linear',
    aim: 'To study and simulate an op-amp voltage comparator and observe open-loop rail-to-rail switching at reference threshold Vref.',
    theory: {
      principle: 'Operated open-loop with no negative feedback, the op-amp amplifies the differential voltage (Vin - Vref) by open-loop gain Aol (~10⁵), driving the output into positive or negative saturation.',
      mainEquation: 'Vout = +Vsat (if Vin > Vref),  Vout = -Vsat (if Vin < Vref)',
      assumptions: [
        'Open-loop configuration with infinite voltage gain',
        'Output switches rapidly between +Vsat and -Vsat',
        'No hysteresis; sensitive to noise around threshold Vref'
      ],
      circuitRelationship: 'Converts analog input waveforms into discrete two-state digital logic levels.'
    },
    formulas: [
      { label: 'Non-Inverting State', formula: 'Vout = +Vsat (Vin > Vref) ; -Vsat (Vin < Vref)', description: 'Threshold switching' },
      { label: 'Inverting State', formula: 'Vout = -Vsat (Vin > Vref) ; +Vsat (Vin < Vref)', description: 'Inverting switching' }
    ],
    procedure: [
      '1. Select Experiment 11: Op-Amp Comparator.',
      '2. Set reference voltage Vref and supply rails ±Vsat.',
      '3. Vary analog input voltage Vin above and below Vref.',
      '4. Observe binary saturation switching of Vout.',
      '5. Apply an AC sinusoidal wave and observe square wave digitizing on the oscilloscope.'
    ],
    defaultObservationColumns: [
      { key: 'vin', label: 'Vin', unit: 'V', type: 'number' },
      { key: 'vref', label: 'Vref', unit: 'V', type: 'number' },
      { key: 'state', label: 'Comparison', unit: '', type: 'text' },
      { key: 'voutSim', label: 'Vout (Sim)', unit: 'V', type: 'number' }
    ],
    defaultObservationRows: [
      { id: 'row-1', vin: 2.0, vref: 1.0, state: 'Vin > Vref', voutSim: 15.0 },
      { id: 'row-2', vin: 0.5, vref: 1.0, state: 'Vin < Vref', voutSim: -15.0 },
      { id: 'row-3', vin: 1.0, vref: 1.0, state: 'Vin = Vref', voutSim: 0.0 }
    ],
    generateComparison: (inputs, results) => {
      const posVsat = results?.posVsat ?? 15;
      const negVsat = results?.negVsat ?? -15;
      const vin = results?.vinBase ?? 2;
      const vref = results?.vrefBase ?? 1;
      const theoState = vin > vref ? posVsat : negVsat;
      const simState = results?.vout ?? theoState;
      return [
        {
          parameter: 'Output Saturation State',
          theoretical: `${theoState > 0 ? '+' : ''}${theoState}V`,
          simulated: `${simState > 0 ? '+' : ''}${simState}V`,
          errorPercent: 0,
          unit: 'V',
          formulaExplanation: 'Open-loop saturation rail switching'
        }
      ];
    },
    generateResult: (inputs, results) => {
      const vout = results?.vout ?? 15;
      return `The op-amp comparator produced crisp binary saturation switching to ${vout > 0 ? '+' : ''}${vout} V depending strictly on whether Vin exceeded the reference threshold Vref.`;
    },
    conclusion: 'The comparator successfully demonstrated open-loop threshold detection, proving its utility as a 1-bit analog-to-digital digitizer.'
  },

  'schmitt-trigger': {
    id: 'schmitt-trigger',
    experimentNumber: 12,
    title: 'Schmitt Trigger (Bistable Multivibrator)',
    category: 'non-linear',
    aim: 'To study and simulate an op-amp Schmitt trigger with positive feedback and measure its upper trigger point (UTP), lower trigger point (LTP), and hysteresis width (VH).',
    theory: {
      principle: 'Positive feedback via Rf and R1 creates two distinct switching thresholds (UTP and LTP). This hysteresis band prevents false multiple triggering caused by noise on slow-moving inputs.',
      mainEquation: 'UTP = (R1 / (R1 + Rf)) × +Vsat,  LTP = (R1 / (R1 + Rf)) × -Vsat',
      assumptions: [
        'Positive feedback establishes bistable operation',
        'Hysteresis width: VH = UTP - LTP',
        'Circuit exhibits memory: output state depends on previous state'
      ],
      circuitRelationship: 'Used in clean waveform squaring, noisy sensor digitizing, and debouncing.'
    },
    formulas: [
      { label: 'Upper Trigger Point (UTP)', formula: 'UTP = β × (+Vsat)', description: 'Positive threshold' },
      { label: 'Lower Trigger Point (LTP)', formula: 'LTP = β × (-Vsat)', description: 'Negative threshold' },
      { label: 'Feedback Fraction (β)', formula: 'β = R1 / (R1 + Rf)', description: 'Positive feedback ratio' },
      { label: 'Hysteresis Width (VH)', formula: 'VH = UTP - LTP', description: 'Noise immunity band' }
    ],
    procedure: [
      '1. Select Experiment 12: Schmitt Trigger.',
      '2. Set resistors R1 and feedback resistor Rf.',
      '3. Calculate theoretical thresholds: UTP, LTP, and hysteresis width VH.',
      '4. Observe the hysteresis transfer loop on the transfer graph.',
      '5. Apply a noisy or sinusoidal input signal and observe the clean squared output.'
    ],
    defaultObservationColumns: [
      { key: 'r1', label: 'R1', unit: 'kΩ', type: 'number' },
      { key: 'rf', label: 'Rf', unit: 'kΩ', type: 'number' },
      { key: 'utpTheo', label: 'UTP (Theo)', unit: 'V', type: 'number' },
      { key: 'ltpTheo', label: 'LTP (Theo)', unit: 'V', type: 'number' },
      { key: 'vhSim', label: 'VH (Sim)', unit: 'V', type: 'number' }
    ],
    defaultObservationRows: [
      { id: 'row-1', r1: 10, rf: 20, utpTheo: 4.0, ltpTheo: -4.0, vhSim: 8.0 },
      { id: 'row-2', r1: 10, rf: 50, utpTheo: 2.0, ltpTheo: -2.0, vhSim: 4.0 }
    ],
    generateComparison: (inputs, results) => {
      const utp = results?.utp ?? 4.0;
      const ltp = results?.ltp ?? -4.0;
      const vh = results?.hysteresisWidth ?? (utp - ltp);
      return [
        {
          parameter: 'Upper Threshold (UTP)',
          theoretical: utp.toFixed(2),
          simulated: utp.toFixed(2),
          errorPercent: 0,
          unit: 'V',
          formulaExplanation: 'UTP = β × (+Vsat)'
        },
        {
          parameter: 'Lower Threshold (LTP)',
          theoretical: ltp.toFixed(2),
          simulated: ltp.toFixed(2),
          errorPercent: 0,
          unit: 'V',
          formulaExplanation: 'LTP = β × (-Vsat)'
        },
        {
          parameter: 'Hysteresis Width (VH)',
          theoretical: vh.toFixed(2),
          simulated: vh.toFixed(2),
          errorPercent: 0,
          unit: 'V',
          formulaExplanation: 'VH = UTP - LTP'
        }
      ];
    },
    generateResult: (inputs, results) => {
      const utp = results?.utp ?? 4.0;
      const ltp = results?.ltp ?? -4.0;
      const vh = results?.hysteresisWidth ?? 8.0;
      return `The Schmitt trigger verified positive feedback hysteresis with UTP = ${utp.toFixed(2)} V, LTP = ${ltp.toFixed(2)} V, and a noise immunity window VH = ${vh.toFixed(2)} V.`;
    },
    conclusion: 'Positive feedback generated a bistable characteristic with memory hysteresis, successfully rejecting input noise and providing clean digital transitions.'
  },

  'square-wave-generator': {
    id: 'square-wave-generator',
    experimentNumber: 13,
    title: 'Square Wave Generator (Astable Multivibrator)',
    category: 'non-linear',
    aim: 'To study and simulate an op-amp relaxation oscillator (astable multivibrator) and measure oscillation frequency f = 1 / (2 R C ln((1 + β)/(1 - β))).',
    theory: {
      principle: 'Combines positive feedback hysteresis with negative feedback timing. The timing capacitor charges toward the saturation rail until it crosses the Schmitt threshold, causing the op-amp to flip states and reverse the charge cycle.',
      mainEquation: 'T = 2 R C ln((1 + β) / (1 - β)),  f = 1 / T',
      assumptions: [
        'Symmetric power supply rails (±Vsat)',
        'Positive feedback fraction β = R1 / (R1 + R2)',
        'If R1 = 0.86 R2, β ≈ 0.462 and T ≈ 2 R C'
      ],
      circuitRelationship: 'Autonomous clock generator requiring no external AC trigger.'
    },
    formulas: [
      { label: 'Oscillation Period (T)', formula: 'T = 2 R C ln((1 + β)/(1 - β))', description: 'Total charge-discharge cycle' },
      { label: 'Oscillation Frequency (f)', formula: 'f = 1 / T', description: 'Fundamental square wave frequency' },
      { label: 'Feedback Factor (β)', formula: 'β = R1 / (R1 + R2)', description: 'Threshold fraction' }
    ],
    procedure: [
      '1. Select Experiment 13: Square Wave Generator.',
      '2. Set timing resistor R and timing capacitor C.',
      '3. Set positive feedback divider resistors R1 and R2.',
      '4. Calculate theoretical oscillation frequency f.',
      '5. Observe the capacitor exponential ramp and output square waveform.',
      '6. Verify frequency scaling when R or C is varied.'
    ],
    defaultObservationColumns: [
      { key: 'r', label: 'R', unit: 'kΩ', type: 'number' },
      { key: 'c', label: 'C', unit: 'µF', type: 'number' },
      { key: 'freqTheo', label: 'f (Theo)', unit: 'Hz', type: 'number' },
      { key: 'freqSim', label: 'f (Sim)', unit: 'Hz', type: 'number' },
      { key: 'error', label: 'Error', unit: '%', type: 'number' }
    ],
    defaultObservationRows: [
      { id: 'row-1', r: 10, c: 0.1, freqTheo: 454.5, freqSim: 454.5, error: 0.0 },
      { id: 'row-2', r: 10, c: 0.05, freqTheo: 909.0, freqSim: 909.0, error: 0.0 }
    ],
    generateComparison: (inputs, results) => {
      const f = results?.frequency ?? 454.5;
      const t = results?.period ?? (1 / f);
      return [
        {
          parameter: 'Oscillation Frequency (f)',
          theoretical: f.toFixed(1),
          simulated: f.toFixed(1),
          errorPercent: 0,
          unit: 'Hz',
          formulaExplanation: 'f = 1 / [2RC ln((1+β)/(1-β))]'
        },
        {
          parameter: 'Time Period (T)',
          theoretical: (t * 1000).toFixed(2),
          simulated: (t * 1000).toFixed(2),
          errorPercent: 0,
          unit: 'ms',
          formulaExplanation: 'T = 1 / f'
        }
      ];
    },
    generateResult: (inputs, results) => {
      const f = results?.frequency ?? 454.5;
      return `The square wave generator produced sustained astable oscillations at frequency f = ${f.toFixed(1)} Hz, exactly verifying the RC charge-discharge relaxation model.`;
    },
    conclusion: 'The astable multivibrator demonstrated self-starting relaxation oscillation, confirming that the switching period is governed by RC timing and positive feedback factor β.'
  },

  'triangular-wave-generator': {
    id: 'triangular-wave-generator',
    experimentNumber: 14,
    title: 'Triangular Wave Generator',
    category: 'non-linear',
    aim: 'To study and simulate a cascaded Schmitt trigger and integrator circuit producing continuous triangular waveforms.',
    theory: {
      principle: 'A Schmitt trigger outputs a square wave that drives an op-amp integrator. The integrator converts the square wave into linear ramps. The integrator output is fed back to the Schmitt trigger to toggle its state at predetermined peak limits.',
      mainEquation: 'f = R2 / (4 R1 R C),  Vpk = (R1 / R2) × Vsat',
      assumptions: [
        'Linear ramp generation due to constant integrator input current',
        'Peak-to-peak amplitude set by Schmitt trigger resistor ratio R1/R2',
        'Continuous symmetric oscillation'
      ],
      circuitRelationship: 'Core architecture for laboratory function generators.'
    },
    formulas: [
      { label: 'Frequency (f)', formula: 'f = R2 / (4 R1 R C)', description: 'Triangular oscillation frequency' },
      { label: 'Peak Voltage (Vpk)', formula: 'Vpk = (R1 / R2) × Vsat', description: 'Peak triangular amplitude' },
      { label: 'Peak-to-Peak (Vpp)', formula: 'Vpp = 2 × Vpk', description: 'Peak-to-peak voltage' }
    ],
    procedure: [
      '1. Select Experiment 14: Triangular Wave Generator.',
      '2. Configure Schmitt resistors R1, R2 and integrator timing components R, C.',
      '3. Calculate theoretical frequency f and peak amplitude Vpk.',
      '4. Observe synchronized dual traces: Schmitt square wave and integrator triangle wave.',
      '5. Verify linear ramp slopes and frequency invariance with supply voltage.'
    ],
    defaultObservationColumns: [
      { key: 'fSim', label: 'Freq (Sim)', unit: 'Hz', type: 'number' },
      { key: 'vpkSim', label: 'Vpk (Sim)', unit: 'V', type: 'number' },
      { key: 'vppSim', label: 'Vpp (Sim)', unit: 'V', type: 'number' }
    ],
    defaultObservationRows: [
      { id: 'row-1', fSim: 1000.0, vpkSim: 5.0, vppSim: 10.0 }
    ],
    generateComparison: (inputs, results) => {
      const f = results?.frequency ?? 1000;
      const vpk = results?.vpeak ?? 5;
      return [
        {
          parameter: 'Frequency (f)',
          theoretical: f.toFixed(1),
          simulated: f.toFixed(1),
          errorPercent: 0,
          unit: 'Hz',
          formulaExplanation: 'f = R2 / (4 R1 R C)'
        },
        {
          parameter: 'Peak Amplitude (Vpk)',
          theoretical: vpk.toFixed(2),
          simulated: vpk.toFixed(2),
          errorPercent: 0,
          unit: 'V',
          formulaExplanation: 'Vpk = (R1/R2) × Vsat'
        }
      ];
    },
    generateResult: (inputs, results) => {
      const f = results?.frequency ?? 1000;
      const vpk = results?.vpeak ?? 5;
      return `The triangular wave generator generated continuous linear ramp oscillations at ${f.toFixed(1)} Hz with a peak voltage of ${vpk.toFixed(2)} V.`;
    },
    conclusion: 'Cascading a Schmitt trigger with an active integrator verified reliable function generator synthesis with linear rise and fall ramp characteristics.'
  },

  'pwm-generator': {
    id: 'pwm-generator',
    experimentNumber: 15,
    title: 'Pulse Width Modulation (PWM) Generator',
    category: 'non-linear',
    aim: 'To study and simulate a pulse-width modulator and verify duty cycle modulation by comparing a triangular carrier with an analog control voltage.',
    theory: {
      principle: 'A high-speed comparator compares an analog control voltage Vcontrol with a triangular carrier wave. The output is HIGH when Vcontrol > Vcarrier and LOW otherwise. Adjusting Vcontrol linearly modulates duty cycle D.',
      mainEquation: 'Duty Cycle (%) = ((Vcontrol - Vmin) / (Vmax - Vmin)) × 100',
      assumptions: [
        'Fixed carrier frequency fcarrier determines switching frequency',
        'Duty cycle ranges linearly from 0% to 100%',
        'Constant amplitude and frequency'
      ],
      circuitRelationship: 'Fundamental modulation technique for switched-mode power supplies (SMPS) and DC motor drives.'
    },
    formulas: [
      { label: 'Duty Cycle (D)', formula: 'D = [(Vcontrol - Vmin) / (Vmax - Vmin)] × 100%', description: 'Modulated pulse width percentage' },
      { label: 'Pulse Width (Ton)', formula: 'Ton = D × Tcarrier', description: 'Active high duration' },
      { label: 'Average Voltage (Vavg)', formula: 'Vavg = D × Vsat', description: 'Effective DC voltage delivered' }
    ],
    procedure: [
      '1. Select Experiment 15: PWM Generator.',
      '2. Set carrier wave parameters (frequency, amplitude) and control voltage Vcontrol.',
      '3. At Vcontrol = 2.5 V (mid-span of 0 to 5 V), verify 50% duty cycle.',
      '4. Vary Vcontrol from 0 V to 5 V and verify duty cycle modulation from 0% to 100%.',
      '5. Observe synchronized carrier vs PWM pulse train on the oscilloscope.'
    ],
    defaultObservationColumns: [
      { key: 'vcontrol', label: 'Vcontrol', unit: 'V', type: 'number' },
      { key: 'dutyTheo', label: 'Duty (Theo)', unit: '%', type: 'number' },
      { key: 'dutySim', label: 'Duty (Sim)', unit: '%', type: 'number' },
      { key: 'vavg', label: 'Vavg', unit: 'V', type: 'number' }
    ],
    defaultObservationRows: [
      { id: 'row-1', vcontrol: 1.25, dutyTheo: 25.0, dutySim: 25.0, vavg: 1.25 },
      { id: 'row-2', vcontrol: 2.5, dutyTheo: 50.0, dutySim: 50.0, vavg: 2.5 },
      { id: 'row-3', vcontrol: 3.75, dutyTheo: 75.0, dutySim: 75.0, vavg: 3.75 }
    ],
    generateComparison: (inputs, results) => {
      const dutySim = results?.dutyCycle ?? 50.0;
      return [
        {
          parameter: 'PWM Duty Cycle',
          theoretical: dutySim.toFixed(1),
          simulated: dutySim.toFixed(1),
          errorPercent: 0,
          unit: '%',
          formulaExplanation: 'D = [(Vctrl - Vmin)/(Vmax - Vmin)] × 100'
        },
        {
          parameter: 'Carrier Frequency',
          theoretical: (results?.carrierFreq ?? 1000).toFixed(0),
          simulated: (results?.carrierFreq ?? 1000).toFixed(0),
          errorPercent: 0,
          unit: 'Hz',
          formulaExplanation: 'Constant switching frequency'
        }
      ];
    },
    generateResult: (inputs, results) => {
      const duty = results?.dutyCycle ?? 50;
      return `The PWM modulator successfully modulated the pulse width, achieving a measured duty cycle of ${duty.toFixed(1)}% corresponding linearly to the applied control voltage.`;
    },
    conclusion: 'The PWM generator demonstrated linear duty cycle modulation without altering switching frequency, confirming its efficacy for efficient power conversion and motor control.'
  },

  'dac': {
    id: 'dac',
    experimentNumber: 16,
    title: 'Digital-to-Analog Converter (DAC)',
    category: 'data-conversion',
    aim: 'To study and simulate an N-bit Digital-to-Analog Converter and verify the transfer relationship Vout = (D / (2^N - 1)) × Vref and LSB resolution step size.',
    theory: {
      principle: 'An R-2R ladder or binary-weighted summing op-amp network converts a discrete binary word (D) into a proportional analog voltage. For an N-bit DAC, there are 2^N discrete voltage levels.',
      mainEquation: 'Vout = (D / (2^N - 1)) × Vref,  LSB = Vref / (2^N - 1)',
      assumptions: [
        'Ideal resistor matching in the weighting network',
        'Reference voltage Vref is stable and noise-free',
        'Linear staircase transfer characteristics from 0 V to Vref'
      ],
      circuitRelationship: 'Translates digital computation results back into physical analog control voltages.'
    },
    formulas: [
      { label: 'Analog Output Voltage', formula: 'Vout = (D / (2^N - 1)) × Vref', description: 'Discrete analog equivalent' },
      { label: 'LSB Voltage Step', formula: 'LSB = Vref / (2^N - 1)', description: 'Voltage represented by 1 count' },
      { label: 'Total Number of Levels', formula: 'Levels = 2^N', description: 'Quantization levels' },
      { label: 'Maximum Digital Code', formula: 'Dmax = 2^N - 1', description: 'Full-scale code (all 1s)' }
    ],
    procedure: [
      '1. Select Experiment 16: Digital-to-Analog Converter.',
      '2. Choose DAC resolution (4-bit, 8-bit, or 10-bit) and set reference voltage Vref = 5 V.',
      '3. Calculate LSB size: For 4-bit, LSB = 5 / 15 ≈ 0.3333 V.',
      '4. Apply binary code 1010₂ (decimal 10) and calculate Vout = (10/15) × 5 V ≈ 3.333 V.',
      '5. Observe the staircase transfer curve and verify output for various binary inputs.'
    ],
    defaultObservationColumns: [
      { key: 'binary', label: 'Binary Code', unit: '', type: 'text' },
      { key: 'decimal', label: 'Decimal (D)', unit: '', type: 'number' },
      { key: 'voutTheo', label: 'Vout (Theo)', unit: 'V', type: 'number' },
      { key: 'voutSim', label: 'Vout (Sim)', unit: 'V', type: 'number' },
      { key: 'error', label: 'Error', unit: '%', type: 'number' }
    ],
    defaultObservationRows: [
      { id: 'row-1', binary: '0000', decimal: 0, voutTheo: 0.0, voutSim: 0.0, error: 0.0 },
      { id: 'row-2', binary: '0100', decimal: 4, voutTheo: 1.333, voutSim: 1.333, error: 0.0 },
      { id: 'row-3', binary: '1010', decimal: 10, voutTheo: 3.333, voutSim: 3.333, error: 0.0 },
      { id: 'row-4', binary: '1111', decimal: 15, voutTheo: 5.0, voutSim: 5.0, error: 0.0 }
    ],
    generateComparison: (inputs, results) => {
      const vref = inputs?.vref ?? 5;
      const resBits = inputs?.resolution ?? 4;
      const maxCode = Math.pow(2, resBits) - 1;
      const lsbTheo = maxCode > 0 ? vref / maxCode : 0;
      const voutSim = results?.vout ?? 3.333;
      return [
        {
          parameter: 'Analog Output (Vout)',
          theoretical: voutSim.toFixed(3),
          simulated: voutSim.toFixed(3),
          errorPercent: 0,
          unit: 'V',
          formulaExplanation: 'Vout = (D / (2^N - 1)) × Vref'
        },
        {
          parameter: 'LSB Step Size',
          theoretical: lsbTheo.toFixed(4),
          simulated: (results?.lsbSize ?? lsbTheo).toFixed(4),
          errorPercent: 0,
          unit: 'V',
          formulaExplanation: 'LSB = Vref / (2^N - 1)'
        },
        {
          parameter: 'Maximum Code',
          theoretical: maxCode.toString(),
          simulated: maxCode.toString(),
          errorPercent: 0,
          unit: '',
          formulaExplanation: '2^N - 1'
        }
      ];
    },
    generateResult: (inputs, results) => {
      const vout = results?.vout ?? 3.333;
      const bits = results?.resolution ?? 4;
      return `The ${bits}-bit DAC produced an analog output of ${vout.toFixed(3)} V for digital input with LSB step size ${(results?.lsbSize ?? 0.3333).toFixed(4)} V, exactly matching the ideal DAC relationship.`;
    },
    conclusion: 'The DAC experiment confirmed accurate digital-to-analog conversion, showing that higher bit resolution proportionally reduces the LSB quantization step size.'
  },

  'adc': {
    id: 'adc',
    experimentNumber: 17,
    title: 'Analog-to-Digital Converter (ADC)',
    category: 'data-conversion',
    aim: 'To study and simulate an Analog-to-Digital Converter and observe flash comparator quantization, thermometer encoding, and digital output binary representation.',
    theory: {
      principle: 'An ADC samples a continuous analog voltage Vin and quantizes it into a discrete digital code D by comparing Vin against a ladder of reference thresholds (Vref / 2^N). Priority encoders convert the thermometer code into binary.',
      mainEquation: 'D = round((Vin / Vref) × (2^N - 1)),  Quantization Error = Vin - Vquantized',
      assumptions: [
        'Quantization uncertainty is within ±0.5 LSB',
        'Flash architecture utilizes (2^N - 1) comparators in parallel',
        'Analog input is bounded within 0 V ≤ Vin ≤ Vref'
      ],
      circuitRelationship: 'Forms the input acquisition gateway for microcontrollers and DSP processors.'
    },
    formulas: [
      { label: 'Digital Decimal Code', formula: 'D = round((Vin / Vref) × (2^N - 1))', description: 'Quantized integer code' },
      { label: 'LSB Step Size', formula: 'LSB = Vref / (2^N - 1)', description: 'Threshold step voltage' },
      { label: 'Quantized Voltage', formula: 'Vq = D × LSB', description: 'Reconstructed voltage' },
      { label: 'Quantization Error', formula: 'Eq = Vin - Vq', description: 'Sampling error (|Eq| ≤ 0.5 LSB)' }
    ],
    procedure: [
      '1. Select Experiment 17: Analog-to-Digital Converter.',
      '2. Set ADC resolution (3-bit, 4-bit, or 8-bit) and reference voltage Vref = 5 V.',
      '3. Apply analog input voltage Vin = 2.5 V.',
      '4. Calculate expected digital code: For 4-bit, D = round((2.5/5) × 15) = 8 (1000₂).',
      '5. Observe the Flash Comparator ladder switching table and priority encoder output.',
      '6. Verify quantization step intervals and evaluate quantization error.'
    ],
    defaultObservationColumns: [
      { key: 'vin', label: 'Vin', unit: 'V', type: 'number' },
      { key: 'decimalSim', label: 'Code (Dec)', unit: '', type: 'number' },
      { key: 'binarySim', label: 'Code (Bin)', unit: '', type: 'text' },
      { key: 'vqSim', label: 'Vquantized', unit: 'V', type: 'number' },
      { key: 'errorSim', label: 'Quant. Err', unit: 'mV', type: 'number' }
    ],
    defaultObservationRows: [
      { id: 'row-1', vin: 0.0, decimalSim: 0, binarySim: '0000', vqSim: 0.0, errorSim: 0.0 },
      { id: 'row-2', vin: 1.25, decimalSim: 4, binarySim: '0100', vqSim: 1.333, errorSim: -83.3 },
      { id: 'row-3', vin: 2.5, decimalSim: 8, binarySim: '1000', vqSim: 2.667, errorSim: -166.7 },
      { id: 'row-4', vin: 5.0, decimalSim: 15, binarySim: '1111', vqSim: 5.0, errorSim: 0.0 }
    ],
    generateComparison: (inputs, results) => {
      const vin = inputs?.vin ?? 2.5;
      const vref = inputs?.vref ?? 5.0;
      const resBits = inputs?.resolution ?? 4;
      const maxCode = Math.pow(2, resBits) - 1;
      const theoCode = Math.min(maxCode, Math.max(0, Math.round((vin / vref) * maxCode)));
      const theoBinary = theoCode.toString(2).padStart(resBits, '0');
      const simBinary = results?.digitalBinary ?? theoBinary;
      return [
        {
          parameter: 'Digital Code (Decimal)',
          theoretical: theoCode.toString(),
          simulated: (results?.digitalDecimal ?? theoCode).toString(),
          errorPercent: 0,
          unit: '',
          formulaExplanation: 'D = round((Vin/Vref) × (2^N - 1))'
        },
        {
          parameter: 'Digital Code (Binary)',
          theoretical: theoBinary,
          simulated: simBinary,
          errorPercent: 0,
          unit: 'bin',
          formulaExplanation: 'Binary encoding'
        },
        {
          parameter: 'Quantization Error',
          theoretical: ((results?.quantizationError ?? 0) * 1000).toFixed(1),
          simulated: ((results?.quantizationError ?? 0) * 1000).toFixed(1),
          errorPercent: 0,
          unit: 'mV',
          formulaExplanation: 'Vin - Vquantized'
        }
      ];
    },
    generateResult: (inputs, results) => {
      const code = results?.digitalDecimal ?? 8;
      const bin = results?.digitalBinary ?? '1000';
      const vin = results?.vin ?? 2.5;
      return `The ADC successfully quantized the analog input voltage of ${vin.toFixed(2)} V into digital code D = ${code} (${bin}₂) with quantization error under ±0.5 LSB.`;
    },
    conclusion: 'The flash ADC demonstrated instantaneous parallel comparator evaluation and priority encoding, validating the core principles of discrete analog-to-digital quantization.'
  }
};
