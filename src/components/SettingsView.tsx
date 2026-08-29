import React, { useState } from 'react';

export const SettingsView: React.FC = () => {
  const [tmsSync, setTmsSync] = useState(true);
  const [smmsSync, setSmmsSync] = useState(true);
  const [tdmsSync, setTdmsSync] = useState(true);
  const [coaSync, setCoaSync] = useState(true);
  const [autoApproveAi, setAutoApproveAi] = useState(false);
  const [feedback, setFeedback] = useState(false);

  const handleSave = () => {
    setFeedback(true);
    setTimeout(() => setFeedback(false), 2500);
  };

  return (
    <div className="max-w-[1280px] mx-auto space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="text-[10px] text-[#737067] uppercase font-mono tracking-[0.2em] font-semibold block mb-1">
            CONFIGURATION & TELEMETRY PROTOCOLS
          </span>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
            System Integrations & Operating Configuration
          </h2>
          <p className="text-xs text-[#737067] font-serif italic">
            Configure telemetry channels for TMS, SMMS, TDMS and Divisional Control Office dispatch.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#2B2B2B] text-[#F9F8F6] text-xs font-semibold uppercase tracking-wider rounded shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px] text-[#D4AF37]">
            {feedback ? 'check_circle' : 'save'}
          </span>
          {feedback ? 'Saved Successfully' : 'Save Configuration'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Integrations */}
        <div className="bg-white border border-[#E5E2D9] rounded-xl p-6 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] space-y-4">
          <div className="pb-3 border-b border-[#E5E2D9] flex justify-between items-center">
            <h3 className="font-serif text-base font-bold text-[#1A1A1A]">
              Active Telemetry Feed Status
            </h3>
            <span className="text-[10px] font-mono font-bold text-[#1B4D3E] bg-[#E2EFE7] px-2 py-0.5 rounded border border-[#1B4D3E]/20">
              4 CHANNELS ACTIVE
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-[#FAF9F5] rounded-lg border border-[#E5E2D9]">
              <div>
                <span className="font-bold text-[#1A1A1A] block font-mono">TMS (Track Management System)</span>
                <span className="text-[#737067] font-serif italic">Real-time track geometry & ultrasound rail flaw logs</span>
              </div>
              <input
                type="checkbox"
                checked={tmsSync}
                onChange={(e) => setTmsSync(e.target.checked)}
                className="w-4 h-4 accent-[#1A1A1A] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#FAF9F5] rounded-lg border border-[#E5E2D9]">
              <div>
                <span className="font-bold text-[#1A1A1A] block font-mono">SMMS (Signal Maintenance System)</span>
                <span className="text-[#737067] font-serif italic">Interlocking telemetry & point machine voltage sensors</span>
              </div>
              <input
                type="checkbox"
                checked={smmsSync}
                onChange={(e) => setSmmsSync(e.target.checked)}
                className="w-4 h-4 accent-[#1A1A1A] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#FAF9F5] rounded-lg border border-[#E5E2D9]">
              <div>
                <span className="font-bold text-[#1A1A1A] block font-mono">TDMS (Traction Distribution System)</span>
                <span className="text-[#737067] font-serif italic">25kV AC OHE catenary & power substation feeds</span>
              </div>
              <input
                type="checkbox"
                checked={tdmsSync}
                onChange={(e) => setTdmsSync(e.target.checked)}
                className="w-4 h-4 accent-[#1A1A1A] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#FAF9F5] rounded-lg border border-[#E5E2D9]">
              <div>
                <span className="font-bold text-[#1A1A1A] block font-mono">COA (Control Office Application)</span>
                <span className="text-[#737067] font-serif italic">Master train charts & Section Controller synchronization</span>
              </div>
              <input
                type="checkbox"
                checked={coaSync}
                onChange={(e) => setCoaSync(e.target.checked)}
                className="w-4 h-4 accent-[#1A1A1A] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Operational Constraints */}
        <div className="bg-white border border-[#E5E2D9] rounded-xl p-6 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] space-y-4">
          <div className="pb-3 border-b border-[#E5E2D9]">
            <h3 className="font-serif text-base font-bold text-[#1A1A1A]">
              AI Optimization & Safety Constraints
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[#1A1A1A] mb-1 font-mono uppercase text-[11px]">
                Minimum Punctuality Threshold
              </label>
              <input
                type="text"
                defaultValue="95.0%"
                className="w-full p-2.5 bg-[#F4F3EF] border border-[#D4D0C5] rounded text-xs font-mono font-bold text-[#1A1A1A] focus:border-[#1A1A1A] outline-none"
              />
              <span className="text-[#737067] font-serif italic block mt-1">
                AI block engine will refuse possession windows that reduce sectional punctuality below this threshold.
              </span>
            </div>

            <div>
              <label className="block font-bold text-[#1A1A1A] mb-1 font-mono uppercase text-[11px]">
                Divisional Dispatch Jurisdiction
              </label>
              <select className="w-full p-2.5 bg-[#F4F3EF] border border-[#D4D0C5] rounded text-xs text-[#1A1A1A] font-medium focus:border-[#1A1A1A] outline-none cursor-pointer">
                <option>Delhi Division (DLI) - Northern Railway</option>
                <option>Prayagraj Division (PRYJ) - North Central Railway</option>
                <option>Mumbai Central (BCT) - Western Railway</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#FAF9F5] rounded-lg border border-[#E5E2D9] mt-2">
              <div>
                <span className="font-bold text-[#1A1A1A] block">Auto-Approve Emergency Blocks</span>
                <span className="text-[#737067] font-serif italic">Allow immediate ultrasonic rail fracture blocks without manual sign-off</span>
              </div>
              <input
                type="checkbox"
                checked={autoApproveAi}
                onChange={(e) => setAutoApproveAi(e.target.checked)}
                className="w-4 h-4 accent-[#1A1A1A] cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

