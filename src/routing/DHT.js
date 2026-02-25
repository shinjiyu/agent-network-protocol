/**
 * DHT - 分布式哈希表
 */

const crypto = require('crypto');
const EventEmitter = require('events');
const KBucket = require('./KBucket');

class DHT extends EventEmitter {
  constructor(options = {}) {
    super();
    this.nodeId = options.nodeId || crypto.randomBytes(32).toString('hex');
    this.k = options.k || 20;
    this.storage = new Map();
    this.kbucket = new KBucket({ localNodeId: this.nodeId, k: this.k });
  }

  async start() { return Promise.resolve(); }
  async stop() { return Promise.resolve(); }

  async put(key, value, ttl = 3600000) {
    const hash = this._hash(key);
    this.storage.set(hash, { value, expires: Date.now() + ttl });
    for (const node of this.kbucket.closest(hash, this.k)) {
      if (node.id !== this.nodeId) this.emit('store', { node, keyHash: hash, value });
    }
    return hash;
  }

  async get(key) {
    const hash = this._hash(key);
    const local = this.storage.get(hash);
    if (local?.expires > Date.now()) return local.value;
    return null;
  }

  addNode(node) {
    const added = this.kbucket.add(node);
    if (added) this.emit('node:added', node);
    return added;
  }

  removeNode(id) {
    const removed = this.kbucket.remove(id);
    if (removed) this.emit('node:removed', id);
    return removed;
  }

  findNode(id) { return this.kbucket.closest(id, this.k); }
  getNodes() { return this.kbucket.getAllNodes(); }
  size() { return this.kbucket.size(); }

  _hash(key) {
    return crypto.createHash('sha256').update(String(key)).digest('hex');
  }
}

module.exports = DHT;
