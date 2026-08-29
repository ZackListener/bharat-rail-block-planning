import React from 'react';
import { NavigationTab } from '../types';
import { ASHOKA_PILLAR_LOGO } from '../data/mockData';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenNewBlockModal: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewBlockModal,
  isMobileOpen,
  onCloseMobile,
}) => {
  const navItems: { id: NavigationTab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'schedules', label: 'Schedules', icon: 'calendar_month' },
    { id: 'timetable', label: 'Timetable', icon: 'view_week' },
    { id: 'corridors', label: 'Corridors & Assets', icon: 'hub' },
    { id: 'defects', label: 'Defects', icon: 'warning' },
    { id: 'reports', label: 'Reports', icon: 'assessment' },
  ];

  const handleNavClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <nav
        className={`fixed left-0 top-0 h-full w-64 bg-[#F4F3EF] border-r border-[#E5E2D9] flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header / National Emblem */}
        <div className="p-6 border-b border-[#E5E2D9] flex items-center gap-3.5 bg-[#FAF9F5]">
          <img
            src={ASHOKA_PILLAR_LOGO}
            alt="Ashoka Pillar Emblem - Government of India"
            className="w-10 h-10 object-contain shrink-0"
          />
          <div className="overflow-hidden">
            <h1 className="font-serif text-base font-bold leading-tight text-[#1A1A1A] tracking-tight">
              Railways Admin
            </h1>
            <p className="text-[11px] text-[#737067] font-medium tracking-wide uppercase">
              Government of India
            </p>
          </div>
        </div>

        {/* Edition Subheader */}
        <div className="px-6 py-2 bg-[#EAE8E2] border-b border-[#E5E2D9] flex items-center justify-between text-[10px] text-[#737067] uppercase tracking-[0.18em]">
          <span>Dispatch No. 402</span>
          <span>Vol. VIII</span>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1.5 px-3">
            {navItems.map((item) => {
              const isActive =
                currentTab === item.id ||
                (item.id === 'corridors' && currentTab === 'assets');
              return (
                <li key={item.id}>
                  <button
                    id={`nav-item-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center px-3.5 py-2.5 text-left transition-all rounded-md ${
                      isActive
                        ? 'bg-[#1A1A1A] text-[#F9F8F6] font-semibold shadow-xs'
                        : 'text-[#525252] hover:bg-[#EAE8E2] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined mr-3 text-[20px] ${
                        isActive ? 'text-[#D4AF37]' : 'text-[#737067]'
                      }`}
                      style={{
                        fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                      }}
                    >
                      {item.icon}
                    </span>
                    <span className="text-xs uppercase tracking-[0.1em] font-medium">
                      {item.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* CTA Button: New Block Plan */}
        <div className="p-4 border-t border-[#E5E2D9] bg-[#FAF9F5]">
          <button
            id="sidebar-new-block-btn"
            onClick={onOpenNewBlockModal}
            className="w-full flex items-center justify-center bg-[#1A1A1A] hover:bg-[#2B2B2B] active:scale-[0.98] text-[#F9F8F6] font-semibold text-xs tracking-[0.12em] uppercase h-11 px-4 rounded border border-[#1A1A1A] transition-all shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined mr-2 text-[18px] text-[#D4AF37]">add</span>
            New Block Plan
          </button>
        </div>

        {/* Bottom Utility Links */}
        <div className="border-t border-[#E5E2D9] py-2 px-3 bg-[#F4F3EF]">
          <ul className="space-y-1">
            <li>
              <button
                id="nav-item-settings"
                onClick={() => handleNavClick('settings')}
                className={`w-full flex items-center px-3 py-2 text-left transition-all rounded-md text-xs tracking-[0.05em] ${
                  currentTab === 'settings'
                    ? 'bg-[#1A1A1A] text-[#F9F8F6] font-semibold'
                    : 'text-[#525252] hover:bg-[#EAE8E2] hover:text-[#1A1A1A]'
                }`}
              >
                <span className="material-symbols-outlined mr-2.5 text-[18px] text-[#737067]">
                  settings
                </span>
                <span>Settings</span>
              </button>
            </li>
            <li>
              <button
                id="nav-item-logout"
                onClick={() => {
                  alert('Session active: Logged in under Chief Controller (Northern Railway)');
                }}
                className="w-full flex items-center px-3 py-2 text-[#737067] hover:bg-[#EAE8E2] hover:text-[#842029] transition-all rounded-md text-xs tracking-[0.05em]"
              >
                <span className="material-symbols-outlined mr-2.5 text-[18px]">
                  logout
                </span>
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
};

