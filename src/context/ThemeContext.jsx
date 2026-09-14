import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('smartfarm-theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
      if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
        return 'dark';
      }
    } catch (e) {
      // Ignore localStorage access errors
    }
    return 'light'; // Default is Light
  });

  const applyThemeToDom = (newTheme) => {
    if (typeof document === 'undefined') return;
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem('smartfarm-theme', newTheme);
    } catch (e) {
      console.warn('[ThemeContext] Could not persist theme:', e);
    }
  };

  const setTheme = (newTheme) => {
    const targetTheme = newTheme === 'dark' ? 'dark' : 'light';
    applyThemeToDom(targetTheme);
    setThemeState(targetTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      applyThemeToDom(nextTheme);
      return nextTheme;
    });
  };

  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
