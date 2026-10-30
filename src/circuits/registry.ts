import { CircuitDefinition } from '../types/circuit';

export const CIRCUIT_REGISTRY: CircuitDefinition[] = [
  // LINEAR APPLICATIONS
  {
    id: 'inverting-amplifier',
    name: 'Inverting Amplifier',
    category: 'linear',
    categoryLabel: 'Linear Applications',
    shortDescription: 'Inverting voltage amplifier with gain set by Rf/Rin ratio and 180° phase inversion.',
    status: 'active',
    tags: ['Basic', 'Negative Feedback', 'Amplification']
  },
  {
    id: 'non-inverting-amplifier',
    name: 'Non-Inverting Amplifier',
    category: 'linear',
    categoryLabel: 'Linear Applications',
    shortDescription: 'Non-inverting amplifier with gain Av = 1 + (Rf/R1) and 0° phase shift.',
    status: 'active',
    tags: ['High Input Impedance', 'Zero Phase Shift']
  },
  {
    id: 'voltage-follower',
    name: 'Voltage Follower (Buffer)',
    category: 'linear',
    categoryLabel: 'Linear Applications',
    shortDescription: 'Unity gain buffer (Av = 1) providing impedance isolation.',
    status: 'active',
    tags: ['Unity Gain', 'Impedance Matching']
  },
  {
    id: 'summing-amplifier',
    name: 'Summing Amplifier',
    category: 'linear',
    categoryLabel: 'Linear Applications',
    shortDescription: 'Inverting summer producing weighted algebraic addition of input voltages.',
    status: 'active',
    tags: ['Mixer', 'Multi-input']
  },
  {
    id: 'differential-amplifier',
    name: 'Differential Amplifier',
    category: 'linear',
    categoryLabel: 'Linear Applications',
    shortDescription: 'Amplifies voltage difference between non-inverting and inverting inputs while rejecting CMRR noise.',
    status: 'active',
    tags: ['Difference', 'Instrumentation']
  },
  {
    id: 'integrator',
    name: 'Practical Integrator',
    category: 'linear',
    categoryLabel: 'Linear Applications',
    shortDescription: 'Op-amp integrator with feedback capacitor and shunt stabilization resistor to limit DC gain.',
    status: 'active',
    tags: ['Calculus', 'Filter']
  },
  {
    id: 'differentiator',
    name: 'Practical Differentiator',
    category: 'linear',
    categoryLabel: 'Linear Applications',
    shortDescription: 'Rate-of-change circuit with series resistor and capacitor to suppress high-frequency noise.',
    status: 'active',
    tags: ['Calculus', 'Derivative']
  },
  {
    id: 'low-pass-filter',
    name: 'First Order Low Pass Filter',
    category: 'linear',
    categoryLabel: 'Linear Applications',
    shortDescription: 'Active first-order Butterworth active filter passing frequencies below cutoff fc.',
    status: 'active',
    tags: ['Active Filter', 'Frequency Domain']
  },
  {
    id: 'high-pass-filter',
    name: 'First Order High Pass Filter',
    category: 'linear',
    categoryLabel: 'Linear Applications',
    shortDescription: 'Active high-pass filter attenuating low frequencies below fc.',
    status: 'active',
    tags: ['Active Filter', 'AC Coupling']
  },
  {
    id: 'precision-rectifier',
    name: 'Precision Half-Wave Rectifier',
    category: 'linear',
    categoryLabel: 'Linear Applications',
    shortDescription: 'Superdiode circuit eliminating the 0.7V silicon diode drop for millivolt rectification.',
    status: 'active',
    tags: ['Nonlinear Element', 'Detection']
  },

  // NON-LINEAR APPLICATIONS
  {
    id: 'comparator',
    name: 'Op-Amp Comparator',
    category: 'non-linear',
    categoryLabel: 'Nonlinear Applications',
    shortDescription: 'Open-loop high-gain comparison between input signal and reference voltage.',
    status: 'active',
    tags: ['Open Loop', 'Threshold']
  },
  {
    id: 'schmitt-trigger',
    name: 'Schmitt Trigger',
    category: 'non-linear',
    categoryLabel: 'Nonlinear Applications',
    shortDescription: 'Bistable multivibrator utilizing positive feedback with upper and lower trigger thresholds (UTP/LTP).',
    status: 'active',
    tags: ['Hysteresis', 'Positive Feedback']
  },
  {
    id: 'square-wave-generator',
    name: 'Square Wave Generator',
    category: 'non-linear',
    categoryLabel: 'Nonlinear Applications',
    shortDescription: 'Astable multivibrator oscillating between positive and negative saturation rails.',
    status: 'active',
    tags: ['Oscillator', 'Relaxation']
  },
  {
    id: 'triangular-wave-generator',
    name: 'Triangular Wave Generator',
    category: 'non-linear',
    categoryLabel: 'Nonlinear Applications',
    shortDescription: 'Cascade of Schmitt trigger and integrator generating continuous ramp signals.',
    status: 'active',
    tags: ['Function Generator', 'Ramp']
  },
  {
    id: 'pwm-generator',
    name: 'PWM Generator',
    category: 'non-linear',
    categoryLabel: 'Nonlinear Applications',
    shortDescription: 'Pulse-width modulator modulating duty cycle by comparing a triangular carrier with control DC.',
    status: 'active',
    tags: ['Modulation', 'Power Control']
  },

  // DATA CONVERSION
  {
    id: 'dac',
    name: 'Digital to Analog Converter (DAC)',
    category: 'data-conversion',
    categoryLabel: 'Data Conversion',
    shortDescription: 'R-2R ladder and binary-weighted op-amp summing DAC conversion.',
    status: 'active',
    tags: ['Mixed Signal', 'R-2R Ladder']
  },
  {
    id: 'adc',
    name: 'Analog to Digital Converter (ADC)',
    category: 'data-conversion',
    categoryLabel: 'Data Conversion',
    shortDescription: 'Flash comparator and successive approximation op-amp ADC concepts.',
    status: 'active',
    tags: ['Mixed Signal', 'Quantization']
  }
];

export const CATEGORIES = [
  { id: 'linear', label: 'LINEAR APPLICATIONS' },
  { id: 'non-linear', label: 'NON-LINEAR APPLICATIONS' },
  { id: 'data-conversion', label: 'DATA CONVERSION' },
] as const;
