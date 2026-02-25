/**
 * 消息格式 测试
 */

const Message = require('../../src/core/Message');

describe('Message', () => {
  it('should be defined', () => {
    expect(Message).toBeDefined();
  });
  
  it('should create instance', () => {
    const instance = new Message();
    expect(instance).toBeInstanceOf(Message);
  });
});
