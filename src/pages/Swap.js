import React, {
  useReducer,
  useCallback,
  useMemo,
  useState,
  useEffect,
} from 'react'
import styled from 'styled-components'
import { ethers } from 'ethers'
import { useWeb3React, useExchangeContract } from '../hooks/ethereum'
import { useTokenDetails } from '../contexts/Tokens'
import { useAddressBalance } from '../contexts/Balances'
import { useAddressAllowance } from '../contexts/Allowances'
import { useExchangeDetails } from '../contexts/Exchange'
import { useTransactionAdder } from '../contexts/Transactions'
import {
  EXCHANGE_ADDRESSES,
  DAI_ADDRESSES,
  USDC_ADDRESSES,
  CDAI_ADDRESSES,
  CUSDC_ADDRESSES,
  GAS_MARGIN,
} from '../constants'
import CTOKEN_ABI from '../constants/abis/ctoken.json'
import { amountFormatter, calculateGasMargin, getContract } from '../utils'
import {
  calculateSlippageBounds,
  calculateExchangeRate,
} from '../utils/calculation'
import CoinInputPanel from '../components/CoinInputPanel'
import SlippageController from '../components/SlippageController'
import Button from '../components/Button'
import { ReactComponent as ArrowDownIcon } from '../assets/arrow_down.svg'

const Card = styled.div`
  padding: 36px 40px;
  background-color: ${({ theme }) => theme.colors.gray700};
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

const ErrorMessage = styled.div`
  margin-top: 20px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.orange};
  text-align: center;
`

// amplifier factor
const AMPLIFIER = ethers.utils.parseEther('0.75')

// fees
const FEE = ethers.utils.parseEther('0.99985')

// 15 minutes, denominated in seconds
const DEFAULT_DEADLINE_FROM_NOW = 60 * 15

// denominated in bips
const ALLOWED_SLIPPAGE_DEFAULT = 10

const INPUT = 'INPUT'
const OUTPUT = 'OUTPUT'
const RESET = 'RESET'
const SELECT_COIN = 'SELECT_COIN'
const UPDATE_INDEPENDENT = 'UPDATE_INDEPENDENT'
const UPDATE_DEPENDENT = 'UPDATE_DEPENDENT'

function sqrt(x) {
  let z = x.div(2).add(1)
  let y = x
  while (z.lt(y)) {
    y = z
    z = x.div(z).add(z).div(2)
  }
  return y
}

function F(_x, x, y) {
  const u = x.add(y.mul(AMPLIFIER).div(ethers.constants.WeiPerEther))
  const v = y.add(x.mul(AMPLIFIER).div(ethers.constants.WeiPerEther))
  const k = u.mul(v)
  const c = _x.mul(_x).sub(k.mul(ethers.constants.WeiPerEther).div(AMPLIFIER))
  const cst = AMPLIFIER.add(
    ethers.constants.WeiPerEther.mul(ethers.constants.WeiPerEther).div(
      AMPLIFIER,
    ),
  )
  const b = _x.mul(cst).div(ethers.constants.WeiPerEther)
  const D = b.mul(b).sub(c.mul(4))
  if (D < 0) {
    throw Error('no root')
  }

  return b.mul(-1).add(sqrt(D)).div(2)
}

// this mocks the getInputPrice function, and calculates the required output
function calculateInputPrice(inputAmount, inputReserve, outputReserve) {
  const x = inputReserve
  const y = outputReserve
  const inputAmountWithFee = inputAmount
    .mul(FEE)
    .div(ethers.constants.WeiPerEther)
  const _x = x.add(inputAmountWithFee)
  const _y = F(_x, x, y)
  return y.sub(_y)
}

// this mocks the getOutputPrice function, and calculates the required input
function calculateOutputPrice(outputAmount, inputReserve, outputReserve) {
  const x = inputReserve
  const y = outputReserve
  const _y = y.sub(outputAmount)
  const _x = F(_y, y, x)

  const inputAmount = _x.sub(x)
  const inputAmountWithFee = inputAmount
    .mul(ethers.constants.WeiPerEther)
    .div(FEE)

  return inputAmountWithFee
}

function getInitialSwapState(state) {
  return {
    allCoins: state.allCoins,
    independentValue: '', // this is a user input
    dependentValue: '', // this is a calculated number
    independentField: INPUT,
    inputCoin: state.allCoins[0],
    outputCoin: state.allCoins[1],
  }
}

function getOtherCoin(allCoins, selectedCoin, defaultCoin) {
  const otherCoins = allCoins.filter((coin) => coin !== selectedCoin)
  return otherCoins.includes(defaultCoin) ? defaultCoin : otherCoins[0]
}

function reducer(state, { type, payload }) {
  switch (type) {
    case RESET: {
      return { ...payload }
    }
    case SELECT_COIN: {
      const { allCoins, inputCoin, outputCoin } = state
      const { coin, field } = payload

      const newInputCoin =
        field === INPUT ? coin : getOtherCoin(allCoins, coin, inputCoin)
      const newOutputCoin =
        field === OUTPUT ? coin : getOtherCoin(allCoins, coin, outputCoin)

      return {
        ...state,
        inputCoin: newInputCoin,
        outputCoin: newOutputCoin,
      }
    }
    case UPDATE_INDEPENDENT: {
      const { field, value } = payload
      const { dependentValue, independentValue } = state
      return {
        ...state,
        independentValue: value,
        dependentValue: value === independentValue ? dependentValue : '',
        independentField: field,
      }
    }
    case UPDATE_DEPENDENT: {
      const { independentField, inputCoin, outputCoin, allCoins } = state
      const dependentCoin = independentField === INPUT ? outputCoin : inputCoin
      const value =
        dependentCoin === allCoins[0]
          ? payload
          : payload && payload.div(ethers.BigNumber.from('1000000000000'))
      return {
        ...state,
        dependentValue: value,
      }
    }
    default: {
      return getInitialSwapState(state)
    }
  }
}

export default function Swap() {
  const { account, chainId, library } = useWeb3React()

  const addTransaction = useTransactionAdder()

  const exchangeAddress = useMemo(() => EXCHANGE_ADDRESSES[chainId], [chainId])
  const { daiReserve, usdcReserve } = useExchangeDetails(exchangeAddress)

  const coinOptions = useMemo(
    () => [
      {
        text: 'DAI',
        value: DAI_ADDRESSES[chainId || 1],
      },
      {
        text: 'USDC',
        value: USDC_ADDRESSES[chainId || 1],
      },
    ],
    [chainId],
  )

  const [state, dispatch] = useReducer(
    reducer,
    {
      allCoins: [DAI_ADDRESSES[chainId], USDC_ADDRESSES[chainId]], // assume first coin is DAI
    },
    getInitialSwapState,
  )
  const {
    independentValue,
    dependentValue,
    independentField,
    inputCoin,
    outputCoin,
  } = state

  useEffect(() => {
    dispatch({
      type: RESET,
      payload: getInitialSwapState({
        allCoins: [DAI_ADDRESSES[chainId], USDC_ADDRESSES[chainId]],
      }),
    })

    return () => {}
  }, [chainId])

  // get decimals for each of the currency types
  const { decimals: inputDecimals } = useTokenDetails(inputCoin)
  const { decimals: outputDecimals } = useTokenDetails(outputCoin)

  // compute useful transforms of the data above
  const independentDecimals = useMemo(
    () => (independentField === INPUT ? inputDecimals : outputDecimals),
    [independentField, inputDecimals, outputDecimals],
  )
  const dependentDecimals = useMemo(
    () => (independentField === INPUT ? outputDecimals : inputDecimals),
    [independentField, inputDecimals, outputDecimals],
  )

  // declare/get parsed and formatted versions of input/output values
  const [independentValueParsed, setIndependentValueParsed] = useState()
  const [independentValueNormalized, setIndependentValueNormalized] = useState()
  const dependentValueFormatted = useMemo(() => {
    if (!!(dependentValue && (dependentDecimals || dependentDecimals === 0))) {
      return amountFormatter(
        dependentValue,
        dependentDecimals,
        Math.min(8, dependentDecimals),
      )
    } else {
      return ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependentValue])
  const inputValueParsed =
    independentField === INPUT ? independentValueParsed : dependentValue
  const inputValueFormatted =
    independentField === INPUT ? independentValue : dependentValueFormatted
  const outputValueParsed =
    independentField === OUTPUT ? independentValueParsed : dependentValue
  const outputValueFormatted =
    independentField === OUTPUT ? independentValue : dependentValueFormatted

  // calculate exchange rate
  const exchangeRate = useMemo(() => {
    if (inputValueParsed && outputValueParsed) {
      return calculateExchangeRate(
        inputValueParsed,
        inputDecimals,
        outputValueParsed,
        outputDecimals,
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValueParsed, outputValueParsed])

  const exchangeRateFormatted = exchangeRate
    ? amountFormatter(exchangeRate, 18, 6)
    : '-'

  // validate + parse independent value
  const [independentError, setIndependentError] = useState()
  useEffect(() => {
    if (
      independentValue &&
      (independentDecimals || independentDecimals === 0)
    ) {
      try {
        const parsedValue = ethers.utils.parseUnits(
          independentValue,
          independentDecimals,
        )
        const normalizedValue = ethers.utils.parseEther(independentValue)

        if (
          parsedValue.lte(ethers.constants.Zero) ||
          parsedValue.gte(ethers.constants.MaxUint256)
        ) {
          throw Error()
        } else {
          setIndependentValueParsed(parsedValue)
          setIndependentValueNormalized(normalizedValue)
          setIndependentError(null)
        }
      } catch {
        setIndependentError('Not a valid input value')
      }

      return () => {
        setIndependentValueParsed()
        setIndependentValueNormalized()
        setIndependentError()
      }
    }
  }, [independentValue, independentDecimals])

  const [rawSlippage, setRawSlippage] = useState(() => ALLOWED_SLIPPAGE_DEFAULT)
  const allowedSlippageBig = ethers.BigNumber.from(rawSlippage)

  // calculate slippage from target rate
  const {
    minimum: dependentValueMinumum,
    maximum: dependentValueMaximum,
  } = calculateSlippageBounds(dependentValue, allowedSlippageBig)

  // get allowances and balances of inputCoin
  const inputAllowance = useAddressAllowance(
    account,
    inputCoin,
    exchangeAddress,
  )
  const inputBalance = useAddressBalance(account, inputCoin)

  // validate input allowance + balance
  const [inputError, setInputError] = useState()
  const [showUnlock, setShowUnlock] = useState(false)
  useEffect(() => {
    const inputValueCalculation =
      independentField === INPUT
        ? independentValueParsed
        : dependentValueMaximum
    if (inputBalance && inputAllowance && inputValueCalculation) {
      if (inputBalance.lt(inputValueCalculation)) {
        setInputError('Insufficient Balance')
      } else if (inputAllowance.lt(inputValueCalculation)) {
        setInputError('Please unlock token to continue.')
        setShowUnlock(true)
      } else {
        setInputError(null)
        setShowUnlock(false)
      }
      return () => {
        setInputError()
        setShowUnlock(false)
      }
    }
  }, [
    independentField,
    independentValueParsed,
    dependentValueMaximum,
    inputBalance,
    inputCoin,
    inputAllowance,
  ])

  // get DAI cash
  const [daiCash, setDaiCash] = useState()
  useEffect(() => {
    let stale = false
    if (library) {
      const cDai = getContract(CDAI_ADDRESSES[chainId], CTOKEN_ABI, library)
      cDai
        .getCash()
        .then((result) => {
          if (!stale) {
            setDaiCash(result)
          }
        })
        .catch(() => {
          if (!stale) {
            setDaiCash()
          }
        })
    }

    return () => {
      stale = true
    }
  }, [chainId, library])

  // get USDC cash
  const [usdcCash, setUsdcCash] = useState()
  useEffect(() => {
    let stale = false
    if (library) {
      const cUsdc = getContract(CUSDC_ADDRESSES[chainId], CTOKEN_ABI, library)
      cUsdc
        .getCash()
        .then((result) => {
          if (!stale) {
            setUsdcCash(result)
          }
        })
        .catch(() => {
          if (!stale) {
            setUsdcCash()
          }
        })
    }

    return () => {
      stale = true
    }
  }, [chainId, library])

  // validate output cash
  const [outputError, setOutputError] = useState()
  useEffect(() => {
    if (outputCoin === DAI_ADDRESSES[chainId]) {
      if (outputValueParsed && daiCash && outputValueParsed.gt(daiCash)) {
        setOutputError('Cash is insufficient in the pool.')
      } else {
        setOutputError()
      }
    } else {
      if (outputValueParsed && usdcCash && outputValueParsed.gt(usdcCash)) {
        setOutputError('Cash is insufficient in the pool.')
      } else {
        setOutputError()
      }
    }
  }, [chainId, daiCash, outputValueParsed, outputCoin, usdcCash])

  const inputReserve = useMemo(
    () => (inputCoin === DAI_ADDRESSES[chainId] ? daiReserve : usdcReserve),
    [chainId, daiReserve, inputCoin, usdcReserve],
  )
  const outputReserve = useMemo(
    () => (outputCoin === DAI_ADDRESSES[chainId] ? daiReserve : usdcReserve),
    [chainId, daiReserve, outputCoin, usdcReserve],
  )

  const exchangeContract = useExchangeContract(exchangeAddress)

  // calculate dependent value
  useEffect(() => {
    if (
      independentValueNormalized &&
      inputReserve &&
      outputReserve &&
      exchangeContract
    ) {
      const amount = independentValueNormalized

      try {
        if (inputReserve.isZero() || outputReserve.isZero()) {
          throw Error('Insufficient liquidity.')
        }

        const calculatedDependentValue =
          independentField === INPUT
            ? calculateInputPrice(amount, inputReserve, outputReserve)
            : calculateOutputPrice(amount, inputReserve, outputReserve)

        if (calculatedDependentValue.lte(ethers.constants.Zero)) {
          throw Error('Insufficient liquidity.')
        }

        dispatch({
          type: UPDATE_DEPENDENT,
          payload: calculatedDependentValue,
        })
      } catch (e) {
        setIndependentError(e.message)
      }
      return () => {
        dispatch({ type: UPDATE_DEPENDENT, payload: '' })
      }
    }
  }, [
    dependentDecimals,
    exchangeContract,
    independentField,
    independentValueNormalized,
    inputReserve,
    outputReserve,
  ])

  const [isPending, setIsPending] = useState(false)
  const onSwap = useCallback(async () => {
    const deadline = Math.ceil(Date.now() / 1000) + DEFAULT_DEADLINE_FROM_NOW
    let estimate, method, args

    if (independentField === INPUT) {
      if (inputCoin === DAI_ADDRESSES[chainId]) {
        method = exchangeContract.dai2usdcIn
        estimate = exchangeContract.estimateGas.dai2usdcIn
        args = [independentValueParsed, dependentValueMinumum, deadline]
      } else {
        method = exchangeContract.usdc2daiIn
        estimate = exchangeContract.estimateGas.usdc2daiIn
        args = [independentValueParsed, dependentValueMinumum, deadline]
      }
    } else {
      if (outputCoin === DAI_ADDRESSES[chainId]) {
        method = exchangeContract.usdc2daiOut
        estimate = exchangeContract.estimateGas.usdc2daiOut
        args = [dependentValueMaximum, independentValueParsed, deadline]
      } else {
        method = exchangeContract.dai2usdcOut
        estimate = exchangeContract.estimateGas.dai2usdcOut
        args = [dependentValueMaximum, independentValueParsed, deadline]
      }
    }

    try {
      const estimatedGas = await estimate(...args)
      const tx = await method(...args, {
        gasLimit: calculateGasMargin(estimatedGas, GAS_MARGIN),
      })
      setIsPending(true)
      addTransaction(tx)
      await tx.wait()
    } finally {
      setIsPending(false)
    }

    return () => {
      setIsPending(false)
    }
  }, [addTransaction, chainId, dependentValueMaximum, dependentValueMinumum, exchangeContract, independentField, independentValueParsed, inputCoin, outputCoin])

  const noAccountError = useMemo(
    () => (account ? '' : 'Wallet is not connected.'),
    [account],
  )

  const noAmountError = useMemo(() => !independentValue, [independentValue])

  const errorMessage =
    noAccountError ||
    noAmountError ||
    independentError ||
    inputError ||
    outputError

  return (
    <Card>
      <CoinInputPanel
        title='From'
        coinOptions={coinOptions}
        selectedCoin={inputCoin}
        value={inputValueFormatted}
        showUnlock={showUnlock}
        onCoinChange={(coin) =>
          dispatch({ type: SELECT_COIN, payload: { coin, field: INPUT } })
        }
        onValueChange={(value) =>
          dispatch({
            type: UPDATE_INDEPENDENT,
            payload: { field: INPUT, value },
          })
        }
      />
      <StyledArrowDownIcon />
      <CoinInputPanel
        title='To'
        coinOptions={coinOptions}
        selectedCoin={outputCoin}
        value={outputValueFormatted}
        onCoinChange={(coin) =>
          dispatch({ type: SELECT_COIN, payload: { coin, field: OUTPUT } })
        }
        onValueChange={(value) =>
          dispatch({
            type: UPDATE_INDEPENDENT,
            payload: { field: OUTPUT, value },
          })
        }
        renderInputMessage={() => <span>Rate: {exchangeRateFormatted}</span>}
      />
      <SlippageController onChange={setRawSlippage} />
      <ButtonWrapper>
        <Button disabled={!!errorMessage || isPending} onClick={onSwap}>
          {isPending ? 'Pending...' : 'swap'}
        </Button>
      </ButtonWrapper>
      <ErrorMessage>{errorMessage}</ErrorMessage>
    </Card>
  )
}
