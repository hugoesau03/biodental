import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  DollarSign,
  FileText,
  Tag,
  Clock,
  Loader,
  Check,
  User
} from 'lucide-react';
import Header from '../components/Layout/Header';
import Modal from '../components/Modal';
import { serviciosService, usuariosService } from '../services/api';

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

const ServiceCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const ServiceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const ServiceName = styled.h3`
  font-size: 17px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const ServicePrice = styled.div`
  background: ${({ theme }) => theme.colors.success};
  color: ${({ theme }) => theme.colors.successText};
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const ServiceMeta = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
`;

const ServiceDuration = styled.div`
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

const ServiceDescription = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 16px 0;
  line-height: 1.5;
`;

const ServiceActions = styled.div`
  display: flex;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.3s ease;

  svg {
    width: 16px;
    height: 16px;
  }
`;

const EditButton = styled(ActionButton)`
  background: ${({ theme }) => theme.colors.info};
  color: ${({ theme }) => theme.colors.infoText};
  border: none;

  &:hover {
    opacity: 0.9;
  }
`;

const DeleteButton = styled(ActionButton)`
  background: ${({ theme }) => theme.colors.danger};
  color: ${({ theme }) => theme.colors.dangerText};
  border: none;

  &:hover {
    opacity: 0.9;
  }
`;

const EditIconButton = styled.button`
  background: ${({ theme }) => theme.colors.info};
  color: ${({ theme }) => theme.colors.infoText};
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin-left: 8px;

  &:hover {
    opacity: 0.8;
    transform: scale(1.05);
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
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 70vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
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
  justify-content: center;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const ModalBody = styled.div`
  padding: 20px;
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
  padding: 14px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  font-size: 15px;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.background};
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(51, 169, 255, 0.1);
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 14px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
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
    box-shadow: 0 0 0 3px rgba(51, 169, 255, 0.1);
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const PriceInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const PriceSymbol = styled.span`
  position: absolute;
  left: 16px;
  font-size: 15px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const PriceInput = styled(Input)`
  padding-left: 36px;
`;

const ModalFooter = styled.div`
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 14px;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
  }
`;

const SaveButton = styled.button`
  flex: 1;
  padding: 14px;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
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

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;

  svg {
    width: 48px;
    height: 48px;
    color: ${({ theme }) => theme.colors.textSecondary};
    margin-bottom: 16px;
  }

  p {
    font-size: 15px;
    color: ${({ theme }) => theme.colors.textSecondary};
    margin: 0;
  }
`;

const DoctorInfo = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const DoctorAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const DoctorDetails = styled.div`
  flex: 1;
`;

const DoctorName = styled.h3`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 4px 0;
`;

const DoctorSpecialty = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 16px 0;
`;

const ServiceCheckbox = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 2px solid ${({ $checked, theme }) => $checked ? theme.colors.primary : theme.colors.border};
  background: ${({ $checked, theme }) => $checked ? theme.colors.primary : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    color: white;
    width: 14px;
    height: 14px;
  }
`;

const ServiceCardSelectable = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  border: 2px solid ${({ $selected, theme }) => $selected ? theme.colors.primary : 'transparent'};
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primaryLight};
  }
`;

const ServiceInfo = styled.div`
  flex: 1;
`;

const GestionServicios = () => {
  const navigate = useNavigate();
  const { id: doctorUuid } = useParams();

  // Estado para los servicios
  const [services, setServices] = useState([]);
  const [doctorServices, setDoctorServices] = useState([]); // UUIDs de servicios asignados al doctor
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);

  // Cargar datos del doctor y servicios
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Cargar todos los servicios del consultorio
        const serviciosRes = await serviciosService.getAll();
        if (serviciosRes.success) {
          const serviciosFormateados = (serviciosRes.data.servicios || []).map(s => ({
            id: s.id,
            uuid: s.uuid,
            name: s.nombre,
            description: s.descripcion || '',
            price: parseFloat(s.precio) || 0,
            duration: s.duracion_minutos || 30
          }));
          setServices(serviciosFormateados);
        }

        // Si hay un doctor específico, cargar sus servicios asignados
        if (doctorUuid) {
          const doctorRes = await usuariosService.getById(doctorUuid);
          if (doctorRes.success) {
            setDoctor(doctorRes.data);
          }

          const doctorServRes = await serviciosService.getByDoctor(doctorUuid);
          if (doctorServRes.success) {
            const uuids = (doctorServRes.data.servicios || []).map(s => s.uuid);
            setDoctorServices(uuids);
          }
        }
      } catch (err) {
        console.error('Error cargando datos:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [doctorUuid]);

  // Toggle servicio para el doctor
  const handleToggleService = async (service) => {
    if (!doctorUuid) return;

    const isAssigned = doctorServices.includes(service.uuid);
    setSaving(true);

    try {
      if (isAssigned) {
        await serviciosService.quitarDeDoctor(doctorUuid, service.uuid);
        setDoctorServices(prev => prev.filter(uuid => uuid !== service.uuid));
      } else {
        await serviciosService.agregarADoctor(doctorUuid, service.uuid);
        setDoctorServices(prev => [...prev, service.uuid]);
      }
    } catch (err) {
      console.error('Error actualizando servicios del doctor:', err);
      alert('Error al actualizar servicios');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenModal = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description,
        price: service.price.toString(),
        duration: service.duration.toString()
      });
    } else {
      setEditingService(null);
      setFormData({ name: '', description: '', price: '', duration: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingService(null);
    setFormData({ name: '', description: '', price: '', duration: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.duration) return;

    setSaving(true);
    try {
      const servicioData = {
        nombre: formData.name,
        descripcion: formData.description || null,
        precio: parseFloat(formData.price),
        duracion_minutos: parseInt(formData.duration)
      };

      if (editingService) {
        // Editar servicio existente
        const response = await serviciosService.update(editingService.uuid, servicioData);
        if (response.success) {
          setServices(prev => prev.map(s => 
            s.id === editingService.id 
              ? { ...s, name: formData.name, description: formData.description, price: parseFloat(formData.price), duration: parseInt(formData.duration) }
              : s
          ));
        }
      } else {
        // Agregar nuevo servicio
        const response = await serviciosService.create(servicioData);
        if (response.success) {
          const newService = {
            id: response.data.id,
            uuid: response.data.uuid,
            name: formData.name,
            description: formData.description || '',
            price: parseFloat(formData.price),
            duration: parseInt(formData.duration)
          };
          setServices(prev => [...prev, newService]);
          
          // Si estamos en la vista de un doctor, asignar automáticamente el servicio
          if (doctorUuid && response.data.uuid) {
            try {
              await serviciosService.agregarADoctor(doctorUuid, response.data.uuid);
              setDoctorServices(prev => [...prev, response.data.uuid]);
            } catch (err) {
              console.error('Error asignando servicio al doctor:', err);
            }
          }
        }
      }

      handleCloseModal();
    } catch (err) {
      console.error('Error guardando servicio:', err);
      alert('Error al guardar el servicio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (service) => {
    setServiceToDelete(service);
    setShowDeleteModal(true);
  };

  const confirmDeleteService = async () => {
    if (serviceToDelete) {
      try {
        const response = await serviciosService.delete(serviceToDelete.uuid);
        if (response.success) {
          setServices(prev => prev.filter(s => s.id !== serviceToDelete.id));
        }
      } catch (err) {
        console.error('Error eliminando servicio:', err);
        alert('Error al eliminar el servicio');
      }
    }
    setShowDeleteModal(false);
    setServiceToDelete(null);
  };

  if (loading) {
    return (
      <PageContainer>
        <Header title={doctorUuid ? "Servicios del Médico" : "Gestión de Servicios"} showBack />
        <Content>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Loader className="spin" size={32} />
          </div>
        </Content>
      </PageContainer>
    );
  }

  // Vista para asignar servicios a un doctor específico
  if (doctorUuid) {
    return (
      <PageContainer>
        <Header title="Servicios del Médico" showBack />
        <Content>
          {doctor && (
            <DoctorInfo>
              <DoctorAvatar>
                {doctor.nombre?.charAt(0)}{doctor.apellidos?.charAt(0)}
              </DoctorAvatar>
              <DoctorDetails>
                <DoctorName>Dr. {doctor.nombre} {doctor.apellidos}</DoctorName>
                <DoctorSpecialty>{doctor.especialidad || 'Médico General'}</DoctorSpecialty>
              </DoctorDetails>
            </DoctorInfo>
          )}

          <AddButton onClick={() => handleOpenModal()}>
            <Plus />
            Crear Nuevo Servicio
          </AddButton>

          <SectionTitle>Selecciona los servicios que ofrece este médico:</SectionTitle>

          {services.length > 0 ? (
            services.map(service => {
              const isAssigned = doctorServices.includes(service.uuid);
              return (
                <ServiceCardSelectable 
                  key={service.uuid} 
                  $selected={isAssigned}
                >
                  <ServiceCheckbox 
                    $checked={isAssigned}
                    onClick={() => handleToggleService(service)}
                  >
                    {isAssigned && <Check />}
                  </ServiceCheckbox>
                  <ServiceInfo onClick={() => handleToggleService(service)}>
                    <ServiceName>{service.name}</ServiceName>
                    <ServiceMeta>
                      <ServiceDuration>
                        <Clock />
                        {service.duration} min
                      </ServiceDuration>
                    </ServiceMeta>
                  </ServiceInfo>
                  <ServicePrice onClick={() => handleToggleService(service)}>${service.price.toFixed(2)}</ServicePrice>
                  <EditIconButton onClick={(e) => { e.stopPropagation(); handleOpenModal(service); }}>
                    <Edit size={18} />
                  </EditIconButton>
                </ServiceCardSelectable>
              );
            })
          ) : (
            <EmptyState>
              <FileText />
              <p>No hay servicios disponibles. Crea el primer servicio.</p>
            </EmptyState>
          )}

          {saving && (
            <div style={{ textAlign: 'center', padding: '10px', color: '#666' }}>
              <Loader className="spin" size={16} style={{ marginRight: 8 }} />
              Guardando...
            </div>
          )}
        </Content>

        {/* Modal de formulario para crear/editar servicio */}
        {showModal && (
          <ModalOverlay onClick={handleCloseModal}>
            <ModalContent onClick={e => e.stopPropagation()}>
              <ModalHeader>
                <ModalTitle>
                  {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
                </ModalTitle>
                <CloseButton onClick={handleCloseModal}>
                  <X size={24} />
                </CloseButton>
              </ModalHeader>

              <ModalBody>
                <FormGroup>
                  <Label>
                    <Tag />
                    Nombre del Servicio
                  </Label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ej: Consulta General"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>
                    <FileText />
                    Descripción
                  </Label>
                  <TextArea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe el servicio..."
                  />
                </FormGroup>

                <FormGroup>
                  <Label>
                    <DollarSign />
                    Precio
                  </Label>
                  <PriceInputWrapper>
                    <PriceSymbol>$</PriceSymbol>
                    <PriceInput
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </PriceInputWrapper>
                </FormGroup>

                <FormGroup>
                  <Label>
                    <Clock />
                    Duración Aproximada (minutos)
                  </Label>
                  <Input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="Ej: 30"
                    min="5"
                    step="5"
                  />
                </FormGroup>
              </ModalBody>

              <ModalFooter>
                <CancelButton onClick={handleCloseModal}>
                  Cancelar
                </CancelButton>
                <SaveButton onClick={handleSave} disabled={saving}>
                  <Save />
                  {saving ? 'Guardando...' : 'Guardar'}
                </SaveButton>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </PageContainer>
    );
  }

  // Vista general para gestionar servicios del consultorio
  return (
    <PageContainer>
      <Header title="Gestión de Servicios" showBack />

      <Content>
        <AddButton onClick={() => handleOpenModal()}>
          <Plus />
          Agregar Nuevo Servicio
        </AddButton>

        {services.length > 0 ? (
          services.map(service => (
            <ServiceCard key={service.id}>
              <ServiceHeader>
                <ServiceName>{service.name}</ServiceName>
                <ServicePrice>${service.price.toFixed(2)}</ServicePrice>
              </ServiceHeader>
              <ServiceMeta>
                <ServiceDuration>
                  <Clock />
                  {service.duration} minutos
                </ServiceDuration>
              </ServiceMeta>
              <ServiceDescription>{service.description}</ServiceDescription>
              <ServiceActions>
                <EditButton onClick={() => handleOpenModal(service)}>
                  <Edit />
                  Editar
                </EditButton>
                <DeleteButton onClick={() => handleDelete(service)}>
                  <Trash2 />
                  Eliminar
                </DeleteButton>
              </ServiceActions>
            </ServiceCard>
          ))
        ) : (
          <EmptyState>
            <FileText />
            <p>No hay servicios registrados. Agrega el primer servicio.</p>
          </EmptyState>
        )}
      </Content>

      {/* Modal de formulario */}
      {showModal && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
              </ModalTitle>
              <CloseButton onClick={handleCloseModal}>
                <X size={24} />
              </CloseButton>
            </ModalHeader>

            <ModalBody>
              <FormGroup>
                <Label>
                  <Tag />
                  Nombre del Servicio
                </Label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ej: Consulta General"
                />
              </FormGroup>

              <FormGroup>
                <Label>
                  <FileText />
                  Descripción
                </Label>
                <TextArea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe el servicio..."
                />
              </FormGroup>

              <FormGroup>
                <Label>
                  <DollarSign />
                  Precio
                </Label>
                <PriceInputWrapper>
                  <PriceSymbol>$</PriceSymbol>
                  <PriceInput
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </PriceInputWrapper>
              </FormGroup>

              <FormGroup>
                <Label>
                  <Clock />
                  Duración Aproximada (minutos)
                </Label>
                <Input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="Ej: 30"
                  min="5"
                  step="5"
                />
              </FormGroup>
            </ModalBody>

            <ModalFooter>
              <CancelButton onClick={handleCloseModal}>
                Cancelar
              </CancelButton>
              <SaveButton onClick={handleSave}>
                <Save />
                Guardar
              </SaveButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        type="warning"
        title="Eliminar Servicio"
        message="¿Estás seguro de eliminar este servicio? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDeleteService}
        onCancel={() => setShowDeleteModal(false)}
      />
    </PageContainer>
  );
};

export default GestionServicios;
