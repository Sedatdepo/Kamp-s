'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  branchColor: string;
  setBranchColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const branchThemes: Record<string, string> = {
  'Biyoloji': '142.1 76.2% 36.3%', // Green
  'Matematik': '221.2 83.2% 53.3%', // Blue
  'Edebiyat': '346.8 77.1% 49.8%', // Ruby/Pink
  'Fizik': '24.6 95% 53.1%', // Orange
  'Kimya': '173.4 80.4% 39.8%', // Teal/Cyan
  'default': '221.2 83.2% 53.3%', 
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [branchColor, setBranchColor] = useState<string>(branchThemes.default);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
       // Default to system preference if no saved theme
       // setTheme('dark'); 
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.style.setProperty('--primary', branchColor);
    root.style.setProperty('--ring', branchColor);
  }, [branchColor]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, branchColor, setBranchColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
