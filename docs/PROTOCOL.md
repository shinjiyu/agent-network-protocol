# 协议规范

## 1. 节点发现协议 (Node Discovery Protocol)

### 1.1 Bootstrap
新节点通过 Bootstrap 节点列表加入网络：

```javascript
// Bootstrap 请求
{
  type: 'bootstrap',
  nodeId: 'nodeId',
  publicKey: 'publicKey',
  address: 'ip:port',
  capabilities: ['task', 'storage', 'compute']
}

// Bootstrap 响应
{
  type: 'bootstrap_response',
  nodes: [
    { id: 'node1', address: 'ip:port' },
    { id: 'node2', address: 'ip:port' },
    ...
  ]
}
```

### 1.2 P2P 发现
通过 Gossip 协议传播节点信息：

```javascript
{
  type: 'node_announce',
  nodeId: 'nodeId',
  publicKey: 'publicKey',
  address: 'ip:port',
  capabilities: [],
  timestamp: Date.now()
}
```

### 1.3 DHT 查找
使用 Kademlia DHT 查找节点：

```javascript
// 查找请求
{
  type: 'dht_lookup',
  targetId: 'targetNodeId',
  from: 'requesterNodeId'
}

// 查找响应
{
  type: 'dht_lookup_response',
  targetId: 'targetNodeId',
  nodes: [
    { id: 'node1', distance: 'distance1' },
    { id: 'node2', distance: 'distance2' }
  ]
}
```

## 2. DHT 协议 (DHT Protocol)

### 2.1 Kademlia 参数
- **k-bucket size**: 20 (每个 bucket 最多 20 个节点)
- **并发度 α**: 3 (并发查询数)
- **副本数**: 3 (数据副本数)
- **刷新间隔**: 1 小时

### 2.2 XOR 距离
```javascript
distance(nodeA, nodeB) = nodeA.id XOR nodeB.id
```

### 2.3 k-bucket 结构
```javascript
{
  bucket_0: [node1, node2, ...],  // 距离 2^0 - 2^1
  bucket_1: [node3, node4, ...],  // 距离 2^1 - 2^2
  ...
  bucket_255: [...]               // 距离 2^255 - 2^256
}
```

### 2.4 操作

#### PUT 操作
```javascript
// 存储数据
{
  type: 'dht_put',
  key: 'key',
  value: 'value',
  ttl: 3600,  // 秒
  signature: 'signature'
}
```

#### GET 操作
```javascript
// 查询数据
{
  type: 'dht_get',
  key: 'key',
  from: 'requesterNodeId'
}

// 响应
{
  type: 'dht_get_response',
  key: 'key',
  value: 'value',
  timestamp: Date.now()
}
```

## 3. Gossip 协议 (Gossip Protocol)

### 3.1 Plumtree 协议
混合推拉模式，低延迟高可靠性。

#### 消息传播
```javascript
{
  type: 'gossip',
  messageId: 'uuid',
  payload: {},
  ttl: 10,  // 传播跳数
  origin: 'nodeId',
  timestamp: Date.now()
}
```

#### 懒推送 (Lazy Push)
```javascript
{
  type: 'gossip_lazy',
  messageId: 'uuid',
  digest: 'hash',
  origin: 'nodeId'
}
```

#### 懒拉取 (Lazy Pull)
```javascript
{
  type: 'gossip_pull',
  messageId: 'uuid',
  from: 'requesterNodeId'
}

// 响应
{
  type: 'gossip_pull_response',
  messageId: 'uuid',
  payload: {}
}
```

### 3.2 消息去重
每个节点维护 `seen_messages` 集合：
```javascript
seen_messages = new Set([messageId1, messageId2, ...])
```

## 4. 心跳协议 (Heartbeat Protocol)

### 4.1 心跳消息
```javascript
{
  type: 'heartbeat',
  nodeId: 'nodeId',
  timestamp: Date.now(),
  status: 'active',
  load: {
    cpu: 0.5,
    memory: 0.3,
    connections: 10
  }
}
```

### 4.2 心跳间隔
- **正常**: 30 秒
- **高负载**: 60 秒
- **故障检测**: 90 秒无响应

### 4.3 故障处理
```javascript
// 节点故障广播
{
  type: 'node_failure',
  nodeId: 'failedNodeId',
  detectedBy: 'detectorNodeId',
  timestamp: Date.now()
}
```

## 5. 消息传递协议 (Messaging Protocol)

### 5.1 直接消息
```javascript
{
  type: 'message',
  id: 'uuid',
  from: 'senderNodeId',
  to: 'receiverNodeId',
  payload: {},
  timestamp: Date.now(),
  signature: 'signature'
}
```

### 5.2 消息确认
```javascript
{
  type: 'message_ack',
  messageId: 'uuid',
  from: 'receiverNodeId',
  timestamp: Date.now()
}
```

### 5.3 重传机制
- **超时**: 5 秒
- **最大重试**: 3 次
- **指数退避**: 1s, 2s, 4s

### 5.4 消息顺序
使用 Lamport 时钟保证消息顺序：
```javascript
{
  lamportClock: 123,
  sequenceNumber: 456
}
```

## 6. 安全协议 (Security Protocol)

### 6.1 身份认证
```javascript
// 认证请求
{
  type: 'auth_request',
  nodeId: 'nodeId',
  publicKey: 'publicKey',
  timestamp: Date.now(),
  signature: 'signature'
}

// 认证响应
{
  type: 'auth_response',
  success: true,
  sessionId: 'sessionId',
  expiresAt: Date.now() + 3600000
}
```

### 6.2 端到端加密
```javascript
{
  type: 'encrypted_message',
  from: 'senderNodeId',
  to: 'receiverNodeId',
  encryptedPayload: 'base64EncodedEncryptedData',
  nonce: 'base64EncodedNonce',
  timestamp: Date.now()
}
```

### 6.3 密钥交换
使用 X25519 进行密钥交换：
```javascript
{
  type: 'key_exchange',
  from: 'senderNodeId',
  ephemeralPublicKey: 'ephemeralPublicKey',
  timestamp: Date.now(),
  signature: 'signature'
}
```

## 7. 拓扑维护协议 (Topology Maintenance Protocol)

### 7.1 邻居选择
- **随机选择**: 随机选择 k 个邻居
- **基于距离**: 选择 XOR 距离最近的 k 个邻居
- **基于延迟**: 选择延迟最低的 k 个邻居

### 7.2 拓扑优化
```javascript
{
  type: 'topology_optimize',
  nodeId: 'nodeId',
  currentNeighbors: ['node1', 'node2', ...],
  suggestedNeighbors: ['node3', 'node4', ...]
}
```

## 8. 流量控制协议 (Flow Control Protocol)

### 8.1 速率限制
- **入站**: 1000 msg/s
- **出站**: 1000 msg/s
- **广播**: 100 msg/s

### 8.2 拥塞控制
```javascript
{
  type: 'congestion_notification',
  nodeId: 'nodeId',
  queueSize: 500,
  dropProbability: 0.1
}
```

## 9. 质量保证

### 9.1 消息完整性
使用 SHA-256 哈希：
```javascript
messageHash = SHA256(message + signature)
```

### 9.2 防重放攻击
- **时间戳验证**: 消息时间戳在 ±5 分钟内
- **Nonce**: 每个消息包含唯一 nonce
- **序列号**: 严格递增的序列号

## 10. 协议版本

### 10.1 版本协商
```javascript
{
  type: 'version_negotiation',
  supportedVersions: ['1.0.0', '1.1.0'],
  selectedVersion: '1.1.0'
}
```

### 10.2 向后兼容
- 新版本必须向后兼容一个主版本
- 废弃的协议至少保留 6 个月

## 参考文档

- [Kademlia DHT](https://pdos.csail.mit.edu/~petar/papers/maymounkov-kademlia-lncs.pdf)
- [Plumtree Gossip](http://asc.di.fct.unl.pt/~jleitao/pdf/srds07-leitao.pdf)
- [SWIM Protocol](https://www.cs.cornell.edu/projects/Quicksilver/public_pdfs/SWIM.pdf)
- [Noise Protocol](https://noiseprotocol.org/noise.html)
