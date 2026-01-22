"use client";
import React from "react";
import { Menu, ChevronLeft, Loader2, Wifi } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import ModelSelector from "@/components/ModelSelector"; // Ensure this component is imported
import { usePathname } from "next/navigation";

const Header = () => {
  const { 
    isSidebarCollapsed, 
    toggleSidebar, 
    apiKey, 
    setApiKey, 
    connectionStatus, 
    checkConnection, 
    checkingModel, 
    loading,
    model,
    setModel 
  } = useApp();

  const pathname = usePathname();

  // Determine Title based on Path
  const getTitle = () => {
    if (pathname === "/") return "Tổng Quan & Thống Kê";
    if (pathname.startsWith("/test-generator")) return "Tạo Đề Thi";
    if (pathname.startsWith("/lesson-plan")) return "Soạn Giáo Án";
    if (pathname.startsWith("/class-management")) return "Quản Lý Lớp";
    if (pathname.startsWith("/student-evaluation")) return "Đánh Giá Học Sinh";
    return "EduTools";
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between pl-4 pr-10 sticky top-0 z-40 shadow-sm flex-shrink-0">
       {/* Left: Toggle & Title */}
       <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar} 
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            {isSidebarCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
          <h1 className="font-bold text-lg text-indigo-900 uppercase tracking-wide hidden md:block">
            {getTitle()}
          </h1>
       </div>

       {/* Right: Global API Controls */}
       <div className="flex items-center gap-2">
          <ModelSelector 
            value={model}
            onChange={setModel}
            disabled={loading || checkingModel}
          />

          <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all ${connectionStatus === "success" ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"} ${loading || checkingModel ? "opacity-50 pointer-events-none" : ""}`}>
             {connectionStatus === "success" ? (
                <div className="flex items-center gap-2">
                    <span className="hidden md:inline text-xs font-bold text-emerald-700">Đã kết nối</span>
                    <button onClick={() => setApiKey("") /* Logic to reset needs simple clear in this context for now */} className="text-[10px] bg-white text-emerald-700 border border-emerald-200 px-2 py-1 rounded font-bold whitespace-nowrap">Đổi Key</button>
                </div>
             ) : (
                <>
                    <input 
                      type="password" 
                      placeholder="Nhập API Key..." 
                      value={apiKey} 
                      onChange={(e) => setApiKey(e.target.value)} 
                      disabled={loading || checkingModel} 
                      onKeyDown={(e) => e.key === "Enter" && checkConnection()} 
                      className="outline-none text-xs w-24 md:w-32 bg-transparent" 
                    />
                    <button 
                      onClick={() => checkConnection()} 
                      disabled={checkingModel || !apiKey || loading} 
                      className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {checkingModel ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />}
                    </button>
                </>
             )}
          </div>
       </div>
    </header>
  );
};

export default Header;