/**
 * DHT 路由 测试
 */

const DHT = require('../../src/routing/DHT');

describe('DHT', () => {
  it('should be defined', () => {
    expect(DHT).toBeDefined();
  });
  
  it('should create instance', () => {
    const instance = new DHT();
    expect(instance).toBeInstanceOf(DHT);
  });
});
