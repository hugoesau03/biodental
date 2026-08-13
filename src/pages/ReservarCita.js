import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { UserPlus, Calendar as CalendarIcon, Clock, AlertCircle, Check, ChevronLeft, ChevronRight, ChevronDown, User, Loader, DoorOpen, Search, X, MessageCircle } from 'lucide-react';
import Header from '../components/Layout/Header';
import Modal from '../components/Modal';
import { usuariosService, pacientesService, serviciosService, horariosService, citasService, consultoriosInternosService, whatsappService } from '../services/api';
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

const Form = styled.form`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 24px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const FormSection = styled.div`
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 16px 0;
`;

const FormField = styled.div`
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 8px;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
`;

const Input = styled.input`
  flex: 1;
  min-width: 0;
  padding: 12px 16px;
  padding-left: ${({ $hasIcon }) => $hasIcon ? '44px' : '16px'};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: 14px;
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.textSecondary};

  svg {
    width: 20px;
    height: 20px;
  }
`;

const IconButton = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  border: none;
  padding: 10px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 44px;
  height: 44px;
  transition: all 0.3s ease;

  svg {
    width: 20px;
    height: 20px;
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: ${({ theme }) => theme.colors.primaryDark};
    }
  }
`;

const AutocompleteWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const SuggestionsList = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-top: none;
  border-radius: 0 0 ${({ theme }) => theme.borderRadius.md} ${({ theme }) => theme.borderRadius.md};
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const SuggestionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
  }
`;

const SuggestionAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  svg {
    width: 18px;
    height: 18px;
    color: white;
  }
`;

const SuggestionInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const SuggestionName = styled.div`
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
`;

const SuggestionDetail = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

// Dropdown personalizado para doctor y consultorio
const DropdownWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const DropdownTrigger = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid ${({ theme, $isOpen }) => $isOpen ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.white};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const DropdownPlaceholder = styled.span`
  flex: 1;
  font-size: 15px;
  color: ${({ theme, $hasValue }) => $hasValue ? theme.colors.text : theme.colors.textSecondary};
`;

const DropdownArrow = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: transform 0.2s ease;
  transform: ${({ $isOpen }) => $isOpen ? 'rotate(180deg)' : 'rotate(0)'};
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const DropdownList = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  max-height: 250px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const DropdownItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s ease;
  background: ${({ $selected, theme }) => $selected ? theme.colors.gray : 'transparent'};

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
  }
`;

const DropdownItemAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  svg {
    width: 18px;
    height: 18px;
    color: white;
  }
`;

const DropdownItemInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const DropdownItemName = styled.div`
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
`;

const DropdownItemDetail = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  background: ${({ theme }) => theme.colors.white};
  cursor: pointer;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const TimeSelect = styled.select`
  width: 100%;
  padding: 12px 16px;
  padding-left: 44px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  background: ${({ theme }) => theme.colors.white};
  cursor: pointer;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.gray};
    cursor: not-allowed;
  }

  option {
    padding: 8px;
  }

  option:disabled {
    color: #999;
    background: #f5f5f5;
  }
`;

const TimeSlotsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 8px;
`;

const TimeSlotButton = styled.button`
  padding: 12px 8px;
  border: 1px solid ${({ $isSelected, theme }) => $isSelected ? theme.colors.primary : theme.colors.border};
  background: ${({ $isSelected, $isOccupied, theme }) => 
    $isOccupied ? '#f5f5f5' : 
    $isSelected ? theme.colors.primary : 'white'};
  color: ${({ $isSelected, $isOccupied }) => 
    $isOccupied ? '#999' : 
    $isSelected ? 'white' : 'inherit'};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: ${({ $isOccupied }) => $isOccupied ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  text-decoration: ${({ $isOccupied }) => $isOccupied ? 'line-through' : 'none'};
  
  &:hover:not(:disabled) {
    border-color: ${({ $isOccupied, theme }) => $isOccupied ? theme.colors.border : theme.colors.primary};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TimeSlotInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};

  svg {
    width: 14px;
    height: 14px;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  min-height: 100px;
  resize: vertical;
  font-family: ${({ theme }) => theme.fonts.primary};
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 14px;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 24px;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.border};
    cursor: not-allowed;
  }
`;

const WarningBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: 20px;
  
  svg {
    width: 24px;
    height: 24px;
    color: #856404;
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const WarningContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const WarningTitle = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: #856404;
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

const WarningText = styled.span`
  color: #856404;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const WarningLink = styled.button`
  background: #856404;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  margin-top: 4px;
  align-self: flex-start;
  
  &:hover {
    background: #6c5303;
  }
`;

const ServicesGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ServicesHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const SearchToggleBtn = styled.button`
  background: ${({ $active, theme }) => $active ? theme.colors.primary : 'transparent'};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: ${({ $active, theme }) => $active ? 'white' : theme.colors.textSecondary};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ $active, theme }) => $active ? 'white' : theme.colors.primary};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const ServiceSearchContainer = styled.div`
  position: relative;
  margin-bottom: 12px;
  display: ${({ $visible }) => $visible ? 'block' : 'none'};
`;

const ServiceSearchInput = styled.input`
  width: 100%;
  padding: 12px 40px 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  font-size: 14px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const ClearSearchBtn = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const NoServicesFound = styled.div`
  text-align: center;
  padding: 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
`;

const ServiceCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: ${({ $selected, theme }) => $selected ? `${theme.colors.primary}10` : theme.colors.background};
  border: 2px solid ${({ $selected, theme }) => $selected ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ServiceCheckbox = styled.div`
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 2px solid ${({ $checked, theme }) => $checked ? theme.colors.primary : theme.colors.border};
  background: ${({ $checked, theme }) => $checked ? theme.colors.primary : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;

  svg {
    width: 14px;
    height: 14px;
    color: white;
  }
`;

const ServiceInfo = styled.div`
  flex: 1;
`;

const ServiceName = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 4px;
`;

const ServiceDetails = styled.div`
  display: flex;
  gap: 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ServicePrice = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.primary};
`;

const SelectedServicesInfo = styled.div`
  margin-top: 12px;
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.primary}10;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TotalLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const TotalValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

// Styled components para el calendario
const CalendarContainer = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const MonthYear = styled.h4`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const NavButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const NavButton = styled.button`
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: all 0.2s ease;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const WeekDays = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
`;

const WeekDay = styled.div`
  text-align: center;
  font-size: 12px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: 6px 0;
`;

const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
`;

const DayCell = styled.button`
  width: 36px;
  height: 36px;
  border: none;
  background: ${({ $isToday, $isSelected, $isUnavailable, theme }) => 
    $isSelected ? theme.colors.primary : 
    $isToday ? `${theme.colors.info}30` : 
    $isUnavailable ? '#FFEBEE' :
    'transparent'};
  color: ${({ $isToday, $isSelected, $isOtherMonth, $isPast, $isUnavailable, theme }) => 
    $isSelected ? theme.colors.white :
    $isOtherMonth || $isPast ? '#D0D0D0' :
    $isUnavailable ? '#B71C1C' :
    $isToday ? theme.colors.primary :
    theme.colors.text};
  border-radius: 50%;
  font-size: 13px;
  font-weight: ${({ $isSelected, $isUnavailable, theme }) => 
    $isSelected || $isUnavailable ? theme.fontWeights.semibold : theme.fontWeights.normal};
  cursor: ${({ $isPast, $isOtherMonth, $isUnavailable }) => 
    $isPast || $isOtherMonth || $isUnavailable ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  justify-self: center;
  position: relative;
  border: ${({ $isUnavailable }) => $isUnavailable ? '2px solid #EF5350' : 'none'};

  &::before {
    content: ${({ $isUnavailable }) => $isUnavailable ? "''" : 'none'};
    position: absolute;
    width: 24px;
    height: 2px;
    background-color: #D32F2F;
    transform: rotate(-45deg);
    z-index: 1;
  }

  &:hover {
    background: ${({ $isSelected, $isPast, $isOtherMonth, $isUnavailable, theme }) => 
      $isPast || $isOtherMonth ? 'transparent' :
      $isUnavailable ? '#FFCDD2' :
      $isSelected ? theme.colors.primaryDark : theme.colors.gray};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: ${({ $isUnavailable }) => $isUnavailable ? 1 : 0.3};
  }
`;

const CalendarLegend = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  flex-wrap: wrap;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const LegendDot = styled.span`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  border: ${({ $border }) => $border || '1px solid transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  color: ${({ $textColor }) => $textColor || 'inherit'};
  text-decoration: ${({ $strikethrough }) => $strikethrough ? 'line-through' : 'none'};
`;

// Modal de confirmación de cita
const ConfirmModalOverlay = styled.div`
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

const ConfirmModalContent = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  max-width: 450px;
  width: 100%;
  max-height: 70vh;
  overflow-y: auto;
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

const ConfirmModalHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  
  h3 {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const ConfirmModalBody = styled.div`
  padding: 20px;
`;

const SummarySection = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SummaryLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 4px;
`;

const SummaryValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
`;

const SummaryServicesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
`;

const SummaryServiceItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: ${({ theme }) => theme.colors.gray};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const SummaryTotals = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: ${({ theme }) => theme.colors.primary}10;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-top: 12px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const BlockingSection = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const BlockingCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 12px;
  background: ${({ theme }) => theme.colors.gray};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  
  input {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }
  
  span {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const BlockingTimeOption = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: ${({ theme }) => theme.colors.gray};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

const BlockingTimeLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 8px;
`;

const BlockingTimeInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ConfirmModalFooter = styled.div`
  padding: 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  gap: 12px;
`;

const ModalButton = styled.button`
  flex: 1;
  padding: 12px 16px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(ModalButton)`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
  
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.gray};
  }
`;

const ConfirmButton = styled(ModalButton)`
  background: ${({ theme }) => theme.colors.primary};
  border: none;
  color: white;
  
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const ReservarCita = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAlert();
  const [searchParams] = useSearchParams();
  const preselectedDoctor = searchParams.get('doctor'); // UUID del doctor preseleccionado
  
  // Recibir datos preseleccionados desde location.state (desde Agenda)
  const { 
    doctorPreseleccionado, 
    fechaPreseleccionada, 
    horaPreseleccionada 
  } = location.state || {};
  
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [showServiceSearch, setShowServiceSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estado para horarios y disponibilidad
  const [doctorSchedule, setDoctorSchedule] = useState(null);
  const [daySlots, setDaySlots] = useState([]); // Slots del día según el backend [{hora, disponible}]
  const [dayNotAvailable, setDayNotAvailable] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [doctorWorkDays, setDoctorWorkDays] = useState([]); // Días que trabaja el doctor (0-6)
  const [blockedDates, setBlockedDates] = useState([]); // Fechas con bloqueo de día completo (formato YYYY-MM-DD)
  
  const [formData, setFormData] = useState({
    patient: '',
    patientUuid: '',
    date: '',
    time: '',
    services: [],
    doctor: '',
    doctorUuid: '',
    duration: '',
    notes: ''
  });
  const [timeSlots, setTimeSlots] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Modal de advertencia: cita fuera del horario laboral del doctor
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  // Modal de confirmación por WhatsApp, tras crear la cita exitosamente
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [createdCitaUuid, setCreatedCitaUuid] = useState(null);
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  const [whatsappResult, setWhatsappResult] = useState(null); // { success, message }
  
  // Estado para modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [blockSchedule, setBlockSchedule] = useState(false);
  const [customBlockEndTime, setCustomBlockEndTime] = useState('');
  
  // Estado para consultorios internos
  const [consultoriosInternos, setConsultoriosInternos] = useState([]);
  const [selectedConsultorio, setSelectedConsultorio] = useState(null);
  
  // Estado para sugerencias de pacientes
  const [patientSearch, setPatientSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const suggestionsRef = useRef(null);

  // Estado para dropdowns de doctor y consultorio
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const doctorDropdownRef = useRef(null);
  
  const [showConsultorioDropdown, setShowConsultorioDropdown] = useState(false);
  const consultorioDropdownRef = useRef(null);

  // Cargar doctores, pacientes y servicios
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [doctorsRes, patientsRes, consultoriosRes] = await Promise.all([
          usuariosService.getDoctores(),
          pacientesService.getAll(),
          consultoriosInternosService.getAll()
        ]);
        
        if (doctorsRes.success) setDoctors(doctorsRes.data.doctores || []);
        if (patientsRes.success) setPatients(patientsRes.data.pacientes || []);
        if (consultoriosRes.success) {
          const consultorios = consultoriosRes.data.consultorios || [];
          setConsultoriosInternos(consultorios);
          if (consultorios.length === 1) {
            setSelectedConsultorio(consultorios[0]);
          }
        }
      } catch (err) {
        console.error('Error cargando datos:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  // Filtrar pacientes según búsqueda
  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.nombre} ${patient.apellidos}`.toLowerCase();
    return fullName.includes(patientSearch.toLowerCase()) ||
      (patient.numero_expediente || '').toLowerCase().includes(patientSearch.toLowerCase()) ||
      (patient.email || '').toLowerCase().includes(patientSearch.toLowerCase());
  });

  // Cerrar sugerencias y dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (doctorDropdownRef.current && !doctorDropdownRef.current.contains(event.target)) {
        setShowDoctorDropdown(false);
      }
      if (consultorioDropdownRef.current && !consultorioDropdownRef.current.contains(event.target)) {
        setShowConsultorioDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePatientSearchChange = (e) => {
    const value = e.target.value;
    setPatientSearch(value);
    setShowSuggestions(value.length > 0);
    setSelectedPatient(null);
    setFormData(prev => ({ ...prev, patient: value, patientUuid: '' }));
  };

  const handleSelectPatient = (patient) => {
    const fullName = `${patient.nombre} ${patient.apellidos}`;
    setSelectedPatient(patient);
    setPatientSearch(fullName);
    setFormData(prev => ({ ...prev, patient: fullName, patientUuid: patient.uuid }));
    setShowSuggestions(false);
  };

  // Handler para selección de doctor desde dropdown
  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setFormData(prev => ({ 
      ...prev, 
      doctor: `${doctor.nombre} ${doctor.apellidos}`, 
      doctorUuid: doctor.uuid,
      services: [],
      duration: '',
      time: ''
    }));
    setDoctorSchedule(null);
    setDaySlots([]);
    setShowDoctorDropdown(false);
  };

  // Handler para selección de consultorio desde dropdown
  const handleSelectConsultorio = (consultorio) => {
    setSelectedConsultorio(consultorio);
    setShowConsultorioDropdown(false);
  };
  
  // Estado para el calendario
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Nombres de meses y días
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Generar días del calendario
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // Días del mes anterior
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isOtherMonth: true,
        date: new Date(currentYear, currentMonth - 1, prevMonthLastDay - i)
      });
    }
    
    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      days.push({
        day: i,
        isOtherMonth: false,
        date: date
      });
    }
    
    // Días del siguiente mes
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isOtherMonth: true,
        date: new Date(currentYear, currentMonth + 1, i)
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateSelect = (dayInfo) => {
    if (dayInfo.isOtherMonth) return;
    
    const selectedDate = dayInfo.date;
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    if (selectedDate < todayStart) return; // No permitir fechas pasadas
    
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    setFormData(prev => ({ ...prev, date: dateString, time: '' }));
  };

  const isDateSelected = (dayInfo) => {
    if (!formData.date) return false;
    const selectedDate = new Date(formData.date + 'T00:00:00');
    return dayInfo.date.getDate() === selectedDate.getDate() &&
           dayInfo.date.getMonth() === selectedDate.getMonth() &&
           dayInfo.date.getFullYear() === selectedDate.getFullYear();
  };

  const isToday = (dayInfo) => {
    return dayInfo.date.getDate() === today.getDate() &&
           dayInfo.date.getMonth() === today.getMonth() &&
           dayInfo.date.getFullYear() === today.getFullYear();
  };

  const isPastDate = (dayInfo) => {
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return dayInfo.date < todayStart;
  };

  // Verificar si el doctor trabaja ese día o si está bloqueado
  const isDayUnavailable = (dayInfo) => {
    // Si no hay doctor seleccionado, no mostrar como no disponible
    if (!formData.doctorUuid) return false;
    
    // Verificar si el día está bloqueado (día completo)
    if (dayInfo.date) {
      const dateStr = `${dayInfo.date.getFullYear()}-${String(dayInfo.date.getMonth() + 1).padStart(2, '0')}-${String(dayInfo.date.getDate()).padStart(2, '0')}`;
      if (blockedDates.includes(dateStr)) {
        console.log(`Día ${dateStr} bloqueado por blockedDates`);
        return true;
      }
    }
    
    // Si aún no se cargaron los días, no mostrar como no disponible aún
    if (doctorWorkDays.length === 0) return false;
    const dayOfWeek = dayInfo.date.getDay();
    const isUnavailable = !doctorWorkDays.includes(dayOfWeek);
    if (isUnavailable && dayInfo.date) {
      const dateStr = `${dayInfo.date.getFullYear()}-${String(dayInfo.date.getMonth() + 1).padStart(2, '0')}-${String(dayInfo.date.getDate()).padStart(2, '0')}`;
      console.log(`Día ${dateStr} no disponible - dayOfWeek: ${dayOfWeek}, doctorWorkDays:`, doctorWorkDays);
    }
    return isUnavailable;
  };

  // Log para debug - ver días de trabajo cargados
  useEffect(() => {
    if (doctorWorkDays.length > 0) {
      console.log('Días de trabajo actualizados:', doctorWorkDays);
    }
  }, [doctorWorkDays]);

  // Si hay doctor preseleccionado o solo hay un médico, seleccionarlo automáticamente
  useEffect(() => {
    if (doctors.length > 0 && !formData.doctorUuid) {
      // Prioridad 1: Doctor preseleccionado desde location.state (Agenda)
      if (doctorPreseleccionado) {
        const doctorFound = doctors.find(d => d.uuid === doctorPreseleccionado.uuid);
        if (doctorFound) {
          setSelectedDoctor(doctorFound);
          setFormData(prev => ({
            ...prev,
            doctor: `${doctorFound.nombre} ${doctorFound.apellidos}`,
            doctorUuid: doctorFound.uuid,
            date: fechaPreseleccionada || prev.date,
            time: horaPreseleccionada || prev.time
          }));
          return;
        }
      }
      // Prioridad 2: Doctor preseleccionado desde URL
      if (preselectedDoctor) {
        const doctorFound = doctors.find(d => d.uuid === preselectedDoctor);
        if (doctorFound) {
          setSelectedDoctor(doctorFound);
          setFormData(prev => ({
            ...prev,
            doctor: `${doctorFound.nombre} ${doctorFound.apellidos}`,
            doctorUuid: doctorFound.uuid
          }));
          return;
        }
      }
      // Prioridad 3: Si solo hay un médico
      if (doctors.length === 1 && doctors[0]?.uuid) {
        const doctorFound = doctors[0];
        setSelectedDoctor(doctorFound);
        setFormData(prev => ({
          ...prev,
          doctor: `${doctorFound.nombre} ${doctorFound.apellidos}`,
          doctorUuid: doctorFound.uuid
        }));
      }
    }
  }, [doctors, formData.doctorUuid, preselectedDoctor, doctorPreseleccionado, fechaPreseleccionada, horaPreseleccionada]);

  // Cargar días de trabajo cuando cambia el doctor
  useEffect(() => {
    const fetchDoctorWorkDays = async () => {
      if (formData.doctorUuid) {
        console.log('Cargando días de trabajo para:', formData.doctorUuid);
        try {
          const response = await horariosService.getByDoctor(formData.doctorUuid);
          console.log('Respuesta horarios:', response);
          console.log('Primer horario completo:', response.data.horarios?.[0]);
          if (response.success && response.data.horarios?.length > 0) {
            // Obtener los días activos - MySQL devuelve activo como 0 o 1
            const activeDays = response.data.horarios
              .filter(h => h.activo == 1) // Usar == para comparación flexible
              .map(h => Number(h.dia_semana));
            console.log('Días activos:', activeDays);
            setDoctorWorkDays(activeDays);
          } else {
            // Sin horarios configurados, asumir lunes a viernes
            console.log('Sin horarios, usando default [1,2,3,4,5]');
            setDoctorWorkDays([1, 2, 3, 4, 5]);
          }
        } catch (err) {
          console.error('Error cargando días de trabajo:', err);
          setDoctorWorkDays([1, 2, 3, 4, 5]);
        }
      } else {
        setDoctorWorkDays([]);
        setBlockedDates([]);
      }
    };
    
    fetchDoctorWorkDays();
  }, [formData.doctorUuid]);

  // Cargar bloqueos del doctor (días completos) para el calendario
  useEffect(() => {
    const fetchBlockedDates = async () => {
      if (formData.doctorUuid) {
        try {
          // Obtener bloqueos de los próximos 3 meses
          const hoy = new Date();
          const desde = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
          const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 3, 0);
          const hastaStr = `${hasta.getFullYear()}-${String(hasta.getMonth() + 1).padStart(2, '0')}-${String(hasta.getDate()).padStart(2, '0')}`;
          
          const response = await horariosService.getBloqueos(formData.doctorUuid, {
            desde: desde,
            hasta: hastaStr
          });
          
          if (response.success && response.data.bloqueos) {
            // Extraer solo las fechas de bloqueos de día completo
            const fechasBloqueadas = [];
            response.data.bloqueos.forEach(b => {
              // todo_el_dia puede venir como 0/1 o true/false
              const todoElDia = b.todo_el_dia === 1 || b.todo_el_dia === true;
              if (todoElDia) {
                // Extraer la fecha directamente del string sin conversión de zona horaria
                const fechaInicioStr = String(b.fecha_inicio);
                let dateStr = fechaInicioStr;
                if (dateStr.includes('T')) {
                  dateStr = dateStr.split('T')[0];
                } else if (dateStr.includes(' ')) {
                  dateStr = dateStr.split(' ')[0];
                }
                if (!fechasBloqueadas.includes(dateStr)) {
                  fechasBloqueadas.push(dateStr);
                }
              }
            });
            console.log('Fechas bloqueadas cargadas:', fechasBloqueadas);
            setBlockedDates(fechasBloqueadas);
          }
        } catch (err) {
          console.error('Error cargando bloqueos:', err);
        }
      }
    };
    
    fetchBlockedDates();
  }, [formData.doctorUuid]);

  // Cargar servicios del doctor seleccionado
  useEffect(() => {
    const fetchDoctorServices = async () => {
      if (formData.doctorUuid) {
        try {
          const response = await serviciosService.getByDoctor(formData.doctorUuid);
          if (response.success) {
            // Usar solo los servicios asignados al doctor
            setServices(response.data.servicios || []);
            // Limpiar servicios seleccionados si cambia el doctor
            setFormData(prev => ({ ...prev, services: [] }));
          }
        } catch (err) {
          console.error('Error cargando servicios del doctor:', err);
          setServices([]);
        }
      } else {
        setServices([]);
      }
    };
    
    fetchDoctorServices();
  }, [formData.doctorUuid]);

  // Cargar disponibilidad del día desde el backend cuando cambia médico o fecha.
  // El endpoint /horarios/disponibilidad es la única fuente de verdad: considera
  // horario laboral, citas existentes, bloqueos (totales y parciales) y horas
  // que ya pasaron del día actual.
  useEffect(() => {
    const fetchAvailability = async () => {
      if (formData.doctorUuid && formData.date) {
        setLoadingSlots(true);
        setDayNotAvailable(false);
        setTimeSlots([]);

        try {
          const res = await horariosService.getDisponibilidad(formData.doctorUuid, formData.date);

          if (res.success && res.data?.disponible) {
            setDoctorSchedule({
              start: String(res.data.horario.inicio).substring(0, 5),
              end: String(res.data.horario.fin).substring(0, 5),
              interval: res.data.horario.intervalo || 30
            });
            setDaySlots(res.data.slots || []);
          } else {
            // Día bloqueado o el doctor no trabaja ese día
            setDayNotAvailable(true);
            setDoctorSchedule(null);
            setDaySlots([]);
          }
        } catch (err) {
          console.error('Error cargando disponibilidad:', err);
          // Fallback sin conexión: horario por defecto entre semana,
          // el backend validará de todas formas al confirmar
          const dayOfWeek = new Date(formData.date + 'T00:00:00').getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            setDayNotAvailable(true);
            setDoctorSchedule(null);
            setDaySlots([]);
          } else {
            const fallback = { start: '09:00', end: '18:00', interval: 30 };
            setDoctorSchedule(fallback);
            setDaySlots(generarSlotsPorDefecto(fallback));
          }
        } finally {
          setLoadingSlots(false);
        }
      } else {
        setTimeSlots([]);
        setDayNotAvailable(false);
      }
    };

    fetchAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.doctorUuid, formData.date]);

  // Generar los horarios seleccionables combinando la disponibilidad del día
  // con la duración de la cita: una hora solo es elegible si la cita COMPLETA
  // cabe en slots libres y termina antes del cierre
  useEffect(() => {
    if (!doctorSchedule || daySlots.length === 0) {
      setTimeSlots([]);
      return;
    }

    const toMinutes = (hhmm) => {
      const [h, m] = String(hhmm).split(':').map(Number);
      return h * 60 + m;
    };

    const duration = parseInt(formData.duration) || doctorSchedule.interval;
    const slotsNecesarios = Math.ceil(duration / doctorSchedule.interval);
    const cierre = toMinutes(doctorSchedule.end);

    const slots = daySlots.map((slot, i) => {
      let available = slot.disponible;

      // La cita completa debe terminar antes del cierre
      if (available && toMinutes(slot.hora) + duration > cierre) {
        available = false;
      }

      // Todos los slots que ocupará la cita deben estar libres
      for (let k = 1; k < slotsNecesarios && available; k++) {
        const siguiente = daySlots[i + k];
        if (!siguiente || !siguiente.disponible) {
          available = false;
        }
      }

      return {
        time: slot.hora,
        available,
        label: available ? slot.hora : `${slot.hora} - Ocupado`
      };
    });

    setTimeSlots(slots);
  }, [daySlots, doctorSchedule, formData.duration]);

  // Slots por defecto, solo para el fallback cuando el backend no responde
  const generarSlotsPorDefecto = ({ start, end, interval }) => {
    const slots = [];
    let [hora, minuto] = start.split(':').map(Number);
    const [finHora, finMin] = end.split(':').map(Number);

    while (hora * 60 + minuto < finHora * 60 + finMin) {
      slots.push({
        hora: `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`,
        disponible: true
      });
      minuto += interval;
      if (minuto >= 60) {
        hora += Math.floor(minuto / 60);
        minuto = minuto % 60;
      }
    }

    return slots;
  };

  // Los servicios ahora vienen de la lista general
  const availableServices = services.map(s => ({
    id: s.id,
    uuid: s.uuid,
    name: s.nombre,
    price: parseFloat(s.precio) || 0,
    duration: s.duracion_minutos || 30
  }));

  // Filtrar servicios según búsqueda
  const filteredServices = availableServices.filter(service => 
    service.name.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar que haya consultorios disponibles
    if (consultoriosInternos.length === 0) {
      showAlert('No hay consultorios registrados. Debe registrar al menos un consultorio para agendar citas.', { tipo: 'warning' });
      return;
    }

    if (!formData.patientUuid || !formData.doctorUuid || !formData.date || !formData.time) {
      showAlert('Por favor complete todos los campos requeridos', { tipo: 'warning' });
      return;
    }

    if (formData.services.length === 0) {
      showAlert('Por favor seleccione al menos un servicio', { tipo: 'warning' });
      return;
    }

    if (!selectedConsultorio) {
      showAlert('Por favor seleccione un consultorio', { tipo: 'warning' });
      return;
    }
    
    // Calcular hora fin para mostrar en el modal
    const totalDuration = parseInt(formData.duration) || 30;
    const [hours, mins] = formData.time.split(':').map(Number);

    // Resetear opciones de bloqueo; por defecto proponer 30 min extra
    // después del fin de la cita (el rango de la cita ya queda protegido solo)
    const extraDate = new Date(2000, 0, 1, hours, mins + totalDuration + 30);
    const finExtra = `${extraDate.getHours().toString().padStart(2, '0')}:${extraDate.getMinutes().toString().padStart(2, '0')}`;
    setBlockSchedule(false);
    setCustomBlockEndTime(finExtra);
    
    // Mostrar modal de confirmación
    setShowConfirmModal(true);
  };
  
  // Calcular hora fin de la cita
  const getCalculatedEndTime = () => {
    if (!formData.time || !formData.duration) return '';
    const totalDuration = parseInt(formData.duration) || 30;
    const [hours, mins] = formData.time.split(':').map(Number);
    const endDate = new Date(2000, 0, 1, hours, mins + totalDuration);
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  };
  
  // Confirmar y crear la cita
  // permitirFueraHorario=true cuando el usuario ya confirmó la advertencia
  // de fuera de horario laboral (se compara === true porque al usarse como
  // onClick recibe el evento del click)
  const handleConfirmCita = async (permitirFueraHorario = false) => {
    const forzarFueraHorario = permitirFueraHorario === true;
    setSaving(true);
    setShowConfirmModal(false);

    try {
      const hora_fin = getCalculatedEndTime();

      // Obtener UUIDs de servicios seleccionados
      const servicios_uuids = formData.services.map(id => {
        const servicio = services.find(s => s.id === id);
        return servicio?.uuid;
      }).filter(Boolean);

      const citaData = {
        paciente_uuid: formData.patientUuid,
        doctor_uuid: formData.doctorUuid,
        fecha: formData.date,
        hora_inicio: formData.time,
        hora_fin: hora_fin,
        tipo: 'seguimiento',
        notas: formData.notes || null,
        servicios_uuids: servicios_uuids,
        consultorio_interno_uuid: selectedConsultorio?.uuid || null,
        permitir_fuera_horario: forzarFueraHorario
      };

      const response = await citasService.create(citaData);
      
      if (response.success) {
        // La cita ya protege su propio rango contra otras reservas.
        // El bloqueo opcional solo cubre tiempo ADICIONAL después de la cita
        // (limpieza, descanso del doctor, etc.)
        if (blockSchedule && customBlockEndTime && customBlockEndTime > hora_fin) {
          try {
            const bloqueoData = {
              fecha_inicio: `${formData.date} ${hora_fin}:00`,
              fecha_fin: `${formData.date} ${customBlockEndTime}:00`,
              motivo: `Tiempo adicional - Cita de ${selectedPatient?.nombre || 'Paciente'}`,
              todo_el_dia: false,
              // Ligar el bloqueo a la cita para que se elimine automáticamente
              // al cancelar, reprogramar o marcar no asistió
              cita_uuid: response.data?.uuid || null
            };

            await horariosService.createBloqueo(formData.doctorUuid, bloqueoData);
          } catch (bloqueoError) {
            console.error('Error creando bloqueo:', bloqueoError);
            // No mostrar error, la cita ya se creó
          }
        }

        // Si el paciente tiene teléfono, ofrecer enviar confirmación por WhatsApp
        // antes de navegar a la agenda; si no, ir directo al modal de éxito
        if (selectedPatient?.telefono) {
          setCreatedCitaUuid(response.data?.uuid || null);
          setWhatsappResult(null);
          setShowWhatsappModal(true);
        } else {
          setShowSuccessModal(true);
        }
      } else {
        setErrorMessage(response.message || 'Error al crear la cita');
        setShowErrorModal(true);
      }
    } catch (err) {
      // Fuera del horario laboral: mostrar advertencia confirmable en vez de error
      if (err.response?.status === 409 && err.response?.data?.code === 'FUERA_HORARIO') {
        setWarningMessage(err.response.data.message);
        setShowWarningModal(true);
      } else {
        console.error('Error creando cita:', err);
        const mensaje = err.response?.data?.message || err.message || 'Error al crear la cita';
        setErrorMessage(mensaje);
        setShowErrorModal(true);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate('/agenda');
  };

  // Enviar confirmación de WhatsApp para la cita recién creada
  const handleEnviarWhatsapp = async () => {
    if (!createdCitaUuid) return;
    setSendingWhatsapp(true);
    setWhatsappResult(null);
    try {
      const res = await whatsappService.enviarConfirmacion(createdCitaUuid);
      setWhatsappResult({
        success: res.success,
        message: res.success ? 'Confirmación enviada por WhatsApp' : (res.message || 'No se pudo enviar')
      });
    } catch (err) {
      setWhatsappResult({
        success: false,
        message: err.response?.data?.message || 'No se pudo enviar la confirmación por WhatsApp'
      });
    } finally {
      setSendingWhatsapp(false);
    }
  };

  const handleCerrarWhatsappModal = () => {
    setShowWhatsappModal(false);
    setCreatedCitaUuid(null);
    setWhatsappResult(null);
    navigate('/agenda');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Si cambia el médico, resetear servicios, duración y hora
    if (name === 'doctor') {
      // Encontrar el doctor seleccionado para obtener su UUID
      const selectedDoc = doctors.find(d => d.uuid === value);
      console.log('Doctor seleccionado:', selectedDoc, 'value:', value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        doctorUuid: selectedDoc?.uuid || value,
        services: [],
        duration: '',
        time: ''
      }));
      setDoctorSchedule(null);
      setDaySlots([]);
    }
    // Si cambia la fecha, resetear la hora
    else if (name === 'date') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        time: ''
      }));
    }
    else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Manejar selección de servicios
  const handleServiceToggle = (serviceId) => {
    setFormData(prev => {
      const isSelected = prev.services.includes(serviceId);
      let newServices;
      
      if (isSelected) {
        newServices = prev.services.filter(id => id !== serviceId);
      } else {
        newServices = [...prev.services, serviceId];
      }
      
      // Calcular duración total
      const totalDuration = newServices.reduce((total, id) => {
        const service = availableServices.find(s => s.id === id);
        return total + (service ? service.duration : 0);
      }, 0);
      
      return {
        ...prev,
        services: newServices,
        duration: totalDuration > 0 ? totalDuration.toString() : ''
      };
    });
  };

  // Calcular totales
  const selectedServicesData = formData.services.map(id => availableServices.find(s => s.id === id)).filter(Boolean);
  const totalPrice = selectedServicesData.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServicesData.reduce((sum, s) => sum + s.duration, 0);

  return (
    <PageContainer>
      <Modal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        title="Cita Reservada"
        message="La cita ha sido reservada exitosamente."
        type="success"
        confirmText="Aceptar"
      />

      {/* Confirmación por WhatsApp tras crear la cita */}
      {showWhatsappModal && (
        <ConfirmModalOverlay onClick={() => !sendingWhatsapp && handleCerrarWhatsappModal()}>
          <ConfirmModalContent onClick={e => e.stopPropagation()} style={{ maxWidth: '380px' }}>
            <ConfirmModalHeader>
              <h3>Cita Reservada</h3>
            </ConfirmModalHeader>
            <ConfirmModalBody>
              {!whatsappResult ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <MessageCircle size={22} color="#25D366" />
                    <SummaryValue>¿Enviar confirmación por WhatsApp?</SummaryValue>
                  </div>
                  <SummaryLabel>
                    Se enviará un mensaje a {selectedPatient?.nombre} con la fecha, hora y médico de la cita.
                  </SummaryLabel>
                </>
              ) : (
                <SummarySection>
                  <SummaryLabel>{whatsappResult.success ? 'Enviado' : 'No se pudo enviar'}</SummaryLabel>
                  <SummaryValue>{whatsappResult.message}</SummaryValue>
                </SummarySection>
              )}
            </ConfirmModalBody>
            <ConfirmModalFooter>
              {!whatsappResult ? (
                <>
                  <CancelButton type="button" onClick={handleCerrarWhatsappModal} disabled={sendingWhatsapp}>
                    Omitir
                  </CancelButton>
                  <ConfirmButton type="button" onClick={handleEnviarWhatsapp} disabled={sendingWhatsapp}>
                    {sendingWhatsapp ? 'Enviando...' : 'Enviar por WhatsApp'}
                  </ConfirmButton>
                </>
              ) : (
                <ConfirmButton type="button" onClick={handleCerrarWhatsappModal}>
                  Listo
                </ConfirmButton>
              )}
            </ConfirmModalFooter>
          </ConfirmModalContent>
        </ConfirmModalOverlay>
      )}

      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error al Crear Cita"
        message={errorMessage}
        type="error"
        confirmText="Entendido"
        onConfirm={() => setShowErrorModal(false)}
      />

      {/* Advertencia: cita fuera del horario laboral del doctor */}
      <Modal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onConfirm={() => {
          setShowWarningModal(false);
          handleConfirmCita(true);
        }}
        title="Fuera de Horario"
        message={`${warningMessage}. ¿Deseas agendar la cita de todas formas?`}
        type="warning"
        confirmText="Agendar de todas formas"
        cancelText="Cancelar"
        showCancel
      />

      {/* Modal de confirmación de cita */}
      {showConfirmModal && (
        <ConfirmModalOverlay onClick={() => setShowConfirmModal(false)}>
          <ConfirmModalContent onClick={e => e.stopPropagation()}>
            <ConfirmModalHeader>
              <h3>Confirmar Reserva de Cita</h3>
            </ConfirmModalHeader>
            
            <ConfirmModalBody>
              <SummarySection>
                <SummaryLabel>Paciente</SummaryLabel>
                <SummaryValue>{selectedPatient?.nombre || 'No seleccionado'}</SummaryValue>
              </SummarySection>
              
              <SummarySection>
                <SummaryLabel>Médico</SummaryLabel>
                <SummaryValue>
                  {selectedDoctor ? `${selectedDoctor.nombre} ${selectedDoctor.apellidos}` : 'No seleccionado'}
                </SummaryValue>
              </SummarySection>
              
              <SummarySection>
                <SummaryLabel>Fecha y Hora</SummaryLabel>
                <SummaryValue>
                  {formData.date && new Date(formData.date + 'T12:00:00').toLocaleDateString('es-MX', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  {' • '}
                  {formData.time} - {getCalculatedEndTime()}
                </SummaryValue>
              </SummarySection>
              
              <SummarySection>
                <SummaryLabel>Servicios ({selectedServicesData.length})</SummaryLabel>
                <SummaryServicesList>
                  {selectedServicesData.map(service => (
                    <SummaryServiceItem key={service.id}>
                      <span>{service.name}</span>
                      <span>${service.price.toFixed(2)}</span>
                    </SummaryServiceItem>
                  ))}
                </SummaryServicesList>
                
                <SummaryTotals>
                  <span>Total: {totalDuration} min</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </SummaryTotals>
              </SummarySection>
              
              <BlockingSection>
                <BlockingCheckbox>
                  <input
                    type="checkbox"
                    checked={blockSchedule}
                    onChange={(e) => setBlockSchedule(e.target.checked)}
                  />
                  <span>Bloquear tiempo adicional después de la cita</span>
                </BlockingCheckbox>

                {blockSchedule && (
                  <BlockingTimeOption>
                    <BlockingTimeLabel>
                      Bloquear hasta (después de las {getCalculatedEndTime()}):
                    </BlockingTimeLabel>
                    <BlockingTimeInput
                      type="time"
                      value={customBlockEndTime}
                      onChange={(e) => setCustomBlockEndTime(e.target.value)}
                      min={getCalculatedEndTime()}
                    />
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      El horario de la cita ({formData.time} - {getCalculatedEndTime()}) ya queda protegido automáticamente
                    </div>
                  </BlockingTimeOption>
                )}
              </BlockingSection>
            </ConfirmModalBody>
            
            <ConfirmModalFooter>
              <CancelButton 
                type="button" 
                onClick={() => setShowConfirmModal(false)}
                disabled={saving}
              >
                Cancelar
              </CancelButton>
              <ConfirmButton 
                type="button" 
                onClick={handleConfirmCita}
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Confirmar Cita'}
              </ConfirmButton>
            </ConfirmModalFooter>
          </ConfirmModalContent>
        </ConfirmModalOverlay>
      )}

      <Header title="Reservar Cita" showBack />
      
      <Content>
        <Form onSubmit={handleSubmit}>
          {/* Advertencia si no hay consultorios */}
          {!loading && consultoriosInternos.length === 0 && (
            <WarningBanner>
              <AlertCircle />
              <WarningContent>
                <WarningTitle>No hay consultorios registrados</WarningTitle>
                <WarningText>
                  Para poder agendar citas, primero debe registrar al menos un consultorio interno donde se realizarán las consultas.
                </WarningText>
                <WarningLink type="button" onClick={() => navigate('/gestion-consultorios')}>
                  Ir a Gestión de Consultorios
                </WarningLink>
              </WarningContent>
            </WarningBanner>
          )}
          
          <FormSection>
            <SectionTitle>Paciente</SectionTitle>
            <FormField>
              <Label>Paciente {selectedPatient && `- ${selectedPatient.numero_expediente}`}</Label>
              <AutocompleteWrapper ref={suggestionsRef}>
                <InputWrapper>
                  <Input
                    type="text"
                    name="patient"
                    placeholder="Buscar paciente por nombre, ID o DNI..."
                    value={patientSearch}
                    onChange={handlePatientSearchChange}
                    onFocus={() => patientSearch.length > 0 && setShowSuggestions(true)}
                    required
                    autoComplete="off"
                  />
                  <IconButton type="button" onClick={() => navigate('/registro-paciente')}>
                    <UserPlus />
                  </IconButton>
                </InputWrapper>
                {showSuggestions && filteredPatients.length > 0 && (
                  <SuggestionsList>
                    {filteredPatients.map(patient => (
                      <SuggestionItem key={patient.uuid} onClick={() => handleSelectPatient(patient)}>
                        <SuggestionAvatar>
                          {patient.foto_url ? (
                            <img src={patient.foto_url} alt={`${patient.nombre} ${patient.apellidos}`} />
                          ) : (
                            <User />
                          )}
                        </SuggestionAvatar>
                        <SuggestionInfo>
                          <SuggestionName>{patient.nombre} {patient.apellidos}</SuggestionName>
                          <SuggestionDetail>{patient.numero_expediente || 'Sin expediente'} • {patient.tipo === 'pediatrico' ? 'Pediátrico' : 'Adulto'}</SuggestionDetail>
                        </SuggestionInfo>
                      </SuggestionItem>
                    ))}
                  </SuggestionsList>
                )}
                {showSuggestions && patientSearch.length > 0 && filteredPatients.length === 0 && (
                  <SuggestionsList>
                    <SuggestionItem style={{ justifyContent: 'center', color: '#999' }}>
                      No se encontraron pacientes
                    </SuggestionItem>
                  </SuggestionsList>
                )}
              </AutocompleteWrapper>
            </FormField>
          </FormSection>

          <FormSection>
            <SectionTitle>Doctor y Servicio</SectionTitle>
            <FormField>
              <Label>Seleccionar Doctor</Label>
              <DropdownWrapper ref={doctorDropdownRef}>
                <DropdownTrigger 
                  $isOpen={showDoctorDropdown}
                  onClick={() => setShowDoctorDropdown(!showDoctorDropdown)}
                >
                  {selectedDoctor ? (
                    <>
                      <DropdownItemAvatar>
                        {selectedDoctor.avatar_blob || selectedDoctor.avatar_url ? (
                          <img src={selectedDoctor.avatar_blob || selectedDoctor.avatar_url} alt={selectedDoctor.nombre} />
                        ) : (
                          <User />
                        )}
                      </DropdownItemAvatar>
                      <DropdownItemInfo>
                        <DropdownItemName>{selectedDoctor.nombre} {selectedDoctor.apellidos}</DropdownItemName>
                        <DropdownItemDetail>{selectedDoctor.especialidad || 'Médico General'}</DropdownItemDetail>
                      </DropdownItemInfo>
                    </>
                  ) : (
                    <DropdownPlaceholder $hasValue={false}>Seleccionar Doctor</DropdownPlaceholder>
                  )}
                  <DropdownArrow $isOpen={showDoctorDropdown}>
                    <ChevronDown />
                  </DropdownArrow>
                </DropdownTrigger>
                {showDoctorDropdown && (
                  <DropdownList>
                    {doctors.map(doctor => (
                      <DropdownItem 
                        key={doctor.uuid} 
                        $selected={selectedDoctor?.uuid === doctor.uuid}
                        onClick={() => handleSelectDoctor(doctor)}
                      >
                        <DropdownItemAvatar>
                          {doctor.avatar_blob || doctor.avatar_url ? (
                            <img src={doctor.avatar_blob || doctor.avatar_url} alt={doctor.nombre} />
                          ) : (
                            <User />
                          )}
                        </DropdownItemAvatar>
                        <DropdownItemInfo>
                          <DropdownItemName>{doctor.nombre} {doctor.apellidos}</DropdownItemName>
                          <DropdownItemDetail>{doctor.especialidad || 'Médico General'}</DropdownItemDetail>
                        </DropdownItemInfo>
                      </DropdownItem>
                    ))}
                  </DropdownList>
                )}
              </DropdownWrapper>
            </FormField>
            <FormField>
              <ServicesHeader>
                <Label style={{ marginBottom: 0 }}>
                  Servicios {formData.services.length > 0 && `(${formData.services.length} seleccionados)`}
                </Label>
                {formData.doctorUuid && availableServices.length > 5 && (
                  <SearchToggleBtn 
                    type="button"
                    $active={showServiceSearch}
                    onClick={() => {
                      setShowServiceSearch(!showServiceSearch);
                      if (showServiceSearch) setServiceSearch('');
                    }}
                    title="Buscar servicio"
                  >
                    <Search />
                  </SearchToggleBtn>
                )}
              </ServicesHeader>
              {!formData.doctorUuid ? (
                <Select disabled>
                  <option value="">Primero seleccione un doctor</option>
                </Select>
              ) : (
                <>
                  <ServiceSearchContainer $visible={showServiceSearch}>
                    <ServiceSearchInput
                      type="text"
                      placeholder="Buscar servicio..."
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      autoFocus
                    />
                    {serviceSearch && (
                      <ClearSearchBtn type="button" onClick={() => setServiceSearch('')}>
                        <X />
                      </ClearSearchBtn>
                    )}
                  </ServiceSearchContainer>
                  <ServicesGrid>
                    {filteredServices.length > 0 ? (
                      filteredServices.map(service => {
                        const isSelected = formData.services.includes(service.id);
                        return (
                          <ServiceCard 
                            key={service.id} 
                            $selected={isSelected}
                            onClick={() => handleServiceToggle(service.id)}
                          >
                            <ServiceCheckbox $checked={isSelected}>
                              {isSelected && <Check />}
                            </ServiceCheckbox>
                            <ServiceInfo>
                              <ServiceName>{service.name}</ServiceName>
                              <ServiceDetails>
                                <span>{service.duration} min</span>
                                <ServicePrice>${service.price}</ServicePrice>
                              </ServiceDetails>
                            </ServiceInfo>
                          </ServiceCard>
                        );
                      })
                    ) : (
                      <NoServicesFound>
                        No se encontraron servicios con "{serviceSearch}"
                      </NoServicesFound>
                    )}
                  </ServicesGrid>
                  {formData.services.length > 0 && (
                    <SelectedServicesInfo>
                      <div>
                        <TotalLabel>Duración total: </TotalLabel>
                        <TotalValue>{totalDuration} min</TotalValue>
                      </div>
                      <div>
                        <TotalLabel>Total: </TotalLabel>
                        <TotalValue>${totalPrice}</TotalValue>
                      </div>
                    </SelectedServicesInfo>
                  )}
                </>
              )}
            </FormField>
            <FormField>
              <Label>Duración (minutos)</Label>
              <Input
                type="number"
                name="duration"
                placeholder="Se asigna automáticamente"
                value={formData.duration}
                onChange={handleChange}
                min="15"
                step="15"
                required
                readOnly
              />
            </FormField>
          </FormSection>

          <FormSection>
            <SectionTitle>Fecha y Hora</SectionTitle>
            <FormField>
              <Label>Fecha {formData.date && `- ${new Date(formData.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`}</Label>
              {!formData.doctor ? (
                <CalendarContainer style={{ opacity: 0.5, pointerEvents: 'none' }}>
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    Primero seleccione un doctor
                  </div>
                </CalendarContainer>
              ) : (
                <CalendarContainer>
                  <CalendarHeader>
                    <NavButton onClick={handlePrevMonth}>
                      <ChevronLeft />
                    </NavButton>
                    <MonthYear>{monthNames[currentMonth]} {currentYear}</MonthYear>
                    <NavButton onClick={handleNextMonth}>
                      <ChevronRight />
                    </NavButton>
                  </CalendarHeader>
                  <WeekDays>
                    {weekDays.map(day => (
                      <WeekDay key={day}>{day}</WeekDay>
                    ))}
                  </WeekDays>
                  <DaysGrid>
                    {calendarDays.map((dayInfo, index) => {
                      const unavailable = !dayInfo.isOtherMonth && !isPastDate(dayInfo) && isDayUnavailable(dayInfo);
                      return (
                        <DayCell
                          key={index}
                          type="button"
                          $isToday={isToday(dayInfo)}
                          $isSelected={isDateSelected(dayInfo)}
                          $isOtherMonth={dayInfo.isOtherMonth}
                          $isPast={isPastDate(dayInfo) && !dayInfo.isOtherMonth}
                          $isUnavailable={unavailable}
                          onClick={() => !unavailable && handleDateSelect(dayInfo)}
                          disabled={dayInfo.isOtherMonth || isPastDate(dayInfo) || unavailable}
                          title={unavailable ? 'El doctor no trabaja este día' : ''}
                        >
                          {dayInfo.day}
                        </DayCell>
                      );
                    })}
                  </DaysGrid>
                  {formData.doctorUuid && (
                    <CalendarLegend>
                      <LegendItem>
                        <LegendDot $color="#4F46E5" />
                        Seleccionado
                      </LegendItem>
                      <LegendItem>
                        <LegendDot $color="#FFEBEE" $border="1px dashed #EF9A9A" $textColor="#C62828" $strikethrough>
                          X
                        </LegendDot>
                        No disponible
                      </LegendItem>
                      <LegendItem>
                        <LegendDot $color="transparent" $border="1px solid #D0D0D0" />
                        Pasado
                      </LegendItem>
                    </CalendarLegend>
                  )}
                </CalendarContainer>
              )}
            </FormField>
            <FormField>
              <Label>Hora</Label>
              {loadingSlots ? (
                <div style={{ textAlign: 'center', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Loader style={{ animation: 'spin 1s linear infinite', width: 24, height: 24, color: '#6366F1' }} />
                </div>
              ) : dayNotAvailable ? (
                <TimeSlotInfo style={{ color: '#dc3545' }}>
                  <AlertCircle />
                  El doctor no tiene horario de trabajo configurado para este día. Seleccione otra fecha.
                </TimeSlotInfo>
              ) : !formData.doctor ? (
                <TimeSlotInfo>
                  <AlertCircle />
                  Primero seleccione un doctor
                </TimeSlotInfo>
              ) : !formData.date ? (
                <TimeSlotInfo>
                  <AlertCircle />
                  Primero seleccione una fecha
                </TimeSlotInfo>
              ) : timeSlots.length === 0 ? (
                <TimeSlotInfo style={{ color: '#dc3545' }}>
                  <AlertCircle />
                  No hay horarios disponibles para este día
                </TimeSlotInfo>
              ) : (
                <>
                  <TimeSlotsGrid>
                    {timeSlots.map(slot => (
                      <TimeSlotButton
                        key={slot.time}
                        type="button"
                        $isSelected={formData.time === slot.time}
                        $isOccupied={!slot.available}
                        onClick={() => {
                          if (slot.available) {
                            setFormData(prev => ({ ...prev, time: slot.time }));
                          }
                        }}
                        disabled={!slot.available}
                      >
                        {slot.time}
                      </TimeSlotButton>
                    ))}
                  </TimeSlotsGrid>
                  <TimeSlotInfo>
                    <AlertCircle />
                    Las horas tachadas no están disponibles
                  </TimeSlotInfo>
                </>
              )}
            </FormField>
          </FormSection>

          {/* Consultorio Interno */}
          {consultoriosInternos.length > 0 && (
            <FormSection>
              <SectionTitle>Consultorio</SectionTitle>
              <FormField>
                <Label>Seleccionar consultorio *</Label>
                <DropdownWrapper ref={consultorioDropdownRef}>
                  <DropdownTrigger 
                    $isOpen={showConsultorioDropdown}
                    onClick={() => setShowConsultorioDropdown(!showConsultorioDropdown)}
                  >
                    {selectedConsultorio ? (
                      <>
                        <DropdownItemAvatar>
                          <DoorOpen />
                        </DropdownItemAvatar>
                        <DropdownItemInfo>
                          <DropdownItemName>{selectedConsultorio.nombre}</DropdownItemName>
                          <DropdownItemDetail>{selectedConsultorio.ubicacion || 'Sin ubicación'}</DropdownItemDetail>
                        </DropdownItemInfo>
                      </>
                    ) : (
                      <DropdownPlaceholder $hasValue={false}>Seleccionar consultorio</DropdownPlaceholder>
                    )}
                    <DropdownArrow $isOpen={showConsultorioDropdown}>
                      <ChevronDown />
                    </DropdownArrow>
                  </DropdownTrigger>
                  {showConsultorioDropdown && (
                    <DropdownList>
                      {consultoriosInternos.map(consultorio => (
                        <DropdownItem 
                          key={consultorio.uuid} 
                          $selected={selectedConsultorio?.uuid === consultorio.uuid}
                          onClick={() => handleSelectConsultorio(consultorio)}
                        >
                          <DropdownItemAvatar>
                            <DoorOpen />
                          </DropdownItemAvatar>
                          <DropdownItemInfo>
                            <DropdownItemName>{consultorio.nombre}</DropdownItemName>
                            <DropdownItemDetail>{consultorio.ubicacion || 'Sin ubicación'}</DropdownItemDetail>
                          </DropdownItemInfo>
                        </DropdownItem>
                      ))}
                    </DropdownList>
                  )}
                </DropdownWrapper>
              </FormField>
            </FormSection>
          )}

          <FormSection>
            <SectionTitle>Notas Adicionales</SectionTitle>
            <FormField>
              <Label>Notas</Label>
              <TextArea
                name="notes"
                placeholder="Añadir detalles importantes para la cita..."
                value={formData.notes}
              onChange={handleChange}
            />
          </FormField>
          </FormSection>

          <SubmitButton type="submit" disabled={saving || consultoriosInternos.length === 0}>
            {saving ? 'Guardando...' : 'Confirmar Cita'}
          </SubmitButton>
        </Form>
      </Content>
    </PageContainer>
  );
};

export default ReservarCita;