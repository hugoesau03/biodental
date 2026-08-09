import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FileText, Plus, Trash2, Printer, Check, User, Loader } from 'lucide-react';
import Header from '../components/Layout/Header';
import Modal from '../components/Modal';
import { pacientesService, serviciosService, presupuestosService, consultorioService } from '../services/api';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding-bottom: 100px;
  overflow-y: auto;
`;

const Content = styled.div`
  padding: 20px;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 16px 0;

  svg { width: 18px; height: 18px; color: ${({ theme }) => theme.colors.primary}; }
`;

const PersonRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: ${({ theme }) => theme.colors.background};
  border-radius: 12px;

  svg { width: 20px; height: 20px; color: ${({ theme }) => theme.colors.textSecondary}; flex-shrink: 0; }
`;

const SearchWrapper = styled.div`
  position: relative;
`;

const SuggestionsList = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  margin-top: 4px;
  max-height: 220px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const SuggestionItem = styled.div`
  padding: 10px 14px;
  cursor: pointer;
  font-size: 14px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.background};

  &:hover { background: ${({ theme }) => theme.colors.background}; }
  &:last-child { border-bottom: none; }
`;

const ItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  margin-bottom: 10px;
`;

const ItemInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const SmallInput = styled.input`
  width: 60px;
  padding: 6px 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
`;

const PriceInput = styled.input`
  width: 90px;
  padding: 6px 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  text-align: right;
  font-size: 14px;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.danger};
  cursor: pointer;
  padding: 4px;
  display: flex;

  svg { width: 18px; height: 18px; }
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  font-size: 14px;

  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;

  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  font-size: 14px;
  background: white;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border: 2px dashed ${({ theme }) => theme.colors.primary};
  border-radius: 12px;
  background: none;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  margin-top: 8px;

  svg { width: 18px; height: 18px; }
`;

const TotalsSection = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};

  &.final {
    font-size: 18px;
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    color: ${({ theme }) => theme.colors.text};
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    margin-top: 8px;
    padding-top: 12px;
  }
`;

const EstadoBadge = styled.span`
  font-size: 12px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  padding: 5px 12px;
  border-radius: 8px;
  text-transform: uppercase;
  background: ${({ $estado }) => {
    switch ($estado) {
      case 'aceptado': return '#DCFCE7';
      case 'rechazado': return '#FEE2E2';
      case 'vencido': return '#F3F4F6';
      default: return '#FEF3C7';
    }
  }};
  color: ${({ $estado }) => {
    switch ($estado) {
      case 'aceptado': return '#16A34A';
      case 'rechazado': return '#DC2626';
      case 'vencido': return '#6B7280';
      default: return '#B45309';
    }
  }};
`;

const FooterActions = styled.div`
  display: flex;
  gap: 12px;
  padding: 20px;
  position: sticky;
  bottom: 0;
  background: ${({ theme }) => theme.colors.white};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const ActionButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  border: none;

  &:disabled { opacity: 0.6; cursor: not-allowed; }

  svg { width: 18px; height: 18px; }
`;

const PrimaryButton = styled(ActionButton)`
  background: ${({ theme }) => theme.colors.primary};
  color: white;
`;

const SecondaryButton = styled(ActionButton)`
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const estadoLabel = {
  pendiente: 'Pendiente',
  aceptado: 'Aceptado',
  rechazado: 'Rechazado',
  vencido: 'Vencido'
};

const GenerarPresupuesto = () => {
  const { uuid } = useParams();
  const isNew = !uuid;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clinicName, setClinicName] = useState('');
  const [servicios, setServicios] = useState([]);

  // Modo edición: presupuesto ya guardado (existente o recién creado)
  const [presupuesto, setPresupuesto] = useState(null);

  // Selección de paciente (solo en modo creación)
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [items, setItems] = useState([]);
  const [selectedServicioUuid, setSelectedServicioUuid] = useState('');
  const [descuento, setDescuento] = useState('0');
  const [validezDias, setValidezDias] = useState('15');
  const [notas, setNotas] = useState('');

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      try {
        const [consultorioRes, serviciosRes] = await Promise.all([
          consultorioService.get(),
          serviciosService.getAll()
        ]);
        if (consultorioRes.data) setClinicName(consultorioRes.data.nombre || 'Clínica Médica');
        if (serviciosRes.success) setServicios(serviciosRes.data.servicios || []);

        if (!isNew) {
          const presupuestoRes = await presupuestosService.getByUuid(uuid);
          if (presupuestoRes.success) {
            const data = presupuestoRes.data;
            setPresupuesto(data);
            setItems((data.items || []).map(it => ({
              tipo: it.tipo,
              descripcion: it.descripcion,
              cantidad: it.cantidad,
              precio_unitario: it.precio_unitario
            })));
            setDescuento(String(data.descuento || 0));
            setValidezDias(String(data.validez_dias || 15));
            setNotas(data.notas || '');
          }
        } else {
          const patientsRes = await pacientesService.getAll();
          if (patientsRes.success) setPatients(patientsRes.data.pacientes || []);
        }
      } catch (err) {
        console.error('Error cargando datos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  const filteredPatients = patients.filter(p => {
    const term = patientSearch.toLowerCase();
    const fullName = `${p.nombre} ${p.apellidos || ''}`.toLowerCase();
    return term.length > 0 && (fullName.includes(term) || (p.numero_expediente || '').toLowerCase().includes(term));
  }).slice(0, 8);

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setPatientSearch(`${patient.nombre} ${patient.apellidos || ''}`.trim());
    setShowSuggestions(false);
  };

  const handleAddServicio = () => {
    const servicio = servicios.find(s => s.uuid === selectedServicioUuid);
    if (!servicio) return;
    setItems(prev => [...prev, {
      tipo: 'servicio',
      descripcion: servicio.nombre,
      cantidad: 1,
      precio_unitario: parseFloat(servicio.precio) || 0
    }]);
    setSelectedServicioUuid('');
  };

  const handleAddManual = () => {
    setItems(prev => [...prev, { tipo: 'producto', descripcion: '', cantidad: 1, precio_unitario: 0 }]);
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, [field]: value } : it));
  };

  const handleRemoveItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, it) => sum + (parseFloat(it.precio_unitario) || 0) * (parseInt(it.cantidad) || 0), 0);
  const descuentoNum = parseFloat(descuento) || 0;
  const total = Math.max(subtotal - descuentoNum, 0);

  const handleGuardar = async () => {
    const itemsValidos = items.filter(it => it.descripcion.trim() && parseFloat(it.precio_unitario) >= 0 && parseInt(it.cantidad) > 0);
    if (itemsValidos.length === 0) {
      setErrorMessage('Agrega al menos un servicio o producto al presupuesto');
      setShowErrorModal(true);
      return;
    }

    if (isNew && !selectedPatient) {
      setErrorMessage('Selecciona un paciente');
      setShowErrorModal(true);
      return;
    }

    setSaving(true);
    try {
      let response;
      if (isNew) {
        response = await presupuestosService.create({
          paciente_uuid: selectedPatient.uuid,
          items: itemsValidos,
          descuento: descuentoNum,
          validez_dias: parseInt(validezDias) || 15,
          notas: notas || null
        });
      } else {
        response = await presupuestosService.update(uuid, {
          items: itemsValidos,
          descuento: descuentoNum,
          validez_dias: parseInt(validezDias) || 15,
          notas: notas || null
        });
      }

      if (response.success) {
        const finalUuid = isNew ? response.data.uuid : uuid;
        navigate(`/presupuestos/${finalUuid}`, { replace: true });
        const completo = await presupuestosService.getByUuid(finalUuid);
        if (completo.success) setPresupuesto(completo.data);
      } else {
        setErrorMessage(response.message || 'Error al guardar el presupuesto');
        setShowErrorModal(true);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error al guardar el presupuesto');
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const handleEstadoChange = async (nuevoEstado) => {
    try {
      const res = await presupuestosService.updateEstado(uuid, nuevoEstado);
      if (res.success) {
        const completo = await presupuestosService.getByUuid(uuid);
        if (completo.success) setPresupuesto(completo.data);
      }
    } catch (err) {
      console.error('Error actualizando estado:', err);
    }
  };

  const generatePrintableContent = (data) => {
    const itemsHTML = (data.items || []).map(it => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${it.descripcion}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${it.cantidad}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${parseFloat(it.precio_unitario).toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${parseFloat(it.total).toFixed(2)}</td>
      </tr>
    `).join('');

    const fecha = new Date(data.fecha_emision).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    const vencimiento = new Date(data.fecha_emision);
    vencimiento.setDate(vencimiento.getDate() + (data.validez_dias || 15));
    const fechaVencimiento = vencimiento.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Presupuesto - ${data.numero_presupuesto}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; }
          .header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #4F46E5; }
          .header h1 { color: #4F46E5; font-size: 26px; }
          .header p { color: #666; font-size: 13px; margin-top: 2px; }
          .folio { background: #f3f4f6; padding: 8px 18px; border-radius: 8px; display: inline-block; margin-top: 12px; font-weight: bold; color: #4F46E5; font-size: 13px; }
          .info-section { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
          .info-box { flex: 1; background: #f9fafb; padding: 14px; border-radius: 8px; }
          .info-box h3 { font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 6px; }
          .info-box p { font-size: 13px; margin-bottom: 3px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #4F46E5; color: white; padding: 10px 8px; text-align: left; font-size: 13px; }
          th:nth-child(2), th:nth-child(3) { text-align: center; }
          th:last-child { text-align: right; }
          .totals { margin-top: 16px; text-align: right; }
          .total-row { display: flex; justify-content: flex-end; padding: 6px 0; font-size: 14px; }
          .total-row span:first-child { margin-right: 40px; color: #666; }
          .total-row.final { font-size: 18px; font-weight: bold; color: #4F46E5; border-top: 2px solid #4F46E5; padding-top: 12px; margin-top: 8px; }
          .aviso { margin-top: 24px; padding: 12px; background: #FFF8E1; border-radius: 8px; font-size: 12px; color: #92620A; }
          @media print { body { padding: 20px; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${clinicName || 'Clínica Médica'}</h1>
          <p>Presupuesto / Cotización</p>
          <div class="folio">${data.numero_presupuesto}</div>
        </div>

        <div class="info-section">
          <div class="info-box">
            <h3>Paciente</h3>
            <p><strong>${data.paciente_nombre} ${data.paciente_apellidos || ''}</strong></p>
          </div>
          <div class="info-box">
            <h3>Detalles</h3>
            <p>Fecha: ${fecha}</p>
            <p>Válido hasta: ${fechaVencimiento}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr><th>Descripción</th><th>Cant.</th><th>Precio</th><th>Total</th></tr>
          </thead>
          <tbody>${itemsHTML}</tbody>
        </table>

        <div class="totals">
          <div class="total-row"><span>Subtotal:</span><span>$${parseFloat(data.subtotal).toFixed(2)}</span></div>
          ${parseFloat(data.descuento) > 0 ? `<div class="total-row"><span>Descuento:</span><span>-$${parseFloat(data.descuento).toFixed(2)}</span></div>` : ''}
          <div class="total-row final"><span>Total:</span><span>$${parseFloat(data.total).toFixed(2)}</span></div>
        </div>

        ${data.notas ? `<div class="aviso"><strong>Notas:</strong> ${data.notas}</div>` : ''}
        <div class="aviso">Este documento es una cotización estimada y no representa un cobro. Los precios pueden variar.</div>
      </body>
      </html>
    `;
  };

  const handleImprimir = () => {
    if (!presupuesto) return;
    const printContent = generatePrintableContent(presupuesto);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (loading) {
    return (
      <PageContainer>
        <Header title="Presupuesto" showBack />
        <Content style={{ textAlign: 'center', paddingTop: 60 }}>
          <Loader style={{ animation: 'spin 1s linear infinite', width: 32, height: 32 }} />
        </Content>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header title={isNew ? 'Nuevo Presupuesto' : `Presupuesto ${presupuesto?.numero_presupuesto || ''}`} showBack />
      <Content>
        <Card>
          <SectionTitle><User />Paciente</SectionTitle>
          {isNew ? (
            selectedPatient ? (
              <PersonRow>
                <User />
                <span>{selectedPatient.nombre} {selectedPatient.apellidos}</span>
                <button
                  type="button"
                  onClick={() => { setSelectedPatient(null); setPatientSearch(''); }}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#6366F1', cursor: 'pointer', fontSize: 13 }}
                >
                  Cambiar
                </button>
              </PersonRow>
            ) : (
              <SearchWrapper>
                <Input
                  type="text"
                  placeholder="Buscar paciente por nombre..."
                  value={patientSearch}
                  onChange={(e) => { setPatientSearch(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => patientSearch.length > 0 && setShowSuggestions(true)}
                />
                {showSuggestions && filteredPatients.length > 0 && (
                  <SuggestionsList>
                    {filteredPatients.map(p => (
                      <SuggestionItem key={p.uuid} onClick={() => handleSelectPatient(p)}>
                        {p.nombre} {p.apellidos}
                      </SuggestionItem>
                    ))}
                  </SuggestionsList>
                )}
              </SearchWrapper>
            )
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <PersonRow style={{ flex: 1 }}>
                <User />
                <span>{presupuesto?.paciente_nombre} {presupuesto?.paciente_apellidos}</span>
              </PersonRow>
              <EstadoBadge $estado={presupuesto?.estado}>{estadoLabel[presupuesto?.estado] || presupuesto?.estado}</EstadoBadge>
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle><FileText />Servicios y Productos</SectionTitle>

          {servicios.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <Select value={selectedServicioUuid} onChange={(e) => setSelectedServicioUuid(e.target.value)}>
                <option value="">Seleccionar servicio...</option>
                {servicios.map(s => (
                  <option key={s.uuid} value={s.uuid}>{s.nombre} — ${parseFloat(s.precio).toFixed(2)}</option>
                ))}
              </Select>
              <SecondaryButton
                type="button"
                onClick={handleAddServicio}
                disabled={!selectedServicioUuid}
                style={{ flex: '0 0 auto', padding: '10px 16px' }}
              >
                <Plus /> Agregar
              </SecondaryButton>
            </div>
          )}

          {items.map((item, index) => (
            <ItemRow key={index}>
              <ItemInfo>
                <Input
                  placeholder="Descripción"
                  value={item.descripcion}
                  onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                  style={{ marginBottom: 6 }}
                />
              </ItemInfo>
              <SmallInput
                type="number"
                min="1"
                value={item.cantidad}
                onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
              />
              <PriceInput
                type="number"
                min="0"
                step="0.01"
                value={item.precio_unitario}
                onChange={(e) => handleItemChange(index, 'precio_unitario', e.target.value)}
              />
              <RemoveButton type="button" onClick={() => handleRemoveItem(index)}>
                <Trash2 />
              </RemoveButton>
            </ItemRow>
          ))}

          <AddButton type="button" onClick={handleAddManual}>
            <Plus /> Agregar Item Manual
          </AddButton>

          <TotalsSection>
            <TotalRow><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></TotalRow>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <Label style={{ marginBottom: 0, flex: 1 }}>Descuento ($)</Label>
              <PriceInput
                type="number"
                min="0"
                step="0.01"
                value={descuento}
                onChange={(e) => setDescuento(e.target.value)}
              />
            </div>
            <TotalRow className="final"><span>Total</span><span>${total.toFixed(2)}</span></TotalRow>
          </TotalsSection>
        </Card>

        <Card>
          <SectionTitle><FileText />Detalles</SectionTitle>
          <div style={{ marginBottom: 12 }}>
            <Label>Validez (días)</Label>
            <Input
              type="number"
              min="1"
              value={validezDias}
              onChange={(e) => setValidezDias(e.target.value)}
            />
          </div>
          <div>
            <Label>Notas (opcional)</Label>
            <TextArea
              placeholder="Condiciones, observaciones..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>

          {!isNew && (
            <div style={{ marginTop: 16 }}>
              <Label>Estado del presupuesto</Label>
              <Select value={presupuesto?.estado || 'pendiente'} onChange={(e) => handleEstadoChange(e.target.value)}>
                <option value="pendiente">Pendiente</option>
                <option value="aceptado">Aceptado</option>
                <option value="rechazado">Rechazado</option>
                <option value="vencido">Vencido</option>
              </Select>
            </div>
          )}
        </Card>
      </Content>

      <FooterActions>
        <SecondaryButton onClick={() => navigate('/presupuestos')}>
          {isNew ? 'Cancelar' : 'Volver a Presupuestos'}
        </SecondaryButton>
        {!isNew && (
          <SecondaryButton onClick={handleImprimir}>
            <Printer /> Imprimir
          </SecondaryButton>
        )}
        <PrimaryButton onClick={handleGuardar} disabled={saving}>
          <Check /> {saving ? 'Guardando...' : isNew ? 'Guardar Presupuesto' : 'Guardar Cambios'}
        </PrimaryButton>
      </FooterActions>

      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        message={errorMessage}
        type="error"
        confirmText="Entendido"
      />
    </PageContainer>
  );
};

export default GenerarPresupuesto;
