import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import RestablecerPassword from './RestablecerPassword';
import { authService } from '../services/api';
import { lightTheme } from '../styles/theme';

jest.mock('../services/api', () => ({
  authService: {
    confirmarResetPassword: jest.fn()
  }
}));

const LoginStub = () => <div>PANTALLA_LOGIN</div>;
const OlvidePasswordStub = () => <div>PANTALLA_OLVIDE_PASSWORD</div>;

const renderPage = (path = '/restablecer-password?token=token-de-prueba') =>
  render(
    <ThemeProvider theme={lightTheme}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/restablecer-password" element={<RestablecerPassword />} />
          <Route path="/login" element={<LoginStub />} />
          <Route path="/olvide-password" element={<OlvidePasswordStub />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

describe('RestablecerPassword', () => {
  afterEach(() => jest.clearAllMocks());

  it('sin token en la URL muestra "enlace inválido" y no el formulario', () => {
    renderPage('/restablecer-password');

    expect(screen.getByText(/enlace inválido/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/mínimo 8 caracteres/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/solicitar un enlace nuevo/i));
    expect(screen.getByText('PANTALLA_OLVIDE_PASSWORD')).toBeInTheDocument();
  });

  it('muestra error si las contraseñas no coinciden', async () => {
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/mínimo 8 caracteres/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText(/repite la contraseña/i), { target: { value: 'otraCosa123' } });
    fireEvent.click(screen.getByRole('button', { name: /restablecer contraseña/i }));

    expect(await screen.findByText(/no coinciden/i)).toBeInTheDocument();
    expect(authService.confirmarResetPassword).not.toHaveBeenCalled();
  });

  it('muestra error si la contraseña es muy corta', async () => {
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/mínimo 8 caracteres/i), { target: { value: '123' } });
    fireEvent.change(screen.getByPlaceholderText(/repite la contraseña/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /restablecer contraseña/i }));

    expect(await screen.findByText(/al menos 8 caracteres/i)).toBeInTheDocument();
    expect(authService.confirmarResetPassword).not.toHaveBeenCalled();
  });

  it('envía el token de la URL junto con la nueva contraseña y muestra éxito', async () => {
    authService.confirmarResetPassword.mockResolvedValue({ success: true, message: 'ok' });

    renderPage('/restablecer-password?token=abc123');

    fireEvent.change(screen.getByPlaceholderText(/mínimo 8 caracteres/i), { target: { value: 'nuevaPass123' } });
    fireEvent.change(screen.getByPlaceholderText(/repite la contraseña/i), { target: { value: 'nuevaPass123' } });
    fireEvent.click(screen.getByRole('button', { name: /restablecer contraseña/i }));

    await waitFor(() => {
      expect(authService.confirmarResetPassword).toHaveBeenCalledWith('abc123', 'nuevaPass123');
    });

    expect(await screen.findByText(/se actualizó correctamente/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /ir a iniciar sesión/i }));
    expect(await screen.findByText('PANTALLA_LOGIN')).toBeInTheDocument();
  });

  it('muestra el mensaje de error del backend cuando el token es inválido o expiró', async () => {
    authService.confirmarResetPassword.mockResolvedValue({ success: false, message: 'El enlace expiró. Solicita uno nuevo.' });

    renderPage('/restablecer-password?token=expirado');

    fireEvent.change(screen.getByPlaceholderText(/mínimo 8 caracteres/i), { target: { value: 'nuevaPass123' } });
    fireEvent.change(screen.getByPlaceholderText(/repite la contraseña/i), { target: { value: 'nuevaPass123' } });
    fireEvent.click(screen.getByRole('button', { name: /restablecer contraseña/i }));

    expect(await screen.findByText('El enlace expiró. Solicita uno nuevo.')).toBeInTheDocument();
  });
});
