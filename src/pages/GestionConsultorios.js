import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  DoorOpen,
  MapPin,
  Palette,
  Users,
  X,
  Check,
  Loader
} from 'lucide-react';
import Header from '../components/Layout/Header';
import Modal from '../components/Modal';
import { consultoriosInternosService } from '../services/api';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding-bottom: 100px;
  overflow-y: auto;
`;

const Content = styled.div`
  padding: 20px;
`;

const ConsultorioCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 16px;
`;

const ColorIndicator = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${({ $color }) => $color || '#4F46E5'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 24px;
    height: 24px;
    color: white;
  }
`;

const ConsultorioInfo = styled.div`
  flex: 1;
`;

const ConsultorioNombre = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 4px 0;
`;

const ConsultorioDetalle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const ConsultorioActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  svg {
    width: 18px;
    height: 18px;
  }
`;

const EditButton = styled(ActionButton)`
  background: ${({ theme }) => `${theme.colors.primary}15`};
  color: ${({ theme }) => theme.colors.primary};

  &:hover {
    background: ${({ theme }) => `${theme.colors.primary}25`};
  }
`;

const DeleteButton = styled(ActionButton)`
  background: ${({ theme }) => `${theme.colors.error}15`};
  color: ${({ theme }) => theme.colors.error};

  &:hover {
    background: ${({ theme }) => `${theme.colors.error}25`};
  }
`;

const StatusBadge = styled.span`
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: ${({ $active, theme }) => $active ? `${theme.colors.success}20` : `${theme.colors.error}20`};
  color: ${({ $active, theme }) => $active ? theme.colors.success : theme.colors.error};
`;

const AddButton = styled.button`
  position: fixed;
  bottom: 100px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  svg {
    width: 24px;
    height: 24px;
  }

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(79, 70, 229, 0.5);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;

  svg {
    width: 64px;
    height: 64px;
    color: ${({ theme }) => theme.colors.textSecondary};
    margin-bottom: 16px;
  }

  h3 {
    font-size: 18px;
    color: ${({ theme }) => theme.colors.text};
    margin: 0 0 8px 0;
  }

  p {
    font-size: 14px;
    color: ${({ theme }) => theme.colors.textSecondary};
    margin: 0;
  }
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;

  svg {
    animation: spin 1s linear infinite;
    color: ${({ theme }) => theme.colors.primary};
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Modal Styles
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
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 70vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    width: 22px;
    height: 22px;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const CloseButton = styled.button`
  background: ${({ theme }) => theme.colors.background};
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  overflow-y: auto;
`;

const FormField = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ColorPicker = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const ColorOption = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${({ $color }) => $color};
  border: 3px solid ${({ $selected, theme }) => $selected ? theme.colors.text : 'transparent'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Toggle = styled.div`
  width: 50px;
  height: 28px;
  border-radius: 14px;
  background: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.border};
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;

  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: ${({ $active }) => $active ? '25px' : '3px'};
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: white;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const ModalFooter = styled.div`
  padding: 16px 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  gap: 12px;
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
`;

const SaveBtn = styled.button`
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  border: none;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const COLORS = [
  '#4F46E5', // Indigo
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#6366F1', // Blue
];

const GestionConsultorios = () => {
  const navigate = useNavigate();
  const [consultorios, setConsultorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConsultorio, setEditingConsultorio] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    ubicacion: '',
    color: '#4F46E5',
    capacidad: 1,
    equipamiento: '',
    activo: true
  });

  // Cargar consultorios
  useEffect(() => {
    fetchConsultorios();
  }, []);

  const fetchConsultorios = async () => {
    try {
      setLoading(true);
      const response = await consultoriosInternosService.getAll();
      if (response.success) {
        setConsultorios(response.data.consultorios || []);
      }
    } catch (error) {
      console.error('Error al cargar consultorios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (consultorio = null) => {
    if (consultorio) {
      setEditingConsultorio(consultorio);
      setFormData({
        nombre: consultorio.nombre || '',
        descripcion: consultorio.descripcion || '',
        ubicacion: consultorio.ubicacion || '',
        color: consultorio.color || '#4F46E5',
        capacidad: consultorio.capacidad || 1,
        equipamiento: consultorio.equipamiento || '',
        activo: consultorio.activo !== false
      });
    } else {
      setEditingConsultorio(null);
      setFormData({
        nombre: '',
        descripcion: '',
        ubicacion: '',
        color: '#4F46E5',
        capacidad: 1,
        equipamiento: '',
        activo: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingConsultorio(null);
  };

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      alert('El nombre del consultorio es requerido');
      return;
    }

    setSaving(true);
    try {
      if (editingConsultorio) {
        await consultoriosInternosService.update(editingConsultorio.uuid, formData);
      } else {
        await consultoriosInternosService.create(formData);
      }
      await fetchConsultorios();
      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar consultorio:', error);
      alert('Error al guardar el consultorio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (consultorio) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${consultorio.nombre}"?`)) {
      return;
    }

    try {
      await consultoriosInternosService.delete(consultorio.uuid);
      await fetchConsultorios();
    } catch (error) {
      console.error('Error al eliminar consultorio:', error);
      alert('Error al eliminar el consultorio');
    }
  };

  return (
    <PageContainer>
      <Header title="Consultorios" showBack />

      <Content>
        {loading ? (
          <LoadingState>
            <Loader size={40} />
          </LoadingState>
        ) : consultorios.length === 0 ? (
          <EmptyState>
            <DoorOpen />
            <h3>No hay consultorios</h3>
            <p>Agrega consultorios para asignarlos a las citas</p>
          </EmptyState>
        ) : (
          consultorios.map((consultorio) => (
            <ConsultorioCard key={consultorio.uuid}>
              <ColorIndicator $color={consultorio.color}>
                <DoorOpen />
              </ColorIndicator>
              <ConsultorioInfo>
                <ConsultorioNombre>{consultorio.nombre}</ConsultorioNombre>
                {consultorio.ubicacion && (
                  <ConsultorioDetalle>
                    <MapPin />
                    {consultorio.ubicacion}
                  </ConsultorioDetalle>
                )}
                <div style={{ marginTop: 8 }}>
                  <StatusBadge $active={consultorio.activo}>
                    {consultorio.activo ? 'Activo' : 'Inactivo'}
                  </StatusBadge>
                </div>
              </ConsultorioInfo>
              <ConsultorioActions>
                <EditButton onClick={() => handleOpenModal(consultorio)}>
                  <Edit2 />
                </EditButton>
                <DeleteButton onClick={() => handleDelete(consultorio)}>
                  <Trash2 />
                </DeleteButton>
              </ConsultorioActions>
            </ConsultorioCard>
          ))
        )}
      </Content>

      <AddButton onClick={() => handleOpenModal()}>
        <Plus />
      </AddButton>

      {/* Modal para crear/editar consultorio */}
      {showModal && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <DoorOpen />
                {editingConsultorio ? 'Editar Consultorio' : 'Nuevo Consultorio'}
              </ModalTitle>
              <CloseButton onClick={handleCloseModal}>
                <X />
              </CloseButton>
            </ModalHeader>

            <ModalBody>
              <FormField>
                <Label>Nombre *</Label>
                <Input
                  type="text"
                  placeholder="Ej: Consultorio 1"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </FormField>

              <FormField>
                <Label>Ubicación</Label>
                <Input
                  type="text"
                  placeholder="Ej: Planta baja, Sala A"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                />
              </FormField>

              <FormField>
                <Label>Descripción</Label>
                <TextArea
                  placeholder="Descripción del consultorio..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </FormField>

              <FormField>
                <Label>Equipamiento</Label>
                <TextArea
                  placeholder="Equipo disponible en el consultorio..."
                  value={formData.equipamiento}
                  onChange={(e) => setFormData({ ...formData, equipamiento: e.target.value })}
                />
              </FormField>

              <FormField>
                <Label>Color</Label>
                <ColorPicker>
                  {COLORS.map((color) => (
                    <ColorOption
                      key={color}
                      type="button"
                      $color={color}
                      $selected={formData.color === color}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </ColorPicker>
              </FormField>

              <FormField>
                <Label>Capacidad</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.capacidad}
                  onChange={(e) => setFormData({ ...formData, capacidad: parseInt(e.target.value) || 1 })}
                />
              </FormField>

              <FormField>
                <ToggleContainer>
                  <Label style={{ margin: 0 }}>Activo</Label>
                  <Toggle
                    $active={formData.activo}
                    onClick={() => setFormData({ ...formData, activo: !formData.activo })}
                  />
                </ToggleContainer>
              </FormField>
            </ModalBody>

            <ModalFooter>
              <CancelButton onClick={handleCloseModal} disabled={saving}>
                Cancelar
              </CancelButton>
              <SaveBtn onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader size={18} />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check />
                    {editingConsultorio ? 'Actualizar' : 'Crear'}
                  </>
                )}
              </SaveBtn>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default GestionConsultorios;
