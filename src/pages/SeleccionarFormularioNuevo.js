import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, ChevronRight, Check, Loader } from 'lucide-react';
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
  background: ${({ theme, $selected }) => $selected ? `${theme.colors.primary}10` : theme.colors.surface};
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 2px solid ${({ theme, $selected }) => $selected ? theme.colors.primary : 'transparent'};

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
  background: ${({ theme, $selected }) => $selected ? theme.colors.primary : `${theme.colors.primary}15`};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 24px;
    height: 24px;
    color: ${({ theme, $selected }) => $selected ? 'white' : theme.colors.primary};
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

const CheckIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 14px;
    height: 14px;
    color: white;
  }
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

const ConfirmButton = styled.button`
  width: 100%;
  padding: 16px;
  background: ${({ theme, disabled }) => disabled ? theme.colors.border : theme.colors.primary};
  color: ${({ disabled }) => disabled ? '#999' : 'white'};
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  margin-top: 24px;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const SelectedCount = styled.div`
  text-align: center;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 12px;
`;

const SeleccionarFormularioNuevo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedForms, setSelectedForms] = useState([]);
  const [availableForms, setAvailableForms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const returnTo = location.state?.returnTo || '/registro-paciente';

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
      
      setAvailableForms(mappedForms);
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleForm = (formId) => {
    setSelectedForms(prev => {
      if (prev.includes(formId)) {
        return prev.filter(id => id !== formId);
      } else {
        return [...prev, formId];
      }
    });
  };

  const handleConfirm = () => {
    // Volver a registro de paciente con los formularios seleccionados
    navigate(returnTo, {
      state: { selectedForms: selectedForms.map(id => availableForms.find(f => f.id === id)) }
    });
  };

  if (loading) {
    return (
      <PageContainer>
        <Header title="Seleccionar Formularios" showBack />
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
      <Header title="Seleccionar Formularios" showBack />
      
      <Content>
        <Title>Formularios Disponibles</Title>
        <Subtitle>Selecciona los formularios que deseas agregar al registro</Subtitle>

        {availableForms.length > 0 ? (
          <>
            <FormsList>
              {availableForms.map(form => {
                const isSelected = selectedForms.includes(form.id);
                return (
                  <FormItem 
                    key={form.id} 
                    $selected={isSelected}
                    onClick={() => handleToggleForm(form.id)}
                  >
                    <FormIcon $selected={isSelected}>
                      {isSelected ? <Check /> : <FileText />}
                    </FormIcon>
                    <FormInfo>
                      <FormName>{form.name}</FormName>
                      <FormDescription>{form.description}</FormDescription>
                    </FormInfo>
                    <FormFieldCount>{form.fieldsCount} campos</FormFieldCount>
                    {isSelected && (
                      <CheckIcon>
                        <Check />
                      </CheckIcon>
                    )}
                  </FormItem>
                );
              })}
            </FormsList>

            <ConfirmButton 
              onClick={handleConfirm}
              disabled={selectedForms.length === 0}
            >
              Agregar {selectedForms.length > 0 ? `(${selectedForms.length})` : ''} Formulario{selectedForms.length !== 1 ? 's' : ''}
            </ConfirmButton>

            {selectedForms.length > 0 && (
              <SelectedCount>
                {selectedForms.length} formulario{selectedForms.length !== 1 ? 's' : ''} seleccionado{selectedForms.length !== 1 ? 's' : ''}
              </SelectedCount>
            )}
          </>
        ) : (
          <EmptyState>
            <FileText />
            <h3>No hay formularios</h3>
            <p>No hay formularios disponibles para agregar</p>
          </EmptyState>
        )}
      </Content>
    </PageContainer>
  );
};

export default SeleccionarFormularioNuevo;
