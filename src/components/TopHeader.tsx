import React, { useState } from 'react';
import { NavigationTab } from '../types';
import { USER_AVATAR } from '../data/mockData';

interface TopHeaderProps {
  currentTab: NavigationTab;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenMobileMenu: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab,
  searchQuery,
  onSearchChange,
  onOpenMobileMenu,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const notificationsList = [
    {
      id: 1,
      title: 'Block Approved: NDLS-CNB',
      desc: 'Chief Engineer approved 4h block for Km 430-435.',
      time: '10m ago',
      unread: true,
    },
    {
      id: 2,
      title: 'Track Circuit Defect Reported',
      desc: 'Section 4A reported voltage drop. Linked to #DR-8823.',
      time: '45m ago',
      unread: true,
    },
    {
      id: 3,
      title: 'AI Optimization Complete',
      desc: 'Alternative night path recommended for 12004 Shatabdi.',
      time: '2h ago',
      unread: false,
    },
  ];

  const getTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Ministry of Railways';
      case 'schedules':
        return 'AI Block Planning';
      case 'timetable':
        return 'Possession Timetable';
      case 'corridors':
      case 'assets':
        return 'Asset & Corridor Management';
      case 'defects':
        return 'Centralized Defect Register';
      case 'reports':
        return 'Performance & Block Reports';
      case 'settings':
        return 'System Configuration';
      default:
        return 'Ministry of Railways';
    }
  };

  const getSearchPlaceholder = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Search resources, divisions, trains...';
      case 'schedules':
        return 'Search schedules, blocks, corridors...';
      case 'timetable':
        return 'Search the timetable...';
      case 'corridors':
      case 'assets':
        return 'Search corridors, assets, blocks...';
      case 'defects':
        return 'Search defects, track IDs...';
      default:
        return 'Search Indian Railways Portal...';
    }
  };

  return (
    <header className="bg-[#FAF9F5] border-b border-[#E5E2D9] sticky top-0 z-30 h-20 flex items-center px-4 md:px-10">
      <div className="flex justify-between items-center w-full max-w-[1280px] mx-auto">
        {/* Left: Hamburger & Dynamic Title */}
        <div className="flex items-center gap-3 md:gap-4">
          <button
            id="mobile-menu-btn"
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 text-[#525252] hover:bg-[#EAE8E2] rounded-md transition-colors"
            aria-label="Open navigation menu"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>

          <div>
            <h1 className="font-serif text-xl md:text-2xl lg:text-[26px] font-bold text-[#1A1A1A] tracking-tight leading-tight">
              {getTitle()}
            </h1>
            {currentTab === 'dashboard' && (
              <p className="text-xs text-[#737067] hidden sm:block font-serif italic">
                National Railway Network Operations & Block Control
              </p>
            )}
          </div>
        </div>

        {/* Center/Right: Search Bar (when relevant) & Actions */}
        <div className="flex items-center gap-3 md:gap-5">
          {/* Search Box on medium+ screens */}
          {currentTab !== 'schedules' && (
            <div className="relative hidden md:block">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737067] text-[18px]">
                search
              </span>
              <input
                id="global-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={getSearchPlaceholder()}
                className="w-64 lg:w-80 bg-[#F4F3EF] border border-[#D4D0C5] rounded-full py-2 pl-10 pr-4 text-xs text-[#1A1A1A] placeholder:text-[#8C8C8C] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] transition-all"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 relative">
            {/* Notifications Button */}
            <div className="relative">
              <button
                id="notifications-btn"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowHelp(false);
                  setShowProfile(false);
                }}
                className="p-2 text-[#525252] hover:bg-[#EAE8E2] rounded-full transition-colors relative cursor-pointer border border-transparent hover:border-[#D4D0C5]"
                title="Notifications"
              >
                <span className="material-symbols-outlined text-[20px]">
                  notifications
                </span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#842029] rounded-full ring-2 ring-[#FAF9F5]"></span>
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#FAF9F5] border border-[#D4D0C5] rounded-xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E5E2D9]">
                    <h3 className="font-serif font-bold text-sm text-[#1A1A1A]">
                      Operational Alerts
                    </h3>
                    <span className="text-[10px] bg-[#FFDCC2] text-[#8F4E00] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                      2 Unread
                    </span>
                  </div>
                  <div className="divide-y divide-[#E5E2D9] max-h-72 overflow-y-auto">
                    {notificationsList.map((n) => (
                      <div
                        key={n.id}
                        className={`py-2.5 px-2 hover:bg-[#EAE8E2] rounded transition-colors ${
                          n.unread ? 'bg-[#F4F3EF]' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-semibold text-[#1A1A1A]">
                            {n.title}
                          </p>
                          <span className="text-[10px] text-[#737067] font-mono">
                            {n.time}
                          </span>
                        </div>
                        <p className="text-xs text-[#525252] mt-0.5">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-[#E5E2D9] text-center">
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-xs text-[#1A1A1A] font-semibold hover:underline uppercase tracking-wider text-[11px]"
                    >
                      Dismiss All Alerts
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Help Button */}
            <div className="relative hidden sm:block">
              <button
                id="help-btn"
                onClick={() => {
                  setShowHelp(!showHelp);
                  setShowNotifications(false);
                  setShowProfile(false);
                }}
                className="p-2 text-[#525252] hover:bg-[#EAE8E2] rounded-full transition-colors cursor-pointer border border-transparent hover:border-[#D4D0C5]"
                title="Help & Manual"
              >
                <span className="material-symbols-outlined text-[20px]">help</span>
              </button>

              {showHelp && (
                <div className="absolute right-0 mt-2 w-72 bg-[#FAF9F5] border border-[#D4D0C5] rounded-xl shadow-xl z-50 p-4">
                  <h4 className="font-serif font-bold text-sm text-[#1A1A1A] mb-2">
                    AI Block Planning Manual
                  </h4>
                  <p className="text-xs text-[#525252] mb-3 leading-relaxed">
                    The Bharat Rail Block System synchronizes TMS (Track), SMMS
                    (Signal), and TDMS (Traction) to resolve section congestion
                    automatically.
                  </p>
                  <div className="space-y-1.5 text-xs text-[#1A1A1A]">
                    <a
                      href="#manual"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowHelp(false);
                      }}
                      className="block hover:underline font-medium"
                    >
                      • Standard Operating Procedures (SOP 2023)
                    </a>
                    <a
                      href="#support"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowHelp(false);
                      }}
                      className="block hover:underline font-medium"
                    >
                      • Contact Divisional Traffic Controller
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar & Menu */}
            <div className="relative ml-1">
              <button
                id="profile-avatar-btn"
                onClick={() => {
                  setShowProfile(!showProfile);
                  setShowNotifications(false);
                  setShowHelp(false);
                }}
                className="p-0.5 rounded-full hover:ring-2 hover:ring-[#1A1A1A] transition-all cursor-pointer flex items-center"
              >
                <img
                  src={USER_AVATAR}
                  alt="Official Profile Avatar"
                  className="w-9 h-9 rounded-full object-cover border border-[#D4D0C5]"
                />
              </button>

              {showProfile && (
                <div className="absolute right-0 mt-2 w-64 bg-[#FAF9F5] border border-[#D4D0C5] rounded-xl shadow-xl z-50 p-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-[#E5E2D9]">
                    <img
                      src={USER_AVATAR}
                      alt="User"
                      className="w-10 h-10 rounded-full object-cover border border-[#D4D0C5]"
                    />
                    <div>
                      <p className="font-serif font-bold text-xs text-[#1A1A1A]">
                        N. Patil, IRTS
                      </p>
                      <p className="text-[11px] text-[#737067]">
                        Dy. Chief Controller (Northern)
                      </p>
                    </div>
                  </div>
                  <div className="py-2 text-xs text-[#525252] space-y-1">
                    <p>
                      <span className="font-semibold text-[#1A1A1A]">HQ:</span> Baroda House, New Delhi
                    </p>
                    <p>
                      <span className="font-semibold text-[#1A1A1A]">Section:</span> NDLS - CNB
                    </p>
                    <p>
                      <span className="font-semibold text-[#1A1A1A]">Role:</span> Block Approver
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

