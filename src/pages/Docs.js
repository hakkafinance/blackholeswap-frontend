import React from 'react'
import styled from 'styled-components'
import { useWeb3React } from '../hooks/ethereum'
import { getEtherscanLink } from '../utils/index'
import { EXCHANGE_ADDRESSES } from '../constants'
import docsImage from '../assets/docs.png'

const Container = styled.div``

const Image = styled.img`
  width: 100%;
  margin: 32px auto;
`

const Content = styled.div`
  padding: 24px;
  background-color: ${({ theme }) => theme.colors.gray700};
`

const Paragraph = styled.p`
  font-size: 16px;
  font-size: 500;
  color: ${({ theme }) => theme.colors.white};
`

const Bold = styled.span`
  font-weight: 600;
`

const Link = styled.a`
  color: ${({ theme }) => theme.colors.blue300};
`

export default function Docs() {
  const { chainId } = useWeb3React()

  return (
    <Container>
      <Image src={docsImage} alt='description' />
      <Content>
        <Paragraph>
          BlackHoleSwap is a decentralized AMM (Automatic Market Making)
          exchange designed for stablecoins. By integrating lending protocols to
          leverage the excess supply while borrowing on the inadequate side, It
          can therefore process transactions far exceeding its existing
          liquidity. Compared to other AMMs, BlackHoleSwap provides nearly
          infinite liquidity with the lowest price slippage, maximizing capital
          utilization.
        </Paragraph>
        <Paragraph>
          <Bold>Contract Address: </Bold>
          <Link
            href={getEtherscanLink(
              chainId,
              EXCHANGE_ADDRESSES[chainId],
              'address',
            )}
            target='_blank'
            rel='noopener noreferrer'
          >
            {EXCHANGE_ADDRESSES[chainId]}
          </Link>
        </Paragraph>
        <Paragraph>
          <Link
            href='https://blackholeswap.com/documents/en.pdf'
            target='_blank'
            rel='noopener noreferrer'
          >
            WhitePaper
          </Link>
        </Paragraph>
      </Content>
    </Container>
  )
}
