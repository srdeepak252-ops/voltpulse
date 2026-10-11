import React, { useState } from 'react';
import {
  CheckCircle2,
  X,
  Zap,
  Radio,
  ShieldCheck,
  HardHat,
  Users,
  Building,
  AlertTriangle,
  Send,
  Sparkles,
} from 'lucide-react';
import { OutageIncident, AppUser } from '../types';

interface AdminSolveProblemModalProps {
  incident: OutageIncident;
  onClose: () => void;
  onConfirmSolve: (incidentId: string, resolutionNotes: string, broadcastMessage: string) => void;
  currentUser: AppUser | null;
}

export function AdminSolveProblemModal({
  incident,
  onClose,
  onConfirmSolve,
  currentUser,
}: AdminSolveProblemModalProps) {
  const adminName = currentUser?.fullName || 'Senior Grid Controller';
  
  const defaultResolutionNote = `Grid feeder breaker closed at ${incident.substation}. Voltage verified at nominal 230V/11kV. All ${incident.affectedMeters.toLocaleString()} consumer meters energized and verified normal.`;
  
  const defaultBroadcast = `✅ RESOLVED: Power fully restored in ${incident.locality}. All ${incident.affectedMeters.toLocaleString()} meters energized. Verified by ${incident.crewAssigned || 'Field Crew'} & Admin ${adminName}.`;

  const [resolutionNotes, setResolutionNotes] = useState(defaultResolutionNote);
  const [broadcastText, setBroadcastText] = useState(defaultBroadcast);
  const [shouldBroadcast, setShouldBroadcast] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      onConfirmSolve(
        incident.id,
        resolutionNotes.trim(),
        shouldBroadcast ? broadcastText.trim() : ''
      );
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#0B111E] border border-emerald-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                  {incident.code}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                  Admin Resolution Command
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                Mark Problem as Solved & Restore Grid
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Incident Summary Card */}
        <div className="my-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
          <div className="flex flex-wrap items-center justify-between text-xs gap-2">
            <span className="text-slate-400">Location:</span>
            <span className="font-bold text-white text-right">{incident.locality}</span>
          </div>
          <div className="flex flex-wrap items-center justify-between text-xs gap-2">
            <span className="text-slate-400">Substation Feeder:</span>
            <span className="font-mono text-cyan-400 text-right">{incident.substation}</span>
          </div>
          <div className="flex flex-wrap items-center justify-between text-xs gap-2">
            <span className="text-slate-400">Restoration Scope:</span>
            <span className="font-mono font-bold text-emerald-400 text-right">
              {incident.affectedMeters.toLocaleString()} consumer meters energized
            </span>
          </div>
          {incident.crewAssigned && (
            <div className="flex flex-wrap items-center justify-between text-xs gap-2">
              <span className="text-slate-400">Dispatched Field Unit:</span>
              <span className="font-semibold text-amber-300 text-right">
                {incident.crewAssigned}
              </span>
            </div>
          )}
          {incident.latestCrewStatus && (
            <div className="flex flex-wrap items-center justify-between text-xs gap-2">
              <span className="text-slate-400">Latest Crew Field Status:</span>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                {incident.latestCrewStatus.replace(/_/g, ' ')}
              </span>
            </div>
          )}
        </div>

        {/* Form Controls */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Official Admin Resolution Notes & Sign-Off</span>
              <span className="text-[10px] text-slate-500 font-mono">Logged to Grid Audit</span>
            </label>
            <textarea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition leading-relaxed resize-none"
              placeholder="Detail the technical actions taken to resolve the outage..."
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Live Broadcast Advisory to Everyone</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] text-emerald-400 font-medium">
                <input
                  type="checkbox"
                  checked={shouldBroadcast}
                  onChange={(e) => setShouldBroadcast(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-0 bg-slate-900 cursor-pointer"
                />
                <span>Broadcast to all</span>
              </label>
            </div>
            <textarea
              rows={2}
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              disabled={!shouldBroadcast}
              className={`w-full bg-slate-950 border rounded-xl p-3 text-xs transition leading-relaxed resize-none ${
                shouldBroadcast
                  ? 'border-emerald-500/50 text-emerald-200 focus:outline-none focus:border-emerald-400'
                  : 'border-slate-800 text-slate-500 opacity-60'
              }`}
              placeholder="Message to display across live ticker and resident notifications..."
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Will immediately update the top broadcast ticker and notify all residents, mobile users, and dispatch crew consoles.
            </p>
          </div>

          <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex items-center space-x-2 text-xs text-emerald-300">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              Action will mark ticket as <strong className="text-white">RESTORED</strong>, release assigned crew to AVAILABLE, and sync telemetry grid-wide.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Energizing & Broadcasting...' : 'Mark as Solved & Update Everyone'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
