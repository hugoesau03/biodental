import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Calendar, Eye, Edit, Search, Loader, User } from 'lucide-react';
import Header from '../components/Layout/Header';
import FloatingButton from '../components/Layout/FloatingButton';
import { usuariosService } from '../services/api';

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

const DoctorCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
`;

const DoctorHeader = styled.div`
  display: flex;
  gap: 14px;
  margin-bottom: 18px;
`;

const DoctorImage = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
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
    width: 32px;
    height: 32px;
    color: white;
  }
`;

const DoctorInfo = styled.div`
  flex: 1;
`;

const DoctorName = styled.h3`
  font-size: 17px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 4px 0;
`;

const DoctorSpecialty = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 10px 0;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: ${({ $status, theme }) => {
    switch ($status) {
      case 'Disponible':
        return theme.colors.success;
      case 'Ocupado':
        return theme.colors.warning;
      case 'Ausente':
        return theme.colors.danger;
      default:
        return theme.colors.gray;
    }
  }};
  color: ${({ $status, theme }) => {
    switch ($status) {
      case 'Disponible':
        return theme.colors.successText;
      case 'Ocupado':
        return theme.colors.warningText;
      case 'Ausente':
        return theme.colors.dangerText;
      default:
        return theme.colors.text;
    }
  }};
`;

const ActionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ActionButton = styled.button`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  padding: 13px 16px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.info};
  }

  &:active {
    transform: scale(0.98);
  }
`;

const Medicos = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Todos');
  const searchInputRef = useRef(null);

  // Cargar doctores
  const fetchDoctores = useCallback(async () => {
    setLoading(true);
    try {
      const response = await usuariosService.getDoctores();
      if (response.success) {
        setDoctors(response.data.doctores);
      }
    } catch (err) {
      console.error('Error cargando doctores:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctores();
  }, [fetchDoctores]);

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

  const filteredDoctors = doctors.filter(doctor => {
    const fullName = `${doctor.nombre} ${doctor.apellidos}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
      (doctor.especialidad || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'Todos' || 
      (selectedFilter === 'Disponible' && doctor.activo) ||
      (selectedFilter === 'Ausente' && !doctor.activo);
    return matchesSearch && matchesFilter;
  });

  return (
    <PageContainer>
      <Header title="Médicos" showFilter showSearch onSearchClick={toggleSearch} onFilterClick={toggleFilters} />
      
      <SearchSection $isVisible={showSearch}>
        <SearchBar>
          <Search />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar médicos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchBar>
      </SearchSection>

      <FilterSection $isVisible={showFilters}>
        <FilterTabs>
          {['Todos', 'Disponible', 'Ocupado', 'Ausente'].map((filter) => (
            <FilterTab
              key={filter}
              $active={selectedFilter === filter}
              onClick={() => setSelectedFilter(filter)}
            >
              {filter}
            </FilterTab>
          ))}
        </FilterTabs>
      </FilterSection>

      <Content>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            No se encontraron médicos
          </div>
        ) : (
          filteredDoctors.map((doctor) => (
            <DoctorCard key={doctor.uuid}>
              <DoctorHeader>
                <DoctorImage>
                  {doctor.avatar_blob ? (
                    <img src={doctor.avatar_blob} alt={`${doctor.nombre} ${doctor.apellidos}`} />
                  ) : doctor.avatar_url ? (
                    <img src={doctor.avatar_url} alt={`${doctor.nombre} ${doctor.apellidos}`} />
                  ) : (
                    <User />
                  )}
                </DoctorImage>
                <DoctorInfo>
                  <DoctorName>{doctor.nombre} {doctor.apellidos}</DoctorName>
                  <DoctorSpecialty>{doctor.especialidad || 'Médico General'}</DoctorSpecialty>
                  <StatusBadge $status={doctor.activo ? 'Disponible' : 'Ausente'}>
                    {doctor.activo ? 'Disponible' : 'Ausente'}
                  </StatusBadge>
                </DoctorInfo>
              </DoctorHeader>

              <ActionsContainer>
                <ActionButton onClick={() => navigate(`/perfil-medico/${doctor.uuid}`)}>
                  <Eye />
                  Ver Perfil
                </ActionButton>
                <ActionButton onClick={() => navigate(`/gestionar-agenda/${doctor.uuid}`)}>
                  <Calendar />
                  Gestionar Agenda
                </ActionButton>
                <ActionButton onClick={() => navigate(`/gestion-servicios/${doctor.uuid}`)}>
                  <Edit />
                  Editar Servicios
                </ActionButton>
              </ActionsContainer>
            </DoctorCard>
          ))
        )}
      </Content>

    </PageContainer>
  );
};

export default Medicos;
