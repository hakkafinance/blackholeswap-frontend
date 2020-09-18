import React from 'react'
import styled from 'styled-components'
import { ReactComponent as CheckedIcon } from '../assets/checked.svg'

const Label = styled.label`
  display: block;
`

const VisibleInput = styled.div`
  display: flex;
  align-items: flex-start;
`

const LabelContent = styled.div`
  flex: 1;
  margin-left: 8px;
  color: ${({ theme }) => theme.colors.white};
  font-size: 16px;
  font-weight: 500;
`

const CustomBox = styled.div`
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
  border: 1px solid ${({ theme }) => theme.colors.gray300};
  background: ${({ theme, checked }) =>
    checked ? theme.colors.white : theme.colors.gray500};
  display: flex;
  justify-content: center;
  align-items: center;
`

const InvisibleInput = styled.input`
  display: none;
`

export default function RadioButton(props) {
  const {
    id = '',
    name = '',
    label = '',
    checked = false,
    onChange = () => {},
  } = props

  return (
    <Label>
      <VisibleInput>
        <CustomBox checked={checked}>{checked && <CheckedIcon />}</CustomBox>
        <LabelContent>{label}</LabelContent>
      </VisibleInput>
      <InvisibleInput
        type='checkbox'
        id={id}
        name={name}
        checked={checked}
        onChange={onChange}
      />
    </Label>
  )
}
