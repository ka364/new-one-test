
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '2m', target: 100 },    // Ramp up
        { duration: '5m', target: 100 },    // Stable
        { duration: '2m', target: 500 },    // Ramp up
        { duration: '10m', target: 500 },   // Peak
        { duration: '2m', target: 100 },    // Ramp down
        { duration: '2m', target: 0 },      // Cool down
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'],  // 95% under 2s
        http_req_failed: ['rate<0.01'],     // Less than 1% errors
    },
};

export default function () {
    // Create order
    const orderPayload = JSON.stringify({
        customerName: 'Test User',
        customerPhone: '01012345678',
        shippingAddress: 'Cairo, Egypt',
        items: [
            { productName: 'Prod 1', quantity: 2, price: 500 },
            { productName: 'Prod 2', quantity: 1, price: 500 }
        ],
        totalAmount: 1500
    });

    const orderRes = http.post('http://localhost:3000/api/trpc/orders.createOrder', orderPayload, {
        headers: { 'Content-Type': 'application/json' },
    });

    check(orderRes, {
        'order created successfully': (r) => r.status === 200,
        'response time < 2s': (r) => r.timings.duration < 2000,
    });

    sleep(1);
}
