import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { lightTheme, darkTheme } from '../styles/theme';

const ThemeContext = createContext();

const APARIENCIA_KEY = 'biodental-apariencia';

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

  // Personalización de marca del consultorio (Apariencia): colores de
  // fondo/principal/fuente y el ícono/logo de la app. Se cachea en
  // localStorage para aplicarse de inmediato al recargar, sin esperar a
  // que AppLayout la vuelva a traer del backend tras iniciar sesión.
  const [apariencia, setAparienciaState] = useState(() => {
    try {
      const saved = localStorage.getItem(APARIENCIA_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Guardar preferencia cuando cambie
  useEffect(() => {
    localStorage.setItem('biodental-dark-mode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const setApariencia = (data) => {
    const nueva = data || {};
    setAparienciaState(nueva);
    localStorage.setItem(APARIENCIA_KEY, JSON.stringify(nueva));
  };

  const baseTheme = isDarkMode ? darkTheme : lightTheme;

  // Los overrides solo tocan las 3 llaves que Apariencia permite
  // personalizar; todo lo demás (sombras, spacing, tipografía, etc.)
  // se conserva del tema base claro/oscuro.
  const theme = useMemo(() => {
    if (!apariencia.color_fondo && !apariencia.color_principal && !apariencia.color_texto) {
      return baseTheme;
    }
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        ...(apariencia.color_principal ? { primary: apariencia.color_principal } : {}),
        ...(apariencia.color_fondo ? { background: apariencia.color_fondo } : {}),
        ...(apariencia.color_texto ? { text: apariencia.color_texto } : {})
      }
    };
  }, [baseTheme, apariencia]);

  const value = {
    isDarkMode,
    toggleDarkMode,
    theme,
    apariencia,
    setApariencia,
    logoBlob: apariencia.logo_blob || null
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
