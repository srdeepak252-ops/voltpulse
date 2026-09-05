import React, { useState, useMemo } from 'react';
import {
  Zap,
  ZapOff,
  MapPin,
  Clock,
  CheckCircle2,
  Users,
  Search,
  ShieldAlert,
  Share2,
  HardHat,
  PhoneCall,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Compass,
  Check,
  Building2
} from 'lucide-react';
import { OutageIncident, SpatialClusterResult, AppUser } from '../types';
import { ReportOutageModal } from './ReportOutageModal';
import { GoogleGridMap } from './GoogleGridMap';
import { GRID_ASSETS, DISPATCH_CREWS } from '../data/mockData';

interface ResidentPortalProps {
  incidents: OutageIncident[];
  onNewReport: (
    updatedIncidents: OutageIncident[],
    clusterResult: SpatialClusterResult
  ) => void;
  trackedTicketCode: string;
  onSelectTrackedTicket: (code: string) => void;
  currentUser?: AppUser | null;
}

export function ResidentPortal({
  incidents,
  onNewReport,
  trackedTicketCode,
  onSelectTrackedTicket,
  currentUser,
}: ResidentPortalProps) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState(trackedTicketCode);
  const [clusterNotice, setClusterNotice] = useState<SpatialClusterResult | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showNeighborReports, setShowNeighborReports] = useState(false);
  const [showGisMap, setShowGisMap] = useState(true);
  const [clusterFilter, setClusterFilter] = useState<'ALL' | 'ACTIVE' | 'RESTORED'>('ALL');

  // Tracked ticket object: search by ticket code or meter number
  const activeTicket = useMemo(() => {
    const trimmed = searchQuery.trim().toUpperCase();
    if (!trimmed) {
      return incidents.find((i) => i.code === trackedTicketCode) || incidents[0];
    }
    // Check if matching code
    const byCode = incidents.find((i) => i.code.toUpperCase() === trimmed);
    if (byCode) return byCode;

    // Check if matching meter number in attached customer reports
    const byMeter = incidents.find((i) =>
      i.customerReports?.some((r) => r.meterNumber.toUpperCase().includes(trimmed))
    );
    if (byMeter) return byMeter;

    // Fallback to active tracked or first
    return incidents.find((i) => i.code === trackedTicketCode) || incidents[0];
  }, [searchQuery, trackedTicketCode, incidents]);

  // Handle new submission
  const handleReportSubmitted = (
    updated: OutageIncident[],
    result: SpatialClusterResult
  ) => {
    onNewReport(updated, result);
    onSelectTrackedTicket(result.incident.code);
    setSearchQuery(result.incident.code);
    setShowReportModal(false);
    setClusterNotice(result);

    // Auto-dismiss cluster notice after 10s
    setTimeout(() => {
      setClusterNotice((prev) => (prev === result ? null : prev));
    }, 10000);
  };

  const handleCopyShare = () => {
    if (activeTicket) {
      navigator.clipboard.writeText(
        `VoltPulse Incident ${activeTicket.code} (${activeTicket.locality}): Status is ${activeTicket.status}, ETR is ${activeTicket.etr}`
      );
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  // Filtered locality clusters
  const filteredClusters = useMemo(() => {
    if (clusterFilter === 'ACTIVE') {
      return incidents.filter((i) => i.status !== 'RESTORED');
    }
    if (clusterFilter === 'RESTORED') {
      return incidents.filter((i) => i.status === 'RESTORED');
    }
    return incidents;
  }, [incidents, clusterFilter]);

  // Stats
  const totalMetersCut = useMemo(() => {
    return incidents
      .filter((i) => i.status !== 'RESTORED')
      .reduce((acc, curr) => acc + curr.affectedMeters, 0);
  }, [incidents]);

  return (
    <div className="space-y-8">
      {/* CLUSTER RESULT NOTIFICATION BANNER */}
      {clusterNotice && (
        <div
          id="clustering-alert-banner"
          className={`p-4 rounded-2xl border transition-all animate-in fade-in slide-in-from-top-3 duration-300 ${
            clusterNotice.isNewCluster
              ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-200'
              : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  clusterNotice.isNewCluster ? 'bg-cyan-500/20 text-cyan-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">
                  {clusterNotice.isNewCluster
                    ? `New Locality Outage Cluster Initialized: ${clusterNotice.incident.code}`
                    : `Report Clustered with Root Incident: ${clusterNotice.incident.code}`}
                </h3>
                <p className="text-xs mt-1 text-slate-300 leading-relaxed">
                  {clusterNotice.isNewCluster
                    ? `Your outage report is beyond the 500m threshold of existing incidents. A new municipal grid ticket has been opened and assigned to dispatcher triage.`
                    : `Your meter location is within ${clusterNotice.distanceMeters}m of an existing substation outage. Your report has been merged to accelerate crew response!`}
                </p>
                <div className="mt-2 text-[11px] font-mono opacity-80">
                  Total clustered meters under this node: {clusterNotice.incident.affectedMeters} households
                </div>
              </div>
            </div>
            <button
              onClick={() => setClusterNotice(null)}
              className="text-xs opacity-70 hover:opacity-100 px-2 py-1 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* HERO / STATUS CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-[#0B111E] border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
          <div className="absolute right-0 top-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Grid System Normal: 94.2% Online
            </span>
            <span className="text-xs text-slate-400 px-2.5 py-0.5 rounded bg-slate-800/80 border border-slate-700 font-mono">
              Municipal SCADA Link Active
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white max-w-xl">
            Power Out in Your Home or Locality?
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-xl leading-relaxed">
            Report outages directly to the municipal grid control room. Our smart spatial clustering deduplicates 
            reports into local transformer zones and delivers verified restoration estimates.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              id="report-outage-hero-btn"
              onClick={() => setShowReportModal(true)}
              className="flex items-center space-x-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl shadow-lg shadow-rose-900/30 transition-all cursor-pointer"
            >
              <ZapOff className="w-4 h-4" />
              <span>Report an Outage</span>
            </button>
            <a
              id="emergency-hotline-link"
              href="tel:18005550199"
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-4 py-3 rounded-xl border border-slate-700 transition-all text-xs"
            >
              <PhoneCall className="w-4 h-4 text-cyan-400" />
              <span>Emergency 24/7 Hotline: 1-800-GRID-VOLT</span>
            </a>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center gap-6 text-xs text-slate-400">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Offline Resilience</span>
              <span className="text-slate-300 font-medium">Auto-caches when cell signal drops</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Locality Unserved</span>
              <span className="text-cyan-400 font-mono font-medium">{totalMetersCut.toLocaleString()} meters cut</span>
            </div>
          </div>
        </div>

        {/* QUICK SEARCH WIDGET */}
        <div className="bg-[#0B111E] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-cyan-400" /> Track Existing Ticket
            </h2>
            <p className="text-xs text-slate-400 mt-2">
              Enter your incident ref (e.g. <span className="font-mono text-cyan-400">OUT-8492</span>) or meter code to track restoration.
            </p>
            <div className="mt-4 relative">
              <input
                id="search-ticket-input"
                type="text"
                placeholder="e.g. OUT-8492 or MTR-994102"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  onSelectTrackedTicket(e.target.value.toUpperCase());
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono uppercase tracking-wider transition"
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Currently Viewing:</span>
              <span className="font-mono text-cyan-400 font-bold">{activeTicket.code}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Substation:</span>
              <span className="text-slate-200 truncate max-w-[180px] text-right font-medium">{activeTicket.substation}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Restoration:</span>
              <span className="text-emerald-400 font-mono font-bold">{activeTicket.etr}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TRACKED TICKET DEEP DIVE (LIFECYCLE STEPPER) */}
      <div id="tracked-ticket-card" className="bg-[#0B111E] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-800 text-cyan-300 font-bold border border-slate-700">
                {activeTicket.code}
              </span>
              <h2 className="text-xl font-black text-white tracking-tight">{activeTicket.locality}</h2>
              {activeTicket.hazardReported && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded border border-rose-500/40">
                  <ShieldAlert className="w-3.5 h-3.5" /> Hazard Reported
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
              <span>Impact Node: <b className="text-slate-300 font-normal">{activeTicket.substation}</b></span>
              <span>•</span>
              <span>Reported {activeTicket.reportedAt}</span>
              {activeTicket.causeCategory && (
                <>
                  <span>•</span>
                  <span className="text-amber-400">Cause: {activeTicket.causeCategory}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Estimated Restoration
              </span>
              <span className="text-sm font-mono font-bold text-cyan-400 flex items-center justify-end gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                {activeTicket.etr}
              </span>
            </div>
          </div>
        </div>

        {/* PROGRESS STEPPER */}
        <div className="py-8">
          <OutageStepper currentStatus={activeTicket.status} />
        </div>

        {/* CREW DISPATCH INFO */}
        <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400">Assigned Field Response Unit</div>
              <div className="text-sm font-semibold text-slate-200">
                {activeTicket.crewAssigned ? activeTicket.crewAssigned : 'Pending Dispatch Allocation'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <span>
              Affected Households: <b className="text-white font-mono">{activeTicket.affectedMeters}</b>
            </span>
            <span>•</span>
            <button
              id="share-ticket-status-btn"
              onClick={handleCopyShare}
              className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1.5 cursor-pointer font-medium"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Status Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* INTERACTIVE GOOGLE MAPS GIS NEIGHBORHOOD MAP */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Neighborhood Outage & Crew GIS Map
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 font-mono">
                1,200m Buffer Zone
              </span>
            </div>
            <button
              id="toggle-resident-gmaps-btn"
              onClick={() => setShowGisMap(!showGisMap)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer flex items-center gap-1"
            >
              {showGisMap ? (
                <>
                  <span>Hide Map</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Show Interactive Map</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {showGisMap && (
            <div className="h-[340px] rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative">
              <GoogleGridMap
                incidents={incidents}
                selectedIncident={activeTicket}
                onSelectIncident={(inc) => {
                  onSelectTrackedTicket(inc.code);
                  setSearchQuery(inc.code);
                }}
                gridAssets={GRID_ASSETS}
                crews={DISPATCH_CREWS}
                initialCenter={{ lat: activeTicket.lat, lng: activeTicket.lng }}
                initialZoom={14}
                showControlsBar={true}
              />
            </div>
          )}
        </div>

        {/* NEIGHBOR REPORTS / CLUSTERED LOG (IF ANY) */}
        {activeTicket.customerReports && activeTicket.customerReports.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <button
              onClick={() => setShowNeighborReports(!showNeighborReports)}
              className="flex items-center justify-between w-full text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Neighbor Reports Clustered with this Transformer ({activeTicket.customerReports.length})
              </span>
              {showNeighborReports ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showNeighborReports && (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                {activeTicket.customerReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs flex items-start justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-cyan-400 font-bold">{rep.meterNumber}</span>
                        {rep.residentName && <span className="text-slate-300">• {rep.residentName}</span>}
                        {rep.hasSparkingOrHazard && (
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-bold">
                            Hazard Flagged
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 mt-1">{rep.addressText}</div>
                      {rep.notes && <div className="text-slate-500 italic mt-0.5">"{rep.notes}"</div>}
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0">{rep.reportedAt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* LOCALITY OUTAGE FEED */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" /> Active Locality Outage Clusters
            </h2>
            <span className="text-xs text-slate-400">
              Auto-synchronized with SCADA telemetry & transformer deduplication engine
            </span>
          </div>

          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            {(['ALL', 'ACTIVE', 'RESTORED'] as const).map((filterOpt) => (
              <button
                key={filterOpt}
                onClick={() => setClusterFilter(filterOpt)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  clusterFilter === filterOpt
                    ? 'bg-slate-800 text-cyan-400 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {filterOpt}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredClusters.map((inc) => {
            const isSelected = activeTicket.code === inc.code;
            return (
              <div
                key={inc.id}
                id={`cluster-card-${inc.code}`}
                onClick={() => {
                  onSelectTrackedTicket(inc.code);
                  setSearchQuery(inc.code);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#0B111E] border-cyan-500 ring-1 ring-cyan-500/50 shadow-lg shadow-cyan-950/50'
                    : 'bg-[#0B111E] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-cyan-400">{inc.code}</span>
                      <h3 className="font-bold text-white text-sm mt-0.5 leading-snug">{inc.locality}</h3>
                    </div>
                    <StatusBadge status={inc.status} />
                  </div>

                  <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{inc.substation}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
                  <span className="font-mono">{inc.affectedMeters} homes</span>
                  <span className="text-cyan-400 font-mono font-bold">{inc.etr}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SAFETY & GUIDANCE ACCORDION */}
      <div className="bg-[#0B111E] border border-slate-800 rounded-2xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-400" /> Resident Power Outage Safety Guidelines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <span className="font-bold text-white block mb-1">1. Stay Clear of Downed Lines</span>
            Keep at least 35 feet (10 meters) away from any fallen wire. Assume all downed wires are energized and deadly.
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <span className="font-bold text-white block mb-1">2. Keep Refrigerators Closed</span>
            An unopened refrigerator will keep food cold for about 4 hours. A full freezer maintains temperature for 48 hours.
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <span className="font-bold text-white block mb-1">3. Protect Sensitive Electronics</span>
            Unplug delicate equipment or turn off breakers to prevent surge damage when voltage is re-energized.
          </div>
        </div>
      </div>

      {/* REPORT OUTAGE MODAL */}
      {showReportModal && (
        <ReportOutageModal
          incidents={incidents}
          currentUser={currentUser}
          onClose={() => setShowReportModal(false)}
          onSubmitReport={handleReportSubmitted}
        />
      )}
    </div>
  );
}

// =====================================================================
// REUSABLE PROGRESS STEPPER & STATUS BADGES
// =====================================================================

export function OutageStepper({ currentStatus }: { currentStatus: OutageIncident['status'] }) {
  const steps: { key: OutageIncident['status']; label: string; desc: string }[] = [
    { key: 'TRIAGED', label: 'Reported & Triaged', desc: 'Clustered with local transformer' },
    { key: 'CREW_DISPATCHED', label: 'Crew Dispatched', desc: 'Field technician en route' },
    { key: 'IN_PROGRESS', label: 'Repairs In Progress', desc: 'Hardware isolation / line repair' },
    { key: 'RESTORED', label: 'Grid Energized', desc: 'Voltage verified & ticket closed' },
  ];

  const getStepIndex = (status: OutageIncident['status']) => {
    switch (status) {
      case 'TRIAGED':
        return 0;
      case 'CREW_DISPATCHED':
        return 1;
      case 'IN_PROGRESS':
        return 2;
      case 'RESTORED':
        return 3;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(currentStatus);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
      {steps.map((step, idx) => {
        const isPassed = idx < currentIndex;
        const isCurrent = idx === currentIndex;

        return (
          <div key={step.key} className="relative flex flex-col items-center text-center">
            {/* Step Node */}
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition-all z-10 ${
                isPassed
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 border border-cyan-400'
                  : isCurrent
                  ? 'bg-amber-600 text-white border-2 border-white ring-4 ring-amber-500/25 shadow-lg shadow-amber-900/40 animate-pulse'
                  : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}
            >
              {isPassed ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
            </div>

            <div className="mt-2.5">
              <span
                className={`text-xs font-bold block ${
                  isCurrent ? 'text-amber-400' : isPassed ? 'text-cyan-400' : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block max-w-[160px]">{step.desc}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StatusBadge({ status }: { status: OutageIncident['status'] }) {
  switch (status) {
    case 'TRIAGED':
      return (
        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
          Triaged
        </span>
      );
    case 'CREW_DISPATCHED':
      return (
        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 whitespace-nowrap">
          Crew En Route
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap">
          In Progress
        </span>
      );
    case 'RESTORED':
      return (
        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
          Restored
        </span>
      );
  }
}
