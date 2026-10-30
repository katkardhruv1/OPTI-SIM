export interface SyllabusSourceRef {
  college: string;
  department?: string;
  subject: string;
  subjectCode?: string;
  manualTitle: string;
  originalPracticalNumber?: string;
  pageReferences: string;
  classInfo?: string;
  academicYear?: string;
}

export interface SyllabusObservationColumn {
  key: string;
  label: string;
  unit?: string;
  type?: 'number' | 'text';
  placeholder?: string;
  isSimulated?: boolean;
  isCalculated?: boolean;
  isMeasured?: boolean;
}

export interface SyllabusObservationRow {
  id: string;
  [key: string]: any;
}

export interface SyllabusObservationTable {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  columns: SyllabusObservationColumn[];
  sourceSampleRows?: SyllabusObservationRow[]; // Verbatim readings from college manual
  defaultStudentRows: SyllabusObservationRow[];
}

export interface SyllabusDesignFormula {
  name: string;
  formula: string;
  description?: string;
  calculationNote?: string;
}

export interface SyllabusSchematicSpec {
  topologyName: string;
  description: string;
  components: Array<{
    designation: string;
    value: string;
    description: string;
  }>;
  diagramNotes?: string[];
}

export interface SyllabusResultTableItem {
  parameter: string;
  theoretical: string;
  simulated?: string;
  sourceManual?: string;
  studentMeasured?: string;
  practical: string;
  unit?: string;
  remarks?: string;
}

export interface SyllabusVivaQuestion {
  questionNumber: number;
  question: string;
  answerHint?: string;
}

export interface SyllabusReviewStatus {
  isVerified: boolean;
  flaggedNotes?: string[];
}

export interface SyllabusSimulationLimitation {
  isFullySupported: boolean;
  mismatchDescription?: string;
  mappedModuleName?: string;
  opAmpEquivalentNote?: string;
}

export interface SyllabusTopic {
  id: string; // Stable unique ID e.g. 'nmiet-ica-exp06-precision-rectifier'
  title: string; // Exact title from manual
  secondaryRefNumber: string; // e.g. "Experiment No: 06"
  source: SyllabusSourceRef;
  category: 'linear' | 'non-linear' | 'data-conversion' | 'feedback-amplifiers' | 'waveforms';
  categoryLabel: string;
  aim: string;
  objectives?: string[];
  apparatus: string[];
  theory: {
    overview: string;
    keyPoints: string[];
    equations?: Array<{ label: string; formula: string; explanation?: string }>;
    supplementaryNotes?: string[];
  };
  designCalculations?: {
    specifications?: string[];
    formulas: SyllabusDesignFormula[];
    sampleCalculations?: string[];
    reviewNotes?: string[];
  };
  schematic: SyllabusSchematicSpec;
  procedure: string[];
  mappedCircuitId?: string; // Links to existing OPTI-SIM circuit module if compatible
  simulationLimitation?: SyllabusSimulationLimitation;
  graphRequirements?: {
    description: string;
    axes: { x: string; y: string };
    expectedBehavior: string;
  }[];
  observationTables: SyllabusObservationTable[];
  resultsTable?: SyllabusResultTableItem[];
  resultStatement?: string;
  conclusion: string;
  vivaQuestions?: SyllabusVivaQuestion[];
  referenceBooks?: string[];
  reviewStatus: SyllabusReviewStatus;
}
