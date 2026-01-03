/**
 * Product Routes
 */

import { Router } from 'express';
import { nanoid } from 'nanoid';
import { CreateProductInput, UpdateProductInput, Product, ReserveStockInput } from '../models/product.model';

export const productRoutes = Router();

// In-memory store
const products = new Map<string, Product>();

// Initialize with sample data
const sampleProducts: Product[] = [
  {
    id: 'prod-001',
    sku: 'SHOE-001',
    nameEn: 'Classic Running Shoes',
    nameAr: 'حذاء رياضي كلاسيكي',
    descriptionEn: 'High-quality running shoes for everyday use',
    price: 599,
    originalPrice: 799,
    discountPercentage: 25,
    currency: 'EGP',
    stockQuantity: 100,
    reservedStock: 0,
    minimumStockLevel: 10,
    tags: ['shoes', 'running', 'sports'],
    images: [{ url: 'https://example.com/shoe.jpg', isPrimary: true }],
    averageRating: 4.5,
    reviewCount: 120,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];
sampleProducts.forEach(p => products.set(p.id, p));

// GET /api/products - List products
productRoutes.get('/', (req, res) => {
  const { category, search, minPrice, maxPrice, status, page = 1, limit = 20 } = req.query;

  let productList = Array.from(products.values());

  // Filters
  if (category) {
    productList = productList.filter(p => p.categoryId === category);
  }
  if (search) {
    const searchStr = (search as string).toLowerCase();
    productList = productList.filter(p =>
      p.nameEn.toLowerCase().includes(searchStr) ||
      p.nameAr?.toLowerCase().includes(searchStr) ||
      p.tags?.some(t => t.toLowerCase().includes(searchStr))
    );
  }
  if (minPrice) {
    productList = productList.filter(p => p.price >= Number(minPrice));
  }
  if (maxPrice) {
    productList = productList.filter(p => p.price <= Number(maxPrice));
  }
  if (status) {
    productList = productList.filter(p => p.status === status);
  }

  // Pagination
  const start = (Number(page) - 1) * Number(limit);
  const paginated = productList.slice(start, start + Number(limit));

  res.json({
    products: paginated,
    total: productList.length,
    page: Number(page),
    totalPages: Math.ceil(productList.length / Number(limit))
  });
});

// GET /api/products/:id - Get product
productRoutes.get('/:id', (req, res) => {
  const product = products.get(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found', code: 'NOT_FOUND' });
  }
  res.json({ product });
});

// POST /api/products - Create product
productRoutes.post('/', (req, res) => {
  try {
    const input = CreateProductInput.parse(req.body);

    const product: Product = {
      id: nanoid(),
      ...input,
      discountPercentage: input.originalPrice
        ? Math.round(((input.originalPrice - input.price) / input.originalPrice) * 100)
        : 0,
      currency: 'EGP',
      reservedStock: 0,
      minimumStockLevel: 5,
      tags: input.tags || [],
      images: [],
      averageRating: 0,
      reviewCount: 0,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    products.set(product.id, product);

    // Emit event: product.created
    console.log('Event: product.created', { productId: product.id });

    res.status(201).json({ product });
  } catch (error: any) {
    res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
  }
});

// PUT /api/products/:id - Update product
productRoutes.put('/:id', (req, res) => {
  try {
    const product = products.get(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found', code: 'NOT_FOUND' });
    }

    const input = UpdateProductInput.parse(req.body);
    const updated: Product = {
      ...product,
      ...input,
      updatedAt: new Date()
    };

    products.set(req.params.id, updated);

    // Emit event: product.updated
    console.log('Event: product.updated', { productId: updated.id });

    res.json({ product: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
  }
});

// DELETE /api/products/:id - Delete product
productRoutes.delete('/:id', (req, res) => {
  if (!products.has(req.params.id)) {
    return res.status(404).json({ error: 'Product not found', code: 'NOT_FOUND' });
  }
  products.delete(req.params.id);
  res.json({ success: true });
});

// POST /api/products/reserve-stock - Reserve stock for order
productRoutes.post('/reserve-stock', (req, res) => {
  try {
    const input = ReserveStockInput.parse(req.body);
    const product = products.get(input.productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found', code: 'NOT_FOUND' });
    }

    const availableStock = product.stockQuantity - product.reservedStock;
    if (availableStock < input.quantity) {
      return res.status(400).json({
        error: 'Insufficient stock',
        code: 'INSUFFICIENT_STOCK',
        available: availableStock
      });
    }

    product.reservedStock += input.quantity;
    products.set(product.id, product);

    // Check if below minimum
    if (product.stockQuantity - product.reservedStock <= product.minimumStockLevel) {
      console.log('Event: inventory.low_stock', { productId: product.id });
    }

    res.json({
      success: true,
      reserved: input.quantity,
      availableStock: product.stockQuantity - product.reservedStock
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
  }
});
