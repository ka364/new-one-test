/**
 * Mock Storage Adapter
 * Simulates cloud storage (S3, Google Cloud Storage, Azure Blob)
 */

import { BaseAdapter, AdapterResponse, AdapterConfig } from '../base-adapter'

export interface UploadOptions {
  bucket: string
  key: string
  body: Buffer | string
  contentType?: string
  metadata?: Record<string, string>
  acl?: 'private' | 'public-read' | 'public-read-write'
}

export interface UploadResult {
  bucket: string
  key: string
  url: string
  etag: string
  size: number
  contentType: string
  uploadedAt: Date
}

export interface StoredFile {
  key: string
  size: number
  contentType: string
  metadata: Record<string, string>
  url: string
  uploadedAt: Date
}

export class MockStorageAdapter extends BaseAdapter {
  private storage = new Map<string, Map<string, StoredFile>>()

  constructor(config: AdapterConfig = {}) {
    super(config)
  }

  async upload(options: UploadOptions): Promise<AdapterResponse<UploadResult>> {
    await this.handleFailureMode()
    await this.simulateDelay(250)

    const { bucket, key, body, contentType = 'application/octet-stream', metadata = {} } = options

    // Ensure bucket exists
    if (!this.storage.has(bucket)) {
      this.storage.set(bucket, new Map())
    }

    const bucketStorage = this.storage.get(bucket)!
    const size = typeof body === 'string' ? Buffer.from(body).length : body.length
    const etag = `"${Date.now()}-${Math.random().toString(36).substring(7)}"`
    const url = `https://mock-storage.com/${bucket}/${key}`

    const storedFile: StoredFile = {
      key,
      size,
      contentType,
      metadata,
      url,
      uploadedAt: new Date()
    }

    bucketStorage.set(key, storedFile)

    const result: UploadResult = {
      bucket,
      key,
      url,
      etag,
      size,
      contentType,
      uploadedAt: new Date()
    }

    return this.wrapResponse(result)
  }

  async download(bucket: string, key: string): Promise<AdapterResponse<Buffer>> {
    await this.handleFailureMode()
    await this.simulateDelay(200)

    const bucketStorage = this.storage.get(bucket)

    if (!bucketStorage) {
      return this.wrapError('Bucket not found', 404)
    }

    const file = bucketStorage.get(key)

    if (!file) {
      return this.wrapError('File not found', 404)
    }

    // Return mock buffer
    const mockBuffer = Buffer.from(`Mock file content for ${key}`)

    return this.wrapResponse(mockBuffer)
  }

  async delete(bucket: string, key: string): Promise<AdapterResponse<{ deleted: boolean }>> {
    await this.handleFailureMode()
    await this.simulateDelay(150)

    const bucketStorage = this.storage.get(bucket)

    if (!bucketStorage) {
      return this.wrapError('Bucket not found', 404)
    }

    const deleted = bucketStorage.delete(key)

    if (!deleted) {
      return this.wrapError('File not found', 404)
    }

    return this.wrapResponse({ deleted: true })
  }

  async list(bucket: string, prefix?: string): Promise<AdapterResponse<StoredFile[]>> {
    await this.simulateDelay(100)

    const bucketStorage = this.storage.get(bucket)

    if (!bucketStorage) {
      return this.wrapError('Bucket not found', 404)
    }

    let files = Array.from(bucketStorage.values())

    if (prefix) {
      files = files.filter(file => file.key.startsWith(prefix))
    }

    return this.wrapResponse(files)
  }

  async getMetadata(bucket: string, key: string): Promise<AdapterResponse<StoredFile>> {
    await this.simulateDelay(100)

    const bucketStorage = this.storage.get(bucket)

    if (!bucketStorage) {
      return this.wrapError('Bucket not found', 404)
    }

    const file = bucketStorage.get(key)

    if (!file) {
      return this.wrapError('File not found', 404)
    }

    return this.wrapResponse(file)
  }

  async getSignedUrl(
    bucket: string,
    key: string,
    expiresIn: number = 3600
  ): Promise<AdapterResponse<string>> {
    await this.simulateDelay(50)

    const bucketStorage = this.storage.get(bucket)

    if (!bucketStorage) {
      return this.wrapError('Bucket not found', 404)
    }

    const file = bucketStorage.get(key)

    if (!file) {
      return this.wrapError('File not found', 404)
    }

    const signedUrl = `${file.url}?signature=mock_signature&expires=${Date.now() + expiresIn * 1000}`

    return this.wrapResponse(signedUrl)
  }

  /**
   * Test helper: Clear all storage
   */
  clearStorage(): void {
    this.storage.clear()
  }

  /**
   * Test helper: Create bucket
   */
  createBucket(bucket: string): void {
    if (!this.storage.has(bucket)) {
      this.storage.set(bucket, new Map())
    }
  }

  /**
   * Test helper: Get all files in bucket
   */
  getAllFiles(bucket: string): StoredFile[] {
    const bucketStorage = this.storage.get(bucket)
    return bucketStorage ? Array.from(bucketStorage.values()) : []
  }

  /**
   * Test helper: Get file count
   */
  getFileCount(bucket: string): number {
    const bucketStorage = this.storage.get(bucket)
    return bucketStorage ? bucketStorage.size : 0
  }
}
