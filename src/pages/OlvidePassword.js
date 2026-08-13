import React, { useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { KeyRound, User, Mail } from 'lucide-react';
import { authService } from '../services/api';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #33A9FF 0%, #1E88E5 50%, #1565C0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 24px;
  padding: 40px 32px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const LogoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
`;

const LogoIcon = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #33A9FF 0%, #1E88E5 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 8px 24px rgba(51, 169, 255, 0.4);

  svg {
    width: 44px;
    height: 44px;
    color: white;
  }
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 6px 0;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 24px;
`;

const InputGroup = styled.div`
  position: relative;
`;

const InputLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 8px;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 16px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 16px 14px 48px;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  font-size: 15px;
  transition: all 0.3s ease;
  background: ${({ theme }) => theme.colors.background};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.white};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #33A9FF 0%, #1E88E5 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(51, 169, 255, 0.4);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(51, 169, 255, 0.5);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const BackLink = styled(Link)`
  display: block;
  text-align: center;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

const ErrorMessage = styled.div`
  background: ${({ theme }) => theme.colors.danger};
  color: ${({ theme }) => theme.colors.dangerText};
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
`;

const SuccessBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  padding: 12px 0 4px 0;

  svg {
    width: 48px;
    height: 48px;
    color: ${({ theme }) => theme.colors.success || '#2E7D32'};
  }

  p {
    font-size: 14px;
    color: ${({ theme }) => theme.colors.textSecondary};
    margin: 0;
  }
`;

const OlvidePassword = () => {
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
      // El backend siempre responde igual (mensaje genérico), exista o no
      // la cuenta, para no revelar qué correos están registrados.
      await authService.solicitarResetPassword(email);
      setEnviado(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <Card>
        <LogoContainer>
          <LogoIcon>
            <KeyRound />
          </LogoIcon>
          <Title>Restablecer contraseña</Title>
          <Subtitle>Te enviaremos un enlace a tu correo para definir una nueva contraseña</Subtitle>
        </LogoContainer>

        {enviado ? (
          <SuccessBox>
            <Mail />
            <p>
              Si existe una cuenta activa con <strong>{email}</strong>, te enviamos un correo con un enlace
              para restablecer tu contraseña. El enlace es válido durante 1 hora.
            </p>
            <BackLink to="/login" style={{ marginTop: 8 }}>Volver a iniciar sesión</BackLink>
          </SuccessBox>
        ) : (
          <Form onSubmit={handleSubmit}>
            {error && <ErrorMessage>{error}</ErrorMessage>}

            <InputGroup>
              <InputLabel>Correo electrónico</InputLabel>
              <InputWrapper>
                <InputIcon>
                  <User />
                </InputIcon>
                <Input
                  type="email"
                  placeholder="Ingresa tu correo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </InputWrapper>
            </InputGroup>

            <SubmitButton type="submit" disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </SubmitButton>

            <BackLink to="/login">Volver a iniciar sesión</BackLink>
          </Form>
        )}
      </Card>
    </PageContainer>
  );
};

export default OlvidePassword;
