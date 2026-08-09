import React from 'react';
import styled from 'styled-components';
import { Plus } from 'lucide-react';

const Button = styled.button`
  position: fixed;
  bottom: 92px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 999;

  svg {
    width: 28px;
    height: 28px;
  }

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 12px 20px rgba(51, 169, 255, 0.4);
  }

  &:active {
    transform: scale(0.95);
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: 64px;
    height: 64px;
    bottom: 100px;
    right: 32px;

    svg {
      width: 32px;
      height: 32px;
    }
  }
`;

const FloatingButton = ({ onClick }) => {
  return (
    <Button onClick={onClick}>
      <Plus />
    </Button>
  );
};

export default FloatingButton;
