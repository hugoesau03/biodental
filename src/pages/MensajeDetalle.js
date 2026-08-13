import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Loader, ChevronRight, User } from 'lucide-react';
import Header from '../components/Layout/Header';
import { chatService } from '../services/api';
import { useAlert } from '../context/AlertContext';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 90px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Bubble = styled.div`
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.4;
  align-self: ${({ $mio }) => ($mio ? 'flex-end' : 'flex-start')};
  background: ${({ $mio, theme }) => ($mio ? theme.colors.primary : theme.colors.white)};
  color: ${({ $mio, theme }) => ($mio ? 'white' : theme.colors.text)};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);

  .hora {
    display: block;
    font-size: 10.5px;
    margin-top: 4px;
    opacity: 0.75;
    text-align: right;
  }
`;

const EmptyChat = styled.div`
  margin: auto;
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 13px;
  padding: 20px;
`;

const InputBar = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.white};
`;

const TextInput = styled.input`
  flex: 1;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: 20px;
  padding: 12px 16px;
  font-size: 14px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};

  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; }
`;

const SendBtn = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const CenteredLoader = styled.div`
  display: flex;
  justify-content: center;
  padding: 60px 0;
`;

const PatientLink = styled.button`
  width: 100%;
  background: ${({ theme }) => theme.colors.white};
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 13.5px;
  font-weight: 600;

  svg:first-child { width: 16px; height: 16px; }
  svg:last-child { width: 16px; height: 16px; margin-left: auto; color: ${({ theme }) => theme.colors.textSecondary}; }
`;

const formatHora = (fecha) => new Date(fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

const MensajeDetalle = () => {
  const { pacienteUuid } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [paciente, setPaciente] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const areaRef = useRef(null);

  const cargar = useCallback(async () => {
    try {
      const res = await chatService.getMensajes(pacienteUuid);
      if (res.success) {
        setPaciente(res.data.paciente);
        setMensajes(res.data.mensajes || []);
      }
    } catch (err) {
      console.error('Error cargando mensajes:', err);
    } finally {
      setLoading(false);
    }
  }, [pacienteUuid]);

  useEffect(() => {
    cargar();
    const timer = setInterval(cargar, 5000);
    return () => clearInterval(timer);
  }, [cargar]);

  useEffect(() => {
    if (areaRef.current) areaRef.current.scrollTop = areaRef.current.scrollHeight;
  }, [mensajes]);

  const handleEnviar = async () => {
    const limpio = texto.trim();
    if (!limpio || enviando) return;
    setEnviando(true);
    setTexto('');
    try {
      await chatService.enviarMensaje(pacienteUuid, limpio);
      await cargar();
    } catch (err) {
      showAlert(err.response?.data?.message || 'No se pudo enviar el mensaje', { tipo: 'error' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <PageContainer>
      <Header title="Mensajes" showBack />
      {paciente && (
        <PatientLink onClick={() => navigate(`/perfil-paciente/${pacienteUuid}`)}>
          <User />
          {paciente.nombre} {paciente.apellidos}
          <ChevronRight />
        </PatientLink>
      )}

      {loading ? (
        <CenteredLoader><Loader style={{ animation: 'spin 1s linear infinite', width: 32, height: 32 }} /></CenteredLoader>
      ) : (
        <MessagesArea ref={areaRef}>
          {mensajes.length === 0 ? (
            <EmptyChat>Aún no hay mensajes con este paciente.</EmptyChat>
          ) : (
            mensajes.map((m) => (
              <Bubble key={m.id} $mio={m.remitente === 'staff'}>
                {m.mensaje}
                <span className="hora">
                  {m.remitente === 'staff' && m.remitente_nombre ? `${m.remitente_nombre} · ` : ''}
                  {formatHora(m.fecha_creacion)}
                </span>
              </Bubble>
            ))
          )}
        </MessagesArea>
      )}

      <InputBar>
        <TextInput
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleEnviar(); }}
          placeholder="Escribe una respuesta..."
        />
        <SendBtn onClick={handleEnviar} disabled={!texto.trim() || enviando}>
          <Send size={18} />
        </SendBtn>
      </InputBar>
    </PageContainer>
  );
};

export default MensajeDetalle;
