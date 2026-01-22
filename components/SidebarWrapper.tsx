"use client";
import React from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useApp } from "../contexts/AppContext";

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const { isSidebarCollapsed } = useApp();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isCollapsed={false} activeTab={""} setActiveTab={function (tab: string): void {
              throw new Error("Function not implemented.");
          } } />
      <div className={`flex-1 flex flex-col h-screen transition-all duration-300 ${isSidebarCollapsed ? "ml-16" : "ml-64"}`}>
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 relative">
          {children}
        </main>
      </div>
    </div>
  );
}