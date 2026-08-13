import styled from 'styled-components';

/**
 * Layout compartido para documentos legales del portal de pacientes
 * (Términos y Condiciones, Aviso de Privacidad). Páginas públicas, sin
 * chrome de la app — solo el documento y un botón de volver.
 */

export const PageContainer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  display: flex;
  justify-content: center;
  padding: 20px;
`;

export const Content = styled.div`
  width: 100%;
  max-width: 720px;
`;

export const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`;

export const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.white};
  cursor: pointer;
  flex-shrink: 0;

  svg { width: 20px; height: 20px; color: ${({ theme }) => theme.colors.text}; }
`;

export const Card = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);

  @media (max-width: 480px) {
    padding: 24px 20px;
  }
`;

export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;

  svg { width: 26px; height: 26px; color: ${({ theme }) => theme.colors.primary}; }
`;

export const Title = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

export const Actualizacion = styled.p`
  font-size: 12.5px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 28px;
`;

export const Seccion = styled.section`
  margin-bottom: 22px;

  &:last-child { margin-bottom: 0; }
`;

export const SeccionTitulo = styled.h2`
  font-size: 15px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 8px;
`;

export const Parrafo = styled.p`
  font-size: 13.5px;
  line-height: 1.65;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 10px;

  &:last-child { margin-bottom: 0; }
`;

export const Lista = styled.ul`
  margin: 0 0 10px;
  padding-left: 20px;
  font-size: 13.5px;
  line-height: 1.65;
  color: ${({ theme }) => theme.colors.textSecondary};

  li { margin-bottom: 6px; }
`;

export const Tabla = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 0 0 14px;
  font-size: 13px;

  th, td {
    text-align: left;
    padding: 8px 10px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    vertical-align: top;
  }

  th {
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    font-weight: 700;
  }

  td { color: ${({ theme }) => theme.colors.textSecondary}; line-height: 1.5; }
`;
