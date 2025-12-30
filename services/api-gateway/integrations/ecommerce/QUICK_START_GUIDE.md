# Adapter Pattern Quick Start Guide

## Overview
This guide provides a quick start for using the Adapter Pattern implementation in HaderOS e-commerce integrations.

## Installation & Setup

### 1. Install Dependencies
```bash
pip install structlog httpx pydantic
```

### 2. Basic Configuration
```python
from services.api_gateway.integrations import AdapterManager

config = {
    'ecommerce': {
        'shopify': {
            'api_key': 'your_shopify_api_key',
            'password': 'your_shopify_password',
            'store_url': 'https://your-store.myshopify.com',
            'circuit_breaker': {
                'failure_threshold': 5,
                'recovery_timeout': 60
            }
        },
        'mock': {
            'name': 'test_adapter'
        }
    }
}

# Initialize manager
manager = AdapterManager(config)
```

## Basic Usage

### Get Orders
```python
# Get orders from Shopify
orders = await manager.get_orders('shopify', limit=50)

# Get orders from all platforms
all_orders = await manager.get_all_orders()

# Get specific order
order = await manager.get_order('shopify', 'order_123')
```

### Create Order
```python
from services.api_gateway.integrations.ecommerce.adapters import OrderData

order_data = OrderData(
    order_id='new_order_123',
    customer_email='customer@example.com',
    customer_name='John Doe',
    total_amount=99.99,
    currency='USD',
    status='pending',
    items=[{
        'id': 'item_1',
        'title': 'Test Product',
        'quantity': 1,
        'price': 99.99
    }]
)

created_order = await manager.create_order('shopify', order_data)
```

### Update Inventory
```python
success = await manager.update_inventory('shopify', 'product_123', 50)
```

### Create Fulfillment
```python
from services.api_gateway.integrations.ecommerce.adapters import FulfillmentData

fulfillment = FulfillmentData(
    fulfillment_id='fulfill_123',
    order_id='order_123',
    tracking_number='TRACK123',
    carrier='UPS'
)

created_fulfillment = await manager.create_fulfillment('shopify', fulfillment)
```

## Testing with Mock Adapter

### Setup Mock Data
```python
# Use mock adapter for testing
mock_orders = await manager.get_orders('mock')
mock_products = await manager.get_products('mock')
```

### Test Circuit Breaker
```python
# Test failure scenarios
try:
    # This might fail and trigger circuit breaker
    orders = await manager.get_orders('shopify')
except Exception as e:
    print(f"Circuit breaker activated: {e}")
```

## Monitoring & Status

### Check Adapter Status
```python
status = manager.get_status()
print(f"Adapters: {list(status['adapters'].keys())}")
print(f"Circuit Breakers: {list(status['circuit_breakers'].keys())}")
```

### Check Circuit Breaker Status
```python
cb_status = manager.get_circuit_breaker_status('shopify')
print(f"State: {cb_status['state']}")
print(f"Failures: {cb_status['failure_count']}")
```

## Adding New Platforms

### 1. Create Adapter Class
```python
from services.api_gateway.integrations.ecommerce.adapters import EcommerceAdapter

class WooCommerceAdapter(EcommerceAdapter):
    def __init__(self, config):
        super().__init__(config)
        # Initialize WooCommerce client

    async def get_orders(self, **filters):
        # Implement WooCommerce order fetching
        pass

    # Implement other abstract methods...
```

### 2. Register in Factory
```python
from services.api_gateway.integrations.ecommerce.adapters import AdapterFactory

# Add to factory
@staticmethod
def create_adapter(platform: str, config):
    if platform == 'woocommerce':
        return WooCommerceAdapter(config)
    # ... existing code
```

### 3. Update Configuration
```python
config['ecommerce']['woocommerce'] = {
    'api_key': 'wc_key',
    'api_secret': 'wc_secret',
    'store_url': 'https://your-wc-store.com'
}
```

## Error Handling

### Circuit Breaker Errors
```python
from services.api_gateway.integrations.shipping.circuit_breaker import CircuitBreakerOpenException

try:
    orders = await manager.get_orders('shopify')
except CircuitBreakerOpenException:
    # Circuit is open, service unavailable
    print("Service temporarily unavailable")
except Exception as e:
    # Other errors
    print(f"Error: {e}")
```

### Platform-Specific Errors
```python
try:
    order = await manager.get_order('shopify', 'invalid_id')
except httpx.HTTPStatusError as e:
    if e.response.status_code == 404:
        print("Order not found")
    elif e.response.status_code == 429:
        print("Rate limited")
```

## Configuration Options

### Circuit Breaker Settings
```python
circuit_breaker_config = {
    'failure_threshold': 5,      # Failures before opening
    'recovery_timeout': 60,      # Seconds to wait before retry
    'success_threshold': 3       # Successes needed to close
}
```

### Platform-Specific Settings
```python
shopify_config = {
    'api_key': 'key',
    'password': 'pass',
    'store_url': 'https://store.com',
    'api_version': '2023-10',    # Shopify API version
    'timeout': 30                # Request timeout
}
```

## Best Practices

### 1. Error Handling
```python
async def safe_get_orders(manager, platform):
    try:
        return await manager.get_orders(platform)
    except Exception as e:
        logger.error(f"Failed to get orders from {platform}: {e}")
        return []
```

### 2. Resource Management
```python
async with manager:  # If manager supports context manager
    orders = await manager.get_orders('shopify')
# Resources automatically cleaned up
```

### 3. Configuration Validation
```python
def validate_config(config):
    required = ['api_key', 'password', 'store_url']
    for key in required:
        if key not in config:
            raise ValueError(f"Missing required config: {key}")
```

### 4. Logging
```python
import structlog
logger = structlog.get_logger()

async def log_operation(platform, operation, start_time):
    duration = time.time() - start_time
    logger.info("Ecommerce operation completed",
               platform=platform,
               operation=operation,
               duration=duration)
```

## Troubleshooting

### Common Issues

1. **Import Errors**
   ```bash
   # Ensure PYTHONPATH includes project root
   export PYTHONPATH=/path/to/haderos:$PYTHONPATH
   ```

2. **Circuit Breaker Stuck Open**
   ```python
   # Check status and manually reset if needed
   status = manager.get_circuit_breaker_status('shopify')
   if status['state'] == 'OPEN':
       # Wait for recovery_timeout or investigate service
   ```

3. **Rate Limiting**
   ```python
   # Shopify: 2 requests/second, 40/minute
   # Implement backoff or reduce request frequency
   ```

4. **Configuration Errors**
   ```python
   # Validate config before initialization
   from services.api_gateway.integrations.ecommerce.adapters import EcommerceAdapter
   adapter = AdapterFactory.create_adapter('shopify', config)
   if not adapter._validate_config():
       raise ValueError("Invalid configuration")
   ```

## Performance Tips

### Concurrent Operations
```python
# Fetch from multiple platforms concurrently
import asyncio

async def get_all_platform_orders(manager, platforms):
    tasks = [manager.get_orders(platform) for platform in platforms]
    return await asyncio.gather(*tasks, return_exceptions=True)
```

### Batching
```python
# Process orders in batches
batch_size = 50
all_orders = []
offset = 0

while True:
    batch = await manager.get_orders('shopify',
                                   limit=batch_size,
                                   offset=offset)
    if not batch:
        break
    all_orders.extend(batch)
    offset += batch_size
```

## Next Steps

1. **Read the Full Documentation**: See `README.md` for detailed API reference
2. **Run Tests**: Execute `pytest tests/test_adapter_pattern.py`
3. **Explore Examples**: Check test files for usage examples
4. **Add Monitoring**: Integrate with your observability stack

## Support

- **Documentation**: `services/api-gateway/integrations/ecommerce/README.md`
- **Tests**: `tests/test_adapter_pattern.py`
- **Issues**: Check circuit breaker status and logs
- **Performance**: Monitor request rates and error patterns