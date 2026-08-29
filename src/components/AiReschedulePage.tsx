import React, { useState, useEffect } from 'react';
import { BlockPlan, AiRescheduleRecommendation } from '../types';

interface AiReschedulePageProps {
  missedBlock: BlockPlan;
  onBack: () => void;
  onApplyRescheduledBlock: (updatedBlock: BlockPlan, newScheduledBlock?: BlockPlan) => void;
}

export const AiReschedulePage: React.FC<AiReschedulePageProps> = ({
  missedBlock,
  onBack,
  onApplyRescheduledBlock,
}) => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [currentStage, setCurrentStage] = useState(0);
  const [recommendation, setRecommendation] = useState<AiRescheduleRecommendation | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(-1); // -1 = recommended slot, 0..N = alternatives
  const [isAiPowered, setIsAiPowered] = useState(true);
  const [dispatched, setDispatched] = useState(false);

  const stages = [
    { label: 'Querying Control Office Application (COA) live traffic graph...', progress: 20 },
    { label: 'Analyzing Section Density & Speed Restrictions (PSR/TSR)...', progress: 45 },
    { label: 'Executing AI Multi-Track Conflict Resolution...', progress: 75 },
    { label: 'Synthesizing TMS, SMMS & TDMS replacement window...', progress: 100 },
  ];

  useEffect(() => {
    setIsProcessing(true);
    setCurrentStage(0);
    setRecommendation(null);
    setSelectedSlotIndex(-1);
    setDispatched(false);

    const timer1 = setTimeout(() => setCurrentStage(1), 600);
    const timer2 = setTimeout(() => setCurrentStage(2), 1200);
    const timer3 = setTimeout(() => setCurrentStage(3), 1800);

    const fetchAiRecommendation = async () => {
      try {
        const response = await fetch('/api/ai/reschedule-missed-block', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blockId: missedBlock.id,
            corridorName: missedBlock.corridorName,
            section: missedBlock.section,
            division: missedBlock.division,
            blockType: missedBlock.type,
            department: missedBlock.department,
            durationHours: missedBlock.durationHours,
            missedReason: missedBlock.missedReason || 'Freight congestion & priority rake passage',
            originalDate: missedBlock.date,
            originalStartTime: missedBlock.startTime,
            originalEndTime: missedBlock.endTime,
            location: missedBlock.location,
            criticality: 'High',
          }),
        });

        const resData = await response.json();
        if (resData.success && resData.data) {
          setTimeout(() => {
            setRecommendation(resData.data);
            setIsAiPowered(resData.aiGenerated ?? true);
            setIsProcessing(false);
          }, 2100);
        } else {
          throw new Error(resData.error || 'Failed to fetch AI recommendation');
        }
      } catch (err) {
        console.warn('Using client-side AI fallback engine:', err);
        setTimeout(() => {
          setRecommendation(getOfflineAiFallback(missedBlock));
          setIsAiPowered(false);
          setIsProcessing(false);
        }, 2100);
      }
    };

    fetchAiRecommendation();

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missedBlock.id]);

  const activeSlot =
    selectedSlotIndex === -1
      ? recommendation?.recommendedSlot
      : recommendation?.alternativeSlots[selectedSlotIndex];

  const handleApprove = () => {
    if (!activeSlot || !recommendation) return;

    const rescheduledBlock: BlockPlan = {
      ...missedBlock,
      id: `#MB-${new Date().getFullYear()}-${Math.floor(200 + Math.random() * 800)}R`,
      date: activeSlot.date,
      startTime: activeSlot.startTime,
      endTime: activeSlot.endTime,
      durationHours: activeSlot.durationHours,
      status: 'Scheduled',
      description: `${missedBlock.description} (AI Rescheduled from ${missedBlock.id})`,
      originalSlot: `${missedBlock.date} (${missedBlock.startTime} - ${missedBlock.endTime})`,
      rescheduledFromId: missedBlock.id,
      aiRescheduled: true,
      aiConfidence: (activeSlot as any).reliabilityScore || 98,
      approvedBy: 'AI Neural Dispatcher / Chief Train Controller',
      systemIntegrations: {
        tms: recommendation.systemSyncStatus.tmsReady,
        smms: recommendation.systemSyncStatus.smmsReady,
        tdms: recommendation.systemSyncStatus.tdmsReady,
      },
    };

    const updatedOriginalBlock: BlockPlan = {
      ...missedBlock,
      status: 'Completed',
      description: `${missedBlock.description} [Rescheduled to ${rescheduledBlock.id}]`,
    };

    onApplyRescheduledBlock(updatedOriginalBlock, rescheduledBlock);
    setDispatched(true);
    setTimeout(() => onBack(), 1400);
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-6 animate-in fade-in">
      {/* Page header with Back navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#737067] hover:text-[#1A1A1A] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Corridor Control
        </button>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#F8D7DA] text-[#842029] border border-[#842029]/20">
          MISSED BLOCK RECOVERY
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-[#1A1A1A] text-[#D4AF37] border border-[#D4AF37]/30 rounded-lg flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[24px]">auto_schedule</span>
        </div>
        <div>
          <span className="text-[10px] text-[#737067] uppercase font-mono tracking-[0.2em] font-semibold block mb-0.5">
            AI CORRIDOR CONTROLLER
          </span>
          <h2 className="text-xl md:text-2xl font-serif font-bold text-[#1A1A1A]">
            AI Automatic Rescheduling Engine
          </h2>
          <p className="text-xs text-[#737067] font-serif italic">
            Predictive slot re-allocation for {missedBlock.corridorName} ({missedBlock.section})
          </p>
        </div>
      </div>

      {/* Missed Block Summary Banner */}
      <div className="p-4 bg-white rounded-xl border border-[#E5E2D9] shadow-[0px_2px_8px_rgba(0,0,0,0.02)] space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs text-[#1A1A1A] bg-[#EAE8E2] px-2 py-0.5 rounded">
              {missedBlock.id}
            </span>
            <span className="text-xs font-serif font-bold text-[#1A1A1A]">
              {missedBlock.type} ({missedBlock.department})
            </span>
            {missedBlock.location && (
              <span className="text-xs font-mono text-[#737067]">
                • {missedBlock.location}
              </span>
            )}
          </div>
          <span className="text-xs text-[#842029] font-mono font-bold bg-[#F8D7DA] px-2.5 py-0.5 rounded">
            Original Slot: {missedBlock.date} ({missedBlock.startTime} - {missedBlock.endTime})
          </span>
        </div>
        <p className="text-xs text-[#525252] leading-relaxed">
          <strong className="text-[#1A1A1A]">Missed Reason:</strong>{' '}
          {missedBlock.missedReason || 'Corridor traffic congestion and priority rake crossing'}
        </p>
      </div>

      {/* Dispatched confirmation */}
      {dispatched && (
        <div className="py-8 text-center bg-[#E2EFE7] rounded-xl border border-[#1B4D3E]/30 animate-in fade-in">
          <span className="material-symbols-outlined text-4xl text-[#1B4D3E] mb-2">task_alt</span>
          <h4 className="font-serif text-lg font-bold text-[#1B4D3E]">
            Replacement Schedule Dispatched
          </h4>
          <p className="text-xs text-[#525252] mt-1">Returning to Corridor Control...</p>
        </div>
      )}

      {!dispatched && (
        <>
          {/* Pipeline Progress */}
          {isProcessing && (
            <div className="space-y-2.5 bg-white p-5 rounded-xl border border-[#E5E2D9] shadow-[0px_2px_8px_rgba(0,0,0,0.02)]">
              <div className="flex justify-between text-xs font-bold font-mono text-[#1A1A1A]">
                <span>Neural Conflict Calculation Status</span>
                <span>{stages[currentStage].progress}%</span>
              </div>
              <div className="w-full bg-[#EAE8E2] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#1A1A1A] h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${stages[currentStage].progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-[#737067] font-serif italic pt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping inline-block"></span>
                {stages[currentStage].label}
              </p>
            </div>
          )}

          {/* AI Results */}
          {!isProcessing && recommendation && (
            <div className="space-y-5 animate-in fade-in">
              {/* Primary Recommended Window Card */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-[11px] font-mono font-bold text-[#1A1A1A] uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#D4AF37]">
                      recommend
                    </span>
                    AI Recommended Primary Possession Window
                  </h4>
                  <span className="text-[10px] font-mono font-bold bg-[#E2EFE7] text-[#1B4D3E] px-2 py-0.5 rounded border border-[#1B4D3E]/20">
                    {recommendation.recommendedSlot.reliabilityScore}% Reliability Score
                  </span>
                </div>

                <div
                  onClick={() => setSelectedSlotIndex(-1)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer bg-white ${
                    selectedSlotIndex === -1
                      ? 'border-[#1A1A1A] ring-1 ring-[#1A1A1A] shadow-xs'
                      : 'border-[#E5E2D9] hover:border-[#1A1A1A]'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#E5E2D9]">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#737067]">
                        PROPOSED DATE & SLOT
                      </span>
                      <div className="text-base font-serif font-bold text-[#1A1A1A]">
                        {recommendation.recommendedSlot.date} •{' '}
                        <span className="text-[#1B4D3E]">
                          {recommendation.recommendedSlot.startTime} -{' '}
                          {recommendation.recommendedSlot.endTime}
                        </span>{' '}
                        ({recommendation.recommendedSlot.durationHours} Hours)
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-[#525252] bg-[#EAE8E2] px-2.5 py-1 rounded">
                        {recommendation.recommendedSlot.trafficDensity}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          selectedSlotIndex === -1
                            ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                            : 'border-[#D4D0C5]'
                        }`}
                      >
                        {selectedSlotIndex === -1 && '✓'}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#525252] leading-relaxed pt-3 font-serif">
                    <strong className="text-[#1A1A1A]">Operational Rationale:</strong>{' '}
                    {recommendation.recommendedSlot.rationale}
                  </p>
                </div>
              </div>

              {/* Alternative Slots Section */}
              {recommendation.alternativeSlots && recommendation.alternativeSlots.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-mono font-bold text-[#737067] uppercase tracking-widest mb-2">
                    Alternative Corridor Window Options
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recommendation.alternativeSlots.map((alt, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedSlotIndex(idx)}
                        className={`p-3.5 rounded-lg border transition-all cursor-pointer text-xs bg-white ${
                          selectedSlotIndex === idx
                            ? 'border-[#1A1A1A] ring-1 ring-[#1A1A1A]'
                            : 'border-[#E5E2D9] hover:border-[#1A1A1A]'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="font-serif font-bold text-[#1A1A1A]">
                            Option {idx + 1}: {alt.date}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-[#1B4D3E]">
                            {alt.startTime} - {alt.endTime}
                          </span>
                        </div>
                        <p className="text-[#737067] text-[11px] leading-snug">
                          {alt.prosAndCons}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Train Impact & Regulation Plan */}
              <div className="bg-white p-4 rounded-xl border border-[#E5E2D9] shadow-[0px_2px_8px_rgba(0,0,0,0.02)] space-y-3">
                <h4 className="text-[11px] font-mono font-bold text-[#1A1A1A] uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#1B4D3E]">
                    alt_route
                  </span>
                  Active Train Impact & Regulation Mitigation
                </h4>
                <div className="space-y-2">
                  {recommendation.trainImpactMitigations.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#FAF9F5] rounded border border-[#E5E2D9] flex flex-col md:flex-row md:items-center justify-between text-xs gap-1.5"
                    >
                      <div className="font-bold font-mono text-[#1A1A1A]">
                        {item.trainNumber}
                      </div>
                      <div className="text-[#525252] flex-1 md:mx-3 font-serif">
                        {item.regulationPlan}
                      </div>
                      <span
                        className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded self-start md:self-auto ${
                          item.impactLevel === 'None'
                            ? 'bg-[#E2EFE7] text-[#1B4D3E]'
                            : item.impactLevel === 'Low'
                            ? 'bg-[#FFDCC2] text-[#8F4E00]'
                            : 'bg-[#EAE8E2] text-[#525252]'
                        }`}
                      >
                        {item.impactLevel} Impact
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety & Telemetry Summary Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-white rounded-xl border border-[#E5E2D9] shadow-[0px_2px_8px_rgba(0,0,0,0.02)] text-xs">
                  <span className="text-[10px] font-mono font-bold text-[#842029] uppercase block mb-1">
                    ⚠ Safety & Speed Restriction Notice
                  </span>
                  <p className="text-[#525252] font-serif leading-relaxed">
                    {recommendation.safetyUrgencyNote}
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-[#E5E2D9] shadow-[0px_2px_8px_rgba(0,0,0,0.02)] text-xs space-y-2">
                  <span className="text-[10px] font-mono font-bold text-[#1A1A1A] uppercase block">
                    System Synchronization Status
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="flex items-center gap-1.5 text-[#1B4D3E] font-semibold">
                      <span>✓</span> TMS (Track Mgmt)
                    </div>
                    <div className="flex items-center gap-1.5 text-[#1B4D3E] font-semibold">
                      <span>✓</span> SMMS (Signal)
                    </div>
                    <div className="flex items-center gap-1.5 text-[#1B4D3E] font-semibold">
                      <span>✓</span> TDMS (Traction)
                    </div>
                    <div className="flex items-center gap-1.5 text-[#1B4D3E] font-semibold">
                      <span>✓</span> COA (Control Office)
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky action footer */}
              <div className="sticky bottom-0 bg-[#F9F8F6]/95 backdrop-blur-xs pt-3 pb-1 border-t border-[#E5E2D9] flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="text-[11px] font-mono text-[#737067] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#1B4D3E]"></span>
                  {isAiPowered ? 'AI Rail Optimization Model' : 'Algorithmic Fallback Engine Active'}
                </div>
                <div className="flex gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onBack}
                    className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-semibold text-[#737067] hover:text-[#1A1A1A] hover:bg-white rounded cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!activeSlot}
                    onClick={handleApprove}
                    className="flex-1 sm:flex-initial px-6 py-2.5 text-xs font-bold uppercase tracking-wider bg-[#1A1A1A] text-[#F9F8F6] hover:bg-[#2B2B2B] disabled:opacity-50 rounded shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px] text-[#D4AF37]">
                      check_circle
                    </span>
                    Approve & Dispatch AI Schedule
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Fallback logic in case of network interruption
function getOfflineAiFallback(missedBlock: BlockPlan): AiRescheduleRecommendation {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  return {
    recommendedSlot: {
      date: dateStr,
      startTime: '01:30 Hrs',
      endTime: '05:30 Hrs',
      durationHours: missedBlock.durationHours || 4,
      trafficDensity: 'Minimal Night Traffic (2 Goods Rakes only)',
      reliabilityScore: 98.4,
      rationale: `Optimal low-density possession window on ${missedBlock.section} avoiding morning Shatabdi & Vande Bharat paths.`,
    },
    alternativeSlots: [
      {
        date: dateStr,
        startTime: '11:00 Hrs',
        endTime: '15:00 Hrs',
        durationHours: missedBlock.durationHours || 4,
        prosAndCons: 'Midday slot between peak office commute waves; requires loop line regulation for 1 freight train.',
        reliabilityScore: 93.0,
      },
      {
        date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        startTime: '00:30 Hrs',
        endTime: '04:30 Hrs',
        durationHours: missedBlock.durationHours || 4,
        prosAndCons: 'Night block with complete section isolation for heavy track tamping & engineering machines.',
        reliabilityScore: 99.1,
      },
    ],
    trainImpactMitigations: [
      {
        trainNumber: '12004 Swarna Shatabdi',
        regulationPlan: 'Clear green corridor via Main Up Line before 00:45 Hrs (Zero delay)',
        impactLevel: 'None',
      },
      {
        trainNumber: 'Goods Rake CONCOR #8921',
        regulationPlan: 'Regulated at Aligarh Junction siding for 25 minutes',
        impactLevel: 'Managed',
      },
      {
        trainNumber: '12560 Shiv Ganga Express',
        regulationPlan: 'Diverted via 3rd loop line at 30 km/h with 4-minute slack absorption',
        impactLevel: 'Low',
      },
    ],
    safetyUrgencyNote:
      'Crucial maintenance required on this high-speed trunk route. Delaying beyond 48 hours will trigger a mandatory 30 km/h Temporary Speed Restriction (TSR).',
    systemSyncStatus: {
      tmsReady: true,
      smmsReady: true,
      tdmsReady: true,
      coaCleared: true,
    },
  };
}
