import { ethers } from 'ethers';

export class Abi {
  static encode(name, inputs, params) {
    const functionSignature = getFunctionSignature(name, inputs);
    const functionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(functionSignature));
    const functionData = functionHash.substring(2, 10);
    const abiCoder = new ethers.utils.AbiCoder();
    const argumentString = abiCoder.encode(inputs, params);
    const argumentData = argumentString.substring(2);
    const inputData = `0x${functionData}${argumentData}`;
    return inputData;
  }

  static decode(outputs, data) {
    const abiCoder = new ethers.utils.AbiCoder();
    const params = abiCoder.decode(outputs, data);
    return params;
  }
}

function getFunctionSignature(name, inputs) {
  const types = [];
  for (const input of inputs) {
    if (input.type === 'tuple') {
      const tupleString = getFunctionSignature('', input.components);
      types.push(tupleString);
      continue;
    }
    if (input.type === 'tuple[]') {
      const tupleString = getFunctionSignature('', input.components);
      const arrayString = `${tupleString}[]`;
      types.push(arrayString);
      continue;
    }
    types.push(input.type);
  }
  const typeString = types.join(',');
  const functionSignature = `${name}(${typeString})`;
  return functionSignature;
}
