import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Loader, ChevronLeft, CheckCircle, Stethoscope } from 'lucide-react';
import { portalService } from '../../services/api';
import {
  PortalPage, PortalCard, PortalSectionTitle, PortalEmptyState, PortalButton, PortalInput, PortalLabel, PortalErrorMessage
} from '../../components/Portal/PortalUI';

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

const DoctorOption = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 10px;
  cursor: pointer;

  .avatar {
    width: 42px; height: 42px; border-radius: 50%;
    background: ${({ theme }) => theme.colors.primaryLight};
    display: flex; align-items: center; justify-content: center;
    svg { width: 20px; height: 20px; color: ${({ theme }) => theme.colors.primary}; }
  }
  .nombre { font-weight: 600; color: ${({ theme }) => theme.colors.text}; font-size: 14.5px; }
  .esp { font-size: 12.5px; color: ${({ theme }) => theme.colors.textSecondary}; }
`;

const ServicioOption = styled(DoctorOption)`
  justify-content: space-between;
  align-items: center;

  .precio { font-weight: 700; color: ${({ theme }) => theme.colors.primary}; }
`;

const SlotsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 12px;
`;

const SlotButton = styled.button`
  padding: 10px 4px;
  border-radius: 10px;
  border: 2px solid ${({ $selected, theme }) => ($selected ? theme.colors.primary : theme.colors.border)};
  background: ${({ $selected, theme }) => ($selected ? theme.colors.primaryLight : theme.colors.white)};
  color: ${({ theme }) => theme.colors.text};
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
`;

const SuccessWrap = styled.div`
  text-align: center;
  padding: 40px 16px;
  svg { color: ${({ theme }) => theme.colors.successText}; margin-bottom: 12px; }
  h3 { color: ${({ theme }) => theme.colors.text}; margin: 0 0 8px; }
  p { color: ${({ theme }) => theme.colors.textSecondary}; font-size: 14px; }
`;

const STEPS = { DOCTOR: 0, SERVICIO: 1, FECHA_HORA: 2, CONFIRMAR: 3, EXITO: 4 };

const PortalReservar = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.DOCTOR);
  const [doctores, setDoctores] = useState([]);
  const [loadingDoctores, setLoadingDoctores] = useState(true);

  const [doctor, setDoctor] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [servicio, setServicio] = useState(null);
  const [loadingServicios, setLoadingServicios] = useState(false);

  const [fecha, setFecha] = useState('');
  const [slots, setSlots] = useState([]);
  const [hora, setHora] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await portalService.getDoctores();
        setDoctores(res.data?.doctores || []);
      } catch (err) {
        console.error('Error cargando doctores:', err);
      } finally {
        setLoadingDoctores(false);
      }
    })();
  }, []);

  const elegirDoctor = useCallback(async (d) => {
    setDoctor(d);
    setLoadingServicios(true);
    setStep(STEPS.SERVICIO);
    try {
      const res = await portalService.getServiciosDoctor(d.uuid);
      setServicios(res.data?.servicios || []);
    } catch (err) {
      console.error('Error cargando servicios:', err);
    } finally {
      setLoadingServicios(false);
    }
  }, []);

  const elegirServicio = (s) => {
    setServicio(s);
    setStep(STEPS.FECHA_HORA);
  };

  const cargarDisponibilidad = async (nuevaFecha) => {
    setFecha(nuevaFecha);
    setHora('');
    setSlots([]);
    if (!nuevaFecha) return;
    setLoadingSlots(true);
    try {
      const res = await portalService.getDisponibilidad(doctor.uuid, nuevaFecha);
      setSlots((res.data?.slots || []).filter((s) => s.disponible));
    } catch (err) {
      console.error('Error cargando disponibilidad:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const confirmar = async () => {
    setEnviando(true);
    setError('');
    try {
      await portalService.crearCita({
        doctor_uuid: doctor.uuid,
        fecha,
        hora_inicio: hora,
        motivo: motivo || undefined,
        servicios_uuids: servicio ? [servicio.uuid] : []
      });
      setStep(STEPS.EXITO);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo reservar la cita. Intenta con otro horario.');
    } finally {
      setEnviando(false);
    }
  };

  const minFecha = new Date().toISOString().slice(0, 10);

  if (step === STEPS.EXITO) {
    return (
      <PortalPage>
        <SuccessWrap>
          <CheckCircle size={56} />
          <h3>¡Cita reservada!</h3>
          <p>Te esperamos el {fecha} a las {hora}.</p>
          <PortalButton style={{ marginTop: 20 }} onClick={() => navigate('/portal')}>Ir a inicio</PortalButton>
        </SuccessWrap>
      </PortalPage>
    );
  }

  return (
    <PortalPage>
      <PortalSectionTitle>Reservar cita</PortalSectionTitle>

      {step === STEPS.DOCTOR && (
        loadingDoctores ? (
          <CenteredLoader><Loader style={{ animation: 'spin 1s linear infinite', width: 28, height: 28, color: '#33A9FF' }} /></CenteredLoader>
        ) : doctores.length === 0 ? (
          <PortalCard><PortalEmptyState>No hay doctores disponibles por el momento.</PortalEmptyState></PortalCard>
        ) : (
          doctores.map((d) => (
            <DoctorOption key={d.uuid} onClick={() => elegirDoctor(d)}>
              <div className="avatar"><Stethoscope /></div>
              <div>
                <div className="nombre">Dr(a). {d.nombre} {d.apellidos}</div>
                {d.especialidad && <div className="esp">{d.especialidad}</div>}
              </div>
            </DoctorOption>
          ))
        )
      )}

      {step === STEPS.SERVICIO && (
        <>
          <BackRow onClick={() => setStep(STEPS.DOCTOR)}><ChevronLeft /> Cambiar doctor</BackRow>
          {loadingServicios ? (
            <CenteredLoader><Loader style={{ animation: 'spin 1s linear infinite', width: 28, height: 28, color: '#33A9FF' }} /></CenteredLoader>
          ) : servicios.length === 0 ? (
            <PortalCard>
              <PortalEmptyState>Este doctor no tiene servicios configurados. Puedes continuar y describir el motivo de tu visita.</PortalEmptyState>
              <PortalButton onClick={() => elegirServicio(null)}>Continuar</PortalButton>
            </PortalCard>
          ) : (
            servicios.map((s) => (
              <ServicioOption key={s.uuid} onClick={() => elegirServicio(s)}>
                <div>
                  <div className="nombre">{s.nombre}</div>
                  {s.duracion_minutos && <div className="esp">{s.duracion_minutos} min</div>}
                </div>
                <div className="precio">${parseFloat(s.precio).toFixed(0)}</div>
              </ServicioOption>
            ))
          )}
        </>
      )}

      {step === STEPS.FECHA_HORA && (
        <>
          <BackRow onClick={() => setStep(STEPS.SERVICIO)}><ChevronLeft /> Cambiar servicio</BackRow>
          <PortalCard>
            <PortalLabel>Fecha</PortalLabel>
            <PortalInput type="date" min={minFecha} value={fecha} onChange={(e) => cargarDisponibilidad(e.target.value)} />

            {fecha && (
              loadingSlots ? (
                <CenteredLoader><Loader style={{ animation: 'spin 1s linear infinite', width: 24, height: 24, color: '#33A9FF' }} /></CenteredLoader>
              ) : slots.length === 0 ? (
                <PortalEmptyState>No hay horarios disponibles ese día. Prueba con otra fecha.</PortalEmptyState>
              ) : (
                <SlotsGrid>
                  {slots.map((s) => (
                    <SlotButton key={s.hora} $selected={hora === s.hora} onClick={() => setHora(s.hora)}>
                      {s.hora}
                    </SlotButton>
                  ))}
                </SlotsGrid>
              )
            )}
          </PortalCard>

          {hora && (
            <PortalButton onClick={() => setStep(STEPS.CONFIRMAR)}>Continuar</PortalButton>
          )}
        </>
      )}

      {step === STEPS.CONFIRMAR && (
        <>
          <BackRow onClick={() => setStep(STEPS.FECHA_HORA)}><ChevronLeft /> Cambiar horario</BackRow>
          <PortalCard>
            <PortalLabel>Resumen</PortalLabel>
            <p style={{ fontSize: 14, marginTop: 4 }}>
              Dr(a). {doctor.nombre} {doctor.apellidos}<br />
              {servicio ? `${servicio.nombre} · ` : ''}{fecha} a las {hora}
            </p>

            <PortalLabel>Motivo de la visita (opcional)</PortalLabel>
            <PortalInput
              as="textarea"
              rows={3}
              style={{ resize: 'vertical', paddingTop: 12 }}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Cuéntanos brevemente qué necesitas"
            />
          </PortalCard>

          {error && <PortalErrorMessage>{error}</PortalErrorMessage>}

          <PortalButton disabled={enviando} onClick={confirmar}>
            {enviando ? 'Reservando...' : 'Confirmar cita'}
          </PortalButton>
        </>
      )}
    </PortalPage>
  );
};

export default PortalReservar;
