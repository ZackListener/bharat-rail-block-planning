// AI Block Prioritization Engine
// ------------------------------------------------------------------
// This is a deliberately transparent, rule-based weighted-scoring model
// (rather than an opaque black box) so it can be explained on a single
// slide: every task's score is the sum of a few interpretable factors.
// It stands in for the "AI/ML algorithm to prioritize and schedule
// maintenance tasks based on criticality, urgency, and impact on asset
// availability" required by the problem statement, and is intentionally
// simple to swap for a trained model later (the factor shape stays the
// same — only how each factor's weight is computed would change).

import { Defect, BlockPlan, PrioritizedTask, ScoreFactor } from '../types';

// Weight tables — tune these to re-run the "algorithm" live during a demo.
const SEVERITY_WEIGHT: Record<Defect['severity'], number> = {
  High: 40,
  Medium: 24,
  Low: 10,
};

const STATUS_WEIGHT: Record<Defect['status'], number> = {
  Urgent: 30,
  Overdue: 26,
  Routine: 8,
  Resolved: 0,
};

// Corridor criticality multiplier — a rough proxy for "impact on asset
// availability": higher-density / trunk corridors score higher.
const CORRIDOR_IMPACT: Record<string, number> = {
  'NDLS-CNB': 20,
  'CNB-PRYJ': 18,
  'NDLS-UMB': 14,
  'BCT-ADI': 16,
  'HWH-BWN': 15,
  'MAS-SBC': 12,
};

function daysAgo(dateStr: string): number {
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return 0;
  const diffMs = Date.now() - parsed.getTime();
  return Math.max(0, Math.round(diffMs / 86400000));
}

function corridorKeyFromLocation(location: string): string {
  const match = location.match(/([A-Z]{2,5}-[A-Z]{2,5})/);
  return match ? match[1] : '';
}

/** Urgency grows with age, but saturates so a 90-day-old routine defect
 * doesn't outrank a 2-day-old urgent one — it just becomes "can't be
 * ignored much longer." */
function ageWeight(days: number): number {
  return Math.min(20, Math.round((days / 21) * 20));
}

function pickHorizon(score: number): PrioritizedTask['recommendedHorizon'] {
  if (score >= 70) return 'This Week';
  if (score >= 45) return 'This Month';
  return 'Next Month';
}

function pickWindow(score: number): string {
  if (score >= 70) return 'Next available night block (00:30–05:30 Hrs)';
  if (score >= 45) return 'Weekend low-traffic window, within 30 days';
  return 'Routine monthly maintenance cycle';
}

export function scoreDefect(defect: Defect): PrioritizedTask {
  const age = daysAgo(defect.reportedDate);
  const corridorKey = corridorKeyFromLocation(defect.location);
  const impact = CORRIDOR_IMPACT[corridorKey] ?? 10;

  const factors: ScoreFactor[] = [
    {
      label: 'Severity',
      weight: SEVERITY_WEIGHT[defect.severity],
      rationale: `${defect.severity} severity defect`,
    },
    {
      label: 'Status / Urgency',
      weight: STATUS_WEIGHT[defect.status],
      rationale: `Currently marked ${defect.status}`,
    },
    {
      label: 'Age in Backlog',
      weight: ageWeight(age),
      rationale: `Open for ${age} day${age === 1 ? '' : 's'}`,
    },
    {
      label: 'Corridor Impact',
      weight: impact,
      rationale: corridorKey
        ? `${corridorKey} is a high-density corridor`
        : 'Standard corridor traffic density',
    },
  ];

  const rawScore = factors.reduce((sum, f) => sum + f.weight, 0);
  const score = Math.min(100, rawScore);

  return {
    id: `PRI-${defect.id.replace(/[^A-Za-z0-9]/g, '')}`,
    refId: defect.id,
    kind: 'Defect',
    description: defect.description,
    department: defect.department,
    location: defect.location,
    ageDays: age,
    score,
    factors,
    recommendedHorizon: pickHorizon(score),
    recommendedWindow: pickWindow(score),
  };
}

export function scoreMissedBlock(block: BlockPlan): PrioritizedTask {
  const age = block.date ? daysAgo(block.date) : 0;
  const corridorKey = corridorKeyFromLocation(block.corridorName) || corridorKeyFromLocation(block.section);
  const impact = CORRIDOR_IMPACT[corridorKey] ?? 12;

  const factors: ScoreFactor[] = [
    {
      label: 'Missed Possession',
      weight: 34,
      rationale: 'Block was denied/missed and must be re-slotted',
    },
    {
      label: 'Age Since Missed',
      weight: ageWeight(age),
      rationale: `Missed ${age} day${age === 1 ? '' : 's'} ago`,
    },
    {
      label: 'Corridor Impact',
      weight: impact,
      rationale: corridorKey
        ? `${corridorKey} is a high-density corridor`
        : 'Standard corridor traffic density',
    },
    {
      label: 'System Readiness',
      weight:
        (block.systemIntegrations.tms ? 6 : 0) +
        (block.systemIntegrations.smms ? 6 : 0) +
        (block.systemIntegrations.tdms ? 6 : 0),
      rationale: 'TMS/SMMS/TDMS sync already in place — low re-planning friction',
    },
  ];

  const rawScore = factors.reduce((sum, f) => sum + f.weight, 0);
  const score = Math.min(100, rawScore);

  return {
    id: `PRI-${block.id.replace(/[^A-Za-z0-9]/g, '')}`,
    refId: block.id,
    kind: 'Missed Block',
    description: block.description,
    department: block.department,
    location: block.location || block.section,
    ageDays: age,
    score,
    factors,
    recommendedHorizon: pickHorizon(score),
    recommendedWindow: pickWindow(score),
  };
}

/** Builds the full ranked worklist the AI Prioritization Engine panel
 * displays: every open defect (not yet Resolved) plus every missed block,
 * scored and sorted highest-priority-first. */
export function buildPrioritizedWorklist(
  defects: Defect[],
  blockPlans: BlockPlan[]
): PrioritizedTask[] {
  const defectTasks = defects
    .filter((d) => d.status !== 'Resolved')
    .map(scoreDefect);
  const missedTasks = blockPlans
    .filter((b) => b.status === 'Missed')
    .map(scoreMissedBlock);

  return [...defectTasks, ...missedTasks].sort((a, b) => b.score - a.score);
}
