import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import OlvidePassword from './OlvidePassword';
import { authService } from '../services/api';
import { lightTheme } from '../styles/theme';

jest.mock('../services/api', () => ({
  authService: {
    solicitarResetPassword: jest.fn()
  }
}));

const LoginStub = () => <div>PANTALLA_LOGIN</div>;

const renderPage = () =>
  render(
    <ThemeProvider theme={lightTheme}>
      <MemoryRouter initialEntries={['/olvide-password']}>
        <Routes>
          <Route path="/olvide-password" element={<OlvidePassword />} />
          <Route path="/login" element={<LoginStub />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

describe('OlvidePassword', () => {
  afterEach(() => jest.clearAllMocks());

  it('muestra un error si se envía sin correo', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /enviar enlace de recuperación/i }));

    expect(await screen.findByText(/ingresa tu correo/i)).toBeInTheDocument();
    expect(authService.solicitarResetPassword).not.toHaveBeenCalled();
  });

  it('llama a solicitarResetPassword con el correo y muestra el mensaje genérico de éxito', async () => {
    authService.solicitarResetPassword.mockResolvedValue({ success: true, message: 'ok' });

    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/ingresa tu correo/i), {
      target: { value: 'ana@biodental.com' }
    });
    fireEvent.click(screen.getByRole('button', { name: /enviar enlace de recuperación/i }));

    await waitFor(() => {
      expect(authService.solicitarResetPassword).toHaveBeenCalledWith('ana@biodental.com');
    });

    // El mismo mensaje de éxito se muestra exista o no la cuenta — el
    // componente no distingue, siguiendo lo que ya hace el backend.
    expect(await screen.findByText(/te enviamos un correo/i)).toBeInTheDocument();
  });

  it('muestra el mismo mensaje de éxito aunque la cuenta no exista (el backend responde genérico)', async () => {
    authService.solicitarResetPassword.mockResolvedValue({
      success: true,
      message: 'Si existe una cuenta activa con ese correo, te enviamos un enlace para restablecer tu contraseña.'
    });

    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/ingresa tu correo/i), {
      target: { value: 'fantasma@biodental.com' }
    });
    fireEvent.click(screen.getByRole('button', { name: /enviar enlace de recuperación/i }));

    expect(await screen.findByText(/te enviamos un correo/i)).toBeInTheDocument();
  });

  it('muestra un mensaje de error si la petición falla por completo (p. ej. red caída)', async () => {
    authService.solicitarResetPassword.mockRejectedValue({
      response: { data: { message: 'Error al conectar con el servidor' } }
    });

    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/ingresa tu correo/i), {
      target: { value: 'ana@biodental.com' }
    });
    fireEvent.click(screen.getByRole('button', { name: /enviar enlace de recuperación/i }));

    expect(await screen.findByText('Error al conectar con el servidor')).toBeInTheDocument();
  });

  it('el enlace de volver a iniciar sesión navega a /login', async () => {
    renderPage();

    fireEvent.click(screen.getByText(/volver a iniciar sesión/i));

    expect(await screen.findByText('PANTALLA_LOGIN')).toBeInTheDocument();
  });
});
