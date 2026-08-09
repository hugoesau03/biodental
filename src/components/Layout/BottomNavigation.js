import React from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, Users, Stethoscope, BarChart3 } from 'lucide-react';

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
  padding: 10px 0;
  padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
  padding-bottom: calc(10px + constant(safe-area-inset-bottom, 0px)); /* iOS < 11.2 */
  z-index: 9999;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
  will-change: transform;

  @media (min-width: 1024px) {
    display: none;
  }

  @supports (-webkit-touch-callout: none) {
    /* iOS specific fixes */
    padding-bottom: calc(10px + env(safe-area-inset-bottom, 20px));
  }
`;

const NavItem = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 6px 12px;
  cursor: pointer;
  transition: color 0.2s ease;
  flex: 1;
  max-width: 80px;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  user-select: none;

  svg {
    width: 26px;
    height: 26px;
    color: ${({ $active, theme }) => 
      $active ? theme.colors.primary : '#9E9E9E'};
    transition: color 0.2s ease;
    margin-bottom: 4px;
  }

  span {
    font-size: 11px;
    color: ${({ $active, theme }) => 
      $active ? theme.colors.primary : '#9E9E9E'};
    font-weight: ${({ $active, theme }) => 
      $active ? 600 : 500};
    letter-spacing: 0.2px;
  }

  /* Solo aplicar hover en dispositivos con mouse */
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      svg, span {
        color: ${({ theme }) => theme.colors.primary};
      }
    }
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    max-width: 100px;
    
    svg {
      width: 28px;
      height: 28px;
    }

    span {
      font-size: 12px;
    }
  }
`;

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/agenda', icon: Calendar, label: 'Agenda' },
    { path: '/pacientes', icon: Users, label: 'Pacientes' },
    { path: '/medicos', icon: Stethoscope, label: 'Médicos' },
    { path: '/reportes', icon: BarChart3, label: 'Reportes' },
  ];

  return (
    <NavContainer>
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
    </NavContainer>
  );
};

export default BottomNavigation;
