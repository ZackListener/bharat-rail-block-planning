// Block Consolidation / Combined Possession Optimizer
// ------------------------------------------------------------------
// Directly implements SIH PS requirement #3: "Optimize block scheduling
// to maximize asset uptime by minimizing downtime and efficiently
// coordinating multi-department activities."
//
// The naive approach (see the old batch-request flow) takes N department
// requests and creates N separate possessions, merely staggered in time
// so they don't collide on paper. The corridor is still taken out of
// service N times.
//
// This optimizer instead groups requests that target the SAME section
// and folds them into ONE possession block. Departments work concurrently
// within that single window, so the block's duration is the MAX of the
// merged tasks' durations (not the sum) — the corridor is possessed once,
// not once per department. This is the core "coordinate multi-department
// activities to minimize downtime" behaviour the PS asks for.

import { BlockPlan, DepartmentRequest, DepartmentType } from '../types';

const pad = (n: number) => n.toString().padStart(2, '0');

function addHours(startHHMM: string, hours: number): string {
  const [h, m] = startHHMM.split(':').map(Number);
  let totalMinutes = (h * 60 + m + Math.round(hours * 60)) % (24 * 60);
  if (totalMinutes < 0) totalMinutes += 24 * 60;
  const eh = Math.floor(totalMinutes / 60);
  const em = totalMinutes % 60;
  return `${pad(eh)}:${pad(em)}`;
}

function addMinutesToTime(startHHMM: string, minutesToAdd: number): string {
  const [h, m] = startHHMM.split(':').map(Number);
  let total = (h * 60 + m + minutesToAdd) % (24 * 60);
  if (total < 0) total += 24 * 60;
  const eh = Math.floor(total / 60);
  const em = total % 60;
  return `${pad(eh)}:${pad(em)}`;
}

function getTomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const PRIORITY_RANK: Record<DepartmentRequest['priority'], number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

export interface OptimizationResult {
  blocks: BlockPlan[];
  stats: {
    requestCount: number;
    blockCount: number;
    combinedBlockCount: number;
    /** Sum of every request's duration if each had its own possession. */
    baselinePossessionHours: number;
    /** Sum of every resulting block's duration after combining. */
    optimizedPossessionHours: number;
    hoursSaved: number;
    percentSaved: number;
  };
}

/**
 * Groups queued department requests by section and merges same-section
 * groups into a single combined possession block. Requests on different
 * sections still get their own (staggered) blocks, since they can't
 * physically share one possession window.
 */
export function optimizeBlockRequests(queue: DepartmentRequest[]): OptimizationResult {
  const targetDate = getTomorrowIso();

  // Group by section — only requests on the same section/corridor can
  // share one possession.
  const groups = new Map<string, DepartmentRequest[]>();
  for (const req of queue) {
    const key = req.section;
    const list = groups.get(key) ?? [];
    list.push(req);
    groups.set(key, list);
  }

  const blocks: BlockPlan[] = [];
  let cursorMinutesFromMidnight = 30; // start at 00:30 Hrs, next low-traffic window
  let combinedBlockCount = 0;

  for (const [section, requests] of groups) {
    const sorted = [...requests].sort(
      (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    );

    const startTime = addMinutesToTime('00:00', cursorMinutesFromMidnight);
    // Concurrent multi-department work within one possession: the block
    // only needs to stay open as long as the LONGEST sub-task, not the
    // sum of all of them.
    const mergedDurationHours = Math.max(...sorted.map((r) => r.durationHours));
    const endTime = addHours(startTime, mergedDurationHours);
    const isCombined = sorted.length > 1;
    const departments = Array.from(new Set(sorted.map((r) => r.department)));

    const block: BlockPlan = {
      id: `#MB-${new Date().getFullYear()}-B${Date.now().toString().slice(-4)}${blocks.length}`,
      corridorName: section,
      division: sorted[0].division,
      section,
      description: isCombined
        ? `Combined possession — ${departments.join(' + ')} working concurrently: ${sorted
            .map((r) => r.type)
            .join(', ')}`
        : sorted[0].description,
      date: targetDate,
      startTime: `${startTime} Hrs`,
      endTime: `${endTime} Hrs`,
      durationHours: mergedDurationHours,
      status: 'Scheduled',
      type: isCombined ? 'Combined Multi-Department Block' : sorted[0].type,
      department: sorted[0].department,
      progressPercent: 0,
      systemIntegrations: {
        tms: true,
        smms: departments.includes('S&T') || departments.includes('Signaling'),
        tdms: departments.includes('Electrical'),
      },
      approvedBy: isCombined
        ? `Batch Intake / Consolidated (${departments.length} Depts)`
        : `Batch Intake / ${sorted[0].department} Dept. Request`,
      isCombined,
      combinedDepartments: departments,
      subTasks: sorted.map((r) => ({
        department: r.department,
        type: r.type,
        description: r.description,
        durationHours: r.durationHours,
        priority: r.priority,
      })),
    };

    blocks.push(block);
    if (isCombined) combinedBlockCount += 1;

    // Next section's block starts after this one, still spaced out so two
    // *different* sections' possessions don't visually collide on the
    // single-corridor demo timeline.
    cursorMinutesFromMidnight += Math.round(mergedDurationHours * 60) + 30;
  }

  const baselinePossessionHours = queue.reduce((sum, r) => sum + r.durationHours, 0);
  const optimizedPossessionHours = blocks.reduce((sum, b) => sum + b.durationHours, 0);
  const hoursSaved = Math.max(0, baselinePossessionHours - optimizedPossessionHours);
  const percentSaved =
    baselinePossessionHours > 0 ? Math.round((hoursSaved / baselinePossessionHours) * 100) : 0;

  return {
    blocks,
    stats: {
      requestCount: queue.length,
      blockCount: blocks.length,
      combinedBlockCount,
      baselinePossessionHours,
      optimizedPossessionHours,
      hoursSaved,
      percentSaved,
    },
  };
}
