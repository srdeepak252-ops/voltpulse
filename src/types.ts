export type OutageSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type OutageStatus = "TRIAGED" | "CREW_DISPATCHED" | "IN_PROGRESS" | "RESTORED";

export type GridAssetType = "SUBSTATION" | "FEEDER_LINE" | "TRANSFORMER" | "POLE";

export type UserRole = "user" | "admin";

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  email: string;
  meterNumber?: string;
  locality?: string;
  badgeTitle?: string;
  phone?: string;
  assignedIssuesCount?: number;
}

export interface OutageIncident {
  id: string;
  code: string;
  substation: string;
  locality: string;
  severity: OutageSeverity;
  status: OutageStatus;
  affectedMeters: number;
  criticalFacilities: string[];
  reportedAt: string;
  etr: string; // Estimated Time of Restoration
  crewAssigned: string | null;
  lat: number;
  lng: number;
  hazardReported: boolean;
  causeCategory?: string; // VEGETATION, EQUIPMENT_FAILURE, OVERLOAD, WEATHER
  customerReports?: CustomerReport[];
  assignedOfficerUsername?: string;
}

export interface CustomerReport {
  id: string;
  incidentId: string;
  meterNumber: string;
  userId?: string;
  residentName?: string;
  username?: string; // Assigned username
  contactPhone?: string;
  addressText: string;
  hasSparkingOrHazard: boolean;
  notes?: string;
  reportedAt: string;
  lat: number;
  lng: number;
}

export interface GridAsset {
  id: string;
  assetTag: string;
  assetType: GridAssetType;
  localityZone: string;
  capacityKva: number;
  lat: number;
  lng: number;
  status: "OPERATIONAL" | "TRIPPED" | "MAINTENANCE" | "OVERLOAD_WARNING";
}

export interface DispatchCrew {
  id: string;
  name: string;
  unit: string;
  specialty: string;
  status: "AVAILABLE" | "EN_ROUTE" | "ON_SITE" | "OFF_DUTY";
  currentIncidentCode: string | null;
  lat?: number;
  lng?: number;
}

export interface SpatialClusterResult {
  isNewCluster: boolean;
  incident: OutageIncident;
  distanceMeters: number;
  clusteredWithCode?: string;
}
