import { NetworkConnector } from './NetworkConnector'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'

const POLLING_INTERVAL = 8000

const RPC_URLS = {
  1: process.env.REACT_APP_ETHEREUM_PROVIDER || '',
  42: `https://kovan.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
}

export let defaultChainId = 1
const supportedChainIds = [1, 42]

if (process.env.NODE_ENV === 'development') {
  // supportedChainIds.push(42)
  defaultChainId = 1
  RPC_URLS[1] = `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`
}

export const injected = new InjectedConnector({
  supportedChainIds,
})

export const network = new NetworkConnector({
  urls: { 1: RPC_URLS[1], 42: RPC_URLS[42] },
  defaultChainId,
  pollingInterval: POLLING_INTERVAL,
})

export const walletconnect = new WalletConnectConnector({
  rpc: { 1: RPC_URLS[1] },
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
  pollingInterval: POLLING_INTERVAL,
})
