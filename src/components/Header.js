import React from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { ReactComponent as Logo } from '../assets/logo.svg'
import Web3Status from './Web3Status'

const HeaderWrapper = styled.header`
  width: 100%;
  height: 88px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const LogoWrapper = styled.a`
  display: inline-flex;
  align-items: center;
  text-decoration: none;

  > *:not(:first-child) {
    margin-left: 32px;
  }
`

const StyledLogo = styled(Logo)`
  width: 60px;
  height: 60px;
`

const LogoText = styled.div`
  color: ${({ theme }) => theme.colors.white};
  font-size: 24px;
  letter-spacing: 11px;
  text-transform: uppercase;
  display: none;

  ${({ theme }) => theme.mediaQuery.md`
    display: block;
  `}
`

const Button = styled.button`
  min-width: 120px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.colors.white};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.white};
  font-size: 14px;
  font-weight: 400;
  text-decoration: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  ${({ theme }) => theme.mediaQuery.md`
    min-width: 160px;
    font-size: 20px;
  `}
`

export default function Header() {
  return (
    <HeaderWrapper>
      <Button as={Link} to='/docs'>
        Doc
      </Button>
      <LogoWrapper href='/'>
        <StyledLogo />
        <LogoText>black hole swap</LogoText>
      </LogoWrapper>
      <Web3Status />
    </HeaderWrapper>
  )
}
