import { createGlobalStyle } from 'styled-components'
import BackgroundImage from '../assets/background.png'

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    -webkit-overflow-scrolling: touch;
  }

  html {
    font-size: 16px;
    font-family: 'Montserrat', sans-serif;
    font-variant: none;
    color: ${({ theme }) => theme.colors.textColor};
    background-color: ${({ theme }) => theme.colors.backgroundColor};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  }

  #root {
    min-height: 100vh;
    background: url(${BackgroundImage});
    background-repeat: no-repeat;
    background-size: cover;
  }

  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type="number"] {
    -moz-appearance: textfield;
  }
`
