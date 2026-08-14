import styled from 'styled-components';

// Bloques de estilo compartidos por las páginas del portal de pacientes.
// El portal reutiliza el mismo ThemeProvider (claro/oscuro) que el resto de
// la app, así que hereda automáticamente el tema activo del usuario.

export const PortalPage = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  padding: 16px 16px calc(88px + env(safe-area-inset-bottom, 0px));
`;

export const PortalCentered = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #33A9FF 0%, #1E88E5 50%, #1565C0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

export const PortalAuthCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 24px;
  padding: 36px 28px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

export const PortalCard = styled.div`
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 14px;
`;

export const PortalSectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 4px 0 12px;
`;

export const PortalEmptyState = styled.div`
  text-align: center;
  padding: 32px 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const PortalButton = styled.button`
  width: 100%;
  padding: 14px;
  background: ${({ $variant, theme }) =>
    $variant === 'secondary' ? theme.colors.white : 'linear-gradient(135deg, #33A9FF 0%, #1E88E5 100%)'};
  color: ${({ $variant, theme }) => ($variant === 'secondary' ? theme.colors.primary : 'white')};
  border: ${({ $variant, theme }) => ($variant === 'secondary' ? `2px solid ${theme.colors.primary}` : 'none')};
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:not(:disabled):active {
    transform: scale(0.98);
  }
`;

export const PortalInput = styled.input`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: 14px 16px;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  font-size: 15px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};

  /* input[type=date/time] traen su propio selector nativo (reloj/calendario)
     cuyo ancho mínimo el navegador puede calcular más grande que el
     contenedor en pantallas angostas — esto evita que se desborde. */
  &[type="date"],
  &[type="time"],
  &[type="datetime-local"] {
    -webkit-min-logical-width: 0;
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.white};
  }
`;

export const PortalLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 6px;
`;

export const PortalErrorMessage = styled.div`
  background: ${({ theme }) => theme.colors.danger};
  color: ${({ theme }) => theme.colors.dangerText};
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
  margin-bottom: 16px;
`;

export const PortalBadge = styled.span`
  display: inline-block;
  padding: 3px 10px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  background: ${({ $color, theme }) => theme.colors[$color] || theme.colors.info};
  color: ${({ $color, theme }) => theme.colors[`${$color}Text`] || theme.colors.infoText};
`;
