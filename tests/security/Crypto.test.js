/**
 * 加密模块 测试
 */

const Crypto = require('../../src/security/Crypto');

describe('Crypto', () => {
  it('should be defined', () => {
    expect(Crypto).toBeDefined();
  });
  
  it('should create instance', () => {
    const instance = new Crypto();
    expect(instance).toBeInstanceOf(Crypto);
  });
});
