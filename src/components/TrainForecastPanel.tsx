import React, { useState } from 'react';
import { CORRIDORS_LIST, TRAIN_TIMETABLE, GOODS_FORECAST } from '../data/mockData';

export const TrainForecastPanel: React.FC = () => {
  const [corridorId, setCorridorId] = useState('NDLS-CNB');

  const corridor = CORRIDORS_LIST.find((c) => c.id === corridorId) || CORRIDORS_LIST[0];
  const forecast = GOODS_FORECAST.find((g) => g.corridorId === corridorId) || GOODS_FORECAST[0];
  const sectionTrains = TRAIN_TIMETABLE.filter((t) => t.section === corridor.section.split(' (')[0]);

  return (
    <div className="bg-white rounded-xl border border-[#E5E2D9] shadow-[0px_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
      <div className="bg-[#1A1A1A] text-[#F9F8F6] px-5 py-3.5 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-[#D4AF37] font-semibold block mb-0.5">
            Control Office Feed
          </span>
          <h3 className="font-serif text-sm font-bold text-white">
            Train Timetable & Goods Forecast
          </h3>
        </div>
        <select
          value={corridorId}
          onChange={(e) => setCorridorId(e.target.value)}
          className="bg-white/10 border border-white/20 text-white text-[11px] rounded px-2 py-1.5 focus:outline-none cursor-pointer"
        >
          {CORRIDORS_LIST.map((c) => (
            <option key={c.id} value={c.id} className="text-[#1A1A1A]">
              {c.id}
            </option>
          ))}
        </select>
      </div>

      <div className="p-4 space-y-4">
        {/* Goods forecast */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#737067]">
              Goods Rake Forecast — {forecast.date}
            </span>
            <span className="text-[10px] font-mono font-bold text-[#1B4D3E]">
              {forecast.confidencePercent}% confidence
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-[#FAF9F5] rounded-lg border border-[#E5E2D9] py-2">
              <div className="text-lg font-bold text-[#1A1A1A]">{forecast.forecastRakes}</div>
              <div className="text-[9px] font-mono text-[#737067] uppercase">Forecast Rakes</div>
            </div>
            <div className="bg-[#F8D7DA] rounded-lg border border-[#842029]/30 py-2">
              <div className="text-[11px] font-bold text-[#842029]">{forecast.peakWindow}</div>
              <div className="text-[9px] font-mono text-[#842029] uppercase">Peak Window</div>
            </div>
            <div className="bg-[#E2EFE7] rounded-lg border border-[#1B4D3E]/30 py-2">
              <div className="text-[11px] font-bold text-[#1B4D3E]">{forecast.lowDensityWindow}</div>
              <div className="text-[9px] font-mono text-[#1B4D3E] uppercase">Low-Density Window</div>
            </div>
          </div>
        </div>

        {/* Passenger timetable */}
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#737067] block mb-2">
            Scheduled Passenger Paths — {corridor.section}
          </span>
          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
            {sectionTrains.length === 0 ? (
              <div className="text-[11px] text-[#737067] italic font-serif">No scheduled passenger paths on file for this section.</div>
            ) : (
              sectionTrains.map((t) => (
                <div
                  key={t.trainNumber}
                  className="flex items-center justify-between text-[11px] px-2.5 py-1.5 bg-[#FAF9F5] rounded border border-[#E5E2D9]"
                >
                  <span className="font-mono font-bold text-[#1A1A1A]">{t.trainNumber}</span>
                  <span className="text-[#525252] truncate flex-1 px-2 truncate">{t.name}</span>
                  <span className="font-mono text-[#737067]">{t.departure}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <p className="text-[10px] text-[#737067] leading-relaxed border-t border-[#E5E2D9] pt-2.5">
          Recommended block windows are cross-checked against this feed so a
          possession never overlaps a scheduled passenger path or a
          high-density freight window.
        </p>
      </div>
    </div>
  );
};
