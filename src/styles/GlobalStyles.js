import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    overflow-x: hidden;
    overscroll-behavior: none;
    height: 100%;
    height: -webkit-fill-available;
  }

  body {
    font-family: ${({ theme }) => theme.fonts.primary};
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
    overscroll-behavior: none;
    -webkit-overflow-scrolling: touch;
    min-height: 100vh;
    min-height: -webkit-fill-available;
    position: relative;
  }

  #root {
    min-height: 100vh;
    min-height: -webkit-fill-available;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  button {
    font-family: ${({ theme }) => theme.fonts.primary};
    cursor: pointer;
    border: none;
    outline: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    user-select: none;
  }

  input, textarea, select {
    font-family: ${({ theme }) => theme.fonts.primary};
    outline: none;
    -webkit-tap-highlight-color: transparent;
  }

  a {
    text-decoration: none;
    color: inherit;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  ul, ol {
    list-style: none;
  }

  /* Scrollbar styles */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.gray};
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.secondary};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.text};
  }
`;
