import React, { useState } from 'react';
import { BlockPlan, DepartmentRequest, DepartmentType } from '../types';
import { optimizeBlockRequests, OptimizationResult } from '../utils/blockOptimizer';

interface BatchDepartmentRequestsProps {
  onCreateAll: (blocks: BlockPlan[]) => void;
}

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

const PRIORITY_COLORS: Record<DepartmentRequest['priority'], string> = {
  High: '#842029',
  Medium: '#8F4E00',
  Low: '#1B4D3E',
};

export const BatchDepartmentRequests: React.FC<BatchDepartmentRequestsProps> = ({
  onCreateAll,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [queue, setQueue] = useState<DepartmentRequest[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [combineMode, setCombineMode] = useState(true);
  const [lastResult, setLastResult] = useState<OptimizationResult | null>(null);

  // Form fields for the request currently being composed
  const [division, setDivision] = useState('Northern Railway (Delhi)');
  const [section, setSection] = useState('NDLS - CNB (Main Line)');
  const [department, setDepartment] = useState<DepartmentType>('Civil');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [durationHours, setDurationHours] = useState(3);
  const [priority, setPriority] = useState<DepartmentRequest['priority']>('Medium');

  const handleAddToQueue = () => {
    if (!type.trim()) return;
    const newRequest: DepartmentRequest = {
      id: `req-${Date.now()}`,
      division,
      section,
      department,
      type: type.trim(),
      description: description.trim() || `${type.trim()} on ${section}`,
      durationHours,
      priority,
    };
    setQueue((prev) => [...prev, newRequest]);
    setType('');
    setDescription('');
  };

  const handleRemove = (id: string) => {
    setQueue((prev) => prev.filter((r) => r.id !== id));
  };

  // Reads every queued department request — regardless of how different each
  // one's division/section/department is from the others or from this form's
  // current selection — and creates the resulting block plan(s).
  //
  // combineMode ON (default): requests that share a section are OPTIMIZED
  // into a single combined possession block (concurrent multi-department
  // work, one corridor closure instead of many) via blockOptimizer.
  // combineMode OFF: legacy behaviour — every request gets its own
  // staggered, non-overlapping block, for side-by-side comparison in a demo.
  const handleCreateAllSimultaneously = () => {
    if (queue.length === 0) return;
    const deptCount = new Set(queue.map((r) => r.department)).size;

    if (combineMode) {
      const result = optimizeBlockRequests(queue);
      onCreateAll(result.blocks);
      setLastResult(result);
      setSuccessMsg(
        `${queue.length} requests → ${result.blocks.length} possession block${
          result.blocks.length === 1 ? '' : 's'
        } (${result.stats.combinedBlockCount} combined) across ${deptCount} department(s). ` +
          `Saved ${result.stats.hoursSaved.toFixed(1)} possession-hours (${result.stats.percentSaved}%).`
      );
    } else {
      const targetDate = getTomorrowIso();
      // Stagger each request's start time so simultaneously-created blocks on
      // the same date don't all collide on paper (150 min apart, wrapping).
      const blocks: BlockPlan[] = queue.map((req, index) => {
        const startTime = addMinutesToTime('00:30', index * 150);
        const endTime = addHours(startTime, req.durationHours);
        return {
          id: `#MB-${new Date().getFullYear()}-B${Date.now().toString().slice(-4)}${index}`,
          corridorName: req.section,
          division: req.division,
          section: req.section,
          description: req.description,
          date: targetDate,
          startTime: `${startTime} Hrs`,
          endTime: `${endTime} Hrs`,
          durationHours: req.durationHours,
          status: 'Scheduled',
          type: req.type,
          department: req.department,
          progressPercent: 0,
          systemIntegrations: { tms: true, smms: req.department === 'S&T', tdms: req.department === 'Electrical' },
          approvedBy: `Batch Intake / ${req.department} Dept. Request`,
        };
      });
      onCreateAll(blocks);
      setLastResult(null);
      setSuccessMsg(
        `${blocks.length} blocks created simultaneously across ${deptCount} department(s). (Combine mode off — one possession per request.)`
      );
    }

    setQueue([]);
    setTimeout(() => setSuccessMsg(null), 7000);
  };

  return (
    <div className="bg-white rounded-xl border border-[#E5E2D9] shadow-[0px_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full bg-[#FAF9F5] border-b border-[#E5E2D9] px-6 py-4 flex items-center justify-between cursor-pointer"
      >
        <div className="text-left">
          <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#D4AF37]">
              dynamic_feed
            </span>
            Multi-Department Batch Requests
          </h3>
          <p className="text-[11px] text-[#737067] mt-0.5">
            Queue requests from different departments — even with different corridors or sections — then create every block simultaneously.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {queue.length > 0 && (
            <span className="text-[10px] font-mono font-bold bg-[#1A1A1A] text-[#F9F8F6] px-2 py-0.5 rounded-full">
              {queue.length} queued
            </span>
          )}
          <span className="material-symbols-outlined text-[20px] text-[#737067]">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="p-6 space-y-5 animate-in fade-in">
          {successMsg && (
            <div className="p-3.5 bg-[#E2EFE7] border border-[#1B4D3E]/30 rounded-lg text-xs text-[#1B4D3E] font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              {successMsg}
            </div>
          )}

          {lastResult && (
            <div className="p-4 bg-[#FBF7EC] border border-[#D4AF37]/40 rounded-lg space-y-2">
              <h4 className="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#D4AF37]">merge_type</span>
                Optimization Result
              </h4>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-white rounded border border-[#E5E2D9]">
                  <div className="text-base font-bold text-[#1A1A1A] font-mono">{lastResult.stats.requestCount}</div>
                  <div className="text-[9px] text-[#737067] uppercase">Requests</div>
                </div>
                <div className="p-2 bg-white rounded border border-[#E5E2D9]">
                  <div className="text-base font-bold text-[#1A1A1A] font-mono">{lastResult.stats.blockCount}</div>
                  <div className="text-[9px] text-[#737067] uppercase">Possessions</div>
                </div>
                <div className="p-2 bg-white rounded border border-[#E5E2D9]">
                  <div className="text-base font-bold text-[#1B4D3E] font-mono">{lastResult.stats.combinedBlockCount}</div>
                  <div className="text-[9px] text-[#737067] uppercase">Combined</div>
                </div>
                <div className="p-2 bg-white rounded border border-[#E5E2D9]">
                  <div className="text-base font-bold text-[#1B4D3E] font-mono">{lastResult.stats.percentSaved}%</div>
                  <div className="text-[9px] text-[#737067] uppercase">Hrs Saved</div>
                </div>
              </div>
              <p className="text-[11px] text-[#525252]">
                Baseline (one possession per request): {lastResult.stats.baselinePossessionHours.toFixed(1)}h of corridor
                closure. Optimized: {lastResult.stats.optimizedPossessionHours.toFixed(1)}h — departments sharing a
                section now work concurrently inside one combined block.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-[#FAF9F5] border border-[#E5E2D9] rounded-lg">
            <div>
              <span className="text-xs font-bold text-[#1A1A1A] block">Combine same-section requests</span>
              <span className="text-[10px] text-[#737067]">
                When ON, requests on the same section are merged into one concurrent multi-department possession
                instead of separate blocks.
              </span>
            </div>
            <button
              onClick={() => setCombineMode((v) => !v)}
              className={`shrink-0 relative w-10 h-5.5 rounded-full transition-colors cursor-pointer ${
                combineMode ? 'bg-[#1B4D3E]' : 'bg-[#D4D0C5]'
              }`}
              aria-label="Toggle combine mode"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${
                  combineMode ? 'translate-x-4.5' : ''
                }`}
              />
            </button>
          </div>

          {/* Add-to-queue form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                Division
              </label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full p-2.5 bg-[#F4F3EF] border border-[#D4D0C5] rounded text-xs text-[#1A1A1A] outline-none cursor-pointer"
              >
                <option>Northern Railway (Delhi)</option>
                <option>Western Railway (Mumbai)</option>
                <option>Eastern Railway (Kolkata)</option>
                <option>Southern Railway (Chennai)</option>
                <option>North Central Railway (Prayagraj)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                Section
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full p-2.5 bg-[#F4F3EF] border border-[#D4D0C5] rounded text-xs text-[#1A1A1A] outline-none cursor-pointer"
              >
                <option>NDLS - CNB (Main Line)</option>
                <option>NDLS - UMB (Ambala Route)</option>
                <option>CNB - PRYJ (Kanpur - Prayagraj)</option>
                <option>BCT - ADI (Mumbai - Ahmedabad)</option>
                <option>HWH - BWN (Howrah - Barddhaman)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as DepartmentType)}
                className="w-full p-2.5 bg-[#F4F3EF] border border-[#D4D0C5] rounded text-xs text-[#1A1A1A] outline-none cursor-pointer"
              >
                <option value="Civil">Civil</option>
                <option value="Electrical">Electrical</option>
                <option value="S&T">S&T</option>
                <option value="Track Maintenance">Track Maintenance</option>
                <option value="Signaling">Signaling</option>
                <option value="Rolling Stock">Rolling Stock</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as DepartmentRequest['priority'])}
                className="w-full p-2.5 bg-[#F4F3EF] border border-[#D4D0C5] rounded text-xs text-[#1A1A1A] outline-none cursor-pointer"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                Maintenance Type
              </label>
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="e.g. Signal relay replacement"
                className="w-full p-2.5 bg-[#F4F3EF] border border-[#D4D0C5] rounded text-xs text-[#1A1A1A] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                Duration (Hours)
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={durationHours}
                onChange={(e) => setDurationHours(parseInt(e.target.value) || 1)}
                className="w-full p-2.5 bg-[#F4F3EF] border border-[#D4D0C5] rounded text-xs font-mono text-[#1A1A1A] outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                Scope / Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief scope of work..."
                className="w-full p-2.5 bg-[#F4F3EF] border border-[#D4D0C5] rounded text-xs text-[#1A1A1A] outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleAddToQueue}
            disabled={!type.trim()}
            className="w-full border border-dashed border-[#D4D0C5] hover:border-[#1A1A1A] text-xs font-semibold text-[#1A1A1A] py-2.5 rounded transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add This Request to Queue
          </button>

          {/* Queued requests list */}
          {queue.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#E5E2D9]">
              <h4 className="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider">
                Queued Requests ({queue.length})
              </h4>
              {queue.map((req) => {
                const sectionMates = queue.filter((r) => r.section === req.section).length;
                const willCombine = combineMode && sectionMates > 1;
                return (
                  <div
                    key={req.id}
                    className={`flex items-center justify-between gap-3 p-3 bg-[#FAF9F5] border rounded-lg text-xs ${
                      willCombine ? 'border-[#D4AF37]' : 'border-[#E5E2D9]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#1A1A1A]">{req.type}</span>
                        <span
                          style={{ color: PRIORITY_COLORS[req.priority] }}
                          className="text-[10px] font-mono font-bold uppercase"
                        >
                          {req.priority}
                        </span>
                        {willCombine && (
                          <span className="text-[9px] font-mono font-bold uppercase text-[#8F4E00] bg-[#FBF7EC] border border-[#D4AF37]/50 px-1.5 py-0.5 rounded">
                            will combine ×{sectionMates}
                          </span>
                        )}
                      </div>
                      <div className="text-[#737067] text-[11px] truncate">
                        {req.department} • {req.section} • {req.durationHours}h
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(req.id)}
                      className="text-[#842029] hover:bg-[#F8D7DA] rounded p-1.5 shrink-0 cursor-pointer"
                      title="Remove from queue"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={handleCreateAllSimultaneously}
            disabled={queue.length === 0}
            className="w-full bg-[#1A1A1A] hover:bg-[#2B2B2B] disabled:opacity-40 disabled:cursor-not-allowed text-[#F9F8F6] font-bold text-xs uppercase tracking-wider py-3 rounded shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px] text-[#D4AF37]">
              {combineMode ? 'merge_type' : 'bolt'}
            </span>
            {combineMode ? 'Optimize & Create Combined Block(s)' : `Create ${queue.length} Block${queue.length === 1 ? '' : 's'} Simultaneously`}
          </button>
        </div>
      )}
    </div>
  );
};
