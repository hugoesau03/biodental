import React, { useRef, useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, RotateCcw, Check } from 'lucide-react';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

const CloseButton = styled.button`
  background: ${({ theme }) => theme.colors.background};
  border: none;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const ModalBody = styled.div`
  padding: 20px;
`;

const Instructions = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 16px 0;
  text-align: center;
`;

const CanvasContainer = styled.div`
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  overflow: hidden;
  background: white;
  touch-action: none;
`;

const SignatureCanvas = styled.canvas`
  display: block;
  width: 100%;
  height: 200px;
  cursor: crosshair;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 14px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;

  svg {
    width: 18px;
    height: 18px;
  }
`;

const ClearButton = styled(ActionButton)`
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};

  &:hover {
    background: ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const SaveButton = styled(ActionButton)`
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SignatureModal = ({ isOpen, onClose, onSave, existingSignature }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [context, setContext] = useState(null);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Ajustar el tamaño del canvas para alta resolución
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      
      // Configurar el estilo del trazo
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      setContext(ctx);

      // Si hay una firma existente, cargarla
      if (existingSignature) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
          setHasSignature(true);
        };
        img.src = existingSignature;
      }
    }
  }, [isOpen, existingSignature]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      context.closePath();
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    context.clearRect(0, 0, rect.width, rect.height);
    setHasSignature(false);
  };

  const saveSignature = () => {
    if (!hasSignature) return;
    
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL('image/png');
    onSave(signatureData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Firmar</ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>
        
        <ModalBody>
          <Instructions>
            Dibuje su firma en el recuadro usando el dedo o el mouse
          </Instructions>
          
          <CanvasContainer>
            <SignatureCanvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </CanvasContainer>

          <ModalActions>
            <ClearButton type="button" onClick={clearCanvas}>
              <RotateCcw />
              Limpiar
            </ClearButton>
            <SaveButton 
              type="button" 
              onClick={saveSignature}
              disabled={!hasSignature}
            >
              <Check />
              Guardar Firma
            </SaveButton>
          </ModalActions>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default SignatureModal;
