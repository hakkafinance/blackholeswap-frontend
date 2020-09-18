import styled from 'styled-components'

const UnlockButton = styled.button.attrs({ type: 'button' })`
  height: 32px;
  padding: 0 12px;
  border: 1px solid;
  border-top-color: ${({ theme }) => theme.colors.gray300};
  border-left-color: ${({ theme }) => theme.colors.gray300};
  border-right-color: ${({ theme }) => theme.colors.gray700};
  border-bottom-color: ${({ theme }) => theme.colors.gray700};
  background-color: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.black};
  font-size: 15px;
  font-weight: 700;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  &:focus {
    outline: none;
  }

  &[disabled] {
    background-color: ${({ theme }) => theme.colors.gray300};
    color: ${({ theme }) => theme.colors.white};
    cursor: not-allowed;
  }
`

export default UnlockButton
