import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, FileText, Link as LinkIcon, Eye, Upload, Image, File, Trash2, X, ChevronRight, ChevronLeft, Plus, Check, Loader, Edit2, User, Download, FolderDown, UserX, UserCheck } from 'lucide-react';
import Header from '../components/Layout/Header';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { pacientesService, citasService, documentosService, formulariosService } from '../services/api';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { PDFDocument } from 'pdf-lib';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding-bottom: 80px;
  overflow-y: auto;
`;

const Content = styled.div`
  padding: 0;
`;

const ProfileHeader = styled.div`
  background: ${({ theme }) => theme.colors.white};
  padding: 24px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const PatientImageContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
`;

const PatientImage = styled.div`
  width: 80px;
  height: 80px;
  border-radius: ${({ theme }) => theme.borderRadius.round};
  overflow: hidden;
  position: relative;
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
    width: 40px;
    height: 40px;
    color: white;
  }
`;

const PatientBasicInfo = styled.div`
  flex: 1;
`;

const PatientName = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 4px 0;
`;

const PatientId = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 4px 0;
`;

const PatientBirthDate = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 8px 0;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  background: ${({ theme }) => theme.colors.info};
  color: ${({ theme }) => theme.colors.infoText};
`;

const EditButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }

  svg {
    width: 16px;
    height: 16px;
  }

  @media (max-width: 480px) {
    width: 100%;
    flex: none;
  }
`;

const Section = styled.section`
  background: ${({ theme }) => theme.colors.white};
  padding: 24px 20px;
  margin-bottom: 8px;
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 16px 0;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const FormField = styled.div`
  &.full-width {
    grid-column: 1 / -1;
  }
`;

const Label = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  background: ${({ theme }) => theme.colors.gray};
  color: ${({ theme }) => theme.colors.text};

  &:disabled {
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  background: ${({ theme }) => theme.colors.gray};
  color: ${({ theme }) => theme.colors.text};

  &:disabled {
    cursor: not-allowed;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  background: ${({ theme }) => theme.colors.gray};
  color: ${({ theme }) => theme.colors.text};
  min-height: 80px;
  resize: vertical;
  font-family: ${({ theme }) => theme.fonts.primary};

  &:disabled {
    cursor: not-allowed;
  }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 8px;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;

  input {
    cursor: pointer;
  }
`;

const AppointmentItem = styled.div`
  padding: 16px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
    margin: 0 -20px;
    padding: 16px 20px;
  }
`;

const AppointmentContent = styled.div`
  flex: 1;
`;

const AppointmentDate = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 4px;

  svg {
    width: 16px;
    height: 16px;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const AppointmentType = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 2px;
`;

const AppointmentDoctor = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const AppointmentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
`;

const CitaStatusBadge = styled.span`
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  background: ${({ $status }) => {
    switch ($status) {
      case 'confirmada': return '#E3F2FD';
      case 'programada': return '#FFF3E0';
      case 'reprogramada': return '#E8EAF6';
      case 'cancelada': return '#FFEBEE';
      case 'completada': return '#E8F5E9';
      case 'en_progreso': return '#F3E5F5';
      case 'no_asistio': return '#ECEFF1';
      case 'pendiente_pago': return '#FFF8E1';
      default: return '#F5F5F5';
    }
  }};
  color: ${({ $status }) => {
    switch ($status) {
      case 'confirmada': return '#1565C0';
      case 'programada': return '#E65100';
      case 'reprogramada': return '#3949AB';
      case 'cancelada': return '#C62828';
      case 'completada': return '#2E7D32';
      case 'en_progreso': return '#7B1FA2';
      case 'no_asistio': return '#546E7A';
      case 'pendiente_pago': return '#FF8F00';
      default: return '#616161';
    }
  }};
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  margin-top: 8px;
`;

const PaginationButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ $active, theme }) => $active ? theme.colors.primary : 'white'};
  color: ${({ $active, theme }) => $active ? 'white' : theme.colors.text};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${({ $active, theme }) => $active ? theme.colors.primaryDark : theme.colors.gray};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const PaginationInfo = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 8px;
`;

const FormsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
`;

const FormCard = styled.button`
  background: ${({ theme }) => theme.colors.gray};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 20px 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;

  svg {
    width: 32px;
    height: 32px;
    color: ${({ theme }) => theme.colors.primary};
  }

  span {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    color: ${({ theme }) => theme.colors.text};
    text-align: center;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.info};
  }
`;

// Nuevos styled components para formularios clínicos
const FormsSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const AddFormButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const FormulariosList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const FormularioItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: ${({ theme }) => theme.colors.gray};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`;

const FormularioIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${({ $completed, theme }) => $completed ? `${theme.colors.success}20` : `${theme.colors.primary}15`};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 20px;
    height: 20px;
    color: ${({ $completed, theme }) => $completed ? theme.colors.successText : theme.colors.primary};
  }
`;

const FormularioInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FormularioName = styled.span`
  display: block;
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 2px;
`;

const FormularioMeta = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const FormularioStatus = styled.span`
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  background: ${({ $completed, theme }) => $completed ? `${theme.colors.success}20` : `${theme.colors.warning}20`};
  color: ${({ $completed, theme }) => $completed ? theme.colors.successText : theme.colors.warningText};
`;

const FormularioDeleteBtn = styled.button`
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
  margin-left: 4px;

  &:hover {
    background: ${({ theme }) => theme.colors.danger};
    color: white;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const EmptyFormularios = styled.div`
  text-align: center;
  padding: 32px 20px;
  background: ${({ theme }) => theme.colors.gray};
  border-radius: 10px;
  color: ${({ theme }) => theme.colors.textSecondary};

  svg {
    width: 40px;
    height: 40px;
    margin-bottom: 12px;
    opacity: 0.5;
  }

  p {
    font-size: 14px;
    margin: 0;
  }
`;

const DocumentItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.gray};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: 8px;
`;

const DocumentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  overflow: hidden;

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const DocumentDetails = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const DocumentName = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DocumentDate = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ViewButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  padding: 4px 8px;
  transition: all 0.3s ease;

  &:hover {
    text-decoration: underline;
  }
`;

const UploadSection = styled.div`
  margin-bottom: 20px;
`;

const UploadArea = styled.div`
  border: 2px dashed ${({ theme, $isDragging }) => $isDragging ? theme.colors.primary : theme.colors.border};
  border-radius: 12px;
  padding: 30px 20px;
  text-align: center;
  background: ${({ theme, $isDragging }) => $isDragging ? theme.colors.info : theme.colors.gray};
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.info};
  }
`;

const UploadIcon = styled.div`
  margin-bottom: 12px;

  svg {
    width: 40px;
    height: 40px;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const UploadText = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 8px 0;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const UploadSubtext = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

const HiddenInput = styled.input`
  display: none;
`;

const UploadButtons = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 16px;
`;

const UploadButton = styled.button`
  display: flex;
  width: 50%;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.text};

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const DocumentActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DeleteDocButton = styled.button`
  background: ${({ theme }) => theme.colors.danger};
  color: ${({ theme }) => theme.colors.dangerText};
  border: none;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  svg {
    width: 14px;
    height: 14px;
  }

  &:hover {
    opacity: 0.9;
  }
`;

const FileTypeIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $isImage, theme }) => $isImage ? theme.colors.info : theme.colors.warning};

  svg {
    width: 20px;
    height: 20px;
    color: ${({ $isImage, theme }) => $isImage ? theme.colors.primary : theme.colors.warningText};
  }
`;

// Estilos para el modal de visualización de documento
const DocumentModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const DocumentModalContent = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 12px;
  max-width: 90vw;
  max-height: 70vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const DocumentModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.gray};
`;

const DocumentModalTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 16px;
`;

const DocumentModalActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const DownloadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    opacity: 0.9;
  }
`;

const CloseModalButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const DocumentModalBody = styled.div`
  flex: 1;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #f5f5f5;
  min-height: 400px;
`;

const DocumentImage = styled.img`
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 4px;
`;

const DocumentIframe = styled.iframe`
  width: 100%;
  height: 70vh;
  border: none;
  border-radius: 4px;
`;

const DocumentPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;

  svg {
    color: ${({ theme }) => theme.colors.border};
  }

  p {
    margin: 0;
    font-size: 14px;
  }
`;

// Estilos para modal de expediente
const ExpedienteModalContent = styled.div`
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
`;

const ExpedienteSection = styled.div`
  margin-bottom: 24px;
`;

const ExpedienteSectionTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const ExpedienteCheckList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ExpedienteCheckItem = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: ${({ theme, $checked }) => $checked ? `${theme.colors.primary}10` : theme.colors.background};
  border: 1px solid ${({ theme, $checked }) => $checked ? theme.colors.primary : theme.colors.border};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  input {
    width: 18px;
    height: 18px;
    accent-color: ${({ theme }) => theme.colors.primary};
  }

  span {
    flex: 1;
    font-size: 14px;
    color: ${({ theme }) => theme.colors.text};
  }
`;

const ExpedienteSelectAll = styled.button`
  padding: 8px 16px;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  margin-left: auto;

  &:hover {
    background: ${({ theme }) => `${theme.colors.primary}10`};
  }
`;

const ExpedienteModalFooter = styled.div`
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const ExpedienteButton = styled.button`
  flex: 1;
  padding: 14px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ExpedienteCancelButton = styled(ExpedienteButton)`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.border};
  }
`;

const ExpedienteDownloadButton = styled(ExpedienteButton)`
  background: ${({ theme }) => theme.colors.primary};
  border: none;
  color: white;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const DownloadExpedienteBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;

  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: white;
  }

  svg {
    width: 16px;
    height: 16px;
  }

  @media (max-width: 480px) {
    width: 100%;
    flex: none;
  }
`;

const ButtonsRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const ToggleActiveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  background: ${({ $isActive, theme }) => $isActive ? '#FF9800' : '#4CAF50'};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.9;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const DeletePatientButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  background: ${({ theme }) => theme.colors.error};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.9;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const EmptyExpediente = styled.div`
  text-align: center;
  padding: 24px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
`;

const PerfilPaciente = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const isAdmin = user?.rol === 'admin';

  const [patient, setPatient] = useState(null);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [citasPage, setCitasPage] = useState(1);
  const CITAS_PER_PAGE = 5;
  
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [showDeleteFormModal, setShowDeleteFormModal] = useState(false);
  const [formToDelete, setFormToDelete] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estado para modal de descarga de expediente
  const [showExpedienteModal, setShowExpedienteModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState({
    formularios: [],
    documentos: []
  });
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Estado para formularios clínicos del paciente
  const [formulariosLlenados, setFormulariosLlenados] = useState([]);

  // Estado para eliminar paciente
  const [showDeletePatientModal, setShowDeletePatientModal] = useState(false);
  const [deletingPatient, setDeletingPatient] = useState(false);

  // Estado para cambiar estado activo del paciente
  const [showToggleActiveModal, setShowToggleActiveModal] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);

  // Función para formatear el estado
  const formatEstado = (estado) => {
    const estados = {
      'programada': 'Programada',
      'confirmada': 'Confirmada',
      'en_progreso': 'En Progreso',
      'completada': 'Completada',
      'cancelada': 'Cancelada',
      'no_asistio': 'No Asistió',
      'reprogramada': 'Reprogramada',
      'pendiente_pago': 'Pend. Pago'
    };
    return estados[estado] || estado;
  };

  // Función para formatear fecha (sin hora)
  const formatFecha = (fechaStr) => {
    if (!fechaStr) return '';
    // Extraer solo la parte de la fecha (YYYY-MM-DD)
    const soloFecha = fechaStr.split('T')[0];
    const [year, month, day] = soloFecha.split('-');
    return `${day}/${month}/${year}`;
  };

  // Paginación de citas
  const totalCitasPages = Math.ceil(citas.length / CITAS_PER_PAGE);
  const paginatedCitas = citas.slice(
    (citasPage - 1) * CITAS_PER_PAGE,
    citasPage * CITAS_PER_PAGE
  );

  // Cargar datos del paciente
  useEffect(() => {
    const fetchPatient = async () => {
      setLoading(true);
      try {
        const response = await pacientesService.getById(id);
        if (response.success) {
          setPatient(response.data?.paciente || response.data);
          // Cargar citas del paciente
          const citasRes = await citasService.getAll({ paciente_id: id });
          if (citasRes.success) {
            setCitas(citasRes.data?.citas || []);
          }
          // Cargar documentos del paciente
          try {
            const docsRes = await documentosService.getAll(id);
            if (docsRes.success) {
              const docs = (docsRes.data?.documentos || []).map(doc => ({
                id: doc.id,
                uuid: doc.uuid,
                name: doc.nombre,
                date: doc.fecha_creacion?.split('T')[0] || new Date().toISOString().split('T')[0],
                type: doc.tipo_archivo,
                size: doc.tamanio,
                isImage: doc.tipo_archivo?.startsWith('image/'),
                contenido: doc.contenido,
                descripcion: doc.descripcion
              }));
              setDocuments(docs);
            }
          } catch (docErr) {
            console.error('Error cargando documentos:', docErr);
          }
          // Cargar formularios completados del paciente
          try {
            const formsRes = await formulariosService.getCompletados({ paciente_uuid: id });
            if (formsRes.success) {
              const forms = (formsRes.data?.formularios_completados || []).map(form => ({
                id: form.id,
                formId: form.formulario_uuid,
                name: form.formulario_nombre,
                date: form.fecha_completado?.split('T')[0] || '',
                completed: true,
                completadoPor: form.completado_por_nombre ? `${form.completado_por_nombre} ${form.completado_por_apellidos || ''}` : '',
                datos: form.datos, // Incluir las respuestas
                campos: form.formulario_campos // Incluir la definición de campos
              }));
              setFormulariosLlenados(forms);
            }
          } catch (formErr) {
            console.error('Error cargando formularios:', formErr);
          }
        } else {
          console.error('Paciente no encontrado');
          navigate('/pacientes');
        }
      } catch (err) {
        console.error('Error cargando paciente:', err);
        navigate('/pacientes');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchPatient();
  }, [id, navigate]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFiles = async (files) => {
    for (const file of files) {
      try {
        // Verificar tamaño máximo (10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          showAlert(`El archivo ${file.name} es demasiado grande. Máximo 10MB.`, { tipo: 'warning' });
          continue;
        }

        // Detectar si es imagen (incluyendo HEIC de iPhone)
        const isImage = file.type.startsWith('image/') || 
                       file.name.toLowerCase().endsWith('.heic') || 
                       file.name.toLowerCase().endsWith('.heif');

        // Leer archivo como base64
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Enviar a la API
        const docData = {
          nombre: file.name,
          tipo_archivo: file.type || (isImage ? 'image/heic' : 'application/octet-stream'),
          tamanio: (file.size / 1024).toFixed(1) + ' KB',
          contenido: base64,
          descripcion: ''
        };

        const response = await documentosService.create(id, docData);
        if (response.success) {
          const newDoc = {
            id: response.data.id,
            uuid: response.data.uuid,
            name: file.name,
            date: new Date().toISOString().split('T')[0],
            type: file.type,
            size: docData.tamanio,
            isImage: isImage,
            contenido: base64
          };
          setDocuments(prev => [newDoc, ...prev]);
          setSuccessMessage(isImage ? 'Imagen subida exitosamente' : 'Documento subido exitosamente');
          setShowSuccessModal(true);
        }
      } catch (err) {
        console.error('Error subiendo documento:', err);
        showAlert('Error al subir el documento: ' + file.name, { tipo: 'error' });
      }
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFiles(files);
    }
    e.target.value = '';
  };

  const handleDeleteDocument = (doc) => {
    setDocumentToDelete(doc);
    setShowDeleteModal(true);
  };

  const confirmDeleteDocument = async () => {
    if (!documentToDelete) return;
    try {
      const response = await documentosService.delete(id, documentToDelete.uuid);
      if (response.success) {
        setDocuments(prev => prev.filter(d => d.id !== documentToDelete.id));
      }
    } catch (err) {
      console.error('Error eliminando documento:', err);
      showAlert('Error al eliminar el documento', { tipo: 'error' });
    }
    setShowDeleteModal(false);
    setDocumentToDelete(null);
  };

  const handleDeleteFormulario = (form, e) => {
    e.stopPropagation();
    setFormToDelete(form);
    setShowDeleteFormModal(true);
  };

  const confirmDeleteFormulario = async () => {
    if (!formToDelete) return;
    try {
      const response = await formulariosService.deleteCompletado(formToDelete.id);
      if (response.success) {
        setFormulariosLlenados(prev => prev.filter(f => f.id !== formToDelete.id));
      }
    } catch (err) {
      console.error('Error eliminando formulario:', err);
      showAlert('Error al eliminar el formulario', { tipo: 'error' });
    }
    setShowDeleteFormModal(false);
    setFormToDelete(null);
  };

  const isImageFile = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic', 'heif'].includes(ext);
  };

  const handleViewDocument = (doc) => {
    setSelectedDocument(doc);
    setShowDocumentModal(true);
  };

  const handleDownloadDocument = (doc) => {
    if (!doc.contenido) return;
    const link = document.createElement('a');
    link.href = doc.contenido;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Funciones para el modal de expediente
  const handleToggleFormulario = (formId) => {
    setSelectedItems(prev => ({
      ...prev,
      formularios: prev.formularios.includes(formId)
        ? prev.formularios.filter(id => id !== formId)
        : [...prev.formularios, formId]
    }));
  };

  const handleToggleDocumento = (docId) => {
    setSelectedItems(prev => ({
      ...prev,
      documentos: prev.documentos.includes(docId)
        ? prev.documentos.filter(id => id !== docId)
        : [...prev.documentos, docId]
    }));
  };

  const handleSelectAllFormularios = () => {
    const allIds = formulariosLlenados.map(f => f.id);
    const allSelected = allIds.every(id => selectedItems.formularios.includes(id));
    setSelectedItems(prev => ({
      ...prev,
      formularios: allSelected ? [] : allIds
    }));
  };

  const handleSelectAllDocumentos = () => {
    const allIds = documents.map(d => d.id);
    const allSelected = allIds.every(id => selectedItems.documentos.includes(id));
    setSelectedItems(prev => ({
      ...prev,
      documentos: allSelected ? [] : allIds
    }));
  };

  const handleOpenExpedienteModal = () => {
    setSelectedItems({ formularios: [], documentos: [] });
    setShowExpedienteModal(true);
  };

  // Función para cambiar estado activo del paciente
  const handleToggleActive = async () => {
    setTogglingActive(true);
    try {
      const response = await pacientesService.update(patient.uuid, {
        activo: !patient.activo
      });
      if (response.success) {
        setPatient({ ...patient, activo: !patient.activo });
        setShowToggleActiveModal(false);
      } else {
        showAlert(response.message || 'Error al actualizar el estado del paciente', { tipo: 'error' });
      }
    } catch (error) {
      console.error('Error actualizando estado del paciente:', error);
      showAlert('Error al actualizar el estado del paciente', { tipo: 'error' });
    } finally {
      setTogglingActive(false);
    }
  };

  // Función para eliminar paciente
  const handleDeletePatient = async () => {
    setDeletingPatient(true);
    try {
      const response = await pacientesService.delete(patient.uuid);
      if (response.success) {
        setShowDeletePatientModal(false);
        navigate('/pacientes', { state: { message: 'Paciente eliminado correctamente' } });
      } else {
        showAlert(response.message || 'Error al eliminar el paciente', { tipo: 'error' });
      }
    } catch (error) {
      console.error('Error eliminando paciente:', error);
      showAlert('Error al eliminar el paciente', { tipo: 'error' });
    } finally {
      setDeletingPatient(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (selectedItems.formularios.length === 0 && selectedItems.documentos.length === 0) {
      return;
    }

    setGeneratingPDF(true);

    try {
      // Usamos pdf-lib para poder combinar PDFs
      const finalPdf = await PDFDocument.create();
      
      // Función para crear página de formulario con estilo
      const createFormularioPage = async (form) => {
        // Crear un contenedor temporal para renderizar el formulario
        const container = document.createElement('div');
        container.style.cssText = `
          position: fixed;
          left: -9999px;
          top: 0;
          width: 800px;
          background: white;
          padding: 40px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        // Parsear datos y campos
        const datos = form.datos 
          ? (typeof form.datos === 'string' ? JSON.parse(form.datos) : form.datos)
          : {};
        
        const campos = form.campos 
          ? (typeof form.campos === 'string' ? JSON.parse(form.campos) : form.campos)
          : [];

        // Función para renderizar campo según su tipo
        const renderCampo = (campo) => {
          const value = datos[campo.id];
          const valueStr = String(value || '');
          
          switch (campo.type) {
            case 'titulo':
              return `<h2 style="margin: 25px 0 10px 0; font-size: 22px; color: #1F2937; font-weight: 700; border-bottom: 2px solid #E5E7EB; padding-bottom: 8px;">${campo.label}</h2>`;
            
            case 'subtitulo':
              return `<h3 style="margin: 20px 0 8px 0; font-size: 17px; color: #4B5563; font-weight: 600;">${campo.label}</h3>`;
            
            case 'parrafo':
            case 'text':
              // Convertir saltos de línea a <br> para HTML
              const parrafoConSaltos = campo.label.replace(/\n/g, '<br>');
              return `<p style="margin: 10px 0; font-size: 14px; color: #6B7280; line-height: 1.6; white-space: pre-wrap;">${parrafoConSaltos}</p>`;
            
            case 'signature':
              if (valueStr && valueStr.startsWith('data:image')) {
                return `
                  <div style="margin-bottom: 15px;">
                    <div style="font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">${campo.label}</div>
                    <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 15px; text-align: center;">
                      <img src="${valueStr}" style="max-width: 300px; max-height: 100px;" />
                      <p style="margin: 10px 0 0 0; color: #6366F1; font-size: 13px; font-weight: 500;">✓ Firmado digitalmente</p>
                    </div>
                  </div>
                `;
              }
              return `
                <div style="margin-bottom: 15px;">
                  <div style="font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">${campo.label}</div>
                  <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 10px; padding: 14px 16px; font-size: 14px; color: #92400E;">Sin firma</div>
                </div>
              `;
            
            case 'imagen':
              if (valueStr && valueStr.startsWith('data:image')) {
                return `
                  <div style="margin-bottom: 15px;">
                    <div style="font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">${campo.label}</div>
                    <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 15px; text-align: center;">
                      <img src="${valueStr}" style="max-width: 100%; max-height: 400px;" />
                      <p style="margin: 10px 0 0 0; color: #6366F1; font-size: 13px; font-weight: 500;">✓ Imagen anotada</p>
                    </div>
                  </div>
                `;
              }
              return `
                <div style="margin-bottom: 15px;">
                  <div style="font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">${campo.label}</div>
                  <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 10px; padding: 14px 16px; font-size: 14px; color: #92400E;">Sin anotaciones</div>
                </div>
              `;
            
            case 'multiple':
              const opciones = campo.options || [];
              return `
                <div style="margin-bottom: 15px;">
                  <div style="font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">${campo.label}</div>
                  <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 14px 16px;">
                    ${opciones.map(opt => `
                      <div style="margin-bottom: 6px;">
                        <span style="display: inline-block; width: 18px; height: 18px; border-radius: 50%; border: 2px solid ${valueStr === opt ? '#6366F1' : '#D1D5DB'}; text-align: center; line-height: 14px; background: ${valueStr === opt ? '#6366F1' : 'white'}; vertical-align: middle; margin-right: 8px;">
                          ${valueStr === opt ? '<span style="color: white; font-size: 10px;">✓</span>' : ''}
                        </span>
                        <span style="font-size: 14px; color: ${valueStr === opt ? '#1F2937' : '#6B7280'}; font-weight: ${valueStr === opt ? '500' : '400'};">${opt}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            
            case 'textarea':
            default:
              return `
                <div style="margin-bottom: 15px;">
                  <div style="font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">${campo.label}</div>
                  <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 14px 16px; font-size: 15px; color: #1F2937; white-space: pre-wrap; min-height: 40px;">${valueStr || '<span style="color: #999; font-style: italic;">Sin respuesta</span>'}</div>
                </div>
              `;
          }
        };

        // Construir HTML del formulario con estilo
        container.innerHTML = `
          <div style="border-bottom: 3px solid #6366F1; padding-bottom: 20px; margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
              <div>
                <h1 style="margin: 0; font-size: 28px; color: #6366F1; font-weight: 700;">${form.name || 'Formulario Clínico'}</h1>
                <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">Expediente: ${patient.numero_expediente || 'N/A'}</p>
              </div>
              <div style="text-align: right;">
                <div style="background: #E8F5E9; color: #2E7D32; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 500;">
                  ✓ Completado: ${form.date || 'N/A'}
                </div>
              </div>
            </div>
            <div style="background: #F3F4F6; padding: 15px 20px; border-radius: 10px; margin-top: 15px;">
              <p style="margin: 0; font-size: 16px; color: #333;"><strong>Paciente:</strong> ${patient.nombre} ${patient.apellidos || ''}</p>
              ${form.completadoPor ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">Completado por: ${form.completadoPor}</p>` : ''}
            </div>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 5px;">
            ${campos.length > 0 
              ? campos.map(campo => renderCampo(campo)).join('')
              : Object.entries(datos).map(([key, value]) => {
                  const valueStr = String(value || '');
                  if (valueStr.startsWith('data:image')) {
                    return `
                      <div style="margin-bottom: 15px;">
                        <div style="font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">${key}</div>
                        <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 15px; text-align: center;">
                          <img src="${valueStr}" style="max-width: 300px; max-height: 100px;" />
                          <p style="margin: 10px 0 0 0; color: #6366F1; font-size: 13px; font-weight: 500;">✓ Firmado digitalmente</p>
                        </div>
                      </div>
                    `;
                  }
                  return `
                    <div style="margin-bottom: 15px;">
                      <div style="font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">${key}</div>
                      <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 14px 16px; font-size: 15px; color: #1F2937; white-space: pre-wrap;">${valueStr || '<span style="color: #999; font-style: italic;">Sin respuesta</span>'}</div>
                    </div>
                  `;
                }).join('')
            }
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center; color: #999; font-size: 11px;">
            Documento generado el ${new Date().toLocaleDateString('es-MX')} | Bio Dental - Sistema de Gestión Médica
          </div>
        `;

        document.body.appendChild(container);

        try {
          // Capturar con html2canvas
          const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
          });

          // Convertir a PDF
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          
          // Calcular páginas necesarias
          const pdfWidth = 595.28; // A4 en puntos
          const pdfHeight = 841.89;
          const ratio = pdfWidth / imgWidth;
          const scaledHeight = imgHeight * ratio;
          
          // Crear PDF temporal
          const tempPdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'a4'
          });

          let position = 0;
          let heightLeft = scaledHeight;
          
          // Primera página
          tempPdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
          heightLeft -= pdfHeight;

          // Páginas adicionales si es necesario
          while (heightLeft > 0) {
            position = heightLeft - scaledHeight;
            tempPdf.addPage();
            tempPdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
            heightLeft -= pdfHeight;
          }

          // Agregar al PDF final
          const tempPdfBytes = tempPdf.output('arraybuffer');
          const tempPdfDoc = await PDFDocument.load(tempPdfBytes);
          const pages = await finalPdf.copyPages(tempPdfDoc, tempPdfDoc.getPageIndices());
          pages.forEach(page => finalPdf.addPage(page));

        } finally {
          document.body.removeChild(container);
        }
      };

      // Función para agregar imagen al PDF
      const addImagePage = async (doc) => {
        const page = finalPdf.addPage([595.28, 841.89]); // A4
        const { width, height } = page.getSize();
        const margin = 50;

        // Título en la página
        page.drawText(doc.name || 'Documento', {
          x: margin,
          y: height - margin,
          size: 16,
        });

        page.drawText(`Fecha: ${doc.fecha || 'N/A'}`, {
          x: margin,
          y: height - margin - 25,
          size: 10,
        });

        if (doc.contenido && isImageFile(doc.name)) {
          try {
            // Extraer datos de la imagen
            const base64Data = doc.contenido.split(',')[1];
            const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            
            let image;
            if (doc.contenido.includes('image/png')) {
              image = await finalPdf.embedPng(imageBytes);
            } else {
              image = await finalPdf.embedJpg(imageBytes);
            }

            const imgDims = image.scale(1);
            const maxWidth = width - 2 * margin;
            const maxHeight = height - margin * 2 - 60;
            
            const scale = Math.min(maxWidth / imgDims.width, maxHeight / imgDims.height, 1);
            const scaledWidth = imgDims.width * scale;
            const scaledHeight = imgDims.height * scale;
            
            const x = (width - scaledWidth) / 2;
            const y = height - margin - 60 - scaledHeight;

            page.drawImage(image, {
              x,
              y,
              width: scaledWidth,
              height: scaledHeight,
            });
          } catch (imgError) {
            console.error('Error agregando imagen:', imgError);
            page.drawText('[Error al cargar la imagen]', {
              x: margin,
              y: height - margin - 80,
              size: 12,
            });
          }
        }
      };

      // Función para anexar PDF existente
      const addExistingPdf = async (doc) => {
        try {
          const base64Data = doc.contenido.split(',')[1];
          const pdfBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          const existingPdf = await PDFDocument.load(pdfBytes);
          const pages = await finalPdf.copyPages(existingPdf, existingPdf.getPageIndices());
          
          // Agregar página de separación con título
          const separatorPage = finalPdf.addPage([595.28, 841.89]);
          separatorPage.drawText(doc.name || 'Documento PDF', {
            x: 50,
            y: 750,
            size: 20,
          });
          separatorPage.drawText(`Documento anexado - ${doc.fecha || 'Sin fecha'}`, {
            x: 50,
            y: 720,
            size: 12,
          });
          separatorPage.drawText('Las siguientes páginas corresponden al documento original.', {
            x: 50,
            y: 690,
            size: 11,
          });

          // Agregar todas las páginas del PDF
          pages.forEach(page => finalPdf.addPage(page));
        } catch (pdfError) {
          console.error('Error anexando PDF:', pdfError);
          // Crear página de error
          const errorPage = finalPdf.addPage([595.28, 841.89]);
          errorPage.drawText(`Error al cargar: ${doc.name}`, {
            x: 50,
            y: 750,
            size: 14,
          });
        }
      };

      // Crear portada
      const coverPage = finalPdf.addPage([595.28, 841.89]);
      const { width: coverWidth, height: coverHeight } = coverPage.getSize();
      
      coverPage.drawText('EXPEDIENTE MÉDICO', {
        x: coverWidth / 2 - 100,
        y: coverHeight - 150,
        size: 28,
      });
      
      coverPage.drawText(`${patient.nombre} ${patient.apellidos || ''}`, {
        x: coverWidth / 2 - 80,
        y: coverHeight - 200,
        size: 18,
      });
      
      coverPage.drawText(`No. Expediente: ${patient.numero_expediente || 'N/A'}`, {
        x: coverWidth / 2 - 70,
        y: coverHeight - 240,
        size: 14,
      });
      
      coverPage.drawText(`Generado el: ${new Date().toLocaleDateString('es-MX')}`, {
        x: coverWidth / 2 - 60,
        y: coverHeight - 280,
        size: 12,
      });

      // Procesar formularios
      for (const formId of selectedItems.formularios) {
        const form = formulariosLlenados.find(f => f.id === formId);
        if (form) {
          await createFormularioPage(form);
        }
      }

      // Procesar documentos
      for (const docId of selectedItems.documentos) {
        const doc = documents.find(d => d.id === docId);
        if (!doc) continue;

        const isPdf = doc.name?.toLowerCase().endsWith('.pdf') || doc.contenido?.includes('application/pdf');
        
        if (isPdf) {
          await addExistingPdf(doc);
        } else if (isImageFile(doc.name)) {
          await addImagePage(doc);
        }
      }

      // Descargar PDF final
      const pdfBytes = await finalPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Expediente_${patient.nombre}_${patient.apellidos || ''}_${new Date().toISOString().split('T')[0]}.pdf`.replace(/\s+/g, '_');
      link.click();
      URL.revokeObjectURL(url);

      setShowExpedienteModal(false);
      setSuccessMessage('El expediente se ha descargado correctamente');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error generando PDF:', error);
      showAlert('Error al generar el PDF: ' + error.message, { tipo: 'error' });
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <PageContainer>
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteDocument}
        title="Eliminar Documento"
        message="¿Estás seguro de eliminar este documento? Esta acción no se puede deshacer."
        type="warning"
        confirmText="Eliminar"
        cancelText="Cancelar"
        showCancel
      />

      <Modal
        isOpen={showDeleteFormModal}
        onClose={() => setShowDeleteFormModal(false)}
        onConfirm={confirmDeleteFormulario}
        title="Eliminar Formulario"
        message={`¿Estás seguro de eliminar el formulario "${formToDelete?.name || ''}"? Esta acción no se puede deshacer.`}
        type="warning"
        confirmText="Eliminar"
        cancelText="Cancelar"
        showCancel
      />

      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onConfirm={() => setShowSuccessModal(false)}
        title="¡Éxito!"
        message={successMessage}
        type="success"
        confirmText="Aceptar"
      />

      {/* Modal para ver documento */}
      {showDocumentModal && selectedDocument && (
        <DocumentModalOverlay onClick={() => setShowDocumentModal(false)}>
          <DocumentModalContent onClick={(e) => e.stopPropagation()}>
            <DocumentModalHeader>
              <DocumentModalTitle>{selectedDocument.name}</DocumentModalTitle>
              <DocumentModalActions>
                <DownloadButton onClick={() => handleDownloadDocument(selectedDocument)}>
                  <Download size={18} />
                  Descargar
                </DownloadButton>
                <CloseModalButton onClick={() => setShowDocumentModal(false)}>
                  <X size={20} />
                </CloseModalButton>
              </DocumentModalActions>
            </DocumentModalHeader>
            <DocumentModalBody>
              {selectedDocument.isImage || isImageFile(selectedDocument.name) ? (
                <DocumentImage src={selectedDocument.contenido} alt={selectedDocument.name} />
              ) : selectedDocument.type === 'application/pdf' ? (
                <DocumentIframe src={selectedDocument.contenido} title={selectedDocument.name} />
              ) : (
                <DocumentPlaceholder>
                  <File size={64} />
                  <p>Vista previa no disponible para este tipo de archivo</p>
                  <DownloadButton onClick={() => handleDownloadDocument(selectedDocument)}>
                    <Download size={18} />
                    Descargar archivo
                  </DownloadButton>
                </DocumentPlaceholder>
              )}
            </DocumentModalBody>
          </DocumentModalContent>
        </DocumentModalOverlay>
      )}

      {/* Modal de confirmación para cambiar estado activo */}
      {showToggleActiveModal && (
        <DocumentModalOverlay onClick={() => setShowToggleActiveModal(false)}>
          <DocumentModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <DocumentModalHeader>
              <DocumentModalTitle style={{ color: patient?.activo ? '#FF9800' : '#4CAF50' }}>
                {patient?.activo ? 'Desactivar Paciente' : 'Activar Paciente'}
              </DocumentModalTitle>
              <CloseModalButton onClick={() => setShowToggleActiveModal(false)}>
                <X size={20} />
              </CloseModalButton>
            </DocumentModalHeader>
            <DocumentModalBody style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ marginBottom: '10px', fontSize: '16px' }}>
                ¿Estás seguro de que deseas {patient?.activo ? 'desactivar' : 'activar'} a <strong>{patient?.nombre} {patient?.apellidos}</strong>?
              </p>
              <p style={{ color: '#666', fontSize: '14px' }}>
                {patient?.activo 
                  ? 'El paciente no aparecerá en las búsquedas pero sus datos se conservarán.'
                  : 'El paciente volverá a aparecer en las búsquedas y podrás agendar citas.'}
              </p>
            </DocumentModalBody>
            <ExpedienteModalFooter style={{ justifyContent: 'center', gap: '12px' }}>
              <EditButton onClick={() => setShowToggleActiveModal(false)} style={{ background: '#6c757d' }}>
                Cancelar
              </EditButton>
              <ToggleActiveButton $isActive={patient?.activo} onClick={handleToggleActive} disabled={togglingActive}>
                {togglingActive ? (
                  <>
                    <Loader size={18} className="spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    {patient?.activo ? <UserX size={18} /> : <UserCheck size={18} />}
                    {patient?.activo ? 'Desactivar' : 'Activar'}
                  </>
                )}
              </ToggleActiveButton>
            </ExpedienteModalFooter>
          </DocumentModalContent>
        </DocumentModalOverlay>
      )}

      {/* Modal de confirmación para eliminar paciente */}
      {showDeletePatientModal && (
        <DocumentModalOverlay onClick={() => setShowDeletePatientModal(false)}>
          <DocumentModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <DocumentModalHeader>
              <DocumentModalTitle style={{ color: '#dc3545' }}>Eliminar Paciente</DocumentModalTitle>
              <CloseModalButton onClick={() => setShowDeletePatientModal(false)}>
                <X size={20} />
              </CloseModalButton>
            </DocumentModalHeader>
            <DocumentModalBody style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ marginBottom: '10px', fontSize: '16px' }}>
                ¿Estás seguro de que deseas eliminar a <strong>{patient?.nombre} {patient?.apellidos}</strong>?
              </p>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Esta acción no se puede deshacer. Se eliminarán todos los datos, citas, documentos y formularios asociados.
              </p>
            </DocumentModalBody>
            <ExpedienteModalFooter style={{ justifyContent: 'center', gap: '12px' }}>
              <EditButton onClick={() => setShowDeletePatientModal(false)} style={{ background: '#6c757d' }}>
                Cancelar
              </EditButton>
              <DeletePatientButton onClick={handleDeletePatient} disabled={deletingPatient}>
                {deletingPatient ? (
                  <>
                    <Loader size={18} className="spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Eliminar
                  </>
                )}
              </DeletePatientButton>
            </ExpedienteModalFooter>
          </DocumentModalContent>
        </DocumentModalOverlay>
      )}

      {/* Modal para descargar expediente */}
      {showExpedienteModal && (
        <DocumentModalOverlay onClick={() => setShowExpedienteModal(false)}>
          <DocumentModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <DocumentModalHeader>
              <DocumentModalTitle>Descargar Expediente</DocumentModalTitle>
              <CloseModalButton onClick={() => setShowExpedienteModal(false)}>
                <X size={20} />
              </CloseModalButton>
            </DocumentModalHeader>
            
            <ExpedienteModalContent>
              {formulariosLlenados.length === 0 && documents.length === 0 ? (
                <EmptyExpediente>
                  No hay formularios ni documentos disponibles para este paciente.
                </EmptyExpediente>
              ) : (
                <>
                  {/* Sección de Formularios */}
                  {formulariosLlenados.length > 0 && (
                    <ExpedienteSection>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                        <ExpedienteSectionTitle style={{ margin: 0, flex: 1 }}>
                          <FileText /> Formularios Clínicos
                        </ExpedienteSectionTitle>
                        <ExpedienteSelectAll onClick={handleSelectAllFormularios}>
                          {formulariosLlenados.every(f => selectedItems.formularios.includes(f.id)) 
                            ? 'Deseleccionar todos' 
                            : 'Seleccionar todos'}
                        </ExpedienteSelectAll>
                      </div>
                      <ExpedienteCheckList>
                        {formulariosLlenados.map(form => (
                          <ExpedienteCheckItem 
                            key={form.id} 
                            $checked={selectedItems.formularios.includes(form.id)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedItems.formularios.includes(form.id)}
                              onChange={() => handleToggleFormulario(form.id)}
                            />
                            <span>{form.name} - {form.date}</span>
                          </ExpedienteCheckItem>
                        ))}
                      </ExpedienteCheckList>
                    </ExpedienteSection>
                  )}

                  {/* Sección de Documentos */}
                  {documents.length > 0 && (
                    <ExpedienteSection>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                        <ExpedienteSectionTitle style={{ margin: 0, flex: 1 }}>
                          <Image /> Fotos y Documentos
                        </ExpedienteSectionTitle>
                        <ExpedienteSelectAll onClick={handleSelectAllDocumentos}>
                          {documents.every(d => selectedItems.documentos.includes(d.id)) 
                            ? 'Deseleccionar todos' 
                            : 'Seleccionar todos'}
                        </ExpedienteSelectAll>
                      </div>
                      <ExpedienteCheckList>
                        {documents.map(doc => (
                          <ExpedienteCheckItem 
                            key={doc.id} 
                            $checked={selectedItems.documentos.includes(doc.id)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedItems.documentos.includes(doc.id)}
                              onChange={() => handleToggleDocumento(doc.id)}
                            />
                            <span>{doc.name}</span>
                          </ExpedienteCheckItem>
                        ))}
                      </ExpedienteCheckList>
                    </ExpedienteSection>
                  )}
                </>
              )}
            </ExpedienteModalContent>

            <ExpedienteModalFooter>
              <ExpedienteCancelButton onClick={() => setShowExpedienteModal(false)}>
                Cancelar
              </ExpedienteCancelButton>
              <ExpedienteDownloadButton 
                onClick={handleGeneratePDF}
                disabled={generatingPDF || (selectedItems.formularios.length === 0 && selectedItems.documentos.length === 0)}
              >
                {generatingPDF ? (
                  <>
                    <Loader size={18} className="spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Descargar PDF
                  </>
                )}
              </ExpedienteDownloadButton>
            </ExpedienteModalFooter>
          </DocumentModalContent>
        </DocumentModalOverlay>
      )}

      <Header title="Perfil del Paciente" showBack />
      
      <Content>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Loader className="spin" size={32} />
          </div>
        ) : patient ? (
          <>
        <ProfileHeader>
          <PatientImageContainer>
            <PatientImage>
              {patient.foto_url ? (
                <img src={patient.foto_url} alt={`${patient.nombre} ${patient.apellidos}`} />
              ) : (
                <User />
              )}
            </PatientImage>
            <PatientBasicInfo>
              <PatientName>{patient.nombre} {patient.apellidos}</PatientName>
              <PatientId>Expediente: {patient.numero_expediente || 'N/A'}</PatientId>
              <PatientBirthDate>F. Nacimiento: {formatFecha(patient.fecha_nacimiento)}</PatientBirthDate>
              <StatusBadge>{patient.activo ? 'Activo' : 'Inactivo'}</StatusBadge>
            </PatientBasicInfo>
          </PatientImageContainer>
          <ButtonsRow>
            <EditButton onClick={() => navigate(`/editar-paciente/${patient.uuid}`)}>
              <Edit2 />
              Editar Paciente
            </EditButton>
            <DownloadExpedienteBtn onClick={handleOpenExpedienteModal}>
              <FolderDown />
              Descargar Expediente
            </DownloadExpedienteBtn>
            <ToggleActiveButton 
              $isActive={patient?.activo} 
              onClick={() => setShowToggleActiveModal(true)}
            >
              {patient?.activo ? <UserX /> : <UserCheck />}
              {patient?.activo ? 'Desactivar' : 'Activar'}
            </ToggleActiveButton>
            {isAdmin && (
              <DeletePatientButton onClick={() => setShowDeletePatientModal(true)}>
                <Trash2 />
                Eliminar
              </DeletePatientButton>
            )}
          </ButtonsRow>
        </ProfileHeader>

        <Section>
          <SectionTitle>Datos Personales</SectionTitle>
          <FormGrid>
            <FormField>
              <Label>Nombre</Label>
              <Input type="text" value={patient.nombre || ''} disabled />
            </FormField>
            <FormField>
              <Label>Apellido</Label>
              <Input type="text" value={patient.apellidos || ''} disabled />
            </FormField>
            <FormField>
              <Label>Seguro médico</Label>
              <Input type="text" value={patient.expediente || ''} disabled />
            </FormField>
            <FormField>
              <Label>Fecha de Nacimiento</Label>
              <Input type="text" value={formatFecha(patient.fecha_nacimiento) || ''} disabled />
            </FormField>
            <FormField>
              <Label>Género</Label>
              <Select disabled>
                <option>{patient.genero === 'femenino' ? 'Femenino' : patient.genero === 'masculino' ? 'Masculino' : 'Otro'}</option>
              </Select>
            </FormField>
            <FormField>
              <Label>Teléfono</Label>
              <Input type="tel" value={patient.telefono || ''} disabled />
            </FormField>
            <FormField className="full-width">
              <Label>Email</Label>
              <Input type="email" value={patient.email || ''} disabled />
            </FormField>
          </FormGrid>

          <FormField>
            <Label>Tipo de Paciente</Label>
            <RadioGroup>
              <RadioLabel>
                <input type="radio" checked={patient.tipo === 'adulto'} disabled />
                Adulto
              </RadioLabel>
              <RadioLabel>
                <input type="radio" checked={patient.tipo === 'pediatrico'} disabled />
                Pediátrico
              </RadioLabel>
            </RadioGroup>
          </FormField>

          <FormField style={{ marginTop: '16px' }}>
            <Label>Padecimientos</Label>
            <TextArea value={patient.padecimientos || 'Sin padecimientos registrados'} disabled />
          </FormField>

          <FormField style={{ marginTop: '16px' }}>
            <Label>Medicamentos</Label>
            <TextArea value={patient.medicamentos || 'Sin medicamentos registrados'} disabled />
          </FormField>

          <FormField style={{ marginTop: '16px' }}>
            <Label>Alergias</Label>
            <TextArea value={patient.alergias || 'Sin alergias registradas'} disabled />
          </FormField>

          <FormField style={{ marginTop: '16px' }}>
            <Label>Motivo de Consulta</Label>
            <TextArea value={patient.motivo_consulta || 'Sin motivo registrado'} disabled />
          </FormField>
        </Section>

        <Section>
          <SectionTitle>Historial de Citas ({citas.length})</SectionTitle>
          {citas && citas.length > 0 ? (
            <>
              {paginatedCitas.map((cita, index) => (
                <AppointmentItem key={cita.uuid || index} onClick={() => navigate(`/detalle-cita/${cita.uuid}`)}>
                  <AppointmentContent>
                    <AppointmentHeader>
                      <AppointmentDate>
                        <Calendar />
                        {formatFecha(cita.fecha)} • {cita.hora_inicio?.substring(0, 5)}
                      </AppointmentDate>
                      <CitaStatusBadge $status={cita.estado}>
                        {formatEstado(cita.estado)}
                      </CitaStatusBadge>
                    </AppointmentHeader>
                    <AppointmentType>{cita.tipo || 'Consulta'}</AppointmentType>
                    <AppointmentDoctor>Dr. {cita.doctor_nombre} {cita.doctor_apellidos}</AppointmentDoctor>
                  </AppointmentContent>
                  <ChevronRight size={20} color="#6C757D" />
                </AppointmentItem>
              ))}
              {totalCitasPages > 1 && (
                <PaginationContainer>
                  <PaginationButton 
                    onClick={() => setCitasPage(p => Math.max(1, p - 1))}
                    disabled={citasPage === 1}
                  >
                    <ChevronLeft />
                  </PaginationButton>
                  <PaginationInfo>
                    Página {citasPage} de {totalCitasPages}
                  </PaginationInfo>
                  <PaginationButton 
                    onClick={() => setCitasPage(p => Math.min(totalCitasPages, p + 1))}
                    disabled={citasPage === totalCitasPages}
                  >
                    <ChevronRight />
                  </PaginationButton>
                </PaginationContainer>
              )}
            </>
          ) : (
            <p style={{ color: '#6C757D', fontSize: '14px' }}>No hay citas registradas.</p>
          )}
        </Section>

        <Section>
          <FormsSectionHeader>
            <SectionTitle style={{ margin: 0 }}>Formularios Clínicos</SectionTitle>
            <AddFormButton onClick={() => navigate(`/seleccionar-formulario/${id}`, {
              state: { returnTo: `/perfil-paciente/${id}` }
            })}>
              <Plus />
              Agregar
            </AddFormButton>
          </FormsSectionHeader>

          {formulariosLlenados.length > 0 ? (
            <FormulariosList>
              {formulariosLlenados.map(form => (
                <FormularioItem 
                  key={form.id}
                  onClick={() => {
                    if (form.completed) {
                      // Si está completado, abrir vista previa
                      navigate(`/ver-formulario/${form.formId}/${id}`, {
                        state: { 
                          returnTo: `/perfil-paciente/${id}`,
                          completedAt: form.date,
                          existingValues: form.datos,
                          patientName: `${patient?.nombre || ''} ${patient?.apellidos || ''}`.trim()
                        }
                      });
                    } else {
                      // Si no está completado, abrir para llenar
                      navigate(`/llenar-formulario/${form.formId}/${id}`, {
                        state: { returnTo: `/perfil-paciente/${id}` }
                      });
                    }
                  }}
                >
                  <FormularioIcon $completed={form.completed}>
                    {form.completed ? <Check /> : <FileText />}
                  </FormularioIcon>
                  <FormularioInfo>
                    <FormularioName>{form.name}</FormularioName>
                    <FormularioMeta>
                      {form.completed ? `Completado: ${form.date}` : 'Pendiente de completar'}
                    </FormularioMeta>
                  </FormularioInfo>
                  <FormularioStatus $completed={form.completed}>
                    {form.completed ? 'Completado' : 'Pendiente'}
                  </FormularioStatus>
                  <FormularioDeleteBtn 
                    onClick={(e) => handleDeleteFormulario(form, e)}
                    title="Eliminar formulario"
                  >
                    <Trash2 />
                  </FormularioDeleteBtn>
                  <ChevronRight size={18} color="#6C757D" />
                </FormularioItem>
              ))}
            </FormulariosList>
          ) : (
            <EmptyFormularios>
              <FileText />
              <p>No hay formularios clínicos para este paciente</p>
            </EmptyFormularios>
          )}
        </Section>

        <Section>
          <SectionTitle>Adjuntos</SectionTitle>
          
          <UploadSection>
            <UploadArea
              $isDragging={isDragging}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon>
                <Upload />
              </UploadIcon>
              <UploadText>Arrastra archivos aquí o haz clic para seleccionar</UploadText>
              <UploadSubtext>Soporta imágenes (JPG, PNG) y documentos (PDF, DOC)</UploadSubtext>
              
              <UploadButtons onClick={(e) => e.stopPropagation()}>
                <UploadButton onClick={() => imageInputRef.current?.click()}>
                  <Image />
                  Subir Foto
                </UploadButton>
                <UploadButton onClick={() => fileInputRef.current?.click()}>
                  <File />
                  Subir Documento
                </UploadButton>
              </UploadButtons>
            </UploadArea>
            
            <HiddenInput
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
              multiple
            />
            <HiddenInput
              type="file"
              ref={imageInputRef}
              onChange={handleFileSelect}
              accept="image/*,.heic,.heif"
              capture="environment"
              multiple
            />
          </UploadSection>

          {documents.length > 0 ? (
            documents.map((doc) => (
              <DocumentItem key={doc.id || doc.name}>
                <DocumentInfo>
                  <FileTypeIcon $isImage={doc.isImage || isImageFile(doc.name)}>
                    {doc.isImage || isImageFile(doc.name) ? <Image /> : <File />}
                  </FileTypeIcon>
                  <DocumentDetails>
                    <DocumentName>{doc.name}</DocumentName>
                    <DocumentDate>
                      Subido: {doc.date} {doc.size && `• ${doc.size}`}
                    </DocumentDate>
                  </DocumentDetails>
                </DocumentInfo>
                <DocumentActions>
                  <ViewButton onClick={() => handleViewDocument(doc)}>
                    <Eye size={16} />
                  </ViewButton>
                  <ViewButton onClick={() => handleDownloadDocument(doc)}>
                    <Download size={16} />
                  </ViewButton>
                  <DeleteDocButton onClick={() => handleDeleteDocument(doc)}>
                    <Trash2 />
                  </DeleteDocButton>
                </DocumentActions>
              </DocumentItem>
            ))
          ) : (
            <p style={{ color: '#6C757D', fontSize: '14px' }}>No hay documentos adjuntos.</p>
          )}
        </Section>
          </>
        ) : (
          <p style={{ textAlign: 'center', padding: '60px 0', color: '#6C757D' }}>Paciente no encontrado</p>
        )}
      </Content>
    </PageContainer>
  );
};

export default PerfilPaciente;
