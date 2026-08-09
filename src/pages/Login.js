import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Stethoscope, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #33A9FF 0%, #1E88E5 50%, #1565C0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const LoginCard = styled.div`
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
  margin-bottom: 32px;
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

const AppName = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 4px 0;
`;

const AppTagline = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
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

const PasswordToggle = styled.button`
  position: absolute;
  right: 16px;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  &:hover svg {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const RememberRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;

  input {
    width: 18px;
    height: 18px;
    accent-color: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
  }
`;

const ForgotPassword = styled.button`
  background: none;
  border: none;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

const LoginButton = styled.button`
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

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 8px 0;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.colors.border};
  }

  span {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const HelpText = styled.p`
  text-align: center;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;

  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
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

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, error: authError, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Mostrar error de autenticación
  useEffect(() => {
    if (authError) {
      setError(authError);
      clearError();
    }
  }, [authError, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, completa todos los campos');
      return;
    }

    setIsLoading(true);
    console.log('Attempting login with:', email); // Debug

    try {
      const result = await login(email, password, rememberMe);
      console.log('Login result:', result); // Debug
      
      if (result.success) {
        console.log('Login successful, navigating...'); // Debug
        navigate('/');
      } else {
        setError(result.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      console.error('Login catch error:', err); // Debug
      setError('Error al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <LoginCard>
        <LogoContainer>
          <LogoIcon>
            <Stethoscope />
          </LogoIcon>
          <AppName>Dr. Desk</AppName>
          <AppTagline>Sistema de Gestión Médica</AppTagline>
        </LogoContainer>

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
              />
            </InputWrapper>
          </InputGroup>

          <InputGroup>
            <InputLabel>Contraseña</InputLabel>
            <InputWrapper>
              <InputIcon>
                <Lock />
              </InputIcon>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <PasswordToggle
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </PasswordToggle>
            </InputWrapper>
          </InputGroup>

          <RememberRow>
            <CheckboxLabel>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Recordarme
            </CheckboxLabel>
            <ForgotPassword type="button">
              ¿Olvidaste tu contraseña?
            </ForgotPassword>
          </RememberRow>

          <LoginButton type="submit" disabled={isLoading}>
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </LoginButton>

          <Divider>
            <span>o</span>
          </Divider>

          <HelpText>
            ¿Necesitas ayuda? <a href="#">Contacta soporte</a>
          </HelpText>
        </Form>
      </LoginCard>
    </PageContainer>
  );
};

export default Login;
