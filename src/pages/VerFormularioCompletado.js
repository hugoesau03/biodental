import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FileText, PenTool, Edit2, Loader } from 'lucide-react';
import Header from '../components/Layout/Header';
import { formulariosService } from '../services/api';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding-bottom: 100px;
  overflow-y: auto;
`;

const Content = styled.div`
  padding: 20px;
`;

const FormCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const FormTitle = styled.h2`
  margin: 0 0 8px 0;
  font-size: 22px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.primary};
`;

const FormDescription = styled.p`
  margin: 0 0 16px 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
`;

const CompletedBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${({ theme }) => `${theme.colors.success}20`};
  color: ${({ theme }) => theme.colors.successText};
  border-radius: 8px;
  font-size: 13px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  margin-bottom: 20px;
`;

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
  margin-bottom: 24px;
`;

const FormField = styled.div`
  margin-bottom: 24px;
`;

const FieldLabel = styled.div`
  font-size: 13px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const FieldValue = styled.div`
  font-size: 15px;
  color: ${({ theme }) => theme.colors.text};
  padding: 14px 16px;
  background: ${({ theme }) => theme.colors.background};
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  min-height: ${({ $multiline }) => $multiline ? '80px' : 'auto'};
  white-space: pre-wrap;
`;

const SelectedOption = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: ${({ theme }) => `${theme.colors.primary}10`};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: 10px;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};

  &::before {
    content: '✓';
    font-weight: bold;
  }
`;

const SignatureBox = styled.div`
  width: 100%;
  min-height: 120px;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: ${({ theme }) => `${theme.colors.primary}05`};
  color: ${({ theme }) => theme.colors.primary};
  padding: 12px;
  overflow: hidden;

  svg {
    width: 32px;
    height: 32px;
  }

  span {
    font-size: 14px;
    font-weight: ${({ theme }) => theme.fontWeights.medium};
  }
`;

const SignatureImage = styled.img`
  max-width: 100%;
  max-height: 100px;
  object-fit: contain;
`;

const EditButton = styled.button`
  width: 100%;
  padding: 16px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.primary};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: 12px;
  font-size: 16px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: white;
  }
`;

const NotFoundMessage = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${({ theme }) => theme.colors.textSecondary};

  svg {
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  h3 {
    font-size: 18px;
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    color: ${({ theme }) => theme.colors.text};
    margin: 0 0 8px 0;
  }

  p {
    font-size: 14px;
    margin: 0;
  }
`;

const PatientName = styled.div`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 12px;
  padding: 12px 16px;
  background: ${({ theme }) => `${theme.colors.primary}10`};
  border-radius: 10px;
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
`;

const TextLabel = styled.div`
  font-size: 15px;
  color: ${({ theme }) => theme.colors.text};
  padding: 14px 16px;
  background: ${({ theme }) => `${theme.colors.primary}05`};
  border-radius: 10px;
  border-left: 3px solid ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const FieldTitulo = styled.h3`
  font-size: 20px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.primary};
  margin: 24px 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.primary};
`;

const FieldSubtitulo = styled.h4`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 16px 0 8px 0;
`;

const FieldParrafo = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.6;
  margin: 8px 0 16px 0;
  white-space: pre-wrap;
`;

const ImagenAnotadaBox = styled.div`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: ${({ theme }) => `${theme.colors.primary}05`};
  color: ${({ theme }) => theme.colors.primary};
  padding: 12px;
  overflow: hidden;

  span {
    font-size: 14px;
    font-weight: ${({ theme }) => theme.fontWeights.medium};
  }
`;

const ImagenAnotada = styled.img`
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 8px;
`;

const VerFormularioCompletado = () => {
  const { formId, patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [form, setForm] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [loading, setLoading] = useState(true);
  const returnTo = location.state?.returnTo || `/perfil-paciente/${patientId}`;
  const completedAt = location.state?.completedAt || new Date().toISOString().split('T')[0];
  const patientName = location.state?.patientName || '';

  useEffect(() => {
    fetchFormData();
  }, [formId, patientId]);

  const fetchFormData = async () => {
    try {
      setLoading(true);
      
      // Si vienen valores desde la navegación, usarlos directamente
      if (location.state?.existingValues) {
        const existingValues = typeof location.state.existingValues === 'string'
          ? JSON.parse(location.state.existingValues)
          : location.state.existingValues;
        setFormValues(existingValues);
      }
      
      // Obtener el formulario
      const formResponse = await formulariosService.getById(formId);
      const formData = formResponse.data;
      
      if (formData) {
        const campos = formData.campos ? (typeof formData.campos === 'string' ? JSON.parse(formData.campos) : formData.campos) : [];
        setForm({
          id: formData.uuid || formData.id,
          name: formData.nombre,
          description: formData.descripcion || '',
          fields: campos
        });
      }
      
      // Si no hay valores de navegación, intentar obtener del API
      if (!location.state?.existingValues) {
        try {
          const responseData = await formulariosService.getResponse(formId, patientId);
          if (responseData.data?.respuestas) {
            const respuestas = typeof responseData.data.respuestas === 'string' 
              ? JSON.parse(responseData.data.respuestas) 
              : responseData.data.respuestas;
            setFormValues(respuestas);
          }
        } catch (e) {
          console.log('No hay respuestas guardadas');
        }
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderFieldValue = (field) => {
    const value = formValues[field.id];
    
    // Tipos informativos que no requieren respuesta
    switch (field.type) {
      case 'text':
        // Compatibilidad hacia atrás - tratamos 'text' como título
        return <FieldTitulo>{field.label}</FieldTitulo>;
      case 'titulo':
        return <FieldTitulo>{field.label}</FieldTitulo>;
      case 'subtitulo':
        return <FieldSubtitulo>{field.label}</FieldSubtitulo>;
      case 'parrafo':
        return <FieldParrafo>{field.label}</FieldParrafo>;
      case 'textarea':
        if (!value) return <FieldValue style={{ color: '#999', fontStyle: 'italic' }}>Sin respuesta</FieldValue>;
        return <FieldValue $multiline>{value}</FieldValue>;
      case 'multiple':
        if (!value) return <FieldValue style={{ color: '#999', fontStyle: 'italic' }}>Sin respuesta</FieldValue>;
        return <SelectedOption>{value}</SelectedOption>;
      case 'signature':
        if (!value) return <FieldValue style={{ color: '#999', fontStyle: 'italic' }}>Sin firma</FieldValue>;
        // Verificar si es una firma real (data URL) o solo el marcador 'signed'
        const isRealSignature = value && value.startsWith('data:');
        return (
          <SignatureBox>
            {isRealSignature ? (
              <>
                <SignatureImage src={value} alt="Firma del paciente" />
                <span>Firmado ✓</span>
              </>
            ) : (
              <>
                <PenTool />
                <span>Firmado ✓</span>
              </>
            )}
          </SignatureBox>
        );
      case 'imagen':
        if (!value) return <FieldValue style={{ color: '#999', fontStyle: 'italic' }}>Sin anotaciones</FieldValue>;
        const isAnnotatedImage = value && value.startsWith('data:');
        return (
          <ImagenAnotadaBox>
            {isAnnotatedImage ? (
              <>
                <ImagenAnotada src={value} alt="Imagen anotada" />
                <span>Imagen anotada ✓</span>
              </>
            ) : (
              <span>Sin anotaciones</span>
            )}
          </ImagenAnotadaBox>
        );
      default:
        if (!value) return <FieldValue style={{ color: '#999', fontStyle: 'italic' }}>Sin respuesta</FieldValue>;
        return <FieldValue>{value}</FieldValue>;
    }
  };

  const handleEdit = () => {
    navigate(`/llenar-formulario/${formId}/${patientId}`, {
      state: { 
        returnTo,
        editMode: true,
        existingValues: formValues
      }
    });
  };

  if (loading) {
    return (
      <PageContainer>
        <Header title="Formulario Completado" showBack />
        <Content>
          <div style={{ textAlign: 'center', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Loader style={{ animation: 'spin 1s linear infinite', width: 32, height: 32, color: '#6366F1' }} />
          </div>
        </Content>
      </PageContainer>
    );
  }

  if (!form) {
    return (
      <PageContainer>
        <Header title="Formulario Completado" showBack />
        <Content>
          <NotFoundMessage>
            <FileText />
            <h3>Formulario no encontrado</h3>
            <p>El formulario que buscas no existe</p>
          </NotFoundMessage>
        </Content>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header title="Formulario Completado" showBack />
      
      <Content>
        <FormCard>
          {patientName && <PatientName>Paciente: {patientName}</PatientName>}
          
          <FormTitle>{form.name}</FormTitle>
          <FormDescription>{form.description}</FormDescription>
          
          <CompletedBadge>
            ✓ Completado el {completedAt}
          </CompletedBadge>
          
          <Divider />
          
          {form.fields.map((field) => {
            // Los tipos informativos no muestran FieldLabel separada
            const isInfoField = ['text', 'titulo', 'subtitulo', 'parrafo'].includes(field.type);
            
            return (
              <FormField key={field.id}>
                {!isInfoField && <FieldLabel>{field.label}</FieldLabel>}
                {renderFieldValue(field)}
              </FormField>
            );
          })}

          <EditButton onClick={handleEdit}>
            <Edit2 size={20} />
            Editar Formulario
          </EditButton>
        </FormCard>
      </Content>
    </PageContainer>
  );
};

export default VerFormularioCompletado;
