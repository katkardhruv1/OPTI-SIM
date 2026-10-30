/**
 * Types and interfaces for the OPTI-SIM Manual Circuit Builder
 * Strictly derived from SPPU / College Laboratory Syllabus Practical Requirements
 */

export type BuilderComponentType =
  | 'op-amp'
  | 'resistor'
  | 'capacitor'
  | 'diode'
  | 'ac-source'
  | 'dc-source'
  | 'vcc'
  | 'vee'
  | 'ground';

export type ComponentCategory = 'active' | 'passive' | 'sources' | 'reference';

export interface TerminalDefinition {
  id: string;
  name: string;
  label: string;
  x: number; // relative offset from component center at 0° rotation
  y: number;
  isOptional?: boolean; // e.g. op-amp supply pins can have default internal rails
  description: string;
}

export interface ComponentSpecification {
  type: BuilderComponentType;
  category: ComponentCategory;
  displayName: string;
  symbolDescription: string;
  prefix: string; // e.g. 'R', 'C', 'U', 'D', 'Vin'
  terminals: TerminalDefinition[];
  defaultParams: Record<string, any>;
  supportedUnits?: Record<string, string[]>;
  syllabusNote: string;
}

export interface BuilderComponent {
  id: string;
  type: BuilderComponentType;
  label: string; // e.g. 'R1', 'U1', 'Vin'
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
  params: Record<string, any>;
  customName?: string;
}

export interface BuilderWire {
  id: string;
  fromCompId: string;
  fromTerminalId: string;
  toCompId: string;
  toTerminalId: string;
}

export type IssueSeverity = 'error' | 'warning' | 'info';

export interface CircuitValidationIssue {
  id: string;
  severity: IssueSeverity;
  message: string;
  componentId?: string;
  terminalId?: string;
}

export type SupportedTopologyType =
  | 'inverting-amplifier'
  | 'non-inverting-amplifier'
  | 'voltage-follower'
  | 'practical-integrator'
  | 'inverting-schmitt-trigger'
  | 'open-loop-comparator'
  | 'unsupported';

export interface DetectedTopology {
  type: SupportedTopologyType;
  displayName: string;
  isSimulatable: boolean;
  confidence: number;
  componentsMapped: Record<string, string>; // e.g. { opAmp: 'c_1', rin: 'c_2', rf: 'c_3', vin: 'c_4' }
  explanation: string;
}

export interface SavedCircuitSchema {
  schemaVersion: 1;
  id: string;
  circuitName: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  components: BuilderComponent[];
  wires: BuilderWire[];
  canvas: {
    zoom: number;
    panX: number;
    panY: number;
  };
}

export type CircuitDocument = SavedCircuitSchema;

export interface PresetCircuitTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  syllabusReference: string;
  components: BuilderComponent[];
  wires: BuilderWire[];
  expectedTopology: SupportedTopologyType;
}
