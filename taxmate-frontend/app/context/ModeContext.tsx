"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type UIMode = "simple" | "advanced";

interface ModeContextType {
  mode: UIMode;
  setMode: (mode: UIMode) => void;
  toggleMode: () => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export const ModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<UIMode>("simple");

  useEffect(() => {
    const savedMode = localStorage.getItem("taxmate_ui_mode") as UIMode;
    if (savedMode === "simple" || savedMode === "advanced") {
      setModeState(savedMode);
    }
  }, []);

  const setMode = (newMode: UIMode) => {
    setModeState(newMode);
    localStorage.setItem("taxmate_ui_mode", newMode);
  };

  const toggleMode = () => {
    setMode(mode === "simple" ? "advanced" : "simple");
  };

  return (
    <ModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ModeContext.Provider>
  );
};

export const useMode = () => {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error("useMode must be used within a ModeProvider");
  }
  return context;
};
