/**
 * Crypto - 加密模块
 */

const crypto = require('crypto');

class Crypto {
  constructor(options = {}) {
    this.algorithm = options.algorithm || 'aes-256-gcm';
    this.keyLength = options.keyLength || 32;
    this.ivLength = options.ivLength || 16;
  }

  generateKeyPair() {
    return crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
  }

  generateSymmetricKey() {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  encrypt(data, key) {
    const iv = crypto.randomBytes(this.ivLength);
    const keyBuf = Buffer.from(key, 'hex').length === this.keyLength 
      ? Buffer.from(key, 'hex') 
      : crypto.scryptSync(key, 'salt', this.keyLength);
    const cipher = crypto.createCipheriv(this.algorithm, keyBuf, iv);
    let enc = cipher.update(data, 'utf8', 'hex');
    enc += cipher.final('hex');
    return { iv: iv.toString('hex'), data: enc, authTag: cipher.getAuthTag().toString('hex') };
  }

  decrypt(enc, key) {
    const keyBuf = Buffer.from(key, 'hex').length === this.keyLength
      ? Buffer.from(key, 'hex')
      : crypto.scryptSync(key, 'salt', this.keyLength);
    const decipher = crypto.createDecipheriv(this.algorithm, keyBuf, Buffer.from(enc.iv, 'hex'));
    decipher.setAuthTag(Buffer.from(enc.authTag, 'hex'));
    let dec = decipher.update(enc.data, 'hex', 'utf8');
    return dec + decipher.final('utf8');
  }

  sign(data, privateKey) {
    return crypto.createSign('SHA256').update(data).sign(privateKey, 'hex');
  }

  verify(data, sig, publicKey) {
    return crypto.createVerify('SHA256').update(data).verify(publicKey, sig, 'hex');
  }

  hash(data, algo = 'sha256') {
    return crypto.createHash(algo).update(data).digest('hex');
  }

  randomBytes(len = 32) {
    return crypto.randomBytes(len).toString('hex');
  }
}

module.exports = Crypto;
