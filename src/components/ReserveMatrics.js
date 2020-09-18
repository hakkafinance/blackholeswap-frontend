import React, { useMemo } from 'react'
import styled from 'styled-components'
import { ethers } from 'ethers'
import { amountFormatter, percentageFormatter } from '../utils'

const Card = styled.div`
  margin-top: 24px;
  padding: 32px 40px;
  border: 4px solid ${({ theme }) => theme.colors.gray500};
  background-color: ${({ theme }) => theme.colors.black};
`

const Article = styled.article`
  &:not(:first-child) {
    margin-top: 12px;
  }
`

const Title = styled.div`
  margin-bottom: 8px;
  color: ${({ theme }) => theme.colors.white};
  font-size: 18px;
  font-weight: 500;
`

const Text = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.white};
  font-size: 14px;
  font-weight: 500;
`

const Divider = styled.div`
  margin: 16px 0;
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.colors.white};
`

export default function ReserveMatrics(props) {
  const {
    hasAccount = false,
    daiBalance,
    usdcBalance,
    bhsBalance,
    daiReserve,
    usdcReserve,
    daiSupplyAPY,
    daiBorrowAPY,
    daiSupplyCompAPY,
    daiBorrowCompAPY,
    usdcSupplyAPY,
    usdcBorrowAPY,
    usdcSupplyCompAPY,
    usdcBorrowCompAPY,
    totalSupply,
  } = props

  const price = useMemo(() => {
    if (daiReserve && usdcReserve && totalSupply) {
      if (totalSupply.isZero()) {
        return ethers.constants.Zero
      }
      return daiReserve
        .add(usdcReserve)
        .mul(ethers.constants.WeiPerEther)
        .div(totalSupply)
    }
  }, [daiReserve, totalSupply, usdcReserve])

  const netAPY = useMemo(() => {
    if (
      daiReserve &&
      daiSupplyAPY &&
      daiBorrowAPY &&
      usdcReserve &&
      usdcSupplyAPY &&
      usdcBorrowAPY
    ) {
      const totalReserve = daiReserve.add(usdcReserve)
      const daiYield = daiReserve.mul(daiReserve.lt(ethers.constants.Zero) ? daiBorrowAPY : daiSupplyAPY)
      const usdcYield = usdcReserve.mul(usdcReserve.lt(ethers.constants.Zero) ? usdcBorrowAPY : usdcSupplyAPY)
      return daiYield.add(usdcYield).div(totalReserve)
    }
  }, [daiBorrowAPY, daiReserve, daiSupplyAPY, usdcBorrowAPY, usdcReserve, usdcSupplyAPY])

  const compAPY = useMemo(() => {
    if (
      daiReserve &&
      daiSupplyCompAPY &&
      daiBorrowCompAPY &&
      usdcReserve &&
      usdcSupplyCompAPY &&
      usdcBorrowCompAPY
    ) {
      const totalReserve = daiReserve.add(usdcReserve)
      const daiYield = daiReserve.mul(daiReserve.lt(ethers.constants.Zero) ? daiBorrowCompAPY : daiSupplyCompAPY)
      const usdcYield = usdcReserve.mul(usdcReserve.lt(ethers.constants.Zero) ? usdcBorrowCompAPY : usdcSupplyCompAPY)
      return daiYield.add(usdcYield).div(totalReserve)
    }
  }, [daiBorrowCompAPY, daiReserve, daiSupplyCompAPY, usdcBorrowCompAPY, usdcReserve, usdcSupplyCompAPY])

  return (
    <Card>
      {hasAccount && (
        <>
          <Title>Your Portfolio</Title>
          <Article>
            <Text>DAI: {daiBalance ? amountFormatter(daiBalance, 18) : '-'}</Text>
            <Text>USDC: {usdcBalance ? amountFormatter(usdcBalance, 6) : '-'}</Text>
            <Text>Position: {bhsBalance ? amountFormatter(bhsBalance, 18) : '-'}</Text>
          </Article>
          <Divider />
        </>
      )}
      <Title>Currency Reserves</Title>
      <Article>
        <Text>DAI : {daiReserve ? amountFormatter(daiReserve, 18) : '-'}</Text>
        <Text>USDC: {usdcReserve ? amountFormatter(usdcReserve, 18) : '-'}</Text>
      </Article>
      <Article>
        <Text>Virtual Price: {price ? amountFormatter(price, 18) : '-'}</Text>
      </Article>
      <Article>
        <Text>Lending APY: {netAPY ? percentageFormatter(netAPY, 18) : '-'} (+{percentageFormatter(compAPY, 18)} COMP)</Text>
      </Article>
    </Card>
  )
}
