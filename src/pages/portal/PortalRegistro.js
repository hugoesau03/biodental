import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Phone, Calendar, Lock, Eye, EyeOff } from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
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
  max-width: 300px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
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

const PortalRegistro = () => {
  const navigate = useNavigate();
  const { registro, isAuthenticated, error: authError, clearError } = usePortalAuth();
  const [telefono, setTelefono] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
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
    if (!telefono || !fechaNacimiento || !password) {
      setError('Completa todos los campos');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setIsLoading(true);
    const result = await registro({ telefono: telefono.trim(), fecha_nacimiento: fechaNacimiento, password });
    if (result.success) {
      navigate('/portal');
    } else {
      setError(result.message || 'No pudimos activar tu acceso');
    }
    setIsLoading(false);
  };

  return (
    <PortalCentered>
      <PortalAuthCard>
        <LogoContainer>
          <LogoIcon><Heart /></LogoIcon>
          <AppName>Activa tu acceso</AppName>
          <AppTagline>Usa los mismos datos que diste en la clínica para confirmar que eres tú</AppTagline>
        </LogoContainer>

        <Form onSubmit={handleSubmit}>
          {error && <PortalErrorMessage>{error}</PortalErrorMessage>}

          <div>
            <PortalLabel>Teléfono registrado en la clínica</PortalLabel>
            <InputWrapper>
              <InputIcon><Phone /></InputIcon>
              <PortalInput type="tel" placeholder="Tu teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </InputWrapper>
          </div>

          <div>
            <PortalLabel>Fecha de nacimiento</PortalLabel>
            <InputWrapper>
              <InputIcon><Calendar /></InputIcon>
              <PortalInput type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
            </InputWrapper>
          </div>

          <div>
            <PortalLabel>Crea una contraseña</PortalLabel>
            <InputWrapper>
              <InputIcon><Lock /></InputIcon>
              <PortalInput
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <PasswordToggle type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff /> : <Eye />}
              </PasswordToggle>
            </InputWrapper>
          </div>

          <PortalButton type="submit" disabled={isLoading}>
            {isLoading ? 'Activando...' : 'Activar mi acceso'}
          </PortalButton>

          <HelpText>
            ¿Ya tienes acceso? <Link to="/portal/login">Inicia sesión</Link>
          </HelpText>
        </Form>
      </PortalAuthCard>
    </PortalCentered>
  );
};

export default PortalRegistro;
