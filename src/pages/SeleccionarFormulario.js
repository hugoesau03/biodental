import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FileText, ChevronRight, Loader } from 'lucide-react';
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

const Title = styled.h2`
  font-size: 18px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 20px 0;
`;

const FormsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FormItem = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }
`;

const FormIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${({ theme }) => `${theme.colors.primary}15`};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 24px;
    height: 24px;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const FormInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FormName = styled.h3`
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 4px 0;
`;

const FormDescription = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FormFieldCount = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  background: ${({ theme }) => theme.colors.background};
  padding: 4px 8px;
  border-radius: 6px;
`;

const ArrowIcon = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  flex-shrink: 0;
`;

const EmptyState = styled.div`
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

const SeleccionarFormulario = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const returnTo = location.state?.returnTo || `/perfil-paciente/${patientId}`;

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await formulariosService.getAll();
      const formsData = response.data?.formularios || response.data || [];
      
      const mappedForms = formsData.map(form => {
        const campos = form.campos ? (typeof form.campos === 'string' ? JSON.parse(form.campos) : form.campos) : [];
        return {
          id: form.uuid || form.id,
          name: form.nombre,
          description: form.descripcion || '',
          fieldsCount: campos.length
        };
      });
      
      setForms(mappedForms);
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectForm = (formId) => {
    navigate(`/llenar-formulario/${formId}/${patientId}`, {
      state: { returnTo }
    });
  };

  if (loading) {
    return (
      <PageContainer>
        <Header title="Seleccionar Formulario" showBack />
        <Content>
          <div style={{ textAlign: 'center', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Loader style={{ animation: 'spin 1s linear infinite', width: 32, height: 32, color: '#6366F1' }} />
          </div>
        </Content>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header title="Seleccionar Formulario" showBack />
      
      <Content>
        <Title>Formularios Disponibles</Title>
        <Subtitle>Selecciona un formulario para llenar</Subtitle>

        {forms.length > 0 ? (
          <FormsList>
            {forms.map(form => (
              <FormItem key={form.id} onClick={() => handleSelectForm(form.id)}>
                <FormIcon>
                  <FileText />
                </FormIcon>
                <FormInfo>
                  <FormName>{form.name}</FormName>
                  <FormDescription>{form.description}</FormDescription>
                </FormInfo>
                <FormFieldCount>{form.fieldsCount} campos</FormFieldCount>
                <ArrowIcon>
                  <ChevronRight size={20} />
                </ArrowIcon>
              </FormItem>
            ))}
          </FormsList>
        ) : (
          <EmptyState>
            <FileText />
            <h3>No hay formularios</h3>
            <p>No hay formularios disponibles para llenar</p>
          </EmptyState>
        )}
      </Content>
    </PageContainer>
  );
};

export default SeleccionarFormulario;
