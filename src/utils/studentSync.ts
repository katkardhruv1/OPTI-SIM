/**
 * OPTI-SIM Student Identity & Cloud Synchronization Stub
 * 
 * Phase 18H: Decoupled student tracking and cloud integration interface.
 * Connects the Student Identity Gateway, PDF Report Generator, and Admin Dashboard.
 */

import { StudentProfile, StudentLogEntry } from '../types/student';
import { getLabPassportProgress } from './labPassportStorage';

export const STUDENT_PROFILE_STORAGE_KEY = 'optisim_student_profile';
export const ALT_STUDENT_PROFILE_KEY = 'optiSimProfile';
export const STUDENT_ACCESS_LOGS_KEY = 'optisim_student_visitor_logs';
export const STUDENT_PROFILE_UPDATE_EVENT = 'optisim_student_profile_update';

/**
 * Retrieves the currently saved student profile from localStorage.
 */
export function getStoredStudentProfile(): StudentProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ALT_STUDENT_PROFILE_KEY) || localStorage.getItem(STUDENT_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const name = parsed.fullName || parsed.name;
    const roll = parsed.rollNumber || parsed.roll;
    const div = parsed.division || parsed.div;
    if (name && roll && div) {
      return {
        fullName: name,
        division: div,
        rollNumber: roll,
        joinedAt: parsed.joinedAt || new Date().toLocaleString(),
        lastActive: parsed.lastActive || new Date().toLocaleString(),
        completedPracticalsCount: parsed.completedPracticalsCount ?? getCompletedPracticalsCount()
      };
    }
  } catch {
    // ignore parsing errors
  }
  return null;
}

/**
 * Saves and updates the student profile locally, syncing backwards-compatible keys.
 */
export function saveStudentProfile(profileInput: {
  fullName: string;
  division: string;
  rollNumber: string;
}): StudentProfile {
  const existing = getStoredStudentProfile();
  const nowStr = new Date().toLocaleString();

  const profile: StudentProfile = {
    fullName: profileInput.fullName.trim(),
    division: profileInput.division.trim().toUpperCase(),
    rollNumber: profileInput.rollNumber.trim(),
    joinedAt: existing?.joinedAt || nowStr,
    lastActive: nowStr,
    completedPracticalsCount: getCompletedPracticalsCount()
  };

  try {
    const serialized = JSON.stringify(profile);
    localStorage.setItem(ALT_STUDENT_PROFILE_KEY, serialized);
    localStorage.setItem(STUDENT_PROFILE_STORAGE_KEY, serialized);
    // Backwards compatibility for Lab Mode student name
    localStorage.setItem('optisim_student_name', profile.fullName);
  } catch (err) {
    console.error('Failed to save student profile locally:', err);
  }

  // Trigger live cloud sync to Google Sheets
  syncStudentProfile(profile).catch((err) => {
    console.warn('Google Sheets cloud sync background warning:', err);
  });

  // Notify active components of update
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STUDENT_PROFILE_UPDATE_EVENT, { detail: profile }));
  }

  return profile;
}

/**
 * Updates the student's last active timestamp whenever an action occurs.
 */
export function touchStudentActivity(): void {
  const current = getStoredStudentProfile();
  if (!current) return;
  const updated: StudentProfile = {
    ...current,
    lastActive: new Date().toLocaleString(),
    completedPracticalsCount: getCompletedPracticalsCount()
  };
  try {
    localStorage.setItem(STUDENT_PROFILE_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

/**
 * Clears the stored student profile (used by Admin to reset or test welcome modal).
 */
export function clearStoredStudentProfile(): void {
  try {
    localStorage.removeItem(ALT_STUDENT_PROFILE_KEY);
    localStorage.removeItem(STUDENT_PROFILE_STORAGE_KEY);
    localStorage.removeItem('optisim_student_name');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(STUDENT_PROFILE_UPDATE_EVENT, { detail: null }));
    }
  } catch {
    // ignore
  }
}

/**
 * Helper to calculate actual completed practical count from Lab Mode Passport.
 */
export function getCompletedPracticalsCount(): number {
  try {
    const passport = getLabPassportProgress();
    return Object.values(passport).filter((item) => item.completed).length;
  } catch {
    return 0;
  }
}

/**
 * =======================================================================
 * GOOGLE SHEETS LIVE CLOUD SYNC HOOK (PHASE 18I)
 * =======================================================================
 * Wires student registration data directly to the live Google Apps Script endpoint.
 */
export async function syncStudentProfile(profileData: StudentProfile): Promise<void> {
  const payload = {
    action: 'registerStudent',
    fullName: profileData.fullName,
    name: profileData.fullName,
    rollNumber: profileData.rollNumber,
    roll: profileData.rollNumber,
    division: profileData.division,
    div: profileData.division,
    joinedAt: profileData.joinedAt,
    lastActive: profileData.lastActive,
    completedPracticals: profileData.completedPracticalsCount ?? getCompletedPracticalsCount(),
    device: typeof navigator !== 'undefined' ? `${navigator.platform} (${navigator.userAgent})` : 'Web Browser',
    timestamp: new Date().toISOString()
  };

  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzKU99HTtbME0orOGnRRS35ajxw4PMnk9yRPTDD0utxih7uuie1fDT6OnMoJmCnmtDo/exec';

  try {
    console.log('[OPTI-SIM CLOUD SYNC] Broadcasting student profile to Google Sheets...', payload);

    await fetch(WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      mode: 'no-cors'
    });

    console.log('[OPTI-SIM CLOUD SYNC] Google Sheets POST completed successfully (no-cors).');
  } catch (error) {
    console.error('[OPTI-SIM CLOUD SYNC] Network error while syncing to Google Sheets:', error);
  }
}

/**
 * Mock + Live Student Logs for the Admin Dashboard.
 */
export const MOCK_STUDENT_LOGS: StudentLogEntry[] = [
  {
    id: 'mock_1',
    fullName: 'Aarav Sharma',
    rollNumber: '21045',
    division: 'A',
    lastActive: 'Just now',
    completedPracticals: 7,
    status: 'active',
    device: 'Desktop Chrome / Windows 11'
  },
  {
    id: 'mock_2',
    fullName: 'Pooja Kulkarni',
    rollNumber: '21088',
    division: 'B',
    lastActive: '12 mins ago',
    completedPracticals: 8,
    status: 'active',
    device: 'MacBook Air / macOS Sonoma'
  },
  {
    id: 'mock_3',
    fullName: 'Rohan Deshmukh',
    rollNumber: '21012',
    division: 'A',
    lastActive: '1 hour ago',
    completedPracticals: 4,
    status: 'idle',
    device: 'Linux Firefox / Ubuntu 24.04'
  },
  {
    id: 'mock_4',
    fullName: 'Neha Patil',
    rollNumber: '21063',
    division: 'C',
    lastActive: 'Yesterday at 4:30 PM',
    completedPracticals: 6,
    status: 'offline',
    device: 'Windows 10 / Edge'
  },
  {
    id: 'mock_5',
    fullName: 'Siddharth Joshi',
    rollNumber: '21033',
    division: 'B',
    lastActive: '2 days ago',
    completedPracticals: 2,
    status: 'offline',
    device: 'iPad Pro / Safari'
  }
];

/**
 * Returns complete visitor logs combining the live active user session with historical records.
 */
export function getVisitorLogs(): StudentLogEntry[] {
  const currentProfile = getStoredStudentProfile();
  const logs: StudentLogEntry[] = [];

  if (currentProfile) {
    logs.push({
      id: `current_user_${currentProfile.rollNumber}`,
      fullName: currentProfile.fullName,
      rollNumber: currentProfile.rollNumber,
      division: currentProfile.division,
      lastActive: 'Online now',
      completedPracticals: getCompletedPracticalsCount(),
      status: 'active',
      device: typeof navigator !== 'undefined' ? `${navigator.platform} (Current Session)` : 'Local Browser',
      isCurrentUser: true
    });
  }

  // Append mock records
  logs.push(...MOCK_STUDENT_LOGS);
  return logs;
}
