# 🔧 دليل التكامل الكامل - HADEROS AI CLOUD
## Integration Guide - Security, Caching, Validation & Logging

**التاريخ:** 30 ديسمبر 2025
**الحالة:** ✅ جاهز للتطبيق
**المدة المتوقعة:** 2-4 ساعات

---

## 📋 جدول المحتويات

1. [الملفات المُعدّلة](#الملفات-المعدلة)
2. [التغييرات التفصيلية](#التغييرات-التفصيلية)
3. [كيفية استخدام Validation](#validation-usage)
4. [كيفية استخدام Cache](#cache-usage)
5. [كيفية استخدام Logger](#logger-usage)
6. [كيفية استخدام Security](#security-usage)
7. [الاختبار](#testing)
8. [Troubleshooting](#troubleshooting)

---

## ✅ الملفات المُعدّلة

### 1. ملفات تم تحديثها:

```
✅ apps/haderos-web/server/_core/index.ts
   - إضافة security middleware
   - إضافة rate limiting
   - إضافة structured logging
   - إضافة graceful shutdown

✅ apps/haderos-web/package.json
   - إضافة helmet
   - إضافة express-rate-limit
   - إضافة cors
```

### 2. ملفات جديدة:

```
✅ apps/haderos-web/server/_core/security.ts (350+ lines)
✅ apps/haderos-web/server/_core/cache.ts (120+ lines)
✅ apps/haderos-web/server/_core/logger.ts (100+ lines)
✅ apps/haderos-web/server/_core/validation.ts (450+ lines)
✅ apps/haderos-web/.env.example (200+ lines)
```

### 3. ملفات أمثلة (للمرجع):

```
✅ apps/haderos-web/server/routers/auth-example.ts
✅ apps/haderos-web/server/routers/products-cached-example.ts
```

---

## 📝 التغييرات التفصيلية

### في `server/_core/index.ts`:

#### قبل:

```typescript
import "dotenv/config";
import express from "express";
// ... other imports

async function startServer() {
  const app = express();

  // Basic middleware
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Routes
  app.use("/api/trpc", createExpressMiddleware({
    router: appRouter,
    createContext,
  }));

  // Start server
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
```

#### بعد:

```typescript
import "dotenv/config";
import express from "express";
import cors from "cors"; // ← NEW
import { securityMiddleware } from "./security"; // ← NEW
import { logger } from "./logger"; // ← NEW
// ... other imports

async function startServer() {
  const app = express();

  // ============================================
  // 🔒 SECURITY MIDDLEWARE (Priority 1)
  // ============================================

  app.use(securityMiddleware.helmet); // ← NEW: Security headers
  app.use(cors(securityMiddleware.cors)); // ← NEW: CORS protection
  app.use(logger.requestLogger()); // ← NEW: Request logging

  // Basic middleware
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(securityMiddleware.validateBody); // ← NEW: Input validation

  // ============================================
  // 🛡️ RATE LIMITING (Priority 2)
  // ============================================

  app.use("/api/oauth", securityMiddleware.rateLimit.auth); // ← NEW
  app.use("/api/upload", securityMiddleware.rateLimit.upload); // ← NEW
  app.use("/api/trpc", securityMiddleware.rateLimit.api); // ← NEW
  app.use(securityMiddleware.rateLimit.general); // ← NEW

  // Routes
  app.use("/api/trpc", createExpressMiddleware({
    router: appRouter,
    createContext,
  }));

  // Start server with enhanced logging
  server.listen(port, () => {
    logger.info(`🚀 Server started successfully`, { // ← NEW
      port,
      environment: process.env.NODE_ENV || 'development',
      securityEnabled: true,
      rateLimitingEnabled: true,
    });
    console.log(`✅ Server running on http://localhost:${port}/`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => { // ← NEW
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });
}
```

---

## 🔐 Validation Usage

### في tRPC Routers:

#### مثال 1: Authentication Router

```typescript
import { router, publicProcedure } from '../_core/trpc';
import { schemas } from '../_core/validation'; // ← Import schemas
import { logger } from '../_core/logger';

export const authRouter = router({
  // Login with validation
  login: publicProcedure
    .input(schemas.login) // ← Use Zod schema
    .mutation(async ({ input, ctx }) => {
      // input is now type-safe and validated!
      // input.email: string (validated email format)
      // input.password: string
      // input.rememberMe?: boolean

      logger.info('Login attempt', { email: input.email });

      // Your logic here...
      const user = await findUserByEmail(input.email);

      if (!user || !await verifyPassword(input.password, user.passwordHash)) {
        logger.warn('Login failed', { email: input.email });
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      return { success: true, user };
    }),

  // Register with validation
  register: publicProcedure
    .input(schemas.register) // ← Validates password strength, email, etc.
    .mutation(async ({ input, ctx }) => {
      // input.password already validated for:
      // - Min 8 characters
      // - Uppercase letter
      // - Lowercase letter
      // - Number
      // - Special character

      logger.info('Registration attempt', { email: input.email });

      // Your logic here...
    }),
});
```

#### مثال 2: Orders Router

```typescript
import { schemas } from '../_core/validation';

export const ordersRouter = router({
  create: protectedProcedure
    .input(schemas.createOrder) // ← Validates: items, customer info, etc.
    .mutation(async ({ input, ctx }) => {
      // input.items: validated array with at least 1 item
      // input.customerPhone: validated phone number format
      // input.paymentMethod: enum ('cod' | 'card' | 'bank_transfer' | 'wallet')

      logger.info('Creating order', {
        userId: ctx.user.id,
        itemsCount: input.items.length,
        paymentMethod: input.paymentMethod,
      });

      // Create order...
    }),

  updateStatus: protectedProcedure
    .input(schemas.updateOrderStatus)
    .mutation(async ({ input, ctx }) => {
      // input.status: validated enum
      // input.orderId: validated string

      logger.info('Updating order status', {
        orderId: input.orderId,
        newStatus: input.status,
        userId: ctx.user.id,
      });

      // Update order...
    }),
});
```

#### مثال 3: Custom Validation

```typescript
import { z } from 'zod';

// Custom schema for specific needs
const customSchema = z.object({
  productId: z.string().uuid('Must be valid UUID'),
  quantity: z.number().int().min(1).max(1000),
  discount: z.number().min(0).max(100).optional(),
  notes: z.string().max(500).optional(),
});

export const customRouter = router({
  addToCart: protectedProcedure
    .input(customSchema)
    .mutation(async ({ input, ctx }) => {
      // Fully validated and type-safe
    }),
});
```

### Error Handling:

```typescript
// Zod errors are automatically formatted by tRPC
// Client will receive:
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed",
    "data": {
      "zodError": {
        "fieldErrors": {
          "email": ["Invalid email address"],
          "password": ["Password must be at least 8 characters"]
        }
      }
    }
  }
}
```

---

## 💾 Cache Usage

### مثال 1: Simple Caching

```typescript
import { cache } from '../_core/cache';

export const productsRouter = router({
  getAll: publicProcedure
    .query(async ({ ctx }) => {
      // Cache key
      const cacheKey = 'products:all';

      // Try cache first, then database
      return cache.getOrSet(
        cacheKey,
        async () => {
          // This only runs on cache miss
          logger.info('Cache miss - fetching from DB');
          return await ctx.db.query.products.findMany();
        },
        300 // TTL: 5 minutes
      );
    }),
});
```

### مثال 2: Cache with Parameters

```typescript
export const productsRouter = router({
  getByCategory: publicProcedure
    .input(z.object({
      category: z.string(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      // Dynamic cache key based on parameters
      const cacheKey = `products:category:${input.category}:${input.page}:${input.limit}`;

      return cache.getOrSet(
        cacheKey,
        async () => {
          return await ctx.db.query.products.findMany({
            where: (products, { eq }) => eq(products.category, input.category),
            limit: input.limit,
            offset: (input.page - 1) * input.limit,
          });
        },
        300
      );
    }),
});
```

### مثال 3: Cache Invalidation

```typescript
export const productsRouter = router({
  create: adminProcedure
    .input(schemas.createProduct)
    .mutation(async ({ input, ctx }) => {
      // Create product
      const newProduct = await ctx.db.insert(products).values(input);

      // ⚠️ IMPORTANT: Invalidate cache
      cache.delete('products:all');
      cache.delete('products:category:' + input.category);

      logger.info('Product created and cache invalidated', {
        productId: newProduct.id,
      });

      return newProduct;
    }),

  update: adminProcedure
    .input(z.object({ id: z.string(), data: schemas.updateProduct }))
    .mutation(async ({ input, ctx }) => {
      const updated = await ctx.db.update(products)
        .set(input.data)
        .where(eq(products.id, input.id));

      // Invalidate specific product + lists
      cache.delete(`product:${input.id}`);
      cache.delete('products:all');

      return updated;
    }),
});
```

### مثال 4: Monitoring Cache

```typescript
export const adminRouter = router({
  getCacheStats: adminProcedure
    .query(() => {
      const stats = cache.getStats();

      // Returns:
      // {
      //   hits: 150,
      //   misses: 50,
      //   sets: 50,
      //   deletes: 10,
      //   size: 45,
      //   hitRate: "75.00%"
      // }

      return stats;
    }),

  clearCache: adminProcedure
    .mutation(() => {
      cache.clear();
      logger.warn('All cache cleared by admin');
      return { success: true };
    }),
});
```

### Cache Best Practices:

```typescript
/**
 * ✅ DO:
 * - Cache read-heavy, write-light data
 * - Use descriptive cache keys (e.g., 'products:category:shoes:page:1')
 * - Set appropriate TTL based on data change frequency
 * - Invalidate cache on data changes
 * - Monitor hit rate (target: 70-80%)
 * - Use cache.getOrSet() for lazy loading
 *
 * ❌ DON'T:
 * - Cache sensitive data (passwords, tokens)
 * - Cache real-time data
 * - Cache very large objects (>1MB)
 * - Forget to invalidate on updates
 * - Use in-memory cache in production (use Redis)
 */
```

---

## 📊 Logger Usage

### مثال 1: Different Log Levels

```typescript
import { logger } from '../_core/logger';

// Debug - development only
logger.debug('Processing order', { orderId: '123', step: 'validation' });

// Info - general information
logger.info('Order created successfully', { orderId: '123', total: 500 });

// Warn - warnings (not errors)
logger.warn('Low stock alert', { productId: '456', stock: 5 });

// Error - errors with stack trace
try {
  await processPayment();
} catch (error) {
  logger.error('Payment processing failed', error as Error, {
    orderId: '123',
    amount: 500,
  });
}

// Critical - critical errors (triggers alerts in production)
logger.critical('Database connection lost', error as Error, {
  retries: 3,
  lastAttempt: new Date(),
});
```

### مثال 2: In tRPC Procedures

```typescript
export const ordersRouter = router({
  create: protectedProcedure
    .input(schemas.createOrder)
    .mutation(async ({ input, ctx }) => {
      // Log start
      logger.info('Creating order', {
        userId: ctx.user.id,
        itemsCount: input.items.length,
      });

      try {
        // Create order
        const order = await createOrder(input, ctx.user.id);

        // Log success
        logger.info('Order created successfully', {
          orderId: order.id,
          userId: ctx.user.id,
          total: order.total,
        });

        return order;
      } catch (error) {
        // Log error with context
        logger.error('Failed to create order', error as Error, {
          userId: ctx.user.id,
          itemsCount: input.items.length,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create order',
        });
      }
    }),
});
```

### مثال 3: Structured Logging

```typescript
// All logs are JSON formatted automatically:

logger.info('User action', {
  action: 'purchase',
  userId: '123',
  productId: '456',
  amount: 99.99,
  timestamp: new Date(),
  metadata: {
    source: 'web',
    campaign: 'summer_sale',
  },
});

// Output:
// {
//   "service": "haderos-api",
//   "environment": "development",
//   "level": "info",
//   "message": "User action",
//   "timestamp": "2025-12-30T12:00:00.000Z",
//   "context": {
//     "action": "purchase",
//     "userId": "123",
//     "productId": "456",
//     "amount": 99.99,
//     ...
//   }
// }
```

### Log Level Configuration:

```bash
# .env file
LOG_LEVEL=info

# Development: LOG_LEVEL=debug
# Production: LOG_LEVEL=info or LOG_LEVEL=warn
```

---

## 🔒 Security Usage

### مثال 1: Password Hashing

```typescript
import { hashPassword, verifyPassword, validatePasswordStrength } from '../_core/security';

// Register user
export const authRouter = router({
  register: publicProcedure
    .input(schemas.register)
    .mutation(async ({ input, ctx }) => {
      // Password already validated by Zod schema
      // But you can add extra validation:
      const strength = validatePasswordStrength(input.password);
      if (!strength.valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: strength.errors.join(', '),
        });
      }

      // Hash password
      const passwordHash = await hashPassword(input.password);

      // Save to database
      const user = await ctx.db.insert(users).values({
        email: input.email,
        passwordHash, // ← Never store plain password!
      });

      return user;
    }),

  // Login
  login: publicProcedure
    .input(schemas.login)
    .mutation(async ({ input, ctx }) => {
      const user = await findUser(input.email);

      // Verify password
      const isValid = await verifyPassword(input.password, user.passwordHash);

      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      return { success: true, user };
    }),
});
```

### مثال 2: Data Encryption

```typescript
import { encrypt, decrypt } from '../_core/security';

// Encrypt sensitive data before storing
export const settingsRouter = router({
  saveApiKey: adminProcedure
    .input(z.object({ apiKey: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Encrypt API key before storing
      const encryptedKey = encrypt(input.apiKey);

      await ctx.db.insert(settings).values({
        key: 'stripe_api_key',
        value: encryptedKey, // ← Store encrypted
      });

      return { success: true };
    }),

  getApiKey: adminProcedure
    .query(async ({ ctx }) => {
      const setting = await ctx.db.query.settings.findFirst({
        where: (settings, { eq }) => eq(settings.key, 'stripe_api_key'),
      });

      if (!setting) return null;

      // Decrypt when retrieving
      const apiKey = decrypt(setting.value);

      return { apiKey };
    }),
});
```

### مثال 3: CSRF Protection (for sensitive endpoints)

```typescript
// In index.ts, for specific routes:
app.use('/api/sensitive', securityMiddleware.csrf);

// Client needs to send X-CSRF-Token header
```

---

## 🧪 Testing

### 1. Test Security

```bash
# Test rate limiting
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/oauth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password"}'
done

# Should get 429 (Too Many Requests) on 6th request
```

### 2. Test CORS

```bash
# Test CORS protection
curl -H "Origin: https://evil.com" http://localhost:3000/api/trpc/health

# Should reject or not include CORS headers
```

### 3. Test Validation

```bash
# Test invalid email
curl -X POST http://localhost:3000/api/trpc/auth.register \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email","password":"weak"}'

# Should return validation errors
```

### 4. Test Cache

```typescript
// In your code
const stats = cache.getStats();
console.log('Cache Stats:', stats);

// Monitor hit rate:
// - First request: miss (0%)
// - Second request: hit (50%)
// - Third request: hit (66.7%)
// Target: 70-80% hit rate
```

### 5. Test Logging

```bash
# Start server and watch logs
pnpm dev

# All requests should be logged in JSON format
# Check for different log levels (debug, info, warn, error)
```

---

## ⚠️ Troubleshooting

### Problem 1: "Cannot find module 'helmet'"

**Solution:**
```bash
cd apps/haderos-web
pnpm install
```

### Problem 2: Rate Limit Too Strict

**Solution:** Adjust in `security.ts`:
```typescript
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // ← Increase from 100
});
```

### Problem 3: CORS Blocking Frontend

**Solution:** Add your frontend URL in `security.ts`:
```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://your-frontend.com', // ← Add your URL
];
```

### Problem 4: Cache Hit Rate Low

**Check:**
- Are you using same cache keys?
- Is TTL too short?
- Are you invalidating too often?

**Monitor:**
```typescript
setInterval(() => {
  console.log('Cache Stats:', cache.getStats());
}, 60000); // Every minute
```

### Problem 5: Logs Not Showing

**Check LOG_LEVEL:**
```bash
# .env
LOG_LEVEL=debug  # Show all logs
# or
LOG_LEVEL=info   # Show info and above
```

---

## 📈 Next Steps

### Immediate:

1. ✅ Test server starts without errors
2. ✅ Test rate limiting works
3. ✅ Test validation in one router
4. ✅ Monitor cache hit rate

### This Week:

1. Apply validation to all routers
2. Add caching to expensive queries
3. Replace console.log with logger
4. Monitor security headers

### This Month:

1. Upgrade to Redis (production)
2. Add APM (New Relic/Datadog)
3. Security audit
4. Load testing

---

## ✅ Success Criteria

After integration, you should have:

```
✅ Security headers on all responses (check with browser devtools)
✅ Rate limiting working (test with multiple requests)
✅ All requests logged in JSON format
✅ Validation errors returned clearly
✅ Cache hit rate >60% after warm-up
✅ Server graceful shutdown working
```

---

## 🎯 Performance Targets

| Metric | Before | Target | How to Measure |
|--------|--------|--------|----------------|
| Response Time | 500ms | <200ms | Browser Network tab |
| Cache Hit Rate | 0% | 70%+ | cache.getStats() |
| Security Score | Unknown | A | [SecurityHeaders.com](https://securityheaders.com) |
| Validation Coverage | 30% | 100% | Count routers using schemas |
| Log Coverage | 20% | 90% | Replace console.log |

---

**🎉 You're ready to integrate! The system is now more secure, faster, and production-ready!**

**الحمد لله رب العالمين** 🤲
