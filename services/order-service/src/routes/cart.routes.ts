/**
 * Cart Routes
 */

import { Router } from 'express';
import { z } from 'zod';

export const cartRoutes = Router();

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Cart {
  userId: string;
  items: CartItem[];
  updatedAt: Date;
}

// In-memory cart store
const carts = new Map<string, Cart>();

const AddToCartInput = z.object({
  userId: z.string(),
  productId: z.string(),
  quantity: z.number().int().positive().default(1)
});

// GET /api/cart/:userId - Get cart
cartRoutes.get('/:userId', (req, res) => {
  const cart = carts.get(req.params.userId);

  if (!cart) {
    return res.json({
      userId: req.params.userId,
      items: [],
      subtotal: 0,
      itemCount: 0
    });
  }

  const subtotal = cart.items.reduce((sum, item) => sum + item.total, 0);
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  res.json({
    userId: cart.userId,
    items: cart.items,
    subtotal,
    itemCount,
    updatedAt: cart.updatedAt
  });
});

// POST /api/cart/add - Add item to cart
cartRoutes.post('/add', async (req, res) => {
  try {
    const input = AddToCartInput.parse(req.body);

    let cart = carts.get(input.userId);
    if (!cart) {
      cart = {
        userId: input.userId,
        items: [],
        updatedAt: new Date()
      };
    }

    // TODO: Get product details from Product Service
    const productName = 'Product Name';
    const unitPrice = 100;

    // Check if item already in cart
    const existingItem = cart.items.find(i => i.productId === input.productId);
    if (existingItem) {
      existingItem.quantity += input.quantity;
      existingItem.total = existingItem.quantity * existingItem.unitPrice;
    } else {
      cart.items.push({
        productId: input.productId,
        productName,
        quantity: input.quantity,
        unitPrice,
        total: input.quantity * unitPrice
      });
    }

    cart.updatedAt = new Date();
    carts.set(input.userId, cart);

    res.json({ cart, message: 'Item added to cart' });
  } catch (error: any) {
    res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
  }
});

// PUT /api/cart/update - Update item quantity
cartRoutes.put('/update', (req, res) => {
  const { userId, productId, quantity } = req.body;

  const cart = carts.get(userId);
  if (!cart) {
    return res.status(404).json({ error: 'Cart not found', code: 'NOT_FOUND' });
  }

  const item = cart.items.find(i => i.productId === productId);
  if (!item) {
    return res.status(404).json({ error: 'Item not in cart', code: 'NOT_FOUND' });
  }

  if (quantity <= 0) {
    cart.items = cart.items.filter(i => i.productId !== productId);
  } else {
    item.quantity = quantity;
    item.total = quantity * item.unitPrice;
  }

  cart.updatedAt = new Date();
  carts.set(userId, cart);

  res.json({ cart });
});

// DELETE /api/cart/:userId/item/:productId - Remove item
cartRoutes.delete('/:userId/item/:productId', (req, res) => {
  const { userId, productId } = req.params;

  const cart = carts.get(userId);
  if (!cart) {
    return res.status(404).json({ error: 'Cart not found', code: 'NOT_FOUND' });
  }

  cart.items = cart.items.filter(i => i.productId !== productId);
  cart.updatedAt = new Date();
  carts.set(userId, cart);

  res.json({ cart, message: 'Item removed' });
});

// DELETE /api/cart/:userId - Clear cart
cartRoutes.delete('/:userId', (req, res) => {
  carts.delete(req.params.userId);
  res.json({ success: true, message: 'Cart cleared' });
});
