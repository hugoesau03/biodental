import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Gift, X, Loader, Trash2, Edit2 } from 'lucide-react';
import Header from '../components/Layout/Header';
import FloatingButton from '../components/Layout/FloatingButton';
import { promocionesService } from '../services/api';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding-bottom: 100px;
  overflow-y: auto;
`;

const Content = styled.div`
  padding: 20px;
`;

const Intro = styled.p`
  font-size: 13.5px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 20px;
`;

const PromoCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 14px;
  padding: 16px 18px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  opacity: ${({ $activa }) => ($activa ? 1 : 0.55)};
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
`;

const Titulo = styled.h3`
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 4px;
`;

const Mensaje = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 8px;
`;

const Vigencia = styled.span`
  font-size: 11.5px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Actions = styled.div`
  display: flex;
  gap: 6px;
  flex-shrink: 0;
`;

const IconBtn = styled.button`
  background: ${({ theme }) => theme.colors.background};
  border: none;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};

  &:hover { color: ${({ theme }) => theme.colors.primary}; }
  svg { width: 16px; height: 16px; }
`;

const ActivaToggle = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  margin-top: 6px;

  input { accent-color: ${({ theme }) => theme.colors.primary}; }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${({ theme }) => theme.colors.textSecondary};

  svg { width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.5; }
`;

const CenteredLoader = styled.div`
  display: flex;
  justify-content: center;
  padding: 60px 0;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 20px;
  width: 100%;
  max-width: 440px;
  max-height: 85vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  h2 { font-size: 17px; margin: 0; color: ${({ theme }) => theme.colors.text}; }
  button { background: none; border: none; cursor: pointer; color: ${({ theme }) => theme.colors.textSecondary}; }
`;

const ModalBody = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const FormLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 6px;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  font-size: 14px;
  background: ${({ theme }) => theme.colors.background};
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  font-size: 14px;
  background: ${({ theme }) => theme.colors.background};
  resize: vertical;
  min-height: 80px;
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; }
`;

const DateRow = styled.div`
  display: flex;
  gap: 10px;
  > div { flex: 1; }
`;

const SaveButton = styled.button`
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #33A9FF 0%, #1E88E5 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const formVacio = { titulo: '', mensaje: '', fecha_inicio: '', fecha_fin: '', activa: true };

const Promociones = () => {
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(formVacio);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await promocionesService.getAll();
      setPromociones(res.data?.promociones || []);
    } catch (err) {
      console.error('Error cargando promociones:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirNueva = () => {
    setEditando(null);
    setForm(formVacio);
    setModalAbierto(true);
  };

  const abrirEditar = (promo) => {
    setEditando(promo);
    setForm({
      titulo: promo.titulo,
      mensaje: promo.mensaje,
      fecha_inicio: promo.fecha_inicio ? String(promo.fecha_inicio).substring(0, 10) : '',
      fecha_fin: promo.fecha_fin ? String(promo.fecha_fin).substring(0, 10) : '',
      activa: !!promo.activa
    });
    setModalAbierto(true);
  };

  const guardar = async () => {
    if (!form.titulo || !form.mensaje) {
      alert('Título y mensaje son requeridos');
      return;
    }
    setGuardando(true);
    try {
      if (editando) {
        await promocionesService.update(editando.uuid, form);
      } else {
        await promocionesService.create(form);
      }
      setModalAbierto(false);
      await cargar();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al guardar la promoción');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (promo) => {
    if (!window.confirm(`¿Eliminar la promoción "${promo.titulo}"?`)) return;
    try {
      await promocionesService.delete(promo.uuid);
      await cargar();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar la promoción');
    }
  };

  const toggleActiva = async (promo) => {
    try {
      await promocionesService.update(promo.uuid, { activa: !promo.activa });
      await cargar();
    } catch (err) {
      alert('Error al actualizar la promoción');
    }
  };

  return (
    <PageContainer>
      <Header title="Promociones" showBack />
      <Content>
        <Intro>
          Las promociones activas y vigentes se muestran automáticamente a todos los pacientes en su portal (app paciente).
        </Intro>

        {loading ? (
          <CenteredLoader><Loader style={{ animation: 'spin 1s linear infinite', width: 32, height: 32 }} /></CenteredLoader>
        ) : promociones.length === 0 ? (
          <EmptyState>
            <Gift />
            <p>Aún no has creado promociones.</p>
          </EmptyState>
        ) : (
          promociones.map((promo) => (
            <PromoCard key={promo.uuid} $activa={promo.activa}>
              <CardTop>
                <div>
                  <Titulo>{promo.titulo}</Titulo>
                  <Mensaje>{promo.mensaje}</Mensaje>
                  {(promo.fecha_inicio || promo.fecha_fin) && (
                    <Vigencia>
                      Vigencia: {promo.fecha_inicio ? String(promo.fecha_inicio).substring(0, 10) : '—'} a {promo.fecha_fin ? String(promo.fecha_fin).substring(0, 10) : '—'}
                    </Vigencia>
                  )}
                </div>
                <Actions>
                  <IconBtn onClick={() => abrirEditar(promo)}><Edit2 /></IconBtn>
                  <IconBtn onClick={() => eliminar(promo)}><Trash2 /></IconBtn>
                </Actions>
              </CardTop>
              <ActivaToggle>
                <input type="checkbox" checked={!!promo.activa} onChange={() => toggleActiva(promo)} />
                {promo.activa ? 'Visible para pacientes' : 'Oculta'}
              </ActivaToggle>
            </PromoCard>
          ))
        )}
      </Content>

      <FloatingButton onClick={abrirNueva} />

      {modalAbierto && (
        <ModalOverlay onClick={() => setModalAbierto(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2>{editando ? 'Editar promoción' : 'Nueva promoción'}</h2>
              <button onClick={() => setModalAbierto(false)}><X /></button>
            </ModalHeader>
            <ModalBody>
              <div>
                <FormLabel>Título</FormLabel>
                <FormInput value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="20% de descuento en limpieza dental" />
              </div>
              <div>
                <FormLabel>Mensaje</FormLabel>
                <FormTextarea value={form.mensaje} onChange={(e) => setForm({ ...form, mensaje: e.target.value })} placeholder="Detalles de la promoción para el paciente" />
              </div>
              <DateRow>
                <div>
                  <FormLabel>Desde (opcional)</FormLabel>
                  <FormInput type="date" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} />
                </div>
                <div>
                  <FormLabel>Hasta (opcional)</FormLabel>
                  <FormInput type="date" value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} />
                </div>
              </DateRow>
              <ActivaToggle>
                <input type="checkbox" checked={form.activa} onChange={(e) => setForm({ ...form, activa: e.target.checked })} />
                Visible para pacientes
              </ActivaToggle>
              <SaveButton onClick={guardar} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar promoción'}
              </SaveButton>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default Promociones;
