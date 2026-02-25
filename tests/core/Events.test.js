/**
 * 事件系统 测试
 */

const Events = require('../../src/core/Events/Events');

describe('Events', () => {
  it('should be defined', () => {
    expect(Events).toBeDefined();
  });
  
  it('should create instance', () => {
    const instance = new Events();
    expect(instance).toBeInstanceOf(Events);
  });
});
