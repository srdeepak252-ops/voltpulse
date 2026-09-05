import React, { useState } from 'react';
import {
  AlertTriangle,
  ZapOff,
  MapPin,
  CheckCircle2,
  RefreshCw,
  Camera,
  Info,
  Layers,
  X,
  Sparkles
} from 'lucide-react';
import { OutageIncident, SpatialClusterResult, AppUser } from '../types';
import { clusterOutageReport, CLUSTER_RADIUS_METERS } from '../utils/geo';

interface ReportOutageModalProps {
  incidents: OutageIncident[];
  onClose: () => void;
  currentUser?: AppUser | null;
  onSubmitReport: (
    updatedIncidents: OutageIncident[],
    clusterResult: SpatialClusterResult
  ) => void;
}

export function ReportOutageModal({
  incidents,
  onClose,
  currentUser,
  onSubmitReport,
}: ReportOutageModalProps) {
  const [meterNo, setMeterNo] = useState(currentUser?.meterNumber || '');
  const [residentName, setResidentName] = useState(currentUser?.fullName || '');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '');
  const [address, setAddress] = useState(currentUser?.locality || '');
  const [notes, setNotes] = useState('');
  const [hazard, setHazard] = useState(false);
  const [hazardDetails, setHazardDetails] = useState('');
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simulated GPS state
  const [gpsDetected, setGpsDetected] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({
    lat: 12.9785,
    lng: 77.6410,
  });

  // Preset location quick picks in Bangalore to test clustering easily
  const quickPickLocations = [
    {
      label: 'Indiranagar 100 Ft Rd (Clusters with OUT-8492)',
      address: '422 100 Feet Road, Indiranagar Stage 2, Bengaluru',
      lat: 12.9785,
      lng: 77.6410,
    },
    {
      label: 'Koramangala 80 Ft Rd (Clusters with OUT-8495)',
      address: '92 80 Feet Road, 4th Block Koramangala, Bengaluru',
      lat: 12.9355,
      lng: 77.6248,
    },
    {
      label: 'Whitefield Hope Farm (Clusters with OUT-8501)',
      address: '18 ECC Road, near Hope Farm Circle, Whitefield, Bengaluru',
      lat: 12.9865,
      lng: 77.7342,
    },
    {
      label: 'New Area: HSR Layout Sector 1 (Spawns New Cluster)',
      address: '880 27th Main Road, HSR Layout Sector 1, Bengaluru',
      lat: 12.9125,
      lng: 77.6448,
    },
    {
      label: 'New Area: Malleshwaram 8th Cross (Spawns New Cluster)',
      address: '144 Margosa Road, 8th Cross Malleshwaram, Bengaluru',
      lat: 13.0035,
      lng: 77.5701,
    },
  ];

  const handleSimulateGPS = () => {
    setGpsDetected(true);
    // Picks a realistic nearby coordinate in Indiranagar, Bangalore
    setCoordinates({ lat: 12.9790, lng: 77.6412 });
    setAddress('244 Chinmaya Mission Hospital Rd, Indiranagar, Bengaluru');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const combinedNotes = [
        notes,
        hazardDetails ? `[Hazard Report: ${hazardDetails}]` : '',
        photoName ? `[Attached Hazard Photo: ${photoName}]` : '',
      ]
        .filter(Boolean)
        .join(' ');

      const { updatedIncidents, result } = clusterOutageReport(incidents, {
        meterNumber: meterNo.toUpperCase(),
        userId: currentUser?.id,
        username: currentUser?.username,
        residentName: residentName.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        addressText: address || 'Indiranagar Locality, Bengaluru',
        hasHazard: hazard,
        notes: combinedNotes,
        lat: coordinates.lat,
        lng: coordinates.lng,
      });

      setIsSubmitting(false);
      onSubmitReport(updatedIncidents, result);
    }, 700);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0B111E] border border-slate-800 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative my-auto">
        <button
          id="close-modal-btn"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <ZapOff className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-tight">Report Locality Outage</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-semibold">
                Auto-Clustering Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Submits incident directly to the utility dispatch queue & local transformer monitor.
            </p>
          </div>
        </div>

        {/* Spatial Clustering Explainer Tip */}
        <div className="mb-4 bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-400">
          <Layers className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-200 font-semibold">Automated Spatial Triage: </span>
            Submissions within <span className="text-cyan-400 font-mono font-medium">{CLUSTER_RADIUS_METERS}m</span> of an active grid fault are automatically clustered to prevent crew duplication.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* METER NUMBER */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="meter-input" className="text-slate-300 font-semibold">
                Electricity Meter / CA Account # <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Found on meter sticker / bill</span>
            </div>
            <input
              id="meter-input"
              type="text"
              required
              placeholder="e.g. MTR-994102 or CA-3301"
              value={meterNo}
              onChange={(e) => setMeterNo(e.target.value.toUpperCase())}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono transition"
            />
          </div>

          {/* CONTACT INFO (OPTIONAL) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="resident-name" className="block text-slate-300 font-semibold mb-1">
                Your Name <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <input
                id="resident-name"
                type="text"
                placeholder="e.g. Alex Henderson"
                value={residentName}
                onChange={(e) => setResidentName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
            <div>
              <label htmlFor="contact-phone" className="block text-slate-300 font-semibold mb-1">
                SMS Notification Phone <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <input
                id="contact-phone"
                type="tel"
                placeholder="e.g. (555) 349-2918"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>

          {/* ADDRESS & GPS */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="address-input" className="text-slate-300 font-semibold">
                Incident Address / Locality <span className="text-rose-400">*</span>
              </label>
              <button
                id="simulate-gps-btn"
                type="button"
                onClick={handleSimulateGPS}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <MapPin className="w-3.5 h-3.5" /> Auto-Detect via GPS
              </button>
            </div>
            <input
              id="address-input"
              type="text"
              required
              placeholder="e.g. 402 100 Feet Road, Indiranagar, Bengaluru"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
            />

            {/* QUICK PRESETS PICKER */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" /> Quick Test Locations:
              </span>
              {quickPickLocations.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAddress(qp.address);
                    setCoordinates({ lat: qp.lat, lng: qp.lng });
                    setGpsDetected(true);
                  }}
                  className="text-[10px] bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded transition cursor-pointer"
                >
                  {qp.label}
                </button>
              ))}
            </div>

            {gpsDetected && (
              <div className="text-[10px] text-emerald-400 mt-1.5 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Resolved GIS Datum: {coordinates.lat.toFixed(4)}° N, {coordinates.lng.toFixed(4)}° W</span>
              </div>
            )}
          </div>

          {/* HAZARD TOGGLE */}
          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2.5 transition">
            <label className="flex items-center space-x-2.5 cursor-pointer select-none">
              <input
                id="hazard-checkbox"
                type="checkbox"
                checked={hazard}
                onChange={(e) => setHazard(e.target.checked)}
                className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 h-4 w-4 bg-slate-900 cursor-pointer"
              />
              <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" /> Visible Hazard / Sparking / Fallen Line
              </span>
            </label>

            {hazard && (
              <div className="space-y-2 pt-1">
                <input
                  id="hazard-details-input"
                  type="text"
                  placeholder="Describe danger (e.g. tree branch down on secondary line, smoking transformer)"
                  value={hazardDetails}
                  onChange={(e) => setHazardDetails(e.target.value)}
                  className="w-full bg-slate-900 border border-rose-500/50 rounded-lg px-3 py-2 text-xs text-rose-100 focus:outline-none focus:border-rose-400"
                />
                <p className="text-[10px] text-rose-300/80 flex items-center gap-1">
                  <Info className="w-3 h-3 shrink-0" /> High-hazard flags escalate ticket immediately to CRITICAL status for rapid live-line dispatch.
                </p>
              </div>
            )}
          </div>

          {/* OPTIONAL NOTES & PHOTO UPLOAD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="notes-input" className="block text-slate-300 font-semibold mb-1">
                Observations & Details
              </label>
              <textarea
                id="notes-input"
                rows={2}
                placeholder="Heard loud pop, whole street dark..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Attach Hazard Photo <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <label
                htmlFor="photo-upload-input"
                className="flex flex-col items-center justify-center border border-dashed border-slate-700 hover:border-cyan-500/70 rounded-xl p-3 bg-slate-950/60 cursor-pointer transition text-center min-h-[64px]"
              >
                <Camera className="w-4 h-4 text-cyan-400 mb-1" />
                <span className="text-[11px] text-slate-300 truncate max-w-[180px]">
                  {photoName ? photoName : 'Click to attach photo'}
                </span>
                <span className="text-[9px] text-slate-500">JPG, PNG up to 10MB</span>
                <input
                  id="photo-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-800">
            <button
              id="cancel-report-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-report-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 shadow-lg shadow-rose-900/30 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Transmitting to Grid Ingestion...</span>
                </>
              ) : (
                <>
                  <ZapOff className="w-4 h-4" />
                  <span>Submit Outage Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
