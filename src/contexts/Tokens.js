import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  useEffect,
} from 'react'

import { useWeb3React } from '../hooks/ethereum'
import {
  safeAccess,
  isAddress,
  getTokenName,
  getTokenSymbol,
  getTokenDecimals,
} from '../utils'

const NAME = 'name'
const SYMBOL = 'symbol'
const DECIMALS = 'decimals'

const UPDATE = 'UPDATE'

const INITIAL_TOKENS_CONTEXT = {
  1: {
    '0x6B175474E89094C44Da98b954EedeAC495271d0F': {
      [NAME]: 'Dai Stablecoin',
      [SYMBOL]: 'DAI',
      [DECIMALS]: 18,
    },
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': {
      [NAME]: 'USD//C',
      [SYMBOL]: 'USDC',
      [DECIMALS]: 6,
    },
  },
  42: {
    '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa': {
      [NAME]: 'Dai Stablecoin',
      [SYMBOL]: 'DAI',
      [DECIMALS]: 18,
    },
    '0xb7a4F3E9097C08dA09517b5aB877F7a917224ede': {
      [NAME]: 'USD//C',
      [SYMBOL]: 'USDC',
      [DECIMALS]: 6,
    },
  },
}

const TokensContext = createContext()

function useTokensContext() {
  return useContext(TokensContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { chainId, tokenAddress, name, symbol, decimals } = payload
      return {
        ...state,
        [chainId]: {
          ...(safeAccess(state, [chainId]) || {}),
          [tokenAddress]: {
            [NAME]: name,
            [SYMBOL]: symbol,
            [DECIMALS]: decimals,
          },
        },
      }
    }
    default: {
      throw Error(`Unexpected action type in TokensContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_TOKENS_CONTEXT)

  const update = useCallback(
    (chainId, tokenAddress, name, symbol, decimals, exchangeAddress) => {
      dispatch({
        type: UPDATE,
        payload: {
          chainId,
          tokenAddress,
          name,
          symbol,
          decimals,
          exchangeAddress,
        },
      })
    },
    [],
  )

  return (
    <TokensContext.Provider
      value={useMemo(() => [state, { update }], [state, update])}
    >
      {children}
    </TokensContext.Provider>
  )
}

export function useTokenDetails(tokenAddress) {
  const { chainId, library } = useWeb3React()

  const [state, { update }] = useTokensContext()
  const { [NAME]: name, [SYMBOL]: symbol, [DECIMALS]: decimals } =
    safeAccess(state, [chainId, tokenAddress]) || {}

  useEffect(() => {
    if (
      isAddress(tokenAddress) &&
      (name === undefined || symbol === undefined || decimals === undefined) &&
      (chainId || chainId === 0) &&
      library
    ) {
      let stale = false

      const namePromise = getTokenName(tokenAddress, library).catch(() => null)
      const symbolPromise = getTokenSymbol(tokenAddress, library).catch(
        () => null,
      )
      const decimalsPromise = getTokenDecimals(tokenAddress, library).catch(
        () => null,
      )

      Promise.all([namePromise, symbolPromise, decimalsPromise]).then(
        ([resolvedName, resolvedSymbol, resolvedDecimals]) => {
          if (!stale) {
            update(
              chainId,
              tokenAddress,
              resolvedName,
              resolvedSymbol,
              resolvedDecimals,
            )
          }
        },
      )
      return () => {
        stale = true
      }
    }
  }, [tokenAddress, name, symbol, decimals, chainId, library, update])

  return { name, symbol, decimals }
}

export function useAllTokenDetails() {
  const { chainId } = useWeb3React()

  const [state] = useTokensContext()

  return useMemo(() => ({ ...(safeAccess(state, [chainId]) || {}) }), [
    state,
    chainId,
  ])
}
