import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Loader, Receipt } from 'lucide-react';
import { portalService } from '../../services/api';
import { PortalPage, PortalCard, PortalSectionTitle, PortalEmptyState, PortalBadge } from '../../components/Portal/PortalUI';

const CenteredLoader = styled.div`
  display: flex;
  justify-content: center;
  padding: 40px 0;
`;

const SaldoCard = styled(PortalCard)`
  background: ${({ $adeudo, theme }) => ($adeudo ? theme.colors.warning : theme.colors.success)};
  border: none;
  text-align: center;

  .label { font-size: 12px; color: ${({ theme }) => theme.colors.textSecondary}; margin-bottom: 4px; }
  .value {
    font-size: 26px;
    font-weight: 700;
    color: ${({ $adeudo, theme }) => ($adeudo ? theme.colors.warningText : theme.colors.successText)};
  }
`;

const ReciboHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;

  .numero { font-weight: 600; color: ${({ theme }) => theme.colors.text}; display: flex; align-items: center; gap: 6px; }
  .fecha { font-size: 12px; color: ${({ theme }) => theme.colors.textSecondary}; }
`;

const ItemRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: 3px 0;
`;

const Totales = styled.div`
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed ${({ theme }) => theme.colors.border};

  div { display: flex; justify-content: space-between; font-size: 13.5px; padding: 2px 0; }
  .total { font-weight: 700; color: ${({ theme }) => theme.colors.text}; font-size: 15px; }
  .saldo { color: ${({ theme }) => theme.colors.warningText}; font-weight: 600; }
`;

const money = (n) => `$${parseFloat(n || 0).toFixed(2)}`;

const EstadoColor = { pagado: 'success', pendiente: 'warning', cancelado: 'danger' };

const PortalCuenta = () => {
  const [recibos, setRecibos] = useState([]);
  const [saldoTotal, setSaldoTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await portalService.getCuenta();
        setRecibos(res.data?.recibos || []);
        setSaldoTotal(res.data?.saldo_total || 0);
      } catch (err) {
        console.error('Error cargando estado de cuenta:', err);
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
      <PortalSectionTitle>Estado de cuenta</PortalSectionTitle>

      <SaldoCard $adeudo={saldoTotal > 0}>
        <div className="label">{saldoTotal > 0 ? 'Saldo pendiente' : 'Estás al corriente'}</div>
        <div className="value">{money(saldoTotal)}</div>
      </SaldoCard>

      {recibos.length === 0 ? (
        <PortalCard><PortalEmptyState>Aún no tienes recibos registrados.</PortalEmptyState></PortalCard>
      ) : (
        recibos.map((recibo) => (
          <PortalCard key={recibo.uuid}>
            <ReciboHeader>
              <div className="numero"><Receipt size={15} /> {recibo.numero_recibo}</div>
              <PortalBadge $color={EstadoColor[recibo.estado] || 'info'}>{recibo.estado}</PortalBadge>
            </ReciboHeader>
            <div className="fecha" style={{ marginBottom: 8 }}>
              {new Date(recibo.fecha_emision).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>

            {recibo.items?.map((item, i) => (
              <ItemRow key={i}>
                <span>{item.descripcion} {item.cantidad > 1 ? `x${item.cantidad}` : ''}</span>
                <span>{money(item.total)}</span>
              </ItemRow>
            ))}

            <Totales>
              <div className="total"><span>Total</span><span>{money(recibo.total)}</span></div>
              <div><span>Pagado</span><span>{money(recibo.pagado)}</span></div>
              {recibo.saldo > 0 && <div className="saldo"><span>Saldo</span><span>{money(recibo.saldo)}</span></div>}
            </Totales>
          </PortalCard>
        ))
      )}
    </PortalPage>
  );
};

export default PortalCuenta;
