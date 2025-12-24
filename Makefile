.PHONY: help install dev test test-unit test-integration test-e2e test-performance test-security lint format clean docker-build docker-up docker-down deploy

# Default target
help:
	@echo "🚀 HaderOS - Available Commands"
	@echo ""
	@echo "📦 Installation & Setup:"
	@echo "  make install          - Install all dependencies"
	@echo "  make dev              - Setup development environment"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  make test             - Run all tests"
	@echo "  make test-unit        - Run unit tests"
	@echo "  make test-integration - Run integration tests"
	@echo "  make test-e2e         - Run end-to-end tests"
	@echo "  make test-performance - Run performance tests"
	@echo "  make test-security    - Run security tests"
	@echo ""
	@echo "🔧 Code Quality:"
	@echo "  make lint             - Run linters"
	@echo "  make format           - Format code"
	@echo "  make clean            - Clean build artifacts"
	@echo ""
	@echo "🐳 Docker:"
	@echo "  make docker-build     - Build Docker images"
	@echo "  make docker-up        - Start Docker containers"
	@echo "  make docker-down      - Stop Docker containers"
	@echo ""
	@echo "🚀 Deployment:"
	@echo "  make deploy           - Deploy to production"

# Installation
install:
	@echo "📦 Installing dependencies..."
	pip install -r requirements.txt
	npm install
	@echo "✅ Installation complete!"

dev:
	@echo "🔧 Setting up development environment..."
	pip install -r requirements.txt
	npm install
	docker-compose -f docker-compose.dev.yml up -d
	@echo "✅ Development environment ready!"

# Testing
test:
	@echo "🧪 Running all tests..."
	pytest tests/ -v --cov=backend --cov-report=html
	@echo "✅ All tests completed!"

test-unit:
	@echo "🧪 Running unit tests..."
	pytest tests/unit/ -v

test-integration:
	@echo "🧪 Running integration tests..."
	pytest tests/integration/ -v

test-e2e:
	@echo "🧪 Running end-to-end tests..."
	pytest tests/e2e/ -v

test-performance:
	@echo "🧪 Running performance tests..."
	pytest tests/performance/ -v

test-security:
	@echo "🧪 Running security tests..."
	pytest tests/security/ -v

# Code Quality
lint:
	@echo "🔍 Running linters..."
	pylint backend/
	eslint frontend/
	@echo "✅ Linting complete!"

format:
	@echo "📝 Formatting code..."
	black backend/
	prettier --write frontend/
	@echo "✅ Formatting complete!"

clean:
	@echo "🧹 Cleaning build artifacts..."
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf build/ dist/ *.egg-info
	rm -rf .pytest_cache/ .coverage htmlcov/
	@echo "✅ Cleanup complete!"

# Docker
docker-build:
	@echo "🐳 Building Docker images..."
	docker-compose -f docker-compose.dev.yml build
	@echo "✅ Build complete!"

docker-up:
	@echo "🐳 Starting Docker containers..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo "✅ Containers started!"

docker-down:
	@echo "🐳 Stopping Docker containers..."
	docker-compose -f docker-compose.dev.yml down
	@echo "✅ Containers stopped!"

# Deployment
deploy:
	@echo "🚀 Deploying to production..."
	@echo "This command requires additional configuration"
	@echo "Please refer to docs/technical/deployment-guides/"
	@echo "❌ Deployment not configured"
