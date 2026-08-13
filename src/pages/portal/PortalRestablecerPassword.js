import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';
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
  input { padding-left: 44px; padding-right: 44px; }
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

const PortalRestablecerPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Por favor, completa todos los campos');
      return;
    }
    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      const result = await portalService.confirmarResetPassword(token, newPassword);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.message || 'No se pudo restablecer la contraseña');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <PortalCentered>
        <PortalAuthCard>
          <LogoContainer>
            <LogoIcon><AlertTriangle /></LogoIcon>
            <AppName>Enlace inválido</AppName>
            <AppTagline>Este enlace de restablecimiento no es válido o está incompleto.</AppTagline>
          </LogoContainer>
          <HelpText style={{ marginTop: 8 }}>
            <Link to="/portal/olvide-password">Solicitar un enlace nuevo</Link>
          </HelpText>
        </PortalAuthCard>
      </PortalCentered>
    );
  }

  return (
    <PortalCentered>
      <PortalAuthCard>
        <LogoContainer>
          <LogoIcon><KeyRound /></LogoIcon>
          <AppName>Define tu nueva contraseña</AppName>
          <AppTagline>Elige una contraseña nueva para tu cuenta</AppTagline>
        </LogoContainer>

        {success ? (
          <SuccessBox>
            <CheckCircle2 />
            <p>Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión con ella.</p>
            <PortalButton type="button" onClick={() => navigate('/portal/login')} style={{ marginTop: 8 }}>
              Ir a iniciar sesión
            </PortalButton>
          </SuccessBox>
        ) : (
          <Form onSubmit={handleSubmit}>
            {error && <PortalErrorMessage>{error}</PortalErrorMessage>}

            <div>
              <PortalLabel>Nueva contraseña</PortalLabel>
              <InputWrapper>
                <InputIcon><Lock /></InputIcon>
                <PortalInput
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  autoFocus
                />
                <PasswordToggle type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff /> : <Eye />}
                </PasswordToggle>
              </InputWrapper>
            </div>

            <div>
              <PortalLabel>Confirmar nueva contraseña</PortalLabel>
              <InputWrapper>
                <InputIcon><Lock /></InputIcon>
                <PortalInput
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </InputWrapper>
            </div>

            <PortalButton type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Restablecer contraseña'}
            </PortalButton>

            <HelpText>
              <Link to="/portal/login">Volver a iniciar sesión</Link>
            </HelpText>
          </Form>
        )}
      </PortalAuthCard>
    </PortalCentered>
  );
};

export default PortalRestablecerPassword;
