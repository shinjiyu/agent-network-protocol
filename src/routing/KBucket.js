/**
 * KBucket - K-Bucket 数据结构
 */

class KBucket {
  constructor(options = {}) {
    this.localNodeId = options.localNodeId || '';
    this.k = options.k || 20;
    this.buckets = new Map();
  }

  add(node) {
    if (!node?.id) return false;
    const idx = this._getBucketIndex(node.id);
    if (!this.buckets.has(idx)) this.buckets.set(idx, []);
    const bucket = this.buckets.get(idx);
    const existing = bucket.findIndex(n => n.id === node.id);
    if (existing !== -1) {
      const n = bucket.splice(existing, 1)[0];
      n.lastSeen = Date.now();
      bucket.push(n);
      return true;
    }
    if (bucket.length < this.k) {
      bucket.push({ id: node.id, address: node.address, port: node.port, lastSeen: Date.now() });
      return true;
    }
    return false;
  }

  remove(nodeId) {
    const bucket = this.buckets.get(this._getBucketIndex(nodeId));
    if (!bucket) return false;
    const idx = bucket.findIndex(n => n.id === nodeId);
    if (idx !== -1) { bucket.splice(idx, 1); return true; }
    return false;
  }

  get(nodeId) {
    const bucket = this.buckets.get(this._getBucketIndex(nodeId));
    return bucket?.find(n => n.id === nodeId) || null;
  }

  closest(targetId, count = this.k) {
    const nodes = this.getAllNodes().map(n => ({ node: n, distance: this._distance(n.id, targetId) }));
    nodes.sort((a, b) => Buffer.compare(a.distance, b.distance));
    return nodes.slice(0, count).map(i => i.node);
  }

  getAllNodes() { return [].concat(...this.buckets.values()); }
  getOldestNode(idx) { const b = this.buckets.get(idx); return b?.[0] || null; }
  size() { let c = 0; for (const b of this.buckets.values()) c += b.length; return c; }

  _getBucketIndex(nodeId) {
    const dist = this._distance(nodeId, this.localNodeId);
    for (let i = 0; i < dist.length; i++) {
      if (dist[i] !== 0) return i * 8 + Math.floor(Math.log2(dist[i]));
    }
    return dist.length * 8 - 1;
  }

  _distance(id1, id2) {
    const b1 = Buffer.from(id1, 'hex'), b2 = Buffer.from(id2, 'hex');
    const r = Buffer.alloc(b1.length);
    for (let i = 0; i < b1.length; i++) r[i] = b1[i] ^ b2[i];
    return r;
  }
}

module.exports = KBucket;
