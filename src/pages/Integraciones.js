import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { MessageCircle, Phone, Globe, FileText, Shield, Link2, Loader, Key, Cpu, HelpCircle } from 'lucide-react';
import Header from '../components/Layout/Header';
import { useAuth } from '../context/AuthContext';
import { consultorioService, googleCalendarService, API_URL } from '../services/api';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding-bottom: 80px;
  overflow-y: auto;
`;

const Section = styled.section`
  background: ${({ theme }) => theme.colors.white};
  margin-top: 12px;
`;

const SectionTitle = styled.h3`
  font-size: 13px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 16px 20px 8px;
  margin: 0;
`;

const FormGroup = styled.div`
  padding: 0 20px 16px;
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  gap: 10px;
  flex-wrap: wrap;

  &:last-child {
    border-bottom: none;
  }

  svg {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.textSecondary};
    flex-shrink: 0;
  }

  @media (max-width: 400px) {
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
`;

const InputLabel = styled.label`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  min-width: 120px;
  flex-shrink: 0;

  @media (max-width: 400px) {
    min-width: auto;
  }
`;

const Input = styled.input`
  flex: 1;
  border: none;
  font-size: 15px;
  color: ${({ theme }) => theme.colors.text};
  background: transparent;
  text-align: right;
  min-width: 0;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  @media (max-width: 400px) {
    text-align: center;
    width: 100%;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${({ theme }) => theme.colors.textSecondary};

  svg { width: 40px; height: 40px; margin-bottom: 12px; opacity: 0.4; }
`;

const Integraciones = () => {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';

  const [loading, setLoading] = useState(true);

  // WhatsApp (YCloud)
  const [whatsappConfig, setWhatsappConfig] = useState(null);
  const [whatsappForm, setWhatsappForm] = useState({
    apiKeyInput: '',
    whatsappFrom: '',
    prefijoPais: '+52',
    templateConfirmacion: '',
    templateRecordatorio: '',
    templateLang: 'es_MX',
    webhookSecretInput: ''
  });
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [whatsappSaveMessage, setWhatsappSaveMessage] = useState(null);

  // Asistente de WhatsApp con IA (GPT/OpenAI) — el agente Python
  // (whatsapp-agentkit) lee esta configuración de aquí en vez de un .env.
  const [asistenteIAConfig, setAsistenteIAConfig] = useState(null);
  const [asistenteIAForm, setAsistenteIAForm] = useState({ apiKeyInput: '', modelo: 'gpt-4.1' });
  const [savingAsistenteIA, setSavingAsistenteIA] = useState(false);
  const [asistenteIASaveMessage, setAsistenteIASaveMessage] = useState(null);

  // Google Calendar — credenciales OAuth de la app (globales a la instalación)
  const [googleAppConfig, setGoogleAppConfig] = useState(null);
  const [googleAppForm, setGoogleAppForm] = useState({ clientId: '', clientSecretInput: '', redirectUri: '' });
  const [savingGoogleApp, setSavingGoogleApp] = useState(false);
  const [googleAppSaveMessage, setGoogleAppSaveMessage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAdmin) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const whatsappRes = await consultorioService.getWhatsappConfig();
        if (whatsappRes.success) {
          setWhatsappConfig(whatsappRes.data);
          setWhatsappForm({
            apiKeyInput: '',
            whatsappFrom: whatsappRes.data.whatsapp_from || '',
            prefijoPais: whatsappRes.data.prefijo_pais || '+52',
            templateConfirmacion: whatsappRes.data.template_confirmacion || '',
            templateRecordatorio: whatsappRes.data.template_recordatorio || '',
            templateLang: whatsappRes.data.template_lang || 'es_MX',
            webhookSecretInput: ''
          });
        }
      } catch (err) {
        console.error('Error cargando configuración de WhatsApp:', err);
      }

      try {
        const asistenteRes = await consultorioService.getAsistenteIAConfig();
        if (asistenteRes.success) {
          setAsistenteIAConfig(asistenteRes.data);
          setAsistenteIAForm({ apiKeyInput: '', modelo: asistenteRes.data.modelo || 'gpt-4.1' });
        }
      } catch (err) {
        console.error('Error cargando configuración del asistente de WhatsApp:', err);
      }

      try {
        const googleAppRes = await googleCalendarService.getConfig();
        if (googleAppRes.success) {
          setGoogleAppConfig(googleAppRes.data);
          setGoogleAppForm({
            clientId: googleAppRes.data.client_id || '',
            clientSecretInput: '',
            redirectUri: googleAppRes.data.redirect_uri || googleAppRes.data.redirect_uri_sugerido || `${API_URL}/google-calendar/callback`
          });
        }
      } catch (err) {
        console.error('Error cargando credenciales de Google Calendar:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  const handleWhatsappFormChange = (field, value) => {
    setWhatsappForm(prev => ({ ...prev, [field]: value }));
    setWhatsappSaveMessage(null);
  };

  const handleSaveWhatsapp = async () => {
    setSavingWhatsapp(true);
    setWhatsappSaveMessage(null);
    try {
      const response = await consultorioService.updateWhatsappConfig({
        api_key: whatsappForm.apiKeyInput || undefined,
        whatsapp_from: whatsappForm.whatsappFrom,
        prefijo_pais: whatsappForm.prefijoPais,
        template_confirmacion: whatsappForm.templateConfirmacion,
        template_recordatorio: whatsappForm.templateRecordatorio,
        template_lang: whatsappForm.templateLang,
        webhook_secret: whatsappForm.webhookSecretInput || undefined
      });

      if (response.success) {
        const whatsappRes = await consultorioService.getWhatsappConfig();
        if (whatsappRes.success) {
          setWhatsappConfig(whatsappRes.data);
          setWhatsappForm(prev => ({ ...prev, apiKeyInput: '', webhookSecretInput: '' }));
        }
        setWhatsappSaveMessage({ success: true, text: 'Configuración de WhatsApp guardada' });
      } else {
        setWhatsappSaveMessage({ success: false, text: response.message || 'Error al guardar' });
      }
    } catch (error) {
      console.error('Error guardando configuración de WhatsApp:', error);
      setWhatsappSaveMessage({
        success: false,
        text: error.response?.data?.message || 'Error al guardar la configuración de WhatsApp'
      });
    } finally {
      setSavingWhatsapp(false);
    }
  };

  const handleClearWhatsappKey = async () => {
    setSavingWhatsapp(true);
    setWhatsappSaveMessage(null);
    try {
      await consultorioService.updateWhatsappConfig({ clear_api_key: true });
      const whatsappRes = await consultorioService.getWhatsappConfig();
      if (whatsappRes.success) {
        setWhatsappConfig(whatsappRes.data);
        setWhatsappForm(prev => ({ ...prev, apiKeyInput: '' }));
      }
      setWhatsappSaveMessage({ success: true, text: 'Clave eliminada' });
    } catch (error) {
      console.error('Error eliminando clave de WhatsApp:', error);
      setWhatsappSaveMessage({ success: false, text: 'Error al eliminar la clave' });
    } finally {
      setSavingWhatsapp(false);
    }
  };

  const handleClearWebhookSecret = async () => {
    setSavingWhatsapp(true);
    setWhatsappSaveMessage(null);
    try {
      await consultorioService.updateWhatsappConfig({ clear_webhook_secret: true });
      const whatsappRes = await consultorioService.getWhatsappConfig();
      if (whatsappRes.success) {
        setWhatsappConfig(whatsappRes.data);
        setWhatsappForm(prev => ({ ...prev, webhookSecretInput: '' }));
      }
      setWhatsappSaveMessage({ success: true, text: 'Secreto de webhook eliminado' });
    } catch (error) {
      console.error('Error eliminando el secreto de webhook:', error);
      setWhatsappSaveMessage({ success: false, text: 'Error al eliminar el secreto de webhook' });
    } finally {
      setSavingWhatsapp(false);
    }
  };

  const handleAsistenteIAFormChange = (field, value) => {
    setAsistenteIAForm(prev => ({ ...prev, [field]: value }));
    setAsistenteIASaveMessage(null);
  };

  const handleSaveAsistenteIA = async () => {
    setSavingAsistenteIA(true);
    setAsistenteIASaveMessage(null);
    try {
      const response = await consultorioService.updateAsistenteIAConfig({
        api_key: asistenteIAForm.apiKeyInput || undefined,
        modelo: asistenteIAForm.modelo
      });

      if (response.success) {
        const asistenteRes = await consultorioService.getAsistenteIAConfig();
        if (asistenteRes.success) {
          setAsistenteIAConfig(asistenteRes.data);
          setAsistenteIAForm(prev => ({ ...prev, apiKeyInput: '' }));
        }
        setAsistenteIASaveMessage({ success: true, text: 'Configuración del asistente guardada' });
      } else {
        setAsistenteIASaveMessage({ success: false, text: response.message || 'Error al guardar' });
      }
    } catch (error) {
      console.error('Error guardando configuración del asistente de WhatsApp:', error);
      setAsistenteIASaveMessage({
        success: false,
        text: error.response?.data?.message || 'Error al guardar la configuración del asistente'
      });
    } finally {
      setSavingAsistenteIA(false);
    }
  };

  const handleClearAsistenteIAKey = async () => {
    setSavingAsistenteIA(true);
    setAsistenteIASaveMessage(null);
    try {
      await consultorioService.updateAsistenteIAConfig({ clear_api_key: true });
      const asistenteRes = await consultorioService.getAsistenteIAConfig();
      if (asistenteRes.success) {
        setAsistenteIAConfig(asistenteRes.data);
        setAsistenteIAForm(prev => ({ ...prev, apiKeyInput: '' }));
      }
      setAsistenteIASaveMessage({ success: true, text: 'Clave eliminada' });
    } catch (error) {
      console.error('Error eliminando clave del asistente:', error);
      setAsistenteIASaveMessage({ success: false, text: 'Error al eliminar la clave' });
    } finally {
      setSavingAsistenteIA(false);
    }
  };

  const handleGoogleAppFormChange = (field, value) => {
    setGoogleAppForm(prev => ({ ...prev, [field]: value }));
    setGoogleAppSaveMessage(null);
  };

  const handleSaveGoogleAppConfig = async () => {
    setSavingGoogleApp(true);
    setGoogleAppSaveMessage(null);
    try {
      const response = await googleCalendarService.updateConfig({
        client_id: googleAppForm.clientId,
        client_secret: googleAppForm.clientSecretInput || undefined,
        redirect_uri: googleAppForm.redirectUri
      });

      if (response.success) {
        const refreshed = await googleCalendarService.getConfig();
        if (refreshed.success) {
          setGoogleAppConfig(refreshed.data);
          setGoogleAppForm({
            clientId: refreshed.data.client_id || '',
            clientSecretInput: '',
            redirectUri: refreshed.data.redirect_uri || googleAppForm.redirectUri
          });
        }
        setGoogleAppSaveMessage({ success: true, text: 'Credenciales de Google Calendar guardadas' });
      } else {
        setGoogleAppSaveMessage({ success: false, text: response.message || 'Error al guardar' });
      }
    } catch (error) {
      setGoogleAppSaveMessage({
        success: false,
        text: error.response?.data?.message || 'Error al guardar las credenciales'
      });
    } finally {
      setSavingGoogleApp(false);
    }
  };

  const handleClearGoogleAppSecret = async () => {
    setSavingGoogleApp(true);
    setGoogleAppSaveMessage(null);
    try {
      await googleCalendarService.updateConfig({ clear_secret: true });
      const refreshed = await googleCalendarService.getConfig();
      if (refreshed.success) {
        setGoogleAppConfig(refreshed.data);
        setGoogleAppForm(prev => ({ ...prev, clientSecretInput: '' }));
      }
      setGoogleAppSaveMessage({ success: true, text: 'Client Secret eliminado' });
    } catch (error) {
      console.error('Error eliminando Client Secret de Google:', error);
      setGoogleAppSaveMessage({ success: false, text: 'Error al eliminar el Client Secret' });
    } finally {
      setSavingGoogleApp(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Header title="Integraciones" showBack />
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Loader style={{ animation: 'spin 1s linear infinite', width: 32, height: 32, color: '#6366F1' }} />
        </div>
      </PageContainer>
    );
  }

  if (!isAdmin) {
    return (
      <PageContainer>
        <Header title="Integraciones" showBack />
        <EmptyState>
          <Shield />
          <p>Solo los administradores pueden configurar las integraciones.</p>
        </EmptyState>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header title="Integraciones" showBack />

      {whatsappConfig && (
        <Section>
          <SectionTitle>WhatsApp (YCloud)</SectionTitle>
          <FormGroup>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0' }}>
              <span style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: whatsappConfig.configurado ? '#22C55E' : '#D1D5DB'
              }} />
              <span style={{ fontSize: 14, color: whatsappConfig.configurado ? '#16A34A' : '#6B7280' }}>
                {whatsappConfig.configurado
                  ? `Configurado (clave termina en ${whatsappConfig.api_key_preview?.slice(-4) || '****'})`
                  : 'No configurado — las confirmaciones y recordatorios por WhatsApp están deshabilitados'}
              </span>
            </div>

            <InputRow>
              <MessageCircle />
              <InputLabel>API Key</InputLabel>
              <Input
                type="password"
                value={whatsappForm.apiKeyInput}
                onChange={(e) => handleWhatsappFormChange('apiKeyInput', e.target.value)}
                placeholder={whatsappConfig.configurado ? whatsappConfig.api_key_preview : 'Clave de YCloud'}
              />
            </InputRow>
            <InputRow>
              <Phone />
              <InputLabel>Número emisor</InputLabel>
              <Input
                type="text"
                value={whatsappForm.whatsappFrom}
                onChange={(e) => handleWhatsappFormChange('whatsappFrom', e.target.value)}
                placeholder="+5215512345678"
              />
            </InputRow>
            <InputRow>
              <Globe />
              <InputLabel>Prefijo país</InputLabel>
              <Input
                type="text"
                value={whatsappForm.prefijoPais}
                onChange={(e) => handleWhatsappFormChange('prefijoPais', e.target.value)}
                placeholder="+52"
              />
            </InputRow>
            <InputRow>
              <FileText />
              <InputLabel>Plantilla confirmación</InputLabel>
              <Input
                type="text"
                value={whatsappForm.templateConfirmacion}
                onChange={(e) => handleWhatsappFormChange('templateConfirmacion', e.target.value)}
                placeholder="Opcional"
              />
            </InputRow>
            <InputRow>
              <FileText />
              <InputLabel>Plantilla recordatorio</InputLabel>
              <Input
                type="text"
                value={whatsappForm.templateRecordatorio}
                onChange={(e) => handleWhatsappFormChange('templateRecordatorio', e.target.value)}
                placeholder="Opcional"
              />
            </InputRow>
            <InputRow>
              <Key />
              <InputLabel>Secreto de webhook</InputLabel>
              <Input
                type="password"
                value={whatsappForm.webhookSecretInput}
                onChange={(e) => handleWhatsappFormChange('webhookSecretInput', e.target.value)}
                placeholder={whatsappConfig.webhook_secret_configurado ? whatsappConfig.webhook_secret_preview : 'Solo si usas el asistente con IA'}
              />
            </InputRow>

            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '10px 0 0' }}>
              La API Key y el número se obtienen en tu cuenta de{' '}
              <a href="https://www.ycloud.com" target="_blank" rel="noopener noreferrer" style={{ color: '#6366F1' }}>ycloud.com</a>.
              Sin plantillas aprobadas, solo se puede enviar dentro de las 24h desde el último mensaje del paciente.
              Deja el campo de API Key en blanco para conservar la clave guardada.
              El secreto de webhook solo es necesario si activas el{' '}
              <a href="#asistente-ia" style={{ color: '#6366F1' }}>asistente de WhatsApp con IA</a> — lo genera
              YCloud al configurar el endpoint de webhook, y sirve para verificar que los mensajes entrantes
              realmente vengan de ellos.
            </p>

            {whatsappConfig.webhook_secret_configurado && (
              <div style={{ marginTop: 4 }}>
                <button
                  type="button"
                  onClick={handleClearWebhookSecret}
                  disabled={savingWhatsapp}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid #FCA5A5',
                    background: 'white',
                    color: '#DC2626',
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: savingWhatsapp ? 'not-allowed' : 'pointer'
                  }}
                >
                  Quitar secreto de webhook
                </button>
              </div>
            )}

            {whatsappSaveMessage && (
              <p style={{
                fontSize: 13,
                marginTop: 10,
                color: whatsappSaveMessage.success ? '#16A34A' : '#DC2626'
              }}>
                {whatsappSaveMessage.text}
              </p>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button
                type="button"
                onClick={handleSaveWhatsapp}
                disabled={savingWhatsapp}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#6366F1',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: savingWhatsapp ? 'not-allowed' : 'pointer',
                  opacity: savingWhatsapp ? 0.6 : 1
                }}
              >
                {savingWhatsapp ? 'Guardando...' : 'Guardar Configuración'}
              </button>
              {whatsappConfig.configurado && (
                <button
                  type="button"
                  onClick={handleClearWhatsappKey}
                  disabled={savingWhatsapp}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: '1px solid #FCA5A5',
                    background: 'white',
                    color: '#DC2626',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: savingWhatsapp ? 'not-allowed' : 'pointer'
                  }}
                >
                  Quitar clave
                </button>
              )}
            </div>
          </FormGroup>
        </Section>
      )}

      {asistenteIAConfig && (
        <Section id="asistente-ia">
          <SectionTitle>Asistente de WhatsApp con IA</SectionTitle>
          <FormGroup>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '4px 0 12px' }}>
              Le da cerebro (GPT) al agente de WhatsApp que responde preguntas, agenda,
              confirma, reagenda y cancela citas por su cuenta. Usa el mismo número y cuenta
              de YCloud configurados arriba — solo necesita, además, tu clave de OpenAI.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0' }}>
              <span style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: asistenteIAConfig.configurado ? '#22C55E' : '#D1D5DB'
              }} />
              <span style={{ fontSize: 14, color: asistenteIAConfig.configurado ? '#16A34A' : '#6B7280' }}>
                {asistenteIAConfig.configurado
                  ? `Configurado (clave termina en ${asistenteIAConfig.api_key_preview?.slice(-4) || '****'})`
                  : 'No configurado — el asistente con IA no puede responder hasta que agregues tu clave de OpenAI'}
              </span>
            </div>

            <InputRow>
              <Key />
              <InputLabel>API Key de OpenAI</InputLabel>
              <Input
                type="password"
                value={asistenteIAForm.apiKeyInput}
                onChange={(e) => handleAsistenteIAFormChange('apiKeyInput', e.target.value)}
                placeholder={asistenteIAConfig.configurado ? asistenteIAConfig.api_key_preview : 'sk-...'}
              />
            </InputRow>
            <InputRow>
              <Cpu />
              <InputLabel>Modelo</InputLabel>
              <Input
                type="text"
                value={asistenteIAForm.modelo}
                onChange={(e) => handleAsistenteIAFormChange('modelo', e.target.value)}
                placeholder="gpt-4.1"
              />
            </InputRow>

            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '10px 0 0' }}>
              La API Key se obtiene en{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: '#6366F1' }}>platform.openai.com</a>.
              Confirma el nombre del modelo vigente en tu cuenta de OpenAI antes de cambiarlo.
              Deja el campo de API Key en blanco para conservar la clave guardada.
            </p>

            {asistenteIASaveMessage && (
              <p style={{
                fontSize: 13,
                marginTop: 10,
                color: asistenteIASaveMessage.success ? '#16A34A' : '#DC2626'
              }}>
                {asistenteIASaveMessage.text}
              </p>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button
                type="button"
                onClick={handleSaveAsistenteIA}
                disabled={savingAsistenteIA}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#6366F1',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: savingAsistenteIA ? 'not-allowed' : 'pointer',
                  opacity: savingAsistenteIA ? 0.6 : 1
                }}
              >
                {savingAsistenteIA ? 'Guardando...' : 'Guardar Configuración'}
              </button>
              {asistenteIAConfig.configurado && (
                <button
                  type="button"
                  onClick={handleClearAsistenteIAKey}
                  disabled={savingAsistenteIA}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: '1px solid #FCA5A5',
                    background: 'white',
                    color: '#DC2626',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: savingAsistenteIA ? 'not-allowed' : 'pointer'
                  }}
                >
                  Quitar clave
                </button>
              )}
            </div>
          </FormGroup>
        </Section>
      )}

      {googleAppConfig && (
        <Section>
          <SectionTitle>Google Calendar — Credenciales de la App</SectionTitle>
          <FormGroup>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '4px 0 12px' }}>
              Estas credenciales identifican a Bio Dental ante Google y son <strong>globales a toda la
              instalación</strong> (no por consultorio): una sola vez configuradas aquí, cualquier
              doctor de cualquier consultorio puede vincular su propio Google Calendar desde su Perfil.
            </p>

            <div style={{
              display: 'flex', gap: 8, margin: '0 0 14px', padding: '10px 12px',
              borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A'
            }}>
              <HelpCircle size={16} color="#B45309" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
                Mientras el proyecto de Google Cloud no esté "verificado", solo pueden conectar los
                correos de Gmail que agregues como <strong>usuarios de prueba</strong> en la Pantalla de
                consentimiento OAuth (Google Cloud Console → APIs y servicios). Sin eso, cada doctor va a
                ver una pantalla de Google bloqueando el acceso, sin importar qué tan bien configures esto
                aquí. Agrega el correo de cada doctor ahí antes de pedirles que conecten su calendario.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0' }}>
              <span style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: googleAppConfig.configurado ? '#22C55E' : '#D1D5DB'
              }} />
              <span style={{ fontSize: 14, color: googleAppConfig.configurado ? '#16A34A' : '#6B7280' }}>
                {googleAppConfig.configurado
                  ? (googleAppConfig.usando_env ? 'Configurado (usando valores del .env del servidor)' : 'Configurado')
                  : 'No configurado — los doctores no pueden vincular su Google Calendar'}
              </span>
            </div>

            <InputRow>
              <Globe />
              <InputLabel>Client ID</InputLabel>
              <Input
                type="text"
                value={googleAppForm.clientId}
                onChange={(e) => handleGoogleAppFormChange('clientId', e.target.value)}
                placeholder="xxxxxxxx.apps.googleusercontent.com"
              />
            </InputRow>
            <InputRow>
              <Shield />
              <InputLabel>Client Secret</InputLabel>
              <Input
                type="password"
                value={googleAppForm.clientSecretInput}
                onChange={(e) => handleGoogleAppFormChange('clientSecretInput', e.target.value)}
                placeholder={googleAppConfig.client_secret_preview || 'Client Secret'}
              />
            </InputRow>
            <InputRow>
              <Link2 />
              <InputLabel>Redirect URI</InputLabel>
              <Input
                type="text"
                value={googleAppForm.redirectUri}
                onChange={(e) => handleGoogleAppFormChange('redirectUri', e.target.value)}
                placeholder="https://tu-dominio.com/api/google-calendar/callback"
              />
            </InputRow>

            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '10px 0 0' }}>
              Se obtienen creando un proyecto en{' '}
              <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#6366F1' }}>
                console.cloud.google.com
              </a>, habilitando "Google Calendar API" y creando una credencial OAuth 2.0 (tipo
              Aplicación web). El <strong>Redirect URI</strong> debe copiarse exactamente igual (sin
              espacios ni barra final de más) en la sección "URI de redireccionamiento autorizados"
              de esa credencial en Google — si no coinciden letra por letra, la conexión falla.
              Deja el Client Secret en blanco para conservar el guardado.
            </p>

            {googleAppSaveMessage && (
              <p style={{
                fontSize: 13,
                marginTop: 10,
                color: googleAppSaveMessage.success ? '#16A34A' : '#DC2626'
              }}>
                {googleAppSaveMessage.text}
              </p>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button
                type="button"
                onClick={handleSaveGoogleAppConfig}
                disabled={savingGoogleApp}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#6366F1',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: savingGoogleApp ? 'not-allowed' : 'pointer',
                  opacity: savingGoogleApp ? 0.6 : 1
                }}
              >
                {savingGoogleApp ? 'Guardando...' : 'Guardar Credenciales'}
              </button>
              {googleAppConfig.client_secret_preview && (
                <button
                  type="button"
                  onClick={handleClearGoogleAppSecret}
                  disabled={savingGoogleApp}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: '1px solid #FCA5A5',
                    background: 'white',
                    color: '#DC2626',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: savingGoogleApp ? 'not-allowed' : 'pointer'
                  }}
                >
                  Quitar Secret
                </button>
              )}
            </div>
          </FormGroup>
        </Section>
      )}
    </PageContainer>
  );
};

export default Integraciones;
