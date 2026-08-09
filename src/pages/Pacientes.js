import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Loader, User } from 'lucide-react';
import Header from '../components/Layout/Header';
import FloatingButton from '../components/Layout/FloatingButton';
import { pacientesService } from '../services/api';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding-bottom: 80px;
  overflow-y: auto;
`;

const SearchSection = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-bottom: ${({ $isVisible }) => $isVisible ? '1px' : '0'} solid ${({ theme }) => theme.colors.border};
  overflow: hidden;
  max-height: ${({ $isVisible }) => $isVisible ? '80px' : '0'};
  padding: ${({ $isVisible }) => $isVisible ? '16px 20px' : '0 20px'};
  opacity: ${({ $isVisible }) => $isVisible ? '1' : '0'};
  transition: all 0.3s ease;
`;

const SearchBar = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  svg {
    position: absolute;
    left: 16px;
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  input {
    width: 100%;
    padding: 13px 16px 13px 48px;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    background: #F5F5F5;
    transition: all 0.3s ease;

    &:focus {
      outline: none;
      background: #EBEBEB;
    }

    &::placeholder {
      color: ${({ theme }) => theme.colors.textSecondary};
    }
  }
`;

const FilterSection = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-bottom: ${({ $isVisible }) => $isVisible ? '1px' : '0'} solid ${({ theme }) => theme.colors.border};
  overflow: hidden;
  max-height: ${({ $isVisible }) => $isVisible ? '350px' : '0'};
  padding: ${({ $isVisible }) => $isVisible ? '16px 20px' : '0 20px'};
  opacity: ${({ $isVisible }) => $isVisible ? '1' : '0'};
  transition: all 0.3s ease;
`;

const FilterGroup = styled.div`
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const FilterLabel = styled.span`
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 8px;
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;

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
  padding: 10px 28px;
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

const PatientCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 14px;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    transform: translateX(2px);
  }
`;

const PatientImage = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  background: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  svg {
    width: 30px;
    height: 30px;
    color: white;
  }
`;

const PatientInfo = styled.div`
  flex: 1;
`;

const PatientName = styled.h3`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 4px 0;
`;

const PatientDetails = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 8px 0;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  background: ${({ $status, theme }) => {
    switch ($status) {
      case 'Activo':
        return theme.colors.success;
      case 'Pendiente':
        return theme.colors.warning;
      case 'Inactivo':
        return theme.colors.danger;
      default:
        return theme.colors.gray;
    }
  }};
  color: ${({ $status, theme }) => {
    switch ($status) {
      case 'Activo':
        return theme.colors.successText;
      case 'Pendiente':
        return theme.colors.warningText;
      case 'Inactivo':
        return theme.colors.dangerText;
      default:
        return theme.colors.text;
    }
  }};
`;

const ChevronIcon = styled(ChevronRight)`
  width: 20px;
  height: 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
  flex-shrink: 0;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: ${({ theme }) => theme.colors.textSecondary};
  
  svg {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Pacientes = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('Todos');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [selectedLastVisit, setSelectedLastVisit] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [orderBy, setOrderBy] = useState('nombre'); // 'nombre', 'registro_reciente', 'registro_antiguo'
  const searchInputRef = useRef(null);

  // Cargar pacientes
  const fetchPacientes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await pacientesService.getAll({ search: searchQuery });
      if (response.success) {
        setPatients(response.data.pacientes);
      }
    } catch (err) {
      console.error('Error cargando pacientes:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchPacientes();
  }, [fetchPacientes]);

  const toggleSearch = () => {
    setShowSearch(prev => !prev);
  };

  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Función para verificar si la última cita coincide con el filtro
  const matchesLastVisitFilter = (lastVisit) => {
    if (selectedLastVisit === 'Todos' || !lastVisit) return true;
    
    const visitDate = new Date(lastVisit);
    const today = new Date();
    const diffTime = today - visitDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    switch (selectedLastVisit) {
      case 'Última semana':
        return diffDays <= 7;
      case 'Último mes':
        return diffDays <= 30;
      case 'Últimos 3 meses':
        return diffDays <= 90;
      case 'Más de 3 meses':
        return diffDays > 90;
      default:
        return true;
    }
  };

  // Formatear fecha para mostrar
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Sin citas';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.nombre} ${patient.apellidos}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'Todos' || 
      (selectedFilter === 'Adulto' && patient.tipo === 'adulto') ||
      (selectedFilter === 'Pediátrico' && patient.tipo === 'pediatrico');
    const matchesStatus = selectedStatus === 'Todos' || 
      (selectedStatus === 'Activo' && patient.activo) ||
      (selectedStatus === 'Inactivo' && !patient.activo);
    const matchesLastVisit = matchesLastVisitFilter(patient.ultima_cita);
    return matchesSearch && matchesFilter && matchesStatus && matchesLastVisit;
  }).sort((a, b) => {
    // Ordenamiento según la opción seleccionada
    switch (orderBy) {
      case 'registro_reciente':
        // Más reciente primero (descendente por fecha de creación)
        return new Date(b.created_at || b.fecha_registro) - new Date(a.created_at || a.fecha_registro);
      case 'registro_antiguo':
        // Más antiguo primero (ascendente por fecha de creación)
        return new Date(a.created_at || a.fecha_registro) - new Date(b.created_at || b.fecha_registro);
      case 'nombre':
      default:
        // Alfabético por nombre
        return `${a.nombre} ${a.apellidos}`.localeCompare(`${b.nombre} ${b.apellidos}`);
    }
  });

  return (
    <PageContainer>
      <Header title="Pacientes" showFilter showSearch onSearchClick={toggleSearch} onFilterClick={toggleFilters} />
      
      <SearchSection $isVisible={showSearch}>
        <SearchBar>
          <Search />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar pacientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchBar>
      </SearchSection>

      <FilterSection $isVisible={showFilters}>
        <FilterGroup>
          <FilterLabel>Tipo de paciente:</FilterLabel>
          <FilterTabs>
            {['Todos', 'Adulto', 'Pediátrico'].map((filter) => (
              <FilterTab
                key={filter}
                $active={selectedFilter === filter}
                onClick={() => setSelectedFilter(filter)}
              >
                {filter}
              </FilterTab>
            ))}
          </FilterTabs>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Estado:</FilterLabel>
          <FilterTabs>
            {['Todos', 'Activo', 'Inactivo'].map((status) => (
              <FilterTab
                key={status}
                $active={selectedStatus === status}
                onClick={() => setSelectedStatus(status)}
              >
                {status}
              </FilterTab>
            ))}
          </FilterTabs>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Última cita:</FilterLabel>
          <FilterTabs>
            {['Todos', 'Última semana', 'Último mes', 'Últimos 3 meses', 'Más de 3 meses'].map((visit) => (
              <FilterTab
                key={visit}
                $active={selectedLastVisit === visit}
                onClick={() => setSelectedLastVisit(visit)}
              >
                {visit}
              </FilterTab>
            ))}
          </FilterTabs>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Ordenar por:</FilterLabel>
          <FilterTabs>
            {[
              { value: 'nombre', label: 'Nombre (A-Z)' },
              { value: 'registro_reciente', label: 'Registro más reciente' },
              { value: 'registro_antiguo', label: 'Registro más antiguo' }
            ].map((option) => (
              <FilterTab
                key={option.value}
                $active={orderBy === option.value}
                onClick={() => setOrderBy(option.value)}
              >
                {option.label}
              </FilterTab>
            ))}
          </FilterTabs>
        </FilterGroup>
      </FilterSection>

      <Content>
        {loading ? (
          <LoadingContainer>
            <Loader size={32} />
          </LoadingContainer>
        ) : filteredPatients.length === 0 ? (
          <EmptyState>
            {searchQuery ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
          </EmptyState>
        ) : (
          filteredPatients.map((patient) => (
            <PatientCard 
              key={patient.uuid}
              onClick={() => navigate(`/perfil-paciente/${patient.uuid}`)}
            >
              <PatientImage>
                {patient.foto_url ? (
                  <img src={patient.foto_url} alt={`${patient.nombre} ${patient.apellidos}`} />
                ) : (
                  <User />
                )}
              </PatientImage>
              <PatientInfo>
                <PatientName>{patient.nombre} {patient.apellidos}</PatientName>
                <PatientDetails>Última cita: {formatDate(patient.ultima_cita)}</PatientDetails>
                <StatusBadge $status={patient.activo ? 'Activo' : 'Inactivo'}>
                  {patient.activo ? 'Activo' : 'Inactivo'}
                </StatusBadge>
              </PatientInfo>
              <ChevronIcon />
            </PatientCard>
          ))
        )}
      </Content>

      <FloatingButton onClick={() => navigate('/registro-paciente')} />
    </PageContainer>
  );
};

export default Pacientes;
