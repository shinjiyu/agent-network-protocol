/**
 * Message - 消息格式
 */

const crypto = require('crypto');

class Message {
  constructor(options = {}) {
    this.id = options.id || this.generateId();
    this.from = options.from || null;
    this.to = options.to || null;
    this.type = options.type || 'message';
    this.payload = options.payload || {};
    this.timestamp = options.timestamp || Date.now();
    this.signature = options.signature || null;
    this.ttl = options.ttl || 10;
    this.lamportClock = options.lamportClock || 0;
  }
  
  generateId() {
    return crypto.randomBytes(16).toString('hex');
  }
  
  sign(privateKey) {
    const data = this.serialize();
    this.signature = crypto
      .createSign('sha256')
      .update(data)
      .sign(privateKey, 'hex');
    return this;
  }
  
  verify(publicKey) {
    if (!this.signature) {
      return false;
    }
    
    const data = this.serialize();
    return crypto
      .createVerify('sha256')
      .update(data)
      .verify(publicKey, this.signature, 'hex');
  }
  
  serialize() {
    return JSON.stringify({
      id: this.id,
      from: this.from,
      to: this.to,
      type: this.type,
      payload: this.payload,
      timestamp: this.timestamp,
      ttl: this.ttl,
      lamportClock: this.lamportClock
    });
  }
  
  static deserialize(str) {
    const data = JSON.parse(str);
    return new Message(data);
  }
  
  toJSON() {
    return {
      id: this.id,
      from: this.from,
      to: this.to,
      type: this.type,
      payload: this.payload,
      timestamp: this.timestamp,
      signature: this.signature,
      ttl: this.ttl,
      lamportClock: this.lamportClock
    };
  }
  
  static createBroadcast(from, type, payload) {
    return new Message({
      from,
      to: 'broadcast',
      type,
      payload
    });
  }
  
  static createDirect(from, to, type, payload) {
    return new Message({
      from,
      to,
      type,
      payload
    });
  }
}

module.exports = Message;
