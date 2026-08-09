import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar si hay una sesión guardada al cargar
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('biodental_token') || sessionStorage.getItem('biodental_token');
      
      if (token) {
        try {
          const response = await authService.getMe();
          if (response.success && response.data?.usuario) {
            setUser(response.data.usuario);
          }
        } catch (err) {
          // Token inválido, limpiar
          localStorage.removeItem('biodental_token');
          sessionStorage.removeItem('biodental_token');
          localStorage.removeItem('biodental_user');
          sessionStorage.removeItem('biodental_user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email, password, rememberMe = false) => {
    setError(null);
    setLoading(true);

    try {
      const response = await authService.login(email, password);
      console.log('Login response:', response); // Debug
      
      if (response.success) {
        const { token, usuario } = response.data;
        
        // Guardar token y usuario
        if (rememberMe) {
          localStorage.setItem('biodental_token', token);
          localStorage.setItem('biodental_user', JSON.stringify(usuario));
        } else {
          sessionStorage.setItem('biodental_token', token);
          sessionStorage.setItem('biodental_user', JSON.stringify(usuario));
        }
        
        setUser(usuario);
        setLoading(false);
        return { success: true };
      } else {
        setError(response.message || 'Error al iniciar sesión');
        setLoading(false);
        return { success: false, message: response.message };
      }
    } catch (err) {
      console.error('Login error:', err); // Debug
      const message = err.response?.data?.message || err.message || 'Error al conectar con el servidor';
      setError(message);
      setLoading(false);
      return { success: false, message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('biodental_token');
    sessionStorage.removeItem('biodental_token');
    localStorage.removeItem('biodental_user');
    sessionStorage.removeItem('biodental_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(userData);
    // Actualizar en storage
    if (localStorage.getItem('biodental_token')) {
      localStorage.setItem('biodental_user', JSON.stringify(userData));
    } else {
      sessionStorage.setItem('biodental_user', JSON.stringify(userData));
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
