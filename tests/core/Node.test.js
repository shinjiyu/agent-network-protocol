/**
 * 节点核心类 测试
 */

const Node = require('../../src/core/Node/Node');

describe('Node', () => {
  it('should be defined', () => {
    expect(Node).toBeDefined();
  });
  
  it('should create instance', () => {
    const instance = new Node();
    expect(instance).toBeInstanceOf(Node);
  });
});
