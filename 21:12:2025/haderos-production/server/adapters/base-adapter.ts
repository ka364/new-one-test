/**
 * Base Adapter Interface
 * Defines the contract for all external service adapters
 */

export interface AdapterConfig {
  apiKey?: string
  apiSecret?: string
  baseUrl?: string
  timeout?: number
  retries?: number
}

export interface AdapterResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  statusCode?: number
  timestamp: Date
}

export abstract class BaseAdapter {
  protected config: AdapterConfig
  protected failureMode: 'none' | 'timeout' | 'error' | 'invalid_response' = 'none'

  constructor(config: AdapterConfig) {
    this.config = config
  }

  /**
   * Set failure mode for testing
   */
  setFailureMode(mode: 'none' | 'timeout' | 'error' | 'invalid_response'): void {
    this.failureMode = mode
  }

  /**
   * Simulate network delay
   */
  protected async simulateDelay(ms: number = 100): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Handle failure modes
   */
  protected async handleFailureMode(): Promise<void> {
    if (this.failureMode === 'timeout') {
      await this.simulateDelay(10000)
      throw new Error('Request timeout')
    }

    if (this.failureMode === 'error') {
      throw new Error('Service error')
    }

    if (this.failureMode === 'invalid_response') {
      throw new Error('Invalid response format')
    }
  }

  /**
   * Wrap response in standard format
   */
  protected wrapResponse<T>(data: T): AdapterResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date()
    }
  }

  /**
   * Wrap error in standard format
   */
  protected wrapError(error: string, statusCode: number = 500): AdapterResponse {
    return {
      success: false,
      error,
      statusCode,
      timestamp: new Date()
    }
  }
}
