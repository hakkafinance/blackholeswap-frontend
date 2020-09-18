import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useEffect,
} from 'react'
import { ethers } from 'ethers'
import { Contract as MulticallContract, Provider as MulticallProvider } from '../vendors/ethers-multicall'
import { useBlockNumber } from './Application'
import { useWeb3React } from '../hooks/ethereum'
import { safeAccess, isAddress } from '../utils'
import {
  EXCHANGE_ADDRESSES,
  CDAI_ADDRESSES,
  CUSDC_ADDRESSES,
  COMPTROLLER_ADDRESSES,
  ORACLE_ADDRESSES,
  BLOCKS_PER_DAY,
  DAYS_PER_YEAR,
} from '../constants'
import EXCHANGE_ABI from '../constants/abis/BlackHoleSwap.json'
import CTOKEN_ABI from '../constants/abis/ctoken.json'
import COMPTROLLER_ABI from '../constants/abis/comptroller.json'
import ORACLE_ABI from '../constants/abis/oracle.json'

const UPDATE = 'UPDATE'

const ExchangeContext = createContext()

export function useExchangeContext() {
  return useContext(ExchangeContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const {
        chainId,
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
        blockNumber,
      } = payload
      return {
        ...state,
        [chainId]: {
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
          blockNumber,
        },
      }
    }
    default: {
      throw Error(
        `Unexpected action type in ExchangeContext reducer: '${type}'.`,
      )
    }
  }
}

export default function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, {})
  const update = useCallback(
    (
      chainId,
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
      blockNumber,
    ) =>
      dispatch({
        type: UPDATE,
        payload: {
          chainId,
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
          blockNumber
        },
      }),
    [],
  )
  const value = useMemo(() => [state, { update }], [state, update])

  return (
    <ExchangeContext.Provider value={value}>
      {children}
    </ExchangeContext.Provider>
  )
}

function isBigNumber(n) {
  return ethers.BigNumber.isBigNumber(n)
}

function calculateAPY(ratePerBlock) {
  const dayRange = DAYS_PER_YEAR.sub(ethers.constants.One)
  return ratePerBlock
    .mul(BLOCKS_PER_DAY)
    .add(ethers.constants.WeiPerEther)
    .pow(dayRange)
    .div(ethers.constants.WeiPerEther.pow(dayRange.sub(ethers.constants.One)))
    .sub(ethers.constants.WeiPerEther)
}

function calculateCompAPY(reserve, tokenDecimals, compSpeed, compPrice) {
  if (isBigNumber(reserve) && isBigNumber(compSpeed) && isBigNumber(compPrice)) {
    const nominator = compSpeed
      .mul(BLOCKS_PER_DAY)
      .mul(DAYS_PER_YEAR)
      .mul(compPrice)
      .div(ethers.utils.parseUnits('10', 6))
    const denominator = reserve
      .mul(ethers.constants.WeiPerEther)
      .div(ethers.utils.parseUnits('10', tokenDecimals))
    return nominator.mul(ethers.constants.WeiPerEther).div(denominator)
  }
}

export function useExchangeDetails() {
  const { chainId, library } = useWeb3React()

  const globalBlockNumber = useBlockNumber()

  const [state, { update }] = useExchangeContext()
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
    blockNumber,
  } = safeAccess(state, [chainId]) || {}

  const exchangeAddress = EXCHANGE_ADDRESSES[chainId]

  useEffect(() => {
    let stale = false
    if (
      isAddress(exchangeAddress) &&
      globalBlockNumber &&
      blockNumber !== globalBlockNumber &&
      library
    ) {
      const ethcallProvider = new MulticallProvider(library, chainId)
      const exchange = new MulticallContract(exchangeAddress, EXCHANGE_ABI)
      const cdai = new MulticallContract(CDAI_ADDRESSES[chainId], CTOKEN_ABI)
      const cusdc = new MulticallContract(CUSDC_ADDRESSES[chainId], CTOKEN_ABI)
      const comptroller = new MulticallContract(COMPTROLLER_ADDRESSES[chainId], COMPTROLLER_ABI)
      const oracle = chainId === 1 && new MulticallContract(ORACLE_ADDRESSES[chainId], ORACLE_ABI)
      ethcallProvider.all([
        exchange.getDaiBalance(),
        exchange.getUSDCBalance(),
        exchange.totalSupply(),
        cdai.supplyRatePerBlock(),
        cdai.borrowRatePerBlock(),
        cdai.getCash(),
        cdai.totalBorrowsCurrent(),
        cusdc.supplyRatePerBlock(),
        cusdc.borrowRatePerBlock(),
        cusdc.getCash(),
        cusdc.totalBorrowsCurrent(),
        comptroller.compSpeeds(CDAI_ADDRESSES[chainId]),
        comptroller.compSpeeds(CUSDC_ADDRESSES[chainId]),
        ...(chainId === 1 ? [oracle.price('COMP')] : []),
      ])
        .then(([
          daiBalances,
          usdcBalances,
          totalSupply,
          cdaiSupplyRatePerBlock,
          cdaiBorrowRatePerBlock,
          cdaiCash,
          cdaiTotalBorrow,
          cusdcSupplyRatePerBlock,
          cusdcBorrowRatePerBlock,
          cusdcCash,
          cusdcTotalBorrow,
          cdaiCompSpeed,
          cusdcCompSpeed,
          compPrice = 170,
        ]) => {
          const cdaiSupplyAPY = calculateAPY(cdaiSupplyRatePerBlock)
          const cdaiBorrowAPY = calculateAPY(cdaiBorrowRatePerBlock)
          const cusdcSupplyAPY = calculateAPY(cusdcSupplyRatePerBlock)
          const cusdcBorrowAPY = calculateAPY(cusdcBorrowRatePerBlock)

          const cdaiSupplyCompAPY = calculateCompAPY(cdaiCash.add(cdaiTotalBorrow), 18, cdaiCompSpeed, compPrice)
          const cdaiBorrowCompAPY = calculateCompAPY(cdaiTotalBorrow, 18, cdaiCompSpeed, compPrice)
          const cusdcSupplyCompAPY = calculateCompAPY(cusdcCash.add(cusdcTotalBorrow), 6, cusdcCompSpeed, compPrice)
          const cusdcBorrowCompAPY = calculateCompAPY(cusdcTotalBorrow, 6, cusdcCompSpeed, compPrice)

          if (!stale) {
            update(
              chainId,
              daiBalances[0].sub(daiBalances[1]),
              usdcBalances[0].sub(usdcBalances[1]),
              totalSupply,
              cdaiSupplyAPY,
              cdaiBorrowAPY,
              cdaiSupplyCompAPY,
              cdaiBorrowCompAPY,
              cusdcSupplyAPY,
              cusdcBorrowAPY,
              cusdcSupplyCompAPY,
              cusdcBorrowCompAPY,
              globalBlockNumber,
            )
          }
        })
        .catch((e) => {
          console.log(e)
          if (!stale) {
            update(chainId, null, null, null, null, null, null, null, null, null, globalBlockNumber)
          }
        })
    }

    return () => {
      stale = true
    }
  }, [
    blockNumber,
    chainId,
    exchangeAddress,
    globalBlockNumber,
    library,
    update,
  ])

  return {
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
  }
}
