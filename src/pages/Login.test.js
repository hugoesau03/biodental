import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import Login from './Login';
import { useAuth } from '../context/AuthContext';
import { lightTheme } from '../styles/theme';

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Marcas visibles en las rutas destino, para comprobar que la navegación
// ocurrió de verdad en lugar de solo inferirlo de la ausencia de error.
const Home = () => <div>PANTALLA_INICIO</div>;
const OlvidePasswordStub = () => <div>PANTALLA_OLVIDE_PASSWORD</div>;

const renderLogin = () =>
  render(
    <ThemeProvider theme={lightTheme}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="/olvide-password" element={<OlvidePasswordStub />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

describe('Login', () => {
  beforeEach(() => {
    localStorage.removeItem('biodental_remembered_email');
    useAuth.mockReturnValue({
      login: jest.fn(),
      isAuthenticated: false,
      error: null,
      clearError: jest.fn()
    });
  });

  afterEach(() => {
    localStorage.removeItem('biodental_remembered_email');
  });

  it('muestra un error si se envía el formulario sin completar los campos', async () => {
    renderLogin();

    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(await screen.findByText(/completa todos los campos/i)).toBeInTheDocument();
    expect(useAuth().login).not.toHaveBeenCalled();
  });

  it('llama a login con el correo, contraseña y "recordarme", y navega al inicio si tiene éxito', async () => {
    const loginMock = jest.fn().mockResolvedValue({ success: true });
    useAuth.mockReturnValue({
      login: loginMock,
      isAuthenticated: false,
      error: null,
      clearError: jest.fn()
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/ingresa tu correo/i), {
      target: { value: 'ana@biodental.com' }
    });
    fireEvent.change(screen.getByPlaceholderText(/ingresa tu contraseña/i), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByLabelText(/recordarme/i));
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('ana@biodental.com', 'password123', true);
    });

    expect(await screen.findByText('PANTALLA_INICIO')).toBeInTheDocument();
  });

  it('muestra el mensaje de error cuando login() falla', async () => {
    const loginMock = jest.fn().mockResolvedValue({ success: false, message: 'Credenciales inválidas' });
    useAuth.mockReturnValue({
      login: loginMock,
      isAuthenticated: false,
      error: null,
      clearError: jest.fn()
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/ingresa tu correo/i), {
      target: { value: 'ana@biodental.com' }
    });
    fireEvent.change(screen.getByPlaceholderText(/ingresa tu contraseña/i), {
      target: { value: 'incorrecta' }
    });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument();
    // No debió navegar a la pantalla de inicio
    expect(screen.queryByText('PANTALLA_INICIO')).not.toBeInTheDocument();
  });

  it('guarda el correo en localStorage al iniciar sesión con "recordarme" marcado', async () => {
    const loginMock = jest.fn().mockResolvedValue({ success: true });
    useAuth.mockReturnValue({
      login: loginMock,
      isAuthenticated: false,
      error: null,
      clearError: jest.fn()
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/ingresa tu correo/i), {
      target: { value: 'ana@biodental.com' }
    });
    fireEvent.change(screen.getByPlaceholderText(/ingresa tu contraseña/i), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByLabelText(/recordarme/i));
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(localStorage.getItem('biodental_remembered_email')).toBe('ana@biodental.com');
    });
  });

  it('no guarda (y borra) el correo recordado si se inicia sesión sin marcar "recordarme"', async () => {
    // Ya había un correo recordado de una sesión anterior — el checkbox
    // arranca marcado por eso; esta vez el usuario decide desmarcarlo.
    localStorage.setItem('biodental_remembered_email', 'viejo@biodental.com');
    const loginMock = jest.fn().mockResolvedValue({ success: true });
    useAuth.mockReturnValue({
      login: loginMock,
      isAuthenticated: false,
      error: null,
      clearError: jest.fn()
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/ingresa tu correo/i), {
      target: { value: 'ana@biodental.com' }
    });
    fireEvent.change(screen.getByPlaceholderText(/ingresa tu contraseña/i), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByLabelText(/recordarme/i)); // lo desmarca
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(localStorage.getItem('biodental_remembered_email')).toBeNull();
    });
  });

  it('precarga el correo y marca "recordarme" si ya había uno guardado', () => {
    localStorage.setItem('biodental_remembered_email', 'recordado@biodental.com');

    renderLogin();

    expect(screen.getByPlaceholderText(/ingresa tu correo/i)).toHaveValue('recordado@biodental.com');
    expect(screen.getByLabelText(/recordarme/i)).toBeChecked();
  });

  it('incluye un enlace a "¿Olvidaste tu contraseña?" que apunta a /olvide-password', async () => {
    renderLogin();

    const link = screen.getByText(/olvidaste tu contraseña/i);
    expect(link).toBeInTheDocument();

    fireEvent.click(link);

    expect(await screen.findByText('PANTALLA_OLVIDE_PASSWORD')).toBeInTheDocument();
  });
});
