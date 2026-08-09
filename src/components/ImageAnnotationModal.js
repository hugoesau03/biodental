import React, { useRef, useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, RotateCcw, Check, Minus, Plus } from 'lucide-react';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 10px;
`;

const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 16px;
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
  padding: 12px;
  overflow-y: auto;
  flex: 1;
`;

const ToolBar = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  align-items: center;
`;

const ToolGroup = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 4px 8px;
  background: ${({ theme }) => theme.colors.background};
  border-radius: 8px;
`;

const ToolLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-right: 4px;
`;

const ColorButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid ${({ $selected, theme }) => $selected ? theme.colors.text : 'transparent'};
  background: ${({ $color }) => $color};
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${({ $selected }) => $selected ? '0 0 0 2px white, 0 0 0 4px #333' : 'none'};

  &:hover {
    transform: scale(1.1);
  }
`;

const SizeButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SizeIndicator = styled.div`
  width: ${({ $size }) => Math.min($size, 20)}px;
  height: ${({ $size }) => Math.min($size, 20)}px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

const CanvasContainer = styled.div`
  position: relative;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  overflow: hidden;
  background: #f0f0f0;
  touch-action: none;
`;

const DrawingCanvas = styled.canvas`
  display: block;
  width: 100%;
  cursor: crosshair;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  flex-shrink: 0;
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
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
`;

const COLORS = [
  '#FF0000', // Rojo
  '#00AA00', // Verde
  '#0066FF', // Azul
  '#FF9900', // Naranja
  '#9900FF', // Púrpura
  '#000000', // Negro
  '#FFFFFF', // Blanco
];

const ImageAnnotationModal = ({ isOpen, onClose, onSave, imageUrl, existingAnnotation }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#FF0000');
  const [brushSize, setBrushSize] = useState(4);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const imageRef = useRef(new Image());

  useEffect(() => {
    if (isOpen && imageUrl) {
      setImageLoaded(false);
      const img = imageRef.current;
      // Solo usar crossOrigin para URLs externas, no para base64
      if (!imageUrl.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      } else {
        img.crossOrigin = null;
      }
      img.onload = () => {
        setImageLoaded(true);
        initCanvas(img);
      };
      img.onerror = () => {
        console.error('Error loading image');
        setImageLoaded(false);
      };
      img.src = imageUrl;
    }
  }, [isOpen, imageUrl]);

  const initCanvas = (img) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth - 4; // Account for border
    
    // Calculate aspect ratio
    const aspectRatio = img.height / img.width;
    const displayWidth = containerWidth;
    const displayHeight = containerWidth * aspectRatio;
    
    // Set canvas display size
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    
    // Set canvas actual size (for high resolution)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    
    setCanvasSize({ width: displayWidth, height: displayHeight });
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    
    // Draw image
    ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
    
    // If there's an existing annotation, overlay it
    if (existingAnnotation) {
      const annotationImg = new Image();
      annotationImg.onload = () => {
        ctx.drawImage(annotationImg, 0, 0, displayWidth, displayHeight);
      };
      annotationImg.src = existingAnnotation;
    }
    
    setContext(ctx);
  };

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
    if (!context) return;
    
    const { x, y } = getCoordinates(e);
    context.beginPath();
    context.moveTo(x, y);
    context.strokeStyle = selectedColor;
    context.lineWidth = brushSize;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    setIsDrawing(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing || !context) return;
    
    const { x, y } = getCoordinates(e);
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    if (!context) return;
    context.closePath();
    setIsDrawing(false);
  };

  const handleClear = () => {
    if (!context || !imageRef.current) return;
    const { width, height } = canvasSize;
    context.clearRect(0, 0, width, height);
    context.drawImage(imageRef.current, 0, 0, width, height);
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  const increaseBrushSize = () => {
    setBrushSize(prev => Math.min(prev + 2, 20));
  };

  const decreaseBrushSize = () => {
    setBrushSize(prev => Math.max(prev - 2, 2));
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Anotar Imagen</ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <ToolBar>
            <ToolGroup>
              <ToolLabel>Color:</ToolLabel>
              {COLORS.map(color => (
                <ColorButton
                  key={color}
                  $color={color}
                  $selected={selectedColor === color}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </ToolGroup>
            
            <ToolGroup>
              <ToolLabel>Grosor:</ToolLabel>
              <SizeButton onClick={decreaseBrushSize} disabled={brushSize <= 2}>
                <Minus size={16} />
              </SizeButton>
              <SizeIndicator $size={brushSize} $color={selectedColor} />
              <SizeButton onClick={increaseBrushSize} disabled={brushSize >= 20}>
                <Plus size={16} />
              </SizeButton>
            </ToolGroup>
          </ToolBar>

          <CanvasContainer>
            {!imageLoaded && (
              <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
                Cargando imagen...
              </div>
            )}
            <DrawingCanvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              style={{ display: imageLoaded ? 'block' : 'none' }}
            />
          </CanvasContainer>
        </ModalBody>

        <ModalActions>
          <ClearButton onClick={handleClear}>
            <RotateCcw />
            Limpiar
          </ClearButton>
          <SaveButton onClick={handleSave}>
            <Check />
            Guardar
          </SaveButton>
        </ModalActions>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ImageAnnotationModal;
