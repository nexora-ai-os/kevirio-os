import React, { createContext, useContext, useMemo } from "react";

const ThemeContext = createContext(Object.freeze({ theme: "light" }));

export function ThemeProvider({ children, className = "" }) {
  const value = useMemo(() => Object.freeze({ theme: "light" }), []);
  return <ThemeContext.Provider value={value}><div className={`kv-theme ${className}`.trim()} data-kevirio-theme="light">{children}</div></ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
