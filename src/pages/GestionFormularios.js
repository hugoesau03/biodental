import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  FileText,
  Type,
  AlignLeft,
  List,
  PenTool,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  Loader
} from 'lucide-react';
import Header from '../components/Layout/Header';
import Modal from '../components/Modal';
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

const AddButton = styled.button`
  width: 100%;
  padding: 16px;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
  transition: all 0.3s ease;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
    transform: translateY(-2px);
  }
`;

const FormCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const FormHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const FormName = styled.h3`
  font-size: 17px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const FormBadge = styled.div`
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const FormMeta = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

const FormMetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};

  svg {
    width: 14px;
    height: 14px;
  }
`;

const FormDescription = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 16px 0;
  line-height: 1.5;
`;

const FormActions = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;

  svg {
    width: 16px;
    height: 16px;
  }
`;

const EditButton = styled(ActionButton)`
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};

  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: white;
  }
`;

const PreviewButton = styled(ActionButton)`
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textSecondary};

  &:hover {
    background: ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const DeleteButton = styled(ActionButton)`
  background: ${({ theme }) => `${theme.colors.danger}`};
  color: #dc6565ff;

  &:hover {
    background: #cd5a5aff;
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

// Modal de formulario
const ModalOverlay = styled.div`
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

const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 70vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  position: sticky;
  top: 0;
  background: ${({ theme }) => theme.colors.white};
  z-index: 10;
`;

const ModalTitle = styled.h2`
  font-size: 18px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const ModalBody = styled.div`
  padding: 20px;
`;

const ModalFooter = styled.div`
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  position: sticky;
  bottom: 0;
  background: ${({ theme }) => theme.colors.white};
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 8px;

  svg {
    width: 16px;
    height: 16px;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  font-size: 15px;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.background};
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => `${theme.colors.primary}20`};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  font-size: 15px;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.background};
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => `${theme.colors.primary}20`};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
  margin: 24px 0;
`;

const FieldsSection = styled.div`
  margin-top: 20px;
`;

const FieldsSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const FieldsSectionTitle = styled.h3`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const AddFieldButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.3s ease;

  svg {
    width: 14px;
    height: 14px;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: white;
  }
`;

const FieldTypeSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 16px;
`;

const FieldTypeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  background: ${({ $active, theme }) => $active ? theme.colors.primaryLight : theme.colors.background};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.text};
  border: 2px solid ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.border};
  border-radius: 10px;
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.3s ease;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const FieldCard = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  position: relative;
`;

const FieldCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`;

const FieldIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $type, theme }) => {
    switch ($type) {
      case 'text': return theme.colors.primaryLight;
      case 'textarea': return `${theme.colors.success}20`;
      case 'multiple': return `${theme.colors.warning}20`;
      case 'signature': return `${theme.colors.info}20`;
      default: return theme.colors.background;
    }
  }};
  color: ${({ $type, theme }) => {
    switch ($type) {
      case 'text': return theme.colors.primary;
      case 'textarea': return theme.colors.success;
      case 'multiple': return theme.colors.warning;
      case 'signature': return theme.colors.info;
      default: return theme.colors.textSecondary;
    }
  }};

  svg {
    width: 18px;
    height: 18px;
  }
`;

const FieldInfo = styled.div`
  flex: 1;
`;

const FieldName = styled.div`
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
`;

const FieldType = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const FieldActions = styled.div`
  display: flex;
  gap: 8px;
`;

const FieldActionButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: ${({ $danger, theme }) => $danger ? `${theme.colors.danger}15` : theme.colors.primaryLight};
    color: ${({ $danger, theme }) => $danger ? theme.colors.danger : theme.colors.primary};
  }
`;

const FieldContent = styled.div`
  margin-top: 12px;
`;

const OptionsContainer = styled.div`
  margin-top: 8px;
`;

const OptionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const OptionInput = styled.input`
  flex: 1;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.white};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const RemoveOptionButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: ${({ theme }) => `${theme.colors.danger}15`};
  color: ${({ theme }) => theme.colors.danger};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 14px;
    height: 14px;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.danger};
    color: white;
  }
`;

const AddOptionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  border: 1px dashed ${({ theme }) => theme.colors.primary};
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    width: 14px;
    height: 14px;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.primaryLight};
  }
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 14px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`;

const SaveButton = styled.button`
  flex: 1;
  padding: 14px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const RequiredToggle = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  margin-top: 8px;

  input {
    width: 16px;
    height: 16px;
    accent-color: ${({ theme }) => theme.colors.primary};
  }
`;

const GestionFormularios = () => {
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formToDelete, setFormToDelete] = useState(null);
  const [showAddField, setShowAddField] = useState(false);
  const [selectedFieldType, setSelectedFieldType] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fields: []
  });

  const [newField, setNewField] = useState({
    label: '',
    required: false,
    options: ['']
  });

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await formulariosService.getAll();
      const formsData = response.data?.formularios || response.data || [];
      
      // Mapear datos del backend
      const mappedForms = formsData.map(form => ({
        id: form.uuid || form.id,
        name: form.nombre,
        description: form.descripcion || '',
        fields: form.campos ? (typeof form.campos === 'string' ? JSON.parse(form.campos) : form.campos) : [],
        createdAt: form.fecha_registro ? new Date(form.fecha_registro).toISOString().split('T')[0] : ''
      }));
      
      setForms(mappedForms);
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fieldTypes = [
    { type: 'text', label: 'Campo de Texto', icon: Type },
    { type: 'textarea', label: 'Pregunta Abierta', icon: AlignLeft },
    { type: 'multiple', label: 'Opción Múltiple', icon: List },
    { type: 'signature', label: 'Campo de Firma', icon: PenTool },
  ];

  const getFieldIcon = (type) => {
    const fieldType = fieldTypes.find(f => f.type === type);
    return fieldType ? fieldType.icon : Type;
  };

  const getFieldTypeName = (type) => {
    const fieldType = fieldTypes.find(f => f.type === type);
    return fieldType ? fieldType.label : type;
  };

  const handleOpenModal = (form = null) => {
    if (form) {
      setEditingForm(form);
      setFormData({
        name: form.name,
        description: form.description,
        fields: [...form.fields]
      });
    } else {
      setEditingForm(null);
      setFormData({ name: '', description: '', fields: [] });
    }
    setShowAddField(false);
    setSelectedFieldType(null);
    setNewField({ label: '', required: false, options: [''] });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingForm(null);
    setFormData({ name: '', description: '', fields: [] });
    setShowAddField(false);
    setSelectedFieldType(null);
  };

  const handleAddField = () => {
    if (!newField.label || !selectedFieldType) return;

    const field = {
      id: Date.now(),
      type: selectedFieldType,
      label: newField.label,
      required: newField.required,
      ...(selectedFieldType === 'multiple' && { options: newField.options.filter(o => o.trim()) })
    };

    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, field]
    }));

    setShowAddField(false);
    setSelectedFieldType(null);
    setNewField({ label: '', required: false, options: [''] });
  };

  const handleRemoveField = (fieldId) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId)
    }));
  };

  const handleAddOption = () => {
    setNewField(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const handleRemoveOption = (index) => {
    setNewField(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleOptionChange = (index, value) => {
    setNewField(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const handleSave = async () => {
    if (!formData.name) return;

    try {
      setSaving(true);
      
      if (editingForm) {
        await formulariosService.update(editingForm.id, {
          nombre: formData.name,
          descripcion: formData.description,
          campos: JSON.stringify(formData.fields)
        });
      } else {
        await formulariosService.create({
          nombre: formData.name,
          descripcion: formData.description,
          campos: JSON.stringify(formData.fields)
        });
      }

      await fetchForms();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Error al guardar el formulario');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (formId) => {
    setFormToDelete(formId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (formToDelete) {
      try {
        await formulariosService.delete(formToDelete);
        await fetchForms();
      } catch (error) {
        console.error('Error deleting form:', error);
        alert('Error al eliminar el formulario');
      }
    }
    setShowDeleteModal(false);
    setFormToDelete(null);
  };

  if (loading) {
    return (
      <PageContainer>
        <Header title="Gestión de Formularios" showBack />
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
      <Header title="Gestión de Formularios" showBack />

      <Content>
        <AddButton onClick={() => navigate('/nuevo-formulario')}>
          <Plus />
          Crear Nuevo Formulario
        </AddButton>

        {forms.length > 0 ? (
          forms.map(form => (
            <FormCard key={form.id}>
              <FormHeader>
                <FormName>{form.name}</FormName>
                <FormBadge>{form.fields.length} campos</FormBadge>
              </FormHeader>
              <FormMeta>
                <FormMetaItem>
                  <FileText />
                  Creado: {form.createdAt}
                </FormMetaItem>
              </FormMeta>
              <FormDescription>{form.description}</FormDescription>
              <FormActions>
                <EditButton onClick={() => navigate(`/editar-formulario/${form.id}`)}>
                  <Edit />
                  Editar
                </EditButton>
                <PreviewButton onClick={() => navigate(`/vista-formulario/${form.id}`)}>
                  <Eye />
                  Vista Previa
                </PreviewButton>
                <DeleteButton onClick={() => handleDelete(form.id)}>
                  <Trash2 />
                </DeleteButton>
              </FormActions>
            </FormCard>
          ))
        ) : (
          <EmptyState>
            <FileText />
            <h3>No hay formularios</h3>
            <p>Crea tu primer formulario para comenzar</p>
          </EmptyState>
        )}
      </Content>

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        type="warning"
        title="Eliminar Formulario"
        message="¿Estás seguro de eliminar este formulario? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </PageContainer>
  );
};

export default GestionFormularios;
