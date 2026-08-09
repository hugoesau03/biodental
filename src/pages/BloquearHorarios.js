import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Clock, 
  Calendar,
  X,
  Save,
  AlertCircle,
  Loader,
  User,
  CheckCircle,
  XCircle,
  Unlock,
  Lock
} from 'lucide-react';
import Header from '../components/Layout/Header';
import Modal from '../components/Modal';
import { usuariosService, horariosService } from '../services/api';

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
  padding: 6px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.3s ease;

  svg {
    width: 18px;
    height: 18px;
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
  background: ${({ $isSelected, $hasBlock, theme }) => 
    $isSelected ? theme.colors.primary : 
    $hasBlock ? theme.colors.danger :
    'transparent'};
  color: ${({ $isSelected, $hasBlock, $isOtherMonth, theme }) => 
    $isSelected ? theme.colors.white :
    $hasBlock ? theme.colors.dangerText :
    $isOtherMonth ? '#D0D0D0' :
    theme.colors.text};
  border-radius: 50%;
  font-size: 12px;
  font-weight: ${({ $isSelected, theme }) => 
    $isSelected ? theme.fontWeights.semibold : theme.fontWeights.normal};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${({ $isSelected, $hasBlock, theme }) => 
      $isSelected ? theme.colors.primaryDark : 
      $hasBlock ? theme.colors.danger :
      theme.colors.gray};
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
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const AddButton = styled.button`
  width: 100%;
  padding: 14px;
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
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.border};
    cursor: not-allowed;
  }
`;

const ButtonsRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`;

const UnblockButton = styled.button`
  flex: 1;
  padding: 14px;
  background: ${({ theme }) => theme.colors.success || '#22c55e'};
  color: white;
  border: none;
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
    opacity: 0.9;
  }
`;

const BlockButton = styled.button`
  flex: 1;
  padding: 14px;
  background: ${({ theme }) => theme.colors.danger};
  color: ${({ theme }) => theme.colors.dangerText};
  border: none;
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
    opacity: 0.9;
  }
`;

const BlockCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-left: 4px solid ${({ theme }) => theme.colors.danger};
`;

const BlockHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const BlockDate = styled.h4`
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const DeleteButton = styled.button`
  background: ${({ theme }) => theme.colors.danger};
  color: ${({ theme }) => theme.colors.dangerText};
  border: none;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    opacity: 0.9;
  }
`;

const BlockTime = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 6px;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const BlockReason = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  font-style: italic;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

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

// Modal
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
`;

const TimeRow = styled.div`
  display: flex;
  gap: 12px;
`;

const TimeInput = styled(Input)`
  flex: 1;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 14px 16px;
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
    box-shadow: 0 0 0 3px rgba(51, 169, 255, 0.1);
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  cursor: pointer;
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

// Modal de resultado (éxito/error)
const ResultModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 20px;
`;

const ResultModalContent = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 20px;
  width: 100%;
  max-width: 340px;
  padding: 32px 24px;
  text-align: center;
`;

const ResultIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  background: ${({ $success, theme }) => 
    $success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  
  svg {
    width: 32px;
    height: 32px;
    color: ${({ $success }) => $success ? '#22c55e' : '#ef4444'};
  }
`;

const ResultTitle = styled.h3`
  font-size: 18px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 8px 0;
`;

const ResultMessage = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 24px 0;
  line-height: 1.5;
`;

const ResultButton = styled.button`
  width: 100%;
  padding: 14px;
  background: ${({ $success, theme }) => $success ? theme.colors.primary : '#ef4444'};
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    opacity: 0.9;
  }
`;

const BloquearHorarios = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar doctor
  useEffect(() => {
    const fetchDoctor = async () => {
      setLoading(true);
      try {
        const response = await usuariosService.getOne(id);
        if (response.success) {
          setDoctor(response.data);
        }
      } catch (err) {
        console.error('Error cargando doctor:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchDoctor();
  }, [id]);

  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [blockedSchedules, setBlockedSchedules] = useState([]);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    date: '',
    startTime: '09:00',
    endTime: '18:00',
    allDay: false,
    reason: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState(null);

  // Estado para modal de resultado
  const [resultModal, setResultModal] = useState({
    show: false,
    success: false,
    title: '',
    message: ''
  });

  // Cargar bloqueos existentes
  useEffect(() => {
    const fetchBloqueos = async () => {
      if (!id) return;
      try {
        const response = await horariosService.getBloqueos(id);
        if (response.success && response.data.bloqueos) {
          const bloqueosFormateados = response.data.bloqueos.map(b => {
            // Parsear fechas como locales sin conversión UTC
            const fechaInicioStr = String(b.fecha_inicio).replace('T', ' ').replace('Z', '').substring(0, 19);
            const fechaFinStr = String(b.fecha_fin).replace('T', ' ').replace('Z', '').substring(0, 19);
            
            // Extraer partes de la fecha: "2024-12-18 09:00:00"
            const [dateStr, timeStrInicio] = fechaInicioStr.split(' ');
            const [, timeStrFin] = fechaFinStr.split(' ');
            
            let startTime = '00:00';
            let endTime = '23:59';
            
            // todo_el_dia puede venir como 0/1 o true/false
            const todoElDia = b.todo_el_dia === 1 || b.todo_el_dia === true;
            
            if (!todoElDia && timeStrInicio && timeStrFin) {
              startTime = timeStrInicio.substring(0, 5); // HH:MM
              endTime = timeStrFin.substring(0, 5); // HH:MM
            }
            
            return {
              id: b.id,
              date: dateStr,
              startTime,
              endTime,
              allDay: todoElDia,
              reason: b.motivo || ''
            };
          });
          setBlockedSchedules(bloqueosFormateados);
        }
      } catch (err) {
        console.error('Error cargando bloqueos:', err);
      }
    };
    fetchBloqueos();
  }, [id]);

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days = [];

    // Días del mes anterior
    const prevMonth = new Date(year, month, 0);
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonth.getDate() - i,
        isOtherMonth: true,
        date: null
      });
    }

    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        day: i,
        isOtherMonth: false,
        date: dateStr
      });
    }

    // Días del mes siguiente
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isOtherMonth: true,
        date: null
      });
    }

    return days;
  };

  const hasBlock = (dateStr) => {
    return blockedSchedules.some(block => block.date === dateStr);
  };

  const getBlockForDate = (dateStr) => {
    return blockedSchedules.find(block => block.date === dateStr);
  };

  const selectedDateHasBlock = selectedDate ? hasBlock(selectedDate) : false;
  const selectedDateBlock = selectedDate ? getBlockForDate(selectedDate) : null;

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDayClick = (dayObj) => {
    if (!dayObj.isOtherMonth && dayObj.date) {
      setSelectedDate(dayObj.date);
    }
  };

  const handleOpenModal = () => {
    if (selectedDate) {
      setFormData({
        date: selectedDate,
        startTime: '09:00',
        endTime: '18:00',
        allDay: false,
        reason: ''
      });
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    if (!formData.date) return;

    setSaving(true);
    try {
      // Crear fecha/hora de inicio y fin (sin T para evitar conversión UTC)
      const fechaInicio = formData.allDay 
        ? `${formData.date} 00:00:00` 
        : `${formData.date} ${formData.startTime}:00`;
      const fechaFin = formData.allDay 
        ? `${formData.date} 23:59:59` 
        : `${formData.date} ${formData.endTime}:00`;

      const response = await horariosService.createBloqueo(id, {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        motivo: formData.reason || null,
        todo_el_dia: formData.allDay
      });

      if (response.success) {
        const newBlock = {
          id: response.data.id,
          date: formData.date,
          startTime: formData.allDay ? '00:00' : formData.startTime,
          endTime: formData.allDay ? '23:59' : formData.endTime,
          allDay: formData.allDay,
          reason: formData.reason
        };

        setBlockedSchedules(prev => [...prev, newBlock]);
        handleCloseModal();
        setSelectedDate(null);
        
        // Mostrar modal de éxito
        setResultModal({
          show: true,
          success: true,
          title: '¡Horario bloqueado!',
          message: formData.allDay 
            ? `El día ${formatDate(formData.date)} ha sido bloqueado completamente.`
            : `Se bloqueó el horario de ${formData.startTime} a ${formData.endTime} el ${formatDate(formData.date)}.`
        });
      } else {
        handleCloseModal();
        setResultModal({
          show: true,
          success: false,
          title: 'Error al bloquear',
          message: response.message || 'No se pudo guardar el bloqueo. Por favor intenta de nuevo.'
        });
      }
    } catch (err) {
      console.error('Error guardando bloqueo:', err);
      handleCloseModal();
      setResultModal({
        show: true,
        success: false,
        title: 'Error al bloquear',
        message: 'Ocurrió un error al guardar el bloqueo. Verifica tu conexión e intenta de nuevo.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (blockId) => {
    setBlockToDelete(blockId);
    setShowDeleteModal(true);
  };

  const handleUnblockSelectedDate = () => {
    if (selectedDateBlock) {
      setBlockToDelete(selectedDateBlock.id);
      setShowDeleteModal(true);
    }
  };

  const confirmDeleteBlock = async () => {
    if (blockToDelete) {
      try {
        const response = await horariosService.deleteBloqueo(blockToDelete);
        if (response.success) {
          setBlockedSchedules(prev => prev.filter(b => b.id !== blockToDelete));
          setResultModal({
            show: true,
            success: true,
            title: 'Bloqueo eliminado',
            message: 'El bloqueo de horario ha sido eliminado correctamente.'
          });
        } else {
          setResultModal({
            show: true,
            success: false,
            title: 'Error al eliminar',
            message: 'No se pudo eliminar el bloqueo. Por favor intenta de nuevo.'
          });
        }
      } catch (err) {
        console.error('Error eliminando bloqueo:', err);
        setResultModal({
          show: true,
          success: false,
          title: 'Error al eliminar',
          message: 'Ocurrió un error al eliminar el bloqueo. Verifica tu conexión e intenta de nuevo.'
        });
      }
    }
    setShowDeleteModal(false);
    setBlockToDelete(null);
  };

  const closeResultModal = () => {
    setResultModal({ show: false, success: false, title: '', message: '' });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  };

  const days = getDaysInMonth(currentMonth);

  if (loading) {
    return (
      <PageContainer>
        <Header title="Bloquear Horarios" showBack />
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
      <Header title="Bloquear Horarios" showBack />

      <Content>
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

        <CalendarCard>
          <CalendarHeader>
            <MonthYear>{months[currentMonth.getMonth()]} {currentMonth.getFullYear()}</MonthYear>
            <NavButtons>
              <NavButton onClick={handlePrevMonth}>
                <ChevronLeft />
              </NavButton>
              <NavButton onClick={handleNextMonth}>
                <ChevronRight />
              </NavButton>
            </NavButtons>
          </CalendarHeader>

          <WeekDays>
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
              <WeekDay key={day}>{day}</WeekDay>
            ))}
          </WeekDays>

          <DaysGrid>
            {days.map((dayObj, index) => (
              <DayCell
                key={index}
                $isSelected={dayObj.date === selectedDate}
                $hasBlock={dayObj.date && hasBlock(dayObj.date)}
                $isOtherMonth={dayObj.isOtherMonth}
                onClick={() => handleDayClick(dayObj)}
                disabled={dayObj.isOtherMonth}
              >
                {dayObj.day}
              </DayCell>
            ))}
          </DaysGrid>
        </CalendarCard>

        {selectedDate && selectedDateHasBlock && (
          <ButtonsRow>
            <UnblockButton onClick={handleUnblockSelectedDate}>
              <Unlock />
              Desbloquear
            </UnblockButton>
            <BlockButton onClick={handleOpenModal}>
              <Lock />
              Agregar bloqueo
            </BlockButton>
          </ButtonsRow>
        )}

        {selectedDate && !selectedDateHasBlock && (
          <AddButton onClick={handleOpenModal}>
            <Plus />
            Bloquear {formatDate(selectedDate)}
          </AddButton>
        )}

        {!selectedDate && (
          <AddButton disabled>
            <Plus />
            Selecciona una fecha
          </AddButton>
        )}

        <SectionTitle>
          <Calendar />
          {selectedDate ? `Bloqueos del ${formatDate(selectedDate)}` : 'Todos los Horarios Bloqueados'}
        </SectionTitle>

        {(() => {
          // Filtrar bloqueos según fecha seleccionada
          const filteredBlocks = selectedDate 
            ? blockedSchedules.filter(block => block.date === selectedDate)
            : blockedSchedules;
          
          return filteredBlocks.length > 0 ? (
            filteredBlocks
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map(block => (
                <BlockCard key={block.id}>
                  <BlockHeader>
                    <BlockDate>{formatDate(block.date)}</BlockDate>
                    <DeleteButton onClick={() => handleDelete(block.id)}>
                      <Trash2 />
                    </DeleteButton>
                  </BlockHeader>
                  <BlockTime>
                    <Clock />
                    {block.allDay ? 'Todo el día' : `${block.startTime} - ${block.endTime}`}
                  </BlockTime>
                  {block.reason && <BlockReason>"{block.reason}"</BlockReason>}
                </BlockCard>
              ))
          ) : (
            <EmptyState>
              <AlertCircle />
              <p>{selectedDate ? 'No hay bloqueos en esta fecha' : 'No hay horarios bloqueados'}</p>
            </EmptyState>
          );
        })()}
      </Content>

      {/* Modal para agregar bloqueo */}
      {showModal && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Nuevo Bloqueo</ModalTitle>
              <CloseButton onClick={handleCloseModal}>
                <X size={24} />
              </CloseButton>
            </ModalHeader>

            <ModalBody>
              <FormGroup>
                <Label>
                  <Calendar />
                  Fecha
                </Label>
                <Input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                />
              </FormGroup>

              <FormGroup>
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    name="allDay"
                    checked={formData.allDay}
                    onChange={handleInputChange}
                  />
                  Bloquear todo el día
                </CheckboxLabel>
              </FormGroup>

              {!formData.allDay && (
                <FormGroup>
                  <Label>
                    <Clock />
                    Horario
                  </Label>
                  <TimeRow>
                    <TimeInput
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                    />
                    <TimeInput
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                    />
                  </TimeRow>
                </FormGroup>
              )}

              <FormGroup>
                <Label>Motivo (opcional)</Label>
                <TextArea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  placeholder="Ej: Vacaciones, reunión, etc."
                />
              </FormGroup>
            </ModalBody>

            <ModalFooter>
              <CancelButton onClick={handleCloseModal} disabled={saving}>
                Cancelar
              </CancelButton>
              <SaveButton onClick={handleSave} disabled={saving}>
                {saving ? <Loader className="spin" size={18} /> : <Save />}
                {saving ? 'Guardando...' : 'Guardar'}
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
        title="Eliminar Bloqueo"
        message="¿Estás seguro de eliminar este bloqueo de horario? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDeleteBlock}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Modal de resultado (éxito/error) */}
      {resultModal.show && (
        <ResultModalOverlay onClick={closeResultModal}>
          <ResultModalContent onClick={e => e.stopPropagation()}>
            <ResultIcon $success={resultModal.success}>
              {resultModal.success ? <CheckCircle /> : <XCircle />}
            </ResultIcon>
            <ResultTitle>{resultModal.title}</ResultTitle>
            <ResultMessage>{resultModal.message}</ResultMessage>
            <ResultButton $success={resultModal.success} onClick={closeResultModal}>
              Aceptar
            </ResultButton>
          </ResultModalContent>
        </ResultModalOverlay>
      )}
    </PageContainer>
  );
};

export default BloquearHorarios;
