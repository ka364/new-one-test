/**
 * HADEROS API Performance Baseline Test
 * اختبار خط الأساس لأداء API
 *
 * يقيس أداء API الرئيسية تحت حمل 100 مستخدم متزامن
 *
 * تشغيل الاختبار:
 * k6 run tests/performance/load/api-baseline.js
 *
 * تشغيل مع تقرير HTML:
 * k6 run --out json=results.json tests/performance/load/api-baseline.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// ==================== Custom Metrics ====================
const responseTimeTrend = new Trend('haderos_response_time');
const errorRate = new Rate('haderos_errors');
const requestCounter = new Counter('haderos_requests');
const slowRequestRate = new Rate('haderos_slow_requests'); // > 500ms

// ==================== Test Configuration ====================
export const options = {
  // Test stages - simulating realistic traffic patterns
  stages: [
    { duration: '30s', target: 25 },   // Warm up - ramp to 25 users
    { duration: '1m', target: 50 },    // Normal load - 50 concurrent users
    { duration: '2m', target: 100 },   // Peak load - 100 concurrent users
    { duration: '1m', target: 100 },   // Sustained peak
    { duration: '30s', target: 0 },    // Cool down
  ],

  // Performance thresholds based on industry standards
  thresholds: {
    // 95% of requests should complete in under 500ms
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],

    // Error rate should be under 1%
    'haderos_errors': ['rate<0.01'],

    // Custom metric thresholds
    'haderos_response_time': ['p(95)<500'],
    'haderos_slow_requests': ['rate<0.05'], // Less than 5% slow requests
  },

  // Tags for organizing results
  tags: {
    testName: 'HADEROS-API-Baseline',
    environment: 'staging',
  },
};

// ==================== Test Configuration ====================
const BASE_URL = __ENV.API_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token-for-performance';

const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AUTH_TOKEN}`,
};

// ==================== Helper Functions ====================
function recordMetrics(response, endpointName) {
  const duration = response.timings.duration;

  responseTimeTrend.add(duration, { endpoint: endpointName });
  requestCounter.add(1, { endpoint: endpointName });

  if (duration > 500) {
    slowRequestRate.add(1, { endpoint: endpointName });
  } else {
    slowRequestRate.add(0, { endpoint: endpointName });
  }

  if (response.status >= 400) {
    errorRate.add(1, { endpoint: endpointName });
  } else {
    errorRate.add(0, { endpoint: endpointName });
  }
}

// ==================== Test Scenarios ====================
export default function () {
  // ========== Scenario 1: Product Browsing (40% of traffic) ==========
  group('1. Product Catalog - Browse Products', () => {
    const response = http.get(`${BASE_URL}/api/trpc/products.list`, { headers: HEADERS });

    recordMetrics(response, 'products.list');

    check(response, {
      'products.list - status 200': (r) => r.status === 200,
      'products.list - has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body && (body.result || body.data);
        } catch {
          return false;
        }
      },
      'products.list - under 500ms': (r) => r.timings.duration < 500,
    });

    sleep(0.5);
  });

  // ========== Scenario 2: Product Search (20% of traffic) ==========
  group('2. Product Search', () => {
    const searchTerms = ['shoes', 'dress', 'bag', 'shirt', 'jeans'];
    const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];

    const response = http.get(
      `${BASE_URL}/api/trpc/products.search?input=${encodeURIComponent(JSON.stringify({ query: term }))}`,
      { headers: HEADERS }
    );

    recordMetrics(response, 'products.search');

    check(response, {
      'products.search - status 200': (r) => r.status === 200,
      'products.search - under 600ms': (r) => r.timings.duration < 600,
    });

    sleep(0.3);
  });

  // ========== Scenario 3: Inventory Check (15% of traffic) ==========
  group('3. Inventory Check', () => {
    const productIds = [1, 5, 10, 25, 50];
    const productId = productIds[Math.floor(Math.random() * productIds.length)];

    const response = http.get(
      `${BASE_URL}/api/trpc/inventory.checkStock?input=${encodeURIComponent(JSON.stringify({ productId }))}`,
      { headers: HEADERS }
    );

    recordMetrics(response, 'inventory.checkStock');

    check(response, {
      'inventory.check - status 200 or 404': (r) => [200, 404].includes(r.status),
      'inventory.check - under 400ms': (r) => r.timings.duration < 400,
    });

    sleep(0.2);
  });

  // ========== Scenario 4: Order Creation (10% of traffic) ==========
  group('4. Create Order (COD)', () => {
    const orderPayload = {
      items: [
        { productId: 1, quantity: Math.floor(Math.random() * 3) + 1 }
      ],
      customerInfo: {
        name: 'Test Customer',
        phone: '01012345678',
        address: 'Cairo, Egypt',
      },
      paymentMethod: 'cod',
    };

    const response = http.post(
      `${BASE_URL}/api/trpc/orders.create`,
      JSON.stringify(orderPayload),
      { headers: HEADERS }
    );

    recordMetrics(response, 'orders.create');

    check(response, {
      'orders.create - status 200 or 201': (r) => [200, 201].includes(r.status),
      'orders.create - under 800ms': (r) => r.timings.duration < 800,
    });

    sleep(1);
  });

  // ========== Scenario 5: Dashboard Stats (10% of traffic) ==========
  group('5. Dashboard Statistics', () => {
    const response = http.get(
      `${BASE_URL}/api/trpc/analytics.getDashboardStats`,
      { headers: HEADERS }
    );

    recordMetrics(response, 'analytics.getDashboardStats');

    check(response, {
      'dashboard.stats - status 200': (r) => r.status === 200,
      'dashboard.stats - under 1000ms': (r) => r.timings.duration < 1000,
    });

    sleep(0.5);
  });

  // ========== Scenario 6: Bio-Modules Status (5% of traffic) ==========
  group('6. Bio-Modules Health Check', () => {
    const response = http.get(
      `${BASE_URL}/api/trpc/bioProtocol.getStatus`,
      { headers: HEADERS }
    );

    recordMetrics(response, 'bioProtocol.getStatus');

    check(response, {
      'bioProtocol.status - status 200': (r) => r.status === 200,
      'bioProtocol.status - under 500ms': (r) => r.timings.duration < 500,
    });

    sleep(0.3);
  });

  // Think time between iterations (simulates real user behavior)
  sleep(Math.random() * 2 + 1);
}

// ==================== Setup & Teardown ====================
export function setup() {
  console.log('Starting HADEROS API Performance Test');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('Test Configuration:');
  console.log('- Peak Load: 100 concurrent users');
  console.log('- Duration: ~5 minutes');
  console.log('- Thresholds: p95 < 500ms, error rate < 1%');

  // Verify API is accessible
  const healthCheck = http.get(`${BASE_URL}/api/health`);
  if (healthCheck.status !== 200) {
    console.warn('Warning: Health check failed. API might be unavailable.');
  }

  return { startTime: new Date().toISOString() };
}

export function teardown(data) {
  console.log('Test completed');
  console.log(`Started at: ${data.startTime}`);
  console.log(`Ended at: ${new Date().toISOString()}`);
}

// ==================== Summary Handler ====================
export function handleSummary(data) {
  const summary = {
    testName: 'HADEROS API Baseline',
    timestamp: new Date().toISOString(),
    metrics: {
      totalRequests: data.metrics.http_reqs?.values?.count || 0,
      avgResponseTime: data.metrics.http_req_duration?.values?.avg?.toFixed(2) || 0,
      p95ResponseTime: data.metrics.http_req_duration?.values?.['p(95)']?.toFixed(2) || 0,
      p99ResponseTime: data.metrics.http_req_duration?.values?.['p(99)']?.toFixed(2) || 0,
      errorRate: ((data.metrics.haderos_errors?.values?.rate || 0) * 100).toFixed(2) + '%',
      slowRequestRate: ((data.metrics.haderos_slow_requests?.values?.rate || 0) * 100).toFixed(2) + '%',
    },
    thresholds: {
      passed: Object.entries(data.metrics)
        .filter(([key, val]) => val.thresholds)
        .every(([key, val]) => Object.values(val.thresholds).every(t => t.ok)),
    },
  };

  console.log('\n========== HADEROS Performance Summary ==========');
  console.log(`Total Requests: ${summary.metrics.totalRequests}`);
  console.log(`Avg Response Time: ${summary.metrics.avgResponseTime}ms`);
  console.log(`P95 Response Time: ${summary.metrics.p95ResponseTime}ms`);
  console.log(`P99 Response Time: ${summary.metrics.p99ResponseTime}ms`);
  console.log(`Error Rate: ${summary.metrics.errorRate}`);
  console.log(`Slow Request Rate: ${summary.metrics.slowRequestRate}`);
  console.log(`Thresholds Passed: ${summary.thresholds.passed ? 'YES' : 'NO'}`);
  console.log('=================================================\n');

  return {
    'stdout': JSON.stringify(summary, null, 2),
    'summary.json': JSON.stringify(summary, null, 2),
  };
}
