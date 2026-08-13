import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { portalService } from '../services/api';

const PortalAuthContext = createContext(null);

export const usePortalAuth = () => {
  const context = useContext(PortalAuthContext);
  if (!context) {
    throw new Error('usePortalAuth debe usarse dentro de un PortalAuthProvider');
  }
  return context;
};

export const PortalAuthProvider = ({ children }) => {
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('biodental_portal_token') || sessionStorage.getItem('biodental_portal_token');

      if (token) {
        try {
          const response = await portalService.getMe();
          if (response.success && response.data?.paciente) {
            setPaciente(response.data.paciente);
          }
        } catch (err) {
          localStorage.removeItem('biodental_portal_token');
          sessionStorage.removeItem('biodental_portal_token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const guardarSesion = useCallback((token, pacienteData, rememberMe = true) => {
    if (rememberMe) {
      localStorage.setItem('biodental_portal_token', token);
    } else {
      sessionStorage.setItem('biodental_portal_token', token);
    }
    setPaciente(pacienteData);
  }, []);

  const login = useCallback(async (telefono, password, rememberMe = true) => {
    setError(null);
    setLoading(true);
    try {
      const response = await portalService.login(telefono, password);
      if (response.success) {
        guardarSesion(response.data.token, response.data.paciente, rememberMe);
        setLoading(false);
        return { success: true };
      }
      setError(response.message || 'Error al iniciar sesión');
      setLoading(false);
      return { success: false, message: response.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Error al conectar con el servidor';
      setError(message);
      setLoading(false);
      return { success: false, message };
    }
  }, [guardarSesion]);

  const registro = useCallback(async (data) => {
    setError(null);
    setLoading(true);
    try {
      const response = await portalService.registro(data);
      if (response.success) {
        guardarSesion(response.data.token, response.data.paciente, true);
        setLoading(false);
        return { success: true };
      }
      setError(response.message || 'Error al activar el acceso');
      setLoading(false);
      return { success: false, message: response.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Error al conectar con el servidor';
      setError(message);
      setLoading(false);
      return { success: false, message };
    }
  }, [guardarSesion]);

  const logout = useCallback(async () => {
    // Avisar al backend antes de borrar el token localmente — ver el
    // mismo comentario en AuthContext.logout.
    try {
      await portalService.logout();
    } catch (err) {
      // Silencioso a propósito — el logout local sigue de todas formas
    }

    localStorage.removeItem('biodental_portal_token');
    sessionStorage.removeItem('biodental_portal_token');
    setPaciente(null);
  }, []);

  const value = {
    paciente,
    loading,
    error,
    isAuthenticated: !!paciente,
    login,
    registro,
    logout,
    clearError: () => setError(null)
  };

  return (
    <PortalAuthContext.Provider value={value}>
      {children}
    </PortalAuthContext.Provider>
  );
};

export default PortalAuthContext;
