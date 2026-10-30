import { Readable } from 'node:stream';
import {
  CreateBucketCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { ObjectStorage, StoredObject } from '../application/ports.js';

export interface S3Settings {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

/** MinIO (or any S3-compatible store). The bucket stays private; the API streams images after checking access. */
export class S3ObjectStorage implements ObjectStorage {
  private readonly client: S3Client;

  constructor(private readonly settings: S3Settings) {
    this.client = new S3Client({
      endpoint: settings.endpoint,
      region: settings.region,
      forcePathStyle: true,
      credentials: { accessKeyId: settings.accessKeyId, secretAccessKey: settings.secretAccessKey },
    });
  }

  async ensureBucket() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.settings.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.settings.bucket }));
    }
  }

  async put(key: string, body: Buffer, contentType: string) {
    await this.client.send(new PutObjectCommand({ Bucket: this.settings.bucket, Key: key, Body: body, ContentType: contentType }));
  }

  async get(key: string): Promise<StoredObject | undefined> {
    try {
      const res = await this.client.send(new GetObjectCommand({ Bucket: this.settings.bucket, Key: key }));
      return { body: res.Body as Readable, contentType: res.ContentType ?? 'application/octet-stream', contentLength: res.ContentLength };
    } catch (err) {
      if (err instanceof NoSuchKey) return undefined;
      throw err;
    }
  }

  async getBuffer(key: string) {
    const obj = await this.get(key);
    if (!obj) return undefined;
    const chunks: Buffer[] = [];
    for await (const chunk of obj.body) chunks.push(chunk as Buffer);
    return Buffer.concat(chunks);
  }

  async delete(keys: string[]) {
    if (keys.length === 0) return;
    await this.client.send(
      new DeleteObjectsCommand({ Bucket: this.settings.bucket, Delete: { Objects: keys.map(Key => ({ Key })), Quiet: true } }),
    );
  }
}

/** In-memory storage for tests and quick local runs without MinIO. */
export class MemoryObjectStorage implements ObjectStorage {
  readonly objects = new Map<string, { body: Buffer; contentType: string }>();

  async put(key: string, body: Buffer, contentType: string) {
    this.objects.set(key, { body, contentType });
  }

  async get(key: string): Promise<StoredObject | undefined> {
    const o = this.objects.get(key);
    return o && { body: Readable.from(o.body), contentType: o.contentType, contentLength: o.body.length };
  }

  async getBuffer(key: string) {
    return this.objects.get(key)?.body;
  }

  async delete(keys: string[]) {
    for (const k of keys) this.objects.delete(k);
  }
}
