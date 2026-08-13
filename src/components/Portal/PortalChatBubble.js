import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { MessageCircle, X, Send } from 'lucide-react';
import { portalService } from '../../services/api';
import { useAlert } from '../../context/AlertContext';

const Bubble = styled.button`
  position: fixed;
  right: 18px;
  bottom: calc(84px + env(safe-area-inset-bottom, 0px));
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #33A9FF 0%, #1E88E5 100%);
  border: none;
  box-shadow: 0 4px 14px rgba(30, 136, 229, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 800;

  svg { width: 26px; height: 26px; color: white; }
`;

const Badge = styled.span`
  position: absolute;
  top: -2px;
  right: -2px;
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
  border: 2px solid white;
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
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

const Panel = styled.div`
  background: ${({ theme }) => theme.colors.white};
  width: 100%;
  max-width: 420px;
  height: min(70vh, 560px);
  display: flex;
  flex-direction: column;
  border-radius: 20px 20px 0 0;
  overflow: hidden;

  @media (min-width: 640px) {
    border-radius: 16px;
  }
`;

const PanelHeader = styled.div`
  background: linear-gradient(135deg, #33A9FF 0%, #1E88E5 100%);
  color: white;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;

  h3 { margin: 0; font-size: 15px; }
  span { font-size: 12px; opacity: 0.85; display: block; }
`;

const CloseBtn = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  padding: 6px;
  display: flex;
  cursor: pointer;
  color: white;
`;

const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: ${({ theme }) => theme.colors.background};
`;

const Bubble1 = styled.div`
  max-width: 78%;
  padding: 9px 12px;
  border-radius: 14px;
  font-size: 13.5px;
  line-height: 1.4;
  align-self: ${({ $mio }) => ($mio ? 'flex-end' : 'flex-start')};
  background: ${({ $mio, theme }) => ($mio ? theme.colors.primary : theme.colors.white)};
  color: ${({ $mio, theme }) => ($mio ? 'white' : theme.colors.text)};
  border: ${({ $mio, theme }) => ($mio ? 'none' : `1px solid ${theme.colors.border}`)};

  .hora {
    display: block;
    font-size: 10.5px;
    margin-top: 3px;
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
  display: flex;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.white};
  flex-shrink: 0;
`;

const TextInput = styled.input`
  flex: 1;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: 20px;
  padding: 10px 16px;
  font-size: 14px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};

  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; }
`;

const SendBtn = styled.button`
  width: 40px;
  height: 40px;
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
  svg { width: 18px; height: 18px; }
`;

const formatHora = (fecha) => new Date(fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

const PortalChatBubble = () => {
  const { showAlert } = useAlert();
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [noLeidos, setNoLeidos] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const areaRef = useRef(null);

  const cargarNoLeidos = useCallback(async () => {
    try {
      const res = await portalService.getChatNoLeidos();
      if (res.success) setNoLeidos(res.data.no_leidos);
    } catch (err) {
      // Silencioso: no interrumpir la navegación por un badge que falló
    }
  }, []);

  const cargarMensajes = useCallback(async () => {
    try {
      const res = await portalService.getMisMensajes();
      if (res.success) {
        setMensajes(res.data.mensajes || []);
        setNoLeidos(0);
      }
    } catch (err) {
      console.error('Error cargando chat:', err);
    }
  }, []);

  // Badge de no leídos, revisado periódicamente incluso con el panel cerrado
  useEffect(() => {
    cargarNoLeidos();
    const timer = setInterval(cargarNoLeidos, 20000);
    return () => clearInterval(timer);
  }, [cargarNoLeidos]);

  // Con el panel abierto, refresca la conversación cada 5s
  useEffect(() => {
    if (!abierto) return;
    cargarMensajes();
    const timer = setInterval(cargarMensajes, 5000);
    return () => clearInterval(timer);
  }, [abierto, cargarMensajes]);

  useEffect(() => {
    if (areaRef.current) {
      areaRef.current.scrollTop = areaRef.current.scrollHeight;
    }
  }, [mensajes]);

  const handleEnviar = async () => {
    const texto_limpio = texto.trim();
    if (!texto_limpio || enviando) return;
    setEnviando(true);
    setTexto('');
    try {
      await portalService.enviarMensajeChat(texto_limpio);
      await cargarMensajes();
    } catch (err) {
      showAlert(err.response?.data?.message || 'No se pudo enviar el mensaje', { tipo: 'error' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <Bubble onClick={() => setAbierto(true)} title="Chat con recepción">
        <MessageCircle />
        {noLeidos > 0 && <Badge>{noLeidos > 9 ? '9+' : noLeidos}</Badge>}
      </Bubble>

      {abierto && (
        <Overlay onClick={() => setAbierto(false)}>
          <Panel onClick={(e) => e.stopPropagation()}>
            <PanelHeader>
              <div>
                <h3>Chat con recepción</h3>
                <span>Bio Dental</span>
              </div>
              <CloseBtn onClick={() => setAbierto(false)}><X size={18} /></CloseBtn>
            </PanelHeader>

            <MessagesArea ref={areaRef}>
              {mensajes.length === 0 ? (
                <EmptyChat>Escríbele a recepción si tienes alguna duda. Te responderán aquí mismo.</EmptyChat>
              ) : (
                mensajes.map((m) => (
                  <Bubble1 key={m.id} $mio={m.remitente === 'paciente'}>
                    {m.mensaje}
                    <span className="hora">{formatHora(m.fecha_creacion)}</span>
                  </Bubble1>
                ))
              )}
            </MessagesArea>

            <InputBar>
              <TextInput
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleEnviar(); }}
                placeholder="Escribe un mensaje..."
              />
              <SendBtn onClick={handleEnviar} disabled={!texto.trim() || enviando}>
                <Send />
              </SendBtn>
            </InputBar>
          </Panel>
        </Overlay>
      )}
    </>
  );
};

export default PortalChatBubble;
