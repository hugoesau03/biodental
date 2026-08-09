import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { User, Heart, Pill, Camera, Trash2, Info, CheckCircle } from 'lucide-react';
import Header from '../components/Layout/Header';
import { pacientesService } from '../services/api';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding-bottom: 80px;
  overflow-y: auto;
`;

const Content = styled.div`
  padding: 20px;
`;

const Form = styled.form`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 24px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const FormSection = styled.div`
  margin-bottom: 32px;

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

  svg {
    width: 18px;
    height: 18px;
  }
`;

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const FormField = styled.div`
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
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

const RadioGroup = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 8px;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;

  input {
    cursor: pointer;
    width: 18px;
    height: 18px;
    accent-color: ${({ theme }) => theme.colors.primary};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  min-height: 100px;
  resize: vertical;
  font-family: ${({ theme }) => theme.fonts.primary};
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const TypeButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
`;

const TypeButton = styled.button`
  padding: 12px 20px;
  background: ${({ $active, theme }) => 
    $active ? theme.colors.primary : theme.colors.white};
  color: ${({ $active, theme }) => 
    $active ? theme.colors.white : theme.colors.text};
  border: 1px solid ${({ $active, theme }) => 
    $active ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ $active, theme }) => 
      $active ? theme.colors.primaryDark : theme.colors.info};
  }
`;

const CollapsibleSection = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: 12px;
  overflow: hidden;
`;

const CollapsibleHeader = styled.button`
  width: 100%;
  padding: 16px;
  background: ${({ theme }) => theme.colors.gray};
  border: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`;

const CollapsibleTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};

  svg {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const CollapsibleContent = styled.div`
  padding: 16px;
  display: ${({ $isOpen }) => $isOpen ? 'block' : 'none'};
`;

const InfoNote = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: ${({ theme }) => theme.colors.info};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
  margin-bottom: 24px;

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

  strong {
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }
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
  margin-top: 24px;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }

  &:active {
    transform: scale(0.98);
  }
`;

const ViewProfileButton = styled.button`
  width: 100%;
  padding: 14px;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.primary};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 12px;

  &:hover {
    background: ${({ theme }) => theme.colors.info};
  }
`;

const PhotoUploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
`;

const PhotoPreview = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  border: 3px solid ${({ theme }) => theme.colors.border};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  svg {
    width: 60px;
    height: 60px;
    color: white;
  }
`;

const PhotoActions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 12px;
`;

const PhotoButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.text};

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const PhotoDeleteButton = styled(PhotoButton)`
  color: ${({ theme }) => theme.colors.dangerText};
  border-color: ${({ theme }) => theme.colors.danger};

  &:hover {
    background: ${({ theme }) => theme.colors.danger};
    color: ${({ theme }) => theme.colors.dangerText};
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const SuccessModalOverlay = styled.div`
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
`;

const SuccessModalContent = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  padding: 32px 24px;
  text-align: center;
`;

const SuccessIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.success};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;

  svg {
    width: 32px;
    height: 32px;
    color: white;
  }
`;

const SuccessTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 8px 0;
`;

const SuccessMessage = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 24px 0;
  line-height: 1.5;
`;

const SuccessActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PrimaryActionBtn = styled.button`
  width: 100%;
  padding: 14px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.9;
  }
`;

const SecondaryActionBtn = styled.button`
  width: 100%;
  padding: 14px;
  background: ${({ theme }) => theme.colors.gray};
  color: ${({ theme }) => theme.colors.text};
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`;

const RegistroPaciente = () => {
  const navigate = useNavigate();
  const [patientType, setPatientType] = useState('Adulto');
  const [allergiesOpen, setAllergiesOpen] = useState(false);
  const [medicationsOpen, setMedicationsOpen] = useState(false);
  const [patientPhoto, setPatientPhoto] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdPatientUuid, setCreatedPatientUuid] = useState(null);
  const [saving, setSaving] = useState(false);
  const photoInputRef = useRef(null);

  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    birthDate: '',
    gender: 'Femenino',
    email: '',
    phone: '',
    address: '',
    allergies: '',
    medications: ''
  });

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPatientPhoto(event.target.result);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleDeletePhoto = () => {
    setPatientPhoto(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Solo el nombre es obligatorio
    if (!formData.nombre.trim()) {
      alert('Por favor ingrese el nombre del paciente');
      return;
    }
    
    setSaving(true);
    try {
      // Mapear género al formato de la BD
      const generoMap = {
        'Masculino': 'masculino',
        'Femenino': 'femenino',
        'Otro': 'otro'
      };
      
      const pacienteData = {
        nombre: formData.nombre.trim(),
        apellidos: formData.apellidos.trim() || null,
        fecha_nacimiento: formData.birthDate || null,
        genero: generoMap[formData.gender] || 'otro',
        tipo: patientType === 'Adulto' ? 'adulto' : 'pediatrico',
        email: formData.email || null,
        telefono: formData.phone || null,
        direccion: formData.address || null,
        alergias: formData.allergies || null,
        notas: formData.medications ? `Medicamentos: ${formData.medications}` : null,
        foto_url: patientPhoto || null
      };
      
      const response = await pacientesService.create(pacienteData);
      
      if (response.success) {
        setCreatedPatientUuid(response.data.uuid);
        setShowSuccessModal(true);
      } else {
        alert(response.message || 'Error al registrar paciente');
      }
    } catch (err) {
      console.error('Error registrando paciente:', err);
      alert('Error al registrar paciente');
    } finally {
      setSaving(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate('/pacientes');
  };

  const handleGoToProfile = () => {
    setShowSuccessModal(false);
    if (createdPatientUuid) {
      navigate(`/perfil-paciente/${createdPatientUuid}`);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <PageContainer>
      {showSuccessModal && (
        <SuccessModalOverlay>
          <SuccessModalContent>
            <SuccessIcon>
              <CheckCircle />
            </SuccessIcon>
            <SuccessTitle>¡Paciente Registrado!</SuccessTitle>
            <SuccessMessage>
              El paciente ha sido registrado exitosamente. Puedes ir a su perfil para agregar formularios, documentos y completar su información.
            </SuccessMessage>
            <SuccessActions>
              <PrimaryActionBtn onClick={handleGoToProfile}>
                Ir al Perfil del Paciente
              </PrimaryActionBtn>
              <SecondaryActionBtn onClick={handleSuccessClose}>
                Volver a Lista de Pacientes
              </SecondaryActionBtn>
            </SuccessActions>
          </SuccessModalContent>
        </SuccessModalOverlay>
      )}

      <Header title="Registro de Paciente" showBack />
      
      <Content>
        <InfoNote>
          <Info />
          <InfoNoteText>
            <strong>Registro rápido:</strong> Solo el nombre es obligatorio. Los demás datos, formularios clínicos y documentos adjuntos se pueden agregar o editar desde el perfil del paciente.
          </InfoNoteText>
        </InfoNote>

        <Form onSubmit={handleSubmit}>
          <FormSection>
            <SectionHeader>
              <SectionIcon>
                <User />
              </SectionIcon>
              <SectionTitle>Datos Personales</SectionTitle>
            </SectionHeader>

            <PhotoUploadContainer>
              <PhotoPreview>
                {patientPhoto ? (
                  <img src={patientPhoto} alt="Foto del paciente" />
                ) : (
                  <User />
                )}
              </PhotoPreview>
              <PhotoActions>
                <PhotoButton type="button" onClick={() => photoInputRef.current?.click()}>
                  <Camera />
                  {patientPhoto ? 'Cambiar Foto' : 'Subir Foto'}
                </PhotoButton>
                {patientPhoto && (
                  <PhotoDeleteButton type="button" onClick={handleDeletePhoto}>
                    <Trash2 />
                    Eliminar
                  </PhotoDeleteButton>
                )}
              </PhotoActions>
              <HiddenInput
                type="file"
                ref={photoInputRef}
                accept="image/*"
                onChange={handlePhotoSelect}
              />
            </PhotoUploadContainer>

            <FormField>
              <Label>Nombre(s) *</Label>
              <Input
                type="text"
                name="nombre"
                placeholder="Sofía"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField>
              <Label>Apellidos</Label>
              <Input
                type="text"
                name="apellidos"
                placeholder="Martínez García"
                value={formData.apellidos}
                onChange={handleChange}
              />
            </FormField>

            <FormField>
              <Label>Fecha de Nacimiento</Label>
              <Input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
              />
            </FormField>

            <FormField>
              <Label>Género</Label>
              <RadioGroup>
                <RadioLabel>
                  <input
                    type="radio"
                    name="gender"
                    value="Masculino"
                    checked={formData.gender === 'Masculino'}
                    onChange={handleChange}
                  />
                  Masculino
                </RadioLabel>
                <RadioLabel>
                  <input
                    type="radio"
                    name="gender"
                    value="Femenino"
                    checked={formData.gender === 'Femenino'}
                    onChange={handleChange}
                  />
                  Femenino
                </RadioLabel>
                <RadioLabel>
                  <input
                    type="radio"
                    name="gender"
                    value="Otro"
                    checked={formData.gender === 'Otro'}
                    onChange={handleChange}
                  />
                  Otro
                </RadioLabel>
              </RadioGroup>
            </FormField>

            <FormField>
              <Label>Email</Label>
              <Input
                type="email"
                name="email"
                placeholder="sofia.martinez@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </FormField>

            <FormField>
              <Label>Teléfono</Label>
              <Input
                type="tel"
                name="phone"
                placeholder="555-123-4567"
                value={formData.phone}
                onChange={handleChange}
              />
            </FormField>

            <FormField>
              <Label>Dirección</Label>
              <Input
                type="text"
                name="address"
                placeholder="Calle Falsa 123, Ciudad de México"
                value={formData.address}
                onChange={handleChange}
              />
            </FormField>
          </FormSection>

          <FormSection>
            <FormField>
              <Label>Tipo de Paciente</Label>
              <TypeButtons>
                <TypeButton
                  type="button"
                  $active={patientType === 'Adulto'}
                  onClick={() => setPatientType('Adulto')}
                >
                  Adulto
                </TypeButton>
                <TypeButton
                  type="button"
                  $active={patientType === 'Pediátrico'}
                  onClick={() => setPatientType('Pediátrico')}
                >
                  Pediátrico
                </TypeButton>
              </TypeButtons>
            </FormField>
          </FormSection>

          <FormSection>
            <SectionHeader>
              <SectionIcon>
                <Heart />
              </SectionIcon>
              <SectionTitle>Historial de Salud</SectionTitle>
            </SectionHeader>

            <CollapsibleSection>
              <CollapsibleHeader
                type="button"
                onClick={() => setAllergiesOpen(!allergiesOpen)}
              >
                <CollapsibleTitle>
                  <Heart />
                  Alergias
                </CollapsibleTitle>
                <span>{allergiesOpen ? '−' : '+'}</span>
              </CollapsibleHeader>
              <CollapsibleContent $isOpen={allergiesOpen}>
                <TextArea
                  name="allergies"
                  placeholder="Describe las alergias conocidas..."
                  value={formData.allergies}
                  onChange={handleChange}
                />
              </CollapsibleContent>
            </CollapsibleSection>

            <CollapsibleSection>
              <CollapsibleHeader
                type="button"
                onClick={() => setMedicationsOpen(!medicationsOpen)}
              >
                <CollapsibleTitle>
                  <Pill />
                  Medicamentos
                </CollapsibleTitle>
                <span>{medicationsOpen ? '−' : '+'}</span>
              </CollapsibleHeader>
              <CollapsibleContent $isOpen={medicationsOpen}>
                <TextArea
                  name="medications"
                  placeholder="Lista de medicamentos actuales..."
                  value={formData.medications}
                  onChange={handleChange}
                />
              </CollapsibleContent>
            </CollapsibleSection>
          </FormSection>

          <SubmitButton type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Registrar Paciente'}
          </SubmitButton>
        </Form>
      </Content>
    </PageContainer>
  );
};

export default RegistroPaciente;
