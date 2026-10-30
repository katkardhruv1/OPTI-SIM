import { CalculationHistoryEntry, SavedExperimentConfig } from '../types/lab';

const HISTORY_KEY = 'optisim_calc_history_v1';
const SAVED_EXPERIMENTS_KEY = 'optisim_saved_experiments_v1';
const MAX_HISTORY_ENTRIES = 50;

// Safe localStorage getter
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn(`localStorage read failed for ${key}:`, err);
    return null;
  }
}

// Safe localStorage setter
function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`localStorage write failed for ${key}:`, err);
  }
}

/**
 * Retrieves all calculation history entries ordered newest first
 */
export function getCalculationHistory(): CalculationHistoryEntry[] {
  const raw = safeGetItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Appends a new calculation history item
 */
export function addCalculationHistory(entry: Omit<CalculationHistoryEntry, 'id' | 'timestamp' | 'dateFormatted'>): CalculationHistoryEntry {
  const history = getCalculationHistory();
  const now = new Date();
  const newEntry: CalculationHistoryEntry = {
    ...entry,
    id: `calc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    dateFormatted: now.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  };

  const updated = [newEntry, ...history.slice(0, MAX_HISTORY_ENTRIES - 1)];
  safeSetItem(HISTORY_KEY, JSON.stringify(updated));
  return newEntry;
}

/**
 * Deletes a single history item by id
 */
export function deleteCalculationHistory(id: string): void {
  const history = getCalculationHistory().filter((item) => item.id !== id);
  safeSetItem(HISTORY_KEY, JSON.stringify(history));
}

/**
 * Clears all calculation history
 */
export function clearCalculationHistory(): void {
  safeSetItem(HISTORY_KEY, JSON.stringify([]));
}

/**
 * Retrieves all saved experiments
 */
export function getSavedExperiments(): SavedExperimentConfig[] {
  const raw = safeGetItem(SAVED_EXPERIMENTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves or updates an experiment configuration
 */
export function saveExperiment(experiment: Omit<SavedExperimentConfig, 'id' | 'timestamp' | 'dateFormatted'>, existingId?: string): SavedExperimentConfig {
  const all = getSavedExperiments();
  const now = new Date();
  const dateFormatted = now.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  if (existingId) {
    const idx = all.findIndex((x) => x.id === existingId);
    if (idx !== -1) {
      const updatedItem: SavedExperimentConfig = {
        ...all[idx],
        ...experiment,
        timestamp: Date.now(),
        dateFormatted
      };
      all[idx] = updatedItem;
      safeSetItem(SAVED_EXPERIMENTS_KEY, JSON.stringify(all));
      return updatedItem;
    }
  }

  const newItem: SavedExperimentConfig = {
    ...experiment,
    id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    dateFormatted
  };

  const updated = [newItem, ...all];
  safeSetItem(SAVED_EXPERIMENTS_KEY, JSON.stringify(updated));
  return newItem;
}

/**
 * Deletes a saved experiment by id
 */
export function deleteSavedExperiment(id: string): void {
  const all = getSavedExperiments().filter((x) => x.id !== id);
  safeSetItem(SAVED_EXPERIMENTS_KEY, JSON.stringify(all));
}

/**
 * Clears all saved experiments
 */
export function clearSavedExperiments(): void {
  safeSetItem(SAVED_EXPERIMENTS_KEY, JSON.stringify([]));
}
