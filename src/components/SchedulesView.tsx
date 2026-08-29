import React, { useState, useMemo } from 'react';
import { BlockPlan, Defect } from '../types';
import { BatchDepartmentRequests } from './BatchDepartmentRequests';
import { PriorityEngineView } from './PriorityEngineView';
import { TrainForecastPanel } from './TrainForecastPanel';

interface SchedulesViewProps {
  blockPlans: BlockPlan[];
  defects: Defect[];
  onAddBlockPlan: (newBlock: BlockPlan) => void;
  onAddMultipleBlockPlans: (newBlocks: BlockPlan[]) => void;
  onOpenAiModal: () => void;
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad = (n: number) => n.toString().padStart(2, '0');
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

interface CalendarCell {
  iso: string;
  day: number;
  isCurrentMonth: boolean;
}

function buildCalendarCells(year: number, month: number): CalendarCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const cells: CalendarCell[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayOffset = i - startOffset + 1;
    const date = new Date(year, month, dayOffset);
    cells.push({
      iso: toIso(date.getFullYear(), date.getMonth(), date.getDate()),
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
    });
  }
  return cells;
}

function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

export const SchedulesView: React.FC<SchedulesViewProps> = ({
  blockPlans,
  defects,
  onAddBlockPlan,
  onAddMultipleBlockPlans,
  onOpenAiModal,
}) => {
  // Wizard state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [tmsChecked, setTmsChecked] = useState(true);
  const [smmsChecked, setSmmsChecked] = useState(true);
  const [tdmsChecked, setTdmsChecked] = useState(false);
  const [division, setDivision] = useState('Northern Railway (Delhi)');
  const [section, setSection] = useState('NDLS - CNB (Main Line)');
  const [durationHours, setDurationHours] = useState(4);
  const [blockType, setBlockType] = useState('Track Maintenance & Tamping');
  const [createdSuccess, setCreatedSuccess] = useState(false);

  // Group all real blocks by date (YYYY-MM-DD) so the calendar reflects actual data
  const blocksByDate = useMemo(() => {
    const map: Record<string, BlockPlan[]> = {};
    blockPlans.forEach((b) => {
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    });
    return map;
  }, [blockPlans]);

  // Default the visible month to whichever month actually has the most blocks,
  // so the demo data is visible on load. Falls back to the current month.
  const initialView = useMemo(() => {
    const dateKeys = Object.keys(blocksByDate);
    if (dateKeys.length === 0) {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth() };
    }
    const counts: Record<string, number> = {};
    dateKeys.forEach((iso) => {
      const key = iso.slice(0, 7); // YYYY-MM
      counts[key] = (counts[key] || 0) + blocksByDate[iso].length;
    });
    const bestKey = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    const [y, m] = bestKey.split('-').map(Number);
    return { year: y, month: m - 1 };
  }, [blocksByDate]);

  const [viewYear, setViewYear] = useState(initialView.year);
  const [viewMonth, setViewMonth] = useState(initialView.month);

  // Pick a sensible default selected date: the busiest date in the visible month, else today
  const defaultSelectedDate = useMemo(() => {
    const inMonth = Object.keys(blocksByDate).filter((iso) => iso.slice(0, 7) === toIso(viewYear, viewMonth, 1).slice(0, 7));
    if (inMonth.length > 0) {
      return inMonth.sort((a, b) => blocksByDate[b].length - blocksByDate[a].length)[0];
    }
    return toIso(viewYear, viewMonth, 1);
  }, [viewYear, viewMonth, blocksByDate]);

  const [selectedDateIso, setSelectedDateIso] = useState<string>(defaultSelectedDate);

  const calendarCells = useMemo(() => buildCalendarCells(viewYear, viewMonth), [viewYear, viewMonth]);

  const goToPrevMonth = () => {
    const d = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };
  const goToNextMonth = () => {
    const d = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };
  const goToToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDateIso(toIso(now.getFullYear(), now.getMonth(), now.getDate()));
  };

  const getCellStatus = (iso: string): 'error' | 'warning' | 'success' | null => {
    const blocks = blocksByDate[iso];
    if (!blocks || blocks.length === 0) return null;
    if (blocks.some((b) => b.status === 'Missed')) return 'error';
    if (blocks.some((b) => b.status === 'Active' || b.status === 'Scheduled' || b.status === 'Pending Approval'))
      return 'warning';
    return 'success';
  };

  const selectedDateBlocks = (blocksByDate[selectedDateIso] || [])
    .slice()
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleStepSubmit = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else {
      // Create new block plan on the date selected in the calendar
      const newPlan: BlockPlan = {
        id: `#MB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        corridorName: section,
        division: division,
        section: section,
        description: `${blockType} on ${section} with AI-optimized train clearance window.`,
        date: selectedDateIso,
        startTime: '01:30 Hrs',
        endTime: `${(1.5 + durationHours).toFixed(1)}:30 Hrs`,
        durationHours: durationHours,
        status: 'Scheduled',
        type: blockType,
        department: 'Civil',
        progressPercent: 0,
        systemIntegrations: {
          tms: tmsChecked,
          smms: smmsChecked,
          tdms: tdmsChecked,
        },
        approvedBy: 'AI Predictive Engine / Dy. Chief Controller',
      };
      onAddBlockPlan(newPlan);
      setCreatedSuccess(true);
      setTimeout(() => {
        setCreatedSuccess(false);
        setCurrentStep(1);
      }, 2500);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8">
      {/* Left Column: AI Generation Banner & Maintenance Request Form */}
      <div className="xl:col-span-8 flex flex-col gap-6">
        {/* AI Prioritization Engine: transparent scoring of defects + missed blocks */}
        <PriorityEngineView defects={defects} blockPlans={blockPlans} />

        {/* AI Generation Action Card */}
        <div className="bg-[#1A1A1A] text-[#F9F8F6] rounded-xl border border-[#1A1A1A] p-6 shadow-[0px_4px_16px_rgba(0,0,0,0.08)] relative overflow-hidden group">
          {/* Subtle gold line flair */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#D4AF37]"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <span className="text-[10px] text-[#D4AF37] uppercase font-mono tracking-[0.2em] font-semibold block mb-1">
                ALGORITHMIC DISPATCH
              </span>
              <h2 className="font-serif text-xl md:text-2xl font-bold mb-2 tracking-tight text-white">
                Generate AI Block Schedule
              </h2>
              <p className="text-xs md:text-sm text-[#D4D0C5] max-w-xl leading-relaxed font-serif italic">
                Predictive AI scheduling engine optimizing track possession windows
                against active train timetables to minimize traffic delays.
              </p>
            </div>
            <button
              id="generate-ai-schedule-btn"
              onClick={onOpenAiModal}
              className="flex items-center justify-center bg-[#D4AF37] hover:bg-[#C5A059] active:scale-[0.98] text-[#1A1A1A] font-bold text-xs uppercase tracking-[0.15em] h-11 px-6 rounded transition-all shadow-md whitespace-nowrap min-w-[210px] cursor-pointer"
            >
              <span className="material-symbols-outlined mr-2 text-[18px]">
                smart_toy
              </span>
              Generate AI Schedule
            </button>
          </div>
        </div>

        {/* Multi-step Form & Data Integration */}
        <div className="bg-white rounded-xl border border-[#E5E2D9] shadow-[0px_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
          {/* Form Header / Progress */}
          <div className="bg-[#FAF9F5] border-b border-[#E5E2D9] px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">
                Maintenance Request Input
              </h3>
              <p className="text-[11px] text-[#737067] font-serif italic">
                Step-by-step corridor parameter & conflict resolution
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  currentStep >= 1
                    ? 'bg-[#1A1A1A] text-[#F9F8F6]'
                    : 'bg-[#EAE8E2] text-[#737067] border border-[#D4D0C5]'
                }`}
              >
                1
              </span>
              <div
                className={`w-6 h-0.5 rounded ${
                  currentStep >= 2 ? 'bg-[#1A1A1A]' : 'bg-[#E5E2D9]'
                }`}
              ></div>
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  currentStep >= 2
                    ? 'bg-[#1A1A1A] text-[#F9F8F6]'
                    : 'bg-[#EAE8E2] text-[#737067] border border-[#D4D0C5]'
                }`}
              >
                2
              </span>
              <div
                className={`w-6 h-0.5 rounded ${
                  currentStep >= 3 ? 'bg-[#1A1A1A]' : 'bg-[#E5E2D9]'
                }`}
              ></div>
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  currentStep === 3
                    ? 'bg-[#1A1A1A] text-[#F9F8F6]'
                    : 'bg-[#EAE8E2] text-[#737067] border border-[#D4D0C5]'
                }`}
              >
                3
              </span>
            </div>
          </div>

          <div className="p-6">
            {createdSuccess ? (
              <div className="py-8 text-center bg-[#E2EFE7] rounded-lg border border-[#1B4D3E]/30 animate-in fade-in">
                <span className="material-symbols-outlined text-4xl text-[#1B4D3E] mb-2">
                  task_alt
                </span>
                <h4 className="font-serif text-lg font-bold text-[#1B4D3E]">
                  Block Schedule Request Approved & Synchronized
                </h4>
                <p className="text-xs text-[#525252] mt-1 max-w-md mx-auto">
                  Dispatched to Control Office Application (COA) & TMS track
                  register. Conflict score: 0%.
                </p>
              </div>
            ) : currentStep === 1 ? (
              /* Step 1: System Integrations & Corridor Selection */
              <div className="space-y-6">
                <div>
                  <h4 className="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-[0.2em] mb-3 font-mono">
                    SYSTEM INTEGRATIONS
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* TMS Integration */}
                    <label
                      className={`cursor-pointer relative flex items-center p-4 rounded-lg border transition-all ${
                        tmsChecked
                          ? 'border-[#1A1A1A] bg-[#FAF9F5] ring-1 ring-[#1A1A1A]'
                          : 'border-[#E5E2D9] bg-white hover:bg-[#FAF9F5]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={tmsChecked}
                        onChange={(e) => setTmsChecked(e.target.checked)}
                        className="w-4 h-4 text-[#1A1A1A] border-[#D4D0C5] rounded focus:ring-0 mr-3 cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-bold text-[#1A1A1A]">
                          TMS Data
                        </div>
                        <div className="text-[11px] text-[#737067]">
                          Track Management
                        </div>
                      </div>
                      {tmsChecked && (
                        <span className="material-symbols-outlined ml-auto text-[#1B4D3E] text-sm font-bold">
                          check_circle
                        </span>
                      )}
                    </label>

                    {/* SMMS Integration */}
                    <label
                      className={`cursor-pointer relative flex items-center p-4 rounded-lg border transition-all ${
                        smmsChecked
                          ? 'border-[#1A1A1A] bg-[#FAF9F5] ring-1 ring-[#1A1A1A]'
                          : 'border-[#E5E2D9] bg-white hover:bg-[#FAF9F5]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={smmsChecked}
                        onChange={(e) => setSmmsChecked(e.target.checked)}
                        className="w-4 h-4 text-[#1A1A1A] border-[#D4D0C5] rounded focus:ring-0 mr-3 cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-bold text-[#1A1A1A]">
                          SMMS Data
                        </div>
                        <div className="text-[11px] text-[#737067]">
                          Signal Maintenance
                        </div>
                      </div>
                      {smmsChecked && (
                        <span className="material-symbols-outlined ml-auto text-[#1B4D3E] text-sm font-bold">
                          check_circle
                        </span>
                      )}
                    </label>

                    {/* TDMS Integration */}
                    <label
                      className={`cursor-pointer relative flex items-center p-4 rounded-lg border transition-all ${
                        tdmsChecked
                          ? 'border-[#1A1A1A] bg-[#FAF9F5] ring-1 ring-[#1A1A1A]'
                          : 'border-[#E5E2D9] bg-white hover:bg-[#FAF9F5]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={tdmsChecked}
                        onChange={(e) => setTdmsChecked(e.target.checked)}
                        className="w-4 h-4 text-[#1A1A1A] border-[#D4D0C5] rounded focus:ring-0 mr-3 cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-bold text-[#1A1A1A]">
                          TDMS Data
                        </div>
                        <div className="text-[11px] text-[#737067]">
                          Traction Distribution
                        </div>
                      </div>
                      {tdmsChecked && (
                        <span className="material-symbols-outlined ml-auto text-[#1B4D3E] text-sm font-bold">
                          check_circle
                        </span>
                      )}
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#E5E2D9]">
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-2 uppercase tracking-wider">
                      Division
                    </label>
                    <select
                      value={division}
                      onChange={(e) => setDivision(e.target.value)}
                      className="w-full h-11 px-3.5 rounded bg-[#F4F3EF] border border-[#D4D0C5] text-xs font-medium text-[#1A1A1A] focus:border-[#1A1A1A] outline-none cursor-pointer"
                    >
                      <option>Northern Railway (Delhi)</option>
                      <option>Western Railway (Mumbai)</option>
                      <option>Eastern Railway (Kolkata)</option>
                      <option>Central Railway (Mumbai)</option>
                      <option>North Central Railway (Prayagraj)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-2 uppercase tracking-wider">
                      Section
                    </label>
                    <select
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="w-full h-11 px-3.5 rounded bg-[#F4F3EF] border border-[#D4D0C5] text-xs font-medium text-[#1A1A1A] focus:border-[#1A1A1A] outline-none cursor-pointer"
                    >
                      <option>NDLS - CNB (Main Line)</option>
                      <option>NDLS - UMB (Ambala Route)</option>
                      <option>CNB - PRYJ (Kanpur - Prayagraj)</option>
                      <option>BCT - ADI (Mumbai - Ahmedabad)</option>
                      <option>HWH - BWN (Howrah - Barddhaman)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-2 uppercase tracking-wider">
                    Block Duration Requirements (Hours)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={durationHours}
                      onChange={(e) =>
                        setDurationHours(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-24 h-11 px-3.5 rounded bg-[#F4F3EF] border border-[#D4D0C5] text-xs font-bold text-[#1A1A1A] focus:border-[#1A1A1A] outline-none"
                    />
                    <span className="text-xs text-[#737067] font-serif italic">
                      Expected possession window for engineering plant & tamping unit.
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E5E2D9] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#737067]">
                    Selected calendar date: <strong className="text-[#1A1A1A]">{formatDateLong(selectedDateIso)}</strong>
                  </span>
                  <button
                    onClick={handleStepSubmit}
                    className="flex items-center justify-center bg-[#1A1A1A] hover:bg-[#2B2B2B] text-[#F9F8F6] font-semibold text-xs uppercase tracking-[0.15em] h-11 px-6 rounded transition-all cursor-pointer shadow-xs"
                  >
                    Next Step
                    <span className="material-symbols-outlined ml-2 text-[18px]">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>
            ) : currentStep === 2 ? (
              /* Step 2: AI Traffic Conflict Simulation */
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-serif text-sm font-bold text-[#1A1A1A]">
                      Predictive Section Simulation ({section})
                    </h4>
                    <span className="text-[10px] bg-[#E2EFE7] text-[#1B4D3E] font-bold uppercase tracking-wider px-2.5 py-1 rounded border border-[#1B4D3E]/20">
                      AI Optimized
                    </span>
                  </div>
                  <p className="text-xs text-[#525252] mb-4 font-serif italic">
                    Simulation evaluated 18 train paths across the selected{' '}
                    {durationHours}-hour window on Northern Railway.
                  </p>

                  <div className="bg-[#FAF9F5] border border-[#E5E2D9] rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#1A1A1A]">
                      <span>Primary Disruption Potential:</span>
                      <span className="text-[#842029]">
                        2 Freight Slots + 1 Passenger Express
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded border border-[#E5E2D9] text-xs space-y-1.5">
                      <div className="flex justify-between font-medium">
                        <span className="text-[#1A1A1A]">
                          Train #12004 Swarna Shatabdi
                        </span>
                        <span className="text-[#8F4E00]">
                          Auto-divert to 3rd Up Loop (+4 mins)
                        </span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span className="text-[#1A1A1A]">Freight CONCOR #4481</span>
                        <span className="text-[#1B4D3E]">
                          Regulated at Aligarh Yard (0 impact)
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-[#FAF9F5] border border-[#D4AF37] rounded text-xs text-[#1A1A1A] font-medium flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-[#D4AF37]">
                        verified
                      </span>
                      Recommended Window: <strong>00:30 - 04:30 Hrs</strong> (Total
                      punctuality reliability: <strong>99.4%</strong>)
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-[#E5E2D9]">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex items-center justify-center bg-transparent text-[#737067] hover:text-[#1A1A1A] font-semibold text-xs uppercase tracking-wider h-11 px-4 rounded transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined mr-2 text-[18px]">
                      arrow_back
                    </span>
                    Back
                  </button>
                  <button
                    onClick={handleStepSubmit}
                    className="flex items-center justify-center bg-[#1A1A1A] text-[#F9F8F6] font-semibold text-xs uppercase tracking-[0.15em] h-11 px-6 rounded hover:bg-[#2B2B2B] transition-colors cursor-pointer"
                  >
                    Confirm Window & Review
                    <span className="material-symbols-outlined ml-2 text-[18px]">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* Step 3: Review & Final Dispatch */
              <div className="space-y-6">
                <div>
                  <h4 className="font-serif text-sm font-bold text-[#1A1A1A] mb-3">
                    Final Block Authorization Summary
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#FAF9F5] border border-[#E5E2D9] rounded-lg p-4 text-xs">
                    <div>
                      <span className="text-[#737067] block">Section:</span>
                      <strong className="text-xs text-[#1A1A1A] font-serif">
                        {section}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#737067] block">Date & Slot:</span>
                      <strong className="text-xs text-[#1A1A1A]">
                        {formatDateLong(selectedDateIso)} (00:30 - 04:30)
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#737067] block">
                        Duration & Maintenance Type:
                      </span>
                      <strong className="text-xs text-[#1A1A1A]">
                        {durationHours} Hours • {blockType}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#737067] block">
                        Synchronized Telemetry:
                      </span>
                      <strong className="text-xs text-[#1B4D3E]">
                        TMS (Track), SMMS (Signal), TDMS (Traction)
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-[#E5E2D9]">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="flex items-center justify-center bg-transparent text-[#737067] hover:text-[#1A1A1A] font-semibold text-xs uppercase tracking-wider h-11 px-4 rounded transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined mr-2 text-[18px]">
                      arrow_back
                    </span>
                    Back
                  </button>
                  <button
                    onClick={handleStepSubmit}
                    className="flex items-center justify-center bg-[#1A1A1A] text-[#F9F8F6] font-bold text-xs uppercase tracking-[0.15em] h-11 px-6 rounded hover:bg-[#2B2B2B] shadow-sm transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined mr-2 text-[18px] text-[#D4AF37]">
                      send
                    </span>
                    Approve & Dispatch Block
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Multi-Department Batch Requests: read differing department requests and create all their blocks simultaneously */}
        <BatchDepartmentRequests onCreateAll={onAddMultipleBlockPlans} />
      </div>

      {/* Right Column: Calendar & Schedule Overview */}
      <div className="xl:col-span-4 flex flex-col h-full gap-6">
        <TrainForecastPanel />

        <div className="bg-white rounded-xl border border-[#E5E2D9] shadow-[0px_2px_8px_rgba(0,0,0,0.02)] flex-1 flex flex-col overflow-hidden">
          {/* Calendar Header */}
          <div className="bg-[#1A1A1A] text-[#F9F8F6] px-6 py-4 flex justify-between items-center border-b border-[#1A1A1A]">
            <h3 className="font-serif text-base font-bold text-white tracking-wide">
              Block Calendar
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevMonth}
                className="p-1 hover:bg-white/20 text-white rounded transition-colors cursor-pointer"
                title="Previous Month"
              >
                <span className="material-symbols-outlined text-[18px]">
                  chevron_left
                </span>
              </button>
              <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37] self-center whitespace-nowrap">
                {MONTH_NAMES[viewMonth].slice(0, 3)} {viewYear}
              </span>
              <button
                onClick={goToNextMonth}
                className="p-1 hover:bg-white/20 text-white rounded transition-colors cursor-pointer"
                title="Next Month"
              >
                <span className="material-symbols-outlined text-[18px]">
                  chevron_right
                </span>
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-mono text-[#737067] uppercase flex-1">
                  {WEEKDAY_LABELS.map((w, i) => (
                    <div key={i}>{w}</div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
                {calendarCells.map((cell) => {
                  const status = getCellStatus(cell.iso);
                  const count = blocksByDate[cell.iso]?.length || 0;
                  const isSelected = cell.iso === selectedDateIso;
                  const isMuted = !cell.isCurrentMonth;

                  let cellClass = 'relative p-2 rounded cursor-pointer transition-colors ';
                  if (isMuted) {
                    cellClass += 'text-[#D4D0C5] hover:bg-[#FAF9F5] ';
                  } else if (status === 'error') {
                    cellClass += 'bg-[#F8D7DA] text-[#842029] font-bold hover:bg-[#f3c2c7] ';
                  } else if (status === 'warning') {
                    cellClass += 'bg-[#FFDCC2] text-[#8F4E00] font-bold hover:bg-[#ffcfa4] ';
                  } else if (status === 'success') {
                    cellClass += 'bg-[#E2EFE7] text-[#1B4D3E] font-bold hover:bg-[#cfe6da] ';
                  } else {
                    cellClass += 'text-[#1A1A1A] hover:bg-[#FAF9F5] ';
                  }
                  if (isSelected) {
                    cellClass += 'ring-2 ring-[#1A1A1A] ';
                  }

                  return (
                    <div
                      key={cell.iso}
                      onClick={() => setSelectedDateIso(cell.iso)}
                      className={cellClass}
                      title={
                        count > 0
                          ? `${count} block${count > 1 ? 's' : ''} on ${cell.iso}`
                          : cell.iso
                      }
                    >
                      {cell.day}
                      {count > 0 && (
                        <span
                          className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                            status === 'error'
                              ? 'bg-[#842029]'
                              : status === 'warning'
                              ? 'bg-[#8F4E00]'
                              : 'bg-[#1B4D3E]'
                          }`}
                        ></span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-2 px-0.5">
                <div className="flex items-center gap-3 text-[10px] font-mono text-[#737067]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#F8D7DA] border border-[#842029]/40 inline-block"></span>
                    Missed
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#FFDCC2] border border-[#8F4E00]/40 inline-block"></span>
                    Active/Sched.
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#E2EFE7] border border-[#1B4D3E]/40 inline-block"></span>
                    Completed
                  </span>
                </div>
                <button
                  onClick={goToToday}
                  className="text-[10px] font-mono font-bold text-[#1A1A1A] hover:text-[#D4AF37] cursor-pointer"
                >
                  Today
                </button>
              </div>
            </div>

            {/* Blocks on the selected date */}
            <div className="mt-4 pt-4 border-t border-[#E5E2D9] space-y-2.5 flex-1 flex flex-col min-h-0">
              <h4 className="font-serif text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                Blocks on {formatDateLong(selectedDateIso)}
              </h4>

              <div className="space-y-2 overflow-y-auto max-h-[240px] pr-1">
                {selectedDateBlocks.length === 0 ? (
                  <div className="py-6 text-center text-[#737067] text-xs font-serif italic bg-[#FAF9F5] rounded-lg border border-[#E5E2D9]">
                    No blocks scheduled on this date.
                  </div>
                ) : (
                  selectedDateBlocks.map((b) => {
                    const barColor =
                      b.status === 'Missed'
                        ? 'bg-[#842029]'
                        : b.status === 'Active' || b.status === 'Scheduled' || b.status === 'Pending Approval'
                        ? 'bg-[#8F4E00]'
                        : 'bg-[#1B4D3E]';
                    return (
                      <div
                        key={b.id}
                        className="flex items-center p-2.5 bg-[#FAF9F5] rounded-lg border border-[#E5E2D9] hover:border-[#1A1A1A] transition-colors"
                      >
                        <div className={`w-1.5 h-8 ${barColor} rounded-full mr-3 shrink-0`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-[#1A1A1A] truncate flex items-center gap-1.5">
                            {b.type} - {b.section}
                            {b.isCombined && (
                              <span className="text-[9px] font-mono font-bold uppercase text-[#8F4E00] bg-[#FBF7EC] border border-[#D4AF37]/50 px-1.5 py-0.5 rounded shrink-0">
                                combined ×{b.combinedDepartments?.length ?? b.subTasks?.length ?? 2}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#737067] font-mono flex items-center gap-1.5">
                            {b.startTime} - {b.endTime}
                            <span className="text-[10px] font-bold uppercase">• {b.status}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
