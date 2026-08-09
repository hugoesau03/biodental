import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Pill, Plus, Trash2, Printer, Check, User, Stethoscope, Loader, Calendar } from 'lucide-react';
import Header from '../components/Layout/Header';
import Modal from '../components/Modal';
import { pacientesService, usuariosService, citasService, recetasService, consultorioService } from '../services/api';
import { useAuth } from '../context/AuthContext';

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
  margin-bottom: 10px;

  svg { width: 20px; height: 20px; color: ${({ theme }) => theme.colors.textSecondary}; flex-shrink: 0; }
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 6px;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 70px;

  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; }
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  font-size: 14px;

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

const MedicamentoCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  position: relative;
`;

const MedicamentoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.danger};
  cursor: pointer;
  padding: 4px;
  display: flex;

  svg { width: 18px; height: 18px; }
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

  svg { width: 18px; height: 18px; }
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

const medicamentoVacio = () => ({ nombre: '', presentacion: '', dosis: '', frecuencia: '', duracion: '', indicaciones: '' });

const GenerarReceta = () => {
  const { uuid } = useParams();
  const isNew = !uuid;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clinicName, setClinicName] = useState('');

  // Modo edición: receta ya guardada (existente o recién creada)
  const [receta, setReceta] = useState(null);

  // Selección de paciente (solo en modo creación)
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Selección de doctor y cita opcional (solo en modo creación)
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorUuid, setSelectedDoctorUuid] = useState('');
  const [patientCitas, setPatientCitas] = useState([]);
  const [selectedCitaUuid, setSelectedCitaUuid] = useState('');

  const [diagnostico, setDiagnostico] = useState('');
  const [indicacionesGenerales, setIndicacionesGenerales] = useState('');
  const [medicamentos, setMedicamentos] = useState([medicamentoVacio()]);

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      try {
        const consultorioRes = await consultorioService.get();
        if (consultorioRes.data) setClinicName(consultorioRes.data.nombre || 'Clínica Médica');

        if (!isNew) {
          const recetaRes = await recetasService.getByUuid(uuid);
          if (recetaRes.success) {
            const data = recetaRes.data;
            setReceta(data);
            setDiagnostico(data.diagnostico || '');
            setIndicacionesGenerales(data.indicaciones_generales || '');
            const meds = Array.isArray(data.medicamentos) ? data.medicamentos : JSON.parse(data.medicamentos || '[]');
            setMedicamentos(meds.length > 0 ? meds : [medicamentoVacio()]);
          }
        } else {
          const [patientsRes, doctorsRes] = await Promise.all([
            pacientesService.getAll(),
            usuariosService.getDoctores()
          ]);
          if (patientsRes.success) setPatients(patientsRes.data.pacientes || []);
          if (doctorsRes.success) {
            setDoctors(doctorsRes.data.doctores || []);
            if (user?.rol === 'doctor') setSelectedDoctorUuid(user.uuid);
          }
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

  // Cargar citas recientes del paciente seleccionado (para vincular opcionalmente)
  useEffect(() => {
    const fetchCitas = async () => {
      if (!selectedPatient) {
        setPatientCitas([]);
        return;
      }
      try {
        const res = await citasService.getAll({ paciente_id: selectedPatient.uuid, limit: 10 });
        if (res.success) setPatientCitas(res.data.citas || []);
      } catch (err) {
        console.error('Error cargando citas del paciente:', err);
      }
    };
    fetchCitas();
  }, [selectedPatient]);

  const filteredPatients = patients.filter(p => {
    const term = patientSearch.toLowerCase();
    const fullName = `${p.nombre} ${p.apellidos || ''}`.toLowerCase();
    return term.length > 0 && (fullName.includes(term) || (p.numero_expediente || '').toLowerCase().includes(term));
  }).slice(0, 8);

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setPatientSearch(`${patient.nombre} ${patient.apellidos || ''}`.trim());
    setShowSuggestions(false);
    setSelectedCitaUuid('');
  };

  const handleMedChange = (index, field, value) => {
    setMedicamentos(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const handleAddMedicamento = () => {
    setMedicamentos(prev => [...prev, medicamentoVacio()]);
  };

  const handleRemoveMedicamento = (index) => {
    setMedicamentos(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
  };

  const handleGuardar = async () => {
    const medicamentosValidos = medicamentos.filter(m => m.nombre.trim());
    if (medicamentosValidos.length === 0) {
      setErrorMessage('Agrega al menos un medicamento con nombre');
      setShowErrorModal(true);
      return;
    }

    if (isNew && !selectedPatient) {
      setErrorMessage('Selecciona un paciente');
      setShowErrorModal(true);
      return;
    }

    if (isNew && user?.rol !== 'doctor' && !selectedDoctorUuid) {
      setErrorMessage('Selecciona el doctor que emite la receta');
      setShowErrorModal(true);
      return;
    }

    setSaving(true);
    try {
      let response;
      if (isNew) {
        response = await recetasService.create({
          paciente_uuid: selectedPatient.uuid,
          doctor_uuid: selectedDoctorUuid || undefined,
          cita_uuid: selectedCitaUuid || undefined,
          diagnostico: diagnostico || null,
          medicamentos: medicamentosValidos,
          indicaciones_generales: indicacionesGenerales || null
        });
      } else {
        response = await recetasService.update(uuid, {
          diagnostico: diagnostico || null,
          medicamentos: medicamentosValidos,
          indicaciones_generales: indicacionesGenerales || null
        });
      }

      if (response.success) {
        const finalUuid = isNew ? response.data.uuid : uuid;
        navigate(`/recetas/${finalUuid}`, { replace: true });
        const completo = await recetasService.getByUuid(finalUuid);
        if (completo.success) {
          setReceta(completo.data);
        }
      } else {
        setErrorMessage(response.message || 'Error al guardar la receta');
        setShowErrorModal(true);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error al guardar la receta');
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const generatePrintableContent = (data) => {
    const meds = Array.isArray(data.medicamentos) ? data.medicamentos : JSON.parse(data.medicamentos || '[]');
    const medsHTML = meds.map((m, i) => `
      <div style="margin-bottom: 14px; padding-bottom: 14px; ${i < meds.length - 1 ? 'border-bottom: 1px dashed #ddd;' : ''}">
        <div style="font-weight: bold; font-size: 15px; color: #1F2937;">${i + 1}. ${m.nombre}${m.presentacion ? ` — ${m.presentacion}` : ''}</div>
        <div style="font-size: 13px; color: #4B5563; margin-top: 4px;">
          ${m.dosis ? `<strong>Dosis:</strong> ${m.dosis} &nbsp;&nbsp;` : ''}
          ${m.frecuencia ? `<strong>Frecuencia:</strong> ${m.frecuencia} &nbsp;&nbsp;` : ''}
          ${m.duracion ? `<strong>Duración:</strong> ${m.duracion}` : ''}
        </div>
        ${m.indicaciones ? `<div style="font-size: 13px; color: #6B7280; margin-top: 4px;">${m.indicaciones}</div>` : ''}
      </div>
    `).join('');

    const fecha = new Date(data.fecha_emision).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receta - ${data.numero_receta}</title>
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
          .rx-symbol { font-size: 28px; font-weight: bold; color: #4F46E5; margin-bottom: 12px; }
          .diagnostico { background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; }
          .footer { margin-top: 60px; text-align: center; }
          .firma-line { border-top: 1px solid #333; width: 260px; margin: 0 auto; padding-top: 8px; font-size: 12px; color: #666; }
          @media print { body { padding: 20px; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${clinicName || 'Clínica Médica'}</h1>
          <p>Receta Médica</p>
          <div class="folio">${data.numero_receta}</div>
        </div>

        <div class="info-section">
          <div class="info-box">
            <h3>Paciente</h3>
            <p><strong>${data.paciente_nombre} ${data.paciente_apellidos || ''}</strong></p>
          </div>
          <div class="info-box">
            <h3>Médico</h3>
            <p><strong>Dr(a). ${data.doctor_nombre} ${data.doctor_apellidos || ''}</strong></p>
            ${data.numero_licencia ? `<p>Cédula: ${data.numero_licencia}</p>` : ''}
            <p>Fecha: ${fecha}</p>
          </div>
        </div>

        ${data.diagnostico ? `<div class="diagnostico"><strong>Diagnóstico:</strong> ${data.diagnostico}</div>` : ''}

        <div class="rx-symbol">℞</div>
        ${medsHTML}

        ${data.indicaciones_generales ? `<div class="diagnostico" style="margin-top: 16px;"><strong>Indicaciones generales:</strong> ${data.indicaciones_generales}</div>` : ''}

        <div class="footer">
          <div class="firma-line">Firma del médico</div>
        </div>
      </body>
      </html>
    `;
  };

  const handleImprimir = () => {
    if (!receta) return;
    const printContent = generatePrintableContent(receta);
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
        <Header title="Receta Médica" showBack />
        <Content style={{ textAlign: 'center', paddingTop: 60 }}>
          <Loader style={{ animation: 'spin 1s linear infinite', width: 32, height: 32 }} />
        </Content>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header title={isNew ? 'Nueva Receta' : `Receta ${receta?.numero_receta || ''}`} showBack />
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
            <PersonRow>
              <User />
              <span>{receta?.paciente_nombre} {receta?.paciente_apellidos}</span>
            </PersonRow>
          )}

          <SectionTitle style={{ marginTop: 16 }}><Stethoscope />Médico</SectionTitle>
          {isNew ? (
            user?.rol === 'doctor' ? (
              <PersonRow>
                <Stethoscope />
                <span>Dr(a). {user.nombre} {user.apellidos}</span>
              </PersonRow>
            ) : (
              <Select value={selectedDoctorUuid} onChange={(e) => setSelectedDoctorUuid(e.target.value)}>
                <option value="">Seleccionar doctor...</option>
                {doctors.map(d => (
                  <option key={d.uuid} value={d.uuid}>Dr(a). {d.nombre} {d.apellidos}</option>
                ))}
              </Select>
            )
          ) : (
            <PersonRow>
              <Stethoscope />
              <span>Dr(a). {receta?.doctor_nombre} {receta?.doctor_apellidos}</span>
            </PersonRow>
          )}

          {isNew && selectedPatient && patientCitas.length > 0 && (
            <>
              <SectionTitle style={{ marginTop: 16 }}><Calendar />Vincular a una cita (opcional)</SectionTitle>
              <Select value={selectedCitaUuid} onChange={(e) => setSelectedCitaUuid(e.target.value)}>
                <option value="">Sin cita asociada</option>
                {patientCitas.map(c => (
                  <option key={c.uuid} value={c.uuid}>
                    {new Date(c.fecha).toLocaleDateString('es-MX')} {String(c.hora_inicio).substring(0, 5)} — {c.tipo || 'Consulta'}
                  </option>
                ))}
              </Select>
            </>
          )}
        </Card>

        <Card>
          <SectionTitle><Pill />Diagnóstico</SectionTitle>
          <TextArea
            placeholder="Diagnóstico (opcional)"
            value={diagnostico}
            onChange={(e) => setDiagnostico(e.target.value)}
          />
        </Card>

        <Card>
          <SectionTitle><Pill />Medicamentos</SectionTitle>
          {medicamentos.map((med, index) => (
            <MedicamentoCard key={index}>
              {medicamentos.length > 1 && (
                <RemoveButton type="button" onClick={() => handleRemoveMedicamento(index)}>
                  <Trash2 />
                </RemoveButton>
              )}
              <div style={{ marginBottom: 10 }}>
                <Label>Medicamento *</Label>
                <Input
                  placeholder="Ej. Paracetamol"
                  value={med.nombre}
                  onChange={(e) => handleMedChange(index, 'nombre', e.target.value)}
                />
              </div>
              <MedicamentoGrid>
                <div>
                  <Label>Presentación</Label>
                  <Input
                    placeholder="Ej. Tabletas 500mg"
                    value={med.presentacion}
                    onChange={(e) => handleMedChange(index, 'presentacion', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Dosis</Label>
                  <Input
                    placeholder="Ej. 1 tableta"
                    value={med.dosis}
                    onChange={(e) => handleMedChange(index, 'dosis', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Frecuencia</Label>
                  <Input
                    placeholder="Ej. Cada 8 horas"
                    value={med.frecuencia}
                    onChange={(e) => handleMedChange(index, 'frecuencia', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Duración</Label>
                  <Input
                    placeholder="Ej. 7 días"
                    value={med.duracion}
                    onChange={(e) => handleMedChange(index, 'duracion', e.target.value)}
                  />
                </div>
              </MedicamentoGrid>
              <div>
                <Label>Indicaciones específicas</Label>
                <Input
                  placeholder="Ej. Tomar con alimentos"
                  value={med.indicaciones}
                  onChange={(e) => handleMedChange(index, 'indicaciones', e.target.value)}
                />
              </div>
            </MedicamentoCard>
          ))}
          <AddButton type="button" onClick={handleAddMedicamento}>
            <Plus /> Agregar Medicamento
          </AddButton>
        </Card>

        <Card>
          <SectionTitle><Pill />Indicaciones Generales</SectionTitle>
          <TextArea
            placeholder="Reposo, dieta, seguimiento, etc. (opcional)"
            value={indicacionesGenerales}
            onChange={(e) => setIndicacionesGenerales(e.target.value)}
          />
        </Card>
      </Content>

      <FooterActions>
        <SecondaryButton onClick={() => navigate('/recetas')}>
          {isNew ? 'Cancelar' : 'Volver a Recetas'}
        </SecondaryButton>
        {!isNew && (
          <SecondaryButton onClick={handleImprimir}>
            <Printer /> Imprimir
          </SecondaryButton>
        )}
        <PrimaryButton onClick={handleGuardar} disabled={saving}>
          <Check /> {saving ? 'Guardando...' : isNew ? 'Guardar Receta' : 'Guardar Cambios'}
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

export default GenerarReceta;
