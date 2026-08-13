import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Search, Loader, DoorOpen, UserCheck } from 'lucide-react';
import Header from '../components/Layout/Header';
import FloatingButton from '../components/Layout/FloatingButton';
import { citasService, usuariosService, consultoriosInternosService, horariosService } from '../services/api';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding-bottom: 80px;
  overflow-y: auto;
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

const Content = styled.div`
  padding: 0;
`;

const CalendarSection = styled.div`
  background: ${({ theme }) => theme.colors.white};
  padding: 20px 20px 24px;

  @media (min-width: 1024px) {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
`;

const ContentWrapper = styled.div`
  @media (min-width: 1024px) {
    padding: 20px;
  }
`;

const TopSection = styled.div`
  @media (min-width: 1024px) {
    display: flex;
    gap: 24px;
    margin-bottom: 24px;
  }
`;

const CalendarColumn = styled.div`
  @media (min-width: 1024px) {
    flex-shrink: 0;
    width: 350px;
  }
`;

const FiltersColumn = styled.div`
  @media (min-width: 1024px) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
    justify-content: center;
    background: ${({ theme }) => theme.colors.white};
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    padding: 16px;
  }
`;

const BottomSection = styled.div`
  @media (min-width: 1024px) {
    width: 100%;
    display: flex;
    gap: 24px;
  }
`;

const HorariosSection = styled.div`
  background: ${({ theme }) => theme.colors.white};
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;

  @media (min-width: 1024px) {
    flex-shrink: 0;
    width: 280px;
    margin-bottom: 0;
  }
`;

const HorariosTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const HorariosGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
  padding: 4px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.gray};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const HorarioSlot = styled.button`
  padding: 8px 12px;
  border: 1px solid ${({ $disponible, theme }) => 
    $disponible ? theme.colors.success : theme.colors.border};
  background: ${({ $disponible, theme }) => 
    $disponible ? `${theme.colors.success}15` : theme.colors.gray};
  color: ${({ $disponible, theme }) => 
    $disponible ? theme.colors.success : theme.colors.textSecondary};
  border-radius: 8px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: ${({ $disponible }) => $disponible ? 'pointer' : 'not-allowed'};
  transition: all 0.3s ease;
  opacity: ${({ $disponible }) => $disponible ? '1' : '0.5'};

  &:hover {
    transform: ${({ $disponible }) => $disponible ? 'translateY(-2px)' : 'none'};
    box-shadow: ${({ $disponible, theme }) => 
      $disponible ? `0 2px 8px ${theme.colors.success}40` : 'none'};
  }
`;

const HorariosEmpty = styled.div`
  text-align: center;
  padding: 32px 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  svg {
    width: 48px;
    height: 48px;
    margin-bottom: 12px;
    opacity: 0.5;
  }
`;

const HorariosInfo = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 12px;
  padding: 8px;
  background: ${({ theme }) => theme.colors.gray};
  border-radius: 6px;
  text-align: center;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const MonthYear = styled.h2`
  font-size: 17px;
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
  border-radius: ${({ theme }) => theme.borderRadius.sm};
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
  gap: 8px;
  margin-bottom: 12px;
`;

const WeekDay = styled.div`
  text-align: center;
  font-size: 13px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: 8px 0;
`;

const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  justify-items: center;
  
  @media (min-width: 1024px) {
    gap: 6px;
  }
`;

const DayCell = styled.button`
  width: clamp(32px, 10vw, 44px);
  height: clamp(32px, 10vw, 44px);
  border: none;
  background: ${({ $isToday, $isSelected, theme }) => 
    $isSelected ? theme.colors.primary : 
    $isToday ? theme.colors.info : 
    'transparent'};
  color: ${({ $isToday, $isSelected, $isOtherMonth, theme }) => 
    $isSelected ? theme.colors.white :
    $isOtherMonth ? '#D0D0D0' :
    $isToday ? theme.colors.primary :
    theme.colors.text};
  border-radius: 50%;
  font-size: clamp(13px, 3vw, 15px);
  font-weight: ${({ $isSelected, theme }) => 
    $isSelected ? theme.fontWeights.semibold : theme.fontWeights.normal};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  
  @media (min-width: 1024px) {
    width: 38px;
    height: 38px;
  }

  &:hover {
    background: ${({ $isSelected, theme }) => 
      $isSelected ? theme.colors.primaryDark : theme.colors.gray};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.3;
  }

  /* Indicador de citas */
  &::after {
    content: '';
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: ${({ $hasCitas, $isSelected, theme }) => 
      $hasCitas ? ($isSelected ? theme.colors.white : theme.colors.success) : 'transparent'};
    
    @media (min-width: 1024px) {
      bottom: 3px;
      width: 4px;
      height: 4px;
    }
  }
`;

const ViewTabs = styled.div`
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  background: ${({ theme }) => theme.colors.white};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  overflow-x: auto;
  align-items: center;

  @media (min-width: 1024px) {
    justify-content: flex-start;
    padding: 0 0 16px 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }

  &::-webkit-scrollbar {
    height: 4px;
  }
`;

const ViewLabel = styled.span`
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-right: 8px;
`;

const ViewToggle = styled.div`
  display: flex;
  background: #F0F0F0;
  border-radius: 10px;
  padding: 4px;
`;

const ViewToggleButton = styled.button`
  background: ${({ $active, theme }) => 
    $active ? theme.colors.white : 'transparent'};
  color: ${({ $active, theme }) => 
    $active ? theme.colors.primary : theme.colors.textSecondary};
  border: none;
  border-radius: 8px;
  padding: 8px 20px;
  font-size: 14px;
  font-weight: ${({ $active }) => $active ? '600' : '500'};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  box-shadow: ${({ $active }) => $active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const ShowAllCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  cursor: pointer;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  user-select: none;

  input {
    width: 18px;
    height: 18px;
    accent-color: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const ViewToggleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  flex-wrap: wrap;

  @media (max-width: 1023px) {
    padding: 12px 20px;
    margin-bottom: 0;
    background: ${({ theme }) => theme.colors.white};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    justify-content: space-between;
  }
`;

const ViewToggleLabel = styled.span`
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ToggleContainer = styled.div`
  display: flex;
  background: #F0F0F0;
  border-radius: 10px;
  padding: 4px;
`;

const ToggleOption = styled.button`
  background: ${({ $active, theme }) => 
    $active ? theme.colors.white : 'transparent'};
  color: ${({ $active, theme }) => 
    $active ? theme.colors.primary : theme.colors.textSecondary};
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: ${({ $active }) => $active ? '600' : '500'};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  box-shadow: ${({ $active }) => $active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }

  @media (max-width: 480px) {
    padding: 6px 12px;
    font-size: 12px;
  }
`;

const Tab = styled.button`
  background: ${({ $active, theme }) => 
    $active ? theme.colors.primary : '#F0F0F0'};
  color: ${({ $active, theme }) => 
    $active ? theme.colors.white : theme.colors.text};
  border: none;
  border-radius: 20px;
  padding: 10px 28px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ $active, theme }) => 
      $active ? theme.colors.primaryDark : '#E0E0E0'};
  }
`;

const FilterTabsWrapper = styled.div`
  position: relative;
  background: ${({ theme }) => theme.colors.white};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  @media (min-width: 1024px) {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-radius: 0;
    margin: 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
  }
`;

const FilterLabel = styled.span`
  display: none;
  
  @media (min-width: 1024px) {
    display: block;
    font-size: 13px;
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    color: ${({ theme }) => theme.colors.textSecondary};
    min-width: 80px;
    flex-shrink: 0;
  }
`;

const FilterScrollButton = styled.button`
  display: none;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.border};
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
  z-index: 2;

  svg {
    width: 16px;
    height: 16px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
    border-color: ${({ theme }) => theme.colors.primary};

    svg {
      color: ${({ theme }) => theme.colors.primary};
    }
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  @media (min-width: 1024px) {
    display: flex;
  }
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  background: ${({ theme }) => theme.colors.white};
  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 4px;
  }

  @media (min-width: 1024px) {
    flex: 1;
    overflow-x: auto;
    padding: 0 8px;
    padding-right: 16px;
    scroll-behavior: smooth;
  }
`;

const FilterTab = styled.button`
  background: ${({ $active, theme }) => 
    $active ? theme.colors.text : 'transparent'};
  color: ${({ $active, theme }) => 
    $active ? theme.colors.white : theme.colors.textSecondary};
  border: none;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s ease;
  border-radius: 8px;

  &:hover {
    background: ${({ $active, theme }) => 
      $active ? theme.colors.text : '#F0F0F0'};
  }
`;

const AppointmentsList = styled.div`
  padding: 20px;
  
  @media (min-width: 1024px) {
    flex: 1;
    min-width: 0;
  }
`;

const ListHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const ListTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const CitasCount = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  background: ${({ theme }) => theme.colors.white};
  border-radius: 12px;

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

const AppointmentCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 12px;
  padding: 18px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    transform: translateX(2px);
  }
`;

const AppointmentTime = styled.div`
  font-size: 18px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 10px;
`;

const AppointmentPatient = styled.div`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 4px;
`;

const AppointmentType = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 10px;
`;

const AppointmentFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const DoctorInfo = styled.div`
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

const ConsultorioInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: white;
  background: ${({ $color }) => $color || '#6366F1'};
  padding: 3px 8px;
  border-radius: 4px;
  margin-left: 8px;

  svg {
    width: 12px;
    height: 12px;
  }
`;

const StatusBadge = styled.span`
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
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
`;

const CheckinBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  background: #E8F5E9;
  color: #2E7D32;

  svg {
    width: 12px;
    height: 12px;
  }
`;

const CheckinButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;

  svg {
    width: 12px;
    height: 12px;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// Función para formatear el estado para mostrar
const formatEstado = (estado) => {
  const estados = {
    'programada': 'Programada',
    'confirmada': 'Confirmada',
    'en_progreso': 'En Progreso',
    'completada': 'Completada',
    'cancelada': 'Cancelada',
    'no_asistio': 'No Asistió',
    'reprogramada': 'Reprogramada',
    'pendiente_pago': 'Pendiente de Pago'
  };
  return estados[estado] || estado;
};

// Formatear fecha para mostrar en la tarjeta
const formatFechaCita = (fechaStr) => {
  if (!fechaStr) return '';
  const fecha = new Date(fechaStr + 'T12:00:00');
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${dias[fecha.getDay()]} ${fecha.getDate()} ${meses[fecha.getMonth()]}`;
};

const Agenda = () => {
  const navigate = useNavigate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [appointments, setAppointments] = useState([]);
  const [allMonthCitas, setAllMonthCitas] = useState([]); // Citas de todo el mes para indicadores
  const [doctors, setDoctors] = useState([]);
  const [consultorios, setConsultorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('Mes');
  const [showAllMonth, setShowAllMonth] = useState(false);
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
  const [selectedConsultorioFilter, setSelectedConsultorioFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [checkinLoadingUuid, setCheckinLoadingUuid] = useState(null);
  const searchInputRef = useRef(null);
  const doctorFilterRef = useRef(null);
  const statusFilterRef = useRef(null);
  const consultorioFilterRef = useRef(null);

  // Cargar doctores
  useEffect(() => {
    const fetchDoctores = async () => {
      try {
        const response = await usuariosService.getDoctores();
        if (response.success) {
          setDoctors(response.data.doctores);
        }
      } catch (err) {
        console.error('Error cargando doctores:', err);
      }
    };
    fetchDoctores();
  }, []);

  // Cargar consultorios internos
  useEffect(() => {
    const fetchConsultorios = async () => {
      try {
        const response = await consultoriosInternosService.getAll();
        if (response.success) {
          setConsultorios(response.data.consultorios || []);
        }
      } catch (err) {
        console.error('Error cargando consultorios:', err);
      }
    };
    fetchConsultorios();
  }, []);

  // Cargar citas del día seleccionado
  const fetchCitas = useCallback(async () => {
    setLoading(true);
    try {
      const fechaStr = getSelectedDateString();
      const response = await citasService.getByFecha(fechaStr);
      if (response.success) {
        setAppointments(response.data.citas);
      }
    } catch (err) {
      console.error('Error cargando citas:', err);
    } finally {
      setLoading(false);
    }
  }, [currentDate, selectedDate]);

  // Cargar todas las citas del mes para los indicadores del calendario
  const fetchCitasMes = useCallback(async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // getMonth() es 0-indexed
      const response = await citasService.getByMes(year, month);
      if (response.success) {
        setAllMonthCitas(response.data.citas || []);
      }
    } catch (err) {
      console.error('Error cargando citas del mes:', err);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchCitas();
  }, [fetchCitas]);

  useEffect(() => {
    fetchCitasMes();
  }, [fetchCitasMes]);

  // Cargar horarios disponibles cuando cambia el doctor seleccionado o la fecha
  const fetchHorariosDisponibles = useCallback(async () => {
    if (!selectedDoctorFilter) {
      setHorariosDisponibles([]);
      return;
    }

    const doctor = doctors.find(d => `${d.nombre} ${d.apellidos}` === selectedDoctorFilter);
    if (!doctor) {
      setHorariosDisponibles([]);
      return;
    }

    setLoadingHorarios(true);
    try {
      const fechaStr = getSelectedDateString();
      const response = await horariosService.getDisponibilidad(doctor.uuid, fechaStr);
      if (response.success) {
        setHorariosDisponibles(response.data.slots || []);
      }
    } catch (err) {
      console.error('Error cargando horarios disponibles:', err);
      setHorariosDisponibles([]);
    } finally {
      setLoadingHorarios(false);
    }
  }, [selectedDoctorFilter, doctors, currentDate, selectedDate]);

  useEffect(() => {
    fetchHorariosDisponibles();
  }, [fetchHorariosDisponibles]);

  // Obtener nombres de doctores para filtros
  const doctorNames = doctors.map(d => `${d.nombre} ${d.apellidos}`);

  // Cuando cambie a vista semana, actualizar currentDate al día seleccionado
  useEffect(() => {
    if (selectedView === 'Semana') {
      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate);
      setCurrentDate(newDate);
    }
  }, [selectedView]);

  const toggleSearch = () => {
    setShowSearch(prev => !prev);
  };

  // Check-in de recepción: marca/desmarca la llegada del paciente, el mismo
  // campo que el paciente puede marcar desde su portal.
  const handleToggleCheckin = async (e, appointment) => {
    e.stopPropagation();
    if (checkinLoadingUuid) return;

    setCheckinLoadingUuid(appointment.uuid);
    try {
      const response = await citasService.checkin(appointment.uuid);
      if (response.success) {
        const nuevoCheckin = response.data.checkin_at;
        setAppointments(prev => prev.map(apt =>
          apt.uuid === appointment.uuid ? { ...apt, checkin_at: nuevoCheckin } : apt
        ));
      }
    } catch (err) {
      console.error('Error al registrar check-in:', err);
    } finally {
      setCheckinLoadingUuid(null);
    }
  };

  const scrollFilters = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = 150;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Obtener la fecha seleccionada en formato YYYY-MM-DD
  const getSelectedDateString = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = selectedDate;
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Verificar si un día tiene citas (usando todas las citas del mes)
  const dayHasCitas = (dayObj) => {
    if (!dayObj.fullDate || !allMonthCitas.length) return false;
    
    const year = dayObj.fullDate.getFullYear();
    const month = String(dayObj.fullDate.getMonth() + 1).padStart(2, '0');
    const day = String(dayObj.fullDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return allMonthCitas.some(apt => {
      const aptDate = apt.fecha ? apt.fecha.split('T')[0] : '';
      return aptDate === dateStr;
    });
  };

  // Filtrar citas según los filtros seleccionados
  // Si "mostrar todas" está activo o hay búsqueda activa, usar todas las citas del mes
  const citasAFiltrar = (showAllMonth || searchQuery) ? allMonthCitas : appointments;
  
  const filteredAppointments = citasAFiltrar.filter(apt => {
    const doctorName = `${apt.doctor_nombre} ${apt.doctor_apellidos}`;
    const patientName = `${apt.paciente_nombre} ${apt.paciente_apellidos}`;
    const matchDoctor = !selectedDoctorFilter || doctorName === selectedDoctorFilter;
    const matchStatus = !selectedStatusFilter || apt.estado === selectedStatusFilter;
    const matchConsultorio = !selectedConsultorioFilter || apt.consultorio_interno_uuid === selectedConsultorioFilter;
    const matchSearch = !searchQuery || 
      patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (apt.tipo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (apt.motivo || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchDoctor && matchStatus && matchConsultorio && matchSearch;
  });

  // Navegar al mes/semana anterior
  const goToPrevious = () => {
    if (selectedView === 'Mes') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
      setSelectedDate(1);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
      setSelectedDate(newDate.getDate());
    }
  };

  // Navegar al mes/semana siguiente
  const goToNext = () => {
    if (selectedView === 'Mes') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
      setSelectedDate(1);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
      setSelectedDate(newDate.getDate());
    }
  };

  // Obtener nombre del mes
  const getMonthName = (date) => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[date.getMonth()];
  };

  // Obtener texto del encabezado según la vista
  const getHeaderText = () => {
    if (selectedView === 'Mes') {
      return `${getMonthName(currentDate)} ${currentDate.getFullYear()}`;
    } else {
      // Para vista de semana, mostrar rango de fechas
      const startOfWeek = getStartOfWeek(currentDate);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      
      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${getMonthName(startOfWeek)} ${startOfWeek.getFullYear()}`;
      } else {
        return `${startOfWeek.getDate()} ${getMonthName(startOfWeek)} - ${endOfWeek.getDate()} ${getMonthName(endOfWeek)} ${endOfWeek.getFullYear()}`;
      }
    }
  };

  // Obtener el primer día de la semana (lunes)
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar cuando el día es domingo
    return new Date(d.setDate(diff));
  };

  const generateCalendarDays = () => {
    const days = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    if (selectedView === 'Semana') {
      // Vista de semana: solo 7 días
      const startOfWeek = getStartOfWeek(currentDate);
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        days.push({ 
          day: dayDate.getDate(), 
          isOtherMonth: dayDate.getMonth() !== month,
          fullDate: dayDate
        });
      }
    } else {
      // Vista de mes
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      const daysInMonth = lastDayOfMonth.getDate();
      
      // Día de la semana del primer día (0 = domingo, 1 = lunes, etc.)
      let firstDayOfWeek = firstDayOfMonth.getDay();
      // Ajustar para que la semana empiece en lunes
      firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
      
      // Días del mes anterior
      const prevMonth = new Date(year, month, 0);
      const daysInPrevMonth = prevMonth.getDate();
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        days.push({ 
          day: daysInPrevMonth - i, 
          isOtherMonth: true,
          fullDate: new Date(year, month - 1, daysInPrevMonth - i)
        });
      }
      
      // Días del mes actual
      for (let i = 1; i <= daysInMonth; i++) {
        days.push({ 
          day: i, 
          isOtherMonth: false,
          fullDate: new Date(year, month, i)
        });
      }
      
      // Días del mes siguiente para completar la grilla
      const remainingDays = 42 - days.length; // 6 semanas x 7 días
      for (let i = 1; i <= remainingDays; i++) {
        days.push({ 
          day: i, 
          isOtherMonth: true,
          fullDate: new Date(year, month + 1, i)
        });
      }
    }

    return days;
  };

  // Verificar si un día es hoy
  const isToday = (dayObj) => {
    const today = new Date();
    return dayObj.fullDate && 
           dayObj.fullDate.getDate() === today.getDate() &&
           dayObj.fullDate.getMonth() === today.getMonth() &&
           dayObj.fullDate.getFullYear() === today.getFullYear();
  };

  // Verificar si un día está seleccionado
  const isSelected = (dayObj) => {
    // Si "mostrar todas" está activo, no hay día seleccionado
    if (showAllMonth) return false;
    return dayObj.day === selectedDate && !dayObj.isOtherMonth;
  };

  // Obtener el título de la lista de citas
  const getListTitle = () => {
    if (searchQuery) {
      return `Resultados de búsqueda`;
    }
    if (showAllMonth) {
      return `Citas de ${getMonthName(currentDate)}`;
    }
    // Vista Mes o Semana - mostrar el día seleccionado
    const fechaSeleccionada = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${dias[fechaSeleccionada.getDay()]} ${selectedDate} de ${meses[fechaSeleccionada.getMonth()]}`;
  };

  return (
    <PageContainer>
      <Header title="Agenda"  showSearch onSearchClick={toggleSearch} />
      
      <SearchSection $isVisible={showSearch}>
        <SearchBar>
          <Search />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar citas por paciente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchBar>
      </SearchSection>

      <Content>
        <ContentWrapper>
          <TopSection>
            <CalendarColumn>
              <CalendarSection>
                <CalendarHeader>
                  <MonthYear>{getHeaderText()}</MonthYear>
                  <NavButtons>
                    <NavButton onClick={goToPrevious}>
                      <ChevronLeft />
                    </NavButton>
                    <NavButton onClick={goToNext}>
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
                  {generateCalendarDays().map((dayObj, index) => (
                    <DayCell
                      key={index}
                      $isToday={isToday(dayObj)}
                      $isSelected={isSelected(dayObj)}
                      $isOtherMonth={dayObj.isOtherMonth}
                      $hasCitas={dayHasCitas(dayObj)}
                      onClick={() => {
                        if (!dayObj.isOtherMonth) {
                          setSelectedDate(dayObj.day);
                          // Si "mostrar todas" está activo, desactivarlo al seleccionar un día
                          if (showAllMonth) {
                            setShowAllMonth(false);
                          }
                        }
                      }}
                    >
                      {dayObj.day}
                    </DayCell>
                  ))}
                </DaysGrid>
              </CalendarSection>
            </CalendarColumn>

            <FiltersColumn>
              <ViewToggleWrapper>
                <ViewToggleLabel>Vista:</ViewToggleLabel>
                <ToggleContainer>
                  {['Mes', 'Semana'].map((view) => (
                    <ToggleOption
                      key={view}
                      $active={selectedView === view}
                      onClick={() => setSelectedView(view)}
                    >
                      {view}
                    </ToggleOption>
                  ))}
                </ToggleContainer>
              </ViewToggleWrapper>

              <FilterTabsWrapper>
                <FilterLabel>Médico:</FilterLabel>
                <FilterScrollButton onClick={() => scrollFilters(doctorFilterRef, 'left')}>
                  <ChevronLeft />
                </FilterScrollButton>
                <FilterTabs ref={doctorFilterRef}>
                  <FilterTab
                    $active={!selectedDoctorFilter}
                    onClick={() => setSelectedDoctorFilter('')}
                  >
                    Todos los Médicos
                  </FilterTab>
                  {doctorNames.map((doctor) => (
                    <FilterTab
                      key={doctor}
                      $active={selectedDoctorFilter === doctor}
                      onClick={() => setSelectedDoctorFilter(doctor)}
                    >
                      {doctor}
                    </FilterTab>
                  ))}
                </FilterTabs>
                <FilterScrollButton onClick={() => scrollFilters(doctorFilterRef, 'right')}>
                  <ChevronRight />
                </FilterScrollButton>
              </FilterTabsWrapper>

              <FilterTabsWrapper>
                <FilterLabel>Estado:</FilterLabel>
                <FilterScrollButton onClick={() => scrollFilters(statusFilterRef, 'left')}>
                  <ChevronLeft />
                </FilterScrollButton>
                <FilterTabs ref={statusFilterRef}>
                  <FilterTab
                    $active={!selectedStatusFilter}
                    onClick={() => setSelectedStatusFilter('')}
                  >
                    Todos
                  </FilterTab>
                  <FilterTab
                    $active={selectedStatusFilter === 'programada'}
                    onClick={() => setSelectedStatusFilter('programada')}
                  >
                    Programadas
                  </FilterTab>
                  <FilterTab
                    $active={selectedStatusFilter === 'confirmada'}
                    onClick={() => setSelectedStatusFilter('confirmada')}
                  >
                    Confirmadas
                  </FilterTab>
                  <FilterTab
                    $active={selectedStatusFilter === 'en_progreso'}
                    onClick={() => setSelectedStatusFilter('en_progreso')}
                  >
                    En Progreso
                  </FilterTab>
                  <FilterTab
                    $active={selectedStatusFilter === 'completada'}
                    onClick={() => setSelectedStatusFilter('completada')}
                  >
                    Completadas
                  </FilterTab>
                  <FilterTab
                    $active={selectedStatusFilter === 'reprogramada'}
                    onClick={() => setSelectedStatusFilter('reprogramada')}
                  >
                    Reprogramadas
                  </FilterTab>
                  <FilterTab
                    $active={selectedStatusFilter === 'cancelada'}
                    onClick={() => setSelectedStatusFilter('cancelada')}
                  >
                    Canceladas
                  </FilterTab>
                  <FilterTab
                    $active={selectedStatusFilter === 'no_asistio'}
                    onClick={() => setSelectedStatusFilter('no_asistio')}
                  >
                    No Asistió
                  </FilterTab>
                  <FilterTab
                    $active={selectedStatusFilter === 'pendiente_pago'}
                    onClick={() => setSelectedStatusFilter('pendiente_pago')}
                  >
                    Pendiente Pago
                  </FilterTab>
                </FilterTabs>
                <FilterScrollButton onClick={() => scrollFilters(statusFilterRef, 'right')}>
                  <ChevronRight />
                </FilterScrollButton>
              </FilterTabsWrapper>

              {consultorios.length > 0 && (
                <FilterTabsWrapper>
                  <FilterLabel>Consultorio:</FilterLabel>
                  <FilterScrollButton onClick={() => scrollFilters(consultorioFilterRef, 'left')}>
                    <ChevronLeft />
                  </FilterScrollButton>
                  <FilterTabs ref={consultorioFilterRef}>
                    <FilterTab
                      $active={!selectedConsultorioFilter}
                      onClick={() => setSelectedConsultorioFilter('')}
                    >
                      Todos
                    </FilterTab>
                    {consultorios.map((consultorio) => (
                      <FilterTab
                        key={consultorio.uuid}
                        $active={selectedConsultorioFilter === consultorio.uuid}
                        onClick={() => setSelectedConsultorioFilter(consultorio.uuid)}
                      >
                        {consultorio.nombre}
                      </FilterTab>
                    ))}
                  </FilterTabs>
                  <FilterScrollButton onClick={() => scrollFilters(consultorioFilterRef, 'right')}>
                    <ChevronRight />
                  </FilterScrollButton>
                </FilterTabsWrapper>
              )}
            </FiltersColumn>
          </TopSection>

          <BottomSection>
            {selectedDoctorFilter && !showAllMonth && (
              <HorariosSection>
                <HorariosTitle>
                  <CalendarIcon size={20} />
                  Horarios Disponibles
                </HorariosTitle>
                <HorariosInfo>
                  {selectedDoctorFilter} • {formatFechaCita(getSelectedDateString())}
                </HorariosInfo>
                {loadingHorarios ? (
                  <HorariosEmpty>
                    <Loader style={{ animation: 'spin 1s linear infinite' }} />
                    <p>Cargando horarios...</p>
                  </HorariosEmpty>
                ) : horariosDisponibles.length > 0 ? (
                  <HorariosGrid>
                    {horariosDisponibles.map((horario, index) => (
                      <HorarioSlot
                        key={index}
                        $disponible={horario.disponible}
                        onClick={() => horario.disponible && navigate('/reservar-cita', {
                          state: {
                            doctorPreseleccionado: doctors.find(d => `${d.nombre} ${d.apellidos}` === selectedDoctorFilter),
                            fechaPreseleccionada: getSelectedDateString(),
                            horaPreseleccionada: horario.hora
                          }
                        })}
                      >
                        {horario.hora}
                      </HorarioSlot>
                    ))}
                  </HorariosGrid>
                ) : (
                  <HorariosEmpty>
                    <CalendarIcon />
                    <p>No hay horarios para este día</p>
                  </HorariosEmpty>
                )}
              </HorariosSection>
            )}
            <AppointmentsList>
              <ListHeader>
                <ListTitle>{getListTitle()}</ListTitle>
                <ToggleContainer>
                  <ToggleOption
                    $active={!showAllMonth}
                    onClick={() => setShowAllMonth(false)}
                  >
                    Día
                  </ToggleOption>
                  <ToggleOption
                    $active={showAllMonth}
                    onClick={() => setShowAllMonth(true)}
                  >
                    Mes
                  </ToggleOption>
                </ToggleContainer>
                <CitasCount>{filteredAppointments.length} cita{filteredAppointments.length !== 1 ? 's' : ''}</CitasCount>
              </ListHeader>
              {loading ? (
                <EmptyState>
                  <Loader style={{ animation: 'spin 1s linear infinite' }} />
                  <p>Cargando citas...</p>
                </EmptyState>
              ) : filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => (
                  <AppointmentCard key={appointment.uuid} onClick={() => navigate(`/detalle-cita/${appointment.uuid}`)}>
                    <AppointmentTime>
                      {(showAllMonth || searchQuery) && `${formatFechaCita(appointment.fecha?.split('T')[0])} • `}
                      {appointment.hora_inicio?.substring(0, 5)}
                    </AppointmentTime>
                    <AppointmentPatient>{appointment.paciente_nombre} {appointment.paciente_apellidos}</AppointmentPatient>
                    <AppointmentType>{appointment.tipo || appointment.motivo || 'Consulta'}</AppointmentType>
                    <AppointmentFooter>
                      <DoctorInfo>
                        <CalendarIcon />
                        <span>{appointment.doctor_nombre} {appointment.doctor_apellidos}</span>
                        {appointment.consultorio_interno_nombre && (
                          <ConsultorioInfo $color={appointment.consultorio_interno_color}>
                            <DoorOpen />
                            {appointment.consultorio_interno_nombre}
                          </ConsultorioInfo>
                        )}
                      </DoctorInfo>
                      {appointment.fecha?.split('T')[0] === todayStr &&
                        !['cancelada', 'no_asistio'].includes(appointment.estado) && (
                          appointment.checkin_at ? (
                            <CheckinBadge title={`Llegó a las ${new Date(appointment.checkin_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`}>
                              <UserCheck />
                              En sala de espera
                            </CheckinBadge>
                          ) : (
                            <CheckinButton
                              onClick={(e) => handleToggleCheckin(e, appointment)}
                              disabled={checkinLoadingUuid === appointment.uuid}
                            >
                              <UserCheck />
                              {checkinLoadingUuid === appointment.uuid ? 'Guardando...' : 'Registrar llegada'}
                            </CheckinButton>
                          )
                        )}
                      <StatusBadge $status={appointment.estado}>
                        {formatEstado(appointment.estado)}
                      </StatusBadge>
                    </AppointmentFooter>
                  </AppointmentCard>
                ))
              ) : (
                <EmptyState>
                  <CalendarIcon />
                  <p>{searchQuery ? 'No se encontraron citas' : 'No hay citas para este día'}</p>
                </EmptyState>
              )}
            </AppointmentsList>
          </BottomSection>
        </ContentWrapper>
      </Content>

      <FloatingButton onClick={() => navigate('/reservar-cita')} />
    </PageContainer>
  );
};

export default Agenda;
