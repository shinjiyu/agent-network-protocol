/**
 * Gossip 协议 测试
 */

const Gossip = require('../../src/protocol/Gossip/Gossip');

describe('Gossip', () => {
  it('should be defined', () => {
    expect(Gossip).toBeDefined();
  });
  
  it('should create instance', () => {
    const instance = new Gossip();
    expect(instance).toBeInstanceOf(Gossip);
  });
});
