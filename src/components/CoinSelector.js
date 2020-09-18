import React from 'react'
import styled from 'styled-components'

const CoinGroup = styled.div`
  display: flex;
`

const CoinButton = styled.button.attrs({ type: 'button' })`
  width: 64px;
  height: 32px;
  padding: 0;
  border: 1px solid;
  border-top-color: ${({ theme, active }) =>
    active ? theme.colors.blue700 : theme.colors.gray300};
  border-left-color: ${({ theme, active }) =>
    active ? theme.colors.blue700 : theme.colors.gray300};
  border-right-color: ${({ theme, active }) =>
    active ? theme.colors.blue300 : theme.colors.gray700};
  border-bottom-color: ${({ theme, active }) =>
    active ? theme.colors.blue300 : theme.colors.gray700};
  background-color: ${({ theme, active }) =>
    active ? theme.colors.blue500 : theme.colors.gray500};
  color: ${({ theme }) => theme.colors.white};
  font-size: 15px;
  font-weight: 700;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  &:focus {
    outline: none;
  }
`

export default function CoinSelector(props) {
  const {
    items = [], // item = { text, value }
    value,
    onChange = () => {},
  } = props

  return (
    <CoinGroup>
      {items.map((item) => (
        <CoinButton
          key={item.value}
          active={value === item.value}
          onClick={() => onChange(item.value)}
        >
          {item.text}
        </CoinButton>
      ))}
    </CoinGroup>
  )
}
