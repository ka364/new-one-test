# HADEROS Routers Documentation

## Overview

This directory contains all tRPC routers for the HADEROS e-commerce platform.

## Routers

### Core Business Routers

| Router | File | Description |
|--------|------|-------------|
| Orders | `orders.ts` | Order management, creation, status updates |
| Products | `products.ts` | Product catalog, inventory, pricing |
| Inventory | `inventory.ts` | Stock management, transfers, alerts |
| Payment | `payment.ts` | Payment processing, transactions |
| COD | `cod.router.ts` | Cash on Delivery workflow |

### Supporting Routers

| Router | File | Description |
|--------|------|-------------|
| Users | `users.ts` | User management, profiles |
| Branches | `branches.ts` | Branch/store management |
| Coupons | `coupons.ts` | Discount codes, promotions |
| Shipping | `shipping.ts` | Shipping calculations, tracking |

## Quality Standards

All routers follow these standards:

- **TRPCError**: Type-safe error handling with Arabic messages
- **Performance Tracking**: `startTime`/`duration` pattern
- **Input Validation**: Zod schemas with custom validation
- **Logging**: Structured logging with `logger`
- **Bio-Module Integration**: AI-powered features

## Usage Example

```typescript
import { ordersRouter } from './orders';

// Create order
const order = await trpc.orders.createOrder.mutate({
  customerName: 'أحمد محمد',
  customerPhone: '01012345678',
  items: [{ productId: 1, quantity: 2, price: 299.99 }],
  totalAmount: 599.98,
});
```

## Error Handling

All routers use TRPCError with Arabic messages:

```typescript
throw new TRPCError({
  code: 'BAD_REQUEST',
  message: 'رقم الهاتف غير صحيح',
});
```

## Performance

Each mutation/query tracks performance:

```typescript
const startTime = Date.now();
// ... operation
const duration = Date.now() - startTime;
logger.info('Operation completed', { duration });
```
