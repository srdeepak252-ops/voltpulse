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
  SlidersHorizontal,
  MapPin,
  Cpu,
  Flame,
  Activity,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Play,
  Pause,
  FastForward,
  Gauge,
  ArrowUpRight,
  RefreshCw,
  Wrench,
} from 'lucide-react';
import { OutageIncident, GridAsset, DispatchCrew, CustomerReport } from '../types';
import { GoogleHeatmapLayer } from './GoogleHeatmapLayer';
import { GoogleCrewRouteLayer } from './GoogleCrewRouteLayer';
import { generateIncidentHeatmapPoints } from '../utils/heatmapData';
import { getCardinalDirection } from '../utils/crewSimulation';

const HEATMAP_GRADIENTS: Record<'thermal' | 'crimson' | 'neon', string[]> = {
  thermal: [
    'rgba(0, 255, 255, 0)',
    'rgba(0, 255, 255, 1)',
    'rgba(0, 191, 255, 1)',
    'rgba(0, 127, 255, 1)',
    'rgba(0, 255, 0, 1)',
    'rgba(255, 255, 0, 1)',
    'rgba(255, 128, 0, 1)',
    'rgba(255, 0, 0, 1)',
  ],
  crimson: [
    'rgba(255, 255, 0, 0)',
    'rgba(255, 235, 59, 1)',
    'rgba(255, 152, 0, 1)',
    'rgba(244, 67, 54, 1)',
    'rgba(213, 0, 0, 1)',
    'rgba(136, 14, 79, 1)',
  ],
  neon: [
    'rgba(102, 0, 255, 0)',
    'rgba(102, 0, 255, 1)',
    'rgba(0, 204, 255, 1)',
    'rgba(0, 255, 153, 1)',
    'rgba(255, 255, 0, 1)',
    'rgba(255, 0, 128, 1)',
  ],
};

const GOOGLE_MAPS_LIBRARIES: ('marker')[] = ['marker'];

interface GoogleGridMapProps {
  incidents: OutageIncident[];
  selectedIncident: OutageIncident | null;
  onSelectIncident: (incident: OutageIncident) => void;
  gridAssets?: GridAsset[];
  crews?: DispatchCrew[];
  onUpdateCrews?: (crews: DispatchCrew[]) => void;
  onSelectCrew?: (crew: DispatchCrew) => void;
  onDispatchCrew?: (crewId: string, incidentId: string) => void;
  onStepCrewSimulation?: () => void;
  onResetCrews?: () => void;
  isSimulatingCrews?: boolean;
  onToggleSimulatingCrews?: (active: boolean) => void;
  crewSimSpeed?: number;
  onChangeSimSpeed?: (speed: number) => void;
  onOpenReportModal?: () => void;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  height?: string;
  showControlsBar?: boolean;
  showHeatmap?: boolean;
  onToggleHeatmap?: (show: boolean) => void;
}

// Map Controller for programmatic camera movements
function MapCameraController({
  selectedIncident,
  focusedCrew,
}: {
  selectedIncident: OutageIncident | null;
  focusedCrew: DispatchCrew | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (focusedCrew && focusedCrew.lat && focusedCrew.lng) {
      map.panTo({ lat: focusedCrew.lat, lng: focusedCrew.lng });
    } else if (selectedIncident) {
      map.panTo({ lat: selectedIncident.lat, lng: selectedIncident.lng });
      const currentZoom = map.getZoom() || 13;
      if (currentZoom < 14) {
        map.setZoom(14);
      }
    }
  }, [map, selectedIncident, focusedCrew]);

  return null;
}

export function GoogleGridMap({
  incidents,
  selectedIncident,
  onSelectIncident,
  gridAssets = [],
  crews = [],
  onUpdateCrews,
  onSelectCrew,
  onDispatchCrew,
  onStepCrewSimulation,
  onResetCrews,
  isSimulatingCrews = true,
  onToggleSimulatingCrews,
  crewSimSpeed = 1,
  onChangeSimSpeed,
  onOpenReportModal,
  initialCenter = { lat: 12.9716, lng: 77.6408 },
  initialZoom = 13,
  height = '100%',
  showControlsBar = true,
  showHeatmap: showHeatmapProp,
  onToggleHeatmap,
}: GoogleGridMapProps) {
  // Check for API key in environment or localStorage
  const envKey =
    typeof import.meta !== 'undefined' && (import.meta as any).env
      ? (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || ''
      : '';
  const [apiKey, setApiKey] = useState<string>(() => {
    return envKey || (typeof localStorage !== 'undefined' ? localStorage.getItem('gmp_api_key') || '' : '');
  });

  useEffect(() => {
    if (envKey && apiKey !== envKey) {
      setApiKey(envKey);
    }
  }, [envKey, apiKey]);
  const [keyInput, setKeyInput] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Layer Visibility Controls
  const [showRadii, setShowRadii] = useState(true);
  const [showAssets, setShowAssets] = useState(true);
  const [showCrews, setShowCrews] = useState(true);
  const [showCrewRoutes, setShowCrewRoutes] = useState(true);
  const [showFleetHud, setShowFleetHud] = useState(true);
  const [showReports, setShowReports] = useState(true);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');

  // Real-time Fleet Telemetry & Inspection States
  const [infoWindowCrew, setInfoWindowCrew] = useState<DispatchCrew | null>(null);
  const [focusedCrew, setFocusedCrew] = useState<DispatchCrew | null>(null);
  const [quickDispatchCrewId, setQuickDispatchCrewId] = useState<string>('crew-3');
  const [quickDispatchIncidentId, setQuickDispatchIncidentId] = useState<string>('inc-103');

  // Keep infoWindowCrew synced with live moving coordinates
  useEffect(() => {
    if (infoWindowCrew) {
      const liveCrew = crews.find((c) => c.id === infoWindowCrew.id);
      if (liveCrew) {
        setInfoWindowCrew(liveCrew);
      }
    }
  }, [crews]);

  // Heatmap Layer Visibility & Configuration States
  const [internalShowHeatmap, setInternalShowHeatmap] = useState(true);
  const isHeatmapActive = typeof showHeatmapProp !== 'undefined' ? showHeatmapProp : internalShowHeatmap;
  const handleToggleHeatmap = (val: boolean) => {
    setInternalShowHeatmap(val);
    onToggleHeatmap?.(val);
  };

  const [heatmapRadius, setHeatmapRadius] = useState<number>(36);
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.8);
  const [heatmapGradientPreset, setHeatmapGradientPreset] = useState<'thermal' | 'crimson' | 'neon'>('thermal');
  const [heatmapWeightMode, setHeatmapWeightMode] = useState<'METERS' | 'EQUAL'>('METERS');
  const [heatmapFilter, setHeatmapFilter] = useState<'ALL' | 'CRITICAL_HIGH' | 'HAZARDS_ONLY'>('ALL');
  const [showHeatmapSettings, setShowHeatmapSettings] = useState<boolean>(false);

  // Generate weighted geographical density points for Google Maps HeatmapLayer
  const heatmapPoints = useMemo(() => {
    return generateIncidentHeatmapPoints(incidents, gridAssets, {
      weightMode: heatmapWeightMode,
      includeCitizenReports: true,
      includeStressedAssets: true,
      includeHistoricalTelemetry: true,
      filterSeverity: heatmapFilter,
    });
  }, [incidents, gridAssets, heatmapWeightMode, heatmapFilter]);

  // Compute top incident density hotspots for the HUD legend
  const topDensityHotspots = useMemo(() => {
    return [...incidents]
      .filter((i) => i.status !== 'RESTORED')
      .sort((a, b) => b.affectedMeters - a.affectedMeters)
      .slice(0, 3);
  }, [incidents]);

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

            {/* Crew Route Vectors Toggle */}
            <button
              id="toggle-crew-routes-btn"
              onClick={() => setShowCrewRoutes(!showCrewRoutes)}
              className={`px-2 py-1 rounded text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                showCrewRoutes
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
              title="Toggle Live Crew Navigation Route Vectors"
            >
              <Navigation className="w-3 h-3 text-cyan-400" />
              <span>Vectors</span>
            </button>

            {/* Fleet Telemetry HUD Toggle */}
            <button
              id="toggle-fleet-hud-btn"
              onClick={() => setShowFleetHud(!showFleetHud)}
              className={`px-2 py-1 rounded text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                showFleetHud
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600 ring-1 ring-emerald-500/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
              title="Toggle Real-Time Crew Fleet HUD & Simulation Controls"
            >
              <Gauge className="w-3 h-3 text-emerald-400" />
              <span>Fleet HUD</span>
            </button>

            {/* Google Maps Heatmap Layer Toggle & Settings */}
            <div className="relative flex items-center">
              <button
                id="toggle-heatmap-btn"
                onClick={() => handleToggleHeatmap(!isHeatmapActive)}
                className={`px-2.5 py-1 rounded-l text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                  isHeatmapActive
                    ? 'bg-rose-950 text-rose-300 border-rose-600 shadow-rose-950/40 ring-1 ring-rose-500/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="Toggle Google Maps Incident Density Heatmap Layer"
              >
                <Flame className={`w-3.5 h-3.5 ${isHeatmapActive ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
                <span>Heatmap</span>
                <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                  isHeatmapActive ? 'bg-rose-500/30 text-rose-200' : 'bg-slate-800 text-slate-500'
                }`}>
                  {isHeatmapActive ? 'ON' : 'OFF'}
                </span>
              </button>
              <button
                id="heatmap-settings-btn"
                onClick={() => setShowHeatmapSettings(!showHeatmapSettings)}
                className={`px-1.5 py-1 rounded-r border-t border-r border-b text-[11px] transition cursor-pointer flex items-center ${
                  showHeatmapSettings
                    ? 'bg-rose-900 text-rose-200 border-rose-600'
                    : isHeatmapActive
                    ? 'bg-rose-950 text-rose-300 border-rose-600 hover:bg-rose-900'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
                title="Configure Heatmap radius, opacity, palette & weighting"
              >
                <SlidersHorizontal className="w-3 h-3" />
              </button>

              {/* Heatmap Settings Popover */}
              {showHeatmapSettings && (
                <div className="absolute top-9 left-0 mt-1 w-72 bg-slate-950/95 border border-slate-800 rounded-xl p-3 shadow-2xl backdrop-blur z-50 text-slate-200 space-y-3 font-sans">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                      <Flame className="w-3.5 h-3.5 text-rose-400" />
                      <span>Heatmap Configuration</span>
                    </div>
                    <button
                      onClick={() => setShowHeatmapSettings(false)}
                      className="text-slate-400 hover:text-white text-xs px-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Radius Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Diffusion Radius</span>
                      <span className="font-mono text-cyan-400 font-bold">{heatmapRadius}px</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="60"
                      value={heatmapRadius}
                      onChange={(e) => setHeatmapRadius(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded"
                    />
                  </div>

                  {/* Opacity Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Layer Opacity</span>
                      <span className="font-mono text-cyan-400 font-bold">{Math.round(heatmapOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={Math.round(heatmapOpacity * 100)}
                      onChange={(e) => setHeatmapOpacity(Number(e.target.value) / 100)}
                      className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded"
                    />
                  </div>

                  {/* Color Palette Presets */}
                  <div className="space-y-1.5">
                    <span className="text-slate-400 text-[11px] block">Thermal Palette Preset</span>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => setHeatmapGradientPreset('thermal')}
                        className={`px-2 py-1 rounded text-[10px] font-semibold border transition cursor-pointer text-center ${
                          heatmapGradientPreset === 'thermal'
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-500 ring-1 ring-cyan-500/50'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        Thermal
                      </button>
                      <button
                        onClick={() => setHeatmapGradientPreset('crimson')}
                        className={`px-2 py-1 rounded text-[10px] font-semibold border transition cursor-pointer text-center ${
                          heatmapGradientPreset === 'crimson'
                            ? 'bg-rose-950 text-rose-300 border-rose-500 ring-1 ring-rose-500/50'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        Crimson
                      </button>
                      <button
                        onClick={() => setHeatmapGradientPreset('neon')}
                        className={`px-2 py-1 rounded text-[10px] font-semibold border transition cursor-pointer text-center ${
                          heatmapGradientPreset === 'neon'
                            ? 'bg-fuchsia-950 text-fuchsia-300 border-fuchsia-500 ring-1 ring-fuchsia-500/50'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        Neon
                      </button>
                    </div>
                  </div>

                  {/* Weighting Mode */}
                  <div className="space-y-1.5">
                    <span className="text-slate-400 text-[11px] block">Incident Density Weighting</span>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <button
                        onClick={() => setHeatmapWeightMode('METERS')}
                        className={`px-2 py-1 rounded font-semibold border transition cursor-pointer ${
                          heatmapWeightMode === 'METERS'
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        Meters-Weighted
                      </button>
                      <button
                        onClick={() => setHeatmapWeightMode('EQUAL')}
                        className={`px-2 py-1 rounded font-semibold border transition cursor-pointer ${
                          heatmapWeightMode === 'EQUAL'
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        Equal Weight
                      </button>
                    </div>
                  </div>

                  {/* Filter */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                    <span className="text-slate-400 text-[11px] block">Density Filter</span>
                    <div className="grid grid-cols-3 gap-1 text-[9px]">
                      <button
                        onClick={() => setHeatmapFilter('ALL')}
                        className={`p-1 rounded font-semibold border transition cursor-pointer ${
                          heatmapFilter === 'ALL'
                            ? 'bg-slate-800 text-white border-cyan-500'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        All Grid
                      </button>
                      <button
                        onClick={() => setHeatmapFilter('CRITICAL_HIGH')}
                        className={`p-1 rounded font-semibold border transition cursor-pointer ${
                          heatmapFilter === 'CRITICAL_HIGH'
                            ? 'bg-slate-800 text-white border-amber-500'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        High/Crit
                      </button>
                      <button
                        onClick={() => setHeatmapFilter('HAZARDS_ONLY')}
                        className={`p-1 rounded font-semibold border transition cursor-pointer ${
                          heatmapFilter === 'HAZARDS_ONLY'
                            ? 'bg-slate-800 text-white border-rose-500'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        Hazards
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

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
        {apiKey ? (
          <APIProvider apiKey={apiKey} libraries={GOOGLE_MAPS_LIBRARIES}>
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

            {/* GOOGLE MAPS HEATMAP LAYER (HIGH-INCIDENT DENSITY) */}
            {isHeatmapActive && (
              <GoogleHeatmapLayer
                points={heatmapPoints}
                radius={heatmapRadius}
                opacity={heatmapOpacity}
                gradient={HEATMAP_GRADIENTS[heatmapGradientPreset]}
              />
            )}

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
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
              <Navigation className="w-6 h-6 animate-pulse" />
            </div>
            <div className="max-w-md">
              <h3 className="text-white font-bold text-base mb-1">Connecting to Google Maps Grid</h3>
              <p className="text-xs text-slate-400">
                Initializing GIS spatial layer and Bengaluru electrical substation coordinates...
              </p>
            </div>
          </div>
        )}

        {/* FLOATING HEATMAP DENSITY HUD & HOTSPOT ANALYZER */}
        {isHeatmapActive && (
          <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <div className="bg-slate-950/95 border border-rose-900/50 p-3 rounded-2xl backdrop-blur-md shadow-2xl pointer-events-auto w-68 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                    Incident Density
                  </span>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono font-bold">
                  {heatmapPoints.length} Points
                </span>
              </div>

              {/* Gradient Spectrum Bar with Legend Labels */}
              <div className="space-y-1">
                <div className={`h-2.5 w-full rounded-full shadow-inner ${
                  heatmapGradientPreset === 'crimson'
                    ? 'bg-gradient-to-r from-yellow-300 via-orange-500 via-rose-600 to-rose-950'
                    : heatmapGradientPreset === 'neon'
                    ? 'bg-gradient-to-r from-purple-500 via-cyan-400 via-yellow-300 to-pink-500'
                    : 'bg-gradient-to-r from-cyan-400 via-emerald-400 via-yellow-400 to-rose-600'
                }`} />
                <div className="flex justify-between text-[8px] font-mono text-slate-400">
                  <span>Isolated</span>
                  <span>Moderate Density</span>
                  <span className="text-rose-400 font-bold">Critical Cluster</span>
                </div>
              </div>

              {/* Top Density Hotspots */}
              <div className="border-t border-slate-800/80 pt-2 space-y-1">
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>High-Incident Hotspots</span>
                  <span className="text-cyan-400 font-mono">Affected</span>
                </div>
                {topDensityHotspots.map((h, i) => (
                  <button
                    key={h.id}
                    onClick={() => onSelectIncident(h)}
                    className="w-full flex items-center justify-between text-[10px] p-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 transition cursor-pointer text-left"
                    title={`Click to focus ${h.code}`}
                  >
                    <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        i === 0
                          ? 'bg-rose-500 animate-ping'
                          : i === 1
                          ? 'bg-amber-400'
                          : 'bg-cyan-400'
                      }`} />
                      <span className="font-semibold text-slate-200 truncate">{h.locality.split(',')[0]}</span>
                    </div>
                    <span className="font-mono text-[9px] font-bold text-rose-300 shrink-0">
                      {h.affectedMeters.toLocaleString()} mtr
                    </span>
                  </button>
                ))}
              </div>

              {/* Quick Slider Controls inside HUD */}
              <div className="border-t border-slate-800/80 pt-2 space-y-1.5 text-[9px]">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Radius: <strong className="text-cyan-300 font-mono">{heatmapRadius}px</strong></span>
                  <span>Opacity: <strong className="text-cyan-300 font-mono">{Math.round(heatmapOpacity * 100)}%</strong></span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="range"
                    min="15"
                    max="60"
                    value={heatmapRadius}
                    onChange={(e) => setHeatmapRadius(Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer h-1 bg-slate-800 rounded"
                    title="Adjust Heatmap Radius"
                  />
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={Math.round(heatmapOpacity * 100)}
                    onChange={(e) => setHeatmapOpacity(Number(e.target.value) / 100)}
                    className="w-full accent-rose-500 cursor-pointer h-1 bg-slate-800 rounded"
                    title="Adjust Heatmap Opacity"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

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
