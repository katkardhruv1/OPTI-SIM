import {
  BuilderComponentType,
  ComponentSpecification,
  PresetCircuitTemplate,
  TerminalDefinition
} from '../../types/circuitBuilder';

export const SYLLABUS_COMPONENT_SPECIFICATIONS: Record<BuilderComponentType, ComponentSpecification> = {
  'op-amp': {
    type: 'op-amp',
    category: 'active',
    displayName: 'Operational Amplifier (LM741 / UA741)',
    symbolDescription: 'Standard 8-pin dual-supply op-amp with inverting (-), non-inverting (+), output, +Vcc, and -Vee pins',
    prefix: 'U',
    terminals: [
      { id: 'in-', name: 'Inverting Input', label: '-', x: -40, y: -15, description: 'Pin 2: Inverting (-) Input Terminal' },
      { id: 'in+', name: 'Non-Inverting Input', label: '+', x: -40, y: 15, description: 'Pin 3: Non-Inverting (+) Input Terminal' },
      { id: 'out', name: 'Output', label: 'OUT', x: 40, y: 0, description: 'Pin 6: Amplified Output Terminal' },
      { id: 'vcc', name: 'Positive Supply Rail', label: '+Vcc', x: 0, y: -30, isOptional: true, description: 'Pin 7: Positive DC Supply (+15V default)' },
      { id: 'vee', name: 'Negative Supply Rail', label: '-Vee', x: 0, y: 30, isOptional: true, description: 'Pin 4: Negative DC Supply (-15V default)' }
    ],
    defaultParams: {
      model: 'LM741',
      posVsat: 15,
      negVsat: -15
    },
    syllabusNote: 'Core active element in SPPU SE ENTC practicals (Inverting, Integrator, Schmitt Trigger, Comparator).'
  },

  'resistor': {
    type: 'resistor',
    category: 'passive',
    displayName: 'Resistor (Passive Divider / Feedback)',
    symbolDescription: 'Standard ANSI/IEEE zigzag linear resistance element',
    prefix: 'R',
    terminals: [
      { id: 't1', name: 'Terminal 1', label: '1', x: -35, y: 0, description: 'Left / Input terminal' },
      { id: 't2', name: 'Terminal 2', label: '2', x: 35, y: 0, description: 'Right / Output terminal' }
    ],
    defaultParams: {
      value: 10,
      unit: 'kΩ'
    },
    supportedUnits: {
      unit: ['Ω', 'kΩ', 'MΩ']
    },
    syllabusNote: 'Used for input scaling (R1, R3), feedback loops (Rf), positive divider legs (R2), and offset compensation (Rcomp).'
  },

  'capacitor': {
    type: 'capacitor',
    category: 'passive',
    displayName: 'Capacitor (Feedback / Filter)',
    symbolDescription: 'Dual parallel plate electrostatic capacitor',
    prefix: 'C',
    terminals: [
      { id: 't1', name: 'Terminal 1', label: '1', x: -25, y: 0, description: 'Lead 1 terminal' },
      { id: 't2', name: 'Terminal 2', label: '2', x: 25, y: 0, description: 'Lead 2 terminal' }
    ],
    defaultParams: {
      value: 0.01,
      unit: 'µF'
    },
    supportedUnits: {
      unit: ['pF', 'nF', 'µF', 'mF']
    },
    syllabusNote: 'Used in practical Integrator (Cf = 0.01 µF), Differentiator (C = 0.01 µF), and Active Low/High Pass Filter networks.'
  },

  'diode': {
    type: 'diode',
    category: 'passive',
    displayName: 'Semiconductor Diode (1N4148 / Rectifier)',
    symbolDescription: 'Standard PN junction diode with triangular anode and vertical cathode line',
    prefix: 'D',
    terminals: [
      { id: 'anode', name: 'Anode', label: 'A', x: -25, y: 0, description: 'Positive / Anode terminal' },
      { id: 'cathode', name: 'Cathode', label: 'K', x: 25, y: 0, description: 'Negative / Cathode terminal (banded end)' }
    ],
    defaultParams: {
      model: '1N4148',
      vDrop: 0.7
    },
    syllabusNote: 'Used in NMIET Exp 06 Precision Half-Wave Rectifier / Superdiode to eliminate 0.7V threshold knee.'
  },

  'ac-source': {
    type: 'ac-source',
    category: 'sources',
    displayName: 'AC Function Generator (Vin)',
    symbolDescription: 'AC signal source with sinusoidal or periodic test waveform',
    prefix: 'Vin',
    terminals: [
      { id: 'pos', name: 'Signal Output (+)', label: '+', x: 0, y: -25, description: 'Active signal output terminal' },
      { id: 'neg', name: 'Reference (-)', label: '-', x: 0, y: 25, description: 'Common reference / return terminal' }
    ],
    defaultParams: {
      amplitude: 1.0,
      frequency: 1000,
      waveform: 'sine',
      offset: 0
    },
    supportedUnits: {
      waveform: ['sine', 'square', 'triangle']
    },
    syllabusNote: 'Laboratory function generator input: typically 1.0 Vp-p at 1 kHz (or 2.5 V peak for Schmitt trigger testing).'
  },

  'dc-source': {
    type: 'dc-source',
    category: 'sources',
    displayName: 'DC Reference / Bias Source (Vref)',
    symbolDescription: 'Independent regulated DC voltage reference source',
    prefix: 'Vdc',
    terminals: [
      { id: 'pos', name: 'Positive (+)', label: '+', x: 0, y: -25, description: 'Positive DC voltage terminal' },
      { id: 'neg', name: 'Negative (-)', label: '-', x: 0, y: 25, description: 'Negative / return terminal' }
    ],
    defaultParams: {
      voltage: 2.5
    },
    syllabusNote: 'Regulated DC bias source for Comparator reference (Vref), Summing Amplifier DC inputs, and PWM reference.'
  },

  'vcc': {
    type: 'vcc',
    category: 'sources',
    displayName: '+Vcc Power Supply Rail (+15V)',
    symbolDescription: 'Positive DC power supply rail for op-amp pin 7',
    prefix: 'VCC',
    terminals: [
      { id: 'out', name: '+Vcc Terminal', label: '+', x: 0, y: 20, description: 'Positive power supply distribution node' }
    ],
    defaultParams: {
      voltage: 15
    },
    syllabusNote: 'Dual DC Power Supply (+15V) powering op-amp positive rail (Pin 7).'
  },

  'vee': {
    type: 'vee',
    category: 'sources',
    displayName: '-Vee Power Supply Rail (-15V)',
    symbolDescription: 'Negative DC power supply rail for op-amp pin 4',
    prefix: 'VEE',
    terminals: [
      { id: 'out', name: '-Vee Terminal', label: '-', x: 0, y: -20, description: 'Negative power supply distribution node' }
    ],
    defaultParams: {
      voltage: -15
    },
    syllabusNote: 'Dual DC Power Supply (-15V) powering op-amp negative rail (Pin 4).'
  },

  'ground': {
    type: 'ground',
    category: 'reference',
    displayName: 'Circuit Ground Reference (0V GND)',
    symbolDescription: 'Common 0V potential ground point',
    prefix: 'GND',
    terminals: [
      { id: 'gnd', name: 'Ground Node', label: 'GND', x: 0, y: -15, description: '0V Reference Ground Node' }
    ],
    defaultParams: {},
    syllabusNote: 'Common laboratory ground required by all syllabus circuit topologies.'
  }
};

/**
 * Helper to compute absolute coordinates of a terminal given component position & rotation
 */
export function getTerminalAbsoluteCoords(
  compX: number,
  compY: number,
  rotation: 0 | 90 | 180 | 270,
  termDef: TerminalDefinition
): { x: number; y: number } {
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.round(Math.cos(rad));
  const sin = Math.round(Math.sin(rad));

  const rotatedX = termDef.x * cos - termDef.y * sin;
  const rotatedY = termDef.x * sin + termDef.y * cos;

  return {
    x: compX + rotatedX,
    y: compY + rotatedY
  };
}

/**
 * Authentic syllabus practical templates for quick-start assembly & verification
 */
export const SYLLABUS_PRESET_TEMPLATES: PresetCircuitTemplate[] = [
  {
    id: 'preset-inverting-amp',
    title: 'Inverting Op-Amp Amplifier (Av = -10)',
    category: 'Linear Amplifiers',
    description: 'Classic inverting amplifier with R1 = 10 kΩ, Rf = 100 kΩ, Av = -10, 180° phase inversion, and non-inverting terminal grounded.',
    syllabusReference: 'SPPU SE ENTC PCC-204 / Linear IC Laboratory',
    expectedTopology: 'inverting-amplifier',
    components: [
      {
        id: 'u1',
        type: 'op-amp',
        label: 'U1',
        x: 440,
        y: 260,
        rotation: 0,
        params: { model: 'LM741', posVsat: 15, negVsat: -15 }
      },
      {
        id: 'r1',
        type: 'resistor',
        label: 'R1',
        x: 280,
        y: 245,
        rotation: 0,
        params: { value: 10, unit: 'kΩ' }
      },
      {
        id: 'rf',
        type: 'resistor',
        label: 'Rf',
        x: 440,
        y: 150,
        rotation: 0,
        params: { value: 100, unit: 'kΩ' }
      },
      {
        id: 'vin1',
        type: 'ac-source',
        label: 'Vin',
        x: 140,
        y: 245,
        rotation: 0,
        params: { amplitude: 1.0, frequency: 1000, waveform: 'sine', offset: 0 }
      },
      {
        id: 'gnd1',
        type: 'ground',
        label: 'GND1',
        x: 140,
        y: 350,
        rotation: 0,
        params: {}
      },
      {
        id: 'gnd2',
        type: 'ground',
        label: 'GND2',
        x: 360,
        y: 350,
        rotation: 0,
        params: {}
      }
    ],
    wires: [
      { id: 'w1', fromCompId: 'vin1', fromTerminalId: 'pos', toCompId: 'r1', toTerminalId: 't1' },
      { id: 'w2', fromCompId: 'r1', fromTerminalId: 't2', toCompId: 'u1', toTerminalId: 'in-' },
      { id: 'w3', fromCompId: 'r1', fromTerminalId: 't2', toCompId: 'rf', toTerminalId: 't1' },
      { id: 'w4', fromCompId: 'rf', fromTerminalId: 't2', toCompId: 'u1', toTerminalId: 'out' },
      { id: 'w5', fromCompId: 'u1', fromTerminalId: 'in+', toCompId: 'gnd2', toTerminalId: 'gnd' },
      { id: 'w6', fromCompId: 'vin1', fromTerminalId: 'neg', toCompId: 'gnd1', toTerminalId: 'gnd' }
    ]
  },

  {
    id: 'preset-schmitt-trigger',
    title: 'Inverting Schmitt Trigger (NMIET Exp 03)',
    category: 'Nonlinear Switching',
    description: 'Authentic college laboratory Schmitt Trigger: R1 = 100 Ω, R2 = 4.7 kΩ, ±Vsat = ±2.0 V, VUTP = +1.958 V, VLTP = -1.958 V, VH = 3.917 V.',
    syllabusReference: 'NMIET PCC-204 Exp 03 (Pages 7–12)',
    expectedTopology: 'inverting-schmitt-trigger',
    components: [
      {
        id: 'u1',
        type: 'op-amp',
        label: 'U1',
        x: 440,
        y: 260,
        rotation: 0,
        params: { model: 'LM741', posVsat: 2.0, negVsat: -2.0 }
      },
      {
        id: 'r3',
        type: 'resistor',
        label: 'R3',
        x: 280,
        y: 245,
        rotation: 0,
        params: { value: 100, unit: 'Ω' }
      },
      {
        id: 'r1',
        type: 'resistor',
        label: 'R1',
        x: 440,
        y: 380,
        rotation: 0,
        params: { value: 100, unit: 'Ω' }
      },
      {
        id: 'r2',
        type: 'resistor',
        label: 'R2',
        x: 340,
        y: 380,
        rotation: 90,
        params: { value: 4.7, unit: 'kΩ' }
      },
      {
        id: 'vin1',
        type: 'ac-source',
        label: 'Vin',
        x: 140,
        y: 245,
        rotation: 0,
        params: { amplitude: 2.5, frequency: 1000, waveform: 'sine', offset: 0 }
      },
      {
        id: 'gnd1',
        type: 'ground',
        label: 'GND1',
        x: 140,
        y: 350,
        rotation: 0,
        params: {}
      },
      {
        id: 'gnd2',
        type: 'ground',
        label: 'GND2',
        x: 340,
        y: 470,
        rotation: 0,
        params: {}
      }
    ],
    wires: [
      { id: 'w1', fromCompId: 'vin1', fromTerminalId: 'pos', toCompId: 'r3', toTerminalId: 't1' },
      { id: 'w2', fromCompId: 'r3', fromTerminalId: 't2', toCompId: 'u1', toTerminalId: 'in-' },
      { id: 'w3', fromCompId: 'u1', fromTerminalId: 'out', toCompId: 'r1', toTerminalId: 't2' },
      { id: 'w4', fromCompId: 'r1', fromTerminalId: 't1', toCompId: 'u1', toTerminalId: 'in+' },
      { id: 'w5', fromCompId: 'u1', fromTerminalId: 'in+', toCompId: 'r2', toTerminalId: 't1' },
      { id: 'w6', fromCompId: 'r2', fromTerminalId: 't2', toCompId: 'gnd2', toTerminalId: 'gnd' },
      { id: 'w7', fromCompId: 'vin1', fromTerminalId: 'neg', toCompId: 'gnd1', toTerminalId: 'gnd' }
    ]
  },

  {
    id: 'preset-integrator',
    title: 'Practical Inverting Integrator (NMIET Exp 02)',
    category: 'Calculus Circuits',
    description: 'Stabilized op-amp integrator with input resistor R1 = 1.5 kΩ, shunt resistor Rf = 15.9 kΩ, and feedback capacitor Cf = 0.01 µF.',
    syllabusReference: 'NMIET PCC-204 Exp 02 / PES MCOE Exp 03',
    expectedTopology: 'practical-integrator',
    components: [
      {
        id: 'u1',
        type: 'op-amp',
        label: 'U1',
        x: 440,
        y: 260,
        rotation: 0,
        params: { model: 'LM741', posVsat: 15, negVsat: -15 }
      },
      {
        id: 'r1',
        type: 'resistor',
        label: 'R1',
        x: 280,
        y: 245,
        rotation: 0,
        params: { value: 1.5, unit: 'kΩ' }
      },
      {
        id: 'rf',
        type: 'resistor',
        label: 'Rf',
        x: 440,
        y: 130,
        rotation: 0,
        params: { value: 15.9, unit: 'kΩ' }
      },
      {
        id: 'cf',
        type: 'capacitor',
        label: 'Cf',
        x: 440,
        y: 180,
        rotation: 0,
        params: { value: 0.01, unit: 'µF' }
      },
      {
        id: 'vin1',
        type: 'ac-source',
        label: 'Vin',
        x: 140,
        y: 245,
        rotation: 0,
        params: { amplitude: 1.0, frequency: 1000, waveform: 'square', offset: 0 }
      },
      {
        id: 'gnd1',
        type: 'ground',
        label: 'GND1',
        x: 140,
        y: 350,
        rotation: 0,
        params: {}
      },
      {
        id: 'gnd2',
        type: 'ground',
        label: 'GND2',
        x: 360,
        y: 350,
        rotation: 0,
        params: {}
      }
    ],
    wires: [
      { id: 'w1', fromCompId: 'vin1', fromTerminalId: 'pos', toCompId: 'r1', toTerminalId: 't1' },
      { id: 'w2', fromCompId: 'r1', fromTerminalId: 't2', toCompId: 'u1', toTerminalId: 'in-' },
      { id: 'w3', fromCompId: 'r1', fromTerminalId: 't2', toCompId: 'cf', toTerminalId: 't1' },
      { id: 'w4', fromCompId: 'cf', fromTerminalId: 't1', toCompId: 'rf', toTerminalId: 't1' },
      { id: 'w5', fromCompId: 'cf', fromTerminalId: 't2', toCompId: 'u1', toTerminalId: 'out' },
      { id: 'w6', fromCompId: 'rf', fromTerminalId: 't2', toCompId: 'u1', toTerminalId: 'out' },
      { id: 'w7', fromCompId: 'u1', fromTerminalId: 'in+', toCompId: 'gnd2', toTerminalId: 'gnd' },
      { id: 'w8', fromCompId: 'vin1', fromTerminalId: 'neg', toCompId: 'gnd1', toTerminalId: 'gnd' }
    ]
  },

  {
    id: 'preset-voltage-follower',
    title: 'Unity-Gain Voltage Follower (Buffer)',
    category: 'Linear Amplifiers',
    description: 'High input impedance buffer with 100% negative feedback (Av = 1.0, phase shift 0°).',
    syllabusReference: 'General Op-Amp Laboratory Buffer Section',
    expectedTopology: 'voltage-follower',
    components: [
      {
        id: 'u1',
        type: 'op-amp',
        label: 'U1',
        x: 440,
        y: 260,
        rotation: 0,
        params: { model: 'LM741', posVsat: 15, negVsat: -15 }
      },
      {
        id: 'vin1',
        type: 'ac-source',
        label: 'Vin',
        x: 220,
        y: 275,
        rotation: 0,
        params: { amplitude: 2.0, frequency: 1000, waveform: 'sine', offset: 0 }
      },
      {
        id: 'gnd1',
        type: 'ground',
        label: 'GND1',
        x: 220,
        y: 370,
        rotation: 0,
        params: {}
      }
    ],
    wires: [
      { id: 'w1', fromCompId: 'vin1', fromTerminalId: 'pos', toCompId: 'u1', toTerminalId: 'in+' },
      { id: 'w2', fromCompId: 'u1', fromTerminalId: 'out', toCompId: 'u1', toTerminalId: 'in-' },
      { id: 'w3', fromCompId: 'vin1', fromTerminalId: 'neg', toCompId: 'gnd1', toTerminalId: 'gnd' }
    ]
  },

  {
    id: 'preset-comparator',
    title: 'Voltage Level Detector (Comparator)',
    category: 'Nonlinear Switching',
    description: 'Open-loop high-gain comparator switching between ±Vsat when Vin exceeds Vref.',
    syllabusReference: 'General Op-Amp Level Detector Section',
    expectedTopology: 'open-loop-comparator',
    components: [
      {
        id: 'u1',
        type: 'op-amp',
        label: 'U1',
        x: 440,
        y: 260,
        rotation: 0,
        params: { model: 'LM741', posVsat: 15, negVsat: -15 }
      },
      {
        id: 'vin1',
        type: 'ac-source',
        label: 'Vin',
        x: 220,
        y: 245,
        rotation: 0,
        params: { amplitude: 3.0, frequency: 1000, waveform: 'sine', offset: 0 }
      },
      {
        id: 'vdc1',
        type: 'dc-source',
        label: 'Vref',
        x: 220,
        y: 350,
        rotation: 0,
        params: { voltage: 1.0 }
      },
      {
        id: 'gnd1',
        type: 'ground',
        label: 'GND1',
        x: 120,
        y: 380,
        rotation: 0,
        params: {}
      }
    ],
    wires: [
      { id: 'w1', fromCompId: 'vin1', fromTerminalId: 'pos', toCompId: 'u1', toTerminalId: 'in-' },
      { id: 'w2', fromCompId: 'vdc1', fromTerminalId: 'pos', toCompId: 'u1', toTerminalId: 'in+' },
      { id: 'w3', fromCompId: 'vin1', fromTerminalId: 'neg', toCompId: 'gnd1', toTerminalId: 'gnd' },
      { id: 'w4', fromCompId: 'vdc1', fromTerminalId: 'neg', toCompId: 'gnd1', toTerminalId: 'gnd' }
    ]
  }
];
