import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Search, FileText, User, Loader } from 'lucide-react';
import Header from '../components/Layout/Header';
import FloatingButton from '../components/Layout/FloatingButton';
import { presupuestosService } from '../services/api';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding-bottom: 100px;
  overflow-y: auto;
`;

const Content = styled.div`
  padding: 20px;
`;

const SearchBar = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 20px;

  svg {
    position: absolute;
    left: 16px;
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  input {
    width: 100%;
    padding: 14px 16px 14px 48px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 12px;
    font-size: 15px;
    background: ${({ theme }) => theme.colors.white};

    &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; }
    &::placeholder { color: ${({ theme }) => theme.colors.textSecondary}; }
  }
`;

const PresupuestoCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 14px;
  padding: 16px 18px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: transform 0.15s ease;

  &:hover { transform: translateY(-1px); }
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const Folio = styled.span`
  font-size: 12px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.primary}15;
  padding: 4px 10px;
  border-radius: 8px;
`;

const EstadoBadge = styled.span`
  font-size: 11px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  padding: 4px 10px;
  border-radius: 8px;
  text-transform: uppercase;
  background: ${({ $estado }) => {
    switch ($estado) {
      case 'aceptado': return '#DCFCE7';
      case 'rechazado': return '#FEE2E2';
      case 'vencido': return '#F3F4F6';
      default: return '#FEF3C7';
    }
  }};
  color: ${({ $estado }) => {
    switch ($estado) {
      case 'aceptado': return '#16A34A';
      case 'rechazado': return '#DC2626';
      case 'vencido': return '#6B7280';
      default: return '#B45309';
    }
  }};
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  margin-top: 4px;

  svg { width: 14px; height: 14px; color: ${({ theme }) => theme.colors.textSecondary}; flex-shrink: 0; }
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  span:last-child {
    font-size: 16px;
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const FechaText = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${({ theme }) => theme.colors.textSecondary};

  svg { width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.4; }
`;

const estadoLabel = {
  pendiente: 'Pendiente',
  aceptado: 'Aceptado',
  rechazado: 'Rechazado',
  vencido: 'Vencido'
};

const Presupuestos = () => {
  const navigate = useNavigate();
  const [presupuestos, setPresupuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPresupuestos = useCallback(async (term) => {
    setLoading(true);
    try {
      const res = await presupuestosService.getAll(term ? { search: term } : {});
      if (res.success) setPresupuestos(res.data.presupuestos || []);
    } catch (err) {
      console.error('Error cargando presupuestos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => fetchPresupuestos(search), 300);
    return () => clearTimeout(timeout);
  }, [search, fetchPresupuestos]);

  return (
    <PageContainer>
      <Header title="Presupuestos" showBack />
      <Content>
        <SearchBar>
          <Search />
          <input
            type="text"
            placeholder="Buscar por paciente o folio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </SearchBar>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Loader style={{ animation: 'spin 1s linear infinite', width: 28, height: 28 }} />
          </div>
        ) : presupuestos.length === 0 ? (
          <EmptyState>
            <FileText />
            <p>No hay presupuestos registrados</p>
          </EmptyState>
        ) : (
          presupuestos.map((presupuesto) => (
            <PresupuestoCard key={presupuesto.uuid} onClick={() => navigate(`/presupuestos/${presupuesto.uuid}`)}>
              <CardTop>
                <Folio>{presupuesto.numero_presupuesto}</Folio>
                <EstadoBadge $estado={presupuesto.estado}>{estadoLabel[presupuesto.estado] || presupuesto.estado}</EstadoBadge>
              </CardTop>
              <InfoRow>
                <User />
                <span>{presupuesto.paciente_nombre} {presupuesto.paciente_apellidos}</span>
              </InfoRow>
              <TotalRow>
                <FechaText>{new Date(presupuesto.fecha_emision).toLocaleDateString('es-MX')}</FechaText>
                <span>${parseFloat(presupuesto.total).toFixed(2)}</span>
              </TotalRow>
            </PresupuestoCard>
          ))
        )}
      </Content>

      <FloatingButton onClick={() => navigate('/presupuestos/nueva')} />
    </PageContainer>
  );
};

export default Presupuestos;
