import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Loader, Gift, Package, Stethoscope, ChevronLeft, CheckCircle } from 'lucide-react';
import { portalService } from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import { PortalPage, PortalCard, PortalSectionTitle, PortalEmptyState, PortalBadge } from '../../components/Portal/PortalUI';

const CenteredLoader = styled.div`
  display: flex;
  justify-content: center;
  padding: 40px 0;
`;

const BackRow = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 600;
  font-size: 13.5px;
  cursor: pointer;
  padding: 0 0 12px;
  svg { width: 18px; height: 18px; }
`;

const PointsHeader = styled(PortalCard)`
  background: linear-gradient(135deg, #33A9FF 0%, #1E88E5 100%);
  color: white;
  text-align: center;
  border: none;

  .value { font-size: 30px; font-weight: 700; }
  .label { font-size: 12.5px; opacity: 0.85; }
`;

const ProductRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  .icon {
    width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
    background: ${({ theme }) => theme.colors.primaryLight};
    display: flex; align-items: center; justify-content: center;
    svg { width: 22px; height: 22px; color: ${({ theme }) => theme.colors.primary}; }
  }
  .info { flex: 1; }
  .nombre { font-weight: 600; color: ${({ theme }) => theme.colors.text}; font-size: 14.5px; }
  .desc { font-size: 12px; color: ${({ theme }) => theme.colors.textSecondary}; margin-top: 2px; }
  .puntos { font-weight: 700; color: ${({ theme }) => theme.colors.primary}; font-size: 14px; white-space: nowrap; }
`;

const RedeemButton = styled.button`
  margin-top: 12px;
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  border: none;
  font-weight: 600;
  font-size: 13.5px;
  background: ${({ $disabled, theme }) => ($disabled ? theme.colors.gray : theme.colors.primary)};
  color: ${({ $disabled, theme }) => ($disabled ? theme.colors.textSecondary : 'white')};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
`;

const EstadoColor = { pendiente: 'warning', entregado: 'success', cancelado: 'danger' };

const PortalCanjear = () => {
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useAlert();
  const [productos, setProductos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [canjes, setCanjes] = useState([]);
  const [puntos, setPuntos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [canjeandoUuid, setCanjeandoUuid] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [catalogoRes, recompensasRes, canjesRes] = await Promise.all([
        portalService.getCanjeCatalogo(),
        portalService.getRecompensas(),
        portalService.getMisCanjes()
      ]);
      setProductos(catalogoRes.data?.productos || []);
      setServicios(catalogoRes.data?.servicios || []);
      setPuntos(recompensasRes.data?.puntos || 0);
      setCanjes(canjesRes.data?.canjes || []);
    } catch (err) {
      console.error('Error cargando catálogo de canje:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const canjear = async (item) => {
    if (puntos < item.puntos_precio) return;
    const etiqueta = item.tipo === 'servicio' ? 'tratamiento' : 'producto';
    if (!(await showConfirm(`¿Canjear "${item.nombre}" (${etiqueta}) por ${item.puntos_precio} puntos?`))) return;

    setCanjeandoUuid(item.uuid);
    try {
      const res = await portalService.crearCanje(item.tipo, item.uuid, 1);
      showAlert(res.message || 'Canje realizado', { tipo: 'success' });
      await cargar();
    } catch (err) {
      showAlert(err.response?.data?.message || 'No se pudo realizar el canje', { tipo: 'error' });
    } finally {
      setCanjeandoUuid(null);
    }
  };

  if (loading) {
    return (
      <PortalPage>
        <CenteredLoader><Loader style={{ animation: 'spin 1s linear infinite', width: 32, height: 32, color: '#33A9FF' }} /></CenteredLoader>
      </PortalPage>
    );
  }

  const renderItem = (item, Icon) => {
    const alcanza = puntos >= item.puntos_precio;
    return (
      <PortalCard key={item.uuid}>
        <ProductRow>
          <div className="icon"><Icon /></div>
          <div className="info">
            <div className="nombre">{item.nombre}</div>
            {item.descripcion && <div className="desc">{item.descripcion}</div>}
            {item.tipo === 'servicio' && item.duracion_minutos && <div className="desc">{item.duracion_minutos} min</div>}
          </div>
          <div className="puntos">{item.puntos_precio} pts</div>
        </ProductRow>
        <RedeemButton
          $disabled={!alcanza || canjeandoUuid === item.uuid}
          disabled={!alcanza || canjeandoUuid === item.uuid}
          onClick={() => canjear(item)}
        >
          {canjeandoUuid === item.uuid ? 'Canjeando...' : alcanza ? 'Canjear' : `Te faltan ${item.puntos_precio - puntos} pts`}
        </RedeemButton>
      </PortalCard>
    );
  };

  return (
    <PortalPage>
      <BackRow onClick={() => navigate('/portal/recompensas')}><ChevronLeft /> Regresar</BackRow>

      <PointsHeader>
        <div className="value">{puntos} pts</div>
        <div className="label">disponibles para canjear</div>
      </PointsHeader>

      <PortalSectionTitle>Tratamientos</PortalSectionTitle>
      {servicios.length === 0 ? (
        <PortalCard><PortalEmptyState>Por ahora no hay tratamientos disponibles para canje.</PortalEmptyState></PortalCard>
      ) : (
        servicios.map((s) => renderItem({ ...s, tipo: 'servicio' }, Stethoscope))
      )}

      <PortalSectionTitle>Productos</PortalSectionTitle>
      {productos.length === 0 ? (
        <PortalCard><PortalEmptyState>Por ahora no hay productos disponibles para canje.</PortalEmptyState></PortalCard>
      ) : (
        productos.map((p) => renderItem({ ...p, tipo: 'producto' }, Package))
      )}

      {canjes.length > 0 && (
        <>
          <PortalSectionTitle>Tus canjes</PortalSectionTitle>
          {canjes.map((c) => (
            <PortalCard key={c.uuid}>
              <ProductRow>
                <div className="icon">
                  {c.estado === 'entregado' ? <CheckCircle color="#10B981" /> : <Gift />}
                </div>
                <div className="info">
                  <div className="nombre">{c.item_nombre}</div>
                  <div className="desc">
                    {c.tipo === 'servicio' ? 'Tratamiento' : 'Producto'} · {new Date(c.fecha_creacion).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <PortalBadge $color={EstadoColor[c.estado] || 'info'}>{c.estado}</PortalBadge>
              </ProductRow>
            </PortalCard>
          ))}
        </>
      )}
    </PortalPage>
  );
};

export default PortalCanjear;
