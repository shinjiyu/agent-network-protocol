/**
 * DHT 路由 测试
 */

const KBucket = require('../../src/routing/DHT/KBucket');

describe('KBucket', () => {
  it('should be defined', () => {
    expect(KBucket).toBeDefined();
  });
  
  it('should create instance', () => {
    const instance = new KBucket();
    expect(instance).toBeInstanceOf(KBucket);
  });
});
