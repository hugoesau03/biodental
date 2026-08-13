import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Loader, FileText, ChevronDown, ChevronUp, User, Mail, Phone, Calendar, Hash } from 'lucide-react';
import { portalService } from '../../services/api';
import { PortalPage, PortalCard, PortalSectionTitle, PortalEmptyState } from '../../components/Portal/PortalUI';

const CenteredLoader = styled.div`
  display: flex;
  justify-content: center;
  padding: 40px 0;
`;

const AvatarCard = styled(PortalCard)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const Avatar = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #33A9FF 0%, #1E88E5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;

  svg { width: 30px; height: 30px; color: white; }
`;

const Nombre = styled.div`
  font-size: 17px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;

const Expediente = styled.div`
  font-size: 12.5px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 2px;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 13.5px;
  color: ${({ theme }) => theme.colors.text};

  &:last-child { border-bottom: none; }

  svg { width: 16px; height: 16px; color: ${({ theme }) => theme.colors.textSecondary}; flex-shrink: 0; }
`;

const FormHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;

  .nombre { font-weight: 600; color: ${({ theme }) => theme.colors.text}; font-size: 14px; }
  .fecha { font-size: 12px; color: ${({ theme }) => theme.colors.textSecondary}; }
`;

const FormAnswers = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed ${({ theme }) => theme.colors.border};
`;

const AnswerRow = styled.div`
  font-size: 13px;
  padding: 4px 0;
  color: ${({ theme }) => theme.colors.textSecondary};

  strong { display: block; color: ${({ theme }) => theme.colors.text}; font-size: 12.5px; margin-bottom: 1px; }
`;

const formatFechaHora = (fecha) => {
  if (!fecha) return '';
  return new Date(fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
};

const PortalPerfil = () => {
  const [paciente, setPaciente] = useState(null);
  const [formularios, setFormularios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandidoId, setExpandidoId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [meRes, formsRes] = await Promise.all([
          portalService.getMe(),
          portalService.getFormulariosCompletados()
        ]);
        setPaciente(meRes.data?.paciente || null);
        setFormularios(formsRes.data?.formularios_completados || []);
      } catch (err) {
        console.error('Error cargando perfil:', err);
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

  // Mapa id de campo -> etiqueta, para mostrar las respuestas con su pregunta
  const etiquetasPorFormulario = (form) => {
    const mapa = {};
    (form.formulario_campos || []).forEach((campo) => { mapa[campo.id] = campo.label; });
    return mapa;
  };

  return (
    <PortalPage>
      <PortalSectionTitle>Tu perfil</PortalSectionTitle>

      <AvatarCard>
        <Avatar><User /></Avatar>
        <Nombre>{paciente?.nombre} {paciente?.apellidos}</Nombre>
        {paciente?.numero_expediente && <Expediente>Expediente {paciente.numero_expediente}</Expediente>}
      </AvatarCard>

      <PortalCard>
        {paciente?.email && (
          <InfoRow><Mail /> {paciente.email}</InfoRow>
        )}
        {paciente?.telefono && (
          <InfoRow><Phone /> {paciente.telefono}</InfoRow>
        )}
        {paciente?.fecha_nacimiento && (
          <InfoRow><Calendar /> {formatFechaHora(paciente.fecha_nacimiento)}</InfoRow>
        )}
        {paciente?.consultorio_nombre && (
          <InfoRow><Hash /> {paciente.consultorio_nombre}</InfoRow>
        )}
      </PortalCard>

      <PortalSectionTitle>Tus formularios</PortalSectionTitle>
      {formularios.length === 0 ? (
        <PortalCard><PortalEmptyState>Todavía no tienes formularios llenados.</PortalEmptyState></PortalCard>
      ) : (
        formularios.map((form) => {
          const expandido = expandidoId === form.id;
          const etiquetas = etiquetasPorFormulario(form);
          return (
            <PortalCard key={form.id}>
              <FormHeader onClick={() => setExpandidoId(expandido ? null : form.id)}>
                <div>
                  <div className="nombre"><FileText size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />{form.formulario_nombre}</div>
                  <div className="fecha">{formatFechaHora(form.fecha_completado)}</div>
                </div>
                {expandido ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </FormHeader>

              {expandido && (
                <FormAnswers>
                  {Object.entries(form.datos || {}).map(([campoId, valor]) => (
                    <AnswerRow key={campoId}>
                      <strong>{etiquetas[campoId] || `Campo ${campoId}`}</strong>
                      {typeof valor === 'string' && valor.startsWith('data:image') ? 'Firma/imagen registrada' : String(valor)}
                    </AnswerRow>
                  ))}
                </FormAnswers>
              )}
            </PortalCard>
          );
        })
      )}
    </PortalPage>
  );
};

export default PortalPerfil;
