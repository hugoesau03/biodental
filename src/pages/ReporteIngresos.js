import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Stethoscope, Loader, Filter, Package, CreditCard, Receipt, ShoppingBag } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { pagosService, serviciosService, recibosService, inventarioService } from '../services/api';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding-bottom: 80px;
  overflow-y: auto;
`;

const HeaderSection = styled.div`
  background: ${({ theme }) => theme.colors.white};
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const BackButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.3s ease;

  svg {
    width: 24px;
    height: 24px;
    color: ${({ theme }) => theme.colors.text};
  }

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
  }
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  flex: 1;
`;

const FilterIconButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.3s ease;

  svg {
    width: 22px;
    height: 22px;
    color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.text};
  }

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
  }
`;

const FilterSection = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-bottom: ${({ $isVisible }) => $isVisible ? '1px' : '0'} solid ${({ theme }) => theme.colors.border};
  overflow: hidden;
  max-height: ${({ $isVisible }) => $isVisible ? '80px' : '0'};
  padding: ${({ $isVisible }) => $isVisible ? '16px 20px' : '0 20px'};
  opacity: ${({ $isVisible }) => $isVisible ? '1' : '0'};
  transition: all 0.3s ease;
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-right: 16px;

  &::-webkit-scrollbar {
    height: 4px;
  }
`;

const FilterTab = styled.button`
  background: ${({ $active, theme }) => 
    $active ? theme.colors.primary : '#F0F0F0'};
  color: ${({ $active, theme }) => 
    $active ? theme.colors.white : theme.colors.text};
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ $active, theme }) => 
      $active ? theme.colors.primaryDark : '#E0E0E0'};
  }
`;

const Content = styled.div`
  padding: 20px;
`;

const TotalCard = styled.div`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.primaryDark} 100%);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  color: white;
`;

const TotalLabel = styled.div`
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
`;

const TotalValue = styled.div`
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const TotalChange = styled.div`
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0.9;

  svg {
    width: 16px;
    height: 16px;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
`;

const MetricCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const MetricIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${({ color }) => color}20;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;

  svg {
    width: 20px;
    height: 20px;
    color: ${({ color }) => color};
  }
`;

const MetricLabel = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 4px;
`;

const MetricValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;

const MetricChange = styled.div`
  font-size: 11px;
  color: ${({ $positive, theme }) => $positive ? theme.colors.successText : theme.colors.dangerText};
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;

  svg {
    width: 12px;
    height: 12px;
  }
`;

const TypeBreakdownCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
`;

const TypeRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const TypeInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TypeIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: ${({ color }) => color}20;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 18px;
    height: 18px;
    color: ${({ color }) => color};
  }
`;

const TypeLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const TypeAmount = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
`;

const PercentageBar = styled.div`
  height: 8px;
  background: ${({ theme }) => theme.colors.gray};
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
`;

const PercentageFill = styled.div`
  height: 100%;
  background: ${({ color }) => color};
  border-radius: 4px;
  width: ${({ $percentage }) => $percentage}%;
  transition: width 0.5s ease;
`;

const PaymentMethodsCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
`;

const PaymentMethodRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
`;

const PaymentMethodName = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PaymentMethodAmount = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
`;

const Section = styled.section`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 16px 0;
`;

const ChartCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
`;

const LegendContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
  justify-content: center;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
`;

const LegendColor = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background: ${({ color }) => color};
`;

const ServicesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ServiceCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 14px;
`;

const ServiceIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${({ color }) => color}20;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 24px;
    height: 24px;
    color: ${({ color }) => color};
  }
`;

const ServiceInfo = styled.div`
  flex: 1;
`;

const ServiceName = styled.h3`
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 4px 0;
`;

const ServiceDetails = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

const ServiceValue = styled.div`
  text-align: right;
`;

const ServiceAmount = styled.div`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.primary};
`;

const ServiceChange = styled.div`
  font-size: 11px;
  color: ${({ $positive, theme }) => $positive ? theme.colors.successText : theme.colors.dangerText};
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 2px;

  svg {
    width: 12px;
    height: 12px;
  }
`;

const MonthlyTable = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.gray};
  font-size: 12px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 14px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 14px;

  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.span`
  color: ${({ theme }) => theme.colors.text};

  &:last-child {
    text-align: right;
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    color: ${({ $positive, theme }) => $positive ? theme.colors.successText : theme.colors.dangerText};
  }
`;

const ReporteIngresos = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('Siempre');
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [previousRevenue, setPreviousRevenue] = useState(0);
  const [serviceRevenue, setServiceRevenue] = useState([]);
  const [servicesDetails, setServicesDetails] = useState([]);
  const [productsDetails, setProductsDetails] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [typeBreakdown, setTypeBreakdown] = useState({ servicios: 0, productos: 0 });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [totalRecibos, setTotalRecibos] = useState(0);
  const [ticketPromedio, setTicketPromedio] = useState(0);
  const [productosVendidos, setProductosVendidos] = useState(0);
  const [inventarioStats, setInventarioStats] = useState({ total: 0, stockBajo: 0, valorTotal: 0 });

  const periods = ['Siempre', 'Hoy', 'Esta semana', 'Este mes', 'Este año'];

  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };

  // Calcular fechas según el período
  const getDateRange = useCallback((period) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (period) {
      case 'Hoy':
        return {
          desde: today.toISOString().split('T')[0],
          hasta: today.toISOString().split('T')[0]
        };
      case 'Esta semana': {
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return {
          desde: startOfWeek.toISOString().split('T')[0],
          hasta: endOfWeek.toISOString().split('T')[0]
        };
      }
      case 'Este mes': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          desde: startOfMonth.toISOString().split('T')[0],
          hasta: endOfMonth.toISOString().split('T')[0]
        };
      }
      case 'Este año': {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31);
        return {
          desde: startOfYear.toISOString().split('T')[0],
          hasta: endOfYear.toISOString().split('T')[0]
        };
      }
      case 'Siempre':
      default:
        return { desde: null, hasta: null };
    }
  }, []);

  // Calcular período anterior para comparar
  const getPreviousDateRange = useCallback((period) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'Hoy': {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        return {
          desde: yesterday.toISOString().split('T')[0],
          hasta: yesterday.toISOString().split('T')[0]
        };
      }
      case 'Esta semana': {
        const dayOfWeek = today.getDay();
        const startOfThisWeek = new Date(today);
        startOfThisWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        const startOfLastWeek = new Date(startOfThisWeek);
        startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
        return {
          desde: startOfLastWeek.toISOString().split('T')[0],
          hasta: endOfLastWeek.toISOString().split('T')[0]
        };
      }
      case 'Este mes': {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          desde: startOfLastMonth.toISOString().split('T')[0],
          hasta: endOfLastMonth.toISOString().split('T')[0]
        };
      }
      case 'Este año': {
        const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
        const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);
        return {
          desde: startOfLastYear.toISOString().split('T')[0],
          hasta: endOfLastYear.toISOString().split('T')[0]
        };
      }
      default:
        return { desde: null, hasta: null };
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const dateRange = getDateRange(selectedPeriod);
      const prevDateRange = getPreviousDateRange(selectedPeriod);

      // Obtener recibos pagados
      const params = { estado: 'pagado', limit: 1000 };
      if (dateRange.desde && dateRange.hasta) {
        params.desde = dateRange.desde;
        params.hasta = dateRange.hasta;
      }

      const [recibosRes, serviciosRes, inventarioRes] = await Promise.all([
        recibosService.getAll(params),
        serviciosService.getAll(),
        inventarioService.getAll()
      ]);

      const recibos = recibosRes.data?.recibos || recibosRes.data || [];
      const servicios = serviciosRes.data?.servicios || serviciosRes.data || [];
      const inventario = inventarioRes.data?.productos || inventarioRes.data || [];

      // Filtrar por fecha
      let filteredRecibos = recibos;
      if (dateRange.desde && dateRange.hasta) {
        filteredRecibos = recibos.filter(r => {
          const fecha = new Date(r.fecha_emision || r.fecha_pago);
          const desde = new Date(dateRange.desde);
          const hasta = new Date(dateRange.hasta);
          hasta.setHours(23, 59, 59, 999);
          return fecha >= desde && fecha <= hasta;
        });
      }

      // Calcular total de ingresos del período
      const total = filteredRecibos.reduce((sum, recibo) => sum + parseFloat(recibo.total || 0), 0);
      setTotalRevenue(total);
      setTotalRecibos(filteredRecibos.length);
      setTicketPromedio(filteredRecibos.length > 0 ? total / filteredRecibos.length : 0);

      // Calcular total del período anterior para comparación
      if (prevDateRange.desde && prevDateRange.hasta) {
        const prevParams = { estado: 'pagado', limit: 1000, desde: prevDateRange.desde, hasta: prevDateRange.hasta };
        try {
          const prevRes = await recibosService.getAll(prevParams);
          const prevRecibos = prevRes.data?.recibos || prevRes.data || [];
          const prevTotal = prevRecibos.reduce((sum, r) => sum + parseFloat(r.total || 0), 0);
          setPreviousRevenue(prevTotal);
        } catch {
          setPreviousRevenue(0);
        }
      } else {
        setPreviousRevenue(0);
      }

      // Calcular ingresos por tipo (servicios vs productos) y desglose
      const colors = ['#33A9FF', '#5CC8FF', '#33D69F', '#FFB547', '#FF6B9D', '#9C27B0', '#00BCD4', '#FF5722'];
      const serviceMap = {};
      const productMap = {};
      let totalServicios = 0;
      let totalProductos = 0;
      const metodoPagoMap = {};
      
      filteredRecibos.forEach(recibo => {
        // Contar métodos de pago
        const metodo = recibo.metodo_pago || 'No especificado';
        metodoPagoMap[metodo] = (metodoPagoMap[metodo] || 0) + parseFloat(recibo.total || 0);

        // Intentar leer items del recibo
        let items = [];
        if (recibo.items) {
          try {
            items = typeof recibo.items === 'string' ? JSON.parse(recibo.items) : recibo.items;
          } catch (e) {
            console.error('Error parsing items:', e);
          }
        }

        if (items.length > 0) {
          items.forEach(item => {
            const name = item.descripcion || item.concepto || 'Otros';
            const amount = parseFloat(item.total || item.subtotal || 0);
            const tipo = item.tipo || 'servicio';

            if (tipo === 'producto') {
              totalProductos += amount;
              if (!productMap[name]) {
                productMap[name] = { count: 0, amount: 0 };
              }
              productMap[name].count += item.cantidad || 1;
              productMap[name].amount += amount;
            } else {
              totalServicios += amount;
              if (!serviceMap[name]) {
                serviceMap[name] = { count: 0, amount: 0 };
              }
              serviceMap[name].count += item.cantidad || 1;
              serviceMap[name].amount += amount;
            }
          });
        } else {
          // Si no hay items detallados, asumimos que es un servicio
          totalServicios += parseFloat(recibo.total || 0);
          const name = 'Consulta General';
          if (!serviceMap[name]) {
            serviceMap[name] = { count: 0, amount: 0 };
          }
          serviceMap[name].count += 1;
          serviceMap[name].amount += parseFloat(recibo.total || 0);
        }
      });

      // Si no hay servicios en los items, usar los servicios del catálogo
      if (Object.keys(serviceMap).length === 0 && servicios.length > 0 && total > 0) {
        // Distribuir el total entre los servicios existentes proporcionalmente
        const serviciosActivos = servicios.filter(s => s.activo !== false).slice(0, 5);
        serviciosActivos.forEach((serv, idx) => {
          serviceMap[serv.nombre] = { 
            count: Math.max(1, Math.floor(filteredRecibos.length / serviciosActivos.length)), 
            amount: totalServicios / serviciosActivos.length 
          };
        });
      }

      setTypeBreakdown({ servicios: totalServicios, productos: totalProductos });

      // Métodos de pago
      const paymentMethodsData = Object.entries(metodoPagoMap)
        .sort((a, b) => b[1] - a[1])
        .map(([name, amount]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
          amount
        }));
      setPaymentMethods(paymentMethodsData);

      // Datos de servicios para el gráfico de pastel
      const pieData = Object.entries(serviceMap)
        .filter(([_, data]) => data.amount > 0)
        .sort((a, b) => b[1].amount - a[1].amount)
        .slice(0, 8)
        .map(([name, data], index) => ({
          name: name.length > 20 ? name.substring(0, 20) + '...' : name,
          value: data.amount,
          color: colors[index % colors.length]
        }));
      setServiceRevenue(pieData);

      // Detalles de servicios
      const detailsData = Object.entries(serviceMap)
        .filter(([_, data]) => data.amount > 0)
        .sort((a, b) => b[1].amount - a[1].amount)
        .map(([name, data], index) => ({
          name,
          count: data.count,
          amount: data.amount,
          color: colors[index % colors.length]
        }));
      setServicesDetails(detailsData);

      // Detalles de productos
      const productsData = Object.entries(productMap)
        .filter(([_, data]) => data.amount > 0)
        .sort((a, b) => b[1].amount - a[1].amount)
        .map(([name, data], index) => ({
          name,
          count: data.count,
          amount: data.amount,
          color: colors[(index + 3) % colors.length]
        }));
      setProductsDetails(productsData);

      // Calcular total de productos vendidos
      const totalProductosVendidos = Object.values(productMap).reduce((sum, p) => sum + p.count, 0);
      setProductosVendidos(totalProductosVendidos);

      // Estadísticas de inventario
      if (inventario && inventario.length > 0) {
        const stockBajo = inventario.filter(p => p.stock <= p.stock_minimo).length;
        const valorTotal = inventario.reduce((sum, p) => sum + (parseFloat(p.precio || 0) * (p.stock || 0)), 0);
        setInventarioStats({
          total: inventario.length,
          stockBajo: stockBajo,
          valorTotal: valorTotal
        });
      }

      // Calcular datos mensuales (últimos 6 meses)
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                          'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      
      // Obtener todos los recibos pagados para histórico mensual
      const allRecibosRes = await recibosService.getAll({ estado: 'pagado', limit: 1000 });
      const allRecibos = allRecibosRes.data?.recibos || allRecibosRes.data || [];
      
      const monthlyMap = {};
      allRecibos.forEach(recibo => {
        const date = new Date(recibo.fecha_emision || recibo.fecha_pago);
        const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
        monthlyMap[key] = (monthlyMap[key] || 0) + parseFloat(recibo.total || 0);
      });

      const sortedMonths = Object.entries(monthlyMap)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .slice(0, 6)
        .reverse();

      const monthly = sortedMonths.map(([key, revenue], index) => {
        const [year, month] = key.split('-');
        const monthIndex = parseInt(month);
        const prevMonthRevenue = index > 0 ? sortedMonths[index - 1]?.[1] || 0 : 0;
        const change = prevMonthRevenue > 0 
          ? ((revenue - prevMonthRevenue) / prevMonthRevenue * 100).toFixed(1) 
          : 0;
        
        return {
          month: `${monthNames[monthIndex]}`,
          fullMonth: `${monthNames[monthIndex]} ${year}`,
          revenue: revenue,
          change: parseFloat(change),
          positive: parseFloat(change) >= 0
        };
      });
      setMonthlyData(monthly);

    } catch (error) {
      console.error('Error fetching income data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, getDateRange, getPreviousDateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  // Calcular variación porcentual
  const revenueChange = previousRevenue > 0 
    ? ((totalRevenue - previousRevenue) / previousRevenue * 100).toFixed(1) 
    : 0;
  const isPositiveChange = parseFloat(revenueChange) >= 0;

  if (loading) {
    return (
      <PageContainer>
        <HeaderSection>
          <BackButton onClick={() => navigate('/reportes')}>
            <ArrowLeft />
          </BackButton>
          <Title>Detalle de Ingresos</Title>
        </HeaderSection>
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
      <HeaderSection>
        <BackButton onClick={() => navigate('/reportes')}>
          <ArrowLeft />
        </BackButton>
        <Title>Detalle de Ingresos</Title>
        <FilterIconButton $active={showFilters} onClick={toggleFilters}>
          <Filter />
        </FilterIconButton>
      </HeaderSection>

      <FilterSection $isVisible={showFilters}>
        <FilterTabs>
          {periods.map((period) => (
            <FilterTab
              key={period}
              $active={selectedPeriod === period}
              onClick={() => handlePeriodChange(period)}
            >
              {period}
            </FilterTab>
          ))}
        </FilterTabs>
      </FilterSection>

      <Content>
        <TotalCard>
          <TotalLabel>Ingresos Totales - {selectedPeriod}</TotalLabel>
          <TotalValue>${totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TotalValue>
          <TotalChange>
            {isPositiveChange ? <TrendingUp /> : <TrendingDown />}
            {selectedPeriod !== 'Siempre' && previousRevenue > 0 ? (
              <>{isPositiveChange ? '+' : ''}{revenueChange}% vs período anterior</>
            ) : (
              <>Período: {selectedPeriod}</>
            )}
          </TotalChange>
        </TotalCard>

        {/* Métricas principales */}
        <MetricsGrid>
          <MetricCard>
            <MetricIcon color="#33A9FF">
              <Receipt />
            </MetricIcon>
            <MetricLabel>Total Recibos</MetricLabel>
            <MetricValue>{totalRecibos}</MetricValue>
          </MetricCard>
          <MetricCard>
            <MetricIcon color="#33D69F">
              <DollarSign />
            </MetricIcon>
            <MetricLabel>Ticket Promedio</MetricLabel>
            <MetricValue>${ticketPromedio.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</MetricValue>
          </MetricCard>
          <MetricCard>
            <MetricIcon color="#FF6B9D">
              <ShoppingBag />
            </MetricIcon>
            <MetricLabel>Productos Vendidos</MetricLabel>
            <MetricValue>{productosVendidos}</MetricValue>
          </MetricCard>
          <MetricCard>
            <MetricIcon color="#FFB547">
              <Package />
            </MetricIcon>
            <MetricLabel>Ing. Productos</MetricLabel>
            <MetricValue>${typeBreakdown.productos.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</MetricValue>
          </MetricCard>
        </MetricsGrid>

        {/* Desglose por tipo */}
        <Section>
          <SectionTitle>Ingresos por Tipo</SectionTitle>
          <TypeBreakdownCard>
            <TypeRow>
              <TypeInfo>
                <TypeIcon color="#33A9FF">
                  <Stethoscope />
                </TypeIcon>
                <div>
                  <TypeLabel>Servicios Médicos</TypeLabel>
                  <PercentageBar>
                    <PercentageFill 
                      color="#33A9FF" 
                      $percentage={totalRevenue > 0 ? (typeBreakdown.servicios / totalRevenue * 100) : 0} 
                    />
                  </PercentageBar>
                </div>
              </TypeInfo>
              <TypeAmount>${typeBreakdown.servicios.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</TypeAmount>
            </TypeRow>
            <TypeRow>
              <TypeInfo>
                <TypeIcon color="#FF6B9D">
                  <Package />
                </TypeIcon>
                <div>
                  <TypeLabel>Productos / Medicamentos</TypeLabel>
                  <PercentageBar>
                    <PercentageFill 
                      color="#FF6B9D" 
                      $percentage={totalRevenue > 0 ? (typeBreakdown.productos / totalRevenue * 100) : 0} 
                    />
                  </PercentageBar>
                </div>
              </TypeInfo>
              <TypeAmount>${typeBreakdown.productos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</TypeAmount>
            </TypeRow>
          </TypeBreakdownCard>
        </Section>

        {/* Métodos de pago */}
        {paymentMethods.length > 0 && (
          <Section>
            <SectionTitle>Métodos de Pago</SectionTitle>
            <PaymentMethodsCard>
              {paymentMethods.map((method, index) => (
                <PaymentMethodRow key={index}>
                  <PaymentMethodName>
                    <CreditCard size={16} />
                    {method.name}
                  </PaymentMethodName>
                  <PaymentMethodAmount>
                    ${method.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </PaymentMethodAmount>
                </PaymentMethodRow>
              ))}
            </PaymentMethodsCard>
          </Section>
        )}

        {/* Gráfico de barras mensual */}
        {monthlyData.length > 0 && (
          <Section>
            <SectionTitle>Tendencia de Ingresos</SectionTitle>
            <ChartCard>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`} />
                  <Bar dataKey="revenue" fill="#33A9FF" radius={[6, 6, 0, 0]} name="Ingresos" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Section>
        )}

        {/* Distribución por servicio */}
        <Section>
          <SectionTitle>Distribución por Servicio</SectionTitle>
          <ChartCard>
            {serviceRevenue.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={serviceRevenue}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {serviceRevenue.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`} />
                  </PieChart>
                </ResponsiveContainer>
                <LegendContainer>
                  {serviceRevenue.map((item, index) => (
                    <LegendItem key={index}>
                      <LegendColor color={item.color} />
                      <span>{item.name}: ${item.value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </LegendItem>
                  ))}
                </LegendContainer>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                No hay ingresos por servicios en este período
              </div>
            )}
          </ChartCard>
        </Section>

        {/* Desglose por servicio */}
        <Section>
          <SectionTitle>Desglose por Servicio</SectionTitle>
          <ServicesList>
            {servicesDetails.length > 0 ? servicesDetails.map((service, index) => (
              <ServiceCard key={index}>
                <ServiceIcon color={service.color}>
                  <Stethoscope />
                </ServiceIcon>
                <ServiceInfo>
                  <ServiceName>{service.name}</ServiceName>
                  <ServiceDetails>{service.count} atenciones</ServiceDetails>
                </ServiceInfo>
                <ServiceValue>
                  <ServiceAmount>${service.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</ServiceAmount>
                </ServiceValue>
              </ServiceCard>
            )) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No hay servicios en este período
              </div>
            )}
          </ServicesList>
        </Section>

        {/* Desglose por productos */}
        <Section>
          <SectionTitle>Desglose por Productos/Medicamentos</SectionTitle>
          <ServicesList>
            {productsDetails.length > 0 ? productsDetails.map((product, index) => (
              <ServiceCard key={index}>
                <ServiceIcon color={product.color}>
                  <ShoppingBag />
                </ServiceIcon>
                <ServiceInfo>
                  <ServiceName>{product.name}</ServiceName>
                  <ServiceDetails>{product.count} unidades vendidas</ServiceDetails>
                </ServiceInfo>
                <ServiceValue>
                  <ServiceAmount>${product.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</ServiceAmount>
                </ServiceValue>
              </ServiceCard>
            )) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No hay productos vendidos en este período
              </div>
            )}
          </ServicesList>
        </Section>

        {/* Estadísticas de inventario */}
        {inventarioStats.total > 0 && (
          <Section>
            <SectionTitle>Estado del Inventario</SectionTitle>
            <TypeBreakdownCard>
              <TypeRow>
                <TypeInfo>
                  <TypeIcon color="#33A9FF">
                    <Package />
                  </TypeIcon>
                  <TypeLabel>Productos en catálogo</TypeLabel>
                </TypeInfo>
                <TypeAmount>{inventarioStats.total}</TypeAmount>
              </TypeRow>
              <TypeRow>
                <TypeInfo>
                  <TypeIcon color="#FF6B9D">
                    <TrendingDown />
                  </TypeIcon>
                  <TypeLabel>Productos con stock bajo</TypeLabel>
                </TypeInfo>
                <TypeAmount style={{ color: inventarioStats.stockBajo > 0 ? '#EF4444' : '#10B981' }}>
                  {inventarioStats.stockBajo}
                </TypeAmount>
              </TypeRow>
              <TypeRow>
                <TypeInfo>
                  <TypeIcon color="#33D69F">
                    <DollarSign />
                  </TypeIcon>
                  <TypeLabel>Valor del inventario</TypeLabel>
                </TypeInfo>
                <TypeAmount>${inventarioStats.valorTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</TypeAmount>
              </TypeRow>
            </TypeBreakdownCard>
          </Section>
        )}

        {/* Histórico mensual */}
        <Section>
          <SectionTitle>Histórico Mensual</SectionTitle>
          <MonthlyTable>
            <TableHeader>
              <span>Mes</span>
              <span>Ingresos</span>
              <span style={{ textAlign: 'right' }}>Variación</span>
            </TableHeader>
            {monthlyData.length > 0 ? monthlyData.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.fullMonth || item.month}</TableCell>
                <TableCell>${item.revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</TableCell>
                <TableCell $positive={item.positive}>
                  {item.change !== 0 ? (item.positive ? '+' : '') + item.change + '%' : '-'}
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={3} style={{ textAlign: 'center', color: '#666' }}>
                  No hay datos históricos
                </TableCell>
              </TableRow>
            )}
          </MonthlyTable>
        </Section>
      </Content>
    </PageContainer>
  );
};

export default ReporteIngresos;
