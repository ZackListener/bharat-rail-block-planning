import React, { useState, useEffect } from 'react';
import { BlockPlan } from '../types';
import { getAutoScheduledDate } from '../utils/time';

interface AiSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPlans: (plans: BlockPlan[]) => void;
}

export const AiSimulationModal: React.FC<AiSimulationModalProps> = ({
  isOpen,
  onClose,
  onApplyPlans,
}) => {
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(true);

  const stages = [
    { label: 'Fetching TMS, SMMS, TDMS track telemetry...', progress: 25 },
    { label: 'Analyzing 1,420 scheduled freight & passenger train paths...', progress: 60 },
    { label: 'Resolving corridor conflicts via predictive rescheduling...', progress: 85 },
    { label: 'Optimization complete: 4 zero-conflict block windows allocated.', progress: 100 },
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStage(0);
      setIsProcessing(true);
      return;
    }

    const timer1 = setTimeout(() => setCurrentStage(1), 800);
    const timer2 = setTimeout(() => setCurrentStage(2), 1600);
    const timer3 = setTimeout(() => {
      setCurrentStage(3);
      setIsProcessing(false);
    }, 2400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const generatedAiBlocks: BlockPlan[] = [
    {
      id: '#AI-NDLS-881',
      corridorName: 'New Delhi - Kanpur (NDLS-CNB)',
      division: 'Northern Railway (Delhi)',
      section: 'NDLS - CNB (Main Line)',
      description: 'AI Optimized: Automated Track Tamping during 00:45 - 04:45 window. Zero passenger disruption.',
      date: getAutoScheduledDate(1),
      startTime: '00:45 Hrs',
      endTime: '04:45 Hrs',
      durationHours: 4,
      status: 'Scheduled',
      type: 'Track Tamping (BCM/CSM)',
      department: 'Civil',
      progressPercent: 0,
      systemIntegrations: { tms: true, smms: true, tdms: true },
      approvedBy: 'AI Predictive Engine / Chief Controller',
      impactScore: 99,
    },
    {
      id: '#AI-UMB-902',
      corridorName: 'Delhi - Ambala (NDLS-UMB)',
      division: 'Northern Railway (Delhi)',
      section: 'NDLS - UMB',
      description: 'AI Optimized: 25kV OHE Catenary Wire Adjustment. Freight diversion to Goods Bypass Line.',
      date: getAutoScheduledDate(2),
      startTime: '01:15 Hrs',
      endTime: '03:45 Hrs',
      durationHours: 2.5,
      status: 'Scheduled',
      type: 'OHE Maintenance',
      department: 'Electrical',
      progressPercent: 0,
      systemIntegrations: { tms: true, smms: true, tdms: true },
      approvedBy: 'AI Predictive Engine / Dy. Chief Controller',
      impactScore: 98,
    },
  ];

  const handleApply = () => {
    onApplyPlans(generatedAiBlocks);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1A1A]/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-2xl w-full rounded-xl p-6 shadow-2xl space-y-5 border border-[#E5E2D9] animate-in fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start pb-3 border-b border-[#E5E2D9]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#1A1A1A] text-[#D4AF37] border border-[#D4AF37]/30 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">smart_toy</span>
            </div>
            <div>
              <span className="text-[10px] text-[#737067] uppercase font-mono tracking-[0.2em] font-semibold block mb-0.5">
                NEURAL CONFLICT RESOLUTION
              </span>
              <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">
                Predictive AI Block Optimization Engine
              </h3>
              <p className="text-xs text-[#737067] font-serif italic">
                Algorithmic scheduling maximizing track work duration while preserving train punctuality
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#737067] hover:text-[#1A1A1A] p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Progress Timeline */}
        <div className="space-y-2 bg-[#FAF9F5] p-4 rounded-xl border border-[#E5E2D9]">
          <div className="flex justify-between text-xs font-bold font-mono text-[#1A1A1A]">
            <span>Simulation Status</span>
            <span>{stages[currentStage].progress}%</span>
          </div>
          <div className="w-full bg-[#EAE8E2] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#1A1A1A] h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${stages[currentStage].progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-[#737067] font-serif italic pt-1 flex items-center gap-1.5">
            {isProcessing && (
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping inline-block"></span>
            )}
            {stages[currentStage].label}
          </p>
        </div>

        {/* Generated Schedule Cards */}
        {!isProcessing && (
          <div className="space-y-3 animate-in fade-in">
            <h4 className="text-[11px] font-mono font-bold text-[#1A1A1A] uppercase tracking-widest">
              Optimal Allocated Blocks
            </h4>
            <div className="space-y-3">
              {generatedAiBlocks.map((b) => (
                <div
                  key={b.id}
                  className="p-4 border border-[#E5E2D9] rounded-xl bg-white hover:border-[#1A1A1A] shadow-[0px_2px_8px_rgba(0,0,0,0.02)] space-y-2 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono font-bold text-[#1A1A1A]">
                        {b.id} • {b.section}
                      </span>
                      <p className="text-sm font-serif font-bold text-[#1A1A1A] mt-0.5">
                        {b.type} ({b.durationHours} Hours)
                      </p>
                    </div>
                    <span className="text-[10px] font-bold font-mono bg-[#E2EFE7] text-[#1B4D3E] px-2.5 py-1 rounded border border-[#1B4D3E]/20">
                      99% Reliability
                    </span>
                  </div>
                  <p className="text-xs text-[#525252] leading-relaxed">
                    {b.description}
                  </p>
                  <div className="flex justify-between items-center text-[11px] text-[#737067] pt-2 border-t border-[#E5E2D9] font-mono">
                    <span>Slot: {b.date} ({b.startTime} - {b.endTime})</span>
                    <span className="font-semibold text-[#1B4D3E]">TMS + SMMS + TDMS Validated</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-[#E5E2D9] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-semibold text-[#737067] hover:text-[#1A1A1A] hover:bg-[#FAF9F5] rounded cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleApply}
            className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider bg-[#1A1A1A] text-[#F9F8F6] hover:bg-[#2B2B2B] disabled:opacity-50 rounded shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px] text-[#D4AF37]">check_circle</span>
            Approve & Merge into Live Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

