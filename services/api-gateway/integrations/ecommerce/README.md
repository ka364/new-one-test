# Adapter Pattern Implementation for E-commerce Integrations

## Overview

This implementation introduces the **Adapter Pattern** to address multi-vendor integration risks identified in the architectural analysis. The adapter pattern provides clean separation between HaderOS core business logic and external e-commerce platforms, enabling easy platform switching and preventing vendor lock-in.

## Architecture

### Core Components

1. **Base Adapter (`EcommerceAdapter`)**: Abstract base class defining the unified interface
2. **Platform Adapters**: Concrete implementations for each e-commerce platform
3. **Adapter Manager**: Manages adapters with Circuit Breaker integration
4. **Factory Pattern**: Creates appropriate adapters based on configuration

### Directory Structure

```
services/api-gateway/integrations/ecommerce/
├── adapters/
│   ├── __init__.py
│   ├── base_adapter.py          # Abstract base class and data models
│   ├── shopify_adapter.py       # Shopify platform implementation
│   └── mock_adapter.py          # Mock adapter for testing
├── adapter_manager.py           # Manager with Circuit Breaker integration
└── __init__.py
```

## Key Benefits

### 1. **Platform Independence**
- Unified interface for all e-commerce platforms
- Easy switching between platforms (Shopify → WooCommerce)
- No vendor lock-in

### 2. **Clean Separation of Concerns**
- Business logic isolated from platform-specific code
- Platform changes don't affect core OMS functionality
- Easier testing and maintenance

### 3. **Resilience & Monitoring**
- Integrated with Circuit Breaker pattern
- Automatic failover and recovery
- Comprehensive monitoring and health checks

### 4. **Extensibility**
- Easy addition of new platforms
- Standardized data models
- Consistent error handling

## Data Models

### OrderData
Standardized order representation across all platforms:

```python
@dataclass
class OrderData:
    order_id: str
    customer_email: str
    customer_name: str
    total_amount: float
    currency: str
    status: str
    items: List[Dict[str, Any]]
    shipping_address: Optional[Dict[str, Any]] = None
    billing_address: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None
```

### ProductData & FulfillmentData
Similar standardized structures for products and fulfillments.

## Usage Examples

### Basic Usage

```python
from services.api_gateway.integrations import AdapterManager

# Initialize manager with configuration
config = {
    'ecommerce': {
        'shopify': {
            'api_key': 'your_api_key',
            'password': 'your_password',
            'store_url': 'https://your-store.myshopify.com',
            'circuit_breaker': {
                'failure_threshold': 5,
                'recovery_timeout': 60
            }
        }
    }
}

manager = AdapterManager(config)

# Get orders from Shopify
orders = await manager.get_orders('shopify', limit=50)

# Create order
order_data = OrderData(...)
created_order = await manager.create_order('shopify', order_data)

# Get products from all platforms
all_products = await manager.get_all_products()
```

### Adding New Platforms

1. Create new adapter class inheriting from `EcommerceAdapter`
2. Implement all abstract methods
3. Add to `AdapterFactory.create_adapter()`
4. Update configuration

```python
class WooCommerceAdapter(EcommerceAdapter):
    # Implement all abstract methods
    async def get_orders(self, **filters) -> List[OrderData]:
        # WooCommerce-specific implementation
        pass
```

## Configuration

### Environment Variables

```bash
# Shopify Configuration
SHOPIFY_API_KEY=your_api_key
SHOPIFY_PASSWORD=your_password
SHOPIFY_STORE_URL=https://your-store.myshopify.com

# Circuit Breaker Settings
SHOPIFY_CB_FAILURE_THRESHOLD=5
SHOPIFY_CB_RECOVERY_TIMEOUT=60
SHOPIFY_CB_SUCCESS_THRESHOLD=3
```

### Configuration Structure

```python
config = {
    'ecommerce': {
        'shopify': {
            'api_key': os.getenv('SHOPIFY_API_KEY'),
            'password': os.getenv('SHOPIFY_PASSWORD'),
            'store_url': os.getenv('SHOPIFY_STORE_URL'),
            'api_version': '2023-10',
            'circuit_breaker': {
                'failure_threshold': int(os.getenv('SHOPIFY_CB_FAILURE_THRESHOLD', 5)),
                'recovery_timeout': int(os.getenv('SHOPIFY_CB_RECOVERY_TIMEOUT', 60)),
                'success_threshold': int(os.getenv('SHOPIFY_CB_SUCCESS_THRESHOLD', 3))
            }
        }
    }
}
```

## Circuit Breaker Integration

Each adapter is protected by a Circuit Breaker that:

- **Monitors failures**: Tracks API call failures
- **Prevents cascade failures**: Stops calling failing services
- **Auto-recovery**: Tests service availability periodically
- **Configurable thresholds**: Customizable failure and recovery settings

### Circuit Breaker States

- **CLOSED**: Normal operation, requests pass through
- **OPEN**: Service unavailable, requests fail fast
- **HALF_OPEN**: Testing recovery, limited requests allowed

## Testing

### Mock Adapter

The `MockAdapter` provides realistic test data for development and testing:

```python
# Use mock adapter for testing
mock_adapter = AdapterFactory.create_adapter('mock', {'name': 'test'})
orders = await mock_adapter.get_orders()
```

### Running Tests

```bash
# Run adapter pattern tests
pytest tests/test_adapter_pattern.py -v

# Run with coverage
pytest tests/test_adapter_pattern.py --cov=services.api_gateway.integrations
```

## Monitoring & Health Checks

### Status Endpoints

```python
# Get overall status
status = manager.get_status()

# Get platform-specific status
shopify_status = manager.get_circuit_breaker_status('shopify')
```

### Metrics Available

- Adapter health status
- Circuit breaker states
- Request counts and failure rates
- Recovery attempt timestamps

## Migration Strategy

### Phase 1: Shopify Integration
- ✅ Complete Shopify adapter implementation
- ✅ Circuit Breaker integration
- ✅ Basic order/product operations

### Phase 2: Multi-Platform Support
- 🔄 Add WooCommerce adapter
- 🔄 Add BigCommerce adapter
- 🔄 Unified configuration management

### Phase 3: Advanced Features
- 🔄 Bulk operations
- 🔄 Webhook handling
- 🔄 Real-time synchronization

## Error Handling

### Standardized Exceptions

- `ValueError`: Invalid configuration or parameters
- `httpx.HTTPStatusError`: API errors (rate limits, auth failures)
- `Exception`: Circuit breaker failures

### Error Recovery

- Automatic retry with exponential backoff
- Circuit breaker state transitions
- Graceful degradation to alternative platforms

## Performance Considerations

### Rate Limiting
- Built-in rate limiting for Shopify API (2 req/sec)
- Automatic retry with `Retry-After` header handling

### Concurrent Operations
- Async/await support for all operations
- Concurrent multi-platform queries
- Connection pooling with httpx

### Caching Strategy
- Future: Redis caching for frequently accessed data
- Configurable TTL for different data types

## Security

### API Key Management
- Environment variable configuration
- No hardcoded credentials
- Secure storage recommendations

### Data Validation
- Pydantic models for configuration
- Input sanitization
- Error message filtering

## Future Enhancements

1. **Webhook Support**: Real-time order updates
2. **Bulk Operations**: Batch processing for performance
3. **Advanced Filtering**: Complex query support
4. **Analytics Integration**: Platform-specific insights
5. **Multi-tenant Support**: Per-store configurations

## Troubleshooting

### Common Issues

1. **Rate Limiting**: Check Circuit Breaker status, implement backoff
2. **Authentication Errors**: Verify API credentials and permissions
3. **Data Format Issues**: Check platform-specific data transformations
4. **Circuit Breaker Stuck**: Manual reset or configuration adjustment

### Debug Mode

Enable debug logging for detailed request/response information:

```python
import logging
logging.getLogger('services.api_gateway.integrations').setLevel(logging.DEBUG)
```

## Contributing

When adding new platforms:

1. Extend `EcommerceAdapter` abstract class
2. Implement all required methods
3. Add comprehensive tests
4. Update documentation
5. Test Circuit Breaker integration

## Related Documentation

- [Circuit Breaker Pattern Guide](../docs/CIRCUIT_BREAKER_GUIDE.md)
- [Integration Setup Guide](../docs/INTEGRATIONS_SETUP_GUIDE.md)
- [API Documentation](../docs/api/v1/README.md)