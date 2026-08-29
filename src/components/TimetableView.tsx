import React, { useMemo, useState } from 'react';
import { BlockPlan } from '../types';

interface TimetableViewProps {
  blockPlans: BlockPlan[];
}

type HorizonMode = 'weekly' | 'monthly';

const HOUR_HEIGHT = 48; // px per hour row
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const MONTH_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad = (n: number) => n.toString().padStart(2, '0');
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // roll back to Sunday
  return d;
}

interface MonthCell {
  iso: string;
  day: number;
  isCurrentMonth: boolean;
}

function buildMonthCells(year: number, month: number): MonthCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const cells: MonthCell[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayOffset = i - startOffset + 1;
    const date = new Date(year, month, dayOffset);
    cells.push({
      iso: toIso(date),
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
    });
  }
  return cells;
}

function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  return h * 60 + m;
}

function getStatusColors(status: BlockPlan['status']) {
  switch (status) {
    case 'Missed':
      return { bg: '#F8D7DA', border: '#842029', text: '#842029' };
    case 'Active':
      return { bg: '#FFDCC2', border: '#8F4E00', text: '#8F4E00' };
    case 'Scheduled':
    case 'Pending Approval':
      return { bg: '#EAE8E2', border: '#525252', text: '#1A1A1A' };
    case 'Completed':
    default:
      return { bg: '#E2EFE7', border: '#1B4D3E', text: '#1B4D3E' };
  }
}

export const TimetableView: React.FC<TimetableViewProps> = ({ blockPlans }) => {
  // Always default to the current real week (today's date), not a demo-data week.
  const [horizon, setHorizon] = useState<HorizonMode>('weekly');
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [monthCursor, setMonthCursor] = useState<Date>(() => new Date());
  const [selectedBlock, setSelectedBlock] = useState<BlockPlan | null>(null);
  const [selectedDayIso, setSelectedDayIso] = useState<string | null>(null);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const blocksByDate = useMemo(() => {
    const map: Record<string, BlockPlan[]> = {};
    blockPlans.forEach((b) => {
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    });
    return map;
  }, [blockPlans]);

  const todayIso = toIso(new Date());

  const goToPrevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };
  const goToNextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };
  const goToToday = () => {
    setWeekStart(getWeekStart(new Date()));
    setMonthCursor(new Date());
  };

  const weekRangeLabel = useMemo(() => {
    const end = weekDays[6];
    const start = weekDays[0];
    const sameMonth = start.getMonth() === end.getMonth();
    const startLabel = `${MONTH_SHORT[start.getMonth()]} ${start.getDate()}`;
    const endLabel = sameMonth
      ? `${end.getDate()}`
      : `${MONTH_SHORT[end.getMonth()]} ${end.getDate()}`;
    return `${startLabel} – ${endLabel}, ${end.getFullYear()}`;
  }, [weekDays]);

  // --- Monthly horizon (long-term maintenance planning) ---
  const monthCells = useMemo(
    () => buildMonthCells(monthCursor.getFullYear(), monthCursor.getMonth()),
    [monthCursor]
  );

  const goToPrevMonth = () => {
    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const goToNextMonth = () => {
    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthRangeLabel = `${MONTH_FULL[monthCursor.getMonth()]} ${monthCursor.getFullYear()}`;

  const monthSummary = useMemo(() => {
    const monthKey = `${monthCursor.getFullYear()}-${pad(monthCursor.getMonth() + 1)}`;
    const inMonth = blockPlans.filter((b) => b.date.startsWith(monthKey));
    return {
      total: inMonth.length,
      missed: inMonth.filter((b) => b.status === 'Missed').length,
      completed: inMonth.filter((b) => b.status === 'Completed').length,
      hours: inMonth.reduce((sum, b) => sum + b.durationHours, 0),
    };
  }, [blockPlans, monthCursor]);

  const selectedDayBlocks = selectedDayIso
    ? (blocksByDate[selectedDayIso] || []).slice().sort((a, b) => a.startTime.localeCompare(b.startTime))
    : [];

  return (
    <div className="max-w-[1280px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-[#737067] uppercase font-mono tracking-[0.2em] font-semibold block mb-1">
            {horizon === 'weekly' ? 'WEEKLY POSSESSION TIMETABLE' : 'MONTHLY MAINTENANCE HORIZON'}
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A] mb-1 tracking-tight">
            Timetable
          </h2>
          <p className="text-xs text-[#737067]">
            {horizon === 'weekly'
              ? 'Calendar-style view of every block window across the week, at a glance.'
              : 'Long-term maintenance horizon for planning and multi-department coordination across the month.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Weekly / Monthly toggle */}
          <div className="flex items-center bg-white border border-[#D4D0C5] rounded-lg shadow-2xs p-0.5">
            <button
              onClick={() => setHorizon('weekly')}
              className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                horizon === 'weekly' ? 'bg-[#1A1A1A] text-[#F9F8F6]' : 'text-[#737067] hover:bg-[#FAF9F5]'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setHorizon('monthly')}
              className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                horizon === 'monthly' ? 'bg-[#1A1A1A] text-[#F9F8F6]' : 'text-[#737067] hover:bg-[#FAF9F5]'
              }`}
            >
              Monthly
            </button>
          </div>

          {horizon === 'weekly' ? (
            <div className="flex items-center bg-white border border-[#D4D0C5] rounded-lg shadow-2xs">
              <button
                onClick={goToPrevWeek}
                className="p-2 hover:bg-[#FAF9F5] rounded-l-lg transition-colors cursor-pointer"
                title="Previous week"
              >
                <span className="material-symbols-outlined text-[18px] text-[#1A1A1A]">
                  chevron_left
                </span>
              </button>
              <span className="text-xs font-mono font-bold text-[#1A1A1A] px-2 whitespace-nowrap">
                {weekRangeLabel}
              </span>
              <button
                onClick={goToNextWeek}
                className="p-2 hover:bg-[#FAF9F5] rounded-r-lg transition-colors cursor-pointer"
                title="Next week"
              >
                <span className="material-symbols-outlined text-[18px] text-[#1A1A1A]">
                  chevron_right
                </span>
              </button>
            </div>
          ) : (
            <div className="flex items-center bg-white border border-[#D4D0C5] rounded-lg shadow-2xs">
              <button
                onClick={goToPrevMonth}
                className="p-2 hover:bg-[#FAF9F5] rounded-l-lg transition-colors cursor-pointer"
                title="Previous month"
              >
                <span className="material-symbols-outlined text-[18px] text-[#1A1A1A]">
                  chevron_left
                </span>
              </button>
              <span className="text-xs font-mono font-bold text-[#1A1A1A] px-2 whitespace-nowrap">
                {monthRangeLabel}
              </span>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-[#FAF9F5] rounded-r-lg transition-colors cursor-pointer"
                title="Next month"
              >
                <span className="material-symbols-outlined text-[18px] text-[#1A1A1A]">
                  chevron_right
                </span>
              </button>
            </div>
          )}

          <button
            onClick={goToToday}
            className="text-xs font-semibold px-3.5 py-2 rounded border border-[#D4D0C5] bg-white hover:bg-[#FAF9F5] transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>
      </div>

      {/* Monthly horizon summary strip */}
      {horizon === 'monthly' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg border border-[#E5E2D9] px-4 py-3">
            <div className="text-[10px] font-mono text-[#737067] uppercase tracking-wider">Total Blocks</div>
            <div className="text-lg font-bold text-[#1A1A1A]">{monthSummary.total}</div>
          </div>
          <div className="bg-white rounded-lg border border-[#E5E2D9] px-4 py-3">
            <div className="text-[10px] font-mono text-[#737067] uppercase tracking-wider">Missed / At Risk</div>
            <div className="text-lg font-bold text-[#842029]">{monthSummary.missed}</div>
          </div>
          <div className="bg-white rounded-lg border border-[#E5E2D9] px-4 py-3">
            <div className="text-[10px] font-mono text-[#737067] uppercase tracking-wider">Completed</div>
            <div className="text-lg font-bold text-[#1B4D3E]">{monthSummary.completed}</div>
          </div>
          <div className="bg-white rounded-lg border border-[#E5E2D9] px-4 py-3">
            <div className="text-[10px] font-mono text-[#737067] uppercase tracking-wider">Possession Hours</div>
            <div className="text-lg font-bold text-[#1A1A1A]">{monthSummary.hours}h</div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-[#737067]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#F8D7DA] border border-[#842029]/50 inline-block"></span>
          Missed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#FFDCC2] border border-[#8F4E00]/50 inline-block"></span>
          Active
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#EAE8E2] border border-[#525252]/50 inline-block"></span>
          Scheduled
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#E2EFE7] border border-[#1B4D3E]/50 inline-block"></span>
          Completed
        </span>
      </div>

      {/* Weekly Calendar Grid */}
      {horizon === 'weekly' && (
      <div className="bg-white rounded-xl border border-[#E5E2D9] shadow-[0px_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[880px]">
            {/* Day headers */}
            <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-[#E5E2D9] sticky top-0 bg-white z-10">
              <div className="border-r border-[#E5E2D9]"></div>
              {weekDays.map((d) => {
                const iso = toIso(d);
                const isToday = iso === todayIso;
                return (
                  <div
                    key={iso}
                    className={`text-center py-3 border-r border-[#E5E2D9] last:border-r-0 ${
                      isToday ? 'bg-[#FAF9F5]' : ''
                    }`}
                  >
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#737067]">
                      {DAY_LABELS[d.getDay()]}
                    </div>
                    <div
                      className={`text-sm font-bold mt-0.5 inline-flex items-center justify-center ${
                        isToday
                          ? 'w-7 h-7 rounded-full bg-[#1A1A1A] text-[#D4AF37]'
                          : 'text-[#1A1A1A]'
                      }`}
                    >
                      {d.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scrollable time grid */}
            <div className="max-h-[600px] overflow-y-auto">
              <div className="grid grid-cols-[64px_repeat(7,1fr)] relative">
                {/* Hour gutter */}
                <div className="border-r border-[#E5E2D9]">
                  {Array.from({ length: 24 }, (_, h) => (
                    <div
                      key={h}
                      style={{ height: HOUR_HEIGHT }}
                      className="text-[10px] font-mono text-[#737067] text-right pr-2 -translate-y-2 border-b border-[#F4F3EF]"
                    >
                      {pad(h)}:00
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {weekDays.map((d) => {
                  const iso = toIso(d);
                  const dayBlocks = blocksByDate[iso] || [];
                  const isToday = iso === todayIso;

                  return (
                    <div
                      key={iso}
                      className={`relative border-r border-[#E5E2D9] last:border-r-0 ${
                        isToday ? 'bg-[#FAF9F5]/50' : ''
                      }`}
                      style={{ height: HOUR_HEIGHT * 24 }}
                    >
                      {/* Hour gridlines */}
                      {Array.from({ length: 24 }, (_, h) => (
                        <div
                          key={h}
                          className="border-b border-[#F4F3EF]"
                          style={{ height: HOUR_HEIGHT }}
                        ></div>
                      ))}

                      {/* Event blocks */}
                      {dayBlocks.map((b) => {
                        const startMin = parseTimeToMinutes(b.startTime);
                        let durationMin = b.durationHours * 60;
                        let endMin = startMin + durationMin;
                        if (endMin > 24 * 60) endMin = 24 * 60; // clip at midnight for display
                        const top = (startMin / 60) * HOUR_HEIGHT;
                        const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 22);
                        const colors = getStatusColors(b.status);

                        return (
                          <button
                            key={b.id}
                            onClick={() => setSelectedBlock(b)}
                            style={{
                              top,
                              height,
                              backgroundColor: colors.bg,
                              borderLeft: `3px solid ${colors.border}`,
                              color: colors.text,
                            }}
                            className="absolute left-1 right-1 rounded px-1.5 py-1 text-left overflow-hidden hover:brightness-95 transition-all cursor-pointer shadow-2xs"
                            title={`${b.type} • ${b.startTime} - ${b.endTime}`}
                          >
                            <div className="text-[10px] font-bold leading-tight truncate flex items-center gap-1">
                              {b.isCombined && (
                                <span className="material-symbols-outlined text-[11px]" title="Combined multi-department block">
                                  merge_type
                                </span>
                              )}
                              {b.type}
                            </div>
                            <div className="text-[9px] font-mono leading-tight truncate opacity-90">
                              {b.startTime} - {b.endTime}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Monthly Horizon Grid */}
      {horizon === 'monthly' && (
        <div className="bg-white rounded-xl border border-[#E5E2D9] shadow-[0px_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-[#E5E2D9]">
            {DAY_LABELS.map((label) => (
              <div
                key={label}
                className="text-center py-2.5 text-[10px] font-mono uppercase tracking-wider text-[#737067] border-r border-[#E5E2D9] last:border-r-0"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-7">
            {monthCells.map((cell) => {
              const dayBlocks = (blocksByDate[cell.iso] || []).slice().sort((a, b) => a.startTime.localeCompare(b.startTime));
              const isToday = cell.iso === todayIso;
              const visibleBlocks = dayBlocks.slice(0, 3);
              const overflowCount = dayBlocks.length - visibleBlocks.length;

              return (
                <div
                  key={cell.iso}
                  onClick={() => dayBlocks.length > 0 && setSelectedDayIso(cell.iso)}
                  className={`min-h-[110px] border-r border-b border-[#E5E2D9] last:border-r-0 p-1.5 ${
                    !cell.isCurrentMonth ? 'bg-[#FAF9F5]/60' : 'bg-white'
                  } ${dayBlocks.length > 0 ? 'cursor-pointer hover:bg-[#FAF9F5]' : ''} transition-colors`}
                >
                  <div
                    className={`text-[11px] font-mono font-bold mb-1 inline-flex items-center justify-center ${
                      isToday
                        ? 'w-5 h-5 rounded-full bg-[#1A1A1A] text-[#D4AF37]'
                        : !cell.isCurrentMonth
                        ? 'text-[#D4D0C5]'
                        : 'text-[#1A1A1A]'
                    }`}
                  >
                    {cell.day}
                  </div>
                  <div className="space-y-1">
                    {visibleBlocks.map((b) => {
                      const colors = getStatusColors(b.status);
                      return (
                        <button
                          key={b.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBlock(b);
                          }}
                          style={{
                            backgroundColor: colors.bg,
                            borderLeft: `2px solid ${colors.border}`,
                            color: colors.text,
                          }}
                          className="w-full text-left px-1 py-0.5 rounded-sm text-[9px] font-semibold truncate hover:brightness-95 transition-all cursor-pointer"
                          title={`${b.type} • ${b.startTime}`}
                        >
                          {b.type}
                        </button>
                      );
                    })}
                    {overflowCount > 0 && (
                      <div className="text-[9px] font-mono text-[#737067] px-1">
                        +{overflowCount} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day Agenda Popover (Monthly view — clicking a day with multiple blocks) */}
      {selectedDayIso && (
        <div
          className="fixed inset-0 bg-[#1A1A1A]/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedDayIso(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-md w-full rounded-xl p-6 shadow-2xl space-y-3 border border-[#E5E2D9] max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start pb-3 border-b border-[#E5E2D9]">
              <div>
                <span className="text-[10px] text-[#737067] uppercase font-mono tracking-widest block mb-0.5">
                  Day Agenda
                </span>
                <h3 className="font-bold text-lg text-[#1A1A1A]">
                  {(() => {
                    const [y, m, d] = selectedDayIso.split('-').map(Number);
                    return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    });
                  })()}
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#EAE8E2] text-[#1A1A1A] shrink-0">
                {selectedDayBlocks.length} Block{selectedDayBlocks.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              {selectedDayBlocks.map((b) => {
                const colors = getStatusColors(b.status);
                return (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSelectedDayIso(null);
                      setSelectedBlock(b);
                    }}
                    className="w-full flex items-center p-2.5 bg-[#FAF9F5] rounded-lg border border-[#E5E2D9] hover:border-[#1A1A1A] transition-colors text-left cursor-pointer"
                  >
                    <div
                      style={{ backgroundColor: colors.border }}
                      className="w-1.5 h-8 rounded-full mr-3 shrink-0"
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#1A1A1A] truncate">
                        {b.type} - {b.section}
                      </div>
                      <div className="text-[11px] text-[#737067] font-mono">
                        {b.startTime} - {b.endTime} • {b.status}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="pt-2 flex justify-end border-t border-[#E5E2D9]">
              <button
                onClick={() => setSelectedDayIso(null)}
                className="px-4 py-2 text-xs font-semibold bg-[#1A1A1A] text-[#F9F8F6] uppercase tracking-wider rounded hover:bg-[#2B2B2B] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Detail Popover */}
      {selectedBlock && (
        <div
          className="fixed inset-0 bg-[#1A1A1A]/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedBlock(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-md w-full rounded-xl p-6 shadow-2xl space-y-4 border border-[#E5E2D9]"
          >
            <div className="flex justify-between items-start pb-3 border-b border-[#E5E2D9]">
              <div>
                <span className="text-[10px] text-[#737067] uppercase font-mono tracking-widest block mb-0.5">
                  {selectedBlock.id}
                </span>
                <h3 className="font-bold text-lg text-[#1A1A1A] flex items-center gap-1.5">
                  {selectedBlock.isCombined && (
                    <span className="material-symbols-outlined text-[18px] text-[#D4AF37]" title="Combined possession">
                      merge_type
                    </span>
                  )}
                  {selectedBlock.type}
                </h3>
                <p className="text-xs text-[#737067]">
                  {selectedBlock.section} •{' '}
                  {selectedBlock.isCombined && selectedBlock.combinedDepartments
                    ? selectedBlock.combinedDepartments.join(' + ')
                    : selectedBlock.department}
                </p>
              </div>
              <span
                style={{
                  backgroundColor: getStatusColors(selectedBlock.status).bg,
                  color: getStatusColors(selectedBlock.status).text,
                }}
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0"
              >
                {selectedBlock.status}
              </span>
            </div>

            <p className="text-xs text-[#525252] leading-relaxed">
              {selectedBlock.description}
            </p>

            {selectedBlock.isCombined && selectedBlock.subTasks && selectedBlock.subTasks.length > 0 && (
              <div className="p-3 bg-[#FBF7EC] border border-[#D4AF37]/40 rounded-lg space-y-1.5">
                <span className="text-[10px] font-mono text-[#8F4E00] block uppercase font-bold">
                  Combined Possession — {selectedBlock.subTasks.length} Department Work Items
                </span>
                {selectedBlock.subTasks.map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] bg-white rounded px-2 py-1.5 border border-[#E5E2D9]">
                    <span className="font-semibold text-[#1A1A1A]">{t.department} — {t.type}</span>
                    <span className="font-mono text-[#737067]">{t.durationHours}h</span>
                  </div>
                ))}
                <p className="text-[10px] text-[#737067] pt-1">
                  All items proceed concurrently within this single possession window.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#FAF9F5] rounded border border-[#E5E2D9]">
                <span className="text-[10px] font-mono text-[#737067] block uppercase">
                  Date & Slot
                </span>
                <span className="font-semibold text-[#1A1A1A]">
                  {selectedBlock.date}
                </span>
                <br />
                <span className="font-mono text-[11px] text-[#1A1A1A]">
                  {selectedBlock.startTime} - {selectedBlock.endTime}
                </span>
              </div>
              <div className="p-3 bg-[#FAF9F5] rounded border border-[#E5E2D9]">
                <span className="text-[10px] font-mono text-[#737067] block uppercase">
                  Duration
                </span>
                <span className="font-bold text-[#1A1A1A]">
                  {selectedBlock.durationHours} Hours
                </span>
              </div>
              {selectedBlock.location && (
                <div className="p-3 bg-[#FAF9F5] rounded border border-[#E5E2D9] col-span-2">
                  <span className="text-[10px] font-mono text-[#737067] block uppercase">
                    Location
                  </span>
                  <span className="font-medium text-[#1A1A1A]">
                    {selectedBlock.location}
                  </span>
                </div>
              )}
              {selectedBlock.approvedBy && (
                <div className="p-3 bg-[#FAF9F5] rounded border border-[#E5E2D9] col-span-2">
                  <span className="text-[10px] font-mono text-[#737067] block uppercase">
                    Approved By
                  </span>
                  <span className="font-medium text-[#1A1A1A]">
                    {selectedBlock.approvedBy}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end border-t border-[#E5E2D9]">
              <button
                onClick={() => setSelectedBlock(null)}
                className="px-4 py-2 text-xs font-semibold bg-[#1A1A1A] text-[#F9F8F6] uppercase tracking-wider rounded hover:bg-[#2B2B2B] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
