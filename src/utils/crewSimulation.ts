import { DispatchCrew, OutageIncident } from '../types';

/**
 * Calculates Great-Circle distance between two coordinates in meters (Haversine formula).
 */
export function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Calculates initial compass bearing in degrees (0 - 360) from point 1 to point 2.
 */
export function getBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const y = Math.sin(((lng2 - lng1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lng2 - lng1) * Math.PI) / 180);
  const theta = Math.atan2(y, x);
  const brng = ((theta * 180) / Math.PI + 360) % 360; // Normalize to 0-360
  return Math.round(brng);
}

/**
 * Converts degree bearing into human readable cardinal direction (e.g. SSE, NW).
 */
export function getCardinalDirection(bearing: number): string {
  const cardinals = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
  ];
  const index = Math.round(bearing / 22.5) % 16;
  return cardinals[index];
}

/**
 * Generates realistic arterial road waypoints between origin and target coordinates
 * in Bengaluru grid to simulate authentic street-grid navigation rather than pure laser-straight lines.
 */
export function generateRoadWaypoints(
  startLat: number,
  startLng: number,
  targetLat: number,
  targetLng: number
): Array<{ lat: number; lng: number }> {
  const waypoints: Array<{ lat: number; lng: number }> = [{ lat: startLat, lng: startLng }];
  const steps = 6;

  // Midpoint with slight orthogonal offset to simulate road turning
  const dLat = targetLat - startLat;
  const dLng = targetLng - startLng;

  for (let i = 1; i < steps; i++) {
    const fraction = i / steps;
    // Introduce gentle curve representing city road corridors (e.g. Ring road bends)
    const curveOffset = Math.sin(fraction * Math.PI) * 0.0018 * ((i % 2 === 0) ? 1 : -0.7);
    const interpLat = startLat + dLat * fraction + curveOffset;
    const interpLng = startLng + dLng * fraction - curveOffset * 0.5;
    waypoints.push({ lat: Number(interpLat.toFixed(5)), lng: Number(interpLng.toFixed(5)) });
  }

  waypoints.push({ lat: targetLat, lng: targetLng });
  return waypoints;
}

export interface SimulationTickResult {
  updatedCrews: DispatchCrew[];
  arrivedCrew?: {
    crew: DispatchCrew;
    incident?: OutageIncident;
  };
}

/**
 * Updates positions of all crews by simulating one time delta step.
 * Crews with EN_ROUTE status smoothly advance toward their assigned incident locations.
 *
 * @param crews Current dispatch crews
 * @param incidents Active outage incidents
 * @param speedMultiplier Speed multiplier (1 = normal ~45km/h, 2 = 2x fast, 5 = high speed demo)
 */
export function stepCrewSimulation(
  crews: DispatchCrew[],
  incidents: OutageIncident[],
  speedMultiplier: number = 1
): SimulationTickResult {
  let newlyArrivedCrewInfo: SimulationTickResult['arrivedCrew'] | undefined = undefined;

  const updatedCrews = crews.map((crew) => {
    // Only moving crews are updated
    if (crew.status !== 'EN_ROUTE' || !crew.lat || !crew.lng) {
      return crew;
    }

    // Identify target incident
    let targetLat = crew.targetLat;
    let targetLng = crew.targetLng;
    let targetIncident: OutageIncident | undefined;

    if (crew.targetIncidentId) {
      targetIncident = incidents.find((i) => i.id === crew.targetIncidentId);
    }
    if (!targetIncident && crew.currentIncidentCode) {
      targetIncident = incidents.find((i) => i.code === crew.currentIncidentCode);
    }

    if (targetIncident) {
      targetLat = targetIncident.lat;
      targetLng = targetIncident.lng;
    }

    if (!targetLat || !targetLng) {
      return crew;
    }

    const currentDist = getDistanceMeters(crew.lat, crew.lng, targetLat, targetLng);

    // If within 35 meters, crew has arrived on site!
    if (currentDist <= 40) {
      const arrivedCrew: DispatchCrew = {
        ...crew,
        lat: targetLat,
        lng: targetLng,
        status: 'ON_SITE',
        speedKmh: 0,
        distanceRemainingMeters: 0,
        etaMinutes: 0,
        lastGpsPing: 'Arrived at incident site (GPS Anchor Confirmed)',
        breadcrumbs: [
          ...(crew.breadcrumbs || []).slice(-15),
          { lat: targetLat, lng: targetLng },
        ],
      };

      if (!newlyArrivedCrewInfo) {
        newlyArrivedCrewInfo = {
          crew: arrivedCrew,
          incident: targetIncident,
        };
      }

      return arrivedCrew;
    }

    // Calculate step movement
    // Typical city speed 42 - 52 km/h
    const baseSpeedKmh = Math.max(30, Math.min(65, (crew.speedKmh || 46) + (Math.random() * 6 - 3)));
    const speedKmh = Math.round(baseSpeedKmh);
    const speedMps = (speedKmh * 1000) / 3600; // meters per second

    // Each simulation tick represents 1.5 seconds of simulated real time * multiplier
    const stepDistanceMeters = Math.min(currentDist, speedMps * 1.5 * speedMultiplier);

    const stepFraction = Math.min(1, stepDistanceMeters / currentDist);

    // Interpolate coordinates
    const nextLat = Number((crew.lat + (targetLat - crew.lat) * stepFraction).toFixed(6));
    const nextLng = Number((crew.lng + (targetLng - crew.lng) * stepFraction).toFixed(6));

    // Calculate heading/bearing
    const bearing = getBearing(crew.lat, crew.lng, targetLat, targetLng);

    // Compute remaining distance & dynamic ETA
    const nextDist = getDistanceMeters(nextLat, nextLng, targetLat, targetLng);
    const etaMins = Math.max(1, Math.round(nextDist / (speedMps || 12) / 60));

    // Update breadcrumbs (store up to 20 past points for trail rendering)
    const breadcrumbs = [...(crew.breadcrumbs || [])];
    if (breadcrumbs.length === 0 || getDistanceMeters(breadcrumbs[breadcrumbs.length - 1].lat, breadcrumbs[breadcrumbs.length - 1].lng, nextLat, nextLng) > 30) {
      breadcrumbs.push({ lat: nextLat, lng: nextLng });
      if (breadcrumbs.length > 25) {
        breadcrumbs.shift();
      }
    }

    return {
      ...crew,
      lat: nextLat,
      lng: nextLng,
      bearing,
      speedKmh,
      distanceRemainingMeters: nextDist,
      etaMinutes: etaMins,
      targetLat,
      targetLng,
      targetLocality: targetIncident?.locality || crew.targetLocality,
      lastGpsPing: 'Telemetry uplink live (4G SCADA packet)',
      breadcrumbs,
    };
  });

  return {
    updatedCrews,
    arrivedCrew: newlyArrivedCrewInfo,
  };
}

/**
 * Assigns and dispatches any crew to an incident, setting them EN_ROUTE with navigation target
 */
export function dispatchCrewToIncident(
  crewId: string,
  incident: OutageIncident,
  crews: DispatchCrew[]
): DispatchCrew[] {
  return crews.map((c) => {
    if (c.id !== crewId) return c;

    // Determine starting position: current lat/lng or default depot
    const startLat = c.lat || 12.9350;
    const startLng = c.lng || 77.6200;
    const bearing = getBearing(startLat, startLng, incident.lat, incident.lng);
    const dist = getDistanceMeters(startLat, startLng, incident.lat, incident.lng);
    const eta = Math.max(2, Math.round(dist / (45 * 1000 / 3600) / 60));

    return {
      ...c,
      status: 'EN_ROUTE',
      currentIncidentCode: incident.code,
      targetIncidentId: incident.id,
      targetLocality: incident.locality,
      targetLat: incident.lat,
      targetLng: incident.lng,
      bearing,
      speedKmh: 48,
      distanceRemainingMeters: dist,
      etaMinutes: eta,
      breadcrumbs: [{ lat: startLat, lng: startLng }],
      lastGpsPing: 'En route dispatch order confirmed (Uplink 100%)',
    };
  });
}
