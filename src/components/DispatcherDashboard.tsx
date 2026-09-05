import React, { useState, useMemo } from 'react';
import {
  Zap,
  ZapOff,
  Users,
  Clock,
  ShieldAlert,
  Navigation,
  Send,
  CheckCircle2,
  AlertTriangle,
  Radio,
  SlidersHorizontal,
  HardHat,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight,
  Eye,
  Activity,
  PlusCircle,
  UserCheck,
  AtSign,
  Search,
  Filter,
  FileText,
  User,
  Phone,
  Building,
  Shield,
  MapPin
} from 'lucide-react';
import { OutageIncident, GridAsset, DispatchCrew, AppUser, CustomerReport } from '../types';
import { StatusBadge } from './ResidentPortal';
import { GRID_ASSETS, DISPATCH_CREWS, BROADCAST_PRESETS } from '../data/mockData';
import { AssignUsernameModal } from './AssignUsernameModal';
import { GoogleGridMap } from './GoogleGridMap';

interface DispatcherDashboardProps {
  incidents: OutageIncident[];
  selectedIncident: OutageIncident;
  setSelectedIncident: (i: OutageIncident) => void;
  onUpdateIncident: (i: OutageIncident) => void;
  onBroadcastUpdate: (msg: string) => void;
  onSimulateScadaEvent: () => void;
  users: AppUser[];
  onAssignUsername: (
    incidentId: string,
    reportId: string,
    newUsername: string,
    updatedResidentName?: string
  ) => void;
  onOpenUserDirectory: () => void;
}

export function DispatcherDashboard({
  incidents,
  selectedIncident,
  setSelectedIncident,
  onUpdateIncident,
  onBroadcastUpdate,
  onSimulateScadaEvent,
  users,
  onAssignUsername,
  onOpenUserDirectory,
}: DispatcherDashboardProps) {
  const [viewMode, setViewMode] = useState<'MAP' | 'REPORTS'>('MAP');
  const [filter, setFilter] = useState<string>('ALL');
  const [broadcastDraft, setBroadcastDraft] = useState('');
  const [selectedCrew, setSelectedCrew] = useState<string>(
    selectedIncident.crewAssigned || ''
  );
  const [customEtr, setCustomEtr] = useState<string>('');
  const [showAssetOverlay, setShowAssetOverlay] = useState(true);
  const [showBroadcastToast, setShowBroadcastToast] = useState(false);
  const [mapZoom, setMapZoom] = useState(1);
  const [mapEngine, setMapEngine] = useState<'GOOGLE_MAPS' | 'SCHEMATIC'>('GOOGLE_MAPS');

  // Assign Username modal state
  const [assignModalData, setAssignModalData] = useState<{
    report: CustomerReport;
    incidentCode: string;
    incidentId: string;
  } | null>(null);

  // Filter state for citizen reported issues directory
  const [reportSearch, setReportSearch] = useState('');
  const [reportHazardFilter, setReportHazardFilter] = useState<'ALL' | 'HAZARD' | 'NORMAL'>('ALL');

  // Synchronize crew selector when selected incident changes
  React.useEffect(() => {
    setSelectedCrew(selectedIncident.crewAssigned || '');
    setCustomEtr(selectedIncident.etr);
  }, [selectedIncident]);

  // Aggregate all customer reports across all incidents
  const allCitizenReports = useMemo(() => {
    const list: { report: CustomerReport; incident: OutageIncident }[] = [];
    incidents.forEach((inc) => {
      inc.customerReports?.forEach((rep) => {
        list.push({ report: rep, incident: inc });
      });
    });
    return list;
  }, [incidents]);

  const filteredCitizenReports = useMemo(() => {
    return allCitizenReports.filter(({ report, incident }) => {
      const q = reportSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        report.residentName?.toLowerCase().includes(q) ||
        report.username?.toLowerCase().includes(q) ||
        report.meterNumber.toLowerCase().includes(q) ||
        report.addressText.toLowerCase().includes(q) ||
        report.notes?.toLowerCase().includes(q) ||
        incident.code.toLowerCase().includes(q) ||
        incident.locality.toLowerCase().includes(q);

      const matchHazard =
        reportHazardFilter === 'ALL'
          ? true
          : reportHazardFilter === 'HAZARD'
          ? report.hasSparkingOrHazard
          : !report.hasSparkingOrHazard;

      return matchSearch && matchHazard;
    });
  }, [allCitizenReports, reportSearch, reportHazardFilter]);

  const activeIncidents = useMemo(
    () => incidents.filter((i) => i.status !== 'RESTORED'),
    [incidents]
  );

  const totalAffected = useMemo(
    () => activeIncidents.reduce((acc, curr) => acc + curr.affectedMeters, 0),
    [activeIncidents]
  );

  const criticalNodesAlerting = useMemo(
    () =>
      activeIncidents.filter(
        (i) => i.criticalFacilities.length > 0 || i.severity === 'CRITICAL'
      ).length,
    [activeIncidents]
  );

  const filteredList = useMemo(() => {
    if (filter === 'ALL') return incidents;
    if (filter === 'HAZARDS') return incidents.filter((i) => i.hazardReported);
    return incidents.filter((i) => i.status === filter);
  }, [incidents, filter]);

  const handleBroadcast = (msg: string) => {
    if (msg.trim()) {
      onBroadcastUpdate(msg.trim());
      setBroadcastDraft('');
      setShowBroadcastToast(true);
      setTimeout(() => setShowBroadcastToast(false), 3500);
    }
  };

  const handleAssignCrew = (crewName: string) => {
    setSelectedCrew(crewName);
    const updated = {
      ...selectedIncident,
      crewAssigned: crewName || null,
      status: selectedIncident.status === 'TRIAGED' ? ('CREW_DISPATCHED' as const) : selectedIncident.status,
    };
    onUpdateIncident(updated);
  };

  const handleSaveEtr = () => {
    if (customEtr.trim()) {
      const updated = {
        ...selectedIncident,
        etr: customEtr.trim(),
      };
      onUpdateIncident(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* ADMIN WORKSPACE SWITCHER & QUICK ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0B111E] border border-slate-800 p-3 rounded-2xl shadow-lg">
        <div className="flex items-center space-x-2">
          <button
            id="admin-tab-map-view"
            onClick={() => setViewMode('MAP')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              viewMode === 'MAP'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>GIS Map & SCADA Command</span>
          </button>

          <button
            id="admin-tab-reports-view"
            onClick={() => setViewMode('REPORTS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              viewMode === 'REPORTS'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>User Reported Issues ({allCitizenReports.length})</span>
            {allCitizenReports.some((r) => r.report.hasSparkingOrHazard) && (
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping ml-1" />
            )}
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="admin-btn-open-user-directory"
            onClick={onOpenUserDirectory}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition flex items-center space-x-2 cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <span>Manage Users & Assign Names ({users.length})</span>
          </button>

          <button
            id="btn-scada-trigger"
            onClick={onSimulateScadaEvent}
            className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 text-xs font-bold text-rose-300 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Simulate</span>
            <span>SCADA Trip</span>
          </button>
        </div>
      </div>

      {/* OPERATIONS KPI STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Active</span>
            <ZapOff className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-mono font-bold text-rose-500 mt-2">
            0{activeIncidents.length}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {incidents.filter((i) => i.severity === 'CRITICAL' && i.status !== 'RESTORED').length} Critical Node Trips
          </span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Impacted</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white mt-2">
            {totalAffected.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            ~2.3% of Locality Grid Load
          </span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Mean Restore</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white mt-2">
            44m 12s
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 block font-medium">
            ↓ 12% faster than municipal target
          </span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Critical Infra</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-mono font-bold text-amber-400 mt-2">
            {criticalNodesAlerting} Alerting
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Hospitals / Pumping on Aux Gen
          </span>
        </div>
      </div>

      {/* SPLIT SCREEN WORKSPACE: MAP & TRIAGE TABLE */}
      {viewMode === 'MAP' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT 7 COLS: INTERACTIVE GIS MAP SIMULATOR */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[580px]">
            {/* GIS Topbar Controls */}
            <div className="p-3 border-b border-slate-800 flex flex-wrap items-center justify-between bg-slate-950/80 gap-2">
              <div className="flex items-center space-x-2">
                <Navigation className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-sm text-white">Locality Grid GIS Command Center</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700 font-mono">
                  110kV SCADA Feed
                </span>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                {/* Engine Selector */}
                <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex items-center">
                  <button
                    id="switch-engine-gmaps-btn"
                    onClick={() => setMapEngine('GOOGLE_MAPS')}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                      mapEngine === 'GOOGLE_MAPS'
                        ? 'bg-cyan-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Google Maps GIS</span>
                  </button>
                  <button
                    id="switch-engine-schematic-btn"
                    onClick={() => setMapEngine('SCHEMATIC')}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                      mapEngine === 'SCHEMATIC'
                        ? 'bg-cyan-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Schematic Topology</span>
                  </button>
                </div>

                {mapEngine === 'SCHEMATIC' && (
                  <button
                    id="toggle-asset-overlay-btn"
                    onClick={() => setShowAssetOverlay(!showAssetOverlay)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                      showAssetOverlay
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    <span>Asset Topology</span>
                  </button>
                )}

                {/* SCADA Simulator Button */}
                <button
                  id="simulate-scada-trip-btn"
                  onClick={onSimulateScadaEvent}
                  className="px-2.5 py-1 rounded text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/40 transition cursor-pointer flex items-center gap-1 shadow-sm"
                  title="Inject simulated breaker trip telemetry from SCADA bridge"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Simulate SCADA Trip</span>
                </button>
              </div>
            </div>

            {/* Map Body: Google Maps vs Vector Canvas */}
            {mapEngine === 'GOOGLE_MAPS' ? (
              <div className="relative flex-1 w-full h-full min-h-[500px]">
                <GoogleGridMap
                  incidents={incidents}
                  selectedIncident={selectedIncident}
                  onSelectIncident={setSelectedIncident}
                  gridAssets={GRID_ASSETS}
                  crews={DISPATCH_CREWS}
                  height="100%"
                  showControlsBar={true}
                />
              </div>
            ) : (
              <div
                className="relative flex-1 bg-[#060913] p-4 flex items-center justify-center overflow-hidden select-none"
              style={{
                backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            >
              {/* Substation Lines Mock Topology */}
              {showAssetOverlay && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-cyan-500/25" strokeWidth="2">
                  <line x1="18%" y1="28%" x2="52%" y2="48%" strokeDasharray="5" />
                  <line x1="52%" y1="48%" x2="82%" y2="24%" strokeDasharray="5" />
                  <line x1="52%" y1="48%" x2="68%" y2="78%" strokeDasharray="5" />
                  <line x1="18%" y1="28%" x2="32%" y2="72%" strokeDasharray="5" />
                  <line x1="32%" y1="72%" x2="68%" y2="78%" strokeDasharray="5" />
                </svg>
              )}

              {/* GRID ASSET NODES (Transformers / Substations) */}
              {showAssetOverlay &&
                GRID_ASSETS.map((asset, i) => {
                  const assetPositions = [
                    { top: '26%', left: '50%' },
                    { top: '22%', left: '80%' },
                    { top: '70%', left: '65%' },
                    { top: '74%', left: '30%' },
                  ];
                  const aPos = assetPositions[i % assetPositions.length];
                  return (
                    <div
                      key={asset.id}
                      style={{ top: aPos.top, left: aPos.left }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-help group"
                    >
                      <div className="w-4 h-4 rounded bg-slate-800 border border-cyan-500/50 flex items-center justify-center text-[9px] font-mono text-cyan-300 shadow">
                        ⚡
                      </div>
                      <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-slate-700 px-2 py-1 rounded text-[10px] text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-30 font-mono shadow-xl">
                        {asset.assetTag} ({asset.assetType}) - {asset.capacityKva} kVA
                      </div>
                    </div>
                  );
                })}

              {/* OUTAGE CLUSTER MAP PINS */}
              {incidents.map((inc, index) => {
                const isSelected = selectedIncident.id === inc.id;
                // Coordinated positions for demo
                const positions = [
                  { top: '34%', left: '46%' },
                  { top: '24%', left: '76%' },
                  { top: '70%', left: '60%' },
                  { top: '26%', left: '16%' },
                  { top: '65%', left: '25%' },
                  { top: '48%', left: '82%' },
                ];
                const pos = positions[index % positions.length];

                return (
                  <div
                    key={inc.id}
                    id={`map-pin-${inc.code}`}
                    onClick={() => setSelectedIncident(inc)}
                    style={{ top: pos.top, left: pos.left }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-transform duration-200 hover:scale-125 z-20"
                  >
                    <div className="relative">
                      {inc.status !== 'RESTORED' && (
                        <span
                          className={`absolute -inset-3 rounded-full opacity-75 animate-ping pointer-events-none ${
                            inc.severity === 'CRITICAL'
                              ? 'bg-rose-500/40'
                              : inc.severity === 'HIGH'
                              ? 'bg-amber-500/40'
                              : 'bg-cyan-500/40'
                          }`}
                        />
                      )}
                      <div
                        className={`rounded-2xl flex items-center justify-center shadow-xl transition-all ${
                          isSelected
                            ? 'w-12 h-12 ring-4 ring-cyan-400 border-2 border-white scale-110'
                            : 'w-10 h-10 border-2 border-slate-900'
                        } ${
                          inc.status === 'RESTORED'
                            ? 'bg-emerald-600 text-white shadow-emerald-900/40'
                            : inc.severity === 'CRITICAL'
                            ? 'bg-rose-600 text-white shadow-rose-900/40'
                            : 'bg-amber-600 text-white shadow-amber-900/40'
                        }`}
                      >
                        <Zap className="w-5 h-5 fill-current" />
                      </div>
                    </div>

                    {/* Popover on hover or select */}
                    <div
                      className={`absolute bottom-14 left-1/2 -translate-x-1/2 w-48 bg-slate-900/95 border border-slate-700 p-2.5 rounded-lg shadow-2xl text-[11px] backdrop-blur z-30 pointer-events-none transition-opacity ${
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <div className="font-bold text-white flex justify-between items-center">
                        <span className="font-mono text-cyan-300">{inc.code}</span>
                        <span className="font-mono text-slate-300 font-normal">
                          {inc.affectedMeters} meters
                        </span>
                      </div>
                      <div className="text-slate-400 truncate mt-0.5">{inc.locality}</div>
                      <div className="text-[10px] text-amber-300 font-semibold mt-1 flex items-center justify-between">
                        <span>ETR: {inc.etr}</span>
                        <span className="text-[9px] uppercase font-mono px-1 rounded bg-slate-800 text-slate-400">
                          {inc.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Floating Substation Alpha Telemetry HUD */}
              <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
                <div className="bg-slate-900/90 border border-slate-700 p-3 rounded-2xl backdrop-blur shadow-2xl pointer-events-auto">
                  <h3 className="text-xs font-bold text-white mb-1.5 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Substation Alpha
                  </h3>
                  <div className="flex space-x-4 text-left">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider">Load</p>
                      <p className="text-xs font-mono font-bold text-cyan-400">84.2%</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider">Temp</p>
                      <p className="text-xs font-mono font-bold text-emerald-400">42°C</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider">Telemetry</p>
                      <p className="text-xs font-mono font-bold text-slate-300">254 pkts/s</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Zoom Controls */}
              <div className="absolute top-3 right-3 flex flex-col space-y-1 bg-slate-950/80 backdrop-blur border border-slate-800 rounded-lg p-1 z-20">
                <button
                  onClick={() => setMapZoom((z) => Math.min(z + 0.2, 2))}
                  className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 rounded text-sm font-bold cursor-pointer"
                  title="Zoom in"
                >
                  +
                </button>
                <button
                  onClick={() => setMapZoom((z) => Math.max(z - 0.2, 0.8))}
                  className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 rounded text-sm font-bold cursor-pointer"
                  title="Zoom out"
                >
                  -
                </button>
              </div>
            </div>
            )}
          </div>

          {/* BROADCAST ALERT TRANSMITTER */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" /> Locality Public Broadcast Transmitter
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Pushes live alerts to resident mobile web view</span>
            </div>

            {/* Quick preset chips */}
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {BROADCAST_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setBroadcastDraft(preset)}
                  className="text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded-md border border-slate-800 transition cursor-pointer truncate max-w-[280px]"
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                id="broadcast-input"
                type="text"
                placeholder="Compose live advisory notification to push to locality residents..."
                value={broadcastDraft}
                onChange={(e) => setBroadcastDraft(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition"
              />
              <button
                id="broadcast-send-btn"
                onClick={() => handleBroadcast(broadcastDraft)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-cyan-600/30 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Broadcast
              </button>
            </div>

            {showBroadcastToast && (
              <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 animate-in fade-in duration-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Broadcast transmitted to 4,820 mobile subscribers in locality zone!
              </div>
            )}
          </div>
        </div>

        {/* RIGHT 5 COLS: INCIDENT DISPATCH CONTROLLER */}
        <div className="lg:col-span-5 space-y-4">
          {/* SELECTED TICKET ACTION PANEL */}
          <div id="selected-ticket-dispatch-panel" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-cyan-400">{selectedIncident.code}</span>
                <StatusBadge status={selectedIncident.status} />
              </div>
              <span className="text-xs text-slate-400">Reported {selectedIncident.reportedAt}</span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
                  Location & Grid Feeder
                </span>
                <div className="text-sm font-bold text-white mt-0.5">{selectedIncident.locality}</div>
                <div className="text-xs text-slate-400">{selectedIncident.substation}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  GPS: {selectedIncident.lat.toFixed(4)}° N, {selectedIncident.lng.toFixed(4)}° W
                </div>
              </div>

              {/* CRITICAL FACILITIES */}
              {selectedIncident.criticalFacilities.length > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl">
                  <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> Critical Sites Impacted:
                  </span>
                  <ul className="mt-1 text-xs text-slate-300 list-disc list-inside space-y-0.5">
                    {selectedIncident.criticalFacilities.map((fac, i) => (
                      <li key={i}>{fac}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Meters Cut</span>
                  <span className="text-sm font-mono font-bold text-white">
                    {selectedIncident.affectedMeters}
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Current ETR</span>
                  <span className="text-xs font-mono font-bold text-cyan-400 truncate block mt-0.5">
                    {selectedIncident.etr}
                  </span>
                </div>
              </div>

              {/* CREW ALLOCATION SELECTOR */}
              <div className="pt-2">
                <label className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">
                  Assign Field Unit
                </label>
                <div className="flex gap-2">
                  <select
                    id="crew-select"
                    value={selectedCrew}
                    onChange={(e) => handleAssignCrew(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="">-- Select Crew to Dispatch --</option>
                    {DISPATCH_CREWS.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.specialty}) - {c.status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ETR ADJUSTMENT */}
              <div>
                <label className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">
                  Adjust Estimated Restoration Time (ETR)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customEtr}
                    onChange={(e) => setCustomEtr(e.target.value)}
                    placeholder="e.g. In 45 mins or Today 6:00 PM"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={handleSaveEtr}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-700 cursor-pointer"
                  >
                    Update
                  </button>
                </div>
              </div>

              {/* CITIZEN REPORTED ISSUES & USERNAME ASSIGNMENT */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      User Reported Issues ({selectedIncident.customerReports?.length || 0})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {selectedIncident.code}
                  </span>
                </div>

                {(!selectedIncident.customerReports || selectedIncident.customerReports.length === 0) ? (
                  <div className="bg-slate-950/40 border border-dashed border-slate-800 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-500">
                      No citizen reports attached yet. Outage detected via SCADA sensor telemetry.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedIncident.customerReports.map((rep) => (
                      <div
                        key={rep.id}
                        className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 hover:border-slate-700 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center space-x-1.5 flex-wrap">
                              <span className="text-xs font-bold text-white">
                                {rep.residentName || 'Anonymous Citizen'}
                              </span>
                              {rep.username ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold">
                                  <AtSign className="w-2.5 h-2.5" />
                                  {rep.username.replace(/^@/, '')}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 italic">
                                  (Unassigned)
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Meter: {rep.meterNumber} • {rep.addressText}
                            </div>
                          </div>

                          <button
                            id={`btn-assign-user-${rep.id}`}
                            onClick={() =>
                              setAssignModalData({
                                report: rep,
                                incidentCode: selectedIncident.code,
                                incidentId: selectedIncident.id,
                              })
                            }
                            className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-[11px] font-bold flex items-center space-x-1 transition cursor-pointer"
                            title="Assign or change username for this user report"
                          >
                            <AtSign className="w-3 h-3" />
                            <span>Assign Username</span>
                          </button>
                        </div>

                        {rep.notes && (
                          <p className="text-[11px] text-slate-300 bg-slate-900/60 rounded-lg p-2 mt-2 border border-slate-800/60 leading-relaxed">
                            "{rep.notes}"
                          </p>
                        )}

                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>Reported: {rep.reportedAt}</span>
                          {rep.hasSparkingOrHazard && (
                            <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                              <AlertTriangle className="w-3 h-3" /> Sparking / Wire Hazard
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* DISPATCH ACTION CONTROLS */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest block">
                  Dispatcher Commands
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    id="btn-dispatch-crew"
                    onClick={() =>
                      onUpdateIncident({
                        ...selectedIncident,
                        status: 'CREW_DISPATCHED',
                        crewAssigned: selectedIncident.crewAssigned || 'Unit 3 - Rapid Response',
                      })
                    }
                    className="bg-slate-800 border border-slate-700 py-3 rounded-xl text-xs font-bold text-white hover:bg-slate-700 transition-all cursor-pointer shadow-sm text-center"
                  >
                    Dispatch Crew
                  </button>

                  <button
                    id="btn-set-in-repair"
                    onClick={() =>
                      onUpdateIncident({
                        ...selectedIncident,
                        status: 'IN_PROGRESS',
                        etr: 'In 30 mins (Repairs active)',
                      })
                    }
                    className="bg-slate-800 border border-slate-700 py-3 rounded-xl text-xs font-bold text-white hover:bg-slate-700 transition-all cursor-pointer shadow-sm text-center"
                  >
                    Re-route / In-Repair
                  </button>
                </div>

                <button
                  id="btn-energize-grid"
                  onClick={() =>
                    onUpdateIncident({
                      ...selectedIncident,
                      status: 'RESTORED',
                      etr: 'Grid Energized & Closed',
                    })
                  }
                  className="w-full bg-emerald-600 shadow-lg shadow-emerald-900/30 py-3.5 rounded-xl text-xs font-bold text-white hover:bg-emerald-500 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Finalize Repair & Energize Grid</span>
                </button>
              </div>
            </div>
          </div>

          {/* INCIDENTS TABLE / PRIORITY QUEUE */}
          <div className="bg-[#0B111E] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Priority Queue
              </span>
              <div className="flex flex-wrap gap-1">
                {(['ALL', 'TRIAGED', 'IN_PROGRESS', 'RESTORED', 'HAZARDS'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilter(st)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded transition cursor-pointer ${
                      filter === st ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
              {filteredList.map((inc) => {
                const isSelected = selectedIncident.id === inc.id;
                return (
                  <div
                    key={inc.id}
                    id={`queue-item-${inc.code}`}
                    onClick={() => setSelectedIncident(inc)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-950/20 border-l-2 border-cyan-500'
                        : 'border-l-2 border-transparent hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">{inc.code}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          inc.status === 'RESTORED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : inc.severity === 'CRITICAL' || inc.hazardReported
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {inc.hazardReported ? 'HAZARD' : inc.severity}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white truncate">{inc.locality}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-slate-400">
                        {inc.affectedMeters} Meters • {inc.substation}
                      </p>
                      <span className="text-[9px] font-mono text-slate-500">{inc.etr}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      ) : (
        /* CITIZEN REPORTED ISSUES DIRECTORY TABLE & CARDS */
        <div className="space-y-4">
          <div className="bg-[#0B111E] border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <span>Locality Citizen Reported Issues & User Directory</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  View every outage issue reported by citizens across the locality. Administrators can review reports and assign or change usernames.
                </p>
              </div>

              {/* STAT COUNTERS */}
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-xs font-mono font-bold text-white">{allCitizenReports.length}</div>
                  <div className="text-[10px] text-slate-400">Total Reports</div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-center">
                  <div className="text-xs font-mono font-bold text-rose-400">
                    {allCitizenReports.filter((r) => r.report.hasSparkingOrHazard).length}
                  </div>
                  <div className="text-[10px] text-rose-300">Hazard Flagged</div>
                </div>
              </div>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  placeholder="Search by name, @username, meter #, ticket code, or notes..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {(['ALL', 'HAZARD', 'NORMAL'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setReportHazardFilter(mode)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                      reportHazardFilter === mode
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {mode === 'ALL' ? 'All Reports' : mode === 'HAZARD' ? '⚠ Hazards Only' : 'Standard Reports'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* REPORTS LISTING */}
          {filteredCitizenReports.length === 0 ? (
            <div className="bg-[#0B111E] border border-slate-800 rounded-2xl p-10 text-center">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white">No Matching Citizen Reports Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                No user reported issues match your current query. Try adjusting your search term or hazard filter.
              </p>
              {reportSearch && (
                <button
                  onClick={() => setReportSearch('')}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold cursor-pointer"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCitizenReports.map(({ report, incident }) => (
                <div
                  key={report.id}
                  className={`bg-[#0B111E] border rounded-2xl p-4 shadow-xl transition space-y-3 ${
                    report.hasSparkingOrHazard
                      ? 'border-rose-800/60 bg-rose-950/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="text-sm font-bold text-white">
                          {report.residentName || 'Anonymous Citizen'}
                        </span>
                        {report.username ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold">
                            <AtSign className="w-3 h-3" />
                            {report.username.replace(/^@/, '')}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 italic">
                            (Unassigned Username)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono mt-1">
                        <span>Meter: {report.meterNumber}</span>
                        <span>•</span>
                        <span>{report.contactPhone || 'No phone recorded'}</span>
                      </div>
                    </div>

                    <button
                      id={`btn-assign-report-table-${report.id}`}
                      onClick={() =>
                        setAssignModalData({
                          report,
                          incidentCode: incident.code,
                          incidentId: incident.id,
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/40 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-sm"
                    >
                      <AtSign className="w-3.5 h-3.5" />
                      <span>Assign Username</span>
                    </button>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span className="flex items-center gap-1 font-mono">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        {report.addressText}
                      </span>
                      <span className="font-mono text-slate-500">{report.reportedAt}</span>
                    </div>

                    {report.notes && (
                      <p className="text-slate-200 text-xs leading-relaxed pt-1 border-t border-slate-800/60">
                        "{report.notes}"
                      </p>
                    )}
                  </div>

                  {report.hasSparkingOrHazard && (
                    <div className="flex items-center space-x-2 text-xs text-rose-400 font-bold bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/25">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Live Public Safety Hazard: Wire Down / Transformer Sparking</span>
                    </div>
                  )}

                  {/* INCIDENT CLUSTER FOOTER */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                        {incident.code}
                      </span>
                      <span className="text-slate-400 truncate max-w-[180px]">{incident.locality}</span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedIncident(incident);
                        setViewMode('MAP');
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-bold text-xs flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Inspect On Map</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ASSIGN USERNAME MODAL POPUP */}
      {assignModalData && (
        <AssignUsernameModal
          report={assignModalData.report}
          incidentCode={assignModalData.incidentCode}
          users={users}
          onClose={() => setAssignModalData(null)}
          onSave={(reportId, newUsername, updatedResidentName) => {
            onAssignUsername(assignModalData.incidentId, reportId, newUsername, updatedResidentName);
            setAssignModalData(null);
          }}
        />
      )}
    </div>
  );
}
