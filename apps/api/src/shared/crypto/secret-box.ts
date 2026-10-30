import crypto from 'node:crypto';

/** AES-256-GCM for secrets stored in the database (payment keys). Output: iv.tag.ciphertext, base64url. */
export class SecretBox {
  private readonly key: Buffer | null;

  constructor(base64Key: string | undefined) {
    const key = base64Key ? Buffer.from(base64Key, 'base64') : null;
    if (key && key.length !== 32) throw new Error('ENCRYPTION_KEY must be 32 bytes, base64 encoded');
    this.key = key;
  }

  get available() {
    return this.key !== null;
  }

  seal(plain: string): string {
    const key = this.requireKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), data].map(b => b.toString('base64url')).join('.');
  }

  open(sealed: string): string {
    const key = this.requireKey();
    const [iv, tag, data] = sealed.split('.').map(p => Buffer.from(p, 'base64url'));
    if (!iv || !tag || !data) throw new Error('Malformed secret');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }

  private requireKey() {
    if (!this.key) throw new Error('ENCRYPTION_KEY is not configured');
    return this.key;
  }
}
