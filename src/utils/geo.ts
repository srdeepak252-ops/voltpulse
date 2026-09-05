import { OutageIncident, CustomerReport, SpatialClusterResult } from '../types';

export const CLUSTER_RADIUS_METERS = 500; // 500m locality transformer clustering radius

/**
 * Computes great-circle distance between two points in meters using Haversine formula
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * In-memory client-side emulation of PostGIS ST_DWithin clustering engine
 */
export function clusterOutageReport(
  incidents: OutageIncident[],
  report: {
    meterNumber: string;
    userId?: string;
    username?: string;
    residentName?: string;
    contactPhone?: string;
    addressText: string;
    hasHazard: boolean;
    notes?: string;
    lat: number;
    lng: number;
  }
): {
  updatedIncidents: OutageIncident[];
  result: SpatialClusterResult;
} {
  // 1. Check for active root incident within radius
  let closestIncident: OutageIncident | null = null;
  let minDistance = Infinity;

  for (const inc of incidents) {
    if (inc.status === 'RESTORED') continue;
    const dist = calculateDistanceMeters(inc.lat, inc.lng, report.lat, report.lng);
    if (dist <= CLUSTER_RADIUS_METERS && dist < minDistance) {
      minDistance = dist;
      closestIncident = inc;
    }
  }

  const customerReport: CustomerReport = {
    id: `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    incidentId: closestIncident ? closestIncident.id : '',
    meterNumber: report.meterNumber,
    userId: report.userId,
    username: report.username,
    residentName: report.residentName,
    contactPhone: report.contactPhone,
    addressText: report.addressText,
    hasSparkingOrHazard: report.hasHazard,
    notes: report.notes,
    reportedAt: 'Just now',
    lat: report.lat,
    lng: report.lng,
  };

  if (closestIncident) {
    // Attach to existing cluster and bump affected count
    customerReport.incidentId = closestIncident.id;
    const updatedIncident: OutageIncident = {
      ...closestIncident,
      affectedMeters: closestIncident.affectedMeters + 1,
      hazardReported: closestIncident.hazardReported || report.hasHazard,
      severity:
        report.hasHazard && closestIncident.severity !== 'CRITICAL'
          ? 'CRITICAL'
          : closestIncident.severity,
      customerReports: [...(closestIncident.customerReports || []), customerReport],
    };

    const updatedIncidents = incidents.map((i) =>
      i.id === updatedIncident.id ? updatedIncident : i
    );

    return {
      updatedIncidents,
      result: {
        isNewCluster: false,
        incident: updatedIncident,
        distanceMeters: minDistance,
        clusteredWithCode: closestIncident.code,
      },
    };
  } else {
    // Spawn a new root incident
    const newCode = `OUT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newId = `inc-${Date.now()}`;
    customerReport.incidentId = newId;

    const newIncident: OutageIncident = {
      id: newId,
      code: newCode,
      substation: `Locality Feeder DT-${Math.floor(10 + Math.random() * 89)}`,
      locality: report.addressText || 'Reported Ward Location',
      severity: report.hasHazard ? 'CRITICAL' : 'MEDIUM',
      status: 'TRIAGED',
      affectedMeters: 1,
      criticalFacilities: report.hasHazard ? ['Public Safety Hazard Zone'] : [],
      reportedAt: 'Just now',
      etr: 'Triaging (Est. 45m - 1h)',
      crewAssigned: null,
      lat: report.lat,
      lng: report.lng,
      hazardReported: report.hasHazard,
      causeCategory: report.hasHazard ? 'VEGETATION / LINE CONTACT' : 'UNDER_INVESTIGATION',
      customerReports: [customerReport],
    };

    return {
      updatedIncidents: [newIncident, ...incidents],
      result: {
        isNewCluster: true,
        incident: newIncident,
        distanceMeters: 0,
      },
    };
  }
}
