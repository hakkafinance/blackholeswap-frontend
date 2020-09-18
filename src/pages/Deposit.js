import React, { useCallback, useMemo, useState, useEffect } from 'react'
import styled from 'styled-components'
import { ethers } from 'ethers'
import { useWeb3React, useExchangeContract } from '../hooks/ethereum'
import { useTokenDetails } from '../contexts/Tokens'
import { useAddressAllowance } from '../contexts/Allowances'
import { useAddressBalance } from '../contexts/Balances'
import { useExchangeDetails } from '../contexts/Exchange'
import { useTransactionAdder } from '../contexts/Transactions'
import CoinInputPanel from '../components/CoinInputPanel'
import UnlockButton from '../components/UnlockButton'
import Button from '../components/Button'
import ReserveMatrics from '../components/ReserveMatrics'
import Dialog from '../components/Dialog'
import Checkbox from '../components/Checkbox'
import { amountFormatter, calculateGasMargin, getContract } from '../utils'
import { calculateSlippageBounds } from '../utils/calculation'
import {
  EXCHANGE_ADDRESSES,
  DAI_ADDRESSES,
  USDC_ADDRESSES,
  GAS_MARGIN,
} from '../constants'
import ERC20_ABI from '../constants/abis/erc20.json'
import { ReactComponent as ArrowDownIcon } from '../assets/arrow_down.svg'
import { ReactComponent as CautionIcon } from '../assets/caution.svg'
import DaiImage from '../assets/dai.png'
import UsdcImage from '../assets/usdc.png'

// denominated in bips
const ALLOWED_SLIPPAGE = ethers.BigNumber.from('200')

const Card = styled.div`
  padding: 36px 40px;
  background-color: ${({ theme }) => theme.colors.gray700};
`

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:not(:first-child) {
    margin-top: 20px;
  }
`

const CoinWrapper = styled.div`
  display: flex;
  align-items: center;

  > *:not(:first-child) {
    margin-left: 12px;
  }
`

const CoinIcon = styled.img`
  width: 32px;
  height: 32px;
`

const CoinText = styled.div`
  color: ${({ theme }) => theme.colors.white};
  font-size: 20px;
  font-weight: 600;
`

const Number = styled.div`
  color: ${({ theme }) => theme.colors.white};
  font-size: 32px;
  font-weight: 500;
`

const SummaryMessage = styled.div`
  margin-top: 50px;
  color: ${({ theme }) => theme.colors.white};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.5;
`

const ErrorMessage = styled.div`
  margin-top: 20px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.orange};
  text-align: center;
`

const StyledArrowDownIcon = styled(ArrowDownIcon)`
  width: 24px;
  height: 24px;
  margin: 20px 0;
`
const ButtonWrapper = styled.div`
  margin-top: 50px;
  display: flex;
  justify-content: center;
`

const CheckboxWrapper = styled.div`
  &:not(:first-child) {
    margin-top: 20px;
  }
`

const DialogContent = styled.div`
  padding: 8px 40px 40px 40px;
`

const DialogTitle = styled.div`
  margin-top: 20px;
  margin-bottom: 56px;
  color: ${({ theme }) => theme.colors.white};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.5;
`

const DialogSubTitle = styled.div`
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.orange};
`

function calculateReserveProportion(amount, totalAmount, reserve) {
  return totalAmount.isZero()
    ? amount.div(ethers.BigNumber.from('2'))
    : amount.mul(reserve).div(totalAmount)
}

export default function Deposit() {
  const { chainId, account, library } = useWeb3React()

  const addTransaction = useTransactionAdder()

  const {
    daiReserve,
    usdcReserve,
    totalSupply,
    daiSupplyAPY,
    daiBorrowAPY,
    daiSupplyCompAPY,
    daiBorrowCompAPY,
    usdcSupplyAPY,
    usdcBorrowAPY,
    usdcSupplyCompAPY,
    usdcBorrowCompAPY,
  } = useExchangeDetails(EXCHANGE_ADDRESSES[chainId])

  const bhsBalance = useAddressBalance(account, EXCHANGE_ADDRESSES[chainId])

  const { decimals: daiDecimals } = useTokenDetails(DAI_ADDRESSES[chainId])
  const { decimals: usdcDecimals } = useTokenDetails(USDC_ADDRESSES[chainId])
  const daiBalance = useAddressBalance(account, DAI_ADDRESSES[chainId])
  const usdcBalance = useAddressBalance(account, USDC_ADDRESSES[chainId])
  const daiAllowance = useAddressAllowance(
    account,
    DAI_ADDRESSES[chainId],
    EXCHANGE_ADDRESSES[chainId],
  )
  const usdcAllowance = useAddressAllowance(
    account,
    USDC_ADDRESSES[chainId],
    EXCHANGE_ADDRESSES[chainId],
  )

  const [amount, setAmount] = useState('')
  const amountParsed = useMemo(() => {
    const value = amount || '0'
    return ethers.utils.parseEther(value)
  }, [amount])

  // calculate the amount of DAI and USDC that should be depositted
  const daiAmount = useMemo(() => {
    if (!amountParsed.isZero() && totalSupply && daiReserve) {
      return calculateReserveProportion(amountParsed, totalSupply, daiReserve)
    }
  }, [amountParsed, totalSupply, daiReserve])

  const usdcAmount = useMemo(() => {
    if (!amountParsed.isZero() && totalSupply && usdcReserve) {
      return calculateReserveProportion(
        amountParsed,
        totalSupply,
        usdcReserve,
      ).div(ethers.BigNumber.from('1000000000000'))
    }
  }, [amountParsed, totalSupply, usdcReserve])

  const daiAmountFormatted = daiAmount
    ? amountFormatter(daiAmount, daiDecimals, Math.min(4, daiDecimals))
    : '-'
  const usdcAmountFormatted = usdcAmount
    ? amountFormatter(usdcAmount, usdcDecimals, Math.min(4, usdcDecimals))
    : '-'
  const {
    minimum: daiAmountMinimum,
    maximum: daiAmountMaximum,
  } = calculateSlippageBounds(daiAmount, ALLOWED_SLIPPAGE)
  const {
    minimum: usdcAmountMinimum,
    maximum: usdcAmountMaximum,
  } = calculateSlippageBounds(usdcAmount, ALLOWED_SLIPPAGE)

  const summaryMessage = useMemo(() => {
    if (daiAmount && usdcAmount) {
      return `
        You'll 
        ${daiAmount.gte(ethers.constants.Zero) ? 'deposit' : 'recieve'} 
        ${Math.abs(daiAmountFormatted)} DAI
        , and 
        ${usdcAmount.gte(ethers.constants.Zero) ? 'deposit' : 'recieve'} 
        ${Math.abs(usdcAmountFormatted)} USDC
      `
    }
  }, [daiAmount, daiAmountFormatted, usdcAmount, usdcAmountFormatted])

  // validate input allowance + balance
  const [inputError, setInputError] = useState()
  const [showDaiUnlock, setShowDaiUnlock] = useState(false)
  const [showUsdcUnlock, setShowUsdcUnlock] = useState(false)
  useEffect(() => {
    if (
      daiAmount &&
      daiBalance &&
      daiAllowance &&
      usdcAmount &&
      usdcBalance &&
      usdcAllowance
    ) {
      if (daiBalance.lt(daiAmount) || usdcBalance.lt(usdcAmount)) {
        setInputError('Insufficient Balance of DAI or USDC')
      } else if (daiAllowance.lt(daiAmount) || usdcAllowance.lt(usdcAmount)) {
        setInputError('Please unlock token to continue.')
        if (daiAllowance.lt(daiAmount)) {
          setShowDaiUnlock(true)
        }
        if (usdcAllowance.lt(usdcAmount)) {
          setShowUsdcUnlock(true)
        }
      } else {
        setInputError(null)
        setShowDaiUnlock(false)
        setShowUsdcUnlock(false)
      }
      return () => {
        setInputError()
        setShowDaiUnlock(false)
        setShowUsdcUnlock(false)
      }
    }
  }, [
    daiAllowance,
    daiAmount,
    daiBalance,
    usdcAllowance,
    usdcAmount,
    usdcBalance,
  ])

  // Approve tokens
  const [isApprovingTokens, setIsApprovingTokens] = useState({
    [DAI_ADDRESSES[chainId]]: false,
    [USDC_ADDRESSES[chainId]]: false,
  })
  const approve = useCallback(
    async (tokenAddress) => {
      const token = getContract(tokenAddress, ERC20_ABI, library, account)

      if (account && (chainId || chainId === 0) && token) {
        const balance =
          tokenAddress === DAI_ADDRESSES[chainId] ? daiBalance : usdcBalance
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
          setIsApprovingTokens((prevState) => ({
            ...prevState,
            [tokenAddress]: true,
          }))
          addTransaction(tx)
          await tx.wait()
        } finally {
          setIsApprovingTokens((prevState) => ({
            ...prevState,
            [tokenAddress]: false,
          }))
        }
      }
    },
    [account, addTransaction, chainId, daiBalance, library, usdcBalance],
  )

  // Add Liquidity
  const exchangeContract = useExchangeContract(EXCHANGE_ADDRESSES[chainId])
  const [isPending, setIsPending] = useState(false)
  const onDeposit = useCallback(async () => {
    if (amountParsed && daiReserve && usdcReserve) {
      const tokens = [
        ...(daiReserve.lt(ethers.constants.Zero)
          ? [ethers.constants.Zero, daiAmountMinimum]
          : [daiAmountMaximum, ethers.constants.Zero]
        ),
        ...(usdcReserve.lt(ethers.constants.Zero)
          ? [ethers.constants.Zero, usdcAmountMinimum]
          : [usdcAmountMaximum, ethers.constants.Zero]
        ),
      ]

      try {
        const estimatedGas = await exchangeContract.estimateGas.addLiquidity(
          amountParsed,
          tokens,
        )
        const tx = await exchangeContract.addLiquidity(amountParsed, tokens, {
          gasLimit: calculateGasMargin(estimatedGas, GAS_MARGIN),
        })
        setIsPending(true)
        addTransaction(tx)
        await tx.wait()
        setIsOpen(false)
      } finally {
        setIsPending(false)
      }
    }
  }, [
    addTransaction,
    amountParsed,
    daiAmountMaximum,
    daiAmountMinimum,
    daiReserve,
    exchangeContract,
    usdcAmountMaximum,
    usdcAmountMinimum,
    usdcReserve,
  ])

  const noAccountError = useMemo(
    () => (account ? '' : 'Wallet is not connected.'),
    [account],
  )

  const noAmountError = useMemo(() => !amount, [amount])

  const errorMessage = noAccountError || noAmountError || inputError

  const [isOpen, setIsOpen] = useState(false)
  const [isCheckin1, setIsCheckin1] = useState(false)
  const [isCheckin2, setIsCheckin2] = useState(false)
  const [isCheckin3, setIsCheckin3] = useState(false)
  const [isCheckin4, setIsCheckin4] = useState(false)
  const isAllCheckin = isCheckin1 && isCheckin2 && isCheckin3 && isCheckin4
  useEffect(() => {
    if (isOpen === false) {
      setIsCheckin1(false)
      setIsCheckin2(false)
      setIsCheckin3(false)
      setIsCheckin4(false)
    }
  }, [isOpen])

  return (
    <>
      <Card>
        <CoinInputPanel
          title='How many positions do you deposit?'
          selectedCoin={EXCHANGE_ADDRESSES[chainId]}
          value={amount}
          showMax={false}
          showBalance={false}
          onValueChange={(value) => setAmount(value)}
          renderCoinButtons={() => (
            <>
              {showDaiUnlock && (
                <UnlockButton
                  disabled={isApprovingTokens[DAI_ADDRESSES[chainId]]}
                  onClick={() => approve(DAI_ADDRESSES[chainId])}
                >
                  {isApprovingTokens[DAI_ADDRESSES[chainId]]
                    ? 'Pending'
                    : 'Unlock DAI'}
                </UnlockButton>
              )}
              {showUsdcUnlock && (
                <UnlockButton
                  disabled={isApprovingTokens[USDC_ADDRESSES[chainId]]}
                  onClick={() => approve(USDC_ADDRESSES[chainId])}
                >
                  {isApprovingTokens[USDC_ADDRESSES[chainId]]
                    ? 'Pending...'
                    : 'Unlock USDC'}
                </UnlockButton>
              )}
            </>
          )}
        />
        <StyledArrowDownIcon />
        <div>
          <Row>
            <CoinWrapper>
              <CoinIcon src={DaiImage} alt='icon dai' />
              <CoinText>DAI</CoinText>
            </CoinWrapper>
            <Number>{daiAmountFormatted}</Number>
          </Row>
          <Row>
            <CoinWrapper>
              <CoinIcon src={UsdcImage} alt='icon dai' />
              <CoinText>USDC</CoinText>
            </CoinWrapper>
            <Number>{usdcAmountFormatted}</Number>
          </Row>
        </div>
        <SummaryMessage>{summaryMessage}</SummaryMessage>
        <ButtonWrapper>
          <Button
            disabled={!!errorMessage || isPending}
            onClick={() => {
              if (amountParsed && !amountParsed.isZero()) {
                setIsOpen(true)
              }
            }}
          >
            {isPending ? 'Pending...' : 'deposit'}
          </Button>
        </ButtonWrapper>
        <ErrorMessage>
          {errorMessage}
        </ErrorMessage>
      </Card>
      <ReserveMatrics
        hasAccount={!!account}
        daiBalance={daiBalance}
        usdcBalance={usdcBalance}
        bhsBalance={bhsBalance}
        daiReserve={daiReserve}
        usdcReserve={usdcReserve}
        daiSupplyAPY={daiSupplyAPY}
        daiBorrowAPY={daiBorrowAPY}
        daiSupplyCompAPY={daiSupplyCompAPY}
        daiBorrowCompAPY={daiBorrowCompAPY}
        usdcSupplyAPY={usdcSupplyAPY}
        usdcBorrowAPY={usdcBorrowAPY}
        usdcSupplyCompAPY={usdcSupplyCompAPY}
        usdcBorrowCompAPY={usdcBorrowCompAPY}
        totalSupply={totalSupply}
      />
      <Dialog isOpen={isOpen} onDismiss={() => setIsOpen(false)}>
        <DialogContent>
          <CautionIcon />
          <DialogTitle>{summaryMessage}</DialogTitle>
          <DialogSubTitle>Check Caution Terms</DialogSubTitle>
          <CheckboxWrapper>
            <Checkbox
              label='I understand that BlackHoleSwap is risky and highly experimental tech.'
              checked={isCheckin1}
              onChange={() => setIsCheckin1(!isCheckin1)}
            />
          </CheckboxWrapper>
          <CheckboxWrapper>
            <Checkbox
              label='I understand that the contract has not audited. Some bugs might exist.'
              checked={isCheckin2}
              onChange={() => setIsCheckin2(!isCheckin2)}
            />
          </CheckboxWrapper>
          <CheckboxWrapper>
            <Checkbox
              label='I understand that it is potential to lose all money if I deposit them.'
              checked={isCheckin3}
              onChange={() => setIsCheckin3(!isCheckin3)}
            />
          </CheckboxWrapper>
          <CheckboxWrapper>
            <Checkbox
              label='I understand that I cannot get compensations ABSOLUTELY if I lose money.'
              checked={isCheckin4}
              onChange={() => setIsCheckin4(!isCheckin4)}
            />
          </CheckboxWrapper>
          <ButtonWrapper>
            <Button disabled={!isAllCheckin || isPending} onClick={onDeposit}>
              {isPending ? 'Pending...' : 'confirm'}
            </Button>
          </ButtonWrapper>
        </DialogContent>
      </Dialog>
    </>
  )
}
