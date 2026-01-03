# HADEROS Microservices Architecture

## Overview

This directory contains all microservices for the HADEROS platform.

## Services

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 3000 | Routes requests to services |
| User Service | 8081 | Authentication, users, profiles |
| Product Service | 8082 | Catalog, inventory, categories |
| Order Service | 8083 | Orders, cart, invoices |
| Group Buying Service | 8084 | Group deals, dynamic pricing |
| Delivery Service | 8085 | Drivers, shipments, tracking |
| Community Service | 8086 | Community groups, leaders |
| Locker Service | 8087 | Smart locker management |
| Payment Service | 8088 | Payments, wallets, refunds |
| Notification Service | 8089 | SMS, WhatsApp, Email, Push |

## Quick Start

### Development (Individual Services)

```bash
# Start User Service
cd user-service
npm install
npm run dev

# Start Product Service
cd product-service
npm install
npm run dev
```

### Docker Compose (All Services)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## API Endpoints

### User Service (8081)
- `POST /api/users/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/verify` - Verify OTP
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user

### Product Service (8082)
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `POST /api/products/reserve-stock` - Reserve inventory

### Order Service (8083)
- `POST /api/orders` - Create order
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get order
- `PUT /api/orders/:id/status` - Update status
- `POST /api/orders/:id/return` - Request return

### Group Buying Service (8084)
- `GET /api/group-deals` - List active deals
- `GET /api/group-deals/:id` - Get deal details
- `POST /api/group-deals` - Create new deal
- `POST /api/group-deals/:id/join` - Join a deal
- `POST /api/group-deals/:id/leave` - Leave a deal
- `POST /api/group-deals/:id/close` - Close deal
- `GET /api/group-deals/:id/share` - Get share links
- `POST /api/group-buying/pricing/calculate` - Calculate dynamic price
- `POST /api/group-buying/pricing/simulate` - Simulate price tiers

### Delivery Service (8085)
- `GET /api/drivers` - List drivers
- `POST /api/drivers` - Register driver
- `PUT /api/drivers/:id/status` - Update driver status
- `PUT /api/drivers/:id/location` - Update driver location
- `GET /api/drivers/nearby/:lat/:lng` - Find nearby drivers
- `GET /api/deliveries` - List deliveries
- `POST /api/deliveries` - Create delivery
- `GET /api/deliveries/:id/track` - Track delivery
- `POST /api/deliveries/:id/assign` - Assign driver (auto/manual)
- `PUT /api/deliveries/:id/status` - Update delivery status
- `POST /api/deliveries/:id/proof` - Submit proof of delivery
- `GET /api/zones` - List delivery zones

### Community Service (8086)
- `GET /api/reviews` - List reviews
- `POST /api/reviews` - Create review
- `POST /api/reviews/:id/helpful` - Mark review helpful
- `POST /api/reviews/:id/respond` - Merchant response
- `GET /api/referrals` - List referrals
- `GET /api/referrals/code/:userId` - Get referral code
- `POST /api/referrals/apply` - Apply referral code
- `GET /api/loyalty/:userId` - Get loyalty account
- `POST /api/loyalty/:userId/earn` - Earn points
- `POST /api/loyalty/:userId/redeem` - Redeem points
- `GET /api/loyalty/rewards/catalog` - Get reward catalog

### Locker Service (8087)
- `GET /api/locker-locations` - List locker locations
- `GET /api/locker-locations/:id` - Get location details
- `GET /api/lockers` - List lockers
- `PUT /api/lockers/:id/status` - Update locker status
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking
- `POST /api/bookings/:id/activate` - Activate booking
- `POST /api/bookings/:id/complete` - Complete booking
- `POST /api/bookings/verify` - Verify access code

### Payment Service (8088)
- `GET /api/transactions` - List transactions
- `POST /api/transactions/initiate` - Initiate payment
- `POST /api/transactions/:id/confirm` - Confirm payment
- `POST /api/transactions/:id/refund` - Refund payment
- `GET /api/transactions/fawry/:code` - Check Fawry code
- `POST /api/transactions/fawry/callback` - Fawry webhook
- `GET /api/wallets/:userId` - Get wallet balance
- `POST /api/wallets/:userId/topup` - Top up wallet
- `POST /api/wallets/:userId/debit` - Debit from wallet
- `GET /api/payouts` - List merchant payouts
- `POST /api/payouts` - Create payout request

### Notification Service (8089)
- `GET /api/notifications` - List notifications
- `POST /api/notifications/send` - Send notification
- `POST /api/notifications/bulk` - Send bulk notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `GET /api/templates` - List templates
- `POST /api/templates/:id/preview` - Preview template
- `GET /api/preferences/:userId` - Get user preferences
- `PUT /api/preferences/:userId` - Update preferences
- `POST /api/preferences/:userId/device` - Register device token

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            API Gateway (Port 3000)                       │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
    ┌───────────┬───────────┬───────┴───────┬───────────┬───────────┐
    │           │           │               │           │           │
    ▼           ▼           ▼               ▼           ▼           ▼
┌───────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐ ┌─────────┐ ┌─────────┐
│ User  │ │ Product │ │  Order  │ │ Group Buying│ │Delivery │ │Community│
│ 8081  │ │  8082   │ │  8083   │ │    8084     │ │  8085   │ │  8086   │
└───────┘ └─────────┘ └─────────┘ └─────────────┘ └─────────┘ └─────────┘
    │           │           │               │           │           │
    │     ┌─────┴───────────┴───────────────┴───────────┴─────┐     │
    │     │                                                     │     │
    ▼     ▼                                                     ▼     ▼
┌───────────────┐                                     ┌───────────────────┐
│    Locker     │                                     │   Notification    │
│     8087      │                                     │       8089        │
└───────────────┘                                     └───────────────────┘
         │                                                     │
         │              ┌───────────────────┐                 │
         └──────────────│     Payment       │─────────────────┘
                        │       8088        │
                        └─────────┬─────────┘
                                  │
                  ┌───────────────┼───────────────┐
                  ▼               ▼               ▼
            ┌──────────┐   ┌──────────┐   ┌──────────┐
            │PostgreSQL│   │  Redis   │   │ RabbitMQ │
            │   5432   │   │   6379   │   │   5672   │
            └──────────┘   └──────────┘   └──────────┘
```

## Technology Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (via Drizzle ORM)
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **Container**: Docker
- **Orchestration**: Docker Compose / Kubernetes

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/haderos

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key

# Payment Gateways
PAYMOB_API_KEY=your-paymob-key
FAWRY_MERCHANT_CODE=your-fawry-code

# Notifications
TWILIO_ACCOUNT_SID=your-twilio-sid
SENDGRID_API_KEY=your-sendgrid-key
```

## Development

### Adding a New Service

1. Create service directory:
```bash
mkdir -p new-service/src/{routes,controllers,models,middleware}
```

2. Copy package.json template and modify

3. Create Dockerfile

4. Add to docker-compose.yml

5. Add proxy route in api-gateway

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Monitoring

Health checks available at:
- Gateway: http://localhost:3000/health
- User: http://localhost:8081/health
- Product: http://localhost:8082/health
- Order: http://localhost:8083/health
