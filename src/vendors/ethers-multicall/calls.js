import { multicallAbi } from './abi/multicall';
import { Contract } from './contract';

export function getEthBalance(address, multicallAddress) {
  const multicall = new Contract(multicallAddress, multicallAbi);
  return multicall.getEthBalance(address);
}
