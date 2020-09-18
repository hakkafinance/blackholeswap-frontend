import { ethers } from 'ethers'

export function calculateSlippageBounds(value, allowedSlippage) {
  if (value) {
    const abs = value.abs()
    const offset = abs.mul(allowedSlippage).div(ethers.BigNumber.from(10000))
    const minimum = abs.sub(offset)
    const maximum = abs.add(offset)
    return {
      minimum: minimum.lt(ethers.constants.Zero)
        ? ethers.constants.Zero
        : minimum,
      maximum: maximum.gt(ethers.constants.MaxUint256)
        ? ethers.constants.MaxUint256
        : maximum,
    }
  } else {
    return {}
  }
}

export function calculateExchangeRate(
  inputValue,
  inputDecimals,
  outputValue,
  outputDecimals,
) {
  try {
    if (
      inputValue &&
      (inputDecimals || inputDecimals === 0) &&
      outputValue &&
      (outputDecimals || outputDecimals === 0)
    ) {
      return outputValue
        .mul(ethers.constants.WeiPerEther)
        .div(inputValue)
        .mul(ethers.BigNumber.from(10).pow(inputDecimals))
        .div(ethers.BigNumber.from(10).pow(outputDecimals))
    }
  } catch {}
}
