/**
 * Merchant Store System
 * نظام متاجر التجار
 * 
 * This system allows traders to purchase products wholesale from factories,
 * manage their own stores within HADEROS, and have the platform handle
 * all sales operations on their behalf.
 */

export interface Merchant {
  id: string;
  name: string;
  nameAr: string;
  phone: string;
  email?: string;
  businessType: 'retailer' | 'wholesaler' | 'distributor';
  status: 'active' | 'inactive' | 'suspended';
  joinDate: Date;
  storeId: string;
  storeName: string;
  storeNameAr: string;
  storeUrl: string; // e.g., "haderos.com/store/merchant123"
  totalPurchases: number;
  totalSales: number;
  totalProfit: number;
  creditLimit: number;
  currentCredit: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  bankAccount?: {
    accountNumber: string;
    bankName: string;
    accountName: string;
  };
}

export interface MerchantInventory {
  id: string;
  merchantId: string;
  productId: string;
  productName: string;
  productNameAr: string;
  factoryId: string;
  factoryName: string;
  purchasePrice: number; // What merchant paid
  sellingPrice: number; // What merchant sells for
  quantity: number;
  reservedQuantity: number; // Reserved for pending orders
  availableQuantity: number; // quantity - reservedQuantity
  minStockLevel: number; // Alert when below this
  purchaseDate: Date;
  lastSaleDate?: Date;
  totalSold: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface MerchantOrder {
  id: string;
  orderNumber: string;
  merchantId: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: Array<{
    inventoryId: string;
    productId: string;
    productName: string;
    productNameAr: string;
    quantity: number;
    price: number;
    cost: number; // Merchant's purchase price
  }>;
  subtotal: number;
  shippingFee: number;
  total: number;
  totalCost: number; // Total cost to merchant
  profit: number; // total - totalCost
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod: 'cash_on_delivery' | 'online' | 'bank_transfer';
  shippingCompany?: string;
  trackingNumber?: string;
  orderDate: Date;
  confirmedDate?: Date;
  shippedDate?: Date;
  deliveredDate?: Date;
  notes?: string;
}

export interface WholesalePurchase {
  id: string;
  purchaseNumber: string;
  merchantId: string;
  factoryId: string;
  factoryName: string;
  items: Array<{
    productId: string;
    productName: string;
    productNameAr: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: 'credit' | 'cash' | 'bank_transfer';
  status: 'pending' | 'confirmed' | 'shipped' | 'received';
  purchaseDate: Date;
  receivedDate?: Date;
  dueDate?: Date;
}

/**
 * Merchant Store Manager
 */
export class MerchantStoreManager {
  private merchants: Map<string, Merchant> = new Map();
  private inventory: Map<string, MerchantInventory> = new Map();
  private orders: Map<string, MerchantOrder> = new Map();
  private purchases: Map<string, WholesalePurchase> = new Map();

  /**
   * Register a new merchant
   */
  registerMerchant(
    name: string,
    nameAr: string,
    phone: string,
    email: string | undefined,
    businessType: 'retailer' | 'wholesaler' | 'distributor',
    storeName: string,
    storeNameAr: string
  ): Merchant {
    const merchantId = `MER${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const storeId = `STORE${Date.now()}`;
    const storeUrl = `haderos.com/store/${merchantId.toLowerCase()}`;

    const merchant: Merchant = {
      id: merchantId,
      name,
      nameAr,
      phone,
      email,
      businessType,
      status: 'active',
      joinDate: new Date(),
      storeId,
      storeName,
      storeNameAr,
      storeUrl,
      totalPurchases: 0,
      totalSales: 0,
      totalProfit: 0,
      creditLimit: 50000, // Default credit limit
      currentCredit: 0,
      tier: 'bronze',
    };

    this.merchants.set(merchantId, merchant);
    console.log(`✅ Registered new merchant: ${name} (${merchantId})`);
    return merchant;
  }

  /**
   * Create a wholesale purchase order
   */
  createWholesalePurchase(
    merchantId: string,
    factoryId: string,
    factoryName: string,
    items: Array<{
      productId: string;
      productName: string;
      productNameAr: string;
      quantity: number;
      unitPrice: number;
    }>,
    discount: number = 0,
    paymentMethod: 'credit' | 'cash' | 'bank_transfer' = 'credit'
  ): WholesalePurchase {
    const merchant = this.merchants.get(merchantId);
    if (!merchant) {
      throw new Error(`Merchant ${merchantId} not found`);
    }

    const purchaseId = `WP${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const purchaseNumber = `#WP${purchaseId.slice(-8)}`;

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const total = subtotal - discount;

    const purchase: WholesalePurchase = {
      id: purchaseId,
      purchaseNumber,
      merchantId,
      factoryId,
      factoryName,
      items: items.map(item => ({
        ...item,
        total: item.quantity * item.unitPrice,
      })),
      subtotal,
      discount,
      total,
      paymentStatus: 'pending',
      paidAmount: 0,
      remainingAmount: total,
      paymentMethod,
      status: 'pending',
      purchaseDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };

    this.purchases.set(purchaseId, purchase);

    // Update merchant stats
    merchant.totalPurchases += total;
    if (paymentMethod === 'credit') {
      merchant.currentCredit += total;
    }

    console.log(`📦 Created wholesale purchase ${purchaseNumber} for merchant ${merchant.name}`);
    return purchase;
  }

  /**
   * Receive wholesale purchase and add to inventory
   */
  receiveWholesalePurchase(
    purchaseId: string,
    suggestedSellingPrices: Map<string, number>
  ): void {
    const purchase = this.purchases.get(purchaseId);
    if (!purchase) {
      throw new Error(`Purchase ${purchaseId} not found`);
    }

    purchase.status = 'received';
    purchase.receivedDate = new Date();

    // Add items to merchant inventory
    purchase.items.forEach(item => {
      const sellingPrice = suggestedSellingPrices.get(item.productId) || item.unitPrice * 1.3; // 30% markup default

      const inventoryId = `INV${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const inventory: MerchantInventory = {
        id: inventoryId,
        merchantId: purchase.merchantId,
        productId: item.productId,
        productName: item.productName,
        productNameAr: item.productNameAr,
        factoryId: purchase.factoryId,
        factoryName: purchase.factoryName,
        purchasePrice: item.unitPrice,
        sellingPrice,
        quantity: item.quantity,
        reservedQuantity: 0,
        availableQuantity: item.quantity,
        minStockLevel: Math.ceil(item.quantity * 0.2), // 20% of initial quantity
        purchaseDate: new Date(),
        totalSold: 0,
        status: 'in_stock',
      };

      this.inventory.set(inventoryId, inventory);
    });

    console.log(`✅ Received purchase ${purchase.purchaseNumber} and added to inventory`);
  }

  /**
   * Create a customer order (managed by HADEROS)
   */
  createCustomerOrder(
    merchantId: string,
    customerName: string,
    customerPhone: string,
    customerAddress: string,
    items: Array<{
      inventoryId: string;
      quantity: number;
    }>,
    shippingFee: number,
    paymentMethod: 'cash_on_delivery' | 'online' | 'bank_transfer'
  ): MerchantOrder {
    const merchant = this.merchants.get(merchantId);
    if (!merchant) {
      throw new Error(`Merchant ${merchantId} not found`);
    }

    const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const orderNumber = `#${orderId.slice(-8)}`;

    // Build order items and calculate totals
    const orderItems = items.map(item => {
      const inventory = this.inventory.get(item.inventoryId);
      if (!inventory) {
        throw new Error(`Inventory ${item.inventoryId} not found`);
      }

      if (inventory.availableQuantity < item.quantity) {
        throw new Error(`Insufficient stock for ${inventory.productNameAr}`);
      }

      // Reserve the quantity
      inventory.reservedQuantity += item.quantity;
      inventory.availableQuantity -= item.quantity;

      return {
        inventoryId: item.inventoryId,
        productId: inventory.productId,
        productName: inventory.productName,
        productNameAr: inventory.productNameAr,
        quantity: item.quantity,
        price: inventory.sellingPrice,
        cost: inventory.purchasePrice,
      };
    });

    const subtotal = orderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const total = subtotal + shippingFee;
    const totalCost = orderItems.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
    const profit = total - totalCost - shippingFee;

    const order: MerchantOrder = {
      id: orderId,
      orderNumber,
      merchantId,
      customerName,
      customerPhone,
      customerAddress,
      items: orderItems,
      subtotal,
      shippingFee,
      total,
      totalCost,
      profit,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod,
      orderDate: new Date(),
    };

    this.orders.set(orderId, order);

    console.log(`🛒 Created order ${orderNumber} for merchant ${merchant.name} - Profit: ${profit} EGP`);
    return order;
  }

  /**
   * Confirm and ship an order
   */
  confirmAndShipOrder(
    orderId: string,
    shippingCompany: string,
    trackingNumber: string
  ): void {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const merchant = this.merchants.get(order.merchantId);
    if (!merchant) {
      throw new Error(`Merchant ${order.merchantId} not found`);
    }

    order.status = 'shipped';
    order.confirmedDate = new Date();
    order.shippedDate = new Date();
    order.shippingCompany = shippingCompany;
    order.trackingNumber = trackingNumber;

    // Update inventory
    order.items.forEach(item => {
      const inventory = this.inventory.get(item.inventoryId);
      if (inventory) {
        inventory.quantity -= item.quantity;
        inventory.reservedQuantity -= item.quantity;
        inventory.totalSold += item.quantity;
        inventory.lastSaleDate = new Date();

        // Update stock status
        if (inventory.quantity === 0) {
          inventory.status = 'out_of_stock';
        } else if (inventory.quantity <= inventory.minStockLevel) {
          inventory.status = 'low_stock';
        }
      }
    });

    // Update merchant stats
    merchant.totalSales += order.total;
    merchant.totalProfit += order.profit;

    console.log(`📦 Shipped order ${order.orderNumber} via ${shippingCompany}`);
  }

  /**
   * Get merchant dashboard data
   */
  getMerchantDashboard(merchantId: string): {
    merchant: Merchant;
    stats: {
      totalInventoryValue: number;
      totalInventoryItems: number;
      lowStockItems: number;
      pendingOrders: number;
      todayOrders: number;
      todaySales: number;
      todayProfit: number;
      monthSales: number;
      monthProfit: number;
    };
    recentOrders: MerchantOrder[];
    lowStockItems: MerchantInventory[];
  } {
    const merchant = this.merchants.get(merchantId);
    if (!merchant) {
      throw new Error(`Merchant ${merchantId} not found`);
    }

    const merchantInventory = Array.from(this.inventory.values())
      .filter(inv => inv.merchantId === merchantId);

    const merchantOrders = Array.from(this.orders.values())
      .filter(ord => ord.merchantId === merchantId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = merchantOrders.filter(ord => ord.orderDate >= today);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthOrders = merchantOrders.filter(ord => ord.orderDate >= thisMonth);

    return {
      merchant,
      stats: {
        totalInventoryValue: merchantInventory.reduce(
          (sum, inv) => sum + (inv.quantity * inv.purchasePrice),
          0
        ),
        totalInventoryItems: merchantInventory.reduce((sum, inv) => sum + inv.quantity, 0),
        lowStockItems: merchantInventory.filter(inv => inv.status === 'low_stock').length,
        pendingOrders: merchantOrders.filter(ord => ord.status === 'pending').length,
        todayOrders: todayOrders.length,
        todaySales: todayOrders.reduce((sum, ord) => sum + ord.total, 0),
        todayProfit: todayOrders.reduce((sum, ord) => sum + ord.profit, 0),
        monthSales: monthOrders.reduce((sum, ord) => sum + ord.total, 0),
        monthProfit: monthOrders.reduce((sum, ord) => sum + ord.profit, 0),
      },
      recentOrders: merchantOrders
        .sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime())
        .slice(0, 10),
      lowStockItems: merchantInventory
        .filter(inv => inv.status === 'low_stock' || inv.status === 'out_of_stock')
        .sort((a, b) => a.quantity - b.quantity),
    };
  }

  /**
   * Get merchant inventory
   */
  getMerchantInventory(merchantId: string): MerchantInventory[] {
    return Array.from(this.inventory.values())
      .filter(inv => inv.merchantId === merchantId);
  }

  /**
   * Get merchant orders
   */
  getMerchantOrders(merchantId: string): MerchantOrder[] {
    return Array.from(this.orders.values())
      .filter(ord => ord.merchantId === merchantId)
      .sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
  }
}

// Singleton instance
let merchantStoreManager: MerchantStoreManager | null = null;

/**
 * Get the merchant store manager instance
 */
export function getMerchantStoreManager(): MerchantStoreManager {
  if (!merchantStoreManager) {
    merchantStoreManager = new MerchantStoreManager();
  }
  return merchantStoreManager;
}
