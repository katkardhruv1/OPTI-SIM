export interface ObservationColumn {
  key: string;
  label: string;
  unit?: string;
  type?: 'number' | 'text';
  placeholder?: string;
}

export interface ObservationRow {
  id: string;
  [key: string]: any;
}

export interface TheoreticalVsSimulatedItem {
  parameter: string;
  theoretical: number | string;
  simulated: number | string;
  errorPercent: number | string;
  unit: string;
  formulaExplanation?: string;
}

export interface LabExperimentMeta {
  id: string; // matches circuit id
  experimentNumber: number;
  title: string;
  category: 'linear' | 'non-linear' | 'data-conversion';
  aim: string;
  theory: {
    principle: string;
    mainEquation: string;
    assumptions: string[];
    circuitRelationship: string;
  };
  formulas: Array<{
    label: string;
    formula: string;
    description?: string;
  }>;
  procedure: string[];
  defaultObservationColumns: ObservationColumn[];
  defaultObservationRows: ObservationRow[];
  generateComparison: (inputs?: any, results?: any) => TheoreticalVsSimulatedItem[];
  generateResult: (inputs?: any, results?: any) => string;
  conclusion: string;
}

export interface CalculationHistoryEntry {
  id: string;
  timestamp: number;
  dateFormatted: string;
  circuitId: string;
  circuitName: string;
  category: string;
  inputsSummary: string;
  outputsSummary: string;
  keyMetrics: Record<string, string | number>;
}

export interface SavedExperimentConfig {
  id: string;
  timestamp: number;
  dateFormatted: string;
  experimentNumber: number;
  title: string;
  circuitId: string;
  studentName?: string;
  inputs?: any;
  observations: ObservationRow[];
  notes: string;
}
