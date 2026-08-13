import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Gift, Loader, Check, X, Phone } from 'lucide-react';
import Header from '../components/Layout/Header';
import { canjesService } from '../services/api';
import { useAlert } from '../context/AlertContext';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding-bottom: 100px;
  overflow-y: auto;
`;

const Content = styled.div`
  padding: 20px;
`;

const Tabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
`;

const Tab = styled.button`
  padding: 8px 14px;
  border-radius: 100px;
  border: 1px solid ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.border)};
  background: ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.white)};
  color: ${({ theme, $active }) => ($active ? 'white' : theme.colors.textSecondary)};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
`;

const CanjeCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 14px;
  padding: 16px 18px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const Producto = styled.div`
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

const TipoTag = styled.span`
  display: inline-block;
  margin-bottom: 4px;
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Puntos = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.primary}15;
  padding: 4px 10px;
  border-radius: 8px;
  white-space: nowrap;
`;

const Paciente = styled.div`
  font-size: 13.5px;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 2px;
`;

const Telefono = styled.div`
  font-size: 12.5px;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 4px;

  svg { width: 12px; height: 12px; }
`;

const Fecha = styled.div`
  font-size: 11.5px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 12px;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: 10px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: ${({ theme, $variant }) => ($variant === 'danger' ? theme.colors.danger : theme.colors.success)};
  color: ${({ theme, $variant }) => ($variant === 'danger' ? theme.colors.dangerText : theme.colors.successText)};

  svg { width: 15px; height: 15px; }
`;

const EstadoTag = styled.span`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 100px;
  background: ${({ theme, $estado }) =>
    $estado === 'entregado' ? theme.colors.success : $estado === 'cancelado' ? theme.colors.danger : theme.colors.warning};
  color: ${({ theme, $estado }) =>
    $estado === 'entregado' ? theme.colors.successText : $estado === 'cancelado' ? theme.colors.dangerText : theme.colors.warningText};
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

const CanjesRecompensas = () => {
  const { showAlert, showConfirm } = useAlert();
  const [canjes, setCanjes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pendiente');
  const [procesandoUuid, setProcesandoUuid] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await canjesService.getAll(tab === 'todos' ? {} : { estado: tab });
      setCanjes(res.data?.canjes || []);
    } catch (err) {
      console.error('Error cargando canjes:', err);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { cargar(); }, [cargar]);

  const entregar = async (canje) => {
    if (!(await showConfirm(`¿Confirmar que se entregó "${canje.item_nombre}" a ${canje.paciente_nombre}?`))) return;
    setProcesandoUuid(canje.uuid);
    try {
      await canjesService.entregar(canje.uuid);
      await cargar();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Error al marcar como entregado', { tipo: 'error' });
    } finally {
      setProcesandoUuid(null);
    }
  };

  const cancelar = async (canje) => {
    const devuelve = canje.tipo === 'servicio' ? 'los puntos' : 'los puntos y el stock';
    if (!(await showConfirm(`¿Cancelar este canje? Se devolverán ${devuelve} al paciente.`))) return;
    setProcesandoUuid(canje.uuid);
    try {
      await canjesService.cancelar(canje.uuid);
      await cargar();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Error al cancelar el canje', { tipo: 'error' });
    } finally {
      setProcesandoUuid(null);
    }
  };

  return (
    <PageContainer>
      <Header title="Canjes de puntos" showBack />
      <Content>
        <Tabs>
          <Tab $active={tab === 'pendiente'} onClick={() => setTab('pendiente')}>Pendientes</Tab>
          <Tab $active={tab === 'entregado'} onClick={() => setTab('entregado')}>Entregados</Tab>
          <Tab $active={tab === 'todos'} onClick={() => setTab('todos')}>Todos</Tab>
        </Tabs>

        {loading ? (
          <CenteredLoader><Loader style={{ animation: 'spin 1s linear infinite', width: 32, height: 32 }} /></CenteredLoader>
        ) : canjes.length === 0 ? (
          <EmptyState>
            <Gift />
            <p>No hay canjes {tab !== 'todos' ? `en estado "${tab}"` : ''}.</p>
          </EmptyState>
        ) : (
          canjes.map((c) => (
            <CanjeCard key={c.uuid}>
              <CardTop>
                <div>
                  <TipoTag>{c.tipo === 'servicio' ? 'Tratamiento' : 'Producto'}</TipoTag>
                  <Producto>{c.item_nombre} {c.cantidad > 1 ? `x${c.cantidad}` : ''}</Producto>
                </div>
                <Puntos>{c.puntos_gastados} pts</Puntos>
              </CardTop>
              <Paciente>{c.paciente_nombre} {c.paciente_apellidos}</Paciente>
              {c.paciente_telefono && <Telefono><Phone /> {c.paciente_telefono}</Telefono>}
              <Fecha>{new Date(c.fecha_creacion).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</Fecha>

              {c.estado === 'pendiente' ? (
                <Actions>
                  <ActionButton onClick={() => entregar(c)} disabled={procesandoUuid === c.uuid}>
                    <Check /> {c.tipo === 'servicio' ? 'Aplicado' : 'Entregar'}
                  </ActionButton>
                  <ActionButton $variant="danger" onClick={() => cancelar(c)} disabled={procesandoUuid === c.uuid}>
                    <X /> Cancelar
                  </ActionButton>
                </Actions>
              ) : (
                <EstadoTag $estado={c.estado}>{c.estado}</EstadoTag>
              )}
            </CanjeCard>
          ))
        )}
      </Content>
    </PageContainer>
  );
};

export default CanjesRecompensas;
