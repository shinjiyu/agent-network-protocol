/**
 * 事件系统 测试
 */

const { EventManager, EventTypes } = require('../../src/core/Events');

describe('Events', () => {
  it('should be defined', () => {
    expect(EventManager).toBeDefined();
    expect(EventTypes).toBeDefined();
  });
  
  it('should create instance', () => {
    const instance = new EventManager();
    expect(instance).toBeInstanceOf(EventManager);
  });
  
  it('should emit and receive events', (done) => {
    const events = new EventManager();
    events.on('test', (data) => {
      expect(data).toBe('hello');
      done();
    });
    events.emit('test', 'hello');
  });
  
  it('should have event types defined', () => {
    expect(EventTypes.NODE_STARTED).toBe('node:started');
    expect(EventTypes.PEER_CONNECTED).toBe('peer:connected');
    expect(EventTypes.MESSAGE_RECEIVED).toBe('message:received');
  });
});
