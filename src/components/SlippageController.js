import React, { useCallback, useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { useDebounce } from '../hooks/dom'
import Checkbox from '../components/Checkbox'

const SlippageWrapper = styled.div`
  margin-top: 32px;
`

const SlippageLabel = styled.div`
  margin-bottom: 20px;
  color: ${({ theme }) => theme.colors.white};
  font-size: 16px;
  font-weight: 500;
`

const SlippageOptions = styled.div`
  display: flex;
  align-items: center;

  > *:not(:first-child) {
    margin-left: 20px;
  }
`

const OptionCustom = styled.div`
  display: flex;
  color: ${({ theme }) => theme.colors.white};
`

const Input = styled.input.attrs({ type: 'number' })`
  width: 48px;
  height: 19px;
  border: 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.white};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.white};
  font-size: 16px;
  font-weight: 500;
  display: ${({ active }) => (active ? 'inline-block' : 'none')};

  &:focus {
    outline: none;
  }
`

export default function SlippageController(props) {
  const { onChange } = props

  const inputRef = useRef()
  const [userInput, setUserInput] = useState('')
  const debouncedInput = useDebounce(userInput, 150)

  const updateSlippage = useCallback(
    (newSlippage) => {
      // round to 2 decimals to prevent ethers error
      const numParsed = parseInt(newSlippage * 100)
      onChange(numParsed)
    },
    [onChange],
  )

  const [activeIndex, setActiveIndex] = useState(0)

  // used for slippage presets
  const setFromFixed = useCallback(
    (index, slippage) => {
      updateSlippage(slippage)
      setActiveIndex(index)
    },
    [updateSlippage],
  )

  const setFromCustom = () => {
    setActiveIndex(2)
    inputRef.current.focus()
    // if there's a value, evaluate the bounds
    updateSlippage(debouncedInput)
  }

  // check that the theyve entered number and correct decimal
  const parseInput = (e) => {
    let input = e.target.value

    // restrict to 2 decimal places
    let acceptableValues = [/^$/, /^\d{1,2}$/, /^\d{0,2}\.\d{0,2}$/]
    // if its within accepted decimal limit, update the input state
    if (acceptableValues.some((a) => a.test(input))) {
      setUserInput(input)
    }
  }

  useEffect(() => {
    if (activeIndex === 2) {
      updateSlippage(debouncedInput)
    }
  })

  return (
    <SlippageWrapper>
      <SlippageLabel>Limit additional price slippage</SlippageLabel>
      <SlippageOptions>
        <Checkbox
          label='0.1%'
          checked={activeIndex === 0}
          onChange={() => setFromFixed(0, 0.1)}
        />
        <Checkbox
          label='0.5%'
          checked={activeIndex === 1}
          onChange={() => setFromFixed(1, 0.5)}
        />
        <OptionCustom>
          <Checkbox
            label={activeIndex !== 2 ? 'Custom' : ''}
            checked={activeIndex === 2}
            onChange={() => setFromCustom()}
          />
          <Input
            tabIndex={-1}
            ref={inputRef}
            active={activeIndex === 2}
            value={userInput}
            onChange={parseInput}
          />
          {activeIndex === 2 && <span>%</span>}
        </OptionCustom>
      </SlippageOptions>
    </SlippageWrapper>
  )
}
