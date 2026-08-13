import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Loader } from 'lucide-react';
import Header from '../components/Layout/Header';
import { chatService } from '../services/api';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding-bottom: 100px;
  overflow-y: auto;
`;

const Content = styled.div`
  padding: 16px 20px;
`;

const ConvoCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
`;

const Avatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
`;

const ConvoInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ConvoNombre = styled.div`
  font-weight: 600;
  font-size: 14.5px;
  color: ${({ theme }) => theme.colors.text};
`;

const ConvoPreview = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ConvoMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
`;

const ConvoHora = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const UnreadBadge = styled.span`
  background: #E53935;
  color: white;
  font-size: 11px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${({ theme }) => theme.colors.textSecondary};

  svg { width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.5; }
`;

const CenteredLoader = styled.div`
  display: flex;
  justify-content: center;
  padding: 60px 0;
`;

const formatHora = (fecha) => {
  const d = new Date(fecha);
  const hoy = new Date();
  const esHoy = d.toDateString() === hoy.toDateString();
  return esHoy
    ? d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
};

const Mensajes = () => {
  const navigate = useNavigate();
  const [conversaciones, setConversaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const res = await chatService.getConversaciones();
      if (res.success) setConversaciones(res.data.conversaciones || []);
    } catch (err) {
      console.error('Error cargando conversaciones:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const timer = setInterval(cargar, 15000);
    return () => clearInterval(timer);
  }, [cargar]);

  return (
    <PageContainer>
      <Header title="Mensajes" showBack />
      <Content>
        {loading ? (
          <CenteredLoader><Loader style={{ animation: 'spin 1s linear infinite', width: 32, height: 32 }} /></CenteredLoader>
        ) : conversaciones.length === 0 ? (
          <EmptyState>
            <MessageCircle />
            <p>Todavía no hay conversaciones con pacientes.</p>
          </EmptyState>
        ) : (
          conversaciones.map((c) => (
            <ConvoCard key={c.paciente_uuid} onClick={() => navigate(`/mensajes/${c.paciente_uuid}`)}>
              <Avatar>{c.paciente_nombre?.[0]?.toUpperCase()}</Avatar>
              <ConvoInfo>
                <ConvoNombre>{c.paciente_nombre} {c.paciente_apellidos}</ConvoNombre>
                <ConvoPreview>
                  {c.ultimo_remitente === 'staff' ? 'Tú: ' : ''}{c.ultimo_mensaje}
                </ConvoPreview>
              </ConvoInfo>
              <ConvoMeta>
                <ConvoHora>{formatHora(c.ultima_fecha)}</ConvoHora>
                {c.no_leidos > 0 && <UnreadBadge>{c.no_leidos}</UnreadBadge>}
              </ConvoMeta>
            </ConvoCard>
          ))
        )}
      </Content>
    </PageContainer>
  );
};

export default Mensajes;
