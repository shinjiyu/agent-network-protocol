/**
 * Network - 网络集成
 */

const crypto = require('crypto');
const EventEmitter = require('events');
const Node = require('./core/Node');
const { EventManager, EventTypes } = require('./core/Events');
const Discovery = require('./protocol/Discovery');
const Gossip = require('./protocol/Gossip');
const Messaging = require('./protocol/Messaging');
const DHT = require('./routing/DHT');
const Crypto = require('./security/Crypto');

class Network extends EventEmitter {
  constructor(options = {}) {
    super();
    this.nodeId = options.nodeId || crypto.randomBytes(32).toString('hex');
    this.events = new EventManager();
    this.node = new Node({ id: this.nodeId });
    this.crypto = new Crypto(options.crypto);
    this.discovery = new Discovery({ nodeId: this.nodeId, ...options.discovery });
    this.gossip = new Gossip({ nodeId: this.nodeId, ...options.gossip });
    this.messaging = new Messaging({ nodeId: this.nodeId, ...options.messaging });
    this.dht = new DHT({ nodeId: this.nodeId, ...options.dht });
    this.running = false;
    this._setupEvents();
  }

  async start() {
    if (this.running) return;
    await this.node.start();
    await this.discovery.start();
    await this.gossip.start();
    await this.messaging.start();
    await this.dht.start();
    this.running = true;
    this.events.emit(EventTypes.NODE_STARTED, { nodeId: this.nodeId });
    return this.nodeId;
  }

  async stop() {
    if (!this.running) return;
    await this.discovery.stop();
    await this.gossip.stop();
    await this.messaging.stop();
    await this.dht.stop();
    await this.node.stop();
    this.running = false;
    this.events.emit(EventTypes.NODE_STOPPED, { nodeId: this.nodeId });
  }

  discoverPeers(timeout) { return this.discovery.discover(timeout); }
  getPeers() { return this.discovery.getKnownPeers(); }
  broadcast(topic, data) { return this.gossip.broadcast(topic, data); }
  subscribe(topic, handler) { return this.gossip.subscribe(topic, handler); }
  send(peerId, type, payload) { return this.messaging.send(peerId, type, payload); }
  onMessage(type, handler) { return this.messaging.onMessage(type, handler); }
  put(key, value, ttl) { return this.dht.put(key, value, ttl); }
  get(key) { return this.dht.get(key); }
  encrypt(data, key) { return this.crypto.encrypt(data, key); }
  decrypt(enc, key) { return this.crypto.decrypt(enc, key); }
  sign(data, key) { return this.crypto.sign(data, key); }
  verify(data, sig, key) { return this.crypto.verify(data, sig, key); }

  getNodeInfo() {
    return { id: this.nodeId, running: this.running, peers: this.getPeers().length, dhtNodes: this.dht.size() };
  }

  _setupEvents() {
    this.discovery.on('peer:discovered', (p) => {
      this.events.emit(EventTypes.PEER_CONNECTED, p);
      this.gossip.addPeer(p.nodeId, (m) => this.messaging.send(p.nodeId, 'gossip', m));
      this.messaging.connect(p.nodeId, p.send);
      this.dht.addNode({ id: p.nodeId, address: p.address, port: p.port });
    });
    this.messaging.on('message', (m) => {
      if (m.type === 'gossip') this.gossip.receive(m.payload);
      else this.events.emit(EventTypes.MESSAGE_RECEIVED, m);
    });
    this.gossip.on('message', (m) => this.events.emit(EventTypes.GOSSIP_RECEIVED, m));
  }
}

module.exports = Network;
