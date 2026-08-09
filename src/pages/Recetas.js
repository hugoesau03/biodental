import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Search, Pill, User, Stethoscope, Loader } from 'lucide-react';
import Header from '../components/Layout/Header';
import FloatingButton from '../components/Layout/FloatingButton';
import { recetasService } from '../services/api';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding-bottom: 100px;
  overflow-y: auto;
`;

const Content = styled.div`
  padding: 20px;
`;

const SearchBar = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 20px;

  svg {
    position: absolute;
    left: 16px;
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  input {
    width: 100%;
    padding: 14px 16px 14px 48px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 12px;
    font-size: 15px;
    background: ${({ theme }) => theme.colors.white};

    &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; }
    &::placeholder { color: ${({ theme }) => theme.colors.textSecondary}; }
  }
`;

const RecetaCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 14px;
  padding: 16px 18px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: transform 0.15s ease;

  &:hover { transform: translateY(-1px); }
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const Folio = styled.span`
  font-size: 12px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.primary}15;
  padding: 4px 10px;
  border-radius: 8px;
`;

const FechaText = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  margin-top: 4px;

  svg { width: 14px; height: 14px; color: ${({ theme }) => theme.colors.textSecondary}; flex-shrink: 0; }
`;

const MedsPreview = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 8px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${({ theme }) => theme.colors.textSecondary};

  svg { width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.4; }
`;

const Recetas = () => {
  const navigate = useNavigate();
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchRecetas = useCallback(async (term) => {
    setLoading(true);
    try {
      const res = await recetasService.getAll(term ? { search: term } : {});
      if (res.success) setRecetas(res.data.recetas || []);
    } catch (err) {
      console.error('Error cargando recetas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => fetchRecetas(search), 300);
    return () => clearTimeout(timeout);
  }, [search, fetchRecetas]);

  const getMedsPreview = (medicamentos) => {
    const meds = Array.isArray(medicamentos) ? medicamentos : JSON.parse(medicamentos || '[]');
    return meds.map(m => m.nombre).join(', ');
  };

  return (
    <PageContainer>
      <Header title="Recetas Médicas" showBack />
      <Content>
        <SearchBar>
          <Search />
          <input
            type="text"
            placeholder="Buscar por paciente o folio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </SearchBar>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Loader style={{ animation: 'spin 1s linear infinite', width: 28, height: 28 }} />
          </div>
        ) : recetas.length === 0 ? (
          <EmptyState>
            <Pill />
            <p>No hay recetas registradas</p>
          </EmptyState>
        ) : (
          recetas.map((receta) => (
            <RecetaCard key={receta.uuid} onClick={() => navigate(`/recetas/${receta.uuid}`)}>
              <CardTop>
                <Folio>{receta.numero_receta}</Folio>
                <FechaText>{new Date(receta.fecha_emision).toLocaleDateString('es-MX')}</FechaText>
              </CardTop>
              <InfoRow>
                <User />
                <span>{receta.paciente_nombre} {receta.paciente_apellidos}</span>
              </InfoRow>
              <InfoRow>
                <Stethoscope />
                <span>Dr(a). {receta.doctor_nombre} {receta.doctor_apellidos}</span>
              </InfoRow>
              {receta.diagnostico && (
                <MedsPreview><strong>Diagnóstico:</strong> {receta.diagnostico}</MedsPreview>
              )}
              <MedsPreview>{getMedsPreview(receta.medicamentos)}</MedsPreview>
            </RecetaCard>
          ))
        )}
      </Content>

      <FloatingButton onClick={() => navigate('/recetas/nueva')} />
    </PageContainer>
  );
};

export default Recetas;
