import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Calendar, Gift, CheckCircle, Loader } from 'lucide-react';
import { portalService } from '../../services/api';
import {
  PortalPage, PortalCard, PortalSectionTitle, PortalEmptyState, PortalButton, PortalBadge
} from '../../components/Portal/PortalUI';

const PointsCard = styled(PortalCard)`
  background: linear-gradient(135deg, #33A9FF 0%, #1E88E5 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;

  div span { display: block; }
  .label { font-size: 12px; opacity: 0.85; }
  .value { font-size: 26px; font-weight: 700; }
  svg { width: 32px; height: 32px; opacity: 0.9; }
`;

const CitaRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
`;

const CitaInfo = styled.div`
  flex: 1;

  .fecha {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text};
    font-size: 14.5px;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }
  .doctor {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textSecondary};
    margin-bottom: 6px;
  }
`;

const EstadoColor = {
  programada: 'info',
  confirmada: 'success',
  en_progreso: 'warning',
  completada: 'success',
  pendiente_pago: 'warning'
};

const PromoCard = styled(PortalCard)`
  border-left: 4px solid ${({ theme }) => theme.colors.primary};

  .titulo { font-weight: 600; color: ${({ theme }) => theme.colors.text}; margin-bottom: 4px; }
  .mensaje { font-size: 13px; color: ${({ theme }) => theme.colors.textSecondary}; }
`;

const CenteredLoader = styled.div`
  display: flex;
  justify-content: center;
  padding: 40px 0;
`;

const formatFecha = (fecha) => {
  const [y, m, d] = String(fecha).substring(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
};

const esHoy = (fecha) => {
  const hoy = new Date();
  const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  return String(fecha).substring(0, 10) === fechaHoy;
};

const PortalInicio = () => {
  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);
  const [puntos, setPuntos] = useState(0);
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkinLoadingUuid, setCheckinLoadingUuid] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [citasRes, recompensasRes, promosRes] = await Promise.all([
        portalService.getCitas(),
        portalService.getRecompensas(),
        portalService.getPromociones()
      ]);
      setCitas(citasRes.data?.citas || []);
      setPuntos(recompensasRes.data?.puntos || 0);
      setPromociones(promosRes.data?.promociones || []);
    } catch (err) {
      console.error('Error cargando inicio del portal:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCheckin = async (uuid) => {
    setCheckinLoadingUuid(uuid);
    try {
      await portalService.checkin(uuid);
      await cargar();
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo registrar el check-in');
    } finally {
      setCheckinLoadingUuid(null);
    }
  };

  if (loading) {
    return (
      <PortalPage>
        <CenteredLoader>
          <Loader style={{ animation: 'spin 1s linear infinite', width: 32, height: 32, color: '#33A9FF' }} />
        </CenteredLoader>
      </PortalPage>
    );
  }

  return (
    <PortalPage>
      <PointsCard onClick={() => navigate('/portal/recompensas')}>
        <div>
          <span className="label">Tus puntos Biodental</span>
          <span className="value">{puntos} pts</span>
        </div>
        <Gift />
      </PointsCard>

      <PortalSectionTitle>Próximas citas</PortalSectionTitle>
      {citas.length === 0 ? (
        <PortalCard>
          <PortalEmptyState>Aún no tienes citas próximas.</PortalEmptyState>
          <PortalButton onClick={() => navigate('/portal/reservar')}>Reservar una cita</PortalButton>
        </PortalCard>
      ) : (
        citas.map((cita) => (
          <PortalCard key={cita.uuid}>
            <CitaRow>
              <CitaInfo>
                <div className="fecha"><Calendar size={15} /> {formatFecha(cita.fecha)} · {String(cita.hora_inicio).substring(0, 5)}</div>
                <div className="doctor">Dr(a). {cita.doctor_nombre} {cita.doctor_apellidos} {cita.especialidad ? `· ${cita.especialidad}` : ''}</div>
                <PortalBadge $color={EstadoColor[cita.estado] || 'info'}>{cita.estado.replace('_', ' ')}</PortalBadge>
              </CitaInfo>
            </CitaRow>
            {esHoy(cita.fecha) && (
              cita.checkin_at ? (
                <PortalButton disabled style={{ marginTop: 12 }} $variant="secondary">
                  <CheckCircle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  Check-in registrado
                </PortalButton>
              ) : (
                <PortalButton
                  style={{ marginTop: 12 }}
                  disabled={checkinLoadingUuid === cita.uuid}
                  onClick={() => handleCheckin(cita.uuid)}
                >
                  {checkinLoadingUuid === cita.uuid ? 'Registrando...' : 'Hacer check-in'}
                </PortalButton>
              )
            )}
          </PortalCard>
        ))
      )}

      {promociones.length > 0 && (
        <>
          <PortalSectionTitle>Promociones</PortalSectionTitle>
          {promociones.map((promo) => (
            <PromoCard key={promo.uuid}>
              <div className="titulo">{promo.titulo}</div>
              <div className="mensaje">{promo.mensaje}</div>
            </PromoCard>
          ))}
        </>
      )}

      <div style={{ height: 8 }} />
    </PortalPage>
  );
};

export default PortalInicio;
