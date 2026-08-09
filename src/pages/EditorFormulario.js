import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Plus, 
  Save, 
  X, 
  FileText,
  Type,
  AlignLeft,
  List,
  PenTool,
  Trash2,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Edit2,
  Heading1,
  Heading2,
  FileTextIcon,
  Image
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

const Section = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
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
  padding: 14px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
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
  padding: 14px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  font-size: 15px;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.background};
  min-height: 100px;
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

const FieldsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const FieldCount = styled.span`
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const FieldTypeSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
`;

const FieldTypeButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: ${({ $active, theme }) => $active ? theme.colors.primaryLight : theme.colors.background};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.text};
  border: 2px solid ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.border};
  border-radius: 12px;
  font-size: 13px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.3s ease;

  svg {
    width: 24px;
    height: 24px;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.primaryLight};
  }
`;

const NewFieldCard = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 2px dashed ${({ theme }) => theme.colors.primary};
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
`;

const NewFieldTitle = styled.h3`
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 16px 0;
`;

const FieldCard = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
`;

const FieldCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const FieldIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $type, theme }) => {
    switch ($type) {
      case 'text': return theme.colors.primaryLight;
      case 'textarea': return `${theme.colors.success}20`;
      case 'multiple': return `${theme.colors.warning}20`;
      case 'signature': return `${theme.colors.info}20`;
      case 'imagen': return `${theme.colors.primary}20`;
      default: return theme.colors.background;
    }
  }};
  color: ${({ $type, theme }) => {
    switch ($type) {
      case 'text': return theme.colors.primary;
      case 'textarea': return theme.colors.success;
      case 'multiple': return theme.colors.warning;
      case 'signature': return theme.colors.info;
      case 'imagen': return theme.colors.primary;
      default: return theme.colors.textSecondary;
    }
  }};

  svg {
    width: 20px;
    height: 20px;
  }
`;

const FieldInfo = styled.div`
  flex: 1;
`;

const FieldName = styled.div`
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const RequiredBadge = styled.span`
  color: ${({ theme }) => theme.colors.danger};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

const FieldType = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 2px;
`;

const FieldOptions = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const FieldActionsContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const MoveFieldButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: ${({ theme }) => theme.colors.gray};
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

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary};
    color: white;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const EditFieldButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: white;
  }
`;

const DeleteFieldButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: ${({ theme }) => `${theme.colors.danger}15`};
  color: ${({ theme }) => theme.colors.danger};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.danger};
    color: white;
  }
`;

const OptionsContainer = styled.div`
  margin-top: 16px;
`;

const OptionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

const OptionInput = styled.input`
  flex: 1;
  padding: 12px 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.white};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const RemoveOptionButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: ${({ theme }) => `${theme.colors.danger}15`};
  color: ${({ theme }) => theme.colors.danger};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.danger};
    color: white;
  }
`;

const AddOptionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  border: 1px dashed ${({ theme }) => theme.colors.primary};
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  justify-content: center;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.primaryLight};
  }
`;

const RequiredToggle = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  margin-top: 16px;
  padding: 12px;
  background: ${({ theme }) => theme.colors.white};
  border-radius: 10px;

  input {
    width: 18px;
    height: 18px;
    accent-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
`;

const CancelFieldButton = styled.button`
  flex: 1;
  padding: 12px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`;

const AddFieldConfirmButton = styled.button`
  flex: 1;
  padding: 12px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AddFieldButton = styled.button`
  width: 100%;
  padding: 16px;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.primary};
  border: 2px dashed ${({ theme }) => theme.colors.primary};
  border-radius: 12px;
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.primaryLight};
  }
`;

const EmptyFields = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${({ theme }) => theme.colors.textSecondary};

  svg {
    width: 48px;
    height: 48px;
    margin-bottom: 12px;
    opacity: 0.5;
  }

  p {
    font-size: 14px;
    margin: 0;
  }
`;

const FooterActions = styled.div`
  position: fixed;
  bottom: 80px;
  left: 0;
  right: 0;
  background: ${({ theme }) => theme.colors.white};
  padding: 16px 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  gap: 12px;
  z-index: 100;
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 14px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`;

const SaveButton = styled.button`
  flex: 2;
  padding: 14px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EditorFormulario = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fields: []
  });

  const [showAddField, setShowAddField] = useState(false);
  const [selectedFieldType, setSelectedFieldType] = useState(null);
  const [newField, setNewField] = useState({
    label: '',
    required: false,
    options: [''],
    imageUrl: ''
  });
  const [editingFieldId, setEditingFieldId] = useState(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Cargar formulario existente si estamos editando
  useEffect(() => {
    if (isEditing) {
      fetchForm();
    }
  }, [id, isEditing]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      const response = await formulariosService.getById(id);
      const form = response.data;
      if (form) {
        const campos = form.campos ? (typeof form.campos === 'string' ? JSON.parse(form.campos) : form.campos) : [];
        setFormData({
          name: form.nombre,
          description: form.descripcion || '',
          fields: campos
        });
      }
    } catch (error) {
      console.error('Error fetching form:', error);
      setErrorMessage('Error al cargar el formulario');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const fieldTypes = [
    { type: 'titulo', label: 'Título', icon: Heading1, description: 'Encabezado principal' },
    { type: 'subtitulo', label: 'Subtítulo', icon: Heading2, description: 'Encabezado secundario' },
    { type: 'parrafo', label: 'Párrafo', icon: FileTextIcon, description: 'Texto informativo' },
    { type: 'textarea', label: 'Pregunta Abierta', icon: AlignLeft, description: 'Respuestas largas' },
    { type: 'multiple', label: 'Opción Múltiple', icon: List, description: 'Selección de opciones' },
    { type: 'signature', label: 'Campo de Firma', icon: PenTool, description: 'Firma digital' },
    { type: 'imagen', label: 'Imagen Anotable', icon: Image, description: 'Imagen para dibujar/anotar' },
  ];

  const getFieldIcon = (type) => {
    const fieldType = fieldTypes.find(f => f.type === type);
    return fieldType ? fieldType.icon : Type;
  };

  const getFieldTypeName = (type) => {
    const fieldType = fieldTypes.find(f => f.type === type);
    return fieldType ? fieldType.label : type;
  };

  const handleAddField = () => {
    if (!newField.label || !selectedFieldType) {
      setErrorMessage('Por favor ingresa una etiqueta para el campo');
      setShowErrorModal(true);
      return;
    }

    // Validación especial para imagen
    if (selectedFieldType === 'imagen' && !newField.imageUrl?.trim()) {
      setErrorMessage('Por favor ingresa la URL de la imagen');
      setShowErrorModal(true);
      return;
    }

    const field = {
      id: editingFieldId || Date.now(),
      type: selectedFieldType,
      label: newField.label,
      required: newField.required,
      ...(selectedFieldType === 'multiple' && { 
        options: newField.options.filter(o => o.trim()) 
      }),
      ...(selectedFieldType === 'imagen' && { 
        imageUrl: newField.imageUrl 
      })
    };

    if (selectedFieldType === 'multiple' && (!field.options || field.options.length === 0)) {
      setErrorMessage('Agrega al menos una opción');
      setShowErrorModal(true);
      return;
    }

    if (editingFieldId) {
      // Editar campo existente
      setFormData(prev => ({
        ...prev,
        fields: prev.fields.map(f => f.id === editingFieldId ? field : f)
      }));
    } else {
      // Agregar nuevo campo
      setFormData(prev => ({
        ...prev,
        fields: [...prev.fields, field]
      }));
    }

    setShowAddField(false);
    setSelectedFieldType(null);
    setNewField({ label: '', required: false, options: [''], imageUrl: '' });
    setEditingFieldId(null);
  };

  const handleEditField = (field) => {
    setEditingFieldId(field.id);
    setSelectedFieldType(field.type);
    setNewField({
      label: field.label,
      required: field.required,
      options: field.options || [''],
      imageUrl: field.imageUrl || ''
    });
    setShowAddField(true);
  };

  const handleCancelFieldEdit = () => {
    setShowAddField(false);
    setSelectedFieldType(null);
    setNewField({ label: '', required: false, options: [''], imageUrl: '' });
    setEditingFieldId(null);
  };

  const handleRemoveField = (fieldId) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId)
    }));
  };

  const handleMoveFieldUp = (index) => {
    if (index === 0) return;
    setFormData(prev => {
      const newFields = [...prev.fields];
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
      return { ...prev, fields: newFields };
    });
  };

  const handleMoveFieldDown = (index) => {
    setFormData(prev => {
      if (index >= prev.fields.length - 1) return prev;
      const newFields = [...prev.fields];
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
      return { ...prev, fields: newFields };
    });
  };

  const handleAddOption = () => {
    setNewField(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const handleRemoveOption = (index) => {
    if (newField.options.length > 1) {
      setNewField(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const handleOptionChange = (index, value) => {
    setNewField(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setErrorMessage('El nombre del formulario es obligatorio');
      setShowErrorModal(true);
      return;
    }

    if (formData.fields.length === 0) {
      setErrorMessage('Agrega al menos un campo al formulario');
      setShowErrorModal(true);
      return;
    }

    try {
      setSaving(true);
      
      if (isEditing) {
        await formulariosService.update(id, {
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
      
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving form:', error);
      setErrorMessage('Error al guardar el formulario');
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate('/gestion-formularios');
  };

  return (
    <PageContainer>
      <Header 
        title={isEditing ? 'Editar Formulario' : 'Nuevo Formulario'} 
        showBack 
      />

      <Content>
        {/* Información básica */}
        <Section>
          <SectionTitle>
            <FileText />
            Información del Formulario
          </SectionTitle>
          
          <FormGroup>
            <Label>Nombre del Formulario *</Label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Consentimiento Informado"
            />
          </FormGroup>

          <FormGroup>
            <Label>Descripción</Label>
            <TextArea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe el propósito de este formulario..."
            />
          </FormGroup>
        </Section>

        {/* Campos del formulario */}
        <Section>
          <FieldsHeader>
            <SectionTitle style={{ margin: 0 }}>
              <List />
              Campos del Formulario
            </SectionTitle>
            <FieldCount>{formData.fields.length} campos</FieldCount>
          </FieldsHeader>

          {/* Agregar nuevo campo */}
          {showAddField ? (
            <NewFieldCard>
              <NewFieldTitle>{editingFieldId ? 'Editar Campo' : 'Agregar Campo'}</NewFieldTitle>
              
              <Label>Tipo de Campo</Label>
              <FieldTypeSelector>
                {fieldTypes.map(ft => (
                  <FieldTypeButton
                    key={ft.type}
                    $active={selectedFieldType === ft.type}
                    onClick={() => !editingFieldId && setSelectedFieldType(ft.type)}
                    style={editingFieldId ? { opacity: selectedFieldType === ft.type ? 1 : 0.5, cursor: editingFieldId ? 'default' : 'pointer' } : {}}
                  >
                    <ft.icon />
                    {ft.label}
                  </FieldTypeButton>
                ))}
              </FieldTypeSelector>

              {selectedFieldType && (
                <>
                  <FormGroup>
                    <Label>
                      {selectedFieldType === 'parrafo' ? 'Contenido del Párrafo *' : 
                       selectedFieldType === 'titulo' ? 'Texto del Título *' :
                       selectedFieldType === 'subtitulo' ? 'Texto del Subtítulo *' :
                       'Etiqueta del Campo *'}
                    </Label>
                    {selectedFieldType === 'parrafo' ? (
                      <TextArea
                        value={newField.label}
                        onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                        placeholder="Escribe el contenido del párrafo. Usa Enter para saltos de línea."
                        rows={4}
                      />
                    ) : (
                      <Input
                        type="text"
                        value={newField.label}
                        onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                        placeholder={
                          selectedFieldType === 'titulo' ? 'Ej: Información del Paciente' :
                          selectedFieldType === 'subtitulo' ? 'Ej: Datos Personales' :
                          'Ej: Nombre completo del paciente'
                        }
                      />
                    )}
                  </FormGroup>

                  {selectedFieldType === 'multiple' && (
                    <OptionsContainer>
                      <Label>Opciones</Label>
                      {newField.options.map((option, index) => (
                        <OptionRow key={index}>
                          <OptionInput
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            placeholder={`Opción ${index + 1}`}
                          />
                          {newField.options.length > 1 && (
                            <RemoveOptionButton onClick={() => handleRemoveOption(index)}>
                              <X />
                            </RemoveOptionButton>
                          )}
                        </OptionRow>
                      ))}
                      <AddOptionButton onClick={handleAddOption}>
                        <Plus />
                        Agregar otra opción
                      </AddOptionButton>
                    </OptionsContainer>
                  )}

                  {selectedFieldType === 'imagen' && (
                    <FormGroup style={{ marginTop: 16 }}>
                      <Label>
                        <Image size={16} />
                        Subir Imagen *
                      </Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              setErrorMessage('La imagen no debe superar 5MB');
                              setShowErrorModal(true);
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setNewField(prev => ({ ...prev, imageUrl: event.target.result }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        style={{ padding: '10px 12px' }}
                      />
                      {newField.imageUrl && (
                        <div style={{ marginTop: 12, borderRadius: 8, overflow: 'hidden', border: '1px solid #e0e0e0', position: 'relative' }}>
                          <img 
                            src={newField.imageUrl} 
                            alt="Vista previa" 
                            style={{ width: '100%', maxHeight: 200, objectFit: 'contain', background: '#f5f5f5' }}
                          />
                          <button
                            type="button"
                            onClick={() => setNewField(prev => ({ ...prev, imageUrl: '' }))}
                            style={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              background: 'rgba(0,0,0,0.6)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: 28,
                              height: 28,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </FormGroup>
                  )}

                  {/* Solo mostrar toggle de requerido para campos que necesitan respuesta */}
                  {!['titulo', 'subtitulo', 'parrafo'].includes(selectedFieldType) && (
                    <RequiredToggle>
                      <input
                        type="checkbox"
                        checked={newField.required}
                        onChange={(e) => setNewField(prev => ({ ...prev, required: e.target.checked }))}
                      />
                      Este campo es obligatorio
                    </RequiredToggle>
                  )}

                  <ButtonRow>
                    <CancelFieldButton onClick={handleCancelFieldEdit}>
                      Cancelar
                    </CancelFieldButton>
                    <AddFieldConfirmButton 
                      onClick={handleAddField}
                      disabled={!newField.label.trim()}
                    >
                      {editingFieldId ? <Save /> : <Plus />}
                      {editingFieldId ? 'Guardar Cambios' : 'Agregar Campo'}
                    </AddFieldConfirmButton>
                  </ButtonRow>
                </>
              )}
            </NewFieldCard>
          ) : (
            <AddFieldButton onClick={() => setShowAddField(true)}>
              <Plus />
              Agregar Campo
            </AddFieldButton>
          )}

          {/* Lista de campos */}
          {formData.fields.length > 0 ? (
            <div style={{ marginTop: 20 }}>
              {formData.fields.map((field, index) => {
                const FieldIconComponent = getFieldIcon(field.type);
                const isBeingEdited = editingFieldId === field.id;
                const isFirst = index === 0;
                const isLast = index === formData.fields.length - 1;
                return (
                  <FieldCard key={field.id} style={isBeingEdited ? { opacity: 0.5 } : {}}>
                    <FieldCardHeader>
                      <FieldIcon $type={field.type}>
                        <FieldIconComponent />
                      </FieldIcon>
                      <FieldInfo>
                        <FieldName>
                          {field.label}
                          {field.required && <RequiredBadge>*</RequiredBadge>}
                        </FieldName>
                        <FieldType>{getFieldTypeName(field.type)}</FieldType>
                      </FieldInfo>
                      <FieldActionsContainer>
                        <MoveFieldButton 
                          onClick={() => handleMoveFieldUp(index)}
                          disabled={isFirst || showAddField}
                          title="Mover arriba"
                        >
                          <ChevronUp />
                        </MoveFieldButton>
                        <MoveFieldButton 
                          onClick={() => handleMoveFieldDown(index)}
                          disabled={isLast || showAddField}
                          title="Mover abajo"
                        >
                          <ChevronDown />
                        </MoveFieldButton>
                        <EditFieldButton 
                          onClick={() => handleEditField(field)}
                          disabled={showAddField}
                          style={showAddField ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        >
                          <Edit2 />
                        </EditFieldButton>
                        <DeleteFieldButton 
                          onClick={() => handleRemoveField(field.id)}
                          disabled={showAddField}
                          style={showAddField ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        >
                          <Trash2 />
                        </DeleteFieldButton>
                      </FieldActionsContainer>
                    </FieldCardHeader>
                    {field.type === 'multiple' && field.options && (
                      <FieldOptions>
                        Opciones: {field.options.join(' • ')}
                      </FieldOptions>
                    )}
                    {field.type === 'imagen' && field.imageUrl && (
                      <FieldOptions>
                        <div style={{ marginTop: 8, borderRadius: 6, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                          <img 
                            src={field.imageUrl} 
                            alt="Imagen del campo" 
                            style={{ width: '100%', maxHeight: 100, objectFit: 'contain', background: '#f5f5f5' }}
                          />
                        </div>
                      </FieldOptions>
                    )}
                  </FieldCard>
                );
              })}
            </div>
          ) : !showAddField && (
            <EmptyFields>
              <FileText />
              <p>No hay campos. Agrega el primer campo para tu formulario.</p>
            </EmptyFields>
          )}
        </Section>

        {/* Espacio para el footer fijo */}
        <div style={{ height: 80 }} />
      </Content>

      {/* Acciones del footer */}
      <FooterActions>
        <CancelButton onClick={() => navigate('/gestion-formularios')}>
          Cancelar
        </CancelButton>
        <SaveButton 
          onClick={handleSave}
          disabled={!formData.name.trim() || formData.fields.length === 0}
        >
          <Save />
          {isEditing ? 'Guardar Cambios' : 'Crear Formulario'}
        </SaveButton>
      </FooterActions>

      {/* Modal de éxito */}
      <Modal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        type="success"
        title={isEditing ? '¡Formulario Actualizado!' : '¡Formulario Creado!'}
        message={isEditing 
          ? 'El formulario se ha actualizado correctamente.' 
          : 'El formulario se ha creado correctamente y está listo para usar.'
        }
        confirmText="Aceptar"
        onConfirm={handleSuccessClose}
      />

      {/* Modal de error */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        type="error"
        title="Error"
        message={errorMessage}
        confirmText="Entendido"
        onConfirm={() => setShowErrorModal(false)}
      />
    </PageContainer>
  );
};

export default EditorFormulario;
