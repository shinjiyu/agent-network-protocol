/**
 * Messaging - 消息传递
 */

const crypto = require('crypto');
const EventEmitter = require('events');

class Messaging extends EventEmitter {
  constructor(options = {}) {
    super();
    this.nodeId = options.nodeId || crypto.randomBytes(32).toString('hex');
    this.peers = new Map();
    this.handlers = new Map();
    this.pendingAcks = new Map();
    this.retryInterval = options.retryInterval || 5000;
    this.maxRetries = options.maxRetries || 3;
  }

  async start() { this._startAckProcessor(); return Promise.resolve(); }
  async stop() { this._stopAckProcessor(); return Promise.resolve(); }

  connect(peerId, send) {
    this.peers.set(peerId, { id: peerId, send, connected: true, lastSeen: Date.now() });
    this.emit('peer:connected', peerId);
  }

  disconnect(peerId) {
    this.peers.delete(peerId);
    this.emit('peer:disconnected', peerId);
  }

  async send(peerId, type, payload, opts = {}) {
    const peer = this.peers.get(peerId);
    if (!peer?.connected) throw new Error(`Peer ${peerId} not connected`);
    const msg = { id: crypto.randomBytes(16).toString('hex'), type, payload, from: this.nodeId, to: peerId, timestamp: Date.now(), reliable: opts.reliable !== false };
    if (msg.reliable) this.pendingAcks.set(msg.id, { message: msg, retries: 0, lastSent: Date.now() });
    this._send(peer, msg);
    return msg.id;
  }

  async broadcast(type, payload) {
    const results = [];
    for (const [id, p] of this.peers) {
      if (p.connected) {
        try { results.push({ peerId: id, messageId: await this.send(id, type, payload) }); }
        catch (e) { results.push({ peerId: id, error: e.message }); }
      }
    }
    return results;
  }

  receive(raw) {
    const msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (msg.type === '_ack') { this.pendingAcks.delete(msg.payload.messageId); return; }
    if (msg.reliable) this._sendAck(msg);
    const peer = this.peers.get(msg.from);
    if (peer) peer.lastSeen = Date.now();
    this.emit('message', msg);
    this.handlers.get(msg.type)?.(msg);
  }

  onMessage(type, handler) { this.handlers.set(type, handler); return () => this.handlers.delete(type); }
  getConnectedPeers() { return [...this.peers.values()].filter(p => p.connected).map(p => p.id); }

  _send(peer, msg) {
    try { peer.send(JSON.stringify(msg)); this.emit('message:sent', msg); }
    catch (e) { this.emit('error', e, msg); }
  }

  _sendAck(msg) {
    const peer = this.peers.get(msg.from);
    if (peer) this._send(peer, { id: crypto.randomBytes(16).toString('hex'), type: '_ack', payload: { messageId: msg.id }, from: this.nodeId, to: msg.from, timestamp: Date.now() });
  }

  _startAckProcessor() {
    this.ackTimer = setInterval(() => {
      const now = Date.now();
      for (const [id, p] of this.pendingAcks) {
        if (now - p.lastSent >= this.retryInterval) {
          if (p.retries >= this.maxRetries) { this.pendingAcks.delete(id); this.emit('message:failed', p.message); }
          else { const peer = this.peers.get(p.message.to); if (peer?.connected) { this._send(peer, p.message); p.retries++; p.lastSent = now; } }
        }
      }
    }, this.retryInterval);
  }

  _stopAckProcessor() { if (this.ackTimer) clearInterval(this.ackTimer); }
}

module.exports = Messaging;
