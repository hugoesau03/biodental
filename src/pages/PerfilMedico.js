import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, ChevronRight, Settings, Loader, User } from 'lucide-react';
import Header from '../components/Layout/Header';
import { usuariosService, citasService } from '../services/api';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding-bottom: 80px;
  overflow-y: auto;
`;

const Content = styled.div`
  padding: 0;
`;

const ProfileHeader = styled.div`
  background: ${({ theme }) => theme.colors.white};
  padding: 32px 20px;
  text-align: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const DoctorImage = styled.div`
  width: 120px;
  height: 120px;
  border-radius: ${({ theme }) => theme.borderRadius.round};
  overflow: hidden;
  margin: 0 auto 16px;
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
    width: 60px;
    height: 60px;
    color: white;
  }
`;

const DoctorName = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xxl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 8px 0;
`;

const DoctorSpecialty = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.primary};
  margin: 0 0 8px 0;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const DoctorExperience = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

const Section = styled.section`
  background: ${({ theme }) => theme.colors.white};
  padding: 24px 20px;
  margin-bottom: 8px;
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 16px 0;
`;

const Description = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.6;
  margin: 0;
`;

const ScheduleCard = styled.div`
  background: ${({ theme }) => theme.colors.gray};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 16px;
  margin-bottom: 16px;
`;

const ScheduleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ScheduleLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ScheduleValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

const ManageButton = styled.button`
  width: 100%;
  padding: 12px;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.white};
  }
`;

const ConsultItem = styled.div`
  padding: 16px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  cursor: pointer;
  transition: all 0.3s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
    margin: 0 -20px;
    padding: 16px 20px;
  }
`;

const ConsultHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
`;

const ConsultPatient = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const ConsultDate = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ConsultType = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

const ServicesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ServiceItem = styled.div`
  background: ${({ theme }) => theme.colors.gray};
  padding: 12px 16px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
`;

const PerfilMedico = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [doctor, setDoctor] = useState(null);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos del doctor
  useEffect(() => {
    const fetchDoctor = async () => {
      setLoading(true);
      try {
        const response = await usuariosService.getById(id);
        if (response.success) {
          setDoctor(response.data?.usuario || response.data);
          // Cargar citas del doctor para hoy
          const today = new Date().toISOString().split('T')[0];
          const citasRes = await citasService.getAll({ doctor_id: id, fecha: today });
          if (citasRes.success) {
            setCitas(citasRes.data?.citas || []);
          }
        } else {
          navigate('/medicos');
        }
      } catch (err) {
        console.error('Error cargando doctor:', err);
        navigate('/medicos');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchDoctor();
  }, [id, navigate]);

  if (loading) {
    return (
      <PageContainer>
        <Header title="Perfil del Médico" showBack />
        <Content>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Loader className="spin" size={32} />
          </div>
        </Content>
      </PageContainer>
    );
  }

  if (!doctor) {
    return (
      <PageContainer>
        <Header title="Perfil del Médico" showBack />
        <Content>
          <p style={{ textAlign: 'center', padding: '60px 0', color: '#6C757D' }}>Médico no encontrado</p>
        </Content>
      </PageContainer>
    );
  }

  const citasPendientes = citas.filter(c => c.estado === 'pendiente' || c.estado === 'confirmada').length;

  return (
    <PageContainer>
      <Header title="Perfil del Médico" showBack />
      
      <Content>
        <ProfileHeader>
          <DoctorImage>
            {doctor.avatar_blob ? (
              <img src={doctor.avatar_blob} alt={`${doctor.nombre} ${doctor.apellidos}`} />
            ) : doctor.avatar_url ? (
              <img src={doctor.avatar_url} alt={`${doctor.nombre} ${doctor.apellidos}`} />
            ) : (
              <User />
            )}
          </DoctorImage>
          <DoctorName>Dr. {doctor.nombre} {doctor.apellidos}</DoctorName>
          <DoctorSpecialty>{doctor.especialidad || 'Médico General'}</DoctorSpecialty>
          <DoctorExperience>{doctor.email}</DoctorExperience>
        </ProfileHeader>

        <Section>
          <SectionTitle>Acerca de</SectionTitle>
          <Description>{doctor.descripcion || 'Sin descripción disponible.'}</Description>
        </Section>

        <Section>
          <SectionTitle>Agenda de Hoy</SectionTitle>
          <ScheduleCard>
            <ScheduleRow>
              <ScheduleLabel>Citas pendientes:</ScheduleLabel>
              <ScheduleValue>{citasPendientes}</ScheduleValue>
            </ScheduleRow>
            <ScheduleRow>
              <ScheduleLabel>Total de citas hoy:</ScheduleLabel>
              <ScheduleValue>{citas.length}</ScheduleValue>
            </ScheduleRow>
          </ScheduleCard>
          <ManageButton onClick={() => navigate(`/gestionar-agenda/${doctor.uuid}`)}>
            <Calendar />
            Gestionar Agenda
          </ManageButton>
        </Section>

        <Section>
          <SectionTitle>Historial de Consultas</SectionTitle>
          {citas.length > 0 ? (
            citas.slice(0, 5).map((cita, index) => (
              <ConsultItem key={cita.uuid || index} onClick={() => navigate(`/detalle-cita/${cita.uuid}`)}>
                <ConsultHeader>
                  <ConsultPatient>{cita.paciente_nombre} {cita.paciente_apellidos}</ConsultPatient>
                  <ChevronRight size={20} color="#6C757D" />
                </ConsultHeader>
                <ConsultDate>{cita.fecha} {cita.hora_inicio?.substring(0, 5)} - {cita.tipo || 'Consulta'}</ConsultDate>
              </ConsultItem>
            ))
          ) : (
            <Description>No hay consultas para hoy.</Description>
          )}
        </Section>

        <Section>
          <SectionTitle>Servicios Ofrecidos</SectionTitle>
          <ManageButton onClick={() => navigate(`/gestion-servicios/${id}`)} style={{ marginTop: '0' }}>
            <Settings />
            Gestionar Servicios
          </ManageButton>
        </Section>
      </Content>
    </PageContainer>
  );
};

export default PerfilMedico;
