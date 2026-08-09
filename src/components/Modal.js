import React from 'react';
import styled from 'styled-components';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContainer = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.3s ease;
  color: ${({ theme }) => theme.colors.textSecondary};

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  text-align: center;
`;

const IconContainer = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  background: ${({ $type, theme }) => {
    switch ($type) {
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.danger;
      case 'warning':
        return theme.colors.warning;
      case 'info':
      default:
        return theme.colors.info;
    }
  }};

  svg {
    width: 32px;
    height: 32px;
    color: ${({ $type, theme }) => {
      switch ($type) {
        case 'success':
          return theme.colors.successText;
        case 'error':
          return theme.colors.dangerText;
        case 'warning':
          return theme.colors.warningText;
        case 'info':
        default:
          return theme.colors.infoText;
      }
    }};
  }
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 8px 0;
`;

const ModalMessage = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  line-height: 1.5;
`;

const ModalFooter = styled.div`
  display: flex;
  gap: 12px;
  padding: 0 20px 20px;
  justify-content: center;
`;

const Button = styled.button`
  flex: 1;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  max-width: 160px;

  &:active {
    transform: scale(0.98);
  }
`;

const PrimaryButton = styled(Button)`
  background: ${({ $type, theme }) => {
    switch ($type) {
      case 'success':
        return theme.colors.successText;
      case 'error':
        return theme.colors.dangerText;
      case 'warning':
        return theme.colors.warningText;
      default:
        return theme.colors.primary;
    }
  }};
  color: white;
  border: none;

  &:hover {
    opacity: 0.9;
  }
`;

const SecondaryButton = styled(Button)`
  background: ${({ theme }) => theme.colors.gray};
  color: ${({ theme }) => theme.colors.text};
  border: none;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`;

const getIcon = (type) => {
  switch (type) {
    case 'success':
      return <CheckCircle />;
    case 'error':
      return <AlertCircle />;
    case 'warning':
      return <AlertTriangle />;
    case 'info':
    default:
      return <Info />;
  }
};

const Modal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info', // 'info', 'success', 'warning', 'error'
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  showCancel = false,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <Overlay onClick={handleOverlayClick}>
      <ModalContainer>
        <ModalHeader>
          <div />
          <CloseButton onClick={onClose}>
            <X />
          </CloseButton>
        </ModalHeader>
        <ModalBody>
          <IconContainer $type={type}>
            {getIcon(type)}
          </IconContainer>
          <ModalTitle>{title}</ModalTitle>
          <ModalMessage>{message}</ModalMessage>
        </ModalBody>
        <ModalFooter>
          {showCancel && (
            <SecondaryButton onClick={onClose}>
              {cancelText}
            </SecondaryButton>
          )}
          <PrimaryButton $type={type} onClick={onConfirm || onClose}>
            {confirmText}
          </PrimaryButton>
        </ModalFooter>
      </ModalContainer>
    </Overlay>
  );
};

export default Modal;
