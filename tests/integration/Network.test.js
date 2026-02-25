/**
 * 网络集成 测试
 */

const Network = require('../../src/Network');

describe('Network', () => {
  it('should be defined', () => {
    expect(Network).toBeDefined();
  });
  
  it('should create instance', () => {
    const instance = new Network();
    expect(instance).toBeInstanceOf(Network);
  });
});
