export class Contract {
  get address() {
    return this._address;
  }

  get abi() {
    return this._abi;
  }

  get functions() {
    return this._functions;
  }

  constructor(address, abi) {
    this._address = address;
    this._abi = abi;

    this._functions = abi.filter(x => x.type === 'function');
    const callFunctions = this._functions;

    for (const callFunction of callFunctions) {
      const { name } = callFunction;
      const getCall = makeCallFunction(this, name);
      if (!this[name]) {
        defineReadOnly(this, name, getCall);
      }
    }
  }
}

function makeCallFunction(contract, name) {
  return (...params: any[]) => {
    const { address } = contract;
    const { inputs } = contract.functions.find(f => f.name === name);
    const { outputs } = contract.functions.find(f => f.name === name);
    return {
      contract: {
        address,
      },
      name,
      inputs,
      outputs,
      params,
    };
  };
}

function defineReadOnly(object, name, value) {
  Object.defineProperty(object, name, {
    enumerable: true,
    value,
    writable: false,
  });
}
