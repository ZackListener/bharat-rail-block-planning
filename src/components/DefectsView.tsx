import React, { useState } from 'react';
import { Defect, BlockPlan } from '../types';

interface DefectsViewProps {
  defects: Defect[];
  blockPlans: BlockPlan[];
  onUpdateDefect: (updatedDefect: Defect) => void;
  onOpenNewBlockModal: () => void;
}

export const DefectsView: React.FC<DefectsViewProps> = ({
  defects,
  blockPlans,
  onUpdateDefect,
  onOpenNewBlockModal,
}) => {
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [selectedDefectForLink, setSelectedDefectForLink] = useState<Defect | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Filter defects
  const filteredDefects = defects.filter((d) => {
    if (
      departmentFilter !== 'All Departments' &&
      !d.department.toLowerCase().includes(departmentFilter.toLowerCase().replace(' maintenance', ''))
    ) {
      return false;
    }
    if (
      statusFilter !== 'All Statuses' &&
      d.status.toLowerCase() !== statusFilter.toLowerCase()
    ) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status: Defect['status']) => {
    switch (status) {
      case 'Urgent':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F8D7DA] text-[#842029] border border-[#842029]/20">
            Urgent
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FFDCC2] text-[#8F4E00] border border-[#8F4E00]/20">
            Overdue
          </span>
        );
      case 'Routine':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FAF9F5] text-[#737067] border border-[#E5E2D9]">
            Routine
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E2EFE7] text-[#1B4D3E] border border-[#1B4D3E]/20">
            Resolved
          </span>
        );
    }
  };

  const handleExportCSV = () => {
    const csvRows = [
      'Defect ID,Description,Department,Reported Date,Status,Location,Linked Block ID',
      ...defects.map(
        (d) =>
          `"${d.id}","${d.description}","${d.department}","${d.reportedDate}","${d.status}","${d.location}","${d.linkedBlockId || 'None'}"`
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `centralized-defects-register-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showFeedback('Exported CSV Defect Register.');
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Centralized Defect Register - Indian Railways</title>
            <style>
              body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px; color: #1A1A1A; background: #F9F8F6; }
              h1 { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; color: #1A1A1A; margin-bottom: 4px; font-size: 24px; }
              p { font-family: 'Inter', sans-serif; font-size: 12px; color: #737067; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; font-family: 'Inter', sans-serif; }
              th, td { border: 1px solid #E5E2D9; padding: 10px 14px; text-align: left; }
              th { background: #FAF9F5; font-weight: bold; color: #1A1A1A; text-transform: uppercase; font-size: 10px; letter-spacing: 0.1em; }
            </style>
          </head>
          <body>
            <h1>Ministry of Railways - Centralized Defect Register</h1>
            <p>Official Inspection Dossier • Generated on ${new Date().toLocaleString()}</p>
            <table>
              <thead>
                <tr>
                  <th>Defect ID</th>
                  <th>Description</th>
                  <th>Department</th>
                  <th>Reported Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${defects
                  .map(
                    (d) => `
                  <tr>
                    <td><strong>${d.id}</strong></td>
                    <td>${d.description}</td>
                    <td>${d.department}</td>
                    <td>${d.reportedDate}</td>
                    <td>${d.status}</td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
    showFeedback('Initiated PDF dossier print.');
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleLinkBlock = (blockId: string) => {
    if (!selectedDefectForLink) return;
    const updated = {
      ...selectedDefectForLink,
      linkedBlockId: blockId,
    };
    onUpdateDefect(updated);
    setSelectedDefectForLink(null);
    showFeedback(`Linked ${selectedDefectForLink.id} with Block ${blockId}`);
  };

  return (
    <div className="max-w-[1280px] mx-auto space-y-6">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="bg-[#1A1A1A] text-[#F9F8F6] px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between shadow-lg border border-[#D4AF37] animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#D4AF37] text-[16px]">info</span>
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="ml-4 text-xs text-[#D4D0C5] hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header section with subtitle */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] text-[#737067] uppercase font-mono tracking-[0.2em] font-semibold block mb-1">
            DEFECT SURVEILLANCE & RECTIFICATION
          </span>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-[#1A1A1A] mb-1 tracking-tight">
            Centralized Defects Register
          </h2>
          <p className="text-xs text-[#737067] font-serif italic">
            Track, prioritize, and bind pending track geometry, signal, and traction defects into scheduled block windows.
          </p>
        </div>
      </div>

      {/* Actions & Filters Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-[#E5E2D9] shadow-[0px_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex flex-wrap gap-2.5 items-center">
          <button
            id="defects-filter-btn"
            onClick={() => {
              setDepartmentFilter('All Departments');
              setStatusFilter('All Statuses');
            }}
            className="px-3.5 py-2 rounded border border-[#1A1A1A] text-[#1A1A1A] font-semibold text-xs hover:bg-[#FAF9F5] transition-colors flex items-center gap-2 min-h-[40px] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">
              restart_alt
            </span>
            Reset
          </button>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3.5 py-2 rounded border border-[#D4D0C5] bg-[#F4F3EF] text-xs text-[#1A1A1A] focus:border-[#1A1A1A] outline-none min-h-[40px] cursor-pointer font-medium"
          >
            <option>All Departments</option>
            <option>Track Maintenance</option>
            <option>Signaling</option>
            <option>Civil Engineering</option>
            <option>Electrical</option>
            <option>Rolling Stock</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded border border-[#D4D0C5] bg-[#F4F3EF] text-xs text-[#1A1A1A] focus:border-[#1A1A1A] outline-none min-h-[40px] cursor-pointer font-medium"
          >
            <option>All Statuses</option>
            <option>Urgent</option>
            <option>Routine</option>
            <option>Overdue</option>
          </select>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            id="export-pdf-btn"
            onClick={handleExportPDF}
            className="px-4 py-2 rounded border border-[#D4D0C5] bg-white text-[#1A1A1A] hover:bg-[#FAF9F5] font-semibold text-xs transition-colors flex items-center gap-1.5 min-h-[40px] flex-1 md:flex-initial justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            Print PDF
          </button>

          <button
            id="export-csv-btn"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded bg-[#1A1A1A] text-[#F9F8F6] hover:bg-[#2B2B2B] font-semibold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 min-h-[40px] flex-1 md:flex-initial justify-center cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">table_view</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Defects Data Table */}
      <div className="bg-white border border-[#E5E2D9] rounded-xl overflow-hidden shadow-[0px_2px_8px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#FAF9F5] border-b border-[#E5E2D9]">
              <tr>
                <th className="px-5 py-3.5 text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider font-mono">
                  Defect ID
                </th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider font-mono">
                  Description
                </th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider font-mono">
                  Department
                </th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider font-mono">
                  Reported Date
                </th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider font-mono">
                  Status
                </th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider text-right font-mono">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="text-xs">
              {filteredDefects.slice(0, 4).map((defect, idx) => (
                <tr
                  key={defect.id}
                  className={`border-b border-[#E5E2D9] transition-colors hover:bg-[#FAF9F5] ${
                    idx % 2 === 1 ? 'bg-[#FCFBF8]' : 'bg-white'
                  }`}
                >
                  <td className="px-5 py-3.5 font-mono font-bold text-[#1A1A1A] whitespace-nowrap">
                    {defect.id}
                  </td>
                  <td className="px-5 py-3.5 text-[#1A1A1A] font-medium">
                    {defect.description}
                    {defect.linkedBlockId && (
                      <span className="block text-[11px] font-mono text-[#1B4D3E] font-semibold mt-0.5">
                        Linked: {defect.linkedBlockId}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-[#737067] whitespace-nowrap">
                    {defect.department}
                  </td>
                  <td className="px-5 py-3.5 text-[#737067] font-mono whitespace-nowrap">
                    {defect.reportedDate}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {getStatusBadge(defect.status)}
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <button
                      id={`link-block-btn-${defect.id.replace('#', '')}`}
                      onClick={() => setSelectedDefectForLink(defect)}
                      className="text-[#1A1A1A] hover:underline font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                    >
                      {defect.linkedBlockId ? 'Edit Block' : 'Link Block'}
                      <span className="material-symbols-outlined text-[14px]">
                        link
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="p-3.5 border-t border-[#E5E2D9] flex justify-between items-center bg-[#FAF9F5]">
          <span className="text-xs font-mono text-[#737067]">
            Showing 1 to 4 of 128 defects
          </span>
          <div className="flex gap-1.5">
            <button
              disabled
              className="p-1 rounded border border-[#D4D0C5] bg-white text-[#737067] disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[16px]">
                chevron_left
              </span>
            </button>
            <button className="p-1 rounded border border-[#D4D0C5] text-[#1A1A1A] bg-white hover:bg-[#FAF9F5] cursor-pointer">
              <span className="material-symbols-outlined text-[16px]">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Link Block Modal / Drawer */}
      {selectedDefectForLink && (
        <div className="fixed inset-0 bg-[#1A1A1A]/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-xl p-6 shadow-2xl space-y-4 border border-[#E5E2D9] animate-in fade-in">
            <div className="flex justify-between items-start pb-3 border-b border-[#E5E2D9]">
              <div>
                <span className="text-[10px] text-[#737067] uppercase font-mono tracking-widest block mb-0.5">
                  BLOCK BINDING
                </span>
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                  Link Maintenance Block to Defect
                </h3>
                <p className="text-xs text-[#737067] font-serif italic">
                  Defect: {selectedDefectForLink.id} ({selectedDefectForLink.description})
                </p>
              </div>
              <button
                onClick={() => setSelectedDefectForLink(null)}
                className="text-[#737067] hover:text-[#1A1A1A] cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#525252]">
              Select an existing active/scheduled possession window or provision an AI-optimized slot.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {blockPlans.map((bp) => (
                <div
                  key={bp.id}
                  onClick={() => handleLinkBlock(bp.id)}
                  className="p-3 border border-[#E5E2D9] rounded-lg hover:border-[#1A1A1A] bg-[#FAF9F5] hover:bg-white cursor-pointer transition-colors flex justify-between items-center text-xs"
                >
                  <div>
                    <div className="font-bold text-[#1A1A1A] font-mono">{bp.id} • {bp.section}</div>
                    <div className="text-[#737067] font-serif italic">{bp.type} ({bp.date}, {bp.startTime} - {bp.endTime})</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-[#EAE8E2] text-[#1A1A1A] rounded font-mono">
                    {bp.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#E5E2D9] flex justify-between items-center">
              <button
                onClick={() => {
                  setSelectedDefectForLink(null);
                  onOpenNewBlockModal();
                }}
                className="text-xs text-[#1A1A1A] font-bold hover:underline inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px] text-[#D4AF37]">add_circle</span>
                Create New AI Block Plan
              </button>
              <button
                onClick={() => setSelectedDefectForLink(null)}
                className="px-4 py-2 text-xs font-semibold bg-[#F4F3EF] text-[#737067] hover:text-[#1A1A1A] rounded cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

