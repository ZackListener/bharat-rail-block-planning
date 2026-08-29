import React, { useState } from 'react';
import { ActivityItem, CorridorNode, Defect, BlockPlan } from '../types';
import { CorridorMap } from './CorridorMap';

interface DashboardViewProps {
  activities: ActivityItem[];
  defects: Defect[];
  blockPlans: BlockPlan[];
  onSelectNode?: (node: CorridorNode) => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  activities,
  defects,
  blockPlans,
  onSelectNode,
  onNavigateTab,
}) => {
  const [selectedStation, setSelectedStation] = useState<CorridorNode | null>(null);
  const [showFullMapModal, setShowFullMapModal] = useState(false);
  const [exportFeedback, setExportFeedback] = useState(false);

  const handleExportData = () => {
    setExportFeedback(true);
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          {
            system: 'Bharat Rail AI Block Planning',
            timestamp: new Date().toISOString(),
            metrics: {
              activeBlocks: 142,
              pendingDefects: defects.length,
              assetAvailability: '94.2%',
            },
            blocks: blockPlans,
            defects: defects,
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bharat-rail-overview-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setTimeout(() => setExportFeedback(false), 2500);
  };

  return (
    <div className="max-w-[1280px] mx-auto space-y-8">
      {/* Page Header with Editorial Masthead flair */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-[#E5E2D9]">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#737067] block mb-1">
            Sectional Control • Executive Dispatch
          </span>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#1A1A1A] tracking-tight">
            Network Overview
          </h2>
          <p className="text-xs text-[#525252] mt-1 font-serif italic">
            Automated maintenance scheduling & operational corridor status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="export-data-btn"
            onClick={handleExportData}
            className="border border-[#1A1A1A] text-[#1A1A1A] bg-transparent hover:bg-[#1A1A1A] hover:text-[#F9F8F6] font-medium text-xs uppercase tracking-[0.15em] py-2.5 px-5 rounded transition-all min-h-[42px] cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            {exportFeedback ? 'Exported Successfully' : 'Export Data'}
          </button>
        </div>
      </div>

      {/* Bento Grid: 3 Editorial Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric Card 1: Active Blocks */}
        <div
          onClick={() => onNavigateTab('schedules')}
          className="bg-white border border-[#E5E2D9] hover:border-[#1A1A1A] rounded-xl p-6 relative overflow-hidden group transition-all cursor-pointer shadow-[0px_2px_8px_rgba(0,0,0,0.02)]"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-medium text-[#737067] uppercase tracking-[0.2em] mb-2 font-mono">
                ACTIVE BLOCKS
              </p>
              <h3 className="font-serif text-4xl md:text-5xl font-bold text-[#1A1A1A] tracking-tight">
                142
              </h3>
            </div>
            <div className="p-3 bg-[#F4F3EF] border border-[#E5E2D9] text-[#1A1A1A] rounded-full flex items-center justify-center group-hover:bg-[#1A1A1A] group-hover:text-[#F9F8F6] transition-colors">
              <span className="material-symbols-outlined text-[22px]">
                construction
              </span>
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-[#F4F3EF] flex items-center gap-2">
            <span className="text-[#1B4D3E] text-[11px] font-semibold bg-[#E2EFE7] px-2 py-0.5 rounded flex items-center">
              <span className="material-symbols-outlined text-[14px] font-bold mr-0.5">
                arrow_upward
              </span>{' '}
              12%
            </span>
            <span className="text-xs text-[#737067]">vs last week</span>
          </div>
        </div>

        {/* Metric Card 2: Pending Defects */}
        <div
          onClick={() => onNavigateTab('defects')}
          className="bg-white border border-[#E5E2D9] hover:border-[#1A1A1A] rounded-xl p-6 relative overflow-hidden group transition-all cursor-pointer shadow-[0px_2px_8px_rgba(0,0,0,0.02)]"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-medium text-[#737067] uppercase tracking-[0.2em] mb-2 font-mono">
                PENDING DEFECTS
              </p>
              <h3 className="font-serif text-4xl md:text-5xl font-bold text-[#842029] tracking-tight">
                38
              </h3>
            </div>
            <div className="p-3 bg-[#F8D7DA] text-[#842029] rounded-full flex items-center justify-center group-hover:bg-[#842029] group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[22px]">report</span>
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-[#F4F3EF] flex items-center gap-2">
            <span className="text-[#842029] text-[11px] font-semibold bg-[#F8D7DA] px-2 py-0.5 rounded flex items-center">
              <span className="material-symbols-outlined text-[14px] font-bold mr-0.5">
                arrow_downward
              </span>{' '}
              5%
            </span>
            <span className="text-xs text-[#737067]">vs last week</span>
          </div>
        </div>

        {/* Metric Card 3: Asset Availability */}
        <div
          onClick={() => onNavigateTab('corridors')}
          className="bg-white border border-[#E5E2D9] hover:border-[#1A1A1A] rounded-xl p-6 relative overflow-hidden group transition-all cursor-pointer shadow-[0px_2px_8px_rgba(0,0,0,0.02)]"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-medium text-[#737067] uppercase tracking-[0.2em] mb-2 font-mono">
                ASSET AVAILABILITY
              </p>
              <h3 className="font-serif text-4xl md:text-5xl font-bold text-[#1B4D3E] tracking-tight">
                94.2%
              </h3>
            </div>
            <div className="p-3 bg-[#E2EFE7] text-[#1B4D3E] rounded-full flex items-center justify-center group-hover:bg-[#1B4D3E] group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[22px]">
                check_circle
              </span>
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-[#F4F3EF] flex items-center justify-between">
            <span className="text-[#737067] text-xs font-serif italic">Target: 95.0%</span>
            <div className="w-24 bg-[#EAE8E2] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#1B4D3E] h-1.5 rounded-full"
                style={{ width: '94.2%' }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Bento Row: Corridor Map & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Corridor Status Map */}
        <div className="lg:col-span-2 bg-white border border-[#E5E2D9] rounded-xl flex flex-col h-[460px] shadow-[0px_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="p-4 px-6 border-b border-[#E5E2D9] flex justify-between items-center bg-[#FAF9F5]">
            <div>
              <h3 className="font-serif text-base md:text-lg font-bold text-[#1A1A1A]">
                Corridor Status Map
              </h3>
              <p className="text-xs text-[#737067] font-serif italic">
                Real-time active block overlays & telemetry signals across zones
              </p>
            </div>
            <button
              id="view-full-map-btn"
              onClick={() => setShowFullMapModal(true)}
              className="text-[#1A1A1A] font-semibold text-xs hover:underline uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              View Full Map
              <span className="material-symbols-outlined text-[16px]">
                open_in_new
              </span>
            </button>
          </div>

          <div className="flex-1 relative overflow-hidden">
            {/* Live OpenStreetMap-based corridor map */}
            <CorridorMap
              onSelectNode={(node) => {
                setSelectedStation(node);
                if (onSelectNode) onSelectNode(node);
              }}
              selectedNodeId={selectedStation?.id || null}
            />

            {/* Overlay UI Legend Chips */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-[500] pointer-events-none">
              <div className="bg-[#FAF9F5]/95 backdrop-blur-xs border border-[#D4D0C5] px-3 py-1.5 rounded-md shadow-xs flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#842029]"></div>
                <span className="text-[11px] font-semibold text-[#1A1A1A] tracking-wider uppercase">
                  Critical Delay
                </span>
              </div>
              <div className="bg-[#FAF9F5]/95 backdrop-blur-xs border border-[#D4D0C5] px-3 py-1.5 rounded-md shadow-xs flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#D4AF37]"></div>
                <span className="text-[11px] font-semibold text-[#1A1A1A] tracking-wider uppercase">
                  Maintenance
                </span>
              </div>
            </div>

            {/* Selected Station Popover (bottom-left to avoid covering the required OSM attribution, bottom-right) */}
            {selectedStation && (
              <div className="absolute bottom-4 left-4 bg-[#FAF9F5]/95 backdrop-blur-xs border border-[#1A1A1A] rounded-xl p-4 shadow-xl max-w-xs z-[500] animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#1A1A1A]">
                      {selectedStation.name} ({selectedStation.code})
                    </h4>
                    <p className="text-[11px] text-[#737067]">
                      Division: {selectedStation.division} Railway
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedStation(null)}
                    className="text-[#737067] hover:text-[#1A1A1A] p-1"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#525252]">Active Blocks:</span>
                    <span className="font-bold text-[#1A1A1A]">
                      {selectedStation.activeBlocksCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#525252]">Pending Defects:</span>
                    <span className="font-bold text-[#842029]">
                      {selectedStation.defectsCount}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#E5E2D9]">
                    <button
                      onClick={() => onNavigateTab('schedules')}
                      className="w-full bg-[#1A1A1A] text-[#F9F8F6] py-1.5 px-2 rounded text-[10px] uppercase tracking-wider font-semibold hover:bg-[#2B2B2B]"
                    >
                      Plan Block on this Node
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Recent Activities */}
        <div className="col-span-1 bg-white border border-[#E5E2D9] rounded-xl flex flex-col h-[460px] shadow-[0px_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="p-4 px-6 border-b border-[#E5E2D9] flex justify-between items-center bg-[#FAF9F5]">
            <h3 className="font-serif text-base md:text-lg font-bold text-[#1A1A1A]">
              Recent Activities
            </h3>
            <span className="text-[10px] bg-[#EAE8E2] text-[#1A1A1A] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
              Live
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <ul className="space-y-4">
              {activities.map((item, idx) => (
                <li
                  key={item.id || idx}
                  className="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-[-16px] before:w-px before:bg-[#E5E2D9] last:before:hidden"
                >
                  <div
                    className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ring-1 ring-[#D4D0C5]"
                    style={{ backgroundColor: item.color || '#1A1A1A' }}
                  ></div>
                  <p className="text-xs font-semibold text-[#1A1A1A] leading-snug">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-[#737067] mt-0.5 font-serif italic">
                    {item.subtitle}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Full Map Modal */}
      {showFullMapModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FAF9F5] w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-[#D4D0C5]">
            <div className="p-4 px-6 border-b border-[#E5E2D9] flex justify-between items-center bg-[#FAF9F5]">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#1A1A1A]">
                  map
                </span>
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                  National Railway Corridor GIS Telemetry
                </h3>
              </div>
              <button
                onClick={() => setShowFullMapModal(false)}
                className="p-1 rounded-md text-[#525252] hover:bg-[#EAE8E2] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-[#FAF9F5]">
              <div className="w-full h-[420px] rounded-lg border border-[#E5E2D9] overflow-hidden">
                <CorridorMap
                  onSelectNode={(node) => {
                    setSelectedStation(node);
                    if (onSelectNode) onSelectNode(node);
                  }}
                  selectedNodeId={selectedStation?.id || null}
                  showZoomControl
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
                <div className="p-3 bg-white rounded-lg border border-[#E5E2D9]">
                  <p className="text-[11px] text-[#737067] uppercase font-mono">Northern Corridor</p>
                  <p className="font-serif font-bold text-sm text-[#1A1A1A]">98.2% Punctuality</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#E5E2D9]">
                  <p className="text-[11px] text-[#737067] uppercase font-mono">Western DFC Link</p>
                  <p className="font-serif font-bold text-sm text-[#1B4D3E]">Operational</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#E5E2D9]">
                  <p className="text-[11px] text-[#737067] uppercase font-mono">Eastern Mainline</p>
                  <p className="font-serif font-bold text-sm text-[#842029]">3 Speed Restrictions</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#E5E2D9]">
                  <p className="text-[11px] text-[#737067] uppercase font-mono">Golden Quadrilateral</p>
                  <p className="font-serif font-bold text-sm text-[#1A1A1A]">142 Active Blocks</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

