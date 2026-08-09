import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  MoreVertical,
  User,
  Mail,
  Phone,
  Edit2,
  Trash2,
  X,
  Save,
  UserPlus,
  Shield,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Key,
  Loader
} from 'lucide-react';
import Header from '../components/Layout/Header';
import Modal from '../components/Modal';
import { usuariosService } from '../services/api';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding-bottom: 100px;
  overflow-y: auto;
`;

const Content = styled.div`
  padding: 20px;
`;

const SearchSection = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-bottom: ${({ $isVisible }) => $isVisible ? '1px' : '0'} solid ${({ theme }) => theme.colors.border};
  overflow: hidden;
  max-height: ${({ $isVisible }) => $isVisible ? '80px' : '0'};
  padding: ${({ $isVisible }) => $isVisible ? '16px 20px' : '0 20px'};
  opacity: ${({ $isVisible }) => $isVisible ? '1' : '0'};
  transition: all 0.3s ease;
`;

const SearchBar = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  svg {
    position: absolute;
    left: 16px;
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  input {
    width: 100%;
    padding: 13px 16px 13px 48px;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    background: #F5F5F5;
    transition: all 0.3s ease;

    &:focus {
      outline: none;
      background: #EBEBEB;
    }

    &::placeholder {
      color: ${({ theme }) => theme.colors.textSecondary};
    }
  }
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const StatNumber = styled.div`
  font-size: 24px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ $color, theme }) => $color || theme.colors.primary};
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 4px;

  &::-webkit-scrollbar {
    height: 0;
  }
`;

const FilterTab = styled.button`
  background: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.white};
  color: ${({ $active, theme }) => $active ? theme.colors.white : theme.colors.text};
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  &:hover {
    background: ${({ $active, theme }) => $active ? theme.colors.primaryDark : theme.colors.gray};
  }
`;

const StaffList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const StaffCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
`;

const StaffImage = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  svg {
    width: 28px;
    height: 28px;
    color: white;
  }
`;

const StaffInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const StaffName = styled.h3`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 4px 0;
`;

const StaffRole = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.primary};
  margin: 0 0 4px 0;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const StaffContact = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StaffStatus = styled.span`
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  background: ${({ $status, theme }) => 
    $status === 'Activo' ? theme.colors.success :
    $status === 'Inactivo' ? theme.colors.danger :
    theme.colors.warning};
  color: ${({ $status, theme }) => 
    $status === 'Activo' ? theme.colors.white :
    $status === 'Inactivo' ? theme.colors.dangerText :
    '#856404'};
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.3s ease;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const FloatingButton = styled.button`
  position: fixed;
  bottom: 100px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(51, 169, 255, 0.4);
  transition: all 0.3s ease;
  z-index: 100;

  svg {
    width: 24px;
    height: 24px;
  }

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(51, 169, 255, 0.5);
  }
`;

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

const FormModal = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 70vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const ModalBody = styled.div`
  padding: 20px;
`;

const FormField = styled.div`
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const PasswordInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const PasswordInput = styled.input`
  width: 100%;
  padding: 12px 48px 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const CredentialsSection = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const SectionLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 16px;

  svg {
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const PasswordHint = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 6px 0 0 0;
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  font-size: 15px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ModalFooter = styled.div`
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const Button = styled.button`
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  svg {
    width: 18px;
    height: 18px;
  }
`;

const CancelButton = styled(Button)`
  background: ${({ theme }) => theme.colors.gray};
  color: ${({ theme }) => theme.colors.text};
  border: none;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`;

const SaveButton = styled(Button)`
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const DeactivateButton = styled(Button)`
  background: ${({ theme }) => theme.colors.danger};
  color: ${({ theme }) => theme.colors.dangerText};
  border: none;

  &:hover {
    opacity: 0.9;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

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

const GestionPersonal = () => {
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Todos');
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    specialty: '',
    email: '',
    phone: '',
    status: 'Activo',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const searchInputRef = useRef(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const filters = ['Todos', 'Médicos', 'Recepcionistas', 'Asistentes', 'Administradores'];

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await usuariosService.getAll();
      const users = response.data?.usuarios || [];
      
      // Mapear datos del backend al formato del componente
      const mappedStaff = users.map(user => ({
        id: user.uuid,
        name: `${user.nombre || ''} ${user.apellidos || ''}`.trim(),
        role: mapRoleFromBackend(user.rol),
        specialty: user.especialidad || '',
        email: user.email,
        phone: user.telefono || '',
        status: user.activo ? 'Activo' : 'Inactivo',
        image: user.avatar_blob || user.avatar_url || null,
        descripcion: user.descripcion || '',
        username: user.email
      }));
      
      setStaff(mappedStaff);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const mapRoleFromBackend = (rol) => {
    const roleMap = {
      'admin': 'Administrador',
      'doctor': 'Médico',
      'recepcionista': 'Recepcionista',
      'asistente': 'Asistente'
    };
    return roleMap[rol] || rol;
  };

  const mapRoleToBackend = (role) => {
    const roleMap = {
      'Administrador': 'admin',
      'Médico': 'doctor',
      'Recepcionista': 'recepcionista',
      'Asistente': 'asistente'
    };
    return roleMap[role] || role.toLowerCase();
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 300);
    }
  };

  const filteredStaff = staff.filter(person => {
    const matchesSearch = person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.role.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'Todos') return matchesSearch;
    if (selectedFilter === 'Médicos') return matchesSearch && person.role === 'Médico';
    if (selectedFilter === 'Asistentes') return matchesSearch && person.role === 'Asistente';
    if (selectedFilter === 'Recepcionistas') return matchesSearch && person.role === 'Recepcionista';
    if (selectedFilter === 'Administradores') return matchesSearch && person.role === 'Administrador';
    return matchesSearch;
  });

  const stats = {
    total: staff.length,
    activos: staff.filter(p => p.status === 'Activo').length,
    medicos: staff.filter(p => p.role === 'Médico').length
  };

  const openNewModal = () => {
    setEditingStaff(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFormData({
      name: '',
      role: '',
      specialty: '',
      email: '',
      phone: '',
      status: 'Activo',
      username: '',
      password: '',
      confirmPassword: ''
    });
    setShowModal(true);
  };

  const openEditModal = (person) => {
    setEditingStaff(person);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFormData({
      name: person.name,
      role: person.role,
      specialty: person.specialty || '',
      email: person.email,
      phone: person.phone,
      status: person.status,
      username: person.username || '',
      password: '',
      confirmPassword: ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    // Validar contraseñas si es nuevo personal
    if (!editingStaff) {
      if (!formData.email) {
        setErrorMessage('El email es obligatorio');
        setShowErrorModal(true);
        return;
      }
      if (!formData.password) {
        setErrorMessage('La contraseña es obligatoria');
        setShowErrorModal(true);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMessage('Las contraseñas no coinciden');
        setShowErrorModal(true);
        return;
      }
      if (formData.password.length < 6) {
        setErrorMessage('La contraseña debe tener al menos 6 caracteres');
        setShowErrorModal(true);
        return;
      }
    }

    try {
      setSaving(true);
      const nameParts = formData.name.split(' ');
      const nombre = nameParts[0] || '';
      const apellidos = nameParts.slice(1).join(' ') || '';

      if (editingStaff) {
        const updateData = {
          nombre,
          apellidos,
          email: formData.email,
          telefono: formData.phone,
          rol: mapRoleToBackend(formData.role),
          especialidad: formData.specialty,
          activo: formData.status === 'Activo'
        };
        
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        await usuariosService.update(editingStaff.id, updateData);
      } else {
        await usuariosService.create({
          nombre,
          apellidos,
          email: formData.email,
          password: formData.password,
          telefono: formData.phone,
          rol: mapRoleToBackend(formData.role),
          especialidad: formData.specialty
        });
      }
      
      await fetchStaff();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving staff:', error);
      setErrorMessage(error.response?.data?.error || 'Error al guardar');
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    setStaffToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteStaff = async () => {
    if (staffToDelete) {
      try {
        // Soft delete: cambiar activo a false en lugar de eliminar
        await usuariosService.update(staffToDelete, { activo: false });
        await fetchStaff();
        setShowModal(false); // Cerrar modal de edición si está abierto
      } catch (error) {
        console.error('Error deactivating staff:', error);
        setErrorMessage('Error al desactivar el personal');
        setShowErrorModal(true);
      }
    }
    setShowDeleteModal(false);
    setStaffToDelete(null);
  };

  if (loading) {
    return (
      <PageContainer>
        <Header title="Gestión de Personal" showBack />
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
      <Header title="Gestión de Personal" showBack showSearch onSearchClick={toggleSearch} />
      
      <SearchSection $isVisible={showSearch}>
        <SearchBar>
          <Search />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar por nombre, email o rol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchBar>
      </SearchSection>

      <Content>
        <StatsRow>
          <StatCard>
            <StatNumber>{stats.total}</StatNumber>
            <StatLabel>Total Personal</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber $color="#28A745">{stats.activos}</StatNumber>
            <StatLabel>Activos</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber $color="#33A9FF">{stats.medicos}</StatNumber>
            <StatLabel>Médicos</StatLabel>
          </StatCard>
        </StatsRow>

        <FilterTabs>
          {filters.map(filter => (
            <FilterTab
              key={filter}
              $active={selectedFilter === filter}
              onClick={() => setSelectedFilter(filter)}
            >
              {filter}
            </FilterTab>
          ))}
        </FilterTabs>

        {filteredStaff.length > 0 ? (
          <StaffList>
            {filteredStaff.map(person => (
              <StaffCard key={person.id} onClick={() => openEditModal(person)}>
                <StaffImage>
                  {person.image ? (
                    <img src={person.image} alt={person.name} />
                  ) : (
                    <User />
                  )}
                </StaffImage>
                <StaffInfo>
                  <StaffName>{person.name}</StaffName>
                  <StaffRole>
                    {person.role}
                    {person.specialty && ` - ${person.specialty}`}
                  </StaffRole>
                  <StaffContact>{person.email}</StaffContact>
                </StaffInfo>
                <StaffStatus $status={person.status}>{person.status}</StaffStatus>
              </StaffCard>
            ))}
          </StaffList>
        ) : (
          <EmptyState>
            <User />
            <h3>No se encontró personal</h3>
            <p>Intenta con otros criterios de búsqueda</p>
          </EmptyState>
        )}
      </Content>

      <FloatingButton onClick={openNewModal}>
        <Plus />
      </FloatingButton>

      {showModal && (
        <ModalOverlay onClick={() => setShowModal(false)}>
          <FormModal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {editingStaff ? 'Editar Personal' : 'Nuevo Personal'}
              </ModalTitle>
              <CloseButton onClick={() => setShowModal(false)}>
                <X />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <FormField>
                <Label>Nombre Completo</Label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nombre del empleado"
                />
              </FormField>
              <FormField>
                <Label>Rol</Label>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="">Seleccionar rol</option>
                  <option value="Médico">Médico</option>
                  <option value="Recepcionista">Recepcionista</option>
                  <option value="Asistente">Asistente</option>
                  <option value="Administrador">Administrador</option>
                </Select>
              </FormField>
              {formData.role === 'Médico' && (
                <FormField>
                  <Label>Especialidad</Label>
                  <Input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                    placeholder="Ej: Cardiología, Pediatría..."
                  />
                </FormField>
              )}
              <FormField>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="correo@clinica.com"
                />
              </FormField>
              <FormField>
                <Label>Teléfono</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+52 555 123 4567"
                />
              </FormField>
              <FormField>
                <Label>Estado</Label>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </Select>
              </FormField>

              <CredentialsSection>
                <SectionLabel>
                  <Key />
                  Credenciales de Acceso
                </SectionLabel>
                <FormField>
                  <Label>Nombre de Usuario</Label>
                  <Input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="usuario.clinica"
                  />
                </FormField>
                <FormField>
                  <Label>{editingStaff ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña'}</Label>
                  <PasswordInputWrapper>
                    <PasswordInput
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder={editingStaff ? '••••••••' : 'Mínimo 6 caracteres'}
                    />
                    <PasswordToggle 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </PasswordToggle>
                  </PasswordInputWrapper>
                  {!editingStaff && (
                    <PasswordHint>La contraseña debe tener al menos 6 caracteres</PasswordHint>
                  )}
                </FormField>
                <FormField>
                  <Label>Confirmar Contraseña</Label>
                  <PasswordInputWrapper>
                    <PasswordInput
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Repetir contraseña"
                    />
                    <PasswordToggle 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff /> : <Eye />}
                    </PasswordToggle>
                  </PasswordInputWrapper>
                </FormField>
              </CredentialsSection>
            </ModalBody>
            <ModalFooter>
              {editingStaff && formData.status === 'Activo' && (
                <DeactivateButton onClick={() => handleDelete(editingStaff.id)}>
                  <Trash2 />
                  Desactivar
                </DeactivateButton>
              )}
              <CancelButton onClick={() => setShowModal(false)}>
                Cancelar
              </CancelButton>
              <SaveButton onClick={handleSave}>
                <Save />
                {editingStaff ? 'Guardar Cambios' : 'Crear Personal'}
              </SaveButton>
            </ModalFooter>
          </FormModal>
        </ModalOverlay>
      )}

      {/* Modal de confirmación de desactivación */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        type="warning"
        title="Desactivar Personal"
        message="¿Estás seguro de desactivar este miembro del personal? No podrá acceder al sistema pero sus registros se mantendrán. Puedes reactivarlo en cualquier momento."
        confirmText="Desactivar"
        cancelText="Cancelar"
        onConfirm={confirmDeleteStaff}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Modal de error de validación */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        type="error"
        title="Error de Validación"
        message={errorMessage}
        confirmText="Entendido"
        onConfirm={() => setShowErrorModal(false)}
      />
    </PageContainer>
  );
};

export default GestionPersonal;
