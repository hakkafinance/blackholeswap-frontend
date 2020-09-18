import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom'
import { Web3ReactProvider, createWeb3ReactRoot } from '@web3-react/core'
import { ethers } from 'ethers'

import ApplicationContextProvider, {
  Updater as ApplicationContextUpdater,
} from './contexts/Application'
import TransactionContextProvider, {
  Updater as TransactionContextUpdater,
} from './contexts/Transactions'
import TokensContextProvider from './contexts/Tokens'
import AllowancesContextProvider from './contexts/Allowances'
import BalancesContextProvider from './contexts/Balances'
import ExchangeContextProvider from './contexts/Exchange'
import SnackbarProvider from './contexts/Snackbar'
import Layout from './components/Layout'
import Web3Manager from './components/Web3Manager'
import ThemeProvider, { GlobalStyle } from './themes'
import { NetworkContextName } from './constants'

const Swap = lazy(() => import('./pages/Swap'))
const Deposit = lazy(() => import('./pages/Deposit'))
const Withdraw = lazy(() => import('./pages/Withdraw'))
const Docs = lazy(() => import('./pages/Docs'))

const Web3ReadOnlyProvider = createWeb3ReactRoot(NetworkContextName)

function getLibrary(provider) {
  const library = new ethers.providers.Web3Provider(provider)
  library.pollingInterval = 15000
  return library
}

function ContextProviders({ children }) {
  return (
    <ApplicationContextProvider>
      <TransactionContextProvider>
        <TokensContextProvider>
          <BalancesContextProvider>
            <AllowancesContextProvider>
              <ExchangeContextProvider>{children}</ExchangeContextProvider>
            </AllowancesContextProvider>
          </BalancesContextProvider>
        </TokensContextProvider>
      </TransactionContextProvider>
    </ApplicationContextProvider>
  )
}

function Updaters() {
  return (
    <>
      <ApplicationContextUpdater />
      <TransactionContextUpdater />
    </>
  )
}

function Router() {
  return (
    <BrowserRouter>
      <Layout>
        <Web3Manager>
          <Suspense fallback={null}>
            <Switch>
              <Route exact path='/swap'>
                <Swap />
              </Route>
              <Route exact path='/deposit'>
                <Deposit />
              </Route>
              <Route exact path='/withdraw'>
                <Withdraw />
              </Route>
              <Route exact path='/docs'>
                <Docs />
              </Route>
              <Redirect to='/swap' />
            </Switch>
          </Suspense>
        </Web3Manager>
      </Layout>
    </BrowserRouter>
  )
}

function App() {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <Web3ReadOnlyProvider getLibrary={getLibrary}>
        <ContextProviders>
          <Updaters />
          <ThemeProvider>
            <GlobalStyle />
            <SnackbarProvider>
              <Router />
            </SnackbarProvider>
          </ThemeProvider>
        </ContextProviders>
      </Web3ReadOnlyProvider>
    </Web3ReactProvider>
  )
}

export default App
