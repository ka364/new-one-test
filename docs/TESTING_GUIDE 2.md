# 🧪 HaderOS Platform - Testing Guide

**Comprehensive Testing Documentation**

---

## 📋 Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Unit Tests](#unit-tests)
3. [Integration Tests](#integration-tests)
4. [API Tests](#api-tests)
5. [Performance Tests](#performance-tests)
6. [Security Tests](#security-tests)

---

## 🎯 Testing Strategy

### Test Pyramid

```
         /\
        /  \  E2E Tests (10%)
       /____\
      /      \  Integration Tests (30%)
     /________\
    /          \  Unit Tests (60%)
   /____________\
```

### Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical paths
- **E2E Tests**: Key user workflows
- **Performance Tests**: Load & stress testing

---

## 🔬 Unit Tests

### KAIA Theology Engine Tests

```python
# tests/test_compliance_checker.py

import pytest
from backend.kernel.theology.compliance_checker import ComplianceChecker

@pytest.fixture
def compliance_checker():
    return ComplianceChecker()

@pytest.mark.asyncio
async def test_riba_detection(compliance_checker):
    """Test Riba (interest) detection"""
    transaction = {
        "transaction_type": "loan",
        "amount": 10000,
        "interest_rate": 5.0,
        "interest_amount": 500
    }
    
    riba_detected, details = await compliance_checker.check_riba(transaction)
    
    assert riba_detected is True
    assert details["interest_rate"] == 5.0
    assert "riba" in details["detection_type"]

@pytest.mark.asyncio
async def test_gharar_detection(compliance_checker):
    """Test Gharar (uncertainty) detection"""
    transaction = {
        "contract_terms": {
            "delivery_date": None,
            "price_specified": False,
            "quantity_specified": False
        }
    }
    
    gharar_detected, details = await compliance_checker.check_gharar(transaction)
    
    assert gharar_detected is True
    assert details["uncertainty_level"] > 30.0

@pytest.mark.asyncio
async def test_compliant_transaction(compliance_checker):
    """Test fully compliant transaction"""
    transaction = {
        "transaction_type": "murabaha",
        "amount": 10000,
        "interest_rate": 0.0,
        "business_sector": "technology",
        "contract_terms": {
            "delivery_date": "2025-01-01",
            "price_specified": True,
            "quantity_specified": True
        }
    }
    
    is_compliant, status, result = await compliance_checker.validate_transaction(transaction)
    
    assert is_compliant is True
    assert result["compliance_score"] == 100.0
    assert len(result["violations"]) == 0
```

### Risk Assessment Tests

```python
# tests/test_risk_assessor.py

import pytest
from backend.kinetic.ml_models.risk_assessor import RiskAssessor

@pytest.fixture
def risk_assessor():
    return RiskAssessor()

@pytest.mark.asyncio
async def test_low_risk_investment(risk_assessor):
    """Test low-risk investment assessment"""
    investment = {
        "amount": 10000,
        "duration_months": 12,
        "business_sector": "healthcare",
        "credit_score": 800,
        "sharia_certified": True,
        "has_sharia_board": True
    }
    
    result = await risk_assessor.assess_investment_risk(investment)
    
    assert result["risk_level"] == "low"
    assert result["overall_risk_score"] < 0.3

@pytest.mark.asyncio
async def test_high_risk_investment(risk_assessor):
    """Test high-risk investment assessment"""
    investment = {
        "amount": 100000,
        "duration_months": 60,
        "business_sector": "gambling",
        "credit_score": 400,
        "sharia_certified": False
    }
    
    result = await risk_assessor.assess_investment_risk(investment)
    
    assert result["risk_level"] in ["high", "very_high"]
    assert len(result["recommendations"]) > 0
```

### BioModuleFactory Tests

```python
# tests/test_bio_module_factory.py

import pytest
from backend.bio_module_factory.core.factory import BioModuleFactory
from backend.bio_module_factory.models.types import BioModule, ModulePhase, Organism

@pytest.fixture
def factory():
    return BioModuleFactory(storage_path="test_modules")

@pytest.mark.asyncio
async def test_module_initialization(factory):
    """Test module initialization"""
    module = BioModule(
        id="test_mycelium",
        name="Test Mycelium",
        organism=Organism.MYCELIUM,
        problem_ar="مشكلة اختبار",
        problem_en="Test problem",
        solution_ar="حل اختبار",
        solution_en="Test solution",
        phase=ModulePhase.FOUNDATION,
        tech_stack=["Python"],
        estimated_duration_weeks=4,
        priority=1,
        biological_principles=["Distribution"]
    )
    
    state = await factory.initialize_module(module, [])
    
    assert state.module_id == "test_mycelium"
    assert state.module_name == "Test Mycelium"
    assert len(state.completed_steps) == 0

@pytest.mark.asyncio
async def test_deliverable_submission(factory):
    """Test deliverable submission"""
    # Initialize module first
    # ... (initialization code)
    
    success = await factory.submit_deliverable(
        "test_mycelium",
        ModuleStep.BIOLOGICAL_STUDY,
        "bio_study_report",
        "docs/study.md"
    )
    
    assert success is True
```

---

## 🔗 Integration Tests

### API Integration Tests

```python
# tests/integration/test_api_integration.py

import pytest
from httpx import AsyncClient
from backend.main import app

@pytest.mark.asyncio
async def test_sharia_validation_flow():
    """Test complete Sharia validation flow"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Submit transaction for validation
        response = await client.post(
            "/api/v1/sharia/validate",
            json={
                "transaction_type": "investment",
                "amount": 10000,
                "currency": "USD",
                "parties_involved": ["investor1", "company1"],
                "contract_terms": {"delivery_date": "2025-01-01"},
                "business_sector": "technology",
                "interest_rate": 0.0
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "transaction_id" in data
        assert "is_compliant" in data
        assert "compliance_score" in data

@pytest.mark.asyncio
async def test_risk_assessment_flow():
    """Test risk assessment flow"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/ai/risk-assessment",
            json={
                "amount": 50000,
                "duration_months": 24,
                "business_sector": "technology",
                "credit_score": 720,
                "sharia_certified": True
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "overall_risk_score" in data
        assert "risk_level" in data
        assert "recommendations" in data
```

### Database Integration Tests

```python
# tests/integration/test_database.py

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.core.database import Base
from backend.kernel.theology.models import ShariaRule, TransactionValidation

@pytest.fixture
def db_session():
    """Create test database session"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_sharia_rule_crud(db_session):
    """Test Sharia rule CRUD operations"""
    rule = ShariaRule(
        rule_code="R001",
        rule_name_ar="قاعدة اختبار",
        rule_name_en="Test Rule",
        description_ar="وصف",
        description_en="Description",
        category="riba",
        severity="critical",
        prohibited_elements=["interest"],
        conditions={},
        references={}
    )
    
    db_session.add(rule)
    db_session.commit()
    
    retrieved = db_session.query(ShariaRule).filter_by(rule_code="R001").first()
    assert retrieved is not None
    assert retrieved.rule_name_en == "Test Rule"
```

---

## 🌐 API Tests

### Endpoint Tests

```python
# tests/api/test_endpoints.py

import pytest
from httpx import AsyncClient
from backend.main import app

@pytest.mark.asyncio
async def test_health_check():
    """Test health check endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

@pytest.mark.asyncio
async def test_bio_modules_list():
    """Test bio-modules list endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/v1/bio-modules/list")
        assert response.status_code == 200
        data = response.json()
        assert "modules" in data
        assert len(data["modules"]) > 0

@pytest.mark.asyncio
async def test_invalid_request():
    """Test invalid request handling"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/sharia/validate",
            json={"invalid": "data"}
        )
        assert response.status_code == 422  # Validation error
```

---

## ⚡ Performance Tests

### Load Testing

```python
# tests/performance/test_load.py

import pytest
import asyncio
from httpx import AsyncClient
from backend.main import app

@pytest.mark.asyncio
async def test_concurrent_requests():
    """Test handling of concurrent requests"""
    async def make_request():
        async with AsyncClient(app=app, base_url="http://test") as client:
            return await client.get("/health")
    
    # Send 100 concurrent requests
    tasks = [make_request() for _ in range(100)]
    responses = await asyncio.gather(*tasks)
    
    # All should succeed
    assert all(r.status_code == 200 for r in responses)

@pytest.mark.asyncio
async def test_response_time():
    """Test API response time"""
    import time
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        start = time.time()
        response = await client.get("/api/v1/bio-modules/list")
        duration = time.time() - start
        
        assert response.status_code == 200
        assert duration < 1.0  # Should respond within 1 second
```

---

## 🔒 Security Tests

### Authentication Tests

```python
# tests/security/test_auth.py

import pytest
from httpx import AsyncClient
from backend.main import app

@pytest.mark.asyncio
async def test_unauthorized_access():
    """Test unauthorized access is blocked"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Try to access protected endpoint without auth
        response = await client.get("/api/v1/investments/portfolio")
        assert response.status_code == 401

@pytest.mark.asyncio
async def test_invalid_token():
    """Test invalid token is rejected"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/investments/portfolio",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401
```

---

## 🚀 Running Tests

### Run All Tests

```bash
pytest
```

### Run with Coverage

```bash
pytest --cov=backend --cov-report=html --cov-report=term
```

### Run Specific Test File

```bash
pytest tests/test_compliance_checker.py
```

### Run Specific Test

```bash
pytest tests/test_compliance_checker.py::test_riba_detection
```

### Run with Verbose Output

```bash
pytest -v
```

### Run Performance Tests Only

```bash
pytest -m performance
```

---

## 📊 Coverage Report

After running tests with coverage:

```bash
# View HTML report
open htmlcov/index.html

# View terminal report
pytest --cov=backend --cov-report=term-missing
```

---

## ✅ CI/CD Integration

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: 3.11
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install pytest pytest-cov
    
    - name: Run tests
      run: pytest --cov=backend --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v2
```

---

**Test Coverage Goals:**
- ✅ Unit Tests: 80%+
- ✅ Integration Tests: Critical paths
- ✅ API Tests: All endpoints
- ✅ Performance Tests: Load scenarios
- ✅ Security Tests: Auth & permissions
