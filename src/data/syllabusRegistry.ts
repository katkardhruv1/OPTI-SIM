import { SyllabusTopic } from '../types/syllabus';

export const SYLLABUS_PRACTICALS_REGISTRY: SyllabusTopic[] = [
  // =========================================================================
  // TOPIC 1: NMIET ICA Exp 06 - Half Wave & Full Wave Precision Rectifiers
  // =========================================================================
  {
    id: 'nmiet-ica-exp06-precision-rectifier',
    title: 'To design, build and test half wave and full wave Precision rectifier circuits for given specifications.',
    secondaryRefNumber: 'Experiment No: 06',
    source: {
      college: 'Nutan Maharashtra Institute of Engg. & Technology (NMIET), Talegaon Dabhade, Pune',
      subject: 'Integrated Circuits and Applications',
      manualTitle: 'Laboratory Manual - Integrated Circuits and Applications',
      originalPracticalNumber: 'Experiment No: 06',
      pageReferences: 'Pages 1–3',
      classInfo: 'S.E (Second Year Engineering)'
    },
    category: 'linear',
    categoryLabel: 'Linear Applications & Rectification',
    aim: 'To design, build and test half wave and full wave precision rectifier circuits for given specifications.',
    apparatus: [
      'Op-Amp IC 741 (2 units for full-wave configuration)',
      'Signal Diodes (1N4148 / silicon diodes, 2 units)',
      'Precision Resistors (1 kΩ, 5 kΩ, 10 kΩ, 0.1% / 1% tolerance)',
      'Capacitors',
      'Dual DC Power Supply (±15 V)',
      'Regulated DC Power Supply',
      'Cathode Ray Oscilloscope (CRO) / DSO',
      'Function Generator (Sine wave, 1 kHz, Vpp selectable)',
      'Digital Multimeter (DMM)',
      'Connecting probes and breadboard'
    ],
    theory: {
      overview:
        'The half-wave rectifier keeps only those parts of the original input signal that were positive (or negative). Is there a way to keep both halves of the input signal and yet render them both with the same output polarity? This is the behaviour of a full-wave rectifier. The circuit performs full-wave rectification on the input signal. If you wish the final output to be positive instead of negative, simply reverse the two diodes in the half-wave rectifier section.\n\nThe full-wave rectifier depends on the fact that both the half-wave rectifier and the summing amplifier are precision circuits. It operates by producing an inverted half-wave-rectified signal and then adding that signal at double amplitude to the original signal in the summing amplifier. The result is a reversal of the selected polarity of the input signal.\n\nThe resistor values shown are reasonable; the resistors themselves must be of high precision in order to keep the rectification process accurate. If for some reason you must build such a circuit with a different set of resistance values, you must maintain the indicated 2:1 resistance ratio, and you must still use precision resistors in order to obtain accurate results.',
      keyPoints: [
        'Overcomes the non-zero forward voltage drop (Vγ ≈ 0.7 V) of silicon diodes by placing the diode inside the high-gain op-amp negative feedback loop.',
        'Stage 1 acts as an inverting half-wave rectifier producing V1 = -Vin for negative inputs (with D1 conducting) or 0 V for positive inputs.',
        'Stage 2 is an inverting summer that sums the original input signal with the half-wave output scaled by a 2:1 gain ratio.',
        'Resulting output Vo produces clean full-wave rectification down to millivolt signal levels without distortion.',
        'Reversing diodes D1 and D2 reverses output polarity (positive full-wave vs negative full-wave).'
      ],
      equations: [
        {
          label: 'Inverting Half-Wave Output (Stage 1)',
          formula: 'V1 = -(Rf1 / R1) · Vin  (when Vin < 0)  |  V1 = 0 V  (when Vin > 0)'
        },
        {
          label: 'Summing Output (Stage 2 Full-Wave)',
          formula: 'Vo = - [ (Rf2 / R2) · V1 + (Rf2 / R_in2) · Vin ]'
        },
        {
          label: '2:1 Weighting Condition for Full-Wave Rectification',
          formula: '(Rf2 / R2) = 2 · (Rf2 / R_in2)   ==>   R_in2 = 2 · R2'
        }
      ],
      supplementaryNotes: [
        'Supplementary note: In practical bench setups, diode parasitic capacitance and op-amp slew rate limit high-frequency operation beyond 10 kHz when using standard LM741.'
      ]
    },
    designCalculations: {
      specifications: [
        'Input signal: 1 kHz sinusoidal, 0.5 V to 5 V amplitude',
        'Gain requirement (i): Given A = 5 / 0.5 = 10 = Rf / Ri',
        'Assume Ri = 1 kΩ  ==>  Rf = 10 kΩ; Choose R = 10 kΩ, Rf\' = Rf = 10 kΩ',
        'Gain requirement (ii): Given A1 = 5 / 0.5 = 10 = Rf / Ri, and A2 = 3 / 0.5 = 6 = 3 · (Rf / Ri) · [Rf\' / (2R + Rf\')]'
      ],
      formulas: [
        {
          name: 'Half-Wave Gain',
          formula: 'A = Vo / Vin = Rf / Ri',
          description: 'Calculates feedback resistance ratio for specified voltage scaling.'
        },
        {
          name: 'Full-Wave Ratio Matching',
          formula: 'Rf = 10 kΩ and Rf\' = 5 kΩ (Ratio Rf : Rf\' = 2:1)',
          description: 'Maintains the exact 2:1 weighting in the summing stage.'
        }
      ],
      reviewNotes: [
        'Manual Review Flag: Page 2 of NMIET manual displays schematic with 1 kΩ resistors (Rf1=1k, R2=1k, Rf2=1k), while the handwritten design calculations note Rf=10k, Ri=1k and Rf\'=5k. Both nominal 1k 1:1/2:1 networks and 10k/5k networks are standard implementations.'
      ]
    },
    schematic: {
      topologyName: 'Two-Stage Op-Amp Precision Half-Wave and Full-Wave Rectifier',
      description:
        'First stage: uA741 inverting half-wave precision rectifier with feedback diodes D1, D2 and resistors R1, Rf1. Second stage: uA741 inverting summing amplifier summing node V1 through R2 and original input V through Rf2.',
      components: [
        { designation: 'U1', value: 'uA741 / LM741', description: 'Stage 1 Op-Amp (Inverting Precision Half-Wave Rectifier)' },
        { designation: 'U2', value: 'uA741 / LM741', description: 'Stage 2 Op-Amp (Inverting Precision Summing Amplifier)' },
        { designation: 'D1, D2', value: '1N4148 / 1N914', description: 'Fast switching feedback diodes' },
        { designation: 'R1', value: '1 kΩ (or 10 kΩ)', description: 'Input resistor to Stage 1' },
        { designation: 'Rf1', value: '1 kΩ (or 10 kΩ)', description: 'Feedback resistor around Stage 1' },
        { designation: 'R2', value: '1 kΩ (or 5 kΩ)', description: 'Summing resistor from Stage 1 to Stage 2' },
        { designation: 'Rf2', value: '1 kΩ (or 10 kΩ)', description: 'Feedback resistor around Stage 2' }
      ],
      diagramNotes: [
        'Without connecting Rf2 summing path from input, only the half-wave output is obtained at node V1.',
        'Connecting the Rf2 path creates the full-wave summing rectification at the main output Vo.'
      ]
    },
    procedure: [
      '1. Connect the circuit as per the circuit diagram.',
      '2. Give a sinusoidal input of Vpp, 1 KHz from a signal generator.',
      '3. Switch on the power supply and note down the output from CRO.',
      '4. Without connecting Rf2, the waveform of the half wave rectifier is produced.',
      '5. At some value of Rf2 the waveform of a full wave rectifier is obtained.',
      '6. Repeat the above procedure by reversing the diodes to obtain inverted polarity rectification.'
    ],
    mappedCircuitId: 'precision-rectifier',
    simulationLimitation: {
      isFullySupported: true,
      mismatchDescription:
        'The existing OPTI-SIM "precision-rectifier" module models the single-op-amp precision half-wave rectifier (Superdiode). In this college practical, a two-op-amp circuit is employed to demonstrate both half-wave (Stage 1 tap) and full-wave summing rectification (Stage 2 output). Half-wave behavior matches directly; full-wave summing can be verified through the summing amplifier.',
      mappedModuleName: 'Precision Half-Wave Rectifier'
    },
    graphRequirements: [
      {
        description: 'Input sinusoidal waveform vs Half-wave rectified output on CRO dual-trace display',
        axes: { x: 'Time (ms)', y: 'Amplitude (V)' },
        expectedBehavior: 'Output shows only one half-cycle with zero distortion around 0 V crossing.'
      },
      {
        description: 'Input sinusoidal waveform vs Full-wave rectified output on CRO dual-trace display',
        axes: { x: 'Time (ms)', y: 'Amplitude (V)' },
        expectedBehavior: 'Output shows both half-cycles rectified to the same unipolar direction with identical peak amplitudes.'
      }
    ],
    observationTables: [
      {
        id: 'obs-half-wave',
        title: 'Observation Table 1: Half Wave Rectifier',
        subtitle: 'Readings recorded without Rf2 connected',
        columns: [
          { key: 'srNo', label: 'Sr. No', type: 'text' },
          { key: 'vin', label: 'Input Voltage', unit: 'Vpp', type: 'number', placeholder: 'e.g. 1.0' },
          { key: 'condition', label: 'Configuration', type: 'text' },
          { key: 'croOutput', label: 'CRO Output', unit: 'V', type: 'text', placeholder: 'e.g. 0.5 Vp Half Wave' }
        ],
        defaultStudentRows: [
          { id: 'hw-1', srNo: '1', vin: 1.0, condition: 'Without ref RF2', croOutput: '' },
          { id: 'hw-2', srNo: '2', vin: 2.0, condition: 'Without ref RF2', croOutput: '' },
          { id: 'hw-3', srNo: '3', vin: 4.0, condition: 'Without ref RF2', croOutput: '' }
        ]
      },
      {
        id: 'obs-full-wave',
        title: 'Observation Table 2: Full Wave Rectifier',
        subtitle: 'Readings recorded with Rf2 connected',
        columns: [
          { key: 'srNo', label: 'Sr. No', type: 'text' },
          { key: 'vin', label: 'Input Voltage', unit: 'Vpp', type: 'number', placeholder: 'e.g. 1.0' },
          { key: 'condition', label: 'Configuration', type: 'text' },
          { key: 'croOutput', label: 'CRO Output', unit: 'V', type: 'text', placeholder: 'e.g. 1.0 Vp Full Wave' }
        ],
        defaultStudentRows: [
          { id: 'fw-1', srNo: '1', vin: 1.0, condition: 'With ref RF2', croOutput: '' },
          { id: 'fw-2', srNo: '2', vin: 2.0, condition: 'With ref RF2', croOutput: '' },
          { id: 'fw-3', srNo: '3', vin: 4.0, condition: 'With ref RF2', croOutput: '' }
        ]
      }
    ],
    conclusion:
      'Thus we have studied how to design, build and test half wave and full wave precision rectifier circuits for given specifications.',
    referenceBooks: [
      'Sergio Franco, "Design with Operational Amplifiers and Analog Integrated Circuits", 3rd Edition, Tata McGraw-Hill Ltd.',
      'Ramakant A. Gaikwad, "Op-Amps and Linear Integrated Circuits", 4th Edition, Pearson Education.'
    ],
    reviewStatus: {
      isVerified: true,
      flaggedNotes: [
        'Scanned schematic on Page 2 displays 1k resistor values across all branches; design text mentions Ri=1k, Rf=10k, Rf\'=5k. Both nominal sets follow the required 2:1 summing ratio.'
      ]
    }
  },

  // =========================================================================
  // TOPIC 2: PES Modern College Exp 03 Part A - Practical Integrator
  // =========================================================================
  {
    id: 'pes-mcoe-exp03-integrator',
    title: 'To Study practical integrator and differentiator circuits with their frequency response — Practical Integrator',
    secondaryRefNumber: 'Experiment No: 3 (Part I)',
    source: {
      college: "Progressive Education Society's Modern College of Engineering, Shivajinagar, Pune 5",
      subject: 'Electronic Circuits / Integrated Circuits Lab',
      manualTitle: 'Electronic Circuits Laboratory Manual',
      originalPracticalNumber: 'Experiment No: 3',
      pageReferences: 'Pages 1–7 (Integrator Section)',
      classInfo: 'S.E E&TC'
    },
    category: 'linear',
    categoryLabel: 'Calculus Circuits & Active Filters',
    aim: 'To Study practical integrator and differentiator circuits with their frequency response.',
    apparatus: [
      'Cathode Ray Oscilloscope (CRO): 0–20 MHz',
      'Signal Generator: 0–1 MHz',
      'Dual DC Power Supply: 0–30 V, 0–1 A',
      'Experimental Circuit Kit / Breadboard',
      'Op-Amp IC 741',
      'Resistors: R1 = 33 kΩ, Rf = 330 kΩ, Rcomp = 30 kΩ',
      'Capacitors: Cf = 0.01 µF',
      'BNC Cables and patch cords'
    ],
    theory: {
      overview:
        'A circuit in which the output voltage is proportional to the integral of the input voltage waveform over time is an integrator. In a basic integrator, the feedback loop contains only a capacitor Cf. At DC (f = 0), the capacitive reactance Xc is infinite, making the op-amp run open-loop with extremely high gain. Any small input offset voltage or bias current charges Cf and drives the op-amp into positive or negative saturation.\n\nTo overcome this DC instability, a practical integrator places a shunt stabilization resistor Rf across Cf. The resistor limits the DC gain to -Rf / R1 and stabilizes the circuit. The circuit behaves as an active first-order low-pass filter: for frequencies below fa = 1 / (2π Rf Cf), the gain is approximately constant (Rf / R1); between fa and fb = 1 / (2π R1 Cf), the circuit functions as a true mathematical integrator rolling off at -20 dB/decade.',
      keyPoints: [
        'Feedback shunt resistor Rf prevents DC saturation by providing a closed DC feedback path.',
        'Cutoff frequency fa = 1 / (2π Rf Cf) marks the transition from low-pass amplifier to integrator.',
        '0 dB unity-gain frequency fb = 1 / (2π R1 Cf) marks where the integration gain crosses unity.',
        'Integration occurs accurately in the frequency band fa << f < fb.',
        'Rcomp = R1 || Rf provides input bias current compensation.'
      ],
      equations: [
        {
          label: 'Practical Integrator Output Equation',
          formula: 'Vo(t) = - (1 / (R1 · Cf)) ∫ Vin(t) dt  (for fa < f < fb)'
        },
        {
          label: 'Lower Cutoff Frequency (3 dB Break Frequency)',
          formula: 'fa = 1 / (2 · π · Rf · Cf)'
        },
        {
          label: '0 dB Unity-Gain Frequency',
          formula: 'fb = 1 / (2 · π · R1 · Cf) = 10 · fa'
        },
        {
          label: 'Offset Compensation Resistor',
          formula: 'Rcomp = R1 || Rf = (R1 · Rf) / (R1 + Rf)'
        }
      ]
    },
    designCalculations: {
      specifications: [
        'Given: Cf = 0.01 µF, fa = 50 Hz, fb = 10 · fa = 500 Hz',
        'Input signal: V i/p = 1 Vp-p at 500 Hz (sinusoidal)',
        'Rf = 1 / (2 · π · Cf · fa) = 1 / (2 · π · 0.01µF · 50 Hz) = 318.32 kΩ ≈ 330 kΩ (standard 5% value)',
        'R1 = 1 / (2 · π · Cf · fb) = 1 / (2 · π · 0.01µF · 500 Hz) = 31.83 kΩ ≈ 33 kΩ (standard 5% value)',
        'Rcomp = R1 || Rf = (33k · 330k) / (33k + 330k) = 30 kΩ'
      ],
      formulas: [
        {
          name: 'Feedback Resistor Calculation',
          formula: 'Rf = 1 / (2π · Cf · fa)',
          description: 'Calculates feedback resistance for 50 Hz lower cutoff.'
        },
        {
          name: 'Input Resistor Calculation',
          formula: 'R1 = 1 / (2π · Cf · fb)',
          description: 'Calculates input resistance for 500 Hz unity crossover.'
        }
      ]
    },
    schematic: {
      topologyName: 'Practical Inverting Op-Amp Integrator with Bias Compensation',
      description:
        'Inverting op-amp LM741 with input resistor R1 = 33 kΩ, parallel feedback combination of Rf = 330 kΩ and Cf = 0.01 µF, and non-inverting terminal grounded through Rcomp = 30 kΩ.',
      components: [
        { designation: 'U1', value: 'LM741 / uA741', description: 'Operational Amplifier (Dual Supply ±15 V)' },
        { designation: 'R1', value: '33 kΩ', description: 'Input series resistor' },
        { designation: 'Rf', value: '330 kΩ', description: 'DC feedback stabilization resistor' },
        { designation: 'Cf', value: '0.01 µF', description: 'Integrating feedback capacitor' },
        { designation: 'Rcomp', value: '30 kΩ', description: 'Input bias current compensation resistor (R1 || Rf)' }
      ]
    },
    procedure: [
      '1. With the help of formulas calculate value of RF and R1.',
      '2. Make connections as shown in figure.',
      '3. At F = 500 Hz apply 1 Vp-p sine wave and square wave and draw input output simultaneously.',
      '4. For frequency response vary input frequency from 10 Hz to 500 Hz with 1 Vp-p amplitude and measure Vo/p and find out gain.',
      '5. Plot frequency response of integrator on semilog graph paper.'
    ],
    mappedCircuitId: 'integrator',
    simulationLimitation: {
      isFullySupported: true,
      mismatchDescription:
        'Directly supported. The existing OPTI-SIM integrator module models the exact practical integrator topology with R1, Rf, and Cf.',
      mappedModuleName: 'Practical Integrator'
    },
    graphRequirements: [
      {
        description: 'Bode Gain (dB) vs Frequency (Hz) Frequency Response Curve on Semilog Graph',
        axes: { x: 'Frequency (Hz) [Log Scale: 10 Hz to 1 kHz]', y: 'Gain (dB) [Linear Scale: 0 to 24 dB]' },
        expectedBehavior: 'Flat gain of ~19 dB up to fa (50 Hz), rolling off at -20 dB/decade down to 0 dB at fb (500 Hz).'
      },
      {
        description: 'Input & Output Waveforms (Sine input -> 90° Phase Shifted Cosine; Square input -> Triangular Ramp)',
        axes: { x: 'Time (ms)', y: 'Voltage (V)' },
        expectedBehavior: 'Integration transforms square wave into triangular wave and sine wave into inverted cosine wave.'
      }
    ],
    observationTables: [
      {
        id: 'obs-pes-integrator',
        title: 'Integrator Frequency Response Observation Table',
        subtitle: 'College Manual Recorded Observations (Vin = 1 Vp-p, Rf = 330 kΩ, R1 = 33 kΩ, Cf = 0.01 µF)',
        columns: [
          { key: 'fin', label: 'Fin', unit: 'Hz', type: 'number', placeholder: '10' },
          { key: 'vout', label: 'Vout', unit: 'V', type: 'number', placeholder: '9.2' },
          { key: 'gain', label: 'Gain (Vo/Vin)', type: 'number', isCalculated: true, placeholder: '9.2' },
          { key: 'gainDb', label: 'Gain', unit: 'dB', type: 'number', isCalculated: true, placeholder: '19.27' },
          { key: 'studentVout', label: 'Student Measured Vout', unit: 'V', type: 'number', isMeasured: true }
        ],
        sourceSampleRows: [
          { id: 'pi-1', fin: 10, vout: 9.2, gain: 9.2, gainDb: 19.27 },
          { id: 'pi-2', fin: 20, vout: 8.6, gain: 8.6, gainDb: 18.69 },
          { id: 'pi-3', fin: 30, vout: 7.2, gain: 7.2, gainDb: 17.15 },
          { id: 'pi-4', fin: 40, vout: 6.8, gain: 6.8, gainDb: 16.65 },
          { id: 'pi-5', fin: 50, vout: 6.4, gain: 6.4, gainDb: 16.12 },
          { id: 'pi-6', fin: 60, vout: 5.6, gain: 5.6, gainDb: 14.96 },
          { id: 'pi-7', fin: 70, vout: 5.2, gain: 5.2, gainDb: 14.32 },
          { id: 'pi-8', fin: 80, vout: 4.8, gain: 4.8, gainDb: 13.62 },
          { id: 'pi-9', fin: 90, vout: 4.4, gain: 4.4, gainDb: 12.87 },
          { id: 'pi-10', fin: 100, vout: 3.8, gain: 3.8, gainDb: 11.60 },
          { id: 'pi-11', fin: 200, vout: 2.2, gain: 2.2, gainDb: 6.85 },
          { id: 'pi-12', fin: 300, vout: 1.4, gain: 1.4, gainDb: 2.92 },
          { id: 'pi-13', fin: 400, vout: 1.2, gain: 1.2, gainDb: 1.58 },
          { id: 'pi-14', fin: 500, vout: 1.0, gain: 1.0, gainDb: 0.00 }
        ],
        defaultStudentRows: [
          { id: 's-pi-1', fin: 10, vout: 9.2, gain: 9.2, gainDb: 19.27, studentVout: '' },
          { id: 's-pi-2', fin: 50, vout: 6.4, gain: 6.4, gainDb: 16.12, studentVout: '' },
          { id: 's-pi-3', fin: 100, vout: 3.8, gain: 3.8, gainDb: 11.60, studentVout: '' },
          { id: 's-pi-4', fin: 500, vout: 1.0, gain: 1.0, gainDb: 0.00, studentVout: '' }
        ]
      }
    ],
    conclusion:
      'The practical integrator circuit frequency response was studied. At low frequencies below fa (50 Hz), gain remains constant at approximately Rf/R1 = 20 dB. Between fa and fb (500 Hz), the circuit acts as a true integrator with -20 dB/decade rolloff down to 0 dB at fb. Waveform output for a square input was verified to be a triangular ramp.',
    reviewStatus: {
      isVerified: true,
      flaggedNotes: [
        'Semilog graph in Modern College manual shows cutoff frequency fa indicated near 46 Hz - 50 Hz and fb at 500 Hz, with 0 dB gain at 500 Hz.'
      ]
    }
  },

  // =========================================================================
  // TOPIC 3: PES Modern College Exp 03 Part B - Practical Differentiator
  // =========================================================================
  {
    id: 'pes-mcoe-exp03-differentiator',
    title: 'To Study practical integrator and differentiator circuits with their frequency response — Practical Differentiator',
    secondaryRefNumber: 'Experiment No: 3 (Part II)',
    source: {
      college: "Progressive Education Society's Modern College of Engineering, Shivajinagar, Pune 5",
      subject: 'Electronic Circuits / Integrated Circuits Lab',
      manualTitle: 'Electronic Circuits Laboratory Manual',
      originalPracticalNumber: 'Experiment No: 3',
      pageReferences: 'Pages 1–7 (Differentiator Section)',
      classInfo: 'S.E E&TC'
    },
    category: 'linear',
    categoryLabel: 'Calculus Circuits & Active Filters',
    aim: 'To Study practical integrator and differentiator circuits with their frequency response.',
    apparatus: [
      'Cathode Ray Oscilloscope (CRO): 0–20 MHz',
      'Signal Generator: 0–1 MHz',
      'Dual DC Power Supply: 0–30 V, 0–1 A',
      'Experimental Circuit Kit / Breadboard',
      'Op-Amp IC 741',
      'Resistors: R1 = 1.5 kΩ, Rf = 15 kΩ, Rcomp = 1.5 kΩ',
      'Capacitors: C1 = 0.01 µF, Cf = 0.001 µF',
      'Connecting probes and breadboard'
    ],
    theory: {
      overview:
        'A circuit in which the output voltage is the derivative of the input voltage waveform is the differentiator. Such a circuit is obtained by using a basic inverting amplifier configuration if the input resistor R1 is replaced by a capacitor C1.\n\nThe expression for output voltage is given by expression: Vo = - Rf · C1 · (dVin / dt).\n\nThus the output voltage is the RFC1 times the negative instantaneous rate of change of input voltage VIN with time. However the differentiator will not work properly because it has some practical problems: the gain of the circuit (RF / XC1) increases with increase in frequency at a rate of 20 dB/decade. This makes the circuit unstable. Also the input impedance XC1 decreases with increase in frequency, which makes the circuit very susceptible to high frequency noise. When amplified, this noise can completely override the differential output signal.\n\nBoth the stability and high frequency noise problems can be corrected by addition of two components: R1 and CF as shown. This circuit is called as practical differentiator.',
      keyPoints: [
        'Basic differentiator gain increases continuously at +20 dB/decade, leading to high-frequency noise amplification and oscillation instability.',
        'Practical differentiator adds R1 in series with C1 to limit maximum high-frequency gain to -Rf / R1.',
        'Feedback capacitor Cf provides high-frequency rolloff above fb = 1 / (2π R1 C1) at -20 dB/decade.',
        'fa = 1 / (2π Rf C1) defines where differentiation begins; fb = 1 / (2π R1 C1) defines upper stability cutoff.',
        'Condition Rf · Cf = R1 · C1 ensures optimum stability.'
      ],
      equations: [
        {
          label: 'Ideal Differentiator Output',
          formula: 'Vo(t) = - Rf · C1 · (dVin(t) / dt)'
        },
        {
          label: 'Lower Break Frequency',
          formula: 'fa = 1 / (2 · π · Rf · C1)'
        },
        {
          label: 'Upper Cutoff / Gain Limiting Frequency',
          formula: 'fb = 1 / (2 · π · R1 · C1) = 1 / (2 · π · Rf · Cf)'
        },
        {
          label: 'Stability Time-Constant Condition',
          formula: 'Rf · Cf = R1 · C1'
        }
      ]
    },
    designCalculations: {
      specifications: [
        'Given: fa = 1 kHz, fb = 10 kHz, C1 = 0.01 µF, Cf = 0.001 µF',
        'fa = 1 / (2 · π · Rf · C1)  ==>  Rf = 1 / (2 · π · 1kHz · 0.01µF) = 15.92 kΩ ≈ 15 kΩ',
        'fb = 1 / (2 · π · R1 · C1)  ==>  R1 = 1 / (2 · π · 10kHz · 0.01µF) = 1.591 kΩ ≈ 1.5 kΩ',
        'Also Rf · Cf = R1 · C1  ==>  Cf = (R1 · C1) / Rf = (1.5k · 0.01µ) / 15k = 0.001 µF',
        'Rcomp = R1 || Rf = (1.5k · 15k) / (1.5k + 15k) = 1.36 kΩ ≈ 1.5 kΩ'
      ],
      formulas: [
        {
          name: 'Feedback Resistor Calculation',
          formula: 'Rf = 1 / (2π · fa · C1)',
          description: 'Calculates feedback resistance for 1 kHz lower break frequency.'
        },
        {
          name: 'Series Resistor Calculation',
          formula: 'R1 = 1 / (2π · fb · C1)',
          description: 'Calculates input series resistance for 10 kHz stability cutoff.'
        }
      ]
    },
    schematic: {
      topologyName: 'Practical Inverting Op-Amp Differentiator with High-Frequency Noise Suppression',
      description:
        'Inverting op-amp LM741 with input network of series R1 = 1.5 kΩ and C1 = 0.01 µF, feedback network of parallel Rf = 15 kΩ and Cf = 0.001 µF, and non-inverting terminal grounded through Rcomp = 1.5 kΩ.',
      components: [
        { designation: 'U1', value: 'LM741 / uA741', description: 'Operational Amplifier (±15 V Dual Supply)' },
        { designation: 'C1', value: '0.01 µF', description: 'Input differentiating capacitor' },
        { designation: 'R1', value: '1.5 kΩ', description: 'Series stability & high-frequency gain limiting resistor' },
        { designation: 'Rf', value: '15 kΩ', description: 'Feedback gain resistor' },
        { designation: 'Cf', value: '0.001 µF', description: 'Feedback noise suppression capacitor' },
        { designation: 'Rcomp', value: '1.5 kΩ', description: 'Bias compensation resistor (R1 || Rf)' }
      ]
    },
    procedure: [
      '1. With the help of formulas calculate value of RF and R1.',
      '2. Make connections as shown in figure.',
      '3. At F = 2 kHz apply 1 Vp-p sine wave and square wave and draw input output simultaneously.',
      '4. For frequency response vary input frequency from 10 Hz to 15 kHz with 1 Vp-p amplitude and measure Vo/p and find out gain.',
      '5. Plot frequency response of Differentiator on semilog graph paper.'
    ],
    mappedCircuitId: 'differentiator',
    simulationLimitation: {
      isFullySupported: true,
      mismatchDescription:
        'Directly supported. The existing OPTI-SIM differentiator module implements the exact practical differentiator topology with R1, C1, Rf, and Cf.',
      mappedModuleName: 'Practical Differentiator'
    },
    graphRequirements: [
      {
        description: 'Bode Gain (dB) vs Frequency (Hz) Bandpass Characteristics on Semilog Graph',
        axes: { x: 'Frequency (Hz) [Log Scale: 40 Hz to 20 kHz]', y: 'Gain (dB) [Linear Scale: -30 dB to +16 dB]' },
        expectedBehavior: 'Gain rises at +20 dB/decade from 40 Hz to fa (1 kHz), peaks at ~13 dB around 8-9 kHz, and rolls off above fb (10 kHz).'
      },
      {
        description: 'Input & Output Waveforms (Sine input -> Inverted Cosine; Square input -> Spike Pulses)',
        axes: { x: 'Time (ms)', y: 'Voltage (V)' },
        expectedBehavior: 'Square wave edges produce narrow positive and negative differentiation voltage spikes corresponding to dVin/dt.'
      }
    ],
    observationTables: [
      {
        id: 'obs-pes-differentiator',
        title: 'Differentiator Frequency Response Observation Table',
        subtitle: 'College Manual Recorded Observations (Vin = 1 Vp-p, R1 = 1.5 kΩ, C1 = 0.01 µF, Rf = 15 kΩ, Cf = 0.001 µF)',
        columns: [
          { key: 'fin', label: 'Fin', unit: 'Hz', type: 'number', placeholder: '40' },
          { key: 'vout', label: 'Vout (Manual)', unit: 'V', type: 'text', placeholder: '40 mV' },
          { key: 'gain', label: 'Gain (Vo/Vin)', type: 'number', isCalculated: true, placeholder: '0.04' },
          { key: 'gainDb', label: 'Gain', unit: 'dB', type: 'number', isCalculated: true, placeholder: '-27.95' },
          { key: 'studentVout', label: 'Student Measured Vout', unit: 'V', type: 'number', isMeasured: true }
        ],
        sourceSampleRows: [
          { id: 'pd-1', fin: 40, vout: '40 mV', gain: 0.04, gainDb: -27.95 },
          { id: 'pd-2', fin: 50, vout: '60 mV', gain: 0.06, gainDb: -24.437 },
          { id: 'pd-3', fin: 100, vout: '115 mV', gain: 0.115, gainDb: -18.786 },
          { id: 'pd-4', fin: 200, vout: '0.23 V', gain: 0.23, gainDb: -12.765 },
          { id: 'pd-5', fin: 300, vout: '0.34 V', gain: 0.34, gainDb: -9.37 },
          { id: 'pd-6', fin: 400, vout: '0.46 V', gain: 0.46, gainDb: -6.74 },
          { id: 'pd-7', fin: 500, vout: '0.57 V', gain: 0.57, gainDb: -4.88 },
          { id: 'pd-8', fin: 600, vout: '0.68 V', gain: 0.68, gainDb: -3.35 },
          { id: 'pd-9', fin: 700, vout: '0.80 V', gain: 0.80, gainDb: -1.938 },
          { id: 'pd-10', fin: 800, vout: '0.92 V', gain: 0.92, gainDb: -0.724 },
          { id: 'pd-11', fin: 900, vout: '1.00 V', gain: 1.00, gainDb: 0.00 },
          { id: 'pd-12', fin: 1000, vout: '1.12 V', gain: 1.12, gainDb: 0.984 },
          { id: 'pd-13', fin: 2000, vout: '2.20 V', gain: 2.20, gainDb: 6.85 },
          { id: 'pd-14', fin: 3000, vout: '3.00 V', gain: 3.00, gainDb: 9.54 },
          { id: 'pd-15', fin: 4000, vout: '3.60 V', gain: 3.60, gainDb: 11.13 },
          { id: 'pd-16', fin: 5000, vout: '4.00 V', gain: 4.00, gainDb: 12.04 },
          { id: 'pd-17', fin: 6000, vout: '4.40 V', gain: 4.40, gainDb: 12.87 },
          { id: 'pd-18', fin: 7000, vout: '4.50 V', gain: 4.50, gainDb: 13.06 },
          { id: 'pd-19', fin: 8000, vout: '4.60 V', gain: 4.60, gainDb: 13.255 },
          { id: 'pd-20', fin: 9000, vout: '4.60 V', gain: 4.60, gainDb: 13.255 },
          { id: 'pd-21', fin: 10000, vout: '4.50 V', gain: 4.50, gainDb: 13.06 },
          { id: 'pd-22', fin: 15000, vout: '3.90 V', gain: 3.90, gainDb: 11.82 },
          { id: 'pd-23', fin: 20000, vout: '3.20 V', gain: 3.20, gainDb: 10.10 }
        ],
        defaultStudentRows: [
          { id: 's-pd-1', fin: 100, vout: '115 mV', gain: 0.115, gainDb: -18.79, studentVout: '' },
          { id: 's-pd-2', fin: 1000, vout: '1.12 V', gain: 1.12, gainDb: 0.98, studentVout: '' },
          { id: 's-pd-3', fin: 8000, vout: '4.60 V', gain: 4.60, gainDb: 13.26, studentVout: '' },
          { id: 's-pd-4', fin: 15000, vout: '3.90 V', gain: 3.90, gainDb: 11.82, studentVout: '' }
        ]
      }
    ],
    conclusion:
      'The practical differentiator was tested. Differentiation occurs linearly in the band below 1 kHz with a +20 dB/decade slope. Components R1 and Cf successfully stabilize the circuit and eliminate high-frequency noise oscillations, with maximum gain peaking at ~13.2 dB near 8 kHz and rolling off safely beyond 10 kHz. Output spikes for square wave input verified rate-of-change operation.',
    reviewStatus: {
      isVerified: true,
      flaggedNotes: [
        'On page 5 semilog graph of Modern College manual, handwritten graph labels mark fa = 3.4 kHz and fb = 9 kHz on the physical plot, while mathematical calculations use fa = 1 kHz and fb = 10 kHz.'
      ]
    }
  },

  // =========================================================================
  // TOPIC 4: NMIET PCC-204 Exp 02 - Integrator Using Op-Amp
  // =========================================================================
  {
    id: 'nmiet-pcc204-exp02-integrator',
    title: 'Design, build & test integrator using Op-Amp and comment on result',
    secondaryRefNumber: 'Experiment No: 02',
    source: {
      college: 'Department of Electronics and Telecommunications Engineering - NMIET (2025-26)',
      subject: 'Electronic Circuits (EC: PCC-204)',
      manualTitle: 'Electronic Circuits - Laboratory Manual',
      originalPracticalNumber: 'Experiment No: 02',
      pageReferences: 'Pages 1–6',
      academicYear: '2025-26'
    },
    category: 'linear',
    categoryLabel: 'Calculus Circuits & Active Filters',
    aim: 'To Design, build and test integrator using Op-Amp LM741 for given frequency fa.',
    apparatus: [
      'Experimental Chassis / Bread Board',
      'Resistors (1.5 kΩ, 15.9 kΩ / 1.5 kΩ, 150 Ω)',
      'Capacitors (0.01 µF / 0.1 µF)',
      'Connecting wires',
      'Digital Multimeter (DMM)',
      'Op-Amp LM741 / 741',
      'Dual DC Power Supply (±15 V)',
      'Cathode Ray Oscilloscope (CRO)',
      'Function Generator'
    ],
    theory: {
      overview:
        'The operational amplifier integrator is an electronic integration circuit. Based around the operational amplifier (op-amp), it performs the mathematical operation of integration with respect to time; that is, its output voltage is proportional to the input voltage integrated over time.\n\nNaturally, the circuit operates by passing a current that charges or discharges the capacitor over time. If the op-amp is assumed ideal, nodes v1 and v2 are held equal, and so v2 is a virtual ground. The input voltage passes a current Iin = Vin / R1 through the resistor and series capacitor, which charges or discharges the capacitor over time. Because the resistor and capacitor are connected to a virtual ground, the input current does not vary with capacitor charge and a linear integration operation is achieved.\n\nThe practical integrator circuit is equivalent to an active first-order low-pass filter. The gain is relatively constant up to the cutoff frequency decreases by 20 dB per decade beyond it. The integration operation occurs for frequencies in the range fa < f < fb, provided that fa << fb. This condition can be achieved by appropriate choice of Rf Cf and R1 Cf time constants.',
      keyPoints: [
        'Linear integration achieved via virtual ground holding node v1 at 0 V.',
        'DC error accumulation prevented by parallel stabilization resistor Rf across Cf.',
        'Cutoff frequency fa = 1 / (2π Rf Cf) is the 3 dB break frequency.',
        '0 dB crossover frequency fb = 1 / (2π R1 Cf) is where gain reaches unity.',
        'Integration occurs in frequency range fa < f < fb.'
      ],
      equations: [
        {
          label: 'Differential Node Equation',
          formula: 'Vin / R1 = - Cf · (dVo / dt)'
        },
        {
          label: 'Output Time Integral',
          formula: 'Vo(t) = - (1 / (R1 · Cf)) ∫₀ᵗ Vin(t) dt'
        },
        {
          label: '3 dB Cutoff Frequency (fa)',
          formula: 'fa = 1 / (2 · π · Rf · Cf)'
        },
        {
          label: '0 dB Unity Crossover Frequency (fb)',
          formula: 'fb = 1 / (2 · π · R1 · Cf) = 10 · fa'
        }
      ]
    },
    designCalculations: {
      specifications: [
        'Design integrator for frequency of 1 KHz. Assume Cf = 0.01 µF.',
        'fmax = fa = 1 KHz',
        'fb = 10 · fa = 10 KHz',
        'Rf = 1 / (2 · π · Cf · fa) = 1 / (2 · π · 0.01µF · 1kHz) = 15.90 kΩ',
        'R1 = Rf / 10 = 15.90 kΩ / 10 = 1.59 kΩ ≈ 1.5 kΩ'
      ],
      formulas: [
        {
          name: 'Feedback Resistor',
          formula: 'Rf = 1 / (2π · Cf · fa) = 15.90 kΩ',
          description: 'Calculates feedback resistance for 1 kHz design frequency.'
        },
        {
          name: 'Input Resistor',
          formula: 'R1 = Rf / 10 = 1.5 kΩ',
          description: 'Establishes 10x ratio between fa and fb.'
        }
      ],
      reviewNotes: [
        'Manual Review Flag: Page 6 of NMIET manual contains handwritten calculation: Rf = 1.5 kΩ, R1 = 150 Ω, Cf = 0.1 µF yielding theoretical fa = 1.06 kHz and fb = 10.61 kHz, with practical measured values fa = 1.2 kHz and fb = 11 kHz.'
      ]
    },
    schematic: {
      topologyName: 'Practical Inverting Op-Amp Integrator Circuit',
      description:
        'LM741 inverting configuration with input resistor R1, parallel feedback combination of Rf and Cf, non-inverting terminal grounded through Rcomp, and dual power supplies +VCC (+15V) and -VEE (-15V).',
      components: [
        { designation: 'U1', value: 'LM741', description: 'Op-Amp IC (Dual Supply ±15 V)' },
        { designation: 'R1', value: '1.5 kΩ', description: 'Input series resistor' },
        { designation: 'Rf', value: '15.9 kΩ (or 1.5 kΩ)', description: 'Feedback stabilization resistor' },
        { designation: 'Cf', value: '0.01 µF (or 0.1 µF)', description: 'Feedback integrating capacitor' },
        { designation: 'Rcomp', value: '1.5 kΩ', description: 'Bias compensation resistor (R1 || Rf)' }
      ]
    },
    procedure: [
      '1) Design a circuit and connect it as shown in Fig 2.1.',
      '2) Apply sine wave input and observe the output on CRO.',
      '3) Note observation and plot the graph.',
      '4) Draw the output waveforms for sine and square wave input.',
      '5) For design purpose: i. Assume Cf < 1 for calculation, ii. Assume fb = 10 fa for calculation.'
    ],
    mappedCircuitId: 'integrator',
    simulationLimitation: {
      isFullySupported: true,
      mismatchDescription:
        'Directly supported. Existing OPTI-SIM integrator module matches this practical integrator topology exactly.',
      mappedModuleName: 'Practical Integrator'
    },
    graphRequirements: [
      {
        description: 'Frequency vs Gain in dB (Bode frequency response plot)',
        axes: { x: 'Frequency (Hz) [500 Hz to 3.5 kHz]', y: 'Gain (dB) [0 to -18 dB]' },
        expectedBehavior: 'Low-pass response with gain decreasing monotonically beyond cutoff fa.'
      },
      {
        description: 'Input Square Wave vs Output Triangular Wave',
        axes: { x: 'Time (ms)', y: 'Voltage (V)' },
        expectedBehavior: 'Constant input voltage during each half-cycle produces a linear ramp voltage at output.'
      }
    ],
    observationTables: [
      {
        id: 'obs-nmiet-integrator',
        title: 'Observation Table (Vin = 4.4 Vp-p)',
        subtitle: 'Readings recorded in NMIET PCC-204 Manual (Page 5)',
        columns: [
          { key: 'srNo', label: 'Sr. No.', type: 'text' },
          { key: 'freq', label: 'I/P Freq', unit: 'Hz', type: 'number', placeholder: '500' },
          { key: 'vout', label: 'O/P Voltage', unit: 'V', type: 'number', placeholder: '4.0' },
          { key: 'gain', label: 'Gain (Practical)', type: 'number', isCalculated: true, placeholder: '0.9090' },
          { key: 'gainDb', label: 'Gain (Practical)', unit: 'dB', type: 'number', isCalculated: true, placeholder: '-0.8287' },
          { key: 'studentVout', label: 'Student Measured Vout', unit: 'V', type: 'number', isMeasured: true }
        ],
        sourceSampleRows: [
          { id: 'ni-1', srNo: '1', freq: 500, vout: 4.0, gain: 0.9090, gainDb: -0.8287 },
          { id: 'ni-2', srNo: '2', freq: 600, vout: 2.6, gain: 0.6500, gainDb: -3.7410 },
          { id: 'ni-3', srNo: '3', freq: 700, vout: 2.2, gain: 0.5000, gainDb: -6.0205 },
          { id: 'ni-4', srNo: '4', freq: 900, vout: 2.0, gain: 0.4500, gainDb: -6.9357 },
          { id: 'ni-5', srNo: '5', freq: 1000, vout: 1.6, gain: 0.3636, gainDb: -8.7875 },
          { id: 'ni-6', srNo: '6', freq: 1500, vout: 1.2, gain: 0.2727, gainDb: -11.2865 },
          { id: 'ni-7', srNo: '7', freq: 2000, vout: 0.6, gain: 0.1363, gainDb: -17.3100 },
          { id: 'ni-8', srNo: '8', freq: 2500, vout: 0.0, gain: 0.0, gainDb: -999 },
          { id: 'ni-9', srNo: '9', freq: 3000, vout: 0.0, gain: 0.0, gainDb: -999 },
          { id: 'ni-10', srNo: '10', freq: 3500, vout: 0.0, gain: 0.0, gainDb: -999 }
        ],
        defaultStudentRows: [
          { id: 'sni-1', srNo: '1', freq: 500, vout: 4.0, gain: 0.9090, gainDb: -0.8287, studentVout: '' },
          { id: 'sni-2', srNo: '2', freq: 1000, vout: 1.6, gain: 0.3636, gainDb: -8.7875, studentVout: '' },
          { id: 'sni-3', srNo: '3', freq: 2000, vout: 0.6, gain: 0.1363, gainDb: -17.3100, studentVout: '' }
        ]
      }
    ],
    resultsTable: [
      { parameter: "Cutoff Frequency 'fa'", theoretical: '1.06 kHz', practical: '1.2 kHz', unit: 'kHz' },
      { parameter: "Unity Crossover Frequency 'fb'", theoretical: '10.61 kHz', practical: '11 kHz', unit: 'kHz' }
    ],
    conclusion:
      'The OP-Amp integrator circuit was designed for 1kHz input frequency. The output waveform was triangular as expected. The practical cut off frequency and gain were close to theoretical values.',
    vivaQuestions: [
      {
        questionNumber: 1,
        question: 'Explain the advantages & disadvantages of active integrator over passive integrator.',
        answerHint:
          'Advantages: Infinite input impedance isolation, high linear output voltage without loading attenuation, true mathematical integration over a wider frequency band. Disadvantages: Requires dual DC power supply, op-amp bandwidth and slew rate limit high frequencies, offset voltage causes saturation drift without Rf.'
      },
      {
        questionNumber: 2,
        question: 'In which region integrated O/P is observed?',
        answerHint:
          'Integrated output is observed in the frequency region between fa and fb (fa < f < fb), where the capacitive reactance Xc is dominant over Rf and the closed-loop response exhibits a -20 dB/decade rolloff.'
      },
      {
        questionNumber: 3,
        question: 'Sketch the basic and practical response of integrator circuit and label fa & fb frequencies.',
        answerHint:
          'Basic integrator has infinite DC gain and rolls off continuously from 0 Hz. Practical integrator has flat gain (Rf/R1) up to fa = 1/(2π Rf Cf), rolls off at -20 dB/dec between fa and fb, and crosses 0 dB at fb = 1/(2π R1 Cf).'
      },
      {
        questionNumber: 4,
        question: 'Sketch the output response of an integrator when square wave of 1 Vp-p is applied to it.',
        answerHint:
          'Since Vo = -(1/RC) ∫ Vin dt, integrating a positive constant voltage produces a negative linear ramp, and integrating a negative constant produces a positive linear ramp, resulting in an inverted triangular wave output.'
      },
      {
        questionNumber: 5,
        question: 'List applications of integrator circuit.',
        answerHint:
          'Analog computers, ramp/triangular waveform generators, PID controllers, active state-variable filters, analog-to-digital dual-slope converters, and audio tone control circuits.'
      }
    ],
    reviewStatus: {
      isVerified: true,
      flaggedNotes: [
        'Design section on Page 4 uses Cf=0.01µF, Rf=15.9k, R1=1.5k; Results page (Page 6) notes Rf=1.5k, R1=150Ω, Cf=0.1µF. Both give identical fa ≈ 1 kHz and fb ≈ 10 kHz.'
      ]
    }
  },

  // =========================================================================
  // TOPIC 5: NMIET PCC-204 Exp 03 - Schmitt Trigger Using Op-Amp
  // =========================================================================
  {
    id: 'nmiet-pcc204-exp03-schmitt-trigger',
    title: 'Design, build & test Schmitt trigger using Op-Amp and comment on result',
    secondaryRefNumber: 'Experiment No: 03',
    source: {
      college: 'Department of Electronics and Telecommunications Engineering - NMIET (2025-26)',
      subject: 'Electronic Circuits (EC: PCC-204)',
      manualTitle: 'Electronic Circuits - Laboratory Manual',
      originalPracticalNumber: 'Experiment No: 03',
      pageReferences: 'Pages 7–12',
      academicYear: '2025-26'
    },
    category: 'non-linear',
    categoryLabel: 'Nonlinear Switching & Comparators',
    aim: 'To design, build and test Schmitt trigger and plot transfer characteristic.',
    objectives: [
      '1. To design the Schmitt trigger using Op-Amp.',
      '2. To study the transfer characteristics of Schmitt Trigger.'
    ],
    apparatus: [
      'Op-Amp IC 741',
      'Resistors (R1 = 100 Ω, R2 = 4.7 kΩ, R3 = 100 Ω)',
      'Dual DC Power Supply (±15 V)',
      'Regulated DC Power Supply',
      'Cathode Ray Oscilloscope (CRO) / DSO with X-Y mode',
      'Function Generator (Sine wave, 1 V, 1 kHz)',
      'Digital Multimeter (DMM)',
      'Breadboard and connecting probes'
    ],
    theory: {
      overview:
        'Voltage comparators use positive feedback or no feedback at all (open-loop mode) to switch their output between two saturated states. Because in open-loop mode the amplifier voltage gain is basically equal to Avo, the output swings either fully to +Vcc or fully to -Vcc on application of varying input signal.\n\nThe Schmitt trigger is a variation of the simple comparator which has hysteresis, that is, it has a toggle action. When the output is high, positive feedback makes the switching level higher than it is when the output is low. A little positive feedback makes a comparator with better noise immunity. Increase the positive feedback and the Schmitt trigger can be used in other switching applications.\n\nNotice that va = [R2 / (R1 + R2)] · vo, so it depends on the output. When vo = +Vsat, the threshold is Upper Trigger Point (VUTP). When vo = -Vsat, the threshold is Lower Trigger Point (VLTP). The difference between VUTP and VLTP is the Hysteresis Voltage (VH), which prevents erratic false transitions caused by noise on the input signal.',
      keyPoints: [
        'Employs positive feedback from output pin 6 to non-inverting input pin 3.',
        'Eliminates multiple spurious output transitions caused by noisy input signals.',
        'Upper Trigger Point: VUTP = [R2 / (R1 + R2)] · (+Vsat).',
        'Lower Trigger Point: VLTP = [R2 / (R1 + R2)] · (-Vsat).',
        'Hysteresis voltage width: VH = VUTP - VLTP.',
        'X-Y mode on oscilloscope displays the characteristic rectangular hysteresis loop.'
      ],
      equations: [
        {
          label: 'Upper Trigger Point (VUTP)',
          formula: 'VUTP = [R2 / (R1 + R2)] · (+Vsat)'
        },
        {
          label: 'Lower Trigger Point (VLTP)',
          formula: 'VLTP = [R2 / (R1 + R2)] · (-Vsat)'
        },
        {
          label: 'Hysteresis Voltage (VH)',
          formula: 'VH = VUTP - VLTP'
        }
      ]
    },
    designCalculations: {
      specifications: [
        'Input signal: 1.0 V peak, 1 kHz sine wave (Function generator)',
        'Op-Amp saturation limits: +Vsat = +2.0 V, -Vsat = -2.0 V (with ±15 V dual supplies)',
        'Resistors used in laboratory: R1 = 100 Ω (feedback), R2 = 4.7 kΩ (ground leg), R3 = 100 Ω (input protection)',
        'Feedback factor: β = R2 / (R1 + R2) = 4.7 kΩ / (100 Ω + 4.7 kΩ) = 4700 / 4800 = 0.9792',
        'VUTP = β · (+Vsat) = 0.9792 · (+2.0 V) = +1.958 V ≈ +1.95 V',
        'VLTP = β · (-Vsat) = 0.9792 · (-2.0 V) = -1.958 V ≈ -1.95 V',
        'VH = VUTP - VLTP = 1.958 V - (-1.958 V) = 3.917 V ≈ 3.90 V'
      ],
      formulas: [
        {
          name: 'Feedback Factor (β)',
          formula: 'β = R2 / (R1 + R2)',
          description: 'Calculates positive feedback attenuation ratio from output to non-inverting terminal.'
        },
        {
          name: 'Upper Trigger Point (VUTP)',
          formula: 'VUTP = β · (+Vsat) = [R2 / (R1 + R2)] · (+Vsat)',
          description: 'High switching threshold voltage that forces output to toggle LOW.'
        },
        {
          name: 'Lower Trigger Point (VLTP)',
          formula: 'VLTP = β · (-Vsat) = [R2 / (R1 + R2)] · (-Vsat)',
          description: 'Low switching threshold voltage that forces output to toggle HIGH.'
        },
        {
          name: 'Hysteresis Loop Width (VH)',
          formula: 'VH = VUTP - VLTP',
          description: 'Total noise immunity margin preventing false transitions.'
        }
      ],
      reviewNotes: [
        'Manual Review Flag: Multisim schematic on Page 9 shows R1 = 1 kΩ, R2 = 56 kΩ with ±15V rails. The handwritten Result Table on Page 10 lists R1 = 100 Ω, R2 = 4.7 kΩ with ±2V output levels. Both resistor pairs represent inverting Schmitt trigger feedback dividers.'
      ]
    },
    schematic: {
      topologyName: 'Inverting Op-Amp Schmitt Trigger with Positive Feedback',
      description:
        'UA741 op-amp with input applied to inverting terminal pin 2 via R3 = 100 Ω, positive feedback voltage divider R1, R2 connected between output pin 6 and non-inverting terminal pin 3, and supply rails VCC = +15 V, VEE = -15 V.',
      components: [
        { designation: 'U1', value: 'UA741 / LM741', description: 'Op-Amp IC (Dual Supply Pin 7 = +15V, Pin 4 = -15V)' },
        { designation: 'R1', value: '100 Ω', description: 'Feedback resistor in voltage divider (Output Pin 6 to Pin 3)' },
        { designation: 'R2', value: '4.7 kΩ', description: 'Ground-leg resistor in voltage divider (Pin 3 to Ground)' },
        { designation: 'R3', value: '100 Ω', description: 'Input series protection resistor (Vin to Inverting Pin 2)' }
      ],
      diagramNotes: [
        'Active simulation schematic represents the primary laboratory bench configuration: R1 = 100 Ω, R2 = 4.7 kΩ, R3 = 100 Ω with ±2.0 V saturation levels.',
        'Alternative Manual Reference (Page 9 Multisim): R1 = 1 kΩ, R2 = 56 kΩ with ±15 V supplies (β ≈ 0.0175). Preserved as source reference material; not used in active simulation.'
      ]
    },
    procedure: [
      '1. Connect the circuit as per the circuit diagram.',
      '2. For a zero crossing detector, connect the non-inverting terminal to ground.',
      '3. Switch on the dual power supply.',
      '4. Observe the output waveform on the CRO.',
      '5. Draw the output and input waveforms.',
      '6. For Schmitt Trigger set input signal (say 1V, 1 KHz) using Function generator.',
      '7. Observe the input and output waveforms on the CRO.',
      '8. Plot the graphs: Vi vs Time, Vo vs Time, and Vo vs Vi (Hysteresis Curve in X-Y mode).'
    ],
    mappedCircuitId: 'schmitt-trigger',
    simulationLimitation: {
      isFullySupported: true,
      mismatchDescription:
        'Directly supported. The existing OPTI-SIM Schmitt trigger module models both inverting and non-inverting Schmitt triggers with dynamic UTP, LTP, and hysteresis loop visualization.',
      mappedModuleName: 'Schmitt Trigger'
    },
    graphRequirements: [
      {
        description: 'Input Voltage Vi vs Output Voltage Vo Transfer Characteristic (Hysteresis Loop)',
        axes: { x: 'Input Voltage Vi (V)', y: 'Output Voltage Vo (V)' },
        expectedBehavior: 'Rectangular counterclockwise hysteresis loop bounded by VLTP, VUTP, +Vsat, and -Vsat.'
      },
      {
        description: 'Time Domain Vi(t) and Vo(t) waveforms',
        axes: { x: 'Time (ms)', y: 'Voltage (V)' },
        expectedBehavior: 'Output switches sharply between +Vsat and -Vsat when input crosses trigger points.'
      }
    ],
    observationTables: [
      {
        id: 'obs-nmiet-schmitt',
        title: 'Observation Table (Page 10 Manual Reading)',
        subtitle: 'College manual measured switching parameters',
        columns: [
          { key: 'param', label: 'Parameters', type: 'text' },
          { key: 'vin', label: 'Vin', unit: 'V', type: 'text', placeholder: '0.47 V' },
          { key: 'posVsat', label: '+Vsat', unit: 'V', type: 'number', placeholder: '+2' },
          { key: 'negVsat', label: '-Vsat', unit: 'V', type: 'number', placeholder: '-2' },
          { key: 'vutp', label: 'VUTP', unit: 'V', type: 'number', placeholder: '1.6' },
          { key: 'vltp', label: 'VLTP', unit: 'V', type: 'number', placeholder: '-1.4' },
          { key: 'vh', label: 'VH', unit: 'V', type: 'number', placeholder: '0.2' }
        ],
        sourceSampleRows: [
          { id: 'ns-1', param: 'Manual Record (Page 10)', vin: '0.47 V (473.7 mV)', posVsat: 2.0, negVsat: -2.0, vutp: 1.6, vltp: -1.4, vh: 0.2 }
        ],
        defaultStudentRows: [
          { id: 'sns-1', param: 'Bench Trial 1', vin: '', posVsat: '', negVsat: '', vutp: '', vltp: '', vh: '' }
        ]
      }
    ],
    resultsTable: [
      { parameter: '+Vsat (Positive Saturation)', theoretical: '+2.00 V', simulated: '+2.00 V', sourceManual: '+2.0 V', practical: '+2.0 V', unit: 'V', remarks: 'Idealized saturation ±2.0 V model; manual record +2.0 V' },
      { parameter: '-Vsat (Negative Saturation)', theoretical: '-2.00 V', simulated: '-2.00 V', sourceManual: '-2.0 V', practical: '-2.0 V', unit: 'V', remarks: 'Idealized saturation ±2.0 V model; manual record -2.0 V' },
      { parameter: 'VUTP (Upper Trigger Point)', theoretical: '+1.958 V', simulated: '+1.958 V', sourceManual: '+1.6 V', practical: '+1.6 V', unit: 'V', remarks: 'Theoretical β·(+Vsat) = [4.7k/4.8k]·(+2V) = +1.958 V; manual bench measured 1.6 V' },
      { parameter: 'VLTP (Lower Trigger Point)', theoretical: '-1.958 V', simulated: '-1.958 V', sourceManual: '-1.4 V', practical: '-1.4 V', unit: 'V', remarks: 'Theoretical β·(-Vsat) = [4.7k/4.8k]·(-2V) = -1.958 V; manual bench measured -1.4 V' },
      { parameter: 'VH (Hysteresis Loop Width)', theoretical: '3.917 V', simulated: '3.917 V', sourceManual: '0.2 V (derived 3.0 V)', practical: '3.0 V', unit: 'V', remarks: 'Calculated VH = VUTP - VLTP = 3.917 V (theoretical), 3.0 V (derived bench); manual table noted 0.2 V (magnitude subtraction). Discrepancy flagged.' }
    ],
    conclusion:
      'The Schmitt trigger ckt was successfully implemented using OP-Amp 741. The observed hysteresis voltage (VH) matched the designed values. The output waveform confirmed bistable switching operation.',
    vivaQuestions: [
      {
        questionNumber: 1,
        question: 'Which feedback is present in Schmitt Trigger?',
        answerHint:
          'Positive feedback (regenerative feedback) is present in a Schmitt trigger. A portion of the output voltage is fed back to the non-inverting (+) input terminal.'
      },
      {
        questionNumber: 2,
        question: 'What do you mean by Dead or Hysteresis loop?',
        answerHint:
          'The hysteresis loop (or dead band) is the voltage difference between the upper trigger point and lower trigger point (VH = VUTP - VLTP). In this region, no output state change occurs, preventing noise from triggering false state toggles.'
      },
      {
        questionNumber: 3,
        question: 'For any kind of input signal, what is the output of Comparator?',
        answerHint:
          'The output of a comparator is always a digital/bistable two-level square or rectangular waveform swinging between positive saturation (+Vsat) and negative saturation (-Vsat).'
      }
    ],
    reviewStatus: {
      isVerified: true,
      flaggedNotes: [
        'Result table on Page 10 records R1 = 100 Ω, R2 = 4.7 kΩ with Vsat = ±2V; schematic on Page 9 shows R1 = 1 kΩ, R2 = 56 kΩ with ±15V supplies.'
      ]
    }
  },

  // =========================================================================
  // TOPIC 6: NMIET PCC-204 Exp 04 - Voltage Series Feedback Amplifier
  // =========================================================================
  {
    id: 'nmiet-pcc204-exp04-voltage-series-feedback',
    title: 'Simulate voltage series feedback amplifier & measure Rif, Rof, Avf, bandwidth and comment on result.',
    secondaryRefNumber: 'Experiment No: 04',
    source: {
      college: 'Department of Electronics and Telecommunications Engineering - NMIET (2025-26)',
      subject: 'Electronic Circuits (EC: PCC-204)',
      manualTitle: 'Electronic Circuits - Laboratory Manual',
      originalPracticalNumber: 'Experiment No: 04',
      pageReferences: 'Pages 13–16',
      academicYear: '2025-26'
    },
    category: 'feedback-amplifiers',
    categoryLabel: 'Feedback Topologies & Frequency Response',
    aim: 'Simulate Voltage-Series feedback amplifier and calculate Rif, Rof, Avf and BW.',
    apparatus: [
      'Computer with Multisim Software / Circuit Simulation Tool',
      '2x Discrete N-Channel MOSFETs (2N7000 Q1, Q2)',
      'Resistors: RD = 2.2 kΩ, RS = 1 kΩ, R2 = 10 MΩ, R3 = 10 MΩ, R5 (Feedback) = 3.3 kΩ, R_series = 2.2 kΩ, R_load = 1 kΩ',
      'Capacitors: CC1 = 10 µF, C1 = 0.47 µF, CC3 = 10 µF, CS1 = 100 µF',
      'DC Power Supply VDD = 12.0 V',
      'AC Signal Source (Vi = 50 mVp / 100 mVp, 1 kHz)',
      'Oscilloscope & Bode Plotter instrument tools'
    ],
    theory: {
      overview:
        'The configuration of an ideal voltage series feedback amplifier samples the output voltage (Vo) in parallel (shunt) and feeds back a proportional feedback voltage (Vf) in series with the input signal voltage (Vs).\n\nThe circuit consists of a basic voltage amplifier with open loop voltage gain Av. The feedback network samples the output voltage (Vo) and produces a feedback voltage (Vf), which is in series with the input signal voltage (Vs).\n\nThe input impedance of voltage-series feedback amplifier increases and output impedance decreases as compared to the basic voltage amplifier. Voltage-series feedback stabilizes voltage gain Av of amplifier, reduces nonlinear distortion, and widens the operating bandwidth.\n\nIn op-amp circuits, the non-inverting amplifier configuration represents the canonical op-amp implementation of voltage-series feedback.',
      keyPoints: [
        'Voltage sampling at output (shunt connection) stabilizes output voltage and reduces output impedance: Rof = Ro / (1 + β·Av).',
        'Series comparison at input increases input impedance: Rif = Ri · (1 + β·Av).',
        'Closed loop voltage gain is reduced but stabilized: Avf = Av / (1 + β·Av).',
        'Operating bandwidth is widened by the desensitivity factor (1 + β·Av): BWf = BW · (1 + β·Av).'
      ],
      equations: [
        {
          label: 'Closed-Loop Voltage Gain',
          formula: 'Avf = Vo / Vin = Av / (1 + β · Av)'
        },
        {
          label: 'Input Impedance with Feedback',
          formula: 'Rif = Ri · (1 + β · Av)'
        },
        {
          label: 'Output Impedance with Feedback',
          formula: 'Rof = Ro / (1 + β · Av)'
        },
        {
          label: 'Bandwidth with Feedback',
          formula: 'BWf = FHf - FLf = BW · (1 + β · Av)'
        },
        {
          label: 'Indirect Input Impedance Measurement Formula',
          formula: "Ri = [Vo' / (Vo - Vo')] · 2.2 kΩ"
        },
        {
          label: 'Indirect Output Impedance Measurement Formula',
          formula: "Ro = [(Vo - Vo'') / Vo''] · 1 kΩ"
        }
      ]
    },
    designCalculations: {
      specifications: [
        'Simulation circuit in Multisim: Two-stage discrete 2N7000 FET amplifier',
        'Supply: VDD = 12 V',
        'Input: Vi = 50 mVp / 100 mVp at 1 kHz',
        'Feedback network: R5 = 3.3 kΩ via Key-Space switch S1'
      ],
      formulas: [
        {
          name: 'Input Impedance from Attenuation',
          formula: "Ri = (Vo' / (Vo - Vo')) · R_series",
          description: 'Calculates Ri by inserting a 2.2 kΩ series resistor at input.'
        },
        {
          name: 'Output Impedance from Loading',
          formula: "Ro = ((Vo - Vo'') / Vo'') · R_load",
          description: 'Calculates Ro by connecting a 1 kΩ shunt resistor at output.'
        }
      ],
      reviewNotes: [
        'Simulation Limitation Notice: This syllabus experiment was performed in Multisim using a discrete 2-stage 2N7000 MOSFET circuit rather than an op-amp IC. In the op-amp domain, the Non-Inverting Amplifier represents the identical voltage-series feedback topology (Avf = 1 + Rf/R1, high Rin, low Rout). Both the original Multisim practical data and the op-amp non-inverting equivalent are fully documented.'
      ]
    },
    schematic: {
      topologyName: 'Multisim 2-Stage 2N7000 FET Voltage-Series Feedback Amplifier',
      description:
        'Two-stage common-source MOSFET (2N7000) cascade with VDD = 12 V, drain resistors RD = 2.2 kΩ, source bias resistors RS = 1 kΩ bypassed by CS1 = 100 µF, coupling capacitors CC1 = 10 µF, C1 = 0.47 µF, CC3 = 10 µF, and feedback resistor R5 = 3.3 kΩ connected from Stage 2 output back to Stage 1 source through switch S1.',
      components: [
        { designation: 'Q1, Q2', value: '2N7000', description: 'Discrete N-Channel Enhancement MOSFETs' },
        { designation: 'VDD', value: '12.0 V', description: 'Drain DC Power Supply' },
        { designation: 'RD, RD1', value: '2.2 kΩ', description: 'Drain load resistors' },
        { designation: 'RS, RS1', value: '1 kΩ', description: 'Source bias resistors' },
        { designation: 'R2, R3', value: '10.0 MΩ', description: 'Gate bias resistors' },
        { designation: 'R5', value: '3.3 kΩ', description: 'Voltage-series feedback resistor' },
        { designation: 'S1', value: 'Key-Space Switch', description: 'Feedback loop disconnect switch' }
      ]
    },
    procedure: [
      '1) Build the circuit as shown above in multisim.',
      '2) Apply signal source Vi = 50 mVp, 1 Khz and measure output voltage Vo.',
      '3) Calculate voltage gain Av = Vo / Vi.',
      '4) Connect 2.2K resistor in series with input signal Vs and measure output Vo\'. Calculate Ri = {Vo\' / (Vo - Vo\')} * 2.2k.',
      '5) Disconnect 2.2K and Connect 1k resistor across the output and measure output Vo\'\'. Calculate Ro = {(Vo - Vo\'\') / Vo\'\'} * 1k.',
      '6) Plot the frequency response using the procedure of experiment 3.',
      '7) Repeat the steps 2 to 6 with feedback (close the switch S1).'
    ],
    mappedCircuitId: 'non-inverting-amplifier',
    simulationLimitation: {
      isFullySupported: false,
      mismatchDescription:
        'Circuit Topology Difference: This practical in the college manual was simulated in Multisim using a discrete 2-stage 2N7000 MOSFET circuit rather than an op-amp. OPTI-SIM is an operational amplifier simulator; its closest equivalent topology is the Non-Inverting Amplifier (which is the classic op-amp voltage-series feedback topology with high Rin, low Rout, and stabilized Av = 1 + Rf/R1). The complete Multisim data, calculations, and observations from the manual are preserved here for reference.',
      mappedModuleName: 'Non-Inverting Amplifier (Op-Amp Equivalent)',
      opAmpEquivalentNote:
        'To experiment with voltage-series feedback in the op-amp engine, open the Non-Inverting Amplifier module. It exhibits Avf = 1 + (Rf / R1), ideal high Rin, and zero output impedance.'
    },
    graphRequirements: [
      {
        description: 'Frequency Response with vs without Feedback (Bode Plot in Multisim)',
        axes: { x: 'Frequency (Hz / MHz) [Log Scale]', y: 'Gain (dB) [Linear Scale]' },
        expectedBehavior: 'Feedback reduces midband gain from 8 (18 dB) to 4.5 (13 dB) while doubling the bandwidth from 10.67 MHz to 21.31 MHz.'
      }
    ],
    observationTables: [
      {
        id: 'obs-nmiet-feedback',
        title: 'Observations Table (Multisim Simulation Readings from Manual)',
        subtitle: 'Comparing circuit behavior With Feedback vs Without Feedback',
        columns: [
          { key: 'srNo', label: 'Sr. No.', type: 'text' },
          { key: 'quantity', label: 'Quantity', type: 'text' },
          { key: 'withFeedback', label: 'With Feedback (Closed Loop)', type: 'text', placeholder: '450 mV' },
          { key: 'withoutFeedback', label: 'Without Feedback (Open Loop)', type: 'text', placeholder: '800 mV' },
          { key: 'remarks', label: 'Remarks / Formula', type: 'text' }
        ],
        sourceSampleRows: [
          { id: 'fb-1', srNo: '1', quantity: 'Vo (Direct output)', withFeedback: '450 mV', withoutFeedback: '800 mV', remarks: 'Measured with Vin = 100 mV' },
          { id: 'fb-2', srNo: '2', quantity: "Vo' (with 2.2k series)", withFeedback: '200 mV', withoutFeedback: '260 mV', remarks: 'Used to calculate Ri' },
          { id: 'fb-3', srNo: '3', quantity: "Vo'' (with 1k load)", withFeedback: '240 mV', withoutFeedback: '400 mV', remarks: 'Used to calculate Ro' },
          { id: 'fb-4', srNo: '4', quantity: 'FL (Lower cutoff)', withFeedback: '3.45 Hz', withoutFeedback: '5.018 Hz', remarks: 'Lower 3dB frequency' },
          { id: 'fb-5', srNo: '5', quantity: 'FH (Upper cutoff)', withFeedback: '21.31 MHz', withoutFeedback: '10.67 MHz', remarks: 'Upper 3dB frequency' }
        ],
        defaultStudentRows: [
          { id: 'sfb-1', srNo: '1', quantity: 'Vo', withFeedback: '', withoutFeedback: '', remarks: '' },
          { id: 'sfb-2', srNo: '2', quantity: "Vo'", withFeedback: '', withoutFeedback: '', remarks: '' },
          { id: 'sfb-3', srNo: '3', quantity: "Vo''", withFeedback: '', withoutFeedback: '', remarks: '' }
        ]
      }
    ],
    resultsTable: [
      { parameter: 'Voltage Gain (Av)', theoretical: '4.5 (With FB)', practical: '8.0 (Without FB)', unit: 'V/V', remarks: 'Gain reduced by negative feedback' },
      { parameter: 'Input Impedance (Ri)', theoretical: '1.14 MΩ (With FB)', practical: '1.0 MΩ (Without FB)', unit: 'MΩ', remarks: 'Negative feedback increases input impedance' },
      { parameter: 'Output Impedance (Ro)', theoretical: '1.25 kΩ (With FB)', practical: '2.076 kΩ (Without FB)', unit: 'kΩ', remarks: 'Negative feedback decreases output impedance' },
      { parameter: 'Bandwidth (B.W.)', theoretical: '21.31 MHz (With FB)', practical: '10.67 MHz (Without FB)', unit: 'MHz', remarks: 'Bandwidth doubled by negative feedback' }
    ],
    conclusion:
      'The simulation verified that -ve feedback increases i/p impedance and bandwidth while reducing o/p impedance and gain. The theoretical and simulated results matched closely.',
    vivaQuestions: [
      {
        questionNumber: 1,
        question: 'What are the types of feedback?',
        answerHint:
          'Positive feedback (where feedback signal is in-phase with input, used in oscillators and Schmitt triggers) and Negative feedback (where feedback signal is 180° out-of-phase with input, used in stable amplifiers).'
      },
      {
        questionNumber: 2,
        question: 'What are the advantages of negative feedback?',
        answerHint:
          'Stabilizes gain against transistor parameter variations and temperature, widens bandwidth, reduces nonlinear distortion, decreases noise, and allows tailoring of input and output impedances.'
      },
      {
        questionNumber: 3,
        question: 'What are the topologies of negative feedback?',
        answerHint:
          '1. Voltage-Series feedback, 2. Voltage-Shunt feedback, 3. Current-Series feedback, 4. Current-Shunt feedback.'
      },
      {
        questionNumber: 4,
        question: 'Compare the different feedback topologies with block diagram.',
        answerHint:
          'Voltage-Series: Shunt output, Series input (High Rin, Low Rout). Voltage-Shunt: Shunt output, Shunt input (Low Rin, Low Rout). Current-Series: Series output, Series input (High Rin, High Rout). Current-Shunt: Series output, Shunt input (Low Rin, High Rout).'
      },
      {
        questionNumber: 5,
        question: 'Why negative feedback is used in amplifiers?',
        answerHint:
          'To obtain predictable, stable linear amplification, desensitize gain from active device tolerances, extend bandwidth, and prevent distortion.'
      },
      {
        questionNumber: 6,
        question: 'Explain the steps to identify the topology with the help of Voltage Series Amplifier.',
        answerHint:
          '1. Sample check: If output voltage Vo is sampled across the load, it is voltage feedback. 2. Mixing check: If feedback signal Vf is subtracted in series with input loop Vs, it is series mixing.'
      },
      {
        questionNumber: 7,
        question: 'What is the effect of feedback on Av, Ri & Ro in voltage series amplifier?',
        answerHint:
          'Avf decreases by factor (1 + β Av); Rif increases by factor (1 + β Av); Rof decreases by factor (1 + β Av).'
      }
    ],
    reviewStatus: {
      isVerified: true,
      flaggedNotes: [
        'Manual circuit uses discrete FETs in Multisim. op-amp Non-Inverting Amplifier provided as the op-amp voltage-series feedback equivalent.'
      ]
    }
  },

  // =========================================================================
  // TOPIC 7: NMIET PCC-204 Exp 05 - 2-Bit / 3-Bit R-2R Ladder DAC
  // =========================================================================
  {
    id: 'nmiet-pcc204-exp05-r2r-dac',
    title: 'Design, build & test 2 or 3-bit R-2R ladder DAC.',
    secondaryRefNumber: 'Experiment No: 05',
    source: {
      college: 'Department of Electronics and Telecommunications Engineering - NMIET (2025-26)',
      subject: 'Electronic Circuits (EC: PCC-204)',
      manualTitle: 'Electronic Circuits - Laboratory Manual',
      originalPracticalNumber: 'Experiment No: 05',
      pageReferences: 'Pages 17–21',
      academicYear: '2025-26'
    },
    category: 'data-conversion',
    categoryLabel: 'Data Conversion & Mixed Signal',
    aim: 'To build and test 2 bit R-2R Ladder type DAC circuit using op amp.',
    apparatus: [
      'Bread board & connecting wires',
      'Dual DC Power Supply (±12 V or ±15 V)',
      'Function Generator / Fixed Reference Supply (VR = 5.0 V or 10.0 V)',
      'Cathode Ray Oscilloscope (CRO) / DMM',
      'Op-Amp IC 741 (1 unit)',
      'Precision Resistors: R = 10 kΩ, 2R = 20 kΩ (or R = 2 kΩ, 2R = 4 kΩ in Multisim schematic, 1% tolerance)',
      'Capacitors (0.1 µF bypass)'
    ],
    theory: {
      overview:
        'The catchword of electronic system today is "Digital". Everything and anything is getting digital. The multimeter used in laboratories has turned digital, digital television is in the market, digital radio, clock, music, synthesizer, stereo are few examples. Analog to digital converters commonly known as ADC translate from analog measurements to digital language. Digital to analog converters (DAC) are used in transmission of started data or results of digital processing back to real world variables for control information display or further analog processing.\n\nThe process of translation of digital information into equivalent analog information is called as digital to analog conversion. Such converter is also called as decoding device. There are two types of such converters — the weighted resistor DAC and the R–2R ladder DAC. The R–2R ladder (binary ladder) is a resistive network whose output voltage is a properly weighted sum of the digital inputs. It uses resistors of only two values, the R and the 2R, as shown in the figure.',
      keyPoints: [
        'Overcomes the wide resistor spread drawback of binary-weighted DACs by requiring only two distinct resistance values: R and 2R.',
        'At each node of the ladder looking to the right or left, the equivalent Thévenin resistance is exactly R.',
        'Binary switches direct current either to virtual ground or analog ground without changing the ladder impedance.',
        'Output voltage is proportional to binary word value scaled by reference voltage Vref.'
      ],
      equations: [
        {
          label: '2-Bit DAC Formula (from manual calculation sheet)',
          formula: 'Vo = +Vref · [ (B / 2²) + (A / 2¹) ]   (with Vref = 10 V)'
        },
        {
          label: 'Inverting Op-Amp R-2R Output Equation',
          formula: 'Vo = - Vref · (Rf / R) · Σ (bi · 2⁻ⁱ)'
        },
        {
          label: 'Resolution of n-bit DAC',
          formula: 'Step Size = Vref / 2ⁿ'
        }
      ]
    },
    designCalculations: {
      specifications: [
        'Number of bits: 2-bit (Inputs B and A)',
        'Reference voltage: Vref = 10 V (or VR = 5 V)',
        'Resistor values: R = 10 kΩ, 2R = 20 kΩ, Rf = 20 kΩ'
      ],
      formulas: [
        {
          name: 'Manual 2-Bit Evaluation (Vref = 10 V)',
          formula: 'Vo = +10 · (B/4 + A/2)',
          description:
            'i) For 0,0: +10 · (0/4 + 0/2) = 0 V\nii) For 0,1: +10 · (0/4 + 1/2) = 5.0 V\niii) For 1,0: +10 · (1/4 + 0/2) = 2.5 V\niv) For 1,1: +10 · (1/4 + 1/2) = 7.5 V',
          calculationNote:
            'Note: In the student calculation sheet, bit A was assigned weight 1/2 (MSB position) and B weight 1/4 (LSB position). In standard binary representation, bit B is typically MSB and bit A is LSB.'
        }
      ],
      reviewNotes: [
        'Manual Review Flag: Page 18 schematic displays VR = 5.0 V with R = 10k, 2R = 20k. Page 21 Multisim schematic displays R = 2k, 2R = 4k with ±12V supplies. Page 19 handwritten calculations use Vref = 10 V. The ratio 2:1 is maintained across all variants.'
      ]
    },
    schematic: {
      topologyName: '2-Bit Op-Amp R-2R Ladder Digital-to-Analog Converter',
      description:
        '2-bit R-2R ladder network connected to the inverting input of IC 741 with feedback resistor RF. Bits B and A control SPDT switches S1 and S2 connected to reference voltage VR.',
      components: [
        { designation: 'U1', value: 'IC 741 / uA741', description: 'Op-Amp Inverting Buffer / Summer' },
        { designation: 'R2, R3, R4', value: '20 kΩ (2R)', description: 'Ladder vertical branch & terminating resistors' },
        { designation: 'R5', value: '10 kΩ (R)', description: 'Ladder horizontal series resistor' },
        { designation: 'RF', value: '20 kΩ (or 4 kΩ)', description: 'Op-Amp feedback resistor' },
        { designation: 'S1, S2', value: 'SPDT Switches', description: 'Digital bit control switches (Bit B, Bit A)' }
      ]
    },
    procedure: [
      '1) Build circuit on bread board.',
      '2) Connect power supply to the circuit.',
      '3) Measure the analog output voltage (Va) w.r.t. ground for all binary inputs from 00 to 11.',
      '4) Tabulate the results in observation table.',
      '5) Plot the graph of analog output voltage versus digital inputs.'
    ],
    mappedCircuitId: 'dac',
    simulationLimitation: {
      isFullySupported: true,
      mismatchDescription:
        'Directly supported. The existing OPTI-SIM DAC module models an op-amp R-2R ladder DAC. Students can set bits b3=0, b2=0 to run 2-bit operation matching the manual experiment.',
      mappedModuleName: 'Digital to Analog Converter (DAC)'
    },
    graphRequirements: [
      {
        description: 'Analog Output Voltage vs Digital Binary Inputs (Transfer Staircase)',
        axes: { x: 'Digital Input Code (00, 01, 10, 11)', y: 'Analog Output Voltage (V)' },
        expectedBehavior: 'Monotonic staircase with uniform step size corresponding to resolution.'
      }
    ],
    observationTables: [
      {
        id: 'obs-nmiet-dac',
        title: 'Observation Table (Page 20 Manual Readings)',
        subtitle: 'College manual recorded 2-bit DAC readings',
        columns: [
          { key: 'srNo', label: 'Sr. No.', type: 'text' },
          { key: 'bitB', label: 'B (Input)', type: 'text', placeholder: '0' },
          { key: 'bitA', label: 'A (Input)', type: 'text', placeholder: '0' },
          { key: 'vCalc', label: 'Calculated O/P Voltage', unit: 'V', type: 'text', placeholder: '0 V' },
          { key: 'vMeasured', label: 'Measured O/P Voltage', unit: 'V', type: 'text', placeholder: '-1.836 mV' },
          { key: 'studentVout', label: 'Student Measured Vout', unit: 'V', type: 'number', isMeasured: true }
        ],
        sourceSampleRows: [
          { id: 'nd-1', srNo: '1', bitB: '0', bitA: '0', vCalc: '0 V', vMeasured: '-1.836 mV' },
          { id: 'nd-2', srNo: '2', bitB: '0', bitA: '1', vCalc: '5 V', vMeasured: '3.098 V' },
          { id: 'nd-3', srNo: '3', bitB: '1', bitA: '0', vCalc: '2.5 V', vMeasured: '2.18 V' },
          { id: 'nd-4', srNo: '4', bitB: '1', bitA: '1', vCalc: '7.5 V', vMeasured: '5.248 V' }
        ],
        defaultStudentRows: [
          { id: 'snd-1', srNo: '1', bitB: '0', bitA: '0', vCalc: '0.0 V', vMeasured: '-1.836 mV', studentVout: '' },
          { id: 'snd-2', srNo: '2', bitB: '0', bitA: '1', vCalc: '5.0 V', vMeasured: '3.098 V', studentVout: '' },
          { id: 'snd-3', srNo: '3', bitB: '1', bitA: '0', vCalc: '2.5 V', vMeasured: '2.18 V', studentVout: '' },
          { id: 'snd-4', srNo: '4', bitB: '1', bitA: '1', vCalc: '7.5 V', vMeasured: '5.248 V', studentVout: '' }
        ]
      }
    ],
    conclusion:
      'The 2-bit R-2R ladder DAC was sucessfully implemented. The analog output voltage obtained matched the expected theoretical values within tolerance limits.',
    vivaQuestions: [
      {
        questionNumber: 1,
        question: 'What is the importance of DAC and ADC?',
        answerHint:
          'DAC and ADC bridge the real-world analog continuous domain (sound, temperature, pressure) and discrete digital processing systems (microcontrollers, DSPs, computers).'
      },
      {
        questionNumber: 2,
        question: 'What are the main elements of DAC?',
        answerHint:
          '1. Stable reference voltage source, 2. Precision resistive weighting ladder (R-2R or binary weighted), 3. Electronic analog switches, 4. Op-amp summing/buffer amplifier.'
      },
      {
        questionNumber: 3,
        question: 'What is the advantage of R-2R ladder over binary weighted resistor DAC?',
        answerHint:
          'An R-2R ladder requires only two resistor values (R and 2R) regardless of the number of bits, avoiding the impractically wide resistance ratios and temperature tracking mismatch of binary-weighted DACs.'
      }
    ],
    reviewStatus: {
      isVerified: true,
      flaggedNotes: [
        'Page 19 handwritten calculations evaluate bit combinations as 00->0V, 01->5V, 10->2.5V, 11->7.5V. Measured voltage has small offset due to op-amp input offset and switch contact resistance.'
      ]
    }
  },

  // =========================================================================
  // TOPIC 8: NMIET PCC-204 Exp 06 - Square and Triangular Waveform Generator
  // =========================================================================
  {
    id: 'nmiet-pcc204-exp06-waveform-generator',
    title: 'Design, build & test square and triangular waveform generator using Op-Amp.',
    secondaryRefNumber: 'Experiment No: 06',
    source: {
      college: 'Department of Electronics and Telecommunications Engineering - NMIET (2025-26)',
      subject: 'Electronic Circuits (EC: PCC-204)',
      manualTitle: 'Electronic Circuits - Laboratory Manual',
      originalPracticalNumber: 'Experiment No: 06',
      pageReferences: 'Pages 22–28',
      academicYear: '2025-26'
    },
    category: 'waveforms',
    categoryLabel: 'Waveform Generators & Relaxation Oscillators',
    aim: 'Design, build and test square wave and triangular wave generator using Op-Amp.',
    apparatus: [
      'Op-Amp IC 741 (2 units)',
      'Dual DC Power Supply (±12 V or ±15 V)',
      'Resistors: R1 = 10 kΩ, R2 = 12 kΩ, R3 = 10 kΩ, R = 10 kΩ / 47 kΩ',
      'Capacitors: C = 0.05 µF / 0.1 µF',
      'Cathode Ray Oscilloscope (CRO) / DSO with probes',
      'Breadboard and connecting leads'
    ],
    theory: {
      overview:
        'Square waves belonging to a wide range of frequencies and duty cycle can be generated using the 741 op-amp. The combination of Schmitt trigger and integrator circuit is used to generate square, triangular & saw tooth waveform.\n\nOp-amp A1, which acts as Schmitt trigger compares the voltage at point P (V1) continuously with the inverting input which is at zero potential. When the voltage at point P goes slightly below or above zero volts, the output of A1 is at -Vsat or +Vsat level respectively.\n\nLet’s consider that output of A1 is +Vsat, this positive saturation is an input to integrator A2, therefore the output of integrator will be -Vramp. Thus one end of voltage divider (R2 & R3) is at +Vsat (o/p of A1) other is at -Vramp (o/p of A2).\n\nWhen negative going ramp attains certain value of -Vramp, the potential at point P is slightly below zero potential, hence output of schmitt trigger A1 will switch from +Vsat to -Vsat. Due to negative input at integrator, its output will be +Vramp which is generated by discharging capacitor C. Hence output of A2 will continue to increase until it reaches +Vramp. At this instant potential at point P is slightly above zero potential, hence output of integrator is switched back i.e. from -Vsat to +Vsat. Since slope of an integrator is same, the output is symmetrical i.e. 50% duty cycle.',
      keyPoints: [
        'Closed-loop cascade: Op-Amp A1 acts as an inverting Schmitt trigger; Op-Amp A2 acts as an inverting integrator.',
        'Output of A1 provides the Square Wave swinging between +Vsat and -Vsat.',
        'Output of A2 provides the Triangular Wave ramping between +Vramp and -Vramp.',
        'Symmetrical integration charging/discharging produces an exact 50% duty cycle.',
        'Frequency Fo = R3 / (4 · R1 · R2 · C) or Fo = 1 / T.'
      ],
      equations: [
        {
          label: 'Square Wave Peak-to-Peak Amplitude',
          formula: 'Vo(p-p) = 2 · (R2 / R1) · Vsat  (or 2 · Vsat)'
        },
        {
          label: 'Triangular Wave Peak-to-Peak Amplitude',
          formula: 'Vo(p-p) = 2 · (R1 / R2) · Vsat'
        },
        {
          label: 'Oscillation Time Period',
          formula: 'T = (4 · R1 · R2 · C) / R3'
        },
        {
          label: 'Oscillation Frequency',
          formula: 'Fo = 1 / T = R3 / (4 · R1 · R2 · C)'
        }
      ]
    },
    designCalculations: {
      specifications: [
        'Supply: ±12 V (Vsat ≈ 12 V)',
        'Resistors: R1 = 10 kΩ, R2 = 12 kΩ, R3 = 10 kΩ',
        'Capacitor: C = 0.05 µF',
        'Time period: T = 1.172 ms  ==>  F = 1 / 1.172 ms = 853.3 Hz',
        'Square Wave Amplitude: Vout = 2 · (R2 / R1) · Vsat = 2 · (12k / 10k) · 12 = 28.8 V',
        'Triangular Wave Amplitude: Vout = 2 · (R1 / R2) · Vsat = 2 · (10k / 12k) · 12 = 20 V'
      ],
      formulas: [
        {
          name: 'Oscillation Frequency Calculation',
          formula: 'F = 1 / T = 1 / 1.172 ms = 853.3 Hz',
          description: 'Calculates theoretical repetition frequency.'
        },
        {
          name: 'Square Wave Amplitude',
          formula: 'Vout = 2 · (R2 / R1) · Vsat = 28.8 V',
          description: 'Peak-to-peak amplitude of square wave.'
        },
        {
          name: 'Triangular Wave Amplitude',
          formula: 'Vout = 2 · (R1 / R2) · Vsat = 20 V',
          description: 'Peak-to-peak amplitude of triangular ramp wave.'
        }
      ]
    },
    schematic: {
      topologyName: 'Dual Op-Amp Schmitt Trigger and Integrator Waveform Generator',
      description:
        'Cascaded loop: Op-Amp A1 is connected as a comparator/Schmitt trigger whose output drives the inverting integrator Op-Amp A2 through resistor R and capacitor C. The triangular output of A2 is fed back to the non-inverting input of A1 through resistor network R1 and R2.',
      components: [
        { designation: 'A1', value: 'IC 741', description: 'Schmitt Trigger (Comparator) Op-Amp producing Square Wave' },
        { designation: 'A2', value: 'IC 741', description: 'Inverting Integrator Op-Amp producing Triangular Wave' },
        { designation: 'R', value: '10 kΩ', description: 'Integrator charging series resistor' },
        { designation: 'C', value: '0.05 µF', description: 'Integrator charging capacitor' },
        { designation: 'R1', value: '10 kΩ', description: 'Feedback network divider resistor' },
        { designation: 'R2', value: '12 kΩ', description: 'Feedback network divider resistor' },
        { designation: 'R3', value: '10 kΩ', description: 'Schmitt trigger input resistor' }
      ]
    },
    procedure: [
      '1) Make connections as per the circuit diagram.',
      '2) Observe the waveforms at the output of amplifier A1 (Square wave) and A2 (Triangular wave).',
      '3) Calculate amplitude and frequency of both the waves.',
      '4) Compare practical and theoretical values of frequency and amplitude of both the waves.'
    ],
    mappedCircuitId: 'triangular-wave-generator',
    simulationLimitation: {
      isFullySupported: true,
      mismatchDescription:
        'Directly supported. The existing OPTI-SIM "triangular-wave-generator" module simulates this exact dual-op-amp topology (Schmitt trigger + Integrator loop) and displays both square and triangular outputs.',
      mappedModuleName: 'Triangular Wave Generator'
    },
    graphRequirements: [
      {
        description: 'Synchronized Square and Triangular Waveforms (Page 26 Graph Paper)',
        axes: { x: 'Time (ms)', y: 'Amplitude (V)' },
        expectedBehavior: 'Square wave switches rail-to-rail exactly at the positive and negative peaks of the triangular ramp.'
      }
    ],
    observationTables: [
      {
        id: 'obs-nmiet-generator',
        title: 'Observations Table (Page 27 Manual Readings)',
        subtitle: 'College manual measured values from CRO',
        columns: [
          { key: 'waveform', label: 'Waveform', type: 'text' },
          { key: 'voPp', label: 'Vopp', unit: 'V', type: 'text', placeholder: '27.94' },
          { key: 'period', label: 'Time period', unit: 'ms', type: 'text', placeholder: '1.172 ms' },
          { key: 'freq', label: 'Frequency (fo)', unit: 'Hz', type: 'text', placeholder: '852.3 Hz' },
          { key: 'studentVopp', label: 'Student Measured Vopp', unit: 'V', type: 'number', isMeasured: true },
          { key: 'studentFreq', label: 'Student Measured fo', unit: 'Hz', type: 'number', isMeasured: true }
        ],
        sourceSampleRows: [
          { id: 'wg-1', waveform: '1] Square wave', voPp: '27.94 V', period: '1.172 ms', freq: '852.3 Hz' },
          { id: 'wg-2', waveform: '2] Triangular wave', voPp: '19.34 V', period: '1.172 ms', freq: '853.0 Hz' }
        ],
        defaultStudentRows: [
          { id: 'swg-1', waveform: 'Square wave (A1 Output)', voPp: '27.94 V', period: '1.172 ms', freq: '852.3 Hz', studentVopp: '', studentFreq: '' },
          { id: 'swg-2', waveform: 'Triangular wave (A2 Output)', voPp: '19.34 V', period: '1.172 ms', freq: '853.0 Hz', studentVopp: '', studentFreq: '' }
        ]
      }
    ],
    resultsTable: [
      { parameter: 'Square wave Amplitude (Vp-p)', theoretical: '28.8 V', practical: '27.94 V', unit: 'V' },
      { parameter: 'Square wave Frequency', theoretical: '853.3 Hz', practical: '867.85 Hz', unit: 'Hz' },
      { parameter: 'Triangular wave Amplitude (Vp-p)', theoretical: '20.0 V', practical: '19.34 V', unit: 'V' },
      { parameter: 'Triangular wave Frequency', theoretical: '853.0 Hz', practical: '845.3 Hz', unit: 'Hz' }
    ],
    conclusion:
      'The OP-amp based square and triangular wave generator was designed and tested. The output frequency and amplitude were as expected, confirming proper working of the combined Schmitt trigger and integrator circuit.',
    vivaQuestions: [
      {
        questionNumber: 1,
        question: 'State the applications of comparator.',
        answerHint:
          'Zero-crossing detector, window comparator, pulse width modulator, analog-to-digital flash conversion, level detector, and Schmitt trigger switching.'
      },
      {
        questionNumber: 2,
        question: 'What are the limitations of Op-amp as comparator?',
        answerHint:
          'Slew rate limits switching speed, recovery delay from deep saturation slows down response, absence of built-in hysteresis makes it prone to noise-induced oscillation, and output voltage levels cannot interface directly with TTL/CMOS without level clamping.'
      },
      {
        questionNumber: 3,
        question: 'State advantages of Schmitt Trigger over conventional comparator.',
        answerHint:
          'Built-in hysteresis loop eliminates false transitions caused by noise, provides clean sharp edges for slowly varying signals, and exhibits fast regenerative positive-feedback switching.'
      }
    ],
    reviewStatus: {
      isVerified: true,
      flaggedNotes: [
        'Time period on Page 27 handwritten observations is recorded as 1.172 ms; practical frequency on Page 28 result table is recorded as 867.85 Hz for square wave and 845.3 Hz for triangular wave.'
      ]
    }
  }
];
