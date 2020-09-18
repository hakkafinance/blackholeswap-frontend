import React from 'react'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'
import { darken } from 'polished'

const Tabs = styled.div`
  margin-top: 12px;
  display: flex;
  align-items: center;
  height: 55px;
  background-color: ${({ theme }) => theme.colors.gray900};
`

const activeClassName = 'ACTIVE'

const StyledNavLink = styled(NavLink).attrs({
  activeClassName,
})`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 55px;
  flex: 1 0;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.gray300};
  font-size: 16px;
  font-weight: 700;

  &.${activeClassName} {
    background-color: ${({ theme }) => theme.colors.gray700};
    border-top: 4px solid ${({ theme }) => theme.colors.white};
    color: ${({ theme }) => theme.colors.white};
    :hover {
      background-color: ${({ theme }) => darken(0.01, theme.colors.black)};
    }
  }

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.colors.white)};
  }
`

export default function NavigationTabs() {
  return (
    <Tabs>
      <StyledNavLink to='/swap'>swap</StyledNavLink>
      <StyledNavLink to='/deposit'>deposit</StyledNavLink>
      <StyledNavLink to='/withdraw'>withdraw</StyledNavLink>
    </Tabs>
  )
}
