import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Loader, Gift, TrendingUp, TrendingDown, Settings2 } from 'lucide-react';
import { portalService } from '../../services/api';
import { PortalPage, PortalCard, PortalSectionTitle, PortalEmptyState } from '../../components/Portal/PortalUI';

const CenteredLoader = styled.div`
  display: flex;
  justify-content: center;
  padding: 40px 0;
`;

const HeroCard = styled(PortalCard)`
  background: linear-gradient(135deg, #33A9FF 0%, #1E88E5 100%);
  color: white;
  text-align: center;
  border: none;
  padding: 28px 18px;

  .icon { margin-bottom: 8px; }
  .value { font-size: 40px; font-weight: 700; line-height: 1; }
  .label { font-size: 13px; opacity: 0.85; margin-top: 6px; }
`;

const MovRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child { border-bottom: none; }

  .icon-wrap {
    width: 34px; height: 34px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: ${({ $positivo, theme }) => ($positivo ? theme.colors.success : theme.colors.danger)};
    svg { width: 16px; height: 16px; color: ${({ $positivo, theme }) => ($positivo ? theme.colors.successText : theme.colors.dangerText)}; }
  }

  .info { flex: 1; }
  .concepto { font-size: 13.5px; color: ${({ theme }) => theme.colors.text}; }
  .fecha { font-size: 11.5px; color: ${({ theme }) => theme.colors.textSecondary}; }
  .puntos {
    font-weight: 700;
    font-size: 14px;
    color: ${({ $positivo, theme }) => ($positivo ? theme.colors.successText : theme.colors.dangerText)};
  }
`;

const tipoIcono = { acumulado: TrendingUp, canjeado: TrendingDown, ajuste: Settings2 };

const PortalRecompensas = () => {
  const [puntos, setPuntos] = useState(0);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await portalService.getRecompensas();
        setPuntos(res.data?.puntos || 0);
        setMovimientos(res.data?.movimientos || []);
      } catch (err) {
        console.error('Error cargando recompensas:', err);
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
      <HeroCard>
        <div className="icon"><Gift size={30} /></div>
        <div className="value">{puntos}</div>
        <div className="label">puntos acumulados</div>
      </HeroCard>

      <PortalSectionTitle>Historial de puntos</PortalSectionTitle>
      {movimientos.length === 0 ? (
        <PortalCard><PortalEmptyState>Gana puntos automáticamente cada vez que pagas tu consulta.</PortalEmptyState></PortalCard>
      ) : (
        <PortalCard>
          {movimientos.map((mov, i) => {
            const Icon = tipoIcono[mov.tipo] || Gift;
            const positivo = mov.puntos >= 0;
            return (
              <MovRow key={i} $positivo={positivo}>
                <div className="icon-wrap"><Icon /></div>
                <div className="info">
                  <div className="concepto">{mov.concepto || mov.tipo}</div>
                  <div className="fecha">{new Date(mov.fecha_creacion).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
                <div className="puntos">{positivo ? '+' : ''}{mov.puntos}</div>
              </MovRow>
            );
          })}
        </PortalCard>
      )}
    </PortalPage>
  );
};

export default PortalRecompensas;
