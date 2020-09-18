import React from 'react'
import ReactDOM from 'react-dom'
import styled from 'styled-components'
import { ReactComponent as CloseIcon } from '../assets/close.svg'
import { transparentize } from 'polished'

const BackDrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 30;
  width: 100vw;
  height: 100vh;
  background-color: ${({ theme }) => transparentize(0.5, theme.colors.black)};
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  justify-content: center;
  align-items: center;
`

const Paper = styled.div`
  width: 90%;
  max-width: 440px;
  border-top: 4px solid ${({ theme }) => theme.colors.white};
  background-color: ${({ theme }) => theme.colors.gray700};
  box-shadow: 0 0 60px 0 ${({ theme }) => theme.colors.black};
`

const CloseButtonWrapper = styled.div`
  padding: 12px;
  display: flex;
  justify-content: flex-end;
`

const CloseButton = styled.button.attrs(() => ({ type: 'button' }))`
  padding: 0;
  border: 0;
  border-radius: 0.25rem;
  background-color: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
`

export default function Dialog(props) {
  const { isOpen, onDismiss, children } = props

  return ReactDOM.createPortal(
    <BackDrop isOpen={isOpen}>
      <Paper>
        <CloseButtonWrapper>
          <CloseButton onClick={onDismiss}>
            <CloseIcon />
          </CloseButton>
        </CloseButtonWrapper>
        <div>
          {children}
        </div>
      </Paper>
    </BackDrop>,
    document.body,
  )
}
