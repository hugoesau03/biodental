import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Camera, Trash2, Loader } from 'lucide-react';
import Header from '../components/Layout/Header';
import Modal from '../components/Modal';
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
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

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 0;
`;

const EditarPaciente = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [patientType, setPatientType] = useState('adulto');
  const [patientPhoto, setPatientPhoto] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const photoInputRef = useRef(null);

  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    fecha_nacimiento: '',
    genero: 'otro',
    email: '',
    telefono: '',
    padecimientos: '',
    medicamentos: '',
    alergias: '',
    motivo_consulta: ''
  });

  // Cargar datos del paciente
  useEffect(() => {
    const fetchPatient = async () => {
      setLoading(true);
      try {
        const response = await pacientesService.getById(id);
        if (response.success) {
          const patient = response.data;
          
          // Formatear fecha para el input type="date" (YYYY-MM-DD)
          let fechaNacimiento = '';
          if (patient.fecha_nacimiento) {
            const fecha = new Date(patient.fecha_nacimiento);
            fechaNacimiento = fecha.toISOString().split('T')[0];
          }
          
          setFormData({
            nombre: patient.nombre || '',
            apellidos: patient.apellidos || '',
            fecha_nacimiento: fechaNacimiento,
            genero: patient.genero || 'otro',
            email: patient.email || '',
            telefono: patient.telefono || '',
            padecimientos: patient.padecimientos || '',
            medicamentos: patient.medicamentos || '',
            alergias: patient.alergias || '',
            motivo_consulta: patient.motivo_consulta || ''
          });
          setPatientType(patient.tipo || 'adulto');
          if (patient.foto_url) {
            setPatientPhoto(patient.foto_url);
          }
        } else {
          console.error('Paciente no encontrado');
          navigate('/pacientes');
        }
      } catch (err) {
        console.error('Error cargando paciente:', err);
        navigate('/pacientes');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchPatient();
  }, [id, navigate]);

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
    
    if (!formData.nombre) {
      alert('Por favor ingrese el nombre del paciente');
      return;
    }
    
    setSaving(true);
    try {
      const pacienteData = {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        fecha_nacimiento: formData.fecha_nacimiento || null,
        genero: formData.genero,
        tipo: patientType,
        email: formData.email || null,
        telefono: formData.telefono || null,
        padecimientos: formData.padecimientos || null,
        medicamentos: formData.medicamentos || null,
        alergias: formData.alergias || null,
        motivo_consulta: formData.motivo_consulta || null,
        foto_url: patientPhoto || null
      };
      
      const response = await pacientesService.update(id, pacienteData);
      
      if (response.success) {
        setShowSuccessModal(true);
      } else {
        alert(response.message || 'Error al actualizar paciente');
      }
    } catch (err) {
      console.error('Error actualizando paciente:', err);
      alert('Error al actualizar paciente');
    } finally {
      setSaving(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate(`/perfil-paciente/${id}`);
  };

  if (loading) {
    return (
      <PageContainer>
        <Header title="Editar Paciente" showBack />
        <LoadingContainer>
          <Loader className="spin" size={32} />
        </LoadingContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Modal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        title="¡Paciente Actualizado!"
        message="Los datos del paciente han sido actualizados correctamente."
        type="success"
        confirmText="Aceptar"
      />

      <Header title="Editar Paciente" showBack />
      
      <Content>
        <Form onSubmit={handleSubmit}>
          {/* Foto del paciente */}
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
                Cambiar Foto
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

          {/* Datos Personales */}
          <FormSection>
            <SectionHeader>
              <SectionIcon>
                <User />
              </SectionIcon>
              <SectionTitle>Datos Personales</SectionTitle>
            </SectionHeader>

            <FormField>
              <Label>Nombre *</Label>
              <Input
                type="text"
                placeholder="Nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                required
              />
            </FormField>

            <FormField>
              <Label>Apellidos</Label>
              <Input
                type="text"
                placeholder="Apellidos"
                value={formData.apellidos}
                onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
              />
            </FormField>

            <FormField>
              <Label>Fecha de Nacimiento</Label>
              <Input
                type="date"
                value={formData.fecha_nacimiento}
                onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})}
              />
            </FormField>

            <FormField>
              <Label>Género</Label>
              <RadioGroup>
                <RadioLabel>
                  <input
                    type="radio"
                    name="gender"
                    checked={formData.genero === 'femenino'}
                    onChange={() => setFormData({...formData, genero: 'femenino'})}
                  />
                  Femenino
                </RadioLabel>
                <RadioLabel>
                  <input
                    type="radio"
                    name="gender"
                    checked={formData.genero === 'masculino'}
                    onChange={() => setFormData({...formData, genero: 'masculino'})}
                  />
                  Masculino
                </RadioLabel>
                <RadioLabel>
                  <input
                    type="radio"
                    name="gender"
                    checked={formData.genero === 'otro'}
                    onChange={() => setFormData({...formData, genero: 'otro'})}
                  />
                  Otro
                </RadioLabel>
              </RadioGroup>
            </FormField>

            <FormField>
              <Label>Tipo de Paciente</Label>
              <TypeButtons>
                <TypeButton
                  type="button"
                  $active={patientType === 'adulto'}
                  onClick={() => setPatientType('adulto')}
                >
                  Adulto
                </TypeButton>
                <TypeButton
                  type="button"
                  $active={patientType === 'pediatrico'}
                  onClick={() => setPatientType('pediatrico')}
                >
                  Pediátrico
                </TypeButton>
              </TypeButtons>
            </FormField>

            <FormField>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="correo@ejemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </FormField>

            <FormField>
              <Label>Teléfono</Label>
              <Input
                type="tel"
                placeholder="(123) 456-7890"
                value={formData.telefono}
                onChange={(e) => setFormData({...formData, telefono: e.target.value})}
              />
            </FormField>

            <FormField>
              <Label>Padecimientos</Label>
              <TextArea
                placeholder="Padecimientos actuales o antecedentes médicos..."
                value={formData.padecimientos}
                onChange={(e) => setFormData({...formData, padecimientos: e.target.value})}
              />
            </FormField>

            <FormField>
              <Label>Medicamentos</Label>
              <TextArea
                placeholder="Lista de medicamentos actuales..."
                value={formData.medicamentos}
                onChange={(e) => setFormData({...formData, medicamentos: e.target.value})}
              />
            </FormField>

            <FormField>
              <Label>Alergias</Label>
              <TextArea
                placeholder="Describe las alergias del paciente..."
                value={formData.alergias}
                onChange={(e) => setFormData({...formData, alergias: e.target.value})}
              />
            </FormField>

            <FormField>
              <Label>Motivo de Consulta</Label>
              <TextArea
                placeholder="Motivo principal de la consulta..."
                value={formData.motivo_consulta}
                onChange={(e) => setFormData({...formData, motivo_consulta: e.target.value})}
              />
            </FormField>
          </FormSection>

          <SubmitButton type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader className="spin" size={18} />
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </SubmitButton>
        </Form>
      </Content>
    </PageContainer>
  );
};

export default EditarPaciente;
