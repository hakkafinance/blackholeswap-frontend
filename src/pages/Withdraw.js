import React, { useCallback, useMemo, useState, useEffect } from 'react'
import styled from 'styled-components'
import { ethers } from 'ethers'
import { useWeb3React, useExchangeContract } from '../hooks/ethereum'
import { useTokenDetails } from '../contexts/Tokens'
import { useAddressBalance } from '../contexts/Balances'
import { useAddressAllowance } from '../contexts/Allowances'
import { useExchangeDetails } from '../contexts/Exchange'
import { useTransactionAdder } from '../contexts/Transactions'
import CoinInputPanel from '../components/CoinInputPanel'
import Button from '../components/Button'
import UnlockButton from '../components/UnlockButton'
import ReserveMatrics from '../components/ReserveMatrics'
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

function calculateReserveProportion(amount, totalAmount, reserve) {
  return totalAmount.isZero()
    ? ethers.constants.Zero
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

  const poolTokenBalance = useAddressBalance(
    account,
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
        ${daiAmount.gte(ethers.constants.Zero) ? 'withdraw' : 'deposit'} 
        ${Math.abs(daiAmountFormatted)} DAI
        , and 
        ${usdcAmount.gte(ethers.constants.Zero) ? 'withdraw' : 'deposit'} 
        ${Math.abs(usdcAmountFormatted)} USDC
      `
    }
  }, [daiAmount, daiAmountFormatted, usdcAmount, usdcAmountFormatted])

  // validate input (pool balance + token allowance + token balance)
  const [inputError, setInputError] = useState()
  const [showDaiUnlock, setShowDaiUnlock] = useState(false)
  const [showUsdcUnlock, setShowUsdcUnlock] = useState(false)
  useEffect(() => {
    setInputError(null)
    if (amountParsed && poolTokenBalance && amountParsed.gt(poolTokenBalance)) {
      setInputError('Insufficient Balance')
    } else {
      if (
        daiAmount && daiAmount.lt(ethers.constants.Zero) &&
        daiBalance &&
        daiAllowance
      ) {
        const reverseDaiAmount = daiAmount.mul(-1)
        if (daiBalance.lt(reverseDaiAmount)) {
          setInputError('Insufficient Balance of DAI or USDC')
        } else if (daiAllowance.lt(reverseDaiAmount)) {
          setInputError('Please unlock token to continue.')
          setShowDaiUnlock(true)
        }
      } else {
        setShowDaiUnlock(false)
      }
      
      if (
        usdcAmount && usdcAmount.lt(ethers.constants.Zero) &&
        usdcBalance &&
        usdcAllowance
      ) {
        const reverseUsdcAmount = usdcAmount.mul(-1)
        if (usdcBalance.lt(reverseUsdcAmount)) {
          setInputError('Insufficient Balance of DAI or USDC')
        } else if (usdcAllowance.lt(reverseUsdcAmount)) {
          setInputError('Please unlock token to continue.')
          setShowUsdcUnlock(true)
        } 
      } else {
        setShowUsdcUnlock(false)
      }
    }
    
    return () => {
      setInputError()
      setShowDaiUnlock(false)
      setShowUsdcUnlock(false)
    }
  }, [amountParsed, daiAllowance, daiAmount, daiBalance, poolTokenBalance, usdcAllowance, usdcAmount, usdcBalance])

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


  // remove Liquidity
  const exchangeContract = useExchangeContract(EXCHANGE_ADDRESSES[chainId])
  const [isPending, setIsPending] = useState(false)
  const onRemoveLiquidity = useCallback(async () => {
    if (amountParsed && daiReserve && usdcReserve) {
      const tokens = [
        ...(daiReserve.gt(ethers.constants.Zero)
         ? [ethers.constants.Zero, daiAmountMinimum]
          : [daiAmountMaximum, ethers.constants.Zero]
        ),
        ...(usdcReserve.gt(ethers.constants.Zero)
          ? [ethers.constants.Zero, usdcAmountMinimum]
          : [usdcAmountMaximum, ethers.constants.Zero]
        ),
      ]

      try {
        const estimatedGas = await exchangeContract.estimateGas.removeLiquidity(
          amountParsed,
          tokens,
        )
        const tx = await exchangeContract.removeLiquidity(
          amountParsed,
          tokens,
          {
            gasLimit: calculateGasMargin(estimatedGas, GAS_MARGIN),
          },
        )
        setIsPending(true)
        addTransaction(tx)
        await tx.wait()
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

  const accountError = useMemo(
    () => (account ? '' : 'Wallet is not connected.'),
    [account],
  )

  const noAmountError = useMemo(() => !parseFloat(amount), [amount])

  const errorMessage = accountError || noAmountError || inputError

  return (
    <>
      <Card>
        <CoinInputPanel
          title='How many positions do you withdraw?'
          selectedCoin={EXCHANGE_ADDRESSES[chainId]}
          value={amount}
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
            onClick={onRemoveLiquidity}
          >
            {isPending ? 'Pending...' : 'withdraw'}
          </Button>
        </ButtonWrapper>
        <ErrorMessage>{errorMessage}</ErrorMessage>
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
    </>
  )
}
