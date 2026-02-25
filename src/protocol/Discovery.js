/**
 * Discovery - 节点发现协议
 * 实现多播和引导节点发现机制
 */

const dgram = require('dgram');
const crypto = require('crypto');
const EventEmitter = require('events');

class Discovery extends EventEmitter {
  constructor(options = {}) {
    super();
    this.nodeId = options.nodeId || crypto.randomBytes(32).toString('hex');
    this.port = options.port || 42424;
    this.multicastAddress = options.multicastAddress || '239.255.255.250';
    this.bootstrapNodes = options.bootstrapNodes || [];
    this.knownPeers = new Map();
    this.socket = null;
    this.running = false;
    this.announceInterval = options.announceInterval || 30000;
    this.announceTimer = null;
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      this.socket.on('error', reject);
      this.socket.on('message', (msg, rinfo) => this._handleMessage(msg, rinfo));
      this.socket.bind(this.port, () => {
        try {
          this.socket.addMembership(this.multicastAddress);
          this.running = true;
          this._startAnnounce();
          resolve();
        } catch (err) { reject(err); }
      });
    });
  }

  async stop() {
    if (this.announceTimer) clearInterval(this.announceTimer);
    return new Promise((resolve) => {
      if (this.socket) this.socket.close(() => { this.running = false; resolve(); });
      else resolve();
    });
  }

  async discover(timeout = 5000) {
    return new Promise((resolve) => {
      const discovered = [];
      const timer = setTimeout(() => resolve(discovered), timeout);
      const onPeer = (peer) => discovered.push(peer);
      this.once('peer:discovered', onPeer);
      this._sendDiscoveryRequest();
    });
  }

  getKnownPeers() { return Array.from(this.knownPeers.values()); }
  addBootstrapNode(address, port) { this.bootstrapNodes.push({ address, port }); }

  _startAnnounce() {
    this._sendAnnounce();
    this.announceTimer = setInterval(() => this._sendAnnounce(), this.announceInterval);
  }

  _sendAnnounce() {
    const msg = JSON.stringify({ type: 'announce', nodeId: this.nodeId, timestamp: Date.now() });
    const buf = Buffer.from(msg);
    this.socket.send(buf, 0, buf.length, this.port, this.multicastAddress);
    for (const n of this.bootstrapNodes) this.socket.send(buf, 0, buf.length, n.port, n.address);
  }

  _sendDiscoveryRequest() {
    const msg = JSON.stringify({ type: 'discover', nodeId: this.nodeId, timestamp: Date.now() });
    this.socket.send(Buffer.from(msg), 0, msg.length, this.port, this.multicastAddress);
  }

  _handleMessage(msg, rinfo) {
    try {
      const data = JSON.parse(msg.toString());
      if (data.nodeId === this.nodeId) return;
      if (data.type === 'announce' || data.type === 'response') {
        const peer = { nodeId: data.nodeId, address: rinfo.address, port: rinfo.port, lastSeen: Date.now() };
        this.knownPeers.set(data.nodeId, peer);
        this.emit('peer:discovered', peer);
      } else if (data.type === 'discover') {
        const resp = JSON.stringify({ type: 'response', nodeId: this.nodeId, timestamp: Date.now() });
        this.socket.send(Buffer.from(resp), 0, resp.length, rinfo.port, rinfo.address);
      }
    } catch (e) {}
  }
}

module.exports = Discovery;
