import React, { useState } from 'react';
import {
  Zap,
  ZapOff,
  Users,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Radio,
  MapPin,
  Clock,
  AlertTriangle,
  ArrowRight,
  HardHat,
  Search,
  CheckCircle2,
  ChevronRight,
  Layers,
  Sparkles,
  PhoneCall,
  UserCheck,
  RotateCcw,
  Flame,
  Building2,
  Cpu
} from 'lucide-react';
import { AppUser, OutageIncident } from '../types';

interface StartupPageProps {
  incidents: OutageIncident[];
  currentUser: AppUser | null;
  users: AppUser[];
  onSelectRole: (role: 'resident' | 'dispatcher') => void;
  onOpenReportModal: () => void;
  onTrackTicket: (ticketCode: string) => void;
  onSwitchUser: (user: AppUser) => void;
  onSimulateScada: () => void;
  onOpenUserDirectory: () => void;
  onOpenLogin: (role?: 'user' | 'admin') => void;
}

export function StartupPage({
  incidents,
  currentUser,
  users,
  onSelectRole,
  onOpenReportModal,
  onTrackTicket,
  onSwitchUser,
  onSimulateScada,
  onOpenUserDirectory,
  onOpenLogin,
}: StartupPageProps) {
  const [ticketInput, setTicketInput] = useState('');
  const [ticketError, setTicketError] = useState('');

  // Calculate live statistics
  const activeIncidents = incidents.filter((i) => i.status !== 'RESTORED');
  const totalAffectedMeters = activeIncidents.reduce((acc, curr) => acc + curr.affectedMeters, 0);
  const hazardIncidents = activeIncidents.filter((i) => i.hazardReported);
  const totalCitizenReports = incidents.reduce(
    (acc, curr) => acc + (curr.customerReports?.length || 0),
    0
  );

  const handleSearchTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = ticketInput.trim().toUpperCase();
    if (!cleanCode) {
      setTicketError('Please enter a ticket code (e.g. OUT-8492)');
      return;
    }
    const found = incidents.find((i) => i.code.toUpperCase() === cleanCode);
    if (found) {
      setTicketError('');
      onTrackTicket(found.code);
    } else {
      setTicketError(`Ticket "${cleanCode}" not found in current sector records. Showing nearest cluster.`);
      // Still forward to resident portal to view active tickets
      onTrackTicket(incidents[0]?.code || 'OUT-8492');
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-12 pb-12">
      {/* HERO SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0F172A] via-[#0B111E] to-[#070A12] border border-slate-800 p-6 sm:p-10 lg:p-14 shadow-2xl">
        {/* Glow ambient background effects */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          {/* SYSTEM BADGE */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-mono text-cyan-300 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold tracking-wide">MUNICIPAL SMART GRID OS v4.2</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">SECTOR 9 & CENTRAL METRO</span>
          </div>

          {/* MAIN HEADLINE */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Intelligent Locality Grid Resilience & Outage Management
          </h1>

          {/* SUBTITLE */}
          <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            A unified municipal intelligence platform connecting citizens, utility field crews,
            and SCADA control centers. Detect power cuts, cluster reports with 1,200m spatial GIS,
            and monitor live restoration ETAs.
          </p>

          {/* PRIMARY CALL TO ACTION BUTTONS */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              id="startup-btn-report-outage"
              onClick={onOpenReportModal}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-sm sm:text-base flex items-center space-x-2.5 shadow-xl shadow-rose-950/40 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
            >
              <ZapOff className="w-5 h-5 text-amber-200" />
              <span>Report an Outage Now</span>
              <span className="px-2 py-0.5 rounded-full bg-black/30 text-[11px] font-mono">Fast-Track</span>
            </button>

            <button
              id="startup-btn-resident-portal"
              onClick={() => onSelectRole('resident')}
              className="px-5 py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm sm:text-base flex items-center space-x-2 shadow-lg shadow-cyan-900/30 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
            >
              <Users className="w-5 h-5" />
              <span>Resident Outage Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="startup-btn-operations-desk"
              onClick={() => {
                if (currentUser && !isAdmin) {
                  onOpenLogin('admin');
                } else {
                  onSelectRole('dispatcher');
                }
              }}
              className="px-5 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 font-bold text-sm sm:text-base flex items-center space-x-2 transition cursor-pointer"
            >
              <Activity className="w-5 h-5 text-cyan-400" />
              <span>Operations & SCADA Desk</span>
              {currentUser && !isAdmin && (
                <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                  Admin Login
                </span>
              )}
            </button>
          </div>

          {/* TICKET TRACKER QUICK SEARCH */}
          <div className="pt-4 max-w-lg mx-auto">
            <form onSubmit={handleSearchTicket} className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                id="startup-input-track-ticket"
                type="text"
                value={ticketInput}
                onChange={(e) => {
                  setTicketInput(e.target.value);
                  if (ticketError) setTicketError('');
                }}
                placeholder="Track ticket by code (e.g., OUT-8492, OUT-8495)..."
                className="w-full bg-[#0B111E]/90 border border-slate-700/80 rounded-2xl pl-11 pr-28 py-3 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 shadow-inner"
              />
              <button
                type="submit"
                id="startup-btn-track-submit"
                className="absolute right-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition cursor-pointer shadow-sm"
              >
                Track Status
              </button>
            </form>

            {ticketError && (
              <p className="text-amber-400 text-xs mt-1.5 text-left pl-2 font-mono flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {ticketError}
              </p>
            )}

            {/* QUICK PICK PRESETS */}
            <div className="flex items-center justify-center gap-2 mt-2.5 text-[11px] text-slate-400">
              <span>Quick Lookups:</span>
              {incidents.slice(0, 3).map((inc) => (
                <button
                  key={inc.id}
                  type="button"
                  onClick={() => onTrackTicket(inc.code)}
                  className="font-mono text-cyan-400 hover:text-cyan-300 underline underline-offset-2 cursor-pointer"
                >
                  {inc.code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* LIVE TELEMETRY KPI METRICS BAR */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <div className="bg-[#0B111E] border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Outages</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono flex items-baseline gap-2">
            {activeIncidents.length}
            <span className="text-xs font-sans text-slate-400 font-normal">clusters</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-400 flex items-center gap-1 font-mono">
            <span>{hazardIncidents.length} wire / sparking hazards</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#0B111E] border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Meters Affected</span>
            <ZapOff className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono flex items-baseline gap-2">
            {totalAffectedMeters.toLocaleString()}
            <span className="text-xs font-sans text-slate-400 font-normal">of 42,850</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            {(100 - (totalAffectedMeters / 42850) * 100).toFixed(1)}% Locality Powered
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#0B111E] border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Citizen Reports</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono flex items-baseline gap-2">
            {totalCitizenReports}
            <span className="text-xs font-sans text-slate-400 font-normal">verified</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            Spatial Clustering active (1,200m)
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#0B111E] border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Crews In Field</span>
            <HardHat className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono flex items-baseline gap-2">
            3 Teams
            <span className="text-xs font-sans text-slate-400 font-normal">on dispatch</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            Alpha-4 • Bravo-1 • Echo-2
          </div>
        </div>
      </div>

      {/* DUAL PERSONA LAUNCHPAD SECTION */}
      <div className="space-y-4">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-white">Choose Your Operational Portal</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            VoltPulse provides tailored interfaces for neighborhood citizens and utility grid engineers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* PORTAL 1: RESIDENT CITIZEN HUB */}
          <div className="bg-[#0B111E] border border-slate-800 hover:border-cyan-500/50 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between transition-all group">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition">
                  <Users className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 text-xs font-mono font-bold">
                  CITIZEN ACCESS
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition">
                  Resident Outage Portal
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                  Experiencing a blackout or flickering power? Check your neighborhood's live restoration
                  time (ETR), report outages with automatic GPS spatial clustering, and alert crews to fallen wires.
                </p>
              </div>

              {/* FEATURES BULLETS */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Instant outage filing with meter & GPS lookup</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Live countdown clock to Estimated Restoration Time (ETR)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Downed wire and transformer sparking hazard warning channel</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Neighborhood transparency without phone call wait times</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  id="startup-card-btn-resident"
                  onClick={() => onSelectRole('resident')}
                  className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-cyan-900/30 transition cursor-pointer"
                >
                  <span>Enter Resident Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  id="startup-card-btn-report-modal"
                  onClick={onOpenReportModal}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <ZapOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>File New Report</span>
                </button>
              </div>

              {/* DEMO PROFILE FAST-SWITCH */}
              <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Demo Resident:</span>
                <button
                  onClick={() => {
                    const residentUser = users.find((u) => u.role === 'user') || users[2];
                    onSwitchUser(residentUser);
                    onSelectRole('resident');
                  }}
                  className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer font-mono"
                >
                  <span>Continue as Elena Rostova (@elena_r)</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* PORTAL 2: OPERATIONS & SCADA DESK */}
          <div className="bg-[#0B111E] border border-slate-800 hover:border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between transition-all group">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
                  <Activity className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800/60 text-xs font-mono font-bold">
                  ADMIN CLEARANCE
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition">
                  Grid Operations & SCADA Desk
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                  Mission-critical distribution grid operations. Monitor GIS spatial maps, SCADA circuit
                  breakers, dispatch bucket truck crews, and manage the locality citizen user directory.
                </p>
              </div>

              {/* FEATURES BULLETS */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Interactive GIS topology map with 1,200m spatial clustering</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Automated SCADA substation breaker trip simulation & alerts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Crew dispatch engine (Alpha-4, Bravo-1, Echo-2 status)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>User reported issues registry & username assignment tools</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  id="startup-card-btn-operations"
                  onClick={() => {
                    if (currentUser && !isAdmin) {
                      onOpenLogin('admin');
                    } else {
                      onSelectRole('dispatcher');
                    }
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-900/30 transition cursor-pointer"
                >
                  <span>Enter Operations Desk</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  id="startup-card-btn-simulate-scada"
                  onClick={onSimulateScada}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-300 hover:text-white border border-rose-900/40 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                  title="Simulate an automated SCADA substation breaker trip"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  <span>Simulate SCADA Trip</span>
                </button>
              </div>

              {/* DEMO PROFILE FAST-SWITCH */}
              <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Demo Admin:</span>
                <button
                  onClick={() => {
                    const adminUser = users.find((u) => u.role === 'admin') || users[0];
                    onSwitchUser(adminUser);
                    onSelectRole('dispatcher');
                  }}
                  className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer font-mono"
                >
                  <span>Continue as John Doe (@admin_john)</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE LOCALITY OUTAGE WATCHLIST */}
      <div className="bg-[#0B111E] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <Radio className="w-5 h-5 text-rose-400 animate-pulse" />
              <h2 className="text-lg sm:text-xl font-bold text-white">Live Outage Watchlist (Locality Clusters)</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Active electrical distribution incidents triaged across Ward 9, Sector B, and Industrial corridors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">
              {activeIncidents.length} Incident Clusters Active
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {incidents.slice(0, 3).map((inc) => (
            <div
              key={inc.id}
              className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between transition group shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                    {inc.code}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                      inc.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : inc.severity === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {inc.severity}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                    {inc.locality}
                  </h4>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-500" />
                    <span>{inc.substation}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60 font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">AFFECTED</span>
                    <span className="text-slate-200 font-bold">{inc.affectedMeters} meters</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">EST. RESTORE</span>
                    <span className="text-cyan-300 font-bold">{inc.etr}</span>
                  </div>
                </div>

                {inc.hazardReported && (
                  <div className="flex items-center space-x-1.5 text-[11px] text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Live Wire / Sparking Alert</span>
                  </div>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  {inc.customerReports?.length || 0} citizen reports
                </span>
                <button
                  onClick={() => onTrackTicket(inc.code)}
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer"
                >
                  <span>Track Status</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ARCHITECTURAL HIGHLIGHTS: HOW VOLTPULSE WORKS */}
      <div className="bg-[#0B111E] border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-cyan-400 border border-slate-700 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PLATFORM CAPABILITIES</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            End-to-End Locality Grid Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            How VoltPulse automates outage identification, prevents dispatch confusion, and safeguards public safety.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-3 relative group hover:border-slate-700 transition">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-mono font-black text-sm">
              01
            </div>
            <h4 className="text-sm font-bold text-white">Crowdsource & SCADA Ingest</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Accepts instant resident reports via smart meter IDs and automated digital telemetry from substation circuit breakers.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-3 relative group hover:border-slate-700 transition">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-mono font-black text-sm">
              02
            </div>
            <h4 className="text-sm font-bold text-white">1,200m Spatial Clustering</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Spatial clustering algorithms group proximate outage reports into a single consolidated master ticket to eliminate duplicates.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-3 relative group hover:border-slate-700 transition">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-mono font-black text-sm">
              03
            </div>
            <h4 className="text-sm font-bold text-white">Hazard-First Dispatching</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sparking wires and downed power lines are prioritized for bucket trucks with instant route coordination and GPS tracking.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-3 relative group hover:border-slate-700 transition">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono font-black text-sm">
              04
            </div>
            <h4 className="text-sm font-bold text-white">Live Neighborhood ETR</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every citizen can track their specific meter's restoration countdown without call center hold times or manual queries.
            </p>
          </div>
        </div>
      </div>

      {/* QUICK ROLE & PROFILE SWITCHER */}
      <div className="bg-[#0B111E] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span>Available Demo User Profiles</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any profile below to instantly switch roles and explore the application from their perspective.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="startup-manage-users-btn"
              onClick={onOpenUserDirectory}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Manage User Directory</span>
            </button>

            <button
              id="startup-auth-portal-btn"
              onClick={() => onOpenLogin()}
              className="px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-xs font-bold text-cyan-300 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Login Portal</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {users.map((user) => {
            const isUserAdmin = user.role === 'admin';
            const isSelected = currentUser?.id === user.id;

            return (
              <button
                key={user.id}
                onClick={() => {
                  onSwitchUser(user);
                  onSelectRole(isUserAdmin ? 'dispatcher' : 'resident');
                }}
                className={`p-3.5 rounded-2xl border text-left transition flex items-center space-x-3 cursor-pointer ${
                  isSelected
                    ? isUserAdmin
                      ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-950/50'
                      : 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-white shrink-0 ${
                    isUserAdmin ? 'bg-amber-600' : 'bg-cyan-600'
                  }`}
                >
                  {isUserAdmin ? <HardHat className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-white truncate">{user.fullName}</span>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold shrink-0 ${
                        isUserAdmin ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">@{user.username}</div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {user.badgeTitle || (isUserAdmin ? 'Operations Control' : user.locality)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SAFETY & EMERGENCY HOTLINE FOOTER CARD */}
      <div className="bg-rose-950/20 border border-rose-900/40 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-rose-200">
              Downed Power Line or Gas Leak Hazard?
            </h4>
            <p className="text-xs text-rose-300/80 mt-0.5">
              Always assume fallen wires are energized. Stay at least 35 feet away and call 911 immediately.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 rounded-xl bg-rose-900/40 border border-rose-800 text-xs font-mono font-bold text-rose-200 flex items-center space-x-2">
            <PhoneCall className="w-4 h-4 text-rose-400" />
            <span>Emergency: 911</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-slate-300">
            Grid Dispatch: 1-800-VOLT-GRID
          </div>
        </div>
      </div>
    </div>
  );
}
