import React, { useState } from 'react';
import {
  Zap,
  Users,
  Activity,
  Radio,
  ShieldCheck,
  LogOut,
  User,
  HardHat,
  ChevronDown,
  UserCheck,
  Home
} from 'lucide-react';
import { AppUser } from '../types';

interface NavbarProps {
  activeTab: 'start' | 'resident' | 'dispatcher';
  setActiveTab: (tab: 'start' | 'resident' | 'dispatcher') => void;
  broadcastMessage: string;
  currentUser: AppUser | null;
  onLogout: () => void;
  onOpenLogin: (role?: 'user' | 'admin') => void;
  onOpenUserManagement: () => void;
}

export function Navbar({
  activeTab,
  setActiveTab,
  broadcastMessage,
  currentUser,
  onLogout,
  onOpenLogin,
  onOpenUserManagement,
}: NavbarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  return (
    <>
      {/* GLOBAL TOP APPLICATION BAR */}
      <header className="h-16 border-b border-slate-800 bg-[#0B111E] px-4 sm:px-6 flex items-center justify-between flex-shrink-0 sticky top-0 z-40">
        <button
          id="nav-logo-btn"
          onClick={() => setActiveTab('start')}
          className="flex items-center space-x-3 group cursor-pointer focus:outline-none text-left"
          title="Return to VoltPulse Start-Up Page"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-600/25 shrink-0 group-hover:scale-105 transition">
            <Zap className="w-6 h-6 text-white fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tighter text-white group-hover:text-cyan-400 transition">
                VOLTPULSE
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono hidden sm:inline-block">
                Metro Grid OS
              </span>
            </div>
          </div>
        </button>

        {/* Persona View Switcher */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            id="role-tab-home"
            onClick={() => setActiveTab('start')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'start'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Start-Up Page & Overview"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Overview</span>
          </button>

          <button
            id="role-tab-resident"
            onClick={() => setActiveTab('resident')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'resident'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Resident</span>
          </button>

          <button
            id="role-tab-dispatcher"
            onClick={() => {
              if (currentUser && !isAdmin) {
                // Resident trying to access dispatcher view - prompt admin login
                onOpenLogin('admin');
              } else {
                setActiveTab('dispatcher');
              }
            }}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dispatcher'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={currentUser && !isAdmin ? 'Requires Admin Clearance - Click to authenticate' : 'Operations Desk'}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Operations</span>
            {currentUser && !isAdmin && (
              <span className="text-[9px] bg-slate-800 text-amber-400 px-1 py-0.2 rounded font-mono hidden md:inline">
                Admin
              </span>
            )}
          </button>
        </div>

        {/* System Status & Operator Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3 relative">
          <div className="text-right hidden md:block">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              System Status
            </p>
            <p className="text-xs text-emerald-400 font-medium flex items-center justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Operational
            </p>
          </div>

          {currentUser ? (
            <div className="relative">
              <button
                id="user-profile-menu-btn"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border transition-all cursor-pointer ${
                  isAdmin
                    ? 'bg-amber-950/40 border-amber-800/60 hover:border-amber-500/80 text-amber-200'
                    : 'bg-cyan-950/40 border-cyan-800/60 hover:border-cyan-500/80 text-cyan-200'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono text-white ${
                    isAdmin ? 'bg-amber-600' : 'bg-cyan-600'
                  }`}
                >
                  {isAdmin ? <HardHat className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 leading-tight">
                    <span>{currentUser.fullName}</span>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold ${
                        isAdmin ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'
                      }`}
                    >
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">@{currentUser.username}</div>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-[#0B111E] border border-slate-700 rounded-2xl p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <div className="pb-3 border-b border-slate-800 mb-2">
                    <div className="text-xs font-bold text-white">{currentUser.fullName}</div>
                    <div className="text-[11px] font-mono text-cyan-400">@{currentUser.username}</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {currentUser.badgeTitle || (isAdmin ? 'Utility Grid Dispatcher' : 'Resident Citizen')}
                    </div>
                    {currentUser.meterNumber && (
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Meter: {currentUser.meterNumber}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    {isAdmin && (
                      <button
                        id="menu-open-user-directory"
                        onClick={onOpenUserManagement}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-slate-800 flex items-center gap-2 transition cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4 text-cyan-400" />
                        <span>Manage Users & Assign Names</span>
                      </button>
                    )}

                    <button
                      id="menu-switch-role"
                      onClick={() => onOpenLogin(isAdmin ? 'user' : 'admin')}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-slate-800 flex items-center gap-2 transition cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-amber-400" />
                      <span>Switch to {isAdmin ? 'Resident User' : 'Admin Dispatcher'}</span>
                    </button>

                    <button
                      id="menu-logout-btn"
                      onClick={onLogout}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out (Switch Account)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                id="header-btn-login-user"
                onClick={() => onOpenLogin('user')}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
              >
                User Login
              </button>
              <button
                id="header-btn-login-admin"
                onClick={() => onOpenLogin('admin')}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white transition shadow-sm cursor-pointer"
              >
                Admin Login
              </button>
            </div>
          )}
        </div>
      </header>

      {/* EMERGENCY ADVISORY BANNER */}
      <aside
        aria-label="Emergency Grid Advisory"
        className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-300"
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 truncate">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <span className="font-bold uppercase tracking-wider text-[11px] text-amber-400 shrink-0">
              Live Grid Advisory:
            </span>
            <span className="truncate text-amber-200">{broadcastMessage}</span>
          </div>
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-emerald-400 shrink-0 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" /> Telemetry Synced
          </span>
        </div>
      </aside>
    </>
  );
}
