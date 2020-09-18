import React from 'react'
import styled from 'styled-components'

const Banner = styled.div`
  margin-bottom: 24px;
  padding: 12px;
  border: 1px dashed ${({ theme }) => theme.colors.orange};
  background-color: ${({ theme }) => theme.colors.gray700};
`

const Text = styled.p`
  margin: 4px 0;
  color: ${({ theme }) => theme.colors.orange};
  font-size: 14px;
  font-weight: 500;
`

export default function WarningMessage(props) {
  return (
    <Banner>
      <Text>
        <span role='img' aria-label='warning'>
          ⚠️
        </span>{' '}
        Please use it at your own risks.
      </Text>
    </Banner>
  )
}
