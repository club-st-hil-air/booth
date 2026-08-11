import React, { createContext, useContext, useRef, useCallback } from 'react';
import { Sun, Moon } from 'lucide-react';
import { lightColors, darkColors, typography, spacing, radius, layout, ThemeColors } from './theme';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  isDark: boolean;
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  layout: typeof layout;
}

const STORAGE_THEME_KEY = 'stand_consult_theme_v1';

function getInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_THEME_KEY) as ThemeMode;
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  return 'dark';
}

const initialTheme = getInitialTheme();

const ThemeContext = createContext<ThemeContextType>({
  theme: initialTheme,
  toggleTheme: () => {},
  isDark: initialTheme === 'dark',
  colors: initialTheme === 'dark' ? darkColors : lightColors,
  typography, spacing, radius, layout,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const themeRef = useRef<ThemeMode>(initialTheme);

  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', themeRef.current);
  }

  const toggleTheme = useCallback(() => {
    const next = themeRef.current === 'dark' ? 'light' : 'dark';
    themeRef.current = next;
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(STORAGE_THEME_KEY, next); } catch {}
    // Force re-render only the toggle button via DOM
    const btn = document.querySelector('.theme-toggle');
    if (btn) btn.dispatchEvent(new Event('themechange'));
  }, []);

  const value: ThemeContextType = {
    theme: themeRef.current,
    toggleTheme,
    isDark: themeRef.current === 'dark',
    colors: themeRef.current === 'dark' ? darkColors : lightColors,
    typography, spacing, radius, layout,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

export const ThemeToggleBtn: React.FC = () => {
  const { toggleTheme } = useTheme();
  const [, forceUpdate] = React.useState(0);

  React.useEffect(() => {
    const btn = document.querySelector('.theme-toggle');
    const handler = () => forceUpdate(n => n + 1);
    btn?.addEventListener('themechange', handler);
    return () => btn?.removeEventListener('themechange', handler);
  }, []);

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  return (
    <button className="theme-toggle" onClick={toggleTheme} aria-label="Basculer Mode Clair / Mode Sombre">
      {isDark ? <Sun size={17} color="#fbbf24" /> : <Moon size={17} color="var(--accent)" />}
    </button>
  );
};
