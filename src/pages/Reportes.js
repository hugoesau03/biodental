import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Calendar, Loader, Banknote } from 'lucide-react';
import Header from '../components/Layout/Header';
import { citasService, pacientesService, usuariosService, serviciosService } from '../services/api';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding-bottom: 80px;
  overflow-y: auto;
`;

const Content = styled.div`
  padding: 20px;
`;

const Section = styled.section`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 16px 0;
`;

const FiltersCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  overflow: hidden;
`;

const FilterRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 16px;

  @media (min-width: 480px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const FilterLabel = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 8px;
  display: block;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  transition: all 0.3s ease;
  box-sizing: border-box;
  min-width: 0;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  background: ${({ theme }) => theme.colors.white};
  cursor: pointer;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ButtonsRow = styled.div`
  display: flex;
  gap: 12px;
`;

const ApplyButton = styled.button`
  flex: 1;
  padding: 12px;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }

  &:active {
    transform: scale(0.98);
  }
`;

const ClearButton = styled.button`
  padding: 12px 20px;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.textSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
    color: ${({ theme }) => theme.colors.text};
  }

  &:active {
    transform: scale(0.98);
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 24px;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const MetricCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 20px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const MetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const MetricLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    width: 18px;
    height: 18px;
  }
`;

const MetricValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xxxl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 8px;
`;

const MetricChange = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.successText};
  display: flex;
  align-items: center;
  gap: 4px;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const ChartCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 20px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  margin-bottom: 24px;
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ChartTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const ViewDetailsButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    text-decoration: underline;
  }
`;

const LegendContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
  justify-content: center;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const LegendColor = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: ${({ color }) => color};
`;

const Reportes = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportData, setReportData] = useState({
    totalAppointments: 0,
    adultPatients: 0,
    pediatricPatients: 0,
    appointmentsByMonth: [],
    serviceRevenue: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [citasRes, doctorsRes, serviciosRes, pacientesRes] = await Promise.all([
        citasService.getAll(),
        usuariosService.getDoctors(),
        serviciosService.getAll(),
        pacientesService.getAll()
      ]);

      const citas = citasRes.data?.citas || citasRes.data || [];
      setDoctors(doctorsRes.data?.usuarios || doctorsRes.data || []);
      const servicios = serviciosRes.data?.servicios || serviciosRes.data || [];
      const pacientes = pacientesRes.data?.pacientes || pacientesRes.data || [];

      // Calcular métricas
      const totalAppointments = citas.length;
      
      // Contar pacientes por tipo
      const adultPatients = pacientes.filter(p => p.tipo === 'adulto').length;
      const pediatricPatients = pacientes.filter(p => p.tipo === 'pediatrico').length;

      // Contar citas por mes
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const citasByMonth = {};
      citas.forEach(cita => {
        const date = new Date(cita.fecha);
        const monthIndex = date.getMonth();
        citasByMonth[monthIndex] = (citasByMonth[monthIndex] || 0) + 1;
      });
      
      const appointmentsByMonth = Object.entries(citasByMonth)
        .map(([month, value]) => ({ month: monthNames[parseInt(month)], value }))
        .slice(-5);

      // Calcular ingresos por servicio
      const colors = ['#33A9FF', '#FF6B9D', '#FFA726', '#9C27B0', '#4CAF50', '#FF5722'];
      const serviceIncome = {};
      
      citas.forEach(cita => {
        // Si la cita tiene servicios detallados, usarlos
        if (cita.servicios && cita.servicios.length > 0) {
          cita.servicios.forEach(servicio => {
            const servName = servicio.nombre || 'General';
            const income = (parseFloat(servicio.precio) || 0) * (parseInt(servicio.cantidad) || 1);
            serviceIncome[servName] = (serviceIncome[servName] || 0) + income;
          });
        } else {
          // Si no tiene servicios detallados, usar precio_total con tipo/motivo como nombre
          const servName = cita.tipo || cita.motivo || 'General';
          const income = parseFloat(cita.precio_total) || 0;
          serviceIncome[servName] = (serviceIncome[servName] || 0) + income;
        }
      });
      
      const serviceRevenue = Object.entries(serviceIncome)
        .filter(([_, value]) => value > 0)
        .map(([name, value], index) => ({
          name,
          value,
          color: colors[index % colors.length]
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      setReportData({
        totalAppointments,
        adultPatients,
        pediatricPatients,
        appointmentsByMonth,
        serviceRevenue
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = async () => {
    try {
      setLoading(true);
      const params = {};
      if (dateFrom) params.desde = dateFrom;
      if (dateTo) params.hasta = dateTo;
      if (selectedDoctor) params.doctor_id = selectedDoctor;
      
      const [citasRes, pacientesRes] = await Promise.all([
        citasService.getAll(params),
        pacientesService.getAll()
      ]);
      const citas = citasRes.data?.citas || citasRes.data || [];
      const pacientes = pacientesRes.data?.pacientes || pacientesRes.data || [];
      
      const totalAppointments = citas.length;
      
      // Contar pacientes por tipo
      const adultPatients = pacientes.filter(p => p.tipo === 'adulto').length;
      const pediatricPatients = pacientes.filter(p => p.tipo === 'pediatrico').length;
      
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const citasByMonth = {};
      citas.forEach(cita => {
        const date = new Date(cita.fecha);
        const monthIndex = date.getMonth();
        citasByMonth[monthIndex] = (citasByMonth[monthIndex] || 0) + 1;
      });
      
      const appointmentsByMonth = Object.entries(citasByMonth)
        .map(([month, value]) => ({ month: monthNames[parseInt(month)], value }))
        .slice(-5);

      // Calcular ingresos por servicio
      const colors = ['#33A9FF', '#FF6B9D', '#FFA726', '#9C27B0', '#4CAF50', '#FF5722'];
      const serviceIncome = {};
      
      citas.forEach(cita => {
        // Si la cita tiene servicios detallados, usarlos
        if (cita.servicios && cita.servicios.length > 0) {
          cita.servicios.forEach(servicio => {
            const servName = servicio.nombre || 'General';
            const income = (parseFloat(servicio.precio) || 0) * (parseInt(servicio.cantidad) || 1);
            serviceIncome[servName] = (serviceIncome[servName] || 0) + income;
          });
        } else {
          // Si no tiene servicios detallados, usar precio_total con tipo/motivo como nombre
          const servName = cita.tipo || cita.motivo || 'General';
          const income = parseFloat(cita.precio_total) || 0;
          serviceIncome[servName] = (serviceIncome[servName] || 0) + income;
        }
      });
      
      const serviceRevenue = Object.entries(serviceIncome)
        .filter(([_, value]) => value > 0)
        .map(([name, value], index) => ({
          name,
          value,
          color: colors[index % colors.length]
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      setReportData({
        totalAppointments,
        adultPatients,
        pediatricPatients,
        appointmentsByMonth,
        serviceRevenue
      });
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedDoctor('');
    fetchData(); // Recargar datos sin filtros
  };

  if (loading) {
    return (
      <PageContainer>
        <Header title="Reportes" />
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
      <Header title="Reportes" />
      
      <Content>
        <Section>
          <SectionTitle>Filtros de Reporte</SectionTitle>
          <FiltersCard>
            <FilterRow>
              <div>
                <FilterLabel>Fecha Inicio</FilterLabel>
                <Input 
                  type="date" 
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <FilterLabel>Fecha Fin</FilterLabel>
                <Input 
                  type="date" 
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </FilterRow>
            <div style={{ marginBottom: '16px' }}>
              <FilterLabel>Médico</FilterLabel>
              <Select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
              >
                <option value="">Todos los Médicos</option>
                {doctors.map(doctor => (
                  <option key={doctor.uuid} value={doctor.uuid}>
                    Dr. {doctor.nombre} {doctor.apellidos}
                  </option>
                ))}
              </Select>
            </div>
            <ButtonsRow>
              <ApplyButton onClick={handleApplyFilters}>Aplicar Filtros</ApplyButton>
              <ClearButton onClick={handleClearFilters}>Limpiar</ClearButton>
            </ButtonsRow>
          </FiltersCard>
        </Section>

        <Section>
          <SectionTitle>Métricas Clave</SectionTitle>
          <MetricsGrid>
            <MetricCard>
              <MetricHeader>
                <MetricLabel>
                  <Calendar />
                  Citas Totales
                </MetricLabel>
              </MetricHeader>
              <MetricValue>{reportData.totalAppointments.toLocaleString()}</MetricValue>
            </MetricCard>

            <MetricCard>
              <MetricHeader>
                <MetricLabel>
                  <Users />
                  Pacientes Adultos
                </MetricLabel>
              </MetricHeader>
              <MetricValue>{reportData.adultPatients.toLocaleString()}</MetricValue>
            </MetricCard>

            <MetricCard>
              <MetricHeader>
                <MetricLabel>
                  <Users />
                  Pacientes Pediátricos
                </MetricLabel>
              </MetricHeader>
              <MetricValue>{reportData.pediatricPatients.toLocaleString()}</MetricValue>
            </MetricCard>
          </MetricsGrid>
        </Section>

        <Section>
          <SectionTitle>Citas</SectionTitle>
          <ChartCard>
            <ChartHeader>
              <ChartTitle>Citas por Período</ChartTitle>
              <ViewDetailsButton onClick={() => navigate('/reporte-citas')}>Ver detalles</ViewDetailsButton>
            </ChartHeader>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={reportData.appointmentsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#33A9FF" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Section>

        <Section>
          <SectionTitle>Ingresos</SectionTitle>
          <ChartCard>
            <ChartHeader>
              <ChartTitle>Ingresos por Servicio</ChartTitle>
              <ViewDetailsButton onClick={() => navigate('/reporte-ingresos')}>Ver detalles</ViewDetailsButton>
            </ChartHeader>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={reportData.serviceRevenue}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {reportData.serviceRevenue.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <LegendContainer>
              {reportData.serviceRevenue.map((item, index) => (
                <LegendItem key={index}>
                  <LegendColor color={item.color} />
                  <span>{item.name}</span>
                </LegendItem>
              ))}
            </LegendContainer>
          </ChartCard>
        </Section>

        <Section>
          <SectionTitle>Corte de Caja</SectionTitle>
          <ChartCard 
            onClick={() => navigate('/corte-caja')}
            style={{ cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            }}
          >
            <ChartHeader>
              <ChartTitle>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Banknote size={24} />
                  Control de Pagos
                </div>
              </ChartTitle>
              <ViewDetailsButton onClick={(e) => {
                e.stopPropagation();
                navigate('/corte-caja');
              }}>
                Ver corte de caja
              </ViewDetailsButton>
            </ChartHeader>
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              <p>Accede al corte de caja para ver el resumen de pagos por método de pago (efectivo, tarjeta, transferencia) en un período específico.</p>
            </div>
          </ChartCard>
        </Section>
      </Content>
    </PageContainer>
  );
};

export default Reportes;
