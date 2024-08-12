import {describe} from 'mocha';
import {expect} from "chai";
import {fromSmartContractDecimals, toSmartContractDecimals} from "../../../src";


describe(`Numbers utilities`, () => {
  it(`respects small numbers because javascript`, () => {
    const value = toSmartContractDecimals(`104999.999999999999999`, 18);
    expect(fromSmartContractDecimals(value)).to.be.eq(`104999.999999999999999000`);
  })

  it(`fails with type number because javascript`, () => {
    const value = toSmartContractDecimals(104999.999999999999999, 18);
    const transformed = fromSmartContractDecimals(value);
    expect(transformed).to.not.be.eq(`104999.999999999999999`);
    expect(transformed).to.be.eq(`105000.000000000000000000`);
  });
})