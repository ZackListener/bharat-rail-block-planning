import React, { useState } from 'react';
import { NavigationTab, Asset, Defect, BlockPlan, ActivityItem } from './types';
import {
  INITIAL_ASSETS,
  INITIAL_DEFECTS,
  INITIAL_BLOCK_PLANS,
  INITIAL_ACTIVITIES,
} from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { DashboardView } from './components/DashboardView';
import { SchedulesView } from './components/SchedulesView';
import { TimetableView } from './components/TimetableView';
import { CorridorsView } from './components/CorridorsView';
import { DefectsView } from './components/DefectsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { NewBlockModal } from './components/NewBlockModal';
import { AiSimulationModal } from './components/AiSimulationModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('schedules');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewBlockModalOpen, setIsNewBlockModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Core application state
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [defects, setDefects] = useState<Defect[]>(INITIAL_DEFECTS);
  const [blockPlans, setBlockPlans] = useState<BlockPlan[]>(INITIAL_BLOCK_PLANS);
  const [activities, setActivities] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);

  // Add new block plan handler
  const handleAddBlockPlan = (newBlock: BlockPlan) => {
    setBlockPlans((prev) => [newBlock, ...prev]);

    // Push new activity
    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      title: `Block scheduled: ${newBlock.section}`,
      subtitle: `By Dy. Chief Controller • Just now`,
      timestamp: 'Just now',
      type: 'maintenance',
      color: '#1A1A1A',
    };
    setActivities((prev) => [newActivity, ...prev]);
  };

  // Update block plan handler
  const handleUpdateBlockPlan = (updatedBlock: BlockPlan) => {
    setBlockPlans((prev) =>
      prev.map((b) => (b.id === updatedBlock.id ? updatedBlock : b))
    );
    const newActivity: ActivityItem = {
      id: `act-up-${Date.now()}`,
      title: `Block status updated: ${updatedBlock.id}`,
      subtitle: `${updatedBlock.section} • Status: ${updatedBlock.status}`,
      timestamp: 'Just now',
      type: updatedBlock.status === 'Missed' ? 'defect' : 'maintenance',
      color: updatedBlock.status === 'Missed' ? '#842029' : '#1A1A1A',
    };
    setActivities((prev) => [newActivity, ...prev]);
  };

  // Add multiple AI block plans
  const handleAddAiPlans = (aiPlans: BlockPlan[]) => {
    setBlockPlans((prev) => [...aiPlans, ...prev]);
    const newActivity: ActivityItem = {
      id: `act-ai-${Date.now()}`,
      title: `AI Block Schedule Generated: ${aiPlans.length} Windows`,
      subtitle: `Predictive conflict resolution • Just now`,
      timestamp: 'Just now',
      type: 'approved',
      color: '#1B4D3E',
    };
    setActivities((prev) => [newActivity, ...prev]);
  };

  // Read a batch of maintenance requests raised by different departments —
  // each can target a different division/section/department than the current
  // form context — and create a block plan for every one of them at once.
  const handleAddMultipleBlockPlans = (newBlocks: BlockPlan[]) => {
    if (newBlocks.length === 0) return;
    setBlockPlans((prev) => [...newBlocks, ...prev]);

    const departmentSet = Array.from(new Set(newBlocks.map((b) => b.department)));
    const combinedCount = newBlocks.filter((b) => b.isCombined).length;
    const newActivity: ActivityItem = {
      id: `act-batch-${Date.now()}`,
      title:
        combinedCount > 0
          ? `${newBlocks.length} Possession Block(s) Created — ${combinedCount} Optimized as Combined Multi-Dept Blocks`
          : `${newBlocks.length} Blocks Created Simultaneously from Department Requests`,
      subtitle: `Departments: ${departmentSet.join(', ')} • Just now`,
      timestamp: 'Just now',
      type: 'approved',
      color: '#1B4D3E',
    };
    setActivities((prev) => [newActivity, ...prev]);
  };

  // Update defect handler
  const handleUpdateDefect = (updatedDefect: Defect) => {
    setDefects((prev) =>
      prev.map((d) => (d.id === updatedDefect.id ? updatedDefect : d))
    );
  };

  return (
    <div className="bg-[#F9F8F6] text-[#1A1A1A] min-h-screen flex antialiased selection:bg-[#1A1A1A] selection:text-[#F9F8F6]">
      {/* Side Navigation Bar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenNewBlockModal={() => setIsNewBlockModalOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content View Container */}
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen relative w-full overflow-x-hidden">
        {/* Top Header */}
        <TopHeader
          currentTab={currentTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* Dynamic Main Workspace Canvas */}
        <main className="flex-1 p-4 md:p-10 bg-[#F9F8F6]">
          {currentTab === 'dashboard' && (
            <DashboardView
              activities={activities}
              defects={defects}
              blockPlans={blockPlans}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'schedules' && (
            <SchedulesView
              blockPlans={blockPlans}
              defects={defects}
              onAddBlockPlan={handleAddBlockPlan}
              onAddMultipleBlockPlans={handleAddMultipleBlockPlans}
              onOpenAiModal={() => setIsAiModalOpen(true)}
            />
          )}

          {currentTab === 'timetable' && (
            <TimetableView blockPlans={blockPlans} />
          )}

          {(currentTab === 'corridors' || currentTab === 'assets') && (
            <CorridorsView
              assets={assets}
              blockPlans={blockPlans}
              onOpenNewBlockModal={() => setIsNewBlockModalOpen(true)}
              onUpdateBlockPlan={handleUpdateBlockPlan}
              onAddBlockPlan={handleAddBlockPlan}
            />
          )}

          {currentTab === 'defects' && (
            <DefectsView
              defects={defects}
              blockPlans={blockPlans}
              onUpdateDefect={handleUpdateDefect}
              onOpenNewBlockModal={() => setIsNewBlockModalOpen(true)}
            />
          )}

          {currentTab === 'reports' && <ReportsView />}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* New Block Plan Modal */}
      <NewBlockModal
        isOpen={isNewBlockModalOpen}
        onClose={() => setIsNewBlockModalOpen(false)}
        onAddBlock={handleAddBlockPlan}
      />

      {/* AI Block Schedule Generator Simulation Modal */}
      <AiSimulationModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyPlans={handleAddAiPlans}
      />
    </div>
  );
}

