import React, { useEffect, useRef, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import { QrCode, X, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { citasService } from '../services/api';

const PageContainer = styled.div`
  min-height: 100vh;
  background: #0B0F19;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  padding-bottom: 100px;
`;

const TopBar = styled.div`
  width: 100%;
  max-width: 420px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  border-radius: 10px;
  padding: 8px;
  display: flex;
  cursor: pointer;
`;

const Title = styled.h1`
  color: white;
  font-size: 18px;
  margin: 0;
`;

const VideoWrapper = styled.div`
  position: relative;
  width: 100%;
  max-width: 420px;
  aspect-ratio: 1 / 1;
  border-radius: 20px;
  overflow: hidden;
  background: #000;
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ScanFrame = styled.div`
  position: absolute;
  inset: 12%;
  border: 3px solid rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  pointer-events: none;
`;

const HintText = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  text-align: center;
  margin-top: 16px;
  max-width: 340px;
`;

const ResultCard = styled.div`
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;

  svg {
    width: 40px;
    height: 40px;
  }
`;

const ScanAgainButton = styled.button`
  width: 100%;
  margin-top: 8px;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #33A9FF 0%, #1E88E5 100%);
  color: white;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
`;

const EscanearCheckin = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(document.createElement('canvas'));
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const procesandoRef = useRef(false);

  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null); // { success, message, paciente, hora }
  const [escaneando, setEscaneando] = useState(true);

  const detenerCamara = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const procesarCodigo = useCallback(async (texto) => {
    if (procesandoRef.current) return;
    const match = /^BIODENTAL-CITA:(.+)$/.exec(texto.trim());
    if (!match) return; // No es un QR de cita de Biodental, seguir escaneando

    procesandoRef.current = true;
    setEscaneando(false);
    detenerCamara();

    const citaUuid = match[1];
    try {
      const [citaRes, checkinRes] = await Promise.all([
        citasService.getOne(citaUuid).catch(() => null),
        citasService.checkin(citaUuid)
      ]);

      if (checkinRes.success) {
        setResultado({
          success: true,
          paciente: citaRes?.data ? `${citaRes.data.paciente_nombre} ${citaRes.data.paciente_apellidos}` : null,
          message: checkinRes.data.checkin_at
            ? 'Check-in registrado correctamente'
            : 'Check-in deshecho (ya estaba registrado)'
        });
      } else {
        setResultado({ success: false, message: checkinRes.message || 'No se pudo registrar el check-in' });
      }
    } catch (err) {
      setResultado({
        success: false,
        message: err.response?.data?.message || 'Cita no encontrada o error de conexión'
      });
    }
  }, [detenerCamara]);

  const iniciarCamara = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const tick = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code?.data) {
            procesarCodigo(code.data);
            return;
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      console.error('Error accediendo a la cámara:', err);
      setError('No se pudo acceder a la cámara. Revisa los permisos del navegador.');
    }
  }, [procesarCodigo]);

  useEffect(() => {
    if (escaneando) {
      iniciarCamara();
    }
    return () => detenerCamara();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escaneando]);

  const handleEscanearOtra = () => {
    procesandoRef.current = false;
    setResultado(null);
    setEscaneando(true);
  };

  return (
    <PageContainer>
      <TopBar>
        <BackButton onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </BackButton>
        <Title>Check-in por QR</Title>
      </TopBar>

      {escaneando && (
        <>
          <VideoWrapper>
            <Video ref={videoRef} playsInline muted />
            <ScanFrame />
          </VideoWrapper>
          <HintText>
            <QrCode size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Apunta la cámara al código QR que el paciente muestra en su app
          </HintText>
          {error && (
            <ResultCard>
              <AlertCircle color="#E53935" />
              <span>{error}</span>
            </ResultCard>
          )}
        </>
      )}

      {resultado && (
        <ResultCard>
          {resultado.success ? <CheckCircle color="#2E7D32" /> : <X color="#E53935" />}
          {resultado.paciente && <strong>{resultado.paciente}</strong>}
          <span>{resultado.message}</span>
          <ScanAgainButton onClick={handleEscanearOtra}>Escanear otra cita</ScanAgainButton>
        </ResultCard>
      )}
    </PageContainer>
  );
};

export default EscanearCheckin;
