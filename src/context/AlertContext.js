import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000;
  padding: 20px;
`;

const Panel = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 18px;
  width: 100%;
  max-width: 360px;
  padding: 24px 22px 20px;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
`;

const IconCircle = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $tipo }) => {
    switch ($tipo) {
      case 'error': return '#FFEBEE';
      case 'success': return '#E8F5E9';
      case 'warning': return '#FFF8E1';
      default: return '#E3F2FD';
    }
  }};

  svg {
    width: 26px;
    height: 26px;
    color: ${({ $tipo }) => {
      switch ($tipo) {
        case 'error': return '#E53935';
        case 'success': return '#2E7D32';
        case 'warning': return '#F9A825';
        default: return '#1E88E5';
      }
    }};
  }
`;

const Mensaje = styled.p`
  font-size: 14.5px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 20px;
  white-space: pre-line;
`;

const ButtonsRow = styled.div`
  display: flex;
  gap: 10px;
`;

const Btn = styled.button`
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
`;

const BtnPrimary = styled(Btn)`
  background: linear-gradient(135deg, #33A9FF 0%, #1E88E5 100%);
  color: white;
`;

const BtnSecondary = styled(Btn)`
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const iconosPorTipo = {
  error: XCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info
};

/**
 * Reemplazo en el estilo visual de la app para window.alert()/confirm().
 * showAlert(mensaje, { tipo }) — un solo botón "Aceptar".
 * showConfirm(mensaje, { tipo, confirmText, cancelText }) — Promise<boolean>.
 * No hay toasts/notificaciones nativas del navegador en ninguna pantalla.
 */
export const AlertProvider = ({ children }) => {
  const [dialogo, setDialogo] = useState(null);
  const resolverRef = useRef(null);

  const showAlert = useCallback((mensaje, opciones = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogo({
        mensaje,
        tipo: opciones.tipo || 'info',
        esConfirmacion: false,
        confirmText: opciones.confirmText || 'Aceptar'
      });
    });
  }, []);

  const showConfirm = useCallback((mensaje, opciones = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogo({
        mensaje,
        tipo: opciones.tipo || 'warning',
        esConfirmacion: true,
        confirmText: opciones.confirmText || 'Confirmar',
        cancelText: opciones.cancelText || 'Cancelar'
      });
    });
  }, []);

  const cerrar = (resultado) => {
    if (resolverRef.current) resolverRef.current(resultado);
    resolverRef.current = null;
    setDialogo(null);
  };

  const Icono = dialogo ? (iconosPorTipo[dialogo.tipo] || Info) : Info;

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {dialogo && (
        <Overlay onClick={() => cerrar(dialogo.esConfirmacion ? false : true)}>
          <Panel onClick={(e) => e.stopPropagation()}>
            <IconCircle $tipo={dialogo.tipo}>
              <Icono />
            </IconCircle>
            <Mensaje>{dialogo.mensaje}</Mensaje>
            {dialogo.esConfirmacion ? (
              <ButtonsRow>
                <BtnSecondary onClick={() => cerrar(false)}>{dialogo.cancelText}</BtnSecondary>
                <BtnPrimary onClick={() => cerrar(true)}>{dialogo.confirmText}</BtnPrimary>
              </ButtonsRow>
            ) : (
              <BtnPrimary style={{ width: '100%' }} onClick={() => cerrar(true)}>
                {dialogo.confirmText}
              </BtnPrimary>
            )}
          </Panel>
        </Overlay>
      )}
    </AlertContext.Provider>
  );
};

export default AlertContext;
