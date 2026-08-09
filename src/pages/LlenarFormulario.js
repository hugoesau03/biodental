import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FileText, Check, PenTool, ChevronRight, Loader, Image } from 'lucide-react';
import Header from '../components/Layout/Header';
import Modal from '../components/Modal';
import SignatureModal from '../components/SignatureModal';
import ImageAnnotationModal from '../components/ImageAnnotationModal';
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
  margin: 0 0 24px 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
  padding-bottom: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const FormField = styled.div`
  margin-bottom: 24px;
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

const FieldLabel = styled.label`
  display: block;
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 10px;

  span {
    color: ${({ theme }) => theme.colors.danger};
    margin-left: 4px;
  }
`;

const FieldInput = styled.input`
  width: 100%;
  padding: 14px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  font-size: 15px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => `${theme.colors.primary}20`};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const FieldTextarea = styled.textarea`
  width: 100%;
  padding: 14px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  font-size: 15px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => `${theme.colors.primary}20`};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const OptionsGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const OptionLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: ${({ $selected, theme }) => $selected ? `${theme.colors.primary}10` : theme.colors.background};
  border: 1px solid ${({ $selected, theme }) => $selected ? theme.colors.primary : theme.colors.border};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => `${theme.colors.primary}08`};
  }

  input {
    width: 20px;
    height: 20px;
    accent-color: ${({ theme }) => theme.colors.primary};
  }

  span {
    font-size: 15px;
    color: ${({ theme }) => theme.colors.text};
  }
`;

const SignatureBox = styled.div`
  width: 100%;
  min-height: 150px;
  border: 2px dashed ${({ $signed, theme }) => $signed ? theme.colors.primary : theme.colors.border};
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: ${({ $signed, theme }) => $signed ? `${theme.colors.primary}05` : theme.colors.background};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  padding: ${({ $signed }) => $signed ? '0' : '20px'};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  svg {
    width: 36px;
    height: 36px;
    opacity: ${({ $signed }) => $signed ? 1 : 0.5};
    color: ${({ $signed, theme }) => $signed ? theme.colors.primary : 'inherit'};
  }

  span {
    font-size: 14px;
    color: ${({ $signed, theme }) => $signed ? theme.colors.primary : 'inherit'};
    font-weight: ${({ $signed }) => $signed ? '500' : '400'};
  }
`;

const SignatureImage = styled.img`
  max-width: 100%;
  max-height: 140px;
  object-fit: contain;
`;

const SignatureLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.primary};
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ImageAnnotationBox = styled.div`
  width: 100%;
  border: 2px dashed ${({ $annotated, theme }) => $annotated ? theme.colors.primary : theme.colors.border};
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: ${({ $annotated, theme }) => $annotated ? `${theme.colors.primary}05` : theme.colors.background};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  padding: ${({ $annotated }) => $annotated ? '8px' : '20px'};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  svg {
    width: 36px;
    height: 36px;
    opacity: 0.5;
  }

  span {
    font-size: 14px;
  }
`;

const AnnotatedImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 8px;
`;

const AnnotationLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.primary};
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 16px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
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
    background: ${({ theme }) => theme.colors.primaryDark};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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

const LlenarFormulario = () => {
  const { formId, patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const returnTo = location.state?.returnTo || `/perfil-paciente/${patientId}`;
  const editMode = location.state?.editMode || false;
  const existingValues = location.state?.existingValues || {};
  
  const [formValues, setFormValues] = useState(existingValues);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showImageAnnotationModal, setShowImageAnnotationModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showRequiredModal, setShowRequiredModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentSignatureField, setCurrentSignatureField] = useState(null);
  const [currentImageField, setCurrentImageField] = useState(null);

  useEffect(() => {
    fetchForm();
  }, [formId]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      const response = await formulariosService.getById(formId);
      const formData = response.data;
      
      if (formData) {
        const campos = formData.campos ? (typeof formData.campos === 'string' ? JSON.parse(formData.campos) : formData.campos) : [];
        setForm({
          id: formData.uuid || formData.id,
          name: formData.nombre,
          description: formData.descripcion || '',
          fields: campos
        });
      }
    } catch (error) {
      console.error('Error fetching form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldId, value) => {
    setFormValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleOpenSignature = (fieldId) => {
    setCurrentSignatureField(fieldId);
    setShowSignatureModal(true);
  };

  const handleSaveSignature = (signatureData) => {
    setFormValues(prev => ({
      ...prev,
      [currentSignatureField]: signatureData
    }));
    setCurrentSignatureField(null);
  };

  const handleOpenImageAnnotation = (field) => {
    setCurrentImageField(field);
    setShowImageAnnotationModal(true);
  };

  const handleSaveImageAnnotation = (annotationData) => {
    setFormValues(prev => ({
      ...prev,
      [currentImageField.id]: annotationData
    }));
    setCurrentImageField(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form) return;
    
    // Tipos que no requieren respuesta (son solo elementos visuales)
    const nonInputTypes = ['text', 'titulo', 'subtitulo', 'parrafo'];
    
    // Validar campos requeridos (excluir campos informativos)
    const missingRequired = form.fields.filter(field => 
      !nonInputTypes.includes(field.type) && field.required && !formValues[field.id]
    );

    if (missingRequired.length > 0) {
      setShowRequiredModal(true);
      return;
    }

    try {
      setSaving(true);
      // Guardar formulario completado
      await formulariosService.submitResponse({
        formulario_id: formId,
        paciente_id: patientId,
        respuestas: JSON.stringify(formValues)
      });

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrorMessage(error.response?.data?.message || error.message);
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Header title="Llenar Formulario" showBack />
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
        <Header title="Formulario no encontrado" showBack />
        <Content>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            El formulario solicitado no existe
          </div>
        </Content>
      </PageContainer>
    );
  }

  const renderField = (field) => {
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
        return (
          <FieldTextarea 
            placeholder={`Ingrese ${field.label.toLowerCase()}`}
            value={formValues[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          />
        );
      case 'multiple':
        return (
          <OptionsGroup>
            {field.options?.map((option, idx) => (
              <OptionLabel 
                key={idx}
                $selected={formValues[field.id] === option}
              >
                <input 
                  type="radio" 
                  name={`field-${field.id}`}
                  checked={formValues[field.id] === option}
                  onChange={() => handleInputChange(field.id, option)}
                />
                <span>{option}</span>
              </OptionLabel>
            ))}
          </OptionsGroup>
        );
      case 'signature':
        const signatureValue = formValues[field.id];
        const isSigned = signatureValue && signatureValue !== 'signed' && signatureValue.startsWith('data:');
        const isOldSigned = signatureValue === 'signed';
        
        return (
          <SignatureBox 
            $signed={isSigned || isOldSigned}
            onClick={() => handleOpenSignature(field.id)}
          >
            {isSigned ? (
              <>
                <SignatureImage src={signatureValue} alt="Firma" />
                <SignatureLabel>
                  <Check size={14} />
                  Toque para editar firma
                </SignatureLabel>
              </>
            ) : isOldSigned ? (
              <>
                <Check />
                <span>Firmado ✓</span>
                <SignatureLabel>Toque para editar firma</SignatureLabel>
              </>
            ) : (
              <>
                <PenTool />
                <span>Toque aquí para firmar</span>
              </>
            )}
          </SignatureBox>
        );
      case 'imagen':
        const annotationValue = formValues[field.id];
        const isAnnotated = annotationValue && annotationValue.startsWith('data:');
        
        return (
          <ImageAnnotationBox 
            $annotated={isAnnotated}
            onClick={() => handleOpenImageAnnotation(field)}
          >
            {isAnnotated ? (
              <>
                <AnnotatedImage src={annotationValue} alt="Imagen anotada" />
                <AnnotationLabel>
                  <Check size={14} />
                  Toque para editar anotaciones
                </AnnotationLabel>
              </>
            ) : (
              <>
                <Image />
                <span>Toque aquí para anotar la imagen</span>
              </>
            )}
          </ImageAnnotationBox>
        );
      default:
        return null;
    }
  };

  if (!form) {
    return (
      <PageContainer>
        <Header title={editMode ? "Editar Formulario" : "Llenar Formulario"} showBack />
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
      <Header title={editMode ? "Editar Formulario" : "Llenar Formulario"} showBack />
      
      <Content>
        <FormCard>
          <FormTitle>{form.name}</FormTitle>
          <FormDescription>{form.description}</FormDescription>
          
          <form onSubmit={handleSubmit}>
            {form.fields.map((field) => {
              // Los tipos informativos no muestran FieldLabel separada
              const isInfoField = ['text', 'titulo', 'subtitulo', 'parrafo'].includes(field.type);
              
              return (
                <FormField key={field.id}>
                  {!isInfoField && (
                    <FieldLabel>
                      {field.label}
                      {field.required && <span>*</span>}
                    </FieldLabel>
                  )}
                  {renderField(field)}
                </FormField>
              );
            })}

            <SubmitButton type="submit">
              <Check size={20} />
              {editMode ? 'Actualizar Formulario' : 'Guardar Formulario'}
            </SubmitButton>
          </form>
        </FormCard>
      </Content>

      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate(returnTo);
        }}
        type="success"
        title={editMode ? "Formulario Actualizado" : "Formulario Guardado"}
        message={editMode ? "El formulario se ha actualizado correctamente." : "El formulario se ha guardado correctamente."}
        confirmText="Aceptar"
        onConfirm={() => {
          setShowSuccessModal(false);
          navigate(returnTo);
        }}
      />

      <Modal
        isOpen={showRequiredModal}
        onClose={() => setShowRequiredModal(false)}
        type="error"
        title="Campos Incompletos"
        message="Por favor complete todos los campos obligatorios marcados con * antes de guardar."
        confirmText="Entendido"
        onConfirm={() => setShowRequiredModal(false)}
      />

      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        type="error"
        title="Error al Guardar"
        message={`No se pudo guardar el formulario: ${errorMessage}`}
        confirmText="Cerrar"
        onConfirm={() => setShowErrorModal(false)}
      />

      <SignatureModal
        isOpen={showSignatureModal}
        onClose={() => {
          setShowSignatureModal(false);
          setCurrentSignatureField(null);
        }}
        onSave={handleSaveSignature}
        existingSignature={currentSignatureField ? formValues[currentSignatureField] : null}
      />

      <ImageAnnotationModal
        isOpen={showImageAnnotationModal}
        onClose={() => {
          setShowImageAnnotationModal(false);
          setCurrentImageField(null);
        }}
        onSave={handleSaveImageAnnotation}
        imageUrl={currentImageField?.imageUrl}
        existingAnnotation={currentImageField ? formValues[currentImageField.id] : null}
      />
    </PageContainer>
  );
};

export default LlenarFormulario;
