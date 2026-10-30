import { SYLLABUS_PRACTICALS_REGISTRY } from '../data/syllabusRegistry';

export const PASSPORT_STORAGE_KEY = 'optisim_lab_passport_progress';
export const OPTI_SIM_PASSPORT_UPDATE_EVENT = 'optisim_passport_update';

export interface PracticalPassportRecord {
  topicId: string;
  completed: boolean;
  simulationRun: boolean;
  tableInteracted: boolean;
  completedAt?: string;
  verifiedBy?: string;
  observationsCount?: number;
}

export type LabPassportState = Record<string, PracticalPassportRecord>;

/**
 * Reads current passport progress from localStorage.
 * Automatically inspects existing saved observations for backwards compatibility.
 */
export function getLabPassportProgress(): LabPassportState {
  let state: LabPassportState = {};

  try {
    const raw = localStorage.getItem(PASSPORT_STORAGE_KEY);
    if (raw) {
      state = JSON.parse(raw);
    }
  } catch {
    state = {};
  }

  // Ensure all 8 topics are tracked in state
  let hasUpdates = false;
  for (const topic of SYLLABUS_PRACTICALS_REGISTRY) {
    if (!state[topic.id]) {
      // Check if user already had observations or conclusions in localStorage
      let hasSavedObs = false;
      let totalSavedRows = 0;
      for (const tbl of topic.observationTables) {
        try {
          const savedRowsRaw = localStorage.getItem(`optisim_syllabus_obs_${topic.id}_${tbl.id}`);
          if (savedRowsRaw) {
            const rows = JSON.parse(savedRowsRaw);
            if (Array.isArray(rows) && rows.length > 0) {
              hasSavedObs = true;
              totalSavedRows += rows.length;
            }
          }
        } catch {
          // ignore
        }
      }

      const hasConclusion = !!localStorage.getItem(`optisim_syllabus_conclusion_${topic.id}`);
      const tableInteracted = hasSavedObs || hasConclusion;
      // If student already has custom observations saved, consider simulation run as well
      const simulationRun = hasSavedObs;
      const completed = simulationRun && tableInteracted;

      state[topic.id] = {
        topicId: topic.id,
        completed,
        simulationRun,
        tableInteracted,
        observationsCount: totalSavedRows,
        completedAt: completed ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
        verifiedBy: completed ? 'OPTI-SIM VIRTUAL LAB ENGINE' : undefined,
      };
      hasUpdates = true;
    }
  }

  if (hasUpdates) {
    savePassportProgress(state, false);
  }

  return state;
}

/**
 * Saves passport progress to localStorage and emits an update event.
 */
export function savePassportProgress(state: LabPassportState, emitEvent = true): void {
  try {
    localStorage.setItem(PASSPORT_STORAGE_KEY, JSON.stringify(state));
    if (emitEvent && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(OPTI_SIM_PASSPORT_UPDATE_EVENT, { detail: state }));
    }
  } catch {
    // ignore
  }
}

/**
 * Check if a specific practical is completed.
 */
export function isPracticalCompleted(topicId: string): boolean {
  const progress = getLabPassportProgress();
  return !!progress[topicId]?.completed;
}

/**
 * Records that the simulation was successfully run for this topic.
 * If table interaction condition is also satisfied, automatically completes practical.
 */
export function recordSimulationRun(topicId: string): PracticalPassportRecord {
  const state = getLabPassportProgress();
  const current = state[topicId] || {
    topicId,
    completed: false,
    simulationRun: false,
    tableInteracted: false,
  };

  current.simulationRun = true;
  if (current.tableInteracted && !current.completed) {
    current.completed = true;
    current.completedAt = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    current.verifiedBy = 'OPTI-SIM VIRTUAL LAB ENGINE';
  }

  state[topicId] = current;
  savePassportProgress(state);
  return current;
}

/**
 * Records that the student interacted with the observation table or generated results.
 * If simulation run condition is also satisfied, automatically completes practical.
 */
export function recordTableInteraction(topicId: string, rowsCount?: number): PracticalPassportRecord {
  const state = getLabPassportProgress();
  const current = state[topicId] || {
    topicId,
    completed: false,
    simulationRun: false,
    tableInteracted: false,
  };

  current.tableInteracted = true;
  if (rowsCount !== undefined) {
    current.observationsCount = rowsCount;
  }

  if (current.simulationRun && !current.completed) {
    current.completed = true;
    current.completedAt = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    current.verifiedBy = 'OPTI-SIM VIRTUAL LAB ENGINE';
  }

  state[topicId] = current;
  savePassportProgress(state);
  return current;
}

/**
 * Explicitly marks a practical as Verified / Completed.
 */
export function markPracticalVerified(topicId: string): PracticalPassportRecord {
  const state = getLabPassportProgress();
  const current: PracticalPassportRecord = {
    ...(state[topicId] || {}),
    topicId,
    simulationRun: true,
    tableInteracted: true,
    completed: true,
    completedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    verifiedBy: 'OPTI-SIM VIRTUAL LAB ENGINE',
  };

  state[topicId] = current;
  savePassportProgress(state);
  return current;
}

/**
 * Resets verification status for a specific practical.
 */
export function unmarkPracticalVerified(topicId: string): PracticalPassportRecord {
  const state = getLabPassportProgress();
  const current: PracticalPassportRecord = {
    ...(state[topicId] || {}),
    topicId,
    completed: false,
    completedAt: undefined,
    verifiedBy: undefined,
  };

  state[topicId] = current;
  savePassportProgress(state);
  return current;
}

/**
 * Resets all passport progress.
 */
export function resetAllPassportProgress(): void {
  const state: LabPassportState = {};
  for (const topic of SYLLABUS_PRACTICALS_REGISTRY) {
    state[topic.id] = {
      topicId: topic.id,
      completed: false,
      simulationRun: false,
      tableInteracted: false,
    };
  }
  savePassportProgress(state);
}

/**
 * Returns overall statistics for the Milestone Passport.
 */
export function getPassportSummary() {
  const progress = getLabPassportProgress();
  const totalCount = SYLLABUS_PRACTICALS_REGISTRY.length;
  let completedCount = 0;

  for (const topic of SYLLABUS_PRACTICALS_REGISTRY) {
    if (progress[topic.id]?.completed) {
      completedCount++;
    }
  }

  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllCompleted = completedCount === totalCount && totalCount > 0;

  return {
    completedCount,
    totalCount,
    percentage,
    isAllCompleted,
  };
}
