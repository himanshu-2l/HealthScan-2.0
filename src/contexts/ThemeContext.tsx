import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeType = 'violet' | 'blue' | 'purple' | 'cosmic';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  gradient: string;
  textGradient: string;
  border: string;
  glow: string;
}

interface ThemeConfig {
  [key: string]: ThemeColors;
}

const themes: ThemeConfig = {
  violet: {
    primary: '#8b5cf6', // violet-500
    secondary: '#a78bfa', // violet-400
    accent: '#c084fc', // violet-300
    gradient: 'from-violet-500 to-purple-600',
    textGradient: 'from-violet-400 to-purple-400',
    border: 'border-violet-500/50',
    glow: 'shadow-violet-500/20'
  },
  blue: {
    primary: '#3b82f6', // blue-500
    secondary: '#60a5fa', // blue-400
    accent: '#93c5fd', // blue-300
    gradient: 'from-blue-500 to-indigo-600',
    textGradient: 'from-blue-400 to-indigo-400',
    border: 'border-blue-500/50',
    glow: 'shadow-blue-500/20'
  },
  purple: {
    primary: '#9333ea', // purple-600
    secondary: '#a855f7', // purple-500
    accent: '#c084fc', // purple-400
    gradient: 'from-purple-600 to-pink-600',
    textGradient: 'from-purple-400 to-pink-400',
    border: 'border-purple-500/50',
    glow: 'shadow-purple-500/20'
  },
  cosmic: {
    primary: '#6366f1', // indigo-500
    secondary: '#8b5cf6', // violet-500
    accent: '#06b6d4', // cyan-500
    gradient: 'from-indigo-500 via-violet-500 to-cyan-500',
    textGradient: 'from-indigo-400 via-violet-400 to-cyan-400',
    border: 'border-indigo-500/50',
    glow: 'shadow-indigo-500/20'
  }
};

interface ThemeContextType {
  currentTheme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  colors: ThemeColors;
  themeNames: { [key in ThemeType]: string };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('violet');

  const themeNames = {
    violet: 'Violet Dream',
    blue: 'Ocean Blue', 
    purple: 'Royal Purple',
    cosmic: 'Cosmic Fusion'
  };

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('healthscan-theme') as ThemeType;
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Remove old theme classes
    Object.keys(themes).forEach(theme => {
      document.body.classList.remove(`theme-${theme}`);
    });
    // Add new theme class
    document.body.classList.add(`theme-${currentTheme}`);
  }, [currentTheme]);

  const setTheme = (theme: ThemeType) => {
    setCurrentTheme(theme);
    localStorage.setItem('healthscan-theme', theme);
  };

  const colors = themes[currentTheme];

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, colors, themeNames }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
