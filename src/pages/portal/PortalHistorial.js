import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Calendar, Loader } from 'lucide-react';
import { portalService } from '../../services/api';
import { PortalPage, PortalCard, PortalSectionTitle, PortalEmptyState, PortalBadge } from '../../components/Portal/PortalUI';

const CenteredLoader = styled.div`
  display: flex;
  justify-content: center;
  padding: 40px 0;
`;

const Fecha = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  font-size: 14.5px;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
`;

const Doctor = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 6px;
`;

const Servicios = styled.div`
  font-size: 12.5px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 8px;

  span { color: ${({ theme }) => theme.colors.text}; }
`;

const EstadoColor = {
  completada: 'success',
  cancelada: 'danger',
  no_asistio: 'warning'
};

const formatFecha = (fecha) => {
  const [y, m, d] = String(fecha).substring(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
};

const PortalHistorial = () => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await portalService.getHistorial();
        setCitas(res.data?.citas || []);
      } catch (err) {
        console.error('Error cargando historial:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <PortalPage>
        <CenteredLoader><Loader style={{ animation: 'spin 1s linear infinite', width: 32, height: 32, color: '#33A9FF' }} /></CenteredLoader>
      </PortalPage>
    );
  }

  return (
    <PortalPage>
      <PortalSectionTitle>Tu historial</PortalSectionTitle>
      {citas.length === 0 ? (
        <PortalCard><PortalEmptyState>Todavía no tienes citas pasadas.</PortalEmptyState></PortalCard>
      ) : (
        citas.map((cita) => (
          <PortalCard key={cita.uuid}>
            <Fecha><Calendar size={15} /> {formatFecha(cita.fecha)} · {String(cita.hora_inicio).substring(0, 5)}</Fecha>
            <Doctor>Dr(a). {cita.doctor_nombre} {cita.doctor_apellidos} {cita.especialidad ? `· ${cita.especialidad}` : ''}</Doctor>
            <PortalBadge $color={EstadoColor[cita.estado] || 'info'}>{cita.estado.replace('_', ' ')}</PortalBadge>
            {cita.motivo && <Servicios>Motivo: <span>{cita.motivo}</span></Servicios>}
            {cita.servicios?.length > 0 && (
              <Servicios>Servicios: <span>{cita.servicios.map((s) => s.nombre).join(', ')}</span></Servicios>
            )}
          </PortalCard>
        ))
      )}
    </PortalPage>
  );
};

export default PortalHistorial;
