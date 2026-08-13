import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { 
  Clock, 
  User, 
  Calendar, 
  Stethoscope, 
  FileText, 
  Phone, 
  Mail, 
  MapPin,
  Edit,
  X,
  CheckCircle,
  AlertCircle,
  Receipt,
  CreditCard,
  Printer,
  Check,
  ShoppingBag,
  Loader,
  Eye,
  ChevronLeft,
  ChevronRight,
  UserX,
  UserCheck,
  DoorOpen,
  MessageCircle,
  Send,
  LogIn
} from 'lucide-react';
import Header from '../components/Layout/Header';
import Modal from '../components/Modal';
import { citasService, serviciosService, horariosService, whatsappService, consultoriosInternosService } from '../services/api';
import { useAlert } from '../context/AlertContext';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding-bottom: 100px;
  overflow-y: auto;
`;

const Content = styled.div`
  padding: 20px;
`;

const StatusBanner = styled.div`
  background: ${({ $status }) => {
    switch ($status) {
      case 'confirmada':
        return '#E3F2FD';
      case 'programada':
        return '#FFF3E0';
      case 'reprogramada':
        return '#E8EAF6';
      case 'cancelada':
        return '#FFEBEE';
      case 'completada':
        return '#E8F5E9';
      case 'en_progreso':
        return '#F3E5F5';
      case 'no_asistio':
        return '#ECEFF1';
      case 'pendiente_pago':
        return '#FFF8E1';
      default:
        return '#F5F5F5';
    }
  }};
  color: ${({ $status }) => {
    switch ($status) {
      case 'confirmada':
        return '#1565C0';
      case 'programada':
        return '#E65100';
      case 'reprogramada':
        return '#3949AB';
      case 'cancelada':
        return '#C62828';
      case 'completada':
        return '#2E7D32';
      case 'en_progreso':
        return '#7B1FA2';
      case 'no_asistio':
        return '#546E7A';
      case 'pendiente_pago':
        return '#FF8F00';
      default:
        return '#616161';
    }
  }};
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  font-size: 14px;

  svg {
    width: 18px;
    height: 18px;
  }
`;

const MainCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const AppointmentHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const TimeBox = styled.div`
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  border-radius: 12px;
  padding: 16px 20px;
  text-align: center;
  min-width: 90px;
`;

const TimeText = styled.div`
  font-size: 20px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

const DateText = styled.div`
  font-size: 12px;
  opacity: 0.9;
  margin-top: 4px;
`;

const AppointmentInfo = styled.div`
  flex: 1;
`;

const AppointmentType = styled.h2`
  font-size: 18px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 4px 0;
`;

const AppointmentDuration = styled.p`
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

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const PersonCard = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: ${({ theme }) => theme.colors.background};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
  }
`;

const PersonImage = styled.div`
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
    color: ${({ theme }) => theme.colors.white};
  }
`;

const PersonInfo = styled.div`
  flex: 1;
`;

const PersonName = styled.h4`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 4px 0;
`;

const PersonDetail = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
`;

const ContactItem = styled.a`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: ${({ theme }) => theme.colors.background};
  border-radius: 10px;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.text};
  transition: all 0.3s ease;

  svg {
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.primary};
  }

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
  }
`;

const NotesSection = styled.div`
  padding: 16px;
  background: ${({ theme }) => theme.colors.background};
  border-radius: 12px;
  margin-top: 16px;
`;

const NotesText = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  line-height: 1.5;
`;

const ActionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    transform: translateY(-2px);
  }
`;

const PrimaryButton = styled(ActionButton)`
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const SecondaryButton = styled(ActionButton)`
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
  }
`;

const DangerButton = styled(ActionButton)`
  background: ${({ theme }) => theme.colors.danger};
  color: ${({ theme }) => theme.colors.dangerText};

  &:hover {
    opacity: 0.9;
  }
`;

const SuccessButton = styled(ActionButton)`
  background: ${({ theme }) => theme.colors.success};
  color: ${({ theme }) => theme.colors.successText};

  &:hover {
    opacity: 0.9;
  }
`;

const WarningButton = styled(ActionButton)`
  background: #FFF3E0;
  color: #E65100;

  &:hover {
    opacity: 0.9;
  }
`;

const ServicesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
`;

const ServiceItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: ${({ theme }) => theme.colors.background};
  border-radius: 12px;
  border: ${({ $selected }) => $selected ? '2px solid' : 'none'};
  border-color: ${({ $selected, theme }) => $selected ? theme.colors.primary : 'transparent'};
  cursor: ${({ $editable }) => $editable ? 'pointer' : 'default'};
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme, $editable }) => $editable ? theme.colors.gray : theme.colors.background};
  }
`;

const ServiceInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const ServiceCheckbox = styled.div`
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 2px solid ${({ $checked, theme }) => $checked ? theme.colors.primary : theme.colors.border};
  background: ${({ $checked, theme }) => $checked ? theme.colors.primary : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;

  svg {
    width: 14px;
    height: 14px;
    color: white;
  }
`;

const ServiceDetails = styled.div`
  flex: 1;
`;

const ServiceName = styled.div`
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 4px;
`;

const ServiceMeta = styled.div`
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ServicePrice = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.primary};
`;

const ServicesTotalBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: ${({ theme }) => theme.colors.primary}10;
  border-radius: 12px;
  margin-top: 12px;
`;

const TotalLabel = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const TotalValue = styled.span`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

const EditServicesButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.primary}10;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

// Estilos para el modal de reprogramar
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
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 450px;
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
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  
  svg {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.textSecondary};
  
  &:hover {
    background: ${({ theme }) => theme.colors.gray};
  }
`;

const ModalBody = styled.div`
  padding: 20px;
`;

const CalendarContainer = styled.div`
  margin-bottom: 20px;
`;

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const CalendarMonth = styled.span`
  font-weight: 600;
  font-size: 16px;
`;

const CalendarNavButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.text};
  
  &:hover {
    background: ${({ theme }) => theme.colors.gray};
  }
`;

const WeekDays = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
`;

const WeekDay = styled.span`
  text-align: center;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: 8px 0;
`;

const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
`;

const DayCell = styled.button`
  aspect-ratio: 1;
  border: none;
  background: ${({ $isSelected, $isToday, $isUnavailable, theme }) => 
    $isUnavailable ? '#FFEBEE' :
    $isSelected ? theme.colors.primary : 
    $isToday ? theme.colors.info : 
    'transparent'};
  color: ${({ $isSelected, $isOtherMonth, $isPast, $isUnavailable, theme }) => 
    $isUnavailable ? '#C62828' :
    $isSelected ? 'white' :
    $isOtherMonth || $isPast ? '#ccc' :
    theme.colors.text};
  border-radius: 50%;
  font-size: 14px;
  cursor: ${({ $isOtherMonth, $isPast, $isUnavailable }) => $isOtherMonth || $isPast || $isUnavailable ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  position: relative;
  border: ${({ $isUnavailable }) => $isUnavailable ? '1px dashed #EF9A9A' : 'none'};
  
  &::before {
    content: ${({ $isUnavailable }) => $isUnavailable ? "''" : 'none'};
    position: absolute;
    width: 60%;
    height: 2px;
    background-color: #C62828;
    transform: rotate(-45deg);
    top: 50%;
    left: 20%;
  }
  
  &:hover:not(:disabled) {
    background: ${({ $isSelected, $isUnavailable, theme }) => 
      $isUnavailable ? '#FFCDD2' :
      $isSelected ? theme.colors.primary : theme.colors.gray};
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: ${({ $isUnavailable }) => $isUnavailable ? 1 : 0.5};
  }
`;

const TimeSection = styled.div`
  margin-top: 20px;
`;

const TimeSectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: ${({ theme }) => theme.colors.text};
`;

const TimeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
`;

const TimeSlot = styled.button`
  padding: 10px;
  border: 1px solid ${({ $isSelected, $isOccupied, theme }) => 
    $isOccupied ? theme.colors.border :
    $isSelected ? theme.colors.primary : theme.colors.border};
  background: ${({ $isSelected, $isOccupied, theme }) => 
    $isOccupied ? '#f5f5f5' :
    $isSelected ? theme.colors.primary : 'white'};
  color: ${({ $isSelected, $isOccupied }) => 
    $isOccupied ? '#999' :
    $isSelected ? 'white' : 'inherit'};
  border-radius: 8px;
  font-size: 13px;
  cursor: ${({ $isOccupied }) => $isOccupied ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  text-decoration: ${({ $isOccupied }) => $isOccupied ? 'line-through' : 'none'};
  
  &:hover:not(:disabled) {
    border-color: ${({ $isOccupied, theme }) => $isOccupied ? theme.colors.border : theme.colors.primary};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: white;
  border-radius: 12px;
  font-size: 15px;
  cursor: pointer;
  
  &:hover {
    background: ${({ theme }) => theme.colors.gray};
  }
`;

const ConfirmButton = styled.button`
  flex: 1;
  padding: 14px;
  border: none;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Estilos para modal de resultado
const ResultModalContent = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 350px;
  text-align: center;
  padding: 30px;
`;

const ResultIcon = styled.div`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  background: ${({ $success, theme }) => $success ? theme.colors.success + '20' : theme.colors.danger + '20'};
  
  svg {
    width: 35px;
    height: 35px;
    color: ${({ $success, theme }) => $success ? theme.colors.success : theme.colors.danger};
  }
`;

const ResultTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 10px;
  color: ${({ theme }) => theme.colors.text};
`;

const ResultMessage = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 25px;
  line-height: 1.5;
`;

const ResultButton = styled.button`
  width: 100%;
  padding: 14px;
  border: none;
  background: ${({ $success, theme }) => $success ? theme.colors.success : theme.colors.primary};
  color: white;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
`;

const DetalleCita = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  
  const [appointment, setAppointment] = useState(null);
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para edición de servicios
  const [isEditingServices, setIsEditingServices] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);

  // Estados para modal de reprogramar
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(new Date());
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleMonth, setRescheduleMonth] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [doctorWorkDays, setDoctorWorkDays] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);

  // Estado para modal de resultado
  const [resultModal, setResultModal] = useState({ show: false, success: false, message: '' });

  // Modal de advertencia: reprogramación fuera del horario laboral del doctor
  const [warningModal, setWarningModal] = useState({ show: false, message: '' });

  // Estado para modal de cancelar cita
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Estado de confirmación por WhatsApp: historial y envío en curso
  const [whatsappInfo, setWhatsappInfo] = useState({ configurado: true, telefono_paciente: null, mensajes: [] });
  const [sendingWhatsapp, setSendingWhatsapp] = useState(null); // 'confirmacion' | 'recordatorio' | null
  const [confirmandoAsistencia, setConfirmandoAsistencia] = useState(false);
  const [togglingCheckin, setTogglingCheckin] = useState(false);

  // Asignación de consultorio (sala) físico a la cita
  const [consultoriosInternos, setConsultoriosInternos] = useState([]);
  const [isEditingConsultorio, setIsEditingConsultorio] = useState(false);
  const [selectedConsultorioUuid, setSelectedConsultorioUuid] = useState('');
  const [savingConsultorio, setSavingConsultorio] = useState(false);

  // Cargar cita y servicios
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [citaRes, serviciosRes, consultoriosRes] = await Promise.all([
          citasService.getOne(id),
          serviciosService.getAll(),
          consultoriosInternosService.getActivos()
        ]);

        if (consultoriosRes.success) {
          setConsultoriosInternos(consultoriosRes.data.consultorios || []);
        }

        if (citaRes.success) {
          setAppointment(citaRes.data);
          setSelectedConsultorioUuid(citaRes.data.consultorio_interno_uuid || '');
          // Convertir servicios de la cita al formato esperado
          const citaServicios = (citaRes.data.servicios || []).map(s => ({
            id: s.id,
            uuid: s.uuid,
            name: s.nombre,
            price: parseFloat(s.precio) || 0,
            duration: s.duracion_minutos || 30
          }));
          setSelectedServices(citaServicios);
        }
        
        if (serviciosRes.success) {
          const serviciosFormateados = (serviciosRes.data.servicios || []).map(s => ({
            id: s.id,
            uuid: s.uuid,
            name: s.nombre,
            price: parseFloat(s.precio) || 0,
            duration: s.duracion_minutos || 30
          }));
          setAllServices(serviciosFormateados);
        }
      } catch (err) {
        console.error('Error cargando cita:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  // Cargar historial de mensajes de WhatsApp de la cita
  const fetchWhatsappInfo = useCallback(async () => {
    if (!id) return;
    try {
      const res = await whatsappService.getMensajesCita(id);
      if (res.success) {
        setWhatsappInfo(res.data);
      }
    } catch (err) {
      console.error('Error cargando historial de WhatsApp:', err);
    }
  }, [id]);

  useEffect(() => {
    fetchWhatsappInfo();
  }, [fetchWhatsappInfo]);

  // Enviar confirmación o recordatorio de asistencia por WhatsApp
  const handleEnviarWhatsapp = async (tipo) => {
    setSendingWhatsapp(tipo);
    try {
      const res = tipo === 'confirmacion'
        ? await whatsappService.enviarConfirmacion(id)
        : await whatsappService.enviarRecordatorio(id);

      await fetchWhatsappInfo();

      setResultModal({
        show: true,
        success: res.success,
        message: res.success
          ? (tipo === 'confirmacion' ? 'Confirmación enviada por WhatsApp' : 'Recordatorio enviado por WhatsApp')
          : (res.message || 'No se pudo enviar el mensaje')
      });
    } catch (err) {
      await fetchWhatsappInfo();
      setResultModal({
        show: true,
        success: false,
        message: err.response?.data?.message || 'No se pudo enviar el mensaje por WhatsApp'
      });
    } finally {
      setSendingWhatsapp(null);
    }
  };

  // El paciente confirmó asistencia (por teléfono/WhatsApp): marcar la cita como confirmada
  const handleConfirmarAsistencia = async () => {
    setConfirmandoAsistencia(true);
    try {
      const response = await citasService.update(id, { estado: 'confirmada' });
      if (response.success) {
        const citaRes = await citasService.getOne(id);
        if (citaRes.success) setAppointment(citaRes.data);
        setResultModal({ show: true, success: true, message: 'La cita se marcó como confirmada por el paciente' });
      } else {
        setResultModal({ show: true, success: false, message: response.message || 'Error al confirmar la cita' });
      }
    } catch (err) {
      setResultModal({ show: true, success: false, message: err.response?.data?.message || 'Error al confirmar la cita' });
    } finally {
      setConfirmandoAsistencia(false);
    }
  };

  // Los servicios disponibles son todos los del consultorio
  const availableServices = allServices;
  
  // Calcular totales
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
  
  // Toggle servicio
  const handleServiceToggle = (service) => {
    const isSelected = selectedServices.some(s => 
      (s.id && service.id && s.id === service.id) || 
      (s.uuid && service.uuid && s.uuid === service.uuid)
    );
    if (isSelected) {
      setSelectedServices(selectedServices.filter(s => 
        !((s.id && service.id && s.id === service.id) || 
          (s.uuid && service.uuid && s.uuid === service.uuid))
      ));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };
  
  // Guardar cambios de servicios
  const handleSaveServices = async () => {
    try {
      // Actualizar cita con nuevos servicios
      const servicios_uuids = selectedServices.map(s => s.uuid).filter(Boolean);
      await citasService.update(id, { servicios_uuids });
      setIsEditingServices(false);
    } catch (err) {
      console.error('Error guardando servicios:', err);
      showAlert('Error al guardar los servicios', { tipo: 'error' });
    }
  };
  
  // Asignar/cambiar el consultorio (sala) físico de la cita. No tiene
  // restricción de rol en el backend: cualquier miembro del staff (incluida
  // recepción) puede asignarlo o reasignarlo.
  const handleGuardarConsultorio = async () => {
    setSavingConsultorio(true);
    try {
      const response = await citasService.update(id, {
        consultorio_interno_uuid: selectedConsultorioUuid || null
      });
      if (response.success) {
        const elegido = consultoriosInternos.find(c => c.uuid === selectedConsultorioUuid);
        setAppointment(prev => prev ? {
          ...prev,
          consultorio_interno_uuid: elegido?.uuid || null,
          consultorio_interno_nombre: elegido?.nombre || null,
          consultorio_interno_color: elegido?.color || null
        } : prev);
        setIsEditingConsultorio(false);
      } else {
        showAlert(response.message || 'Error al asignar el consultorio', { tipo: 'error' });
      }
    } catch (err) {
      console.error('Error asignando consultorio:', err);
      showAlert('Error al asignar el consultorio', { tipo: 'error' });
    } finally {
      setSavingConsultorio(false);
    }
  };

  const handleCancelarEdicionConsultorio = () => {
    setSelectedConsultorioUuid(appointment?.consultorio_interno_uuid || '');
    setIsEditingConsultorio(false);
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    // Restaurar servicios originales
    if (appointment?.servicios) {
      const citaServicios = appointment.servicios.map(s => ({
        id: s.id,
        uuid: s.uuid,
        name: s.nombre,
        price: parseFloat(s.precio) || 0,
        duration: s.duracion_minutos || 30
      }));
      setSelectedServices(citaServicios);
    }
    setIsEditingServices(false);
  };

  // ===== FUNCIONES PARA REPROGRAMAR CITA =====
  
  // Cargar días de trabajo del doctor cuando se abre el modal
  useEffect(() => {
    const fetchDoctorWorkDays = async () => {
      if (showRescheduleModal && appointment?.doctor_uuid) {
        try {
          const response = await horariosService.getByDoctor(appointment.doctor_uuid);
          if (response.success && response.data.horarios?.length > 0) {
            const activeDays = response.data.horarios
              .filter(h => h.activo == 1)
              .map(h => Number(h.dia_semana));
            setDoctorWorkDays(activeDays);
          } else {
            setDoctorWorkDays([1, 2, 3, 4, 5]); // Default lunes a viernes
          }
        } catch (err) {
          console.error('Error cargando días de trabajo:', err);
          setDoctorWorkDays([1, 2, 3, 4, 5]);
        }
      }
    };
    
    fetchDoctorWorkDays();
  }, [showRescheduleModal, appointment?.doctor_uuid]);

  // Cargar bloqueos del doctor cuando se abre el modal
  useEffect(() => {
    const fetchBlockedDates = async () => {
      if (showRescheduleModal && appointment?.doctor_uuid) {
        try {
          const hoy = new Date();
          const desde = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
          const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 3, 0);
          const hastaStr = `${hasta.getFullYear()}-${String(hasta.getMonth() + 1).padStart(2, '0')}-${String(hasta.getDate()).padStart(2, '0')}`;
          
          const response = await horariosService.getBloqueos(appointment.doctor_uuid, {
            desde: desde,
            hasta: hastaStr
          });
          
          if (response.success && response.data.bloqueos) {
            const fechasBloqueadas = [];
            response.data.bloqueos.forEach(b => {
              if (b.todo_el_dia) {
                const inicio = new Date(b.fecha_inicio);
                const fin = new Date(b.fecha_fin);
                inicio.setHours(0, 0, 0, 0);
                fin.setHours(23, 59, 59, 999);
                
                let currentDate = new Date(inicio);
                while (currentDate <= fin) {
                  const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                  if (!fechasBloqueadas.includes(dateStr)) {
                    fechasBloqueadas.push(dateStr);
                  }
                  currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
                }
              }
            });
            setBlockedDates(fechasBloqueadas);
          }
        } catch (err) {
          console.error('Error cargando bloqueos:', err);
        }
      }
    };
    
    fetchBlockedDates();
  }, [showRescheduleModal, appointment?.doctor_uuid]);

  // Verificar si un día no está disponible
  const isDayUnavailable = (dayObj) => {
    if (!appointment?.doctor_uuid) return false;
    
    // Verificar si está bloqueado
    const dateStr = `${dayObj.fullDate.getFullYear()}-${String(dayObj.fullDate.getMonth() + 1).padStart(2, '0')}-${String(dayObj.fullDate.getDate()).padStart(2, '0')}`;
    if (blockedDates.includes(dateStr)) {
      return true;
    }
    
    // Verificar si el doctor trabaja ese día
    if (doctorWorkDays.length === 0) return false;
    const dayOfWeek = dayObj.fullDate.getDay();
    return !doctorWorkDays.includes(dayOfWeek);
  };
  
  // Abrir modal de reprogramar
  const handleOpenReschedule = () => {
    const today = new Date();
    setRescheduleMonth(today);
    setRescheduleDate(today);
    setRescheduleTime('');
    setShowRescheduleModal(true);
  };

  // Generar días del calendario
  const generateCalendarDays = () => {
    const days = [];
    const year = rescheduleMonth.getFullYear();
    const month = rescheduleMonth.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    let firstDayOfWeek = firstDayOfMonth.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({ 
        day: daysInPrevMonth - i, 
        isOtherMonth: true,
        fullDate: new Date(year, month - 1, daysInPrevMonth - i)
      });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ 
        day: i, 
        isOtherMonth: false,
        fullDate: new Date(year, month, i)
      });
    }
    
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ 
        day: i, 
        isOtherMonth: true,
        fullDate: new Date(year, month + 1, i)
      });
    }
    
    return days;
  };

  // Verificar si es el día seleccionado
  const isSelectedDay = (dayObj) => {
    if (!rescheduleDate) return false;
    return dayObj.fullDate.toDateString() === rescheduleDate.toDateString();
  };

  // Verificar si es hoy
  const isTodayDay = (dayObj) => {
    const today = new Date();
    return dayObj.fullDate.toDateString() === today.toDateString();
  };

  // Verificar si es día pasado
  const isPastDay = (dayObj) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dayObj.fullDate < today;
  };

  // Seleccionar día
  const handleSelectDay = async (dayObj) => {
    if (dayObj.isOtherMonth || isPastDay(dayObj)) return;
    
    setRescheduleDate(dayObj.fullDate);
    setRescheduleTime('');
    
    // Cargar horarios disponibles para ese día
    await loadAvailableSlots(dayObj.fullDate);
  };

  // Cargar horarios disponibles
  const loadAvailableSlots = async (date) => {
    if (!appointment?.doctor_uuid) return;
    
    setLoadingSlots(true);
    try {
      // Formatear fecha correctamente sin problemas de zona horaria
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const fechaStr = `${year}-${month}-${day}`;
      
      console.log('Cargando disponibilidad para:', fechaStr, 'doctor:', appointment.doctor_uuid);
      const response = await horariosService.getDisponibilidad(appointment.doctor_uuid, fechaStr);
      console.log('Respuesta disponibilidad:', response);
      
      if (response.success && response.data.slots && response.data.slots.length > 0) {
        setAvailableSlots(response.data.slots);
      } else if (response.success && response.data.disponible === false) {
        // Día no disponible (no trabaja o bloqueado)
        setAvailableSlots([]);
      } else {
        // Si no hay horarios configurados, generar slots por defecto
        const defaultSlots = [];
        for (let hour = 8; hour < 18; hour++) {
          defaultSlots.push({ hora: `${String(hour).padStart(2, '0')}:00`, disponible: true });
          defaultSlots.push({ hora: `${String(hour).padStart(2, '0')}:30`, disponible: true });
        }
        setAvailableSlots(defaultSlots);
      }
    } catch (err) {
      console.error('Error cargando horarios:', err);
      // Generar slots por defecto en caso de error
      const defaultSlots = [];
      for (let hour = 8; hour < 18; hour++) {
        defaultSlots.push({ hora: `${String(hour).padStart(2, '0')}:00`, disponible: true });
        defaultSlots.push({ hora: `${String(hour).padStart(2, '0')}:30`, disponible: true });
      }
      setAvailableSlots(defaultSlots);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Navegar mes anterior
  const goToPrevMonth = () => {
    setRescheduleMonth(new Date(rescheduleMonth.getFullYear(), rescheduleMonth.getMonth() - 1, 1));
  };

  // Navegar mes siguiente
  const goToNextMonth = () => {
    setRescheduleMonth(new Date(rescheduleMonth.getFullYear(), rescheduleMonth.getMonth() + 1, 1));
  };

  // Obtener nombre del mes
  const getMonthName = (date) => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Confirmar reprogramación
  // permitirFueraHorario=true cuando el usuario ya confirmó la advertencia
  // (se compara === true porque al usarse como onClick recibe el evento)
  const handleConfirmReschedule = async (permitirFueraHorario = false) => {
    const forzarFueraHorario = permitirFueraHorario === true;

    if (!rescheduleDate || !rescheduleTime) {
      setResultModal({
        show: true,
        success: false,
        message: 'Por favor selecciona fecha y hora'
      });
      return;
    }

    setRescheduling(true);
    try {
      const fechaStr = rescheduleDate.toISOString().split('T')[0];

      const response = await citasService.update(id, {
        fecha: fechaStr,
        hora_inicio: rescheduleTime,
        estado: 'reprogramada',
        permitir_fuera_horario: forzarFueraHorario
      });

      if (response.success) {
        setShowRescheduleModal(false);
        // Recargar datos de la cita
        const citaRes = await citasService.getOne(id);
        if (citaRes.success) {
          setAppointment(citaRes.data);
        }
        // Mostrar modal de éxito
        const fechaFormateada = rescheduleDate.toLocaleDateString('es-ES', { 
          weekday: 'long', day: 'numeric', month: 'long' 
        });
        setResultModal({
          show: true,
          success: true,
          message: `La cita ha sido reprogramada para el ${fechaFormateada} a las ${rescheduleTime}`
        });
      } else {
        setResultModal({
          show: true,
          success: false,
          message: response.message || 'Error al reprogramar la cita'
        });
      }
    } catch (err) {
      // Fuera del horario laboral: mostrar advertencia confirmable en vez de error
      if (err.response?.status === 409 && err.response?.data?.code === 'FUERA_HORARIO') {
        setWarningModal({ show: true, message: err.response.data.message });
      } else {
        console.error('Error reprogramando cita:', err);
        setResultModal({
          show: true,
          success: false,
          message: err.response?.data?.message || 'Error al reprogramar la cita. Inténtalo de nuevo.'
        });
      }
    } finally {
      setRescheduling(false);
    }
  };

  // Cerrar modal de resultado
  const closeResultModal = () => {
    setResultModal({ show: false, success: false, message: '' });
  };

  // Cancelar cita
  const handleCancelCita = async () => {
    setCancelling(true);
    try {
      const response = await citasService.delete(id);
      
      if (response.success) {
        setShowCancelModal(false);
        // Recargar datos de la cita
        const citaRes = await citasService.getOne(id);
        if (citaRes.success) {
          setAppointment(citaRes.data);
        }
        setResultModal({
          show: true,
          success: true,
          message: 'La cita ha sido cancelada exitosamente'
        });
      } else {
        setResultModal({
          show: true,
          success: false,
          message: response.message || 'Error al cancelar la cita'
        });
      }
    } catch (err) {
      console.error('Error cancelando cita:', err);
      setResultModal({
        show: true,
        success: false,
        message: 'Error al cancelar la cita. Inténtalo de nuevo.'
      });
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
    }
  };

  // Marcar asistencia (cambiar estado a en_progreso o completada)
  // Check-in de recepción: marca/desmarca la llegada del paciente a la
  // clínica. Es el mismo campo que el paciente puede marcar desde su
  // portal el día de la cita; desde aquí el personal lo puede alternar
  // libremente (p. ej. si el paciente llegó sin usar el portal).
  const handleToggleCheckin = async () => {
    setTogglingCheckin(true);
    try {
      const response = await citasService.checkin(id);
      if (response.success) {
        setAppointment(prev => prev ? { ...prev, checkin_at: response.data.checkin_at } : prev);
      }
    } catch (err) {
      console.error('Error al registrar check-in:', err);
    } finally {
      setTogglingCheckin(false);
    }
  };

  const handleMarcarAsistencia = async () => {
    try {
      const response = await citasService.update(id, { estado: 'en_progreso' });
      
      if (response.success) {
        // Recargar datos de la cita
        const citaRes = await citasService.getOne(id);
        if (citaRes.success) {
          setAppointment(citaRes.data);
        }
        setResultModal({
          show: true,
          success: true,
          message: 'Se ha registrado la asistencia del paciente'
        });
      } else {
        setResultModal({
          show: true,
          success: false,
          message: response.message || 'Error al registrar asistencia'
        });
      }
    } catch (err) {
      console.error('Error marcando asistencia:', err);
      setResultModal({
        show: true,
        success: false,
        message: 'Error al registrar asistencia. Inténtalo de nuevo.'
      });
    }
  };

  // Marcar inasistencia (cambiar estado a no_asistio)
  const handleMarcarInasistencia = async () => {
    try {
      const response = await citasService.update(id, { estado: 'no_asistio' });
      
      if (response.success) {
        // Recargar datos de la cita
        const citaRes = await citasService.getOne(id);
        if (citaRes.success) {
          setAppointment(citaRes.data);
        }
        setResultModal({
          show: true,
          success: true,
          message: 'Se ha registrado la inasistencia del paciente'
        });
      } else {
        setResultModal({
          show: true,
          success: false,
          message: response.message || 'Error al registrar inasistencia'
        });
      }
    } catch (err) {
      console.error('Error marcando inasistencia:', err);
      setResultModal({
        show: true,
        success: false,
        message: 'Error al registrar inasistencia. Inténtalo de nuevo.'
      });
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Header title="Detalle de Cita" showBack />
        <Content>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Loader className="spin" size={32} />
          </div>
        </Content>
      </PageContainer>
    );
  }

  if (!appointment) {
    return (
      <PageContainer>
        <Header title="Detalle de Cita" showBack />
        <Content>
          <MainCard>
            <SectionTitle>
              <AlertCircle />
              Cita no encontrada
            </SectionTitle>
            <NotesText>La cita que buscas no existe o ha sido eliminada.</NotesText>
          </MainCard>
        </Content>
      </PageContainer>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmada':
        return <CheckCircle />;
      case 'programada':
        return <Clock />;
      case 'reprogramada':
        return <Calendar />;
      case 'cancelada':
        return <X />;
      case 'completada':
        return <CheckCircle />;
      case 'en_progreso':
        return <Stethoscope />;
      case 'no_asistio':
        return <UserX />;
      case 'pendiente_pago':
        return <AlertCircle />;
      default:
        return <AlertCircle />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      programada: 'Programada',
      confirmada: 'Confirmada',
      en_progreso: 'En Progreso',
      completada: 'Completada',
      reprogramada: 'Reprogramada',
      cancelada: 'Cancelada',
      no_asistio: 'No Asistió',
      pendiente_pago: 'Pendiente de Pago'
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // Manejar diferentes formatos de fecha
    let date;
    if (typeof dateString === 'string') {
      // Si es string ISO con T, crear directamente
      if (dateString.includes('T')) {
        date = new Date(dateString);
      } else {
        // Si es solo fecha YYYY-MM-DD, agregar tiempo para evitar problemas de timezone
        date = new Date(dateString + 'T12:00:00');
      }
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      date = new Date(dateString);
    }
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      console.log('Fecha inválida:', dateString);
      return 'Fecha no disponible';
    }
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  };

  // Calcular duración desde hora_inicio y hora_fin
  const calculateDuration = () => {
    if (!appointment?.hora_inicio || !appointment?.hora_fin) return totalDuration || 30;
    const [h1, m1] = appointment.hora_inicio.split(':').map(Number);
    const [h2, m2] = appointment.hora_fin.split(':').map(Number);
    return (h2 * 60 + m2) - (h1 * 60 + m1);
  };

  return (
    <PageContainer>
      <Header title="Detalle de Cita" showBack />
      
      <StatusBanner $status={appointment.estado}>
        {getStatusIcon(appointment.estado)}
        {getStatusLabel(appointment.estado)}
      </StatusBanner>

      <Content>
        {/* Información principal de la cita */}
        <MainCard>
          <AppointmentHeader>
            <TimeBox>
              <TimeText>{appointment.hora_inicio?.substring(0, 5)}</TimeText>
              <DateText>{calculateDuration()} min</DateText>
            </TimeBox>
            <AppointmentInfo>
              <AppointmentType>{appointment.tipo || 'Consulta'}</AppointmentType>
              <AppointmentDuration>
                <Calendar />
                {formatDate(appointment.fecha)}
              </AppointmentDuration>
            </AppointmentInfo>
          </AppointmentHeader>

          {/* Información del paciente */}
          <SectionTitle>
            <User />
            Paciente
          </SectionTitle>
          <PersonCard onClick={() => appointment.paciente_uuid && navigate(`/perfil-paciente/${appointment.paciente_uuid}`)}>
            <PersonImage>
              <User />
            </PersonImage>
            <PersonInfo>
              <PersonName>{appointment.paciente_nombre} {appointment.paciente_apellidos}</PersonName>
              <PersonDetail>
                Tel: {appointment.paciente_telefono || 'No registrado'}
              </PersonDetail>
            </PersonInfo>
          </PersonCard>

          {appointment.paciente_telefono && (
            <ContactInfo>
              <ContactItem href={`tel:${appointment.paciente_telefono}`}>
                <Phone />
                <span>{appointment.paciente_telefono}</span>
              </ContactItem>
              {appointment.paciente_email && (
                <ContactItem href={`mailto:${appointment.paciente_email}`}>
                  <Mail />
                  <span>{appointment.paciente_email}</span>
                </ContactItem>
              )}
            </ContactInfo>
          )}
        </MainCard>

        {/* Confirmación de asistencia por WhatsApp */}
        {appointment.paciente_telefono && !['cancelada', 'completada', 'no_asistio'].includes(appointment.estado) && (
          <MainCard>
            <SectionTitle>
              <MessageCircle />
              Confirmación por WhatsApp
            </SectionTitle>

            {!whatsappInfo.configurado && (
              <PersonDetail style={{ marginTop: 8, color: '#E65100' }}>
                WhatsApp no está configurado en el servidor. Contacta al administrador.
              </PersonDetail>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              <SecondaryButton
                onClick={() => handleEnviarWhatsapp('confirmacion')}
                disabled={sendingWhatsapp !== null}
                style={{ flex: '1 1 160px' }}
              >
                <Send />
                {sendingWhatsapp === 'confirmacion' ? 'Enviando...' : 'Enviar Confirmación'}
              </SecondaryButton>
              <SecondaryButton
                onClick={() => handleEnviarWhatsapp('recordatorio')}
                disabled={sendingWhatsapp !== null}
                style={{ flex: '1 1 160px' }}
              >
                <MessageCircle />
                {sendingWhatsapp === 'recordatorio' ? 'Enviando...' : 'Enviar Recordatorio'}
              </SecondaryButton>
            </div>

            {appointment.estado !== 'confirmada' && (
              <SuccessButton
                onClick={handleConfirmarAsistencia}
                disabled={confirmandoAsistencia}
                style={{ marginTop: 10, width: '100%' }}
              >
                <UserCheck />
                {confirmandoAsistencia ? 'Guardando...' : 'Paciente confirmó asistencia'}
              </SuccessButton>
            )}

            {whatsappInfo.mensajes?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <PersonDetail style={{ marginBottom: 8, fontWeight: 600 }}>Historial</PersonDetail>
                {whatsappInfo.mensajes.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderTop: i > 0 ? '1px solid #eee' : 'none',
                      fontSize: 13
                    }}
                  >
                    <span>
                      {m.tipo === 'confirmacion' ? 'Confirmación' : 'Recordatorio'}{' '}
                      {m.estado === 'error' ? '❌' : '✅'}
                    </span>
                    <span style={{ color: '#888' }}>
                      {m.fecha_envio ? new Date(m.fecha_envio).toLocaleString('es-MX') : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </MainCard>
        )}

        {/* Información del médico */}
        <MainCard>
          <SectionTitle>
            <Stethoscope />
            Médico
          </SectionTitle>
          <PersonCard onClick={() => appointment.doctor_uuid && navigate(`/perfil-medico/${appointment.doctor_uuid}`)}>
            <PersonImage>
              <Stethoscope />
            </PersonImage>
            <PersonInfo>
              <PersonName>Dr. {appointment.doctor_nombre} {appointment.doctor_apellidos}</PersonName>
              <PersonDetail>
                {appointment.especialidad || 'Médico General'}
              </PersonDetail>
            </PersonInfo>
          </PersonCard>
        </MainCard>

        {/* Consultorio interno (sala física) */}
        {appointment.estado !== 'cancelada' && (
          <MainCard>
            <SectionHeader>
              <SectionTitle>
                <DoorOpen />
                Consultorio
              </SectionTitle>
              {!isEditingConsultorio ? (
                <EditServicesButton onClick={() => setIsEditingConsultorio(true)}>
                  <Edit />
                  {appointment.consultorio_interno_nombre ? 'Cambiar' : 'Asignar'}
                </EditServicesButton>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <EditServicesButton onClick={handleCancelarEdicionConsultorio}>
                    <X />
                    Cancelar
                  </EditServicesButton>
                  <EditServicesButton
                    onClick={handleGuardarConsultorio}
                    disabled={savingConsultorio}
                    style={{ background: '#4CAF50', color: 'white', borderColor: '#4CAF50' }}
                  >
                    <Check />
                    {savingConsultorio ? 'Guardando...' : 'Guardar'}
                  </EditServicesButton>
                </div>
              )}
            </SectionHeader>

            {isEditingConsultorio ? (
              consultoriosInternos.length === 0 ? (
                <NotesText>
                  No hay consultorios registrados. Puedes crear uno desde Consultorios en el menú de Administración.
                </NotesText>
              ) : (
                <ServicesContainer>
                  {consultoriosInternos.map(consultorio => (
                    <ServiceItem
                      key={consultorio.uuid}
                      $selected={selectedConsultorioUuid === consultorio.uuid}
                      $editable={true}
                      onClick={() => setSelectedConsultorioUuid(consultorio.uuid)}
                    >
                      <ServiceInfo>
                        <ServiceCheckbox $checked={selectedConsultorioUuid === consultorio.uuid}>
                          {selectedConsultorioUuid === consultorio.uuid && <Check />}
                        </ServiceCheckbox>
                        <ServiceDetails>
                          <ServiceName>{consultorio.nombre}</ServiceName>
                          <ServiceMeta>
                            <span>{consultorio.ubicacion || 'Sin ubicación'}</span>
                          </ServiceMeta>
                        </ServiceDetails>
                      </ServiceInfo>
                    </ServiceItem>
                  ))}
                </ServicesContainer>
              )
            ) : appointment.consultorio_interno_nombre ? (
              <PersonCard style={{ cursor: 'default' }}>
                <PersonImage style={{ background: appointment.consultorio_interno_color || '#6366F1' }}>
                  <DoorOpen />
                </PersonImage>
                <PersonInfo>
                  <PersonName>{appointment.consultorio_interno_nombre}</PersonName>
                  <PersonDetail>Consultorio asignado</PersonDetail>
                </PersonInfo>
              </PersonCard>
            ) : (
              <NotesText>Sin consultorio asignado todavía.</NotesText>
            )}
          </MainCard>
        )}

        {/* Servicios */}
        <MainCard>
          <SectionHeader>
            <SectionTitle>
              <ShoppingBag />
              Servicios
            </SectionTitle>
            {!appointment.pagado && appointment.estado !== 'cancelada' && appointment.estado !== 'completada' && (
              <>
                {!isEditingServices ? (
                  <EditServicesButton onClick={() => setIsEditingServices(true)}>
                    <Edit />
                    Editar
                  </EditServicesButton>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <EditServicesButton onClick={handleCancelEdit}>
                      <X />
                      Cancelar
                    </EditServicesButton>
                    <EditServicesButton onClick={handleSaveServices} style={{ background: '#4CAF50', color: 'white', borderColor: '#4CAF50' }}>
                      <Check />
                      Guardar
                    </EditServicesButton>
                  </div>
                )}
              </>
            )}
          </SectionHeader>
          
          <ServicesContainer>
            {isEditingServices ? (
              // Modo edición - mostrar todos los servicios disponibles
              availableServices.map(service => {
                const isSelected = selectedServices.some(s => 
                  (s.id && service.id && s.id === service.id) || 
                  (s.uuid && service.uuid && s.uuid === service.uuid)
                );
                return (
                  <ServiceItem 
                    key={service.id} 
                    $selected={isSelected}
                    $editable={true}
                    onClick={() => handleServiceToggle(service)}
                  >
                    <ServiceInfo>
                      <ServiceCheckbox $checked={isSelected}>
                        {isSelected && <Check />}
                      </ServiceCheckbox>
                      <ServiceDetails>
                        <ServiceName>{service.name}</ServiceName>
                        <ServiceMeta>
                          <span>{service.duration} min</span>
                          <ServicePrice>${service.price}</ServicePrice>
                        </ServiceMeta>
                      </ServiceDetails>
                    </ServiceInfo>
                  </ServiceItem>
                );
              })
            ) : (
              // Modo vista - mostrar servicios seleccionados
              selectedServices.map((service, index) => (
                <ServiceItem key={index} $editable={false}>
                  <ServiceInfo>
                    <ServiceDetails>
                      <ServiceName>{service.name}</ServiceName>
                      <ServiceMeta>
                        <span>{service.duration} min</span>
                        <ServicePrice>${service.price}</ServicePrice>
                      </ServiceMeta>
                    </ServiceDetails>
                  </ServiceInfo>
                </ServiceItem>
              ))
            )}
          </ServicesContainer>
          
          <ServicesTotalBar>
            <div>
              <TotalLabel>Duración total: </TotalLabel>
              <TotalValue>{totalDuration} min</TotalValue>
            </div>
            <div>
              <TotalLabel>Total: </TotalLabel>
              <TotalValue>${totalPrice}</TotalValue>
            </div>
          </ServicesTotalBar>
        </MainCard>

        {/* Notas */}
        <MainCard>
          <SectionTitle>
            <FileText />
            Notas de la cita
          </SectionTitle>
          <NotesSection>
            <NotesText>
              No hay notas adicionales para esta cita. Las notas se agregarán durante o después de la consulta.
            </NotesText>
          </NotesSection>
        </MainCard>

        {/* Acciones */}
        <MainCard>
          <SectionTitle>Acciones</SectionTitle>
          <ActionsContainer>
            {appointment.estado !== 'cancelada' && (
              appointment.checkin_at ? (
                <SecondaryButton onClick={handleToggleCheckin} disabled={togglingCheckin}>
                  <LogIn />
                  {togglingCheckin
                    ? 'Guardando...'
                    : `Llegó a las ${new Date(appointment.checkin_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} · Deshacer`}
                </SecondaryButton>
              ) : (
                <SuccessButton onClick={handleToggleCheckin} disabled={togglingCheckin}>
                  <LogIn />
                  {togglingCheckin ? 'Guardando...' : 'Registrar llegada (recepción)'}
                </SuccessButton>
              )
            )}
            {appointment.pagado ? (
              // Si ya está pagado, solo mostrar Ver Recibo
              <SecondaryButton onClick={() => navigate(`/generar-recibo/${appointment.uuid}`)}>
                <Eye />
                Ver Recibo
              </SecondaryButton>
            ) : (
              // Si no está pagado, mostrar todas las acciones según el estado
              <>
                {appointment.estado !== 'cancelada' && appointment.estado !== 'completada' && appointment.estado !== 'no_asistio' && appointment.estado !== 'en_progreso' && appointment.estado !== 'pendiente_pago' && (
                  <>
                    <SuccessButton onClick={handleMarcarAsistencia}>
                      <UserCheck />
                      Iniciar Consulta
                    </SuccessButton>
                    <WarningButton onClick={handleMarcarInasistencia}>
                      <UserX />
                      Marcar Inasistencia
                    </WarningButton>
                    <SecondaryButton onClick={handleOpenReschedule}>
                      <Edit />
                      Reprogramar Cita
                    </SecondaryButton>
                    <DangerButton onClick={() => setShowCancelModal(true)}>
                      <X />
                      Cancelar Cita
                    </DangerButton>
                  </>
                )}
                {(appointment.estado === 'en_progreso' || appointment.estado === 'pendiente_pago') && (
                  <>
                    <SecondaryButton onClick={() => navigate(`/generar-recibo/${appointment.uuid}`)}>
                      <Receipt />
                      Generar Recibo
                    </SecondaryButton>
                  </>
                )}
                {appointment.estado === 'completada' && (
                  <SecondaryButton onClick={() => navigate(`/generar-recibo/${appointment.uuid}`)}>
                    <Receipt />
                    Generar Recibo
                  </SecondaryButton>
                )}
                {appointment.estado === 'cancelada' && (
                  <SecondaryButton onClick={handleOpenReschedule}>
                    <Calendar />
                    Reagendar Cita
                  </SecondaryButton>
                )}
                {appointment.estado === 'no_asistio' && (
                  <SecondaryButton onClick={handleOpenReschedule}>
                    <Calendar />
                    Reagendar Cita
                  </SecondaryButton>
                )}
              </>
            )}
          </ActionsContainer>
        </MainCard>
      </Content>

      {/* Modal de Reprogramar Cita */}
      {showRescheduleModal && (
        <ModalOverlay onClick={() => !rescheduling && setShowRescheduleModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <Calendar />
                Reprogramar Cita
              </ModalTitle>
              <CloseButton onClick={() => !rescheduling && setShowRescheduleModal(false)}>
                <X />
              </CloseButton>
            </ModalHeader>

            <ModalBody>
              {/* Calendario */}
              <CalendarContainer>
                <CalendarHeader>
                  <CalendarNavButton onClick={goToPrevMonth}>
                    <ChevronLeft />
                  </CalendarNavButton>
                  <CalendarMonth>{getMonthName(rescheduleMonth)}</CalendarMonth>
                  <CalendarNavButton onClick={goToNextMonth}>
                    <ChevronRight />
                  </CalendarNavButton>
                </CalendarHeader>

                <WeekDays>
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                    <WeekDay key={day}>{day}</WeekDay>
                  ))}
                </WeekDays>

                <DaysGrid>
                  {generateCalendarDays().map((dayObj, index) => {
                    const unavailable = !dayObj.isOtherMonth && !isPastDay(dayObj) && isDayUnavailable(dayObj);
                    return (
                      <DayCell
                        key={index}
                        $isSelected={isSelectedDay(dayObj)}
                        $isToday={isTodayDay(dayObj)}
                        $isOtherMonth={dayObj.isOtherMonth}
                        $isPast={isPastDay(dayObj)}
                        $isUnavailable={unavailable}
                        onClick={() => !unavailable && handleSelectDay(dayObj)}
                        disabled={dayObj.isOtherMonth || isPastDay(dayObj) || unavailable}
                        title={unavailable ? 'El doctor no trabaja este día' : ''}
                      >
                        {dayObj.day}
                      </DayCell>
                    );
                  })}
                </DaysGrid>
              </CalendarContainer>

              {/* Horarios disponibles */}
              {rescheduleDate && (
                <TimeSection>
                  <TimeSectionTitle>
                    Horarios disponibles para {rescheduleDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </TimeSectionTitle>
                  
                  {loadingSlots ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <Loader className="spin" size={24} />
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <>
                      <TimeGrid>
                        {availableSlots.map((slot, index) => (
                          <TimeSlot
                            key={index}
                            $isSelected={rescheduleTime === slot.hora}
                            $isOccupied={!slot.disponible}
                            onClick={() => {
                              if (slot.disponible) {
                                setRescheduleTime(slot.hora);
                              }
                            }}
                            disabled={!slot.disponible}
                          >
                            {slot.hora}
                          </TimeSlot>
                        ))}
                      </TimeGrid>
                      <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                        Las horas tachadas no están disponibles
                      </p>
                    </>
                  ) : (
                    <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                      No hay horarios disponibles para este día
                    </p>
                  )}
                </TimeSection>
              )}
            </ModalBody>

            <ModalActions>
              <CancelButton onClick={() => setShowRescheduleModal(false)} disabled={rescheduling}>
                Cancelar
              </CancelButton>
              <ConfirmButton 
                onClick={handleConfirmReschedule} 
                disabled={!rescheduleDate || !rescheduleTime || rescheduling}
              >
                {rescheduling ? 'Reprogramando...' : 'Confirmar'}
              </ConfirmButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Modal de Confirmar Cancelación */}
      {showCancelModal && (
        <ModalOverlay onClick={() => !cancelling && setShowCancelModal(false)}>
          <ResultModalContent onClick={e => e.stopPropagation()}>
            <ResultIcon $success={false}>
              <AlertCircle />
            </ResultIcon>
            <ResultTitle>
              ¿Cancelar Cita?
            </ResultTitle>
            <ResultMessage>
              ¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer.
            </ResultMessage>
            <ModalActions style={{ border: 'none', padding: '0', marginTop: '20px' }}>
              <CancelButton onClick={() => setShowCancelModal(false)} disabled={cancelling}>
                No, mantener
              </CancelButton>
              <DangerButton onClick={handleCancelCita} disabled={cancelling} style={{ flex: 1 }}>
                {cancelling ? 'Cancelando...' : 'Sí, cancelar cita'}
              </DangerButton>
            </ModalActions>
          </ResultModalContent>
        </ModalOverlay>
      )}

      {/* Modal de Resultado */}
      {resultModal.show && (
        <ModalOverlay onClick={closeResultModal}>
          <ResultModalContent onClick={e => e.stopPropagation()}>
            <ResultIcon $success={resultModal.success}>
              {resultModal.success ? <CheckCircle /> : <AlertCircle />}
            </ResultIcon>
            <ResultTitle>
              {resultModal.success ? '¡Listo!' : 'Error'}
            </ResultTitle>
            <ResultMessage>
              {resultModal.message}
            </ResultMessage>
            <ResultButton $success={resultModal.success} onClick={closeResultModal}>
              Aceptar
            </ResultButton>
          </ResultModalContent>
        </ModalOverlay>
      )}

      {/* Advertencia: reprogramación fuera del horario laboral del doctor */}
      <Modal
        isOpen={warningModal.show}
        onClose={() => setWarningModal({ show: false, message: '' })}
        onConfirm={() => {
          setWarningModal({ show: false, message: '' });
          handleConfirmReschedule(true);
        }}
        title="Fuera de Horario"
        message={`${warningModal.message}. ¿Deseas reprogramar la cita de todas formas?`}
        type="warning"
        confirmText="Reprogramar de todas formas"
        cancelText="Cancelar"
        showCancel
      />
    </PageContainer>
  );
};

export default DetalleCita;
