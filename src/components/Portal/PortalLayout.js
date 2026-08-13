import React from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Home, CalendarPlus, History, Wallet, Gift, LogOut, Loader, Stethoscope, User, HelpCircle } from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import PortalChatBubble from './PortalChatBubble';

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  background: linear-gradient(135deg, #33A9FF 0%, #1E88E5 100%);
  box-shadow: 0 2px 10px rgba(30, 136, 229, 0.3);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LogoIcon = styled.div`
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg { width: 20px; height: 20px; color: white; }
`;

const Greeting = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: white;

  span {
    display: block;
    font-size: 12px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.85);
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const HeaderIconButton = styled.button`
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  padding: 8px;
  display: flex;
  color: white;

  svg { width: 20px; height: 20px; }
`;

const LogoutButton = styled(HeaderIconButton)`
  &:hover { color: ${({ theme }) => theme.colors.dangerText}; }
`;

const NavContainer = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: ${({ theme }) => theme.colors.white};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 10px 0 calc(10px + env(safe-area-inset-bottom, 0px));
  z-index: 9999;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
`;

const NavItem = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 6px 10px;
  cursor: pointer;
  flex: 1;
  max-width: 80px;

  svg {
    width: 24px;
    height: 24px;
    color: ${({ $active, theme }) => ($active ? theme.colors.primary : '#9E9E9E')};
    margin-bottom: 4px;
  }

  span {
    font-size: 10.5px;
    color: ${({ $active, theme }) => ($active ? theme.colors.primary : '#9E9E9E')};
    font-weight: ${({ $active }) => ($active ? 600 : 500)};
  }
`;

const LoaderScreen = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  gap: 12px;
`;

const navItems = [
  { path: '/portal', icon: Home, label: 'Inicio' },
  { path: '/portal/reservar', icon: CalendarPlus, label: 'Reservar' },
  { path: '/portal/historial', icon: History, label: 'Historial' },
  { path: '/portal/cuenta', icon: Wallet, label: 'Cuenta' },
  { path: '/portal/recompensas', icon: Gift, label: 'Puntos' },
  { path: '/portal/perfil', icon: User, label: 'Perfil' },
];

export const PortalHeader = () => {
  const { paciente, logout } = usePortalAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/portal/login');
  };

  return (
    <Header>
      <HeaderLeft>
        <LogoIcon>
          <Stethoscope />
        </LogoIcon>
        <Greeting>
          {paciente ? `Hola, ${paciente.nombre}` : 'Portal del paciente'}
          <span>Bio Dental</span>
        </Greeting>
      </HeaderLeft>
      <HeaderRight>
        <HeaderIconButton onClick={() => navigate('/portal/faq')} title="Preguntas frecuentes">
          <HelpCircle />
        </HeaderIconButton>
        <LogoutButton onClick={handleLogout} title="Cerrar sesión">
          <LogOut />
        </LogoutButton>
      </HeaderRight>
    </Header>
  );
};

export const PortalBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <NavContainer>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <NavItem key={item.path} $active={isActive} onClick={() => navigate(item.path)}>
            <Icon />
            <span>{item.label}</span>
          </NavItem>
        );
      })}
    </NavContainer>
  );
};

export const PortalProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = usePortalAuth();

  if (loading) {
    return (
      <LoaderScreen>
        <Loader style={{ animation: 'spin 1s linear infinite', width: 40, height: 40, color: '#33A9FF' }} />
      </LoaderScreen>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/portal/login" replace />;
  }

  return (
    <>
      <PortalHeader />
      {children}
      <PortalChatBubble />
      <PortalBottomNav />
    </>
  );
};
