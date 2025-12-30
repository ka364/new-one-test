/**
 * Inventory Bio-Module
 * Handles product management, stock tracking, and inventory movements
 * Based on ERPNext inventory standards
 */

import { BaseBioModule } from './base-module';
import type { BioMessage, BioModuleConfig, BioModuleHealth } from './types';

interface Product {
  id: string;
  productCode: string;
  productName: string;
  description?: string;
  category?: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  taxRate: number;
  stockQuantity: number;
  reorderLevel: number;
  isActive: boolean;
}

interface StockMovement {
  id: string;
  productId: string;
  movementType: 'in' | 'out' | 'adjustment';
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  timestamp: Date;
}

export class InventoryModule extends BaseBioModule {
  private products: Map<string, Product> = new Map();
  private stockMovements: StockMovement[] = [];

  constructor(config: BioModuleConfig) {
    super({
      ...config,
      id: 'inventory',
      name: 'Inventory Bio-Module',
      type: 'inventory',
      capabilities: ['product-management', 'stock-tracking', 'inventory-valuation'],
    });

    this.initializeSampleProducts();
  }

  /**
   * Initialize sample products for testing
   */
  private initializeSampleProducts(): void {
    const sampleProducts: Product[] = [
      {
        id: 'prod-001',
        productCode: 'PROD-001',
        productName: 'Laptop Dell XPS 15',
        description: 'High-performance laptop',
        category: 'Electronics',
        unit: 'piece',
        costPrice: 15000,
        sellingPrice: 20000,
        taxRate: 14,
        stockQuantity: 10,
        reorderLevel: 5,
        isActive: true,
      },
      {
        id: 'prod-002',
        productCode: 'PROD-002',
        productName: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse',
        category: 'Electronics',
        unit: 'piece',
        costPrice: 150,
        sellingPrice: 250,
        taxRate: 14,
        stockQuantity: 50,
        reorderLevel: 10,
        isActive: true,
      },
      {
        id: 'prod-003',
        productCode: 'PROD-003',
        productName: 'Office Chair',
        description: 'Comfortable office chair',
        category: 'Furniture',
        unit: 'piece',
        costPrice: 1200,
        sellingPrice: 1800,
        taxRate: 14,
        stockQuantity: 20,
        reorderLevel: 5,
        isActive: true,
      },
    ];

    sampleProducts.forEach(product => {
      this.products.set(product.id, product);
    });

    this.log('info', `Initialized ${sampleProducts.length} sample products`);
  }

  /**
   * Create a new product
   */
  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      ...product,
    };

    this.products.set(newProduct.id, newProduct);
    this.incrementMetric('products_created');
    this.log('info', `Created product ${newProduct.productCode}`);

    return newProduct;
  }

  /**
   * Get product by ID
   */
  getProduct(productId: string): Product | undefined {
    return this.products.get(productId);
  }

  /**
   * Get product by code
   */
  getProductByCode(productCode: string): Product | undefined {
    return Array.from(this.products.values()).find(p => p.productCode === productCode);
  }

  /**
   * Get all products
   */
  getAllProducts(): Product[] {
    return Array.from(this.products.values()).filter(p => p.isActive);
  }

  /**
   * Update stock quantity
   */
  async updateStock(
    productId: string,
    quantity: number,
    movementType: 'in' | 'out' | 'adjustment',
    referenceType?: string,
    referenceId?: string,
    notes?: string
  ): Promise<void> {
    const product = this.products.get(productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    // Calculate new quantity
    let newQuantity = product.stockQuantity;
    if (movementType === 'in') {
      newQuantity += quantity;
    } else if (movementType === 'out') {
      newQuantity -= quantity;
      if (newQuantity < 0) {
        throw new Error(`Insufficient stock for product ${product.productName}. Available: ${product.stockQuantity}, Required: ${quantity}`);
      }
    } else if (movementType === 'adjustment') {
      newQuantity = quantity;
    }

    // Record stock movement
    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId,
      movementType,
      quantity,
      referenceType,
      referenceId,
      notes,
      timestamp: new Date(),
    };

    this.stockMovements.push(movement);
    product.stockQuantity = newQuantity;

    this.incrementMetric('stock_movements');
    this.log('info', `Updated stock for ${product.productName}: ${movementType} ${quantity} units. New quantity: ${newQuantity}`);

    // Check reorder level
    if (newQuantity <= product.reorderLevel) {
      this.log('warn', `Product ${product.productName} is below reorder level! Current: ${newQuantity}, Reorder: ${product.reorderLevel}`);
      
      // Send alert message to other modules
      await this.sendMessage({
        to: 'all',
        action: 'stock_alert',
        payload: {
          productId: product.id,
          productName: product.productName,
          currentStock: newQuantity,
          reorderLevel: product.reorderLevel,
        },
      });
    }
  }

  /**
   * Reserve stock for a sale (before actual sale)
   */
  async reserveStock(productId: string, quantity: number, referenceId: string): Promise<void> {
    const product = this.products.get(productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    if (product.stockQuantity < quantity) {
      throw new Error(`Insufficient stock for ${product.productName}. Available: ${product.stockQuantity}, Required: ${quantity}`);
    }

    this.log('info', `Reserved ${quantity} units of ${product.productName} for ${referenceId}`);
    // In a real system, you would track reservations separately
  }

  /**
   * Get stock movements for a product
   */
  getStockMovements(productId: string): StockMovement[] {
    return this.stockMovements.filter(m => m.productId === productId);
  }

  /**
   * Get total inventory value
   */
  getTotalInventoryValue(): number {
    let total = 0;
    for (const product of this.products.values()) {
      total += product.costPrice * product.stockQuantity;
    }
    return total;
  }

  /**
   * Get products below reorder level
   */
  getProductsBelowReorderLevel(): Product[] {
    return Array.from(this.products.values()).filter(
      p => p.isActive && p.stockQuantity <= p.reorderLevel
    );
  }

  /**
   * Handle incoming bio-messages
   */
  protected async handleMessage(message: BioMessage): Promise<void> {
    switch (message.action) {
      case 'check_stock':
        // Check if stock is available for a sale
        const { productId, quantity } = message.payload;
        const product = this.products.get(productId);
        const available = product ? product.stockQuantity >= quantity : false;
        
        await this.sendMessage({
          to: message.from,
          action: 'stock_check_response',
          payload: {
            productId,
            available,
            currentStock: product?.stockQuantity || 0,
          },
        });
        break;

      case 'reserve_stock':
        // Reserve stock for a pending sale
        await this.reserveStock(
          message.payload.productId,
          message.payload.quantity,
          message.payload.referenceId
        );
        break;

      case 'deduct_stock':
        // Deduct stock after sale is confirmed
        await this.updateStock(
          message.payload.productId,
          message.payload.quantity,
          'out',
          message.payload.referenceType,
          message.payload.referenceId,
          message.payload.notes
        );
        
        // Notify Financial module about inventory change
        await this.sendMessage({
          to: 'financial',
          action: 'update_inventory_value',
          payload: {
            productId: message.payload.productId,
            quantity: message.payload.quantity,
            value: this.getTotalInventoryValue(),
          },
        });
        break;

      case 'get_product':
        // Get product details
        const prod = this.products.get(message.payload.productId);
        await this.sendMessage({
          to: message.from,
          action: 'product_response',
          payload: prod,
        });
        break;

      case 'get_all_products':
        // Get all active products
        await this.sendMessage({
          to: message.from,
          action: 'products_list_response',
          payload: this.getAllProducts(),
        });
        break;

      default:
        this.log('warn', `Unknown action: ${message.action}`);
    }
  }

  /**
   * Get module health status
   */
  getHealth(): BioModuleHealth {
    const lowStockProducts = this.getProductsBelowReorderLevel();
    
    return {
      ...super.getHealth(),
      metrics: {
        ...this.metrics,
        total_products: this.products.size,
        active_products: this.getAllProducts().length,
        total_stock_movements: this.stockMovements.length,
        total_inventory_value: this.getTotalInventoryValue(),
        low_stock_products: lowStockProducts.length,
      },
    };
  }
}
