import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Calendar, Clock, Loader, X, DollarSign } from 'lucide-react';
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

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  /* Deja libre la barra de navegación inferior: el nav queda visible y
     por encima, el modal nunca se dibuja detrás de él. */
  bottom: calc(64px + env(safe-area-inset-bottom, 0px));
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 900;

  @media (min-width: 640px) {
    align-items: center;
  }
`;

const ModalPanel = styled.div`
  background: ${({ theme }) => theme.colors.white};
  width: 100%;
  max-width: 420px;
  max-height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  border-radius: 20px 20px 0 0;
  padding: 20px;

  @media (min-width: 640px) {
    border-radius: 16px;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  h3 { margin: 0; font-size: 17px; color: ${({ theme }) => theme.colors.text}; }
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
`;

const DetailRow = styled.div`
  font-size: 13.5px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ServiciosList = styled.div`
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed ${({ theme }) => theme.colors.border};
`;

const ServicioItem = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 13.5px;
  color: ${({ theme }) => theme.colors.text};
  padding: 4px 0;
`;

const Total = styled.div`
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  font-size: 15px;
  color: ${({ theme }) => theme.colors.text};
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const money = (n) => `$${parseFloat(n || 0).toFixed(2)}`;

const PortalHistorial = () => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);

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
          <PortalCard key={cita.uuid} style={{ cursor: 'pointer' }} onClick={() => setCitaSeleccionada(cita)}>
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

      {citaSeleccionada && (
        <ModalOverlay onClick={() => setCitaSeleccionada(null)}>
          <ModalPanel onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>Detalle de la cita</h3>
              <CloseBtn onClick={() => setCitaSeleccionada(null)}><X size={20} /></CloseBtn>
            </ModalHeader>

            <DetailRow><Calendar size={14} /> {formatFecha(citaSeleccionada.fecha)}</DetailRow>
            <DetailRow><Clock size={14} /> {String(citaSeleccionada.hora_inicio).substring(0, 5)} - {String(citaSeleccionada.hora_fin).substring(0, 5)} hrs</DetailRow>
            <DetailRow>Dr(a). {citaSeleccionada.doctor_nombre} {citaSeleccionada.doctor_apellidos} {citaSeleccionada.especialidad ? `· ${citaSeleccionada.especialidad}` : ''}</DetailRow>
            <DetailRow>
              Estado:
              <PortalBadge $color={EstadoColor[citaSeleccionada.estado] || 'info'}>
                {citaSeleccionada.estado.replace('_', ' ')}
              </PortalBadge>
            </DetailRow>

            {citaSeleccionada.motivo && (
              <DetailRow>Motivo: {citaSeleccionada.motivo}</DetailRow>
            )}

            <ServiciosList>
              <DetailRow style={{ fontWeight: 600, color: 'inherit', marginBottom: 8 }}>Procedimientos</DetailRow>
              {citaSeleccionada.servicios?.length > 0 ? (
                citaSeleccionada.servicios.map((s, i) => (
                  <ServicioItem key={i}>
                    <span>{s.nombre} {s.cantidad > 1 ? `x${s.cantidad}` : ''}</span>
                    <span>{money(s.precio)}</span>
                  </ServicioItem>
                ))
              ) : (
                <ServicioItem><span>Sin procedimientos registrados</span></ServicioItem>
              )}
              <Total>
                <span><DollarSign size={14} style={{ verticalAlign: 'middle' }} /> Costo total</span>
                <span>
                  {money(citaSeleccionada.precio_total)}
                  {parseFloat(citaSeleccionada.precio_total) > 0 && ` · ${citaSeleccionada.pagado ? 'Pagado' : 'Pendiente'}`}
                </span>
              </Total>
            </ServiciosList>
          </ModalPanel>
        </ModalOverlay>
      )}
    </PortalPage>
  );
};

export default PortalHistorial;
