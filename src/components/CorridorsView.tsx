import React, { useState } from 'react';
import { Asset, BlockPlan } from '../types';
import { CORRIDORS_LIST, CORRIDOR_NODES } from '../data/mockData';
import { AiReschedulePage } from './AiReschedulePage';
import { CorridorMap } from './CorridorMap';

interface CorridorsViewProps {
  assets: Asset[];
  blockPlans: BlockPlan[];
  onOpenNewBlockModal: () => void;
  onLinkDefectOrAsset?: (asset: Asset) => void;
  onUpdateBlockPlan?: (updatedBlock: BlockPlan) => void;
  onAddBlockPlan?: (newBlock: BlockPlan) => void;
}

export const CorridorsView: React.FC<CorridorsViewProps> = ({
  assets,
  blockPlans,
  onOpenNewBlockModal,
  onLinkDefectOrAsset,
  onUpdateBlockPlan,
  onAddBlockPlan,
}) => {
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('NDLS-CNB');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedHealth, setSelectedHealth] = useState('All');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeMissedBlockForAi, setActiveMissedBlockForAi] = useState<BlockPlan | null>(null);
  const [rescheduleSuccessMsg, setRescheduleSuccessMsg] = useState<string | null>(null);
  const [blockFilterTab, setBlockFilterTab] = useState<'all' | 'missed' | 'active' | 'scheduled'>('all');

  const currentCorridor =
    CORRIDORS_LIST.find((c) => c.id === selectedCorridorId) || CORRIDORS_LIST[0];

  // Filter assets by corridor and table filters
  const corridorAssets = assets.filter((asset) => {
    if (asset.corridorId && asset.corridorId !== selectedCorridorId) {
      return false;
    }
    if (selectedCategory !== 'All Categories' && asset.category !== selectedCategory) {
      return false;
    }
    if (selectedDepartment !== 'All' && asset.department !== selectedDepartment) {
      return false;
    }
    if (selectedHealth !== 'All' && asset.health !== selectedHealth) {
      return false;
    }
    return true;
  });

  const activeFilterCount =
    (selectedCategory !== 'All Categories' ? 1 : 0) +
    (selectedDepartment !== 'All' ? 1 : 0) +
    (selectedHealth !== 'All' ? 1 : 0);

  const handleClearFilters = () => {
    setSelectedCategory('All Categories');
    setSelectedDepartment('All');
    setSelectedHealth('All');
  };

  // Filter corridor blocks
  const corridorBlocks = blockPlans.filter((b) => {
    const nameMatch =
      b.corridorName.toLowerCase().includes(selectedCorridorId.toLowerCase()) ||
      b.section.toLowerCase().includes(selectedCorridorId.split('-')[0].toLowerCase());
    return nameMatch;
  });

  const missedBlocks = corridorBlocks.filter((b) => b.status === 'Missed');
  const activeBlocks = corridorBlocks.filter((b) => b.status === 'Active');
  const scheduledBlocks = corridorBlocks.filter((b) => b.status === 'Scheduled');

  const filteredBlocks = corridorBlocks.filter((b) => {
    if (blockFilterTab === 'missed') return b.status === 'Missed';
    if (blockFilterTab === 'active') return b.status === 'Active';
    if (blockFilterTab === 'scheduled') return b.status === 'Scheduled';
    return true;
  });

  const getHealthBadge = (health: Asset['health']) => {
    switch (health) {
      case 'Healthy':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E2EFE7] text-[#1B4D3E] border border-[#1B4D3E]/20">
            Healthy
          </span>
        );
      case 'Warning':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FFDCC2] text-[#8F4E00] border border-[#8F4E00]/20">
            Warning
          </span>
        );
      case 'Critical':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F8D7DA] text-[#842029] border border-[#842029]/20">
            Critical
          </span>
        );
    }
  };

  const handleExportReport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Asset ID,Type,Location,Department,Category,Health,NextScheduled,Corridor\n' +
      corridorAssets
        .map(
          (a) =>
            `${a.id},${a.type},"${a.location}",${a.department},"${a.category}",${a.health},${a.nextScheduled},${selectedCorridorId}`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedCorridorId}-corridor-report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Launch AI Reschedule for a missed block — opens a dedicated page
  const handleLaunchAiReschedule = (block: BlockPlan) => {
    setActiveMissedBlockForAi(block);
  };

  // Simulate or flag a block as Missed
  const handleMarkAsMissed = (block: BlockPlan) => {
    const updated: BlockPlan = {
      ...block,
      status: 'Missed',
      missedReason: 'Possession denied due to emergency freight rake precedence and track circuit maintenance overrun.',
      originalSlot: `${block.date} (${block.startTime} - ${block.endTime})`,
    };
    if (onUpdateBlockPlan) {
      onUpdateBlockPlan(updated);
    }
    setRescheduleSuccessMsg(`Block ${block.id} marked as Missed. AI Rescheduling is now available!`);
    setTimeout(() => setRescheduleSuccessMsg(null), 4000);
  };

  // Handle applied rescheduled block from AI reschedule page
  const handleApplyRescheduledBlock = (
    updatedBlock: BlockPlan,
    newScheduledBlock?: BlockPlan
  ) => {
    if (onUpdateBlockPlan) {
      onUpdateBlockPlan(updatedBlock);
    }
    if (newScheduledBlock && onAddBlockPlan) {
      onAddBlockPlan(newScheduledBlock);
    }
    setRescheduleSuccessMsg(
      `AI Neural Engine successfully dispatched replacement schedule ${newScheduledBlock?.id || ''} for ${updatedBlock.section}!`
    );
    setTimeout(() => setRescheduleSuccessMsg(null), 5000);
  };

  // ── AI Reschedule Page (replaces the whole workspace, not a popup) ──
  if (activeMissedBlockForAi) {
    return (
      <AiReschedulePage
        missedBlock={activeMissedBlockForAi}
        onBack={() => setActiveMissedBlockForAi(null)}
        onApplyRescheduledBlock={handleApplyRescheduledBlock}
      />
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto space-y-6">
      {/* Top Notification Banner for Rescheduling Success */}
      {rescheduleSuccessMsg && (
        <div className="p-4 bg-[#E2EFE7] border border-[#1B4D3E]/30 rounded-xl text-xs text-[#1B4D3E] font-medium flex items-center justify-between animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-[#1B4D3E]">
              verified
            </span>
            <span>{rescheduleSuccessMsg}</span>
          </div>
          <button
            onClick={() => setRescheduleSuccessMsg(null)}
            className="text-[#1B4D3E] font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header & Corridor Selector */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] text-[#737067] uppercase font-mono tracking-[0.2em] font-semibold block mb-1">
            INFRASTRUCTURE SURVEILLANCE & DISPATCH
          </span>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-[#1A1A1A] mb-1 tracking-tight">
            Corridors & Assets
          </h2>
          <p className="text-xs text-[#737067] font-serif italic">
            Active track possession surveillance, asset health telemetry, and AI-powered missed block rescheduling.
          </p>
        </div>

        {/* Corridor Selector Dropdown Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-white border border-[#D4D0C5] px-3 py-1.5 rounded-lg shadow-2xs">
            <span className="material-symbols-outlined text-[16px] text-[#737067]">
              route
            </span>
            <span className="text-[11px] font-mono font-bold uppercase text-[#737067]">
              Corridor:
            </span>
            <select
              value={selectedCorridorId}
              onChange={(e) => setSelectedCorridorId(e.target.value)}
              className="bg-transparent text-xs font-serif font-bold text-[#1A1A1A] outline-none cursor-pointer pr-2"
            >
              {CORRIDORS_LIST.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            id="corridors-filter-toggle-btn"
            onClick={() => setShowAdvancedFilters((v) => !v)}
            className={`border text-xs px-3.5 py-2 rounded flex items-center gap-1.5 transition-colors cursor-pointer font-semibold ${
              showAdvancedFilters
                ? 'bg-[#1A1A1A] text-[#F9F8F6] border-[#1A1A1A]'
                : 'bg-white border-[#D4D0C5] text-[#1A1A1A] hover:bg-[#FAF9F5]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              filter_list
            </span>
            Filters
            {activeFilterCount > 0 && (
              <span
                className={`text-[10px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center ${
                  showAdvancedFilters ? 'bg-[#D4AF37] text-[#1A1A1A]' : 'bg-[#1A1A1A] text-[#F9F8F6]'
                }`}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            id="export-report-btn"
            onClick={handleExportReport}
            className="bg-[#1A1A1A] text-[#F9F8F6] font-semibold text-xs uppercase tracking-[0.1em] px-4 py-2 rounded hover:bg-[#2B2B2B] transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">
              download
            </span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Collapsible Advanced Filters Panel (kept out of the way until requested) */}
      {showAdvancedFilters && (
        <div className="bg-white p-4 rounded-xl border border-[#E5E2D9] shadow-[0px_2px_8px_rgba(0,0,0,0.02)] flex flex-wrap gap-4 items-end animate-in fade-in">
          <div className="flex-grow min-w-[180px]">
            <label className="block text-[11px] font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5 font-mono">
              Asset Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#F4F3EF] border border-[#D4D0C5] rounded py-2 px-3 text-xs text-[#1A1A1A] font-medium focus:border-[#1A1A1A] outline-none cursor-pointer"
            >
              <option>All Categories</option>
              <option>Engineering (Track)</option>
              <option>Traction (OHE)</option>
              <option>Signal & Telecom</option>
            </select>
          </div>

          <div className="flex-grow min-w-[140px]">
            <label className="block text-[11px] font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5 font-mono">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full bg-[#F4F3EF] border border-[#D4D0C5] rounded py-2 px-3 text-xs text-[#1A1A1A] font-medium focus:border-[#1A1A1A] outline-none cursor-pointer"
            >
              <option value="All">All Departments</option>
              <option value="Civil">Civil</option>
              <option value="Electrical">Electrical</option>
              <option value="S&T">S&T</option>
            </select>
          </div>

          <div className="flex-grow min-w-[140px]">
            <label className="block text-[11px] font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5 font-mono">
              Health Status
            </label>
            <select
              value={selectedHealth}
              onChange={(e) => setSelectedHealth(e.target.value)}
              className="w-full bg-[#F4F3EF] border border-[#D4D0C5] rounded py-2 px-3 text-xs text-[#1A1A1A] font-medium focus:border-[#1A1A1A] outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Critical">Critical</option>
              <option value="Warning">Warning</option>
              <option value="Healthy">Healthy</option>
            </select>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={handleClearFilters}
              className="text-[11px] font-mono font-semibold text-[#842029] hover:underline cursor-pointer pb-2.5"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Corridor Key Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF9F5] p-4 rounded-xl border border-[#E5E2D9]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#737067] block">
            Corridor Route
          </span>
          <span className="font-serif font-bold text-sm text-[#1A1A1A]">
            {currentCorridor.name}
          </span>
          <span className="text-[10px] font-mono text-[#737067] block">
            {currentCorridor.division}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#737067] block">
            Length & Infrastructure
          </span>
          <span className="font-serif font-bold text-sm text-[#1A1A1A]">
            {currentCorridor.routeLengthKm} Km
          </span>
          <span className="text-[10px] font-mono text-[#737067] block">
            {currentCorridor.trackType}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#737067] block">
            Active Possessions
          </span>
          <span className="font-serif font-bold text-sm text-[#1A1A1A]">
            {activeBlocks.length} Active / {scheduledBlocks.length} Scheduled
          </span>
          <span className="text-[10px] font-mono text-[#1B4D3E] block">
            Live Telemetry Synced
          </span>
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#737067] block">
            Missed Block Alerts
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`font-serif font-bold text-sm ${
                missedBlocks.length > 0 ? 'text-[#842029]' : 'text-[#1B4D3E]'
              }`}
            >
              {missedBlocks.length} Pending Reschedule
            </span>
            {missedBlocks.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#842029] animate-ping inline-block"></span>
            )}
          </div>
          {missedBlocks.length === 0 && (
            <span className="text-[10px] font-mono text-[#737067]">
              All slots on timetable
            </span>
          )}
        </div>
      </div>

      {/* Missed Blocks Urgent Alert Dossier (Shown if any missed blocks exist on this corridor) */}
      {missedBlocks.length > 0 && (
        <div className="bg-[#FCFBF8] border-2 border-[#842029]/30 rounded-xl p-5 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#E5E2D9]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#F8D7DA] text-[#842029] rounded-lg border border-[#842029]/20">
                <span className="material-symbols-outlined text-[24px]">
                  warning_amber
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#842029]">
                    ATTENTION REQUIRED
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-[#F8D7DA] text-[#842029] px-2 py-0.5 rounded">
                    {missedBlocks.length} MISSED BLOCK{missedBlocks.length > 1 ? 'S' : ''}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-base text-[#1A1A1A] mt-0.5">
                  Missed Track Possession Windows Detected on {currentCorridor.name}
                </h3>
                <p className="text-xs text-[#737067] font-serif italic">
                  Critical engineering maintenance was deferred or denied. The AI engine can calculate optimal replacement slots with zero train safety compromise.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleLaunchAiReschedule(missedBlocks[0])}
              className="bg-[#1A1A1A] hover:bg-[#2B2B2B] text-[#F9F8F6] font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded shadow-xs transition-all cursor-pointer flex items-center gap-2 shrink-0 self-start md:self-auto"
            >
              <span className="material-symbols-outlined text-[18px] text-[#D4AF37]">
                auto_schedule
              </span>
              AI Reschedule Missed Block
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {missedBlocks.map((mb) => (
              <div
                key={mb.id}
                className="p-4 bg-white border border-[#E5E2D9] rounded-xl hover:border-[#1A1A1A] transition-all space-y-2.5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#1A1A1A]">
                      {mb.id} • {mb.section}
                    </span>
                    <h4 className="text-sm font-serif font-bold text-[#1A1A1A] mt-0.5">
                      {mb.type} ({mb.durationHours} Hours)
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-[#F8D7DA] text-[#842029] px-2 py-0.5 rounded border border-[#842029]/20">
                    Missed
                  </span>
                </div>

                <p className="text-xs text-[#525252] leading-relaxed">
                  <strong className="text-[#1A1A1A]">Missed Reason:</strong>{' '}
                  {mb.missedReason || 'Corridor traffic congestion & emergency rake crossing'}
                </p>

                <div className="flex justify-between items-center text-[11px] font-mono text-[#737067] pt-2 border-t border-[#E5E2D9]">
                  <span>Original: {mb.originalSlot || `${mb.date} (${mb.startTime} - ${mb.endTime})`}</span>
                  <button
                    onClick={() => handleLaunchAiReschedule(mb)}
                    className="text-[#1A1A1A] hover:underline font-bold font-mono text-xs cursor-pointer inline-flex items-center gap-1"
                  >
                    AI Calculate Slot →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main 2-column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Area: Asset & Inventory Surveillance Table (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Asset Data Table */}
          <div className="bg-white rounded-xl border border-[#E5E2D9] shadow-[0px_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="p-4 border-b border-[#E5E2D9] flex justify-between items-center bg-[#FAF9F5]">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-sm text-[#1A1A1A]">
                  Trackside Assets Telemetry
                </span>
                <span className="text-[10px] font-mono bg-[#EAE8E2] text-[#737067] px-2 py-0.5 rounded font-bold">
                  {corridorAssets.length} Monitored
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#737067]">
                Corridor: {currentCorridor.id}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#FAF9F5] border-b border-[#E5E2D9]">
                  <tr>
                    <th className="p-3.5 text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider font-mono">
                      Asset ID
                    </th>
                    <th className="p-3.5 text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider font-mono">
                      Type & Dept
                    </th>
                    <th className="p-3.5 text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider font-mono">
                      Location (Chainage)
                    </th>
                    <th className="p-3.5 text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider font-mono">
                      Health
                    </th>
                    <th className="p-3.5 text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider text-right font-mono">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2D9] text-xs">
                  {corridorAssets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#737067] font-serif italic">
                        No assets match the current filter criteria for this corridor.
                      </td>
                    </tr>
                  ) : (
                    corridorAssets.map((asset, idx) => (
                      <tr
                        key={asset.id}
                        onClick={() => setSelectedAsset(asset)}
                        className={`hover:bg-[#FAF9F5] transition-colors cursor-pointer ${
                          idx % 2 === 1 ? 'bg-[#FCFBF8]' : 'bg-white'
                        }`}
                      >
                        <td className="p-3.5 font-bold font-mono text-[#1A1A1A]">
                          {asset.id}
                        </td>
                        <td className="p-3.5 text-[#1A1A1A] font-medium">
                          {asset.type} <span className="text-[#737067] text-[11px]">({asset.department})</span>
                        </td>
                        <td className="p-3.5 text-[#737067] font-mono">{asset.location}</td>
                        <td className="p-3.5">{getHealthBadge(asset.health)}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAsset(asset);
                            }}
                            className="text-[#1A1A1A] hover:underline font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                          >
                            Dossier
                            <span className="material-symbols-outlined text-[14px]">
                              arrow_forward
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination / Count Footer */}
            <div className="p-3.5 border-t border-[#E5E2D9] flex justify-between items-center bg-[#FAF9F5]">
              <span className="text-xs font-mono text-[#737067]">
                Displaying {corridorAssets.length} assets on {currentCorridor.name}
              </span>
              <div className="flex gap-1">
                <button
                  disabled
                  className="p-1 border border-[#D4D0C5] rounded bg-white disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    chevron_left
                  </span>
                </button>
                <button className="p-1 border border-[#D4D0C5] rounded bg-white hover:bg-[#FAF9F5] cursor-pointer">
                  <span className="material-symbols-outlined text-[16px]">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Map View Card (moved up, alongside the asset table it explains) */}
          <div className="bg-white rounded-xl border border-[#E5E2D9] overflow-hidden h-52 relative shadow-xs">
            <CorridorMap
              focusNodeIds={
                selectedCorridorId
                  .split('-')
                  .filter((id) => CORRIDOR_NODES.some((n) => n.id === id)).length >= 2
                  ? selectedCorridorId.split('-').filter((id) => CORRIDOR_NODES.some((n) => n.id === id))
                  : undefined
              }
            />
            <div className="absolute top-2 left-2 bg-[#1A1A1A]/80 backdrop-blur-xs text-[#F9F8F6] px-2.5 py-1 rounded text-[10px] font-mono font-bold z-[500] pointer-events-none">
              {currentCorridor.name} (Live Telemetry)
            </div>
            <div className="absolute bottom-2 left-2 bg-[#1A1A1A] text-[#F9F8F6] px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider uppercase border border-[#1A1A1A] z-[500] pointer-events-none">
              Live Map
            </div>
          </div>
        </div>

        {/* Right Area: Corridor Block Status & AI Schedule Actions (1 col) */}
        <div className="space-y-6">
          {/* Corridor Block Status Card */}
          <div className="bg-white rounded-xl border border-[#E5E2D9] p-5 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex justify-between items-start pb-3 border-b border-[#E5E2D9]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#737067] block">
                  CORRIDOR POSSESSION DOSSIER
                </span>
                <h3 className="font-serif text-base font-bold text-[#1A1A1A] mt-0.5">
                  Block Status & Timetable
                </h3>
              </div>
              <span className="text-xs font-mono font-bold bg-[#FAF9F5] border border-[#E5E2D9] px-2 py-0.5 rounded text-[#1A1A1A]">
                {currentCorridor.id}
              </span>
            </div>

            {/* Filter Tabs for Blocks */}
            <div className="flex rounded-lg bg-[#F4F3EF] p-1 text-[11px] font-mono font-bold">
              <button
                onClick={() => setBlockFilterTab('all')}
                className={`flex-1 py-1 text-center rounded transition-colors cursor-pointer ${
                  blockFilterTab === 'all'
                    ? 'bg-white text-[#1A1A1A] shadow-2xs'
                    : 'text-[#737067] hover:text-[#1A1A1A]'
                }`}
              >
                All ({corridorBlocks.length})
              </button>
              <button
                onClick={() => setBlockFilterTab('missed')}
                className={`flex-1 py-1 text-center rounded transition-colors cursor-pointer ${
                  blockFilterTab === 'missed'
                    ? 'bg-[#842029] text-white shadow-2xs'
                    : missedBlocks.length > 0
                    ? 'text-[#842029] font-bold'
                    : 'text-[#737067] hover:text-[#1A1A1A]'
                }`}
              >
                Missed ({missedBlocks.length})
              </button>
              <button
                onClick={() => setBlockFilterTab('active')}
                className={`flex-1 py-1 text-center rounded transition-colors cursor-pointer ${
                  blockFilterTab === 'active'
                    ? 'bg-white text-[#1A1A1A] shadow-2xs'
                    : 'text-[#737067] hover:text-[#1A1A1A]'
                }`}
              >
                Active ({activeBlocks.length})
              </button>
              <button
                onClick={() => setBlockFilterTab('scheduled')}
                className={`flex-1 py-1 text-center rounded transition-colors cursor-pointer ${
                  blockFilterTab === 'scheduled'
                    ? 'bg-white text-[#1A1A1A] shadow-2xs'
                    : 'text-[#737067] hover:text-[#1A1A1A]'
                }`}
              >
                Scheduled ({scheduledBlocks.length})
              </button>
            </div>

            {/* Block Cards List */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {filteredBlocks.length === 0 ? (
                <div className="py-8 text-center text-[#737067] text-xs font-serif italic bg-[#FAF9F5] rounded-lg border border-[#E5E2D9]">
                  No {blockFilterTab} blocks found on this corridor.
                </div>
              ) : (
                filteredBlocks.map((b) => {
                  const isMissed = b.status === 'Missed';
                  const isActive = b.status === 'Active';
                  const isScheduled = b.status === 'Scheduled';

                  return (
                    <div
                      key={b.id}
                      className={`border rounded-lg p-3.5 transition-all space-y-2 ${
                        isMissed
                          ? 'border-[#842029]/40 bg-[#FCFBF8] ring-1 ring-[#842029]/20'
                          : 'border-[#E5E2D9] bg-[#FAF9F5] hover:border-[#1A1A1A]'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs font-mono text-[#1A1A1A]">
                          {b.id}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                            isMissed
                              ? 'bg-[#F8D7DA] text-[#842029] border border-[#842029]/20'
                              : isActive
                              ? 'bg-[#F8D7DA] text-[#842029]'
                              : isScheduled
                              ? 'bg-[#EAE8E2] text-[#737067]'
                              : 'bg-[#E2EFE7] text-[#1B4D3E]'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>

                      <div>
                        <div className="text-xs font-serif font-bold text-[#1A1A1A]">
                          {b.type} ({b.durationHours}h)
                        </div>
                        <p className="text-[11px] text-[#525252] leading-snug mt-0.5">
                          {b.description}
                        </p>
                      </div>

                      <div className="flex justify-between text-[11px] text-[#737067] font-mono pt-1.5 border-t border-[#E5E2D9]">
                        <span>
                          {b.date} • {b.startTime} - {b.endTime}
                        </span>
                        {b.aiRescheduled && (
                          <span className="text-[#1B4D3E] font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">
                              auto_awesome
                            </span>
                            AI Synced
                          </span>
                        )}
                      </div>

                      {/* Action Triggers based on status */}
                      <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E5E2D9]">
                        {isMissed ? (
                          <button
                            onClick={() => handleLaunchAiReschedule(b)}
                            className="w-full bg-[#1A1A1A] hover:bg-[#2B2B2B] text-[#F9F8F6] font-bold text-xs uppercase tracking-wider py-1.5 px-3 rounded cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-[14px] text-[#D4AF37]">
                              auto_schedule
                            </span>
                            AI Reschedule Window
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkAsMissed(b)}
                            className="text-[10px] font-mono text-[#842029] hover:underline cursor-pointer flex items-center gap-1"
                            title="Simulate delay / mark possession as missed"
                          >
                            <span className="material-symbols-outlined text-[12px]">
                              event_busy
                            </span>
                            Flag as Missed
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              id="request-new-block-corridors-btn"
              onClick={onOpenNewBlockModal}
              className="w-full border border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F8F6] font-semibold text-xs uppercase tracking-[0.15em] py-2.5 rounded hover:bg-[#2B2B2B] transition-all cursor-pointer text-center"
            >
              Request New Corridor Block
            </button>
          </div>
        </div>
      </div>

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-[#1A1A1A]/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-xl p-6 shadow-2xl space-y-4 border border-[#E5E2D9]">
            <div className="flex justify-between items-start pb-3 border-b border-[#E5E2D9]">
              <div>
                <span className="text-[10px] text-[#737067] uppercase font-mono tracking-widest block mb-0.5">
                  ASSET DOSSIER
                </span>
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                  {selectedAsset.id} - {selectedAsset.type}
                </h3>
                <p className="text-xs text-[#737067] font-serif italic">
                  {selectedAsset.category} • {selectedAsset.department}
                </p>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="text-[#737067] hover:text-[#1A1A1A] p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#FAF9F5] rounded border border-[#E5E2D9]">
                <span className="text-[10px] font-mono text-[#737067] block uppercase">Location</span>
                <span className="font-semibold text-[#1A1A1A]">
                  {selectedAsset.location}
                </span>
              </div>
              <div className="p-3 bg-[#FAF9F5] rounded border border-[#E5E2D9]">
                <span className="text-[10px] font-mono text-[#737067] block uppercase">Current Health</span>
                <span className="font-semibold mt-0.5 inline-block">{getHealthBadge(selectedAsset.health)}</span>
              </div>
              <div className="p-3 bg-[#FAF9F5] rounded border border-[#E5E2D9]">
                <span className="text-[10px] font-mono text-[#737067] block uppercase">Last Inspected</span>
                <span className="font-medium text-[#1A1A1A]">
                  {selectedAsset.lastInspected}
                </span>
              </div>
              <div className="p-3 bg-[#FAF9F5] rounded border border-[#E5E2D9]">
                <span className="text-[10px] font-mono text-[#737067] block uppercase">Next Due Inspection</span>
                <span className="font-bold text-[#1A1A1A]">
                  {selectedAsset.nextScheduled}
                </span>
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2 border-t border-[#E5E2D9]">
              <button
                onClick={() => setSelectedAsset(null)}
                className="px-4 py-2 text-xs font-semibold text-[#737067] hover:text-[#1A1A1A] rounded cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedAsset(null);
                  onOpenNewBlockModal();
                }}
                className="px-4 py-2 text-xs font-semibold bg-[#1A1A1A] text-[#F9F8F6] uppercase tracking-wider rounded hover:bg-[#2B2B2B] cursor-pointer"
              >
                Schedule Maintenance Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
