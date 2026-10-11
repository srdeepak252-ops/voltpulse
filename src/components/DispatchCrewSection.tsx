import React, { useState, useMemo } from 'react';
import {
  HardHat,
  Zap,
  Radio,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  ShieldCheck,
  CheckSquare,
  Square,
  Users,
  Search,
  Filter,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  Building,
  AtSign,
  Flame,
  Check,
  ExternalLink,
} from 'lucide-react';
import {
  OutageIncident,
  DispatchCrew,
  AppUser,
  CrewFieldStatus,
  CrewStatusUpdate,
} from '../types';
import { DISPATCH_CREWS } from '../data/mockData';
import { StatusBadge } from './ResidentPortal';
import { AdminSolveProblemModal } from './AdminSolveProblemModal';

interface DispatchCrewSectionProps {
  incidents: OutageIncident[];
  selectedIncident: OutageIncident;
  setSelectedIncident: (i: OutageIncident) => void;
  onUpdateIncident: (i: OutageIncident) => void;
  onCrewStatusUpdate: (incidentId: string, update: CrewStatusUpdate) => void;
  onMarkProblemSolved: (incidentId: string, resolutionNotes: string, broadcastMessage: string) => void;
  currentUser: AppUser | null;
  onSwitchToAdmin: () => void;
}

export function DispatchCrewSection({
  incidents,
  selectedIncident,
  setSelectedIncident,
  onUpdateIncident,
  onCrewStatusUpdate,
  onMarkProblemSolved,
  currentUser,
  onSwitchToAdmin,
}: DispatchCrewSectionProps) {
  // Selected Crew Identity
  const [selectedCrewId, setSelectedCrewId] = useState<string>(
    currentUser?.assignedCrewId || 'crew-1'
  );
  const currentCrew = useMemo(
    () => DISPATCH_CREWS.find((c) => c.id === selectedCrewId) || DISPATCH_CREWS[0],
    [selectedCrewId]
  );

  const [crewLeadName, setCrewLeadName] = useState<string>(
    currentUser?.fullName || 'Ramesh Kumar (Lead Lineman)'
  );

  // Status Form State
  const [fieldStatus, setFieldStatus] = useState<CrewFieldStatus>(
    selectedIncident.latestCrewStatus || 'REPAIRS_ACTIVE'
  );
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [hazardCleared, setHazardCleared] = useState<boolean>(!selectedIncident.hazardReported);
  const [estMinutes, setEstMinutes] = useState<number>(30);
  
  // Safety Checklist State
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({
    deenergized: true,
    grounded: true,
    meggerTest: false,
    publicCleared: true,
    groundsRemoved: false,
  });

  // Filter and search for Problem Locations
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ASSIGNED' | 'HAZARDS' | 'RESTORED'>('ALL');
  
  // Feedback toast
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Admin Solve Modal State
  const [isSolveModalOpen, setIsSolveModalOpen] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  // Synchronize when selected incident changes
  React.useEffect(() => {
    if (selectedIncident.latestCrewStatus) {
      setFieldStatus(selectedIncident.latestCrewStatus);
    } else {
      setFieldStatus(selectedIncident.status === 'RESTORED' ? 'READY_FOR_ENERGIZATION' : 'ON_SITE');
    }
    setHazardCleared(!selectedIncident.hazardReported);
  }, [selectedIncident.id]);

  const toggleCheck = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Filtered incidents list
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        inc.code.toLowerCase().includes(q) ||
        inc.locality.toLowerCase().includes(q) ||
        inc.substation.toLowerCase().includes(q);

      let matchFilter = true;
      if (statusFilter === 'ASSIGNED') {
        matchFilter = inc.crewAssigned?.toLowerCase().includes(currentCrew.name.toLowerCase()) || false;
      } else if (statusFilter === 'HAZARDS') {
        matchFilter = inc.hazardReported && inc.status !== 'RESTORED';
      } else if (statusFilter === 'RESTORED') {
        matchFilter = inc.status === 'RESTORED';
      }

      return matchSearch && matchFilter;
    });
  }, [incidents, searchQuery, statusFilter, currentCrew.name]);

  // Handle Crew Status Transmission to Admin
  const handleTransmitUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusNotes.trim()) {
      setStatusNotes('Field inspection updated. Operational verification logged.');
    }

    const checklistNames: string[] = [];
    if (checkedItems.deenergized) checklistNames.push('Line de-energized verified');
    if (checkedItems.grounded) checklistNames.push('Safety earth grounds connected');
    if (checkedItems.meggerTest) checklistNames.push('Megger insulation test passed');
    if (checkedItems.publicCleared) checklistNames.push('Public perimeter cleared');
    if (checkedItems.groundsRemoved) checklistNames.push('Grounding clamps cleared for energization');

    const newUpdate: CrewStatusUpdate = {
      id: `c-up-${Date.now()}`,
      incidentId: selectedIncident.id,
      incidentCode: selectedIncident.code,
      crewId: currentCrew.id,
      crewName: currentCrew.name,
      crewLead: crewLeadName.trim() || 'Lineman On-Duty',
      timestamp: 'Just now',
      fieldStatus,
      notes: statusNotes.trim() || 'Field status update transmitted to admin dispatch.',
      hazardCleared,
      estimatedMinutesRemaining: estMinutes,
      checklistCompleted: checklistNames,
      submittedToAdmin: true,
      adminAcknowledged: true,
    };

    onCrewStatusUpdate(selectedIncident.id, newUpdate);
    setToastMessage(`Status update transmitted to Admin Control Center for ${selectedIncident.code}!`);
    setShowUpdateToast(true);
    setStatusNotes('');
    setTimeout(() => setShowUpdateToast(false), 4000);
  };

  // Quick preset notes
  const presetNotes = [
    'Conductor wire spliced & tensioned between poles. Megger test >500MΩ.',
    'Replaced blown 100A dropout fuse barrel. Bus voltage checked.',
    'Tree limb trimmed & cleared from 11kV crossarm. Barricade intact.',
    'Repairs complete; safety grounding clamps removed. Ready for admin reclose.',
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* CREW TERMINAL HEADER & IDENTITY BAR */}
      <div className="bg-[#0B111E] border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                Field Crew Dispatch Section
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Admin Uplink 4G Live
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
              FIELD CREW PROBLEM STATUS TERMINAL
            </h1>
            <p className="text-xs text-slate-400">
              Transmit live location status to Admin & review problem resolution updates
            </p>
          </div>
        </div>

        {/* Crew Switcher Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase pl-2 font-mono">Unit:</span>
            <select
              id="crew-unit-selector"
              value={selectedCrewId}
              onChange={(e) => setSelectedCrewId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {DISPATCH_CREWS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.specialty})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            {isAdmin ? (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-950/60 text-emerald-300 border border-emerald-800 text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Admin Authority Active</span>
              </span>
            ) : (
              <button
                id="btn-crew-auth-admin"
                onClick={onSwitchToAdmin}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-amber-300 transition flex items-center gap-1.5 cursor-pointer"
                title="Switch role to Admin to test marking problems as solved"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Switch to Admin Mode</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SUCCESS UPDATE TOAST */}
      {showUpdateToast && (
        <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 p-3.5 rounded-2xl text-xs flex items-center justify-between shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">Synced to Admin Console</span>
        </div>
      )}

      {/* WORKSPACE LAYOUT: PROBLEM SELECTION LIST (LEFT) & ACTIVE PROBLEM STATUS TERMINAL (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: CHOOSE PROBLEM SECTION / LOCATION LIST */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0B111E] border border-slate-800 rounded-3xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Choose Problem Section ({incidents.length})
                </h2>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {incidents.filter((i) => i.status !== 'RESTORED').length} Open on Grid
              </span>
            </div>

            {/* Search and Filters */}
            <div className="mt-3 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search problem by code, locality, or feeder..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { id: 'ALL', label: 'All Problems' },
                  { id: 'ASSIGNED', label: 'My Crew' },
                  { id: 'HAZARDS', label: 'Hazards' },
                  { id: 'RESTORED', label: 'Solved / Restored' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id as any)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                      statusFilter === tab.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Problem Cards List */}
            <div className="mt-3 space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
              {filteredIncidents.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                  <p className="text-xs text-slate-500">No problems match the current filter.</p>
                </div>
              ) : (
                filteredIncidents.map((inc) => {
                  const isSelected = inc.id === selectedIncident.id;
                  const isSolved = inc.status === 'RESTORED';
                  const isMyCrew = inc.crewAssigned?.toLowerCase().includes(currentCrew.name.toLowerCase());

                  return (
                    <div
                      key={inc.id}
                      id={`crew-problem-card-${inc.code}`}
                      onClick={() => setSelectedIncident(inc)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-slate-900 border-amber-500/80 shadow-lg shadow-amber-950/30 ring-1 ring-amber-500/30'
                          : isSolved
                          ? 'bg-emerald-950/10 border-emerald-900/40 hover:border-emerald-700/60'
                          : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-cyan-400">
                              {inc.code}
                            </span>
                            <StatusBadge status={inc.status} />
                            {isSolved && (
                              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" /> Solved
                              </span>
                            )}
                            {isMyCrew && !isSolved && (
                              <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded">
                                Assigned to You
                              </span>
                            )}
                          </div>
                          <h3 className="text-xs font-bold text-white leading-tight">
                            {inc.locality}
                          </h3>
                          <p className="text-[11px] text-slate-400 font-mono truncate">
                            {inc.substation}
                          </p>
                        </div>

                        <ChevronRight
                          className={`w-4 h-4 shrink-0 transition-transform ${
                            isSelected ? 'text-amber-400 translate-x-1' : 'text-slate-600'
                          }`}
                        />
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-[10px] text-slate-400 gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-slate-300">
                            {inc.affectedMeters.toLocaleString()} meters
                          </span>
                          {inc.hazardReported && !isSolved && (
                            <span className="text-rose-400 font-bold flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" /> Live Hazard
                            </span>
                          )}
                        </div>

                        {inc.latestCrewStatus ? (
                          <span className="text-[9px] font-mono uppercase font-bold text-amber-300 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-800/50">
                            Field: {inc.latestCrewStatus.replace(/_/g, ' ')}
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono text-slate-500">
                            {inc.reportedAt}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE PROBLEM WORKSTATION & STATUS UPDATE FORM */}
        <div className="lg:col-span-7 space-y-5">
          {/* DOSSIER CARD FOR SELECTED PROBLEM */}
          <div className="bg-[#0B111E] border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      {selectedIncident.code}
                    </span>
                    <StatusBadge status={selectedIncident.status} />
                    {selectedIncident.status === 'RESTORED' && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        Marked as Solved
                      </span>
                    )}
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-white mt-0.5">
                    {selectedIncident.locality}
                  </h2>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Impact Scope</span>
                <span className="text-sm font-mono font-bold text-white">
                  {selectedIncident.affectedMeters.toLocaleString()} Meters Cut
                </span>
              </div>
            </div>

            {/* PROBLEM DETAILS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Substation & Feeder
                </span>
                <span className="text-xs font-mono text-cyan-300 block truncate mt-0.5">
                  {selectedIncident.substation}
                </span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  GPS Coordinates
                </span>
                <span className="text-xs font-mono text-slate-200 block mt-0.5">
                  {selectedIncident.lat.toFixed(4)}° N, {selectedIncident.lng.toFixed(4)}° E
                </span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Assigned Field Unit
                </span>
                <span className="text-xs font-semibold text-amber-300 block truncate mt-0.5">
                  {selectedIncident.crewAssigned || 'Awaiting Dispatch'}
                </span>
              </div>
            </div>

            {/* CRITICAL FACILITIES & HAZARDS ALERT */}
            {(selectedIncident.criticalFacilities.length > 0 || selectedIncident.hazardReported) && (
              <div className="mb-4 space-y-2">
                {selectedIncident.hazardReported && selectedIncident.status !== 'RESTORED' && (
                  <div className="p-3 bg-rose-950/40 border border-rose-800/70 rounded-xl flex items-center space-x-2 text-xs text-rose-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 animate-pulse" />
                    <span>
                      <strong>HIGH HAZARD:</strong> Fallen line or sparking reported by residents at this location. Maintain 30m safety clearance until grounded!
                    </span>
                  </div>
                )}
                {selectedIncident.criticalFacilities.length > 0 && (
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300">
                    <span className="font-bold text-amber-400 uppercase text-[10px] block tracking-wider">
                      Critical Facilities Alerting:
                    </span>
                    <ul className="list-disc list-inside mt-1 text-[11px] text-slate-300">
                      {selectedIncident.criticalFacilities.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* ADMIN SOLVE PROBLEM ACTION BANNER */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/50 to-slate-950 border border-emerald-500/40 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                      Admin Problem Solver
                    </span>
                    <span className="text-xs text-slate-400">Grid Restoration Authority</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {selectedIncident.status === 'RESTORED'
                      ? 'This Problem is Solved & Restored'
                      : 'Mark Problem as Solved & Update Everyone'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedIncident.status === 'RESTORED'
                      ? `Resolved by ${selectedIncident.resolvedByAdmin || 'Admin Dispatcher'} at ${selectedIncident.resolvedAt || 'Earlier'}`
                      : 'Review crew reports, energize the feeder, and transmit real-time broadcast to all residents'}
                  </p>
                </div>

                <div>
                  {selectedIncident.status === 'RESTORED' ? (
                    <div className="px-3.5 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Grid Closed & Normal</span>
                    </div>
                  ) : isAdmin ? (
                    <button
                      id="btn-admin-mark-solved"
                      onClick={() => setIsSolveModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 transition flex items-center space-x-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Solved & Update Everyone</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        id="btn-crew-open-admin-solve"
                        onClick={() => setIsSolveModalOpen(true)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                        title="Authorized admins can resolve problems"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark as Solved</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Solved Details Card if already solved */}
              {selectedIncident.status === 'RESTORED' && selectedIncident.resolutionNotes && (
                <div className="mt-3 p-3 bg-slate-900/80 rounded-xl border border-emerald-800/40 text-xs text-slate-300 leading-relaxed">
                  <span className="font-bold text-emerald-400 block mb-1">
                    Official Admin Resolution Record:
                  </span>
                  "{selectedIncident.resolutionNotes}"
                </div>
              )}
            </div>
          </div>

          {/* CREW STATUS UPDATE FORM ("UPDATE STATUS OF CURRENT PROBLEM TO ADMIN") */}
          <div className="bg-[#0B111E] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Update Status of Current Problem to Admin
                </h3>
              </div>
              <span className="text-[10px] text-amber-400 font-mono bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                Uplink to Dispatch Console
              </span>
            </div>

            <form onSubmit={handleTransmitUpdate} className="space-y-4">
              {/* Field Status Pill Selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  1. Current Field Operational Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'EN_ROUTE', label: 'En Route to Site', desc: 'Heading to location' },
                    { id: 'ON_SITE', label: 'Arrived On Site', desc: 'Perimeter secured' },
                    { id: 'FAULT_ISOLATED', label: 'Fault Isolated', desc: 'Earthing connected' },
                    { id: 'REPAIRS_ACTIVE', label: 'Repairs Active', desc: 'Splicing / Replacing' },
                    { id: 'HAZARDS_CLEARED', label: 'Hazards Cleared', desc: 'Area safe for public' },
                    { id: 'READY_FOR_ENERGIZATION', label: 'Ready for Reclose', desc: 'Requesting Admin Power' },
                  ].map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => setFieldStatus(s.id as CrewFieldStatus)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        fieldStatus === s.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md shadow-amber-950/30 ring-1 ring-amber-500/40'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold leading-tight">{s.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Diagnostic Notes to Admin */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    2. Problem Diagnostics & Field Report to Admin
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Live Transmission</span>
                </div>

                {/* Preset Quick Fill Pills */}
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {presetNotes.map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setStatusNotes(preset)}
                      className="text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded-lg border border-slate-800 transition cursor-pointer truncate max-w-[280px]"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <textarea
                  id="crew-status-notes-input"
                  rows={3}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Describe current problem details, line condition, equipment replaced, and updates for the admin..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition leading-relaxed resize-none"
                  required
                />
              </div>

              {/* Field Safety Verification Checklist */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  3. Field Safety & Technical Clearance Checklist
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => toggleCheck('deenergized')}
                    className="flex items-center space-x-2 text-xs text-left cursor-pointer p-1"
                  >
                    {checkedItems.deenergized ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <span className={checkedItems.deenergized ? 'text-slate-200' : 'text-slate-500'}>
                      HV line tested & zero voltage verified
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleCheck('grounded')}
                    className="flex items-center space-x-2 text-xs text-left cursor-pointer p-1"
                  >
                    {checkedItems.grounded ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <span className={checkedItems.grounded ? 'text-slate-200' : 'text-slate-500'}>
                      Safety earthing ground clusters clamped
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleCheck('meggerTest')}
                    className="flex items-center space-x-2 text-xs text-left cursor-pointer p-1"
                  >
                    {checkedItems.meggerTest ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <span className={checkedItems.meggerTest ? 'text-slate-200' : 'text-slate-500'}>
                      Megger insulation test passed (&gt;500 MΩ)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleCheck('groundsRemoved')}
                    className="flex items-center space-x-2 text-xs text-left cursor-pointer p-1"
                  >
                    {checkedItems.groundsRemoved ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <span className={checkedItems.groundsRemoved ? 'text-slate-200' : 'text-slate-500'}>
                      All ground leads removed prior to reclose
                    </span>
                  </button>
                </div>
              </div>

              {/* Hazard & Estimated Time Adjustment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-300 block">Hazard Neutralized?</span>
                    <span className="text-[10px] text-slate-500">Live wires & sparks cleared</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hazardCleared}
                      onChange={(e) => setHazardCleared(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-300">Remaining Work Time</span>
                    <span className="font-mono text-cyan-400">{estMinutes} mins</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="180"
                    step="5"
                    value={estMinutes}
                    onChange={(e) => setEstMinutes(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Lineman Lead Signature */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <span>Reporting as:</span>
                  <input
                    type="text"
                    value={crewLeadName}
                    onChange={(e) => setCrewLeadName(e.target.value)}
                    placeholder="Lineman Lead Name"
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  id="btn-transmit-crew-update"
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-900/30 transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Status Update to Admin</span>
                </button>
              </div>
            </form>
          </div>

          {/* CHRONOLOGICAL STATUS TRANSMISSION LOG FOR THIS PROBLEM */}
          <div className="bg-[#0B111E] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Crew ↔ Admin Communications Log ({selectedIncident.crewStatusUpdates?.length || 0})
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {selectedIncident.code} Real-Time Trail
              </span>
            </div>

            {(!selectedIncident.crewStatusUpdates || selectedIncident.crewStatusUpdates.length === 0) ? (
              <div className="bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl p-6 text-center">
                <p className="text-xs text-slate-500">
                  No field status updates transmitted yet for this problem location. Use the form above to log the first report!
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {selectedIncident.crewStatusUpdates.map((update, idx) => (
                  <div
                    key={update.id || idx}
                    className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 space-y-2 hover:border-slate-700 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="text-xs font-bold text-amber-300">
                          {update.crewLead || update.crewName}
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold uppercase">
                          {update.fieldStatus.replace(/_/g, ' ')}
                        </span>
                        {update.adminAcknowledged && (
                          <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Admin Acknowledged
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {update.timestamp}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/50">
                      "{update.notes}"
                    </p>

                    {update.checklistCompleted && update.checklistCompleted.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {update.checklistCompleted.map((c, i) => (
                          <span
                            key={i}
                            className="text-[9px] font-mono bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800"
                          >
                            ✓ {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADMIN SOLVE PROBLEM MODAL */}
      {isSolveModalOpen && (
        <AdminSolveProblemModal
          incident={selectedIncident}
          onClose={() => setIsSolveModalOpen(false)}
          onConfirmSolve={onMarkProblemSolved}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
