import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Heart, Lock, Phone } from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import {
  PortalCentered, PortalAuthCard, PortalButton, PortalInput, PortalLabel, PortalErrorMessage
} from '../../components/Portal/PortalUI';

const LogoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 28px;
`;

const LogoIcon = styled.div`
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #33A9FF 0%, #1E88E5 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  box-shadow: 0 8px 24px rgba(51, 169, 255, 0.4);

  svg { width: 38px; height: 38px; color: white; }
`;

const AppName = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 4px 0;
`;

const AppTagline = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  input { padding-left: 44px; }
  ${({ $withToggle }) => $withToggle && `input { padding-right: 44px; }`}
`;

const InputIcon = styled.div`
  position: absolute;
  left: 14px;
  display: flex;
  svg { width: 18px; height: 18px; color: ${({ theme }) => theme.colors.textSecondary}; }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 14px;
  background: none;
  border: none;
  cursor: pointer;
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

const ForgotPasswordLink = styled(Link)`
  display: block;
  text-align: right;
  font-size: 12.5px;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 600;
  text-decoration: none;
  margin-top: 6px;

  &:hover { text-decoration: underline; }
`;

const PortalLogin = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, error: authError, clearError } = usePortalAuth();
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/portal');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (authError) {
      setError(authError);
      clearError();
    }
  }, [authError, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!telefono || !password) {
      setError('Ingresa tu teléfono y contraseña');
      return;
    }
    setIsLoading(true);
    const result = await login(telefono.trim(), password, true);
    if (result.success) {
      navigate('/portal');
    } else {
      setError(result.message || 'Error al iniciar sesión');
    }
    setIsLoading(false);
  };

  return (
    <PortalCentered>
      <PortalAuthCard>
        <LogoContainer>
          <LogoIcon><Heart /></LogoIcon>
          <AppName>Portal de pacientes</AppName>
          <AppTagline>Bio Dental</AppTagline>
        </LogoContainer>

        <Form onSubmit={handleSubmit}>
          {error && <PortalErrorMessage>{error}</PortalErrorMessage>}

          <div>
            <PortalLabel>Teléfono</PortalLabel>
            <InputWrapper>
              <InputIcon><Phone /></InputIcon>
              <PortalInput
                type="tel"
                placeholder="Tu número de teléfono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                autoComplete="tel"
              />
            </InputWrapper>
          </div>

          <div>
            <PortalLabel>Contraseña</PortalLabel>
            <InputWrapper $withToggle>
              <InputIcon><Lock /></InputIcon>
              <PortalInput
                type={showPassword ? 'text' : 'password'}
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <PasswordToggle type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff /> : <Eye />}
              </PasswordToggle>
            </InputWrapper>
            <ForgotPasswordLink to="/portal/olvide-password">¿Olvidaste tu contraseña?</ForgotPasswordLink>
          </div>

          <PortalButton type="submit" disabled={isLoading}>
            {isLoading ? 'Ingresando...' : 'Ingresar'}
          </PortalButton>

          <HelpText>
            ¿Primera vez aquí? <Link to="/portal/registro">Activa tu acceso</Link>
          </HelpText>
        </Form>
      </PortalAuthCard>
    </PortalCentered>
  );
};

export default PortalLogin;
