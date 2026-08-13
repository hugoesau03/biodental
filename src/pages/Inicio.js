import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Calendar, UserPlus, BarChart3, Stethoscope, ChevronRight, Clock, ChevronDown, Loader, LogIn, QrCode } from 'lucide-react';
import { citasService, usuariosService, serviciosService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding-bottom: 80px;
  overflow-y: auto;
`;

const Header = styled.div`
  background: ${({ theme }) => theme.colors.white};
  padding: 16px 20px 24px;
`;

const Greeting = styled.h2`
  font-size: 28px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 4px 0;
  letter-spacing: -0.3px;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  font-weight: 400;
  line-height: 1.4;
`;

const Content = styled.div`
  padding: 24px 20px 20px;
  position: relative;
  overflow: visible;
`;

const Section = styled.section`
  margin-bottom: 28px;
  position: relative;
  overflow: visible;
`;

const SectionTitle = styled.h3`
  font-size: 17px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 14px 0;
`;

const QuickActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const ActionCard = styled.button`
  background: ${({ theme, $primary }) => 
    $primary ? theme.colors.primary : theme.colors.white};
  border: none;
  border-radius: 12px;
  padding: 24px 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  aspect-ratio: 1;

  svg {
    width: 32px;
    height: 32px;
    color: ${({ theme, $primary }) => 
      $primary ? theme.colors.white : theme.colors.primary};
  }

  span {
    font-size: 13px;
    font-weight: 500;
    color: ${({ theme, $primary }) => 
      $primary ? theme.colors.white : theme.colors.text};
    text-align: center;
    line-height: 1.2;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  overflow-x: visible;
  padding-bottom: 8px;
  position: relative;
  z-index: 50;

  &::-webkit-scrollbar {
    height: 4px;
  }
`;

const FilterButton = styled.button`
  background: ${({ theme, $active }) => $active ? theme.colors.primary : theme.colors.white};
  border: 1px solid ${({ theme, $active }) => $active ? theme.colors.primary : '#E0E0E0'};
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 13px;
  color: ${({ theme, $active }) => $active ? theme.colors.white : theme.colors.text};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s ease;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;

  svg {
    width: 14px;
    height: 14px;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme, $active }) => $active ? theme.colors.white : theme.colors.primary};
  }
`;

const FilterDropdown = styled.div`
  position: relative;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: ${({ theme }) => theme.colors.white};
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 200px;
  max-height: 250px;
  overflow-y: auto;
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  background: ${({ $selected, theme }) => $selected ? theme.colors.info : 'transparent'};
  border: none;
  text-align: left;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
  }
`;

const WaitingRoomList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const WaitingRoomItem = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 10px;
  padding: 12px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  border-left: 4px solid #2E7D32;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  }
`;

const WaitingRoomInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const WaitingRoomPatient = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
`;

const WaitingRoomMeta = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const WaitingRoomTime = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #2E7D32;
  background: #E8F5E9;
  padding: 6px 10px;
  border-radius: 8px;
  white-space: nowrap;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const AppointmentsSummary = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  }
`;

const SummaryLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const DateBadge = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color:${({ theme }) => theme.colors.primary};
  border-radius: 8px;
  padding: 8px 12px;
  min-width: 50px;
  margin-right: 10px;

  .day {
    font-size: 40px;
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    line-height: 1;
    margin-bottom: 1px;
  }

  .month {
    font-size: 20px;
    text-transform: lowercase;
    font-weight: 500;
  }
`;

const SummaryInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;

  svg {
    width: 25px;
    height: 25px;
    color: ${({ theme }) => theme.colors.primary};
    margin-right: 5px;
  }

  span {
    font-size: 20px;
    color: ${({ theme }) => theme.colors.text};
    font-weight: 400;
  }
`;

const AppointmentCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
    transform: translateX(2px);
  }
`;

const AppointmentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const TimeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;

  svg {
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const Time = styled.span`
  font-size: 17px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  display: block;
  margin-bottom: 2px;
`;

const DateText = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: block;
`;

const AppointmentInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PatientInfo = styled.div`
  h4 {
    font-size: 15px;
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    color: ${({ theme }) => theme.colors.text};
    margin: 0 0 3px 0;
  }

  p {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textSecondary};
    margin: 0;
  }
`;

const ChevronIcon = styled(ChevronRight)`
  width: 20px;
  height: 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${({ theme }) => theme.colors.textSecondary};

  svg {
    width: 48px;
    height: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  p {
    font-size: ${({ theme }) => theme.fontSizes.md};
    margin: 0;
  }
`;

const Inicio = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);

  // Obtener fecha de hoy en formato YYYY-MM-DD
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [citasRes, doctoresRes, serviciosRes] = await Promise.all([
          citasService.getAll({ fecha: todayString }),
          usuariosService.getDoctores(),
          serviciosService.getAll()
        ]);
        
        if (citasRes.success) {
          // Formatear citas para el componente
          const citasFormateadas = (citasRes.data.citas || []).map(c => ({
            id: c.id,
            uuid: c.uuid,
            patient: `${c.paciente_nombre} ${c.paciente_apellidos}`,
            doctor: `Dr. ${c.doctor_nombre} ${c.doctor_apellidos}`,
            doctorName: `Dr. ${c.doctor_nombre} ${c.doctor_apellidos}`,
            date: c.fecha,
            time: c.hora_inicio?.substring(0, 5),
            type: c.tipo || 'Consulta',
            status: c.estado,
            checkinAt: c.checkin_at
          }));
          setAppointments(citasFormateadas);
        }
        
        if (doctoresRes.success) {
          const doctoresFormateados = (doctoresRes.data.doctores || []).map(d => ({
            id: d.id,
            uuid: d.uuid,
            name: `Dr. ${d.nombre} ${d.apellidos}`
          }));
          setDoctors(doctoresFormateados);
        }
        
        if (serviciosRes.success) {
          const tipos = (serviciosRes.data.servicios || []).map(s => s.nombre);
          setServiceTypes([...new Set(tipos)]);
        }
      } catch (err) {
        console.error('Error cargando datos:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [todayString]);

  // Filtrar citas según los filtros seleccionados
  const filteredAppointments = appointments.filter(apt => {
    const matchDoctor = !selectedDoctor || apt.doctorName === selectedDoctor;
    const matchService = !selectedService || apt.type === selectedService;
    return matchDoctor && matchService;
  });

  // Sala de espera: pacientes que ya hicieron check-in (recepción o su
  // propio portal) pero cuya consulta todavía no arranca. Visible para
  // todos los roles, no solo recepción.
  const waitingRoom = appointments
    .filter(apt => apt.checkinAt && !['en_progreso', 'completada', 'cancelada', 'no_asistio'].includes(apt.status))
    .sort((a, b) => new Date(a.checkinAt) - new Date(b.checkinAt));

  // Citas próximas de hoy (que no han pasado y no están completadas/canceladas)
  const todayAppointments = filteredAppointments.filter(apt => {
    // Excluir citas completadas, canceladas o no asistió
    if (['completada', 'cancelada', 'no_asistio'].includes(apt.status)) {
      return false;
    }
    
    // Filtrar por hora: solo citas que aún no han pasado
    const ahora = new Date();
    const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    
    // Mostrar citas cuya hora de inicio sea >= hora actual
    return apt.time >= horaActual;
  }).sort((a, b) => a.time.localeCompare(b.time)); // Ordenar por hora

  // Obtener nombre del doctor seleccionado para mostrar
  const selectedDoctorName = selectedDoctor || 'Todos los Médicos';
  const selectedServiceName = selectedService || 'Todos los Servicios';

  return (
    <PageContainer>
      <Header>
        <Greeting>¡Hola, {user?.nombre || 'Usuario'}!</Greeting>
        <Subtitle>Aquí tienes un resumen de tu día.</Subtitle>
      </Header>

      <Content>
        <Section>
          <SectionTitle>Acciones Rápidas</SectionTitle>
          <QuickActionsGrid>
            <ActionCard $primary onClick={() => navigate('/reservar-cita')}>
              <Calendar />
              <span>Reservar Cita</span>
            </ActionCard>
            <ActionCard onClick={() => navigate('/registro-paciente')}>
              <UserPlus />
              <span>Registrar Paciente</span>
            </ActionCard>
            <ActionCard onClick={() => navigate('/reportes')}>
              <BarChart3 />
              <span>Ver Reportes</span>
            </ActionCard>
            <ActionCard onClick={() => navigate('/medicos')}>
              <Stethoscope />
              <span>Mis Médicos</span>
            </ActionCard>
            <ActionCard onClick={() => navigate('/escanear-checkin')}>
              <QrCode />
              <span>Escanear Check-in</span>
            </ActionCard>
          </QuickActionsGrid>
        </Section>

        {waitingRoom.length > 0 && (
          <Section>
            <SectionTitle>Sala de Espera ({waitingRoom.length})</SectionTitle>
            <WaitingRoomList>
              {waitingRoom.map(apt => (
                <WaitingRoomItem key={apt.uuid} onClick={() => navigate(`/detalle-cita/${apt.uuid}`)}>
                  <WaitingRoomInfo>
                    <WaitingRoomPatient>{apt.patient}</WaitingRoomPatient>
                    <WaitingRoomMeta>{apt.doctor} · Cita {apt.time}</WaitingRoomMeta>
                  </WaitingRoomInfo>
                  <WaitingRoomTime>
                    <LogIn />
                    {new Date(apt.checkinAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </WaitingRoomTime>
                </WaitingRoomItem>
              ))}
            </WaitingRoomList>
          </Section>
        )}

        <Section>
          <SectionTitle>Filtrar Citas</SectionTitle>
          <FiltersContainer>
            <FilterDropdown>
              <FilterButton 
                $active={!!selectedDoctor}
                onClick={() => {
                  setShowDoctorDropdown(!showDoctorDropdown);
                  setShowServiceDropdown(false);
                }}
              >
                {selectedDoctorName}
                <ChevronDown />
              </FilterButton>
              {showDoctorDropdown && (
                <DropdownMenu>
                  <DropdownItem 
                    $selected={!selectedDoctor}
                    onClick={() => {
                      setSelectedDoctor('');
                      setShowDoctorDropdown(false);
                    }}
                  >
                    Todos los Médicos
                  </DropdownItem>
                  {doctors.map(doctor => (
                    <DropdownItem 
                      key={doctor.id}
                      $selected={selectedDoctor === doctor.name}
                      onClick={() => {
                        setSelectedDoctor(doctor.name);
                        setShowDoctorDropdown(false);
                      }}
                    >
                      {doctor.name}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              )}
            </FilterDropdown>

            <FilterDropdown>
              <FilterButton 
                $active={!!selectedService}
                onClick={() => {
                  setShowServiceDropdown(!showServiceDropdown);
                  setShowDoctorDropdown(false);
                }}
              >
                {selectedServiceName}
                <ChevronDown />
              </FilterButton>
              {showServiceDropdown && (
                <DropdownMenu>
                  <DropdownItem 
                    $selected={!selectedService}
                    onClick={() => {
                      setSelectedService('');
                      setShowServiceDropdown(false);
                    }}
                  >
                    Todos los Servicios
                  </DropdownItem>
                  {serviceTypes.map(service => (
                    <DropdownItem 
                      key={service}
                      $selected={selectedService === service}
                      onClick={() => {
                        setSelectedService(service);
                        setShowServiceDropdown(false);
                      }}
                    >
                      {service}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              )}
            </FilterDropdown>
          </FiltersContainer>

          <AppointmentsSummary onClick={() => navigate('/agenda')}>
            <SummaryLeft>
              <DateBadge>
                <span className="day">{today.getDate()}</span>
                <span className="month">{['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][today.getMonth()]}</span>
              </DateBadge>
              <SummaryInfo>
                <Calendar />
                <span>{filteredAppointments.length} citas hoy</span>
              </SummaryInfo>
            </SummaryLeft>
            <ChevronIcon />
          </AppointmentsSummary>
        </Section>

        <Section>
          <SectionTitle>Próximas Citas</SectionTitle>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <Loader className="spin" size={28} />
            </div>
          ) : todayAppointments.length > 0 ? (
            todayAppointments.map((appointment) => (
              <AppointmentCard key={appointment.uuid || appointment.id} onClick={() => navigate(`/detalle-cita/${appointment.uuid}`)}>
                <AppointmentHeader>
                  <TimeContainer>
                    <Clock />
                    <div>
                      <Time>{appointment.time}</Time>
                      <DateText>{appointment.type}</DateText>
                    </div>
                  </TimeContainer>
                </AppointmentHeader>
                <AppointmentInfo>
                  <PatientInfo>
                    <h4>{appointment.patient}</h4>
                    <p>{appointment.doctor}</p>
                  </PatientInfo>
                  <ChevronIcon />
                </AppointmentInfo>
              </AppointmentCard>
            ))
          ) : (
            <EmptyState>
              <Calendar />
              <p>No hay citas próximas para hoy.</p>
            </EmptyState>
          )}
        </Section>
      </Content>
    </PageContainer>
  );
};

export default Inicio;
