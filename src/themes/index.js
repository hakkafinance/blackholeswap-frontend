import React from 'react'
import {
  ThemeProvider as StyledComponentsThemeProvider,
  css,
} from 'styled-components'

export { GlobalStyle } from './GlobalStyle'

const breakpoints = {
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920,
}

const mediaQuery = Object.keys(breakpoints).reduce((accumulator, label) => {
  accumulator[label] = (...args) => css`
    @media (min-width: ${breakpoints[label]}px) {
      ${css(...args)}
    }
  `
  return accumulator
}, {})

const black = '#000000'
const white = '#FFFFFF'

const theme = {
  mediaQuery,
  colors: {
    black,
    white,
    backgroundColor: black,
    textColor: white,
    gray300: '#999999',
    gray500: '#333639',
    gray700: '#202124',
    gray900: '#191A1C',
    blue300: '#7FAAFF',
    blue500: '#1A1AFF',
    blue700: '#0000B3',
    orange: '#FF6F00',
  },
}

export default function ThemeProvider({ children }) {
  return (
    <StyledComponentsThemeProvider theme={theme}>
      {children}
    </StyledComponentsThemeProvider>
  )
}
