# 节点规范

## Node 类设计

### 核心属性

```javascript
class Node {
  constructor(options) {
    // 节点身份
    this.id = options.id;                    // SHA-256(publicKey)
    this.keyPair = options.keyPair;          // Ed25519 密钥对
    this.address = options.address;          // ip:port
    
    // 节点能力
    this.capabilities = options.capabilities || [];
    
    // 网络状态
    this.peers = new Map();                  // 已连接的节点
    this.buckets = new KBucket();            // DHT k-buckets
    
    // 消息管理
    this.messageQueue = new MessageQueue();
    this.seenMessages = new LRUCache(10000);
    
    // 协议模块
    this.discovery = new DiscoveryProtocol(this);
    this.dht = new DHTRouting(this);
    this.gossip = new GossipProtocol(this);
    this.security = new SecurityModule(this);
    this.messaging = new MessagingModule(this);
    
    // 状态
    this.status = 'offline';                 // offline, online, busy
    this.startTime = null;
    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      bytesSent: 0,
      bytesReceived: 0
    };
  }
}
```

## 节点生命周期

### 1. 初始化 (Initialization)
```javascript
async initialize() {
  // 生成密钥对
  this.keyPair = await this.security.generateKeyPair();
  this.id = this.security.generateNodeId(this.keyPair.publicKey);
  
  // 初始化协议模块
  await this.discovery.initialize();
  await this.dht.initialize();
  await this.gossip.initialize();
  
  // 加载持久化数据
  await this.loadState();
}
```

### 2. 启动 (Startup)
```javascript
async start() {
  // 启动网络监听
  await this.startServer();
  
  // 连接到 Bootstrap 节点
  await this.bootstrap();
  
  // 开始节点发现
  await this.discovery.start();
  
  // 开始心跳
  this.startHeartbeat();
  
  // 更新状态
  this.status = 'online';
  this.startTime = Date.now();
}
```

### 3. 运行 (Running)
```javascript
async run() {
  // 处理消息循环
  while (this.status === 'online') {
    const message = await this.messageQueue.dequeue();
    await this.handleMessage(message);
  }
}
```

### 4. 停止 (Shutdown)
```javascript
async stop() {
  // 通知邻居节点
  await this.broadcast({ type: 'node_leaving' });
  
  // 停止协议模块
  await this.discovery.stop();
  await this.gossip.stop();
  
  // 关闭连接
  await this.disconnectAll();
  
  // 持久化状态
  await this.saveState();
  
  // 更新状态
  this.status = 'offline';
}
```

## 节点能力 (Capabilities)

### 能力类型
```javascript
const CapabilityTypes = {
  TASK: 'task',           // 任务处理
  STORAGE: 'storage',     // 数据存储
  COMPUTE: 'compute',     // 计算能力
  ROUTING: 'routing',     // 路由中继
  ORACLE: 'oracle'        // 外部数据源
};
```

### 能力声明
```javascript
{
  type: 'task',
  specs: {
    maxConcurrentTasks: 10,
    supportedTypes: ['inference', 'training', 'evaluation'],
    estimatedLatency: 500  // ms
  }
}
```

## 节点状态 (Status)

### 状态定义
```javascript
const NodeStatus = {
  OFFLINE: 'offline',     // 离线
  ONLINE: 'online',       // 在线
  BUSY: 'busy',           // 忙碌
  LEAVING: 'leaving'      // 正在离开
};
```

### 状态转换
```
offline -> online (启动)
online -> busy (高负载)
busy -> online (负载降低)
online -> leaving (准备离开)
leaving -> offline (关闭)
```

## 节点元数据 (Metadata)

```javascript
{
  name: 'node-name',                    // 节点名称
  version: '1.0.0',                     // 协议版本
  region: 'us-east-1',                  // 地理区域
  uptime: 86400,                        // 运行时间（秒）
  load: {
    cpu: 0.5,                           // CPU 使用率
    memory: 0.3,                        // 内存使用率
    network: 0.2                        // 网络带宽使用率
  },
  lastSeen: Date.now()                  // 最后活跃时间
}
```

## 节点 ID 生成

```javascript
generateNodeId(publicKey) {
  // 方法 1: 直接哈希公钥
  return crypto.createHash('sha256').update(publicKey).digest('hex');
  
  // 方法 2: 基于能力和公钥
  const data = publicKey + JSON.stringify(this.capabilities);
  return crypto.createHash('sha256').update(data).digest('hex');
}
```

## 节点发现流程

```
1. 新节点启动
   ↓
2. 连接到 Bootstrap 节点
   ↓
3. 发送节点公告 (node_announce)
   ↓
4. Bootstrap 节点返回邻居列表
   ↓
5. 连接到邻居节点
   ↓
6. 更新 DHT k-buckets
   ↓
7. 开始心跳
```

## 节点通信模式

### 1. 单播 (Unicast)
```javascript
// 点对点消息
await node.send(targetNodeId, message);
```

### 2. 多播 (Multicast)
```javascript
// 发送给多个节点
await node.multicast([nodeId1, nodeId2, ...], message);
```

### 3. 广播 (Broadcast)
```javascript
// 全网广播
await node.broadcast(message);
```

## 节点配置

```javascript
const defaultConfig = {
  // 网络配置
  port: 8080,
  host: '0.0.0.0',
  
  // Bootstrap 节点
  bootstrapNodes: [
    'bootstrap1.example.com:8080',
    'bootstrap2.example.com:8080'
  ],
  
  // DHT 配置
  kBucketSize: 20,
  concurrency: 3,
  replicationFactor: 3,
  
  // 心跳配置
  heartbeatInterval: 30000,    // 30 秒
  heartbeatTimeout: 90000,     // 90 秒
  
  // 消息配置
  messageTimeout: 5000,        // 5 秒
  maxRetries: 3,
  
  // 流量控制
  maxInboundRate: 1000,        // msg/s
  maxOutboundRate: 1000,       // msg/s
  
  // 安全配置
  enableEncryption: true,
  enableAuthentication: true,
  
  // 持久化配置
  dataDir: './data',
  persistInterval: 60000       // 60 秒
};
```

## 节点事件

```javascript
node.on('peer:connected', (peer) => {
  console.log('New peer connected:', peer.id);
});

node.on('peer:disconnected', (peer) => {
  console.log('Peer disconnected:', peer.id);
});

node.on('message:received', (message) => {
  console.log('Message received:', message.id);
});

node.on('message:sent', (message) => {
  console.log('Message sent:', message.id);
});

node.on('error', (error) => {
  console.error('Node error:', error);
});
```

## 节点监控指标

```javascript
{
  // 网络指标
  peers: 25,                           // 连接数
  messagesReceived: 12345,             // 接收消息数
  messagesSent: 10000,                 // 发送消息数
  bytesReceived: 1024000,              // 接收字节数
  bytesSent: 2048000,                  // 发送字节数
  
  // 性能指标
  avgLatency: 150,                     // 平均延迟 (ms)
  throughput: 1000,                    // 吞吐量 (msg/s)
  
  // 资源指标
  cpuUsage: 0.5,                       // CPU 使用率
  memoryUsage: 0.3,                    // 内存使用率
  
  // DHT 指标
  dhtSize: 1000,                       // DHT 条目数
  bucketFullness: 0.75,                // Bucket 填充度
  
  // 可用性指标
  uptime: 86400,                       // 运行时间 (秒)
  availability: 0.999                  // 可用性
}
```

## 节点故障处理

### 故障检测
```javascript
// 心跳超时检测
setInterval(() => {
  for (const [peerId, lastSeen] of this.peers) {
    if (Date.now() - lastSeen > this.config.heartbeatTimeout) {
      this.handlePeerFailure(peerId);
    }
  }
}, this.config.heartbeatInterval);
```

### 故障恢复
```javascript
async handlePeerFailure(peerId) {
  // 1. 标记节点为故障
  this.peers.delete(peerId);
  
  // 2. 广播故障消息
  await this.broadcast({
    type: 'node_failure',
    nodeId: peerId
  });
  
  // 3. 更新 DHT
  this.dht.removeNode(peerId);
  
  // 4. 重新路由消息
  await this.rerouteMessages(peerId);
}
```

## 节点安全

### 密钥管理
```javascript
class KeyManager {
  constructor() {
    this.keyPair = null;
    this.sessionKeys = new Map();
  }
  
  async generateKeyPair() {
    // Ed25519 密钥对
    const { publicKey, privateKey } = await crypto.generateKeyPair('ed25519');
    this.keyPair = { publicKey, privateKey };
    return this.keyPair;
  }
  
  async deriveSessionKey(peerPublicKey) {
    // X25519 密钥交换
    const sharedSecret = await crypto.diffieHellman({
      privateKey: this.keyPair.privateKey,
      publicKey: peerPublicKey
    });
    return sharedSecret;
  }
}
```

### 身份验证
```javascript
async authenticate(peer) {
  // 1. 验证签名
  const challenge = crypto.randomBytes(32);
  const signature = await peer.sign(challenge);
  const valid = await this.security.verifySignature(
    challenge,
    signature,
    peer.publicKey
  );
  
  if (!valid) {
    throw new Error('Authentication failed');
  }
  
  // 2. 建立会话
  const sessionKey = await this.keyManager.deriveSessionKey(peer.publicKey);
  this.sessions.set(peer.id, { sessionKey, timestamp: Date.now() });
  
  return true;
}
```

## 节点测试

### 单元测试
```javascript
describe('Node', () => {
  it('should generate valid node ID', () => {
    const node = new Node(config);
    expect(node.id).toMatch(/^[a-f0-9]{64}$/);
  });
  
  it('should connect to bootstrap nodes', async () => {
    const node = new Node(config);
    await node.start();
    expect(node.peers.size).toBeGreaterThan(0);
    await node.stop();
  });
});
```

### 集成测试
```javascript
describe('Network', () => {
  it('should form a connected network', async () => {
    const nodes = await createTestNetwork(10);
    const connected = await checkConnectivity(nodes);
    expect(connected).toBe(true);
    await stopAllNodes(nodes);
  });
});
```

## 参考

- [libp2p Node](https://docs.libp2p.io/concepts/fundamentals/peers/)
- [Kademlia Node](https://pdos.csail.mit.edu/~petar/papers/maymounkov-kademlia-lncs.pdf)
