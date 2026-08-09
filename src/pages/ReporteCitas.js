import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, ChevronRight, Loader, Filter } from 'lucide-react';
import { citasService } from '../services/api';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding-bottom: 80px;
  overflow-y: auto;
`;

const HeaderSection = styled.div`
  background: ${({ theme }) => theme.colors.white};
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const BackButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.3s ease;

  svg {
    width: 24px;
    height: 24px;
    color: ${({ theme }) => theme.colors.text};
  }

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
  }
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  flex: 1;
`;

const FilterIconButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.3s ease;

  svg {
    width: 22px;
    height: 22px;
    color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.text};
  }

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
  }
`;

const FilterSection = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-bottom: ${({ $isVisible }) => $isVisible ? '1px' : '0'} solid ${({ theme }) => theme.colors.border};
  overflow: hidden;
  max-height: ${({ $isVisible }) => $isVisible ? '80px' : '0'};
  padding: ${({ $isVisible }) => $isVisible ? '16px 20px' : '0 20px'};
  opacity: ${({ $isVisible }) => $isVisible ? '1' : '0'};
  transition: all 0.3s ease;
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-right: 16px;

  &::-webkit-scrollbar {
    height: 4px;
  }
`;

const FilterTab = styled.button`
  background: ${({ $active, theme }) => 
    $active ? theme.colors.primary : '#F0F0F0'};
  color: ${({ $active, theme }) => 
    $active ? theme.colors.white : theme.colors.text};
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
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

const Content = styled.div`
  padding: 20px;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const SummaryCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const SummaryLabel = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 8px;
`;

const SummaryValue = styled.div`
  font-size: 24px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.primary};
`;

const SummaryChange = styled.div`
  font-size: 11px;
  color: ${({ $positive, theme }) => $positive ? theme.colors.successText : theme.colors.dangerText};
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;

  svg {
    width: 12px;
    height: 12px;
  }
`;

const Section = styled.section`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 16px 0;
`;

const AppointmentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const AppointmentCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 14px;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    transform: translateX(2px);
  }
`;

const AppointmentIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.info};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 24px;
    height: 24px;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const AppointmentInfo = styled.div`
  flex: 1;
`;

const AppointmentPatient = styled.h3`
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 4px 0;
`;

const AppointmentDetails = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

const StatusBadge = styled.span`
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  text-transform: capitalize;
  background: ${({ $status, theme }) => {
    switch ($status) {
      case 'confirmada':
        return theme.colors.success;
      case 'pendiente':
        return theme.colors.warning;
      case 'reprogramada':
        return theme.colors.info;
      case 'cancelada':
        return theme.colors.danger;
      case 'completada':
        return '#E8F5E9';
      default:
        return theme.colors.gray;
    }
  }};
  color: ${({ $status, theme }) => {
    switch ($status) {
      case 'confirmada':
        return theme.colors.successText;
      case 'pendiente':
        return theme.colors.warningText;
      case 'reprogramada':
        return theme.colors.infoText;
      case 'cancelada':
        return theme.colors.dangerText;
      case 'completada':
        return '#2E7D32';
      default:
        return theme.colors.text;
    }
  }};
`;

const ChevronIcon = styled(ChevronRight)`
  width: 20px;
  height: 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
  flex-shrink: 0;
`;

const MonthlyBreakdown = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const MonthRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const MonthName = styled.span`
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
`;

const MonthValue = styled.span`
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.primary};
`;

const ProgressBar = styled.div`
  flex: 1;
  height: 8px;
  background: ${({ theme }) => theme.colors.gray};
  border-radius: 4px;
  margin: 0 16px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: 4px;
  width: ${({ $percentage }) => $percentage}%;
  transition: width 0.3s ease;
`;

const ServiceBreakdown = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const ServiceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const ServiceInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const ServiceColor = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

const ServiceName = styled.span`
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
`;

const ServiceStats = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const ServiceCount = styled.span`
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.primary};
  min-width: 60px;
  text-align: right;
`;

const ServicePercentage = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  min-width: 45px;
  text-align: right;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 24px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const MetricCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const MetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const MetricTitle = styled.h3`
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const MetricValue = styled.span`
  font-size: 20px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.primary};
`;

const MetricList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MetricItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MetricItemName = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text};
`;

const MetricItemValue = styled.span`
  font-size: 13px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.primary};
`;

const MetricBar = styled.div`
  height: 6px;
  background: ${({ theme }) => theme.colors.gray};
  border-radius: 3px;
  margin-top: 4px;
  overflow: hidden;
`;

const MetricBarFill = styled.div`
  height: 100%;
  background: ${({ $color }) => $color || '#6366F1'};
  border-radius: 3px;
  width: ${({ $percentage }) => $percentage}%;
`;

const HourGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
`;

const HourBlock = styled.div`
  text-align: center;
  padding: 8px 4px;
  border-radius: 8px;
  background: ${({ $intensity }) => {
    if ($intensity > 0.7) return '#6366F1';
    if ($intensity > 0.4) return '#A5B4FC';
    if ($intensity > 0) return '#E0E7FF';
    return '#F3F4F6';
  }};
  color: ${({ $intensity }) => $intensity > 0.4 ? '#fff' : '#374151'};
  font-size: 11px;
  font-weight: 500;
`;

const ReporteCitas = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('Siempre');
  const [showFilters, setShowFilters] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [previousAppointments, setPreviousAppointments] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  const filterOptions = ['Siempre', 'Hoy', 'Esta semana', 'Este mes', 'Este año'];

  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };

  // Calcular fechas según el período seleccionado
  const getDateRange = (period) => {
    const today = new Date();
    let desde, hasta, desdeAnterior, hastaAnterior;

    switch (period) {
      case 'Hoy':
        desde = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        hasta = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        desdeAnterior = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
        hastaAnterior = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
        break;
      case 'Esta semana':
        const dayOfWeek = today.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        desde = new Date(today.getFullYear(), today.getMonth(), today.getDate() - diffToMonday);
        hasta = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        desdeAnterior = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() - 7);
        hastaAnterior = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate() - 7);
        break;
      case 'Este año':
        desde = new Date(today.getFullYear(), 0, 1);
        hasta = new Date(today.getFullYear(), 11, 31);
        desdeAnterior = new Date(today.getFullYear() - 1, 0, 1);
        hastaAnterior = new Date(today.getFullYear() - 1, 11, 31);
        break;
      case 'Siempre':
        // Sin filtro de fechas - traer todo
        return { desde: null, hasta: null, desdeAnterior: null, hastaAnterior: null };
      case 'Este mes':
      default:
        desde = new Date(today.getFullYear(), today.getMonth(), 1);
        hasta = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        desdeAnterior = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        hastaAnterior = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
    }

    const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    return {
      desde: formatDate(desde),
      hasta: formatDate(hasta),
      desdeAnterior: formatDate(desdeAnterior),
      hastaAnterior: formatDate(hastaAnterior)
    };
  };

  // Cargar citas según el período
  useEffect(() => {
    const fetchCitas = async () => {
      setLoading(true);
      try {
        const { desde, hasta, desdeAnterior, hastaAnterior } = getDateRange(selectedPeriod);
        
        // Construir parámetros solo si hay fechas
        const currentParams = {};
        const previousParams = {};
        
        if (desde && hasta) {
          currentParams.desde = desde;
          currentParams.hasta = hasta;
        }
        if (desdeAnterior && hastaAnterior) {
          previousParams.desde = desdeAnterior;
          previousParams.hasta = hastaAnterior;
        }
        
        // Cargar citas del período actual y anterior en paralelo
        const [currentRes, previousRes] = await Promise.all([
          citasService.getAll(currentParams),
          desdeAnterior ? citasService.getAll(previousParams) : Promise.resolve({ success: true, data: { citas: [] } })
        ]);
        
        if (currentRes.success) {
          setAppointments(currentRes.data?.citas || currentRes.data || []);
        }
        if (previousRes.success) {
          setPreviousAppointments(previousRes.data?.citas || previousRes.data || []);
        }
      } catch (err) {
        console.error('Error cargando citas:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCitas();
  }, [selectedPeriod]);

  // Cargar datos mensuales (últimos 6 meses)
  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        const today = new Date();
        const months = [];
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        // Obtener datos de los últimos 6 meses
        for (let i = 0; i < 6; i++) {
          const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          
          try {
            const res = await citasService.getByMes(year, month);
            const citas = res.data?.citas || res.data || [];
            months.push({
              month: monthNames[date.getMonth()],
              value: citas.length,
              year: year
            });
          } catch {
            months.push({
              month: monthNames[date.getMonth()],
              value: 0,
              year: year
            });
          }
        }
        
        // Calcular porcentajes basados en el máximo
        const maxValue = Math.max(...months.map(m => m.value), 1);
        const monthlyWithPercentage = months.map(m => ({
          ...m,
          percentage: Math.round((m.value / maxValue) * 100)
        }));
        
        setMonthlyData(monthlyWithPercentage);
      } catch (err) {
        console.error('Error cargando datos mensuales:', err);
      }
    };
    fetchMonthlyData();
  }, []);

  // Calcular porcentaje de cambio
  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Datos de resumen con cambios reales
  const currentTotal = appointments.length;
  const previousTotal = previousAppointments.length;
  const currentConfirmadas = appointments.filter(a => a.estado === 'confirmada').length;
  const previousConfirmadas = previousAppointments.filter(a => a.estado === 'confirmada').length;
  const currentPendientes = appointments.filter(a => a.estado === 'pendiente').length;
  const previousPendientes = previousAppointments.filter(a => a.estado === 'pendiente').length;
  const currentCanceladas = appointments.filter(a => a.estado === 'cancelada').length;
  const previousCanceladas = previousAppointments.filter(a => a.estado === 'cancelada').length;

  const summaryData = {
    total: currentTotal,
    totalChange: calculateChange(currentTotal, previousTotal),
    confirmadas: currentConfirmadas,
    confirmadasChange: calculateChange(currentConfirmadas, previousConfirmadas),
    pendientes: currentPendientes,
    pendientesChange: calculateChange(currentPendientes, previousPendientes),
    canceladas: currentCanceladas,
    canceladasChange: calculateChange(currentCanceladas, previousCanceladas),
  };

  // Colores para los servicios
  const serviceColors = [
    '#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#06B6D4', '#EC4899', '#14B8A6', '#F97316', '#3B82F6'
  ];

  // Calcular datos por servicio
  const serviceData = (() => {
    const serviceCounts = {};
    
    appointments.forEach(cita => {
      // Obtener servicios de la cita
      const servicios = cita.servicios || [];
      if (servicios.length > 0) {
        servicios.forEach(s => {
          const nombre = s.nombre || 'Sin nombre';
          serviceCounts[nombre] = (serviceCounts[nombre] || 0) + 1;
        });
      } else {
        // Si no tiene servicios, usar el tipo o 'Consulta General'
        const nombre = cita.tipo || 'Consulta General';
        serviceCounts[nombre] = (serviceCounts[nombre] || 0) + 1;
      }
    });
    
    // Convertir a array y ordenar por cantidad
    const total = appointments.length || 1;
    return Object.entries(serviceCounts)
      .map(([nombre, count], index) => ({
        nombre,
        count,
        percentage: Math.round((count / total) * 100),
        color: serviceColors[index % serviceColors.length]
      }))
      .sort((a, b) => b.count - a.count);
  })();

  // Calcular métricas adicionales
  const completadas = appointments.filter(a => a.estado === 'completada').length;
  const tasaCompletacion = currentTotal > 0 ? Math.round((completadas / currentTotal) * 100) : 0;
  const tasaCancelacion = currentTotal > 0 ? Math.round((currentCanceladas / currentTotal) * 100) : 0;

  // Citas por doctor
  const doctorData = (() => {
    const doctorCounts = {};
    appointments.forEach(cita => {
      const doctorName = `Dr. ${cita.doctor_nombre || ''} ${cita.doctor_apellidos || ''}`.trim();
      if (doctorName !== 'Dr.') {
        doctorCounts[doctorName] = (doctorCounts[doctorName] || 0) + 1;
      }
    });
    const maxCount = Math.max(...Object.values(doctorCounts), 1);
    return Object.entries(doctorCounts)
      .map(([nombre, count]) => ({
        nombre,
        count,
        percentage: Math.round((count / maxCount) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  })();

  // Citas por día de la semana
  const weekDayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const weekDayData = (() => {
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    appointments.forEach(cita => {
      const date = new Date(cita.fecha);
      const day = date.getDay();
      dayCounts[day]++;
    });
    const maxCount = Math.max(...dayCounts, 1);
    return dayCounts.map((count, index) => ({
      day: weekDayNames[index],
      dayShort: weekDayNames[index].substring(0, 3),
      count,
      percentage: Math.round((count / maxCount) * 100)
    }));
  })();

  // Citas por hora del día
  const hourData = (() => {
    const hourCounts = {};
    for (let h = 7; h <= 20; h++) {
      hourCounts[h] = 0;
    }
    appointments.forEach(cita => {
      if (cita.hora_inicio) {
        const hour = parseInt(cita.hora_inicio.split(':')[0]);
        if (hourCounts[hour] !== undefined) {
          hourCounts[hour]++;
        }
      }
    });
    const maxCount = Math.max(...Object.values(hourCounts), 1);
    return Object.entries(hourCounts).map(([hour, count]) => ({
      hour: `${hour}:00`,
      count,
      intensity: count / maxCount
    }));
  })();

  // Hora más popular
  const horaMasPopular = hourData.reduce((max, h) => h.count > max.count ? h : max, { hour: 'N/A', count: 0 });

  // Día más popular
  const diaMasPopular = weekDayData.reduce((max, d) => d.count > max.count ? d : max, { day: 'N/A', count: 0 });

  return (
    <PageContainer>
      <HeaderSection>
        <BackButton onClick={() => navigate('/reportes')}>
          <ArrowLeft />
        </BackButton>
        <Title>Detalle de Citas</Title>
        <FilterIconButton $active={showFilters} onClick={toggleFilters}>
          <Filter />
        </FilterIconButton>
      </HeaderSection>

      <FilterSection $isVisible={showFilters}>
        <FilterTabs>
          {filterOptions.map((period) => (
            <FilterTab
              key={period}
              $active={selectedPeriod === period}
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </FilterTab>
          ))}
        </FilterTabs>
      </FilterSection>

      <Content>
        <SummaryGrid>
          <SummaryCard>
            <SummaryLabel>Total Citas</SummaryLabel>
            <SummaryValue>{summaryData.total}</SummaryValue>
            <SummaryChange $positive={summaryData.totalChange >= 0}>
              {summaryData.totalChange >= 0 ? <TrendingUp /> : <TrendingDown />}
              {summaryData.totalChange >= 0 ? '+' : ''}{summaryData.totalChange}% vs período anterior
            </SummaryChange>
          </SummaryCard>
          <SummaryCard>
            <SummaryLabel>Confirmadas</SummaryLabel>
            <SummaryValue>{summaryData.confirmadas}</SummaryValue>
            <SummaryChange $positive={summaryData.confirmadasChange >= 0}>
              {summaryData.confirmadasChange >= 0 ? <TrendingUp /> : <TrendingDown />}
              {summaryData.confirmadasChange >= 0 ? '+' : ''}{summaryData.confirmadasChange}%
            </SummaryChange>
          </SummaryCard>
          <SummaryCard>
            <SummaryLabel>Pendientes</SummaryLabel>
            <SummaryValue>{summaryData.pendientes}</SummaryValue>
            <SummaryChange $positive={summaryData.pendientesChange <= 0}>
              {summaryData.pendientesChange >= 0 ? <TrendingUp /> : <TrendingDown />}
              {summaryData.pendientesChange >= 0 ? '+' : ''}{summaryData.pendientesChange}%
            </SummaryChange>
          </SummaryCard>
          <SummaryCard>
            <SummaryLabel>Canceladas</SummaryLabel>
            <SummaryValue>{summaryData.canceladas}</SummaryValue>
            <SummaryChange $positive={summaryData.canceladasChange <= 0}>
              {summaryData.canceladasChange >= 0 ? <TrendingUp /> : <TrendingDown />}
              {summaryData.canceladasChange >= 0 ? '+' : ''}{summaryData.canceladasChange}%
            </SummaryChange>
          </SummaryCard>
        </SummaryGrid>

        {/* Métricas adicionales */}
        <SummaryGrid>
          <SummaryCard>
            <SummaryLabel>Tasa de Completación</SummaryLabel>
            <SummaryValue>{tasaCompletacion}%</SummaryValue>
            <SummaryChange $positive={tasaCompletacion >= 70}>
              {tasaCompletacion >= 70 ? <TrendingUp /> : <TrendingDown />}
              {completadas} de {currentTotal} citas
            </SummaryChange>
          </SummaryCard>
          <SummaryCard>
            <SummaryLabel>Tasa de Cancelación</SummaryLabel>
            <SummaryValue>{tasaCancelacion}%</SummaryValue>
            <SummaryChange $positive={tasaCancelacion <= 10}>
              {tasaCancelacion <= 10 ? <TrendingUp /> : <TrendingDown />}
              {currentCanceladas} canceladas
            </SummaryChange>
          </SummaryCard>
          <SummaryCard>
            <SummaryLabel>Día Más Popular</SummaryLabel>
            <SummaryValue style={{ fontSize: '18px' }}>{diaMasPopular.day}</SummaryValue>
            <SummaryChange $positive>
              <Calendar style={{ width: 12, height: 12 }} />
              {diaMasPopular.count} citas
            </SummaryChange>
          </SummaryCard>
          <SummaryCard>
            <SummaryLabel>Hora Más Popular</SummaryLabel>
            <SummaryValue style={{ fontSize: '18px' }}>{horaMasPopular.hour}</SummaryValue>
            <SummaryChange $positive>
              <Calendar style={{ width: 12, height: 12 }} />
              {horaMasPopular.count} citas
            </SummaryChange>
          </SummaryCard>
        </SummaryGrid>

        {/* Métricas por Doctor y Horarios */}
        <MetricsGrid>
          <MetricCard>
            <MetricHeader>
              <MetricTitle>Citas por Doctor</MetricTitle>
              <MetricValue>{doctorData.length}</MetricValue>
            </MetricHeader>
            <MetricList>
              {doctorData.length > 0 ? doctorData.map((doctor, index) => (
                <div key={index}>
                  <MetricItem>
                    <MetricItemName>{doctor.nombre}</MetricItemName>
                    <MetricItemValue>{doctor.count} citas</MetricItemValue>
                  </MetricItem>
                  <MetricBar>
                    <MetricBarFill $percentage={doctor.percentage} $color={serviceColors[index % serviceColors.length]} />
                  </MetricBar>
                </div>
              )) : (
                <MetricItemName style={{ color: '#999' }}>No hay datos</MetricItemName>
              )}
            </MetricList>
          </MetricCard>

          <MetricCard>
            <MetricHeader>
              <MetricTitle>Citas por Día de la Semana</MetricTitle>
            </MetricHeader>
            <MetricList>
              {weekDayData.map((day, index) => (
                <div key={index}>
                  <MetricItem>
                    <MetricItemName>{day.day}</MetricItemName>
                    <MetricItemValue>{day.count}</MetricItemValue>
                  </MetricItem>
                  <MetricBar>
                    <MetricBarFill $percentage={day.percentage} $color={index === 0 || index === 6 ? '#EF4444' : '#6366F1'} />
                  </MetricBar>
                </div>
              ))}
            </MetricList>
          </MetricCard>
        </MetricsGrid>

        {/* Mapa de Calor de Horarios */}
        <Section>
          <SectionTitle>Distribución por Hora</SectionTitle>
          <MonthlyBreakdown>
            <HourGrid>
              {hourData.map((h, index) => (
                <HourBlock key={index} $intensity={h.intensity}>
                  {h.hour}
                  <div style={{ fontWeight: 'bold', marginTop: 2 }}>{h.count}</div>
                </HourBlock>
              ))}
            </HourGrid>
          </MonthlyBreakdown>
        </Section>

        <Section>
          <SectionTitle>Desglose Mensual</SectionTitle>
          <MonthlyBreakdown>
            {monthlyData.map((item, index) => (
              <MonthRow key={index}>
                <MonthName>{item.month}</MonthName>
                <ProgressBar>
                  <ProgressFill $percentage={item.percentage} />
                </ProgressBar>
                <MonthValue>{item.value} citas</MonthValue>
              </MonthRow>
            ))}
          </MonthlyBreakdown>
        </Section>

        <Section>
          <SectionTitle>Citas por Servicio</SectionTitle>
          <ServiceBreakdown>
            {serviceData.length > 0 ? (
              serviceData.map((service, index) => (
                <ServiceRow key={index}>
                  <ServiceInfo>
                    <ServiceColor $color={service.color} />
                    <ServiceName>{service.nombre}</ServiceName>
                  </ServiceInfo>
                  <ServiceStats>
                    <ServiceCount>{service.count} citas</ServiceCount>
                    <ServicePercentage>{service.percentage}%</ServicePercentage>
                  </ServiceStats>
                </ServiceRow>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No hay datos de servicios para este período
              </div>
            )}
          </ServiceBreakdown>
        </Section>

        <Section>
          <SectionTitle>Citas Recientes</SectionTitle>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', display: 'flex', justifyContent: 'center' }}>
              <Loader style={{ animation: 'spin 1s linear infinite', width: 32, height: 32, color: '#6366F1' }} />
            </div>
          ) : (
            <AppointmentsList>
              {appointments.slice(0, 5).map((appointment) => (
                <AppointmentCard 
                  key={appointment.uuid}
                  onClick={() => navigate(`/detalle-cita/${appointment.uuid}`)}
                >
                  <AppointmentIcon>
                    <Calendar />
                  </AppointmentIcon>
                  <AppointmentInfo>
                    <AppointmentPatient>
                      {appointment.paciente_nombre} {appointment.paciente_apellidos}
                    </AppointmentPatient>
                    <AppointmentDetails>
                      {appointment.servicio_nombre || 'Consulta'} • {appointment.hora_inicio?.slice(0, 5)} • Dr. {appointment.doctor_nombre} {appointment.doctor_apellidos}
                    </AppointmentDetails>
                  </AppointmentInfo>
                  <StatusBadge $status={appointment.estado}>
                    {appointment.estado}
                  </StatusBadge>
                  <ChevronIcon />
                </AppointmentCard>
              ))}
            </AppointmentsList>
          )}
        </Section>
      </Content>
    </PageContainer>
  );
};

export default ReporteCitas;
