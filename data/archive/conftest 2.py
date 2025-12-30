"""
Pytest configuration and shared fixtures
"""
import pytest
import asyncio
from typing import Generator


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def test_config():
    """Test configuration"""
    return {
        "DATABASE_URL": "sqlite:///:memory:",
        "REDIS_URL": "redis://localhost:6379/1",
        "SECRET_KEY": "test-secret-key-for-testing-only",
        "DEBUG": True
    }


@pytest.fixture
def sample_compliant_transaction():
    """Sample Sharia-compliant transaction"""
    return {
        "transaction_type": "murabaha",
        "amount": 10000,
        "currency": "USD",
        "parties_involved": ["investor1", "company1"],
        "contract_terms": {
            "delivery_date": "2025-01-01",
            "price_specified": True,
            "quantity_specified": True
        },
        "business_sector": "technology",
        "interest_rate": 0.0
    }


@pytest.fixture
def sample_non_compliant_transaction():
    """Sample non-compliant transaction"""
    return {
        "transaction_type": "loan",
        "amount": 10000,
        "currency": "USD",
        "business_sector": "gambling",
        "interest_rate": 5.0,
        "interest_amount": 500
    }


@pytest.fixture
def sample_investment():
    """Sample investment for risk assessment"""
    return {
        "amount": 50000,
        "duration_months": 24,
        "business_sector": "technology",
        "credit_score": 720,
        "sharia_certified": True,
        "has_sharia_board": True
    }
