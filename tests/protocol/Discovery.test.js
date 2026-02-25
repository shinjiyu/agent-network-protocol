/**
 * 节点发现协议 测试
 */

const Discovery = require('../../src/protocol/Discovery/Discovery');

describe('Discovery', () => {
  it('should be defined', () => {
    expect(Discovery).toBeDefined();
  });
  
  it('should create instance', () => {
    const instance = new Discovery();
    expect(instance).toBeInstanceOf(Discovery);
  });
});
