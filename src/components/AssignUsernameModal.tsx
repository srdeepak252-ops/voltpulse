import React, { useState } from 'react';
import { UserCheck, X, AlertCircle, Sparkles, Hash, Check } from 'lucide-react';
import { CustomerReport, AppUser } from '../types';

interface AssignUsernameModalProps {
  report: CustomerReport;
  incidentCode: string;
  users: AppUser[];
  onClose: () => void;
  onSave: (reportId: string, newUsername: string, updatedResidentName?: string) => void;
}

export function AssignUsernameModal({
  report,
  incidentCode,
  users,
  onClose,
  onSave,
}: AssignUsernameModalProps) {
  const [username, setUsername] = useState(report.username || report.residentName?.toLowerCase().replace(/\s+/g, '_') || 'citizen_user');
  const [residentName, setResidentName] = useState(report.residentName || 'Locality Resident');
  const [selectedExistingUserId, setSelectedExistingUserId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectExistingUser = (userId: string) => {
    setSelectedExistingUserId(userId);
    const found = users.find((u) => u.id === userId);
    if (found) {
      setUsername(found.username);
      setResidentName(found.fullName);
    }
  };

  const handleApplyPreset = (presetName: string) => {
    setUsername(presetName);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().replace(/^@/, '').toLowerCase();
    if (!cleanUsername) {
      setErrorMsg('Username cannot be empty.');
      return;
    }
    if (!/^[a-z0-9_.-]+$/i.test(cleanUsername)) {
      setErrorMsg('Username can only contain letters, numbers, underscores, dashes, and periods.');
      return;
    }

    onSave(report.id, cleanUsername, residentName.trim());
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0B111E] border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-auto">
        <button
          id="close-assign-username-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white tracking-tight">
              Assign & Reassign Reporter Username
            </h2>
            <p className="text-xs text-slate-400">
              Admin dispatch control for incident <span className="font-mono text-cyan-400">{incidentCode}</span>
            </p>
          </div>
        </div>

        {/* CURRENT REPORT CONTEXT */}
        <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl mb-5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Report ID:</span>
            <span className="font-mono text-slate-300">{report.id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Associated Meter:</span>
            <span className="font-mono text-cyan-400">{report.meterNumber}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Current Assigned Username:</span>
            <span className="font-mono font-bold text-amber-300">
              @{report.username || 'unassigned'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Address / Locality:</span>
            <span className="text-slate-300 truncate max-w-[220px]">{report.addressText}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* QUICK SELECT FROM REGISTERED CITIZENS */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Option A: Assign from Registered User Directory
            </label>
            <select
              value={selectedExistingUserId}
              onChange={(e) => handleSelectExistingUser(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition cursor-pointer"
            >
              <option value="">-- Choose registered citizen profile --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} (@{u.username}) • {u.role.toUpperCase()} {u.meterNumber ? `[${u.meterNumber}]` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* CUSTOM USERNAME INPUT */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Option B: Assign Custom Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-mono text-xs">
                @
              </div>
              <input
                id="assign-custom-username-input"
                type="text"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.replace(/^@/, ''));
                  setErrorMsg(null);
                }}
                placeholder="e.g. elena_ward9 or hospital_facility_rep"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono transition"
              />
            </div>

            {/* Quick suggested aliases */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" /> Presets:
              </span>
              {[
                `res_${report.meterNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
                `ward9_citizen`,
                `priority_reporter`,
                `verified_caller`,
              ].map((alias) => (
                <button
                  type="button"
                  key={alias}
                  onClick={() => handleApplyPreset(alias)}
                  className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-800 transition font-mono cursor-pointer"
                >
                  @{alias}
                </button>
              ))}
            </div>
          </div>

          {/* DISPLAY NAME */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Reporter Display Name
            </label>
            <input
              type="text"
              value={residentName}
              onChange={(e) => setResidentName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="confirm-assign-username-btn"
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5 shadow-lg shadow-amber-900/30 transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirm & Assign Username</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
