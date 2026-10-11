import { OutageIncident, GridAsset } from '../types';
import { HeatmapPoint } from '../components/GoogleHeatmapLayer';

// Deterministic micro-offsets around incident coordinates to represent 
// downstream feeder lines, neighborhood distribution boxes, and street lights
const CLUSTER_OFFSETS = [
  { dLat: 0.0016, dLng: 0.0012, factor: 0.75 },
  { dLat: -0.0014, dLng: 0.0018, factor: 0.65 },
  { dLat: 0.0021, dLng: -0.0015, factor: 0.8 },
  { dLat: -0.0018, dLng: -0.0013, factor: 0.6 },
  { dLat: 0.0007, dLng: 0.0026, factor: 0.7 },
  { dLat: -0.0024, dLng: 0.0006, factor: 0.65 },
  { dLat: 0.0029, dLng: 0.0009, factor: 0.5 },
  { dLat: -0.0011, dLng: -0.0028, factor: 0.55 },
  { dLat: 0.0012, dLng: -0.0022, factor: 0.6 },
  { dLat: -0.0022, dLng: 0.0021, factor: 0.5 },
];

// Baseline city grid historical load/fault telemetry nodes in Bengaluru
const BENGALURU_CORRIDOR_TELEMETRY: { lat: number; lng: number; baseWeight: number; name: string }[] = [
  { lat: 12.9784, lng: 77.6408, baseWeight: 14, name: 'Indiranagar 100ft Road Corridor' },
  { lat: 12.9352, lng: 77.6245, baseWeight: 10, name: 'Koramangala 4th Block Hub' },
  { lat: 12.9863, lng: 77.7340, baseWeight: 8, name: 'Whitefield ITPL Junction' },
  { lat: 12.9716, lng: 77.6000, baseWeight: 6, name: 'MG Road Commercial Grid' },
  { lat: 12.9165, lng: 77.6101, baseWeight: 5, name: 'BTM Layout / Silk Board Node' },
  { lat: 12.9121, lng: 77.6446, baseWeight: 6, name: 'HSR Layout Sector 2 Junction' },
  { lat: 12.9982, lng: 77.5684, baseWeight: 5, name: 'Malleshwaram 8th Main Feeder' },
  { lat: 13.0358, lng: 77.5970, baseWeight: 4, name: 'Hebbal Bellary Road Interchange' },
];

export interface HeatmapGenerationOptions {
  weightMode?: 'METERS' | 'EQUAL';
  includeCitizenReports?: boolean;
  includeStressedAssets?: boolean;
  includeHistoricalTelemetry?: boolean;
  filterSeverity?: 'ALL' | 'CRITICAL_HIGH' | 'HAZARDS_ONLY';
}

/**
 * Builds an array of weighted geographical points representing incident density
 * across the city electrical grid for Google Maps HeatmapLayer.
 */
export function generateIncidentHeatmapPoints(
  incidents: OutageIncident[],
  gridAssets: GridAsset[] = [],
  options: HeatmapGenerationOptions = {}
): HeatmapPoint[] {
  const {
    weightMode = 'METERS',
    includeCitizenReports = true,
    includeStressedAssets = true,
    includeHistoricalTelemetry = true,
    filterSeverity = 'ALL',
  } = options;

  const points: HeatmapPoint[] = [];

  // Filter incidents if specified
  const filteredIncidents = incidents.filter((inc) => {
    if (filterSeverity === 'CRITICAL_HIGH') {
      return inc.severity === 'CRITICAL' || inc.severity === 'HIGH';
    }
    if (filterSeverity === 'HAZARDS_ONLY') {
      return (
        inc.hazardReported ||
        inc.customerReports?.some((r) => r.hasSparkingOrHazard)
      );
    }
    return true;
  });

  filteredIncidents.forEach((inc) => {
    const isRestored = inc.status === 'RESTORED';
    // Severely reduced weight for restored incidents
    const statusMultiplier = isRestored ? 0.2 : 1.0;

    // Calculate core center weight
    let centerWeight: number;
    if (weightMode === 'METERS') {
      // Scale by affected meters (e.g., 1840 meters -> ~32 weight, 620 -> ~18 weight)
      centerWeight = Math.min(45, Math.max(6, Math.round(Math.sqrt(inc.affectedMeters) * 0.9)));
    } else {
      // Equal severity scale
      centerWeight =
        inc.severity === 'CRITICAL'
          ? 25
          : inc.severity === 'HIGH'
          ? 18
          : inc.severity === 'MEDIUM'
          ? 10
          : 5;
    }

    if (inc.hazardReported) {
      centerWeight *= 1.35;
    }
    centerWeight *= statusMultiplier;

    // 1. Center epicentre
    points.push({
      lat: inc.lat,
      lng: inc.lng,
      weight: Math.round(centerWeight),
    });

    // 2. Micro-cluster points around the incident (distribution grid feeder branches)
    const subPointCount = Math.min(
      CLUSTER_OFFSETS.length,
      Math.max(4, Math.round(centerWeight / 3))
    );

    for (let i = 0; i < subPointCount; i++) {
      const offset = CLUSTER_OFFSETS[i];
      points.push({
        lat: inc.lat + offset.dLat,
        lng: inc.lng + offset.dLng,
        weight: Math.max(1, Math.round(centerWeight * offset.factor * 0.65)),
      });
    }

    // 3. Citizen reports in this incident
    if (includeCitizenReports && inc.customerReports) {
      inc.customerReports.forEach((rep) => {
        const repWeight = rep.hasSparkingOrHazard
          ? 16 * statusMultiplier
          : 6 * statusMultiplier;
        points.push({
          lat: rep.lat,
          lng: rep.lng,
          weight: Math.round(repWeight),
        });
      });
    }
  });

  // 4. Stressed Grid Assets (Tripped or Overloaded Substations/Transformers)
  if (includeStressedAssets && gridAssets.length > 0) {
    gridAssets.forEach((asset) => {
      if (asset.status === 'TRIPPED') {
        points.push({
          lat: asset.lat,
          lng: asset.lng,
          weight: 18,
        });
        // Jittered secondary feeder node
        points.push({
          lat: asset.lat + 0.0012,
          lng: asset.lng - 0.0011,
          weight: 10,
        });
      } else if (asset.status === 'OVERLOAD_WARNING') {
        points.push({
          lat: asset.lat,
          lng: asset.lng,
          weight: 10,
        });
      }
    });
  }

  // 5. Baseline historical grid load telemetry points
  if (includeHistoricalTelemetry) {
    BENGALURU_CORRIDOR_TELEMETRY.forEach((tele) => {
      // If there is an active incident in this area, give a baseline ambient glow
      points.push({
        lat: tele.lat,
        lng: tele.lng,
        weight: Math.max(2, Math.round(tele.baseWeight * 0.4)),
      });
    });
  }

  return points;
}
