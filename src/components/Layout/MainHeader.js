import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, User, X, Calendar, AlertCircle, CheckCircle, Home, Users, Stethoscope, BarChart3, Package, AlertTriangle, Trash2 } from 'lucide-react';
import { useNotificaciones } from '../../context/NotificacionesContext';
import { useAuth } from '../../context/AuthContext';

const HeaderContainer = styled.div`
  background: ${({ theme }) => theme.colors.white};
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;

  @media (min-width: 1024px) {
    padding: 12px 40px;
  }
`;

const Logo = styled.h1`
  font-size: 24px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  letter-spacing: -0.3px;
  cursor: pointer;
`;

const DesktopNav = styled.nav`
  display: none;
  gap: 8px;

  @media (min-width: 1024px) {
    display: flex;
  }
`;

const NavItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${({ $active, theme }) => $active ? theme.colors.info : 'transparent'};
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  svg {
    width: 20px;
    height: 20px;
    color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.textSecondary};
  }

  span {
    font-size: 14px;
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.text};
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: ${({ theme }) => theme.colors.info};
      
      svg, span {
        color: ${({ theme }) => theme.colors.primary};
      }
    }
  }
`;

const IconsContainer = styled.div`
  display: flex;
  gap: 12px;
  position: static;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.borderRadius.round};
  transition: background 0.2s ease;
  position: relative;

  svg {
    width: 24px;
    height: 24px;
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: ${({ theme }) => theme.colors.gray};
    }
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: 4px;
  right: 4px;
  background: ${({ theme }) => theme.colors.dangerText};
  color: white;
  font-size: 10px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  min-width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
`;

const NotificationsDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 20px;
  width: 320px;
  max-height: 450px;
  background: ${({ theme }) => theme.colors.white};
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  margin-top: 8px;
  z-index: 9999;
  opacity: ${({ $isVisible }) => $isVisible ? '1' : '0'};
  transform: ${({ $isVisible }) => $isVisible ? 'translateY(0)' : 'translateY(-10px)'};
  visibility: ${({ $isVisible }) => $isVisible ? 'visible' : 'hidden'};
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
`;

const NotificationsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const NotificationsTitle = styled.h3`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s ease, color 0.2s ease;

  svg {
    width: 18px;
    height: 18px;
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: ${({ theme }) => theme.colors.gray};
      color: ${({ theme }) => theme.colors.text};
    }
  }
`;

const NotificationsList = styled.div`
  max-height: 300px;
  overflow-y: auto;
  flex: 1;
`;

const NotificationItem = styled.div`
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  cursor: pointer;
  transition: background 0.2s ease;
  background: ${({ $unread, theme }) => $unread ? theme.colors.info : 'transparent'};

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: ${({ theme }) => theme.colors.gray};
    }
  }

  &:last-child {
    border-bottom: none;
  }
`;

const NotificationIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${({ $type, theme }) => {
    switch ($type) {
      case 'appointment':
        return theme.colors.info;
      case 'alert':
        return theme.colors.warning;
      case 'success':
        return theme.colors.success;
      default:
        return theme.colors.gray;
    }
  }};

  svg {
    width: 20px;
    height: 20px;
    color: ${({ $type, theme }) => {
      switch ($type) {
        case 'appointment':
          return theme.colors.primary;
        case 'alert':
          return theme.colors.warningText;
        case 'success':
          return theme.colors.successText;
        default:
          return theme.colors.textSecondary;
      }
    }};
  }
`;

const NotificationContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const NotificationText = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 4px 0;
  line-height: 1.4;
`;

const NotificationTime = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const EmptyNotifications = styled.div`
  padding: 40px 20px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};

  svg {
    width: 48px;
    height: 48px;
    margin-bottom: 12px;
    opacity: 0.5;
  }

  p {
    font-size: 14px;
    margin: 0;
  }
`;

const MarkAllRead = styled.button`
  flex: 1;
  padding: 12px;
  background: ${({ theme }) => theme.colors.gray};
  border: none;
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  transition: background 0.2s ease;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: ${({ theme }) => theme.colors.info};
    }
  }
`;

const ClearAllButton = styled.button`
  flex: 1;
  padding: 12px;
  background: ${({ theme }) => theme.colors.gray};
  border: none;
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.error};
  cursor: pointer;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  svg {
    width: 16px;
    height: 16px;
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: ${({ theme }) => theme.colors.errorLight || '#FEE2E2'};
    }
  }
`;

const NotificationsFooter = styled.div`
  display: flex;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0 0 12px 12px;
  overflow: hidden;
  flex-shrink: 0;
`;

const ConfirmModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
`;

const ConfirmModalContent = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  padding: 24px;
  max-width: 320px;
  width: 100%;
  text-align: center;
`;

const ConfirmModalTitle = styled.h3`
  font-size: 18px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 8px 0;
`;

const ConfirmModalText = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 24px 0;
`;

const ConfirmModalButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const ConfirmButton = styled.button`
  flex: 1;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  
  ${({ $variant, theme }) => $variant === 'danger' ? `
    background: ${theme.colors.error};
    color: white;
    
    &:hover {
      background: #DC2626;
    }
  ` : `
    background: ${theme.colors.gray};
    color: ${theme.colors.text};
    
    &:hover {
      background: ${theme.colors.border};
    }
  `}
`;

const UserIcon = styled(IconButton)`
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  width: 40px;
  height: 40px;
  overflow: hidden;
  padding: 0;
  border-radius: 50%;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: ${({ theme }) => theme.colors.primaryDark};
    }
  }
`;

const MainHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const notificationsRef = useRef(null);
  
  // Usar contexto de autenticación
  const { user } = useAuth();
  
  // Usar contexto de notificaciones
  const { 
    notificaciones, 
    noLeidas, 
    marcarLeida, 
    marcarTodasLeidas,
    limpiarTodas,
    fetchNotificaciones
  } = useNotificaciones();

  const navItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/agenda', icon: Calendar, label: 'Agenda' },
    { path: '/pacientes', icon: Users, label: 'Pacientes' },
    { path: '/medicos', icon: Stethoscope, label: 'Médicos' },
    { path: '/reportes', icon: BarChart3, label: 'Reportes' },
  ];

  const toggleNotifications = () => {
    setShowNotifications(prev => {
      // Al abrir el dropdown, recargar las notificaciones
      if (!prev) {
        fetchNotificaciones();
      }
      return !prev;
    });
  };

  const markAllAsRead = () => {
    marcarTodasLeidas();
  };

  const handleClearAll = () => {
    setShowConfirmClear(true);
  };

  const confirmClearAll = async () => {
    await limpiarTodas();
    setShowConfirmClear(false);
    setShowNotifications(false);
  };

  const handleNotificationClick = (notification) => {
    marcarLeida(notification.id);
    if (notification.enlace) {
      navigate(notification.enlace);
      setShowNotifications(false);
    }
  };

  const getNotificationIcon = (tipo) => {
    switch (tipo) {
      case 'cita':
        return <Calendar />;
      case 'inventario':
        return <Package />;
      case 'alerta':
        return <AlertTriangle />;
      case 'sistema':
        return <AlertCircle />;
      default:
        return <Bell />;
    }
  };

  const formatTime = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins} min`;
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  };

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  return (
    <HeaderContainer>
      <Logo onClick={() => navigate('/')}>Biodental</Logo>
      
      <DesktopNav>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <NavItem
              key={item.path}
              $active={isActive}
              onClick={() => navigate(item.path)}
            >
              <Icon />
              <span>{item.label}</span>
            </NavItem>
          );
        })}
      </DesktopNav>

      <IconsContainer>
        <div ref={notificationsRef} style={{ position: 'relative' }}>
          <IconButton onClick={toggleNotifications}>
            <Bell />
            {noLeidas > 0 && <NotificationBadge>{noLeidas}</NotificationBadge>}
          </IconButton>
        </div>
        <UserIcon onClick={() => navigate('/perfil')}>
          {user?.avatar_blob ? (
            <img src={user.avatar_blob} alt={user.nombre} />
          ) : user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.nombre} />
          ) : (
            <User size={20} />
          )}
        </UserIcon>
      </IconsContainer>
      
      <NotificationsDropdown $isVisible={showNotifications}>
        <NotificationsHeader>
          <NotificationsTitle>Notificaciones</NotificationsTitle>
          <CloseButton onClick={() => setShowNotifications(false)}>
            <X />
          </CloseButton>
        </NotificationsHeader>
        
        <NotificationsList>
          {notificaciones.length > 0 ? (
            notificaciones.map(notification => (
              <NotificationItem 
                key={notification.id} 
                $unread={!notification.leida}
                onClick={() => handleNotificationClick(notification)}
                style={{ cursor: notification.enlace ? 'pointer' : 'default' }}
              >
                <NotificationIcon $type={notification.tipo}>
                  {getNotificationIcon(notification.tipo)}
                </NotificationIcon>
                <NotificationContent>
                  <NotificationText>
                    <strong>{notification.titulo}</strong>
                    <br />
                    {notification.mensaje}
                  </NotificationText>
                  <NotificationTime>{formatTime(notification.fecha_creacion)}</NotificationTime>
                </NotificationContent>
              </NotificationItem>
            ))
          ) : (
            <EmptyNotifications>
              <Bell />
              <p>No hay notificaciones</p>
            </EmptyNotifications>
          )}
        </NotificationsList>
        
        {notificaciones.length > 0 && (
          <NotificationsFooter>
            {noLeidas > 0 && (
              <MarkAllRead onClick={markAllAsRead}>
                Marcar leídas
              </MarkAllRead>
            )}
            <ClearAllButton onClick={handleClearAll}>
              <Trash2 />
              Limpiar
            </ClearAllButton>
          </NotificationsFooter>
        )}
      </NotificationsDropdown>

      {showConfirmClear && (
        <ConfirmModal onClick={() => setShowConfirmClear(false)}>
          <ConfirmModalContent onClick={(e) => e.stopPropagation()}>
            <ConfirmModalTitle>Limpiar notificaciones</ConfirmModalTitle>
            <ConfirmModalText>
              ¿Estás seguro de eliminar todas las notificaciones? Esta acción no se puede deshacer.
            </ConfirmModalText>
            <ConfirmModalButtons>
              <ConfirmButton onClick={() => setShowConfirmClear(false)}>
                Cancelar
              </ConfirmButton>
              <ConfirmButton $variant="danger" onClick={confirmClearAll}>
                Eliminar
              </ConfirmButton>
            </ConfirmModalButtons>
          </ConfirmModalContent>
        </ConfirmModal>
      )}
    </HeaderContainer>
  );
};

export default MainHeader;
