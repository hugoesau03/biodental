import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Palette, Image, RotateCcw, Loader, Check } from 'lucide-react';
import { consultorioService } from '../services/api';
import { useThemeMode } from '../context/ThemeContext';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding: 20px;
  padding-bottom: 100px;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`;

const BackButton = styled.button`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  padding: 8px;
  display: flex;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text};
`;

const Title = styled.h1`
  font-size: 20px;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
`;

const CardTitle = styled.h2`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;

  svg { width: 18px; height: 18px; color: ${({ theme }) => theme.colors.primary}; }
`;

const ColorRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child { border-bottom: none; }
`;

const ColorLabel = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};

  span {
    display: block;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textSecondary};
    font-weight: 400;
  }
`;

const ColorPickers = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ColorSwatch = styled.input`
  width: 40px;
  height: 40px;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  padding: 0;
  cursor: pointer;
  background: none;
`;

const HexInput = styled.input`
  width: 90px;
  padding: 8px 10px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  font-size: 13px;
  font-family: monospace;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.background};
`;

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const LogoPreview = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 14px;
  background: ${({ theme, $color }) => $color || theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;

  img { width: 100%; height: 100%; object-fit: cover; }
  svg { width: 30px; height: 30px; color: white; }
`;

const LogoActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SmallButton = styled.button`
  padding: 8px 14px;
  border-radius: 8px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.text};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;

  svg { width: 14px; height: 14px; }
`;

const PreviewBar = styled.div`
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${({ $fondo }) => $fondo};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const PreviewLogo = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;

  img { width: 100%; height: 100%; object-fit: cover; }
`;

const PreviewText = styled.div`
  color: ${({ $texto }) => $texto};
  font-weight: 600;
  font-size: 14px;
`;

const SaveBar = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 8px;
`;

const SaveButton = styled.button`
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #33A9FF 0%, #1E88E5 100%);
  color: white;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const RestoreButton = styled.button`
  padding: 14px 16px;
  border-radius: 12px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;

  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const Feedback = styled.div`
  margin-top: 10px;
  font-size: 13px;
  text-align: center;
  color: ${({ $error }) => ($error ? '#F44336' : '#4CAF50')};
`;

const CenteredLoader = styled.div`
  display: flex;
  justify-content: center;
  padding: 60px 0;
`;

const DEFAULTS = {
  color_fondo: '#F8F9FA',
  color_principal: '#33A9FF',
  color_texto: '#212529'
};

const Apariencia = () => {
  const navigate = useNavigate();
  const { setApariencia } = useThemeMode();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configuracionActual, setConfiguracionActual] = useState({});
  const [colores, setColores] = useState(DEFAULTS);
  const [logoBlob, setLogoBlob] = useState(null);
  const [feedback, setFeedback] = useState(null); // { texto, error }
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await consultorioService.get();
        if (res.success) {
          const configuracion = res.data.configuracion || {};
          setConfiguracionActual(configuracion);
          setColores({ ...DEFAULTS, ...(configuracion.apariencia || {}) });
          setLogoBlob(res.data.logo_blob || null);
        }
      } catch (err) {
        console.error('Error cargando apariencia:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleColorChange = (campo, valor) => {
    setColores((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setFeedback({ texto: 'La imagen es muy pesada. Usa una de menos de 1 MB.', error: true });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setLogoBlob(reader.result);
    reader.readAsDataURL(file);
  };

  const handleGuardar = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await consultorioService.update({
        logo_blob: logoBlob,
        configuracion: { ...configuracionActual, apariencia: colores }
      });
      if (res.success) {
        setApariencia({ ...colores, logo_blob: logoBlob });
        setFeedback({ texto: 'Apariencia actualizada correctamente', error: false });
      } else {
        setFeedback({ texto: res.message || 'No se pudo guardar', error: true });
      }
    } catch (err) {
      setFeedback({ texto: err.response?.data?.message || 'Error al guardar los cambios', error: true });
    } finally {
      setSaving(false);
    }
  };

  // Restablece Y guarda de inmediato los valores originales de la app
  // (no deja el cambio pendiente de un "Guardar" aparte).
  const handleRestaurar = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await consultorioService.update({
        logo_blob: null,
        configuracion: { ...configuracionActual, apariencia: DEFAULTS }
      });
      if (res.success) {
        setColores(DEFAULTS);
        setLogoBlob(null);
        setApariencia({ ...DEFAULTS, logo_blob: null });
        setFeedback({ texto: 'Apariencia restablecida a los valores originales', error: false });
      } else {
        setFeedback({ texto: res.message || 'No se pudo restablecer', error: true });
      }
    } catch (err) {
      setFeedback({ texto: err.response?.data?.message || 'Error al restablecer la apariencia', error: true });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <CenteredLoader><Loader style={{ animation: 'spin 1s linear infinite', width: 32, height: 32 }} /></CenteredLoader>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <TopBar>
        <BackButton onClick={() => navigate(-1)}><ArrowLeft size={20} /></BackButton>
        <Title>Apariencia</Title>
      </TopBar>

      <Card>
        <CardTitle><Palette /> Colores</CardTitle>

        <ColorRow>
          <ColorLabel>Fondo<span>Color de fondo de las pantallas</span></ColorLabel>
          <ColorPickers>
            <ColorSwatch type="color" value={colores.color_fondo} onChange={(e) => handleColorChange('color_fondo', e.target.value)} />
            <HexInput value={colores.color_fondo} onChange={(e) => handleColorChange('color_fondo', e.target.value)} />
          </ColorPickers>
        </ColorRow>

        <ColorRow>
          <ColorLabel>Principal<span>Botones, enlaces y acentos</span></ColorLabel>
          <ColorPickers>
            <ColorSwatch type="color" value={colores.color_principal} onChange={(e) => handleColorChange('color_principal', e.target.value)} />
            <HexInput value={colores.color_principal} onChange={(e) => handleColorChange('color_principal', e.target.value)} />
          </ColorPickers>
        </ColorRow>

        <ColorRow>
          <ColorLabel>Fuente<span>Color del texto principal</span></ColorLabel>
          <ColorPickers>
            <ColorSwatch type="color" value={colores.color_texto} onChange={(e) => handleColorChange('color_texto', e.target.value)} />
            <HexInput value={colores.color_texto} onChange={(e) => handleColorChange('color_texto', e.target.value)} />
          </ColorPickers>
        </ColorRow>
      </Card>

      <Card>
        <CardTitle><Image /> Ícono de la app</CardTitle>
        <LogoRow>
          <LogoPreview $color={colores.color_principal}>
            {logoBlob ? <img src={logoBlob} alt="Ícono de la app" /> : <Image />}
          </LogoPreview>
          <LogoActions>
            <SmallButton onClick={() => fileInputRef.current?.click()}>
              <Image /> {logoBlob ? 'Cambiar imagen' : 'Subir imagen'}
            </SmallButton>
            {logoBlob && (
              <SmallButton onClick={() => setLogoBlob(null)}>Quitar</SmallButton>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
          </LogoActions>
        </LogoRow>
      </Card>

      <Card>
        <CardTitle>Vista previa</CardTitle>
        <PreviewBar $fondo={colores.color_fondo}>
          <PreviewLogo $color={colores.color_principal}>
            {logoBlob ? <img src={logoBlob} alt="" /> : <Image size={18} color="white" />}
          </PreviewLogo>
          <PreviewText $texto={colores.color_texto}>Bio Dental</PreviewText>
        </PreviewBar>
      </Card>

      <SaveBar>
        <RestoreButton onClick={handleRestaurar} disabled={saving}>
          <RotateCcw /> {saving ? 'Restableciendo...' : 'Restablecer al original'}
        </RestoreButton>
        <SaveButton onClick={handleGuardar} disabled={saving}>
          <Check size={18} /> {saving ? 'Guardando...' : 'Guardar cambios'}
        </SaveButton>
      </SaveBar>

      {feedback && <Feedback $error={feedback.error}>{feedback.texto}</Feedback>}
    </PageContainer>
  );
};

export default Apariencia;
