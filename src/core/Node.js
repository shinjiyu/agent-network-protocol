/**
 * Node - 核心节点类
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class Node extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // 节点身份
    this.id = options.id || this.generateId();
    this.keyPair = options.keyPair || null;
    this.address = options.address || '0.0.0.0:8080';
    
    // 节点能力
    this.capabilities = options.capabilities || [];
    
    // 网络状态
    this.peers = new Map();
    this.status = 'offline';
    this.startTime = null;
    
    // 统计信息
    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      bytesSent: 0,
      bytesReceived: 0
    };
    
    // 配置
    this.config = {
      heartbeatInterval: 30000,
      heartbeatTimeout: 90000,
      maxPeers: 100,
      ...options.config
    };
    
    // 心跳定时器
    this.heartbeatTimer = null;
  }
  
  generateId() {
    return crypto.randomBytes(32).toString('hex');
  }
  
  async start() {
    if (this.status !== 'offline') {
      throw new Error('Node is already running');
    }
    
    this.status = 'online';
    this.startTime = Date.now();
    
    // 启动心跳
    this.startHeartbeat();
    
    this.emit('started', { id: this.id, address: this.address });
    
    return true;
  }
  
  async stop() {
    if (this.status === 'offline') {
      return;
    }
    
    this.status = 'offline';
    
    // 停止心跳
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    // 断开所有连接
    await this.disconnectAll();
    
    this.emit('stopped', { id: this.id });
  }
  
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.checkPeers();
      this.emit('heartbeat', { id: this.id, timestamp: Date.now() });
    }, this.config.heartbeatInterval);
  }
  
  checkPeers() {
    const now = Date.now();
    for (const [peerId, peer] of this.peers) {
      if (now - peer.lastSeen > this.config.heartbeatTimeout) {
        this.handlePeerFailure(peerId);
      }
    }
  }
  
  handlePeerFailure(peerId) {
    this.peers.delete(peerId);
    this.emit('peer:disconnected', { peerId });
  }
  
  async connect(peer) {
    if (this.peers.has(peer.id)) {
      return;
    }
    
    if (this.peers.size >= this.config.maxPeers) {
      throw new Error('Max peers reached');
    }
    
    this.peers.set(peer.id, {
      ...peer,
      lastSeen: Date.now()
    });
    
    this.emit('peer:connected', { peerId: peer.id });
  }
  
  async disconnect(peerId) {
    if (!this.peers.has(peerId)) {
      return;
    }
    
    this.peers.delete(peerId);
    this.emit('peer:disconnected', { peerId });
  }
  
  async disconnectAll() {
    const peerIds = Array.from(this.peers.keys());
    for (const peerId of peerIds) {
      await this.disconnect(peerId);
    }
  }
  
  async send(peerId, message) {
    if (!this.peers.has(peerId)) {
      throw new Error('Peer ' + peerId + ' not connected');
    }
    
    const peer = this.peers.get(peerId);
    peer.lastSeen = Date.now();
    
    this.stats.messagesSent++;
    this.stats.bytesSent += JSON.stringify(message).length;
    
    this.emit('message:sent', { peerId, message });
    
    return true;
  }
  
  async receive(message, fromPeerId) {
    if (!this.peers.has(fromPeerId)) {
      throw new Error('Peer ' + fromPeerId + ' not connected');
    }
    
    const peer = this.peers.get(fromPeerId);
    peer.lastSeen = Date.now();
    
    this.stats.messagesReceived++;
    this.stats.bytesReceived += JSON.stringify(message).length;
    
    this.emit('message:received', { fromPeerId, message });
    
    return true;
  }
  
  getMetrics() {
    return {
      id: this.id,
      status: this.status,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      peers: this.peers.size,
      ...this.stats
    };
  }
}

module.exports = Node;
