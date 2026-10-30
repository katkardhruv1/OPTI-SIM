/**
 * OPTI-SIM API Utility
 * Phase 18I: Google Sheets Apps Script Cloud Hook
 * 
 * Provides live synchronization of student profiles and telemetry retrieval
 * from Google Sheets Apps Script Web App.
 */

import { StudentLogEntry } from '../types/student';
import { MOCK_STUDENT_LOGS, getStoredStudentProfile } from './studentSync';

export const WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbzKU99HTtbME0orOGnRRS35ajxw4PMnk9yRPTDD0utxih7uuie1fDT6OnMoJmCnmtDo/exec';

export interface StudentProfilePayload {
  fullName: string;
  name?: string;
  rollNumber: string;
  roll?: string;
  division: string;
  div?: string;
  lastActive?: string;
  timestamp?: string;
  completedPracticals?: number;
  completedPracticalsCount?: number;
  device?: string;
  userAgent?: string;
  [key: string]: any;
}

/**
 * Sends student profile data to Google Sheets via POST request with 'no-cors' mode.
 * Catches network errors gracefully without crashing the application.
 */
export async function syncStudentProfile(profileData: StudentProfilePayload | any): Promise<boolean> {
  try {
    console.log('[OPTI-SIM API] Syncing student profile to Google Sheets...', profileData);

    await fetch(WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify(profileData),
      mode: 'no-cors'
    });

    console.log('[OPTI-SIM API] Student profile POST dispatched successfully to Google Sheets (no-cors mode).');
    return true;
  } catch (error) {
    console.error('[OPTI-SIM API] Failed to sync student profile to Google Sheets:', error);
    return false;
  }
}

/**
 * Normalizes raw row data from Google Sheets into the standard StudentLogEntry format.
 */
function normalizeSheetRecord(item: any, index: number): StudentLogEntry {
  const name =
    item.fullName ||
    item.name ||
    item['Student Name'] ||
    item['Full Name'] ||
    `Student #${index + 1}`;

  const roll = String(
    item.rollNumber ||
    item.roll ||
    item.rollNo ||
    item['Roll Number'] ||
    item['Roll No'] ||
    `210${(index + 10).toString().padStart(2, '0')}`
  );

  const div = String(
    item.division ||
    item.div ||
    item.section ||
    item['Division'] ||
    'A'
  ).toUpperCase();

  const practicals = Number(
    item.completedPracticals ??
    item.completed ??
    item.practicals ??
    item['Completed Practicals'] ??
    0
  );

  const lastActiveStr =
    item.lastActive ||
    item.timestamp ||
    item.date ||
    item['Last Active'] ||
    item['Timestamp'] ||
    'Recently';

  let status: 'active' | 'idle' | 'offline' = 'active';
  const rawStatus = String(item.status || item.Status || '').toLowerCase();
  if (rawStatus.includes('idle')) status = 'idle';
  else if (rawStatus.includes('off')) status = 'offline';
  else if (rawStatus.includes('act')) status = 'active';
  else {
    // Default heuristic based on index
    status = index % 3 === 0 ? 'active' : index % 3 === 1 ? 'idle' : 'offline';
  }

  const clientDevice =
    item.device ||
    item.platform ||
    item['Device'] ||
    item['Client Platform'] ||
    'Standard Web Browser';

  return {
    id: item.id || `sheet_${roll}_${index}`,
    fullName: name,
    rollNumber: roll,
    division: div,
    completedPracticals: isNaN(practicals) ? 0 : practicals,
    lastActive: lastActiveStr,
    status,
    device: clientDevice
  };
}

/**
 * Fetches admin visitor logs from Google Sheets via GET request.
 * Returns parsed JSON array normalized into StudentLogEntry format.
 * If the network fails or endpoint is unreachable, falls back gracefully.
 */
export async function fetchAdminLogs(): Promise<StudentLogEntry[]> {
  try {
    console.log('[OPTI-SIM API] Fetching live admin visitor logs from Google Sheets Web App...');

    const response = await fetch(WEB_APP_URL, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script responded with HTTP status ${response.status}`);
    }

    const json = await response.json();
    console.log('[OPTI-SIM API] Raw response from Google Sheets:', json);

    // Parse array if root is an array or nested under logs / data / records
    const rawList: any[] = Array.isArray(json)
      ? json
      : Array.isArray(json?.logs)
      ? json.logs
      : Array.isArray(json?.records)
      ? json.records
      : Array.isArray(json?.data)
      ? json.data
      : [];

    if (rawList.length > 0) {
      const normalizedRemote = rawList.map((row, idx) => normalizeSheetRecord(row, idx));

      // Prepend current user if logged in
      const current = getStoredStudentProfile();
      if (current) {
        const currentUserLog: StudentLogEntry = {
          id: `current_user_${current.rollNumber}`,
          fullName: current.fullName,
          rollNumber: current.rollNumber,
          division: current.division,
          lastActive: 'Online now',
          completedPracticals: current.completedPracticalsCount ?? 0,
          status: 'active',
          device: typeof navigator !== 'undefined' ? `${navigator.platform} (Current Session)` : 'Local Browser',
          isCurrentUser: true
        };
        // Avoid duplicate if current user is already present in remote list
        const filtered = normalizedRemote.filter((r) => r.rollNumber !== current.rollNumber);
        return [currentUserLog, ...filtered];
      }

      return normalizedRemote;
    }

    // If Google Sheets returns an empty array, fall back to mock logs
    console.warn('[OPTI-SIM API] Google Sheets returned empty data array, falling back to local records.');
    return getFallbackLogs();
  } catch (error) {
    console.error('[OPTI-SIM API] Error fetching admin logs from Google Sheets:', error);
    // Graceful fallback: return mock logs + current user so dashboard remains fully functional
    return getFallbackLogs();
  }
}

/**
 * Generates fallback logs (current user + baseline mock entries) if network request fails.
 */
function getFallbackLogs(): StudentLogEntry[] {
  const current = getStoredStudentProfile();
  const logs: StudentLogEntry[] = [];

  if (current) {
    logs.push({
      id: `current_user_${current.rollNumber}`,
      fullName: current.fullName,
      rollNumber: current.rollNumber,
      division: current.division,
      lastActive: 'Online now',
      completedPracticals: current.completedPracticalsCount ?? 0,
      status: 'active',
      device: typeof navigator !== 'undefined' ? `${navigator.platform} (Current Session)` : 'Local Browser',
      isCurrentUser: true
    });
  }

  logs.push(...MOCK_STUDENT_LOGS);
  return logs;
}
