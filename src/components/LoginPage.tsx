import React, { useState } from 'react';
import { Zap, ShieldCheck, User, Lock, ArrowRight, HardHat, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppUser, UserRole } from '../types';

interface LoginPageProps {
  users: AppUser[];
  onLogin: (user: AppUser) => void;
  initialRole?: UserRole;
  onCancel?: () => void;
}

export function LoginPage({ users, onLogin, initialRole = 'user', onCancel }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('••••••••');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const demoUsers = users.filter((u) => u.role === selectedRole);

  const handleSelectDemo = (u: AppUser) => {
    setUsernameInput(u.username);
    setPasswordInput('password123');
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const trimmed = usernameInput.trim().toLowerCase();
      if (!trimmed) {
        setErrorMsg('Please enter a valid username, email, or meter ID.');
        setIsSubmitting(false);
        return;
      }

      // Match user by username or email or meter
      const matched = users.find(
        (u) =>
          u.role === selectedRole &&
          (u.username.toLowerCase() === trimmed ||
            u.email.toLowerCase() === trimmed ||
            (u.meterNumber && u.meterNumber.toLowerCase() === trimmed))
      );

      if (matched) {
        onLogin(matched);
      } else {
        // Allow fallback creation of user for seamless demoing
        const newUser: AppUser = {
          id: `usr-${Date.now()}`,
          username: trimmed.replace(/[^a-z0-9_]/gi, '_'),
          fullName: trimmed
            .split(/[._-]/)
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(' '),
          role: selectedRole,
          email: `${trimmed}@gridpulse.local`,
          meterNumber: selectedRole === 'user' ? `BLR-${Math.floor(100000 + Math.random() * 900000)}` : undefined,
          locality: selectedRole === 'user' ? 'Indiranagar Stage 2, Bengaluru' : 'BESCOM Central Control Room, Bengaluru',
          badgeTitle: selectedRole === 'admin' ? 'BESCOM Grid Dispatcher' : 'Bengaluru Resident',
        };
        onLogin(newUser);
      }
      setIsSubmitting(false);
    }, 300);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-6 px-4">
      <div className="max-w-xl w-full">
        {/* TOP BRANDING CARD */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 shadow-xl shadow-cyan-600/30 mb-3">
            <Zap className="w-8 h-8 text-white fill-current" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            VOLTPULSE ACCESS PORTAL
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Locality Grid Telemetry & Citizen Outage Response Infrastructure
          </p>
        </div>

        {/* AUTH CONTAINER */}
        <div className="bg-[#0B111E] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div
            className={`absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
              selectedRole === 'admin' ? 'bg-amber-500/15' : 'bg-cyan-500/15'
            }`}
          />

          {/* ROLE SELECTOR TABS */}
          <div className="relative mb-6">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
              Select Your Access Role
            </label>
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
              <button
                type="button"
                id="login-role-tab-user"
                onClick={() => {
                  setSelectedRole('user');
                  setUsernameInput('');
                  setErrorMsg(null);
                }}
                className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  selectedRole === 'user'
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 border border-cyan-400/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Resident Citizen</span>
              </button>

              <button
                type="button"
                id="login-role-tab-admin"
                onClick={() => {
                  setSelectedRole('admin');
                  setUsernameInput('');
                  setErrorMsg(null);
                }}
                className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 border border-amber-400/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <HardHat className="w-4 h-4" />
                <span>Utility Admin / Dispatcher</span>
              </button>
            </div>
          </div>

          {/* ROLE BADGE BANNER */}
          <div
            className={`p-3.5 rounded-xl border mb-6 text-xs flex items-start gap-3 transition-colors ${
              selectedRole === 'admin'
                ? 'bg-amber-950/25 border-amber-800/40 text-amber-300'
                : 'bg-cyan-950/25 border-cyan-800/40 text-cyan-300'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {selectedRole === 'admin' ? (
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              )}
            </div>
            <div>
              <span className="font-bold block">
                {selectedRole === 'admin'
                  ? 'Administrator & Dispatcher Level 3 Clearance'
                  : 'Citizen Resident Self-Service Portal'}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {selectedRole === 'admin'
                  ? 'Access operational GIS map, inspect live citizen reports, and reassign usernames across reported issues.'
                  : 'Track household electricity status, report outages, receive restoration ETAs, and review local safety advisories.'}
              </p>
            </div>
          </div>

          {/* LOGIN FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="login-username"
                className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1"
              >
                {selectedRole === 'admin' ? 'Admin Username / Dispatcher ID' : 'Resident Username / Meter ID'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login-username"
                  type="text"
                  required
                  placeholder={
                    selectedRole === 'admin'
                      ? 'e.g. johndoe_admin or sarah_dispatch'
                      : 'e.g. elena_r or MTR-994102'
                  }
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 transition font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="login-password"
                  className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block"
                >
                  Password / SCADA PIN
                </label>
                <span className="text-[10px] text-slate-500">Any password accepted for testing</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 transition font-mono"
                />
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                selectedRole === 'admin'
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/30'
                  : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-900/30'
              } disabled:opacity-50`}
            >
              <span>
                {isSubmitting
                  ? 'Verifying Node Credentials...'
                  : selectedRole === 'admin'
                  ? 'Authenticate Dispatcher & Enter Dashboard'
                  : 'Sign In to Resident Outage Portal'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* QUICK DEMO ONE-CLICK SELECTOR */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
              Quick 1-Click Demo Profiles ({selectedRole === 'admin' ? 'Admin Controllers' : 'Residents'})
            </span>
            <div className="space-y-1.5">
              {demoUsers.map((u) => (
                <button
                  key={u.id}
                  id={`demo-user-${u.username}`}
                  type="button"
                  onClick={() => handleSelectDemo(u)}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold font-mono text-white ${
                        selectedRole === 'admin' ? 'bg-amber-900/60 text-amber-300' : 'bg-cyan-900/60 text-cyan-300'
                      }`}
                    >
                      {u.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                        <span>{u.fullName}</span>
                        <span className="font-mono text-[10px] text-slate-400">@{u.username}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {u.badgeTitle} {u.meterNumber ? `• ${u.meterNumber}` : ''}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-cyan-400 opacity-80 group-hover:opacity-100 shrink-0 ml-2">
                    Use Profile →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RETURN BUTTON IF MODAL/SWITCHING */}
        {onCancel && (
          <div className="mt-4 text-center">
            <button
              type="button"
              id="login-cancel-btn"
              onClick={onCancel}
              className="text-xs text-slate-400 hover:text-white px-4 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
            >
              ← Return to Dashboard / Portal
            </button>
          </div>
        )}

        {/* FOOTER NOTICE */}
        <div className="mt-4 text-center text-[11px] text-slate-500">
          VoltPulse Locality Grid OS • Encrypted Telemetry Link v4.1 • SCADA Auth Gateway
        </div>
      </div>
    </div>
  );
}
