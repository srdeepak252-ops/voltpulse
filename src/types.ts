export type OutageSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type OutageStatus = "TRIAGED" | "CREW_DISPATCHED" | "IN_PROGRESS" | "RESTORED";

export type GridAssetType = "SUBSTATION" | "FEEDER_LINE" | "TRANSFORMER" | "POLE";

export type UserRole = "user" | "admin" | "crew";

export type CrewFieldStatus =
  | "EN_ROUTE"
  | "ON_SITE"
  | "FAULT_ISOLATED"
  | "REPAIRS_ACTIVE"
  | "HAZARDS_CLEARED"
  | "READY_FOR_ENERGIZATION";

export interface CrewStatusUpdate {
  id: string;
  incidentId: string;
  incidentCode: string;
  crewId: string;
  crewName: string;
  crewLead?: string;
  timestamp: string;
  fieldStatus: CrewFieldStatus;
  notes: string;
  hazardCleared: boolean;
  estimatedMinutesRemaining?: number;
  checklistCompleted?: string[];
  submittedToAdmin: boolean;
  adminAcknowledged?: boolean;
}

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
  assignedCrewId?: string;
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
  crewStatusUpdates?: CrewStatusUpdate[];
  latestCrewStatus?: CrewFieldStatus;
  resolvedAt?: string;
  resolvedByAdmin?: string;
  resolutionNotes?: string;
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
  bearing?: number; // Heading angle 0-360 degrees
  speedKmh?: number; // Vehicle velocity in km/h
  targetIncidentId?: string; // Assigned incident ID
  targetLocality?: string; // Target location description
  targetLat?: number; // Target GPS latitude
  targetLng?: number; // Target GPS longitude
  distanceRemainingMeters?: number; // Live distance to target in meters
  etaMinutes?: number; // Dynamic ETA in minutes
  vehicleType?: string; // Vehicle category
  vehiclePlate?: string; // Registration callsign
  crewLead?: string; // Lead technician / foreman
  crewMembers?: string[]; // Linemen names
  lastGpsPing?: string; // Formatted timestamp
  breadcrumbs?: Array<{ lat: number; lng: number }>; // Recent positions
}

export interface SpatialClusterResult {
  isNewCluster: boolean;
  incident: OutageIncident;
  distanceMeters: number;
  clusteredWithCode?: string;
}
