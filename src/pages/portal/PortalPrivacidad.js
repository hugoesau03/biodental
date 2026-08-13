import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import {
  PageContainer, Content, TopBar, BackButton, Card, HeaderRow, Title,
  Actualizacion, Seccion, SeccionTitulo, Parrafo, Lista, Tabla
} from '../../components/Portal/PortalLegalLayout';

const PortalPrivacidad = () => {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <Content>
        <TopBar>
          <BackButton onClick={() => navigate(-1)} aria-label="Volver">
            <ArrowLeft />
          </BackButton>
        </TopBar>

        <Card>
          <HeaderRow>
            <ShieldCheck />
            <Title>Aviso de Privacidad</Title>
          </HeaderRow>
          <Actualizacion>Portal de Pacientes de Bio Dental — Última actualización: agosto de 2026</Actualizacion>

          <Seccion>
            <SeccionTitulo>1. Identidad y domicilio del responsable</SeccionTitulo>
            <Parrafo>
              <strong>[Razón social / nombre legal de Bio Dental]</strong>, con domicilio en{' '}
              <strong>[dirección completa de la clínica]</strong> ("Bio Dental", "nosotros"), es responsable del
              tratamiento de tus datos personales conforme a la Ley Federal de Protección de Datos Personales en
              Posesión de los Particulares ("la Ley") y su Reglamento.
            </Parrafo>
          </Seccion>

          <Seccion>
            <SeccionTitulo>2. Datos personales que recabamos</SeccionTitulo>
            <Parrafo>Para operar el Portal de Pacientes y brindarte el servicio dental, recabamos:</Parrafo>
            <Lista>
              <li><strong>Datos de identificación y contacto:</strong> nombre, apellidos, fecha de nacimiento,
                teléfono, correo electrónico, dirección, ciudad, código postal.</li>
              <li><strong>Datos de facturación y seguro médico</strong>, cuando aplica.</li>
              <li><strong>Datos personales sensibles relacionados con tu salud:</strong> historial clínico,
                antecedentes, alergias, medicamentos, padecimientos, motivo de consulta, tratamientos, recetas,
                formularios clínicos que completas o que se completan en consultorio, y fotografías o documentos
                clínicos que la clínica adjunte a tu expediente.</li>
              <li><strong>Datos de uso del Portal:</strong> citas reservadas, check-ins, mensajes enviados al equipo
                de recepción, puntos y canjes del programa de recompensas.</li>
            </Lista>
            <Parrafo>
              Los datos de salud son <strong>datos personales sensibles</strong>: su tratamiento indebido podría dar
              origen a discriminación o conllevar un riesgo grave para ti. Por eso te pedimos tu consentimiento
              expreso y por escrito (electrónico) para tratarlos, mismo que otorgas al marcar la casilla
              correspondiente al activar tu acceso al Portal.
            </Parrafo>
          </Seccion>

          <Seccion>
            <SeccionTitulo>3. Finalidades del tratamiento</SeccionTitulo>
            <Parrafo>Utilizamos tus datos personales para las siguientes finalidades, necesarias para el servicio que solicitas ("finalidades primarias"):</Parrafo>
            <Lista>
              <li>Brindarte atención dental y dar seguimiento a tu historial clínico.</li>
              <li>Gestionar la reserva, confirmación, reprogramación y cancelación de tus citas.</li>
              <li>Registrar tu check-in y comunicarnos contigo sobre tu atención (incluyendo mensajes por el Portal
                y confirmaciones/recordatorios de cita por WhatsApp o correo).</li>
              <li>Administrar el programa de recompensas y tus canjes, cuando decidas participar.</li>
              <li>Facturación y cobro de los servicios prestados.</li>
              <li>Cumplir con obligaciones legales y regulatorias aplicables al expediente clínico.</li>
            </Lista>
            <Parrafo>Adicionalmente, y solo si no te opones, podríamos usar tus datos de contacto para ("finalidades secundarias"):</Parrafo>
            <Lista>
              <li>Enviarte promociones, recordatorios de higiene dental o información sobre nuevos servicios.</li>
            </Lista>
            <Parrafo>
              Puedes oponerte a estas finalidades secundarias en cualquier momento, sin que ello afecte el
              tratamiento de tus datos para las finalidades primarias, a través de los medios señalados en la
              Sección 6.
            </Parrafo>
          </Seccion>

          <Seccion>
            <SeccionTitulo>4. Transferencias de datos</SeccionTitulo>
            <Parrafo>
              Como regla general, no transferimos tus datos personales a terceros ajenos a Bio Dental. Compartimos
              información únicamente con proveedores que nos ayudan a operar el Portal, actuando como encargados del
              tratamiento bajo instrucciones nuestras y obligaciones de confidencialidad:
            </Parrafo>
            <Tabla>
              <thead>
                <tr><th>Proveedor / tipo</th><th>Datos compartidos</th><th>Finalidad</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>Proveedor de mensajería de WhatsApp (YCloud)</td>
                  <td>Teléfono, nombre, fecha/hora de la cita, doctor</td>
                  <td>Enviar confirmaciones y recordatorios de cita</td>
                </tr>
                <tr>
                  <td>Proveedor de correo (SMTP)</td>
                  <td>Correo electrónico</td>
                  <td>Notificaciones transaccionales de tu cuenta</td>
                </tr>
                <tr>
                  <td>Proveedor de hospedaje / infraestructura</td>
                  <td>Todos los datos almacenados en el Portal</td>
                  <td>Alojar y respaldar el sistema de forma segura</td>
                </tr>
              </tbody>
            </Tabla>
            <Parrafo>
              No vendemos, rentamos ni compartimos tus datos personales con fines publicitarios de terceros.
              Cualquier otra transferencia distinta a las aquí descritas requerirá tu consentimiento, salvo las
              excepciones previstas en el artículo 37 de la Ley (por ejemplo, requerimiento de autoridad competente).
            </Parrafo>
          </Seccion>

          <Seccion>
            <SeccionTitulo>5. Pacientes menores de edad</SeccionTitulo>
            <Parrafo>
              Cuando el paciente sea menor de edad, los datos personales —incluyendo los de salud— son
              proporcionados y tratados con el consentimiento de su padre, madre o tutor legal, quien es responsable
              de la veracidad de la información y de ejercer, en representación del menor, los derechos descritos en
              este Aviso.
            </Parrafo>
          </Seccion>

          <Seccion>
            <SeccionTitulo>6. Derechos ARCO y revocación del consentimiento</SeccionTitulo>
            <Parrafo>
              Tienes derecho a <strong>Acceder</strong> a tus datos personales y conocer el detalle del tratamiento;
              <strong> Rectificarlos</strong> cuando sean inexactos o estén incompletos; <strong>Cancelarlos</strong> cuando
              consideres que no se requieren para alguna de las finalidades señaladas; y <strong>Oponerte</strong> al
              tratamiento de los mismos para fines específicos (derechos ARCO). También puedes revocar en cualquier
              momento el consentimiento que nos hayas otorgado.
            </Parrafo>
            <Parrafo>
              Para ejercer cualquiera de estos derechos, contáctanos en <strong>[correo de contacto de Bio Dental]</strong>{' '}
              o directamente en el consultorio, indicando tu nombre completo, el derecho que deseas ejercer y
              documentación que acredite tu identidad. Daremos respuesta a tu solicitud dentro de los plazos
              establecidos por la Ley.
            </Parrafo>
          </Seccion>

          <Seccion>
            <SeccionTitulo>7. Cookies y tecnologías similares</SeccionTitulo>
            <Parrafo>
              El Portal utiliza el almacenamiento local de tu navegador (localStorage/sessionStorage) únicamente
              para mantener tu sesión iniciada. No usamos cookies de rastreo publicitario ni compartimos esta
              información con terceros con fines de mercadotecnia.
            </Parrafo>
          </Seccion>

          <Seccion>
            <SeccionTitulo>8. Medidas de seguridad</SeccionTitulo>
            <Parrafo>
              Aplicamos medidas de seguridad administrativas, técnicas y físicas razonables para proteger tus datos
              personales contra daño, pérdida, alteración, destrucción o uso, acceso o tratamiento no autorizado,
              incluyendo cifrado de contraseñas, control de acceso por rol y comunicación cifrada cuando el Portal
              esté publicado con HTTPS. Ningún sistema es 100% infalible; ante cualquier incidente que pudiera
              afectar tus datos, te lo notificaremos conforme a lo previsto por la Ley.
            </Parrafo>
          </Seccion>

          <Seccion>
            <SeccionTitulo>9. Cambios a este Aviso de Privacidad</SeccionTitulo>
            <Parrafo>
              Podemos actualizar este Aviso ante cambios en nuestras prácticas de privacidad, en el Portal o en la
              normativa aplicable. Publicaremos la versión vigente en esta misma página junto con su fecha de
              actualización.
            </Parrafo>
          </Seccion>

          <Seccion>
            <SeccionTitulo>10. Contacto</SeccionTitulo>
            <Parrafo>
              Si tienes dudas sobre este Aviso de Privacidad o sobre el tratamiento de tus datos personales,
              contáctanos en <strong>[correo de contacto de Bio Dental]</strong> o directamente en el consultorio.
            </Parrafo>
          </Seccion>
        </Card>
      </Content>
    </PageContainer>
  );
};

export default PortalPrivacidad;
