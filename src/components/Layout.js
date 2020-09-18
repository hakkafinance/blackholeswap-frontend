import React from 'react'
import styled from 'styled-components'
import Header from './Header'
import NavigationTabs from './NavigationTabs'
import WarningMessage from './WarningMessage'

const Body = styled.div`
  max-width: 500px;
  margin: 0 auto;
  padding-bottom: 100px;
`

const Layout = ({ children }) => (
  <>
    <Header />
    <Body>
      <WarningMessage />
      <NavigationTabs />
      {children}
    </Body>
  </>
)

export default Layout
