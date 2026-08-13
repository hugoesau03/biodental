import React, { useEffect, useState, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Calendar, Gift, CheckCircle, Loader, X, Clock } from 'lucide-react';
import QRCode from 'qrcode';
import { portalService } from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import {
  PortalPage, PortalCard, PortalSectionTitle, PortalEmptyState, PortalButton, PortalBadge,
  PortalInput, PortalLabel
} from '../../components/Portal/PortalUI';

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

  h3 {
    margin: 0;
    font-size: 17px;
    color: ${({ theme }) => theme.colors.text};
  }
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

const ActionsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
`;

const SlotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 12px;
`;

const SlotButton = styled.button`
  padding: 10px 4px;
  border-radius: 8px;
  border: 1.5px solid ${({ theme, $selected }) => $selected ? theme.colors.primary : theme.colors.border};
  background: ${({ theme, $selected }) => $selected ? theme.colors.primary : theme.colors.white};
  color: ${({ theme, $selected }) => $selected ? 'white' : theme.colors.text};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
`;

const PromoModalImage = styled.img`
  width: 100%;
  border-radius: 12px;
  margin-bottom: 14px;
  display: block;
`;

const PromoModalMensaje = styled.p`
  font-size: 14px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

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

const CarouselWrapper = styled.div`
  margin-bottom: 16px;
`;

const CarouselTrack = styled.div`
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  gap: 10px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const CarouselSlide = styled.div`
  flex: 0 0 100%;
  scroll-snap-align: start;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  aspect-ratio: 16 / 9;
  background: ${({ theme }) => theme.colors.gray};

  img { width: 100%; height: 100%; object-fit: cover; display: block; }
`;

const SlideCaption = styled.div`
  position: absolute;
  left: 0; right: 0; bottom: 0;
  padding: 14px 16px 10px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.65), transparent);
  color: white;
  font-size: 13.5px;
  font-weight: 600;
`;

const CarouselDots = styled.div`
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 8px;
`;

const Dot = styled.button`
  width: ${({ $active }) => ($active ? '18px' : '6px')};
  height: 6px;
  border-radius: 3px;
  border: none;
  background: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.border)};
  cursor: pointer;
  padding: 0;
  transition: width 0.2s ease;
`;

const PortalInicio = () => {
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useAlert();
  const [citas, setCitas] = useState([]);
  const [puntos, setPuntos] = useState(0);
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkinLoadingUuid, setCheckinLoadingUuid] = useState(null);
  const [slideActivo, setSlideActivo] = useState(0);
  const carouselRef = useRef(null);
  const [promoSeleccionada, setPromoSeleccionada] = useState(null);

  // Panel de detalle de una cita (se abre al tocarla)
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [modo, setModo] = useState('ver'); // 'ver' | 'reagendar' | 'modificar'
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotElegido, setSlotElegido] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [nuevoMotivo, setNuevoMotivo] = useState('');
  const [accionLoading, setAccionLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

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
      showAlert(err.response?.data?.message || 'No se pudo registrar el check-in', { tipo: 'error' });
    } finally {
      setCheckinLoadingUuid(null);
    }
  };

  // Promociones con imagen van al carrusel de arriba; las que solo tienen
  // texto se siguen mostrando en la lista de "Promociones" de siempre.
  const banners = promociones.filter((p) => p.imagen_blob);
  const promocionesTexto = promociones.filter((p) => !p.imagen_blob);

  // Autoavance del carrusel cada 5s (se detiene si solo hay un banner)
  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => {
      setSlideActivo((prev) => {
        const siguiente = (prev + 1) % banners.length;
        const track = carouselRef.current;
        if (track) {
          track.scrollTo({ left: siguiente * track.clientWidth, behavior: 'smooth' });
        }
        return siguiente;
      });
    }, 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banners.length]);

  const handleCarouselScroll = () => {
    const track = carouselRef.current;
    if (!track || track.clientWidth === 0) return;
    const idx = Math.round(track.scrollLeft / track.clientWidth);
    setSlideActivo(idx);
  };

  const irASlide = (idx) => {
    const track = carouselRef.current;
    if (track) track.scrollTo({ left: idx * track.clientWidth, behavior: 'smooth' });
  };

  const abrirDetalle = (cita) => {
    setCitaSeleccionada(cita);
    setModo('ver');
    setNuevoMotivo(cita.motivo || '');
    setNuevaFecha('');
    setSlots([]);
    setSlotElegido('');
    setQrDataUrl('');
    QRCode.toDataURL(`BIODENTAL-CITA:${cita.uuid}`, { width: 200, margin: 1 })
      .then(setQrDataUrl)
      .catch((err) => console.error('Error generando QR:', err));
  };

  const cerrarDetalle = () => setCitaSeleccionada(null);

  const handleConfirmar = async () => {
    setAccionLoading(true);
    try {
      const res = await portalService.confirmarCita(citaSeleccionada.uuid);
      if (res.success) {
        await cargar();
        cerrarDetalle();
      } else {
        showAlert(res.message || 'No se pudo confirmar la cita', { tipo: 'error' });
      }
    } catch (err) {
      showAlert(err.response?.data?.message || 'No se pudo confirmar la cita', { tipo: 'error' });
    } finally {
      setAccionLoading(false);
    }
  };

  const handleCancelar = async () => {
    if (!(await showConfirm('¿Seguro que quieres cancelar esta cita?'))) return;
    setAccionLoading(true);
    try {
      const res = await portalService.cancelarCita(citaSeleccionada.uuid);
      if (res.success) {
        await cargar();
        cerrarDetalle();
      } else {
        showAlert(res.message || 'No se pudo cancelar la cita', { tipo: 'error' });
      }
    } catch (err) {
      showAlert(err.response?.data?.message || 'No se pudo cancelar la cita', { tipo: 'error' });
    } finally {
      setAccionLoading(false);
    }
  };

  const handleBuscarSlots = async (fecha) => {
    setNuevaFecha(fecha);
    setSlotElegido('');
    setSlots([]);
    if (!fecha) return;
    setLoadingSlots(true);
    try {
      const res = await portalService.getDisponibilidad(citaSeleccionada.doctor_uuid, fecha);
      setSlots(res.data?.slots || []);
    } catch (err) {
      console.error('Error obteniendo disponibilidad:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleConfirmarReagendar = async () => {
    if (!slotElegido) return;
    setAccionLoading(true);
    try {
      const res = await portalService.actualizarCita(citaSeleccionada.uuid, {
        fecha: nuevaFecha,
        hora_inicio: slotElegido
      });
      if (res.success) {
        await cargar();
        cerrarDetalle();
      } else {
        showAlert(res.message || 'No se pudo reagendar la cita', { tipo: 'error' });
      }
    } catch (err) {
      showAlert(err.response?.data?.message || 'No se pudo reagendar la cita', { tipo: 'error' });
    } finally {
      setAccionLoading(false);
    }
  };

  const handleGuardarMotivo = async () => {
    setAccionLoading(true);
    try {
      const res = await portalService.actualizarCita(citaSeleccionada.uuid, { motivo: nuevoMotivo });
      if (res.success) {
        await cargar();
        cerrarDetalle();
      } else {
        showAlert(res.message || 'No se pudo guardar el cambio', { tipo: 'error' });
      }
    } catch (err) {
      showAlert(err.response?.data?.message || 'No se pudo guardar el cambio', { tipo: 'error' });
    } finally {
      setAccionLoading(false);
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
      {banners.length > 0 && (
        <CarouselWrapper>
          <CarouselTrack ref={carouselRef} onScroll={handleCarouselScroll}>
            {banners.map((promo) => (
              <CarouselSlide key={promo.uuid} onClick={() => setPromoSeleccionada(promo)}>
                <img src={promo.imagen_blob} alt={promo.titulo} />
                <SlideCaption>{promo.titulo}</SlideCaption>
              </CarouselSlide>
            ))}
          </CarouselTrack>
          {banners.length > 1 && (
            <CarouselDots>
              {banners.map((promo, idx) => (
                <Dot key={promo.uuid} $active={idx === slideActivo} onClick={() => irASlide(idx)} />
              ))}
            </CarouselDots>
          )}
        </CarouselWrapper>
      )}

      <PointsCard onClick={() => navigate('/portal/recompensas')}>
        <div>
          <span className="label">Tus puntos Bio Dental</span>
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
          <PortalCard key={cita.uuid} style={{ cursor: 'pointer' }} onClick={() => abrirDetalle(cita)}>
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
                  onClick={(e) => { e.stopPropagation(); handleCheckin(cita.uuid); }}
                >
                  {checkinLoadingUuid === cita.uuid ? 'Registrando...' : 'Hacer check-in'}
                </PortalButton>
              )
            )}
          </PortalCard>
        ))
      )}

      {promocionesTexto.length > 0 && (
        <>
          <PortalSectionTitle>Promociones</PortalSectionTitle>
          {promocionesTexto.map((promo) => (
            <PromoCard key={promo.uuid}>
              <div className="titulo">{promo.titulo}</div>
              <div className="mensaje">{promo.mensaje}</div>
            </PromoCard>
          ))}
        </>
      )}

      <div style={{ height: 8 }} />

      {citaSeleccionada && (
        <ModalOverlay onClick={cerrarDetalle}>
          <ModalPanel onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>Detalle de la cita</h3>
              <CloseBtn onClick={cerrarDetalle}><X size={20} /></CloseBtn>
            </ModalHeader>

            <DetailRow><Calendar size={14} /> {formatFecha(citaSeleccionada.fecha)}</DetailRow>
            <DetailRow><Clock size={14} /> {String(citaSeleccionada.hora_inicio).substring(0, 5)} hrs</DetailRow>
            <DetailRow>Dr(a). {citaSeleccionada.doctor_nombre} {citaSeleccionada.doctor_apellidos}</DetailRow>
            <PortalBadge $color={EstadoColor[citaSeleccionada.estado] || 'info'}>
              {citaSeleccionada.estado.replace('_', ' ')}
            </PortalBadge>

            {modo === 'ver' && (
              <ActionsGrid>
                {citaSeleccionada.estado !== 'cancelada' && qrDataUrl && (
                  <div style={{ textAlign: 'center' }}>
                    <img src={qrDataUrl} alt="Código QR de la cita" style={{ width: 160, height: 160 }} />
                    <PortalEmptyState style={{ marginTop: 4 }}>
                      Muestra este código en recepción para tu check-in
                    </PortalEmptyState>
                  </div>
                )}
                {['programada', 'reprogramada'].includes(citaSeleccionada.estado) && (
                  <PortalButton onClick={handleConfirmar} disabled={accionLoading}>
                    {accionLoading ? 'Guardando...' : 'Confirmar asistencia'}
                  </PortalButton>
                )}
                <PortalButton $variant="secondary" onClick={() => setModo('reagendar')} disabled={accionLoading}>
                  Reagendar
                </PortalButton>
                <PortalButton $variant="secondary" onClick={() => setModo('modificar')} disabled={accionLoading}>
                  Modificar motivo
                </PortalButton>
                <PortalButton
                  $variant="secondary"
                  style={{ borderColor: '#E53935', color: '#E53935' }}
                  onClick={handleCancelar}
                  disabled={accionLoading}
                >
                  Cancelar cita
                </PortalButton>
              </ActionsGrid>
            )}

            {modo === 'reagendar' && (
              <ActionsGrid>
                <div>
                  <PortalLabel>Nueva fecha</PortalLabel>
                  <PortalInput
                    type="date"
                    min={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
                    value={nuevaFecha}
                    onChange={(e) => handleBuscarSlots(e.target.value)}
                  />
                </div>

                {loadingSlots && (
                  <Loader style={{ animation: 'spin 1s linear infinite', width: 24, height: 24, color: '#33A9FF', margin: '0 auto' }} />
                )}

                {!loadingSlots && nuevaFecha && (
                  slots.length === 0 ? (
                    <PortalEmptyState>No hay horarios disponibles ese día.</PortalEmptyState>
                  ) : (
                    <SlotGrid>
                      {slots.map((s) => (
                        <SlotButton
                          key={s.hora}
                          $selected={slotElegido === s.hora}
                          disabled={!s.disponible}
                          onClick={() => setSlotElegido(s.hora)}
                        >
                          {s.hora}
                        </SlotButton>
                      ))}
                    </SlotGrid>
                  )
                )}

                <PortalButton onClick={handleConfirmarReagendar} disabled={!slotElegido || accionLoading}>
                  {accionLoading ? 'Guardando...' : 'Confirmar nuevo horario'}
                </PortalButton>
                <PortalButton $variant="secondary" onClick={() => setModo('ver')} disabled={accionLoading}>
                  Volver
                </PortalButton>
              </ActionsGrid>
            )}

            {modo === 'modificar' && (
              <ActionsGrid>
                <div>
                  <PortalLabel>Motivo de la consulta</PortalLabel>
                  <Textarea value={nuevoMotivo} onChange={(e) => setNuevoMotivo(e.target.value)} />
                </div>
                <PortalButton onClick={handleGuardarMotivo} disabled={accionLoading}>
                  {accionLoading ? 'Guardando...' : 'Guardar cambios'}
                </PortalButton>
                <PortalButton $variant="secondary" onClick={() => setModo('ver')} disabled={accionLoading}>
                  Volver
                </PortalButton>
              </ActionsGrid>
            )}
          </ModalPanel>
        </ModalOverlay>
      )}

      {promoSeleccionada && (
        <ModalOverlay onClick={() => setPromoSeleccionada(null)}>
          <ModalPanel onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>{promoSeleccionada.titulo}</h3>
              <CloseBtn onClick={() => setPromoSeleccionada(null)}><X size={20} /></CloseBtn>
            </ModalHeader>
            {promoSeleccionada.imagen_blob && (
              <PromoModalImage src={promoSeleccionada.imagen_blob} alt={promoSeleccionada.titulo} />
            )}
            <PromoModalMensaje>{promoSeleccionada.mensaje}</PromoModalMensaje>
            {(promoSeleccionada.fecha_inicio || promoSeleccionada.fecha_fin) && (
              <DetailRow style={{ marginTop: 12 }}>
                <Calendar size={14} />
                Vigencia: {promoSeleccionada.fecha_inicio ? formatFecha(promoSeleccionada.fecha_inicio) : '—'} a {promoSeleccionada.fecha_fin ? formatFecha(promoSeleccionada.fecha_fin) : '—'}
              </DetailRow>
            )}
          </ModalPanel>
        </ModalOverlay>
      )}
    </PortalPage>
  );
};

export default PortalInicio;
