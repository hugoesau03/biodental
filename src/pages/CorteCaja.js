import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Loader, DollarSign, CreditCard, Banknote, Smartphone, Printer, Plus, TrendingUp, TrendingDown, X } from 'lucide-react';
import Header from '../components/Layout/Header';
import { pagosService, movimientosService } from '../services/api';
import { useAlert } from '../context/AlertContext';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding-bottom: 80px;
  overflow-y: auto;
`;

const Content = styled.div`
  padding: 20px;
`;

const Section = styled.section`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 16px 0;
`;

const FiltersCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const FilterRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const FilterLabel = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 8px;
  display: block;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ButtonsRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (min-width: 480px) {
    flex-direction: row;
  }
`;

const ApplyButton = styled.button`
  flex: 1;
  padding: 12px;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const PrintButton = styled.button`
  padding: 12px 20px;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
  }

  @media print {
    display: none;
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 24px;

  @media (min-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
`;

const SummaryCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 20px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const SummaryIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${({ color }) => color || '#33A9FF'}20;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;

  svg {
    width: 24px;
    height: 24px;
    color: ${({ color }) => color || '#33A9FF'};
  }
`;

const SummaryLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 8px;
`;

const SummaryValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xxl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
`;

const TotalCard = styled.div`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.primaryDark});
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 20px;
  box-shadow: ${({ theme }) => theme.shadows.md};
  color: white;
  text-align: center;
  margin-bottom: 24px;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 24px;
  }
`;

const TotalLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  opacity: 0.9;
  margin-bottom: 8px;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: ${({ theme }) => theme.fontSizes.md};
  }
`;

const TotalValue = styled.div`
  font-size: 28px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: 36px;
  }
`;

const TotalCount = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  opacity: 0.8;
  margin-top: 8px;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`;

const TableCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  /* Scrollbar personalizado para navegadores webkit */
  &::-webkit-scrollbar {
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.gray};
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    min-width: 900px;
  }
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 8px;
  background: ${({ theme }) => theme.colors.gray};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  white-space: nowrap;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 16px;
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`;

const Td = styled.td`
  padding: 10px 8px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 14px 16px;
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`;

const MetodoBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  background: ${({ metodo }) => {
    switch (metodo) {
      case 'efectivo': return '#4CAF5020';
      case 'tarjeta': return '#2196F320';
      case 'transferencia': return '#9C27B020';
      default: return '#9E9E9E20';
    }
  }};
  color: ${({ metodo }) => {
    switch (metodo) {
      case 'efectivo': return '#4CAF50';
      case 'tarjeta': return '#2196F3';
      case 'transferencia': return '#9C27B0';
      default: return '#9E9E9E';
    }
  }};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const DateRange = styled.div`
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 16px;
`;

const AddButton = styled.button`
  padding: 12px 20px;
  background: rgba(68, 186, 102, 1);
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.successDark || '#059669'};
  }

  @media print {
    display: none;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 24px;
  width: 100%;
  max-width: 500px;
  max-height: 70vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  
  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  min-height: 80px;
  resize: vertical;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const SubmitButton = styled.button`
  padding: 12px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const ServiciosList = styled.div`
  padding: 4px 0;
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textSecondary};
  max-width: 200px;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 8px 0;
    font-size: ${({ theme }) => theme.fontSizes.xs};
    max-width: 300px;
  }
`;

const ServicioItem = styled.div`
  padding: 2px 0;
  line-height: 1.4;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 4px 0;
  }
`;

const TipoBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  background: ${({ tipo }) => tipo === 'ingreso' ? '#4CAF5020' : '#F4433620'};
  color: ${({ tipo }) => tipo === 'ingreso' ? '#4CAF50' : '#F44336'};
`;

const CorteCaja = () => {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [pagos, setPagos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [dateTo, setDateTo] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [summary, setSummary] = useState({
    efectivo: 0,
    tarjeta: 0,
    transferencia: 0,
    otro: 0,
    total: 0,
    count: 0,
    ingresos_externos: 0,
    egresos_externos: 0,
    total_general: 0
  });
  const [summaryAllTime, setSummaryAllTime] = useState({
    efectivo: 0,
    tarjeta: 0,
    transferencia: 0,
    otro: 0,
    total: 0,
    count: 0,
    ingresos_externos: 0,
    egresos_externos: 0,
    total_general: 0
  });
  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    tipo: 'ingreso',
    concepto: '',
    descripcion: '',
    monto: '',
    metodo_pago: 'efectivo',
    categoria: ''
  });

  useEffect(() => {
    fetchData();
    fetchDataAllTime();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pagosList, movimientosList] = await Promise.all([fetchPagos(), fetchMovimientos()]);
      calcularResumen(pagosList, movimientosList);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDataAllTime = async () => {
    try {
      // Obtener todos los datos sin filtros de fecha
      const [pagosAllResponse, movimientosAllResponse] = await Promise.all([
        pagosService.getAll({ limit: 10000 }),
        movimientosService.getAll({ limit: 10000 })
      ]);
      
      const pagosAll = pagosAllResponse.data?.pagos || pagosAllResponse.pagos || [];
      const movimientosAll = movimientosAllResponse.data?.movimientos || movimientosAllResponse.movimientos || [];
      
      calcularResumenAllTime(pagosAll, movimientosAll);
    } catch (error) {
      console.error('Error fetching all time data:', error);
    }
  };

  const fetchPagos = async () => {
    try {
      const params = { limit: 1000 };
      if (dateFrom) params.desde = dateFrom;
      if (dateTo) params.hasta = dateTo;

      const response = await pagosService.getAll(params);
      const pagosList = response.data?.pagos || response.pagos || [];
      setPagos(pagosList);

      return pagosList;
    } catch (error) {
      console.error('Error fetching pagos:', error);
      return [];
    }
  };

  const fetchMovimientos = async () => {
    try {
      const params = { limit: 1000 };
      if (dateFrom) params.desde = dateFrom;
      if (dateTo) params.hasta = dateTo;

      const response = await movimientosService.getAll(params);
      const movimientosList = response.data?.movimientos || response.movimientos || [];
      setMovimientos(movimientosList);

      return movimientosList;
    } catch (error) {
      console.error('Error fetching movimientos:', error);
      return [];
    }
  };

  const calcularResumen = (pagosList, movimientosList) => {
    const newSummary = {
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0,
      otro: 0,
      total: 0,
      count: pagosList.length,
      ingresos_externos: 0,
      egresos_externos: 0,
      total_general: 0
    };

    // Calcular pagos de servicios
    pagosList.forEach(pago => {
      const monto = parseFloat(pago.monto) || 0;
      newSummary.total += monto;

      switch (pago.metodo_pago?.toLowerCase()) {
        case 'efectivo':
          newSummary.efectivo += monto;
          break;
        case 'tarjeta':
          newSummary.tarjeta += monto;
          break;
        case 'transferencia':
          newSummary.transferencia += monto;
          break;
        default:
          newSummary.otro += monto;
      }
    });

    // Calcular movimientos externos
    movimientosList.forEach(mov => {
      const monto = parseFloat(mov.monto) || 0;
      if (mov.tipo === 'ingreso') {
        newSummary.ingresos_externos += monto;
        
        // Agregar a método de pago correspondiente
        switch (mov.metodo_pago?.toLowerCase()) {
          case 'efectivo':
            newSummary.efectivo += monto;
            break;
          case 'tarjeta':
            newSummary.tarjeta += monto;
            break;
          case 'transferencia':
            newSummary.transferencia += monto;
            break;
          default:
            newSummary.otro += monto;
        }
      } else {
        newSummary.egresos_externos += monto;
        
        // Restar del método de pago correspondiente
        switch (mov.metodo_pago?.toLowerCase()) {
          case 'efectivo':
            newSummary.efectivo -= monto;
            break;
          case 'tarjeta':
            newSummary.tarjeta -= monto;
            break;
          case 'transferencia':
            newSummary.transferencia -= monto;
            break;
          default:
            newSummary.otro -= monto;
        }
      }
    });

    newSummary.total_general = newSummary.total + newSummary.ingresos_externos - newSummary.egresos_externos;

    setSummary(newSummary);
  };

  const calcularResumenAllTime = (pagosList, movimientosList) => {
    const newSummary = {
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0,
      otro: 0,
      total: 0,
      count: pagosList.length,
      ingresos_externos: 0,
      egresos_externos: 0,
      total_general: 0
    };

    // Calcular pagos de servicios
    pagosList.forEach(pago => {
      const monto = parseFloat(pago.monto) || 0;
      newSummary.total += monto;

      switch (pago.metodo_pago?.toLowerCase()) {
        case 'efectivo':
          newSummary.efectivo += monto;
          break;
        case 'tarjeta':
          newSummary.tarjeta += monto;
          break;
        case 'transferencia':
          newSummary.transferencia += monto;
          break;
        default:
          newSummary.otro += monto;
      }
    });

    // Calcular movimientos externos
    movimientosList.forEach(mov => {
      const monto = parseFloat(mov.monto) || 0;
      if (mov.tipo === 'ingreso') {
        newSummary.ingresos_externos += monto;
        
        // Agregar a método de pago correspondiente
        switch (mov.metodo_pago?.toLowerCase()) {
          case 'efectivo':
            newSummary.efectivo += monto;
            break;
          case 'tarjeta':
            newSummary.tarjeta += monto;
            break;
          case 'transferencia':
            newSummary.transferencia += monto;
            break;
          default:
            newSummary.otro += monto;
        }
      } else {
        newSummary.egresos_externos += monto;
        
        // Restar del método de pago correspondiente
        switch (mov.metodo_pago?.toLowerCase()) {
          case 'efectivo':
            newSummary.efectivo -= monto;
            break;
          case 'tarjeta':
            newSummary.tarjeta -= monto;
            break;
          case 'transferencia':
            newSummary.transferencia -= monto;
            break;
          default:
            newSummary.otro -= monto;
        }
      }
    });

    newSummary.total_general = newSummary.total + newSummary.ingresos_externos - newSummary.egresos_externos;

    setSummaryAllTime(newSummary);
  };

  const handleApplyFilters = async () => {
    setLoading(true);
    const [pagosList, movimientosList] = await Promise.all([
      fetchPagos(),
      fetchMovimientos()
    ]);
    calcularResumen(pagosList, movimientosList);
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenModal = () => {
    setNuevoMovimiento({
      tipo: 'ingreso',
      concepto: '',
      descripcion: '',
      monto: '',
      metodo_pago: 'efectivo',
      categoria: ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmitMovimiento = async (e) => {
    e.preventDefault();
    
    try {
      // Obtener la fecha y hora local en formato MySQL
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const fechaLocal = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      
      await movimientosService.create({
        ...nuevoMovimiento,
        monto: parseFloat(nuevoMovimiento.monto),
        fecha_movimiento: fechaLocal
      });

      setShowModal(false);
      await Promise.all([handleApplyFilters(), fetchDataAllTime()]);
    } catch (error) {
      console.error('Error al registrar movimiento:', error);
      showAlert('Error al registrar el movimiento', { tipo: 'error' });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateRange = () => {
    // Parsear la fecha como fecha local (no UTC)
    const [yearFrom, monthFrom, dayFrom] = dateFrom.split('-').map(Number);
    const [yearTo, monthTo, dayTo] = dateTo.split('-').map(Number);
    const from = new Date(yearFrom, monthFrom - 1, dayFrom);
    const to = new Date(yearTo, monthTo - 1, dayTo);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    
    if (dateFrom === dateTo) {
      return from.toLocaleDateString('es-MX', options);
    }
    return `${from.toLocaleDateString('es-MX', options)} - ${to.toLocaleDateString('es-MX', options)}`;
  };

  const getMetodoIcon = (metodo) => {
    switch (metodo?.toLowerCase()) {
      case 'efectivo':
        return <Banknote size={14} />;
      case 'tarjeta':
        return <CreditCard size={14} />;
      case 'transferencia':
        return <Smartphone size={14} />;
      default:
        return <DollarSign size={14} />;
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Header title="Corte de Caja" showBack />
        <Content>
          <div style={{ textAlign: 'center', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Loader style={{ animation: 'spin 1s linear infinite', width: 32, height: 32, color: '#6366F1' }} />
          </div>
        </Content>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header title="Corte de Caja" showBack />
      
      <Content>
        <Section className="no-print">
          <FiltersCard>
            <FilterRow>
              <div>
                <FilterLabel>Fecha Inicio</FilterLabel>
                <Input 
                  type="date" 
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <FilterLabel>Fecha Fin</FilterLabel>
                <Input 
                  type="date" 
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </FilterRow>
            <ButtonsRow>
              <ApplyButton onClick={handleApplyFilters}>Consultar</ApplyButton>
              <AddButton onClick={handleOpenModal}>
                <Plus size={18} />
                Registrar Movimiento
              </AddButton>
              <PrintButton onClick={handlePrint}>
                <Printer size={18} />
                Imprimir
              </PrintButton>
            </ButtonsRow>
          </FiltersCard>
        </Section>

        <TotalCard>
          <TotalLabel>Total General (Todo el tiempo)</TotalLabel>
          <TotalValue>{formatCurrency(summaryAllTime.total_general)}</TotalValue>
          <TotalCount>
            Servicios: {formatCurrency(summaryAllTime.total)} | 
            Ingresos Externos: {formatCurrency(summaryAllTime.ingresos_externos)} | 
            Egresos Externos: {formatCurrency(summaryAllTime.egresos_externos)}
          </TotalCount>
        </TotalCard>

        <DateRange>
          Período Filtrado: {formatDateRange()}
        </DateRange>

        <TotalCard style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
          <TotalLabel>Total del Período</TotalLabel>
          <TotalValue>{formatCurrency(summary.total_general)}</TotalValue>
          <TotalCount>
            Servicios: {formatCurrency(summary.total)} | 
            Ingresos Externos: {formatCurrency(summary.ingresos_externos)} | 
            Egresos Externos: {formatCurrency(summary.egresos_externos)}
          </TotalCount>
        </TotalCard>

        <Section>
          <SectionTitle>Resumen por Método de Pago</SectionTitle>
          <SummaryGrid>
            <SummaryCard>
              <SummaryIcon color="#4CAF50">
                <Banknote />
              </SummaryIcon>
              <SummaryLabel>Efectivo</SummaryLabel>
              <SummaryValue>{formatCurrency(summary.efectivo)}</SummaryValue>
            </SummaryCard>

            <SummaryCard>
              <SummaryIcon color="#2196F3">
                <CreditCard />
              </SummaryIcon>
              <SummaryLabel>Tarjeta</SummaryLabel>
              <SummaryValue>{formatCurrency(summary.tarjeta)}</SummaryValue>
            </SummaryCard>

            <SummaryCard>
              <SummaryIcon color="#9C27B0">
                <Smartphone />
              </SummaryIcon>
              <SummaryLabel>Transferencia</SummaryLabel>
              <SummaryValue>{formatCurrency(summary.transferencia)}</SummaryValue>
            </SummaryCard>

            <SummaryCard>
              <SummaryIcon color="#9E9E9E">
                <DollarSign />
              </SummaryIcon>
              <SummaryLabel>Otro</SummaryLabel>
              <SummaryValue>{formatCurrency(summary.otro)}</SummaryValue>
            </SummaryCard>
          </SummaryGrid>
        </Section>

        <Section>
          <SectionTitle>Detalle de Movimientos</SectionTitle>
          <TableCard>
            {(pagos.length > 0 || movimientos.length > 0) ? (
              <div style={{ overflowX: 'auto' }}>
                <Table>
                  <thead>
                    <tr>
                      <Th>Fecha</Th>
                      <Th>Tipo</Th>
                      <Th>Referencia/Concepto</Th>
                      <Th>Paciente/Detalles</Th>
                      <Th>Método</Th>
                      <Th style={{ textAlign: 'right' }}>Monto</Th>
                      <Th style={{ textAlign: 'right' }}>Balance</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Pagos de servicios */}
                    {(() => {
                      let balance = 0;
                      const todosMovimientos = [
                        ...pagos.map(p => ({...p, tipo_mov: 'servicio', fecha: p.fecha_pago})),
                        ...movimientos.map(m => ({...m, tipo_mov: m.tipo, fecha: m.fecha_movimiento}))
                      ].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
                      
                      return todosMovimientos.map((item, index) => {
                        if (item.tipo_mov === 'servicio' || item.tipo_mov === 'ingreso') {
                          balance += parseFloat(item.monto);
                        } else {
                          balance -= parseFloat(item.monto);
                        }
                        
                        if (item.tipo_mov === 'servicio') {
                          return (
                            <tr key={`pago-${item.uuid || index}`}>
                              <Td>{formatDate(item.fecha_pago)}</Td>
                              <Td>
                                <TipoBadge tipo="ingreso">
                                  <TrendingUp size={14} />
                                  Servicio
                                </TipoBadge>
                              </Td>
                              <Td>
                                <div style={{ fontWeight: 500 }}>Recibo: {item.numero_recibo || '-'}</div>
                                {item.servicios && item.servicios.length > 0 && (
                                  <ServiciosList>
                                    {item.servicios.map((servicio, idx) => (
                                      <ServicioItem key={idx}>
                                        • {servicio.descripcion} ({servicio.cantidad}x)
                                      </ServicioItem>
                                    ))}
                                  </ServiciosList>
                                )}
                              </Td>
                              <Td>{item.paciente_nombre} {item.paciente_apellidos}</Td>
                              <Td>
                                <MetodoBadge metodo={item.metodo_pago?.toLowerCase()}>
                                  {getMetodoIcon(item.metodo_pago)}
                                  {item.metodo_pago || 'N/A'}
                                </MetodoBadge>
                              </Td>
                              <Td style={{ textAlign: 'right', fontWeight: 600, color: '#4CAF50' }}>
                                +{formatCurrency(item.monto)}
                              </Td>
                              <Td style={{ textAlign: 'right', fontWeight: 700, color: balance >= 0 ? '#4CAF50' : '#F44336' }}>
                                {formatCurrency(balance)}
                              </Td>
                            </tr>
                          );
                        } else {
                          return (
                            <tr key={`mov-${item.uuid || index}`}>
                              <Td>{formatDate(item.fecha_movimiento)}</Td>
                              <Td>
                                <TipoBadge tipo={item.tipo}>
                                  {item.tipo === 'ingreso' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                  {item.tipo === 'ingreso' ? 'Ingreso Externo' : 'Egreso'}
                                </TipoBadge>
                              </Td>
                              <Td>
                                <div style={{ fontWeight: 500 }}>{item.concepto}</div>
                                {item.descripcion && (
                                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                                    {item.descripcion}
                                  </div>
                                )}
                              </Td>
                              <Td>{item.categoria || '-'}</Td>
                              <Td>
                                <MetodoBadge metodo={item.metodo_pago?.toLowerCase()}>
                                  {getMetodoIcon(item.metodo_pago)}
                                  {item.metodo_pago || 'N/A'}
                                </MetodoBadge>
                              </Td>
                              <Td style={{ textAlign: 'right', fontWeight: 600, color: item.tipo === 'ingreso' ? '#4CAF50' : '#F44336' }}>
                                {item.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(item.monto)}
                              </Td>
                              <Td style={{ textAlign: 'right', fontWeight: 700, color: balance >= 0 ? '#4CAF50' : '#F44336' }}>
                                {formatCurrency(balance)}
                              </Td>
                            </tr>
                          );
                        }
                      });
                    })()}
                  </tbody>
                </Table>
              </div>
            ) : (
              <EmptyState>
                <p>No hay movimientos registrados en este período</p>
              </EmptyState>
            )}
          </TableCard>
        </Section>
      </Content>

      {showModal && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Registrar Movimiento</ModalTitle>
              <CloseButton onClick={handleCloseModal}>
                <X size={24} />
              </CloseButton>
            </ModalHeader>
            
            <Form onSubmit={handleSubmitMovimiento}>
              <FormGroup>
                <Label>Tipo *</Label>
                <Select 
                  value={nuevoMovimiento.tipo}
                  onChange={(e) => setNuevoMovimiento({...nuevoMovimiento, tipo: e.target.value})}
                  required
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>Concepto *</Label>
                <Input 
                  type="text"
                  value={nuevoMovimiento.concepto}
                  onChange={(e) => setNuevoMovimiento({...nuevoMovimiento, concepto: e.target.value})}
                  placeholder="Ej: Venta de producto, Pago de servicios, etc."
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Descripción</Label>
                <TextArea 
                  value={nuevoMovimiento.descripcion}
                  onChange={(e) => setNuevoMovimiento({...nuevoMovimiento, descripcion: e.target.value})}
                  placeholder="Detalles adicionales (opcional)"
                />
              </FormGroup>

              <FormGroup>
                <Label>Categoría</Label>
                <Input 
                  type="text"
                  value={nuevoMovimiento.categoria}
                  onChange={(e) => setNuevoMovimiento({...nuevoMovimiento, categoria: e.target.value})}
                  placeholder="Ej: Gastos operativos, Ventas adicionales, etc."
                />
              </FormGroup>

              <FormGroup>
                <Label>Monto *</Label>
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  value={nuevoMovimiento.monto}
                  onChange={(e) => setNuevoMovimiento({...nuevoMovimiento, monto: e.target.value})}
                  placeholder="0.00"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Método de Pago *</Label>
                <Select 
                  value={nuevoMovimiento.metodo_pago}
                  onChange={(e) => setNuevoMovimiento({...nuevoMovimiento, metodo_pago: e.target.value})}
                  required
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="otro">Otro</option>
                </Select>
              </FormGroup>

              <SubmitButton type="submit">
                Registrar Movimiento
              </SubmitButton>
            </Form>
          </ModalContent>
        </ModalOverlay>
      )}

      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </PageContainer>
  );
};

export default CorteCaja;
