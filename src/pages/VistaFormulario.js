import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { PenTool, Loader } from 'lucide-react';
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
  margin: 0 0 24px 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
  padding-bottom: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const PreviewField = styled.div`
  margin-bottom: 24px;
`;

const PreviewLabel = styled.label`
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

const PreviewInput = styled.input`
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

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const PreviewTextarea = styled.textarea`
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

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const PreviewOptionsGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PreviewOption = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
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

const PreviewSignatureBox = styled.div`
  width: 100%;
  height: 150px;
  border: 2px dashed ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textSecondary};

  svg {
    width: 36px;
    height: 36px;
    opacity: 0.5;
  }

  span {
    font-size: 14px;
  }
`;

const PreviewNote = styled.div`
  margin-top: 24px;
  padding: 16px;
  background: ${({ theme }) => `${theme.colors.primary}10`};
  border-radius: 12px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  border: 1px solid ${({ theme }) => `${theme.colors.primary}20`};
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

const NotFoundMessage = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${({ theme }) => theme.colors.textSecondary};

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

const VistaFormulario = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForm();
  }, [id]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      const response = await formulariosService.getById(id);
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
          <PreviewTextarea 
            placeholder={`Ingrese ${field.label.toLowerCase()}`}
            disabled
          />
        );
      case 'multiple':
        return (
          <PreviewOptionsGroup>
            {field.options?.map((option, idx) => (
              <PreviewOption key={idx}>
                <input type="radio" name={`field-${field.id}`} disabled />
                <span>{option}</span>
              </PreviewOption>
            ))}
          </PreviewOptionsGroup>
        );
      case 'signature':
        return (
          <PreviewSignatureBox>
            <PenTool />
            <span>Toque aquí para firmar</span>
          </PreviewSignatureBox>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Header title="Vista Previa" showBack />
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
        <Header title="Vista Previa" showBack />
        <Content>
          <NotFoundMessage>
            <h3>Formulario no encontrado</h3>
            <p>El formulario que buscas no existe</p>
          </NotFoundMessage>
        </Content>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header title="Vista Previa" showBack />
      
      <Content>
        <FormCard>
          <FormTitle>{form.name}</FormTitle>
          <FormDescription>{form.description}</FormDescription>
          
          {form.fields.map((field) => {
            // Los tipos informativos no muestran PreviewLabel separada
            const isInfoField = ['text', 'titulo', 'subtitulo', 'parrafo'].includes(field.type);
            
            return (
              <PreviewField key={field.id}>
                {!isInfoField && (
                  <PreviewLabel>
                    {field.label}
                    {field.required && <span>*</span>}
                  </PreviewLabel>
                )}
                {renderField(field)}
              </PreviewField>
            );
          })}

          <PreviewNote>
            Esta es una vista previa del formulario. Los campos están deshabilitados.
          </PreviewNote>
        </FormCard>
      </Content>
    </PageContainer>
  );
};

export default VistaFormulario;
