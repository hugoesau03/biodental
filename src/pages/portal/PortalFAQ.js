import React, { useState } from 'react';
import styled from 'styled-components';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { PortalPage, PortalCard, PortalSectionTitle } from '../../components/Portal/PortalUI';

const IntroCard = styled(PortalCard)`
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #33A9FF 0%, #1E88E5 100%);
  color: white;
  border: none;

  svg { width: 28px; height: 28px; flex-shrink: 0; }
  p { margin: 0; font-size: 13px; opacity: 0.95; }
`;

const QuestionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  gap: 10px;

  span {
    font-weight: 600;
    font-size: 14px;
    color: ${({ theme }) => theme.colors.text};
  }

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const Answer = styled.p`
  margin: 12px 0 0 0;
  font-size: 13.5px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const FAQ_ITEMS = [
  {
    pregunta: '¿Cómo agendo una nueva cita?',
    respuesta: 'Ve a la pestaña "Reservar" en la barra inferior, elige al doctor(a), el servicio que necesitas y un horario disponible.'
  },
  {
    pregunta: '¿Cómo cancelo o reagendo una cita?',
    respuesta: 'En "Inicio", toca la cita que quieres modificar. Se abrirá un panel con las opciones Confirmar, Reagendar, Modificar el motivo y Cancelar.'
  },
  {
    pregunta: '¿Qué es el check-in y cómo lo hago?',
    respuesta: 'El check-in avisa a recepción que ya llegaste a la clínica. El día de tu cita, tócala y verás el botón "Hacer check-in", o muestra el código QR de la cita en recepción para que te registren.'
  },
  {
    pregunta: '¿Qué pasa si llego tarde a mi cita?',
    respuesta: 'Te recomendamos avisar a la clínica lo antes posible. Dependiendo del retraso, es posible que se reagende tu horario con el doctor(a).'
  },
  {
    pregunta: '¿Cómo funcionan los puntos de recompensa?',
    respuesta: 'Ganas puntos cada vez que se paga un tratamiento. Puedes ver tu saldo en la pestaña "Puntos" y canjearlos ahí mismo por productos o servicios disponibles.'
  },
  {
    pregunta: '¿Dónde veo mis formularios y mi expediente?',
    respuesta: 'En la pestaña "Perfil" encuentras tus datos y todos los formularios clínicos que has llenado, con tus respuestas.'
  },
  {
    pregunta: '¿Dónde veo mis recibos y saldo pendiente?',
    respuesta: 'La pestaña "Cuenta" muestra tu estado de cuenta: recibos emitidos, lo pagado y lo pendiente.'
  },
  {
    pregunta: '¿Cómo cambio mi contraseña?',
    respuesta: 'Desde "Perfil" o "Cuenta" puedes actualizar tu contraseña de acceso al portal en cualquier momento.'
  },
  {
    pregunta: '¿Con quién me comunico si tengo otra duda?',
    respuesta: 'Puedes llamar directamente a la clínica o preguntar por WhatsApp; el personal de recepción puede ayudarte con cualquier trámite.'
  }
];

const PortalFAQ = () => {
  const [abiertaIdx, setAbiertaIdx] = useState(null);

  return (
    <PortalPage>
      <PortalSectionTitle>Preguntas frecuentes</PortalSectionTitle>

      <IntroCard>
        <HelpCircle />
        <p>Aquí resolvemos las dudas más comunes sobre citas, check-in, puntos y tu cuenta.</p>
      </IntroCard>

      {FAQ_ITEMS.map((item, idx) => {
        const abierta = abiertaIdx === idx;
        return (
          <PortalCard key={idx}>
            <QuestionHeader onClick={() => setAbiertaIdx(abierta ? null : idx)}>
              <span>{item.pregunta}</span>
              {abierta ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </QuestionHeader>
            {abierta && <Answer>{item.respuesta}</Answer>}
          </PortalCard>
        );
      })}
    </PortalPage>
  );
};

export default PortalFAQ;
