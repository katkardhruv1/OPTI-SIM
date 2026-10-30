import React, { useState, useEffect, useMemo } from 'react';
import { StudentLogEntry } from '../types/student';
import { getVisitorLogs, clearStoredStudentProfile } from '../utils/studentSync';
import { fetchAdminLogs } from '../utils/api';
import { playTick, playError, playSnap } from '../utils/audioFeedback';
import {
  Terminal,
  X,
  Search,
  Download,
  RotateCcw,
  Users,
  Activity,
  CheckCircle2,
  ShieldCheck,
  Server,
  RefreshCw,
  Lock,
  Unlock,
  KeyRound,
  AlertTriangle
} from 'lucide-react';

export const ADMIN_PASSKEY = 'OPTI-ADMIN';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileReset?: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  onProfileReset
}) => {
  // Phase 18J: Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passkeyInput, setPasskeyInput] = useState<string>('');
  const [authError, setAuthError] = useState<boolean>(false);

  // Telemetry and UI State
  const [logs, setLogs] = useState<StudentLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDivision, setFilterDivision] = useState<string>('all');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Phase 18J: Reset passkey and error on modal close
  useEffect(() => {
    if (!isOpen) {
      setPasskeyInput('');
      setAuthError(false);
    }
  }, [isOpen]);

  // Phase 18J: Conditional Data Fetching - ONLY executes AFTER isAuthenticated is true
  useEffect(() => {
    let isMounted = true;
    if (isOpen && isAuthenticated) {
      setLoading(true);
      fetchAdminLogs()
        .then((data) => {
          if (isMounted) {
            setLogs(data);
          }
        })
        .catch((err) => {
          console.error('[AdminDashboard] Failed to fetch server logs from Google Sheets:', err);
          if (isMounted) {
            setLogs(getVisitorLogs());
          }
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, isAuthenticated]);

  // Phase 18J: Passkey Verification Login Logic
  const handlePasskeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkeyInput === ADMIN_PASSKEY) {
      playSnap();
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      playError();
      setAuthError(true);
    }
  };

  const handlePasskeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    playTick();
    setPasskeyInput(e.target.value);
    if (authError) {
      setAuthError(false);
    }
  };

  // Keyboard shortcut listener for Esc
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        log.fullName.toLowerCase().includes(query) ||
        log.rollNumber.toLowerCase().includes(query) ||
        log.division.toLowerCase().includes(query);

      const matchesDiv = filterDivision === 'all' || log.division.toUpperCase() === filterDivision.toUpperCase();
      return matchesQuery && matchesDiv;
    });
  }, [logs, searchQuery, filterDivision]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = logs.length;
    const active = logs.filter((l) => l.status === 'active').length;
    const totalPracticals = logs.reduce((acc, l) => acc + l.completedPracticals, 0);
    const avgPracticals = total > 0 ? (totalPracticals / total).toFixed(1) : '0';
    return { total, active, totalPracticals, avgPracticals };
  }, [logs]);

  // Handle Export CSV
  const handleExportCSV = () => {
    playTick();
    const headers = ['ID', 'Full Name', 'Roll Number', 'Division', 'Status', 'Last Active', 'Completed Practicals', 'Device / Client'];
    const rows = filteredLogs.map((l) => [
      `"${l.id}"`,
      `"${l.fullName.replace(/"/g, '""')}"`,
      `"${l.rollNumber}"`,
      `"${l.division}"`,
      `"${l.status}"`,
      `"${l.lastActive}"`,
      l.completedPracticals,
      `"${(l.device || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optisim-student-access-logs-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotice('Exported visitor access logs to CSV');
  };

  // Handle Refresh Logs from Google Sheets
  const handleRefreshLogs = () => {
    playTick();
    setLoading(true);
    fetchAdminLogs()
      .then((data) => {
        setLogs(data);
        showNotice('Refreshed live server logs from Google Sheets.');
      })
      .catch((err) => {
        console.error('[AdminDashboard] Failed to refresh server logs:', err);
        showNotice('Failed to refresh from cloud. Retaining cached logs.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Handle Profile Reset (for testing Welcome Modal)
  const handleResetCurrentStudent = () => {
    if (confirm('Reset your local student registration? This will bring up the Welcome Modal again for registration testing.')) {
      playSnap();
      clearStoredStudentProfile();
      fetchAdminLogs()
        .then((data) => setLogs(data))
        .catch(() => setLogs(getVisitorLogs()));
      onProfileReset?.();
      showNotice('Student profile reset. Reopen app to test Welcome Gateway.');
    }
  };

  const showNotice = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => {
      setCopiedNotification(null);
    }, 3500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#0B0F19]/90 backdrop-blur-md select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-dashboard-title"
    >
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-[6px] border border-[#00F0FF]/30 bg-[#1A1E29] shadow-[0_0_40px_rgba(0,240,255,0.18)] overflow-hidden">
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-[#0B0F19] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[3px] bg-[#111520] border border-[#00F0FF]/50 flex items-center justify-center text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.3)]">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white text-sm sm:text-base">
                  OPTI-SIM Central Admin Console
                </span>
                {!isAuthenticated ? (
                  <span className="text-[10px] font-mono font-bold text-[#FF5722] bg-[#FF5722]/15 border border-[#FF5722]/30 px-1.5 py-0.5 rounded flex items-center gap-1.5">
                    <Lock className="w-2.5 h-2.5 text-[#FF5722]" />
                    RESTRICTED ACCESS
                  </span>
                ) : loading ? (
                  <span className="text-[10px] font-mono font-bold text-[#00F0FF] bg-[#00F0FF]/15 border border-[#00F0FF]/30 px-1.5 py-0.5 rounded flex items-center gap-1.5">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    FETCHING SERVER LOGS...
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold text-[#10B981] bg-[#10B981]/15 border border-[#10B981]/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    LIVE TELEMETRY
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Visitor Access Tracking, Student Rosters &amp; Lab Passport Completion Logs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={() => {
                  playTick();
                  setIsAuthenticated(false);
                  setPasskeyInput('');
                  setAuthError(false);
                }}
                className="px-2 py-1 rounded-[3px] bg-[#111520] hover:bg-[#FF5722]/15 border border-[#FF5722]/40 text-[#FF5722] text-[11px] font-mono flex items-center gap-1.5 transition cursor-pointer"
                title="Lock Console"
              >
                <Lock className="w-3 h-3" />
                <span className="hidden sm:inline">Lock Console</span>
              </button>
            )}
            <span className="hidden sm:inline-block text-[11px] font-mono text-slate-500 bg-[#111520] px-2 py-1 rounded border border-white/5">
              Ctrl+Shift+A
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              title="Close Admin Console (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice Toast */}
        {copiedNotification && (
          <div className="bg-[#00F0FF]/15 border-b border-[#00F0FF]/30 px-4 py-1.5 text-xs font-mono text-[#00F0FF] flex items-center justify-between animate-fadeIn">
            <span>✓ {copiedNotification}</span>
            <button onClick={() => setCopiedNotification(null)} className="text-xs text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* CONDITIONAL RENDERING: RestrictedAccessGate vs DataLogTable */}
        {!isAuthenticated ? (
          /* ==================================================
             RESTRICTED ACCESS GATE (LOGIN SCREEN)
             ================================================== */
          <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
            <div className="relative w-full max-w-md rounded-[6px] border border-[#FF5722]/50 bg-[#0B0F19] p-6 sm:p-8 shadow-[0_0_35px_rgba(255,87,34,0.22)] overflow-hidden">
              {/* Top Decorative Neon Orange Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF5722] via-[#FFA000] to-[#FF5722]" />

              {/* Padlock Icon in Neon Orange */}
              <div className="mx-auto w-14 h-14 rounded-[4px] bg-[#111520] border border-[#FF5722]/60 flex items-center justify-center text-[#FF5722] shadow-[0_0_20px_rgba(255,87,34,0.35)] mb-4">
                <Lock className="w-7 h-7" />
              </div>

              {/* Heading and Notice */}
              <div className="text-center space-y-1.5 mb-6">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#FF5722]/15 text-[#FF5722] border border-[#FF5722]/30 text-[10px] font-mono font-bold tracking-wider uppercase">
                  <ShieldCheck className="w-3 h-3 text-[#FF5722]" />
                  Secure Administrator Gate
                </div>
                <h3 className="text-lg font-bold font-mono text-white tracking-tight">
                  Restricted Access: Admin Only
                </h3>
                <p className="text-xs font-sans text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Central student telemetry, live visitor tracking, and cloud observer logs require instructor authentication.
                </p>
              </div>

              {/* Passkey Input Form */}
              <form onSubmit={handlePasskeySubmit} className="space-y-4 font-mono text-xs">
                <div className="space-y-1.5 text-left">
                  <label className="flex items-center justify-between text-slate-300 font-medium">
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#FF5722]" />
                      Admin Passkey
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Case-sensitive</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      autoFocus
                      value={passkeyInput}
                      onChange={handlePasskeyChange}
                      placeholder="Enter passkey..."
                      className={`w-full px-3.5 py-2.5 rounded-[3px] bg-[#111520] border text-white placeholder-slate-600 focus:outline-hidden transition text-xs font-mono tracking-wider ${
                        authError
                          ? 'border-[#FF5722] focus:border-[#FF5722] ring-1 ring-[#FF5722] shadow-[0_0_12px_rgba(255,87,34,0.35)]'
                          : 'border-white/15 focus:border-[#00F0FF] focus:shadow-[0_0_10px_rgba(0,240,255,0.25)]'
                      }`}
                    />
                  </div>

                  {/* Error Message */}
                  {authError && (
                    <div className="flex items-center gap-1.5 text-[#FF5722] text-[11px] font-mono pt-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Invalid Passkey</span>
                    </div>
                  )}
                </div>

                {/* Submit Button styled with Neon Cyan */}
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-[3px] bg-[#00F0FF] hover:bg-[#00D2E0] active:bg-[#00B8C4] text-[#0B0F19] font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(0,240,255,0.35)] transition-all cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Unlock Dashboard</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* ==================================================
             DATA LOG TABLE & TELEMETRY DASHBOARD
             ================================================== */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="p-3.5 rounded-[4px] bg-[#0B0F19] border border-white/10 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Total Roster</span>
                  <Users className="w-3.5 h-3.5 text-[#00F0FF]" />
                </div>
                <div className="text-xl font-bold text-white tracking-tight">{stats.total}</div>
                <p className="text-[10px] text-slate-500">Students Tracked</p>
              </div>

              <div className="p-3.5 rounded-[4px] bg-[#0B0F19] border border-white/10 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Active Now</span>
                  <Activity className="w-3.5 h-3.5 text-[#10B981]" />
                </div>
                <div className="text-xl font-bold text-[#10B981] tracking-tight">{stats.active}</div>
                <p className="text-[10px] text-slate-500">Live Lab Sessions</p>
              </div>

              <div className="p-3.5 rounded-[4px] bg-[#0B0F19] border border-white/10 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Practicals Done</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00F0FF]" />
                </div>
                <div className="text-xl font-bold text-[#00F0FF] tracking-tight">{stats.totalPracticals}</div>
                <p className="text-[10px] text-slate-500">Cumulative Stamps</p>
              </div>

              <div className="p-3.5 rounded-[4px] bg-[#0B0F19] border border-white/10 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Avg Progress</span>
                  <Server className="w-3.5 h-3.5 text-[#FF5722]" />
                </div>
                <div className="text-xl font-bold text-[#FF5722] tracking-tight">{stats.avgPracticals} / 8</div>
                <p className="text-[10px] text-slate-500">Exps per Student</p>
              </div>
            </div>

            {/* Search, Filter & Actions Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono text-xs">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    playTick();
                    setSearchQuery(e.target.value);
                  }}
                  placeholder="Search by name, roll no, or division..."
                  className="w-full pl-9 pr-3 py-2 rounded-[3px] bg-[#0B0F19] border border-white/15 text-white placeholder-slate-600 focus:outline-hidden focus:border-[#00F0FF] transition"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Division Selector */}
                <select
                  value={filterDivision}
                  onChange={(e) => {
                    playTick();
                    setFilterDivision(e.target.value);
                  }}
                  className="px-2.5 py-2 rounded-[3px] bg-[#0B0F19] border border-white/15 text-white text-xs cursor-pointer focus:outline-hidden focus:border-[#00F0FF]"
                >
                  <option value="all">All Divisions</option>
                  <option value="A">Division A</option>
                  <option value="B">Division B</option>
                  <option value="C">Division C</option>
                  <option value="D">Division D</option>
                </select>

                {/* Refresh Server Logs */}
                <button
                  onClick={handleRefreshLogs}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-[3px] bg-[#111520] hover:bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] transition cursor-pointer disabled:opacity-50"
                  title="Fetch latest server logs from Google Sheets"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>{loading ? 'Fetching...' : 'Refresh Logs'}</span>
                </button>

                {/* Export CSV */}
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-[3px] bg-[#111520] hover:bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] transition cursor-pointer"
                  title="Download CSV table of student logs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                {/* Reset Profile (Testing) */}
                <button
                  onClick={handleResetCurrentStudent}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-[3px] bg-[#111520] hover:bg-[#FF5722]/15 border border-[#FF5722]/40 text-[#FF5722] transition cursor-pointer"
                  title="Reset local student profile to test Welcome Gateway"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Test Gateway</span>
                </button>
              </div>
            </div>

            {/* Student Access Logs Table */}
            <div className="rounded-[4px] border border-white/10 bg-[#0B0F19] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#111520] text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3.5 font-semibold">Status</th>
                      <th className="py-2.5 px-3.5 font-semibold">Student Name</th>
                      <th className="py-2.5 px-3.5 font-semibold">Roll No</th>
                      <th className="py-2.5 px-3.5 font-semibold">Division</th>
                      <th className="py-2.5 px-3.5 font-semibold">Completed Practicals</th>
                      <th className="py-2.5 px-3.5 font-semibold">Last Active</th>
                      <th className="py-2.5 px-3.5 font-semibold hidden md:table-cell">Client Platform</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <div className="relative">
                              <div className="w-8 h-8 rounded-full border-2 border-[#00F0FF]/20 border-t-[#00F0FF] animate-spin" />
                              <Server className="w-3.5 h-3.5 text-[#00F0FF] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-white font-mono text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2">
                                <span>Fetching Server Logs...</span>
                              </p>
                              <p className="text-[11px] font-mono text-slate-400">
                                Querying Google Sheets Apps Script Web App endpoint
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                          No student access records matching the current filter.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => {
                        const isActive = log.status === 'active';
                        const isIdle = log.status === 'idle';
                        const percentComplete = Math.min(100, Math.round((log.completedPracticals / 8) * 100));

                        return (
                          <tr
                            key={log.id}
                            className={`hover:bg-white/[0.03] transition ${
                              log.isCurrentUser ? 'bg-[#00F0FF]/[0.04]' : ''
                            }`}
                          >
                            {/* Status Dot */}
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    isActive
                                      ? 'bg-[#10B981] shadow-[0_0_8px_#10B981]'
                                      : isIdle
                                      ? 'bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]'
                                      : 'bg-slate-600'
                                  }`}
                                />
                                <span
                                  className={`text-[10px] uppercase font-bold ${
                                    isActive
                                      ? 'text-[#10B981]'
                                      : isIdle
                                      ? 'text-[#F59E0B]'
                                      : 'text-slate-500'
                                  }`}
                                >
                                  {log.status}
                                </span>
                              </div>
                            </td>

                            {/* Student Name */}
                            <td className="py-3 px-3.5 font-bold text-white whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span>{log.fullName}</span>
                                {log.isCurrentUser && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 tracking-wider">
                                    YOU (CURRENT)
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Roll Number */}
                            <td className="py-3 px-3.5 text-slate-300 font-semibold whitespace-nowrap">
                              {log.rollNumber}
                            </td>

                            {/* Division */}
                            <td className="py-3 px-3.5 text-slate-300 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded text-[11px] bg-[#111520] border border-white/10 text-[#00F0FF] font-bold">
                                DIV {log.division}
                              </span>
                            </td>

                            {/* Completed Practicals Progress Bar */}
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div className="w-24 h-2 rounded-full bg-[#111520] border border-white/10 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-[#00F0FF] to-[#10B981] transition-all"
                                    style={{ width: `${percentComplete}%` }}
                                  />
                                </div>
                                <span className="text-white font-bold text-[11px]">
                                  {log.completedPracticals} / 8
                                </span>
                                <span className="text-[10px] text-slate-500">({percentComplete}%)</span>
                              </div>
                            </td>

                            {/* Last Active */}
                            <td className="py-3 px-3.5 text-slate-400 whitespace-nowrap">
                              {log.lastActive}
                            </td>

                            {/* Client Platform */}
                            <td className="py-3 px-3.5 text-slate-500 text-[11px] hidden md:table-cell whitespace-nowrap">
                              {log.device || 'Standard Web Browser'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cloud Sync Backend Integration Info Box */}
            <div className="p-4 rounded-[4px] bg-[#0B0F19] border border-white/10 font-mono space-y-2 text-xs">
              <div className="flex items-center justify-between text-white font-bold border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#00F0FF]" />
                  <span>Google Sheets Apps Script Cloud Telemetry</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  HOOK WIRED &amp; ACTIVE
                </span>
              </div>
              <p className="text-slate-400 font-sans text-xs leading-relaxed">
                Student identities registered through the Identity Gateway are dispatched directly to the Google Sheets backend using{' '}
                <code className="text-[#00F0FF] bg-[#111520] px-1 py-0.5 rounded font-mono">
                  syncStudentProfile(profileData)
                </code>, and live administrative logs are retrieved dynamically via{' '}
                <code className="text-[#00F0FF] bg-[#111520] px-1 py-0.5 rounded font-mono">
                  fetchAdminLogs()
                </code>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Backwards-compatible export alias for any direct AdminDashboard imports
export const AdminDashboard = AdminDashboardModal;
