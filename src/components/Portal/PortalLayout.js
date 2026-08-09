import React from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Home, CalendarPlus, History, Wallet, Gift, LogOut, Loader } from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  background: ${({ theme }) => theme.colors.white};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Greeting = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};

  span {
    display: block;
    font-size: 12px;
    font-weight: 400;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const LogoutButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  color: ${({ theme }) => theme.colors.textSecondary};

  svg { width: 20px; height: 20px; }
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
      <Greeting>
        {paciente ? `Hola, ${paciente.nombre}` : 'Portal del paciente'}
        <span>Biodental</span>
      </Greeting>
      <LogoutButton onClick={handleLogout} title="Cerrar sesión">
        <LogOut />
      </LogoutButton>
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
      <PortalBottomNav />
    </>
  );
};
