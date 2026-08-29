import React, { useMemo, useState } from 'react';
import { Defect, BlockPlan, PrioritizedTask } from '../types';
import { buildPrioritizedWorklist } from '../utils/priorityEngine';

interface PriorityEngineViewProps {
  defects: Defect[];
  blockPlans: BlockPlan[];
}

function scoreColor(score: number) {
  if (score >= 70) return { bg: '#F8D7DA', border: '#842029', text: '#842029', bar: '#842029' };
  if (score >= 45) return { bg: '#FFDCC2', border: '#8F4E00', text: '#8F4E00', bar: '#B4690A' };
  return { bg: '#E2EFE7', border: '#1B4D3E', text: '#1B4D3E', bar: '#1B4D3E' };
}

export const PriorityEngineView: React.FC<PriorityEngineViewProps> = ({ defects, blockPlans }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const worklist = useMemo(() => buildPrioritizedWorklist(defects, blockPlans), [defects, blockPlans]);

  const horizonCounts = useMemo(() => {
    const counts = { 'This Week': 0, 'This Month': 0, 'Next Month': 0 } as Record<PrioritizedTask['recommendedHorizon'], number>;
    worklist.forEach((t) => {
      counts[t.recommendedHorizon]++;
    });
    return counts;
  }, [worklist]);

  return (
    <div className="bg-white rounded-xl border border-[#E5E2D9] shadow-[0px_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
      {/* Header */}
      <div className="bg-[#1A1A1A] text-[#F9F8F6] px-6 py-4 border-b border-[#1A1A1A]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-[#D4AF37] font-semibold block mb-0.5">
              AI Prioritization Engine
            </span>
            <h3 className="font-serif text-base font-bold text-white">
              Criticality-Weighted Maintenance Worklist
            </h3>
          </div>
          <div className="flex gap-2 text-[10px] font-mono">
            <span className="px-2.5 py-1 rounded-full bg-[#842029]/20 text-[#F8D7DA] border border-[#842029]/40">
              {horizonCounts['This Week']} This Week
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#8F4E00]/20 text-[#FFDCC2] border border-[#8F4E00]/40">
              {horizonCounts['This Month']} This Month
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#1B4D3E]/30 text-[#E2EFE7] border border-[#1B4D3E]/40">
              {horizonCounts['Next Month']} Next Month
            </span>
          </div>
        </div>
        <p className="text-[11px] text-[#D4D0C5] mt-2 leading-relaxed max-w-2xl">
          Every open defect and missed block is scored 0–100 from four weighted
          factors — severity, status/urgency, backlog age, and corridor
          impact — then bucketed into a scheduling horizon. Click a row to see
          the score breakdown.
        </p>
      </div>

      {/* Worklist */}
      <div className="divide-y divide-[#E5E2D9] max-h-[420px] overflow-y-auto">
        {worklist.map((task) => {
          const colors = scoreColor(task.score);
          const isExpanded = expandedId === task.id;
          return (
            <div key={task.id}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : task.id)}
                className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-[#FAF9F5] transition-colors cursor-pointer"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0"
                  style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}40` }}
                >
                  {task.score}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#737067] uppercase tracking-wider">
                      {task.refId}
                    </span>
                    <span
                      className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {task.kind}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-[#1A1A1A] truncate">
                    {task.description}
                  </div>
                  <div className="text-[10px] text-[#737067] font-mono truncate">
                    {task.department} • {task.location}
                  </div>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <div className="text-[10px] font-mono font-bold uppercase" style={{ color: colors.text }}>
                    {task.recommendedHorizon}
                  </div>
                  <div className="text-[9px] text-[#737067]">{task.ageDays}d in backlog</div>
                </div>
                <span className="material-symbols-outlined text-[18px] text-[#737067] shrink-0">
                  {isExpanded ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {isExpanded && (
                <div className="px-6 pb-4 bg-[#FAF9F5]">
                  <div className="space-y-2 pt-1">
                    {task.factors.map((f) => (
                      <div key={f.label} className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-[#737067] w-32 shrink-0">
                          {f.label}
                        </span>
                        <div className="flex-1 h-2 bg-[#E5E2D9] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, (f.weight / 40) * 100)}%`,
                              backgroundColor: colors.bar,
                            }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-[#1A1A1A] w-8 text-right">
                          +{f.weight}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#525252] mt-2.5 italic">
                    Recommended window: {task.recommendedWindow}
                  </p>
                </div>
              )}
            </div>
          );
        })}
        {worklist.length === 0 && (
          <div className="py-10 text-center text-xs text-[#737067] font-serif italic">
            No open defects or missed blocks — worklist is clear.
          </div>
        )}
      </div>
    </div>
  );
};
