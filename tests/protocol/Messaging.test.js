/**
 * 消息传递 测试
 */

const Messaging = require('../../src/protocol/Messaging');

describe('Messaging', () => {
  it('should be defined', () => {
    expect(Messaging).toBeDefined();
  });
  
  it('should create instance', () => {
    const instance = new Messaging();
    expect(instance).toBeInstanceOf(Messaging);
  });
});
