/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  LayoutDashboard, 
  Compass, 
  TrendingUp, 
  Video, 
  GraduationCap, 
  User, 
  Award,
  Hourglass,
  Cloud,
  LogOut
} from "lucide-react";
import { AuthenticatedUser } from "../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProgressScore: number;
  user: AuthenticatedUser | null;
  onLogout: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  userProgressScore,
  user,
  onLogout
}: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "browse", label: "Browse Courses", icon: Compass },
    { id: "analytics", label: "My Progress", icon: TrendingUp },
    { id: "creator-studio", label: "Creator Studio", icon: Video },
    { id: "mern-portal", label: "MERN Cloud Server", icon: Cloud },
  ];


  return (
    <aside className="w-60 bg-[#09090b] text-slate-300 flex flex-col h-full shrink-0 select-none border-r border-zinc-800">
      {/* Brand Header */}
      <div className="p-6 border-b border-zinc-800 flex items-center space-x-3.5">
        <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-950/50">
          <Hourglass className="w-5 h-5 text-black animate-pulse" />
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-widest text-orange-500 font-extrabold leading-none block font-mono">ESTD 2026</span>
          <h1 className="text-sm font-bold tracking-tight text-white leading-tight font-serif animate-fade-in">
            Vantage Academy
          </h1>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-4 block mb-2 font-mono">
          // Study Portal
        </span>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === "browse" && activeTab.startsWith("course-"));
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? "bg-orange-600 text-white font-semibold shadow-md shadow-orange-600/20"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-zinc-500"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Learning Status / XP Progress Block resembling Storage progress */}
      <div className="p-4 mt-auto">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400 uppercase">Honor Level</span>
            <span className="text-xs text-orange-500 font-bold font-mono">{userProgressScore} XP</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-orange-600 to-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (userProgressScore / 1000) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-500 mt-2 font-mono">
            {userProgressScore >= 1000 ? "Level certified!" : `${1000 - userProgressScore} XP to badge`}
          </p>
        </div>
      </div>

      {/* User profile footer matching the design's instructor style but dark */}
      <div className="p-4 border-t border-zinc-800 bg-black flex items-center justify-between gap-1 text-left">
        {user ? (
          <>
            <div className="flex items-center space-x-3 truncate min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-orange-600 text-black flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-md shadow-orange-600/15">
                {user.name ? user.name.slice(0, 2).toUpperCase() : "ST"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-100 truncate">{user.name}</p>
                <p className="text-[10px] text-zinc-500 truncate font-mono mt-0.5 leading-none">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 hover:bg-zinc-900 text-zinc-550 text-zinc-500 hover:text-orange-500 rounded-lg cursor-pointer transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex items-center space-x-3 truncate min-w-0 flex-1">
            <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-xs shrink-0 select-none">
              G
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-350 truncate">Guest Student</p>
              <p className="text-[10px] text-zinc-500 truncate font-mono mt-0.5 leading-none">Not Authenticated</p>
            </div>
            <button
              onClick={() => setActiveTab("mern-portal")}
              className="text-[10px] font-extrabold text-orange-500 hover:underline font-mono"
            >
              LOGIN
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
