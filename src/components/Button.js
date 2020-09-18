import styled from 'styled-components'

const Button = styled.button.attrs({ type: 'button' })`
  width: 200px;
  height: 40px;
  padding: 0;
  border: 1px solid;
  border-top-color: ${({ theme }) => theme.colors.blue300};
  border-left-color: ${({ theme }) => theme.colors.blue300};
  border-right-color: ${({ theme }) => theme.colors.blue700};
  border-bottom-color: ${({ theme }) => theme.colors.blue700};
  background-color: ${({ theme }) => theme.colors.blue500};
  color: ${({ theme }) => theme.colors.white};
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  &:focus {
    outline: none;
  }

  &:active {
    border-top-color: ${({ theme }) => theme.colors.blue700};
    border-left-color: ${({ theme }) => theme.colors.blue700};
    border-right-color: ${({ theme }) => theme.colors.blue300};
    border-bottom-color: ${({ theme }) => theme.colors.blue300};
  }

  &[disabled] {
    border: 1px solid ${({ theme }) => theme.colors.gray500};
    background-color: ${({ theme }) => theme.colors.gray700};
    color: ${({ theme }) => theme.colors.gray500};
    cursor: not-allowed;
  }
`

export default Button
