export type NavigationTab = 
  | 'dashboard'
  | 'schedules'
  | 'timetable'
  | 'corridors'
  | 'assets'
  | 'defects'
  | 'reports'
  | 'settings';

export type HealthStatus = 'Healthy' | 'Warning' | 'Critical';
export type DefectStatus = 'Urgent' | 'Overdue' | 'Routine' | 'Resolved';
export type BlockStatus = 'Active' | 'Scheduled' | 'Completed' | 'Pending Approval' | 'Missed';
export type DepartmentType = 'Civil' | 'Electrical' | 'S&T' | 'Track Maintenance' | 'Signaling' | 'Rolling Stock';

export interface AiRescheduleRecommendation {
  recommendedSlot: {
    date: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    trafficDensity: string;
    reliabilityScore: number;
    rationale: string;
  };
  alternativeSlots: Array<{
    date: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    prosAndCons: string;
    reliabilityScore?: number;
  }>;
  trainImpactMitigations: Array<{
    trainNumber: string;
    regulationPlan: string;
    impactLevel: string;
  }>;
  safetyUrgencyNote: string;
  systemSyncStatus: {
    tmsReady: boolean;
    smmsReady: boolean;
    tdmsReady: boolean;
    coaCleared: boolean;
  };
}

export interface Asset {
  id: string;
  type: string;
  location: string;
  department: DepartmentType;
  category: 'Engineering (Track)' | 'Traction (OHE)' | 'Signal & Telecom';
  health: HealthStatus;
  lastInspected: string;
  nextScheduled: string;
  corridorId: string;
}

export interface Defect {
  id: string;
  description: string;
  department: DepartmentType;
  reportedDate: string;
  status: DefectStatus;
  location: string;
  linkedBlockId?: string;
  severity: 'High' | 'Medium' | 'Low';
  actionTaken?: string;
}

export interface BlockPlan {
  id: string;
  corridorName: string;
  division: string;
  section: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  status: BlockStatus;
  type: string;
  department: DepartmentType;
  systemIntegrations: {
    tms: boolean;
    smms: boolean;
    tdms: boolean;
  };
  impactScore?: number; // 0-100
  conflictTrains?: string[];
  approvedBy?: string;
  progressPercent?: number;
  location?: string;
  missedReason?: string;
  originalSlot?: string;
  aiRescheduled?: boolean;
  aiConfidence?: number;
  rescheduledFromId?: string;
  // --- Combined / consolidated possession block --------------------------
  /** True when this single block was optimized/merged from 2+ department
   * requests that shared a section, so the corridor is only possessed once
   * instead of once per department. */
  isCombined?: boolean;
  /** The individual department work items folded into this one possession
   * window when isCombined is true. */
  subTasks?: CombinedSubTask[];
  /** All departments represented in this block (single dept when not combined). */
  combinedDepartments?: DepartmentType[];
}

/** One department's work item inside a combined/consolidated block. */
export interface CombinedSubTask {
  department: DepartmentType;
  type: string;
  description: string;
  durationHours: number;
  priority: DepartmentRequest['priority'];
}

export interface DepartmentRequest {
  id: string;
  division: string;
  section: string;
  department: DepartmentType;
  type: string;
  description: string;
  durationHours: number;
  priority: 'High' | 'Medium' | 'Low';
}

export interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  type: 'approved' | 'defect' | 'maintenance' | 'sync';
  color: string;
}

export interface CorridorNode {
  id: string;
  name: string;
  hindiName?: string;
  code: string;
  x: number; // legacy SVG % (no longer used by the live map)
  y: number; // legacy SVG % (no longer used by the live map)
  lat: number;
  lng: number;
  status: 'normal' | 'maintenance' | 'delay';
  activeBlocksCount: number;
  defectsCount: number;
  division: string;
}

export interface CorridorLink {
  from: string;
  to: string;
  name: string;
  status: 'normal' | 'maintenance' | 'delay';
  utilization: number;
}

// --- AI Prioritization Engine -------------------------------------------

/** A single weighted factor that fed into a priority score, shown to the
 * user for explainability (judges/reviewers can see exactly why a task
 * was ranked where it was, instead of a black-box number). */
export interface ScoreFactor {
  label: string;
  weight: number; // 0-100, contribution to the 0-100 total
  rationale: string;
}

export interface PrioritizedTask {
  id: string;
  refId: string; // Defect or BlockPlan id this task is derived from
  kind: 'Defect' | 'Missed Block';
  description: string;
  department: string;
  location: string;
  ageDays: number;
  score: number; // 0-100 composite priority score
  factors: ScoreFactor[];
  recommendedHorizon: 'This Week' | 'This Month' | 'Next Month';
  recommendedWindow: string; // human readable slot suggestion
}

// --- Train Time Table & Goods Forecast (Control Office data source) ----

export interface TrainTimetableEntry {
  trainNumber: string;
  name: string;
  type: 'Rajdhani/Shatabdi' | 'Express' | 'Passenger' | 'Suburban';
  section: string;
  departure: string;
  arrival: string;
  frequency: string; // e.g. "Daily", "Mon/Wed/Fri"
}

export interface GoodsForecastEntry {
  corridorId: string;
  corridorName: string;
  date: string; // ISO date
  forecastRakes: number;
  peakWindow: string;
  lowDensityWindow: string;
  confidencePercent: number;
}
