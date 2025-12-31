/**
 * Mock E-commerce Adapter
 * Simulates e-commerce platforms (Shopify, WooCommerce, Magento)
 */

import { BaseAdapter, AdapterResponse, AdapterConfig } from '../base-adapter'

export interface EcommerceProduct {
  id: string
  title: string
  description: string
  price: number
  compareAtPrice?: number
  sku: string
  inventory: number
  images: string[]
  variants?: ProductVariant[]
  status: 'active' | 'draft' | 'archived'
}

export interface ProductVariant {
  id: string
  title: string
  price: number
  sku: string
  inventory: number
  options: Record<string, string>
}

export interface EcommerceOrder {
  id: string
  orderNumber: string
  customer: {
    id: string
    email: string
    name: string
  }
  items: OrderItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  createdAt: Date
}

export interface OrderItem {
  productId: string
  variantId?: string
  title: string
  quantity: number
  price: number
}

export class MockEcommerceAdapter extends BaseAdapter {
  private products = new Map<string, EcommerceProduct>()
  private orders = new Map<string, EcommerceOrder>()

  constructor(config: AdapterConfig = {}) {
    super(config)
  }

  async getProduct(productId: string): Promise<AdapterResponse<EcommerceProduct>> {
    await this.simulateDelay(150)

    const product = this.products.get(productId)

    if (!product) {
      return this.wrapError('Product not found', 404)
    }

    return this.wrapResponse(product)
  }

  async createProduct(product: Omit<EcommerceProduct, 'id'>): Promise<AdapterResponse<EcommerceProduct>> {
    await this.handleFailureMode()
    await this.simulateDelay(250)

    const newProduct: EcommerceProduct = {
      id: `prod_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      ...product
    }

    this.products.set(newProduct.id, newProduct)

    return this.wrapResponse(newProduct)
  }

  async updateProduct(
    productId: string,
    updates: Partial<EcommerceProduct>
  ): Promise<AdapterResponse<EcommerceProduct>> {
    await this.handleFailureMode()
    await this.simulateDelay(200)

    const product = this.products.get(productId)

    if (!product) {
      return this.wrapError('Product not found', 404)
    }

    const updatedProduct = { ...product, ...updates, id: productId }
    this.products.set(productId, updatedProduct)

    return this.wrapResponse(updatedProduct)
  }

  async deleteProduct(productId: string): Promise<AdapterResponse<{ deleted: boolean }>> {
    await this.handleFailureMode()
    await this.simulateDelay(150)

    const deleted = this.products.delete(productId)

    if (!deleted) {
      return this.wrapError('Product not found', 404)
    }

    return this.wrapResponse({ deleted: true })
  }

  async listProducts(params?: {
    limit?: number
    status?: string
  }): Promise<AdapterResponse<EcommerceProduct[]>> {
    await this.simulateDelay(200)

    let products = Array.from(this.products.values())

    if (params?.status) {
      products = products.filter(p => p.status === params.status)
    }

    if (params?.limit) {
      products = products.slice(0, params.limit)
    }

    return this.wrapResponse(products)
  }

  async syncInventory(
    productId: string,
    inventory: number
  ): Promise<AdapterResponse<{ synced: boolean }>> {
    await this.handleFailureMode()
    await this.simulateDelay(150)

    const product = this.products.get(productId)

    if (!product) {
      return this.wrapError('Product not found', 404)
    }

    product.inventory = inventory
    this.products.set(productId, product)

    return this.wrapResponse({ synced: true })
  }

  async getOrder(orderId: string): Promise<AdapterResponse<EcommerceOrder>> {
    await this.simulateDelay(150)

    const order = this.orders.get(orderId)

    if (!order) {
      return this.wrapError('Order not found', 404)
    }

    return this.wrapResponse(order)
  }

  async createOrder(orderData: Omit<EcommerceOrder, 'id' | 'orderNumber' | 'createdAt'>): Promise<AdapterResponse<EcommerceOrder>> {
    await this.handleFailureMode()
    await this.simulateDelay(300)

    const order: EcommerceOrder = {
      id: `order_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      orderNumber: `#${Date.now()}${Math.floor(Math.random() * 1000)}`,
      ...orderData,
      createdAt: new Date()
    }

    this.orders.set(order.id, order)

    return this.wrapResponse(order)
  }

  async updateOrderStatus(
    orderId: string,
    status: EcommerceOrder['status']
  ): Promise<AdapterResponse<EcommerceOrder>> {
    await this.handleFailureMode()
    await this.simulateDelay(200)

    const order = this.orders.get(orderId)

    if (!order) {
      return this.wrapError('Order not found', 404)
    }

    order.status = status
    this.orders.set(orderId, order)

    return this.wrapResponse(order)
  }

  /**
   * Test helper: Clear all data
   */
  clearAll(): void {
    this.products.clear()
    this.orders.clear()
  }

  /**
   * Test helper: Get all products
   */
  getAllProducts(): EcommerceProduct[] {
    return Array.from(this.products.values())
  }

  /**
   * Test helper: Get all orders
   */
  getAllOrders(): EcommerceOrder[] {
    return Array.from(this.orders.values())
  }
}
