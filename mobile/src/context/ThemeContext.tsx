// TradeFlow Mobile — Theme Context (Dark Mode & Light Mode Provider)
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DARK_THEME, LIGHT_THEME, ThemeType } from '../styles/theme';

interface ThemeContextType {
  theme: ThemeType;
  isDarkMode: boolean;
  setDarkMode: (val: boolean) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: DARK_THEME,
  isDarkMode: true,
  setDarkMode: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const setDarkMode = (val: boolean) => {
    setIsDarkMode(val);
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, setDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
