import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import {
  Building, User, Mail, Phone, MapPin, Lock, Eye, EyeOff, Info, CheckCircle, PlusCircle
} from 'lucide-react';
import Header from '../components/Layout/Header';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding-bottom: 80px;
  overflow-y: auto;
`;

const Content = styled.div`
  padding: 20px;
`;

const InfoNote = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: ${({ theme }) => theme.colors.info};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
  margin-bottom: 20px;

  svg {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.primary};
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const InfoNoteText = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.5;
`;

const Form = styled.form`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 24px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const FormSection = styled.div`
  margin-bottom: 28px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
`;

const SectionIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.info};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.primary};

  svg { width: 18px; height: 18px; }
`;

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: ${({ $cols }) => ($cols === 3 ? '1fr 1fr 1fr' : $cols === 2 ? '1fr 1fr' : '1fr')};
  gap: 16px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const FormField = styled.div`
  margin-bottom: 16px;

  &:last-child { margin-bottom: 0; }
`;

const Label = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
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
  left: 14px;
  display: flex;
  svg { width: 17px; height: 17px; color: ${({ theme }) => theme.colors.textSecondary}; }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px 12px 40px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  svg { width: 17px; height: 17px; color: ${({ theme }) => theme.colors.textSecondary}; }
`;

const ErrorMessage = styled.div`
  background: ${({ theme }) => theme.colors.danger};
  color: ${({ theme }) => theme.colors.dangerText};
  padding: 12px 16px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-bottom: 20px;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 14px;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;

  &:hover { background: ${({ theme }) => theme.colors.primaryDark}; }
  &:active { transform: scale(0.98); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const SuccessCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 40px 24px;
  text-align: center;
  box-shadow: ${({ theme }) => theme.shadows.sm};

  svg { width: 56px; height: 56px; color: ${({ theme }) => theme.colors.successText}; margin-bottom: 16px; }
  h2 { color: ${({ theme }) => theme.colors.text}; margin: 0 0 8px; }
`;

const SuccessDetail = styled.div`
  text-align: left;
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 16px;
  margin: 20px 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};

  div { margin-bottom: 6px; }
  strong { color: ${({ theme }) => theme.colors.textSecondary}; font-weight: ${({ theme }) => theme.fontWeights.medium}; }
`;

const SuccessActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SecondaryButton = styled.button`
  padding: 14px;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.primary};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
`;

const initialForm = {
  consultorio_nombre: '',
  consultorio_email: '',
  consultorio_telefono: '',
  direccion: '',
  ciudad: '',
  estado: '',
  usuario_nombre: '',
  usuario_apellidos: '',
  usuario_email: '',
  password: ''
};

const CrearConsultorio = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [creado, setCreado] = useState(null);

  // Defensa en cliente además del check del servidor: si alguien llega aquí
  // por URL directa sin ser superadmin, lo mandamos fuera. El servidor de
  // todas formas rechaza la petición aunque este check se saltara.
  useEffect(() => {
    if (user && !user.es_superadmin) {
      navigate('/perfil', { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.consultorio_nombre || !form.usuario_nombre || !form.usuario_email || !form.password) {
      setError('Completa los campos requeridos');
      return;
    }

    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setSaving(true);
    try {
      const response = await authService.crearConsultorio(form);
      if (response.success) {
        setCreado(response.data);
      } else {
        setError(response.message || 'No se pudo crear el consultorio');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al conectar con el servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleNuevo = () => {
    setForm(initialForm);
    setCreado(null);
    setError('');
  };

  if (creado) {
    return (
      <PageContainer>
        <Header title="Crear Consultorio" showBack />
        <Content>
          <SuccessCard>
            <CheckCircle />
            <h2>Consultorio creado</h2>
            <p>La clínica ya puede iniciar sesión con estos datos.</p>

            <SuccessDetail>
              <div><strong>Consultorio:</strong> {creado.consultorio.nombre}</div>
              <div><strong>Administrador:</strong> {creado.usuario.nombre} {creado.usuario.apellidos}</div>
              <div><strong>Correo de acceso:</strong> {creado.usuario.email}</div>
            </SuccessDetail>

            <SuccessActions>
              <SubmitButton onClick={handleNuevo}>
                <PlusCircle style={{ width: 18, height: 18, verticalAlign: 'middle', marginRight: 6 }} />
                Crear otro consultorio
              </SubmitButton>
              <SecondaryButton onClick={() => navigate('/perfil')}>Volver a Perfil</SecondaryButton>
            </SuccessActions>
          </SuccessCard>
        </Content>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header title="Crear Consultorio" showBack />
      <Content>
        <InfoNote>
          <Info />
          <InfoNoteText>
            Da de alta un consultorio nuevo (cliente) directamente desde la app, sin pasar por el
            formulario público de registro. Tu sesión no cambia: solo se crea la clínica y su
            primer usuario administrador.
          </InfoNoteText>
        </InfoNote>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Form onSubmit={handleSubmit}>
          <FormSection>
            <SectionHeader>
              <SectionIcon><Building /></SectionIcon>
              <SectionTitle>Información del Consultorio</SectionTitle>
            </SectionHeader>

            <FormField>
              <Label>Nombre del Consultorio *</Label>
              <InputWrapper>
                <InputIcon><Building /></InputIcon>
                <Input name="consultorio_nombre" value={form.consultorio_nombre} onChange={handleChange} placeholder="Ej: Clínica San Rafael" />
              </InputWrapper>
            </FormField>

            <FormRow $cols={2}>
              <FormField>
                <Label>Correo del Consultorio</Label>
                <InputWrapper>
                  <InputIcon><Mail /></InputIcon>
                  <Input type="email" name="consultorio_email" value={form.consultorio_email} onChange={handleChange} placeholder="Si se deja vacío, se usa el del admin" />
                </InputWrapper>
              </FormField>
              <FormField>
                <Label>Teléfono</Label>
                <InputWrapper>
                  <InputIcon><Phone /></InputIcon>
                  <Input type="tel" name="consultorio_telefono" value={form.consultorio_telefono} onChange={handleChange} placeholder="+52 555 123 4567" />
                </InputWrapper>
              </FormField>
            </FormRow>

            <FormField>
              <Label>Dirección</Label>
              <InputWrapper>
                <InputIcon><MapPin /></InputIcon>
                <Input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Calle, número, colonia" />
              </InputWrapper>
            </FormField>

            <FormRow $cols={2}>
              <FormField>
                <Label>Ciudad</Label>
                <Input name="ciudad" value={form.ciudad} onChange={handleChange} placeholder="Ciudad" style={{ paddingLeft: 16 }} />
              </FormField>
              <FormField>
                <Label>Estado</Label>
                <Input name="estado" value={form.estado} onChange={handleChange} placeholder="Estado" style={{ paddingLeft: 16 }} />
              </FormField>
            </FormRow>
          </FormSection>

          <FormSection>
            <SectionHeader>
              <SectionIcon><User /></SectionIcon>
              <SectionTitle>Administrador del Consultorio</SectionTitle>
            </SectionHeader>

            <FormRow $cols={2}>
              <FormField>
                <Label>Nombre *</Label>
                <InputWrapper>
                  <InputIcon><User /></InputIcon>
                  <Input name="usuario_nombre" value={form.usuario_nombre} onChange={handleChange} placeholder="Nombre" />
                </InputWrapper>
              </FormField>
              <FormField>
                <Label>Apellidos</Label>
                <InputWrapper>
                  <InputIcon><User /></InputIcon>
                  <Input name="usuario_apellidos" value={form.usuario_apellidos} onChange={handleChange} placeholder="Apellidos" />
                </InputWrapper>
              </FormField>
            </FormRow>

            <FormField>
              <Label>Correo Electrónico *</Label>
              <InputWrapper>
                <InputIcon><Mail /></InputIcon>
                <Input type="email" name="usuario_email" value={form.usuario_email} onChange={handleChange} placeholder="correo@clinica.com" />
              </InputWrapper>
            </FormField>

            <FormField>
              <Label>Contraseña temporal *</Label>
              <InputWrapper>
                <InputIcon><Lock /></InputIcon>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Mínimo 8 caracteres"
                />
                <PasswordToggle type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff /> : <Eye />}
                </PasswordToggle>
              </InputWrapper>
            </FormField>
          </FormSection>

          <SubmitButton type="submit" disabled={saving}>
            {saving ? 'Creando...' : 'Crear Consultorio'}
          </SubmitButton>
        </Form>
      </Content>
    </PageContainer>
  );
};

export default CrearConsultorio;
