import React, { useState, useCallback, useEffect } from 'react'
import { useWeb3React, UnsupportedChainIdError } from '@web3-react/core'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import styled from 'styled-components'
import Dialog from './Dialog'
import { injected, walletconnect } from '../connectors'
import { useAllTransactions } from '../contexts/Transactions'
import {
  shortenAddress,
  shortenTransactionHash,
  getNetworkName,
  getEtherscanLink
} from '../utils'
import { ReactComponent as AccountIcon } from '../assets/account.svg'
import metamaskImage from '../assets/metamask.png'
import walletconnectImage from '../assets/walletconnect.png'

const StatusButton = styled.button`
  min-width: 120px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.colors.white};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.white};
  font-size: 14px;
  font-weight: 400;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  ${({ theme }) => theme.mediaQuery.md`
    min-width: 160px;
    font-size: 20px;
  `}
`

const Title = styled.h1`
  margin: 0;
  margin-bottom: 28px;
  color: ${({ theme }) => theme.colors.white};
  font-size: 20px;
  font-weight: 700;
`

const SubTitle = styled.p`
  margin: 0;
  margin-bottom: 4px;
  color: ${({ theme }) => theme.colors.white};
  font-size: 16px;
  font-weight: 500;
`

const CenterTitle = styled(Title)`
  text-align: center;
`

const LoginButtonGroup = styled.menu`
  margin: 0;
  padding: 0 20px;

  > *:not(:first-child) {
    margin-top: 14px;
  }
`

const LoginButton = styled.button.attrs(() => ({ type: 'button' }))`
  width: 100%;
  height: 56px;
  border: 4px solid;
  border-top-color: ${({ theme }) => theme.colors.gray300};
  border-left-color: ${({ theme }) => theme.colors.gray300};
  border-right-color: ${({ theme }) => theme.colors.gray700};
  border-bottom-color: ${({ theme }) => theme.colors.gray700};
  background-color: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.black};
  font-size: 15px;
  font-weight: 700;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  > img {
    margin-right: 8px;
    width: 20px;
    height: 20px;
  }
`

const ChangeWalletButton = styled.button.attrs({ type: 'button' })`
  height: 30px;
  padding: 0 16px;
  border: 1px solid;
  border-top-color: ${({ theme }) => theme.colors.gray300};
  border-left-color: ${({ theme }) => theme.colors.gray300};
  border-right-color: ${({ theme }) => theme.colors.gray700};
  border-bottom-color: ${({ theme }) => theme.colors.gray700};
  background-color: ${({ theme }) => theme.colors.gray500};
  color: ${({ theme }) => theme.colors.white};
  font-size: 15px;
  font-weight: 700;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
`

const WalletSection = styled.section`
  padding: 4px 28px 36px 28px;
`

const TransactionSection = styled.section`
  padding: 32px 36px;
  background-color: ${({ theme }) => theme.colors.gray900};
`

const TransactionTitle = styled.h1`
  margin: 0;
  margin-bottom: 24px;
  color: ${({ theme }) => theme.colors.gray300};
  font-size: 16px;
  font-weight: 500;
`

const TransactionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:not(:first-child) {
    margin-top: 20px;
  }
`

const TransactionHash = styled.a`
  color: ${({ theme }) => theme.colors.white};
  font-size: 14px;
  font-weight: 500;
`

const TransactionStatus = styled.div`
  color: ${({ theme }) => theme.colors.white};
  font-size: 14px;
  font-weight: 500;
`

const StyledAccountIcon = styled(AccountIcon)`
  margin-bottom: 20px;
`

export default function Web3Status() {
  const { chainId, account, error, active, activate, connector } = useWeb3React()

  const transactions = useAllTransactions()

  const [isShowConnectors, setIsShowConnectors] = useState(true)
  useEffect(() => {
    if (account) {
      setIsShowConnectors(false)
    } else {
      setIsShowConnectors(true)
    }
  }, [account])

  const [isOpen, setIsOpen] = useState(false)
  const toggleIsOpen = useCallback(() => {
    setIsOpen(!isOpen)
    setIsShowConnectors(false)
  }, [isOpen])

  const connectInjected = useCallback(async () => {
    try {
      await activate(injected, undefined, true)
      toggleIsOpen(false)
      setIsShowConnectors(false)
    } catch (err) {
      console.error(err)
    }
  }, [activate, toggleIsOpen])

  const connectWalletConnect = useCallback(async () => {
    if (connector instanceof WalletConnectConnector && connector.walletConnectProvider?.wc?.uri) {
      connector.walletConnectProvider = undefined
    }

    try {
      await activate(walletconnect)
      toggleIsOpen(false)
      setIsShowConnectors(false)
    } catch (err) {
      console.error(err)
    }
  
  }, [activate, connector, toggleIsOpen])

  const renderButtonText = () => {
    if (account) {
      return shortenAddress(account)
    } else if (error instanceof UnsupportedChainIdError) {
      return 'UNSUPPORTED NETWORK'
    } else {
      return 'LOGIN'
    }
  }

  return (
    <>
      <StatusButton onClick={toggleIsOpen}>{renderButtonText()}</StatusButton>
      <Dialog isOpen={isOpen} onDismiss={toggleIsOpen}>
        {!active || isShowConnectors ? (
          <WalletSection>
            <CenterTitle>Connect Your Wallet</CenterTitle>
            <LoginButtonGroup>
              <LoginButton onClick={connectInjected}>
                <img src={metamaskImage} alt='metamask' />
                METAMASK
              </LoginButton>
              <LoginButton onClick={connectWalletConnect}>
                <img src={walletconnectImage} alt='walletconnect' />
                WALLET CONNECT
              </LoginButton>
            </LoginButtonGroup>
          </WalletSection>
        ) : (
          <>
            <WalletSection>
              <StyledAccountIcon />
              <SubTitle>{getNetworkName(chainId)}</SubTitle>
              <Title>{shortenAddress(account)}</Title>
              <ChangeWalletButton
                onClick={() => setIsShowConnectors(true)}
              >
                Change Walllet
              </ChangeWalletButton>
            </WalletSection>
            <TransactionSection>
              <TransactionTitle>Transaction History</TransactionTitle>
              {Object.keys(transactions).map(hash => (
                <TransactionItem key={hash}>
                  <TransactionHash
                    href={getEtherscanLink(chainId, hash, 'transaction')}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    {shortenTransactionHash(hash)}
                  </TransactionHash>
                  <TransactionStatus>{!!transactions[hash].receipt ? 'Confirm' : 'Pending'}</TransactionStatus>
                </TransactionItem>
              ))}
            </TransactionSection>
          </>
        )}
      </Dialog>
    </>
  )
}
