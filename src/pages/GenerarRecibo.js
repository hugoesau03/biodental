import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { 
  Receipt, 
  Printer, 
  Download, 
  Edit2, 
  Check, 
  X, 
  Plus,
  Trash2,
  User,
  Calendar,
  Clock,
  Package,
  Pill,
  ShoppingBag,
  Search,
  Loader,
  CreditCard,
  Banknote,
  Building,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Header from '../components/Layout/Header';
import Modal from '../components/Modal';
import { citasService, inventarioService, recibosService, pagosService, consultorioService } from '../services/api';
import { useAlert } from '../context/AlertContext';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding-bottom: 100px;
  overflow-y: auto;
`;

const Content = styled.div`
  padding: 20px;
`;

const ReciboCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const ReciboHeader = styled.div`
  text-align: center;
  padding-bottom: 20px;
  border-bottom: 2px dashed ${({ theme }) => theme.colors.border};
  margin-bottom: 20px;
`;

const ClinicName = styled.h2`
  font-size: 20px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 4px 0;
`;

const ReciboNumber = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: 20px;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};

  svg {
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ServicesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ServiceRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.background};
  border-radius: 10px;
  gap: 12px;
`;

const ServiceInfo = styled.div`
  flex: 1;
`;

const ServiceName = styled.div`
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 4px;
`;

const ServiceDuration = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const PriceContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PriceInput = styled.input`
  width: 100px;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  text-align: right;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const PriceDisplay = styled.span`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.primary};
  min-width: 80px;
  text-align: right;
`;

const EditButton = styled.button`
  background: transparent;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
    color: ${({ theme }) => theme.colors.primary};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const DeleteButton = styled(EditButton)`
  &:hover {
    color: ${({ theme }) => theme.colors.dangerText};
  }
`;

const AddServiceButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  border: 2px dashed ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 12px;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const TotalSection = styled.div`
  border-top: 2px dashed ${({ theme }) => theme.colors.border};
  margin-top: 20px;
  padding-top: 20px;
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: ${({ $isTotal }) => $isTotal ? '18px' : '14px'};
  font-weight: ${({ $isTotal, theme }) => $isTotal ? theme.fontWeights.bold : theme.fontWeights.normal};
  color: ${({ $isTotal, theme }) => $isTotal ? theme.colors.text : theme.colors.textSecondary};
`;

const TotalValue = styled.span`
  color: ${({ $isTotal, theme }) => $isTotal ? theme.colors.primary : theme.colors.text};
`;

const ActionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    transform: translateY(-2px);
  }
`;

const PrimaryButton = styled(ActionButton)`
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const SecondaryButton = styled(ActionButton)`
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
  }
`;

const SuccessButton = styled(ActionButton)`
  background: #22c55e;
  color: white;

  &:hover {
    background: #16a34a;
  }

  &:disabled {
    background: #86efac;
    cursor: not-allowed;
  }
`;

// Estilos para el modal de pago
const PaymentModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 20px;
`;

const PaymentModalContent = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 20px;
  width: 100%;
  max-width: 400px;
  max-height: 70vh;
  overflow: auto;
`;

const PaymentModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const PaymentModalTitle = styled.h2`
  font-size: 18px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    color: #22c55e;
  }
`;

const PaymentModalBody = styled.div`
  padding: 20px;
`;

const PaymentTotal = styled.div`
  text-align: center;
  padding: 20px;
  background: ${({ theme }) => theme.colors.background};
  border-radius: 12px;
  margin-bottom: 20px;
`;

const PaymentTotalLabel = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 4px 0;
`;

const PaymentTotalAmount = styled.p`
  font-size: 32px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const PaymentMethodLabel = styled.p`
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 12px 0;
`;

const PaymentMethodsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
`;

const PaymentMethodButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border: 2px solid ${({ $selected, theme }) => $selected ? '#22c55e' : theme.colors.border};
  background: ${({ $selected }) => $selected ? 'rgba(34, 197, 94, 0.1)' : 'white'};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  svg {
    width: 24px;
    height: 24px;
    color: ${({ $selected }) => $selected ? '#22c55e' : '#666'};
  }

  span {
    font-size: 13px;
    font-weight: 500;
    color: ${({ $selected, theme }) => $selected ? '#22c55e' : theme.colors.text};
  }

  &:hover {
    border-color: #22c55e;
  }
`;

const PaymentInput = styled.input`
  width: 100%;
  padding: 14px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  font-size: 15px;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.background};
  margin-bottom: 16px;

  &:focus {
    outline: none;
    border-color: #22c55e;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const PaymentModalFooter = styled.div`
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const PaymentCancelButton = styled.button`
  flex: 1;
  padding: 14px;
  background: white;
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
  }
`;

const PaymentConfirmButton = styled.button`
  flex: 1;
  padding: 14px;
  background: #22c55e;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background: #16a34a;
  }

  &:disabled {
    background: #86efac;
    cursor: not-allowed;
  }
`;

// Modal de resultado
const ResultModalContent = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 20px;
  width: 100%;
  max-width: 340px;
  padding: 32px 24px;
  text-align: center;
`;

const ResultIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  background: ${({ $success }) => 
    $success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  
  svg {
    width: 32px;
    height: 32px;
    color: ${({ $success }) => $success ? '#22c55e' : '#ef4444'};
  }
`;

const ResultTitle = styled.h3`
  font-size: 18px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 8px 0;
`;

const ResultMessage = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 24px 0;
  line-height: 1.5;
`;

const ResultButton = styled.button`
  width: 100%;
  padding: 14px;
  background: ${({ $success }) => $success ? '#22c55e' : '#ef4444'};
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

const AddServiceModal = styled.div`
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
  max-width: 400px;
  max-height: 70vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  flex: 1;
`;

const FormField = styled.div`
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ModalActions = styled.div`
  padding: 16px 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  gap: 12px;
`;

const ModalButton = styled.button`
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.2s ease;
`;

const CancelButton = styled(ModalButton)`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
`;

const SaveButton = styled(ModalButton)`
  background: ${({ theme }) => theme.colors.primary};
  border: none;
  color: white;
`;

const ModalTabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const ModalTab = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.background};
  color: ${({ $active, theme }) => $active ? 'white' : theme.colors.text};
  border: 1px solid ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.border};
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const ProductGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
`;

const ProductItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: ${({ theme }) => theme.colors.background};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
  }
`;

const ProductIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${({ $type, theme }) => $type === 'medicamento' ? `${theme.colors.info}20` : `${theme.colors.primary}20`};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 20px;
    height: 20px;
    color: ${({ $type, theme }) => $type === 'medicamento' ? theme.colors.info : theme.colors.primary};
  }
`;

const ProductItemInfo = styled.div`
  flex: 1;
`;

const ProductItemName = styled.div`
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
`;

const ProductItemDetails = styled.div`
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ProductItemPrice = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.primary};
`;

const SearchInput = styled.div`
  position: relative;
  margin-bottom: 12px;

  svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  input {
    width: 100%;
    padding: 10px 12px 10px 40px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 8px;
    font-size: 14px;
    
    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
    }

    &::placeholder {
      color: ${({ theme }) => theme.colors.textSecondary};
    }
  }
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  overflow-x: auto;
  width: 100%;
`;

const FilterTab = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 16px;
  border: 1px solid ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.border};
  font-size: 13px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.white};
  color: ${({ $active, theme }) => $active ? 'white' : theme.colors.text};

  svg {
    width: 14px;
    height: 14px;
  }

  &:hover {
    background: ${({ $active, theme }) => $active ? theme.colors.primaryDark : theme.colors.gray};
  }
`;

const QuantityControl = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const QuantityButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.white};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text};

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
  }
`;

const QuantityInput = styled.input`
  width: 50px;
  padding: 6px;
  text-align: center;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  font-size: 14px;
`;

const GenerarRecibo = () => {
  const { citaId } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [appointment, setAppointment] = useState(null);
  const [inventoryProducts, setInventoryProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clinicName, setClinicName] = useState('');
  
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newService, setNewService] = useState({ name: '', price: '', duration: '' });
  const [modalTab, setModalTab] = useState('servicio');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [productSearch, setProductSearch] = useState('');
  const [productFilter, setProductFilter] = useState('todos');

  // Estados para modal de pago
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [paymentReference, setPaymentReference] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentResult, setPaymentResult] = useState({ show: false, success: false, message: '' });
  const [reciboUuid, setReciboUuid] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [partialAmount, setPartialAmount] = useState('');
  const [pagosRealizados, setPagosRealizados] = useState([]);
  const [totalPagado, setTotalPagado] = useState(0);

  // Cargar cita e inventario
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [citaRes, inventarioRes, consultorioRes] = await Promise.all([
          citasService.getOne(citaId),
          inventarioService.getAll(),
          consultorioService.get()
        ]);
        
        // Obtener nombre del consultorio
        if (consultorioRes.data) {
          setClinicName(consultorioRes.data.nombre || 'Clínica Médica');
        }
        
        if (citaRes.success) {
          setAppointment(citaRes.data);
          
          // Intentar cargar el recibo si existe (tanto para pagadas como pendientes de pago)
          try {
            const reciboRes = await recibosService.getByCita(citaId);
            if (reciboRes.success && reciboRes.data) {
              setReciboUuid(reciboRes.data.uuid);
              
              // Verificar el estado del recibo
              if (reciboRes.data.estado === 'pagado') {
                setIsPaid(true);
              }
              
              // Cargar servicios del recibo
              const reciboServicios = (reciboRes.data.items || [])
                .filter(item => item.tipo === 'servicio')
                .map(s => ({
                  id: s.id,
                  uuid: s.servicio_uuid,
                  name: s.descripcion,
                  price: parseFloat(s.precio_unitario) || 0,
                  duration: 30,
                  quantity: s.cantidad || 1,
                  editingPrice: false,
                  editingQuantity: false,
                  isProduct: false
                }));
              setServices(reciboServicios);
              
              // Cargar productos del recibo
              const reciboProductos = (reciboRes.data.items || [])
                .filter(item => item.tipo === 'producto')
                .map(p => ({
                  id: p.producto_id,
                  uuid: p.producto_uuid,
                  name: p.descripcion || p.producto_nombre,
                  type: 'producto',
                  price: parseFloat(p.precio_unitario) || 0,
                  quantity: p.cantidad || 1,
                  editingPrice: false
                }));
              setProducts(reciboProductos);
            } else {
              // No hay recibo, cargar servicios de la cita
              const citaServicios = (citaRes.data.servicios || []).map(s => ({
                id: s.id,
                uuid: s.uuid,
                name: s.nombre,
                price: parseFloat(s.precio) || 0,
                duration: s.duracion_minutos || 30,
                quantity: s.cantidad || 1,
                editingPrice: false,
                editingQuantity: false,
                isProduct: false
              }));
              setServices(citaServicios);
            }
          } catch (reciboErr) {
            console.log('No hay recibo para esta cita, usando servicios de la cita');
            // Si hay error al cargar recibo, usar servicios de la cita
            const citaServicios = (citaRes.data.servicios || []).map(s => ({
              id: s.id,
              uuid: s.uuid,
              name: s.nombre,
              price: parseFloat(s.precio) || 0,
              duration: s.duracion_minutos || 30,
              quantity: s.cantidad || 1,
              editingPrice: false,
              editingQuantity: false,
              isProduct: false
            }));
            setServices(citaServicios);
          }
        }
        
        if (inventarioRes.success) {
          const productosFormateados = (inventarioRes.data.productos || []).map(p => ({
            id: p.id,
            uuid: p.uuid,
            name: p.nombre,
            type: p.tipo || 'producto',
            price: parseFloat(p.precio) || 0,
            stock: p.stock || 0
          }));
          console.log('Productos del inventario cargados:', productosFormateados);
          setInventoryProducts(productosFormateados);
        }
      } catch (err) {
        console.error('Error cargando datos:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (citaId) fetchData();
  }, [citaId]);
  
  // Filtrar productos por búsqueda y tipo
  const filteredInventoryProducts = inventoryProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchesType = productFilter === 'todos' || product.type === productFilter;
    return matchesSearch && matchesType;
  });
  
  // Generar número de recibo
  const reciboNumber = `REC-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
  
  // Combinar servicios y productos para el total
  const allItems = [...services, ...products];
  
  // Calcular totales
  const subtotal = allItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const iva = 0; // Sin IVA por ahora
  const total = subtotal + iva;
  
  // Cargar pagos realizados cuando hay un recibo
  useEffect(() => {
    const fetchPagos = async () => {
      if (reciboUuid) {
        try {
          const response = await pagosService.getByRecibo(reciboUuid);
          if (response.success && response.data.pagos) {
            setPagosRealizados(response.data.pagos);
            const suma = response.data.pagos.reduce((acc, p) => acc + parseFloat(p.monto), 0);
            setTotalPagado(suma);
            // Actualizar estado de pago completo
            if (suma >= total) {
              setIsPaid(true);
            }
          }
        } catch (err) {
          console.error('Error cargando pagos:', err);
        }
      }
    };
    fetchPagos();
  }, [reciboUuid, total]);
  
  const handlePriceChange = (index, newPrice) => {
    const updated = [...services];
    updated[index].price = parseFloat(newPrice) || 0;
    setServices(updated);
  };
  
  const toggleEditPrice = (index) => {
    const updated = [...services];
    updated[index].editingPrice = !updated[index].editingPrice;
    setServices(updated);
  };
  
  const handleQuantityChange = (index, newQuantity) => {
    const updated = [...services];
    updated[index].quantity = parseInt(newQuantity) || 1;
    setServices(updated);
  };
  
  const toggleEditQuantity = (index) => {
    const updated = [...services];
    updated[index].editingQuantity = !updated[index].editingQuantity;
    setServices(updated);
  };
  
  const handleDeleteService = (index) => {
    setServices(services.filter((_, i) => i !== index));
  };
  
  const handleDeleteProduct = (index) => {
    const productToRemove = products[index];
    
    // Restaurar el stock en inventoryProducts
    if (productToRemove) {
      setInventoryProducts(prevInventory => 
        prevInventory.map(p => 
          p.id === productToRemove.id 
            ? { ...p, stock: p.stock + (productToRemove.quantity || 1) }
            : p
        )
      );
    }
    
    setProducts(products.filter((_, i) => i !== index));
  };
  
  const handleAddService = () => {
    if (newService.name && newService.price) {
      setServices([
        ...services,
        {
          id: Date.now(),
          name: newService.name,
          price: parseFloat(newService.price) || 0,
          duration: parseInt(newService.duration) || 30,
          editingPrice: false
        }
      ]);
      setNewService({ name: '', price: '', duration: '' });
      setShowAddModal(false);
    }
  };
  
  const handleSelectProduct = (product) => {
    console.log('Producto seleccionado:', product);
    setSelectedProduct(product);
    setProductQuantity(1);
  };
  
  const handleAddProduct = () => {
    console.log('handleAddProduct llamado, selectedProduct:', selectedProduct);
    if (selectedProduct) {
      // Verificar si hay stock suficiente
      if (selectedProduct.stock < productQuantity) {
        showAlert(`Stock insuficiente. Disponible: ${selectedProduct.stock}`, { tipo: 'warning' });
        return;
      }
      
      const newProduct = {
        id: selectedProduct.id, // ID numérico del producto
        uuid: selectedProduct.uuid, // UUID del producto
        name: selectedProduct.name,
        type: selectedProduct.type,
        price: selectedProduct.price,
        quantity: productQuantity,
        editingPrice: false
      };
      console.log('Agregando producto:', newProduct);
      setProducts(prevProducts => [...prevProducts, newProduct]);
      
      // Actualizar el stock local del inventario
      setInventoryProducts(prevInventory => 
        prevInventory.map(p => 
          p.id === selectedProduct.id 
            ? { ...p, stock: p.stock - productQuantity }
            : p
        )
      );
      
      setSelectedProduct(null);
      setProductQuantity(1);
      setShowAddModal(false);
    }
  };
  
  const handleProductPriceChange = (index, newPrice) => {
    const updated = [...products];
    updated[index].price = parseFloat(newPrice) || 0;
    setProducts(updated);
  };
  
  const toggleProductEditPrice = (index) => {
    const updated = [...products];
    updated[index].editingPrice = !updated[index].editingPrice;
    setProducts(updated);
  };
  
  const handleOpenModal = () => {
    setModalTab('servicio');
    setSelectedProduct(null);
    setNewService({ name: '', price: '', duration: '' });
    setProductSearch('');
    setProductFilter('todos');
    setShowAddModal(true);
  };
  
  const handleGenerateRecibo = async () => {
    setSaving(true);
    try {
      // Crear recibo en el backend
      const reciboData = {
        cita_uuid: citaId,
        paciente_uuid: appointment.paciente_uuid,
        items: [
          ...services.map(s => ({
            tipo: 'servicio',
            servicio_uuid: s.uuid,
            descripcion: s.name,
            cantidad: s.quantity || 1,
            precio_unitario: s.price
          })),
          ...products.map(p => ({
            tipo: 'producto',
            producto_uuid: p.uuid,
            producto_id: p.id, // ID para descontar stock
            descripcion: p.name,
            cantidad: p.quantity || 1,
            precio_unitario: p.price
          }))
        ],
        subtotal: subtotal,
        impuestos: iva,
        total: total,
        notas: ''
      };
      
      const response = await recibosService.create(reciboData);
      if (response.success) {
        setReciboUuid(response.data.uuid);
        setShowSuccessModal(true);
      } else {
        showAlert(response.message || 'Error al generar recibo', { tipo: 'error' });
      }
    } catch (err) {
      console.error('Error generando recibo:', err);
      showAlert('Error al generar el recibo', { tipo: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Abrir modal de pago
  const handleOpenPaymentModal = () => {
    setPaymentMethod('efectivo');
    setPaymentReference('');
    setShowPaymentModal(true);
  };

  // Procesar el pago
  const handleProcessPayment = async () => {
    // Primero necesitamos tener un recibo creado
    if (!reciboUuid) {
      // Crear el recibo primero
      setSaving(true);
      try {
        const reciboData = {
          cita_uuid: citaId,
          paciente_uuid: appointment.paciente_uuid,
          items: [
            ...services.map(s => ({
              tipo: 'servicio',
              servicio_uuid: s.uuid,
              descripcion: s.name,
              cantidad: s.quantity || 1,
              precio_unitario: s.price
            })),
            ...products.map(p => ({
              tipo: 'producto',
              producto_uuid: p.uuid,
              producto_id: p.id,
              descripcion: p.name,
              cantidad: p.quantity || 1,
              precio_unitario: p.price
            }))
          ],
          subtotal: subtotal,
          impuestos: iva,
          total: total,
          notas: ''
        };
        
        const response = await recibosService.create(reciboData);
        if (response.success) {
          setReciboUuid(response.data.uuid);
          // Continuar con el pago
          await processPaymentWithRecibo(response.data.uuid);
        } else {
          setShowPaymentModal(false);
          setPaymentResult({
            show: true,
            success: false,
            message: response.message || 'Error al crear el recibo'
          });
        }
      } catch (err) {
        console.error('Error creando recibo:', err);
        setShowPaymentModal(false);
        setPaymentResult({
          show: true,
          success: false,
          message: 'Error al crear el recibo. Por favor intenta de nuevo.'
        });
      } finally {
        setSaving(false);
      }
    } else {
      await processPaymentWithRecibo(reciboUuid);
    }
  };

  const processPaymentWithRecibo = async (uuid) => {
    setProcessingPayment(true);
    try {
      const saldoPendiente = total - totalPagado;
      const montoAPagar = isPartialPayment ? parseFloat(partialAmount) : saldoPendiente;
      
      if (isPartialPayment && (montoAPagar <= 0 || montoAPagar > saldoPendiente)) {
        setPaymentResult({
          show: true,
          success: false,
          message: `El monto del abono debe ser mayor a 0 y menor o igual al saldo pendiente ($${saldoPendiente.toFixed(2)})`
        });
        setProcessingPayment(false);
        return;
      }
      
      const pagoData = {
        recibo_uuid: uuid,
        monto: montoAPagar,
        metodo_pago: paymentMethod,
        referencia: paymentReference || null,
        es_abono: isPartialPayment,
        items: products.map(p => ({
          producto_id: p.id,
          cantidad: p.quantity || 1
        }))
      };

      const response = await pagosService.registrar(pagoData);
      
      setShowPaymentModal(false);
      
      if (response.success) {
        // Recargar pagos para actualizar el total pagado
        const pagosResponse = await pagosService.getByRecibo(uuid);
        if (pagosResponse.success && pagosResponse.data.pagos) {
          setPagosRealizados(pagosResponse.data.pagos);
          const suma = pagosResponse.data.pagos.reduce((acc, p) => acc + parseFloat(p.monto), 0);
          setTotalPagado(suma);
          const esAbonoCompleto = suma >= total;
          setIsPaid(esAbonoCompleto);
          
          const tipoPago = isPartialPayment && !esAbonoCompleto ? 'Abono' : 'Pago';
          setPaymentResult({
            show: true,
            success: true,
            message: `${tipoPago} de $${montoAPagar.toFixed(2)} registrado exitosamente con ${
              paymentMethod === 'efectivo' ? 'efectivo' :
              paymentMethod === 'tarjeta_debito' ? 'tarjeta de débito' :
              paymentMethod === 'tarjeta_credito' ? 'tarjeta de crédito' :
              paymentMethod === 'transferencia' ? 'transferencia bancaria' : 'otro método'
            }. ${!esAbonoCompleto ? `Total pagado: $${suma.toFixed(2)} de $${total.toFixed(2)}. Resta: $${(total - suma).toFixed(2)}` : ''}`
          });
        }
        // Limpiar campos del modal
        setIsPartialPayment(false);
        setPartialAmount('');
        setPaymentReference('');
      } else {
        setPaymentResult({
          show: true,
          success: false,
          message: response.message || 'Error al procesar el pago'
        });
      }
    } catch (err) {
      console.error('Error procesando pago:', err);
      setShowPaymentModal(false);
      setPaymentResult({
        show: true,
        success: false,
        message: err.response?.data?.message || 'Error al procesar el pago. Por favor intenta de nuevo.'
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const closePaymentResult = () => {
    setPaymentResult({ show: false, success: false, message: '' });
    if (paymentResult.success) {
      // Si el pago fue exitoso, volver al detalle de la cita
      navigate(`/detalle-cita/${citaId}`);
    }
  };

  // Pagar después - guarda el recibo y marca la cita como pendiente de pago
  const handlePayLater = async () => {
    setSaving(true);
    try {
      // Crear el recibo primero si no existe
      let currentReciboUuid = reciboUuid;
      
      if (!currentReciboUuid) {
        const reciboData = {
          cita_uuid: citaId,
          paciente_uuid: appointment.paciente_uuid,
          items: [
            ...services.map(s => ({
              tipo: 'servicio',
              servicio_uuid: s.uuid,
              descripcion: s.name,
              cantidad: s.quantity || 1,
              precio_unitario: s.price
            })),
            ...products.map(p => ({
              tipo: 'producto',
              producto_uuid: p.uuid,
              producto_id: p.id,
              descripcion: p.name,
              cantidad: p.quantity || 1,
              precio_unitario: p.price
            }))
          ],
          subtotal: subtotal,
          impuestos: iva,
          total: total,
          notas: ''
        };
        
        const response = await recibosService.create(reciboData);
        if (response.success) {
          currentReciboUuid = response.data.uuid;
          setReciboUuid(currentReciboUuid);
        } else {
          showAlert(response.message || 'Error al crear el recibo', { tipo: 'error' });
          setSaving(false);
          return;
        }
      }

      // Actualizar el estado de la cita a pendiente_pago
      const updateResponse = await citasService.update(citaId, { estado: 'pendiente_pago' });

      if (updateResponse.success) {
        setPaymentResult({
          show: true,
          success: true,
          message: 'El recibo ha sido guardado y la cita marcada como pendiente de pago.'
        });
      } else {
        showAlert(updateResponse.message || 'Error al actualizar la cita', { tipo: 'error' });
      }
    } catch (err) {
      console.error('Error al guardar para pagar después:', err);
      showAlert('Error al procesar la solicitud', { tipo: 'error' });
    } finally {
      setSaving(false);
    }
  };
  
  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate(`/detalle-cita/${citaId}`);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // Manejar diferentes formatos de fecha
    let date;
    if (typeof dateString === 'string') {
      if (dateString.includes('T')) {
        date = new Date(dateString);
      } else {
        date = new Date(dateString + 'T12:00:00');
      }
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      return 'Fecha no disponible';
    }
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  };

  // Función para imprimir el recibo
  const handlePrintRecibo = () => {
    const printContent = generatePrintableContent();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Función para descargar PDF
  const handleDownloadPDF = () => {
    const printContent = generatePrintableContent();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Generar contenido imprimible
  const generatePrintableContent = () => {
    const serviciosHTML = services.map(s => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${s.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${s.quantity || 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${s.price.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(s.price * (s.quantity || 1)).toFixed(2)}</td>
      </tr>
    `).join('');

    const productosHTML = products.map(p => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${p.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${p.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${p.price.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(p.price * p.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Recibo - ${reciboNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            padding: 40px; 
            max-width: 800px; 
            margin: 0 auto;
            color: #333;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #4F46E5;
          }
          .header h1 { 
            color: #4F46E5; 
            font-size: 28px;
            margin-bottom: 5px;
          }
          .header p { 
            color: #666; 
            font-size: 14px;
          }
          .recibo-number {
            background: #f3f4f6;
            padding: 10px 20px;
            border-radius: 8px;
            display: inline-block;
            margin-top: 15px;
            font-weight: bold;
            color: #4F46E5;
          }
          .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            gap: 20px;
          }
          .info-box {
            flex: 1;
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
          }
          .info-box h3 {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          .info-box p {
            font-size: 14px;
            margin-bottom: 4px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
          }
          th { 
            background: #4F46E5; 
            color: white; 
            padding: 12px 8px;
            text-align: left;
            font-size: 14px;
          }
          th:nth-child(2), th:nth-child(3), th:nth-child(4) {
            text-align: center;
          }
          th:last-child { text-align: right; }
          .totals {
            margin-top: 20px;
            text-align: right;
          }
          .total-row {
            display: flex;
            justify-content: flex-end;
            padding: 8px 0;
            font-size: 14px;
          }
          .total-row span:first-child {
            margin-right: 50px;
            color: #666;
          }
          .total-row.final {
            font-size: 18px;
            font-weight: bold;
            color: #4F46E5;
            border-top: 2px solid #4F46E5;
            padding-top: 15px;
            margin-top: 10px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 12px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
          .paid-stamp {
            background: #10B981;
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            display: inline-block;
            margin-top: 15px;
            font-weight: bold;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${clinicName || 'Clínica Médica'}</h1>
          <p>Sistema de Gestión Médica</p>
          <div class="recibo-number">${reciboNumber}</div>
        </div>

        <div class="info-section">
          <div class="info-box">
            <h3>Paciente</h3>
            <p><strong>${appointment?.paciente_nombre || ''} ${appointment?.paciente_apellidos || ''}</strong></p>
            <p>${appointment?.paciente_email || ''}</p>
            <p>${appointment?.paciente_telefono || ''}</p>
          </div>
          <div class="info-box">
            <h3>Detalles de la Cita</h3>
            <p><strong>Fecha:</strong> ${formatDate(appointment?.fecha)}</p>
            <p><strong>Hora:</strong> ${appointment?.hora_inicio || ''}</p>
            <p><strong>Doctor:</strong> ${appointment?.doctor_nombre || ''}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Cant.</th>
              <th>P. Unit.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${serviciosHTML}
            ${productosHTML}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>$${subtotal.toFixed(2)}</span>
          </div>
          ${iva > 0 ? `
          <div class="total-row">
            <span>IVA:</span>
            <span>$${iva.toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="total-row final">
            <span>TOTAL:</span>
            <span>$${total.toFixed(2)}</span>
          </div>
        </div>

        ${isPaid ? '<div style="text-align: center;"><div class="paid-stamp">✓ PAGADO</div></div>' : ''}

        <div class="footer">
          <p>Gracias por su preferencia</p>
          <p>Fecha de emisión: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <PageContainer>
        <Header title={isPaid ? "Ver Recibo" : "Generar Recibo"} showBack />
        <Content>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Loader className="spin" size={32} />
          </div>
        </Content>
      </PageContainer>
    );
  }

  if (!appointment) {
    return (
      <PageContainer>
        <Header title="Generar Recibo" showBack />
        <Content>
          <ReciboCard>
            <p>Cita no encontrada</p>
          </ReciboCard>
        </Content>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Modal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        title="Recibo Generado"
        message="El recibo ha sido generado exitosamente."
        type="success"
        confirmText="Aceptar"
      />
      
      <Header title={isPaid ? "Ver Recibo" : "Generar Recibo"} showBack />
      
      <Content>
        <ReciboCard>
          <ReciboHeader>
            <ClinicName>{clinicName || 'Clínica Médica'}</ClinicName>
            <ReciboNumber>{reciboNumber}</ReciboNumber>
          </ReciboHeader>
          
          <InfoSection>
            <InfoRow>
              <User />
              <span><strong>Paciente:</strong> {appointment.paciente_nombre} {appointment.paciente_apellidos}</span>
            </InfoRow>
            <InfoRow>
              <Calendar />
              <span><strong>Fecha:</strong> {formatDate(appointment.fecha)}</span>
            </InfoRow>
            <InfoRow>
              <Clock />
              <span><strong>Hora:</strong> {appointment.hora_inicio?.substring(0, 5)}</span>
            </InfoRow>
          </InfoSection>
          
          <SectionTitle>
            Servicios
          </SectionTitle>
          
          <ServicesList>
            {services.map((service, index) => (
              <ServiceRow key={service.id || index}>
                <ServiceInfo>
                  <ServiceName>{service.name}</ServiceName>
                  <ServiceDuration>
                    {service.editingQuantity ? (
                      <>
                        <span style={{ marginRight: '8px' }}>Cantidad:</span>
                        <PriceInput
                          type="number"
                          min="1"
                          value={service.quantity || 1}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          style={{ width: '60px', display: 'inline-block' }}
                          autoFocus
                        />
                        <EditButton onClick={() => toggleEditQuantity(index)} style={{ marginLeft: '4px' }}>
                          <Check />
                        </EditButton>
                      </>
                    ) : (
                      <>
                        {service.duration} min • Cantidad: {service.quantity || 1}
                        {!isPaid && (
                          <EditButton onClick={() => toggleEditQuantity(index)} style={{ marginLeft: '8px' }}>
                            <Edit2 size={14} />
                          </EditButton>
                        )}
                      </>
                    )}
                  </ServiceDuration>
                </ServiceInfo>
                <PriceContainer>
                  {service.editingPrice ? (
                    <>
                      <PriceInput
                        type="number"
                        value={service.price}
                        onChange={(e) => handlePriceChange(index, e.target.value)}
                        autoFocus
                      />
                      <EditButton onClick={() => toggleEditPrice(index)}>
                        <Check />
                      </EditButton>
                    </>
                  ) : (
                    <>
                      <PriceDisplay>${(service.price * (service.quantity || 1)).toFixed(2)}</PriceDisplay>
                      {!isPaid && (
                        <EditButton onClick={() => toggleEditPrice(index)}>
                          <Edit2 />
                        </EditButton>
                      )}
                    </>
                  )}
                  {!isPaid && (
                    <DeleteButton onClick={() => handleDeleteService(index)}>
                      <Trash2 />
                    </DeleteButton>
                  )}
                </PriceContainer>
              </ServiceRow>
            ))}
          </ServicesList>
          
          {products.length > 0 && (
            <>
              <SectionTitle style={{ marginTop: '20px' }}>
                Productos
              </SectionTitle>
              
              <ServicesList>
                {products.map((product, index) => (
                  <ServiceRow key={product.id || index}>
                    <ProductIcon $type={product.type} style={{ width: '36px', height: '36px', marginRight: '8px' }}>
                      {product.type === 'medicamento' ? <Pill /> : <ShoppingBag />}
                    </ProductIcon>
                    <ServiceInfo>
                      <ServiceName>{product.name}</ServiceName>
                      <ServiceDuration>Cantidad: {product.quantity}</ServiceDuration>
                    </ServiceInfo>
                    <PriceContainer>
                      {product.editingPrice ? (
                        <>
                          <PriceInput
                            type="number"
                            value={product.price}
                            onChange={(e) => handleProductPriceChange(index, e.target.value)}
                            autoFocus
                          />
                          <EditButton onClick={() => toggleProductEditPrice(index)}>
                            <Check />
                          </EditButton>
                        </>
                      ) : (
                        <>
                          <PriceDisplay>${(product.price * product.quantity).toFixed(2)}</PriceDisplay>
                          {!isPaid && (
                            <EditButton onClick={() => toggleProductEditPrice(index)}>
                              <Edit2 />
                            </EditButton>
                          )}
                        </>
                      )}
                      {!isPaid && (
                        <DeleteButton onClick={() => handleDeleteProduct(index)}>
                          <Trash2 />
                        </DeleteButton>
                      )}
                    </PriceContainer>
                  </ServiceRow>
                ))}
              </ServicesList>
            </>
          )}
          
          {!isPaid && (
            <AddServiceButton onClick={handleOpenModal}>
              <Plus />
              Agregar Servicio o Producto
            </AddServiceButton>
          )}
          
          <TotalSection>
            <TotalRow>
              <span>Subtotal</span>
              <TotalValue>${subtotal.toFixed(2)}</TotalValue>
            </TotalRow>
            {iva > 0 && (
              <TotalRow>
                <span>IVA (16%)</span>
                <TotalValue>${iva.toFixed(2)}</TotalValue>
              </TotalRow>
            )}
            <TotalRow $isTotal>
              <span>Total</span>
              <TotalValue $isTotal>${total.toFixed(2)}</TotalValue>
            </TotalRow>
            
            {/* Mostrar pagos realizados si hay abonos */}
            {pagosRealizados.length > 0 && totalPagado > 0 && (
              <>
                <TotalRow style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #e0e0e0', color: '#2196F3' }}>
                  <span>Total Pagado</span>
                  <TotalValue style={{ color: '#2196F3' }}>-${totalPagado.toFixed(2)}</TotalValue>
                </TotalRow>
                {totalPagado < total && (
                  <TotalRow style={{ color: '#f44336', fontWeight: '600' }}>
                    <span>Saldo Pendiente</span>
                    <TotalValue style={{ color: '#f44336' }}>${(total - totalPagado).toFixed(2)}</TotalValue>
                  </TotalRow>
                )}
              </>
            )}
          </TotalSection>
          
          {/* Lista de pagos realizados */}
          {pagosRealizados.length > 0 && (
            <div style={{ marginTop: '16px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                Pagos Realizados ({pagosRealizados.length})
              </h4>
              {pagosRealizados.map((pago, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '8px 0',
                  fontSize: '13px',
                  borderBottom: index < pagosRealizados.length - 1 ? '1px solid #e0e0e0' : 'none'
                }}>
                  <span style={{ color: '#666' }}>
                    {new Date(pago.fecha_pago).toLocaleDateString('es-MX', { 
                      day: '2-digit', 
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })} • {
                      pago.metodo_pago === 'efectivo' ? 'Efectivo' :
                      pago.metodo_pago === 'tarjeta_debito' ? 'Débito' :
                      pago.metodo_pago === 'tarjeta_credito' ? 'Crédito' :
                      pago.metodo_pago === 'transferencia' ? 'Transferencia' : 'Otro'
                    }
                  </span>
                  <span style={{ fontWeight: '600', color: '#2196F3' }}>${parseFloat(pago.monto).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </ReciboCard>
        
        <ActionsContainer>
          {!isPaid ? (
            <>
              <SuccessButton onClick={handleOpenPaymentModal} disabled={processingPayment || saving}>
                <CreditCard />
                Registrar Pago
              </SuccessButton>
              <SecondaryButton onClick={handlePayLater} disabled={processingPayment || saving}>
                <Clock />
                Pagar Después
              </SecondaryButton>
            </>
          ) : (
            <>
              <PrimaryButton onClick={handlePrintRecibo}>
                <Printer />
                Imprimir Recibo
              </PrimaryButton>
              <SecondaryButton onClick={handleDownloadPDF}>
                <Download />
                Descargar PDF
              </SecondaryButton>
            </>
          )}
        </ActionsContainer>
      </Content>

      {/* Modal de Pago */}
      {showPaymentModal && (
        <PaymentModalOverlay onClick={() => !processingPayment && setShowPaymentModal(false)}>
          <PaymentModalContent onClick={e => e.stopPropagation()}>
            <PaymentModalHeader>
              <PaymentModalTitle>
                <CreditCard />
                Registrar Pago
              </PaymentModalTitle>
              <CloseButton onClick={() => !processingPayment && setShowPaymentModal(false)}>
                <X />
              </CloseButton>
            </PaymentModalHeader>
            
            <PaymentModalBody>
              <PaymentTotal>
                <PaymentTotalLabel>Total del recibo</PaymentTotalLabel>
                <PaymentTotalAmount>${total.toFixed(2)}</PaymentTotalAmount>
              </PaymentTotal>
              
              {totalPagado > 0 && (
                <>
                  <PaymentTotal style={{ background: '#E3F2FD', marginTop: '8px' }}>
                    <PaymentTotalLabel style={{ color: '#1976D2' }}>Pagado</PaymentTotalLabel>
                    <PaymentTotalAmount style={{ color: '#1976D2' }}>${totalPagado.toFixed(2)}</PaymentTotalAmount>
                  </PaymentTotal>
                  <PaymentTotal style={{ background: '#FFEBEE', marginTop: '8px' }}>
                    <PaymentTotalLabel style={{ color: '#D32F2F' }}>Saldo Pendiente</PaymentTotalLabel>
                    <PaymentTotalAmount style={{ color: '#D32F2F', fontSize: '24px' }}>${(total - totalPagado).toFixed(2)}</PaymentTotalAmount>
                  </PaymentTotal>
                </>
              )}

              {/* Opción de pago parcial */}
              <div style={{ marginBottom: '20px', marginTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input 
                    type="checkbox"
                    checked={isPartialPayment}
                    onChange={(e) => {
                      setIsPartialPayment(e.target.checked);
                      if (!e.target.checked) setPartialAmount('');
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Registrar abono (pago parcial)</span>
                </label>
              </div>

              {isPartialPayment && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    Monto del abono
                  </label>
                  <PaymentInput 
                    type="number"
                    min="0"
                    max={total - totalPagado}
                    step="0.01"
                    placeholder={`Máximo: $${(total - totalPagado).toFixed(2)}`}
                    value={partialAmount}
                    onChange={e => setPartialAmount(e.target.value)}
                    autoFocus
                  />
                </div>
              )}

              <PaymentMethodLabel>Método de pago</PaymentMethodLabel>
              <PaymentMethodsGrid>
                <PaymentMethodButton 
                  $selected={paymentMethod === 'efectivo'}
                  onClick={() => setPaymentMethod('efectivo')}
                >
                  <Banknote />
                  <span>Efectivo</span>
                </PaymentMethodButton>
                <PaymentMethodButton 
                  $selected={paymentMethod === 'tarjeta_debito'}
                  onClick={() => setPaymentMethod('tarjeta_debito')}
                >
                  <CreditCard />
                  <span>Débito</span>
                </PaymentMethodButton>
                <PaymentMethodButton 
                  $selected={paymentMethod === 'tarjeta_credito'}
                  onClick={() => setPaymentMethod('tarjeta_credito')}
                >
                  <CreditCard />
                  <span>Crédito</span>
                </PaymentMethodButton>
                <PaymentMethodButton 
                  $selected={paymentMethod === 'transferencia'}
                  onClick={() => setPaymentMethod('transferencia')}
                >
                  <Building />
                  <span>Transferencia</span>
                </PaymentMethodButton>
              </PaymentMethodsGrid>

              {(paymentMethod === 'tarjeta_debito' || paymentMethod === 'tarjeta_credito') && (
                <PaymentInput 
                  type="text"
                  placeholder="Últimos 4 dígitos de la tarjeta"
                  maxLength={4}
                  value={paymentReference}
                  onChange={e => setPaymentReference(e.target.value.replace(/\D/g, ''))}
                />
              )}

              {paymentMethod === 'transferencia' && (
                <PaymentInput 
                  type="text"
                  placeholder="Número de referencia"
                  value={paymentReference}
                  onChange={e => setPaymentReference(e.target.value)}
                />
              )}
            </PaymentModalBody>

            <PaymentModalFooter>
              <PaymentCancelButton onClick={() => setShowPaymentModal(false)} disabled={processingPayment}>
                Cancelar
              </PaymentCancelButton>
              <PaymentConfirmButton onClick={handleProcessPayment} disabled={processingPayment}>
                {processingPayment ? (
                  <>
                    <Loader className="spin" size={18} />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Check />
                    Confirmar Pago
                  </>
                )}
              </PaymentConfirmButton>
            </PaymentModalFooter>
          </PaymentModalContent>
        </PaymentModalOverlay>
      )}

      {/* Modal de resultado del pago */}
      {paymentResult.show && (
        <PaymentModalOverlay onClick={closePaymentResult}>
          <ResultModalContent onClick={e => e.stopPropagation()}>
            <ResultIcon $success={paymentResult.success}>
              {paymentResult.success ? <CheckCircle /> : <XCircle />}
            </ResultIcon>
            <ResultTitle>
              {paymentResult.success ? '¡Pago registrado!' : 'Error en el pago'}
            </ResultTitle>
            <ResultMessage>{paymentResult.message}</ResultMessage>
            <ResultButton $success={paymentResult.success} onClick={closePaymentResult}>
              Aceptar
            </ResultButton>
          </ResultModalContent>
        </PaymentModalOverlay>
      )}
      
      {/* Modal para agregar servicio o producto */}
      {showAddModal && (
        <AddServiceModal onClick={() => setShowAddModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Agregar al Recibo</ModalTitle>
              <CloseButton onClick={() => setShowAddModal(false)}>
                <X />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <ModalTabs>
                <ModalTab $active={modalTab === 'servicio'} onClick={() => setModalTab('servicio')}>
                  <Receipt />
                  Servicio
                </ModalTab>
                <ModalTab $active={modalTab === 'producto'} onClick={() => setModalTab('producto')}>
                  <Package />
                  Producto
                </ModalTab>
              </ModalTabs>
              
              {modalTab === 'servicio' ? (
                <>
                  <FormField>
                    <Label>Nombre del Servicio</Label>
                    <Input
                      type="text"
                      placeholder="Ej: Consulta General"
                      value={newService.name}
                      onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    />
                  </FormField>
                  <FormField>
                    <Label>Precio ($)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newService.price}
                      onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                    />
                  </FormField>
                  <FormField>
                    <Label>Duración (minutos)</Label>
                    <Input
                      type="number"
                      placeholder="30"
                      value={newService.duration}
                      onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                    />
                  </FormField>
                </>
              ) : (
                <>
                  <FormField>
                    <Label>Buscar Producto</Label>
                    <SearchInput>
                      <Search />
                      <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                      />
                    </SearchInput>
                    <FilterTabs>
                      <FilterTab $active={productFilter === 'todos'} onClick={() => setProductFilter('todos')}>
                        <Package /> Todos
                      </FilterTab>
                      <FilterTab $active={productFilter === 'medicamento'} onClick={() => setProductFilter('medicamento')}>
                        <Pill /> Medicamentos
                      </FilterTab>
                      <FilterTab $active={productFilter === 'producto'} onClick={() => setProductFilter('producto')}>
                        <ShoppingBag /> Productos
                      </FilterTab>
                    </FilterTabs>
                    <ProductGrid>
                      {filteredInventoryProducts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                          No se encontraron productos
                        </div>
                      ) : (
                        filteredInventoryProducts.map(product => (
                          <ProductItem 
                            key={product.id}
                            onClick={() => handleSelectProduct(product)}
                            style={{
                              border: selectedProduct?.id === product.id ? '2px solid #4F46E5' : 'none'
                            }}
                          >
                            <ProductIcon $type={product.type}>
                              {product.type === 'medicamento' ? <Pill /> : <ShoppingBag />}
                            </ProductIcon>
                            <ProductItemInfo>
                              <ProductItemName>{product.name}</ProductItemName>
                              <ProductItemDetails>
                                <ProductItemPrice>${product.price}</ProductItemPrice>
                                <span>Stock: {product.stock}</span>
                              </ProductItemDetails>
                            </ProductItemInfo>
                          </ProductItem>
                        ))
                      )}
                    </ProductGrid>
                  </FormField>
                  
                  {selectedProduct && (
                    <FormField>
                      <Label>Cantidad</Label>
                      <QuantityControl>
                        <QuantityButton onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))}>
                          -
                        </QuantityButton>
                        <QuantityInput
                          type="number"
                          value={productQuantity}
                          onChange={(e) => setProductQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          min="1"
                        />
                        <QuantityButton onClick={() => setProductQuantity(productQuantity + 1)}>
                          +
                        </QuantityButton>
                        <span style={{ marginLeft: '12px', fontWeight: '600', color: '#4F46E5' }}>
                          Total: ${(selectedProduct.price * productQuantity).toFixed(2)}
                        </span>
                      </QuantityControl>
                    </FormField>
                  )}
                </>
              )}
            </ModalBody>
            <ModalActions>
              <CancelButton onClick={() => setShowAddModal(false)}>
                Cancelar
              </CancelButton>
              <SaveButton onClick={modalTab === 'servicio' ? handleAddService : handleAddProduct}>
                Agregar
              </SaveButton>
            </ModalActions>
          </ModalContent>
        </AddServiceModal>
      )}
    </PageContainer>
  );
};

export default GenerarRecibo;
