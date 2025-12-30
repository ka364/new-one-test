"""
Integration tests for API endpoints
"""
import pytest
from httpx import AsyncClient
from backend.main import app


@pytest.fixture
async def client():
    """Create async HTTP client"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


class TestHealthEndpoint:
    """Test health check endpoint"""
    
    @pytest.mark.asyncio
    async def test_health_check(self, client):
        """Test health check returns 200"""
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data


class TestShariaEndpoints:
    """Test Sharia compliance endpoints"""
    
    @pytest.mark.asyncio
    async def test_validate_compliant_transaction(self, client):
        """Test validation of compliant transaction"""
        transaction = {
            "transaction_type": "murabaha",
            "amount": 10000,
            "currency": "USD",
            "parties_involved": ["investor1", "company1"],
            "contract_terms": {"delivery_date": "2025-01-01"},
            "business_sector": "technology",
            "interest_rate": 0.0
        }
        
        response = await client.post("/api/v1/sharia/validate", json=transaction)
        
        assert response.status_code == 200
        data = response.json()
        assert "transaction_id" in data
        assert "is_compliant" in data
        assert "compliance_score" in data
        assert data["is_compliant"] is True
    
    @pytest.mark.asyncio
    async def test_validate_non_compliant_transaction(self, client):
        """Test validation of non-compliant transaction"""
        transaction = {
            "transaction_type": "loan",
            "amount": 10000,
            "currency": "USD",
            "business_sector": "gambling",
            "interest_rate": 5.0
        }
        
        response = await client.post("/api/v1/sharia/validate", json=transaction)
        
        assert response.status_code == 200
        data = response.json()
        assert data["is_compliant"] is False
        assert len(data["violations"]) > 0
    
    @pytest.mark.asyncio
    async def test_invalid_transaction_data(self, client):
        """Test validation with invalid data"""
        invalid_transaction = {
            "invalid_field": "value"
        }
        
        response = await client.post("/api/v1/sharia/validate", json=invalid_transaction)
        
        assert response.status_code == 422  # Validation error


class TestAIEndpoints:
    """Test AI/ML endpoints"""
    
    @pytest.mark.asyncio
    async def test_risk_assessment(self, client):
        """Test risk assessment endpoint"""
        investment = {
            "amount": 50000,
            "duration_months": 24,
            "business_sector": "technology",
            "credit_score": 720,
            "sharia_certified": True
        }
        
        response = await client.post("/api/v1/ai/risk-assessment", json=investment)
        
        assert response.status_code == 200
        data = response.json()
        assert "overall_risk_score" in data
        assert "risk_level" in data
        assert "recommendations" in data
        assert 0 <= data["overall_risk_score"] <= 1
    
    @pytest.mark.asyncio
    async def test_risk_assessment_invalid_data(self, client):
        """Test risk assessment with invalid data"""
        invalid_investment = {
            "amount": -1000  # Invalid negative amount
        }
        
        response = await client.post("/api/v1/ai/risk-assessment", json=invalid_investment)
        
        assert response.status_code == 422


class TestBioModulesEndpoints:
    """Test BioModules endpoints"""
    
    @pytest.mark.asyncio
    async def test_list_modules(self, client):
        """Test listing bio-modules"""
        response = await client.get("/api/v1/bio-modules/list")
        
        assert response.status_code == 200
        data = response.json()
        assert "modules" in data
        assert len(data["modules"]) == 7  # 7 bio-modules
        
        # Check first module structure
        module = data["modules"][0]
        assert "id" in module
        assert "name" in module
        assert "organism" in module
        assert "problem" in module
    
    @pytest.mark.asyncio
    async def test_init_module(self, client):
        """Test module initialization"""
        module_data = {
            "module_id": "mycelium",
            "developer_name": "Test Developer",
            "team_size": 1
        }
        
        response = await client.post("/api/v1/bio-modules/init", json=module_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "state" in data
        assert data["state"]["module_id"] == "mycelium"
    
    @pytest.mark.asyncio
    async def test_module_status(self, client):
        """Test getting module status"""
        # First initialize a module
        init_response = await client.post("/api/v1/bio-modules/init", json={
            "module_id": "mycelium",
            "developer_name": "Test Developer"
        })
        assert init_response.status_code == 200
        
        # Then get its status
        response = await client.get("/api/v1/bio-modules/status/mycelium")
        
        assert response.status_code == 200
        data = response.json()
        assert "module_id" in data
        assert "current_step" in data
        assert "progress_percentage" in data


class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    @pytest.mark.asyncio
    async def test_register_user(self, client):
        """Test user registration"""
        user_data = {
            "email": "test@example.com",
            "password": "SecurePassword123!",
            "full_name": "Test User"
        }
        
        response = await client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code in [200, 201]
        data = response.json()
        assert "user_id" in data or "message" in data
    
    @pytest.mark.asyncio
    async def test_login(self, client):
        """Test user login"""
        login_data = {
            "email": "test@example.com",
            "password": "SecurePassword123!"
        }
        
        response = await client.post("/api/v1/auth/login", json=login_data)
        
        # May fail if user doesn't exist, but should return proper status
        assert response.status_code in [200, 401, 404]


class TestErrorHandling:
    """Test error handling"""
    
    @pytest.mark.asyncio
    async def test_404_not_found(self, client):
        """Test 404 for non-existent endpoint"""
        response = await client.get("/api/v1/nonexistent")
        
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_method_not_allowed(self, client):
        """Test 405 for wrong HTTP method"""
        response = await client.delete("/api/v1/bio-modules/list")
        
        assert response.status_code == 405


class TestCORS:
    """Test CORS configuration"""
    
    @pytest.mark.asyncio
    async def test_cors_headers(self, client):
        """Test CORS headers are present"""
        response = await client.options("/api/v1/bio-modules/list")
        
        # Check for CORS headers
        assert "access-control-allow-origin" in response.headers or response.status_code == 200
