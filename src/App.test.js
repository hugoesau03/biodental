import { lightTheme, darkTheme } from './styles/theme';

// Smoke test: los temas se cargan y exponen la estructura esperada.
// Nota: los tests de componentes que importan react-router-dom v7 no corren
// bajo el Jest de react-scripts 5 (incompatibilidad de "exports" ESM del router),
// por eso aquí probamos módulos puros.
describe('theme', () => {
  test('lightTheme y darkTheme están definidos', () => {
    expect(lightTheme).toBeDefined();
    expect(darkTheme).toBeDefined();
  });

  test('ambos temas exponen una paleta de colores', () => {
    expect(lightTheme.colors).toBeDefined();
    expect(darkTheme.colors).toBeDefined();
  });
});
