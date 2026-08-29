import React, { useState } from 'react';

export const ReportsView: React.FC = () => {
  const [selectedQuarter, setSelectedQuarter] = useState('Q2 (Jul-Sep 2026)');

  const performanceMetrics = [
    { title: 'Block Utilization Index', value: '92.4%', change: '+3.8%', status: 'positive' },
    { title: 'Corridor Clearance Delay', value: '4.2 mins', change: '-18%', status: 'positive' },
    { title: 'Preventive Defect Resolution', value: '88.6%', change: '+5.1%', status: 'positive' },
    { title: 'Punctuality Impact Avoidance', value: '99.1%', change: '+1.2%', status: 'positive' },
  ];

  const departmentBreakdown = [
    { dept: 'Track Maintenance (Civil)', blocks: 58, hours: 232, punctualityLossMin: '1.2m' },
    { dept: 'Traction Distribution (Electrical)', blocks: 44, hours: 140, punctualityLossMin: '0.8m' },
    { dept: 'Signal & Telecommunication (S&T)', blocks: 28, hours: 96, punctualityLossMin: '0.4m' },
    { dept: 'Bridge & Structures', blocks: 12, hours: 64, punctualityLossMin: '1.5m' },
  ];

  return (
    <div className="max-w-[1280px] mx-auto space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="text-[10px] text-[#737067] uppercase font-mono tracking-[0.2em] font-semibold block mb-1">
            EXECUTIVE AUDIT & ANALYTICS
          </span>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
            Performance & Block Analytics Reports
          </h2>
          <p className="text-xs text-[#737067] font-serif italic">
            Corridor possession effectiveness, engineering compliance, and train punctuality impact monitoring.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="p-2.5 bg-[#F4F3EF] border border-[#D4D0C5] rounded text-xs font-medium text-[#1A1A1A] focus:border-[#1A1A1A] outline-none cursor-pointer"
          >
            <option>Q2 (Jul-Sep 2026)</option>
            <option>Q1 (Apr-Jun 2026)</option>
            <option>Q4 (Jan-Mar 2026)</option>
          </select>
          <button
            onClick={() => alert('Exporting full analytics workbook...')}
            className="px-4 py-2.5 bg-[#1A1A1A] text-[#F9F8F6] text-xs font-semibold uppercase tracking-[0.1em] rounded hover:bg-[#2B2B2B] transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            Export Dossier
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((m, idx) => (
          <div key={idx} className="bg-white border border-[#E5E2D9] rounded-xl p-5 shadow-[0px_2px_8px_rgba(0,0,0,0.02)]">
            <p className="text-[11px] text-[#737067] font-mono uppercase tracking-wider mb-1">{m.title}</p>
            <h3 className="font-serif text-2xl md:text-3xl font-bold text-[#1A1A1A] my-1 tracking-tight">{m.value}</h3>
            <span className="text-[10px] text-[#1B4D3E] font-bold font-mono bg-[#E2EFE7] px-2 py-0.5 rounded border border-[#1B4D3E]/20 inline-block mt-1">
              {m.change} vs baseline
            </span>
          </div>
        ))}
      </div>

      {/* Department Breakdown Table */}
      <div className="bg-white border border-[#E5E2D9] rounded-xl overflow-hidden shadow-[0px_2px_8px_rgba(0,0,0,0.02)]">
        <div className="p-4 border-b border-[#E5E2D9] bg-[#FAF9F5] flex justify-between items-center">
          <h3 className="font-serif text-sm md:text-base font-bold text-[#1A1A1A]">
            Departmental Block Execution & Train Impact
          </h3>
          <span className="text-[11px] font-mono text-[#737067] uppercase">Source: COA / FOIS Integrated Stream</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F5] text-[11px] uppercase font-mono font-bold text-[#1A1A1A] border-b border-[#E5E2D9]">
              <tr>
                <th className="p-4">Department</th>
                <th className="p-4">Total Blocks Granted</th>
                <th className="p-4">Total Possession Hours</th>
                <th className="p-4">Avg Punctuality Loss / Train</th>
                <th className="p-4 text-right">Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E2D9]">
              {departmentBreakdown.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#FAF9F5] transition-colors">
                  <td className="p-4 font-serif font-bold text-[#1A1A1A] text-sm">{row.dept}</td>
                  <td className="p-4 text-[#1A1A1A] font-mono font-semibold">{row.blocks}</td>
                  <td className="p-4 text-[#737067] font-mono">{row.hours} hrs</td>
                  <td className="p-4 text-[#1A1A1A] font-mono font-medium">{row.punctualityLossMin}</td>
                  <td className="p-4 text-right">
                    <span className="inline-flex px-2 py-0.5 bg-[#E2EFE7] text-[#1B4D3E] text-[11px] font-bold rounded font-mono border border-[#1B4D3E]/20">
                      98.4%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

