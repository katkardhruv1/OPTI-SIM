export interface StudentProfile {
  fullName: string;
  division: string;
  rollNumber: string;
  joinedAt: string;
  lastActive: string;
  completedPracticalsCount?: number;
  completedPracticals?: number;
}

export interface StudentLogEntry {
  id: string;
  fullName: string;
  rollNumber: string;
  division: string;
  lastActive: string;
  completedPracticals: number;
  status: 'active' | 'idle' | 'offline';
  device?: string;
  isCurrentUser?: boolean;
}
