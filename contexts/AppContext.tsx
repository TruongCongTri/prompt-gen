"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface AppContextType {
  // Sidebar State
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  
  // API State
  apiKey: string;
  setApiKey: (key: string) => void;
  model: string;
  setModel: (model: string) => void;
  connectionStatus: "idle" | "success" | "error";
  checkConnection: (key?: string) => Promise<void>;
  checkingModel: boolean;
  loading: boolean; // Global loading state if needed
  setLoading: (loading: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [apiKey, setApiKeyState] = useState("");
  const [model, setModel] = useState("gemini-3-flash-preview");
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [checkingModel, setCheckingModel] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedKey = localStorage.getItem("gemini_api_key");
      if (storedKey) {
        setApiKeyState(storedKey);
        checkConnection(storedKey);
      }
    }
  }, []);

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    localStorage.setItem("gemini_api_key", key);
    if (connectionStatus === "success") setConnectionStatus("idle");
  };

  const checkConnection = async (keyToTest?: string) => {
    const key = keyToTest || apiKey;
    if (!key) return;

    setCheckingModel(true);
    try {
      const genAI = new GoogleGenerativeAI(key);
      const aiModel = genAI.getGenerativeModel({ model });
      await aiModel.generateContent("Ping");
      setConnectionStatus("success");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Connection failed", err);
      setConnectionStatus("error");
    } finally {
      setCheckingModel(false);
    }
  };

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  return (
    <AppContext.Provider value={{
      isSidebarCollapsed,
      toggleSidebar,
      apiKey,
      setApiKey,
      model,
      setModel,
      connectionStatus,
      checkConnection,
      checkingModel,
      loading,
      setLoading
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};