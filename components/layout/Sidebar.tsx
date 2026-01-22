// components/Sidebar.tsx
"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Code,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { MENU_ITEMS } from "@/enum/constants";

interface SidebarProps {
  isCollapsed: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = () => {
  const { isSidebarCollapsed } = useApp();
  const pathname = usePathname();

  return (
    <div
      className={`bg-indigo-900 text-white transition-all duration-300 flex flex-col ${
        isSidebarCollapsed ? "w-16" : "w-64"
      } h-screen fixed left-0 top-0 z-50 shadow-xl border-r border-indigo-800`}
    >
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-center border-b border-indigo-800 transition-all duration-300 overflow-hidden">
        <div
          className={`flex items-center gap-2 font-bold text-lg tracking-tight whitespace-nowrap ${isSidebarCollapsed ? "opacity-0 w-0 hidden" : "opacity-100"}`}
        >
          <Code className="w-6 h-6 text-indigo-400 flex-shrink-0" />
          <span>
            Edu<span className="text-indigo-400">Tools</span>
          </span>
        </div>
        {isSidebarCollapsed && <Code className="w-8 h-8 text-indigo-400" />}
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 space-y-2 px-2 overflow-x-hidden">
        {MENU_ITEMS.map((item) => {
          // Check active state (simple exact match or starts with for sub-routes)
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 font-bold" 
                  : "text-indigo-200 hover:bg-indigo-800 hover:text-white"
              } ${isSidebarCollapsed ? "justify-center" : ""}`}
              title={isSidebarCollapsed ? item.label : ""}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-indigo-400 group-hover:text-white"}`} />
              
              <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? "opacity-0 w-0 hidden" : "opacity-100"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-indigo-800 text-xs text-indigo-400 text-center overflow-hidden whitespace-nowrap">
        {!isSidebarCollapsed && <p>© 2025 EduTools AI</p>}
      </div>
    </div>
  );
};

export default Sidebar;
