import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificacionesService } from '../services/api';
import { useAuth } from './AuthContext';

const NotificacionesContext = createContext(null);

export const useNotificaciones = () => {
  const context = useContext(NotificacionesContext);
  if (!context) {
    throw new Error('useNotificaciones debe usarse dentro de un NotificacionesProvider');
  }
  return context;
};

export const NotificacionesProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [loading, setLoading] = useState(false);

  // Cargar notificaciones
  const fetchNotificaciones = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await notificacionesService.getAll();
      if (response.success) {
        setNotificaciones(response.data.notificaciones);
        setNoLeidas(response.data.no_leidas);
      }
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Cargar conteo de no leídas
  const fetchConteo = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await notificacionesService.getConteo();
      if (response.success) {
        setNoLeidas(response.data.no_leidas);
      }
    } catch (err) {
      console.error('Error cargando conteo:', err);
    }
  }, [isAuthenticated]);

  // Marcar como leída
  const marcarLeida = useCallback(async (id) => {
    try {
      await notificacionesService.marcarLeida(id);
      setNotificaciones(prev => 
        prev.map(n => n.id === id ? { ...n, leida: true } : n)
      );
      setNoLeidas(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marcando notificación:', err);
    }
  }, []);

  // Marcar todas como leídas
  const marcarTodasLeidas = useCallback(async () => {
    try {
      await notificacionesService.marcarTodasLeidas();
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      setNoLeidas(0);
    } catch (err) {
      console.error('Error marcando notificaciones:', err);
    }
  }, []);

  // Eliminar notificación
  const eliminar = useCallback(async (id) => {
    try {
      await notificacionesService.delete(id);
      const notif = notificaciones.find(n => n.id === id);
      setNotificaciones(prev => prev.filter(n => n.id !== id));
      if (notif && !notif.leida) {
        setNoLeidas(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error eliminando notificación:', err);
    }
  }, [notificaciones]);

  // Limpiar todas las notificaciones
  const limpiarTodas = useCallback(async () => {
    try {
      await notificacionesService.limpiarTodas();
      setNotificaciones([]);
      setNoLeidas(0);
      return true;
    } catch (err) {
      console.error('Error limpiando notificaciones:', err);
      return false;
    }
  }, []);

  // Cargar al autenticarse
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotificaciones();
    } else {
      setNotificaciones([]);
      setNoLeidas(0);
    }
  }, [isAuthenticated, fetchNotificaciones]);

  // Polling para nuevas notificaciones (cada 30 segundos)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(fetchNotificaciones, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchNotificaciones]);

  const value = {
    notificaciones,
    noLeidas,
    loading,
    fetchNotificaciones,
    marcarLeida,
    marcarTodasLeidas,
    eliminar,
    limpiarTodas
  };

  return (
    <NotificacionesContext.Provider value={value}>
      {children}
    </NotificacionesContext.Provider>
  );
};

export default NotificacionesContext;
