import React, { createContext, useContext, useState, useEffect } from 'react';
import { lightTheme, darkTheme } from '../styles/theme';

const ThemeContext = createContext();

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider');
  }
  return context;
};

export const ThemeModeProvider = ({ children }) => {
  // Intentar leer preferencia guardada o usar preferencia del sistema
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('biodental-dark-mode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    // Verificar preferencia del sistema
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Guardar preferencia cuando cambie
  useEffect(() => {
    localStorage.setItem('biodental-dark-mode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  const value = {
    isDarkMode,
    toggleDarkMode,
    theme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
