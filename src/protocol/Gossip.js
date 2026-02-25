/**
 * Gossip - Gossip 协议
 */

const crypto = require('crypto');
const EventEmitter = require('events');

class Gossip extends EventEmitter {
  constructor(options = {}) {
    super();
    this.nodeId = options.nodeId || crypto.randomBytes(32).toString('hex');
    this.fanout = options.fanout || 3;
    this.maxHops = options.maxHops || 6;
    this.messageCache = new Map();
    this.cacheTTL = options.cacheTTL || 60000;
    this.peers = new Map();
  }

  async start() { return Promise.resolve(); }
  async stop() { return Promise.resolve(); }

  broadcast(topic, data) {
    const msg = { id: crypto.randomBytes(16).toString('hex'), topic, data, origin: this.nodeId, hops: 0, timestamp: Date.now() };
    this.messageCache.set(msg.id, msg.timestamp);
    this._propagate(msg);
    this.emit('message', msg);
    return msg.id;
  }

  receive(message) {
    if (!message?.id || this.messageCache.has(message.id) || message.hops >= this.maxHops) return false;
    this.messageCache.set(message.id, Date.now());
    message.hops++;
    this._propagate(message);
    this.emit('message', message);
    return true;
  }

  subscribe(topic, handler) { this.on(`topic:${topic}`, handler); return () => this.off(`topic:${topic}`, handler); }
  addPeer(peerId, send) { this.peers.set(peerId, { id: peerId, send }); }
  removePeer(peerId) { this.peers.delete(peerId); }
  getPeerCount() { return this.peers.size; }

  _propagate(msg) {
    const selected = this._selectRandomPeers(this.fanout);
    for (const peer of selected) {
      try { peer.send(msg); } catch (e) { this.emit('error', e, peer.id); }
    }
  }

  _selectRandomPeers(count) {
    const peers = Array.from(this.peers.values());
    const selected = [];
    while (selected.length < count && peers.length > 0) {
      selected.push(peers.splice(Math.floor(Math.random() * peers.length), 1)[0]);
    }
    return selected;
  }
}

module.exports = Gossip;
