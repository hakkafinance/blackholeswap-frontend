import React, { useState, useCallback } from 'react'
import styled from 'styled-components'
import { ethers } from 'ethers'
import { useTokenDetails } from '../contexts/Tokens'
import { useAddressBalance } from '../contexts/Balances'
import { useTransactionAdder } from '../contexts/Transactions'
import { useWeb3React, useTokenContract } from '../hooks/ethereum'
import UnlockButton from '../components/UnlockButton'
import CoinSelector from '../components/CoinSelector'
import { EXCHANGE_ADDRESSES, GAS_MARGIN } from '../constants'
import { amountFormatter, calculateGasMargin } from '../utils'

const Row = styled.div`
  display: flex;
`

const SpaceBetweenRow = styled(Row)`
  justify-content: space-between;
  align-items: center;
`

const Label = styled.div`
  color: ${({ theme }) => theme.colors.white};
  font-size: 16px;
  font-weight: 500;
`

const NumberInput = styled.input.attrs({ type: 'number' })`
  width: 100%;
  margin-top: 20px;
  margin-bottom: 12px;
  padding: 8px;
  border: 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray300};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.white};
  font-size: 32px;
  font-weight: 500;
  display: block;
  transition: all ease-in-out 0.3s;

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray500};
  }

  &:focus {
    outline: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.white};
  }
`

const TextButton = styled.button.attrs({ type: 'button' })`
  border: 0;
  background-color: transparent;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.gray300};
  cursor: pointer;

  &:focus {
    outline: none;
  }
`

const ColorGray = styled.div`
  color: ${({ theme }) => theme.colors.gray300};
`

export default function CoinInputPanel(props) {
  const {
    title,
    coinOptions,
    selectedCoin,
    value,
    showUnlock = false,
    showMax = true,
    showBalance = true,
    onCoinChange = () => {},
    onValueChange = () => {},
    renderCoinButtons,
    renderInputMessage,
  } = props

  const { account, chainId } = useWeb3React()

  const addTransaction = useTransactionAdder()

  const token = useTokenContract(selectedCoin)
  const { decimals } = useTokenDetails(selectedCoin)
  const balance = useAddressBalance(account, selectedCoin)
  const balanceFormatted = balance ? amountFormatter(balance, decimals, 6) : '-'

  const [isApproving, setIsApproving] = useState(false)
  const approve = useCallback(async () => {
    if (account && (chainId || chainId === 0) && token) {
      let estimatedGas,
        useUserBalance = false
      try {
        estimatedGas = await token.estimateGas.approve(
          EXCHANGE_ADDRESSES[chainId],
          ethers.constants.MaxUint256,
        )
      } catch {
        estimatedGas = await token.estimateGas.approve(
          EXCHANGE_ADDRESSES[chainId],
          balance,
        )
        useUserBalance = true
      }

      try {
        const tx = await token.approve(
          EXCHANGE_ADDRESSES[chainId],
          useUserBalance ? balance : ethers.constants.MaxUint256,
          {
            gasLimit: calculateGasMargin(estimatedGas, GAS_MARGIN),
          },
        )
        setIsApproving(true)
        addTransaction(tx)
        await tx.wait()
      } finally {
        setIsApproving(false)
      }
    }
  }, [account, addTransaction, balance, chainId, token])

  const _renderCoinButtons = () => {
    if (typeof renderCoinButtons === 'function') {
      return <Row>{renderCoinButtons()}</Row>
    }

    return (
      <Row>
        {showUnlock && account && (
          <UnlockButton disabled={isApproving} onClick={approve}>
            {isApproving ? 'Pending...' : 'Unlock'}
          </UnlockButton>
        )}
        <CoinSelector
          items={coinOptions}
          value={selectedCoin}
          onChange={onCoinChange}
        />
      </Row>
    )
  }

  const _renderInputMessage = () => {
    if (typeof renderInputMessage === 'function') {
      return <ColorGray>{renderInputMessage()}</ColorGray>
    }

    return (
      <SpaceBetweenRow>
        {showBalance && (
          <ColorGray>Balance: {balanceFormatted}</ColorGray>
        )}
        {showMax && (
          <TextButton
            onClick={() => {
              if (balance) {
                onValueChange(amountFormatter(balance, decimals, decimals))
              }
            }}
          >
            MAX
          </TextButton>
        )}
      </SpaceBetweenRow>
    )
  }

  return (
    <div>
      <SpaceBetweenRow>
        <Label>{title}</Label>
        {_renderCoinButtons()}
      </SpaceBetweenRow>
      <NumberInput
        placeholder='0.0'
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      />
      {_renderInputMessage()}
    </div>
  )
}
