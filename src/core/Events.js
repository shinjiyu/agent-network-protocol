/**
 * Events - 事件系统
 */

const EventEmitter = require('events');

class EventManager extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }
  
  // 异步发送事件
  emitAsync(event, ...args) {
    setImmediate(() => {
      this.emit(event, ...args);
    });
  }
  
  // 等待事件
  waitFor(event, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Timeout waiting for event: ' + event));
      }, timeout);
      
      this.once(event, (...args) => {
        clearTimeout(timer);
        resolve(args);
      });
    });
  }
  
  // 批量监听
  onMultiple(events, listener) {
    events.forEach(event => {
      this.on(event, listener);
    });
    
    return () => {
      events.forEach(event => {
        this.off(event, listener);
      });
    };
  }
}

// 全局事件类型
const EventTypes = {
  // 节点事件
  NODE_STARTED: 'node:started',
  NODE_STOPPED: 'node:stopped',
  NODE_ERROR: 'node:error',
  
  // 对等节点事件
  PEER_CONNECTED: 'peer:connected',
  PEER_DISCONNECTED: 'peer:disconnected',
  PEER_FAILURE: 'peer:failure',
  
  // 消息事件
  MESSAGE_RECEIVED: 'message:received',
  MESSAGE_SENT: 'message:sent',
  MESSAGE_FAILED: 'message:failed',
  
  // DHT 事件
  DHT_PUT: 'dht:put',
  DHT_GET: 'dht:get',
  DHT_NODE_ADDED: 'dht:node:added',
  DHT_NODE_REMOVED: 'dht:node:removed',
  
  // Gossip 事件
  GOSSIP_RECEIVED: 'gossip:received',
  GOSSIP_PROPAGATED: 'gossip:propagated',
  
  // 心跳事件
  HEARTBEAT: 'heartbeat',
  HEARTBEAT_TIMEOUT: 'heartbeat:timeout'
};

module.exports = { EventManager, EventTypes };
