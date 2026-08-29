import React, { useState } from 'react';
import { BlockPlan, DepartmentType } from '../types';
import { addHoursToTime, getAutoScheduledDate } from '../utils/time';

interface NewBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBlock: (block: BlockPlan) => void;
}

// Standard low-traffic possession window used across the system (00:30 Hrs)
const DEFAULT_START_TIME = '00:30';

export const NewBlockModal: React.FC<NewBlockModalProps> = ({
  isOpen,
  onClose,
  onAddBlock,
}) => {
  const [division, setDivision] = useState('Northern Railway (Delhi)');
  const [section, setSection] = useState('NDLS - CNB (Main Line)');
  const [department, setDepartment] = useState<DepartmentType>('Civil');
  const [type, setType] = useState('Track Renewal');
  const [durationHours, setDurationHours] = useState(4);
  const [description, setDescription] = useState('Deep screening and track tamping on Down Main line');
  const [tms, setTms] = useState(true);
  const [smms, setSmms] = useState(true);
  const [tdms, setTdms] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `#MB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}${String.fromCharCode(
      65 + Math.floor(Math.random() * 26)
    )}`;

    const newBlock: BlockPlan = {
      id: newId,
      corridorName: section,
      division: division,
      section: section,
      description: description,
      date: getAutoScheduledDate(),
      startTime: `${DEFAULT_START_TIME} Hrs`,
      endTime: `${addHoursToTime(DEFAULT_START_TIME, durationHours)} Hrs`,
      durationHours: durationHours,
      status: 'Scheduled',
      type: type,
      department: department,
      progressPercent: 0,
      systemIntegrations: { tms, smms, tdms },
      approvedBy: 'Sr. Divisional Operations Manager (DOM)',
    };

    onAddBlock(newBlock);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1A1A]/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-2xl w-full rounded-xl p-6 shadow-2xl space-y-5 border border-[#E5E2D9] animate-in fade-in max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-start pb-3 border-b border-[#E5E2D9]">
          <div>
            <span className="text-[10px] text-[#737067] uppercase font-mono tracking-[0.2em] font-semibold block mb-0.5">
              CORRIDOR POSSESSION DISPATCH
            </span>
            <h3 className="text-xl font-bold text-[#1A1A1A]">
              Create New Engineering Block Plan
            </h3>
            <p className="text-xs text-[#737067] italic mt-0.5">
              Schedule corridor possession for track, traction, or signaling maintenance
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#737067] hover:text-[#1A1A1A] p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#1A1A1A] mb-1 font-mono uppercase text-[11px]">
                Railway Division
              </label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full p-2.5 bg-[#F4F3EF] border border-[#D4D0C5] rounded text-xs text-[#1A1A1A] focus:border-[#1A1A1A] outline-none font-medium"
              >
                <option>Northern Railway (Delhi)</option>
                <option>Western Railway (Mumbai)</option>
                <option>Eastern Railway (Kolkata)</option>
                <option>Central Railway (Mumbai)</option>
                <option>Southern Railway (Chennai)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#1A1A1A] mb-1 font-mono uppercase text-[11px]">
                Corridor Section
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full p-2.5 bg-[#F4F3EF] border border-[#D4D0C5] rounded text-xs text-[#1A1A1A] focus:border-[#1A1A1A] outline-none font-medium"
              >
                <option>NDLS - CNB (Main Line)</option>
                <option>NDLS - UMB (Ambala Route)</option>
                <option>CNB - PRYJ (Kanpur - Prayagraj)</option>
                <option>BCT - ADI (Mumbai - Ahmedabad)</option>
                <option>HWH - BWN (Howrah - Barddhaman)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#1A1A1A] mb-1 font-mono uppercase text-[11px]">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as DepartmentType)}
                className="w-full p-2.5 bg-[#F4F3EF] border border-[#D4D0C5] rounded text-xs text-[#1A1A1A] focus:border-[#1A1A1A] outline-none font-medium"
              >
                <option value="Civil">Civil (Engineering)</option>
                <option value="Electrical">Electrical (Traction/OHE)</option>
                <option value="S&T">Signal & Telecom (S&T)</option>
                <option value="Track Maintenance">Track Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#1A1A1A] mb-1 font-mono uppercase text-[11px]">
                Maintenance Activity Type
              </label>
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full p-2.5 bg-[#F4F3EF] border border-[#D4D0C5] rounded text-xs text-[#1A1A1A] focus:border-[#1A1A1A] outline-none"
                placeholder="e.g. OHE renewal, Bridge inspection"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-[#1A1A1A] mb-1 font-mono uppercase text-[11px]">
                Block Duration (Hours)
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={durationHours}
                onChange={(e) => setDurationHours(parseInt(e.target.value) || 1)}
                className="w-full p-2.5 bg-[#F4F3EF] border border-[#D4D0C5] rounded text-xs font-mono text-[#1A1A1A] focus:border-[#1A1A1A] outline-none"
                placeholder="Hrs"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-[#1A1A1A] mb-1 font-mono uppercase text-[11px]">
                Possession Window
              </label>
              <div className="w-full p-2.5 bg-[#FAF9F5] border border-[#D4D0C5] rounded text-[11px] text-[#525252] flex items-center gap-1.5 h-[38px]">
                <span className="material-symbols-outlined text-[15px] text-[#D4AF37]">
                  auto_awesome
                </span>
                <span className="italic">
                  Auto-assigned by AI to the next low-traffic slot
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#1A1A1A] mb-1 font-mono uppercase text-[11px]">
              Work Description / Scope
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-[#F4F3EF] border border-[#D4D0C5] rounded text-xs text-[#1A1A1A] focus:border-[#1A1A1A] outline-none"
              placeholder="Provide exact chainage and equipment details..."
              required
            />
          </div>

          <div className="p-3.5 bg-[#FAF9F5] border border-[#E5E2D9] rounded-lg space-y-2">
            <span className="font-bold text-[#1A1A1A] block font-mono text-[11px] uppercase tracking-wider">
              Automated System Synchronization
            </span>
            <div className="flex flex-wrap gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tms}
                  onChange={(e) => setTms(e.target.checked)}
                  className="w-4 h-4 accent-[#1A1A1A]"
                />
                <span className="text-[#1A1A1A] font-medium">TMS (Track Management)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smms}
                  onChange={(e) => setSmms(e.target.checked)}
                  className="w-4 h-4 accent-[#1A1A1A]"
                />
                <span className="text-[#1A1A1A] font-medium">SMMS (Signal)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tdms}
                  onChange={(e) => setTdms(e.target.checked)}
                  className="w-4 h-4 accent-[#1A1A1A]"
                />
                <span className="text-[#1A1A1A] font-medium">TDMS (Traction)</span>
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E2D9] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-[#737067] hover:text-[#1A1A1A] hover:bg-[#FAF9F5] rounded transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider bg-[#1A1A1A] text-[#F9F8F6] hover:bg-[#2B2B2B] rounded shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px] text-[#D4AF37]">done_all</span>
              Authorize & Save Block Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
