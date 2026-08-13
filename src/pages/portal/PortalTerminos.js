import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import {
  PageContainer, Content, TopBar, BackButton, Card, HeaderRow, Title,
  Actualizacion, Seccion, SeccionTitulo, Parrafo, Lista
} from '../../components/Portal/PortalLegalLayout';

const PortalTerminos = () => {
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
            <FileText />
            <Title>Términos y Condiciones</Title>
          </HeaderRow>
          <Actualizacion>Portal de Pacientes de Bio Dental — Última actualización: agosto de 2026</Actualizacion>

          <Seccion>
            <SeccionTitulo>1. Aceptación de los términos</SeccionTitulo>
            <Parrafo>
              Al activar tu acceso y utilizar el Portal de Pacientes de Bio Dental ("el Portal"), aceptas quedar
              obligado por estos Términos y Condiciones ("los Términos") y por nuestro{' '}
              <Link to="/portal/privacidad" target="_blank" rel="noopener noreferrer">Aviso de Privacidad</Link>. Si
              no estás de acuerdo con alguna parte de estos Términos, no debes activar tu acceso ni utilizar el
              Portal.
            </Parrafo>
            <Parrafo>
              Estos Términos aplican exclusivamente al uso del Portal como canal digital de la clínica. La relación
              clínica entre tú y el personal de salud que te atiende se rige por el consentimiento informado y demás
              documentos que firmas de manera presencial en el consultorio.
            </Parrafo>
          </Seccion>

          <Seccion>
            <SeccionTitulo>2. Descripción del servicio</SeccionTitulo>
            <Parrafo>
              El Portal es una herramienta digital que permite a los pacientes de Bio Dental, entre otras cosas:
            </Parrafo>
            <Lista>
              <li>Reservar, confirmar y cancelar citas.</li>
              <li>Realizar check-in previo a su consulta.</li>
              <li>Consultar su historial clínico y formularios completados dentro de la clínica.</li>
              <li>Enviar y recibir mensajes con el equipo de recepción.</li>
              <li>Consultar y canjear puntos del programa de recompensas, cuando esté disponible.</li>
              <li>Consultar promociones vigentes.</li>
            </Lista>
            <Parrafo>
              Bio Dental podrá agregar, modificar o retirar funcionalidades del Portal en cualquier momento, sin que
              ello genere responsabilidad alguna frente al paciente, salvo lo dispuesto por la legislación aplicable.
            </Parrafo>
          </Seccion>

          <Seccion>
            <SeccionTitulo>3. Registro y cuenta de usuario</SeccionTitulo>
            <Parrafo>
              El acceso al Portal se activa verificando el teléfono y la fecha de nacimiento previamente registrados
              por la clínica, y definiendo una contraseña personal. Eres responsable de:
            </Parrafo>
            <Lista>
              <li>Proporcionar información veraz y mantenerla actualizada ante la clínica.</li>
              <li>Mantener la confidencialidad de tu contraseña y no compartirla con terceros.</li>
              <li>Notificar de inmediato a la clínica cualquier uso no autorizado de tu cuenta.</li>
              <li>Toda actividad realizada desde tu cuenta, salvo que notifiques oportunamente un acceso indebido.</li>
            </Lista>
            <Parrafo>
              Bio Dental podrá suspender o cancelar el acceso al Portal cuando existan motivos razonables para
              sospechar un uso indebido, fraudulento o contrario a estos Términos.
            </Parrafo>
          </Seccion>

          <Seccion>
            <SeccionTitulo>4. Uso aceptable</SeccionTitulo>
            <Parrafo>Al usar el Portal, te comprometes a no:</Parrafo>
            <Lista>
              <li>Proporcionar información falsa o suplantar la identidad de otra persona.</li>
              <li>Intentar acceder a cuentas, datos o áreas del sistema que no te correspondan.</li>
              <li>Interferir con el funcionamiento normal del Portal (incluyendo intentos de sobrecarga, ingeniería
                inversa o explotación de vulnerabilidades).</li>
              <li>Usar el Portal con fines distintos a la gestión de tu propia atención dental.</li>
            </Lista>
          </Seccion>

          <Seccion>
            <SeccionTitulo>5. Citas, cancelaciones e inasistencias</SeccionTitulo>
            <Parrafo>
              Reservar una cita a través del Portal está sujeto a la disponibilidad real del consultorio y puede
              requerir confirmación por parte del personal de recepción. Te pedimos cancelar o reprogramar con la
              mayor anticipación posible cuando no puedas asistir. La clínica podrá aplicar sus políticas internas de
              inasistencias reiteradas o cancelaciones tardías, mismas que te serán informadas en el consultorio.
            </Parrafo>
          </Seccion>

          <Seccion>
            <SeccionTitulo>6. Programa de recompensas</SeccionTitulo>
            <Parrafo>
              Los puntos que acumules a través del programa de recompensas no tienen valor monetario, no son
              transferibles ni canjeables por efectivo, y su vigencia, forma de acumulación y catálogo de canje
              pueden cambiar en cualquier momento a criterio de Bio Dental. El saldo de puntos mostrado en el Portal
              es informativo; en caso de discrepancia, prevalece el registro interno de la clínica.
            </Parrafo>
          </Seccion>

          <Seccion>
            <SeccionTitulo>7. Privacidad y protección de datos personales</SeccionTitulo>
            <Parrafo>
              Para operar el Portal tratamos tus datos de identificación y contacto, así como datos relacionados con
              tu salud (historial clínico, formularios, tratamientos), estos últimos considerados datos personales
              sensibles conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares
              y su Reglamento. Estos datos se utilizan únicamente para brindarte el servicio dental, dar seguimiento
              a tu atención y operar las funcionalidades del Portal descritas en la Sección 2.
            </Parrafo>
            <Parrafo>
              Tienes derecho a acceder, rectificar y cancelar tus datos personales, así como a oponerte a su
              tratamiento (derechos ARCO), a través de los medios de contacto señalados en la Sección 12. El detalle
              completo del tratamiento de tus datos —incluyendo finalidades, transferencias y cómo ejercer tus
              derechos ARCO— se encuentra en nuestro{' '}
              <Link to="/portal/privacidad" target="_blank" rel="noopener noreferrer">Aviso de Privacidad</Link>.
            </Parrafo>
          </Seccion>

          <Seccion>
            <SeccionTitulo>8. Naturaleza del servicio digital</SeccionTitulo>
            <Parrafo>
              El Portal es un canal administrativo y de comunicación; no sustituye una consulta, diagnóstico o
              tratamiento dental presencial. Ningún contenido del Portal (incluyendo mensajes de chat) debe
              interpretarse como una indicación clínica. Ante cualquier urgencia dental o de salud, contacta
              directamente a la clínica o acude al servicio de urgencias correspondiente.
            </Parrafo>
          </Seccion>

          <Seccion>
            <SeccionTitulo>9. Propiedad intelectual</SeccionTitulo>
            <Parrafo>
              El software, diseño, marca, logotipos y demás elementos del Portal son propiedad de Bio Dental o de sus
              licenciantes. Estos Términos no te otorgan ningún derecho de propiedad intelectual sobre el Portal,
              únicamente una licencia limitada, personal, no exclusiva e intransferible para usarlo conforme a lo
              aquí establecido.
            </Parrafo>
          </Seccion>

          <Seccion>
            <SeccionTitulo>10. Limitación de responsabilidad</SeccionTitulo>
            <Parrafo>
              El Portal se proporciona "tal cual" y "según disponibilidad". En la medida permitida por la ley
              aplicable, Bio Dental no garantiza que el Portal esté libre de interrupciones o errores, y no será
              responsable por daños indirectos derivados del uso o la imposibilidad de uso del Portal, salvo en los
              casos en que la legislación aplicable no permita dicha limitación (por ejemplo, negligencia médica
              acreditada, que se rige por las normas sanitarias correspondientes y no por estos Términos).
            </Parrafo>
          </Seccion>

          <Seccion>
            <SeccionTitulo>11. Modificaciones a estos términos</SeccionTitulo>
            <Parrafo>
              Podemos actualizar estos Términos en cualquier momento para reflejar cambios en el Portal o en la
              normativa aplicable. Publicaremos la versión vigente en esta misma página con su fecha de
              actualización. El uso continuado del Portal después de una modificación implica la aceptación de los
              Términos actualizados.
            </Parrafo>
          </Seccion>

          <Seccion>
            <SeccionTitulo>12. Contacto</SeccionTitulo>
            <Parrafo>
              Para dudas sobre estos Términos, sobre el tratamiento de tus datos personales o para ejercer tus
              derechos ARCO, contáctanos directamente en la clínica o a través de los medios de contacto que
              Bio Dental tenga publicados.
            </Parrafo>
          </Seccion>
        </Card>
      </Content>
    </PageContainer>
  );
};

export default PortalTerminos;
