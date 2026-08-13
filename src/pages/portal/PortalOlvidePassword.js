import React, { useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { KeyRound, Mail } from 'lucide-react';
import { portalService } from '../../services/api';
import {
  PortalCentered, PortalAuthCard, PortalButton, PortalInput, PortalLabel, PortalErrorMessage
} from '../../components/Portal/PortalUI';

const LogoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
`;

const LogoIcon = styled.div`
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #33A9FF 0%, #1E88E5 100%);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  box-shadow: 0 8px 24px rgba(51, 169, 255, 0.4);
  svg { width: 32px; height: 32px; color: white; }
`;

const AppName = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 4px 0;
  text-align: center;
`;

const AppTagline = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 8px;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  input { padding-left: 44px; }
`;

const InputIcon = styled.div`
  position: absolute;
  left: 14px;
  display: flex;
  svg { width: 18px; height: 18px; color: ${({ theme }) => theme.colors.textSecondary}; }
`;

const HelpText = styled.p`
  text-align: center;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 4px 0 0;
  a { color: ${({ theme }) => theme.colors.primary}; font-weight: 600; text-decoration: none; }
  a:hover { text-decoration: underline; }
`;

const SuccessBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  padding: 8px 0 4px;

  svg { width: 44px; height: 44px; color: ${({ theme }) => theme.colors.success || '#2E7D32'}; }
  p { font-size: 14px; color: ${({ theme }) => theme.colors.textSecondary}; margin: 0; }
`;

const PortalOlvidePassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Ingresa tu correo electrónico');
      return;
    }

    setIsLoading(true);
    try {
      // El backend responde igual (mensaje genérico) exista o no la cuenta,
      // para no revelar qué correos están registrados.
      await portalService.solicitarResetPassword(email);
      setEnviado(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PortalCentered>
      <PortalAuthCard>
        <LogoContainer>
          <LogoIcon><KeyRound /></LogoIcon>
          <AppName>Restablecer contraseña</AppName>
          <AppTagline>Te enviaremos un enlace a tu correo para definir una nueva contraseña</AppTagline>
        </LogoContainer>

        {enviado ? (
          <SuccessBox>
            <Mail />
            <p>
              Si existe una cuenta activa con <strong>{email}</strong>, te enviamos un correo con un enlace
              para restablecer tu contraseña. El enlace es válido durante 1 hora.
            </p>
            <HelpText style={{ marginTop: 8 }}>
              <Link to="/portal/login">Volver a iniciar sesión</Link>
            </HelpText>
          </SuccessBox>
        ) : (
          <Form onSubmit={handleSubmit}>
            {error && <PortalErrorMessage>{error}</PortalErrorMessage>}

            <div>
              <PortalLabel>Correo electrónico</PortalLabel>
              <InputWrapper>
                <InputIcon><Mail /></InputIcon>
                <PortalInput
                  type="email"
                  placeholder="El correo registrado en la clínica"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </InputWrapper>
            </div>

            <PortalButton type="submit" disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </PortalButton>

            <HelpText>
              ¿Ya la recordaste? <Link to="/portal/login">Inicia sesión</Link>
            </HelpText>
          </Form>
        )}
      </PortalAuthCard>
    </PortalCentered>
  );
};

export default PortalOlvidePassword;
