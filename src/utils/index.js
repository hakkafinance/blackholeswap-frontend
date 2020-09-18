import { ethers } from 'ethers'
import BigNumber from 'bignumber.js'
import UncheckedJsonRpcSigner from './signer'
import ERC20_ABI from '../constants/abis/erc20'
import ERC20_BYTES32_ABI from '../constants/abis/erc20_bytes32'

export const ERROR_CODES = [
  'TOKEN_NAME',
  'TOKEN_SYMBOL',
  'TOKEN_DECIMALS',
].reduce((accumulator, currentValue, currentIndex) => {
  accumulator[currentValue] = currentIndex
  return accumulator
}, {})

export function safeAccess(object, path) {
  return object
    ? path.reduce(
        (accumulator, currentValue) =>
          accumulator && accumulator[currentValue]
            ? accumulator[currentValue]
            : null,
        object,
      )
    : null
}

export function isAddress(address) {
  return ethers.utils.isAddress(address)
}

export function shortenAddress(address, digits = 4) {
  if (!isAddress(address)) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }
  return `${address.substring(0, digits + 2)}...${address.substring(
    42 - digits,
  )}`
}

export function shortenTransactionHash(hash, digits = 6) {
  return `${hash.substring(0, digits + 2)}...${hash.substring(66 - digits)}`
}

export function getNetworkName(networkId) {
  switch (networkId) {
    case 1: {
      return 'Main Network'
    }
    case 3: {
      return 'Ropsten'
    }
    case 4: {
      return 'Rinkeby'
    }
    case 5: {
      return 'Görli'
    }
    case 42: {
      return 'Kovan'
    }
    default: {
      return 'correct network'
    }
  }
}

const ETHERSCAN_PREFIXES = {
  1: '',
  3: 'ropsten.',
  4: 'rinkeby.',
  5: 'goerli.',
  42: 'kovan.',
}

export function getEtherscanLink(networkId, data, type) {
  const prefix = `https://${
    ETHERSCAN_PREFIXES[networkId] || ETHERSCAN_PREFIXES[1]
  }etherscan.io`

  switch (type) {
    case 'transaction': {
      return `${prefix}/tx/${data}`
    }
    case 'address':
    default: {
      return `${prefix}/address/${data}`
    }
  }
}

export async function getGasPrice() {
  const response = await fetch('https://ethgasstation.info/json/ethgasAPI.json')
  const data = await response.json()
  const gasPrice = new BigNumber(data.fast).div(10).times(1e9) // convert unit to wei
  return gasPrice
}

export function calculateGasMargin(value, margin) {
  const offset = value.mul(margin).div(ethers.BigNumber.from(10000))
  return value.add(offset)
}

// get the ether balance of an address
export async function getEtherBalance(address, library) {
  if (!isAddress(address)) {
    throw Error(`Invalid 'address' parameter '${address}'`)
  }
  return library.getBalance(address)
}

// account is optional
export function getProviderOrSigner(library, account) {
  return account
    ? new UncheckedJsonRpcSigner(library.getSigner(account))
    : library
}

// account is optional
export function getContract(address, abi, library, account) {
  if (!isAddress(address) || address === ethers.constants.AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }

  return new ethers.Contract(
    address,
    abi,
    getProviderOrSigner(library, account),
  )
}

// get token name
export async function getTokenName(tokenAddress, library) {
  if (!isAddress(tokenAddress)) {
    throw Error(`Invalid 'tokenAddress' parameter '${tokenAddress}'.`)
  }

  return getContract(tokenAddress, ERC20_ABI, library)
    .name()
    .catch(() =>
      getContract(tokenAddress, ERC20_BYTES32_ABI, library)
        .name()
        .then((bytes32) => ethers.utils.parseBytes32String(bytes32)),
    )
    .catch((error) => {
      error.code = ERROR_CODES.TOKEN_SYMBOL
      throw error
    })
}

// get token symbol
export async function getTokenSymbol(tokenAddress, library) {
  if (!isAddress(tokenAddress)) {
    throw Error(`Invalid 'tokenAddress' parameter '${tokenAddress}'.`)
  }

  return getContract(tokenAddress, ERC20_ABI, library)
    .symbol()
    .catch(() => {
      const contractBytes32 = getContract(
        tokenAddress,
        ERC20_BYTES32_ABI,
        library,
      )
      return contractBytes32
        .symbol()
        .then((bytes32) => ethers.utils.parseBytes32String(bytes32))
    })
    .catch((error) => {
      error.code = ERROR_CODES.TOKEN_SYMBOL
      throw error
    })
}

// get token decimals
export async function getTokenDecimals(tokenAddress, library) {
  if (!isAddress(tokenAddress)) {
    throw Error(`Invalid 'tokenAddress' parameter '${tokenAddress}'.`)
  }

  return getContract(tokenAddress, ERC20_ABI, library)
    .decimals()
    .catch((error) => {
      error.code = ERROR_CODES.TOKEN_DECIMALS
      throw error
    })
}

// get the token balance of an address
export async function getTokenBalance(tokenAddress, address, library) {
  if (!isAddress(tokenAddress) || !isAddress(address)) {
    throw Error(
      `Invalid 'tokenAddress' or 'address' parameter '${tokenAddress}' or '${address}'.`,
    )
  }

  return getContract(tokenAddress, ERC20_ABI, library).balanceOf(address)
}

// get the token allowance
export async function getTokenAllowance(
  address,
  tokenAddress,
  spenderAddress,
  library,
) {
  if (
    !isAddress(address) ||
    !isAddress(tokenAddress) ||
    !isAddress(spenderAddress)
  ) {
    throw Error(
      "Invalid 'address' or 'tokenAddress' or 'spenderAddress' parameter" +
        `'${address}' or '${tokenAddress}' or '${spenderAddress}'.`,
    )
  }

  return getContract(tokenAddress, ERC20_ABI, library).allowance(
    address,
    spenderAddress,
  )
}

export function amountFormatter(amount, baseDecimals, displayDecimals = 4) {
  if (
    baseDecimals > 18 ||
    displayDecimals > 18 ||
    displayDecimals > baseDecimals
  ) {
    throw Error(
      `Invalid combination of baseDecimals '${baseDecimals}' and displayDecimals '${displayDecimals}.`,
    )
  }

  if (!amount) {
    return undefined
  }

  if (amount.isZero()) {
    return '0'
  }

  return new BigNumber(amount.toString())
    .div(new BigNumber(10).pow(new BigNumber(baseDecimals)))
    .toFixed(displayDecimals, BigNumber.ROUND_DOWN)
}

export function percentageFormatter(amount, baseDecimals, displayDecimals = 2) {
  if (baseDecimals > 18 || displayDecimals > 18) {
    throw Error(
      `Invalid combination of baseDecimals '${baseDecimals}' and displayDecimals '${displayDecimals}.`,
    )
  }

  if (!amount || !ethers.BigNumber.isBigNumber(amount)) {
    return undefined
  }

  if (amount.isZero()) {
    return '0'
  }

  const percentage = (Number.parseFloat(ethers.utils.formatUnits(amount, baseDecimals)) * 100).toFixed(displayDecimals)

  return `${percentage} %`
}
