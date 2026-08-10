import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { GlobalStyles } from './styles/GlobalStyles';
import styled from 'styled-components';
import { ThemeModeProvider, useThemeMode } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificacionesProvider } from './context/NotificacionesContext';
import { PortalAuthProvider } from './context/PortalAuthContext';
import { PortalProtectedRoute } from './components/Portal/PortalLayout';
import { Loader } from 'lucide-react';

// Layout Components
import BottomNavigation from './components/Layout/BottomNavigation';
import MainHeader from './components/Layout/MainHeader';

// Pages
import Login from './pages/Login';
import OlvidePassword from './pages/OlvidePassword';
import Inicio from './pages/Inicio';
import Agenda from './pages/Agenda';
import Medicos from './pages/Medicos';
import Pacientes from './pages/Pacientes';
import Reportes from './pages/Reportes';
import PerfilMedico from './pages/PerfilMedico';
import PerfilPaciente from './pages/PerfilPaciente';
import ReservarCita from './pages/ReservarCita';
import RegistroPaciente from './pages/RegistroPaciente';
import EditarPaciente from './pages/EditarPaciente';
import DetalleCita from './pages/DetalleCita';
import GestionServicios from './pages/GestionServicios';
import BloquearHorarios from './pages/BloquearHorarios';
import Perfil from './pages/Perfil';
import GestionarAgenda from './pages/GestionarAgenda';
import GestionPersonal from './pages/GestionPersonal';
import ReporteCitas from './pages/ReporteCitas';
import ReporteIngresos from './pages/ReporteIngresos';
import CorteCaja from './pages/CorteCaja';
import GestionFormularios from './pages/GestionFormularios';
import EditorFormulario from './pages/EditorFormulario';
import VistaFormulario from './pages/VistaFormulario';
import SeleccionarFormulario from './pages/SeleccionarFormulario';
import SeleccionarFormularioNuevo from './pages/SeleccionarFormularioNuevo';
import LlenarFormulario from './pages/LlenarFormulario';
import VerFormularioCompletado from './pages/VerFormularioCompletado';
import GenerarRecibo from './pages/GenerarRecibo';
import Recetas from './pages/Recetas';
import GenerarReceta from './pages/GenerarReceta';
import Presupuestos from './pages/Presupuestos';
import Integraciones from './pages/Integraciones';
import GenerarPresupuesto from './pages/GenerarPresupuesto';
import Inventario from './pages/Inventario';
import GestionConsultorios from './pages/GestionConsultorios';
import CrearConsultorio from './pages/CrearConsultorio';
import Promociones from './pages/Promociones';
import CanjesRecompensas from './pages/CanjesRecompensas';

// Portal de pacientes (app paciente)
import PortalLogin from './pages/portal/PortalLogin';
import PortalRegistro from './pages/portal/PortalRegistro';
import PortalInicio from './pages/portal/PortalInicio';
import PortalReservar from './pages/portal/PortalReservar';
import PortalHistorial from './pages/portal/PortalHistorial';
import PortalCuenta from './pages/portal/PortalCuenta';
import PortalRecompensas from './pages/portal/PortalRecompensas';
import PortalCanjear from './pages/portal/PortalCanjear';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 100vw;
  overflow-x: hidden;
`;

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        gap: '12px'
      }}>
        <Loader style={{ animation: 'spin 1s linear infinite', width: 40, height: 40, color: '#6366F1' }} />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Componente Layout que oculta header/navigation en login
const AppLayout = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login' || location.pathname === '/olvide-password';
  // El portal de pacientes tiene su propio header/nav (PortalProtectedRoute)
  // y su propia sesión — no debe mostrar el chrome de staff.
  const isPortalPage = location.pathname.startsWith('/portal');

  return (
    <AppContainer>
      {!isLoginPage && !isPortalPage && <MainHeader />}
      {children}
      {!isLoginPage && !isPortalPage && <BottomNavigation />}
    </AppContainer>
  );
};

// Componente interno que usa el contexto del tema
const AppContent = () => {
  const { theme } = useThemeMode();

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <Router>
        <AuthProvider>
          <PortalAuthProvider>
          <NotificacionesProvider>
            <AppLayout>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/olvide-password" element={<OlvidePassword />} />

                {/* Portal de pacientes (app paciente): sesión y layout propios */}
                <Route path="/portal/login" element={<PortalLogin />} />
                <Route path="/portal/registro" element={<PortalRegistro />} />
                <Route path="/portal" element={<PortalProtectedRoute><PortalInicio /></PortalProtectedRoute>} />
                <Route path="/portal/reservar" element={<PortalProtectedRoute><PortalReservar /></PortalProtectedRoute>} />
                <Route path="/portal/historial" element={<PortalProtectedRoute><PortalHistorial /></PortalProtectedRoute>} />
                <Route path="/portal/cuenta" element={<PortalProtectedRoute><PortalCuenta /></PortalProtectedRoute>} />
                <Route path="/portal/recompensas" element={<PortalProtectedRoute><PortalRecompensas /></PortalProtectedRoute>} />
                <Route path="/portal/canjear" element={<PortalProtectedRoute><PortalCanjear /></PortalProtectedRoute>} />
                <Route path="/" element={<ProtectedRoute><Inicio /></ProtectedRoute>} />
                <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
                <Route path="/medicos" element={<ProtectedRoute><Medicos /></ProtectedRoute>} />
                <Route path="/pacientes" element={<ProtectedRoute><Pacientes /></ProtectedRoute>} />
                <Route path="/reportes" element={<ProtectedRoute><Reportes /></ProtectedRoute>} />
                <Route path="/perfil-medico/:id" element={<ProtectedRoute><PerfilMedico /></ProtectedRoute>} />
                <Route path="/perfil-paciente/:id" element={<ProtectedRoute><PerfilPaciente /></ProtectedRoute>} />
                <Route path="/reservar-cita" element={<ProtectedRoute><ReservarCita /></ProtectedRoute>} />
                <Route path="/registro-paciente" element={<ProtectedRoute><RegistroPaciente /></ProtectedRoute>} />
                <Route path="/editar-paciente/:id" element={<ProtectedRoute><EditarPaciente /></ProtectedRoute>} />
                <Route path="/detalle-cita/:id" element={<ProtectedRoute><DetalleCita /></ProtectedRoute>} />
                <Route path="/gestion-servicios/:id" element={<ProtectedRoute><GestionServicios /></ProtectedRoute>} />
                <Route path="/bloquear-horarios/:id" element={<ProtectedRoute><BloquearHorarios /></ProtectedRoute>} />
                <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
                <Route path="/gestionar-agenda/:id" element={<ProtectedRoute><GestionarAgenda /></ProtectedRoute>} />
                <Route path="/gestion-personal" element={<ProtectedRoute><GestionPersonal /></ProtectedRoute>} />
                <Route path="/reporte-citas" element={<ProtectedRoute><ReporteCitas /></ProtectedRoute>} />
                <Route path="/reporte-ingresos" element={<ProtectedRoute><ReporteIngresos /></ProtectedRoute>} />
                <Route path="/corte-caja" element={<ProtectedRoute><CorteCaja /></ProtectedRoute>} />
                <Route path="/gestion-formularios" element={<ProtectedRoute><GestionFormularios /></ProtectedRoute>} />
                <Route path="/nuevo-formulario" element={<ProtectedRoute><EditorFormulario /></ProtectedRoute>} />
                <Route path="/editar-formulario/:id" element={<ProtectedRoute><EditorFormulario /></ProtectedRoute>} />
                <Route path="/vista-formulario/:id" element={<ProtectedRoute><VistaFormulario /></ProtectedRoute>} />
                <Route path="/seleccionar-formulario/:patientId" element={<ProtectedRoute><SeleccionarFormulario /></ProtectedRoute>} />
                <Route path="/seleccionar-formulario-nuevo" element={<ProtectedRoute><SeleccionarFormularioNuevo /></ProtectedRoute>} />
                <Route path="/llenar-formulario/:formId/:patientId" element={<ProtectedRoute><LlenarFormulario /></ProtectedRoute>} />
                <Route path="/ver-formulario/:formId/:patientId" element={<ProtectedRoute><VerFormularioCompletado /></ProtectedRoute>} />
                <Route path="/generar-recibo/:citaId" element={<ProtectedRoute><GenerarRecibo /></ProtectedRoute>} />
                <Route path="/recetas" element={<ProtectedRoute><Recetas /></ProtectedRoute>} />
                <Route path="/recetas/nueva" element={<ProtectedRoute><GenerarReceta /></ProtectedRoute>} />
                <Route path="/recetas/:uuid" element={<ProtectedRoute><GenerarReceta /></ProtectedRoute>} />
                <Route path="/presupuestos" element={<ProtectedRoute><Presupuestos /></ProtectedRoute>} />
                <Route path="/integraciones" element={<ProtectedRoute><Integraciones /></ProtectedRoute>} />
                <Route path="/presupuestos/nueva" element={<ProtectedRoute><GenerarPresupuesto /></ProtectedRoute>} />
                <Route path="/presupuestos/:uuid" element={<ProtectedRoute><GenerarPresupuesto /></ProtectedRoute>} />
                <Route path="/inventario" element={<ProtectedRoute><Inventario /></ProtectedRoute>} />
                <Route path="/gestion-consultorios" element={<ProtectedRoute><GestionConsultorios /></ProtectedRoute>} />
                <Route path="/crear-consultorio" element={<ProtectedRoute><CrearConsultorio /></ProtectedRoute>} />
                <Route path="/promociones" element={<ProtectedRoute><Promociones /></ProtectedRoute>} />
                <Route path="/canjes-recompensas" element={<ProtectedRoute><CanjesRecompensas /></ProtectedRoute>} />
              </Routes>
            </AppLayout>
          </NotificacionesProvider>
          </PortalAuthProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

function App() {
  return (
    <ThemeModeProvider>
      <AppContent />
    </ThemeModeProvider>
  );
}

export default App;
