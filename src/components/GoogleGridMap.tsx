import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  Circle,
  useMap,
  MapControl,
  ControlPosition,
} from '@vis.gl/react-google-maps';
import {
  Zap,
  HardHat,
  AlertTriangle,
  Layers,
  Radio,
  Navigation,
  Compass,
  Key,
  ExternalLink,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Info,
  Truck,
  RotateCcw,
  Sliders,
  MapPin,
  Cpu
} from 'lucide-react';
import { OutageIncident, GridAsset, DispatchCrew, CustomerReport } from '../types';

interface GoogleGridMapProps {
  incidents: OutageIncident[];
  selectedIncident: OutageIncident | null;
  onSelectIncident: (incident: OutageIncident) => void;
  gridAssets?: GridAsset[];
  crews?: DispatchCrew[];
  onOpenReportModal?: () => void;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  height?: string;
  showControlsBar?: boolean;
}

// Map Controller for programmatic camera movements
function MapCameraController({
  selectedIncident,
}: {
  selectedIncident: OutageIncident | null;
}) {
  const map = useMap('gmp-main-map');

  useEffect(() => {
    if (!map || !selectedIncident) return;
    map.panTo({ lat: selectedIncident.lat, lng: selectedIncident.lng });
    // Smooth zoom if too far
    const currentZoom = map.getZoom() || 13;
    if (currentZoom < 14) {
      map.setZoom(14);
    }
  }, [map, selectedIncident]);

  return null;
}

export function GoogleGridMap({
  incidents,
  selectedIncident,
  onSelectIncident,
  gridAssets = [],
  crews = [],
  onOpenReportModal,
  initialCenter = { lat: 34.0522, lng: -118.2437 },
  initialZoom = 13,
  height = '100%',
  showControlsBar = true,
}: GoogleGridMapProps) {
  // Check for API key in environment or localStorage
  const envKey =
    typeof import.meta !== 'undefined' && (import.meta as any).env
      ? (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || ''
      : '';
  const [apiKey, setApiKey] = useState<string>(() => {
    return envKey || localStorage.getItem('gmp_api_key') || '';
  });
  const [keyInput, setKeyInput] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Layer Visibility Controls
  const [showRadii, setShowRadii] = useState(true);
  const [showAssets, setShowAssets] = useState(true);
  const [showCrews, setShowCrews] = useState(true);
  const [showReports, setShowReports] = useState(true);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');

  // Active InfoWindow target
  const [infoWindowIncident, setInfoWindowIncident] = useState<OutageIncident | null>(
    selectedIncident
  );

  useEffect(() => {
    if (selectedIncident) {
      setInfoWindowIncident(selectedIncident);
    }
  }, [selectedIncident]);

  const handleSaveKey = (keyToSave: string) => {
    const trimmed = keyToSave.trim();
    if (trimmed) {
      localStorage.setItem('gmp_api_key', trimmed);
      setApiKey(trimmed);
      setShowKeyModal(false);
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('gmp_api_key');
    setApiKey(envKey || '');
  };

  // Compute map center
  const defaultCenter = useMemo(() => {
    if (selectedIncident) {
      return { lat: selectedIncident.lat, lng: selectedIncident.lng };
    }
    if (incidents.length > 0) {
      return { lat: incidents[0].lat, lng: incidents[0].lng };
    }
    return initialCenter;
  }, [selectedIncident, incidents, initialCenter]);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#060913] overflow-hidden select-none">
      {/* MAP TOP CONTROL STRIP */}
      {showControlsBar && (
        <div className="p-2.5 border-b border-slate-800 bg-slate-950/80 backdrop-blur flex flex-wrap items-center justify-between gap-2 z-10">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              Google Maps GIS Grid
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 font-mono">
              DEMO_MAP_ID
            </span>
          </div>

          {/* Quick Layer Toggles */}
          <div className="flex items-center space-x-1.5 text-xs">
            {/* 1,200m Cluster Radius Toggle */}
            <button
              id="toggle-cluster-radius-btn"
              onClick={() => setShowRadii(!showRadii)}
              className={`px-2 py-1 rounded text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                showRadii
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
              title="Toggle 1,200m Spatial Clustering Radii"
            >
              <Radio className="w-3 h-3" />
              <span>1,200m Radius</span>
            </button>

            {/* Substations & Transformers Toggle */}
            <button
              id="toggle-grid-assets-btn"
              onClick={() => setShowAssets(!showAssets)}
              className={`px-2 py-1 rounded text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                showAssets
                  ? 'bg-amber-950 text-amber-300 border-amber-700'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
              title="Toggle Grid Substations & Feeder Assets"
            >
              <Cpu className="w-3 h-3" />
              <span>Substations</span>
            </button>

            {/* Utility Dispatch Crews Toggle */}
            <button
              id="toggle-crews-btn"
              onClick={() => setShowCrews(!showCrews)}
              className={`px-2 py-1 rounded text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                showCrews
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
              title="Toggle Deployed Line Crews"
            >
              <Truck className="w-3 h-3" />
              <span>Crews ({crews.length})</span>
            </button>

            {/* API Key / Demo Key Config Button */}
            <button
              id="gmp-key-settings-btn"
              onClick={() => setShowKeyModal(true)}
              className={`px-2 py-1 rounded text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                apiKey
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
              }`}
              title="Configure Google Maps API Key or Demo Key"
            >
              <Key className="w-3 h-3" />
              <span>{apiKey ? 'API Key Set' : 'Configure Key'}</span>
            </button>
          </div>
        </div>
      )}

      {/* MAP CANVAS CONTAINER */}
      <div className="relative flex-1 w-full h-full min-h-[380px]">
        {/* Render Google Maps using @vis.gl/react-google-maps */}
        <APIProvider apiKey={apiKey}>
          <Map
            id="gmp-main-map"
            mapId="DEMO_MAP_ID"
            defaultCenter={defaultCenter}
            defaultZoom={initialZoom}
            gestureHandling="greedy"
            disableDefaultUI={false}
            mapTypeId={mapType}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Auto Camera Panning */}
            <MapCameraController selectedIncident={selectedIncident} />

            {/* 1,200m SPATIAL CLUSTERING RADII */}
            {showRadii &&
              incidents.map((inc) => {
                const isSelected = selectedIncident?.id === inc.id;
                const isRestored = inc.status === 'RESTORED';
                const strokeColor = isRestored
                  ? '#10b981'
                  : inc.severity === 'CRITICAL'
                  ? '#f43f5e'
                  : inc.severity === 'HIGH'
                  ? '#f59e0b'
                  : '#06b6d4';

                return (
                  <Circle
                    key={`circle-${inc.id}`}
                    center={{ lat: inc.lat, lng: inc.lng }}
                    radius={1200}
                    strokeColor={strokeColor}
                    strokeOpacity={isSelected ? 0.9 : 0.45}
                    strokeWeight={isSelected ? 3 : 1.5}
                    fillColor={strokeColor}
                    fillOpacity={isSelected ? 0.14 : 0.05}
                  />
                );
              })}

            {/* GRID ASSETS (Substations & Transformers) */}
            {showAssets &&
              gridAssets.map((asset) => (
                <AdvancedMarker
                  key={`asset-${asset.id}`}
                  position={{ lat: asset.lat, lng: asset.lng }}
                  title={`${asset.assetTag} (${asset.assetType}) - ${asset.status}`}
                >
                  <div className="group relative cursor-help">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shadow-lg border transition-transform hover:scale-110 ${
                        asset.status === 'TRIPPED'
                          ? 'bg-rose-950/90 text-rose-300 border-rose-500 shadow-rose-900/50'
                          : asset.status === 'OVERLOAD_WARNING'
                          ? 'bg-amber-950/90 text-amber-300 border-amber-500 shadow-amber-900/50'
                          : 'bg-slate-900/90 text-cyan-400 border-cyan-500/60 shadow-cyan-900/50'
                      }`}
                    >
                      <Cpu className="w-3.5 h-3.5" />
                    </div>
                    {/* Tooltip */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-slate-700 px-2 py-1 rounded text-[10px] text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-30 font-mono shadow-xl">
                      <div className="font-bold text-white">{asset.assetTag}</div>
                      <div className="text-slate-400">
                        {asset.capacityKva.toLocaleString()} kVA · {asset.status}
                      </div>
                    </div>
                  </div>
                </AdvancedMarker>
              ))}

            {/* UTILITY DISPATCH CREWS */}
            {showCrews &&
              crews
                .filter((c) => c.lat && c.lng)
                .map((crew) => (
                  <AdvancedMarker
                    key={`crew-${crew.id}`}
                    position={{ lat: crew.lat!, lng: crew.lng! }}
                    title={`${crew.name} - ${crew.status}`}
                  >
                    <div className="group relative cursor-pointer">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-xl border-2 transition-transform hover:scale-110 ${
                          crew.status === 'ON_SITE'
                            ? 'bg-emerald-600 text-white border-white shadow-emerald-900/50 animate-bounce'
                            : crew.status === 'EN_ROUTE'
                            ? 'bg-cyan-600 text-white border-white shadow-cyan-900/50'
                            : 'bg-slate-800 text-slate-300 border-slate-600'
                        }`}
                      >
                        <Truck className="w-4 h-4" />
                      </div>
                      {/* Tooltip */}
                      <div className="absolute top-9 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-slate-700 px-2.5 py-1.5 rounded text-[10px] text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-30 shadow-xl">
                        <div className="font-bold text-white flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {crew.name}
                        </div>
                        <div className="text-cyan-300 font-mono text-[9px]">
                          {crew.status} · {crew.unit}
                        </div>
                      </div>
                    </div>
                  </AdvancedMarker>
                ))}

            {/* CITIZEN REPORTS PINS WITHIN INCIDENTS */}
            {showReports &&
              incidents.map((inc) =>
                (inc.customerReports || []).map((rep) => (
                  <AdvancedMarker
                    key={`rep-${rep.id}`}
                    position={{ lat: rep.lat, lng: rep.lng }}
                    title={`Citizen Report: ${rep.meterNumber} - ${rep.residentName || 'Resident'}`}
                  >
                    <div className="group relative cursor-pointer">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center border transition-transform hover:scale-125 ${
                          rep.hasSparkingOrHazard
                            ? 'bg-rose-500 border-white text-[8px] text-white shadow-rose-500/50 shadow-md'
                            : 'bg-cyan-500 border-white text-[8px] text-white shadow-cyan-500/50 shadow-md'
                        }`}
                      >
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                      {/* Tooltip */}
                      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-slate-700 p-2 rounded text-[10px] text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-30 shadow-xl">
                        <div className="font-bold text-white">
                          {rep.residentName || rep.username || 'Resident'}
                        </div>
                        <div className="text-slate-400 font-mono text-[9px]">
                          {rep.meterNumber} · {rep.addressText}
                        </div>
                        {rep.hasSparkingOrHazard && (
                          <div className="text-rose-400 font-bold text-[9px] flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Hazard / Downed Wire Reported
                          </div>
                        )}
                      </div>
                    </div>
                  </AdvancedMarker>
                ))
              )}

            {/* OUTAGE INCIDENT CLUSTERS (Advanced Markers) */}
            {incidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              const isRestored = inc.status === 'RESTORED';

              return (
                <AdvancedMarker
                  key={`incident-${inc.id}`}
                  position={{ lat: inc.lat, lng: inc.lng }}
                  onClick={() => {
                    onSelectIncident(inc);
                    setInfoWindowIncident(inc);
                  }}
                  title={`${inc.code} - ${inc.locality} (${inc.affectedMeters} meters)`}
                >
                  <div className="relative group cursor-pointer">
                    {/* Pulsing ring for active incidents */}
                    {!isRestored && (
                      <span
                        className={`absolute -inset-2.5 rounded-full opacity-75 animate-ping pointer-events-none ${
                          inc.severity === 'CRITICAL'
                            ? 'bg-rose-500/50'
                            : inc.severity === 'HIGH'
                            ? 'bg-amber-500/50'
                            : 'bg-cyan-500/50'
                        }`}
                      />
                    )}

                    {/* Main Incident Pin */}
                    <div
                      className={`rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-200 ${
                        isSelected
                          ? 'w-12 h-12 ring-4 ring-cyan-400 border-2 border-white scale-115'
                          : 'w-10 h-10 border-2 border-slate-900 hover:scale-110'
                      } ${
                        isRestored
                          ? 'bg-emerald-600 text-white shadow-emerald-900/60'
                          : inc.severity === 'CRITICAL'
                          ? 'bg-rose-600 text-white shadow-rose-900/60'
                          : inc.severity === 'HIGH'
                          ? 'bg-amber-600 text-white shadow-amber-900/60'
                          : 'bg-cyan-600 text-white shadow-cyan-900/60'
                      }`}
                    >
                      <Zap className="w-5 h-5 fill-current" />
                    </div>

                    {/* Tag badge with Code */}
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-700 px-1.5 py-0.5 rounded text-[9px] font-mono text-cyan-300 font-bold whitespace-nowrap shadow-lg">
                      {inc.code}
                    </div>
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* ANCHORED INFOWINDOW FOR SELECTED INCIDENT */}
            {infoWindowIncident && (
              <InfoWindow
                position={{
                  lat: infoWindowIncident.lat,
                  lng: infoWindowIncident.lng,
                }}
                maxWidth={320}
                onCloseClick={() => setInfoWindowIncident(null)}
              >
                <div className="p-2 text-slate-900 font-sans">
                  {/* Header with Code & Status */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-sm text-cyan-800">
                        {infoWindowIncident.code}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${
                          infoWindowIncident.severity === 'CRITICAL'
                            ? 'bg-rose-600'
                            : infoWindowIncident.severity === 'HIGH'
                            ? 'bg-amber-600'
                            : 'bg-cyan-600'
                        }`}
                      >
                        {infoWindowIncident.severity}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {infoWindowIncident.status}
                    </span>
                  </div>

                  {/* Locality & Substation */}
                  <div className="mb-2">
                    <div className="font-bold text-xs text-slate-800">
                      {infoWindowIncident.locality}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Feed: {infoWindowIncident.substation}
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded border border-slate-200 text-[11px] mb-2">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">
                        Affected Meters
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {infoWindowIncident.affectedMeters.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">
                        Restoration ETR
                      </span>
                      <span className="font-mono font-bold text-amber-700 truncate block">
                        {infoWindowIncident.etr}
                      </span>
                    </div>
                  </div>

                  {/* Hazard Warning if active */}
                  {infoWindowIncident.hazardReported && (
                    <div className="mb-2 p-1.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                      <span>Sparking or downed line reported in cluster</span>
                    </div>
                  )}

                  {/* Crew Assignment */}
                  <div className="text-[11px] text-slate-600 mb-2.5 flex items-center gap-1.5">
                    <HardHat className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>
                      Crew:{' '}
                      <strong className="text-slate-800">
                        {infoWindowIncident.crewAssigned || 'Unassigned (Standby)'}
                      </strong>
                    </span>
                  </div>

                  {/* Action Link */}
                  <button
                    onClick={() => onSelectIncident(infoWindowIncident)}
                    className="w-full py-1 text-center bg-cyan-700 hover:bg-cyan-800 text-white rounded text-xs font-semibold transition cursor-pointer"
                  >
                    Select in Command Desk
                  </button>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>

        {/* FLOATING HUD: TELEMETRY & SPATIAL SUMMARY */}
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
          <div className="bg-slate-950/90 border border-slate-800/90 p-3 rounded-2xl backdrop-blur shadow-2xl pointer-events-auto">
            <h3 className="text-xs font-bold text-white mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              1,200m Spatial Topology
            </h3>
            <div className="flex space-x-4 text-left">
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">
                  Active Clusters
                </p>
                <p className="text-xs font-mono font-bold text-cyan-400">
                  {incidents.filter((i) => i.status !== 'RESTORED').length}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">
                  Crews Active
                </p>
                <p className="text-xs font-mono font-bold text-emerald-400">
                  {crews.filter((c) => c.status !== 'AVAILABLE').length}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">
                  Substations
                </p>
                <p className="text-xs font-mono font-bold text-slate-300">
                  {gridAssets.length} Nodes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FLOATING MAP TYPE SWITCHER (TOP RIGHT) */}
        <div className="absolute top-4 right-4 z-20 pointer-events-none flex flex-col items-end gap-1.5">
          <div className="bg-slate-950/90 border border-slate-800 p-1 rounded-xl shadow-2xl backdrop-blur pointer-events-auto flex items-center gap-1 text-[10px]">
            <button
              onClick={() => setMapType('roadmap')}
              className={`px-2 py-0.5 rounded font-semibold cursor-pointer transition ${
                mapType === 'roadmap'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Roadmap
            </button>
            <button
              onClick={() => setMapType('satellite')}
              className={`px-2 py-0.5 rounded font-semibold cursor-pointer transition ${
                mapType === 'satellite'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapType('hybrid')}
              className={`px-2 py-0.5 rounded font-semibold cursor-pointer transition ${
                mapType === 'hybrid'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hybrid
            </button>
          </div>

          {/* Quick Recenter Button */}
          {selectedIncident && (
            <button
              onClick={() => onSelectIncident(selectedIncident)}
              className="bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-mono shadow-lg backdrop-blur pointer-events-auto flex items-center gap-1.5 cursor-pointer transition"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Center {selectedIncident.code}</span>
            </button>
          )}
        </div>
      </div>

      {/* GOOGLE MAPS API KEY CONFIG MODAL */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Google Maps Platform Key</h3>
                  <p className="text-xs text-slate-400">Configure API Key or Demo Key</p>
                </div>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              {/* Maps Demo Key Notice */}
              <div className="p-3 bg-cyan-950/40 border border-cyan-800/60 rounded-xl space-y-1.5">
                <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <SparklesIcon className="w-3.5 h-3.5 text-cyan-400" />
                  Free Prototyping with Maps Demo Key
                </div>
                <p className="text-slate-300 leading-relaxed">
                  You can obtain a free <strong>Google Maps Demo Key</strong> with zero billing setup
                  or cloud project required for fast prototyping.
                </p>
                <a
                  href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold underline mt-1"
                >
                  <span>Open Maps Demo Key Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Input for key */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  API Key / Demo Key
                </label>
                <input
                  type="text"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder={apiKey ? '••••••••••••••••••••••••' : 'AIzaSy...'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Stored securely in browser local storage or configured in{' '}
                  <code className="text-cyan-400">.env</code> as{' '}
                  <code className="text-cyan-400">VITE_GOOGLE_MAPS_API_KEY</code>.
                </p>
              </div>

              {/* Currently Active Key Status */}
              {apiKey && (
                <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Key is currently active
                  </span>
                  <button
                    onClick={handleClearKey}
                    className="text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer underline"
                  >
                    Remove Key
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 mt-6 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => handleSaveKey(keyInput)}
                disabled={!keyInput.trim()}
                className="px-4 py-1.5 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 rounded-lg transition cursor-pointer"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
