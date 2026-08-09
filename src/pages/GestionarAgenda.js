import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Calendar,
  Plus,
  Lock,
  Users,
  Settings,
  Check,
  X,
  Loader,
  User
} from 'lucide-react';
import Header from '../components/Layout/Header';
import { usuariosService, citasService, horariosService } from '../services/api';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding-bottom: 100px;
  overflow-y: auto;
`;

const Content = styled.div`
  padding: 20px;
`;

const DoctorInfo = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const DoctorImage = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
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
    width: 24px;
    height: 24px;
    color: white;
  }
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
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

const QuickActions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
`;

const QuickActionButton = styled.button`
  background: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  svg {
    width: 28px;
    height: 28px;
    color: ${({ theme }) => theme.colors.primary};
  }

  span {
    font-size: 13px;
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    color: ${({ theme }) => theme.colors.text};
    text-align: center;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
`;

const CalendarCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const MonthYear = styled.h2`
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const NavButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const NavButton = styled.button`
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
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const WeekDays = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 4px;
`;

const WeekDay = styled.div`
  text-align: center;
  font-size: 11px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: 4px 0;
`;

const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
`;

const DayCell = styled.button`
  width: 32px;
  height: 32px;
  margin: 0 auto;
  border: none;
  background: ${({ $isSelected, $isToday, $hasAppointments, theme }) => 
    $isSelected ? theme.colors.primary : 
    $isToday ? theme.colors.primaryLight :
    'transparent'};
  color: ${({ $isSelected, $isOtherMonth, theme }) => 
    $isSelected ? theme.colors.white :
    $isOtherMonth ? '#D0D0D0' :
    theme.colors.text};
  border-radius: 50%;
  font-size: 12px;
  font-weight: ${({ $isSelected, $isToday, theme }) => 
    $isSelected || $isToday ? theme.fontWeights.semibold : theme.fontWeights.normal};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &:hover {
    background: ${({ $isSelected, theme }) => 
      $isSelected ? theme.colors.primaryDark : theme.colors.gray};
  }
`;

const AppointmentDot = styled.div`
  position: absolute;
  bottom: 2px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: ${({ $isSelected, theme }) => 
    $isSelected ? theme.colors.white : theme.colors.primary};
`;

const SectionCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const EditButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    text-decoration: underline;
  }
`;

const ScheduleGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ScheduleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: ${({ $active, theme }) => $active ? theme.colors.primaryLight : theme.colors.gray};
  border-radius: 10px;
`;

const DayName = styled.span`
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  min-width: 80px;
`;

const TimeRange = styled.span`
  font-size: 14px;
  color: ${({ $active, theme }) => $active ? theme.colors.text : theme.colors.textSecondary};
`;

const StatusIndicator = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $active, theme }) => $active ? theme.colors.success : theme.colors.border};

  svg {
    width: 14px;
    height: 14px;
    color: ${({ $active, theme }) => $active ? theme.colors.white : theme.colors.textSecondary};
  }
`;

const AppointmentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const AppointmentCard = styled.div`
  background: ${({ theme }) => theme.colors.gray};
  border-radius: 12px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid ${({ $status, theme }) => 
    $status === 'confirmada' ? theme.colors.success :
    $status === 'pendiente' ? theme.colors.warning :
    theme.colors.primary};

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`;

const AppointmentTime = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
  padding: 8px 12px;
  text-align: center;
  min-width: 60px;
`;

const TimeText = styled.span`
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

const AppointmentInfo = styled.div`
  flex: 1;
`;

const PatientName = styled.h4`
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 4px 0;
`;

const AppointmentType = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const AppointmentStatus = styled.span`
  font-size: 11px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  padding: 4px 10px;
  border-radius: 20px;
  background: ${({ $status, theme }) => 
    $status === 'confirmada' ? theme.colors.success :
    $status === 'pendiente' ? theme.colors.warning :
    theme.colors.primaryLight};
  color: ${({ $status, theme }) => 
    $status === 'confirmada' ? theme.colors.white :
    $status === 'pendiente' ? '#856404' :
    theme.colors.primary};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 30px 20px;

  svg {
    width: 48px;
    height: 48px;
    color: ${({ theme }) => theme.colors.textSecondary};
    margin-bottom: 12px;
  }

  p {
    font-size: 14px;
    color: ${({ theme }) => theme.colors.textSecondary};
    margin: 0;
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
  padding: 16px 12px;
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

// Modal styles
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
  max-width: 450px;
  max-height: 70vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: 4px;
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

const ScheduleEditRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  
  &:last-child {
    border-bottom: none;
  }
`;

const ScheduleCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: ${({ theme }) => theme.colors.primary};
  }
  
  span {
    font-size: 14px;
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    color: ${({ theme }) => theme.colors.text};
    min-width: 90px;
  }
`;

const ScheduleTimeInputs = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: ${({ $disabled }) => ($disabled ? 0.4 : 1)};
  
  span {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const TimeInput = styled.input`
  padding: 8px 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  font-size: 14px;
  width: 100px;
  
  &:disabled {
    background: ${({ theme }) => theme.colors.background};
    cursor: not-allowed;
  }
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  
  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`;

const SaveButton = styled.button`
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const GestionarAgenda = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [doctor, setDoctor] = useState(null);
  const [dayAppointments, setDayAppointments] = useState([]);
  const [monthAppointments, setMonthAppointments] = useState({}); // Días con citas en el mes
  const [workSchedule, setWorkSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditSchedule, setShowEditSchedule] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState([]);
  const [saving, setSaving] = useState(false);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Cargar datos del doctor
  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const response = await usuariosService.getById(id);
        if (response.success) {
          setDoctor(response.data);
        }
      } catch (err) {
        console.error('Error cargando doctor:', err);
      }
    };
    
    if (id) fetchDoctor();
  }, [id]);

  // Cargar horarios del doctor
  useEffect(() => {
    const fetchHorarios = async () => {
      if (!id) return;
      
      try {
        const response = await horariosService.getHorarios(id);
        if (response.success && response.data.horarios) {
          // Convertir horarios del backend al formato del frontend
          const defaultSchedule = dayNames.map((day, index) => ({
            day,
            dia_semana: index,
            active: false,
            start: '09:00',
            end: '18:00'
          }));
          
          // Actualizar con horarios del backend
          response.data.horarios.forEach(h => {
            if (h.dia_semana >= 0 && h.dia_semana < 7) {
              defaultSchedule[h.dia_semana] = {
                day: dayNames[h.dia_semana],
                dia_semana: h.dia_semana,
                active: h.activo == 1, // Convertir 0/1 de MySQL a boolean
                start: h.hora_inicio?.substring(0, 5) || '09:00',
                end: h.hora_fin?.substring(0, 5) || '18:00'
              };
            }
          });
          
          setWorkSchedule(defaultSchedule);
        } else {
          // Horario por defecto si no hay datos
          setWorkSchedule(dayNames.map((day, index) => ({
            day,
            dia_semana: index,
            active: index >= 1 && index <= 5, // Lunes a Viernes
            start: '09:00',
            end: '18:00'
          })));
        }
      } catch (err) {
        console.error('Error cargando horarios:', err);
        // Horario por defecto en caso de error
        setWorkSchedule(dayNames.map((day, index) => ({
          day,
          dia_semana: index,
          active: index >= 1 && index <= 5,
          start: '09:00',
          end: '18:00'
        })));
      }
    };
    
    fetchHorarios();
  }, [id]);

  // Cargar citas del mes para mostrar indicadores en el calendario
  useEffect(() => {
    const fetchMonthAppointments = async () => {
      if (!id) return;
      
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        // Usar getByDoctor con parámetros de año y mes
        const citasRes = await citasService.getByDoctor(id, { year, month });
        
        if (citasRes.success) {
          const citas = citasRes.data.citas || citasRes.data || [];
          
          const appointmentsByDay = {};
          citas.forEach(c => {
            const fechaCita = new Date(c.fecha);
            const day = fechaCita.getDate();
            appointmentsByDay[day] = (appointmentsByDay[day] || 0) + 1;
          });
          
          setMonthAppointments(appointmentsByDay);
        }
      } catch (err) {
        console.error('Error cargando citas del mes:', err);
      }
    };
    
    fetchMonthAppointments();
  }, [id, currentDate]);

  // Abrir modal de edición
  const handleOpenEditSchedule = () => {
    setEditingSchedule(workSchedule.map(s => ({ ...s })));
    setShowEditSchedule(true);
  };

  // Actualizar horario en edición
  const handleScheduleChange = (index, field, value) => {
    setEditingSchedule(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Guardar horarios
  const handleSaveSchedule = async () => {
    setSaving(true);
    try {
      const horariosToSave = editingSchedule.map(s => ({
        dia_semana: s.dia_semana,
        hora_inicio: s.start,
        hora_fin: s.end,
        intervalo_minutos: 30,
        activo: s.active
      }));
      
      const response = await horariosService.setHorarios(id, horariosToSave);
      
      if (response.success) {
        setWorkSchedule(editingSchedule);
        setShowEditSchedule(false);
      } else {
        alert('Error al guardar horarios: ' + (response.message || 'Error desconocido'));
      }
    } catch (err) {
      console.error('Error guardando horarios:', err);
      alert('Error al guardar horarios');
    } finally {
      setSaving(false);
    }
  };

  // Cargar citas cuando cambia la fecha seleccionada
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const dateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        
        const citasRes = await citasService.getAll({ doctor_id: id, fecha: dateString });
        
        if (citasRes.success) {
          const citasFormateadas = (citasRes.data.citas || []).map(c => ({
            id: c.id,
            uuid: c.uuid,
            time: c.hora_inicio?.substring(0, 5),
            patient: `${c.paciente_nombre} ${c.paciente_apellidos}`,
            type: c.tipo || 'Consulta',
            status: c.estado
          }));
          setDayAppointments(citasFormateadas);
        }
      } catch (err) {
        console.error('Error cargando citas:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, [id, selectedDate]);

  // Estadísticas del día
  const stats = {
    total: dayAppointments.length,
    confirmadas: dayAppointments.filter(a => a.status === 'confirmada').length,
    pendientes: dayAppointments.filter(a => a.status === 'pendiente').length,
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isOtherMonth: true,
        date: new Date(year, month - 1, prevMonthLastDay - i)
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isOtherMonth: false,
        date: new Date(year, month, i)
      });
    }
    
    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isOtherMonth: true,
        date: new Date(year, month + 1, i)
      });
    }

    return days;
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date) => {
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  };

  const hasAppointments = (dayInfo) => {
    // Verificar si el día tiene citas reales
    if (dayInfo.isOtherMonth) return false;
    const day = dayInfo.date.getDate();
    return monthAppointments[day] > 0;
  };

  const formatSelectedDate = () => {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return selectedDate.toLocaleDateString('es-ES', options);
  };

  if (!doctor && loading) {
    return (
      <PageContainer>
        <Header title="Gestionar Agenda" showBack />
        <Content>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Loader className="spin" size={32} />
          </div>
        </Content>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header title="Gestionar Agenda" showBack />
      
      <Content>
        {/* Info del médico */}
        {doctor && (
        <DoctorInfo>
          <DoctorImage>
            {doctor.foto_url ? (
              <img src={doctor.foto_url} alt={`${doctor.nombre} ${doctor.apellidos}`} />
            ) : (
              <User />
            )}
          </DoctorImage>
          <DoctorDetails>
            <DoctorName>Dr. {doctor.nombre} {doctor.apellidos}</DoctorName>
            <DoctorSpecialty>{doctor.especialidad || 'Médico General'}</DoctorSpecialty>
          </DoctorDetails>
        </DoctorInfo>
        )}

        {/* Acciones rápidas */}
        <QuickActions>
          <QuickActionButton onClick={() => navigate(`/reservar-cita?doctor=${id}`)}>
            <Plus />
            <span>Nueva Cita</span>
          </QuickActionButton>
          <QuickActionButton onClick={() => navigate(`/bloquear-horarios/${id}`)}>
            <Lock />
            <span>Bloquear Horarios</span>
          </QuickActionButton>
          <QuickActionButton onClick={() => navigate(`/gestion-servicios/${id}`)}>
            <Settings />
            <span>Servicios</span>
          </QuickActionButton>
          <QuickActionButton onClick={() => navigate(`/perfil-medico/${id}`)}>
            <Users />
            <span>Ver Perfil</span>
          </QuickActionButton>
        </QuickActions>

        {/* Calendario */}
        <CalendarCard>
          <CalendarHeader>
            <MonthYear>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</MonthYear>
            <NavButtons>
              <NavButton onClick={() => navigateMonth(-1)}>
                <ChevronLeft />
              </NavButton>
              <NavButton onClick={() => navigateMonth(1)}>
                <ChevronRight />
              </NavButton>
            </NavButtons>
          </CalendarHeader>

          <WeekDays>
            {weekDays.map(day => (
              <WeekDay key={day}>{day}</WeekDay>
            ))}
          </WeekDays>

          <DaysGrid>
            {getDaysInMonth(currentDate).map((dayInfo, index) => (
              <DayCell
                key={index}
                $isOtherMonth={dayInfo.isOtherMonth}
                $isSelected={isSelected(dayInfo.date)}
                $isToday={isToday(dayInfo.date)}
                $hasAppointments={hasAppointments(dayInfo)}
                onClick={() => setSelectedDate(dayInfo.date)}
              >
                {dayInfo.day}
                {hasAppointments(dayInfo) && (
                  <AppointmentDot $isSelected={isSelected(dayInfo.date)} />
                )}
              </DayCell>
            ))}
          </DaysGrid>
        </CalendarCard>

        {/* Estadísticas del día */}
        <StatsRow>
          <StatCard>
            <StatNumber>{stats.total}</StatNumber>
            <StatLabel>Total Citas</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber $color="#28A745">{stats.confirmadas}</StatNumber>
            <StatLabel>Confirmadas</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber $color="#FFC107">{stats.pendientes}</StatNumber>
            <StatLabel>Pendientes</StatLabel>
          </StatCard>
        </StatsRow>

        {/* Citas del día seleccionado */}
        <SectionCard>
          <SectionHeader>
            <SectionTitle>
              <Calendar />
              Citas - {formatSelectedDate()}
            </SectionTitle>
          </SectionHeader>

          {dayAppointments.length > 0 ? (
            <AppointmentsList>
              {dayAppointments.map((appointment) => (
                <AppointmentCard 
                  key={appointment.uuid}
                  $status={appointment.status}
                  onClick={() => navigate(`/detalle-cita/${appointment.uuid}`)}
                >
                  <AppointmentTime>
                    <TimeText>{appointment.time}</TimeText>
                  </AppointmentTime>
                  <AppointmentInfo>
                    <PatientName>{appointment.patient}</PatientName>
                    <AppointmentType>{appointment.type}</AppointmentType>
                  </AppointmentInfo>
                  <AppointmentStatus $status={appointment.status}>
                    {appointment.status}
                  </AppointmentStatus>
                </AppointmentCard>
              ))}
            </AppointmentsList>
          ) : (
            <EmptyState>
              <Calendar />
              <p>No hay citas para este día</p>
            </EmptyState>
          )}
        </SectionCard>

        {/* Horario de trabajo */}
        <SectionCard>
          <SectionHeader>
            <SectionTitle>
              <Clock />
              Horario de Trabajo
            </SectionTitle>
            <EditButton onClick={handleOpenEditSchedule}>
              <Settings size={14} />
              Editar
            </EditButton>
          </SectionHeader>

          <ScheduleGrid>
            {workSchedule.map((schedule, index) => (
              <ScheduleRow key={index} $active={schedule.active}>
                <DayName>{schedule.day}</DayName>
                <TimeRange $active={schedule.active}>
                  {schedule.active ? `${schedule.start} - ${schedule.end}` : 'No disponible'}
                </TimeRange>
                <StatusIndicator $active={schedule.active}>
                  {schedule.active ? <Check /> : <X />}
                </StatusIndicator>
              </ScheduleRow>
            ))}
          </ScheduleGrid>
        </SectionCard>
      </Content>

      {/* Modal Editar Horarios */}
      {showEditSchedule && (
        <ModalOverlay onClick={() => setShowEditSchedule(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Editar Horario de Trabajo</ModalTitle>
              <CloseButton onClick={() => setShowEditSchedule(false)}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              {editingSchedule.map((schedule, index) => (
                <ScheduleEditRow key={index}>
                  <ScheduleCheckbox>
                    <input
                      type="checkbox"
                      checked={schedule.active}
                      onChange={(e) => handleScheduleChange(index, 'active', e.target.checked)}
                    />
                    <span>{schedule.day}</span>
                  </ScheduleCheckbox>
                  <ScheduleTimeInputs $disabled={!schedule.active}>
                    <TimeInput
                      type="time"
                      value={schedule.start}
                      onChange={(e) => handleScheduleChange(index, 'start', e.target.value)}
                      disabled={!schedule.active}
                    />
                    <span>-</span>
                    <TimeInput
                      type="time"
                      value={schedule.end}
                      onChange={(e) => handleScheduleChange(index, 'end', e.target.value)}
                      disabled={!schedule.active}
                    />
                  </ScheduleTimeInputs>
                </ScheduleEditRow>
              ))}
            </ModalBody>
            <ModalFooter>
              <CancelButton onClick={() => setShowEditSchedule(false)}>
                Cancelar
              </CancelButton>
              <SaveButton onClick={handleSaveSchedule} disabled={saving}>
                {saving ? <Loader className="spin" size={16} /> : 'Guardar'}
              </SaveButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default GestionarAgenda;
