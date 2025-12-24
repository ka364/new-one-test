# 🎨 Frontend Integration Guide

**Connecting haderos-mvp (React/TypeScript) with Python Backend**

---

## 🎯 Overview

This guide shows how to integrate the existing **haderos-mvp** React/TypeScript frontend with the new **Python/FastAPI** backend.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         React Frontend (Port 3000)       │
│         haderos-mvp (TypeScript)         │
└──────────────┬──────────────────────────┘
               │ HTTP/REST
               │
┌──────────────▼──────────────────────────┐
│      FastAPI Backend (Port 8000)         │
│      haderos-platform (Python)           │
│                                          │
│  ┌─────────┐  ┌──────────┐  ┌────────┐ │
│  │  KAIA   │  │   Risk   │  │  Bio   │ │
│  │ Engine  │  │ Assessor │  │Modules │ │
│  └─────────┘  └──────────┘  └────────┘ │
└──────────────────────────────────────────┘
```

---

## 📦 Setup

### 1. Backend Configuration

Update `.env` in `haderos-platform/`:

```env
# CORS Configuration
CORS_ORIGINS=http://localhost:3000,https://your-frontend-domain.com

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_PREFIX=/api/v1

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 2. Frontend Configuration

Update `haderos-mvp/.env`:

```env
# Python Backend URL
VITE_API_URL=http://localhost:8000/api/v1

# Alternative for production
# VITE_API_URL=https://api.haderos.com/api/v1
```

---

## 🔌 API Client Setup

### Create API Client (`haderos-mvp/src/lib/api.ts`)

```typescript
import axios, { AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class HaderOSAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Sharia Compliance
  async validateTransaction(transaction: any) {
    const response = await this.client.post('/sharia/validate', transaction);
    return response.data;
  }

  async getFatwa(id: string) {
    const response = await this.client.get(`/sharia/fatwa/${id}`);
    return response.data;
  }

  // Risk Assessment
  async assessRisk(investment: any) {
    const response = await this.client.post('/ai/risk-assessment', investment);
    return response.data;
  }

  async getPredictions(data: any) {
    const response = await this.client.post('/ai/predict', data);
    return response.data;
  }

  // BioModules
  async listModules() {
    const response = await this.client.get('/bio-modules/list');
    return response.data;
  }

  async initModule(moduleData: any) {
    const response = await this.client.post('/bio-modules/init', moduleData);
    return response.data;
  }

  async getModuleStatus(moduleId: string) {
    const response = await this.client.get(`/bio-modules/status/${moduleId}`);
    return response.data;
  }

  // Blockchain
  async mintTokens(data: any) {
    const response = await this.client.post('/blockchain/mint', data);
    return response.data;
  }

  async transferTokens(data: any) {
    const response = await this.client.post('/blockchain/transfer', data);
    return response.data;
  }

  async getBalance(address: string) {
    const response = await this.client.get(`/blockchain/balance`, {
      params: { address },
    });
    return response.data;
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  }

  async register(userData: any) {
    const response = await this.client.post('/auth/register', userData);
    return response.data;
  }

  async logout() {
    localStorage.removeItem('auth_token');
    const response = await this.client.post('/auth/logout');
    return response.data;
  }
}

export const api = new HaderOSAPI();
export default api;
```

---

## 🎨 React Components

### 1. Sharia Compliance Checker

```typescript
// haderos-mvp/src/components/ShariaChecker.tsx

import { useState } from 'react';
import { api } from '../lib/api';

export function ShariaChecker() {
  const [transaction, setTransaction] = useState({
    transaction_type: 'murabaha',
    amount: 10000,
    business_sector: 'technology',
    interest_rate: 0,
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleValidate = async () => {
    setLoading(true);
    try {
      const data = await api.validateTransaction(transaction);
      setResult(data);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Sharia Compliance Checker</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Transaction Type</label>
          <select
            value={transaction.transaction_type}
            onChange={(e) => setTransaction({ ...transaction, transaction_type: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="murabaha">Murabaha</option>
            <option value="mudarabah">Mudarabah</option>
            <option value="loan">Loan</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Amount</label>
          <input
            type="number"
            value={transaction.amount}
            onChange={(e) => setTransaction({ ...transaction, amount: Number(e.target.value) })}
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          onClick={handleValidate}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Validating...' : 'Validate Transaction'}
        </button>
      </div>

      {result && (
        <div className={`mt-6 p-4 rounded ${result.is_compliant ? 'bg-green-50' : 'bg-red-50'}`}>
          <h3 className="font-bold text-lg mb-2">
            {result.is_compliant ? '✅ Compliant' : '❌ Non-Compliant'}
          </h3>
          <p className="mb-2">Compliance Score: {result.compliance_score}/100</p>
          
          {result.violations?.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Violations:</h4>
              <ul className="list-disc list-inside">
                {result.violations.map((v: any, i: number) => (
                  <li key={i}>{v.description}</li>
                ))}
              </ul>
            </div>
          )}

          {result.recommendations?.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Recommendations:</h4>
              <ul className="list-disc list-inside">
                {result.recommendations.map((r: string, i: number) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### 2. Risk Assessment Dashboard

```typescript
// haderos-mvp/src/components/RiskDashboard.tsx

import { useState } from 'react';
import { api } from '../lib/api';

export function RiskDashboard() {
  const [investment, setInvestment] = useState({
    amount: 50000,
    duration_months: 24,
    business_sector: 'technology',
    credit_score: 720,
    sharia_certified: true,
  });
  const [risk, setRisk] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAssess = async () => {
    setLoading(true);
    try {
      const data = await api.assessRisk(investment);
      setRisk(data);
    } catch (error) {
      console.error('Risk assessment error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    const colors: Record<string, string> = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      very_high: 'text-red-600',
    };
    return colors[level] || 'text-gray-600';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Investment Risk Assessment</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">Amount</label>
          <input
            type="number"
            value={investment.amount}
            onChange={(e) => setInvestment({ ...investment, amount: Number(e.target.value) })}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Duration (months)</label>
          <input
            type="number"
            value={investment.duration_months}
            onChange={(e) => setInvestment({ ...investment, duration_months: Number(e.target.value) })}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Credit Score</label>
          <input
            type="number"
            value={investment.credit_score}
            onChange={(e) => setInvestment({ ...investment, credit_score: Number(e.target.value) })}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Sharia Certified</label>
          <input
            type="checkbox"
            checked={investment.sharia_certified}
            onChange={(e) => setInvestment({ ...investment, sharia_certified: e.target.checked })}
            className="mt-3"
          />
        </div>
      </div>

      <button
        onClick={handleAssess}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Assessing...' : 'Assess Risk'}
      </button>

      {risk && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Risk Level:</h3>
            <span className={`text-2xl font-bold ${getRiskColor(risk.risk_level)}`}>
              {risk.risk_level.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Market Risk</div>
              <div className="text-lg font-semibold">{(risk.market_risk * 100).toFixed(0)}%</div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Credit Risk</div>
              <div className="text-lg font-semibold">{(risk.credit_risk * 100).toFixed(0)}%</div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Liquidity Risk</div>
              <div className="text-lg font-semibold">{(risk.liquidity_risk * 100).toFixed(0)}%</div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Overall Score</div>
              <div className="text-lg font-semibold">{(risk.overall_risk_score * 100).toFixed(0)}%</div>
            </div>
          </div>

          {risk.recommendations?.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded">
              <h4 className="font-semibold mb-2">Recommendations:</h4>
              <ul className="list-disc list-inside space-y-1">
                {risk.recommendations.map((r: string, i: number) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 🚀 Running Both Services

### Development Mode

```bash
# Terminal 1: Start Python Backend
cd haderos-platform
source venv/bin/activate
uvicorn backend.main:app --reload --port 8000

# Terminal 2: Start React Frontend
cd haderos-mvp
npm run dev
```

### Docker Compose (Recommended)

```yaml
# docker-compose.fullstack.yml

version: '3.8'

services:
  backend:
    build: ./haderos-platform
    ports:
      - "8000:8000"
    environment:
      - CORS_ORIGINS=http://localhost:3000
    networks:
      - haderos-net

  frontend:
    build: ./haderos-mvp
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:8000/api/v1
    depends_on:
      - backend
    networks:
      - haderos-net

networks:
  haderos-net:
    driver: bridge
```

Run with:
```bash
docker-compose -f docker-compose.fullstack.yml up
```

---

## ✅ Testing Integration

```typescript
// haderos-mvp/src/__tests__/api.test.ts

import { api } from '../lib/api';

describe('API Integration', () => {
  it('should validate compliant transaction', async () => {
    const transaction = {
      transaction_type: 'murabaha',
      amount: 10000,
      business_sector: 'technology',
      interest_rate: 0,
    };

    const result = await api.validateTransaction(transaction);
    
    expect(result.is_compliant).toBe(true);
    expect(result.compliance_score).toBeGreaterThan(80);
  });

  it('should assess investment risk', async () => {
    const investment = {
      amount: 50000,
      duration_months: 24,
      business_sector: 'technology',
      credit_score: 720,
      sharia_certified: true,
    };

    const result = await api.assessRisk(investment);
    
    expect(result.risk_level).toBeDefined();
    expect(result.overall_risk_score).toBeGreaterThanOrEqual(0);
    expect(result.overall_risk_score).toBeLessThanOrEqual(1);
  });
});
```

---

## 📝 Summary

✅ **API Client** - Centralized axios client with auth
✅ **React Components** - Ready-to-use UI components
✅ **Docker Setup** - Full-stack deployment
✅ **Testing** - Integration test examples

**Next Steps:**
1. Update haderos-mvp to use new API client
2. Replace mock data with real API calls
3. Add error handling and loading states
4. Deploy both services together

For more details, see:
- [API Reference](API_REFERENCE.md)
- [Examples](EXAMPLES.md)
- [Complete System Guide](COMPLETE_SYSTEM_GUIDE.md)
