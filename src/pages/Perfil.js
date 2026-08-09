import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin,
  Bell,
  Moon,
  Globe,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Camera,
  Save,
  Users,
  FileText,
  Package,
  DoorOpen,
  Loader,
  Pill,
  FileSpreadsheet,
  RefreshCw,
  Link2,
  Unlink,
  Puzzle
} from 'lucide-react';
import { useThemeMode } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { usuariosService, consultorioService, googleCalendarService } from '../services/api';
import Modal from '../components/Modal';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding-bottom: 80px;
  overflow-y: auto;
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  background: ${({ theme }) => theme.colors.white};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 50;
  min-height: 60px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text};

  svg {
    width: 24px;
    height: 24px;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const HeaderTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  flex: 1;
  text-align: center;
`;

const SaveButton = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ProfileSection = styled.div`
  background: ${({ theme }) => theme.colors.white};
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const AvatarContainer = styled.div`
  position: relative;
  margin-bottom: 16px;
`;

const Avatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  svg {
    width: 50px;
    height: 50px;
    color: white;
  }
`;

const CameraButton = styled.button`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.text};
  color: white;
  border: 3px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  svg {
    width: 14px;
    height: 14px;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.primary};
  }
`;

const UserName = styled.h2`
  font-size: 22px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 4px 0;
`;

const UserRole = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

const Section = styled.section`
  background: ${({ theme }) => theme.colors.white};
  margin-top: 12px;
`;

const SectionTitle = styled.h3`
  font-size: 13px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 16px 20px 8px;
  margin: 0;
`;

const FormGroup = styled.div`
  padding: 0 20px;
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  gap: 10px;
  flex-wrap: wrap;

  &:last-child {
    border-bottom: none;
  }

  svg {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.textSecondary};
    flex-shrink: 0;
  }

  @media (max-width: 400px) {
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
`;

const InputLabel = styled.label`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  min-width: 80px;
  flex-shrink: 0;

  @media (max-width: 400px) {
    min-width: auto;
  }
`;

const Input = styled.input`
  flex: 1;
  border: none;
  font-size: 15px;
  color: ${({ theme }) => theme.colors.text};
  background: transparent;
  text-align: right;
  min-width: 0;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  @media (max-width: 400px) {
    text-align: center;
    width: 100%;
  }
`;

const SettingItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  cursor: pointer;
  transition: all 0.3s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
  }
`;

const SettingLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;

  svg {
    width: 22px;
    height: 22px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const SettingText = styled.span`
  font-size: 15px;
  color: ${({ theme }) => theme.colors.text};
`;

const SettingRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const SettingValue = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Toggle = styled.button`
  width: 50px;
  height: 28px;
  border-radius: 14px;
  border: none;
  background: ${({ $active, theme }) => $active ? theme.colors.primary : '#D1D5DB'};
  position: relative;
  cursor: pointer;
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
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: calc(100% - 40px);
  margin: 20px;
  padding: 14px;
  background: ${({ theme }) => theme.colors.danger};
  color: ${({ theme }) => theme.colors.dangerText};
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.3s ease;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    opacity: 0.9;
  }
`;

const VersionText = styled.p`
  text-align: center;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: 20px;
  margin: 0;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const TextArea = styled.textarea`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.background};
  resize: vertical;
  min-height: 80px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const DescriptionSection = styled.div`
  padding: 16px 20px;
`;

const DescriptionLabel = styled.label`
  display: block;
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 8px;
`;

const Perfil = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useThemeMode();
  const { user, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = React.useRef(null);
  
  // Estado para datos del perfil personal
  const [profileData, setProfileData] = useState({
    avatar_blob: '',
    descripcion: ''
  });

  // Estado inicial para detectar cambios
  const [initialProfileData, setInitialProfileData] = useState({
    avatar_blob: '',
    descripcion: ''
  });

  const [consultorioData, setConsultorioData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    estado: '',
    codigoPostal: ''
  });

  const [initialConsultorioData, setInitialConsultorioData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    estado: '',
    codigoPostal: ''
  });

  const [settings, setSettings] = useState({
    notifications: true,
    language: 'Español'
  });

  // Estado de vinculación con Google Calendar — solo doctores
  // (la configuración de credenciales de WhatsApp/Google para admin vive en /integraciones)
  const [googleCalendarStatus, setGoogleCalendarStatus] = useState(null);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [syncingGoogle, setSyncingGoogle] = useState(false);
  const [googleActionMessage, setGoogleActionMessage] = useState(null); // { success, text }

  // Estados para modales
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Verificar si hay cambios sin guardar
  const isAdmin = user?.rol === 'admin';
  
  const hasProfileChanges = 
    profileData.avatar_blob !== initialProfileData.avatar_blob ||
    profileData.descripcion !== initialProfileData.descripcion;
  
  const hasConsultorioChanges = isAdmin && (
    consultorioData.nombre !== initialConsultorioData.nombre ||
    consultorioData.email !== initialConsultorioData.email ||
    consultorioData.telefono !== initialConsultorioData.telefono ||
    consultorioData.direccion !== initialConsultorioData.direccion ||
    consultorioData.ciudad !== initialConsultorioData.ciudad ||
    consultorioData.estado !== initialConsultorioData.estado ||
    consultorioData.codigoPostal !== initialConsultorioData.codigoPostal
  );

  const hasUnsavedChanges = hasProfileChanges || hasConsultorioChanges;

  useEffect(() => {
    fetchData();
  }, []);

  // Manejar el regreso del flujo de OAuth de Google Calendar
  // (el backend redirige aquí con ?google_calendar=connected|error)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resultado = params.get('google_calendar');
    if (!resultado) return;

    if (resultado === 'connected') {
      setGoogleActionMessage({ success: true, text: 'Google Calendar conectado exitosamente' });
      googleCalendarService.getStatus().then((res) => {
        if (res.success) setGoogleCalendarStatus(res.data);
      });
    } else if (resultado === 'error') {
      const reason = params.get('reason');
      setGoogleActionMessage({ success: false, text: reason ? `Error al conectar: ${reason}` : 'Error al conectar Google Calendar' });
    }

    // Limpiar los parámetros de la URL para que no se vuelva a procesar al recargar
    navigate('/perfil', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Cargar datos del consultorio
      const consultorioRes = await consultorioService.get();
      const data = consultorioRes.data || {};
      
      setConsultorioData({
        nombre: data.nombre || '',
        email: data.email || '',
        telefono: data.telefono || '',
        direccion: data.direccion || '',
        ciudad: data.ciudad || '',
        estado: data.estado || '',
        codigoPostal: data.codigo_postal || ''
      });

      setInitialConsultorioData({
        nombre: data.nombre || '',
        email: data.email || '',
        telefono: data.telefono || '',
        direccion: data.direccion || '',
        ciudad: data.ciudad || '',
        estado: data.estado || '',
        codigoPostal: data.codigo_postal || ''
      });

      // Cargar datos del perfil del usuario
      if (user?.uuid) {
        const userRes = await usuariosService.getById(user.uuid);
        if (userRes.success && userRes.data) {
          setProfileData({
            avatar_blob: userRes.data.avatar_blob || '',
            descripcion: userRes.data.descripcion || ''
          });
          setInitialProfileData({
            avatar_blob: userRes.data.avatar_blob || '',
            descripcion: userRes.data.descripcion || ''
          });
        }
      }

      // Cargar estado de Google Calendar (solo doctores)
      if (user?.rol === 'doctor') {
        try {
          const googleRes = await googleCalendarService.getStatus();
          if (googleRes.success) setGoogleCalendarStatus(googleRes.data);
        } catch (googleError) {
          console.error('Error cargando estado de Google Calendar:', googleError);
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setConsultorioData(prev => ({ ...prev, [field]: value }));
  };

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen es muy grande. Máximo 5MB.');
        return;
      }
      
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona una imagen válida.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, avatar_blob: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Función para manejar navegación con verificación de cambios
  const handleNavigation = (path) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(path);
      setShowUnsavedModal(true);
    } else {
      navigate(path);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setPendingNavigation(-1);
      setShowUnsavedModal(true);
    } else {
      navigate(-1);
    }
  };

  const confirmNavigation = () => {
    setShowUnsavedModal(false);
    if (pendingNavigation === -1) {
      navigate(-1);
    } else if (pendingNavigation) {
      navigate(pendingNavigation);
    }
    setPendingNavigation(null);
  };

  const cancelNavigation = () => {
    setShowUnsavedModal(false);
    setPendingNavigation(null);
  };

  const toggleSetting = (setting) => {
    setSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Guardar datos del perfil personal
      if (hasProfileChanges) {
        await usuariosService.update(user.uuid, {
          avatar_blob: profileData.avatar_blob,
          descripcion: profileData.descripcion
        });
        
        // Actualizar el contexto de usuario
        if (updateUser) {
          updateUser({
            ...user,
            avatar_blob: profileData.avatar_blob,
            descripcion: profileData.descripcion
          });
        }
        
        // Actualizar estado inicial
        setInitialProfileData({
          avatar_blob: profileData.avatar_blob,
          descripcion: profileData.descripcion
        });
      }

      // Guardar datos del consultorio (solo admin)
      if (isAdmin && hasConsultorioChanges) {
        await consultorioService.update({
          nombre: consultorioData.nombre,
          email: consultorioData.email,
          telefono: consultorioData.telefono,
          direccion: consultorioData.direccion,
          ciudad: consultorioData.ciudad,
          estado: consultorioData.estado,
          codigo_postal: consultorioData.codigoPostal
        });
        
        // Actualizar estado inicial
        setInitialConsultorioData({...consultorioData});
      }
      
      setShowSaveModal(true);
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGoogle = async () => {
    setConnectingGoogle(true);
    setGoogleActionMessage(null);
    try {
      const res = await googleCalendarService.getAuthUrl();
      if (res.success) {
        // Redirección de página completa: Google no puede abrirse dentro de un fetch/XHR
        window.location.href = res.data.url;
      } else {
        setGoogleActionMessage({ success: false, text: res.message || 'No se pudo iniciar la conexión' });
        setConnectingGoogle(false);
      }
    } catch (error) {
      setGoogleActionMessage({
        success: false,
        text: error.response?.data?.message || 'No se pudo iniciar la conexión con Google'
      });
      setConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    setConnectingGoogle(true);
    setGoogleActionMessage(null);
    try {
      await googleCalendarService.disconnect();
      setGoogleCalendarStatus({ configurado: true, conectado: false, calendar_id: null, last_synced_at: null });
      setGoogleActionMessage({ success: true, text: 'Google Calendar desconectado' });
    } catch (error) {
      setGoogleActionMessage({
        success: false,
        text: error.response?.data?.message || 'No se pudo desconectar Google Calendar'
      });
    } finally {
      setConnectingGoogle(false);
    }
  };

  const handleSyncGoogleNow = async () => {
    setSyncingGoogle(true);
    setGoogleActionMessage(null);
    try {
      const res = await googleCalendarService.syncNow();
      setGoogleActionMessage({ success: res.success, text: res.message });
      const statusRes = await googleCalendarService.getStatus();
      if (statusRes.success) setGoogleCalendarStatus(statusRes.data);
    } catch (error) {
      setGoogleActionMessage({
        success: false,
        text: error.response?.data?.message || 'Error al sincronizar'
      });
    } finally {
      setSyncingGoogle(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <PageContainer>
        <Header>
          <BackButton onClick={() => navigate(-1)}>
            <ChevronLeft />
          </BackButton>
          <HeaderTitle>Mi Perfil</HeaderTitle>
          <div style={{ width: 80 }} />
        </Header>
        <div style={{ textAlign: 'center', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Loader style={{ animation: 'spin 1s linear infinite', width: 32, height: 32, color: '#6366F1' }} />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="Cerrar Sesión"
        message="¿Estás seguro de que deseas cerrar sesión?"
        type="warning"
        confirmText="Cerrar Sesión"
        cancelText="Cancelar"
        showCancel
      />

      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="Cambios Guardados"
        message="Todos los cambios se han guardado correctamente."
        type="success"
        confirmText="Aceptar"
      />

      <Modal
        isOpen={showUnsavedModal}
        onClose={cancelNavigation}
        onConfirm={confirmNavigation}
        title="Cambios sin guardar"
        message="Tienes cambios sin guardar. ¿Estás seguro de que deseas salir sin guardar?"
        type="warning"
        confirmText="Salir sin guardar"
        cancelText="Cancelar"
        showCancel
      />

      <Header>
        <BackButton onClick={handleBack}>
          <ChevronLeft />
        </BackButton>
        <HeaderTitle>Mi Clínica</HeaderTitle>
        <SaveButton onClick={handleSave} disabled={saving || !hasUnsavedChanges}>
          <Save />
          {saving ? 'Guardando...' : 'Guardar'}
        </SaveButton>
      </Header>

      <ProfileSection>
        <AvatarContainer>
          <Avatar>
            {profileData.avatar_blob ? (
              <img src={profileData.avatar_blob} alt={user?.nombre} />
            ) : user?.avatar_blob ? (
              <img src={user.avatar_blob} alt={user?.nombre} />
            ) : (
              <User />
            )}
          </Avatar>
          <CameraButton onClick={handlePhotoClick}>
            <Camera />
          </CameraButton>
          <HiddenFileInput
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
        </AvatarContainer>
        <UserName>{`${user?.nombre || ''} ${user?.apellidos || ''}`.trim() || user?.email || 'Usuario'}</UserName>
        <UserRole>{user?.rol === 'admin' ? 'Administrador' : user?.rol === 'doctor' ? 'Médico' : user?.rol === 'recepcionista' ? 'Recepcionista' : user?.rol === 'asistente' ? 'Asistente' : 'Usuario'}</UserRole>
      </ProfileSection>

      <Section>
        <SectionTitle>Mi Perfil Personal</SectionTitle>
        <DescriptionSection>
          <DescriptionLabel>Descripción / Biografía</DescriptionLabel>
          <TextArea
            value={profileData.descripcion}
            onChange={(e) => handleProfileChange('descripcion', e.target.value)}
            placeholder="Escribe una breve descripción sobre ti, tu experiencia, especialidades, etc."
            rows={4}
          />
        </DescriptionSection>
      </Section>

      <Section>
        <SectionTitle>Información del Consultorio</SectionTitle>
        <FormGroup>
          <InputRow>
            <Building />
            <InputLabel>Nombre</InputLabel>
            <Input 
              type="text" 
              value={consultorioData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              placeholder="Nombre del consultorio"
              readOnly={!isAdmin}
              style={!isAdmin ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            />
          </InputRow>
          <InputRow>
            <Mail />
            <InputLabel>Email</InputLabel>
            <Input 
              type="email" 
              value={consultorioData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="correo@consultorio.com"
              readOnly={!isAdmin}
              style={!isAdmin ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            />
          </InputRow>
          <InputRow>
            <Phone />
            <InputLabel>Teléfono</InputLabel>
            <Input 
              type="tel" 
              value={consultorioData.telefono}
              onChange={(e) => handleInputChange('telefono', e.target.value)}
              placeholder="+52 555 123 4567"
              readOnly={!isAdmin}
              style={!isAdmin ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            />
          </InputRow>
          <InputRow>
            <MapPin />
            <InputLabel>Dirección</InputLabel>
            <Input 
              type="text" 
              value={consultorioData.direccion}
              onChange={(e) => handleInputChange('direccion', e.target.value)}
              placeholder="Calle, número, colonia"
              readOnly={!isAdmin}
              style={!isAdmin ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            />
          </InputRow>
          <InputRow>
            <MapPin />
            <InputLabel>Ciudad</InputLabel>
            <Input 
              type="text" 
              value={consultorioData.ciudad}
              onChange={(e) => handleInputChange('ciudad', e.target.value)}
              placeholder="Ciudad"
              readOnly={!isAdmin}
              style={!isAdmin ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            />
          </InputRow>
          <InputRow>
            <MapPin />
            <InputLabel>Estado</InputLabel>
            <Input 
              type="text" 
              value={consultorioData.estado}
              onChange={(e) => handleInputChange('estado', e.target.value)}
              placeholder="Estado"
              readOnly={!isAdmin}
              style={!isAdmin ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            />
          </InputRow>
        </FormGroup>
      </Section>

      {user?.rol === 'doctor' && googleCalendarStatus && (
        <Section>
          <SectionTitle>Google Calendar</SectionTitle>
          <FormGroup style={{ paddingBottom: 16 }}>
            {!googleCalendarStatus.configurado ? (
              <p style={{ fontSize: 13, color: '#9CA3AF' }}>
                Esta función no está disponible: el administrador del sistema aún no configuró las
                credenciales de Google Calendar en el servidor.
              </p>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0' }}>
                  <span style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: googleCalendarStatus.conectado ? '#22C55E' : '#D1D5DB'
                  }} />
                  <span style={{ fontSize: 14, color: googleCalendarStatus.conectado ? '#16A34A' : '#6B7280' }}>
                    {googleCalendarStatus.conectado
                      ? 'Conectado — tus citas se sincronizan con tu Google Calendar'
                      : 'No conectado'}
                  </span>
                </div>

                {googleCalendarStatus.conectado && (
                  <p style={{ fontSize: 12, color: '#9CA3AF', margin: '4px 0 0' }}>
                    Última sincronización: {googleCalendarStatus.last_synced_at
                      ? new Date(googleCalendarStatus.last_synced_at).toLocaleString('es-MX')
                      : 'Aún no se ha sincronizado'}
                  </p>
                )}

                <p style={{ fontSize: 12, color: '#9CA3AF', margin: '10px 0 0' }}>
                  Tus citas de Dr. Desk se crean como eventos en tu calendario de Google, y los eventos
                  que agregues directamente en Google Calendar bloquean ese horario para nuevas citas
                  aquí. La sincronización ocurre automáticamente cada pocos minutos.
                </p>

                {googleActionMessage && (
                  <p style={{
                    fontSize: 13,
                    marginTop: 10,
                    color: googleActionMessage.success ? '#16A34A' : '#DC2626'
                  }}>
                    {googleActionMessage.text}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  {!googleCalendarStatus.conectado ? (
                    <button
                      type="button"
                      onClick={handleConnectGoogle}
                      disabled={connectingGoogle}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        padding: '10px',
                        borderRadius: 10,
                        border: 'none',
                        background: '#6366F1',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: connectingGoogle ? 'not-allowed' : 'pointer',
                        opacity: connectingGoogle ? 0.6 : 1
                      }}
                    >
                      <Link2 size={16} />
                      {connectingGoogle ? 'Redirigiendo...' : 'Conectar con Google'}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleSyncGoogleNow}
                        disabled={syncingGoogle}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          padding: '10px',
                          borderRadius: 10,
                          border: '1px solid #D1D5DB',
                          background: 'white',
                          color: '#374151',
                          fontWeight: 600,
                          fontSize: 14,
                          cursor: syncingGoogle ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <RefreshCw size={16} style={syncingGoogle ? { animation: 'spin 1s linear infinite' } : undefined} />
                        {syncingGoogle ? 'Sincronizando...' : 'Sincronizar ahora'}
                      </button>
                      <button
                        type="button"
                        onClick={handleDisconnectGoogle}
                        disabled={connectingGoogle}
                        style={{
                          padding: '10px 16px',
                          borderRadius: 10,
                          border: '1px solid #FCA5A5',
                          background: 'white',
                          color: '#DC2626',
                          fontWeight: 600,
                          fontSize: 14,
                          cursor: connectingGoogle ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <Unlink size={16} />
                        Desconectar
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </FormGroup>
        </Section>
      )}

      <Section>
        <SectionTitle>Administración</SectionTitle>
        <SettingItem onClick={() => handleNavigation('/integraciones')}>
          <SettingLeft>
            <Puzzle />
            <SettingText>Integraciones (WhatsApp, Google Calendar)</SettingText>
          </SettingLeft>
          <SettingRight>
            <ChevronRight />
          </SettingRight>
        </SettingItem>
        <SettingItem onClick={() => handleNavigation('/gestion-personal')}>
          <SettingLeft>
            <Users />
            <SettingText>Gestión de Personal</SettingText>
          </SettingLeft>
          <SettingRight>
            <ChevronRight />
          </SettingRight>
        </SettingItem>
        <SettingItem onClick={() => handleNavigation('/gestion-formularios')}>
          <SettingLeft>
            <FileText />
            <SettingText>Formularios de Pacientes</SettingText>
          </SettingLeft>
          <SettingRight>
            <ChevronRight />
          </SettingRight>
        </SettingItem>
        <SettingItem onClick={() => handleNavigation('/inventario')}>
          <SettingLeft>
            <Package />
            <SettingText>Inventario</SettingText>
          </SettingLeft>
          <SettingRight>
            <ChevronRight />
          </SettingRight>
        </SettingItem>
        <SettingItem onClick={() => handleNavigation('/recetas')}>
          <SettingLeft>
            <Pill />
            <SettingText>Recetas Médicas</SettingText>
          </SettingLeft>
          <SettingRight>
            <ChevronRight />
          </SettingRight>
        </SettingItem>
        <SettingItem onClick={() => handleNavigation('/presupuestos')}>
          <SettingLeft>
            <FileSpreadsheet />
            <SettingText>Presupuestos</SettingText>
          </SettingLeft>
          <SettingRight>
            <ChevronRight />
          </SettingRight>
        </SettingItem>
        <SettingItem onClick={() => handleNavigation('/gestion-consultorios')}>
          <SettingLeft>
            <DoorOpen />
            <SettingText>Consultorios</SettingText>
          </SettingLeft>
          <SettingRight>
            <ChevronRight />
          </SettingRight>
        </SettingItem>
      </Section>

      <Section>
        <SectionTitle>Configuración</SectionTitle>
        <SettingItem onClick={() => toggleSetting('notifications')}>
          <SettingLeft>
            <Bell />
            <SettingText>Notificaciones</SettingText>
          </SettingLeft>
          <SettingRight>
            <Toggle $active={settings.notifications} onClick={(e) => e.stopPropagation()} />
          </SettingRight>
        </SettingItem>
        <SettingItem onClick={toggleDarkMode}>
          <SettingLeft>
            <Moon />
            <SettingText>Modo Oscuro</SettingText>
          </SettingLeft>
          <SettingRight>
            <Toggle $active={isDarkMode} onClick={(e) => { e.stopPropagation(); toggleDarkMode(); }} />
          </SettingRight>
        </SettingItem>
        <SettingItem>
          <SettingLeft>
            <Globe />
            <SettingText>Idioma</SettingText>
          </SettingLeft>
          <SettingRight>
            <SettingValue>{settings.language}</SettingValue>
            <ChevronRight />
          </SettingRight>
        </SettingItem>
      </Section>

      <Section>
        <SectionTitle>Soporte</SectionTitle>
        <SettingItem>
          <SettingLeft>
            <Shield />
            <SettingText>Privacidad y Seguridad</SettingText>
          </SettingLeft>
          <SettingRight>
            <ChevronRight />
          </SettingRight>
        </SettingItem>
        <SettingItem>
          <SettingLeft>
            <HelpCircle />
            <SettingText>Ayuda y Soporte</SettingText>
          </SettingLeft>
          <SettingRight>
            <ChevronRight />
          </SettingRight>
        </SettingItem>
      </Section>

      <LogoutButton onClick={handleLogout}>
        <LogOut />
        Cerrar Sesión
      </LogoutButton>

      <VersionText>Dr. Desk v1.0.0</VersionText>
    </PageContainer>
  );
};

export default Perfil;
